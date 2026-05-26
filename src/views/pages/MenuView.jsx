import { useNavigate } from 'react-router-dom'
import { useAuthController } from '../../controllers/authController.jsx'

function MenuView() {
  const navigate = useNavigate()
  const { isAdmin } = useAuthController()

  return (
    <section className="module-menu">
      <div className="module-grid">
        <button
          type="button"
          className="module-card users-module-card"
          onClick={() => navigate('/app/nueva-valoracion')}
        >
          <h2>Nueva Valoracion</h2>
        </button>

        <button
          type="button"
          className="module-card users-module-card"
          onClick={() => navigate('/app/valoraciones-pendientes')}
        >
          <h2>Valoraciones Pendientes</h2>
        </button>

        <button
          type="button"
          className="module-card users-module-card"
          onClick={() => navigate('/app/clientes')}
        >
          <h2>Clientes</h2>
        </button>

        {isAdmin ? (
          <button
            type="button"
            className="module-card users-module-card"
            onClick={() => navigate('/app/usuarios')}
          >
            <h2>Usuarios</h2>
          </button>
        ) : null}
      </div>
    </section>
  )
}

export default MenuView
