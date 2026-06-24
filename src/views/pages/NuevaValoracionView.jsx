import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuthController } from '../../controllers/authController.jsx'
import {
  listClients,
  saveClientClinicalHistoryFromValuation,
  saveClientFromStepOne,
} from '../../models/clientModel.js'
import {
  STEP_EIGHT_OPTIONS,
  STEP_FOUR_OPTIONS,
  STEP_NINE_OPTIONS,
  STEP_SEVEN_OPTIONS,
  STEP_TEN_OPTIONS,
  STEP_TWO_OPTIONS,
  getValuationForEdition,
  saveProtocolProducts,
  saveStepEightValuation,
  saveStepElevenValuation,
  saveStepNineValuation,
  saveCutaneoStatusData,
  saveRecurrentStepFourValuation,
  saveStepOneValuation,
  saveStepFourValuation,
  saveStepFiveValuation,
  saveStepSixValuation,
  saveStepSevenValuation,
  saveStepTenValuation,
  saveStepThreeValuation,
  saveStepTwoValuation,
} from '../../models/valuationModel.js'
import glogauTipo1 from '../../img/glogau/tipo1.jpg'
import glogauTipo2 from '../../img/glogau/tipo2.jpg'
import glogauTipo3 from '../../img/glogau/tipo3.jpg'
import glogauTipo4 from '../../img/glogau/tipo4.jpg'

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

const TOTAL_STEPS = 11
const RECURRENT_TOTAL_STEPS = 4

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

const createStepThreeInitialData = () => ({
  mejoraPrincipal: '',
  resultadoEsperado: '',
  tiempoEsperado: '',
  zonaIncomoda: '',
  notasAdicionalesPielCuerpo: '',
})

const createStepFourInitialData = () => ({
  enfermedades: [],
  enfermedadesOtro: '',
  medicamentosActuales: [],
  medicamentosActualesOtro: '',
  alergias: [],
  alergiasOtro: '',
  embarazoActual: '',
  lactanciaActual: '',
  embarazoProximo: '',
})

const createStepFiveInitialData = () => ({
  aguaDiaria: '',
  calidadAlimentacion: '',
  consumeAzucarLacteos: '',
  fuma: '',
  consumeAlcohol: '',
  realizaEjercicio: '',
  ejercicioFrecuenciaSemanal: '',
  horasSueno: '',
  estresAlto: '',
  desvelosFrecuentes: '',
})

const createStepSixInitialData = () => ({
  usaProtectorDiario: '',
  spfUtilizado: '',
  frecuenciaReaplicacion: '',
  tiempoProlongadoSol: '',
  quemadurasSolaresRecientes: '',
})

const createStepSevenInitialData = () => ({
  procedimientosPrevios: [],
  procedimientosPreviosOtro: '',
  facialesPrevios: '',
  facialesPreviosCuales: '',
  aparatologiaCorporal: '',
  aparatologiaCorporalCuales: '',
  fechaUltimoProcedimiento: '',
  tratamientoIrrito: '',
  tratamientoIrritoDetalle: '',
  quemadurasOMalasExperiencias: '',
  pielReaccionaFacilmente: '',
  toleraBienDolor: '',
})

const createStepEightInitialData = () => ({
  mananaProductos: [],
  mananaOtro: '',
  nocheProductos: [],
  nocheOtro: '',
  usaRetinol: '',
  usaAcidos: '',
  productosIrritaron: '',
  brotesPorProducto: '',
  constanteRutina: '',
  seguiriaCuidadosCasa: '',
  tiempoDedicadoPiel: '',
})

const createStepNineInitialData = () => ({
  tipoPiel: [],
  estadoActual: [],
  condicionesPresentes: [],
})

const createStepTenInitialData = () => ({
  acneEmpeoraPeriodo: '',
  cambiosHormonalesRecientes: '',
  usaAnticonceptivos: '',
  desdeCuandoBrotes: '',
  manipulaGranitos: '',
  acneDoloroso: '',
  manchasOrigenes: [],
  pielEnrojeceFacilmente: '',
  pielArdeIrritaFacil: '',
  escalaFitzpatrick: '',
  escalaGlogau: '',
  sensibilidadCutaneaDetalle: '',
})

const createStepElevenInitialData = () => ({
  circulacionPiernasCansadas: '',
  circulacionVarices: '',
  circulacionRetencionLiquidos: '',
  circulacionDolorTacto: '',
  pesoCambiosRecientes: '',
  pesoFluctuaciones: '',
  objetivoZonaMejorar: '',
  objetivoIncomodidadVisual: '',
})

const createRecurrentStepFourInitialData = () => ({
  cambiosSalud: '',
  medicamentoNuevo: '',
  reaccionUltimaSesion: '',
  siguioRutina: '',
  mejoraOCambioPiel: '',
})

const STEP_FOUR_OTHER_CONFIG = {
  enfermedades: {
    option: 'Otro',
    textField: 'enfermedadesOtro',
    label: 'Cual enfermedad?',
    placeholder: 'Escribe la enfermedad',
  },
  medicamentosActuales: {
    option: 'Otros medicamentos',
    textField: 'medicamentosActualesOtro',
    label: 'Cual medicamento?',
    placeholder: 'Escribe el medicamento',
  },
  alergias: {
    option: 'Otras alergias',
    textField: 'alergiasOtro',
    label: 'Cual alergia?',
    placeholder: 'Escribe la alergia',
  },
}

const STEP_SEVEN_OTHER_CONFIG = {
  option: 'Otro',
  textField: 'procedimientosPreviosOtro',
  label: 'Cual procedimiento?',
  placeholder: 'Escribe el procedimiento',
}

const STEP_EIGHT_OTHER_CONFIG = {
  mananaProductos: {
    option: 'Otro',
    textField: 'mananaOtro',
    label: 'Cual producto de mañana?',
    placeholder: 'Escribe el producto',
  },
  nocheProductos: {
    option: 'Otro',
    textField: 'nocheOtro',
    label: 'Cual producto de noche?',
    placeholder: 'Escribe el producto',
  },
}

const FITZPATRICK_COLOR_OPTIONS = [
  {
    value: 'I',
    label: 'Muy claro',
    tone: 'Marfil palido',
    color: '#fce8d8',
  },
  {
    value: 'II',
    label: 'Claro',
    tone: 'Beige claro',
    color: '#f4d4b6',
  },
  {
    value: 'III',
    label: 'Claro a medio',
    tone: 'Beige medio',
    color: '#deb48a',
  },
  {
    value: 'IV',
    label: 'Medio oliva',
    tone: 'Oliva claro',
    color: '#c18e62',
  },
  {
    value: 'V',
    label: 'Moreno',
    tone: 'Marron claro a medio',
    color: '#9d6843',
  },
  {
    value: 'VI',
    label: 'Muy oscuro',
    tone: 'Marron oscuro',
    color: '#6a4129',
  },
]

const GLOGAU_IMAGE_OPTIONS = [
  {
    value: 'I',
    label: 'Tipo I',
    image: glogauTipo1,
  },
  {
    value: 'II',
    label: 'Tipo II',
    image: glogauTipo2,
  },
  {
    value: 'III',
    label: 'Tipo III',
    image: glogauTipo3,
  },
  {
    value: 'IV',
    label: 'Tipo IV',
    image: glogauTipo4,
  },
]

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

const normalizeExistingStepThreeData = (rawStepThree) => {
  const fallback = createStepThreeInitialData()

  if (!rawStepThree) {
    return fallback
  }

  return {
    mejoraPrincipal: String(rawStepThree.mejoraPrincipal ?? ''),
    resultadoEsperado: String(rawStepThree.resultadoEsperado ?? ''),
    tiempoEsperado: String(rawStepThree.tiempoEsperado ?? ''),
    zonaIncomoda: String(rawStepThree.zonaIncomoda ?? ''),
    notasAdicionalesPielCuerpo: String(rawStepThree.notasAdicionalesPielCuerpo ?? ''),
  }
}

const normalizeExistingStepFourData = (rawStepFour) => {
  const fallback = createStepFourInitialData()

  if (!rawStepFour) {
    return fallback
  }

  const allowedEnfermedades = new Set(STEP_FOUR_OPTIONS.enfermedades)
  const allowedMedicamentos = new Set(STEP_FOUR_OPTIONS.medicamentos)
  const allowedAlergias = new Set(STEP_FOUR_OPTIONS.alergias)

  const normalizeBinaryValue = (value) => {
    const normalized = String(value ?? '').trim().toLowerCase()
    return normalized === 'si' || normalized === 'no' ? normalized : ''
  }

  return {
    enfermedades: Array.isArray(rawStepFour.enfermedades)
      ? rawStepFour.enfermedades.filter((item) => allowedEnfermedades.has(item))
      : [],
    enfermedadesOtro: String(rawStepFour.enfermedadesOtro ?? ''),
    medicamentosActuales: Array.isArray(rawStepFour.medicamentosActuales)
      ? rawStepFour.medicamentosActuales.filter((item) => allowedMedicamentos.has(item))
      : [],
    medicamentosActualesOtro: String(rawStepFour.medicamentosActualesOtro ?? ''),
    alergias: Array.isArray(rawStepFour.alergias)
      ? rawStepFour.alergias.filter((item) => allowedAlergias.has(item))
      : [],
    alergiasOtro: String(rawStepFour.alergiasOtro ?? ''),
    embarazoActual: normalizeBinaryValue(rawStepFour.embarazoActual),
    lactanciaActual: normalizeBinaryValue(rawStepFour.lactanciaActual),
    embarazoProximo: normalizeBinaryValue(rawStepFour.embarazoProximo),
  }
}

const normalizeExistingStepFiveData = (rawStepFive) => {
  const fallback = createStepFiveInitialData()

  if (!rawStepFive) {
    return fallback
  }

  const normalizeBinaryValue = (value) => {
    const normalized = String(value ?? '').trim().toLowerCase()
    return normalized === 'si' || normalized === 'no' ? normalized : ''
  }

  return {
    aguaDiaria: String(rawStepFive.aguaDiaria ?? ''),
    calidadAlimentacion: String(rawStepFive.calidadAlimentacion ?? ''),
    consumeAzucarLacteos: normalizeBinaryValue(rawStepFive.consumeAzucarLacteos),
    fuma: normalizeBinaryValue(rawStepFive.fuma),
    consumeAlcohol: normalizeBinaryValue(rawStepFive.consumeAlcohol),
    realizaEjercicio: normalizeBinaryValue(rawStepFive.realizaEjercicio),
    ejercicioFrecuenciaSemanal: String(rawStepFive.ejercicioFrecuenciaSemanal ?? ''),
    horasSueno: String(rawStepFive.horasSueno ?? ''),
    estresAlto: normalizeBinaryValue(rawStepFive.estresAlto),
    desvelosFrecuentes: normalizeBinaryValue(rawStepFive.desvelosFrecuentes),
  }
}

const normalizeExistingStepSixData = (rawStepSix) => {
  const fallback = createStepSixInitialData()

  if (!rawStepSix) {
    return fallback
  }

  const normalizeBinaryValue = (value) => {
    const normalized = String(value ?? '').trim().toLowerCase()
    return normalized === 'si' || normalized === 'no' ? normalized : ''
  }

  return {
    usaProtectorDiario: normalizeBinaryValue(rawStepSix.usaProtectorDiario),
    spfUtilizado: String(rawStepSix.spfUtilizado ?? ''),
    frecuenciaReaplicacion: String(rawStepSix.frecuenciaReaplicacion ?? ''),
    tiempoProlongadoSol: normalizeBinaryValue(rawStepSix.tiempoProlongadoSol),
    quemadurasSolaresRecientes: normalizeBinaryValue(rawStepSix.quemadurasSolaresRecientes),
  }
}

const normalizeExistingStepSevenData = (rawStepSeven) => {
  const fallback = createStepSevenInitialData()

  if (!rawStepSeven) {
    return fallback
  }

  const allowedProcedimientos = new Set(STEP_SEVEN_OPTIONS.procedimientosPrevios)

  const normalizeBinaryValue = (value) => {
    const normalized = String(value ?? '').trim().toLowerCase()
    return normalized === 'si' || normalized === 'no' ? normalized : ''
  }

  const facialesPrevios = normalizeBinaryValue(rawStepSeven.facialesPrevios)
  const aparatologiaCorporal = normalizeBinaryValue(rawStepSeven.aparatologiaCorporal)
  const tratamientoIrrito = normalizeBinaryValue(rawStepSeven.tratamientoIrrito)

  return {
    procedimientosPrevios: Array.isArray(rawStepSeven.procedimientosPrevios)
      ? rawStepSeven.procedimientosPrevios.filter((item) => allowedProcedimientos.has(item))
      : [],
    procedimientosPreviosOtro: Array.isArray(rawStepSeven.procedimientosPrevios)
      && rawStepSeven.procedimientosPrevios.includes(STEP_SEVEN_OTHER_CONFIG.option)
      ? String(rawStepSeven.procedimientosPreviosOtro ?? '')
      : '',
    facialesPrevios,
    facialesPreviosCuales: facialesPrevios === 'si' ? String(rawStepSeven.facialesPreviosCuales ?? '') : '',
    aparatologiaCorporal,
    aparatologiaCorporalCuales:
      aparatologiaCorporal === 'si' ? String(rawStepSeven.aparatologiaCorporalCuales ?? '') : '',
    fechaUltimoProcedimiento: String(rawStepSeven.fechaUltimoProcedimiento ?? ''),
    tratamientoIrrito,
    tratamientoIrritoDetalle:
      tratamientoIrrito === 'si' ? String(rawStepSeven.tratamientoIrritoDetalle ?? '') : '',
    quemadurasOMalasExperiencias: normalizeBinaryValue(rawStepSeven.quemadurasOMalasExperiencias),
    pielReaccionaFacilmente: normalizeBinaryValue(rawStepSeven.pielReaccionaFacilmente),
    toleraBienDolor: normalizeBinaryValue(rawStepSeven.toleraBienDolor),
  }
}

const normalizeExistingStepEightData = (rawStepEight) => {
  const fallback = createStepEightInitialData()

  if (!rawStepEight) {
    return fallback
  }

  const allowedManana = new Set(STEP_EIGHT_OPTIONS.manana)
  const allowedNoche = new Set(STEP_EIGHT_OPTIONS.noche)

  const normalizeBinaryValue = (value) => {
    const normalized = String(value ?? '').trim().toLowerCase()
    return normalized === 'si' || normalized === 'no' ? normalized : ''
  }

  const mananaProductos = Array.isArray(rawStepEight.mananaProductos)
    ? rawStepEight.mananaProductos.filter((item) => allowedManana.has(item))
    : []
  const nocheProductos = Array.isArray(rawStepEight.nocheProductos)
    ? rawStepEight.nocheProductos.filter((item) => allowedNoche.has(item))
    : []

  return {
    mananaProductos,
    mananaOtro: mananaProductos.includes(STEP_EIGHT_OTHER_CONFIG.mananaProductos.option)
      ? String(rawStepEight.mananaOtro ?? '')
      : '',
    nocheProductos,
    nocheOtro: nocheProductos.includes(STEP_EIGHT_OTHER_CONFIG.nocheProductos.option)
      ? String(rawStepEight.nocheOtro ?? '')
      : '',
    usaRetinol: normalizeBinaryValue(rawStepEight.usaRetinol),
    usaAcidos: normalizeBinaryValue(rawStepEight.usaAcidos),
    productosIrritaron: String(rawStepEight.productosIrritaron ?? ''),
    brotesPorProducto: normalizeBinaryValue(rawStepEight.brotesPorProducto),
    constanteRutina: normalizeBinaryValue(rawStepEight.constanteRutina),
    seguiriaCuidadosCasa: normalizeBinaryValue(rawStepEight.seguiriaCuidadosCasa),
    tiempoDedicadoPiel: String(rawStepEight.tiempoDedicadoPiel ?? ''),
  }
}

const normalizeExistingStepNineData = (rawStepNine) => {
  const fallback = createStepNineInitialData()

  if (!rawStepNine) {
    return fallback
  }

  const allowedTipoPiel = new Set(STEP_NINE_OPTIONS.tipoPiel)
  const allowedEstadoActual = new Set(STEP_NINE_OPTIONS.estadoActual)
  const allowedCondiciones = new Set(STEP_NINE_OPTIONS.condicionesPresentes)

  return {
    tipoPiel: Array.isArray(rawStepNine.tipoPiel)
      ? rawStepNine.tipoPiel.filter((item) => allowedTipoPiel.has(item))
      : [],
    estadoActual: Array.isArray(rawStepNine.estadoActual)
      ? rawStepNine.estadoActual.filter((item) => allowedEstadoActual.has(item))
      : [],
    condicionesPresentes: Array.isArray(rawStepNine.condicionesPresentes)
      ? rawStepNine.condicionesPresentes.filter((item) => allowedCondiciones.has(item))
      : [],
  }
}

const normalizeExistingStepTenData = (rawStepTen) => {
  const fallback = createStepTenInitialData()

  if (!rawStepTen) {
    return fallback
  }

  const allowedManchas = new Set(STEP_TEN_OPTIONS.manchasOrigenes)
  const allowedFitzpatrick = new Set(STEP_TEN_OPTIONS.escalaFitzpatrick)
  const allowedGlogau = new Set(STEP_TEN_OPTIONS.escalaGlogau)

  const normalizeBinaryValue = (value) => {
    const normalized = String(value ?? '').trim().toLowerCase()
    return normalized === 'si' || normalized === 'no' ? normalized : ''
  }

  const normalizedFitzpatrick = String(rawStepTen.escalaFitzpatrick ?? '').trim()
  const normalizedGlogau = String(rawStepTen.escalaGlogau ?? '').trim()

  return {
    acneEmpeoraPeriodo: normalizeBinaryValue(rawStepTen.acneEmpeoraPeriodo),
    cambiosHormonalesRecientes: normalizeBinaryValue(rawStepTen.cambiosHormonalesRecientes),
    usaAnticonceptivos: normalizeBinaryValue(rawStepTen.usaAnticonceptivos),
    desdeCuandoBrotes: String(rawStepTen.desdeCuandoBrotes ?? ''),
    manipulaGranitos: normalizeBinaryValue(rawStepTen.manipulaGranitos),
    acneDoloroso: normalizeBinaryValue(rawStepTen.acneDoloroso),
    manchasOrigenes: Array.isArray(rawStepTen.manchasOrigenes)
      ? rawStepTen.manchasOrigenes.filter((item) => allowedManchas.has(item))
      : [],
    pielEnrojeceFacilmente: normalizeBinaryValue(rawStepTen.pielEnrojeceFacilmente),
    pielArdeIrritaFacil: normalizeBinaryValue(rawStepTen.pielArdeIrritaFacil),
    escalaFitzpatrick: allowedFitzpatrick.has(normalizedFitzpatrick) ? normalizedFitzpatrick : '',
    escalaGlogau: allowedGlogau.has(normalizedGlogau) ? normalizedGlogau : '',
    sensibilidadCutaneaDetalle: String(rawStepTen.sensibilidadCutaneaDetalle ?? ''),
  }
}

const normalizeExistingStepElevenData = (rawStepEleven) => {
  const fallback = createStepElevenInitialData()

  if (!rawStepEleven) {
    return fallback
  }

  const normalizeBinaryValue = (value) => {
    const normalized = String(value ?? '').trim().toLowerCase()
    return normalized === 'si' || normalized === 'no' ? normalized : ''
  }

  return {
    circulacionPiernasCansadas: normalizeBinaryValue(rawStepEleven.circulacionPiernasCansadas),
    circulacionVarices: normalizeBinaryValue(rawStepEleven.circulacionVarices),
    circulacionRetencionLiquidos: normalizeBinaryValue(rawStepEleven.circulacionRetencionLiquidos),
    circulacionDolorTacto: normalizeBinaryValue(rawStepEleven.circulacionDolorTacto),
    pesoCambiosRecientes: normalizeBinaryValue(rawStepEleven.pesoCambiosRecientes),
    pesoFluctuaciones: normalizeBinaryValue(rawStepEleven.pesoFluctuaciones),
    objetivoZonaMejorar: String(rawStepEleven.objetivoZonaMejorar ?? ''),
    objetivoIncomodidadVisual: String(rawStepEleven.objetivoIncomodidadVisual ?? ''),
  }
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
  const location = useLocation()
  const { valuationId } = useParams()
  const { currentUser } = useAuthController()

  const [valuationDocId, setValuationDocId] = useState(valuationId || '')
  const [activeStep, setActiveStep] = useState(1)
  const [highestSavedStep, setHighestSavedStep] = useState(1)
  const [clientFlowType, setClientFlowType] = useState('nuevo')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [stepOneData, setStepOneData] = useState(createStepOneInitialData)
  const [stepTwoData, setStepTwoData] = useState(createStepTwoInitialData)
  const [stepThreeData, setStepThreeData] = useState(createStepThreeInitialData)
  const [stepFourData, setStepFourData] = useState(createStepFourInitialData)
  const [stepFiveData, setStepFiveData] = useState(createStepFiveInitialData)
  const [stepSixData, setStepSixData] = useState(createStepSixInitialData)
  const [stepSevenData, setStepSevenData] = useState(createStepSevenInitialData)
  const [stepEightData, setStepEightData] = useState(createStepEightInitialData)
  const [stepNineData, setStepNineData] = useState(createStepNineInitialData)
  const [stepTenData, setStepTenData] = useState(createStepTenInitialData)
  const [stepElevenData, setStepElevenData] = useState(createStepElevenInitialData)
  const [recurrentStepFourData, setRecurrentStepFourData] = useState(createRecurrentStepFourInitialData)
  const [stepTwoModal, setStepTwoModal] = useState({
    open: false,
    field: '',
    title: '',
    options: [],
  })
  const [stepFourModal, setStepFourModal] = useState({
    open: false,
    field: '',
    title: '',
    options: [],
  })
  const [stepSevenModal, setStepSevenModal] = useState({
    open: false,
    section: '',
    title: '',
  })
  const [stepEightModal, setStepEightModal] = useState({
    open: false,
    field: '',
    title: '',
    options: [],
  })
  const [stepNineModal, setStepNineModal] = useState({
    open: false,
    field: '',
    title: '',
    options: [],
  })
  const [stepTenModal, setStepTenModal] = useState({
    open: false,
    field: '',
    title: '',
    options: [],
    mode: 'multiple',
  })
  const [cutaneoModal, setCutaneoModal] = useState({
    open: false,
    selected: '',
    isSaving: false,
  })
  const [availableClients, setAvailableClients] = useState([])
  const [clientSearch, setClientSearch] = useState('')
  const [isLoadingClients, setIsLoadingClients] = useState(false)
  const [isLoading, setIsLoading] = useState(Boolean(valuationId))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [, setSuccessMessage] = useState('')
  const [protocolProductName, setProtocolProductName] = useState('')
  const [protocolProductUse, setProtocolProductUse] = useState('')
  const [protocolProducts, setProtocolProducts] = useState([])

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
        setHighestSavedStep(1)
        setClientFlowType('')
        setSelectedClientId('')
        setStepOneData(createStepOneInitialData())
        setStepTwoData(createStepTwoInitialData())
        setStepThreeData(createStepThreeInitialData())
        setStepFourData(createStepFourInitialData())
        setStepFiveData(createStepFiveInitialData())
        setStepSixData(createStepSixInitialData())
        setStepSevenData(createStepSevenInitialData())
        setStepEightData(createStepEightInitialData())
        setStepNineData(createStepNineInitialData())
        setStepTenData(createStepTenInitialData())
        setStepElevenData(createStepElevenInitialData())
        setProtocolProducts([])
        setRecurrentStepFourData(createRecurrentStepFourInitialData())
        setStepTwoModal({ open: false, field: '', title: '', options: [] })
        setStepFourModal({ open: false, field: '', title: '', options: [] })
        setStepSevenModal({ open: false, section: '', title: '' })
        setStepEightModal({ open: false, field: '', title: '', options: [] })
        setStepNineModal({ open: false, field: '', title: '', options: [] })
        setStepTenModal({ open: false, field: '', title: '', options: [], mode: 'multiple' })
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
      const loadedFlowType = loadedStepOne.tipoCliente === 'recurrente' ? 'recurrente' : 'nuevo'

      setError('')
      setValuationDocId(result.valuation.id)
      const loadedCurrentStep = Number(result.valuation.currentStep ?? 1)
      const normalizedLoadedCurrentStep = Number.isFinite(loadedCurrentStep)
        ? Math.max(1, Math.min(TOTAL_STEPS, Math.trunc(loadedCurrentStep)))
        : 1

      setHighestSavedStep(normalizedLoadedCurrentStep)

      if (loadedFlowType === 'recurrente') {
        const hasSavedRecurrentStepFour = Boolean(result.valuation.recurrentStep4)

        if (hasSavedRecurrentStepFour) {
          setActiveStep(4)
        } else if (normalizedLoadedCurrentStep >= 7) {
          setActiveStep(3)
        } else if (normalizedLoadedCurrentStep >= 2) {
          setActiveStep(2)
        } else {
          setActiveStep(1)
        }
      } else if (normalizedLoadedCurrentStep >= 11) {
        setActiveStep(11)
      } else if (normalizedLoadedCurrentStep >= 10) {
        setActiveStep(10)
      } else if (normalizedLoadedCurrentStep >= 9) {
        setActiveStep(9)
      } else if (normalizedLoadedCurrentStep >= 8) {
        setActiveStep(8)
      } else if (normalizedLoadedCurrentStep >= 7) {
        setActiveStep(7)
      } else if (normalizedLoadedCurrentStep >= 6) {
        setActiveStep(6)
      } else if (normalizedLoadedCurrentStep >= 5) {
        setActiveStep(5)
      } else if (normalizedLoadedCurrentStep >= 4) {
        setActiveStep(4)
      } else if (normalizedLoadedCurrentStep >= 3) {
        setActiveStep(3)
      } else if (normalizedLoadedCurrentStep >= 2) {
        setActiveStep(2)
      } else {
        setActiveStep(1)
      }

      setClientFlowType(loadedFlowType)
      setSelectedClientId(String(loadedStepOne.clienteId ?? result.valuation.clienteId ?? ''))
      setStepOneData(loadedStepOne)
      setStepTwoData(normalizeExistingStepTwoData(result.valuation.step2))
      setStepThreeData(normalizeExistingStepThreeData(result.valuation.step3))
      setStepFourData(normalizeExistingStepFourData(result.valuation.step4))
      setStepFiveData(normalizeExistingStepFiveData(result.valuation.step5))
      setStepSixData(normalizeExistingStepSixData(result.valuation.step6))
      setStepSevenData(normalizeExistingStepSevenData(result.valuation.step7))
      setStepEightData(normalizeExistingStepEightData(result.valuation.step8))
      setStepNineData(normalizeExistingStepNineData(result.valuation.step9))
      setStepTenData(normalizeExistingStepTenData(result.valuation.step10))
      setStepElevenData(normalizeExistingStepElevenData(result.valuation.step11))
      setProtocolProducts(
        Array.isArray(result.valuation.protocolProducts)
          ? result.valuation.protocolProducts.map((product) => ({
              name: String(product.name ?? '').trim(),
              use: String(product.use ?? '').trim(),
            }))
          : [],
      )
      setCutaneoModal((previous) => ({
        ...previous,
        selected: String(result.valuation.semaforoCutaneo ?? ''),
      }))
      setRecurrentStepFourData({
        ...createRecurrentStepFourInitialData(),
        ...(result.valuation.recurrentStep4 ?? {}),
      })
      setIsLoading(false)
    }

    loadExistingValuation()

    return () => {
      isMounted = false
    }
  }, [valuationId])

  useEffect(() => {
    const appBody = document.querySelector('.app-body')

    if (appBody) {
      appBody.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeStep])

  const isProtocolMode = useMemo(
    () => new URLSearchParams(location.search).get('action') === 'protocolo',
    [location.search],
  )

  const filteredClients = useMemo(() => {
    const queryText = clientSearch.trim().toLowerCase()

    if (!queryText) {
      return []
    }

    return availableClients
      .filter((client) => client.nombreCompletoLower.includes(queryText))
      .slice(0, 20)
  }, [availableClients, clientSearch])

  const titleText = useMemo(() => {
    if (isProtocolMode) {
      return 'Protocolo'
    }

    if (valuationDocId) {
      return 'Editar valoracion pendiente'
    }

    return 'Nueva Valoracion'
  }, [isProtocolMode, valuationDocId])

  const isFlowSelected = !isProtocolMode && (clientFlowType === 'nuevo' || clientFlowType === 'recurrente')
  const normalizedActiveStep = Number.isFinite(Number(activeStep))
    ? Math.max(1, Math.min(TOTAL_STEPS, Math.trunc(Number(activeStep))))
    : 1
  const normalizedProgressStep =
    clientFlowType === 'recurrente'
      ? (normalizedActiveStep >= 7 ? 3 : Math.max(1, Math.min(RECURRENT_TOTAL_STEPS, normalizedActiveStep)))
      : normalizedActiveStep
  const progressTotalSteps = clientFlowType === 'recurrente' ? RECURRENT_TOTAL_STEPS : TOTAL_STEPS
  const progressPercent = Math.round((normalizedProgressStep / progressTotalSteps) * 100)

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

  const getStepTwoList = (field) => {
    const value = stepTwoData[field]
    return Array.isArray(value) ? value : []
  }

  const openStepTwoModal = (field, title, options) => {
    setStepTwoModal({
      open: true,
      field,
      title,
      options,
    })
  }

  const closeStepTwoModal = () => {
    setStepTwoModal({
      open: false,
      field: '',
      title: '',
      options: [],
    })
  }

  const setStepThreeFieldValue = (field, value) => {
    setStepThreeData((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const setStepFourFieldValue = (field, value) => {
    setStepFourData((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const setStepFiveFieldValue = (field, value) => {
    setStepFiveData((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const setStepSixFieldValue = (field, value) => {
    setStepSixData((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const setStepSevenFieldValue = (field, value) => {
    setStepSevenData((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const setStepEightFieldValue = (field, value) => {
    setStepEightData((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const setStepTenFieldValue = (field, value) => {
    setStepTenData((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const setStepElevenFieldValue = (field, value) => {
    setStepElevenData((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const setRecurrentStepFourFieldValue = (field, value) => {
    setRecurrentStepFourData((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const getStepFourList = (field) => {
    const value = stepFourData[field]
    return Array.isArray(value) ? value : []
  }

  const getStepEightList = (field) => {
    const value = stepEightData[field]
    return Array.isArray(value) ? value : []
  }

  const getStepNineList = (field) => {
    const value = stepNineData[field]
    return Array.isArray(value) ? value : []
  }

  const getStepTenList = (field) => {
    const value = stepTenData[field]
    return Array.isArray(value) ? value : []
  }

  const toggleStepFourOption = (field, option) => {
    setStepFourData((previous) => {
      const currentValues = Array.isArray(previous[field]) ? previous[field] : []
      const exists = currentValues.includes(option)
      const otherConfig = STEP_FOUR_OTHER_CONFIG[field]

      if (exists) {
        const nextValues = currentValues.filter((value) => value !== option)
        const nextState = {
          ...previous,
          [field]: nextValues,
        }

        if (otherConfig && !nextValues.includes(otherConfig.option)) {
          nextState[otherConfig.textField] = ''
        }

        return {
          ...nextState,
        }
      }

      return {
        ...previous,
        [field]: [...currentValues, option],
      }
    })
  }

  const openStepFourModal = (field, title, options) => {
    setStepFourModal({
      open: true,
      field,
      title,
      options,
    })
  }

  const closeStepFourModal = () => {
    setStepFourModal({
      open: false,
      field: '',
      title: '',
      options: [],
    })
  }

  const openStepSevenModal = (section, title) => {
    setStepSevenModal({
      open: true,
      section,
      title,
    })
  }

  const closeStepSevenModal = () => {
    setStepSevenModal({
      open: false,
      section: '',
      title: '',
    })
  }

  const openStepEightModal = (field, title, options) => {
    setStepEightModal({
      open: true,
      field,
      title,
      options,
    })
  }

  const closeStepEightModal = () => {
    setStepEightModal({
      open: false,
      field: '',
      title: '',
      options: [],
    })
  }

  const openStepNineModal = (field, title, options) => {
    setStepNineModal({
      open: true,
      field,
      title,
      options,
    })
  }

  const closeStepNineModal = () => {
    setStepNineModal({
      open: false,
      field: '',
      title: '',
      options: [],
    })
  }

  const openStepTenModal = (field, title, options, mode = 'multiple') => {
    setStepTenModal({
      open: true,
      field,
      title,
      options,
      mode,
    })
  }

  const closeStepTenModal = () => {
    setStepTenModal({
      open: false,
      field: '',
      title: '',
      options: [],
      mode: 'multiple',
    })
  }

  const toggleStepSevenProcedimiento = (option) => {
    setStepSevenData((previous) => {
      const currentValues = Array.isArray(previous.procedimientosPrevios)
        ? previous.procedimientosPrevios
        : []
      const exists = currentValues.includes(option)

      if (exists) {
        const nextValues = currentValues.filter((value) => value !== option)

        return {
          ...previous,
          procedimientosPrevios: nextValues,
          procedimientosPreviosOtro: nextValues.includes(STEP_SEVEN_OTHER_CONFIG.option)
            ? previous.procedimientosPreviosOtro
            : '',
        }
      }

      return {
        ...previous,
        procedimientosPrevios: [...currentValues, option],
      }
    })
  }

  const toggleStepEightOption = (field, option) => {
    setStepEightData((previous) => {
      const currentValues = Array.isArray(previous[field]) ? previous[field] : []
      const exists = currentValues.includes(option)
      const otherConfig = STEP_EIGHT_OTHER_CONFIG[field]

      if (exists) {
        const nextValues = currentValues.filter((value) => value !== option)
        const nextState = {
          ...previous,
          [field]: nextValues,
        }

        if (otherConfig && !nextValues.includes(otherConfig.option)) {
          nextState[otherConfig.textField] = ''
        }

        return {
          ...nextState,
        }
      }

      return {
        ...previous,
        [field]: [...currentValues, option],
      }
    })
  }

  const toggleStepNineOption = (field, option) => {
    setStepNineData((previous) => {
      const currentValues = Array.isArray(previous[field]) ? previous[field] : []
      const exists = currentValues.includes(option)

      if (exists) {
        return {
          ...previous,
          [field]: currentValues.filter((value) => value !== option),
        }
      }

      return {
        ...previous,
        [field]: [...currentValues, option],
      }
    })
  }

  const toggleStepTenOption = (field, option) => {
    setStepTenData((previous) => {
      const currentValues = Array.isArray(previous[field]) ? previous[field] : []
      const exists = currentValues.includes(option)

      if (exists) {
        return {
          ...previous,
          [field]: currentValues.filter((value) => value !== option),
        }
      }

      return {
        ...previous,
        [field]: [...currentValues, option],
      }
    })
  }

  const isStepSevenOtherSelected = () =>
    stepSevenData.procedimientosPrevios.includes(STEP_SEVEN_OTHER_CONFIG.option)

  const formatStepSevenProcedimientoSelectedItem = (item) => {
    if (item !== STEP_SEVEN_OTHER_CONFIG.option) {
      return item
    }

    const detail = String(stepSevenData[STEP_SEVEN_OTHER_CONFIG.textField] ?? '').trim()
    if (!detail) {
      return item
    }

    return `${item}: ${detail}`
  }

  const getStepEightOtherConfig = (field) => STEP_EIGHT_OTHER_CONFIG[field] || null

  const isStepEightOtherSelected = (field) => {
    const config = getStepEightOtherConfig(field)
    if (!config) {
      return false
    }

    return getStepEightList(field).includes(config.option)
  }

  const formatStepEightSelectedItem = (field, item) => {
    const config = getStepEightOtherConfig(field)
    if (!config || item !== config.option) {
      return item
    }

    const detail = String(stepEightData[config.textField] ?? '').trim()
    if (!detail) {
      return item
    }

    return `${item}: ${detail}`
  }

  const getFitzpatrickOptionByValue = (value) =>
    FITZPATRICK_COLOR_OPTIONS.find((option) => option.value === value) || null

  const formatFitzpatrickSelectedItem = (value) => {
    const option = getFitzpatrickOptionByValue(value)
    if (!option) {
      return value
    }

    return `${option.value} - ${option.label}`
  }

  const getGlogauOptionByValue = (value) =>
    GLOGAU_IMAGE_OPTIONS.find((option) => option.value === value) || null

  const formatGlogauSelectedItem = (value) => {
    const option = getGlogauOptionByValue(value)
    if (!option) {
      return value
    }

    return `${option.value} - ${option.label}`
  }

  const getStepFourOtherConfig = (field) => STEP_FOUR_OTHER_CONFIG[field] || null

  const isStepFourOtherSelected = (field) => {
    const config = getStepFourOtherConfig(field)
    if (!config) {
      return false
    }

    return getStepFourList(field).includes(config.option)
  }

  const formatStepFourSelectedItem = (field, item) => {
    const config = getStepFourOtherConfig(field)
    if (!config || item !== config.option) {
      return item
    }

    const detail = String(stepFourData[config.textField] ?? '').trim()
    if (!detail) {
      return item
    }

    return `${item}: ${detail}`
  }

  const syncHighestSavedStep = (candidateStep) => {
    const numericStep = Number(candidateStep)
    const normalizedStep = Number.isFinite(numericStep)
      ? Math.max(1, Math.min(TOTAL_STEPS, Math.trunc(numericStep)))
      : 1

    setHighestSavedStep((previous) => Math.max(previous, normalizedStep))
    return normalizedStep
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
    setActiveStep(1)
    setError('')

    if (flowType === 'nuevo') {
      setSelectedClientId('')
      setStepOneData(createStepOneInitialData())
      return
    }

    setStepOneData(createStepOneInitialData())
    setClientSearch('')
  }

  const selectRecurrentClient = (client) => {
    setClientFlowType('recurrente')
    setSelectedClientId(client.id)
    applyClientToStepOne(client)
    setClientSearch(client.nombreCompleto)
    setError('')
  }

  const hasValue = (value) => String(value ?? '').trim().length > 0

  const hasStepSevenImportantQuestions =
    stepSevenData.procedimientosPrevios.length > 0
    || stepSevenData.facialesPrevios === 'si'
    || stepSevenData.aparatologiaCorporal === 'si'

  const validateStep = (step) => {
    if (clientFlowType === 'recurrente') {
      if (step === 1) {
        if (!selectedClientId) {
          return 'Selecciona un cliente frecuente para continuar.'
        }

        if (!hasValue(stepOneData.fechaValoracion)) {
          return 'Selecciona la fecha de valoracion para continuar.'
        }
      }

      if (step === 3 || step === 7) {
        if (isStepSevenOtherSelected() && !hasValue(stepSevenData.procedimientosPreviosOtro)) {
          return 'Especifica el procedimiento en el campo "Otro".'
        }

        if (hasStepSevenImportantQuestions) {
          const requiredFields = [
            stepSevenData.fechaUltimoProcedimiento,
            stepSevenData.tratamientoIrrito,
            stepSevenData.quemadurasOMalasExperiencias,
            stepSevenData.pielReaccionaFacilmente,
            stepSevenData.toleraBienDolor,
          ]

          if (requiredFields.some((field) => !hasValue(field))) {
            return 'Completa todos los campos obligatorios de "Preguntas importantes" para continuar.'
          }

          if (stepSevenData.tratamientoIrrito === 'si' && !hasValue(stepSevenData.tratamientoIrritoDetalle)) {
            return 'Describe cual tratamiento te irrito.'
          }
        }
      }

      if (step === 4) {
        const requiredFields = [
          recurrentStepFourData.cambiosSalud,
          recurrentStepFourData.medicamentoNuevo,
          recurrentStepFourData.reaccionUltimaSesion,
          recurrentStepFourData.siguioRutina,
          recurrentStepFourData.mejoraOCambioPiel,
        ]

        if (requiredFields.some((field) => !hasValue(field))) {
          return 'Completa todas las preguntas del paso 4 para clientes frecuentes.'
        }
      }

      return ''
    }

    if (step === 1) {
      const requiredFields = [
        stepOneData.apellidoPaterno,
        stepOneData.apellidoMaterno,
        stepOneData.nombre,
        stepOneData.edad,
        stepOneData.fechaNacimiento,
        stepOneData.telefono,
        stepOneData.correoElectronico,
        stepOneData.ocupacion,
        stepOneData.contactoEmergencia,
        stepOneData.objetivoPrincipal,
        stepOneData.fechaValoracion,
      ]

      if (requiredFields.some((field) => !hasValue(field))) {
        return 'Completa todos los campos obligatorios del paso 1.'
      }
    }

    if (step === 3) {
      const requiredFields = [
        stepThreeData.mejoraPrincipal,
        stepThreeData.resultadoEsperado,
        stepThreeData.tiempoEsperado,
      ]

      if (requiredFields.some((field) => !hasValue(field))) {
        return 'Completa todos los campos obligatorios del paso 3.'
      }
    }

    if (step === 4) {
      const requiredFields = [
        stepFourData.embarazoActual,
        stepFourData.lactanciaActual,
        stepFourData.embarazoProximo,
      ]

      if (requiredFields.some((field) => !hasValue(field))) {
        return 'Completa todos los campos obligatorios del paso 4.'
      }

      if (isStepFourOtherSelected('enfermedades') && !hasValue(stepFourData.enfermedadesOtro)) {
        return 'Especifica la enfermedad en el campo "Otro".'
      }

      if (isStepFourOtherSelected('medicamentosActuales') && !hasValue(stepFourData.medicamentosActualesOtro)) {
        return 'Especifica el medicamento en el campo "Otros medicamentos".'
      }

      if (isStepFourOtherSelected('alergias') && !hasValue(stepFourData.alergiasOtro)) {
        return 'Especifica la alergia en el campo "Otras alergias".'
      }
    }

    if (step === 5) {
      const requiredFields = [
        stepFiveData.aguaDiaria,
        stepFiveData.calidadAlimentacion,
        stepFiveData.consumeAzucarLacteos,
        stepFiveData.fuma,
        stepFiveData.consumeAlcohol,
        stepFiveData.realizaEjercicio,
        stepFiveData.horasSueno,
        stepFiveData.estresAlto,
        stepFiveData.desvelosFrecuentes,
      ]

      if (requiredFields.some((field) => !hasValue(field))) {
        return 'Completa todos los campos obligatorios del paso 5.'
      }
    }

    if (step === 6) {
      const requiredFields = [
        stepSixData.usaProtectorDiario,
        stepSixData.tiempoProlongadoSol,
        stepSixData.quemadurasSolaresRecientes,
      ]

      if (requiredFields.some((field) => !hasValue(field))) {
        return 'Completa todos los campos obligatorios del paso 6.'
      }
    }

    if (step === 7) {
      if (isStepSevenOtherSelected() && !hasValue(stepSevenData.procedimientosPreviosOtro)) {
        return 'Especifica el procedimiento en el campo "Otro".'
      }

      if (hasStepSevenImportantQuestions) {
        const requiredFields = [
          stepSevenData.fechaUltimoProcedimiento,
          stepSevenData.tratamientoIrrito,
          stepSevenData.quemadurasOMalasExperiencias,
          stepSevenData.pielReaccionaFacilmente,
          stepSevenData.toleraBienDolor,
        ]

        if (requiredFields.some((field) => !hasValue(field))) {
          return 'Completa todos los campos obligatorios de "Preguntas importantes" en el paso 7.'
        }

        if (stepSevenData.tratamientoIrrito === 'si' && !hasValue(stepSevenData.tratamientoIrritoDetalle)) {
          return 'Describe cual tratamiento te irrito.'
        }
      }
    }

    if (step === 8) {
      const requiredFields = [
        stepEightData.usaRetinol,
        stepEightData.usaAcidos,
        stepEightData.brotesPorProducto,
        stepEightData.constanteRutina,
        stepEightData.seguiriaCuidadosCasa,
      ]

      if (requiredFields.some((field) => !hasValue(field))) {
        return 'Completa todos los campos obligatorios del paso 8.'
      }

      if (isStepEightOtherSelected('mananaProductos') && !hasValue(stepEightData.mananaOtro)) {
        return 'Especifica el producto "Otro" de la rutina de manana.'
      }

      if (isStepEightOtherSelected('nocheProductos') && !hasValue(stepEightData.nocheOtro)) {
        return 'Especifica el producto "Otro" de la rutina de noche.'
      }
    }

    if (step === 9) {
      if (getStepNineList('tipoPiel').length === 0 || getStepNineList('estadoActual').length === 0) {
        return 'Selecciona al menos una opcion en tipo de piel y estado actual.'
      }
    }

    if (step === 10) {
      const requiredFields = [
        stepTenData.acneEmpeoraPeriodo,
        stepTenData.cambiosHormonalesRecientes,
        stepTenData.usaAnticonceptivos,
        stepTenData.manipulaGranitos,
        stepTenData.acneDoloroso,
        stepTenData.pielEnrojeceFacilmente,
        stepTenData.pielArdeIrritaFacil,
      ]

      if (requiredFields.some((field) => !hasValue(field))) {
        return 'Completa todos los campos obligatorios del paso 10.'
      }

      if (!hasValue(stepTenData.escalaFitzpatrick) || !hasValue(stepTenData.escalaGlogau)) {
        return 'Selecciona las escalas Fitzpatrick y Glogau.'
      }
    }

    if (step === 11) {
      const requiredFields = [
        stepElevenData.circulacionPiernasCansadas,
        stepElevenData.circulacionVarices,
        stepElevenData.circulacionRetencionLiquidos,
        stepElevenData.circulacionDolorTacto,
        stepElevenData.pesoCambiosRecientes,
        stepElevenData.pesoFluctuaciones,
      ]

      if (requiredFields.some((field) => !hasValue(field))) {
        return 'Completa todos los campos obligatorios del paso 11.'
      }
    }

    return ''
  }

  const saveStepOne = async ({ validate = true } = {}) => {
    if (validate) {
      const validationMessage = validateStep(1)
      if (validationMessage) {
        setError(validationMessage)
        setSuccessMessage('')
        return null
      }
    }

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
      knownCurrentStep: highestSavedStep,
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
    syncHighestSavedStep(valuationResult.valuation?.currentStep ?? 1)

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
      knownCurrentStep: highestSavedStep,
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
    syncHighestSavedStep(result.valuation?.currentStep ?? 2)
    setValuationDocId(result.valuation?.id || valuationDocId)
    return result.valuation?.id || valuationDocId
  }

  const saveStepThree = async ({ validate = true } = {}) => {
    if (validate) {
      const validationMessage = validateStep(3)
      if (validationMessage) {
        setError(validationMessage)
        setSuccessMessage('')
        return null
      }
    }

    setIsSaving(true)
    const result = await saveStepThreeValuation({
      valuationId: valuationDocId,
      knownCurrentStep: highestSavedStep,
      stepThreeData,
    })
    setIsSaving(false)

    if (!result.ok) {
      setError(result.message)
      setSuccessMessage('')
      return null
    }

    setError('')
    setSuccessMessage(result.message)
    syncHighestSavedStep(result.valuation?.currentStep ?? 3)
    setValuationDocId(result.valuation?.id || valuationDocId)
    return result.valuation?.id || valuationDocId
  }

  const saveStepFour = async ({ validate = true } = {}) => {
    if (validate) {
      const validationMessage = validateStep(4)
      if (validationMessage) {
        setError(validationMessage)
        setSuccessMessage('')
        return null
      }
    }

    setIsSaving(true)
    const result = await saveStepFourValuation({
      valuationId: valuationDocId,
      knownCurrentStep: highestSavedStep,
      stepFourData,
    })
    setIsSaving(false)

    if (!result.ok) {
      setError(result.message)
      setSuccessMessage('')
      return null
    }

    setError('')
    setSuccessMessage(result.message)
    syncHighestSavedStep(result.valuation?.currentStep ?? 4)
    setValuationDocId(result.valuation?.id || valuationDocId)
    return result.valuation?.id || valuationDocId
  }

  const saveStepFive = async ({ validate = true } = {}) => {
    if (validate) {
      const validationMessage = validateStep(5)
      if (validationMessage) {
        setError(validationMessage)
        setSuccessMessage('')
        return null
      }
    }

    setIsSaving(true)
    const result = await saveStepFiveValuation({
      valuationId: valuationDocId,
      knownCurrentStep: highestSavedStep,
      stepFiveData,
    })
    setIsSaving(false)

    if (!result.ok) {
      setError(result.message)
      setSuccessMessage('')
      return null
    }

    setError('')
    setSuccessMessage(result.message)
    syncHighestSavedStep(result.valuation?.currentStep ?? 5)
    setValuationDocId(result.valuation?.id || valuationDocId)
    return result.valuation?.id || valuationDocId
  }

  const saveStepSix = async ({ validate = true } = {}) => {
    if (validate) {
      const validationMessage = validateStep(6)
      if (validationMessage) {
        setError(validationMessage)
        setSuccessMessage('')
        return null
      }
    }

    setIsSaving(true)
    const result = await saveStepSixValuation({
      valuationId: valuationDocId,
      knownCurrentStep: highestSavedStep,
      stepSixData,
    })
    setIsSaving(false)

    if (!result.ok) {
      setError(result.message)
      setSuccessMessage('')
      return null
    }

    setError('')
    setSuccessMessage(result.message)
    syncHighestSavedStep(result.valuation?.currentStep ?? 6)
    setValuationDocId(result.valuation?.id || valuationDocId)
    return result.valuation?.id || valuationDocId
  }

  const saveStepSeven = async ({ validate = true } = {}) => {
    if (validate) {
      const validationMessage = validateStep(7)
      if (validationMessage) {
        setError(validationMessage)
        setSuccessMessage('')
        return null
      }
    }

    const normalizedStepSevenData = hasStepSevenImportantQuestions
      ? stepSevenData
      : {
          ...stepSevenData,
          fechaUltimoProcedimiento: '',
          tratamientoIrrito: '',
          tratamientoIrritoDetalle: '',
          quemadurasOMalasExperiencias: '',
          pielReaccionaFacilmente: '',
          toleraBienDolor: '',
        }

    setIsSaving(true)
    const result = await saveStepSevenValuation({
      valuationId: valuationDocId,
      knownCurrentStep: highestSavedStep,
      stepSevenData: normalizedStepSevenData,
    })
    setIsSaving(false)

    if (!result.ok) {
      setError(result.message)
      setSuccessMessage('')
      return null
    }

    setError('')
    setSuccessMessage(result.message)
    syncHighestSavedStep(result.valuation?.currentStep ?? 7)
    setValuationDocId(result.valuation?.id || valuationDocId)
    return result.valuation?.id || valuationDocId
  }

  const saveStepEight = async ({ validate = true } = {}) => {
    if (validate) {
      const validationMessage = validateStep(8)
      if (validationMessage) {
        setError(validationMessage)
        setSuccessMessage('')
        return null
      }
    }

    setIsSaving(true)
    const result = await saveStepEightValuation({
      valuationId: valuationDocId,
      knownCurrentStep: highestSavedStep,
      stepEightData,
    })
    setIsSaving(false)

    if (!result.ok) {
      setError(result.message)
      setSuccessMessage('')
      return null
    }

    setError('')
    setSuccessMessage(result.message)
    syncHighestSavedStep(result.valuation?.currentStep ?? 8)
    setValuationDocId(result.valuation?.id || valuationDocId)
    return result.valuation?.id || valuationDocId
  }

  const saveStepNine = async ({ validate = true } = {}) => {
    if (validate) {
      const validationMessage = validateStep(9)
      if (validationMessage) {
        setError(validationMessage)
        setSuccessMessage('')
        return null
      }
    }

    setIsSaving(true)
    const result = await saveStepNineValuation({
      valuationId: valuationDocId,
      knownCurrentStep: highestSavedStep,
      stepNineData,
    })
    setIsSaving(false)

    if (!result.ok) {
      setError(result.message)
      setSuccessMessage('')
      return null
    }

    setError('')
    setSuccessMessage(result.message)
    syncHighestSavedStep(result.valuation?.currentStep ?? 9)
    setValuationDocId(result.valuation?.id || valuationDocId)
    return result.valuation?.id || valuationDocId
  }

  const saveStepTen = async ({ validate = true } = {}) => {
    if (validate) {
      const validationMessage = validateStep(10)
      if (validationMessage) {
        setError(validationMessage)
        setSuccessMessage('')
        return null
      }
    }

    setIsSaving(true)
    const result = await saveStepTenValuation({
      valuationId: valuationDocId,
      knownCurrentStep: highestSavedStep,
      stepTenData,
    })
    setIsSaving(false)

    if (!result.ok) {
      setError(result.message)
      setSuccessMessage('')
      return null
    }

    setError('')
    setSuccessMessage(result.message)
    syncHighestSavedStep(result.valuation?.currentStep ?? 10)
    setValuationDocId(result.valuation?.id || valuationDocId)
    return result.valuation?.id || valuationDocId
  }

  const saveStepEleven = async ({ validate = true } = {}) => {
    if (validate) {
      const validationMessage = validateStep(11)
      if (validationMessage) {
        setError(validationMessage)
        setSuccessMessage('')
        return null
      }
    }

    setIsSaving(true)
    const result = await saveStepElevenValuation({
      valuationId: valuationDocId,
      knownCurrentStep: highestSavedStep,
      stepElevenData,
    })
    setIsSaving(false)

    if (!result.ok) {
      setError(result.message)
      setSuccessMessage('')
      return null
    }

    let historyWarning = ''
    if (clientFlowType === 'nuevo' && selectedClientId) {
      const refreshedValuationResult = await getValuationForEdition({
        valuationId: result.valuation?.id || valuationDocId,
      })

      const historyResult = await saveClientClinicalHistoryFromValuation({
        clientId: selectedClientId,
        valuationId: result.valuation?.id || valuationDocId,
        clientSnapshot: stepOneData,
        valuationSnapshot: refreshedValuationResult.ok
          ? refreshedValuationResult.valuation
          : {
              step1: stepOneData,
              step3: stepThreeData,
              step4: stepFourData,
              step5: stepFiveData,
              step6: stepSixData,
              step7: stepSevenData,
              step8: stepEightData,
              step9: stepNineData,
              step10: stepTenData,
              step11: stepElevenData,
              semaforoCutaneo: cutaneoModal.selected,
              mapaInteractivo: null,
              fotografiasClinicas: null,
              clienteNombre: `${stepOneData.nombre} ${stepOneData.apellidoPaterno} ${stepOneData.apellidoMaterno}`.replace(/\s+/g, ' ').trim(),
            },
      })
      console.log('historyResult', historyResult)

      if (!historyResult.ok) {
        historyWarning = historyResult.message
      }
    }

    setError(historyWarning)
    setSuccessMessage(historyWarning ? `${result.message} ${historyWarning}` : result.message)
    syncHighestSavedStep(result.valuation?.currentStep ?? 11)
    setValuationDocId(result.valuation?.id || valuationDocId)
    return result.valuation?.id || valuationDocId
  }

  const openCutaneoModal = () => {
    setCutaneoModal((previous) => ({
      ...previous,
      open: true,
    }))
  }

  const closeCutaneoModal = () => {
    setCutaneoModal((previous) => ({
      ...previous,
      open: false,
    }))
  }

  const saveCutaneoStatus = async () => {
    if (!valuationDocId) {
      setError('Primero guarda la valoracion para registrar el semaforo cutaneo.')
      return false
    }

    setCutaneoModal((previous) => ({
      ...previous,
      isSaving: true,
    }))

    const result = await saveCutaneoStatusData({
      valuationId: valuationDocId,
      cutaneoStatus: cutaneoModal.selected,
    })

    setCutaneoModal((previous) => ({
      ...previous,
      isSaving: false,
    }))

    if (!result.ok) {
      setError(result.message)
      return false
    }

    setError('')
    return true
  }

  const saveRecurrentStepFour = async ({ validate = true } = {}) => {
    if (validate) {
      const validationMessage = validateStep(4)
      if (validationMessage) {
        setError(validationMessage)
        setSuccessMessage('')
        return null
      }
    }

    setIsSaving(true)
    const result = await saveRecurrentStepFourValuation({
      valuationId: valuationDocId,
      recurrentStepFourData,
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
    const nextValuationId = await saveStepOne({ validate: false })

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
    setSuccessMessage('')
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

    setActiveStep(clientFlowType === 'recurrente' ? 3 : 3)
    setSuccessMessage('')
  }

  const handleSaveStepThreeAndExit = async (event) => {
    event.preventDefault()
    const nextValuationId = await saveStepThree({ validate: false })

    if (!nextValuationId) {
      return
    }

    navigate('/app/valoraciones-pendientes')
  }

  const handleSaveStepThreeAndContinue = async (event) => {
    event.preventDefault()
    const nextValuationId = await saveStepThree()

    if (!nextValuationId) {
      return
    }

    setActiveStep(4)
    setSuccessMessage('')
  }

  const handleSaveStepFourAndExit = async (event) => {
    event.preventDefault()
    const nextValuationId = await saveStepFour({ validate: false })

    if (!nextValuationId) {
      return
    }

    navigate('/app/valoraciones-pendientes')
  }

  const handleSaveStepFourAndContinue = async (event) => {
    event.preventDefault()
    const nextValuationId = await saveStepFour()

    if (!nextValuationId) {
      return
    }

    setActiveStep(5)
    setSuccessMessage('')
  }

  const handleSaveStepFiveAndExit = async (event) => {
    event.preventDefault()
    const nextValuationId = await saveStepFive({ validate: false })

    if (!nextValuationId) {
      return
    }

    navigate('/app/valoraciones-pendientes')
  }

  const handleSaveStepFiveAndContinue = async (event) => {
    event.preventDefault()
    const nextValuationId = await saveStepFive()

    if (!nextValuationId) {
      return
    }

    setActiveStep(6)
    setSuccessMessage('')
  }

  const handleSaveStepSixAndExit = async (event) => {
    event.preventDefault()
    const nextValuationId = await saveStepSix({ validate: false })

    if (!nextValuationId) {
      return
    }

    navigate('/app/valoraciones-pendientes')
  }

  const handleSaveStepSixAndContinue = async (event) => {
    event.preventDefault()
    const nextValuationId = await saveStepSix()

    if (!nextValuationId) {
      return
    }

    setActiveStep(7)
    setSuccessMessage('')
  }

  const handleSaveStepSevenAndExit = async (event) => {
    event.preventDefault()
    const nextValuationId = await saveStepSeven({ validate: false })

    if (!nextValuationId) {
      return
    }

    navigate('/app/valoraciones-pendientes')
  }

  const handleSaveStepSevenAndContinue = async (event) => {
    event.preventDefault()
    const nextValuationId = await saveStepSeven()

    if (!nextValuationId) {
      return
    }

    setActiveStep(clientFlowType === 'recurrente' ? 4 : 8)
    setSuccessMessage('')
  }

  const handleSaveStepEightAndExit = async (event) => {
    event.preventDefault()
    const nextValuationId = await saveStepEight({ validate: false })

    if (!nextValuationId) {
      return
    }

    navigate('/app/valoraciones-pendientes')
  }

  const handleSaveStepEightAndContinue = async (event) => {
    event.preventDefault()
    const nextValuationId = await saveStepEight()

    if (!nextValuationId) {
      return
    }

    setActiveStep(9)
    setSuccessMessage('')
  }

  const handleSaveStepNineAndExit = async (event) => {
    event.preventDefault()
    const nextValuationId = await saveStepNine({ validate: false })

    if (!nextValuationId) {
      return
    }

    navigate('/app/valoraciones-pendientes')
  }

  const handleSaveStepNineAndContinue = async (event) => {
    event.preventDefault()
    const nextValuationId = await saveStepNine()

    if (!nextValuationId) {
      return
    }

    setActiveStep(10)
    setSuccessMessage('')
  }

  const handleSaveStepTenAndExit = async (event) => {
    event.preventDefault()
    const nextValuationId = await saveStepTen({ validate: false })

    if (!nextValuationId) {
      return
    }

    navigate('/app/valoraciones-pendientes')
  }

  const handleSaveStepTenAndContinue = async (event) => {
    event.preventDefault()
    const nextValuationId = await saveStepTen()

    if (!nextValuationId) {
      return
    }

    setActiveStep(11)
    setSuccessMessage('')
  }

  const handleSaveStepElevenAndExit = async (event) => {
    event.preventDefault()
    const nextValuationId = await saveStepEleven({ validate: false })

    if (!nextValuationId) {
      return
    }

    navigate('/app/valoraciones-pendientes')
  }

  const handleSaveStepElevenAndContinue = async (event) => {
    event.preventDefault()
    const nextValuationId = await saveStepEleven()

    if (!nextValuationId) {
      return
    }

    navigate('/app/valoraciones-pendientes')
  }

  const handleSaveRecurrentStepFourAndExit = async (event) => {
    event.preventDefault()
    const nextValuationId = await saveRecurrentStepFour({ validate: false })

    if (!nextValuationId) {
      return
    }

    navigate('/app/valoraciones-pendientes')
  }

  const handleSaveRecurrentStepFourAndContinue = async (event) => {
    event.preventDefault()
    const nextValuationId = await saveRecurrentStepFour()

    if (!nextValuationId) {
      return
    }

    navigate('/app/valoraciones-pendientes')
  }

  const handleAddProtocolProduct = () => {
    const name = protocolProductName.trim()
    const useText = protocolProductUse.trim()

    if (!name || !useText) {
      setError('Completa nombre y uso del producto antes de agregarlo.')
      return
    }

    setProtocolProducts((previous) => [
      ...previous,
      { name, use: useText },
    ])
    setProtocolProductName('')
    setProtocolProductUse('')
    setError('')
  }

  const removeProtocolProduct = (index) => {
    setProtocolProducts((previous) => previous.filter((_, itemIndex) => itemIndex !== index))
  }

  const saveProtocol = async ({ saveOnly = false } = {}) => {
    if (!valuationDocId) {
      setError('No se encontro la valoracion para guardar el protocolo.')
      return null
    }

    if (protocolProducts.length === 0) {
      setError('Agrega al menos un producto antes de guardar el protocolo.')
      return null
    }

    setIsSaving(true)
    const result = await saveProtocolProducts({
      valuationId: valuationDocId,
      protocolProducts,
    })
    setIsSaving(false)

    if (!result.ok) {
      setError(result.message)
      setSuccessMessage('')
      return null
    }

    setError('')
    setSuccessMessage(result.message)
    return valuationDocId
  }

  const handleExitProtocol = () => {
    navigate('/app/valoraciones-pendientes')
  }

  return (
    <section className="module-screen">
      <div className="module-screen-head">
        <button type="button" className="main-button secondary" onClick={() => navigate('/app')}>
          Regresar al menu principal
        </button>

        <div>
          <h1>{titleText}</h1>
          <div className="valuation-progress-head">
            <div
              className="valuation-progress-track"
              role="progressbar"
              aria-label={`Progreso de valoracion: paso ${normalizedProgressStep} de ${progressTotalSteps}`}
              aria-valuemin={1}
              aria-valuemax={progressTotalSteps}
              aria-valuenow={normalizedProgressStep}
            >
              <span className="valuation-progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {isLoading ? <p className="subtitle">Cargando valoracion...</p> : null}

      {!isLoading && !isProtocolMode && !isFlowSelected ? (
        <div className="client-mode-toggle">
          <button
            type="button"
            className="client-mode-button"
            onClick={() => selectClientFlowType('nuevo')}
          >
            CLIENTE NUEVO
          </button>
          <button
            type="button"
            className="client-mode-button"
            onClick={() => selectClientFlowType('recurrente')}
          >
            CLIENTE FRECUENTE
          </button>
        </div>
      ) : null}

      {!isLoading && isProtocolMode ? (
        <form className="simple-form valuation-form" onSubmit={async (event) => {
          event.preventDefault()
          await saveProtocol({ saveOnly: true })
        }}>
          <div className="valuation-section-title">Registro de productos</div>

          <div className="valuation-grid">
            <label>
              Nombre del producto
              <input
                type="text"
                value={protocolProductName}
                onChange={(event) => setProtocolProductName(event.target.value)}
                placeholder="Ej. Crema hidratante"
              />
            </label>

            <label>
              Para qué se usó
              <input
                type="text"
                value={protocolProductUse}
                onChange={(event) => setProtocolProductUse(event.target.value)}
                placeholder="Ej. Hidratacion facial"
              />
            </label>
          </div>

          <div className="valuation-actions" style={{ gap: '0.75rem' }}>
            <button
              type="button"
              className="main-button secondary"
              onClick={handleAddProtocolProduct}
            >
              Agregar producto
            </button>
          </div>

          {protocolProducts.length > 0 ? (
            <div className="selection-card valuation-field-large">
              <p className="selection-title">Productos agregados</p>
              <div className="protocol-products">
                {protocolProducts.map((product, index) => (
                  <div key={`${product.name}-${index}`} className="protocol-product-item">
                    <div>
                      <strong>{product.name}</strong>
                      <p>{product.use}</p>
                    </div>
                    <button
                      type="button"
                      className="main-button secondary"
                      onClick={() => removeProtocolProduct(index)}
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="selection-empty">No hay productos agregados.</p>
          )}

          {error ? <p className="error-text">{error}</p> : null}

          <div className="valuation-actions">
            <button
              type="button"
              className="main-button secondary"
              disabled={isSaving}
              onClick={handleExitProtocol}
            >
              Salir
            </button>
            <button
              type="button"
              className="main-button"
              disabled={isSaving}
              onClick={() => saveProtocol({ saveOnly: false })}
            >
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      ) : null}

      {!isLoading && isFlowSelected && activeStep === 1 ? (
        <form className="simple-form valuation-form" onSubmit={handleSaveAndExit}>
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

              {selectedClientId ? (
                <div className="client-detail-grid">
                  <p><strong>Nombre completo:</strong> {`${stepOneData.nombre} ${stepOneData.apellidoPaterno} ${stepOneData.apellidoMaterno}`.replace(/\s+/g, ' ').trim()}</p>
                  <p><strong>Fecha de nacimiento:</strong> {stepOneData.fechaNacimiento || 'Sin dato'}</p>
                </div>
              ) : null}

              <div className="valuation-grid">
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
            </div>
          ) : null}

          {clientFlowType === 'nuevo' ? (
            <>
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
            </>
          ) : null}

          {error ? <p className="error-text">{error}</p> : null}

          <div className="valuation-actions">
            <button type="submit" className="main-button" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Salir'}
            </button>
            <button
              type="button"
              className="main-button secondary"
              disabled={isSaving}
              onClick={handleSaveAndContinue}
            >
              Continuar
            </button>
          </div>
        </form>
      ) : null}

      {!isLoading && isFlowSelected && activeStep === 2 ? (
        <form className="simple-form valuation-form" onSubmit={handleSaveStepTwoAndExit}>
          <div className="valuation-section-title">Motivo de consulta</div>

          <div className="motivos-wrapper">
            <div className="consultation-block">
              <h3 className="consultation-block-title">Facial</h3>
              <button
                type="button"
                className="main-button secondary selection-trigger"
                onClick={() =>
                  openStepTwoModal('motivosFaciales', 'Selecciona motivos faciales', STEP_TWO_OPTIONS.facial)}
              >
                Seleccionar motivos faciales
              </button>

              {getStepTwoList('motivosFaciales').length > 0 ? (
                <div className="selection-tags">
                  {getStepTwoList('motivosFaciales').map((motivo) => (
                    <span key={`tag-facial-${motivo}`} className="selection-tag">
                      {motivo}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="selection-empty">Sin seleccion</p>
              )}
            </div>

            <div className="consultation-block">
              <h3 className="consultation-block-title">Corporal</h3>
              <button
                type="button"
                className="main-button secondary selection-trigger"
                onClick={() =>
                  openStepTwoModal('motivosCorporales', 'Selecciona motivos corporales', STEP_TWO_OPTIONS.corporal)}
              >
                Seleccionar motivos corporales
              </button>

              {getStepTwoList('motivosCorporales').length > 0 ? (
                <div className="selection-tags">
                  {getStepTwoList('motivosCorporales').map((motivo) => (
                    <span key={`tag-corporal-${motivo}`} className="selection-tag">
                      {motivo}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="selection-empty">Sin seleccion</p>
              )}
            </div>
          </div>

          {error ? <p className="error-text">{error}</p> : null}

          <div className="selection-card valuation-field-large">
            <p className="selection-title">Semaforo cutaneo</p>
            <p className="selection-empty">
              {cutaneoModal.selected
                ? CUTANEO_OPTIONS.find((option) => option.value === cutaneoModal.selected)?.label || 'Sin seleccion'
                : 'Sin seleccion'}
            </p>
            <button type="button" className="main-button secondary selection-trigger" onClick={openCutaneoModal}>
              Seleccionar semaforo cutaneo
            </button>
          </div>

          <div className="valuation-actions">
            <button type="submit" className="main-button" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Salir'}
            </button>

            <button
              type="button"
              className="main-button secondary"
              disabled={isSaving}
              onClick={handleSaveStepTwoAndContinue}
            >
              Continuar
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

      {!isLoading && !isProtocolMode && clientFlowType === 'nuevo' && activeStep === 3 ? (
        <form className="simple-form valuation-form" onSubmit={handleSaveStepThreeAndExit}>
          <div className="valuation-section-title">Expectativas y prioridades del cliente</div>

          <div className="valuation-grid">
            <label className="valuation-field-large">
              Que es lo que mas te gustaria mejorar?
              <textarea
                required
                rows="3"
                value={stepThreeData.mejoraPrincipal}
                onChange={(event) => setStepThreeFieldValue('mejoraPrincipal', event.target.value)}
              />
            </label>

            <label className="valuation-field-large">
              Que resultado esperas obtener?
              <textarea
                required
                rows="3"
                value={stepThreeData.resultadoEsperado}
                onChange={(event) => setStepThreeFieldValue('resultadoEsperado', event.target.value)}
              />
            </label>

            <label>
              En cuanto tiempo esperas verlo?
              <input
                required
                value={stepThreeData.tiempoEsperado}
                onChange={(event) => setStepThreeFieldValue('tiempoEsperado', event.target.value)}
                placeholder="Ejemplo: 2 meses"
              />
            </label>

            <label className="valuation-field-large">
              Que zona te incomoda mas visualmente?
              <textarea
                rows="3"
                value={stepThreeData.zonaIncomoda}
                onChange={(event) => setStepThreeFieldValue('zonaIncomoda', event.target.value)}
              />
            </label>

            <label className="valuation-field-large">
              Hay algo mas importante que deba saber sobre tu piel o cuerpo?
              <textarea
                rows="3"
                value={stepThreeData.notasAdicionalesPielCuerpo}
                onChange={(event) => setStepThreeFieldValue('notasAdicionalesPielCuerpo', event.target.value)}
              />
            </label>
          </div>

          {error ? <p className="error-text">{error}</p> : null}

          <div className="valuation-actions">
            <button type="submit" className="main-button" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Salir'}
            </button>

            <button
              type="button"
              className="main-button secondary"
              disabled={isSaving}
              onClick={handleSaveStepThreeAndContinue}
            >
              Continuar
            </button>

            <button
              type="button"
              className="main-button secondary"
              disabled={isSaving}
              onClick={() => setActiveStep(2)}
            >
              Volver al paso 2
            </button>
          </div>
        </form>
      ) : null}

      {!isLoading && !isProtocolMode && clientFlowType === 'nuevo' && activeStep === 4 ? (
        <form className="simple-form valuation-form" onSubmit={handleSaveStepFourAndExit}>
          <div className="valuation-section-title">Historial clinico</div>
          <div className="valuation-grid">
            <div className="valuation-field-large selection-card">
              <p className="selection-title">Enfermedades</p>
              <button
                type="button"
                className="main-button secondary selection-trigger"
                onClick={() =>
                  openStepFourModal('enfermedades', 'Selecciona enfermedades', STEP_FOUR_OPTIONS.enfermedades)}
              >
                Seleccionar enfermedades
              </button>

              {getStepFourList('enfermedades').length > 0 ? (
                <div className="selection-tags">
                  {getStepFourList('enfermedades').map((item) => (
                    <span key={`enfermedad-${item}`} className="selection-tag">
                      {formatStepFourSelectedItem('enfermedades', item)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="selection-empty">Sin seleccion</p>
              )}
            </div>

            <label>
              Estas embarazada?
              <select
                required
                value={stepFourData.embarazoActual}
                onChange={(event) => setStepFourFieldValue('embarazoActual', event.target.value)}
              >
                <option value="">Sin respuesta</option>
                <option value="si">Si</option>
                <option value="no">No</option>
              </select>
            </label>

            <label>
              Estas lactando?
              <select
                required
                value={stepFourData.lactanciaActual}
                onChange={(event) => setStepFourFieldValue('lactanciaActual', event.target.value)}
              >
                <option value="">Sin respuesta</option>
                <option value="si">Si</option>
                <option value="no">No</option>
              </select>
            </label>

            <label>
              Planeas embarazo proximamente?
              <select
                required
                value={stepFourData.embarazoProximo}
                onChange={(event) => setStepFourFieldValue('embarazoProximo', event.target.value)}
              >
                <option value="">Sin respuesta</option>
                <option value="si">Si</option>
                <option value="no">No</option>
              </select>
            </label>

            <div className="valuation-field-large selection-card">
              <p className="selection-title">Medicamentos</p>
              <button
                type="button"
                className="main-button secondary selection-trigger"
                onClick={() =>
                  openStepFourModal(
                    'medicamentosActuales',
                    'Selecciona medicamentos que tomas actualmente',
                    STEP_FOUR_OPTIONS.medicamentos,
                  )}
              >
                Seleccionar medicamentos
              </button>

              {getStepFourList('medicamentosActuales').length > 0 ? (
                <div className="selection-tags">
                  {getStepFourList('medicamentosActuales').map((item) => (
                    <span key={`medicamento-${item}`} className="selection-tag">
                      {formatStepFourSelectedItem('medicamentosActuales', item)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="selection-empty">Sin seleccion</p>
              )}
            </div>

            <div className="valuation-field-large selection-card">
              <p className="selection-title">Alergias y contraindicaciones</p>
              <button
                type="button"
                className="main-button secondary selection-trigger"
                onClick={() =>
                  openStepFourModal('alergias', 'Selecciona alergias', STEP_FOUR_OPTIONS.alergias)}
              >
                Seleccionar alergias
              </button>

              {getStepFourList('alergias').length > 0 ? (
                <div className="selection-tags">
                  {getStepFourList('alergias').map((item) => (
                    <span key={`alergia-${item}`} className="selection-tag">
                      {formatStepFourSelectedItem('alergias', item)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="selection-empty">Sin seleccion</p>
              )}
            </div>
          </div>

          {error ? <p className="error-text">{error}</p> : null}

          <div className="valuation-actions">
            <button type="submit" className="main-button" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Salir'}
            </button>

            <button
              type="button"
              className="main-button secondary"
              disabled={isSaving}
              onClick={handleSaveStepFourAndContinue}
            >
              Continuar
            </button>

            <button
              type="button"
              className="main-button secondary"
              disabled={isSaving}
              onClick={() => setActiveStep(3)}
            >
              Volver al paso 3
            </button>
          </div>
        </form>
      ) : null}

      {!isLoading && !isProtocolMode && clientFlowType === 'nuevo' && activeStep === 5 ? (
        <form className="simple-form valuation-form" onSubmit={handleSaveStepFiveAndExit}>
          <div className="valuation-section-title">Habitos y estilo de vida</div>

          <div className="valuation-grid">
            <label>
              Cuanta agua tomas al dia?
              <input
                required
                value={stepFiveData.aguaDiaria}
                onChange={(event) => setStepFiveFieldValue('aguaDiaria', event.target.value)}
                placeholder="Ejemplo: 2 litros"
              />
            </label>

            <label>
              Como calificas tu alimentacion?
              <select
                required
                value={stepFiveData.calidadAlimentacion}
                onChange={(event) => setStepFiveFieldValue('calidadAlimentacion', event.target.value)}
              >
                <option value="">Sin respuesta</option>
                <option value="muy buena">Muy buena</option>
                <option value="buena">Buena</option>
                <option value="regular">Regular</option>
                <option value="mala">Mala</option>
                <option value="muy mala">Muy mala</option>
              </select>
            </label>

            <label>
              Consumes mucho azucar o lacteos?
              <select
                required
                value={stepFiveData.consumeAzucarLacteos}
                onChange={(event) => setStepFiveFieldValue('consumeAzucarLacteos', event.target.value)}
              >
                <option value="">Sin respuesta</option>
                <option value="si">Si</option>
                <option value="no">No</option>
              </select>
            </label>

            <label>
              Fumas?
              <select
                required
                value={stepFiveData.fuma}
                onChange={(event) => setStepFiveFieldValue('fuma', event.target.value)}
              >
                <option value="">Sin respuesta</option>
                <option value="si">Si</option>
                <option value="no">No</option>
              </select>
            </label>

            <label>
              Consumes alcohol?
              <select
                required
                value={stepFiveData.consumeAlcohol}
                onChange={(event) => setStepFiveFieldValue('consumeAlcohol', event.target.value)}
              >
                <option value="">Sin respuesta</option>
                <option value="si">Si</option>
                <option value="no">No</option>
              </select>
            </label>

            <label>
              Realizas ejercicio?
              <select
                required
                value={stepFiveData.realizaEjercicio}
                onChange={(event) => setStepFiveFieldValue('realizaEjercicio', event.target.value)}
              >
                <option value="">Sin respuesta</option>
                <option value="si">Si</option>
                <option value="no">No</option>
              </select>
            </label>

            <label>
              Cuantas veces por semana?
              <input
                value={stepFiveData.ejercicioFrecuenciaSemanal}
                onChange={(event) => setStepFiveFieldValue('ejercicioFrecuenciaSemanal', event.target.value)}
                placeholder="Ejemplo: 3 veces"
              />
            </label>

            <label>
              Cuantas horas duermes?
              <input
                required
                value={stepFiveData.horasSueno}
                onChange={(event) => setStepFiveFieldValue('horasSueno', event.target.value)}
                placeholder="Ejemplo: 7 horas"
              />
            </label>

            <label>
              Tu nivel de estres es alto?
              <select
                required
                value={stepFiveData.estresAlto}
                onChange={(event) => setStepFiveFieldValue('estresAlto', event.target.value)}
              >
                <option value="">Sin respuesta</option>
                <option value="si">Si</option>
                <option value="no">No</option>
              </select>
            </label>

            <label>
              Te desvelas frecuentemente?
              <select
                required
                value={stepFiveData.desvelosFrecuentes}
                onChange={(event) => setStepFiveFieldValue('desvelosFrecuentes', event.target.value)}
              >
                <option value="">Sin respuesta</option>
                <option value="si">Si</option>
                <option value="no">No</option>
              </select>
            </label>
          </div>

          {error ? <p className="error-text">{error}</p> : null}

          <div className="valuation-actions">
            <button type="submit" className="main-button" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Salir'}
            </button>

            <button
              type="button"
              className="main-button secondary"
              disabled={isSaving}
              onClick={handleSaveStepFiveAndContinue}
            >
              Continuar
            </button>

            <button
              type="button"
              className="main-button secondary"
              disabled={isSaving}
              onClick={() => setActiveStep(4)}
            >
              Volver al paso 4
            </button>
          </div>
        </form>
      ) : null}

      {!isLoading && !isProtocolMode && clientFlowType === 'nuevo' && activeStep === 6 ? (
        <form className="simple-form valuation-form" onSubmit={handleSaveStepSixAndExit}>
          <div className="valuation-section-title">Exposicion solar</div>

          <div className="valuation-grid">
            <label>
              Usas protector solar diariamente?
              <select
                required
                value={stepSixData.usaProtectorDiario}
                onChange={(event) => setStepSixFieldValue('usaProtectorDiario', event.target.value)}
              >
                <option value="">Sin respuesta</option>
                <option value="si">Si</option>
                <option value="no">No</option>
              </select>
            </label>

            <label>
              Que SPF utilizas?
              <input
                value={stepSixData.spfUtilizado}
                onChange={(event) => setStepSixFieldValue('spfUtilizado', event.target.value)}
                placeholder="Ejemplo: SPF 50"
              />
            </label>

            <label>
              Cada cuanto reaplicas?
              <input
                value={stepSixData.frecuenciaReaplicacion}
                onChange={(event) => setStepSixFieldValue('frecuenciaReaplicacion', event.target.value)}
                placeholder="Ejemplo: cada 3 horas"
              />
            </label>

            <label>
              Trabajas o pasas mucho tiempo al sol?
              <select
                required
                value={stepSixData.tiempoProlongadoSol}
                onChange={(event) => setStepSixFieldValue('tiempoProlongadoSol', event.target.value)}
              >
                <option value="">Sin respuesta</option>
                <option value="si">Si</option>
                <option value="no">No</option>
              </select>
            </label>

            <label>
              Has tenido quemaduras solares recientes?
              <select
                required
                value={stepSixData.quemadurasSolaresRecientes}
                onChange={(event) => setStepSixFieldValue('quemadurasSolaresRecientes', event.target.value)}
              >
                <option value="">Sin respuesta</option>
                <option value="si">Si</option>
                <option value="no">No</option>
              </select>
            </label>
          </div>

          {error ? <p className="error-text">{error}</p> : null}

          <div className="valuation-actions">
            <button type="submit" className="main-button" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Salir'}
            </button>

            <button
              type="button"
              className="main-button secondary"
              disabled={isSaving}
              onClick={handleSaveStepSixAndContinue}
            >
              Continuar
            </button>

            <button
              type="button"
              className="main-button secondary"
              disabled={isSaving}
              onClick={() => setActiveStep(5)}
            >
              Volver al paso 5
            </button>
          </div>
        </form>
      ) : null}

      {!isLoading && !isProtocolMode && ((clientFlowType === 'nuevo' && activeStep === 7) || (clientFlowType === 'recurrente' && activeStep === 3)) ? (
        <form className="simple-form valuation-form" onSubmit={handleSaveStepSevenAndExit}>
          <div className="valuation-section-title">Historial estetico</div>

          <div className="valuation-grid">
            <div className="valuation-field-large selection-card">
              <p className="selection-title">Procedimientos previos</p>
              <button
                type="button"
                className="main-button secondary selection-trigger"
                onClick={() =>
                  openStepSevenModal('procedimientos', 'Selecciona procedimientos previos')}
              >
                Seleccionar procedimientos
              </button>

              {stepSevenData.procedimientosPrevios.length > 0 ? (
                <div className="selection-tags">
                  {stepSevenData.procedimientosPrevios.map((item) => (
                    <span key={`procedimiento-${item}`} className="selection-tag">
                      {formatStepSevenProcedimientoSelectedItem(item)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="selection-empty">Sin seleccion</p>
              )}
            </div>

            <div className="selection-card">
              <p className="selection-title">Faciales previos</p>
              <button
                type="button"
                className="main-button secondary selection-trigger"
                onClick={() => openStepSevenModal('faciales', 'Faciales previos')}
              >
                Configurar faciales previos
              </button>

              <p className="selection-empty">
                {stepSevenData.facialesPrevios
                  ? `Respuesta: ${stepSevenData.facialesPrevios === 'si' ? 'Si' : 'No'}`
                  : 'Sin respuesta'}
              </p>
              {stepSevenData.facialesPrevios === 'si' && stepSevenData.facialesPreviosCuales ? (
                <p className="selection-empty">Cuales: {stepSevenData.facialesPreviosCuales}</p>
              ) : null}
            </div>

            <div className="selection-card">
              <p className="selection-title">Aparatologia corporal</p>
              <button
                type="button"
                className="main-button secondary selection-trigger"
                onClick={() => openStepSevenModal('aparatologia', 'Aparatologia corporal')}
              >
                Configurar aparatologia corporal
              </button>

              <p className="selection-empty">
                {stepSevenData.aparatologiaCorporal
                  ? `Respuesta: ${stepSevenData.aparatologiaCorporal === 'si' ? 'Si' : 'No'}`
                  : 'Sin respuesta'}
              </p>
              {stepSevenData.aparatologiaCorporal === 'si' && stepSevenData.aparatologiaCorporalCuales ? (
                <p className="selection-empty">Cuales: {stepSevenData.aparatologiaCorporalCuales}</p>
              ) : null}
            </div>

            {hasStepSevenImportantQuestions ? (
              <div className="selection-card">
                <p className="selection-title required-title">Preguntas importantes</p>
              <div className="valuation-grid">
                <label>
                  Cuando fue tu ultimo procedimiento?
                  <input
                    required
                    type="date"
                    value={stepSevenData.fechaUltimoProcedimiento}
                    onChange={(event) =>
                      setStepSevenFieldValue('fechaUltimoProcedimiento', event.target.value)}
                  />
                </label>

                <label>
                  Algun tratamiento te irrito?
                  <select
                    required
                    value={stepSevenData.tratamientoIrrito}
                    onChange={(event) => setStepSevenFieldValue('tratamientoIrrito', event.target.value)}
                  >
                    <option value="">Sin respuesta</option>
                    <option value="si">Si</option>
                    <option value="no">No</option>
                  </select>
                </label>

                {stepSevenData.tratamientoIrrito === 'si' ? (
                  <label className="valuation-field-large">
                    Cual tratamiento te irrito?
                    <textarea
                      required
                      rows="3"
                      value={stepSevenData.tratamientoIrritoDetalle}
                      onChange={(event) =>
                        setStepSevenFieldValue('tratamientoIrritoDetalle', event.target.value)}
                    />
                  </label>
                ) : null}

                <label>
                  Has tenido quemaduras o malas experiencias?
                  <select
                    required
                    value={stepSevenData.quemadurasOMalasExperiencias}
                    onChange={(event) =>
                      setStepSevenFieldValue('quemadurasOMalasExperiencias', event.target.value)}
                  >
                    <option value="">Sin respuesta</option>
                    <option value="si">Si</option>
                    <option value="no">No</option>
                  </select>
                </label>

                <label>
                  Tu piel reacciona facilmente?
                  <select
                    required
                    value={stepSevenData.pielReaccionaFacilmente}
                    onChange={(event) =>
                      setStepSevenFieldValue('pielReaccionaFacilmente', event.target.value)}
                  >
                    <option value="">Sin respuesta</option>
                    <option value="si">Si</option>
                    <option value="no">No</option>
                  </select>
                </label>

                <label>
                  Toleras bien el dolor?
                  <select
                    required
                    value={stepSevenData.toleraBienDolor}
                    onChange={(event) => setStepSevenFieldValue('toleraBienDolor', event.target.value)}
                  >
                    <option value="">Sin respuesta</option>
                    <option value="si">Si</option>
                    <option value="no">No</option>
                  </select>
                </label>
              </div>
              </div>
            ) : null}
          </div>

          {error ? <p className="error-text">{error}</p> : null}

          <div className="valuation-actions">
            <button type="submit" className="main-button" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Salir'}
            </button>

            <button
              type="button"
              className="main-button secondary"
              disabled={isSaving}
              onClick={handleSaveStepSevenAndContinue}
            >
              Continuar
            </button>

            <button
              type="button"
              className="main-button secondary"
              disabled={isSaving}
              onClick={() => setActiveStep(clientFlowType === 'recurrente' ? 2 : 6)}
            >
              {clientFlowType === 'recurrente' ? 'Volver al paso 2' : 'Volver al paso 6'}
            </button>
          </div>
        </form>
      ) : null}

      {!isLoading && !isProtocolMode && clientFlowType === 'recurrente' && activeStep === 4 ? (
        <form className="simple-form valuation-form" onSubmit={handleSaveRecurrentStepFourAndExit}>
          <div className="valuation-section-title">Paso 4</div>

          <div className="valuation-grid">
            <label className="valuation-field-large">
              Ha habido cambios en tu estado de salud?
              <textarea
                required
                rows="3"
                value={recurrentStepFourData.cambiosSalud}
                onChange={(event) => setRecurrentStepFourFieldValue('cambiosSalud', event.target.value)}
              />
            </label>

            <label className="valuation-field-large">
              Estas tomando algun medicamento nuevo?
              <textarea
                required
                rows="3"
                value={recurrentStepFourData.medicamentoNuevo}
                onChange={(event) => setRecurrentStepFourFieldValue('medicamentoNuevo', event.target.value)}
              />
            </label>

            <label className="valuation-field-large">
              Tuviste alguna reaccion despues de la ultima sesion?
              <textarea
                required
                rows="3"
                value={recurrentStepFourData.reaccionUltimaSesion}
                onChange={(event) => setRecurrentStepFourFieldValue('reaccionUltimaSesion', event.target.value)}
              />
            </label>

            <label className="valuation-field-large">
              Seguiste la rutina recomendada?
              <textarea
                required
                rows="3"
                value={recurrentStepFourData.siguioRutina}
                onChange={(event) => setRecurrentStepFourFieldValue('siguioRutina', event.target.value)}
              />
            </label>

            <label className="valuation-field-large">
              Has observado alguna mejora, cambio o preocupacion en tu piel desde la ultima visita?
              <textarea
                required
                rows="3"
                value={recurrentStepFourData.mejoraOCambioPiel}
                onChange={(event) => setRecurrentStepFourFieldValue('mejoraOCambioPiel', event.target.value)}
              />
            </label>
          </div>

          {error ? <p className="error-text">{error}</p> : null}

          <div className="selection-card valuation-field-large">
            <p className="selection-title">Semaforo cutaneo</p>
            <p className="selection-empty">
              {cutaneoModal.selected
                ? CUTANEO_OPTIONS.find((option) => option.value === cutaneoModal.selected)?.label || 'Sin seleccion'
                : 'Sin seleccion'}
            </p>
            <button type="button" className="main-button secondary selection-trigger" onClick={openCutaneoModal}>
              Seleccionar semaforo cutaneo
            </button>
          </div>

          <div className="valuation-actions">
            <button type="submit" className="main-button" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Salir'}
            </button>

            <button
              type="button"
              className="main-button secondary"
              disabled={isSaving}
              onClick={handleSaveRecurrentStepFourAndContinue}
            >
              FINALIZAR
            </button>

            <button
              type="button"
              className="main-button secondary"
              disabled={isSaving}
              onClick={() => setActiveStep(3)}
            >
              Volver al paso 3
            </button>
          </div>
        </form>
      ) : null}

      {!isLoading && !isProtocolMode && clientFlowType === 'nuevo' && activeStep === 8 ? (
        <form className="simple-form valuation-form" onSubmit={handleSaveStepEightAndExit}>
          <div className="valuation-section-title">Rutina actual</div>

          <div className="valuation-grid">
            <div className="selection-card">
              <p className="selection-title">Mañana</p>
              <button
                type="button"
                className="main-button secondary selection-trigger"
                onClick={() =>
                  openStepEightModal('mananaProductos', 'Rutina de mañana', STEP_EIGHT_OPTIONS.manana)}
              >
                Seleccionar rutina de mañana
              </button>

              {stepEightData.mananaProductos.length > 0 ? (
                <div className="selection-tags">
                  {stepEightData.mananaProductos.map((item) => (
                    <span key={`step8-manana-${item}`} className="selection-tag">
                      {formatStepEightSelectedItem('mananaProductos', item)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="selection-empty">Sin seleccion</p>
              )}
            </div>

            <div className="selection-card">
              <p className="selection-title">Noche</p>
              <button
                type="button"
                className="main-button secondary selection-trigger"
                onClick={() =>
                  openStepEightModal('nocheProductos', 'Rutina de noche', STEP_EIGHT_OPTIONS.noche)}
              >
                Seleccionar rutina de noche
              </button>

              {stepEightData.nocheProductos.length > 0 ? (
                <div className="selection-tags">
                  {stepEightData.nocheProductos.map((item) => (
                    <span key={`step8-noche-${item}`} className="selection-tag">
                      {formatStepEightSelectedItem('nocheProductos', item)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="selection-empty">Sin seleccion</p>
              )}
            </div>

            <div className="selection-card valuation-field-large">
              <p className="selection-title">Activos importantes</p>

              <div className="valuation-grid">
                <label>
                  Usas retinol?
                  <select
                    required
                    value={stepEightData.usaRetinol}
                    onChange={(event) => setStepEightFieldValue('usaRetinol', event.target.value)}
                  >
                    <option value="">Sin respuesta</option>
                    <option value="si">Si</option>
                    <option value="no">No</option>
                  </select>
                </label>

                <label>
                  Usas acidos?
                  <select
                    required
                    value={stepEightData.usaAcidos}
                    onChange={(event) => setStepEightFieldValue('usaAcidos', event.target.value)}
                  >
                    <option value="">Sin respuesta</option>
                    <option value="si">Si</option>
                    <option value="no">No</option>
                  </select>
                </label>

                <label className="valuation-field-large">
                  Que productos te han irritado?
                  <textarea
                    rows="3"
                    value={stepEightData.productosIrritaron}
                    onChange={(event) => setStepEightFieldValue('productosIrritaron', event.target.value)}
                  />
                </label>

                <label>
                  Has tenido brotes por algun producto?
                  <select
                    required
                    value={stepEightData.brotesPorProducto}
                    onChange={(event) => setStepEightFieldValue('brotesPorProducto', event.target.value)}
                  >
                    <option value="">Sin respuesta</option>
                    <option value="si">Si</option>
                    <option value="no">No</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="selection-card valuation-field-large">
              <p className="selection-title">Compromiso del cliente</p>

              <div className="valuation-grid">
                <label>
                  Eres constante con tu rutina?
                  <select
                    required
                    value={stepEightData.constanteRutina}
                    onChange={(event) => setStepEightFieldValue('constanteRutina', event.target.value)}
                  >
                    <option value="">Sin respuesta</option>
                    <option value="si">Si</option>
                    <option value="no">No</option>
                  </select>
                </label>

                <label>
                  Podrias seguir cuidados en casa?
                  <select
                    required
                    value={stepEightData.seguiriaCuidadosCasa}
                    onChange={(event) => setStepEightFieldValue('seguiriaCuidadosCasa', event.target.value)}
                  >
                    <option value="">Sin respuesta</option>
                    <option value="si">Si</option>
                    <option value="no">No</option>
                  </select>
                </label>

                <label className="valuation-field-large">
                  Que tanto tiempo le dedicas a tu piel?
                  <textarea
                    rows="3"
                    value={stepEightData.tiempoDedicadoPiel}
                    onChange={(event) => setStepEightFieldValue('tiempoDedicadoPiel', event.target.value)}
                  />
                </label>
              </div>
            </div>
          </div>

          {error ? <p className="error-text">{error}</p> : null}

          <div className="valuation-actions">
            <button type="submit" className="main-button" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Salir'}
            </button>

            <button
              type="button"
              className="main-button secondary"
              disabled={isSaving}
              onClick={handleSaveStepEightAndContinue}
            >
              Continuar
            </button>

            <button
              type="button"
              className="main-button secondary"
              disabled={isSaving}
              onClick={() => setActiveStep(7)}
            >
              Volver al paso 7
            </button>
          </div>
        </form>
      ) : null}

      {!isLoading && !isProtocolMode && clientFlowType === 'nuevo' && activeStep === 9 ? (
        <form className="simple-form valuation-form" onSubmit={handleSaveStepNineAndExit}>
          <div className="valuation-section-title">Evaluacion facial</div>

          <div className="valuation-grid">
            <div className="selection-card">
              <p className="selection-title required-title">Tipo de piel</p>
              <button
                type="button"
                className="main-button secondary selection-trigger"
                onClick={() =>
                  openStepNineModal('tipoPiel', 'Tipo de piel', STEP_NINE_OPTIONS.tipoPiel)}
              >
                Seleccionar tipo de piel
              </button>

              {stepNineData.tipoPiel.length > 0 ? (
                <div className="selection-tags">
                  {stepNineData.tipoPiel.map((item) => (
                    <span key={`step9-tipo-${item}`} className="selection-tag">
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="selection-empty">Sin seleccion</p>
              )}
            </div>

            <div className="selection-card">
              <p className="selection-title required-title">Estado actual</p>
              <button
                type="button"
                className="main-button secondary selection-trigger"
                onClick={() =>
                  openStepNineModal('estadoActual', 'Estado actual', STEP_NINE_OPTIONS.estadoActual)}
              >
                Seleccionar estado actual
              </button>

              {stepNineData.estadoActual.length > 0 ? (
                <div className="selection-tags">
                  {stepNineData.estadoActual.map((item) => (
                    <span key={`step9-estado-${item}`} className="selection-tag">
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="selection-empty">Sin seleccion</p>
              )}
            </div>

            <div className="selection-card valuation-field-large">
              <p className="selection-title">Condiciones presentes</p>
              <button
                type="button"
                className="main-button secondary selection-trigger"
                onClick={() =>
                  openStepNineModal(
                    'condicionesPresentes',
                    'Condiciones presentes',
                    STEP_NINE_OPTIONS.condicionesPresentes,
                  )}
              >
                Seleccionar condiciones presentes
              </button>

              {stepNineData.condicionesPresentes.length > 0 ? (
                <div className="selection-tags">
                  {stepNineData.condicionesPresentes.map((item) => (
                    <span key={`step9-condicion-${item}`} className="selection-tag">
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="selection-empty">Sin seleccion</p>
              )}
            </div>
          </div>

          {error ? <p className="error-text">{error}</p> : null}

          <div className="valuation-actions">
            <button type="submit" className="main-button" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Salir'}
            </button>

            <button
              type="button"
              className="main-button secondary"
              disabled={isSaving}
              onClick={handleSaveStepNineAndContinue}
            >
              Continuar
            </button>

            <button
              type="button"
              className="main-button secondary"
              disabled={isSaving}
              onClick={() => setActiveStep(8)}
            >
              Volver al paso 8
            </button>
          </div>
        </form>
      ) : null}

      {!isLoading && !isProtocolMode && clientFlowType === 'nuevo' && activeStep === 10 ? (
        <form className="simple-form valuation-form" onSubmit={handleSaveStepTenAndExit}>
          <div className="valuation-section-title">Evaluacion facial 2</div>

          <div className="valuation-grid">
            <div className="selection-card valuation-field-large">
              <p className="selection-title">Hormonal</p>

              <div className="valuation-grid">
                <label>
                  Tu acne empeora en tu periodo?
                  <select
                    required
                    value={stepTenData.acneEmpeoraPeriodo}
                    onChange={(event) => setStepTenFieldValue('acneEmpeoraPeriodo', event.target.value)}
                  >
                    <option value="">Sin respuesta</option>
                    <option value="si">Si</option>
                    <option value="no">No</option>
                  </select>
                </label>

                <label>
                  Has tenido cambios hormonales recientes?
                  <select
                    required
                    value={stepTenData.cambiosHormonalesRecientes}
                    onChange={(event) =>
                      setStepTenFieldValue('cambiosHormonalesRecientes', event.target.value)}
                  >
                    <option value="">Sin respuesta</option>
                    <option value="si">Si</option>
                    <option value="no">No</option>
                  </select>
                </label>

                <label>
                  Usas anticonceptivos?
                  <select
                    required
                    value={stepTenData.usaAnticonceptivos}
                    onChange={(event) => setStepTenFieldValue('usaAnticonceptivos', event.target.value)}
                  >
                    <option value="">Sin respuesta</option>
                    <option value="si">Si</option>
                    <option value="no">No</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="selection-card valuation-field-large">
              <p className="selection-title">Acne</p>

              <div className="valuation-grid">
                <label>
                  Desde cuando tienes brotes?
                  <input
                    value={stepTenData.desdeCuandoBrotes}
                    onChange={(event) => setStepTenFieldValue('desdeCuandoBrotes', event.target.value)}
                    placeholder="Ejemplo: hace 2 anos"
                  />
                </label>

                <label>
                  Manipulas los granitos?
                  <select
                    required
                    value={stepTenData.manipulaGranitos}
                    onChange={(event) => setStepTenFieldValue('manipulaGranitos', event.target.value)}
                  >
                    <option value="">Sin respuesta</option>
                    <option value="si">Si</option>
                    <option value="no">No</option>
                  </select>
                </label>

                <label>
                  El acne es doloroso?
                  <select
                    required
                    value={stepTenData.acneDoloroso}
                    onChange={(event) => setStepTenFieldValue('acneDoloroso', event.target.value)}
                  >
                    <option value="">Sin respuesta</option>
                    <option value="si">Si</option>
                    <option value="no">No</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="selection-card valuation-field-large">
              <p className="selection-title">Manchas</p>
              <button
                type="button"
                className="main-button secondary selection-trigger"
                onClick={() =>
                  openStepTenModal('manchasOrigenes', 'Origen de manchas', STEP_TEN_OPTIONS.manchasOrigenes)}
              >
                Seleccionar origen de manchas
              </button>

              {stepTenData.manchasOrigenes.length > 0 ? (
                <div className="selection-tags">
                  {stepTenData.manchasOrigenes.map((item) => (
                    <span key={`step10-mancha-${item}`} className="selection-tag">
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="selection-empty">Sin seleccion</p>
              )}
            </div>

            <div className="selection-card valuation-field-large">
              <p className="selection-title">Sensibilidad</p>

              <div className="valuation-grid">
                <label>
                  Tu piel se enrojece facilmente?
                  <select
                    required
                    value={stepTenData.pielEnrojeceFacilmente}
                    onChange={(event) => setStepTenFieldValue('pielEnrojeceFacilmente', event.target.value)}
                  >
                    <option value="">Sin respuesta</option>
                    <option value="si">Si</option>
                    <option value="no">No</option>
                  </select>
                </label>

                <label>
                  Tu piel arde o irrita con facilidad?
                  <select
                    required
                    value={stepTenData.pielArdeIrritaFacil}
                    onChange={(event) => setStepTenFieldValue('pielArdeIrritaFacil', event.target.value)}
                  >
                    <option value="">Sin respuesta</option>
                    <option value="si">Si</option>
                    <option value="no">No</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="selection-card valuation-field-large">
              <p className="selection-title">Escalas (propuesta)</p>

              <div className="valuation-grid">
                <div className="valuation-field-large">
                  <p className="selection-title required-title">Fitzpatrick</p>
                  <button
                    type="button"
                    className="main-button secondary selection-trigger"
                    onClick={() =>
                      openStepTenModal(
                        'escalaFitzpatrick',
                        'Escala Fitzpatrick',
                        STEP_TEN_OPTIONS.escalaFitzpatrick,
                        'single',
                      )}
                  >
                    Seleccionar nivel Fitzpatrick
                  </button>

                  {stepTenData.escalaFitzpatrick ? (
                    <div className="selection-tags">
                      <span className="selection-tag fitzpatrick-selection-tag">
                        <span
                          className="fitzpatrick-color-dot"
                          style={{
                            backgroundColor:
                              getFitzpatrickOptionByValue(stepTenData.escalaFitzpatrick)?.color || '#ffffff',
                          }}
                        />
                        {formatFitzpatrickSelectedItem(stepTenData.escalaFitzpatrick)}
                      </span>
                    </div>
                  ) : (
                    <p className="selection-empty">Sin seleccion</p>
                  )}
                </div>

                <div className="valuation-field-large">
                  <p className="selection-title required-title">Glogau</p>
                  <button
                    type="button"
                    className="main-button secondary selection-trigger"
                    onClick={() =>
                      openStepTenModal(
                        'escalaGlogau',
                        'Escala Glogau',
                        STEP_TEN_OPTIONS.escalaGlogau,
                        'single-glogau',
                      )}
                  >
                    Seleccionar nivel Glogau
                  </button>

                  {stepTenData.escalaGlogau ? (
                    <div className="selection-tags">
                      <span className="selection-tag glogau-selection-tag">
                        <img
                          className="glogau-selection-thumb"
                          src={getGlogauOptionByValue(stepTenData.escalaGlogau)?.image || ''}
                          alt={`Referencia ${formatGlogauSelectedItem(stepTenData.escalaGlogau)}`}
                        />
                        {formatGlogauSelectedItem(stepTenData.escalaGlogau)}
                      </span>
                    </div>
                  ) : (
                    <p className="selection-empty">Sin seleccion</p>
                  )}
                </div>
              </div>
            </div>

            <div className="selection-card valuation-field-large">
              <p className="selection-title">Sensibilidad cutanea</p>
              <label className="valuation-field-large">
                Pregunta abierta
                <textarea
                  rows="3"
                  value={stepTenData.sensibilidadCutaneaDetalle}
                  onChange={(event) =>
                    setStepTenFieldValue('sensibilidadCutaneaDetalle', event.target.value)}
                  placeholder="Describe lo que observas o comenta la clienta"
                />
              </label>
            </div>
          </div>

          {error ? <p className="error-text">{error}</p> : null}

          <div className="valuation-actions">
            <button type="submit" className="main-button" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Salir'}
            </button>

            <button
              type="button"
              className="main-button secondary"
              disabled={isSaving}
              onClick={handleSaveStepTenAndContinue}
            >
              Continuar
            </button>

            <button
              type="button"
              className="main-button secondary"
              disabled={isSaving}
              onClick={() => setActiveStep(9)}
            >
              Volver al paso 9
            </button>
          </div>
        </form>
      ) : null}

      {!isLoading && !isProtocolMode && clientFlowType === 'nuevo' && activeStep === 11 ? (
        <form className="simple-form valuation-form" onSubmit={handleSaveStepElevenAndExit}>
          <div className="valuation-section-title">Preguntas corporales</div>

          <div className="valuation-grid">
            <div className="selection-card valuation-field-large">
              <p className="selection-title">Circulacion</p>

              <div className="valuation-grid">
                <label>
                  Tienes piernas cansadas?
                  <select
                    required
                    value={stepElevenData.circulacionPiernasCansadas}
                    onChange={(event) =>
                      setStepElevenFieldValue('circulacionPiernasCansadas', event.target.value)}
                  >
                    <option value="">Sin respuesta</option>
                    <option value="si">Si</option>
                    <option value="no">No</option>
                  </select>
                </label>

                <label>
                  Tienes varices?
                  <select
                    required
                    value={stepElevenData.circulacionVarices}
                    onChange={(event) => setStepElevenFieldValue('circulacionVarices', event.target.value)}
                  >
                    <option value="">Sin respuesta</option>
                    <option value="si">Si</option>
                    <option value="no">No</option>
                  </select>
                </label>

                <label>
                  Tienes retencion de liquidos?
                  <select
                    required
                    value={stepElevenData.circulacionRetencionLiquidos}
                    onChange={(event) =>
                      setStepElevenFieldValue('circulacionRetencionLiquidos', event.target.value)}
                  >
                    <option value="">Sin respuesta</option>
                    <option value="si">Si</option>
                    <option value="no">No</option>
                  </select>
                </label>

                <label>
                  Tienes dolor al tacto?
                  <select
                    required
                    value={stepElevenData.circulacionDolorTacto}
                    onChange={(event) =>
                      setStepElevenFieldValue('circulacionDolorTacto', event.target.value)}
                  >
                    <option value="">Sin respuesta</option>
                    <option value="si">Si</option>
                    <option value="no">No</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="selection-card valuation-field-large">
              <p className="selection-title">Peso y habitos</p>

              <div className="valuation-grid">
                <label>
                  Has subido o bajado de peso recientemente?
                  <select
                    required
                    value={stepElevenData.pesoCambiosRecientes}
                    onChange={(event) => setStepElevenFieldValue('pesoCambiosRecientes', event.target.value)}
                  >
                    <option value="">Sin respuesta</option>
                    <option value="si">Si</option>
                    <option value="no">No</option>
                  </select>
                </label>

                <label>
                  Tu peso fluctua mucho?
                  <select
                    required
                    value={stepElevenData.pesoFluctuaciones}
                    onChange={(event) => setStepElevenFieldValue('pesoFluctuaciones', event.target.value)}
                  >
                    <option value="">Sin respuesta</option>
                    <option value="si">Si</option>
                    <option value="no">No</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="selection-card valuation-field-large">
              <p className="selection-title">Objetivos</p>

              <div className="valuation-grid">
                <label className="valuation-field-large">
                  Que zona deseas mejorar mas?
                  <textarea
                    rows="3"
                    value={stepElevenData.objetivoZonaMejorar}
                    onChange={(event) => setStepElevenFieldValue('objetivoZonaMejorar', event.target.value)}
                  />
                </label>

                <label className="valuation-field-large">
                  Que es lo que mas te incomoda visualmente?
                  <textarea
                    rows="3"
                    value={stepElevenData.objetivoIncomodidadVisual}
                    onChange={(event) =>
                      setStepElevenFieldValue('objetivoIncomodidadVisual', event.target.value)}
                  />
                </label>
              </div>
            </div>
          </div>

          {error ? <p className="error-text">{error}</p> : null}

          <div className="valuation-actions">
            <button type="submit" className="main-button" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Salir'}
            </button>

            <button
              type="button"
              className="main-button secondary"
              disabled={isSaving}
              onClick={handleSaveStepElevenAndContinue}
            >
              FINALIZAR
            </button>

            <button
              type="button"
              className="main-button secondary"
              disabled={isSaving}
              onClick={() => setActiveStep(10)}
            >
              Volver al paso 10
            </button>
          </div>
        </form>
      ) : null}

      {stepSevenModal.open ? (
        <div className="selection-modal-backdrop" onClick={closeStepSevenModal}>
          <div
            className="selection-modal"
            role="dialog"
            aria-modal="true"
            aria-label={stepSevenModal.title}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="selection-modal-head">
              <h3 className="consultation-block-title">{stepSevenModal.title}</h3>
              <button type="button" className="main-button secondary" onClick={closeStepSevenModal}>
                Cerrar
              </button>
            </div>

            {stepSevenModal.section === 'procedimientos' ? (
              <>
                <div className="selection-options-grid">
                  {STEP_SEVEN_OPTIONS.procedimientosPrevios.map((option) => (
                    <label className="motivo-option" key={`step7-procedimiento-${option}`}>
                      <input
                        type="checkbox"
                        checked={stepSevenData.procedimientosPrevios.includes(option)}
                        onChange={() => toggleStepSevenProcedimiento(option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>

                {isStepSevenOtherSelected() ? (
                  <label className="selection-modal-field">
                    {STEP_SEVEN_OTHER_CONFIG.label}
                    <input
                      type="text"
                      value={stepSevenData[STEP_SEVEN_OTHER_CONFIG.textField]}
                      onChange={(event) =>
                        setStepSevenFieldValue(STEP_SEVEN_OTHER_CONFIG.textField, event.target.value)}
                      placeholder={STEP_SEVEN_OTHER_CONFIG.placeholder}
                    />
                  </label>
                ) : null}
              </>
            ) : null}

            {stepSevenModal.section === 'faciales' ? (
              <div className="valuation-grid">
                <label>
                  Has tenido faciales previos?
                  <select
                    value={stepSevenData.facialesPrevios}
                    onChange={(event) => setStepSevenFieldValue('facialesPrevios', event.target.value)}
                  >
                    <option value="">Sin respuesta</option>
                    <option value="si">Si</option>
                    <option value="no">No</option>
                  </select>
                </label>

                {stepSevenData.facialesPrevios === 'si' ? (
                  <label className="valuation-field-large">
                    Cuales?
                    <textarea
                      rows="3"
                      value={stepSevenData.facialesPreviosCuales}
                      onChange={(event) =>
                        setStepSevenFieldValue('facialesPreviosCuales', event.target.value)}
                      placeholder="Describe los faciales previos"
                    />
                  </label>
                ) : null}
              </div>
            ) : null}

            {stepSevenModal.section === 'aparatologia' ? (
              <div className="valuation-grid">
                <label>
                  Has usado aparatologia corporal?
                  <select
                    value={stepSevenData.aparatologiaCorporal}
                    onChange={(event) => setStepSevenFieldValue('aparatologiaCorporal', event.target.value)}
                  >
                    <option value="">Sin respuesta</option>
                    <option value="si">Si</option>
                    <option value="no">No</option>
                  </select>
                </label>

                {stepSevenData.aparatologiaCorporal === 'si' ? (
                  <label className="valuation-field-large">
                    Cuales?
                    <textarea
                      rows="3"
                      value={stepSevenData.aparatologiaCorporalCuales}
                      onChange={(event) =>
                        setStepSevenFieldValue('aparatologiaCorporalCuales', event.target.value)}
                      placeholder="Describe la aparatologia corporal"
                    />
                  </label>
                ) : null}
              </div>
            ) : null}

            <button type="button" className="main-button" onClick={closeStepSevenModal}>
              Listo
            </button>
          </div>
        </div>
      ) : null}

      {stepEightModal.open ? (
        <div className="selection-modal-backdrop" onClick={closeStepEightModal}>
          <div
            className="selection-modal"
            role="dialog"
            aria-modal="true"
            aria-label={stepEightModal.title}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="selection-modal-head">
              <h3 className="consultation-block-title">{stepEightModal.title}</h3>
              <button type="button" className="main-button secondary" onClick={closeStepEightModal}>
                Cerrar
              </button>
            </div>

            <div className="selection-options-grid">
              {stepEightModal.options.map((option) => (
                <label className="motivo-option" key={`${stepEightModal.field}-${option}`}>
                  <input
                    type="checkbox"
                    checked={getStepEightList(stepEightModal.field).includes(option)}
                    onChange={() => toggleStepEightOption(stepEightModal.field, option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>

            {isStepEightOtherSelected(stepEightModal.field) ? (
              <label className="selection-modal-field">
                {getStepEightOtherConfig(stepEightModal.field)?.label}
                <input
                  type="text"
                  value={stepEightData[getStepEightOtherConfig(stepEightModal.field)?.textField || ''] || ''}
                  onChange={(event) =>
                    setStepEightFieldValue(
                      getStepEightOtherConfig(stepEightModal.field)?.textField || '',
                      event.target.value,
                    )}
                  placeholder={getStepEightOtherConfig(stepEightModal.field)?.placeholder}
                />
              </label>
            ) : null}

            <button type="button" className="main-button" onClick={closeStepEightModal}>
              Listo
            </button>
          </div>
        </div>
      ) : null}

      {stepNineModal.open ? (
        <div className="selection-modal-backdrop" onClick={closeStepNineModal}>
          <div
            className="selection-modal"
            role="dialog"
            aria-modal="true"
            aria-label={stepNineModal.title}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="selection-modal-head">
              <h3 className="consultation-block-title">{stepNineModal.title}</h3>
              <button type="button" className="main-button secondary" onClick={closeStepNineModal}>
                Cerrar
              </button>
            </div>

            <div className="selection-options-grid">
              {stepNineModal.options.map((option) => (
                <label className="motivo-option" key={`${stepNineModal.field}-${option}`}>
                  <input
                    type="checkbox"
                    checked={getStepNineList(stepNineModal.field).includes(option)}
                    onChange={() => toggleStepNineOption(stepNineModal.field, option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>

            <button type="button" className="main-button" onClick={closeStepNineModal}>
              Listo
            </button>
          </div>
        </div>
      ) : null}

      {stepTenModal.open ? (
        <div className="selection-modal-backdrop" onClick={closeStepTenModal}>
          <div
            className="selection-modal"
            role="dialog"
            aria-modal="true"
            aria-label={stepTenModal.title}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="selection-modal-head">
              <h3 className="consultation-block-title">{stepTenModal.title}</h3>
              <button type="button" className="main-button secondary" onClick={closeStepTenModal}>
                Cerrar
              </button>
            </div>

            {stepTenModal.mode === 'single' && stepTenModal.field === 'escalaFitzpatrick' ? (
              <>
                <div className="fitzpatrick-options-grid">
                  {stepTenModal.options.map((option) => {
                    const fitzpatrickOption = getFitzpatrickOptionByValue(option)
                    const isSelected = stepTenData.escalaFitzpatrick === option

                    return (
                      <button
                        key={`${stepTenModal.field}-${option}`}
                        type="button"
                        className={`fitzpatrick-option-card${
                          isSelected ? ' fitzpatrick-option-card-selected' : ''
                        }`}
                        onClick={() => setStepTenFieldValue('escalaFitzpatrick', option)}
                      >
                        <span
                          className="fitzpatrick-color-dot"
                          style={{ backgroundColor: fitzpatrickOption?.color || '#ffffff' }}
                        />
                        <span className="fitzpatrick-option-content">
                          <strong>{fitzpatrickOption?.value || option}</strong>
                          <span>{fitzpatrickOption?.label || option}</span>
                          <small>{fitzpatrickOption?.tone || ''}</small>
                        </span>
                      </button>
                    )
                  })}
                </div>

                {stepTenData.escalaFitzpatrick ? (
                  <button
                    type="button"
                    className="main-button secondary"
                    onClick={() => setStepTenFieldValue('escalaFitzpatrick', '')}
                  >
                    Quitar seleccion
                  </button>
                ) : null}
              </>
            ) : stepTenModal.mode === 'single-glogau' && stepTenModal.field === 'escalaGlogau' ? (
              <>
                <div className="glogau-options-grid">
                  {stepTenModal.options.map((option) => {
                    const glogauOption = getGlogauOptionByValue(option)
                    const isSelected = stepTenData.escalaGlogau === option

                    return (
                      <button
                        key={`${stepTenModal.field}-${option}`}
                        type="button"
                        className={`glogau-option-card${isSelected ? ' glogau-option-card-selected' : ''}`}
                        onClick={() => setStepTenFieldValue('escalaGlogau', option)}
                      >
                        <img
                          className="glogau-option-image"
                          src={glogauOption?.image || ''}
                          alt={`Escala Glogau ${glogauOption?.label || option}`}
                        />
                        <span className="glogau-option-content">
                          <strong>{glogauOption?.value || option}</strong>
                          <span>{glogauOption?.label || `Tipo ${option}`}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>

                {stepTenData.escalaGlogau ? (
                  <button
                    type="button"
                    className="main-button secondary"
                    onClick={() => setStepTenFieldValue('escalaGlogau', '')}
                  >
                    Quitar seleccion
                  </button>
                ) : null}
              </>
            ) : (
              <div className="selection-options-grid">
                {stepTenModal.options.map((option) => (
                  <label className="motivo-option" key={`${stepTenModal.field}-${option}`}>
                    <input
                      type="checkbox"
                      checked={getStepTenList(stepTenModal.field).includes(option)}
                      onChange={() => toggleStepTenOption(stepTenModal.field, option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}

            <button type="button" className="main-button" onClick={closeStepTenModal}>
              Listo
            </button>
          </div>
        </div>
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
                    key={option.value}
                    type="button"
                    className={`semaforo-option-card ${isSelected ? 'semaforo-option-card-selected' : ''}`}
                    onClick={() =>
                      setCutaneoModal((previous) => ({
                        ...previous,
                        selected: option.value,
                      }))}
                  >
                    <span className="semaforo-option-marker" style={{ backgroundColor: option.color }} />
                    <span className="semaforo-option-content">
                      <strong>{option.label}</strong>
                      <span>{option.description}</span>
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="valuation-actions">
              <button
                type="button"
                className="main-button"
                disabled={cutaneoModal.isSaving}
                onClick={async () => {
                  const saved = await saveCutaneoStatus()
                  if (saved) {
                    closeCutaneoModal()
                  }
                }}
              >
                {cutaneoModal.isSaving ? 'Guardando...' : 'Guardar semaforo'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {stepTwoModal.open ? (
        <div className="selection-modal-backdrop" onClick={closeStepTwoModal}>
          <div
            className="selection-modal"
            role="dialog"
            aria-modal="true"
            aria-label={stepTwoModal.title}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="selection-modal-head">
              <h3 className="consultation-block-title">{stepTwoModal.title}</h3>
              <button type="button" className="main-button secondary" onClick={closeStepTwoModal}>
                Cerrar
              </button>
            </div>

            <div className="selection-options-grid">
              {stepTwoModal.options.map((option) => (
                <label className="motivo-option" key={`${stepTwoModal.field}-${option}`}>
                  <input
                    type="checkbox"
                    checked={getStepTwoList(stepTwoModal.field).includes(option)}
                    onChange={() => toggleStepTwoMotive(stepTwoModal.field, option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>

            <button type="button" className="main-button" onClick={closeStepTwoModal}>
              Listo
            </button>
          </div>
        </div>
      ) : null}

      {stepFourModal.open ? (
        <div className="selection-modal-backdrop" onClick={closeStepFourModal}>
          <div
            className="selection-modal"
            role="dialog"
            aria-modal="true"
            aria-label={stepFourModal.title}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="selection-modal-head">
              <h3 className="consultation-block-title">{stepFourModal.title}</h3>
              <button type="button" className="main-button secondary" onClick={closeStepFourModal}>
                Cerrar
              </button>
            </div>

            <div className="selection-options-grid">
              {stepFourModal.options.map((option) => (
                <label className="motivo-option" key={`${stepFourModal.field}-${option}`}>
                  <input
                    type="checkbox"
                    checked={getStepFourList(stepFourModal.field).includes(option)}
                    onChange={() => toggleStepFourOption(stepFourModal.field, option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>

            {isStepFourOtherSelected(stepFourModal.field) ? (
              <label className="selection-modal-field">
                {getStepFourOtherConfig(stepFourModal.field)?.label}
                <input
                  type="text"
                  value={stepFourData[getStepFourOtherConfig(stepFourModal.field)?.textField || ''] || ''}
                  onChange={(event) =>
                    setStepFourFieldValue(
                      getStepFourOtherConfig(stepFourModal.field)?.textField || '',
                      event.target.value,
                    )}
                  placeholder={getStepFourOtherConfig(stepFourModal.field)?.placeholder}
                />
              </label>
            ) : null}

            <button type="button" className="main-button" onClick={closeStepFourModal}>
              Listo
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default NuevaValoracionView
