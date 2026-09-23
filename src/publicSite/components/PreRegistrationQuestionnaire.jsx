import { useMemo, useRef, useState } from 'react'
import {
  STEP_EIGHT_OPTIONS,
  STEP_FOUR_OPTIONS,
  STEP_SEVEN_OPTIONS,
} from '../../models/valuationModel.js'

const SECTIONS = [
  { number: '01', title: 'Datos del cliente', shortTitle: 'Datos' },
  { number: '04', title: 'Antecedentes de salud', shortTitle: 'Salud' },
  { number: '05', title: 'Hábitos y estilo de vida', shortTitle: 'Hábitos' },
  { number: '06', title: 'Exposición solar', shortTitle: 'Sol' },
  { number: '07', title: 'Historial estético', shortTitle: 'Historial' },
  { number: '08', title: 'Rutina actual', shortTitle: 'Rutina' },
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

const createInitialAnswers = ({ nombreCompleto, telefono }) => ({
  step1: {
    ...splitFullName(nombreCompleto),
    nombreCompleto: String(nombreCompleto ?? ''),
    sexo: '',
    edad: '',
    fechaNacimiento: '',
    telefono: String(telefono ?? ''),
    correoElectronico: '',
    ocupacion: '',
    contactoEmergencia: '',
  },
  step4: {
    enfermedades: [],
    enfermedadesOtro: '',
    medicamentosActuales: [],
    medicamentosActualesOtro: '',
    alergias: [],
    alergiasOtro: '',
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
    productosIrritaron: '',
    brotesPorProducto: '',
    constanteRutina: '',
  },
})

function BinaryChoice({ label, name, value, onChange, required = true }) {
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
            <span>{option.label}</span>
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
    if (sectionIndex === 1) {
      if (
        answers.step4.enfermedades.length === 0
        || answers.step4.medicamentosActuales.length === 0
        || answers.step4.alergias.length === 0
      ) {
        return 'Selecciona una respuesta en enfermedades, medicamentos y alergias o contraindicaciones.'
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
    }

    if (sectionIndex === 4) {
      if (answers.step7.procedimientosPrevios.length === 0) {
        return 'Indica si has tenido procedimientos previos o selecciona “Ninguno”.'
      }
      if (selectedProcedures.includes('Otro') && !answers.step7.procedimientosPreviosOtro.trim()) {
        return 'Especifica el procedimiento seleccionado como “Otro”.'
      }
    }

    if (sectionIndex === 5) {
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

      <p className="public-question-helper public-question-field-wide">
        Confirma cómo se divide tu nombre para que tu expediente quede registrado correctamente.
      </p>

      <label>
        Nombre(s) <span aria-hidden="true">*</span>
        <input
          required
          autoComplete="given-name"
          maxLength="100"
          value={answers.step1.nombre}
          onChange={(event) => setStepField('step1', 'nombre', event.target.value)}
        />
      </label>

      <label>
        Apellido paterno <span aria-hidden="true">*</span>
        <input
          required
          autoComplete="family-name"
          maxLength="80"
          value={answers.step1.apellidoPaterno}
          onChange={(event) => setStepField('step1', 'apellidoPaterno', event.target.value)}
        />
      </label>

      <label>
        Apellido materno <span aria-hidden="true">*</span>
        <input
          required
          maxLength="80"
          value={answers.step1.apellidoMaterno}
          onChange={(event) => setStepField('step1', 'apellidoMaterno', event.target.value)}
        />
      </label>

      <label>
        Sexo <span aria-hidden="true">*</span>
        <select
          required
          value={answers.step1.sexo}
          onChange={(event) => {
            const sexo = event.target.value
            setStepField('step1', 'sexo', sexo)
            if (sexo === 'masculino') {
              setAnswers((current) => ({
                ...current,
                step1: { ...current.step1, sexo },
                step4: {
                  ...current.step4,
                  embarazoActual: '',
                  lactanciaActual: '',
                  embarazoProximo: '',
                },
              }))
            }
          }}
        >
          <option value="">Selecciona una opción</option>
          <option value="femenino">Femenino</option>
          <option value="masculino">Masculino</option>
        </select>
      </label>

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
        Contacto de emergencia <span aria-hidden="true">*</span>
        <input
          required
          maxLength="180"
          value={answers.step1.contactoEmergencia}
          onChange={(event) => setStepField('step1', 'contactoEmergencia', event.target.value)}
          placeholder="Nombre, parentesco y teléfono"
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
        label="Alergias y contraindicaciones"
        hint="Selecciona cualquier condición que debamos considerar durante tu valoración."
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
          Frecuencia semanal <span aria-hidden="true">*</span>
          <input
            required
            maxLength="80"
            value={answers.step5.ejercicioFrecuenciaSemanal}
            onChange={(event) => setStepField('step5', 'ejercicioFrecuenciaSemanal', event.target.value)}
            placeholder="Ej. 3 veces por semana"
          />
        </label>
      ) : null}
      <label>
        ¿Cuántas horas duermes? <span aria-hidden="true">*</span>
        <input
          required
          maxLength="80"
          value={answers.step5.horasSueno}
          onChange={(event) => setStepField('step5', 'horasSueno', event.target.value)}
          placeholder="Ej. 7 horas"
        />
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
        label="¿Has usado aparatología corporal?"
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
        label="Rutina de mañana"
        hint="Selecciona los productos que usas habitualmente."
        name="rutinaManana"
        options={STEP_EIGHT_OPTIONS.manana}
        values={answers.step8.mananaProductos}
        exclusiveOption="No tengo rutina"
        onChange={(value) => setStepField('step8', 'mananaProductos', value)}
      />
      {answers.step8.mananaProductos.includes('Otro') ? (
        <label className="public-question-field-wide">
          Otro producto de mañana <span aria-hidden="true">*</span>
          <input
            required
            maxLength="180"
            value={answers.step8.mananaOtro}
            onChange={(event) => setStepField('step8', 'mananaOtro', event.target.value)}
          />
        </label>
      ) : null}
      <MultipleChoice
        label="Rutina de noche"
        hint="Selecciona los productos que usas habitualmente."
        name="rutinaNoche"
        options={STEP_EIGHT_OPTIONS.noche}
        values={answers.step8.nocheProductos}
        exclusiveOption="No tengo rutina"
        onChange={(value) => setStepField('step8', 'nocheProductos', value)}
      />
      {answers.step8.nocheProductos.includes('Otro') ? (
        <label className="public-question-field-wide">
          Otro producto de noche <span aria-hidden="true">*</span>
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
      <label className="public-question-field-wide">
        Productos que te han irritado <span aria-hidden="true">*</span>
        <textarea
          required
          rows="3"
          maxLength="300"
          value={answers.step8.productosIrritaron}
          onChange={(event) => setStepField('step8', 'productosIrritaron', event.target.value)}
          placeholder="Escribe los productos o indica “Ninguno”"
        />
      </label>
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
    </div>
  )

  const sectionContent = [
    renderClientData,
    renderHealth,
    renderLifestyle,
    renderSunExposure,
    renderAestheticHistory,
    renderRoutine,
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
