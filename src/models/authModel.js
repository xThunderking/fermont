import { deleteApp, initializeApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  deleteUser,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  getAuth,
  getRedirectResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { isEmailAllowed } from '../services/authAllowlist'
import { auth, db, firebaseConfig } from '../services/firebase'

const USERS_COLLECTION = 'users'
const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })
const GOOGLE_REDIRECT_PENDING_KEY = 'fermont_google_redirect_pending'

const normalizeRole = (role) => (role === 'admin' ? 'admin' : 'user')

const normalizeUsername = (username, email) => {
  const cleanUsername = String(username ?? '').trim()

  if (cleanUsername) {
    return cleanUsername
  }

  const cleanEmail = String(email ?? '').trim()
  const [emailPrefix] = cleanEmail.split('@')
  return emailPrefix || 'usuario'
}

const mapAuthErrorToMessage = (code) => {
  switch (code) {
    case 'auth/invalid-email':
      return 'El correo no es valido.'
    case 'auth/invalid-credential':
      return 'Credenciales invalidas.'
    case 'auth/user-disabled':
      return 'Esta cuenta esta deshabilitada.'
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Intenta de nuevo en unos minutos.'
    case 'auth/email-already-in-use':
      return 'Ese correo ya existe.'
    case 'auth/weak-password':
      return 'La contrasena debe tener al menos 6 caracteres.'
    case 'auth/popup-closed-by-user':
      return 'Cerraste la ventana de Google antes de completar el acceso.'
    case 'auth/popup-blocked':
      return 'El navegador bloqueo la ventana emergente de Google.'
    case 'auth/cancelled-popup-request':
      return 'Se cancelo la solicitud de acceso con Google.'
    case 'auth/account-exists-with-different-credential':
      return 'Ese correo ya esta registrado con otro metodo de acceso.'
    case 'auth/operation-not-allowed':
      return 'El metodo de acceso no esta habilitado en Firebase Authentication.'
    case 'auth/unauthorized-domain':
      return 'Este dominio no esta autorizado para Google Login en Firebase.'
    case 'auth/network-request-failed':
      return 'Error de red al conectar con Firebase. Revisa tu conexion.'
    case 'auth/web-storage-unsupported':
      return 'Tu navegador bloqueo el almacenamiento necesario para iniciar sesion.'
    case 'permission-denied':
      return 'No tienes permisos para crear o leer tu perfil en Firestore.'
    case 'auth/email-not-allowed':
      return 'Tu correo no esta autorizado para ingresar a este sistema.'
    case 'profile/not-found':
      return 'Tu cuenta autenticada no tiene perfil en el sistema. Contacta a un admin.'
    case 'profile/disabled':
      return 'Tu usuario esta desactivado en el sistema.'
    default:
      return 'No fue posible completar la operacion. Intenta de nuevo.'
  }
}

const isBrowser = () => typeof window !== 'undefined'

const setGoogleRedirectPending = () => {
  if (!isBrowser()) {
    return
  }

  window.sessionStorage.setItem(GOOGLE_REDIRECT_PENDING_KEY, '1')
}

const readGoogleRedirectPending = () => {
  if (!isBrowser()) {
    return false
  }

  return window.sessionStorage.getItem(GOOGLE_REDIRECT_PENDING_KEY) === '1'
}

const clearGoogleRedirectPending = () => {
  if (!isBrowser()) {
    return
  }

  window.sessionStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY)
}

const toSafeUser = (uid, profileData) => ({
  id: uid,
  username: normalizeUsername(profileData?.username, profileData?.email),
  email: String(profileData?.email ?? '').trim(),
  role: normalizeRole(profileData?.role),
  status: profileData?.status === 'disabled' ? 'disabled' : 'active',
})

const getUserProfileRef = (uid) => doc(db, USERS_COLLECTION, uid)
const normalizeEmail = (email) => String(email ?? '').trim().toLowerCase()

const isGoogleProviderUser = (firebaseUser) =>
  Array.isArray(firebaseUser?.providerData)
    && firebaseUser.providerData.some((provider) => provider?.providerId === 'google.com')

const findUserProfile = async (uid) => {
  const snapshot = await getDoc(getUserProfileRef(uid))

  if (!snapshot.exists()) {
    return null
  }

  return toSafeUser(snapshot.id, snapshot.data())
}

const resolveCurrentUser = async (firebaseUser, options = {}) => {
  const { allowProfileBootstrap = false } = options

  if (!firebaseUser) {
    return null
  }

  const cleanEmail = normalizeEmail(firebaseUser.email)

  if (!cleanEmail || !isEmailAllowed(cleanEmail)) {
    await signOut(auth)
    const error = new Error('Correo fuera de lista permitida.')
    error.code = 'auth/email-not-allowed'
    throw error
  }

  let profile = await findUserProfile(firebaseUser.uid)

  if (!profile && allowProfileBootstrap) {
    const cleanEmail = normalizeEmail(firebaseUser.email)

    if (!cleanEmail) {
      await signOut(auth)
      return null
    }

    await setDoc(
      getUserProfileRef(firebaseUser.uid),
      buildUserPayload({
        uid: firebaseUser.uid,
        username: firebaseUser.displayName,
        email: cleanEmail,
        role: 'user',
        status: 'active',
        createdBy: firebaseUser.uid,
      }),
    )

    profile = await findUserProfile(firebaseUser.uid)
  }

  if (!profile) {
    await signOut(auth)
    const error = new Error('Perfil no encontrado para la cuenta autenticada.')
    error.code = 'profile/not-found'
    throw error
  }

  if (profile.status !== 'active') {
    await signOut(auth)
    const error = new Error('Perfil desactivado para la cuenta autenticada.')
    error.code = 'profile/disabled'
    throw error
  }

  return profile
}

const buildUserPayload = ({ uid, username, email, role, status, createdBy }) => ({
  uid,
  username: normalizeUsername(username, email),
  usernameLower: normalizeUsername(username, email).toLowerCase(),
  email,
  emailLower: String(email).trim().toLowerCase(),
  role: normalizeRole(role),
  status: status === 'disabled' ? 'disabled' : 'active',
  createdBy: createdBy || null,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
})

const createIsolatedAdminAuth = () => {
  const appName = `fermont-admin-${Date.now()}-${Math.floor(Math.random() * 100000)}`
  const isolatedApp = initializeApp(firebaseConfig, appName)

  return {
    isolatedApp,
    isolatedAuth: getAuth(isolatedApp),
  }
}

export const observeAuthSession = (callback) =>
  onAuthStateChanged(auth, async (firebaseUser) => {
    try {
      const currentUser = await resolveCurrentUser(firebaseUser, {
        allowProfileBootstrap: isGoogleProviderUser(firebaseUser),
      })
      callback({ user: currentUser, error: '' })
    } catch (error) {
      callback({ user: null, error: mapAuthErrorToMessage(error?.code) })
    }
  })

export const resolveGoogleRedirectLogin = async () => {
  const wasPending = readGoogleRedirectPending()

  try {
    const redirectResult = await getRedirectResult(auth)

    if (!redirectResult) {
      if (wasPending) {
        return {
          ok: false,
          message:
            'No se completo el acceso con Google. Intenta de nuevo y verifica que el navegador no bloquee cookies o almacenamiento.',
        }
      }

      return { ok: true }
    }

    const user = await resolveCurrentUser(redirectResult.user, { allowProfileBootstrap: true })

    return { ok: true, user }
  } catch (error) {
    return { ok: false, message: mapAuthErrorToMessage(error?.code) }
  } finally {
    clearGoogleRedirectPending()
  }
}

export const loginWithCredentials = async (email, password) => {
  const cleanEmail = String(email ?? '').trim().toLowerCase()
  const cleanPassword = String(password ?? '')

  if (!cleanEmail || !cleanPassword) {
    return { ok: false, message: 'Correo y contrasena son obligatorios.' }
  }

  try {
    const credential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword)
    const user = await resolveCurrentUser(credential.user)

    return { ok: true, user }
  } catch (error) {
    if (error?.code === 'auth/operation-not-allowed') {
      return {
        ok: false,
        message: 'El acceso por correo y contrasena no esta habilitado en Firebase Authentication.',
      }
    }

    if (error?.code === 'auth/invalid-credential') {
      try {
        const signInMethods = await fetchSignInMethodsForEmail(auth, cleanEmail)

        if (signInMethods.includes('google.com') && !signInMethods.includes('password')) {
          return {
            ok: false,
            message: 'Ese correo esta registrado con Google. Usa el boton Iniciar con Google.',
          }
        }
      } catch {
        // Si no se puede resolver metodos de acceso, mantenemos el mensaje base.
      }

      return {
        ok: false,
        message:
          'Credenciales invalidas. Si tu cuenta fue creada con Google, usa Iniciar con Google.',
      }
    }

    return { ok: false, message: mapAuthErrorToMessage(error?.code) }
  }
}

export const loginWithGoogle = async () => {
  try {
    const popupCredential = await signInWithPopup(auth, googleProvider)
    const user = await resolveCurrentUser(popupCredential.user, { allowProfileBootstrap: true })

    return { ok: true, user }
  } catch (error) {
    if (error?.code === 'auth/popup-blocked') {
      try {
        setGoogleRedirectPending()
        await signInWithRedirect(auth, googleProvider)
        return { ok: true, redirecting: true }
      } catch (redirectError) {
        clearGoogleRedirectPending()
        return { ok: false, message: mapAuthErrorToMessage(redirectError?.code) }
      }
    }

    if (error?.code === 'auth/operation-not-allowed') {
      return {
        ok: false,
        message: 'El acceso con Google no esta habilitado en Firebase Authentication.',
      }
    }

    return { ok: false, message: mapAuthErrorToMessage(error?.code) }
  }
}

export const logoutSession = async () => {
  await signOut(auth)
}

export const listUsers = async () => {
  const usersQuery = query(collection(db, USERS_COLLECTION), where('status', '==', 'active'))
  const snapshots = await getDocs(usersQuery)

  return snapshots.docs
    .map((snapshot) => toSafeUser(snapshot.id, snapshot.data()))
    .sort((left, right) => left.username.localeCompare(right.username, 'es'))
}

export const createUserAccount = async ({ username, email, password, role }) => {
  const cleanEmail = String(email ?? '').trim().toLowerCase()
  const cleanPassword = String(password ?? '')
  const normalizedRole = normalizeRole(role)

  if (!cleanEmail || !cleanPassword) {
    return { ok: false, message: 'Correo y contrasena son obligatorios.' }
  }

  if (!isEmailAllowed(cleanEmail)) {
    return {
      ok: false,
      message: 'Ese correo no esta en la lista permitida para este sistema.',
    }
  }

  let isolatedApp = null
  let isolatedAuth = null
  let createdCredential = null

  try {
    const isolated = createIsolatedAdminAuth()
    isolatedApp = isolated.isolatedApp
    isolatedAuth = isolated.isolatedAuth
    createdCredential = await createUserWithEmailAndPassword(isolatedAuth, cleanEmail, cleanPassword)

    await setDoc(
      getUserProfileRef(createdCredential.user.uid),
      buildUserPayload({
        uid: createdCredential.user.uid,
        username,
        email: cleanEmail,
        role: normalizedRole,
        status: 'active',
        createdBy: auth.currentUser?.uid,
      }),
    )

    await signOut(isolatedAuth)

    return {
      ok: true,
      message: 'Usuario creado correctamente.',
    }
  } catch (error) {
    if (createdCredential?.user) {
      try {
        await deleteUser(createdCredential.user)
      } catch {
        // Si falla el rollback de Auth, la cuenta debe revisarse manualmente desde Firebase Console.
      }
    }

    return {
      ok: false,
      message: mapAuthErrorToMessage(error?.code),
    }
  } finally {
    if (isolatedAuth) {
      try {
        await signOut(isolatedAuth)
      } catch {
        // No afecta el flujo principal.
      }
    }

    if (isolatedApp) {
      try {
        await deleteApp(isolatedApp)
      } catch {
        // No afecta el flujo principal.
      }
    }
  }
}

export const updateUserRole = async ({ userId, role }) => {
  const targetRole = normalizeRole(role)

  try {
    const targetProfile = await findUserProfile(userId)

    if (!targetProfile || targetProfile.status !== 'active') {
      return { ok: false, message: 'No se encontro el usuario.' }
    }

    await updateDoc(getUserProfileRef(userId), {
      role: targetRole,
      updatedAt: serverTimestamp(),
    })

    return {
      ok: true,
      message: 'Rol actualizado.',
    }
  } catch {
    return {
      ok: false,
      message: 'No fue posible actualizar el rol.',
    }
  }
}

export const deleteUserAccount = async (userId) => {
  try {
    const targetProfile = await findUserProfile(userId)

    if (!targetProfile || targetProfile.status !== 'active') {
      return { ok: false, message: 'No se encontro el usuario.' }
    }

    await updateDoc(getUserProfileRef(userId), {
      status: 'disabled',
      updatedAt: serverTimestamp(),
    })

    return {
      ok: true,
      message: 'Usuario desactivado. Ya no podra ingresar al sistema.',
    }
  } catch {
    return {
      ok: false,
      message: 'No fue posible desactivar el usuario.',
    }
  }
}
