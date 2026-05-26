import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthController } from '../../controllers/authController.jsx'
import { listClients, saveClientFromStepOne } from '../../models/clientModel.js'
import {
  STEP_TWO_OPTIONS,
  getValuationForEdition,
  saveStepOneValuation,
  saveStepTwoValuation,
} from '../../models/valuationModel.js'

const getTodayDate = () => new Date().toISOString().split('T')[0]

const createStepOneInitialData = () => ({
  apellidoPaterno: '',
  apellidoMaterno: '',
  nombre: '',
  edad: '',
  fechaNacimiento: '',
  telefono: '',
  correoElectronico: '',
  ocupacion: '',
  contactoEmergencia: '',
  objetivoPrincipal: '',
  inconformidadPrincipal: '',
  fechaValoracion: getTodayDate(),
})

const createStepTwoInitialData = () => ({
  motivosFaciales: [],
  motivosCorporales: [],
})

const normalizeExistingStepTwoData = (rawStepTwo) => {
  const fallback = createStepTwoInitialData()

  if (!rawStepTwo) {
    return fallback
  }

  const allowedFaciales = new Set(STEP_TWO_OPTIONS.facial)
  const allowedCorporales = new Set(STEP_TWO_OPTIONS.corporal)

  const fromNewSchema = {
    motivosFaciales: Array.isArray(rawStepTwo.motivosFaciales)
      ? rawStepTwo.motivosFaciales.filter((motivo) => allowedFaciales.has(motivo))
      : [],
    motivosCorporales: Array.isArray(rawStepTwo.motivosCorporales)
      ? rawStepTwo.motivosCorporales.filter((motivo) => allowedCorporales.has(motivo))
      : [],
  }

  if (fromNewSchema.motivosFaciales.length > 0 || fromNewSchema.motivosCorporales.length > 0) {
    return fromNewSchema
  }

  if (rawStepTwo.tipoConsulta === 'facial') {
    return {
      motivosFaciales: Array.isArray(rawStepTwo.motivosConsulta)
        ? rawStepTwo.motivosConsulta.filter((motivo) => allowedFaciales.has(motivo))
        : [],
      motivosCorporales: [],
    }
  }

  if (rawStepTwo.tipoConsulta === 'corporal') {
    return {
      motivosFaciales: [],
      motivosCorporales: Array.isArray(rawStepTwo.motivosConsulta)
        ? rawStepTwo.motivosConsulta.filter((motivo) => allowedCorporales.has(motivo))
        : [],
    }
  }

  return fallback
}

const clearClientCoreData = (data) => ({
  ...data,
  apellidoPaterno: '',
  apellidoMaterno: '',
  nombre: '',
  edad: '',
  fechaNacimiento: '',
  telefono: '',
  correoElectronico: '',
  ocupacion: '',
  contactoEmergencia: '',
})

function NuevaValoracionView() {
  const navigate = useNavigate()
  const { valuationId } = useParams()
  const { currentUser } = useAuthController()

  const [valuationDocId, setValuationDocId] = useState(valuationId || '')
  const [activeStep, setActiveStep] = useState(1)
  const [clientFlowType, setClientFlowType] = useState('nuevo')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [stepOneData, setStepOneData] = useState(createStepOneInitialData)
  const [stepTwoData, setStepTwoData] = useState(createStepTwoInitialData)
  const [availableClients, setAvailableClients] = useState([])
  const [clientSearch, setClientSearch] = useState('')
  const [isLoadingClients, setIsLoadingClients] = useState(false)
  const [isLoading, setIsLoading] = useState(Boolean(valuationId))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadClients = async () => {
      if (!currentUser?.id) {
        if (isMounted) {
          setAvailableClients([])
        }
        return
      }

      setIsLoadingClients(true)
      const result = await listClients()

      if (!isMounted) {
        return
      }

      if (!result.ok) {
        setAvailableClients([])
        setIsLoadingClients(false)
        return
      }

      setAvailableClients(result.clients)
      setIsLoadingClients(false)
    }

    loadClients()

    return () => {
      isMounted = false
    }
  }, [currentUser?.id])

  useEffect(() => {
    let isMounted = true

    const loadExistingValuation = async () => {
      if (!valuationId) {
        setValuationDocId('')
        setActiveStep(1)
        setClientFlowType('nuevo')
        setSelectedClientId('')
        setStepOneData(createStepOneInitialData())
        setStepTwoData(createStepTwoInitialData())
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      const result = await getValuationForEdition({ valuationId })

      if (!isMounted) {
        return
      }

      if (!result.ok) {
        setError(result.message)
        setIsLoading(false)
        return
      }

      const loadedStepOne = {
        ...createStepOneInitialData(),
        ...(result.valuation.step1 ?? {}),
      }

      setError('')
      setValuationDocId(result.valuation.id)
      setActiveStep(result.valuation.currentStep >= 2 ? 2 : 1)
      setClientFlowType(loadedStepOne.tipoCliente === 'recurrente' ? 'recurrente' : 'nuevo')
      setSelectedClientId(String(loadedStepOne.clienteId ?? result.valuation.clienteId ?? ''))
      setStepOneData(loadedStepOne)
      setStepTwoData(normalizeExistingStepTwoData(result.valuation.step2))
      setIsLoading(false)
    }

    loadExistingValuation()

    return () => {
      isMounted = false
    }
  }, [valuationId])

  const filteredClients = useMemo(() => {
    const queryText = clientSearch.trim().toLowerCase()

    if (!queryText) {
      return availableClients.slice(0, 12)
    }

    return availableClients
      .filter((client) => client.nombreCompletoLower.includes(queryText))
      .slice(0, 20)
  }, [availableClients, clientSearch])

  const titleText = useMemo(() => {
    if (valuationDocId) {
      return 'Editar valoracion pendiente'
    }

    return 'Nueva Valoracion'
  }, [valuationDocId])

  const setFieldValue = (field, value) => {
    setStepOneData((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const toggleStepTwoMotive = (field, motivo) => {
    setStepTwoData((previous) => {
      const currentValues = previous[field]
      const exists = currentValues.includes(motivo)

      if (exists) {
        return {
          ...previous,
          [field]: currentValues.filter((value) => value !== motivo),
        }
      }

      return {
        ...previous,
        [field]: [...currentValues, motivo],
      }
    })
  }

  const applyClientToStepOne = (client) => {
    setStepOneData((previous) => ({
      ...previous,
      apellidoPaterno: client.apellidoPaterno,
      apellidoMaterno: client.apellidoMaterno,
      nombre: client.nombre,
      edad: client.edad,
      fechaNacimiento: client.fechaNacimiento,
      telefono: client.telefono,
      correoElectronico: client.correoElectronico,
      ocupacion: client.ocupacion,
      contactoEmergencia: client.contactoEmergencia,
    }))
  }

  const selectClientFlowType = (flowType) => {
    setClientFlowType(flowType)

    if (flowType === 'nuevo') {
      setSelectedClientId('')
      setStepOneData((previous) => clearClientCoreData(previous))
      return
    }

    setClientSearch('')
  }

  const selectRecurrentClient = (client) => {
    setClientFlowType('recurrente')
    setSelectedClientId(client.id)
    applyClientToStepOne(client)
    setClientSearch(client.nombreCompleto)
    setError('')
  }

  const saveStepOne = async () => {
    if (!currentUser?.id) {
      setError('No hay sesion activa para guardar la valoracion.')
      return null
    }

    if (clientFlowType === 'recurrente' && !selectedClientId) {
      setError('Selecciona un cliente recurrente antes de guardar el paso 1.')
      setSuccessMessage('')
      return null
    }

    setIsSaving(true)

    const clientResult = await saveClientFromStepOne({
      userId: currentUser.id,
      stepOneData,
      clientId: clientFlowType === 'recurrente' ? selectedClientId : '',
    })

    if (!clientResult.ok || !clientResult.client?.id) {
      setIsSaving(false)
      setError(clientResult.message || 'No se pudo guardar la informacion del cliente.')
      setSuccessMessage('')
      return null
    }

    const linkedClientId = clientResult.client.id
    setSelectedClientId(linkedClientId)

    const valuationResult = await saveStepOneValuation({
      valuationId: valuationDocId,
      userId: currentUser.id,
      stepOneData: {
        ...stepOneData,
        tipoCliente: clientFlowType,
        clienteId: linkedClientId,
      },
    })

    setIsSaving(false)

    if (!valuationResult.ok) {
      setError(valuationResult.message)
      setSuccessMessage('')
      return null
    }

    setStepOneData((previous) => ({
      ...previous,
      tipoCliente: clientFlowType,
      clienteId: linkedClientId,
    }))
    setError('')
    setSuccessMessage(valuationResult.message)

    const nextValuationId = valuationResult.valuation?.id || valuationDocId
    setValuationDocId(nextValuationId)

    if (!valuationId && nextValuationId) {
      navigate(`/app/nueva-valoracion/${nextValuationId}`, { replace: true })
    }

    return nextValuationId
  }

  const saveStepTwo = async () => {
    setIsSaving(true)
    const result = await saveStepTwoValuation({
      valuationId: valuationDocId,
      stepTwoData,
    })
    setIsSaving(false)

    if (!result.ok) {
      setError(result.message)
      setSuccessMessage('')
      return null
    }

    setError('')
    setSuccessMessage(result.message)
    setValuationDocId(result.valuation?.id || valuationDocId)
    return result.valuation?.id || valuationDocId
  }

  const handleSaveAndExit = async (event) => {
    event.preventDefault()
    const nextValuationId = await saveStepOne()

    if (!nextValuationId) {
      return
    }

    navigate('/app/valoraciones-pendientes')
  }

  const handleSaveAndContinue = async (event) => {
    event.preventDefault()
    const nextValuationId = await saveStepOne()

    if (!nextValuationId) {
      return
    }

    setActiveStep(2)
    setSuccessMessage('Paso 1 guardado. Puedes continuar con el paso 2.')
  }

  const handleSaveStepTwoAndExit = async (event) => {
    event.preventDefault()
    const nextValuationId = await saveStepTwo()

    if (!nextValuationId) {
      return
    }

    navigate('/app/valoraciones-pendientes')
  }

  const handleSaveStepTwoAndContinue = async (event) => {
    event.preventDefault()
    const nextValuationId = await saveStepTwo()

    if (!nextValuationId) {
      return
    }

    setSuccessMessage('Paso 2 guardado. Paso 3 disponible en la siguiente iteracion.')
  }

  return (
    <section className="module-screen">
      <div className="module-screen-head">
        <button type="button" className="main-button secondary" onClick={() => navigate('/app')}>
          Regresar al menu principal
        </button>

        <div>
          <h1>{titleText}</h1>
          <p className="subtitle">
            {activeStep === 1
              ? 'Paso 1 de 14: Datos generales del cliente.'
              : 'Paso 2 de 14: Motivo de consulta.'}
          </p>
        </div>
      </div>

      {isLoading ? <p className="subtitle">Cargando valoracion...</p> : null}

      {!isLoading && activeStep === 1 ? (
        <form className="simple-form valuation-form" onSubmit={handleSaveAndExit}>
          <div className="client-mode-toggle">
            <button
              type="button"
              className={`client-mode-button ${clientFlowType === 'recurrente' ? 'active' : ''}`}
              onClick={() => selectClientFlowType('recurrente')}
            >
              Cliente recurrente
            </button>
            <button
              type="button"
              className={`client-mode-button ${clientFlowType === 'nuevo' ? 'active' : ''}`}
              onClick={() => selectClientFlowType('nuevo')}
            >
              Cliente nuevo
            </button>
          </div>

          {clientFlowType === 'recurrente' ? (
            <div className="client-search-box">
              <label>
                Buscar cliente por nombre
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(event) => setClientSearch(event.target.value)}
                  placeholder="Escribe nombre o apellidos"
                />
              </label>

              {isLoadingClients ? <p className="subtitle">Cargando clientes...</p> : null}

              {!isLoadingClients ? (
                <div className="client-search-results">
                  {filteredClients.length === 0 ? (
                    <p className="subtitle">No se encontraron clientes para esa busqueda.</p>
                  ) : (
                    filteredClients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        className={`client-search-row ${selectedClientId === client.id ? 'selected' : ''}`}
                        onClick={() => selectRecurrentClient(client)}
                      >
                        <strong>{client.nombreCompleto}</strong>
                        <small>{client.telefono || client.correoElectronico || 'Sin contacto'}</small>
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="valuation-grid">
            <label>
              Apellido paterno
              <input
                required
                value={stepOneData.apellidoPaterno}
                onChange={(event) => setFieldValue('apellidoPaterno', event.target.value)}
              />
            </label>

            <label>
              Apellido materno
              <input
                required
                value={stepOneData.apellidoMaterno}
                onChange={(event) => setFieldValue('apellidoMaterno', event.target.value)}
              />
            </label>

            <label>
              Nombre
              <input
                required
                value={stepOneData.nombre}
                onChange={(event) => setFieldValue('nombre', event.target.value)}
              />
            </label>

            <label>
              Edad
              <input
                required
                type="number"
                min="0"
                value={stepOneData.edad}
                onChange={(event) => setFieldValue('edad', event.target.value)}
              />
            </label>

            <label>
              Fecha nacimiento
              <input
                required
                type="date"
                value={stepOneData.fechaNacimiento}
                onChange={(event) => setFieldValue('fechaNacimiento', event.target.value)}
              />
            </label>

            <label>
              Telefono
              <input
                required
                type="tel"
                value={stepOneData.telefono}
                onChange={(event) => setFieldValue('telefono', event.target.value)}
              />
            </label>

            <label>
              Correo electronico
              <input
                required
                type="email"
                value={stepOneData.correoElectronico}
                onChange={(event) => setFieldValue('correoElectronico', event.target.value)}
              />
            </label>

            <label>
              Ocupacion
              <input
                required
                value={stepOneData.ocupacion}
                onChange={(event) => setFieldValue('ocupacion', event.target.value)}
              />
            </label>

            <label className="valuation-field-large">
              Contacto de emergencia
              <input
                required
                value={stepOneData.contactoEmergencia}
                onChange={(event) => setFieldValue('contactoEmergencia', event.target.value)}
              />
            </label>
          </div>

          <div className="valuation-grid">
            <label className="valuation-field-large">
              Objetivo principal
              <textarea
                required
                rows="3"
                value={stepOneData.objetivoPrincipal}
                onChange={(event) => setFieldValue('objetivoPrincipal', event.target.value)}
              />
            </label>

            <label className="valuation-field-large">
              Inconformidad principal
              <textarea
                required
                rows="3"
                value={stepOneData.inconformidadPrincipal}
                onChange={(event) => setFieldValue('inconformidadPrincipal', event.target.value)}
              />
            </label>

            <label>
              Fecha de valoracion
              <input
                required
                type="date"
                value={stepOneData.fechaValoracion}
                onChange={(event) => setFieldValue('fechaValoracion', event.target.value)}
              />
            </label>
          </div>

          {error ? <p className="error-text">{error}</p> : null}
          {successMessage ? <p className="success-text">{successMessage}</p> : null}

          <div className="valuation-actions">
            <button type="submit" className="main-button" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar paso 1 y salir'}
            </button>
            <button
              type="button"
              className="main-button secondary"
              disabled={isSaving}
              onClick={handleSaveAndContinue}
            >
              Guardar y continuar al paso 2
            </button>
          </div>
        </form>
      ) : null}

      {!isLoading && activeStep === 2 ? (
        <form className="simple-form valuation-form" onSubmit={handleSaveStepTwoAndExit}>
          <div className="valuation-section-title">Motivo de consulta</div>

          <div className="motivos-wrapper">
            <p className="subtitle">Selecciona uno o varios motivos faciales y/o corporales.</p>

            <div className="consultation-block">
              <h3 className="consultation-block-title">Facial</h3>
              <div className="motivos-grid">
                {STEP_TWO_OPTIONS.facial.map((motivo) => (
                  <label className="motivo-option" key={`facial-${motivo}`}>
                    <input
                      type="checkbox"
                      checked={stepTwoData.motivosFaciales.includes(motivo)}
                      onChange={() => toggleStepTwoMotive('motivosFaciales', motivo)}
                    />
                    <span>{motivo}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="consultation-block">
              <h3 className="consultation-block-title">Corporal</h3>
              <div className="motivos-grid">
                {STEP_TWO_OPTIONS.corporal.map((motivo) => (
                  <label className="motivo-option" key={`corporal-${motivo}`}>
                    <input
                      type="checkbox"
                      checked={stepTwoData.motivosCorporales.includes(motivo)}
                      onChange={() => toggleStepTwoMotive('motivosCorporales', motivo)}
                    />
                    <span>{motivo}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {error ? <p className="error-text">{error}</p> : null}
          {successMessage ? <p className="success-text">{successMessage}</p> : null}

          <div className="valuation-actions">
            <button type="submit" className="main-button" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar paso 2 y salir'}
            </button>

            <button
              type="button"
              className="main-button secondary"
              disabled={isSaving}
              onClick={handleSaveStepTwoAndContinue}
            >
              Guardar y continuar al paso 3
            </button>

            <button
              type="button"
              className="main-button secondary"
              disabled={isSaving}
              onClick={() => setActiveStep(1)}
            >
              Volver al paso 1
            </button>
          </div>
        </form>
      ) : null}
    </section>
  )
}

export default NuevaValoracionView
