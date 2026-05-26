import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listClients } from '../../models/clientModel.js'

function ClientesView() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
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

  const handleSelectClient = (clientId) => {
    setSelectedClientId((previous) => (previous === clientId ? '' : clientId))
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
            </li>
          ))}
        </ul>
      ) : null}

      {selectedClient ? (
        <section className="client-detail-panel">
          <h2>Datos generales del cliente</h2>

          <div className="client-detail-grid">
            <p>
              <strong>Apellido paterno:</strong> {selectedClient.apellidoPaterno || '-'}
            </p>
            <p>
              <strong>Apellido materno:</strong> {selectedClient.apellidoMaterno || '-'}
            </p>
            <p>
              <strong>Nombre:</strong> {selectedClient.nombre || '-'}
            </p>
            <p>
              <strong>Edad:</strong> {selectedClient.edad || '-'}
            </p>
            <p>
              <strong>Fecha nacimiento:</strong> {selectedClient.fechaNacimiento || '-'}
            </p>
            <p>
              <strong>Telefono:</strong> {selectedClient.telefono || '-'}
            </p>
            <p>
              <strong>Correo electronico:</strong> {selectedClient.correoElectronico || '-'}
            </p>
            <p>
              <strong>Ocupacion:</strong> {selectedClient.ocupacion || '-'}
            </p>
            <p className="client-detail-full">
              <strong>Contacto de emergencia:</strong> {selectedClient.contactoEmergencia || '-'}
            </p>
          </div>
        </section>
      ) : null}
    </section>
  )
}

export default ClientesView
