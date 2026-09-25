const { createHash } = require('node:crypto')
const { initializeApp } = require('firebase-admin/app')
const { FieldValue, getFirestore } = require('firebase-admin/firestore')
const { HttpsError, onCall } = require('firebase-functions/v2/https')
const { setGlobalOptions } = require('firebase-functions/v2/options')

initializeApp()
setGlobalOptions({ region: 'us-central1', maxInstances: 10 })

const db = getFirestore()

const normalizeText = (value) => String(value ?? '').trim().replace(/\s+/g, ' ')

const normalizeName = (value) => normalizeText(value)
  .toLocaleLowerCase('es-MX')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')

const normalizePhone = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '')
  return digits.length > 10 ? digits.slice(-10) : digits
}

const HEALTH_OPTIONS = {
  enfermedades: new Set([
    'Ninguna',
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
  ]),
  medicamentos: new Set([
    'Ninguno',
    'Isotretinoina',
    'Anticoagulantes',
    'Antibioticos',
    'Retinoides',
    'Hormonas',
    'Anticonceptivos',
    'Otros medicamentos',
  ]),
  alergias: new Set([
    'Ninguna',
    'Cosmeticos',
    'Medicamentos',
    'Fragancias',
    'Activos especificos',
    'Otras alergias',
  ]),
  contraindicaciones: new Set([
    'Ninguna',
    'Heridas activas',
    'Infecciones',
    'Herpes activo',
    'Cirugias recientes',
    'Quemaduras solares',
    'Irritacion severa',
    'Otra contraindicacion',
  ]),
}

const PROCEDURE_OPTIONS = new Set([
  'Peelings',
  'Microneedling',
  'Laser',
  'Botox',
  'Rellenos',
  'Otro',
  'Ninguno',
])

const ROUTINE_OPTIONS = {
  manana: new Set(['No tengo rutina', 'Limpiador', 'Serum', 'Hidratante', 'Protector solar', 'Otro']),
  noche: new Set(['No tengo rutina', 'Desmaquillante', 'Activos', 'Cremas', 'Exfoliantes', 'Otro']),
}

const FOOD_QUALITY_OPTIONS = new Set(['muy buena', 'buena', 'regular', 'mala', 'muy mala'])
const SPOT_ORIGIN_OPTIONS = new Set([
  'No tengo manchas',
  'Por el sol',
  'Por hormonas',
  'Por embarazo',
  'Despues de acne',
])

const invalidAnswers = (message) => {
  throw new HttpsError('invalid-argument', message)
}

const normalizeLimitedText = (value, label, { required = false, maxLength = 180 } = {}) => {
  const normalized = normalizeText(value)
  if (required && !normalized) invalidAnswers(`Completa el campo “${label}”.`)
  if (normalized.length > maxLength) invalidAnswers(`El campo “${label}” es demasiado largo.`)
  return normalized
}

const normalizeIntegerInRange = (value, label, minimum, maximum) => {
  const normalized = normalizeText(value)
  const parsed = Number(normalized)

  if (!/^\d+$/.test(normalized) || !Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    invalidAnswers(`Selecciona una respuesta válida en “${label}”.`)
  }

  return String(parsed)
}

const normalizeConsentSignature = (value) => {
  const normalized = String(value ?? '').trim()
  const match = /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(normalized)
  if (!match) invalidAnswers('La firma del consentimiento no tiene un formato válido.')

  const signatureBuffer = Buffer.from(match[1], 'base64')
  const pngHeader = signatureBuffer.subarray(0, 8).toString('hex')
  if (
    signatureBuffer.length < 100
    || signatureBuffer.length > 300 * 1024
    || pngHeader !== '89504e470d0a1a0a'
  ) {
    invalidAnswers('La firma del consentimiento no tiene un formato válido.')
  }

  return normalized
}

const normalizeBinaryAnswer = (value, label, required = true) => {
  const normalized = normalizeText(value).toLowerCase()
  if (normalized === 'si' || normalized === 'no') return normalized
  if (required) invalidAnswers(`Selecciona una respuesta en “${label}”.`)
  return ''
}

const normalizeSelection = (value, allowed, label, exclusiveOption = '') => {
  if (!Array.isArray(value)) invalidAnswers(`Selecciona una respuesta en “${label}”.`)

  const normalized = Array.from(new Set(value.map(normalizeText).filter(Boolean)))
  if (normalized.length === 0 || normalized.some((item) => !allowed.has(item))) {
    invalidAnswers(`Selecciona una respuesta válida en “${label}”.`)
  }

  if (exclusiveOption && normalized.includes(exclusiveOption) && normalized.length > 1) {
    invalidAnswers(`“${exclusiveOption}” no puede combinarse con otras respuestas en “${label}”.`)
  }

  return normalized
}

const splitFullName = (fullName) => {
  const parts = normalizeText(fullName).split(' ').filter(Boolean)
  if (parts.length >= 3) {
    return {
      nombre: parts.slice(0, -2).join(' '),
      apellidoPaterno: parts.at(-2),
      apellidoMaterno: parts.at(-1),
    }
  }
  if (parts.length === 2) {
    return { nombre: parts[0], apellidoPaterno: parts[1], apellidoMaterno: '' }
  }
  return { nombre: parts[0] || '', apellidoPaterno: '', apellidoMaterno: '' }
}

const normalizeBirthDate = (value) => {
  const normalized = normalizeText(value)
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized)
  if (!match) invalidAnswers('Selecciona una fecha de nacimiento válida.')

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  const now = new Date()

  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
    || date > now
  ) {
    invalidAnswers('Selecciona una fecha de nacimiento válida.')
  }

  let age = now.getUTCFullYear() - year
  if (now.getUTCMonth() + 1 < month || (now.getUTCMonth() + 1 === month && now.getUTCDate() < day)) {
    age -= 1
  }
  if (age < 0 || age > 120) invalidAnswers('La fecha de nacimiento está fuera del rango permitido.')

  return { fechaNacimiento: normalized, edad: String(age) }
}

const normalizePastDate = (value, label) => {
  const normalized = normalizeLimitedText(value, label, { required: true, maxLength: 10 })
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized)
  if (!match) invalidAnswers(`Selecciona una fecha válida en “${label}”.`)

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  const now = new Date()
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
    || date > now
  ) {
    invalidAnswers(`Selecciona una fecha válida en “${label}”.`)
  }

  return normalized
}

const normalizePreRegistrationAnswers = (rawAnswers, preRegistration) => {
  if (!rawAnswers || typeof rawAnswers !== 'object' || Array.isArray(rawAnswers)) {
    invalidAnswers('Completa el cuestionario antes de finalizar el prerregistro.')
  }

  const rawStepOne = rawAnswers.step1 || {}
  const rawStepThree = rawAnswers.step3 || {}
  const rawStepFour = rawAnswers.step4 || {}
  const rawStepFive = rawAnswers.step5 || {}
  const rawStepSix = rawAnswers.step6 || {}
  const rawStepSeven = rawAnswers.step7 || {}
  const rawStepEight = rawAnswers.step8 || {}
  const rawStepTen = rawAnswers.step10 || {}
  const rawConsent = rawAnswers.consentimiento || {}
  const registeredSex = normalizeText(preRegistration.sexo).toLowerCase()
  const sexo = normalizeLimitedText(
    registeredSex || rawStepOne.sexo,
    'Sexo',
    { required: true, maxLength: 10 },
  ).toLowerCase()
  if (sexo !== 'masculino' && sexo !== 'femenino') invalidAnswers('Selecciona un sexo válido.')

  const birthData = normalizeBirthDate(rawStepOne.fechaNacimiento)
  const correoElectronico = normalizeLimitedText(rawStepOne.correoElectronico, 'Correo electrónico', {
    required: true,
    maxLength: 160,
  }).toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoElectronico)) {
    invalidAnswers('Escribe un correo electrónico válido.')
  }
  const contactoEmergencia = normalizePhone(rawStepOne.contactoEmergencia)
  if (contactoEmergencia.length !== 10) {
    invalidAnswers('Escribe un teléfono de contacto de emergencia de 10 dígitos.')
  }

  const enfermedades = normalizeSelection(
    rawStepFour.enfermedades,
    HEALTH_OPTIONS.enfermedades,
    'Enfermedades',
    'Ninguna',
  )
  const medicamentosActuales = normalizeSelection(
    rawStepFour.medicamentosActuales,
    HEALTH_OPTIONS.medicamentos,
    'Medicamentos actuales',
    'Ninguno',
  )
  const alergias = normalizeSelection(
    rawStepFour.alergias,
    HEALTH_OPTIONS.alergias,
    'Alergias',
    'Ninguna',
  )
  const contraindicaciones = normalizeSelection(
    rawStepFour.contraindicaciones,
    HEALTH_OPTIONS.contraindicaciones,
    'Contraindicaciones',
    'Ninguna',
  )

  const calidadAlimentacion = normalizeLimitedText(
    rawStepFive.calidadAlimentacion,
    'Calidad de alimentación',
    { required: true, maxLength: 20 },
  ).toLowerCase()
  if (!FOOD_QUALITY_OPTIONS.has(calidadAlimentacion)) {
    invalidAnswers('Selecciona una calidad de alimentación válida.')
  }

  const realizaEjercicio = normalizeBinaryAnswer(rawStepFive.realizaEjercicio, 'Ejercicio')
  const usaProtectorDiario = normalizeBinaryAnswer(rawStepSix.usaProtectorDiario, 'Uso diario de protector solar')
  const procedimientosSeleccionados = normalizeSelection(
    rawStepSeven.procedimientosPrevios,
    PROCEDURE_OPTIONS,
    'Procedimientos previos',
    'Ninguno',
  )
  const procedimientosPrevios = procedimientosSeleccionados.filter((item) => item !== 'Ninguno')
  const facialesPrevios = normalizeBinaryAnswer(rawStepSeven.facialesPrevios, 'Faciales previos')
  const aparatologiaCorporal = normalizeBinaryAnswer(
    rawStepSeven.aparatologiaCorporal,
    'Aparatología',
  )
  const hasPreviousProcedure = procedimientosPrevios.length > 0
    || facialesPrevios === 'si'
    || aparatologiaCorporal === 'si'
  const tratamientoIrrito = hasPreviousProcedure
    ? normalizeBinaryAnswer(rawStepSeven.tratamientoIrrito, 'Tratamiento que irritó')
    : ''

  const mananaProductos = normalizeSelection(
    rawStepEight.mananaProductos,
    ROUTINE_OPTIONS.manana,
    'Rutina de la mañana',
    'No tengo rutina',
  )
  const nocheProductos = normalizeSelection(
    rawStepEight.nocheProductos,
    ROUTINE_OPTIONS.noche,
    'Rutina de la noche',
    'No tengo rutina',
  )
  const manchasOrigenes = normalizeSelection(
    rawStepTen.manchasOrigenes,
    SPOT_ORIGIN_OPTIONS,
    'Origen de las manchas',
    'No tengo manchas',
  )
  if (rawConsent.aceptado !== true) {
    invalidAnswers('Debes leer y aceptar el consentimiento informado.')
  }
  const firmaCliente = normalizeConsentSignature(rawConsent.firmaCliente)
  const fallbackIdentity = splitFullName(preRegistration.nombreCompleto)
  const identity = {
    nombre: normalizeLimitedText(fallbackIdentity.nombre, 'Nombre', {
      required: true,
      maxLength: 100,
    }),
    apellidoPaterno: normalizeLimitedText(
      fallbackIdentity.apellidoPaterno,
      'Apellido paterno',
      { required: true, maxLength: 80 },
    ),
    apellidoMaterno: normalizeLimitedText(
      fallbackIdentity.apellidoMaterno,
      'Apellido materno',
      { maxLength: 80 },
    ),
  }

  return {
    step1: {
      ...identity,
      sexo,
      ...birthData,
      telefono: normalizePhone(preRegistration.telefonoNormalizado || preRegistration.telefono),
      correoElectronico,
      ocupacion: normalizeLimitedText(rawStepOne.ocupacion, 'Ocupación', { required: true, maxLength: 120 }),
      contactoEmergencia,
      objetivoPrincipal: normalizeLimitedText(rawStepOne.objetivoPrincipal, 'Objetivo principal', {
        required: true,
        maxLength: 300,
      }),
      inconformidadPrincipal: normalizeLimitedText(rawStepOne.inconformidadPrincipal, 'Inconformidad principal', {
        required: true,
        maxLength: 300,
      }),
    },
    step3: {
      mejoraPrincipal: normalizeLimitedText(rawStepThree.mejoraPrincipal, 'Qué te gustaría mejorar', {
        required: true,
        maxLength: 300,
      }),
      resultadoEsperado: normalizeLimitedText(rawStepThree.resultadoEsperado, 'Resultado esperado', {
        required: true,
        maxLength: 300,
      }),
      tiempoEsperado: normalizeLimitedText(rawStepThree.tiempoEsperado, 'Tiempo esperado', {
        required: true,
        maxLength: 120,
      }),
    },
    step4: {
      enfermedades,
      enfermedadesOtro: enfermedades.includes('Otro')
        ? normalizeLimitedText(rawStepFour.enfermedadesOtro, 'Otra enfermedad', { required: true })
        : '',
      medicamentosActuales,
      medicamentosActualesOtro: medicamentosActuales.includes('Otros medicamentos')
        ? normalizeLimitedText(rawStepFour.medicamentosActualesOtro, 'Otros medicamentos', { required: true })
        : '',
      alergias,
      alergiasOtro: alergias.includes('Otras alergias')
        ? normalizeLimitedText(rawStepFour.alergiasOtro, 'Otras alergias', { required: true })
        : '',
      contraindicaciones,
      contraindicacionesOtro: contraindicaciones.includes('Otra contraindicacion')
        ? normalizeLimitedText(rawStepFour.contraindicacionesOtro, 'Otra contraindicación', { required: true })
        : '',
      embarazoActual: sexo === 'femenino'
        ? normalizeBinaryAnswer(rawStepFour.embarazoActual, 'Embarazo actual')
        : '',
      lactanciaActual: sexo === 'femenino'
        ? normalizeBinaryAnswer(rawStepFour.lactanciaActual, 'Lactancia actual')
        : '',
      embarazoProximo: sexo === 'femenino'
        ? normalizeBinaryAnswer(rawStepFour.embarazoProximo, 'Embarazo próximo')
        : '',
    },
    step5: {
      aguaDiaria: normalizeLimitedText(rawStepFive.aguaDiaria, 'Agua diaria', { required: true, maxLength: 80 }),
      calidadAlimentacion,
      consumeAzucarLacteos: normalizeBinaryAnswer(rawStepFive.consumeAzucarLacteos, 'Consumo de azúcar o lácteos'),
      fuma: normalizeBinaryAnswer(rawStepFive.fuma, 'Consumo de tabaco'),
      consumeAlcohol: normalizeBinaryAnswer(rawStepFive.consumeAlcohol, 'Consumo de alcohol'),
      realizaEjercicio,
      ejercicioFrecuenciaSemanal: realizaEjercicio === 'si'
        ? normalizeIntegerInRange(rawStepFive.ejercicioFrecuenciaSemanal, 'Veces por semana', 1, 7)
        : '',
      horasSueno: normalizeIntegerInRange(rawStepFive.horasSueno, 'Horas de sueño', 1, 12),
      estresAlto: normalizeBinaryAnswer(rawStepFive.estresAlto, 'Nivel de estrés'),
      desvelosFrecuentes: normalizeBinaryAnswer(rawStepFive.desvelosFrecuentes, 'Desvelos frecuentes'),
    },
    step6: {
      usaProtectorDiario,
      spfUtilizado: usaProtectorDiario === 'si'
        ? normalizeLimitedText(rawStepSix.spfUtilizado, 'SPF utilizado', { required: true, maxLength: 80 })
        : '',
      frecuenciaReaplicacion: usaProtectorDiario === 'si'
        ? normalizeLimitedText(rawStepSix.frecuenciaReaplicacion, 'Frecuencia de reaplicación', {
          required: true,
          maxLength: 80,
        })
        : '',
      tiempoProlongadoSol: normalizeBinaryAnswer(rawStepSix.tiempoProlongadoSol, 'Exposición prolongada al sol'),
      quemadurasSolaresRecientes: normalizeBinaryAnswer(
        rawStepSix.quemadurasSolaresRecientes,
        'Quemaduras solares recientes',
      ),
    },
    step7: {
      procedimientosPrevios,
      procedimientosPreviosOtro: procedimientosPrevios.includes('Otro')
        ? normalizeLimitedText(rawStepSeven.procedimientosPreviosOtro, 'Otro procedimiento', { required: true })
        : '',
      facialesPrevios,
      facialesPreviosCuales: facialesPrevios === 'si'
        ? normalizeLimitedText(rawStepSeven.facialesPreviosCuales, 'Faciales previos', { required: true })
        : '',
      aparatologiaCorporal,
      aparatologiaCorporalCuales: aparatologiaCorporal === 'si'
        ? normalizeLimitedText(rawStepSeven.aparatologiaCorporalCuales, 'Aparatología corporal', { required: true })
        : '',
      fechaUltimoProcedimiento: hasPreviousProcedure
        ? normalizePastDate(rawStepSeven.fechaUltimoProcedimiento, 'Fecha del último procedimiento')
        : '',
      tratamientoIrrito,
      tratamientoIrritoDetalle: hasPreviousProcedure && tratamientoIrrito === 'si'
        ? normalizeLimitedText(rawStepSeven.tratamientoIrritoDetalle, 'Tratamiento que irritó', {
          required: true,
          maxLength: 300,
        })
        : '',
      quemadurasOMalasExperiencias: hasPreviousProcedure
        ? normalizeBinaryAnswer(rawStepSeven.quemadurasOMalasExperiencias, 'Quemaduras o malas experiencias')
        : '',
      pielReaccionaFacilmente: hasPreviousProcedure
        ? normalizeBinaryAnswer(rawStepSeven.pielReaccionaFacilmente, 'Reacción de la piel')
        : '',
      toleraBienDolor: hasPreviousProcedure
        ? normalizeBinaryAnswer(rawStepSeven.toleraBienDolor, 'Tolerancia al dolor')
        : '',
    },
    step8: {
      mananaProductos,
      mananaOtro: mananaProductos.includes('Otro')
        ? normalizeLimitedText(rawStepEight.mananaOtro, 'Otro producto de la mañana', { required: true })
        : '',
      nocheProductos,
      nocheOtro: nocheProductos.includes('Otro')
        ? normalizeLimitedText(rawStepEight.nocheOtro, 'Otro producto de la noche', { required: true })
        : '',
      usaRetinol: normalizeBinaryAnswer(rawStepEight.usaRetinol, 'Uso de retinol'),
      usaAcidos: normalizeBinaryAnswer(rawStepEight.usaAcidos, 'Uso de ácidos'),
      productosIrritaron: normalizeLimitedText(rawStepEight.productosIrritaron, 'Productos que han irritado', {
        required: true,
        maxLength: 300,
      }),
      brotesPorProducto: normalizeBinaryAnswer(rawStepEight.brotesPorProducto, 'Brotes por producto'),
      constanteRutina: normalizeBinaryAnswer(rawStepEight.constanteRutina, 'Constancia de rutina'),
      seguiriaCuidadosCasa: normalizeBinaryAnswer(rawStepEight.seguiriaCuidadosCasa, 'Cuidados en casa'),
      tiempoDedicadoPiel: normalizeLimitedText(rawStepEight.tiempoDedicadoPiel, 'Tiempo dedicado a la piel', {
        required: true,
        maxLength: 120,
      }),
    },
    step10: {
      acneEmpeoraPeriodo: sexo === 'femenino'
        ? normalizeBinaryAnswer(rawStepTen.acneEmpeoraPeriodo, 'Acné durante el periodo')
        : '',
      cambiosHormonalesRecientes: sexo === 'femenino'
        ? normalizeBinaryAnswer(rawStepTen.cambiosHormonalesRecientes, 'Cambios hormonales recientes')
        : '',
      usaAnticonceptivos: sexo === 'femenino'
        ? normalizeBinaryAnswer(rawStepTen.usaAnticonceptivos, 'Uso de anticonceptivos')
        : '',
      desdeCuandoBrotes: normalizeLimitedText(rawStepTen.desdeCuandoBrotes, 'Desde cuándo tienes brotes', {
        required: true,
        maxLength: 180,
      }),
      manipulaGranitos: normalizeBinaryAnswer(rawStepTen.manipulaGranitos, 'Manipulación de granitos'),
      acneDoloroso: normalizeBinaryAnswer(rawStepTen.acneDoloroso, 'Acné doloroso'),
      manchasOrigenes,
      pielEnrojeceFacilmente: normalizeBinaryAnswer(
        rawStepTen.pielEnrojeceFacilmente,
        'Enrojecimiento de la piel',
      ),
      pielArdeIrritaFacil: normalizeBinaryAnswer(
        rawStepTen.pielArdeIrritaFacil,
        'Ardor o irritación de la piel',
      ),
    },
    consentimiento: {
      aceptado: true,
      version: '2026-09-25',
      firmaCliente,
    },
  }
}

const buildIdentityKey = (type, value) => createHash('sha256')
  .update(`${type}:${value}`)
  .digest('hex')

const getIdentityReferences = (nombreNormalizado, telefonoNormalizado) => ({
  nameReference: db.collection('preregistroIdentidades').doc(buildIdentityKey('name', nombreNormalizado)),
  phoneReference: db.collection('preregistroIdentidades').doc(buildIdentityKey('phone', telefonoNormalizado)),
})

const assertActiveStaff = async (request, requiredRole = '') => {
  const userId = request.auth?.uid
  if (!userId) {
    throw new HttpsError('unauthenticated', 'Inicia sesión para continuar.')
  }

  const userSnapshot = await db.collection('users').doc(userId).get()
  const user = userSnapshot.data() || {}
  const validStaffRole = user.role === 'admin' || user.role === 'user'

  if (!userSnapshot.exists || user.status !== 'active' || !validStaffRole) {
    throw new HttpsError('permission-denied', 'Tu usuario no tiene permiso para realizar esta acción.')
  }

  if (requiredRole && user.role !== requiredRole) {
    throw new HttpsError('permission-denied', 'Solo un administrador puede realizar esta acción.')
  }

  return { userId, role: user.role }
}

const findExistingClient = async ({ nombreNormalizado, telefonoNormalizado }) => {
  const clientsSnapshot = await db.collection('clientes')
    .select('nombreCompleto', 'telefono', 'telefonoNormalizado', 'status')
    .get()

  return clientsSnapshot.docs.some((clientDocument) => {
    const client = clientDocument.data() || {}
    if (client.status === 'deleted') return false

    const clientName = normalizeName(client.nombreCompleto)
    const clientPhone = normalizePhone(client.telefonoNormalizado || client.telefono)

    return clientName === nombreNormalizado
      || (Boolean(telefonoNormalizado) && clientPhone === telefonoNormalizado)
  })
}

const findExistingPreRegistration = async ({ nombreNormalizado, telefonoNormalizado }) => {
  const preRegistrationsSnapshot = await db.collection('preregistros')
    .where('status', 'in', ['pending', 'completed'])
    .select('nombreNormalizado', 'telefonoNormalizado')
    .get()

  return preRegistrationsSnapshot.docs.some((preRegistrationDocument) => {
    const preRegistration = preRegistrationDocument.data() || {}
    return normalizeName(preRegistration.nombreNormalizado) === nombreNormalizado
      || normalizePhone(preRegistration.telefonoNormalizado) === telefonoNormalizado
  })
}

exports.createPreRegistrationInvitation = onCall(async (request) => {
  const { userId } = await assertActiveStaff(request)
  const nombreCompleto = normalizeText(request.data?.nombreCompleto)
  const telefono = normalizeText(request.data?.telefono)
  const sexo = normalizeText(request.data?.sexo).toLowerCase()

  if (nombreCompleto.length < 3 || nombreCompleto.length > 120) {
    throw new HttpsError('invalid-argument', 'Escribe el nombre completo.')
  }

  if (normalizePhone(telefono).length !== 10) {
    throw new HttpsError('invalid-argument', 'El número de teléfono debe tener 10 dígitos.')
  }

  if (sexo !== 'femenino' && sexo !== 'masculino') {
    throw new HttpsError('invalid-argument', 'Selecciona el sexo del cliente.')
  }

  const clientIdentity = splitFullName(nombreCompleto)
  if (!clientIdentity.nombre || !clientIdentity.apellidoPaterno) {
    throw new HttpsError(
      'invalid-argument',
      'Escribe el nombre completo con nombre y al menos un apellido.',
    )
  }

  const nombreNormalizado = normalizeName(nombreCompleto)
  const telefonoNormalizado = normalizePhone(telefono)

  const clientExists = await findExistingClient({
    nombreNormalizado,
    telefonoNormalizado,
  })

  if (clientExists) {
    throw new HttpsError(
      'already-exists',
      'Ya existe un cliente con ese nombre o número de teléfono.',
      { reason: 'existing-client' },
    )
  }

  if (await findExistingPreRegistration({ nombreNormalizado, telefonoNormalizado })) {
    throw new HttpsError(
      'already-exists',
      'Ya existe un prerregistro pendiente o finalizado con ese nombre o número de teléfono.',
      { reason: 'existing-preregistration' },
    )
  }

  const { nameReference, phoneReference } = getIdentityReferences(nombreNormalizado, telefonoNormalizado)
  const preRegistrationReference = db.collection('preregistros').doc()
  const clientReference = db.collection('clientes').doc()

  try {
    await db.runTransaction(async (transaction) => {
      const [existingName, existingPhone] = await Promise.all([
        transaction.get(nameReference),
        transaction.get(phoneReference),
      ])

      if (existingName.exists || existingPhone.exists) {
        throw new HttpsError(
          'already-exists',
          'Ya existe un prerregistro con ese nombre o número de teléfono.',
          { reason: 'existing-preregistration' },
        )
      }

      transaction.create(preRegistrationReference, {
        schemaVersion: 1,
        status: 'pending',
        source: 'internal-invitation',
        clientId: clientReference.id,
        nombreCompleto,
        nombreNormalizado,
        telefono,
        telefonoNormalizado,
        sexo,
        answers: {},
        createdBy: userId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })

      transaction.create(clientReference, {
        ...clientIdentity,
        nombreCompleto,
        nombreCompletoLower: nombreCompleto.toLocaleLowerCase('es-MX'),
        nombreNormalizado,
        sexo,
        edad: '',
        fechaNacimiento: '',
        telefono,
        telefonoNormalizado,
        correoElectronico: '',
        correoElectronicoLower: '',
        ocupacion: '',
        contactoEmergencia: '',
        status: 'active',
        source: 'preregistration',
        preRegistrationId: preRegistrationReference.id,
        createdBy: userId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })

      const identityData = {
        preRegistrationId: preRegistrationReference.id,
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
      }
      transaction.create(nameReference, { ...identityData, type: 'name' })
      transaction.create(phoneReference, { ...identityData, type: 'phone' })
    })
  } catch (error) {
    if (error instanceof HttpsError) throw error
    throw new HttpsError('internal', 'No se pudo generar el prerregistro. Intenta nuevamente.')
  }

  return {
    ok: true,
    preRegistrationId: preRegistrationReference.id,
    clientId: clientReference.id,
    message: 'Prerregistro generado correctamente. El cliente ya está guardado y la invitación está disponible en la página web.',
  }
})

exports.listPendingPreRegistrations = onCall(async () => {
  try {
    const snapshot = await db.collection('preregistros')
      .where('status', '==', 'pending')
      .limit(100)
      .get()

    const preRegistrations = snapshot.docs
      .map((document) => {
        const data = document.data() || {}
        const phone = normalizePhone(data.telefonoNormalizado || data.telefono)
        return {
          id: document.id,
          nombreCompleto: normalizeText(data.nombreCompleto),
          telefonoUltimos4: phone.slice(-4),
          sexo: normalizeText(data.sexo).toLowerCase(),
          createdAtMs: data.createdAt?.toMillis?.() || 0,
        }
      })
      .sort((left, right) => left.nombreCompleto.localeCompare(right.nombreCompleto, 'es-MX'))

    return { ok: true, preRegistrations }
  } catch {
    throw new HttpsError('internal', 'No se pudieron cargar los prerregistros disponibles.')
  }
})

exports.verifyPreRegistrationInvitation = onCall(async (request) => {
  const preRegistrationId = normalizeText(request.data?.preRegistrationId)
  const telefonoNormalizado = normalizePhone(request.data?.telefono)

  if (!preRegistrationId || preRegistrationId.length > 128 || telefonoNormalizado.length !== 10) {
    throw new HttpsError('invalid-argument', 'Selecciona tu nombre y escribe tu teléfono de 10 dígitos.')
  }

  const snapshot = await db.collection('preregistros').doc(preRegistrationId).get()
  if (!snapshot.exists || snapshot.data()?.status !== 'pending') {
    throw new HttpsError('not-found', 'Este prerregistro ya no está disponible.')
  }

  const preRegistration = snapshot.data() || {}
  const expectedPhone = normalizePhone(
    preRegistration.telefonoNormalizado || preRegistration.telefono,
  )
  if (expectedPhone !== telefonoNormalizado) {
    throw new HttpsError(
      'permission-denied',
      'El número de teléfono no coincide con el prerregistro seleccionado.',
    )
  }

  return { ok: true }
})

exports.submitPreRegistration = onCall(async (request) => {
  const preRegistrationId = normalizeText(request.data?.preRegistrationId)
  const telefonoNormalizado = normalizePhone(request.data?.telefono)
  const website = normalizeText(request.data?.website)
  const rawAnswers = request.data?.answers

  if (website) {
    throw new HttpsError('invalid-argument', 'No se pudo procesar el prerregistro.')
  }

  if (!preRegistrationId || preRegistrationId.length > 128) {
    throw new HttpsError('invalid-argument', 'Selecciona un prerregistro válido.')
  }

  if (telefonoNormalizado.length !== 10) {
    throw new HttpsError('invalid-argument', 'Escribe tu número de teléfono de 10 dígitos.')
  }

  const preRegistrationReference = db.collection('preregistros').doc(preRegistrationId)

  try {
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(preRegistrationReference)

      if (!snapshot.exists) {
        throw new HttpsError('not-found', 'Este prerregistro ya no está disponible.')
      }

      const preRegistration = snapshot.data() || {}
      if (preRegistration.status !== 'pending') {
        throw new HttpsError('failed-precondition', 'Este prerregistro ya fue finalizado o utilizado.')
      }

      const expectedPhone = normalizePhone(
        preRegistration.telefonoNormalizado || preRegistration.telefono,
      )
      if (expectedPhone !== telefonoNormalizado) {
        throw new HttpsError(
          'permission-denied',
          'El número de teléfono no coincide con el prerregistro seleccionado.',
        )
      }

      const answers = normalizePreRegistrationAnswers(rawAnswers, preRegistration)
      answers.consentimiento.firmadoAt = FieldValue.serverTimestamp()

      transaction.update(preRegistrationReference, {
        status: 'completed',
        schemaVersion: 3,
        answers,
        completedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })

      const clientId = normalizeText(preRegistration.clientId)
      if (clientId) {
        transaction.set(db.collection('clientes').doc(clientId), {
          nombre: answers.step1.nombre,
          apellidoPaterno: answers.step1.apellidoPaterno,
          apellidoMaterno: answers.step1.apellidoMaterno,
          nombreCompleto: normalizeText(preRegistration.nombreCompleto),
          nombreCompletoLower: normalizeText(preRegistration.nombreCompleto).toLocaleLowerCase('es-MX'),
          nombreNormalizado: normalizeName(preRegistration.nombreCompleto),
          sexo: answers.step1.sexo,
          edad: answers.step1.edad,
          fechaNacimiento: answers.step1.fechaNacimiento,
          telefono: expectedPhone,
          telefonoNormalizado: expectedPhone,
          correoElectronico: answers.step1.correoElectronico,
          correoElectronicoLower: answers.step1.correoElectronico,
          ocupacion: answers.step1.ocupacion,
          contactoEmergencia: answers.step1.contactoEmergencia,
          status: 'active',
          source: 'preregistration',
          preRegistrationId,
          createdBy: normalizeText(preRegistration.createdBy),
          createdAt: preRegistration.createdAt || FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true })
      }

      const nombreNormalizado = normalizeName(preRegistration.nombreNormalizado || preRegistration.nombreCompleto)
      const { nameReference, phoneReference } = getIdentityReferences(nombreNormalizado, expectedPhone)
      transaction.set(nameReference, {
        preRegistrationId,
        status: 'completed',
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true })
      transaction.set(phoneReference, {
        preRegistrationId,
        status: 'completed',
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true })
    })
  } catch (error) {
    if (error instanceof HttpsError) throw error
    throw new HttpsError('internal', 'No se pudo finalizar el prerregistro. Intenta nuevamente.')
  }

  return {
    ok: true,
    preRegistrationId,
    message: 'Tu prerregistro quedó finalizado correctamente.',
  }
})

exports.deletePreRegistration = onCall(async (request) => {
  await assertActiveStaff(request, 'admin')
  const preRegistrationId = normalizeText(request.data?.preRegistrationId)

  if (!preRegistrationId || preRegistrationId.length > 128) {
    throw new HttpsError('invalid-argument', 'Selecciona un prerregistro válido.')
  }

  const preRegistrationReference = db.collection('preregistros').doc(preRegistrationId)

  try {
    await db.runTransaction(async (transaction) => {
      const preRegistrationSnapshot = await transaction.get(preRegistrationReference)
      if (!preRegistrationSnapshot.exists) {
        throw new HttpsError('not-found', 'El prerregistro ya no existe.')
      }

      const preRegistration = preRegistrationSnapshot.data() || {}
      const nombreNormalizado = normalizeName(preRegistration.nombreNormalizado || preRegistration.nombreCompleto)
      const telefonoNormalizado = normalizePhone(preRegistration.telefonoNormalizado || preRegistration.telefono)
      const { nameReference, phoneReference } = getIdentityReferences(nombreNormalizado, telefonoNormalizado)
      const linkedClientId = normalizeText(preRegistration.clientId)
      const clientReference = linkedClientId ? db.collection('clientes').doc(linkedClientId) : null
      const [nameSnapshot, phoneSnapshot, clientSnapshot] = await Promise.all([
        transaction.get(nameReference),
        transaction.get(phoneReference),
        clientReference ? transaction.get(clientReference) : Promise.resolve(null),
      ])

      transaction.delete(preRegistrationReference)
      if (nameSnapshot.data()?.preRegistrationId === preRegistrationId) transaction.delete(nameReference)
      if (phoneSnapshot.data()?.preRegistrationId === preRegistrationId) transaction.delete(phoneReference)
      if (
        clientReference
        && clientSnapshot?.data()?.source === 'preregistration'
        && clientSnapshot.data()?.preRegistrationId === preRegistrationId
      ) {
        transaction.delete(clientReference)
      }
    })
  } catch (error) {
    if (error instanceof HttpsError) throw error
    throw new HttpsError('internal', 'No se pudo eliminar el prerregistro.')
  }

  return { ok: true, message: 'Prerregistro eliminado correctamente.' }
})
