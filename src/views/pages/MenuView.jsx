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
          className="module-card module-card-nueva-valoracion"
          aria-label="Nueva Valoración"
          title="Nueva Valoración"
          onClick={() => navigate('/app/nueva-valoracion')}
        />

        <button
          type="button"
          className="module-card module-card-valoraciones-pendientes"
          aria-label="Valoraciones Pendientes"
          title="Valoraciones Pendientes"
          onClick={() => navigate('/app/valoraciones-pendientes')}
        />

        <button
          type="button"
          className="module-card module-card-expedientes"
          aria-label="Expedientes"
          title="Expedientes"
          onClick={() => navigate('/app/expedientes')}
        />

        <button
          type="button"
          className="module-card module-card-clientes"
          aria-label="Clientes"
          title="Clientes"
          onClick={() => navigate('/app/clientes')}
        />

        <button
          type="button"
          className="module-card module-card-preregistros"
          aria-label="Prerregistros"
          title="Prerregistros"
          onClick={() => navigate('/app/preregistros')}
        />

        <button
          type="button"
          className="module-card module-card-activos"
          aria-label="Activos"
          title="Activos"
          onClick={() => navigate('/app/activos')}
        >
          <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M24 8h16M28 8v17L13 48a5 5 0 0 0 4 8h30a5 5 0 0 0 4-8L36 25V8M21 37h22" />
            <circle cx="28" cy="45" r="2" />
            <circle cx="37" cy="49" r="2" />
          </svg>
          <span>Activos</span>
        </button>

        {isAdmin ? (
          <button
            type="button"
            className="module-card module-card-usuarios"
            aria-label="Usuarios"
            title="Usuarios"
            onClick={() => navigate('/app/usuarios')}
          />
        ) : null}
      </div>
    </section>
  )
}

export default MenuView
