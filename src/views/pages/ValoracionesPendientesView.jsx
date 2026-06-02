import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthController } from '../../controllers/authController.jsx'
import {
  getValuationProgressLabel,
  listPendingValuations,
  saveInteractiveMapData,
} from '../../models/valuationModel.js'
import mapaCorporalImage from '../../img/mapainteractivo/mapacorporal.jpeg'
import mapaFacialImage from '../../img/mapainteractivo/mapafacial.jpeg'

const CUTANEO_OPTIONS = [
  {
    value: 'verde',
    label: 'Verde',
    description: 'Piel estable y apta para procedimientos.',
    color: '#2d8b57',
  },
  {
    value: 'amarillo',
    label: 'Amarillo',
    description: 'Piel sensible o sensibilizada.',
    color: '#d39a27',
  },
  {
    value: 'rojo',
    label: 'Rojo',
    description: 'Piel contraindicada para procedimientos agresivos.',
    color: '#b04135',
  },
]

const MAPA_INTERACTIVO_OPTIONS = {
  facial: {
    label: 'Facial',
    image: mapaFacialImage,
  },
  corporal: {
    label: 'Corporal',
    image: mapaCorporalImage,
  },
}

const MAPA_COLOR_OPTIONS = ['#d14836', '#2d8b57', '#d39a27', '#2f6ec7', '#7b49a3', '#2d2d2d']
const MAPA_DEFAULT_COLOR = '#d14836'
const MAPA_DEFAULT_BRUSH_SIZE = 8
const MAPA_MIN_ZOOM = 1
const MAPA_MAX_ZOOM = 2.8

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

const normalizeInteractiveMapPoint = (point) => {
  const x = Number(point?.x)
  const y = Number(point?.y)

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null
  }

  return {
    x: clamp(x, 0, 1),
    y: clamp(y, 0, 1),
  }
}

const normalizeInteractiveMapStrokes = (strokes) => {
  if (!Array.isArray(strokes)) {
    return []
  }

  return strokes
    .map((stroke) => {
      const color = String(stroke?.color || MAPA_DEFAULT_COLOR)
      const sizeValue = Number(stroke?.size)
      const size = Number.isFinite(sizeValue) ? clamp(sizeValue, 2, 32) : MAPA_DEFAULT_BRUSH_SIZE
      const points = Array.isArray(stroke?.points)
        ? stroke.points.map(normalizeInteractiveMapPoint).filter(Boolean)
        : []

      if (points.length === 0) {
        return null
      }

      return {
        color,
        size,
        points,
      }
    })
    .filter(Boolean)
}

const resolveMapStrokesByType = (valuation, savedBySession) => {
  const remoteMap = valuation?.mapaInteractivo || {}
  const sessionMap = savedBySession || {}

  return {
    facial: normalizeInteractiveMapStrokes(sessionMap.facial ?? remoteMap?.facial?.strokes),
    corporal: normalizeInteractiveMapStrokes(sessionMap.corporal ?? remoteMap?.corporal?.strokes),
  }
}

function ValoracionesPendientesView() {
  const navigate = useNavigate()
  const { currentUser } = useAuthController()
  const [pendingValuations, setPendingValuations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [cutaneoSelections, setCutaneoSelections] = useState({})
  const [cutaneoModal, setCutaneoModal] = useState({
    open: false,
    valuationId: '',
    selected: '',
  })
  const [mapaSavedByValuation, setMapaSavedByValuation] = useState({})
  const [mapaModal, setMapaModal] = useState({
    open: false,
    valuationId: '',
    selected: '',
    zoom: MAPA_MIN_ZOOM,
    brushColor: MAPA_DEFAULT_COLOR,
    brushSize: MAPA_DEFAULT_BRUSH_SIZE,
    strokesByType: {
      facial: [],
      corporal: [],
    },
    isSaving: false,
    error: '',
  })

  const mapaImageRef = useRef(null)
  const mapaCanvasRef = useRef(null)
  const mapaCanvasMetaRef = useRef({
    cssWidth: 0,
    cssHeight: 0,
    ratio: 1,
  })
  const mapaDrawingRef = useRef({
    isDrawing: false,
    currentStroke: null,
  })

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

  const openCutaneoModal = (valuationId) => {
    setCutaneoModal({
      open: true,
      valuationId,
      selected: cutaneoSelections[valuationId] ?? '',
    })
  }

  const closeCutaneoModal = () => {
    setCutaneoModal({
      open: false,
      valuationId: '',
      selected: '',
    })
  }

  const selectCutaneoOption = (value) => {
    setCutaneoModal((previous) => ({
      ...previous,
      selected: value,
    }))
  }

  const confirmCutaneoSelection = () => {
    if (!cutaneoModal.valuationId || !cutaneoModal.selected) {
      return
    }

    setCutaneoSelections((previous) => ({
      ...previous,
      [cutaneoModal.valuationId]: cutaneoModal.selected,
    }))

    closeCutaneoModal()
  }

  const resetMapaDrawingState = () => {
    mapaDrawingRef.current = {
      isDrawing: false,
      currentStroke: null,
    }
  }

  const openMapaModal = (valuation) => {
    const initialStrokesByType = resolveMapStrokesByType(
      valuation,
      mapaSavedByValuation[valuation.id],
    )

    resetMapaDrawingState()
    setMapaModal({
      open: true,
      valuationId: valuation.id,
      selected: 'facial',
      zoom: MAPA_MIN_ZOOM,
      brushColor: MAPA_DEFAULT_COLOR,
      brushSize: MAPA_DEFAULT_BRUSH_SIZE,
      strokesByType: initialStrokesByType,
      isSaving: false,
      error: '',
    })
  }

  const closeMapaModal = () => {
    resetMapaDrawingState()
    setMapaModal({
      open: false,
      valuationId: '',
      selected: '',
      zoom: MAPA_MIN_ZOOM,
      brushColor: MAPA_DEFAULT_COLOR,
      brushSize: MAPA_DEFAULT_BRUSH_SIZE,
      strokesByType: {
        facial: [],
        corporal: [],
      },
      isSaving: false,
      error: '',
    })
  }

  const selectMapaOption = (value) => {
    resetMapaDrawingState()
    setMapaModal((previous) => ({
      ...previous,
      selected: value,
      error: '',
    }))
  }

  const setMapaZoom = (nextZoom) => {
    const normalizedZoom = clamp(nextZoom, MAPA_MIN_ZOOM, MAPA_MAX_ZOOM)
    setMapaModal((previous) => ({
      ...previous,
      zoom: normalizedZoom,
    }))
  }

  const drawStrokeOnCanvas = useCallback((ctx, stroke) => {
    const meta = mapaCanvasMetaRef.current

    if (!ctx || !meta.cssWidth || !meta.cssHeight) {
      return
    }

    const ratio = meta.ratio
    const points = Array.isArray(stroke?.points) ? stroke.points : []

    if (points.length === 0) {
      return
    }

    const toCanvasX = (value) => value * meta.cssWidth * ratio
    const toCanvasY = (value) => value * meta.cssHeight * ratio

    ctx.strokeStyle = stroke.color || MAPA_DEFAULT_COLOR
    ctx.fillStyle = stroke.color || MAPA_DEFAULT_COLOR
    ctx.lineWidth = (stroke.size || MAPA_DEFAULT_BRUSH_SIZE) * ratio
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (points.length === 1) {
      const point = points[0]
      ctx.beginPath()
      ctx.arc(toCanvasX(point.x), toCanvasY(point.y), ctx.lineWidth / 2, 0, Math.PI * 2)
      ctx.fill()
      return
    }

    ctx.beginPath()
    ctx.moveTo(toCanvasX(points[0].x), toCanvasY(points[0].y))

    for (let index = 1; index < points.length; index += 1) {
      ctx.lineTo(toCanvasX(points[index].x), toCanvasY(points[index].y))
    }

    ctx.stroke()
  }, [])

  const redrawMapaCanvas = useCallback(() => {
    if (!mapaModal.open || !mapaModal.selected) {
      return
    }

    const imageElement = mapaImageRef.current
    const canvasElement = mapaCanvasRef.current

    if (!imageElement || !canvasElement) {
      return
    }

    const imageWidth = imageElement.clientWidth
    const imageHeight = imageElement.clientHeight

    if (!imageWidth || !imageHeight) {
      return
    }

    const ratio = window.devicePixelRatio || 1
    const nextWidth = Math.round(imageWidth * ratio)
    const nextHeight = Math.round(imageHeight * ratio)

    if (canvasElement.width !== nextWidth || canvasElement.height !== nextHeight) {
      canvasElement.width = nextWidth
      canvasElement.height = nextHeight
      canvasElement.style.width = `${imageWidth}px`
      canvasElement.style.height = `${imageHeight}px`
    }

    mapaCanvasMetaRef.current = {
      cssWidth: imageWidth,
      cssHeight: imageHeight,
      ratio,
    }

    const context = canvasElement.getContext('2d')

    if (!context) {
      return
    }

    context.clearRect(0, 0, canvasElement.width, canvasElement.height)

    const strokes = mapaModal.strokesByType[mapaModal.selected] || []
    strokes.forEach((stroke) => drawStrokeOnCanvas(context, stroke))
  }, [drawStrokeOnCanvas, mapaModal.open, mapaModal.selected, mapaModal.strokesByType])

  useEffect(() => {
    if (!mapaModal.open || !mapaModal.selected) {
      return undefined
    }

    const frame = requestAnimationFrame(() => {
      redrawMapaCanvas()
    })

    const onResize = () => {
      redrawMapaCanvas()
    }

    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
    }
  }, [mapaModal.open, mapaModal.selected, mapaModal.zoom, redrawMapaCanvas])

  const getNormalizedPointFromEvent = (event) => {
    const canvasElement = mapaCanvasRef.current

    if (!canvasElement) {
      return null
    }

    const rect = canvasElement.getBoundingClientRect()

    if (!rect.width || !rect.height) {
      return null
    }

    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height

    return {
      x: clamp(x, 0, 1),
      y: clamp(y, 0, 1),
    }
  }

  const drawSegmentPreview = (fromPoint, toPoint, color, size) => {
    const canvasElement = mapaCanvasRef.current

    if (!canvasElement) {
      return
    }

    const context = canvasElement.getContext('2d')

    if (!context) {
      return
    }

    drawStrokeOnCanvas(context, {
      color,
      size,
      points: [fromPoint, toPoint],
    })
  }

  const startMapaDrawing = (event) => {
    if (!mapaModal.open || !mapaModal.selected || mapaModal.isSaving) {
      return
    }

    event.preventDefault()
    const point = getNormalizedPointFromEvent(event)

    if (!point) {
      return
    }

    resetMapaDrawingState()
    mapaDrawingRef.current = {
      isDrawing: true,
      currentStroke: {
        color: mapaModal.brushColor,
        size: mapaModal.brushSize,
        points: [point],
      },
    }

    if (event.currentTarget?.setPointerCapture && event.pointerId != null) {
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        // Ignore capture errors in unsupported browsers.
      }
    }

    drawSegmentPreview(point, point, mapaModal.brushColor, mapaModal.brushSize)
  }

  const moveMapaDrawing = (event) => {
    const drawingState = mapaDrawingRef.current

    if (!drawingState.isDrawing || !drawingState.currentStroke) {
      return
    }

    event.preventDefault()
    const nextPoint = getNormalizedPointFromEvent(event)

    if (!nextPoint) {
      return
    }

    const points = drawingState.currentStroke.points
    const previousPoint = points[points.length - 1]
    points.push(nextPoint)
    drawSegmentPreview(previousPoint, nextPoint, drawingState.currentStroke.color, drawingState.currentStroke.size)
  }

  const endMapaDrawing = (event) => {
    const drawingState = mapaDrawingRef.current

    if (!drawingState.currentStroke || !drawingState.isDrawing) {
      return
    }

    event.preventDefault()
    const finishedStroke = {
      color: drawingState.currentStroke.color,
      size: drawingState.currentStroke.size,
      points: drawingState.currentStroke.points,
    }

    setMapaModal((previous) => {
      const previousStrokes = previous.strokesByType[previous.selected] || []

      return {
        ...previous,
        strokesByType: {
          ...previous.strokesByType,
          [previous.selected]: [...previousStrokes, finishedStroke],
        },
      }
    })

    if (event.currentTarget?.releasePointerCapture && event.pointerId != null) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId)
      } catch {
        // Ignore capture errors in unsupported browsers.
      }
    }

    resetMapaDrawingState()
  }

  const undoLastMapaStroke = () => {
    setMapaModal((previous) => {
      const currentStrokes = previous.strokesByType[previous.selected] || []

      if (currentStrokes.length === 0) {
        return previous
      }

      return {
        ...previous,
        strokesByType: {
          ...previous.strokesByType,
          [previous.selected]: currentStrokes.slice(0, -1),
        },
      }
    })
  }

  const clearMapaStrokes = () => {
    setMapaModal((previous) => ({
      ...previous,
      strokesByType: {
        ...previous.strokesByType,
        [previous.selected]: [],
      },
    }))
  }

  const saveMapaStrokes = async () => {
    const valuationId = mapaModal.valuationId
    const selectedType = mapaModal.selected
    const strokesToSave = mapaModal.strokesByType[selectedType] || []

    if (!valuationId || !selectedType) {
      return
    }

    setMapaModal((previous) => ({
      ...previous,
      isSaving: true,
      error: '',
    }))

    const result = await saveInteractiveMapData({
      valuationId,
      mapType: selectedType,
      strokes: strokesToSave,
    })

    if (!result.ok) {
      setMapaModal((previous) => ({
        ...previous,
        isSaving: false,
        error: result.message,
      }))
      return
    }

    setMapaSavedByValuation((previous) => ({
      ...previous,
      [valuationId]: {
        ...(previous[valuationId] || {}),
        [selectedType]: strokesToSave,
      },
    }))

    closeMapaModal()
  }

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
          {pendingValuations.map((valuation) => {
            const selectedOption = CUTANEO_OPTIONS.find(
              (option) => option.value === cutaneoSelections[valuation.id],
            )
            const cutaneoButtonText = selectedOption
              ? `SEMAFORO ${selectedOption.label.toUpperCase()}`
              : 'SEMAFORO CUTANEO'

            const mapStrokesByType = resolveMapStrokesByType(
              valuation,
              mapaSavedByValuation[valuation.id],
            )
            const hasMapData = mapStrokesByType.facial.length > 0 || mapStrokesByType.corporal.length > 0

            return (
              <li className="user-row valuation-row" key={valuation.id}>
                <div>
                  <strong>{valuation.clienteNombre || 'Cliente sin nombre'}</strong>
                  <small className="small-tag">{getValuationProgressLabel(valuation)}</small>
                </div>

                <div className="row-actions pending-valuation-actions">
                  <button
                    type="button"
                    className="main-button pending-action-button"
                    onClick={() => navigate(`/app/nueva-valoracion/${valuation.id}`)}
                  >
                    <span className="pending-action-content">
                      <svg className="pending-action-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path
                          d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0 0-3L17.5 5a2.1 2.1 0 0 0-3 0L4 15.5V20z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M13.5 6.5l4 4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span>EDITAR</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    className="main-button secondary pending-action-button"
                    onClick={() => openCutaneoModal(valuation.id)}
                  >
                    <span className="pending-action-content">
                      <svg className="pending-action-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <rect
                          x="7"
                          y="3"
                          width="10"
                          height="18"
                          rx="3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                        <circle cx="12" cy="7" r="1.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
                        <circle cx="12" cy="12" r="1.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
                        <circle cx="12" cy="17" r="1.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      </svg>
                      <span>{cutaneoButtonText}</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    className="main-button secondary pending-action-button"
                    onClick={() => openMapaModal(valuation)}
                  >
                    <span className="pending-action-content">
                      <svg className="pending-action-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path
                          d="M3 6.5l6-2.5 6 2.5 6-2.5v13l-6 2.5-6-2.5-6 2.5v-13z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M9 4v13M15 6.5v13"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span>{hasMapData ? 'MAPA INTERACTIVO (EDITADO)' : 'MAPA INTERACTIVO'}</span>
                    </span>
                  </button>

                  <button type="button" className="main-button secondary pending-action-button">
                    <span className="pending-action-content">
                      <svg className="pending-action-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path
                          d="M4 8h4l1.4-2h5.2L16 8h4v11H4V8z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                        <circle cx="12" cy="13.5" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      </svg>
                      <span>FOTOGRAFIAS</span>
                    </span>
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}

      {cutaneoModal.open ? (
        <div className="selection-modal-backdrop" onClick={closeCutaneoModal}>
          <div
            className="selection-modal semaforo-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Semaforo cutaneo"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="selection-modal-head">
              <h3 className="consultation-block-title">Semaforo cutaneo</h3>
              <button type="button" className="main-button secondary" onClick={closeCutaneoModal}>
                Cerrar
              </button>
            </div>

            <div className="semaforo-options-grid">
              {CUTANEO_OPTIONS.map((option) => {
                const isSelected = cutaneoModal.selected === option.value

                return (
                  <button
                    type="button"
                    key={option.value}
                    className={`semaforo-option-card ${isSelected ? 'semaforo-option-card-selected' : ''}`}
                    onClick={() => selectCutaneoOption(option.value)}
                  >
                    <span
                      className="semaforo-option-marker"
                      style={{ backgroundColor: option.color }}
                      aria-hidden="true"
                    />
                    <span className="semaforo-option-content">
                      <strong>{option.label}</strong>
                      <span>{option.description}</span>
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="valuation-actions">
              <button type="button" className="main-button secondary" onClick={closeCutaneoModal}>
                Cancelar
              </button>
              <button
                type="button"
                className="main-button"
                disabled={!cutaneoModal.selected}
                onClick={confirmCutaneoSelection}
              >
                Guardar seleccion
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {mapaModal.open ? (
        <div className="selection-modal-backdrop" onClick={closeMapaModal}>
          <div
            className="selection-modal mapa-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Mapa interactivo"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="selection-modal-head">
              <h3 className="consultation-block-title">Mapa interactivo</h3>
              <button type="button" className="main-button secondary" onClick={closeMapaModal}>
                Cerrar
              </button>
            </div>

            <div className="mapa-type-toggle">
              <button
                type="button"
                className={`main-button secondary mapa-type-button ${mapaModal.selected === 'facial' ? 'mapa-type-button-active' : ''}`}
                onClick={() => selectMapaOption('facial')}
              >
                Facial
              </button>
              <button
                type="button"
                className={`main-button secondary mapa-type-button ${mapaModal.selected === 'corporal' ? 'mapa-type-button-active' : ''}`}
                onClick={() => selectMapaOption('corporal')}
              >
                Corporal
              </button>
            </div>

            {mapaModal.selected ? (
              <>
                <div className="mapa-editor-toolbar">
                  <div className="mapa-color-palette">
                    {MAPA_COLOR_OPTIONS.map((color) => (
                      <button
                        key={`mapa-color-${color}`}
                        type="button"
                        className={`mapa-color-chip ${mapaModal.brushColor === color ? 'mapa-color-chip-active' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setMapaModal((previous) => ({ ...previous, brushColor: color }))}
                        aria-label={`Color ${color}`}
                      />
                    ))}
                  </div>

                  <label className="mapa-brush-size">
                    Grosor
                    <input
                      type="range"
                      min="2"
                      max="24"
                      step="1"
                      value={mapaModal.brushSize}
                      onChange={(event) =>
                        setMapaModal((previous) => ({
                          ...previous,
                          brushSize: Number(event.target.value),
                        }))}
                    />
                  </label>

                  <div className="mapa-zoom-controls">
                    <button
                      type="button"
                      className="main-button secondary"
                      onClick={() => setMapaZoom(mapaModal.zoom - 0.2)}
                    >
                      -
                    </button>
                    <span className="small-tag">Zoom {Math.round(mapaModal.zoom * 100)}%</span>
                    <button
                      type="button"
                      className="main-button secondary"
                      onClick={() => setMapaZoom(mapaModal.zoom + 0.2)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="mapa-canvas-scroll">
                  <div className="mapa-canvas-stage" style={{ width: `${mapaModal.zoom * 100}%` }}>
                    <img
                      ref={mapaImageRef}
                      className="mapa-base-image"
                      src={MAPA_INTERACTIVO_OPTIONS[mapaModal.selected].image}
                      alt={`Mapa ${MAPA_INTERACTIVO_OPTIONS[mapaModal.selected].label}`}
                      onLoad={redrawMapaCanvas}
                    />
                    <canvas
                      ref={mapaCanvasRef}
                      className="mapa-draw-canvas"
                      onPointerDown={startMapaDrawing}
                      onPointerMove={moveMapaDrawing}
                      onPointerUp={endMapaDrawing}
                      onPointerCancel={endMapaDrawing}
                      onPointerLeave={endMapaDrawing}
                    />
                  </div>
                </div>

                <p className="subtitle">Dibuja con el dedo o mouse sobre la imagen para marcar zonas.</p>

                {mapaModal.error ? <p className="error-text">{mapaModal.error}</p> : null}

                <div className="valuation-actions">
                  <button
                    type="button"
                    className="main-button secondary"
                    onClick={undoLastMapaStroke}
                    disabled={(mapaModal.strokesByType[mapaModal.selected] || []).length === 0 || mapaModal.isSaving}
                  >
                    Deshacer
                  </button>
                  <button
                    type="button"
                    className="main-button danger"
                    onClick={clearMapaStrokes}
                    disabled={(mapaModal.strokesByType[mapaModal.selected] || []).length === 0 || mapaModal.isSaving}
                  >
                    Limpiar
                  </button>
                  <button
                    type="button"
                    className="main-button"
                    onClick={saveMapaStrokes}
                    disabled={mapaModal.isSaving}
                  >
                    {mapaModal.isSaving ? 'Guardando...' : 'Guardar mapa'}
                  </button>
                </div>
              </>
            ) : (
              <p className="subtitle">Selecciona Facial o Corporal para comenzar a editar.</p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default ValoracionesPendientesView
