import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthController } from '../../controllers/authController.jsx'

function SystemLayout() {
  const { currentUser, logout } = useAuthController()
  const location = useLocation()
  const navigate = useNavigate()

  const isValuationFlow =
    location.pathname === '/app/nueva-valoracion'
    || location.pathname.startsWith('/app/nueva-valoracion/')

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className={`app-page app-layout-fixed ${isValuationFlow ? 'app-layout-immersive' : ''}`}>
      {!isValuationFlow ? (
        <header className="topbar">
          <p className="brand-kicker">FERMONT</p>
          <p className="brand-title">Sistema de cosmetologia</p>
          <p className="topbar-user">{currentUser?.username}</p>
        </header>
      ) : null}

      <section className="app-body">
        <div className="app-body-inner">
          <Outlet />
        </div>
      </section>

      {!isValuationFlow ? (
        <footer className="app-footer">
          <button type="button" className="main-button secondary footer-logout" onClick={handleLogout}>
            Cerrar sesion
          </button>
        </footer>
      ) : null}
    </main>
  )
}

export default SystemLayout
