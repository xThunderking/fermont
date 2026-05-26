import { useContext, useEffect, useState } from 'react'
import {
  createUserAccount,
  deleteUserAccount,
  listUsers,
  loginWithGoogle,
  logoutSession,
  observeAuthSession,
  resolveGoogleRedirectLogin,
  updateUserRole,
} from '../models/authModel'
import { AuthContext } from './authContext'

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [authResolved, setAuthResolved] = useState(false)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    let isMounted = true
    let unsubscribe = () => {}

    const setupAuth = async () => {
      const redirectResult = await resolveGoogleRedirectLogin()

      if (!isMounted) {
        return
      }

      if (!redirectResult.ok) {
        setAuthError(redirectResult.message)
      }

      unsubscribe = observeAuthSession(async ({ user, error }) => {
        if (!isMounted) {
          return
        }

        if (error) {
          setAuthError(error)
        } else if (user) {
          setAuthError('')
        }

        setCurrentUser(user)
        setAuthResolved(true)

        if (user?.role === 'admin') {
          try {
            const nextUsers = await listUsers()
            if (isMounted) {
              setUsers(nextUsers)
            }
          } catch {
            if (isMounted) {
              setUsers([])
            }
          }

          return
        }

        setUsers([])
      })
    }

    setupAuth()

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  const refreshUsers = async () => {
    const nextUsers = await listUsers()
    setUsers(nextUsers)
    return nextUsers
  }

  const loginGoogle = async () => {
    setAuthError('')
    const result = await loginWithGoogle()

    if (!result.ok) {
      return result
    }

    if (result.redirecting) {
      return result
    }

    setCurrentUser(result.user)
    setAuthResolved(true)

    if (result.user.role === 'admin') {
      await refreshUsers()
    } else {
      setUsers([])
    }

    return result
  }

  const logout = async () => {
    await logoutSession()
    setCurrentUser(null)
    setUsers([])
  }

  const createUser = async ({ username, email, password, role }) => {
    if (currentUser?.role !== 'admin') {
      return { ok: false, message: 'Solo un admin puede crear usuarios.' }
    }

    const result = await createUserAccount({ username, email, password, role })

    if (result.ok) {
      await refreshUsers()
    }

    return result
  }

  const changeRole = async ({ userId, role }) => {
    if (currentUser?.role !== 'admin') {
      return { ok: false, message: 'Solo un admin puede cambiar roles.' }
    }

    if (currentUser?.id === userId && role !== 'admin') {
      return { ok: false, message: 'No puedes quitarte el rol admin desde tu sesion activa.' }
    }

    const result = await updateUserRole({ userId, role })

    if (result.ok) {
      await refreshUsers()

      if (currentUser?.id === userId) {
        setCurrentUser((previous) =>
          previous
            ? {
                ...previous,
                role,
              }
            : previous,
        )
      }
    }

    return result
  }

  const deleteUser = async (userId) => {
    if (currentUser?.role !== 'admin') {
      return { ok: false, message: 'Solo un admin puede eliminar usuarios.' }
    }

    if (currentUser?.id === userId) {
      return { ok: false, message: 'No puedes eliminar tu propio usuario activo.' }
    }

    const result = await deleteUserAccount(userId)

    if (result.ok) {
      await refreshUsers()
    }

    return result
  }

  const value = {
    currentUser,
    authResolved,
    authError,
    isAuthenticated: Boolean(currentUser),
    isAdmin: currentUser?.role === 'admin',
    users,
    loginWithGoogle: loginGoogle,
    logout,
    createUser,
    changeRole,
    deleteUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthController = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuthController debe usarse dentro de AuthProvider.')
  }

  return context
}
