import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuthController } from '../../controllers/authController.jsx'

function LoginView() {
  const { isAuthenticated, authError, loginWithGoogle } = useAuthController()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)

  const isBusy = isGoogleSubmitting
  const visibleError = error || authError

  const handleGoogleLogin = async () => {
    setError('')
    setIsGoogleSubmitting(true)

    const result = await loginWithGoogle()

    if (!result.ok) {
      setError(result.message)
      setIsGoogleSubmitting(false)
      return
    }

    if (result.redirecting) {
      return
    }

    setIsGoogleSubmitting(false)
    navigate('/app', { replace: true })
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  return (
    <main className="app-page login-page">
      <section className="login-panel">
        <h1>Login</h1>
        <p className="subtitle">Accede solo con tu cuenta de Google para abrir el panel principal.</p>

        {visibleError ? <p className="error-text">{visibleError}</p> : null}

        <button
          type="button"
          className="google-button"
          onClick={handleGoogleLogin}
          disabled={isBusy}
        >
          <svg className="google-logo" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.89c2.28-2.1 3.54-5.2 3.54-8.65Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.89-3A7.2 7.2 0 0 1 12 19.2a7.2 7.2 0 0 1-6.76-4.97H1.21v3.1A12 12 0 0 0 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.24 14.23A7.22 7.22 0 0 1 4.84 12c0-.77.14-1.5.4-2.23v-3.1H1.21A12 12 0 0 0 0 12c0 1.94.46 3.77 1.21 5.33l4.03-3.1Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.8c1.77 0 3.36.61 4.62 1.82l3.47-3.47C17.95 1.11 15.24 0 12 0A12 12 0 0 0 1.21 6.67l4.03 3.1A7.2 7.2 0 0 1 12 4.8Z"
            />
          </svg>
          <span>{isGoogleSubmitting ? 'Conectando con Google...' : 'Iniciar con Google'}</span>
        </button>
      </section>
    </main>
  )
}

export default LoginView
