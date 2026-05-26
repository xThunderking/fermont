import { Navigate, useLocation } from 'react-router-dom'
import { useAuthController } from '../../controllers/authController.jsx'

function AdminRoute({ children }) {
  const { authResolved, isAuthenticated, isAdmin } = useAuthController()
  const location = useLocation()

  if (!authResolved) {
    return (
      <main className="app-page login-page">
        <section className="login-panel">
          <h1>Validando sesion</h1>
          <p className="subtitle">Espera un momento...</p>
        </section>
      </main>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!isAdmin) {
    return <Navigate to="/app" replace />
  }

  return children
}

export default AdminRoute
