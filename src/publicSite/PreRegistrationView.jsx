import { useState } from 'react'
import { Link } from 'react-router-dom'
import { submitPublicPreRegistration } from '../models/preRegistrationModel.js'
import PublicHeader from './components/PublicHeader.jsx'
import PublicIcon from './components/PublicIcon.jsx'
import { publicSiteConfig } from './siteConfig.js'
import './publicSite.css'

function PreRegistrationView() {
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [website, setWebsite] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccessMessage('')

    if (nombreCompleto.trim().length < 3) {
      setError('Escribe tu nombre completo.')
      return
    }

    setIsSaving(true)
    const result = await submitPublicPreRegistration({
      nombreCompleto,
      website,
    })
    setIsSaving(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setNombreCompleto('')
    setSuccessMessage(result.message)
  }

  return (
    <div className="public-site public-preregistration-page">
      <PublicHeader whatsapp={publicSiteConfig.whatsapp} />

      <main className="public-preregistration-main">
        <section className="public-preregistration-card" aria-labelledby="preregistration-title">
          <div className="public-preregistration-copy">
            <p className="public-eyebrow"><span /> Antes de tu primera visita</p>
            <h1 id="preregistration-title">Prerregistro de <em>cliente nuevo.</em></h1>
            <p>
              Comparte tus datos antes de tu valoración para que podamos preparar tu atención y hacer más ágil tu visita.
            </p>
          </div>

          {successMessage ? (
            <div className="public-preregistration-success" role="status">
              <span><PublicIcon name="heart" /></span>
              <h2>Prerregistro recibido</h2>
              <p>{successMessage}</p>
              <Link className="public-button public-button-secondary" to="/">Volver al inicio</Link>
            </div>
          ) : (
            <form className="public-preregistration-form" onSubmit={handleSubmit}>
              <label>
                Nombre completo
                <input
                  required
                  type="text"
                  autoComplete="name"
                  maxLength="120"
                  value={nombreCompleto}
                  onChange={(event) => setNombreCompleto(event.target.value)}
                  placeholder="Escribe tu nombre completo"
                />
              </label>

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

              <p className="public-preregistration-note">
                Por ahora esta es una vista inicial. Las demás preguntas del prerregistro se agregarán después.
              </p>

              {error ? <p className="public-form-error" role="alert">{error}</p> : null}

              <button className="public-button public-button-primary" type="submit" disabled={isSaving}>
                {isSaving ? 'Enviando...' : 'Finalizar prerregistro'}
                {!isSaving ? <PublicIcon name="arrow" /> : null}
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  )
}

export default PreRegistrationView
