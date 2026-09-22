import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listCompletedPreRegistrations } from '../../models/preRegistrationModel.js'

const formatDateTime = (timestamp) => {
  if (!timestamp) return 'Sin fecha'
  return new Date(timestamp).toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function PreRegistrationsView() {
  const navigate = useNavigate()
  const [preRegistrations, setPreRegistrations] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadPreRegistrations = async () => {
      setIsLoading(true)
      const result = await listCompletedPreRegistrations()
      if (!isMounted) return

      if (!result.ok) {
        setError(result.message)
        setPreRegistrations([])
      } else {
        setError('')
        setPreRegistrations(result.preRegistrations)
      }
      setIsLoading(false)
    }

    loadPreRegistrations()
    return () => {
      isMounted = false
    }
  }, [])

  const filteredPreRegistrations = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('es-MX')
    if (!normalizedSearch) return preRegistrations

    return preRegistrations.filter((preRegistration) => (
      preRegistration.nombreCompleto.toLocaleLowerCase('es-MX').includes(normalizedSearch)
      || preRegistration.telefono.includes(normalizedSearch)
    ))
  }, [preRegistrations, search])

  return (
    <section className="module-screen">
      <div className="module-screen-head">
        <button type="button" className="main-button secondary" onClick={() => navigate('/app')}>
          Regresar al menú principal
        </button>

        <div>
          <h1>Prerregistros</h1>
          <p className="subtitle">Formularios finalizados que todavía no se han utilizado en una valoración.</p>
        </div>
      </div>

      <div className="client-search-box clients-search-box">
        <label>
          Buscar por nombre o teléfono
          <input
            type="search"
            value={search}
            placeholder="Escribe un nombre o teléfono"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {isLoading ? <p className="subtitle">Cargando prerregistros...</p> : null}

      {!isLoading && filteredPreRegistrations.length === 0 ? (
        <div className="empty-state-card">
          <h2>No hay prerregistros finalizados</h2>
          <p className="subtitle">Los formularios enviados desde la página pública aparecerán aquí.</p>
        </div>
      ) : null}

      {!isLoading && filteredPreRegistrations.length > 0 ? (
        <ul className="users-list valuations-list preregistration-list">
          {filteredPreRegistrations.map((preRegistration) => (
            <li className="user-row valuation-row" key={preRegistration.id}>
              <div className="client-row-button preregistration-row-summary">
                <strong>{preRegistration.nombreCompleto || 'Sin nombre'}</strong>
                <small>{preRegistration.telefono || 'Teléfono pendiente'}</small>
                <small className="small-tag">Finalizado: {formatDateTime(preRegistration.completedAtMs)}</small>
              </div>
              <button
                type="button"
                className="main-button"
                onClick={() => navigate(`/app/nueva-valoracion?preregistro=${preRegistration.id}`)}
              >
                Iniciar valoración
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

export default PreRegistrationsView
