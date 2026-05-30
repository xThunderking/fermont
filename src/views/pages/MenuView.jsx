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
          aria-label="Nueva Valoracion"
          title="Nueva Valoracion"
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
          className="module-card module-card-clientes"
          aria-label="Clientes"
          title="Clientes"
          onClick={() => navigate('/app/clientes')}
        />

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
