import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthController } from '../../controllers/authController.jsx'

function SystemLayout() {
  const { logout } = useAuthController()
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
      <header className="topbar">
        <div className="brand-block brand-block-with-logo">
          <img className="brand-logo" src="/LOGOFERMONT3-FAVICON.png" alt="" />
          <p className="brand-kicker">FERMONT</p>
        </div>
      </header>

      <section className="app-body">
        <div className="app-body-inner">
          <Outlet />
        </div>
      </section>

      {!isValuationFlow ? (
        <footer className="app-footer">
          <button type="button" className="main-button secondary footer-logout" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </footer>
      ) : null}
    </main>
  )
}

export default SystemLayout
