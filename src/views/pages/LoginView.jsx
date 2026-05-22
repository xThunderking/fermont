import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuthController } from '../../controllers/authController.jsx'

function LoginView() {
  const { isAuthenticated, login } = useAuthController()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()

    const result = login(username.trim(), password)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setError('')
    setUsername('')
    setPassword('')
    navigate('/app', { replace: true })
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  return (
    <main className="app-page login-page">
      <section className="login-panel">
        <h1>Login</h1>
        <p className="subtitle">Ingresa para abrir el panel principal.</p>
        <form className="simple-form" onSubmit={handleSubmit}>
          <label>
            Usuario
            <input
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>

          <label>
            Contrasena
            <input
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error ? <p className="error-text">{error}</p> : null}

          <button type="submit" className="main-button">
            Ingresar
          </button>
        </form>
      </section>
    </main>
  )
}

export default LoginView
