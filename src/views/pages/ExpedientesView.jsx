import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthController } from '../../controllers/authController.jsx'
import { deleteValuationById, getValuationForEdition, listCompletedValuations } from '../../models/valuationModel.js'

function ExpedientesView() {
  const navigate = useNavigate()
  const { isAdmin } = useAuthController()
  const { valuationId } = useParams()
  const [valuation, setValuation] = useState(null)
  const [completedValuations, setCompletedValuations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [deleteValuationId, setDeleteValuationId] = useState('')
  const [valuationsCursor, setValuationsCursor] = useState(null)
  const [valuationsHasMore, setValuationsHasMore] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadDetails = async () => {
      setError('')
      setIsLoading(true)

      if (valuationId) {
        const result = await getValuationForEdition({ valuationId })

        if (!isMounted) {
          return
        }

        if (!result.ok) {
          setError(result.message)
          setValuation(null)
          setIsLoading(false)
          return
        }

        setValuation(result.valuation)
        setCompletedValuations([])
        setIsLoading(false)
        return
      }

      const result = await listCompletedValuations()

      if (!isMounted) {
        return
      }

      if (!result.ok) {
        setError(result.message)
        setCompletedValuations([])
        setIsLoading(false)
        return
      }

      setCompletedValuations(result.valuations)
      setValuationsCursor(result.cursor)
      setValuationsHasMore(result.hasMore)
      setValuation(null)
      setIsLoading(false)
    }

    loadDetails()

    return () => {
      isMounted = false
    }
  }, [valuationId])

  const renderClientFullName = () => {
    return [valuation?.step1?.nombre, valuation?.step1?.apellidoPaterno, valuation?.step1?.apellidoMaterno]
      .filter(Boolean)
      .join(' ') || 'No especificado'
  }

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      const { exportValuationToPDF } = await import('../../services/pdfExporter.js')
      await exportValuationToPDF(valuation)
      setError('')
    } catch {
      setError('No se pudo exportar el informe. Intenta de nuevo.')
    } finally {
      setIsExporting(false)
    }
  }

  const formatListDate = (ms) => {
    try {
      const d = Number(ms) ? new Date(Number(ms)) : new Date()
      return d.toLocaleDateString('es-MX')
    } catch {
      return 'Sin fecha'
    }
  }

  const formatConsultationReason = (step2) => {
    const facialReasons = Array.isArray(step2?.motivosFaciales) ? step2.motivosFaciales : []
    const corporalReasons = Array.isArray(step2?.motivosCorporales) ? step2.motivosCorporales : []
    const reasons = [...facialReasons, ...corporalReasons].filter(Boolean)

    return reasons.length > 0 ? reasons.join(', ') : 'No registrado'
  }

  const handleExportFromList = async (id) => {
    setIsExporting(true)
    try {
      const res = await getValuationForEdition({ valuationId: id })
      if (!res.ok) {
        setError(res.message || 'No se pudo obtener la valoración')
        return
      }
      const { exportValuationToPDF } = await import('../../services/pdfExporter.js')
      await exportValuationToPDF(res.valuation)
      setError('')
    } catch {
      setError('No se pudo exportar el informe. Intenta de nuevo.')
    } finally {
      setIsExporting(false)
    }
  }

  const hasSignedConsent = (item) => Boolean(
    item?.consentimientoFirmado?.clienteFirma?.url
    && item?.consentimientoFirmado?.cosmetologaFirma?.url,
  )

  const handleDownloadSignedConsent = async (item) => {
    if (!hasSignedConsent(item)) {
      setError('Este expediente no cuenta con las dos firmas del consentimiento.')
      return
    }

    try {
      const { downloadInformedConsent } = await import('../../services/consentExporter.js')
      await downloadInformedConsent({
        clientName: item.clienteNombre,
        valuationDate: item.step1?.fechaValoracion,
        clientSignature: item.consentimientoFirmado.clienteFirma.url,
        cosmetologistSignature: item.consentimientoFirmado.cosmetologaFirma.url,
      })
      setError('')
    } catch {
      setError('No se pudo descargar el consentimiento firmado.')
    }
  }

  const loadMoreCompletedValuations = async () => {
    if (!valuationsCursor || isLoading) return
    setIsLoading(true)
    const result = await listCompletedValuations(valuationsCursor)
    if (result.ok) {
      setCompletedValuations((current) => [...current, ...result.valuations])
      setValuationsCursor(result.cursor)
      setValuationsHasMore(result.hasMore)
      setError('')
    } else {
      setError(result.message)
    }
    setIsLoading(false)
  }

  const handleDeleteValuation = async (nextValuationId) => {
    if (!isAdmin) {
      return
    }

    setDeleteValuationId(nextValuationId)
  }

  const confirmDeleteValuation = async () => {
    if (!deleteValuationId) {
      return
    }

    const result = await deleteValuationById(deleteValuationId)

    if (!result.ok) {
      setError(result.message)
      setDeleteValuationId('')
      return
    }

    setError('')

    if (valuation?.id === deleteValuationId || valuationId === deleteValuationId) {
      setDeleteValuationId('')
      navigate('/app/expedientes')
      return
    }

    setCompletedValuations((previous) => previous.filter((item) => item.id !== deleteValuationId))
    setDeleteValuationId('')
  }

  return (
    <section className="module-screen">
      <div className="module-screen-head">
        <button type="button" className="main-button secondary" onClick={() => navigate('/app')}>
          Regresar al menú principal
        </button>
        <div>
          <h1>Expedientes</h1>
          <p className="subtitle">Solo visualización de valoraciones finalizadas.</p>
        </div>
      </div>

      {isLoading ? <p className="subtitle">Cargando expediente...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!isLoading && !valuationId && completedValuations.length === 0 && !error ? (
        <p className="subtitle">No hay expedientes completados todavía.</p>
      ) : null}

      {!isLoading && !valuationId && completedValuations.length > 0 ? (
        <div className="valuation-grid">
          <div className="selection-card valuation-field-large">
            <p className="selection-title">Expedientes completados</p>
            <ul className="users-list valuations-list">
              {completedValuations.map((item) => (
                <li key={item.id} className="user-row valuation-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{item.clienteNombre || 'Cliente sin nombre'}</strong>
                    <p className="subtitle">{formatListDate(item.updatedAtMs)}</p>
                    <p className="subtitle">Motivo de consulta: {formatConsultationReason(item.step2)}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="main-button"
                      onClick={() => handleExportFromList(item.id)}
                      disabled={isExporting}
                    >
                      {isExporting ? 'Exportando...' : '📄 Imprimir informe'}
                    </button>
                    <button
                      type="button"
                      className="main-button secondary"
                      onClick={() => handleDownloadSignedConsent(item)}
                      disabled={!hasSignedConsent(item)}
                      title={!hasSignedConsent(item) ? 'Este expediente no tiene ambas firmas' : ''}
                    >
                      Consentimiento firmado
                    </button>
                    {isAdmin ? (
                      <button
                        type="button"
                        className="main-button danger"
                        onClick={() => handleDeleteValuation(item.id)}
                      >
                        Eliminar
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {!valuationId && valuationsHasMore ? (
        <button type="button" className="main-button secondary load-more-button" onClick={loadMoreCompletedValuations} disabled={isLoading}>
          {isLoading ? 'Cargando...' : 'Cargar más expedientes'}
        </button>
      ) : null}

      {!isLoading && valuation ? (
        <div className="valuation-grid">
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>Detalles del Expediente</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="main-button"
                onClick={handleExportPDF}
                disabled={isExporting}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  opacity: isExporting ? 0.6 : 1,
                  cursor: isExporting ? 'not-allowed' : 'pointer',
                }}
              >
                {isExporting ? 'Exportando...' : '📄 Exportar Informe'}
              </button>
              <button
                type="button"
                className="main-button secondary"
                onClick={() => handleDownloadSignedConsent(valuation)}
                disabled={!hasSignedConsent(valuation)}
                title={!hasSignedConsent(valuation) ? 'Este expediente no tiene ambas firmas' : ''}
              >
                Consentimiento firmado
              </button>
              {isAdmin ? (
                <button
                  type="button"
                  className="main-button danger"
                  onClick={() => handleDeleteValuation(valuation.id)}
                >
                  Eliminar expediente
                </button>
              ) : null}
            </div>
          </div>

          <div className="selection-card valuation-field-large">
            <p className="selection-title">Cliente</p>
            <p><strong>Nombre:</strong> {valuation.clienteNombre || 'Sin nombre'}</p>
            <p><strong>ID cliente:</strong> {valuation.clienteId || 'Sin cliente asociado'}</p>
            <p><strong>Estado:</strong> {valuation.status}</p>
          </div>

          <div className="selection-card valuation-field-large">
            <p className="selection-title">Datos del cliente</p>
            <p><strong>Nombre completo:</strong> {renderClientFullName()}</p>
            <p><strong>Edad:</strong> {valuation.step1?.edad || 'No especificado'}</p>
            <p><strong>Fecha de nacimiento:</strong> {valuation.step1?.fechaNacimiento || 'No especificado'}</p>
            <p><strong>Teléfono:</strong> {valuation.step1?.teléfono || 'No especificado'}</p>
            <p><strong>Correo electrónico:</strong> {valuation.step1?.correoElectronico || 'No especificado'}</p>
            <p><strong>Ocupación:</strong> {valuation.step1?.ocupacion || 'No especificado'}</p>
            <p><strong>Contacto de emergencia:</strong> {valuation.step1?.contactoEmergencia || 'No especificado'}</p>
          </div>

          <div className="selection-card valuation-field-large">
            <p className="selection-title">Motivo de consulta</p>
            <p><strong>Motivos faciales:</strong> {Array.isArray(valuation.step2?.motivosFaciales) ? valuation.step2.motivosFaciales.join(', ') : 'No registrado'}</p>
            <p><strong>Motivos corporales:</strong> {Array.isArray(valuation.step2?.motivosCorporales) ? valuation.step2.motivosCorporales.join(', ') : 'No registrado'}</p>
          </div>

          <div className="selection-card valuation-field-large">
            <p className="selection-title">Expectativas y prioridades</p>
            <p><strong>Mejora principal:</strong> {valuation.step3?.mejoraPrincipal || 'No registrado'}</p>
            <p><strong>Resultado esperado:</strong> {valuation.step3?.resultadoEsperado || 'No registrado'}</p>
            <p><strong>Tiempo esperado:</strong> {valuation.step3?.tiempoEsperado || 'No registrado'}</p>
          </div>

          {Array.isArray(valuation.protocolProducts) && valuation.protocolProducts.length > 0 ? (
            <div className="selection-card valuation-field-large">
              <p className="selection-title">Protocolo de productos</p>
              {valuation.protocolProducts.map((product, index) => (
                <div key={`${product.name}-${index}`} className="protocol-product-item">
                  <div>
                    <strong>{product.name || 'Sin nombre'}</strong>
                    <p>{product.use || 'Sin uso registrado'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {deleteValuationId ? (
        <div className="selection-modal-backdrop" onClick={() => setDeleteValuationId('')}>
          <div className="selection-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="selection-modal-head">
              <h3 className="consultation-block-title">Eliminar expediente</h3>
              <button type="button" className="main-button secondary" onClick={() => setDeleteValuationId('')}>
                Cerrar
              </button>
            </div>
            <p className="subtitle">Seguro que deseas eliminar este expediente? Esta accion no se puede deshacer.</p>
            <div className="valuation-actions">
              <button type="button" className="main-button secondary" onClick={() => setDeleteValuationId('')}>
                Cancelar
              </button>
              <button type="button" className="main-button danger" onClick={confirmDeleteValuation}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default ExpedientesView
