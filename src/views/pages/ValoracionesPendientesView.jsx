import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthController } from '../../controllers/authController.jsx'
import { getValuationProgressLabel, listPendingValuations } from '../../models/valuationModel.js'

function ValoracionesPendientesView() {
  const navigate = useNavigate()
  const { currentUser } = useAuthController()
  const [pendingValuations, setPendingValuations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadPendingValuations = async () => {
      if (!currentUser?.id) {
        if (isMounted) {
          setPendingValuations([])
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)
      const result = await listPendingValuations()

      if (!isMounted) {
        return
      }

      if (!result.ok) {
        setError(result.message)
        setPendingValuations([])
        setIsLoading(false)
        return
      }

      setError('')
      setPendingValuations(result.valuations)
      setIsLoading(false)
    }

    loadPendingValuations()

    return () => {
      isMounted = false
    }
  }, [currentUser?.id])

  const emptyMessage = useMemo(() => 'No hay valoraciones pendientes por el momento.', [])

  return (
    <section className="module-screen">
      <div className="module-screen-head">
        <button type="button" className="main-button secondary" onClick={() => navigate('/app')}>
          Regresar al menu principal
        </button>

        <div>
          <h1>Valoraciones Pendientes</h1>
          <p className="subtitle">Continua una valoracion guardada por pasos.</p>
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      {isLoading ? <p className="subtitle">Cargando valoraciones pendientes...</p> : null}

      {!isLoading && !error && pendingValuations.length === 0 ? (
        <p className="subtitle">{emptyMessage}</p>
      ) : null}

      {!isLoading && pendingValuations.length > 0 ? (
        <ul className="users-list valuations-list">
          {pendingValuations.map((valuation) => (
            <li className="user-row valuation-row" key={valuation.id}>
              <div>
                <strong>{valuation.clienteNombre || 'Cliente sin nombre'}</strong>
                <small className="small-tag">{getValuationProgressLabel(valuation)}</small>
              </div>

              <div className="row-actions">
                <button
                  type="button"
                  className="main-button"
                  onClick={() => navigate(`/app/nueva-valoracion/${valuation.id}`)}
                >
                  Continuar
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

export default ValoracionesPendientesView
