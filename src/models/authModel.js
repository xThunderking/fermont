const ROOT_ADMIN_USER = {
  id: 'admin-root',
  username: 'admin',
  password: '@dm1n',
  role: 'admin',
}

const USERS_STORAGE_KEY = 'fermont_users'
const SESSION_STORAGE_KEY = 'fermont_auth_session'

const isBrowser = () => typeof window !== 'undefined'

const toSafeUser = (user) => ({
  id: user.id,
  username: user.username,
  role: user.role,
})

const createUserId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `user-${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

const normalizeUsers = (rawUsers) => {
  const users = Array.isArray(rawUsers) ? rawUsers : []
  const mapByUsername = new Map()

  users.forEach((user) => {
    const username = String(user?.username ?? '').trim()
    const password = String(user?.password ?? '')

    if (!username || !password) {
      return
    }

    const normalized = {
      id: String(user?.id ?? createUserId()),
      username,
      password,
      role: user?.role === 'admin' ? 'admin' : 'user',
    }

    mapByUsername.set(username.toLowerCase(), normalized)
  })

  const rootAdminFromStorage = mapByUsername.get(ROOT_ADMIN_USER.username)

  mapByUsername.set(ROOT_ADMIN_USER.username, {
    ...ROOT_ADMIN_USER,
    password: rootAdminFromStorage?.password || ROOT_ADMIN_USER.password,
  })

  return Array.from(mapByUsername.values())
}

const readUsersRaw = () => {
  if (!isBrowser()) {
    return [ROOT_ADMIN_USER]
  }

  const raw = window.localStorage.getItem(USERS_STORAGE_KEY)

  if (!raw) {
    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([ROOT_ADMIN_USER]))
    return [ROOT_ADMIN_USER]
  }

  try {
    const parsed = JSON.parse(raw)
    const normalized = normalizeUsers(parsed)
    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(normalized))
    return normalized
  } catch {
    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([ROOT_ADMIN_USER]))
    return [ROOT_ADMIN_USER]
  }
}

const persistUsersRaw = (users) => {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(normalizeUsers(users)))
}

export const listUsers = () => readUsersRaw().map(toSafeUser)

export const validateCredentials = (username, password) => {
  const user = readUsersRaw().find(
    (candidate) => candidate.username === username && candidate.password === password,
  )

  return user ? toSafeUser(user) : null
}

export const createUserAccount = ({ username, password, role }) => {
  const cleanUsername = String(username ?? '').trim()
  const cleanPassword = String(password ?? '')
  const cleanRole = role === 'admin' ? 'admin' : 'user'

  if (!cleanUsername || !cleanPassword) {
    return { ok: false, message: 'Usuario y contrasena son obligatorios.' }
  }

  const users = readUsersRaw()
  const usernameExists = users.some(
    (candidate) => candidate.username.toLowerCase() === cleanUsername.toLowerCase(),
  )

  if (usernameExists) {
    return { ok: false, message: 'Ese usuario ya existe.' }
  }

  const updatedUsers = [
    ...users,
    {
      id: createUserId(),
      username: cleanUsername,
      password: cleanPassword,
      role: cleanRole,
    },
  ]

  persistUsersRaw(updatedUsers)

  return {
    ok: true,
    message: 'Usuario creado correctamente.',
    users: updatedUsers.map(toSafeUser),
  }
}

export const updateUserRole = ({ userId, role }) => {
  const nextRole = role === 'admin' ? 'admin' : 'user'
  const users = readUsersRaw()
  const targetIndex = users.findIndex((candidate) => candidate.id === userId)

  if (targetIndex < 0) {
    return { ok: false, message: 'No se encontro el usuario.' }
  }

  if (users[targetIndex].username.toLowerCase() === ROOT_ADMIN_USER.username) {
    return { ok: false, message: 'No se puede cambiar el rol del admin principal.' }
  }

  const updatedUsers = users.map((candidate, index) =>
    index === targetIndex
      ? {
          ...candidate,
          role: nextRole,
        }
      : candidate,
  )

  persistUsersRaw(updatedUsers)

  return {
    ok: true,
    message: 'Rol actualizado.',
    users: updatedUsers.map(toSafeUser),
  }
}

export const deleteUserAccount = (userId) => {
  const users = readUsersRaw()
  const target = users.find((candidate) => candidate.id === userId)

  if (!target) {
    return { ok: false, message: 'No se encontro el usuario.' }
  }

  if (target.username.toLowerCase() === ROOT_ADMIN_USER.username) {
    return { ok: false, message: 'No se puede eliminar el admin principal.' }
  }

  const updatedUsers = users.filter((candidate) => candidate.id !== userId)
  persistUsersRaw(updatedUsers)

  return {
    ok: true,
    message: 'Usuario eliminado.',
    users: updatedUsers.map(toSafeUser),
  }
}

export const readStoredSession = () => {
  if (!isBrowser()) {
    return null
  }

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw)

    if (!parsed?.id || !parsed?.username || !parsed?.role) {
      return null
    }

    return {
      id: parsed.id,
      username: parsed.username,
      role: parsed.role === 'admin' ? 'admin' : 'user',
    }
  } catch {
    return null
  }
}

export const persistSession = (user) => {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      id: user.id,
      username: user.username,
      role: user.role,
    }),
  )
}

export const clearSession = () => {
  if (!isBrowser()) {
    return
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY)
}
