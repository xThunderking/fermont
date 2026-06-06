import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthController } from '../../controllers/authController.jsx'
import {
  CLINICAL_PHOTO_PARTS,
  getValuationProgressLabel,
  listPendingValuations,
  saveClinicalPhotosData,
  saveInteractiveMapData,
  uploadClinicalPhoto,
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

const MAPA_COLOR_OPTIONS = [
  { value: '#d14836', label: 'Rojo' },
  { value: '#2d8b57', label: 'Verde' },
  { value: '#d39a27', label: 'Amarillo' },
  { value: '#2f6ec7', label: 'Azul' },
  { value: '#7b49a3', label: 'Morado' },
  { value: '#2d2d2d', label: 'Negro' },
]
const MAPA_BRUSH_SIZE_OPTIONS = [4, 8, 12, 16, 20]
const MAPA_DEFAULT_COLOR = '#d14836'
const MAPA_DEFAULT_BRUSH_SIZE = 8
const MAPA_MIN_ZOOM = 1
const MAPA_MAX_ZOOM = 2.8
const CLINICAL_PHOTO_MAX_SIZE_MB = 12
const CLINICAL_PHOTO_TYPES = ['facial', 'corporal']
const CLINICAL_PHOTO_MOMENTS = ['antes', 'despues']
const CLINICAL_PHOTO_MOMENT_LABELS = {
  antes: 'Antes',
  despues: 'Despues',
}
const CLINICAL_PHOTO_TYPE_OPTIONS = {
  facial: {
    label: 'Facial',
    parts: [
      { value: 'frente', label: 'Frente' },
      { value: 'perfilDerecho', label: 'Perfil derecho' },
      { value: 'perfilIzquierdo', label: 'Perfil izquierdo' },
    ],
  },
  corporal: {
    label: 'Corporal',
    parts: [
      { value: 'frente', label: 'Frente' },
      { value: 'espalda', label: 'Espalda' },
      { value: 'laterales', label: 'Laterales' },
    ],
  },
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

const createEmptyClinicalPhotosByType = () => ({
  facial: {
    frente: { antes: null, despues: null },
    perfilDerecho: { antes: null, despues: null },
    perfilIzquierdo: { antes: null, despues: null },
  },
  corporal: {
    frente: { antes: null, despues: null },
    espalda: { antes: null, despues: null },
    laterales: { antes: null, despues: null },
  },
})

const createEmptyClinicalDraftsByType = () => ({
  facial: {
    frente: { antes: null, despues: null },
    perfilDerecho: { antes: null, despues: null },
    perfilIzquierdo: { antes: null, despues: null },
  },
  corporal: {
    frente: { antes: null, despues: null },
    espalda: { antes: null, despues: null },
    laterales: { antes: null, despues: null },
  },
})

const normalizeClinicalPhotoFile = (photo) => {
  const url = String(photo?.url || '').trim()

  if (!url) {
    return null
  }

  const path = String(photo?.path || '').trim()
  const name = String(photo?.name || '').trim()
  const updatedAtMsValue = Number(photo?.updatedAtMs)

  return {
    url,
    path,
    name,
    updatedAtMs: Number.isFinite(updatedAtMsValue) ? Math.max(0, Math.trunc(updatedAtMsValue)) : Date.now(),
  }
}

const normalizeClinicalPhotosByType = (photosByType) => {
  const normalized = createEmptyClinicalPhotosByType()

  CLINICAL_PHOTO_TYPES.forEach((photoType) => {
    CLINICAL_PHOTO_PARTS[photoType].forEach((part) => {
      CLINICAL_PHOTO_MOMENTS.forEach((moment) => {
        normalized[photoType][part][moment] = normalizeClinicalPhotoFile(
          photosByType?.[photoType]?.[part]?.[moment],
        )
      })
    })
  })

  return normalized
}

const cloneClinicalPhotosByType = (photosByType) => normalizeClinicalPhotosByType(photosByType)

const resolveClinicalPhotosByType = (valuation, savedBySession) => {
  const remotePhotos = normalizeClinicalPhotosByType(valuation?.fotografiasClinicas)
  const sessionPhotos = normalizeClinicalPhotosByType(savedBySession)

  const resolved = createEmptyClinicalPhotosByType()

  CLINICAL_PHOTO_TYPES.forEach((photoType) => {
    CLINICAL_PHOTO_PARTS[photoType].forEach((part) => {
      CLINICAL_PHOTO_MOMENTS.forEach((moment) => {
        resolved[photoType][part][moment] =
          sessionPhotos[photoType][part][moment] ?? remotePhotos[photoType][part][moment]
      })
    })
  })

  return resolved
}

const hasClinicalPhotoData = (photosByType) =>
  CLINICAL_PHOTO_TYPES.some((photoType) =>
    CLINICAL_PHOTO_PARTS[photoType].some((part) =>
      CLINICAL_PHOTO_MOMENTS.some((moment) => Boolean(photosByType?.[photoType]?.[part]?.[moment]?.url))),
  )

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error('No se pudo leer la imagen.'))
    }

    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'))
    reader.readAsDataURL(file)
  })

const getTouchDistance = (touches) => {
  if (!touches || touches.length < 2) {
    return 0
  }

  const firstTouch = touches[0]
  const secondTouch = touches[1]
  const distanceX = firstTouch.clientX - secondTouch.clientX
  const distanceY = firstTouch.clientY - secondTouch.clientY

  return Math.hypot(distanceX, distanceY)
}

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
  const [clinicalPhotosSavedByValuation, setClinicalPhotosSavedByValuation] = useState({})
  const [mapaModal, setMapaModal] = useState({
    open: false,
    valuationId: '',
    selected: '',
    zoom: MAPA_MIN_ZOOM,
    markerEnabled: true,
    brushColor: MAPA_DEFAULT_COLOR,
    brushSize: MAPA_DEFAULT_BRUSH_SIZE,
    strokesByType: {
      facial: [],
      corporal: [],
    },
    isSaving: false,
    error: '',
  })
  const [fotosModal, setFotosModal] = useState({
    open: false,
    valuationId: '',
    selectedType: 'facial',
    photosByType: createEmptyClinicalPhotosByType(),
    draftsByType: createEmptyClinicalDraftsByType(),
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
  const mapaInteractionRef = useRef({
    isPinching: false,
    pinchStartDistance: 0,
    pinchStartZoom: MAPA_MIN_ZOOM,
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
    mapaInteractionRef.current = {
      isPinching: false,
      pinchStartDistance: 0,
      pinchStartZoom: MAPA_MIN_ZOOM,
    }
    setMapaModal({
      open: true,
      valuationId: valuation.id,
      selected: 'facial',
      zoom: MAPA_MIN_ZOOM,
      markerEnabled: true,
      brushColor: MAPA_DEFAULT_COLOR,
      brushSize: MAPA_DEFAULT_BRUSH_SIZE,
      strokesByType: initialStrokesByType,
      isSaving: false,
      error: '',
    })
  }

  const closeMapaModal = () => {
    resetMapaDrawingState()
    mapaInteractionRef.current = {
      isPinching: false,
      pinchStartDistance: 0,
      pinchStartZoom: MAPA_MIN_ZOOM,
    }
    setMapaModal({
      open: false,
      valuationId: '',
      selected: '',
      zoom: MAPA_MIN_ZOOM,
      markerEnabled: true,
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

  const openFotosModal = (valuation) => {
    const initialPhotosByType = resolveClinicalPhotosByType(
      valuation,
      clinicalPhotosSavedByValuation[valuation.id],
    )

    setFotosModal({
      open: true,
      valuationId: valuation.id,
      selectedType: 'facial',
      photosByType: initialPhotosByType,
      draftsByType: createEmptyClinicalDraftsByType(),
      isSaving: false,
      error: '',
    })
  }

  const closeFotosModal = () => {
    setFotosModal({
      open: false,
      valuationId: '',
      selectedType: 'facial',
      photosByType: createEmptyClinicalPhotosByType(),
      draftsByType: createEmptyClinicalDraftsByType(),
      isSaving: false,
      error: '',
    })
  }

  useEffect(() => {
    const layoutHiddenClass = 'mapa-interactivo-open'

    if (mapaModal.open || fotosModal.open) {
      document.body.classList.add(layoutHiddenClass)
    } else {
      document.body.classList.remove(layoutHiddenClass)
    }

    return () => {
      document.body.classList.remove(layoutHiddenClass)
    }
  }, [fotosModal.open, mapaModal.open])

  const selectMapaOption = (value) => {
    resetMapaDrawingState()
    mapaInteractionRef.current = {
      isPinching: false,
      pinchStartDistance: 0,
      pinchStartZoom: mapaModal.zoom,
    }
    setMapaModal((previous) => ({
      ...previous,
      selected: value,
      error: '',
    }))
  }

  const selectFotoType = (value) => {
    if (!CLINICAL_PHOTO_TYPES.includes(value)) {
      return
    }

    setFotosModal((previous) => ({
      ...previous,
      selectedType: value,
      error: '',
    }))
  }

  const onClinicalPhotoSelected = async ({ event, photoType, part, moment }) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    if (!String(file.type || '').toLowerCase().startsWith('image/')) {
      setFotosModal((previous) => ({
        ...previous,
        error: 'Selecciona una imagen valida para continuar.',
      }))
      return
    }

    const maxSizeBytes = CLINICAL_PHOTO_MAX_SIZE_MB * 1024 * 1024

    if (file.size > maxSizeBytes) {
      setFotosModal((previous) => ({
        ...previous,
        error: `La imagen supera ${CLINICAL_PHOTO_MAX_SIZE_MB} MB. Elige una mas ligera.`,
      }))
      return
    }

    try {
      const previewUrl = await readFileAsDataUrl(file)

      setFotosModal((previous) => ({
        ...previous,
        error: '',
        draftsByType: {
          ...previous.draftsByType,
          [photoType]: {
            ...previous.draftsByType[photoType],
            [part]: {
              ...previous.draftsByType[photoType][part],
              [moment]: {
                file,
                previewUrl,
              },
            },
          },
        },
      }))
    } catch {
      setFotosModal((previous) => ({
        ...previous,
        error: 'No se pudo cargar la vista previa de la imagen. Intenta de nuevo.',
      }))
    }
  }

  const saveClinicalPhotos = async () => {
    if (!fotosModal.valuationId) {
      return
    }

    setFotosModal((previous) => ({
      ...previous,
      isSaving: true,
      error: '',
    }))

    const nextPhotosByType = cloneClinicalPhotosByType(fotosModal.photosByType)

    for (const photoType of CLINICAL_PHOTO_TYPES) {
      for (const part of CLINICAL_PHOTO_PARTS[photoType]) {
        for (const moment of CLINICAL_PHOTO_MOMENTS) {
          const draftEntry = fotosModal.draftsByType?.[photoType]?.[part]?.[moment]

          if (!draftEntry?.file) {
            continue
          }

          const uploadResult = await uploadClinicalPhoto({
            valuationId: fotosModal.valuationId,
            photoType,
            part,
            moment,
            file: draftEntry.file,
          })

          if (!uploadResult.ok) {
            setFotosModal((previous) => ({
              ...previous,
              isSaving: false,
              error: uploadResult.message,
            }))
            return
          }

          nextPhotosByType[photoType][part][moment] = uploadResult.photo
        }
      }
    }

    const saveResult = await saveClinicalPhotosData({
      valuationId: fotosModal.valuationId,
      photosByType: nextPhotosByType,
    })

    if (!saveResult.ok) {
      setFotosModal((previous) => ({
        ...previous,
        isSaving: false,
        error: saveResult.message,
      }))
      return
    }

    setClinicalPhotosSavedByValuation((previous) => ({
      ...previous,
      [fotosModal.valuationId]: saveResult.photosByType,
    }))

    closeFotosModal()
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
    if (!mapaModal.open || !mapaModal.selected || mapaModal.isSaving || !mapaModal.markerEnabled) {
      return
    }

    if (mapaInteractionRef.current.isPinching) {
      return
    }

    if (event.pointerType === 'touch' && !event.isPrimary) {
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

    if (!drawingState.isDrawing || !drawingState.currentStroke || mapaInteractionRef.current.isPinching) {
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

    if (!drawingState.currentStroke || !drawingState.isDrawing || mapaInteractionRef.current.isPinching) {
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

  const startMapaPinch = (touches) => {
    const initialDistance = getTouchDistance(touches)

    if (!initialDistance) {
      return
    }

    resetMapaDrawingState()
    mapaInteractionRef.current = {
      isPinching: true,
      pinchStartDistance: initialDistance,
      pinchStartZoom: mapaModal.zoom,
    }
  }

  const moveMapaPinch = (touches) => {
    const interactionState = mapaInteractionRef.current

    if (!interactionState.isPinching || touches.length < 2) {
      return
    }

    const currentDistance = getTouchDistance(touches)

    if (!currentDistance || !interactionState.pinchStartDistance) {
      return
    }

    const zoomRatio = currentDistance / interactionState.pinchStartDistance
    setMapaZoom(interactionState.pinchStartZoom * zoomRatio)
  }

  const endMapaPinch = (touches) => {
    if (touches.length >= 2) {
      return
    }

    mapaInteractionRef.current = {
      isPinching: false,
      pinchStartDistance: 0,
      pinchStartZoom: mapaModal.zoom,
    }
  }

  const onMapaTouchStart = (event) => {
    if (event.touches.length === 2) {
      startMapaPinch(event.touches)
    }
  }

  const onMapaTouchMove = (event) => {
    if (!mapaModal.open || event.touches.length < 2) {
      return
    }

    if (mapaInteractionRef.current.isPinching) {
      event.preventDefault()
      moveMapaPinch(event.touches)
    }
  }

  const onMapaTouchEnd = (event) => {
    endMapaPinch(event.touches)
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
            const valuationClinicalPhotos = resolveClinicalPhotosByType(
              valuation,
              clinicalPhotosSavedByValuation[valuation.id],
            )
            const hasClinicalPhotos = hasClinicalPhotoData(valuationClinicalPhotos)

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

                  <button
                    type="button"
                    className="main-button secondary pending-action-button"
                    onClick={() => openFotosModal(valuation)}
                  >
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
                      <span>{hasClinicalPhotos ? 'FOTOGRAFIAS (EDITADO)' : 'FOTOGRAFIAS'}</span>
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

      {fotosModal.open ? (
        <div className="selection-modal-backdrop mapa-modal-backdrop" onClick={closeFotosModal}>
          <div
            className="selection-modal fotos-clinicas-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Fotografias clinicas"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="selection-modal-head">
              <h3 className="consultation-block-title">Fotografias clinicas</h3>
              <div className="fotos-modal-head-actions">
                <button
                  type="button"
                  className="fotos-close-icon-button"
                  onClick={closeFotosModal}
                  aria-label="Cerrar modal de fotografias"
                  title="Cerrar"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
                <button type="button" className="main-button secondary fotos-close-text-button" onClick={closeFotosModal}>
                  Cerrar
                </button>
              </div>
            </div>

            <p className="fotos-step-pill">Carga de fotografias {CLINICAL_PHOTO_TYPE_OPTIONS[fotosModal.selectedType].label}</p>

            <div className="fotos-tipo-toggle">
              {CLINICAL_PHOTO_TYPES.map((photoType) => (
                <button
                  type="button"
                  key={`foto-type-${photoType}`}
                  className={`main-button secondary fotos-tipo-button ${fotosModal.selectedType === photoType ? 'fotos-tipo-button-active' : ''}`}
                  onClick={() => selectFotoType(photoType)}
                >
                  {CLINICAL_PHOTO_TYPE_OPTIONS[photoType].label}
                </button>
              ))}
            </div>

            <p className="subtitle fotos-clinicas-help-text">
              Sube una foto de <strong>Antes</strong> y una de <strong>Despues</strong> por cada parte. Puedes usar
              camara o galeria.
            </p>

            <div className="fotos-partes-grid">
              {CLINICAL_PHOTO_TYPE_OPTIONS[fotosModal.selectedType].parts.map((part) => {
                const partKey = part.value

                return (
                  <section key={`foto-part-${fotosModal.selectedType}-${partKey}`} className="fotos-parte-card">
                    <h4 className="fotos-parte-title">{part.label}</h4>

                    <div className="fotos-momentos-grid">
                      {CLINICAL_PHOTO_MOMENTS.map((moment) => {
                        const savedPhoto = fotosModal.photosByType?.[fotosModal.selectedType]?.[partKey]?.[moment]
                        const draftPhoto = fotosModal.draftsByType?.[fotosModal.selectedType]?.[partKey]?.[moment]
                        const previewUrl = draftPhoto?.previewUrl || savedPhoto?.url || ''
                        const inputPrefix = `foto-${fotosModal.valuationId}-${fotosModal.selectedType}-${partKey}-${moment}`

                        return (
                          <article key={`${partKey}-${moment}`} className="fotos-momento-card">
                            <div className="fotos-momento-head">
                              <strong>{CLINICAL_PHOTO_MOMENT_LABELS[moment]}</strong>
                              {draftPhoto?.file ? (
                                <small className="small-tag">Nueva</small>
                              ) : savedPhoto?.url ? (
                                <small className="small-tag">Guardada</small>
                              ) : null}
                            </div>

                            <div className={`fotos-preview-frame ${previewUrl ? 'fotos-preview-frame-filled' : ''}`}>
                              {previewUrl ? (
                                <img src={previewUrl} alt={`${part.label} ${CLINICAL_PHOTO_MOMENT_LABELS[moment]}`} />
                              ) : (
                                <span>Sin imagen</span>
                              )}
                            </div>

                            <div className="fotos-capture-actions">
                              <label className="main-button secondary fotos-capture-button" htmlFor={`${inputPrefix}-camera`}>
                                Camara
                              </label>
                              <input
                                id={`${inputPrefix}-camera`}
                                className="fotos-hidden-input"
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={(event) =>
                                  onClinicalPhotoSelected({
                                    event,
                                    photoType: fotosModal.selectedType,
                                    part: partKey,
                                    moment,
                                  })}
                              />

                              <label className="main-button secondary fotos-capture-button" htmlFor={`${inputPrefix}-gallery`}>
                                Galeria
                              </label>
                              <input
                                id={`${inputPrefix}-gallery`}
                                className="fotos-hidden-input"
                                type="file"
                                accept="image/*"
                                onChange={(event) =>
                                  onClinicalPhotoSelected({
                                    event,
                                    photoType: fotosModal.selectedType,
                                    part: partKey,
                                    moment,
                                  })}
                              />
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  </section>
                )
              })}
            </div>

            {fotosModal.error ? <p className="error-text">{fotosModal.error}</p> : null}

            <div className="valuation-actions fotos-modal-actions">
              <button type="button" className="main-button secondary" onClick={closeFotosModal}>
                Cancelar
              </button>
              <button
                type="button"
                className="main-button"
                onClick={saveClinicalPhotos}
                disabled={fotosModal.isSaving}
              >
                {fotosModal.isSaving ? 'Guardando...' : 'Guardar fotografias'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {mapaModal.open ? (
        <div className="selection-modal-backdrop mapa-modal-backdrop" onClick={closeMapaModal}>
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
                  <button
                    type="button"
                    className={`mapa-marker-icon-button ${mapaModal.markerEnabled ? 'mapa-marker-icon-button-on' : 'mapa-marker-icon-button-off'}`}
                    onClick={() => {
                      resetMapaDrawingState()
                      mapaInteractionRef.current = {
                        isPinching: false,
                        pinchStartDistance: 0,
                        pinchStartZoom: mapaModal.zoom,
                      }
                      setMapaModal((previous) => ({
                        ...previous,
                        markerEnabled: !previous.markerEnabled,
                      }))
                    }}
                    aria-label={mapaModal.markerEnabled ? 'Desactivar marcador' : 'Activar marcador'}
                    title={mapaModal.markerEnabled ? 'Marcador activo' : 'Marcador apagado'}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path
                        d="M3 21l4.7-1.2L19 8.5a2 2 0 0 0 0-2.8l-1.8-1.8a2 2 0 0 0-2.8 0L3 15.2 1.8 20z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.95"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M13.5 4.9l5.6 5.6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.95"
                        strokeLinecap="round"
                      />
                      <path
                        d="M11.8 20h9.2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.95"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>

                  <label className="mapa-compact-field">
                    <span>Color</span>
                    <div className="mapa-compact-inline">
                      <span
                        className="mapa-color-preview"
                        style={{ backgroundColor: mapaModal.brushColor }}
                        aria-hidden="true"
                      />
                      <select
                        className="mapa-select-small"
                        value={mapaModal.brushColor}
                        onChange={(event) =>
                          setMapaModal((previous) => ({
                            ...previous,
                            brushColor: event.target.value,
                          }))}
                      >
                        {MAPA_COLOR_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </label>

                  <label className="mapa-compact-field">
                    Grosor
                    <select
                      className="mapa-select-small"
                      value={mapaModal.brushSize}
                      onChange={(event) =>
                        setMapaModal((previous) => ({
                          ...previous,
                          brushSize: Number(event.target.value),
                        }))}
                    >
                      {MAPA_BRUSH_SIZE_OPTIONS.map((sizeOption) => (
                        <option key={`brush-${sizeOption}`} value={sizeOption}>
                          {sizeOption}px
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div
                  className="mapa-canvas-scroll"
                  onTouchStart={onMapaTouchStart}
                  onTouchMove={onMapaTouchMove}
                  onTouchEnd={onMapaTouchEnd}
                  onTouchCancel={onMapaTouchEnd}
                >
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
                      className={`mapa-draw-canvas ${mapaModal.markerEnabled ? '' : 'mapa-draw-canvas-disabled'}`}
                      style={{ touchAction: mapaModal.markerEnabled ? 'none' : 'pan-x pan-y' }}
                      onPointerDown={startMapaDrawing}
                      onPointerMove={moveMapaDrawing}
                      onPointerUp={endMapaDrawing}
                      onPointerCancel={endMapaDrawing}
                      onPointerLeave={endMapaDrawing}
                    />
                  </div>
                </div>

                {mapaModal.error ? <p className="error-text">{mapaModal.error}</p> : null}

                <div className="mapa-actions">
                  <div className="mapa-actions-left">
                    <button
                      type="button"
                      className="main-button secondary mapa-icon-action-button mapa-icon-action-button-undo"
                      onClick={undoLastMapaStroke}
                      disabled={(mapaModal.strokesByType[mapaModal.selected] || []).length === 0 || mapaModal.isSaving}
                      aria-label="Deshacer"
                      title="Deshacer"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path
                          d="M9.2 14.2L4 9l5.2-5.2"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M20 19.6A8.6 8.6 0 0 0 11.4 11H4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="main-button danger mapa-icon-action-button mapa-icon-action-button-clear"
                      onClick={clearMapaStrokes}
                      disabled={(mapaModal.strokesByType[mapaModal.selected] || []).length === 0 || mapaModal.isSaving}
                      aria-label="Limpiar"
                      title="Limpiar"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path
                          d="M4 6h16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M9 6V4.8c0-.9.7-1.6 1.6-1.6h2.8c.9 0 1.6.7 1.6 1.6V6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M6.4 6l.9 12.9c.1 1 .9 1.8 1.9 1.8h5.6c1 0 1.8-.8 1.9-1.8L17.6 6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M10.2 10.1v6.5M13.8 10.1v6.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                  <button
                    type="button"
                    className="main-button mapa-save-action-button"
                    onClick={saveMapaStrokes}
                    disabled={mapaModal.isSaving}
                  >
                    {mapaModal.isSaving ? 'Guardando...' : 'Guardar'}
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
