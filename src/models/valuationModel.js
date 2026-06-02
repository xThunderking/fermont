import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db } from '../services/firebase'

const VALUATIONS_COLLECTION = 'valoraciones'
const TOTAL_STEPS = 11
const FIRESTORE_COMPAT_TOTAL_STEPS = 14

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

export const STEP_FOUR_OPTIONS = {
  enfermedades: [
    'Diabetes',
    'Hipertension',
    'Problemas hormonales',
    'SOP',
    'Enfermedades dermatologicas',
    'Enfermedades autoinmunes',
    'Problemas circulatorios',
    'Varices',
    'Epilepsia',
    'Cancer',
    'Marcapasos',
    'Otro',
  ],
  medicamentos: [
    'Isotretinoina',
    'Anticoagulantes',
    'Antibioticos',
    'Retinoides',
    'Hormonas',
    'Anticonceptivos',
    'Otros medicamentos',
  ],
  alergias: [
    'Cosmeticos',
    'Medicamentos',
    'Fragancias',
    'Activos especificos',
    'Contraindicaciones',
    'Heridas activas',
    'Infecciones',
    'Herpes activo',
    'Cirugias recientes',
    'Quemaduras solares',
    'Irritacion severa',
    'Otras alergias',
  ],
}

export const STEP_SEVEN_OPTIONS = {
  procedimientosPrevios: [
    'Peelings',
    'Microneedling',
    'Laser',
    'Botox',
    'Rellenos',
    'Otro',
  ],
}

export const STEP_EIGHT_OPTIONS = {
  manana: [
    'Limpiador',
    'Serum',
    'Hidratante',
    'Protector solar',
    'Otro',
  ],
  noche: [
    'Desmaquillante',
    'Activos',
    'Cremas',
    'Exfoliantes',
    'Otro',
  ],
}

export const STEP_NINE_OPTIONS = {
  tipoPiel: [
    'Seca',
    'Grasa',
    'Mixta',
    'Normal',
    'Sensible',
  ],
  estadoActual: [
    'Deshidratada',
    'Sensibilizada',
    'Inflamada',
    'Reactiva',
    'Fotoenvejecida',
  ],
  condicionesPresentes: [
    'Acne',
    'Melasma',
    'Rosacea',
    'Manchas',
    'Cicatrices',
    'Poros dilatados',
    'Lineas de expresion',
    'Descamacion',
    'Eritema',
    'Flacidez',
  ],
}

export const STEP_TEN_OPTIONS = {
  manchasOrigenes: [
    'Por el sol',
    'Por hormonas',
    'Por embarazo',
    'Despues de acne',
  ],
  escalaFitzpatrick: [
    'I',
    'II',
    'III',
    'IV',
    'V',
    'VI',
  ],
  escalaGlogau: [
    'I',
    'II',
    'III',
    'IV',
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

const normalizeStepThreeData = (data) => ({
  mejoraPrincipal: normalizeText(data?.mejoraPrincipal),
  resultadoEsperado: normalizeText(data?.resultadoEsperado),
  tiempoEsperado: normalizeText(data?.tiempoEsperado),
  zonaIncomoda: normalizeText(data?.zonaIncomoda),
  notasAdicionalesPielCuerpo: normalizeText(data?.notasAdicionalesPielCuerpo),
})

const normalizeBinaryAnswer = (value) => {
  if (value === 'si' || value === 'no') {
    return value
  }

  return ''
}

const normalizeStepFourData = (data) => {
  const enfermedadesSet = new Set(STEP_FOUR_OPTIONS.enfermedades)
  const medicamentosSet = new Set(STEP_FOUR_OPTIONS.medicamentos)
  const alergiasSet = new Set(STEP_FOUR_OPTIONS.alergias)

  const enfermedades = toNormalizedUniqueArray(data?.enfermedades, enfermedadesSet)
  const medicamentosActuales = toNormalizedUniqueArray(data?.medicamentosActuales, medicamentosSet)
  const alergias = toNormalizedUniqueArray(data?.alergias, alergiasSet)

  return {
    enfermedades,
    enfermedadesOtro: enfermedades.includes('Otro') ? normalizeText(data?.enfermedadesOtro) : '',
    medicamentosActuales,
    medicamentosActualesOtro: medicamentosActuales.includes('Otros medicamentos')
      ? normalizeText(data?.medicamentosActualesOtro)
      : '',
    alergias,
    alergiasOtro: alergias.includes('Otras alergias') ? normalizeText(data?.alergiasOtro) : '',
    embarazoActual: normalizeBinaryAnswer(normalizeText(data?.embarazoActual).toLowerCase()),
    lactanciaActual: normalizeBinaryAnswer(normalizeText(data?.lactanciaActual).toLowerCase()),
    embarazoProximo: normalizeBinaryAnswer(normalizeText(data?.embarazoProximo).toLowerCase()),
  }
}

const normalizeStepFiveData = (data) => ({
  aguaDiaria: normalizeText(data?.aguaDiaria),
  calidadAlimentacion: normalizeText(data?.calidadAlimentacion),
  consumeAzucarLacteos: normalizeBinaryAnswer(
    normalizeText(data?.consumeAzucarLacteos).toLowerCase(),
  ),
  fuma: normalizeBinaryAnswer(normalizeText(data?.fuma).toLowerCase()),
  consumeAlcohol: normalizeBinaryAnswer(normalizeText(data?.consumeAlcohol).toLowerCase()),
  realizaEjercicio: normalizeBinaryAnswer(normalizeText(data?.realizaEjercicio).toLowerCase()),
  ejercicioFrecuenciaSemanal: normalizeText(data?.ejercicioFrecuenciaSemanal),
  horasSueno: normalizeText(data?.horasSueno),
  estresAlto: normalizeBinaryAnswer(normalizeText(data?.estresAlto).toLowerCase()),
  desvelosFrecuentes: normalizeBinaryAnswer(normalizeText(data?.desvelosFrecuentes).toLowerCase()),
})

const normalizeStepSixData = (data) => ({
  usaProtectorDiario: normalizeBinaryAnswer(normalizeText(data?.usaProtectorDiario).toLowerCase()),
  spfUtilizado: normalizeText(data?.spfUtilizado),
  frecuenciaReaplicacion: normalizeText(data?.frecuenciaReaplicacion),
  tiempoProlongadoSol: normalizeBinaryAnswer(normalizeText(data?.tiempoProlongadoSol).toLowerCase()),
  quemadurasSolaresRecientes: normalizeBinaryAnswer(
    normalizeText(data?.quemadurasSolaresRecientes).toLowerCase(),
  ),
})

const normalizeStepSevenData = (data) => {
  const procedimientosSet = new Set(STEP_SEVEN_OPTIONS.procedimientosPrevios)
  const procedimientosPrevios = toNormalizedUniqueArray(data?.procedimientosPrevios, procedimientosSet)

  return {
    procedimientosPrevios,
    procedimientosPreviosOtro: procedimientosPrevios.includes('Otro')
      ? normalizeText(data?.procedimientosPreviosOtro)
      : '',
    facialesPrevios: normalizeBinaryAnswer(normalizeText(data?.facialesPrevios).toLowerCase()),
    facialesPreviosCuales:
      normalizeBinaryAnswer(normalizeText(data?.facialesPrevios).toLowerCase()) === 'si'
        ? normalizeText(data?.facialesPreviosCuales)
        : '',
    aparatologiaCorporal: normalizeBinaryAnswer(normalizeText(data?.aparatologiaCorporal).toLowerCase()),
    aparatologiaCorporalCuales:
      normalizeBinaryAnswer(normalizeText(data?.aparatologiaCorporal).toLowerCase()) === 'si'
        ? normalizeText(data?.aparatologiaCorporalCuales)
        : '',
    fechaUltimoProcedimiento: normalizeText(data?.fechaUltimoProcedimiento),
    tratamientoIrrito: normalizeBinaryAnswer(normalizeText(data?.tratamientoIrrito).toLowerCase()),
    tratamientoIrritoDetalle:
      normalizeBinaryAnswer(normalizeText(data?.tratamientoIrrito).toLowerCase()) === 'si'
        ? normalizeText(data?.tratamientoIrritoDetalle)
        : '',
    quemadurasOMalasExperiencias: normalizeBinaryAnswer(
      normalizeText(data?.quemadurasOMalasExperiencias).toLowerCase(),
    ),
    pielReaccionaFacilmente: normalizeBinaryAnswer(normalizeText(data?.pielReaccionaFacilmente).toLowerCase()),
    toleraBienDolor: normalizeBinaryAnswer(normalizeText(data?.toleraBienDolor).toLowerCase()),
  }
}

const normalizeStepEightData = (data) => {
  const mananaSet = new Set(STEP_EIGHT_OPTIONS.manana)
  const nocheSet = new Set(STEP_EIGHT_OPTIONS.noche)

  const mananaProductos = toNormalizedUniqueArray(data?.mananaProductos, mananaSet)
  const nocheProductos = toNormalizedUniqueArray(data?.nocheProductos, nocheSet)

  return {
    mananaProductos,
    mananaOtro: mananaProductos.includes('Otro') ? normalizeText(data?.mananaOtro) : '',
    nocheProductos,
    nocheOtro: nocheProductos.includes('Otro') ? normalizeText(data?.nocheOtro) : '',
    usaRetinol: normalizeBinaryAnswer(normalizeText(data?.usaRetinol).toLowerCase()),
    usaAcidos: normalizeBinaryAnswer(normalizeText(data?.usaAcidos).toLowerCase()),
    productosIrritaron: normalizeText(data?.productosIrritaron),
    brotesPorProducto: normalizeBinaryAnswer(normalizeText(data?.brotesPorProducto).toLowerCase()),
    constanteRutina: normalizeBinaryAnswer(normalizeText(data?.constanteRutina).toLowerCase()),
    seguiriaCuidadosCasa: normalizeBinaryAnswer(normalizeText(data?.seguiriaCuidadosCasa).toLowerCase()),
    tiempoDedicadoPiel: normalizeText(data?.tiempoDedicadoPiel),
  }
}

const normalizeStepNineData = (data) => {
  const tipoPielSet = new Set(STEP_NINE_OPTIONS.tipoPiel)
  const estadoActualSet = new Set(STEP_NINE_OPTIONS.estadoActual)
  const condicionesSet = new Set(STEP_NINE_OPTIONS.condicionesPresentes)

  return {
    tipoPiel: toNormalizedUniqueArray(data?.tipoPiel, tipoPielSet),
    estadoActual: toNormalizedUniqueArray(data?.estadoActual, estadoActualSet),
    condicionesPresentes: toNormalizedUniqueArray(data?.condicionesPresentes, condicionesSet),
  }
}

const normalizeStepTenData = (data) => {
  const manchasSet = new Set(STEP_TEN_OPTIONS.manchasOrigenes)
  const fitzpatrickSet = new Set(STEP_TEN_OPTIONS.escalaFitzpatrick)
  const glogauSet = new Set(STEP_TEN_OPTIONS.escalaGlogau)

  const normalizedFitzpatrick = normalizeText(data?.escalaFitzpatrick)
  const normalizedGlogau = normalizeText(data?.escalaGlogau)

  return {
    acneEmpeoraPeriodo: normalizeBinaryAnswer(normalizeText(data?.acneEmpeoraPeriodo).toLowerCase()),
    cambiosHormonalesRecientes: normalizeBinaryAnswer(
      normalizeText(data?.cambiosHormonalesRecientes).toLowerCase(),
    ),
    usaAnticonceptivos: normalizeBinaryAnswer(normalizeText(data?.usaAnticonceptivos).toLowerCase()),
    desdeCuandoBrotes: normalizeText(data?.desdeCuandoBrotes),
    manipulaGranitos: normalizeBinaryAnswer(normalizeText(data?.manipulaGranitos).toLowerCase()),
    acneDoloroso: normalizeBinaryAnswer(normalizeText(data?.acneDoloroso).toLowerCase()),
    manchasOrigenes: toNormalizedUniqueArray(data?.manchasOrigenes, manchasSet),
    pielEnrojeceFacilmente: normalizeBinaryAnswer(
      normalizeText(data?.pielEnrojeceFacilmente).toLowerCase(),
    ),
    pielArdeIrritaFacil: normalizeBinaryAnswer(normalizeText(data?.pielArdeIrritaFacil).toLowerCase()),
    escalaFitzpatrick: fitzpatrickSet.has(normalizedFitzpatrick) ? normalizedFitzpatrick : '',
    escalaGlogau: glogauSet.has(normalizedGlogau) ? normalizedGlogau : '',
    sensibilidadCutaneaDetalle: normalizeText(data?.sensibilidadCutaneaDetalle),
  }
}

const normalizeStepElevenData = (data) => ({
  circulacionPiernasCansadas: normalizeBinaryAnswer(
    normalizeText(data?.circulacionPiernasCansadas).toLowerCase(),
  ),
  circulacionVarices: normalizeBinaryAnswer(normalizeText(data?.circulacionVarices).toLowerCase()),
  circulacionRetencionLiquidos: normalizeBinaryAnswer(
    normalizeText(data?.circulacionRetencionLiquidos).toLowerCase(),
  ),
  circulacionDolorTacto: normalizeBinaryAnswer(
    normalizeText(data?.circulacionDolorTacto).toLowerCase(),
  ),
  pesoCambiosRecientes: normalizeBinaryAnswer(normalizeText(data?.pesoCambiosRecientes).toLowerCase()),
  pesoFluctuaciones: normalizeBinaryAnswer(normalizeText(data?.pesoFluctuaciones).toLowerCase()),
  actividadEjercicio: normalizeBinaryAnswer(normalizeText(data?.actividadEjercicio).toLowerCase()),
  actividadFrecuenciaSemanal: normalizeText(data?.actividadFrecuenciaSemanal),
  objetivoZonaMejorar: normalizeText(data?.objetivoZonaMejorar),
  objetivoIncomodidadVisual: normalizeText(data?.objetivoIncomodidadVisual),
})

const normalizeInteractiveMapPoint = (point) => {
  const x = Number(point?.x)
  const y = Number(point?.y)

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null
  }

  return {
    x: Math.max(0, Math.min(1, x)),
    y: Math.max(0, Math.min(1, y)),
  }
}

const normalizeInteractiveMapStrokes = (strokes) => {
  if (!Array.isArray(strokes)) {
    return []
  }

  return strokes
    .slice(0, 400)
    .map((stroke) => {
      const color = normalizeText(stroke?.color) || '#d14836'
      const sizeNumber = Number(stroke?.size)
      const size = Number.isFinite(sizeNumber) ? Math.max(2, Math.min(32, sizeNumber)) : 8
      const points = Array.isArray(stroke?.points)
        ? stroke.points
          .slice(0, 2500)
          .map(normalizeInteractiveMapPoint)
          .filter(Boolean)
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
    totalSteps: TOTAL_STEPS,
    clienteId: String(data.clienteId ?? ''),
    clienteNombre: String(data.clienteNombre ?? ''),
    step1: data.step1 ?? null,
    step2: data.step2 ?? null,
    step3: data.step3 ?? null,
    step4: data.step4 ?? null,
    step5: data.step5 ?? null,
    step6: data.step6 ?? null,
    step7: data.step7 ?? null,
    step8: data.step8 ?? null,
    step9: data.step9 ?? null,
    step10: data.step10 ?? null,
    step11: data.step11 ?? null,
    mapaInteractivo: data.mapaInteractivo ?? null,
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

const normalizeCurrentStepValue = (value) => {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return 1
  }

  return Math.max(1, Math.min(TOTAL_STEPS, Math.trunc(numericValue)))
}

const buildValuationReference = (valuationId, currentStep) => ({
  id: valuationId,
  currentStep,
  totalSteps: TOTAL_STEPS,
})

const saveExistingValuationStep = async ({
  valuationId,
  targetStep,
  knownCurrentStep,
  payload,
  successMessage,
  notFoundMessage,
  genericErrorMessage,
}) => {
  const resolvedCurrentStep = Math.max(targetStep, normalizeCurrentStepValue(knownCurrentStep))

  try {
    await updateDoc(doc(db, VALUATIONS_COLLECTION, valuationId), {
      currentStep: resolvedCurrentStep,
      status: 'pending',
      ...payload,
      updatedAt: serverTimestamp(),
    })

    return {
      ok: true,
      message: successMessage,
      valuation: buildValuationReference(valuationId, resolvedCurrentStep),
    }
  } catch (error) {
    if (error?.code === 'not-found') {
      return {
        ok: false,
        message: notFoundMessage,
      }
    }

    return {
      ok: false,
      message: genericErrorMessage,
    }
  }
}

export const saveStepOneValuation = async ({ valuationId, userId, stepOneData, knownCurrentStep }) => {
  const normalizedStepOneData = normalizeStepOneData(stepOneData)
  const clienteNombre = buildClienteNombre(normalizedStepOneData)

  if (!clienteNombre) {
    return { ok: false, message: 'Completa nombre y apellidos para guardar la valoracion.' }
  }

  try {
    if (!valuationId) {
      const resolvedCurrentStep = 1
      const created = await addDoc(collection(db, VALUATIONS_COLLECTION), {
        createdBy: userId,
        status: 'pending',
        currentStep: resolvedCurrentStep,
        totalSteps: FIRESTORE_COMPAT_TOTAL_STEPS,
        clienteId: normalizedStepOneData.clienteId,
        clienteNombre,
        step1: normalizedStepOneData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      return {
        ok: true,
        message: 'Paso 1 guardado. Valoracion pendiente creada.',
        valuation: buildValuationReference(created.id, resolvedCurrentStep),
      }
    }

    return await saveExistingValuationStep({
      valuationId,
      targetStep: 1,
      knownCurrentStep,
      payload: {
        clienteId: normalizedStepOneData.clienteId,
        clienteNombre,
        step1: normalizedStepOneData,
      },
      successMessage: 'Paso 1 actualizado correctamente.',
      notFoundMessage: 'No se encontro la valoracion para actualizar el paso 1.',
      genericErrorMessage: 'No se pudo guardar el paso 1. Intenta de nuevo.',
    })
  } catch {
    return {
      ok: false,
      message: 'No se pudo guardar el paso 1. Intenta de nuevo.',
    }
  }
}

export const saveStepTwoValuation = async ({ valuationId, stepTwoData, knownCurrentStep }) => {
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

  return await saveExistingValuationStep({
    valuationId,
    targetStep: 2,
    knownCurrentStep,
    payload: { step2: normalizedStepTwoData },
    successMessage: 'Paso 2 guardado correctamente.',
    notFoundMessage: 'No se encontro la valoracion para actualizar el paso 2.',
    genericErrorMessage: 'No se pudo guardar el paso 2. Intenta de nuevo.',
  })
}

export const saveStepThreeValuation = async ({ valuationId, stepThreeData, knownCurrentStep }) => {
  if (!valuationId) {
    return {
      ok: false,
      message: 'Primero debes guardar los pasos anteriores para continuar.',
    }
  }

  const normalizedStepThreeData = normalizeStepThreeData(stepThreeData)

  if (
    !normalizedStepThreeData.mejoraPrincipal
    || !normalizedStepThreeData.resultadoEsperado
    || !normalizedStepThreeData.tiempoEsperado
    || !normalizedStepThreeData.zonaIncomoda
  ) {
    return {
      ok: false,
      message: 'Completa las preguntas principales del paso 3 para continuar.',
    }
  }

  return await saveExistingValuationStep({
    valuationId,
    targetStep: 3,
    knownCurrentStep,
    payload: { step3: normalizedStepThreeData },
    successMessage: 'Paso 3 guardado correctamente.',
    notFoundMessage: 'No se encontro la valoracion para actualizar el paso 3.',
    genericErrorMessage: 'No se pudo guardar el paso 3. Intenta de nuevo.',
  })
}

export const saveStepFourValuation = async ({ valuationId, stepFourData, knownCurrentStep }) => {
  if (!valuationId) {
    return {
      ok: false,
      message: 'Primero debes guardar los pasos anteriores para continuar.',
    }
  }

  const normalizedStepFourData = normalizeStepFourData(stepFourData)

  return await saveExistingValuationStep({
    valuationId,
    targetStep: 4,
    knownCurrentStep,
    payload: { step4: normalizedStepFourData },
    successMessage: 'Paso 4 guardado correctamente.',
    notFoundMessage: 'No se encontro la valoracion para actualizar el paso 4.',
    genericErrorMessage: 'No se pudo guardar el paso 4. Intenta de nuevo.',
  })
}

export const saveStepFiveValuation = async ({ valuationId, stepFiveData, knownCurrentStep }) => {
  if (!valuationId) {
    return {
      ok: false,
      message: 'Primero debes guardar los pasos anteriores para continuar.',
    }
  }

  const normalizedStepFiveData = normalizeStepFiveData(stepFiveData)

  return await saveExistingValuationStep({
    valuationId,
    targetStep: 5,
    knownCurrentStep,
    payload: { step5: normalizedStepFiveData },
    successMessage: 'Paso 5 guardado correctamente.',
    notFoundMessage: 'No se encontro la valoracion para actualizar el paso 5.',
    genericErrorMessage: 'No se pudo guardar el paso 5. Intenta de nuevo.',
  })
}

export const saveStepSixValuation = async ({ valuationId, stepSixData, knownCurrentStep }) => {
  if (!valuationId) {
    return {
      ok: false,
      message: 'Primero debes guardar los pasos anteriores para continuar.',
    }
  }

  const normalizedStepSixData = normalizeStepSixData(stepSixData)

  return await saveExistingValuationStep({
    valuationId,
    targetStep: 6,
    knownCurrentStep,
    payload: { step6: normalizedStepSixData },
    successMessage: 'Paso 6 guardado correctamente.',
    notFoundMessage: 'No se encontro la valoracion para actualizar el paso 6.',
    genericErrorMessage: 'No se pudo guardar el paso 6. Intenta de nuevo.',
  })
}

export const saveStepSevenValuation = async ({ valuationId, stepSevenData, knownCurrentStep }) => {
  if (!valuationId) {
    return {
      ok: false,
      message: 'Primero debes guardar los pasos anteriores para continuar.',
    }
  }

  const normalizedStepSevenData = normalizeStepSevenData(stepSevenData)

  return await saveExistingValuationStep({
    valuationId,
    targetStep: 7,
    knownCurrentStep,
    payload: { step7: normalizedStepSevenData },
    successMessage: 'Paso 7 guardado correctamente.',
    notFoundMessage: 'No se encontro la valoracion para actualizar el paso 7.',
    genericErrorMessage: 'No se pudo guardar el paso 7. Intenta de nuevo.',
  })
}

export const saveStepEightValuation = async ({ valuationId, stepEightData, knownCurrentStep }) => {
  if (!valuationId) {
    return {
      ok: false,
      message: 'Primero debes guardar los pasos anteriores para continuar.',
    }
  }

  const normalizedStepEightData = normalizeStepEightData(stepEightData)

  return await saveExistingValuationStep({
    valuationId,
    targetStep: 8,
    knownCurrentStep,
    payload: { step8: normalizedStepEightData },
    successMessage: 'Paso 8 guardado correctamente.',
    notFoundMessage: 'No se encontro la valoracion para actualizar el paso 8.',
    genericErrorMessage: 'No se pudo guardar el paso 8. Intenta de nuevo.',
  })
}

export const saveStepNineValuation = async ({ valuationId, stepNineData, knownCurrentStep }) => {
  if (!valuationId) {
    return {
      ok: false,
      message: 'Primero debes guardar los pasos anteriores para continuar.',
    }
  }

  const normalizedStepNineData = normalizeStepNineData(stepNineData)

  return await saveExistingValuationStep({
    valuationId,
    targetStep: 9,
    knownCurrentStep,
    payload: { step9: normalizedStepNineData },
    successMessage: 'Paso 9 guardado correctamente.',
    notFoundMessage: 'No se encontro la valoracion para actualizar el paso 9.',
    genericErrorMessage: 'No se pudo guardar el paso 9. Intenta de nuevo.',
  })
}

export const saveStepTenValuation = async ({ valuationId, stepTenData, knownCurrentStep }) => {
  if (!valuationId) {
    return {
      ok: false,
      message: 'Primero debes guardar los pasos anteriores para continuar.',
    }
  }

  const normalizedStepTenData = normalizeStepTenData(stepTenData)

  return await saveExistingValuationStep({
    valuationId,
    targetStep: 10,
    knownCurrentStep,
    payload: { step10: normalizedStepTenData },
    successMessage: 'Paso 10 guardado correctamente.',
    notFoundMessage: 'No se encontro la valoracion para actualizar el paso 10.',
    genericErrorMessage: 'No se pudo guardar el paso 10. Intenta de nuevo.',
  })
}

export const saveStepElevenValuation = async ({ valuationId, stepElevenData, knownCurrentStep }) => {
  if (!valuationId) {
    return {
      ok: false,
      message: 'Primero debes guardar los pasos anteriores para continuar.',
    }
  }

  const normalizedStepElevenData = normalizeStepElevenData(stepElevenData)

  return await saveExistingValuationStep({
    valuationId,
    targetStep: 11,
    knownCurrentStep,
    payload: { step11: normalizedStepElevenData },
    successMessage: 'Paso 11 guardado correctamente.',
    notFoundMessage: 'No se encontro la valoracion para actualizar el paso 11.',
    genericErrorMessage: 'No se pudo guardar el paso 11. Intenta de nuevo.',
  })
}

export const saveInteractiveMapData = async ({ valuationId, mapType, strokes }) => {
  if (!valuationId) {
    return {
      ok: false,
      message: 'Primero debes guardar la valoracion para usar el mapa interactivo.',
    }
  }

  if (mapType !== 'facial' && mapType !== 'corporal') {
    return {
      ok: false,
      message: 'Selecciona un tipo de mapa valido antes de guardar.',
    }
  }

  const normalizedStrokes = normalizeInteractiveMapStrokes(strokes)

  try {
    await updateDoc(doc(db, VALUATIONS_COLLECTION, valuationId), {
      [`mapaInteractivo.${mapType}`]: {
        strokes: normalizedStrokes,
        updatedAtMs: Date.now(),
      },
      updatedAt: serverTimestamp(),
    })

    return {
      ok: true,
      message: 'Mapa interactivo guardado correctamente.',
    }
  } catch (error) {
    if (error?.code === 'not-found') {
      return {
        ok: false,
        message: 'No se encontro la valoracion para guardar el mapa interactivo.',
      }
    }

    return {
      ok: false,
      message: 'No se pudo guardar el mapa interactivo. Intenta de nuevo.',
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
