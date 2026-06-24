import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthController } from '../../controllers/authController.jsx'
import { deleteClientById, listClientClinicalHistory, listClients } from '../../models/clientModel.js'

const formatFieldLabel = (key) => {
  if (!key) return '-'

  const formatted = String(key)
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .trim()

  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function ClientesView() {
  const navigate = useNavigate()
  const { isAdmin } = useAuthController()
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [clientHistory, setClientHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [historyModalClient, setHistoryModalClient] = useState(null)
  const [deleteClientId, setDeleteClientId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadClients = async () => {
      setIsLoading(true)
      const result = await listClients()

      if (!isMounted) {
        return
      }

      if (!result.ok) {
        setError(result.message)
        setClients([])
        setIsLoading(false)
        return
      }

      setError('')
      setClients(result.clients)
      setIsLoading(false)
    }

    loadClients()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const layoutHiddenClass = 'mapa-interactivo-open'

    if (historyModalOpen) {
      document.body.classList.add(layoutHiddenClass)
    } else {
      document.body.classList.remove(layoutHiddenClass)
    }

    return () => {
      document.body.classList.remove(layoutHiddenClass)
    }
  }, [historyModalOpen])

  const filteredClients = useMemo(() => {
    const queryText = search.trim().toLowerCase()

    if (!queryText) {
      return clients
    }

    return clients.filter((client) => client.nombreCompletoLower.includes(queryText))
  }, [clients, search])

  const openClientHistoryModal = async (client) => {
    setHistoryModalClient(client)
    setHistoryModalOpen(true)
    setHistoryLoading(true)
    setClientHistory([])

    const result = await listClientClinicalHistory(client.id)

    if (!result.ok) {
      setError(result.message)
      setHistoryLoading(false)
      return
    }

    setError('')
    setClientHistory(result.history)
    setHistoryLoading(false)
  }

  const closeHistoryModal = () => {
    setHistoryModalOpen(false)
    setHistoryModalClient(null)
    setClientHistory([])
    setHistoryLoading(false)
  }

  const handleDeleteClient = async (clientId) => {
    if (!isAdmin) {
      return
    }

    setDeleteClientId(clientId)
  }

  const confirmDeleteClient = async () => {
    if (!deleteClientId) {
      return
    }

    const result = await deleteClientById(deleteClientId)

    if (!result.ok) {
      setError(result.message)
      setDeleteClientId('')
      return
    }

    setError('')
    setClients((previous) => previous.filter((client) => client.id !== deleteClientId))
    setDeleteClientId('')
  }

  return (
    <section className="module-screen">
      <div className="module-screen-head">
        <button type="button" className="main-button secondary" onClick={() => navigate('/app')}>
          Regresar al menu principal
        </button>

        <div>
          <h1>Clientes</h1>
          <p className="subtitle">Clientes guardados desde el paso 1 de valoracion.</p>
        </div>
      </div>

      <div className="client-search-box clients-search-box">
        <label>
          Buscar cliente por nombre
          <input
            type="text"
            value={search}
            placeholder="Escribe nombre o apellidos"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {isLoading ? <p className="subtitle">Cargando clientes...</p> : null}

      {!isLoading && filteredClients.length === 0 ? (
        <p className="subtitle">No hay clientes registrados todavia.</p>
      ) : null}

      {!isLoading && filteredClients.length > 0 ? (
        <ul className="users-list valuations-list">
          {filteredClients.map((client) => (
            <li className="user-row valuation-row" key={client.id}>
              <button
                type="button"
                className="client-row-button"
              >
                <strong>{client.nombreCompleto || 'Cliente sin nombre'}</strong>
                <small className="small-tag">{client.correoElectronico || 'Sin correo'}</small>
                <small>{client.telefono || 'Sin telefono'}</small>
              </button>

              <button
                type="button"
                className="main-button secondary"
                onClick={() => openClientHistoryModal(client)}
              >
                Historia clinica
              </button>

              {isAdmin ? (
                <button
                  type="button"
                  className="main-button danger"
                  onClick={() => handleDeleteClient(client.id)}
                >
                  Eliminar
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {historyModalOpen ? (
        <div className="selection-modal-backdrop history-modal-backdrop" onClick={closeHistoryModal}>
          <div
            className="selection-modal history-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Historia clinica"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="selection-modal-head history-modal-head">
              <div className="history-modal-head-copy">
                <h3 className="consultation-block-title">Historia clinica</h3>
                {!historyLoading && historyModalClient ? (
                  <p className="history-modal-head-subtitle">{historyModalClient.nombreCompleto || 'Cliente sin nombre'}</p>
                ) : null}
              </div>
              <button type="button" className="main-button secondary" onClick={closeHistoryModal}>
                Cerrar
              </button>
            </div>

            {historyLoading ? <p className="subtitle">Cargando historia clinica...</p> : null}

            {!historyLoading && historyModalClient ? (
              <section className="history-modal-summary history-modal-section">
                <div className="history-modal-client-info">
                  <p className="history-modal-client-name">{historyModalClient.nombreCompleto || '-'}</p>
                  <div className="history-modal-meta-row">
                    <p className="history-modal-client-meta">Telefono: {historyModalClient.telefono || 'Sin registro'}</p>
                    <span className="history-modal-count-pill">
                      {clientHistory.length} {clientHistory.length === 1 ? 'entrada' : 'entradas'}
                    </span>
                  </div>
                  <p className="history-modal-client-meta">Correo: {historyModalClient.correoElectronico || 'Sin registro'}</p>
                </div>
              </section>
            ) : null}

            {!historyLoading && clientHistory.length === 0 ? (
              <p className="subtitle">Aun no hay historia clinica para este cliente.</p>
            ) : null}

            {!historyLoading && clientHistory.length > 0 ? (
              <div className="history-modal-entries">
                {clientHistory.map((entry, index) => (
                  <details key={entry.id} className="history-entry-card" open={index === 0}>
                    <summary className="history-entry-summary">
                      <div className="history-entry-summary-top">
                        <div className="history-entry-heading">
                          <h3 className="history-entry-title">Valoracion clinica</h3>
                          <p className="history-entry-subtitle">Registro {index + 1}</p>
                        </div>
                        <span className="history-entry-date">
                          {entry.createdAtMs ? new Date(entry.createdAtMs).toLocaleDateString('es-MX') : 'Sin fecha'}
                        </span>
                      </div>
                    </summary>

                    <div className="history-entry-content">
                      <section className="history-modal-section">
                        <h4>Datos personales</h4>
                        <div className="history-fields-grid history-fields-grid-legacy">
                          <div>
                            <span className="font-medium">Nombre:</span>{' '}
                            {[entry.step1?.nombre, entry.step1?.apellidoPaterno, entry.step1?.apellidoMaterno].filter(Boolean).join(' ') || 'Sin registro'}
                          </div>
                          <div>
                            <span className="font-medium">Edad:</span>{' '}
                            {entry.step1?.edad || 'Sin registro'}
                          </div>
                          <div>
                            <span className="font-medium">Telefono:</span>{' '}
                            {entry.step1?.telefono || 'Sin registro'}
                          </div>
                          <div>
                            <span className="font-medium">Correo:</span>{' '}
                            {entry.step1?.correoElectronico || 'Sin registro'}
                          </div>
                          <div>
                            <span className="font-medium">Ocupacion:</span>{' '}
                            {entry.step1?.ocupacion || 'Sin registro'}
                          </div>
                        </div>
                      </section>

                      {[
                        ['step3', 'Expectativas y prioridades'],
                        ['step4', 'Historial clinico'],
                        ['step5', 'Habitos y estilo de vida'],
                        ['step6', 'Exposicion solar'],
                        ['step7', 'Historial estetico'],
                        ['step8', 'Rutina actual'],
                        ['step9', 'Evaluacion cutanea'],
                        ['step10', 'Diagnostico profesional'],
                        ['step11', 'Preguntas corporales'],
                      ].map(([stepKey, title]) => {
                        const values = Object.entries(entry[stepKey] || {})

                        if (values.length === 0) {
                          return null
                        }

                        return (
                          <section key={`${entry.id}-${stepKey}`} className="history-modal-section">
                            <h4>{title}</h4>
                            <div className="text-sm">
                              {values.map(([key, value]) => (
                                <div key={`${entry.id}-${stepKey}-${key}`}>
                                  <span className="font-medium">{formatFieldLabel(key)}:</span>{' '}
                                  {Array.isArray(value) ? (value.length > 0 ? value.join(', ') : 'Sin registro') : String(value || 'Sin registro')}
                                </div>
                              ))}
                            </div>
                          </section>
                        )
                      })}

                      <section className="history-modal-section">
                        <h4>Semaforo cutaneo</h4>
                        <div className="text-sm">{entry.semaforoCutaneo || 'Sin registro'}</div>
                      </section>
                    </div>
                  </details>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {deleteClientId ? (
        <div className="selection-modal-backdrop" onClick={() => setDeleteClientId('')}>
          <div className="selection-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="selection-modal-head">
              <h3 className="consultation-block-title">Eliminar cliente</h3>
              <button type="button" className="main-button secondary" onClick={() => setDeleteClientId('')}>
                Cerrar
              </button>
            </div>
            <p className="subtitle">Seguro que deseas eliminar este cliente? Esta accion no se puede deshacer.</p>
            <div className="valuation-actions">
              <button type="button" className="main-button secondary" onClick={() => setDeleteClientId('')}>
                Cancelar
              </button>
              <button type="button" className="main-button danger" onClick={confirmDeleteClient}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default ClientesView
