import { createContext, useContext, useState } from 'react'
import {
  clearSession,
  createUserAccount,
  deleteUserAccount,
  listUsers,
  persistSession,
  readStoredSession,
  updateUserRole,
  validateCredentials,
} from '../models/authModel'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState(listUsers)

  const [currentUser, setCurrentUser] = useState(() => {
    const storedSession = readStoredSession()

    if (!storedSession) {
      return null
    }

    const matchedUser = listUsers().find((user) => user.id === storedSession.id)

    if (!matchedUser) {
      clearSession()
      return null
    }

    return matchedUser
  })

  const login = (username, password) => {
    const user = validateCredentials(username, password)

    if (!user) {
      return { ok: false, message: 'Credenciales invalidas.' }
    }

    persistSession(user)
    setCurrentUser(user)
    setUsers(listUsers())
    return { ok: true, user }
  }

  const logout = () => {
    clearSession()
    setCurrentUser(null)
  }

  const createUser = ({ username, password, role }) => {
    if (currentUser?.role !== 'admin') {
      return { ok: false, message: 'Solo un admin puede crear usuarios.' }
    }

    const result = createUserAccount({ username, password, role })

    if (result.ok) {
      setUsers(result.users)
    }

    return result
  }

  const changeRole = ({ userId, role }) => {
    if (currentUser?.role !== 'admin') {
      return { ok: false, message: 'Solo un admin puede cambiar roles.' }
    }

    const result = updateUserRole({ userId, role })

    if (result.ok) {
      setUsers(result.users)

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

  const deleteUser = (userId) => {
    if (currentUser?.role !== 'admin') {
      return { ok: false, message: 'Solo un admin puede eliminar usuarios.' }
    }

    if (currentUser?.id === userId) {
      return { ok: false, message: 'No puedes eliminar tu propio usuario activo.' }
    }

    const result = deleteUserAccount(userId)

    if (result.ok) {
      setUsers(result.users)
    }

    return result
  }

  const value = {
    currentUser,
    isAuthenticated: Boolean(currentUser),
    isAdmin: currentUser?.role === 'admin',
    users,
    login,
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
