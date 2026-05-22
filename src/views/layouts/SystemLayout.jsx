import { Outlet, useNavigate } from 'react-router-dom'
import { useAuthController } from '../../controllers/authController.jsx'

function SystemLayout() {
  const { currentUser, logout } = useAuthController()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="app-page app-layout-fixed">
      <header className="topbar">
        <p className="brand-kicker">FERMONT</p>
        <p className="brand-title">Sistema de cosmetologia</p>
        <p className="topbar-user">{currentUser?.username}</p>
      </header>

      <section className="app-body">
        <div className="app-body-inner">
          <Outlet />
        </div>
      </section>

      <footer className="app-footer">
        <button type="button" className="main-button secondary footer-logout" onClick={handleLogout}>
          Cerrar sesion
        </button>
      </footer>
    </main>
  )
}

export default SystemLayout
