import { useEffect, useMemo, useRef, useState } from 'react'
import {
  STEP_EIGHT_OPTIONS,
  STEP_FOUR_OPTIONS,
  STEP_SEVEN_OPTIONS,
  STEP_TEN_OPTIONS,
} from '../../models/valuationModel.js'

const SECTIONS = [
  { number: '01', title: 'Datos del cliente', shortTitle: 'Datos' },
  { number: '03', title: 'Expectativas y prioridades', shortTitle: 'Expectativas' },
  { number: '04', title: 'Antecedentes de salud', shortTitle: 'Salud' },
  { number: '05', title: 'Hábitos y estilo de vida', shortTitle: 'Hábitos' },
  { number: '06', title: 'Exposición solar', shortTitle: 'Sol' },
  { number: '07', title: 'Historial estético', shortTitle: 'Historial' },
  { number: '08', title: 'Rutina actual', shortTitle: 'Rutina' },
  { number: '10', title: 'Evaluación facial 2', shortTitle: 'Evaluación' },
  { number: '12', title: 'Consentimiento informado', shortTitle: 'Firma' },
]

const BINARY_OPTIONS = [
  { value: 'si', label: 'Sí' },
  { value: 'no', label: 'No' },
]

const splitFullName = (fullName) => {
  const parts = String(fullName ?? '').trim().split(/\s+/).filter(Boolean)

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

  return { nombre: parts[0] ?? '', apellidoPaterno: '', apellidoMaterno: '' }
}

const calculateAge = (birthDate) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(birthDate ?? ''))
  if (!match) return ''

  const today = new Date()
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  let age = today.getFullYear() - year

  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) {
    age -= 1
  }

  return age >= 0 && age <= 120 ? String(age) : ''
}

const createInitialAnswers = ({ nombreCompleto, telefono, sexo }) => ({
  step1: {
    ...splitFullName(nombreCompleto),
    nombreCompleto: String(nombreCompleto ?? ''),
    sexo: ['femenino', 'masculino'].includes(String(sexo ?? '').toLowerCase())
      ? String(sexo).toLowerCase()
      : '',
    edad: '',
    fechaNacimiento: '',
    telefono: String(telefono ?? ''),
    correoElectronico: '',
    ocupacion: '',
    contactoEmergencia: '',
    objetivoPrincipal: '',
    inconformidadPrincipal: '',
  },
  step3: {
    mejoraPrincipal: '',
    resultadoEsperado: '',
    tiempoEsperado: '',
  },
  step4: {
    enfermedades: [],
    enfermedadesOtro: '',
    medicamentosActuales: [],
    medicamentosActualesOtro: '',
    alergias: [],
    alergiasOtro: '',
    contraindicaciones: [],
    contraindicacionesOtro: '',
    embarazoActual: '',
    lactanciaActual: '',
    embarazoProximo: '',
  },
  step5: {
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
  },
  step6: {
    usaProtectorDiario: '',
    spfUtilizado: '',
    frecuenciaReaplicacion: '',
    tiempoProlongadoSol: '',
    quemadurasSolaresRecientes: '',
  },
  step7: {
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
  },
  step8: {
    mananaProductos: [],
    mananaOtro: '',
    nocheProductos: [],
    nocheOtro: '',
    usaRetinol: '',
    usaAcidos: '',
    productosIrritaronRespuesta: '',
    productosIrritaron: '',
    brotesPorProducto: '',
    constanteRutina: '',
    seguiriaCuidadosCasa: '',
    tiempoDedicadoPiel: '',
  },
  step10: {
    acneEmpeoraPeriodo: '',
    cambiosHormonalesRecientes: '',
    usaAnticonceptivos: '',
    desdeCuandoBrotes: '',
    manipulaGranitos: '',
    acneDoloroso: '',
    manchasOrigenes: [],
    pielEnrojeceFacilmente: '',
    pielArdeIrritaFacil: '',
  },
  consentimiento: {
    aceptado: false,
    firmaCliente: '',
  },
})

function BinaryChoice({
  label,
  name,
  value,
  onChange,
  required = true,
  yesLabel = 'Sí',
  noLabel = 'No',
}) {
  return (
    <fieldset className="public-question-fieldset">
      <legend>{label}{required ? <span aria-hidden="true"> *</span> : null}</legend>
      <div className="public-binary-options">
        {BINARY_OPTIONS.map((option) => (
          <label key={`${name}-${option.value}`} className={value === option.value ? 'is-selected' : ''}>
            <input
              required={required}
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.value === 'si' ? yesLabel : noLabel}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function MultipleChoice({ label, hint, name, options, values, onChange, exclusiveOption = '' }) {
  const toggleOption = (option) => {
    if (values.includes(option)) {
      onChange(values.filter((value) => value !== option))
      return
    }

    if (option === exclusiveOption) {
      onChange([option])
      return
    }

    onChange([...values.filter((value) => value !== exclusiveOption), option])
  }

  return (
    <fieldset className="public-question-fieldset public-question-fieldset-wide">
      <legend>{label} <span aria-hidden="true">*</span></legend>
      {hint ? <p>{hint}</p> : null}
      <div className="public-choice-grid">
        {options.map((option) => (
          <label key={`${name}-${option}`} className={values.includes(option) ? 'is-selected' : ''}>
            <input
              type="checkbox"
              name={name}
              value={option}
              checked={values.includes(option)}
              onChange={() => toggleOption(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function SignaturePad({ value, onChange }) {
  const canvasRef = useRef(null)
  const drawingRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    context.clearRect(0, 0, canvas.width, canvas.height)
    if (!value) return

    const image = new Image()
    image.onload = () => context.drawImage(image, 0, 0, canvas.width, canvas.height)
    image.src = value
  }, [value])

  const getPoint = (event) => {
    const canvas = canvasRef.current
    const bounds = canvas.getBoundingClientRect()
    return {
      x: (event.clientX - bounds.left) * (canvas.width / bounds.width),
      y: (event.clientY - bounds.top) * (canvas.height / bounds.height),
    }
  }

  const startDrawing = (event) => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    const point = getPoint(event)
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    context.beginPath()
    context.moveTo(point.x, point.y)
    context.strokeStyle = '#352219'
    context.lineWidth = 4
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.lineTo(point.x + 0.01, point.y + 0.01)
    context.stroke()
    drawingRef.current = true
  }

  const continueDrawing = (event) => {
    if (!drawingRef.current) return
    const context = canvasRef.current.getContext('2d')
    const point = getPoint(event)
    event.preventDefault()
    context.lineTo(point.x, point.y)
    context.stroke()
  }

  const finishDrawing = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    onChange(canvasRef.current.toDataURL('image/png'))
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
    drawingRef.current = false
    onChange('')
  }

  return (
    <div className="public-consent-signature">
      <p>Firma dentro del recuadro usando tu dedo, lápiz digital o mouse.</p>
      <canvas
        ref={canvasRef}
        className="public-consent-signature-canvas"
        width="900"
        height="260"
        aria-label="Área para firma del cliente"
        onPointerDown={startDrawing}
        onPointerMove={continueDrawing}
        onPointerUp={finishDrawing}
        onPointerCancel={finishDrawing}
        onPointerLeave={finishDrawing}
      />
      <div className="public-consent-signature-actions">
        <button type="button" className="public-button public-button-secondary" onClick={clearSignature}>
          Limpiar firma
        </button>
        <span className={value ? 'is-signed' : ''}>{value ? 'Firma registrada ✓' : 'Firma pendiente'}</span>
      </div>
    </div>
  )
}

function PreRegistrationQuestionnaire({ client, error, isSaving, onCancel, onSubmit }) {
  const [answers, setAnswers] = useState(() => createInitialAnswers(client))
  const [sectionIndex, setSectionIndex] = useState(0)
  const [sectionError, setSectionError] = useState('')
  const sectionTopRef = useRef(null)
  const today = new Date().toISOString().split('T')[0]

  const isFemale = answers.step1.sexo === 'femenino'
  const selectedProcedures = answers.step7.procedimientosPrevios.filter((item) => item !== 'Ninguno')
  const hasPreviousProcedure = selectedProcedures.length > 0
    || answers.step7.facialesPrevios === 'si'
    || answers.step7.aparatologiaCorporal === 'si'

  const progress = useMemo(
    () => Math.round(((sectionIndex + 1) / SECTIONS.length) * 100),
    [sectionIndex],
  )

  const setStepField = (step, field, value) => {
    setAnswers((current) => ({
      ...current,
      [step]: {
        ...current[step],
        [field]: value,
      },
    }))
  }

  const moveToSection = (nextIndex) => {
    setSectionIndex(nextIndex)
    setSectionError('')
    window.requestAnimationFrame(() => sectionTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const validateCurrentSection = () => {
    const currentSectionNumber = SECTIONS[sectionIndex].number

    if (currentSectionNumber === '04') {
      if (
        answers.step4.enfermedades.length === 0
        || answers.step4.medicamentosActuales.length === 0
        || answers.step4.alergias.length === 0
        || answers.step4.contraindicaciones.length === 0
      ) {
        return 'Selecciona una respuesta en enfermedades, medicamentos, alergias y contraindicaciones.'
      }

      if (answers.step4.enfermedades.includes('Otro') && !answers.step4.enfermedadesOtro.trim()) {
        return 'Especifica la enfermedad seleccionada como “Otro”.'
      }
      if (
        answers.step4.medicamentosActuales.includes('Otros medicamentos')
        && !answers.step4.medicamentosActualesOtro.trim()
      ) {
        return 'Especifica cuáles son los otros medicamentos.'
      }
      if (answers.step4.alergias.includes('Otras alergias') && !answers.step4.alergiasOtro.trim()) {
        return 'Especifica las otras alergias.'
      }
      if (
        answers.step4.contraindicaciones.includes('Otra contraindicacion')
        && !answers.step4.contraindicacionesOtro.trim()
      ) {
        return 'Especifica la otra contraindicación.'
      }
    }

    if (currentSectionNumber === '07') {
      if (answers.step7.procedimientosPrevios.length === 0) {
        return 'Indica si has tenido procedimientos previos o selecciona “Ninguno”.'
      }
      if (selectedProcedures.includes('Otro') && !answers.step7.procedimientosPreviosOtro.trim()) {
        return 'Especifica el procedimiento seleccionado como “Otro”.'
      }
    }

    if (currentSectionNumber === '08') {
      if (answers.step8.mananaProductos.length === 0 || answers.step8.nocheProductos.length === 0) {
        return 'Selecciona tu rutina de mañana y de noche. Si no tienes una, elige “No tengo rutina”.'
      }
      if (answers.step8.mananaProductos.includes('Otro') && !answers.step8.mananaOtro.trim()) {
        return 'Especifica el otro producto de tu rutina de mañana.'
      }
      if (answers.step8.nocheProductos.includes('Otro') && !answers.step8.nocheOtro.trim()) {
        return 'Especifica el otro producto de tu rutina de noche.'
      }
    }

    if (currentSectionNumber === '10' && answers.step10.manchasOrigenes.length === 0) {
      return 'Selecciona al menos un origen de las manchas.'
    }

    if (currentSectionNumber === '12') {
      if (!answers.consentimiento.aceptado) {
        return 'Confirma que leíste y aceptas el consentimiento informado.'
      }
      if (!answers.consentimiento.firmaCliente) {
        return 'Firma el consentimiento antes de finalizar el prerregistro.'
      }
    }

    return ''
  }

  const handleSectionSubmit = (event) => {
    event.preventDefault()
    const validationMessage = validateCurrentSection()

    if (validationMessage) {
      setSectionError(validationMessage)
      return
    }

    if (sectionIndex < SECTIONS.length - 1) {
      moveToSection(sectionIndex + 1)
      return
    }

    onSubmit(answers)
  }

  const renderClientData = () => (
    <div className="public-question-grid">
      <div className="public-readonly-identity public-question-field-wide">
        <span>Nombre completo</span>
        <strong>{client.nombreCompleto}</strong>
        <small>Teléfono terminado en {client.telefonoUltimos4}</small>
      </div>

      {client.sexo ? (
        <label>
          Sexo
          <input readOnly value={client.sexo === 'femenino' ? 'Mujer' : 'Hombre'} />
        </label>
      ) : (
        <label>
          Sexo <span aria-hidden="true">*</span>
          <select required value={answers.step1.sexo} onChange={(event) => setStepField('step1', 'sexo', event.target.value)}>
            <option value="">Selecciona una opción</option>
            <option value="femenino">Mujer</option>
            <option value="masculino">Hombre</option>
          </select>
        </label>
      )}

      <label>
        Fecha de nacimiento <span aria-hidden="true">*</span>
        <input
          required
          type="date"
          max={today}
          value={answers.step1.fechaNacimiento}
          onChange={(event) => {
            setAnswers((current) => ({
              ...current,
              step1: {
                ...current.step1,
                fechaNacimiento: event.target.value,
                edad: calculateAge(event.target.value),
              },
            }))
          }}
        />
      </label>

      <label>
        Edad
        <input readOnly value={answers.step1.edad} placeholder="Se calcula automáticamente" />
      </label>

      <label>
        Correo electrónico <span aria-hidden="true">*</span>
        <input
          required
          type="email"
          autoComplete="email"
          maxLength="160"
          value={answers.step1.correoElectronico}
          onChange={(event) => setStepField('step1', 'correoElectronico', event.target.value)}
          placeholder="correo@ejemplo.com"
        />
      </label>

      <label>
        Ocupación <span aria-hidden="true">*</span>
        <input
          required
          maxLength="120"
          value={answers.step1.ocupacion}
          onChange={(event) => setStepField('step1', 'ocupacion', event.target.value)}
          placeholder="¿A qué te dedicas?"
        />
      </label>

      <label className="public-question-field-wide">
        Teléfono de contacto de emergencia <span aria-hidden="true">*</span>
        <input
          required
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          minLength="10"
          maxLength="10"
          value={answers.step1.contactoEmergencia}
          onChange={(event) => setStepField(
            'step1',
            'contactoEmergencia',
            event.target.value.replace(/\D/g, '').slice(0, 10),
          )}
          placeholder="10 dígitos"
        />
      </label>

      <label className="public-question-field-wide">
        Objetivo principal <span aria-hidden="true">*</span>
        <textarea
          required
          rows="3"
          maxLength="300"
          value={answers.step1.objetivoPrincipal}
          onChange={(event) => setStepField('step1', 'objetivoPrincipal', event.target.value)}
        />
      </label>

      <label className="public-question-field-wide">
        Inconformidad principal <span aria-hidden="true">*</span>
        <textarea
          required
          rows="3"
          maxLength="300"
          value={answers.step1.inconformidadPrincipal}
          onChange={(event) => setStepField('step1', 'inconformidadPrincipal', event.target.value)}
        />
      </label>
    </div>
  )

  const renderExpectations = () => (
    <div className="public-question-grid">
      <label className="public-question-field-wide">
        ¿Qué es lo que más te gustaría mejorar? <span aria-hidden="true">*</span>
        <textarea
          required
          rows="3"
          maxLength="300"
          value={answers.step3.mejoraPrincipal}
          onChange={(event) => setStepField('step3', 'mejoraPrincipal', event.target.value)}
        />
      </label>
      <label className="public-question-field-wide">
        ¿Qué resultado esperas obtener? <span aria-hidden="true">*</span>
        <textarea
          required
          rows="3"
          maxLength="300"
          value={answers.step3.resultadoEsperado}
          onChange={(event) => setStepField('step3', 'resultadoEsperado', event.target.value)}
        />
      </label>
      <label className="public-question-field-wide">
        ¿En cuánto tiempo esperas verlo? <span aria-hidden="true">*</span>
        <input
          required
          maxLength="120"
          value={answers.step3.tiempoEsperado}
          onChange={(event) => setStepField('step3', 'tiempoEsperado', event.target.value)}
          placeholder="Ej. 3 meses"
        />
      </label>
    </div>
  )

  const renderHealth = () => (
    <div className="public-question-grid">
      <MultipleChoice
        label="Enfermedades"
        hint="Selecciona todas las que correspondan."
        name="enfermedades"
        options={STEP_FOUR_OPTIONS.enfermedades}
        values={answers.step4.enfermedades}
        exclusiveOption="Ninguna"
        onChange={(value) => setStepField('step4', 'enfermedades', value)}
      />
      {answers.step4.enfermedades.includes('Otro') ? (
        <label className="public-question-field-wide">
          ¿Cuál enfermedad? <span aria-hidden="true">*</span>
          <input
            required
            maxLength="180"
            value={answers.step4.enfermedadesOtro}
            onChange={(event) => setStepField('step4', 'enfermedadesOtro', event.target.value)}
          />
        </label>
      ) : null}

      <MultipleChoice
        label="Medicamentos actuales"
        hint="Incluye anticonceptivos, hormonas o medicamentos de uso frecuente."
        name="medicamentos"
        options={STEP_FOUR_OPTIONS.medicamentos}
        values={answers.step4.medicamentosActuales}
        exclusiveOption="Ninguno"
        onChange={(value) => setStepField('step4', 'medicamentosActuales', value)}
      />
      {answers.step4.medicamentosActuales.includes('Otros medicamentos') ? (
        <label className="public-question-field-wide">
          ¿Cuáles medicamentos? <span aria-hidden="true">*</span>
          <input
            required
            maxLength="180"
            value={answers.step4.medicamentosActualesOtro}
            onChange={(event) => setStepField('step4', 'medicamentosActualesOtro', event.target.value)}
          />
        </label>
      ) : null}

      <MultipleChoice
        label="Alergias"
        hint="Selecciona todas las alergias que debamos considerar."
        name="alergias"
        options={STEP_FOUR_OPTIONS.alergias}
        values={answers.step4.alergias}
        exclusiveOption="Ninguna"
        onChange={(value) => setStepField('step4', 'alergias', value)}
      />
      {answers.step4.alergias.includes('Otras alergias') ? (
        <label className="public-question-field-wide">
          ¿Cuáles alergias? <span aria-hidden="true">*</span>
          <input
            required
            maxLength="180"
            value={answers.step4.alergiasOtro}
            onChange={(event) => setStepField('step4', 'alergiasOtro', event.target.value)}
          />
        </label>
      ) : null}

      <MultipleChoice
        label="Contraindicaciones"
        hint="Selecciona cualquier condición que pueda limitar o impedir un tratamiento."
        name="contraindicaciones"
        options={STEP_FOUR_OPTIONS.contraindicaciones}
        values={answers.step4.contraindicaciones}
        exclusiveOption="Ninguna"
        onChange={(value) => setStepField('step4', 'contraindicaciones', value)}
      />
      {answers.step4.contraindicaciones.includes('Otra contraindicacion') ? (
        <label className="public-question-field-wide">
          ¿Cuál contraindicación? <span aria-hidden="true">*</span>
          <input
            required
            maxLength="180"
            value={answers.step4.contraindicacionesOtro}
            onChange={(event) => setStepField('step4', 'contraindicacionesOtro', event.target.value)}
          />
        </label>
      ) : null}

      {isFemale ? (
        <div className="public-conditional-block public-question-field-wide">
          <div className="public-conditional-heading">
            <span>Información para pacientes mujeres</span>
            <p>Estas respuestas ayudan a elegir tratamientos seguros para ti.</p>
          </div>
          <div className="public-question-grid">
            <BinaryChoice
              label="¿Estás embarazada?"
              name="embarazoActual"
              value={answers.step4.embarazoActual}
              onChange={(value) => setStepField('step4', 'embarazoActual', value)}
            />
            <BinaryChoice
              label="¿Estás lactando?"
              name="lactanciaActual"
              value={answers.step4.lactanciaActual}
              onChange={(value) => setStepField('step4', 'lactanciaActual', value)}
            />
            <BinaryChoice
              label="¿Planeas un embarazo próximamente?"
              name="embarazoProximo"
              value={answers.step4.embarazoProximo}
              onChange={(value) => setStepField('step4', 'embarazoProximo', value)}
            />
          </div>
        </div>
      ) : null}
    </div>
  )

  const renderLifestyle = () => (
    <div className="public-question-grid">
      <label>
        ¿Cuánta agua tomas al día? <span aria-hidden="true">*</span>
        <input
          required
          maxLength="80"
          value={answers.step5.aguaDiaria}
          onChange={(event) => setStepField('step5', 'aguaDiaria', event.target.value)}
          placeholder="Ej. 2 litros"
        />
      </label>
      <label>
        ¿Cómo calificas tu alimentación? <span aria-hidden="true">*</span>
        <select
          required
          value={answers.step5.calidadAlimentacion}
          onChange={(event) => setStepField('step5', 'calidadAlimentacion', event.target.value)}
        >
          <option value="">Selecciona una opción</option>
          <option value="muy buena">Muy buena</option>
          <option value="buena">Buena</option>
          <option value="regular">Regular</option>
          <option value="mala">Mala</option>
          <option value="muy mala">Muy mala</option>
        </select>
      </label>
      <BinaryChoice
        label="¿Consumes mucho azúcar o lácteos?"
        name="consumeAzucarLacteos"
        value={answers.step5.consumeAzucarLacteos}
        onChange={(value) => setStepField('step5', 'consumeAzucarLacteos', value)}
      />
      <BinaryChoice
        label="¿Fumas?"
        name="fuma"
        value={answers.step5.fuma}
        onChange={(value) => setStepField('step5', 'fuma', value)}
      />
      <BinaryChoice
        label="¿Consumes alcohol?"
        name="consumeAlcohol"
        value={answers.step5.consumeAlcohol}
        onChange={(value) => setStepField('step5', 'consumeAlcohol', value)}
      />
      <BinaryChoice
        label="¿Realizas ejercicio?"
        name="realizaEjercicio"
        value={answers.step5.realizaEjercicio}
        onChange={(value) => {
          setStepField('step5', 'realizaEjercicio', value)
          if (value === 'no') setStepField('step5', 'ejercicioFrecuenciaSemanal', '')
        }}
      />
      {answers.step5.realizaEjercicio === 'si' ? (
        <label>
          Veces por semana <span aria-hidden="true">*</span>
          <select
            required
            value={answers.step5.ejercicioFrecuenciaSemanal}
            onChange={(event) => setStepField('step5', 'ejercicioFrecuenciaSemanal', event.target.value)}
          >
            <option value="">Selecciona</option>
            {Array.from({ length: 7 }, (_, index) => index + 1).map((number) => (
              <option key={`ejercicio-${number}`} value={number}>{number}</option>
            ))}
          </select>
        </label>
      ) : null}
      <label>
        Horas que duermes por noche <span aria-hidden="true">*</span>
        <select
          required
          value={answers.step5.horasSueno}
          onChange={(event) => setStepField('step5', 'horasSueno', event.target.value)}
        >
          <option value="">Selecciona</option>
          {Array.from({ length: 12 }, (_, index) => index + 1).map((number) => (
            <option key={`sueno-${number}`} value={number}>{number}</option>
          ))}
        </select>
      </label>
      <BinaryChoice
        label="¿Tu nivel de estrés es alto?"
        name="estresAlto"
        value={answers.step5.estresAlto}
        onChange={(value) => setStepField('step5', 'estresAlto', value)}
      />
      <BinaryChoice
        label="¿Te desvelas frecuentemente?"
        name="desvelosFrecuentes"
        value={answers.step5.desvelosFrecuentes}
        onChange={(value) => setStepField('step5', 'desvelosFrecuentes', value)}
      />
    </div>
  )

  const renderSunExposure = () => (
    <div className="public-question-grid">
      <BinaryChoice
        label="¿Usas protector solar diariamente?"
        name="usaProtectorDiario"
        value={answers.step6.usaProtectorDiario}
        onChange={(value) => {
          setStepField('step6', 'usaProtectorDiario', value)
          if (value === 'no') {
            setStepField('step6', 'spfUtilizado', '')
            setStepField('step6', 'frecuenciaReaplicacion', '')
          }
        }}
      />
      {answers.step6.usaProtectorDiario === 'si' ? (
        <>
          <label>
            ¿Qué SPF utilizas? <span aria-hidden="true">*</span>
            <input
              required
              maxLength="80"
              value={answers.step6.spfUtilizado}
              onChange={(event) => setStepField('step6', 'spfUtilizado', event.target.value)}
              placeholder="Ej. SPF 50"
            />
          </label>
          <label>
            ¿Cada cuánto lo reaplicas? <span aria-hidden="true">*</span>
            <input
              required
              maxLength="80"
              value={answers.step6.frecuenciaReaplicacion}
              onChange={(event) => setStepField('step6', 'frecuenciaReaplicacion', event.target.value)}
              placeholder="Ej. Cada 3 horas"
            />
          </label>
        </>
      ) : null}
      <BinaryChoice
        label="¿Trabajas o pasas mucho tiempo al sol?"
        name="tiempoProlongadoSol"
        value={answers.step6.tiempoProlongadoSol}
        onChange={(value) => setStepField('step6', 'tiempoProlongadoSol', value)}
      />
      <BinaryChoice
        label="¿Has tenido quemaduras solares recientes?"
        name="quemadurasSolaresRecientes"
        value={answers.step6.quemadurasSolaresRecientes}
        onChange={(value) => setStepField('step6', 'quemadurasSolaresRecientes', value)}
      />
    </div>
  )

  const renderAestheticHistory = () => (
    <div className="public-question-grid">
      <MultipleChoice
        label="Procedimientos previos"
        hint="Selecciona todos los procedimientos que hayas recibido."
        name="procedimientosPrevios"
        options={[...STEP_SEVEN_OPTIONS.procedimientosPrevios, 'Ninguno']}
        values={answers.step7.procedimientosPrevios}
        exclusiveOption="Ninguno"
        onChange={(value) => setStepField('step7', 'procedimientosPrevios', value)}
      />
      {selectedProcedures.includes('Otro') ? (
        <label className="public-question-field-wide">
          ¿Cuál procedimiento? <span aria-hidden="true">*</span>
          <input
            required
            maxLength="180"
            value={answers.step7.procedimientosPreviosOtro}
            onChange={(event) => setStepField('step7', 'procedimientosPreviosOtro', event.target.value)}
          />
        </label>
      ) : null}
      <BinaryChoice
        label="¿Has tenido faciales previos?"
        name="facialesPrevios"
        value={answers.step7.facialesPrevios}
        onChange={(value) => {
          setStepField('step7', 'facialesPrevios', value)
          if (value === 'no') setStepField('step7', 'facialesPreviosCuales', '')
        }}
      />
      {answers.step7.facialesPrevios === 'si' ? (
        <label>
          ¿Cuáles faciales? <span aria-hidden="true">*</span>
          <input
            required
            maxLength="180"
            value={answers.step7.facialesPreviosCuales}
            onChange={(event) => setStepField('step7', 'facialesPreviosCuales', event.target.value)}
          />
        </label>
      ) : null}
      <BinaryChoice
        label="¿Has usado aparatología?"
        name="aparatologiaCorporal"
        value={answers.step7.aparatologiaCorporal}
        onChange={(value) => {
          setStepField('step7', 'aparatologiaCorporal', value)
          if (value === 'no') setStepField('step7', 'aparatologiaCorporalCuales', '')
        }}
      />
      {answers.step7.aparatologiaCorporal === 'si' ? (
        <label>
          ¿Cuál aparatología? <span aria-hidden="true">*</span>
          <input
            required
            maxLength="180"
            value={answers.step7.aparatologiaCorporalCuales}
            onChange={(event) => setStepField('step7', 'aparatologiaCorporalCuales', event.target.value)}
          />
        </label>
      ) : null}

      {hasPreviousProcedure ? (
        <div className="public-conditional-block public-question-field-wide">
          <div className="public-conditional-heading">
            <span>Preguntas importantes</span>
            <p>Se muestran porque indicaste al menos un procedimiento, facial o aparatología previa.</p>
          </div>
          <div className="public-question-grid">
            <label>
              Fecha del último procedimiento <span aria-hidden="true">*</span>
              <input
                required
                type="date"
                max={today}
                value={answers.step7.fechaUltimoProcedimiento}
                onChange={(event) => setStepField('step7', 'fechaUltimoProcedimiento', event.target.value)}
              />
            </label>
            <BinaryChoice
              label="¿Algún tratamiento te irritó?"
              name="tratamientoIrrito"
              value={answers.step7.tratamientoIrrito}
              onChange={(value) => {
                setStepField('step7', 'tratamientoIrrito', value)
                if (value === 'no') setStepField('step7', 'tratamientoIrritoDetalle', '')
              }}
            />
            {answers.step7.tratamientoIrrito === 'si' ? (
              <label className="public-question-field-wide">
                ¿Cuál tratamiento te irritó? <span aria-hidden="true">*</span>
                <textarea
                  required
                  rows="3"
                  maxLength="300"
                  value={answers.step7.tratamientoIrritoDetalle}
                  onChange={(event) => setStepField('step7', 'tratamientoIrritoDetalle', event.target.value)}
                />
              </label>
            ) : null}
            <BinaryChoice
              label="¿Has tenido quemaduras o malas experiencias?"
              name="quemadurasOMalasExperiencias"
              value={answers.step7.quemadurasOMalasExperiencias}
              onChange={(value) => setStepField('step7', 'quemadurasOMalasExperiencias', value)}
            />
            <BinaryChoice
              label="¿Tu piel reacciona fácilmente?"
              name="pielReaccionaFacilmente"
              value={answers.step7.pielReaccionaFacilmente}
              onChange={(value) => setStepField('step7', 'pielReaccionaFacilmente', value)}
            />
            <BinaryChoice
              label="¿Toleras bien el dolor?"
              name="toleraBienDolor"
              value={answers.step7.toleraBienDolor}
              onChange={(value) => setStepField('step7', 'toleraBienDolor', value)}
            />
          </div>
        </div>
      ) : null}
    </div>
  )

  const renderRoutine = () => (
    <div className="public-question-grid">
      <MultipleChoice
        label="Rutina de la mañana"
        hint="Selecciona los productos que usas habitualmente."
        name="rutinaManana"
        options={STEP_EIGHT_OPTIONS.manana}
        values={answers.step8.mananaProductos}
        exclusiveOption="No tengo rutina"
        onChange={(value) => setStepField('step8', 'mananaProductos', value)}
      />
      {answers.step8.mananaProductos.includes('Otro') ? (
        <label className="public-question-field-wide">
          Otro producto de la mañana <span aria-hidden="true">*</span>
          <input
            required
            maxLength="180"
            value={answers.step8.mananaOtro}
            onChange={(event) => setStepField('step8', 'mananaOtro', event.target.value)}
          />
        </label>
      ) : null}
      <MultipleChoice
        label="Rutina de la noche"
        hint="Selecciona los productos que usas habitualmente."
        name="rutinaNoche"
        options={STEP_EIGHT_OPTIONS.noche}
        values={answers.step8.nocheProductos}
        exclusiveOption="No tengo rutina"
        onChange={(value) => setStepField('step8', 'nocheProductos', value)}
      />
      {answers.step8.nocheProductos.includes('Otro') ? (
        <label className="public-question-field-wide">
          Otro producto de la noche <span aria-hidden="true">*</span>
          <input
            required
            maxLength="180"
            value={answers.step8.nocheOtro}
            onChange={(event) => setStepField('step8', 'nocheOtro', event.target.value)}
          />
        </label>
      ) : null}
      <BinaryChoice
        label="¿Usas retinol?"
        name="usaRetinol"
        value={answers.step8.usaRetinol}
        onChange={(value) => setStepField('step8', 'usaRetinol', value)}
      />
      <BinaryChoice
        label="¿Usas ácidos?"
        name="usaAcidos"
        value={answers.step8.usaAcidos}
        onChange={(value) => setStepField('step8', 'usaAcidos', value)}
      />
      <BinaryChoice
        label="¿Algún producto te ha irritado?"
        name="productosIrritaronRespuesta"
        value={answers.step8.productosIrritaronRespuesta}
        yesLabel="Sí, agregar productos"
        noLabel="Ninguno"
        onChange={(value) => {
          setAnswers((current) => ({
            ...current,
            step8: {
              ...current.step8,
              productosIrritaronRespuesta: value,
              productosIrritaron: value === 'no' ? 'Ninguno' : '',
            },
          }))
        }}
      />
      {answers.step8.productosIrritaronRespuesta === 'si' ? (
        <label className="public-question-field-wide">
          ¿Qué productos te han irritado? <span aria-hidden="true">*</span>
          <textarea
            required
            rows="3"
            maxLength="300"
            value={answers.step8.productosIrritaron}
            onChange={(event) => setStepField('step8', 'productosIrritaron', event.target.value)}
            placeholder="Escribe los productos"
          />
        </label>
      ) : null}
      <BinaryChoice
        label="¿Has tenido brotes por algún producto?"
        name="brotesPorProducto"
        value={answers.step8.brotesPorProducto}
        onChange={(value) => setStepField('step8', 'brotesPorProducto', value)}
      />
      <BinaryChoice
        label="¿Eres constante con tu rutina?"
        name="constanteRutina"
        value={answers.step8.constanteRutina}
        onChange={(value) => setStepField('step8', 'constanteRutina', value)}
      />
      <BinaryChoice
        label="¿Podrías seguir cuidados en casa?"
        name="seguiriaCuidadosCasa"
        value={answers.step8.seguiriaCuidadosCasa}
        onChange={(value) => setStepField('step8', 'seguiriaCuidadosCasa', value)}
      />
      <label className="public-question-field-wide">
        ¿Cuánto tiempo le dedicas a tu piel? <span aria-hidden="true">*</span>
        <input
          required
          maxLength="120"
          value={answers.step8.tiempoDedicadoPiel}
          onChange={(event) => setStepField('step8', 'tiempoDedicadoPiel', event.target.value)}
          placeholder="Ej. 10 minutos por la mañana y por la noche"
        />
      </label>
    </div>
  )

  const renderFacialEvaluationTwo = () => (
    <div className="public-question-grid">
      {isFemale ? (
        <div className="public-conditional-block public-question-field-wide">
          <div className="public-conditional-heading">
            <span>Información hormonal</span>
            <p>Estas preguntas se muestran únicamente para mujeres.</p>
          </div>
          <div className="public-question-grid">
            <BinaryChoice
              label="¿Tu acné empeora en tu periodo?"
              name="acneEmpeoraPeriodo"
              value={answers.step10.acneEmpeoraPeriodo}
              onChange={(value) => setStepField('step10', 'acneEmpeoraPeriodo', value)}
            />
            <BinaryChoice
              label="¿Has tenido cambios hormonales recientes?"
              name="cambiosHormonalesRecientes"
              value={answers.step10.cambiosHormonalesRecientes}
              onChange={(value) => setStepField('step10', 'cambiosHormonalesRecientes', value)}
            />
            <BinaryChoice
              label="¿Usas anticonceptivos?"
              name="usaAnticonceptivos"
              value={answers.step10.usaAnticonceptivos}
              onChange={(value) => setStepField('step10', 'usaAnticonceptivos', value)}
            />
          </div>
        </div>
      ) : null}

      <label className="public-question-field-wide">
        Acné: ¿desde cuándo tienes brotes? <span aria-hidden="true">*</span>
        <input
          required
          maxLength="180"
          value={answers.step10.desdeCuandoBrotes}
          onChange={(event) => setStepField('step10', 'desdeCuandoBrotes', event.target.value)}
          placeholder="Ej. Desde hace 2 años"
        />
      </label>
      <BinaryChoice
        label="¿Manipulas los granitos?"
        name="manipulaGranitos"
        value={answers.step10.manipulaGranitos}
        onChange={(value) => setStepField('step10', 'manipulaGranitos', value)}
      />
      <BinaryChoice
        label="¿El acné es doloroso?"
        name="acneDoloroso"
        value={answers.step10.acneDoloroso}
        onChange={(value) => setStepField('step10', 'acneDoloroso', value)}
      />
      <MultipleChoice
        label="Manchas: selecciona el origen"
        hint="Selecciona todos los orígenes que correspondan."
        name="manchasOrigenes"
        options={STEP_TEN_OPTIONS.manchasOrigenes}
        values={answers.step10.manchasOrigenes}
        exclusiveOption="No tengo manchas"
        onChange={(value) => setStepField('step10', 'manchasOrigenes', value)}
      />
      <BinaryChoice
        label="¿Tu piel se enrojece fácilmente?"
        name="pielEnrojeceFacilmente"
        value={answers.step10.pielEnrojeceFacilmente}
        onChange={(value) => setStepField('step10', 'pielEnrojeceFacilmente', value)}
      />
      <BinaryChoice
        label="¿Tu piel arde o se irrita con facilidad?"
        name="pielArdeIrritaFacil"
        value={answers.step10.pielArdeIrritaFacil}
        onChange={(value) => setStepField('step10', 'pielArdeIrritaFacil', value)}
      />
    </div>
  )

  const renderConsent = () => (
    <div className="public-consent public-question-field-wide">
      <div className="public-consent-document" tabIndex="0" aria-label="Texto del consentimiento informado">
        <header>
          <p>Fermont Skin Studio</p>
          <h3>Consentimiento informado</h3>
          <strong>Para procedimientos cosmetológicos no invasivos</strong>
        </header>

        <dl className="public-consent-client-data">
          <div>
            <dt>Nombre del cliente</dt>
            <dd>{client.nombreCompleto}</dd>
          </div>
          <div>
            <dt>Fecha</dt>
            <dd>{today}</dd>
          </div>
        </dl>

        <p>
          Por medio del presente documento manifiesto que he sido informado(a) de manera clara y suficiente
          sobre el procedimiento cosmetológico no invasivo que recibiré, así como de sus beneficios, posibles
          efectos temporales y cuidados posteriores.
        </p>
        <p>Declaro que entiendo y acepto lo siguiente:</p>
        <ol>
          <li>
            El procedimiento que recibiré es de carácter cosmetológico y no invasivo, con fines exclusivamente
            estéticos y de bienestar.
          </li>
          <li>
            Entiendo que este procedimiento no constituye un tratamiento médico, no sustituye la atención médica
            y no tiene como finalidad diagnosticar, tratar o curar enfermedades.
          </li>
          <li>
            He informado de manera veraz cualquier condición de salud, alergia, enfermedad, medicamento o
            situación que pudiera representar una contraindicación para la realización del procedimiento.
          </li>
          <li>
            Comprendo que durante o después del tratamiento pueden presentarse reacciones temporales normales,
            tales como enrojecimiento, sensibilidad, ligera inflamación, sensación de calor, hormigueo, resequedad
            o descamación leve, las cuales generalmente desaparecen en poco tiempo.
          </li>
          <li>
            Entiendo que los resultados pueden variar de una persona a otra y dependen de factores como el tipo
            de piel, hábitos personales, cuidados posteriores y número de sesiones realizadas.
          </li>
          <li>
            Me comprometo a seguir las recomendaciones e indicaciones proporcionadas por el personal responsable
            antes y después del procedimiento.
          </li>
          <li>
            Autorizo al personal del establecimiento a suspender o no realizar el procedimiento si considera que
            existe alguna condición que pueda representar un riesgo para mi salud o seguridad.
          </li>
          <li>
            He tenido la oportunidad de realizar preguntas y todas mis dudas fueron respondidas de forma
            satisfactoria.
          </li>
          <li>
            Otorgo mi consentimiento de manera libre, voluntaria e informada para la realización del procedimiento
            cosmetológico no invasivo descrito.
          </li>
        </ol>
      </div>

      <label className="public-consent-acceptance">
        <input
          type="checkbox"
          checked={answers.consentimiento.aceptado}
          onChange={(event) => setStepField('consentimiento', 'aceptado', event.target.checked)}
        />
        <span>He leído, comprendido y acepto el consentimiento informado. <b>*</b></span>
      </label>

      <SignaturePad
        value={answers.consentimiento.firmaCliente}
        onChange={(value) => setStepField('consentimiento', 'firmaCliente', value)}
      />
    </div>
  )

  const sectionContent = [
    renderClientData,
    renderExpectations,
    renderHealth,
    renderLifestyle,
    renderSunExposure,
    renderAestheticHistory,
    renderRoutine,
    renderFacialEvaluationTwo,
    renderConsent,
  ][sectionIndex]

  return (
    <div className="public-questionnaire" ref={sectionTopRef}>
      <aside className="public-questionnaire-sidebar" aria-label="Progreso del prerregistro">
        <div className="public-questionnaire-progress-copy">
          <span>Tu progreso</span>
          <strong>{progress}%</strong>
        </div>
        <div className="public-questionnaire-progress" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
        <ol>
          {SECTIONS.map((section, index) => (
            <li
              key={section.number}
              className={index === sectionIndex ? 'is-active' : index < sectionIndex ? 'is-complete' : ''}
            >
              <span>{index < sectionIndex ? '✓' : section.number}</span>
              <div>
                <small>Paso {index + 1}</small>
                <strong>{section.shortTitle}</strong>
              </div>
            </li>
          ))}
        </ol>
        <p>Tu información se utiliza para preparar una valoración más ágil y personalizada.</p>
      </aside>

      <form className="public-questionnaire-form" onSubmit={handleSectionSubmit}>
        <header className="public-questionnaire-heading">
          <span>{SECTIONS[sectionIndex].number}</span>
          <div>
            <p>Paso {sectionIndex + 1} de {SECTIONS.length}</p>
            <h2>{SECTIONS[sectionIndex].title}</h2>
          </div>
        </header>

        <p className="public-required-note"><span>*</span> Campos obligatorios</p>
        {sectionContent()}

        {sectionError ? <p className="public-form-error" role="alert">{sectionError}</p> : null}
        {error ? <p className="public-form-error" role="alert">{error}</p> : null}

        <div className="public-questionnaire-actions">
          <button
            className="public-button public-button-secondary"
            type="button"
            disabled={isSaving}
            onClick={() => (sectionIndex === 0 ? onCancel() : moveToSection(sectionIndex - 1))}
          >
            {sectionIndex === 0 ? 'Elegir otro' : 'Anterior'}
          </button>
          <button className="public-button public-button-primary" type="submit" disabled={isSaving}>
            {isSaving
              ? 'Guardando...'
              : sectionIndex === SECTIONS.length - 1
                ? 'Finalizar prerregistro'
                : 'Continuar'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PreRegistrationQuestionnaire
