import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthController } from '../../controllers/authController.jsx'

function UsersView() {
  const { currentUser, isAdmin, users, createUser, changeRole, deleteUser } = useAuthController()
  const navigate = useNavigate()

  const [managerError, setManagerError] = useState('')
  const [managerMessage, setManagerMessage] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('user')
  const [isWorking, setIsWorking] = useState(false)

  const handleCreateUser = async (event) => {
    event.preventDefault()
    setIsWorking(true)

    const result = await createUser({
      username: newUsername.trim(),
      email: newEmail.trim(),
      password: newPassword,
      role: newRole,
    })

    if (!result.ok) {
      setManagerError(result.message)
      setManagerMessage('')
      setIsWorking(false)
      return
    }

    setManagerError('')
    setManagerMessage(result.message)
    setNewUsername('')
    setNewEmail('')
    setNewPassword('')
    setNewRole('user')
    setIsWorking(false)
  }

  const handleRoleChange = async (userId, role) => {
    setIsWorking(true)
    const result = await changeRole({ userId, role })

    if (!result.ok) {
      setManagerError(result.message)
      setManagerMessage('')
      setIsWorking(false)
      return
    }

    setManagerError('')
    setManagerMessage(result.message)
    setIsWorking(false)
  }

  const handleDeleteUser = async (userId) => {
    setIsWorking(true)
    const result = await deleteUser(userId)

    if (!result.ok) {
      setManagerError(result.message)
      setManagerMessage('')
      setIsWorking(false)
      return
    }

    setManagerError('')
    setManagerMessage(result.message)
    setIsWorking(false)
  }

  return (
    <section className="module-screen">
      <div className="module-screen-head">
        <button type="button" className="main-button secondary" onClick={() => navigate('/app')}>
          Regresar al menu principal
        </button>

        <div>
          <h1>Usuarios</h1>
          <p className="subtitle">Gestion de accesos y roles dentro del sistema.</p>
        </div>
      </div>

      {isAdmin ? (
        <section className="admin-box">
          <form className="simple-form user-form" onSubmit={handleCreateUser}>
            <label>
              Nombre de usuario
              <input
                required
                value={newUsername}
                onChange={(event) => setNewUsername(event.target.value)}
              />
            </label>

            <label>
              Correo
              <input
                required
                type="email"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
              />
            </label>

            <label>
              Contrasena
              <input
                required
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </label>

            <label>
              Rol
              <select value={newRole} onChange={(event) => setNewRole(event.target.value)}>
                <option value="user">usuario</option>
                <option value="admin">admin</option>
              </select>
            </label>

            <button type="submit" className="main-button">
              {isWorking ? 'Procesando...' : 'Crear usuario'}
            </button>
          </form>

          {managerError ? <p className="error-text">{managerError}</p> : null}
          {managerMessage ? <p className="success-text">{managerMessage}</p> : null}

          <ul className="users-list">
            {users.map((user) => {
              const isCurrentAdmin = user.id === currentUser?.id
              const isProtectedUser = isCurrentAdmin

              return (
                <li className="user-row" key={user.id}>
                  <div>
                    <strong>{user.username}</strong>
                    <small className="small-tag">{user.email}</small>
                  </div>

                  <div className="row-actions">
                    <select
                      value={user.role}
                      disabled={isProtectedUser || isWorking}
                      onChange={(event) => handleRoleChange(user.id, event.target.value)}
                    >
                      <option value="user">usuario</option>
                      <option value="admin">admin</option>
                    </select>
                    <button
                      type="button"
                      className="main-button danger"
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={isProtectedUser || isWorking}
                    >
                      Desactivar
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ) : (
        <p className="subtitle">Tu rol es usuario. Solo un admin puede gestionar usuarios.</p>
      )}
    </section>
  )
}

export default UsersView
