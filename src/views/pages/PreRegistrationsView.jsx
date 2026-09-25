import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthController } from '../../controllers/authController.jsx'
import {
  createPreRegistrationInvitation,
  deletePreRegistration,
  listManagedPreRegistrations,
} from '../../models/preRegistrationModel.js'

const formatDateTime = (timestamp) => {
  if (!timestamp) return 'Sin fecha'
  return new Date(timestamp).toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const normalizePhone = (value) => String(value ?? '').replace(/\D/g, '').slice(0, 10)

function PreRegistrationsView() {
  const navigate = useNavigate()
  const { isAdmin } = useAuthController()
  const [preRegistrations, setPreRegistrations] = useState([])
  const [search, setSearch] = useState('')
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [telefono, setTelefono] = useState('')
  const [sexo, setSexo] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadPreRegistrations = useCallback(async () => {
    const result = await listManagedPreRegistrations()

    if (!result.ok) {
      setError(result.message)
      setPreRegistrations([])
    } else {
      setError('')
      setPreRegistrations(result.preRegistrations)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    let isMounted = true

    listManagedPreRegistrations().then((result) => {
      if (!isMounted) return

      if (!result.ok) {
        setError(result.message)
        setPreRegistrations([])
      } else {
        setError('')
        setPreRegistrations(result.preRegistrations)
      }
      setIsLoading(false)
    })

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

  const pendingPreRegistrations = filteredPreRegistrations.filter(({ status }) => status === 'pending')
  const completedPreRegistrations = filteredPreRegistrations.filter(({ status }) => status === 'completed')

  const handleCreate = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (nombreCompleto.trim().length < 3) {
      setError('Escribe el nombre completo.')
      return
    }

    if (normalizePhone(telefono).length !== 10) {
      setError('El número de teléfono debe tener 10 dígitos.')
      return
    }

    if (!['femenino', 'masculino'].includes(sexo)) {
      setError('Selecciona el sexo del cliente.')
      return
    }

    setIsCreating(true)
    const result = await createPreRegistrationInvitation({ nombreCompleto, telefono, sexo })
    setIsCreating(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setNombreCompleto('')
    setTelefono('')
    setSexo('')
    setMessage(result.message)
    await loadPreRegistrations()
  }

  const handleDelete = async (preRegistration) => {
    const confirmed = window.confirm(
      `¿Eliminar el prerregistro de ${preRegistration.nombreCompleto}? Esta acción no se puede deshacer.`,
    )
    if (!confirmed) return

    setError('')
    setMessage('')
    setDeletingId(preRegistration.id)
    const result = await deletePreRegistration(preRegistration.id)
    setDeletingId('')

    if (!result.ok) {
      setError(result.message)
      return
    }

    setMessage(result.message)
    await loadPreRegistrations()
  }

  const renderPreRegistrationList = (items, status) => {
    if (items.length === 0) {
      return (
        <div className="empty-state-card preregistration-empty-state">
          <p className="subtitle">
            {status === 'pending'
              ? 'No hay prerregistros pendientes disponibles en la página web.'
              : 'No hay prerregistros finalizados pendientes de valoración.'}
          </p>
        </div>
      )
    }

    return (
      <ul className="users-list valuations-list preregistration-list">
        {items.map((preRegistration) => (
          <li className="user-row valuation-row" key={preRegistration.id}>
            <div className="client-row-button preregistration-row-summary">
              <strong>{preRegistration.nombreCompleto || 'Sin nombre'}</strong>
              <small>{preRegistration.telefono || 'Sin teléfono'}</small>
              <small>
                {preRegistration.sexo === 'femenino'
                  ? 'Mujer'
                  : preRegistration.sexo === 'masculino'
                    ? 'Hombre'
                    : 'Sin sexo registrado'}
              </small>
              <small className="small-tag">
                {status === 'pending' ? 'Creado' : 'Finalizado'}:{' '}
                {formatDateTime(status === 'pending'
                  ? preRegistration.createdAtMs
                  : preRegistration.completedAtMs)}
              </small>
            </div>

            <div className="row-actions preregistration-row-actions">
              {status === 'completed' ? (
                <button
                  type="button"
                  className="main-button"
                  onClick={() => navigate(`/app/nueva-valoracion?preregistro=${preRegistration.id}`)}
                >
                  Iniciar valoración
                </button>
              ) : null}

              {isAdmin ? (
                <button
                  type="button"
                  className="main-button danger"
                  disabled={Boolean(deletingId)}
                  onClick={() => handleDelete(preRegistration)}
                >
                  {deletingId === preRegistration.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <section className="module-screen">
      <div className="module-screen-head">
        <button type="button" className="main-button secondary" onClick={() => navigate('/app')}>
          Regresar al menú principal
        </button>

        <div>
          <h1>Prerregistros</h1>
          <p className="subtitle">
            Genera invitaciones para clientes y consulta cuáles siguen pendientes o ya fueron finalizadas.
          </p>
        </div>
      </div>

      <form className="simple-form preregistration-create-form" onSubmit={handleCreate}>
        <label>
          Nombre completo (nombre y al menos un apellido)
          <input
            required
            type="text"
            autoComplete="name"
            maxLength="120"
            value={nombreCompleto}
            onChange={(event) => setNombreCompleto(event.target.value)}
            placeholder="Nombre(s) y apellidos"
          />
        </label>

        <label>
          Número telefónico
          <input
            required
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            maxLength="10"
            value={telefono}
            onChange={(event) => setTelefono(normalizePhone(event.target.value))}
            placeholder="10 dígitos"
          />
        </label>

        <label>
          Sexo
          <select required value={sexo} onChange={(event) => setSexo(event.target.value)}>
            <option value="">Selecciona una opción</option>
            <option value="femenino">Mujer</option>
            <option value="masculino">Hombre</option>
          </select>
        </label>

        <button type="submit" className="main-button" disabled={isCreating}>
          {isCreating ? 'Generando...' : 'Generar prerregistro'}
        </button>
      </form>

      {error ? <p className="error-text preregistration-feedback">{error}</p> : null}
      {message ? <p className="success-text preregistration-feedback">{message}</p> : null}

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

      {isLoading ? <p className="subtitle preregistration-feedback">Cargando prerregistros...</p> : null}

      {!isLoading ? (
        <div className="preregistration-groups">
          <section className="preregistration-group" aria-labelledby="pending-preregistrations-title">
            <div className="preregistration-group-heading">
              <h2 id="pending-preregistrations-title">Pendientes en la página web</h2>
              <span>{pendingPreRegistrations.length}</span>
            </div>
            {renderPreRegistrationList(pendingPreRegistrations, 'pending')}
          </section>

          <section className="preregistration-group" aria-labelledby="completed-preregistrations-title">
            <div className="preregistration-group-heading">
              <h2 id="completed-preregistrations-title">Finalizados</h2>
              <span>{completedPreRegistrations.length}</span>
            </div>
            {renderPreRegistrationList(completedPreRegistrations, 'completed')}
          </section>
        </div>
      ) : null}
    </section>
  )
}

export default PreRegistrationsView
