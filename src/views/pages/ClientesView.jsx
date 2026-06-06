import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthController } from '../../controllers/authController.jsx'
import { deleteClientById, listClientClinicalHistory, listClients } from '../../models/clientModel.js'

function ClientesView() {
  const navigate = useNavigate()
  const { isAdmin } = useAuthController()
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
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

  const filteredClients = useMemo(() => {
    const queryText = search.trim().toLowerCase()

    if (!queryText) {
      return clients
    }

    return clients.filter((client) => client.nombreCompletoLower.includes(queryText))
  }, [clients, search])

  const selectedClient = useMemo(
    () => filteredClients.find((client) => client.id === selectedClientId) || null,
    [filteredClients, selectedClientId],
  )

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

  const handleSelectClient = (clientId) => {
    setSelectedClientId((previous) => (previous === clientId ? '' : clientId))
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
    setSelectedClientId((previous) => (previous === deleteClientId ? '' : previous))
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
                className={`client-row-button ${selectedClientId === client.id ? 'selected' : ''}`}
                onClick={() => handleSelectClient(client.id)}
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

      {selectedClient ? (
        <section className="client-detail-panel">
          <h2>Datos generales del cliente</h2>
          <div className="client-detail-grid">
            <p><strong>Apellido paterno:</strong> {selectedClient.apellidoPaterno || '-'}</p>
            <p><strong>Apellido materno:</strong> {selectedClient.apellidoMaterno || '-'}</p>
            <p><strong>Nombre:</strong> {selectedClient.nombre || '-'}</p>
            <p><strong>Edad:</strong> {selectedClient.edad || '-'}</p>
            <p><strong>Fecha nacimiento:</strong> {selectedClient.fechaNacimiento || '-'}</p>
            <p><strong>Telefono:</strong> {selectedClient.telefono || '-'}</p>
            <p><strong>Correo electronico:</strong> {selectedClient.correoElectronico || '-'}</p>
            <p><strong>Ocupacion:</strong> {selectedClient.ocupacion || '-'}</p>
            <p className="client-detail-full">
              <strong>Contacto de emergencia:</strong> {selectedClient.contactoEmergencia || '-'}
            </p>
          </div>
        </section>
      ) : null}

      {historyModalOpen ? (
        <div className="selection-modal-backdrop" onClick={closeHistoryModal}>
          <div className="selection-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="selection-modal-head">
              <h3 className="consultation-block-title">Historia clinica</h3>
              <button type="button" className="main-button secondary" onClick={closeHistoryModal}>
                Cerrar
              </button>
            </div>

            {historyLoading ? <p className="subtitle">Cargando historia clinica...</p> : null}

            {!historyLoading && historyModalClient ? (
              <div className="client-detail-grid">
                <p><strong>Cliente:</strong> {historyModalClient.nombreCompleto || '-'}</p>
                <p><strong>Telefono:</strong> {historyModalClient.telefono || '-'}</p>
                <p><strong>Correo:</strong> {historyModalClient.correoElectronico || '-'}</p>
              </div>
            ) : null}

            {!historyLoading && clientHistory.length === 0 ? (
              <p className="subtitle">Aun no hay historia clinica para este cliente.</p>
            ) : null}

            {!historyLoading && clientHistory.length > 0 ? (
              <ul className="users-list valuations-list">
                {clientHistory.map((entry) => (
                  <li className="user-row valuation-row" key={entry.id}>
                    <div>
                      <strong>Valoracion {entry.valuationId}</strong>
                      <small className="small-tag">
                        {entry.createdAtMs ? new Date(entry.createdAtMs).toLocaleDateString('es-MX') : 'Sin fecha'}
                      </small>
                    </div>
                  </li>
                ))}
              </ul>
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
