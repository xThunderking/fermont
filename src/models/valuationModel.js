import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db } from '../services/firebase'

const VALUATIONS_COLLECTION = 'valoraciones'
const TOTAL_STEPS = 14

export const STEP_TWO_OPTIONS = {
  facial: [
    'Acne',
    'Manchas',
    'Sensibilidad',
    'Arrugas',
    'Hidratacion',
    'Poros dilatados',
    'Rosacea',
    'Textura irregular',
    'Cicatrices',
    'Flacidez',
    'Eritema',
  ],
  corporal: [
    'Celulitis',
    'Estrias',
    'Flacidez',
    'Fibrosis',
    'Grasa localizada',
    'Retencion de liquidos',
    'Acne corporal',
    'Moldeado corporal',
    'Cicatrices',
  ],
}

const normalizeText = (value) => String(value ?? '').trim()

const normalizeStepOneData = (data) => ({
  tipoCliente: data?.tipoCliente === 'recurrente' ? 'recurrente' : 'nuevo',
  clienteId: normalizeText(data?.clienteId),
  apellidoPaterno: normalizeText(data.apellidoPaterno),
  apellidoMaterno: normalizeText(data.apellidoMaterno),
  nombre: normalizeText(data.nombre),
  edad: normalizeText(data.edad),
  fechaNacimiento: normalizeText(data.fechaNacimiento),
  telefono: normalizeText(data.telefono),
  correoElectronico: normalizeText(data.correoElectronico).toLowerCase(),
  ocupacion: normalizeText(data.ocupacion),
  contactoEmergencia: normalizeText(data.contactoEmergencia),
  objetivoPrincipal: normalizeText(data.objetivoPrincipal),
  inconformidadPrincipal: normalizeText(data.inconformidadPrincipal),
  fechaValoracion: normalizeText(data.fechaValoracion),
})

const toNormalizedUniqueArray = (values, allowedSet) => {
  if (!Array.isArray(values)) {
    return []
  }

  return Array.from(
    new Set(
      values
        .map((value) => normalizeText(value))
        .filter((value) => allowedSet.has(value)),
    ),
  )
}

const normalizeStepTwoData = (data) => {
  const allowedFacial = new Set(STEP_TWO_OPTIONS.facial)
  const allowedCorporal = new Set(STEP_TWO_OPTIONS.corporal)

  // Backward compatibility: migrate previous schema (tipoConsulta + motivosConsulta)
  const legacyTipoConsulta =
    data?.tipoConsulta === 'facial' || data?.tipoConsulta === 'corporal' ? data.tipoConsulta : ''
  const legacyMotivosConsulta = Array.isArray(data?.motivosConsulta) ? data.motivosConsulta : []

  const normalizedFaciales = toNormalizedUniqueArray(data?.motivosFaciales, allowedFacial)
  const normalizedCorporales = toNormalizedUniqueArray(data?.motivosCorporales, allowedCorporal)

  if (legacyTipoConsulta === 'facial' && normalizedFaciales.length === 0) {
    return {
      motivosFaciales: toNormalizedUniqueArray(legacyMotivosConsulta, allowedFacial),
      motivosCorporales: normalizedCorporales,
    }
  }

  if (legacyTipoConsulta === 'corporal' && normalizedCorporales.length === 0) {
    return {
      motivosFaciales: normalizedFaciales,
      motivosCorporales: toNormalizedUniqueArray(legacyMotivosConsulta, allowedCorporal),
    }
  }

  return {
    motivosFaciales: normalizedFaciales,
    motivosCorporales: normalizedCorporales,
  }
}

const buildClienteNombre = (stepOneData) =>
  [stepOneData.nombre, stepOneData.apellidoPaterno, stepOneData.apellidoMaterno]
    .filter(Boolean)
    .join(' ')
    .trim()

const mapValuationSnapshot = (snapshot) => {
  const data = snapshot.data() || {}

  return {
    id: snapshot.id,
    createdBy: String(data.createdBy ?? ''),
    status: data.status === 'completed' ? 'completed' : 'pending',
    currentStep: Number(data.currentStep ?? 1),
    totalSteps: Number(data.totalSteps ?? TOTAL_STEPS),
    clienteId: String(data.clienteId ?? ''),
    clienteNombre: String(data.clienteNombre ?? ''),
    step1: data.step1 ?? null,
    step2: data.step2 ?? null,
    createdAtMs: data.createdAt?.toMillis?.() ?? 0,
    updatedAtMs: data.updatedAt?.toMillis?.() ?? 0,
  }
}

const readValuationById = async (valuationId) => {
  const snapshot = await getDoc(doc(db, VALUATIONS_COLLECTION, valuationId))

  if (!snapshot.exists()) {
    return null
  }

  return mapValuationSnapshot(snapshot)
}

export const saveStepOneValuation = async ({ valuationId, userId, stepOneData }) => {
  const normalizedStepOneData = normalizeStepOneData(stepOneData)
  const clienteNombre = buildClienteNombre(normalizedStepOneData)

  if (!clienteNombre) {
    return { ok: false, message: 'Completa nombre y apellidos para guardar la valoracion.' }
  }

  try {
    if (!valuationId) {
      const created = await addDoc(collection(db, VALUATIONS_COLLECTION), {
        createdBy: userId,
        status: 'pending',
        currentStep: 1,
        totalSteps: TOTAL_STEPS,
        clienteId: normalizedStepOneData.clienteId,
        clienteNombre,
        step1: normalizedStepOneData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      const saved = await readValuationById(created.id)

      return {
        ok: true,
        message: 'Paso 1 guardado. Valoracion pendiente creada.',
        valuation: saved,
      }
    }

    const existing = await readValuationById(valuationId)

    if (!existing) {
      return {
        ok: false,
        message: 'No se encontro la valoracion para actualizar el paso 1.',
      }
    }

    await updateDoc(doc(db, VALUATIONS_COLLECTION, valuationId), {
      currentStep: Math.max(1, existing.currentStep || 1),
      status: 'pending',
      clienteId: normalizedStepOneData.clienteId,
      clienteNombre,
      step1: normalizedStepOneData,
      updatedAt: serverTimestamp(),
    })

    const saved = await readValuationById(valuationId)

    return {
      ok: true,
      message: 'Paso 1 actualizado correctamente.',
      valuation: saved,
    }
  } catch {
    return {
      ok: false,
      message: 'No se pudo guardar el paso 1. Intenta de nuevo.',
    }
  }
}

export const saveStepTwoValuation = async ({ valuationId, stepTwoData }) => {
  if (!valuationId) {
    return {
      ok: false,
      message: 'Primero debes guardar el paso 1 para continuar.',
    }
  }

  const normalizedStepTwoData = normalizeStepTwoData(stepTwoData)

  if (
    normalizedStepTwoData.motivosFaciales.length === 0
    && normalizedStepTwoData.motivosCorporales.length === 0
  ) {
    return {
      ok: false,
      message: 'Selecciona al menos un motivo facial o corporal para continuar.',
    }
  }

  try {
    const existing = await readValuationById(valuationId)

    if (!existing) {
      return {
        ok: false,
        message: 'No se encontro la valoracion para actualizar el paso 2.',
      }
    }

    await updateDoc(doc(db, VALUATIONS_COLLECTION, valuationId), {
      currentStep: Math.max(2, existing.currentStep || 1),
      status: 'pending',
      step2: normalizedStepTwoData,
      updatedAt: serverTimestamp(),
    })

    const saved = await readValuationById(valuationId)

    return {
      ok: true,
      message: 'Paso 2 guardado correctamente.',
      valuation: saved,
    }
  } catch {
    return {
      ok: false,
      message: 'No se pudo guardar el paso 2. Intenta de nuevo.',
    }
  }
}

export const getValuationForEdition = async ({ valuationId }) => {
  try {
    const valuation = await readValuationById(valuationId)

    if (!valuation) {
      return { ok: false, message: 'No se encontro la valoracion solicitada.' }
    }

    return { ok: true, valuation }
  } catch {
    return { ok: false, message: 'No se pudo cargar la valoracion.' }
  }
}

export const listPendingValuations = async () => {
  try {
    const valuationsQuery = query(collection(db, VALUATIONS_COLLECTION), where('status', '==', 'pending'))

    const snapshots = await getDocs(valuationsQuery)

    const valuations = snapshots.docs
      .map(mapValuationSnapshot)
      .sort((left, right) => right.updatedAtMs - left.updatedAtMs)

    return { ok: true, valuations }
  } catch {
    return {
      ok: false,
      message: 'No se pudieron cargar las valoraciones pendientes.',
      valuations: [],
    }
  }
}

export const getValuationProgressLabel = (valuation) =>
  `Paso ${valuation.currentStep} de ${valuation.totalSteps}`
