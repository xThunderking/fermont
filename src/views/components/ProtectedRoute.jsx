import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthController } from '../../controllers/authController.jsx'

function ProtectedRoute() {
  const { isAuthenticated } = useAuthController()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
