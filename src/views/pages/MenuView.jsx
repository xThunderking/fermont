import { useNavigate } from 'react-router-dom'

function MenuView() {
  const navigate = useNavigate()

  return (
    <section className="module-menu">
      <div className="module-grid">
        <button
          type="button"
          className="module-card users-module-card"
          onClick={() => navigate('/app/usuarios')}
        >
          <h2>Usuarios</h2>
        </button>
      </div>
    </section>
  )
}

export default MenuView
