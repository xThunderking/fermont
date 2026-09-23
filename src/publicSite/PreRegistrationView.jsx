import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  listPublicPendingPreRegistrations,
  submitPublicPreRegistration,
  verifyPreRegistrationInvitation,
} from '../models/preRegistrationModel.js'
import PublicHeader from './components/PublicHeader.jsx'
import PublicIcon from './components/PublicIcon.jsx'
import PreRegistrationQuestionnaire from './components/PreRegistrationQuestionnaire.jsx'
import { publicSiteConfig } from './siteConfig.js'
import './publicSite.css'

function PreRegistrationView() {
  const [preRegistrations, setPreRegistrations] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [telefono, setTelefono] = useState('')
  const [website, setWebsite] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isStarting, setIsStarting] = useState(false)
  const [isStarted, setIsStarted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadPreRegistrations = async () => {
      const result = await listPublicPendingPreRegistrations()
      if (!isMounted) return

      if (!result.ok) {
        setError(result.message)
        setPreRegistrations([])
      } else {
        setError('')
        setPreRegistrations(result.preRegistrations)
      }
      setIsLoading(false)
    }

    loadPreRegistrations()
    return () => {
      isMounted = false
    }
  }, [])

  const selectedPreRegistration = useMemo(
    () => preRegistrations.find(({ id }) => id === selectedId) ?? null,
    [preRegistrations, selectedId],
  )

  const handleStart = async (event) => {
    event.preventDefault()
    setError('')

    if (!selectedPreRegistration) {
      setError('Selecciona tu nombre para iniciar el prerregistro.')
      return
    }

    if (telefono.replace(/\D/g, '').length !== 10) {
      setError('Escribe tu número de teléfono de 10 dígitos.')
      return
    }

    setIsStarting(true)
    const result = await verifyPreRegistrationInvitation({
      preRegistrationId: selectedPreRegistration.id,
      telefono,
    })
    setIsStarting(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setIsStarted(true)
  }

  const handleSubmit = async (answers) => {
    setError('')
    setSuccessMessage('')

    if (!selectedPreRegistration) {
      setError('Este prerregistro ya no está disponible. Vuelve a seleccionar tu nombre.')
      setIsStarted(false)
      return
    }

    setIsSaving(true)
    const result = await submitPublicPreRegistration({
      preRegistrationId: selectedPreRegistration.id,
      telefono,
      website,
      answers,
    })
    setIsSaving(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setPreRegistrations((current) => current.filter(({ id }) => id !== selectedPreRegistration.id))
    setSelectedId('')
    setTelefono('')
    setIsStarted(false)
    setSuccessMessage(result.message)
  }

  return (
    <div className="public-site public-preregistration-page">
      <PublicHeader whatsapp={publicSiteConfig.whatsapp} />

      <main className="public-preregistration-main">
        <section
          className={`public-preregistration-card ${isStarted ? 'is-questionnaire' : ''}`}
          aria-labelledby="preregistration-title"
        >
          <div className="public-preregistration-copy">
            <p className="public-eyebrow"><span /> Antes de tu primera visita</p>
            <h1 id="preregistration-title">Prerregistro de <em>cliente nuevo.</em></h1>
            <p>
              Selecciona la invitación que Fermont preparó para ti y completa tus datos antes de tu valoración.
            </p>
          </div>

          {successMessage ? (
            <div className="public-preregistration-success" role="status">
              <span><PublicIcon name="heart" /></span>
              <h2>Prerregistro recibido</h2>
              <p>{successMessage}</p>
              <Link className="public-button public-button-secondary" to="/">Volver al inicio</Link>
            </div>
          ) : null}

          {!successMessage && !isStarted ? (
            <form className="public-preregistration-form" onSubmit={handleStart}>
              <div className="public-preregistration-form-heading">
                <h2>Selecciona tu prerregistro</h2>
                <p>Busca tu nombre, revisa la terminación mostrada y escribe tu número completo para confirmar.</p>
              </div>

              {isLoading ? <p className="public-preregistration-note">Cargando invitaciones...</p> : null}

              {!isLoading && preRegistrations.length > 0 ? (
                <>
                  <label>
                    Nombre completo
                    <select
                      required
                      value={selectedId}
                      onChange={(event) => {
                        setSelectedId(event.target.value)
                        setTelefono('')
                      }}
                    >
                      <option value="">Selecciona tu nombre</option>
                      {preRegistrations.map((preRegistration) => (
                        <option key={preRegistration.id} value={preRegistration.id}>
                          {preRegistration.nombreCompleto} · Tel. •••• {preRegistration.telefonoUltimos4}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Confirma tu número telefónico
                    <input
                      required
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength="10"
                      value={telefono}
                      onChange={(event) => setTelefono(event.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10 dígitos"
                    />
                  </label>
                </>
              ) : null}

              {!isLoading && preRegistrations.length === 0 ? (
                <div className="public-preregistration-empty">
                  <h2>No hay prerregistros disponibles</h2>
                  <p>Solicita a Fermont que genere tu invitación antes de continuar.</p>
                </div>
              ) : null}

              {error ? <p className="public-form-error" role="alert">{error}</p> : null}

              <button
                className="public-button public-button-primary"
                type="submit"
                disabled={isLoading || isStarting || preRegistrations.length === 0}
              >
                {isStarting ? 'Verificando...' : 'Iniciar prerregistro'}
                {!isStarting ? <PublicIcon name="arrow" /> : null}
              </button>
            </form>
          ) : null}

          {!successMessage && isStarted && selectedPreRegistration ? (
            <>
              <label className="public-preregistration-honeypot" aria-hidden="true">
                Sitio web
                <input
                  type="text"
                  tabIndex="-1"
                  autoComplete="off"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                />
              </label>
              <PreRegistrationQuestionnaire
                key={selectedPreRegistration.id}
                client={{ ...selectedPreRegistration, telefono }}
                error={error}
                isSaving={isSaving}
                onCancel={() => {
                  setIsStarted(false)
                  setError('')
                }}
                onSubmit={handleSubmit}
              />
            </>
          ) : null}
        </section>
      </main>
    </div>
  )
}

export default PreRegistrationView
