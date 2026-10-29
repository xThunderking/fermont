import { Link } from 'react-router-dom'
import { useLayoutEffect } from 'react'
import './publicSite.css'

const privacySections = [
  {
    title: '1. Responsable y domicilio',
    content: (
      <p>
        María Fernanda Montesinos Rodríguez, quien opera bajo el nombre comercial Fermont Skin &amp; Beauty Studio,
        con domicilio en C. Verónica 112D, colonia El Tintero, C. P. 76134, Santiago de Querétaro, Querétaro,
        es responsable del tratamiento de los datos personales recabados para las valoraciones cosmetológicas y
        servicios de Fermont. Para dudas o solicitudes sobre sus datos, puede escribir a{' '}
        <a href="mailto:fermont.estudio@gmail.com">fermont.estudio@gmail.com</a>.
      </p>
    ),
  },
  {
    title: '2. Datos personales que se recaban',
    content: (
      <>
        <p>Según el servicio y la información que usted proporcione, podemos recabar:</p>
        <ul>
          <li><strong>Identificación y contacto:</strong> nombre y apellidos, sexo, fecha de nacimiento, edad, teléfono, correo electrónico, ocupación y teléfono de contacto de emergencia.</li>
          <li><strong>Valoración y servicio:</strong> objetivos de cuidado, zonas que desea atender, antecedentes de procedimientos estéticos, rutinas y productos utilizados, exposición solar, hábitos relacionados con el cuidado de la piel y notas de seguimiento.</li>
          <li><strong>Datos sensibles relacionados con la salud:</strong> enfermedades o condiciones, medicamentos, alergias, contraindicaciones, embarazo o lactancia, condiciones de la piel y el cuerpo, sensibilidad, reacciones, circulación y otra información que comparta para valorar el servicio.</li>
          <li><strong>Imágenes y documentos:</strong> fotografías o videos de las zonas valoradas o tratadas, marcas en mapas faciales o corporales, firmas de la persona y de la cosmetóloga, fecha y estado del consentimiento.</li>
        </ul>
        <p>Fermont no atiende a personas menores de 18 años.</p>
      </>
    ),
  },
  {
    title: '3. Finalidades del tratamiento',
    content: (
      <>
        <p>Usamos sus datos para finalidades necesarias para la atención:</p>
        <ul>
          <li>Crear y administrar prerregistros, coordinar la atención y contactar a la persona.</li>
          <li>Realizar una valoración cosmetológica no invasiva, identificar posibles contraindicaciones y determinar qué servicio estético y de bienestar puede ofrecerse.</li>
          <li>Integrar y conservar el expediente cosmetológico, documentar el servicio, registrar productos utilizados, atender consultas y dar seguimiento a la evolución y recomendaciones de cuidado.</li>
          <li>Conservar constancia del consentimiento informado y de las decisiones expresadas sobre el uso de imágenes.</li>
          <li>Atender solicitudes sobre datos personales y cumplir obligaciones legales aplicables.</li>
        </ul>
        <p>La toma de fotografías o videos para documentar la valoración, integrar el expediente y dar seguimiento se limita a esos fines de atención y cuidado.</p>
      </>
    ),
  },
  {
    title: '4. Uso opcional de imágenes para publicidad',
    content: (
      <p>
        Fermont solo utilizará fotografías o videos para material informativo o de marketing —por ejemplo, en redes
        sociales, el sitio web o un portafolio— cuando la persona otorgue una autorización expresa y separada. Puede
        rechazarla sin que esto afecte su valoración o servicio, y retirar su autorización para usos futuros escribiendo
        a <a href="mailto:fermont.estudio@gmail.com">fermont.estudio@gmail.com</a>. La documentación de imágenes
        para la valoración y el expediente tiene una finalidad distinta y no implica autorización promocional.
      </p>
    ),
  },
  {
    title: '5. Conservación y eliminación',
    content: (
      <p>
        Conservaremos los datos durante el tiempo necesario para las finalidades descritas y para atender las
        obligaciones o responsabilidades legales aplicables. Cuando dejen de ser necesarios, serán eliminados de
        nuestros registros y archivos, salvo la información que deba conservarse por una obligación legal.
      </p>
    ),
  },
  {
    title: '6. Acceso y proveedores tecnológicos',
    content: (
      <>
        <p>
          El acceso operativo está limitado a las cuentas de Google autorizadas por Fermont y con perfil activo en el
          sistema: dos cuentas utilizadas por la cosmetóloga y una cuenta del desarrollador para soporte técnico. El
          sistema aplica esta lista tanto al inicio de sesión como al acceso a la base de datos y archivos.
        </p>
        <p>
          Usamos Firebase y Google para autenticación, base de datos, almacenamiento de archivos y funciones de
          prerregistro. Estos proveedores tratan información para prestar y mantener esos servicios. La página también
          contiene enlaces a WhatsApp, Instagram y Google Maps; si usted los abre, el uso de esos servicios se rige por
          los avisos de sus respectivos proveedores.
        </p>
      </>
    ),
  },
  {
    title: '7. Opciones para limitar el uso de datos',
    content: (
      <p>
        Puede negar o retirar la autorización opcional de uso de imágenes para publicidad en cualquier momento por
        medio de <a href="mailto:fermont.estudio@gmail.com">fermont.estudio@gmail.com</a>. También puede solicitar
        por ese medio que sus datos no se utilicen para finalidades que no sean necesarias para la valoración o el
        servicio.
      </p>
    ),
  },
  {
    title: '8. Derechos de acceso, rectificación, cancelación y oposición',
    content: (
      <>
        <p>
          Puede solicitar acceso a sus datos, corregirlos, pedir su cancelación u oponerse a su tratamiento (derechos
          ARCO) escribiendo a <a href="mailto:fermont.estudio@gmail.com">fermont.estudio@gmail.com</a> con el asunto
          “Solicitud de datos personales”. Incluya su nombre, un medio para recibir respuesta, los datos sobre los que
          desea ejercer el derecho y una descripción clara de su solicitud. Podemos pedir información para verificar
          su identidad o la representación legal.
        </p>
        <p>
          La solicitud se tramitará y responderá conforme a los plazos y excepciones establecidos en la legislación
          aplicable. La cancelación puede estar sujeta a periodos de bloqueo u obligaciones legales de conservación.
        </p>
      </>
    ),
  },
  {
    title: '9. Cambios a este aviso',
    content: (
      <p>
        Si modificamos este aviso, publicaremos la versión actualizada en esta página e indicaremos la fecha de
        actualización.
      </p>
    ),
  },
]

function PrivacyNoticeView() {
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
    document.title = 'Aviso de privacidad | Fermont Skin & Beauty Studio'
    return () => {
      document.title = 'FERMONT'
    }
  }, [])

  return (
    <div className="public-site public-privacy-page">
      <header className="public-privacy-header">
        <Link className="public-footer-brand" to="/" aria-label="Fermont, volver al inicio">
          <strong>Fermont</strong><span>Skin &amp; Beauty Studio</span>
        </Link>
        <Link className="public-privacy-back" to="/">Volver al sitio</Link>
      </header>

      <main className="public-privacy-main">
        <p className="public-eyebrow"><span /> Información y transparencia</p>
        <h1>Aviso de <em>privacidad</em></h1>
        <p className="public-privacy-lead">
          En Fermont cuidamos su información personal. Aquí explicamos qué datos usamos, para qué los necesitamos y
          cómo puede ejercer sus derechos.
        </p>
        <p className="public-privacy-updated">Última actualización: 28 de octubre de 2026</p>

        <article className="public-privacy-content">
          {privacySections.map(({ title, content }) => (
            <section key={title}>
              <h2>{title}</h2>
              {content}
            </section>
          ))}

          <section className="public-privacy-simplified" aria-labelledby="privacy-simplified-title">
            <p className="public-eyebrow"><span /> Para formularios digitales</p>
            <h2 id="privacy-simplified-title">Aviso simplificado</h2>
            <p>
              María Fernanda Montesinos Rodríguez, nombre comercial Fermont Skin &amp; Beauty Studio, con domicilio en
              C. Verónica 112D, colonia El Tintero, C. P. 76134, Santiago de Querétaro, Querétaro, tratará sus datos
              de identificación, contacto, valoración cosmetológica y, cuando usted los proporcione, datos sensibles
              relacionados con su salud, para gestionar su prerregistro, valorar su piel y posibles contraindicaciones,
              prestar servicios cosmetológicos no invasivos, integrar su expediente y dar seguimiento a su atención.
              El uso de fotografías o videos para publicidad es opcional y requiere una autorización separada; negarse
              no afecta su servicio. Puede consultar este aviso integral o escribir a{' '}
              <a href="mailto:fermont.estudio@gmail.com">fermont.estudio@gmail.com</a>.
            </p>
          </section>
        </article>

        <a className="public-button public-button-secondary public-privacy-home" href="/">
          Volver a Fermont
        </a>
      </main>

      <footer className="public-privacy-footer">
        <span>© {new Date().getFullYear()} Fermont Skin &amp; Beauty Studio</span>
        <Link to="/login">Acceso del personal</Link>
      </footer>
    </div>
  )
}

export default PrivacyNoticeView
