import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthController } from '../../controllers/authController.jsx'

function ProtectedRoute() {
  const { authResolved, isAuthenticated } = useAuthController()
  const location = useLocation()

  if (!authResolved) {
    return (
      <main className="app-page login-page">
        <section className="login-panel">
          <h1>Validando sesión</h1>
          <p className="subtitle">Espera un momento...</p>
        </section>
      </main>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
