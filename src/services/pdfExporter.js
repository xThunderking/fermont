import html2pdf from 'html2pdf.js'
import mapaFacialImage from '../img/mapainteractivo/mapafacial.jpeg'
import mapaCorporalImage from '../img/mapainteractivo/mapacorporal.jpeg'

const formatDate = (dateString) => {
  if (!dateString) return 'No especificado'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-MX')
  } catch {
    return dateString
  }
}

const toSvgFromStrokes = (strokes, width = 1200, height = 1200) => {
  if (!Array.isArray(strokes) || strokes.length === 0) return ''

  const paths = strokes
    .map((stroke) => {
      if (!Array.isArray(stroke.points) || stroke.points.length === 0) return ''
      const d = stroke.points
        .map((p, i) => {
          const x = (Number(p.x || 0) * width).toFixed(2)
          const y = (Number(p.y || 0) * height).toFixed(2)
          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
        })
        .join(' ')

      const color = stroke.color || '#d14836'
      const size = Number.isFinite(Number(stroke.size)) ? Number(stroke.size) : 8

      return `<path d="${d}" fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round" stroke-width="${size}" />`
    })
    .filter(Boolean)
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" style="position:absolute; left:0; top:0; width:100%; height:100%;">${paths}</svg>`
}

const renderMapPage = (label, imageUrl, strokes) => {
  const svg = toSvgFromStrokes(strokes || [], 1200, 1200)
  return `
    <div style="page-break-after:always; display:block; width:100%; height:100%;">
      <div style="text-align:center; margin-top:10px;"><h2 style="font-size:16px; color:#333;">MAPA: ${label}</h2></div>
      <div style="position:relative; width:100%; max-width:820px; margin:12px auto;">
        <img src="${imageUrl}" style="display:block; width:100%; height:auto;" />
        ${svg}
      </div>
    </div>
  `
}

const renderMapsSinglePage = (valuation) => {
  const facialStrokes = (valuation?.mapaInteractivo?.facial?.strokes) || valuation?.mapaInteractivo?.facial || []
  const corporalStrokes = (valuation?.mapaInteractivo?.corporal?.strokes) || valuation?.mapaInteractivo?.corporal || []

  const facialSvg = toSvgFromStrokes(facialStrokes, 800, 800)
  const corporalSvg = toSvgFromStrokes(corporalStrokes, 800, 800)

  return `
    <div style="page-break-before:always; page-break-after:always; break-before:page; break-after:page; page-break-inside:avoid; width:100%; max-width:820px; margin:0 auto; padding-top:18px; box-sizing:border-box;">
      <h2 style="font-size:16px; color:#333; text-align:center; margin:0 0 12px 0; padding-top:12px;">MAPAS INTERACTIVOS</h2>
      <div style="display:flex; gap:12px; justify-content:space-between; align-items:flex-start; margin-top:8px;">
        <div style="width:49%;">
          <h3 style="margin:6px 0 4px 0; font-size:14px;">Mapa facial</h3>
          <div style="position:relative; width:100%; background:#fff; border:1px solid #eee;">
            <img src="${mapaFacialImage}" style="display:block; width:100%; height:auto;" />
            ${facialSvg}
          </div>
        </div>
        <div style="width:49%;">
          <h3 style="margin:6px 0 4px 0; font-size:14px;">Mapa corporal</h3>
          <div style="position:relative; width:100%; background:#fff; border:1px solid #eee;">
            <img src="${mapaCorporalImage}" style="display:block; width:100%; height:auto;" />
            ${corporalSvg}
          </div>
        </div>
      </div>
    </div>
  `
}

const renderPhotosPages = (valuation) => {
  const partsFacial = [
    { key: 'frente', label: 'Frente' },
    { key: 'perfilDerecho', label: 'Perfil derecho' },
    { key: 'perfilIzquierdo', label: 'Perfil izquierdo' },
  ]
  const partsCorporal = [
    { key: 'frente', label: 'Frente' },
    { key: 'espalda', label: 'Espalda' },
    { key: 'laterales', label: 'Laterales' },
  ]
  const moments = [
    { key: 'antes', label: 'Antes' },
    { key: 'despues', label: 'Después' },
  ]

  const photos = []

  const pushIf = (photoObj, label) => {
    if (photoObj && photoObj.url) photos.push({ url: photoObj.url, label })
  }

  // Order: facial parts (antes/despues), corporal parts (antes/despues)
  partsFacial.forEach((part) => {
    moments.forEach((m) => {
      const photoObj = valuation?.fotografiasClinicas?.facial?.[part.key]?.[m.key]
      pushIf(photoObj, `${part.label} — ${m.label}`)
    })
  })
  partsCorporal.forEach((part) => {
    moments.forEach((m) => {
      const photoObj = valuation?.fotografiasClinicas?.corporal?.[part.key]?.[m.key]
      pushIf(photoObj, `${part.label} — ${m.label}`)
    })
  })

  const pages = []
  for (let i = 0; i < photos.length; i += 4) {
    const pagePhotos = photos.slice(i, i + 4)
    const imgsParts = pagePhotos.map((p) => `
      <div style="width:48%; margin-bottom:8px;">
        <div style="font-size:12px; font-weight:600; color:#333; margin-bottom:6px;">${p.label}</div>
        <img src="${p.url}" style="width:100%; height:auto; display:block; border:1px solid #ddd;"/>
      </div>
    `)

    // If less than 4, fill empty slots with blank placeholders
    const blanks = 4 - pagePhotos.length
    for (let j = 0; j < blanks; j++) {
      imgsParts.push(`<div style="width:48%; margin-bottom:8px; background:#fafafa; height:220px; border:1px dashed #ddd;"></div>`)
    }

    const imgsHtml = imgsParts.join('')

    pages.push(`
      <div style="page-break-before:always; page-break-after:always; page-break-inside:avoid; width:100%; max-width:820px; margin:0 auto; padding-top:18px; box-sizing:border-box;">
        <h2 style="font-size:16px; color:#333; margin:0 0 8px 0; padding-top:12px;">FOTOGRAFÍAS CLÍNICAS</h2>
        <div style="display:flex; flex-wrap:wrap; gap:4%; justify-content:space-between; margin-top:8px;">
          ${imgsHtml}
        </div>
      </div>
    `)
  }

  // If no photos at all, render an empty page with message
  if (pages.length === 0) {
    pages.push(`
      <div style="page-break-before:always; page-break-after:always; page-break-inside:avoid; width:100%; max-width:820px; margin:0 auto;">
        <h2 style="font-size:16px; color:#333;">FOTOGRAFÍAS CLÍNICAS</h2>
        <p style="color:#666;">No hay fotografías registradas.</p>
      </div>
    `)
  }

  return pages.join('')
}

const renderProtocolSection = (valuation) => {
  if (!Array.isArray(valuation.protocolProducts) || valuation.protocolProducts.length === 0) {
    return `
      <div style="page-break-after:always; page-break-inside:avoid; width:100%; max-width:820px; margin:0 auto; padding-top:12px; box-sizing:border-box;">
        <h2 style="margin:0; padding-top:0; font-size:16px; color:#333;">PROTOCOLO DE PRODUCTOS RECOMENDADOS</h2>
        <p style="color:#666; margin-top:8px;">No hay protocolo de productos registrado.</p>
      </div>
    `
  }

  const items = valuation.protocolProducts
    .map((p) => `<li style="margin:8px 0;"><strong>${p.name || 'Producto'}</strong> — ${p.use || 'No especificado'}</li>`)
    .join('')

  return `
    <div style="page-break-after:always; page-break-inside:avoid; width:100%; max-width:820px; margin:0 auto; padding-top:12px; box-sizing:border-box;">
      <h2 style="margin:0; padding-top:0; font-size:16px; color:#333;">PROTOCOLO DE PRODUCTOS RECOMENDADOS</h2>
      <ul style="color:#333; margin-top:8px;">${items}</ul>
    </div>
  `
}

export const exportValuationToPDF = async (valuation) => {
  if (!valuation?.id) {
    alert('No se encontró la valoración para exportar')
    return false
  }

  try {
    const isRecurrent = Boolean(valuation.recurrentStep4) || 
      (!valuation.step5 && !valuation.step6 && !valuation.step7 && !valuation.step8 && 
       !valuation.step9 && !valuation.step10 && !valuation.step11 && 
       Number(valuation.currentStep ?? 1) <= 4)

    const mapsHtml = renderMapsSinglePage(valuation)

    const photosHtml = renderPhotosPages(valuation)
    const protocolHtml = renderProtocolSection(valuation)

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin:0 auto;">
        <!-- Portada -->
        <div style="page-break-after:always; width:100%; max-width:760px; margin:0 auto; padding:120px 20px 80px; text-align:center; box-sizing:border-box;">
          <h1 style="margin:0; font-size:40px; color:#333; letter-spacing:4px;">FERMONT</h1>
          <h2 style="margin:24px 0 8px 0; font-size:22px; color:#333;">Informe de valoración</h2>
          <p style="margin:12px 0; font-size:16px; color:#555;">Paciente: ${valuation.clienteNombre || 'Sin nombre'}</p>
          <p style="margin:12px 0; font-size:16px; color:#555;">Fecha: ${formatDate(new Date().toISOString())}</p>
          <p style="margin:12px 0; font-size:16px; color:#555;">Estado: ${valuation.status === 'completed' ? 'Finalizado' : valuation.status}</p>
        </div>

        <!-- Datos del Cliente -->
        <div style="margin-bottom: 25px;">
          <h2 style="font-size: 16px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px;">1. DATOS DEL CLIENTE</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr><td style="padding: 8px; font-weight: bold; width: 40%;">Nombre completo:</td><td style="padding: 8px;">${valuation.clienteNombre || 'Sin nombre'}</td></tr>
            <tr style="background: #f9f9f9;"><td style="padding: 8px; font-weight: bold;">ID cliente:</td><td style="padding: 8px;">${valuation.clienteId || 'Sin cliente asociado'}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Edad:</td><td style="padding: 8px;">${valuation.step1?.edad || 'No especificado'}</td></tr>
            <tr style="background: #f9f9f9;"><td style="padding: 8px; font-weight: bold;">Fecha de nacimiento:</td><td style="padding: 8px;">${valuation.step1?.fechaNacimiento || 'No especificado'}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Teléfono:</td><td style="padding: 8px;">${valuation.step1?.telefono || 'No especificado'}</td></tr>
            <tr style="background: #f9f9f9;"><td style="padding: 8px; font-weight: bold;">Email:</td><td style="padding: 8px;">${valuation.step1?.correoElectronico || 'No especificado'}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Ocupación:</td><td style="padding: 8px;">${valuation.step1?.ocupacion || 'No especificado'}</td></tr>
            <tr style="background: #f9f9f9;"><td style="padding: 8px; font-weight: bold;">Contacto emergencia:</td><td style="padding: 8px;">${valuation.step1?.contactoEmergencia || 'No especificado'}</td></tr>
          </table>
        </div>

        <!-- Motivo de Consulta -->
        <div style="margin-bottom: 25px;">
          <h2 style="font-size: 16px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px;">2. MOTIVO DE CONSULTA</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr><td style="padding: 8px; font-weight: bold; width: 40%;">Motivos faciales:</td><td style="padding: 8px;">${Array.isArray(valuation.step2?.motivosFaciales) ? valuation.step2.motivosFaciales.join(', ') : 'No registrado'}</td></tr>
            <tr style="background: #f9f9f9;"><td style="padding: 8px; font-weight: bold;">Motivos corporales:</td><td style="padding: 8px;">${Array.isArray(valuation.step2?.motivosCorporales) ? valuation.step2.motivosCorporales.join(', ') : 'No registrado'}</td></tr>
          </table>
        </div>

        <!-- Expectativas -->
        <div style="margin-bottom: 25px;">
          <h2 style="font-size: 16px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px;">3. EXPECTATIVAS Y PRIORIDADES</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr><td style="padding: 8px; font-weight: bold; width: 40%;">Mejora principal:</td><td style="padding: 8px;">${valuation.step3?.mejoraPrincipal || 'No registrado'}</td></tr>
            <tr style="background: #f9f9f9;"><td style="padding: 8px; font-weight: bold;">Resultado esperado:</td><td style="padding: 8px;">${valuation.step3?.resultadoEsperado || 'No registrado'}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Tiempo esperado:</td><td style="padding: 8px;">${valuation.step3?.tiempoEsperado || 'No registrado'}</td></tr>
            <tr style="background: #f9f9f9;"><td style="padding: 8px; font-weight: bold;">Zona incómoda:</td><td style="padding: 8px;">${valuation.step3?.zonaIncomoda || 'No registrado'}</td></tr>
          </table>
        </div>

        ${isRecurrent && valuation.recurrentStep4 ? `
          <!-- Cliente Recurrente -->
          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 16px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px;">4. EVALUACIÓN DE CLIENTE RECURRENTE</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <tr><td style="padding: 8px; font-weight: bold; width: 40%;">Cambios en salud:</td><td style="padding: 8px;">${valuation.recurrentStep4?.cambiosSalud || 'No especificado'}</td></tr>
              <tr style="background: #f9f9f9;"><td style="padding: 8px; font-weight: bold;">Medicamentos nuevos:</td><td style="padding: 8px;">${valuation.recurrentStep4?.medicamentoNuevo || 'No'}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Reacción última sesión:</td><td style="padding: 8px;">${valuation.recurrentStep4?.reaccionUltimaSesion || 'No especificado'}</td></tr>
              <tr style="background: #f9f9f9;"><td style="padding: 8px; font-weight: bold;">Siguió rutina:</td><td style="padding: 8px;">${valuation.recurrentStep4?.siguioRutina || 'No'}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Mejora o cambio:</td><td style="padding: 8px;">${valuation.recurrentStep4?.mejoraOCambioPiel || 'No especificado'}</td></tr>
            </table>
          </div>
        ` : ''}

        ${!isRecurrent ? `
          <!-- Paso 4: Salud y Antecedentes -->
          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 16px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px;">4. SALUD Y ANTECEDENTES MÉDICOS</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <tr><td style="padding: 8px; font-weight: bold; width: 40%;">Enfermedades:</td><td style="padding: 8px;">${Array.isArray(valuation.step4?.enfermedades) ? valuation.step4.enfermedades.join(', ') : 'Ninguna'}</td></tr>
              <tr style="background: #f9f9f9;"><td style="padding: 8px; font-weight: bold;">Medicamentos:</td><td style="padding: 8px;">${Array.isArray(valuation.step4?.medicamentosActuales) ? valuation.step4.medicamentosActuales.join(', ') : 'Ninguno'}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Alergias:</td><td style="padding: 8px;">${Array.isArray(valuation.step4?.alergias) ? valuation.step4.alergias.join(', ') : 'Ninguna'}</td></tr>
              <tr style="background: #f9f9f9;"><td style="padding: 8px; font-weight: bold;">Embarazo actual:</td><td style="padding: 8px;">${valuation.step4?.embarazoActual || 'No'}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Lactancia actual:</td><td style="padding: 8px;">${valuation.step4?.lactanciaActual || 'No'}</td></tr>
            </table>
          </div>

          <!-- Paso 5: Estilo de Vida -->
          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 16px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px;">5. ESTILO DE VIDA</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <tr><td style="padding: 8px; font-weight: bold; width: 40%;">Agua diaria:</td><td style="padding: 8px;">${valuation.step5?.aguaDiaria || 'No especificado'}</td></tr>
              <tr style="background: #f9f9f9;"><td style="padding: 8px; font-weight: bold;">Calidad de alimentación:</td><td style="padding: 8px;">${valuation.step5?.calidadAlimentacion || 'No especificado'}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Fuma:</td><td style="padding: 8px;">${valuation.step5?.fuma || 'No'}</td></tr>
              <tr style="background: #f9f9f9;"><td style="padding: 8px; font-weight: bold;">Consume alcohol:</td><td style="padding: 8px;">${valuation.step5?.consumeAlcohol || 'No'}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Realiza ejercicio:</td><td style="padding: 8px;">${valuation.step5?.realizaEjercicio || 'No'}</td></tr>
              <tr style="background: #f9f9f9;"><td style="padding: 8px; font-weight: bold;">Horas de sueño:</td><td style="padding: 8px;">${valuation.step5?.horasSueno || 'No especificado'}</td></tr>
            </table>
          </div>

          <!-- Paso 6: Protección Solar -->
          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 16px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px;">6. PROTECCIÓN SOLAR</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <tr><td style="padding: 8px; font-weight: bold; width: 40%;">Usa protector diario:</td><td style="padding: 8px;">${valuation.step6?.usaProtectorDiario || 'No'}</td></tr>
              <tr style="background: #f9f9f9;"><td style="padding: 8px; font-weight: bold;">SPF utilizado:</td><td style="padding: 8px;">${valuation.step6?.spfUtilizado || 'No especificado'}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Tiempo prolongado al sol:</td><td style="padding: 8px;">${valuation.step6?.tiempoProlongadoSol || 'No'}</td></tr>
            </table>
          </div>

          <!-- Paso 7: Procedimientos Previos -->
          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 16px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px;">7. PROCEDIMIENTOS PREVIOS</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <tr><td style="padding: 8px; font-weight: bold; width: 40%;">Procedimientos:</td><td style="padding: 8px;">${Array.isArray(valuation.step7?.procedimientosPrevios) ? valuation.step7.procedimientosPrevios.join(', ') : 'Ninguno'}</td></tr>
              <tr style="background: #f9f9f9;"><td style="padding: 8px; font-weight: bold;">Faciales previos:</td><td style="padding: 8px;">${valuation.step7?.facialesPrevios || 'No'}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Tolera bien el dolor:</td><td style="padding: 8px;">${valuation.step7?.toleraBienDolor || 'No especificado'}</td></tr>
            </table>
          </div>

          <!-- Paso 8: Rutina de Cuidado -->
          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 16px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px;">8. RUTINA DE CUIDADO ACTUAL</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <tr><td style="padding: 8px; font-weight: bold; width: 40%;">Productos mañana:</td><td style="padding: 8px;">${Array.isArray(valuation.step8?.mananaProductos) ? valuation.step8.mananaProductos.join(', ') : 'Ninguno'}</td></tr>
              <tr style="background: #f9f9f9;"><td style="padding: 8px; font-weight: bold;">Productos noche:</td><td style="padding: 8px;">${Array.isArray(valuation.step8?.nocheProductos) ? valuation.step8.nocheProductos.join(', ') : 'Ninguno'}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Usa retinol:</td><td style="padding: 8px;">${valuation.step8?.usaRetinol || 'No'}</td></tr>
              <tr style="background: #f9f9f9;"><td style="padding: 8px; font-weight: bold;">Usa ácidos:</td><td style="padding: 8px;">${valuation.step8?.usaAcidos || 'No'}</td></tr>
            </table>
          </div>

          <!-- Paso 9: Condición Actual de la Piel -->
          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 16px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px;">9. CONDICIÓN ACTUAL DE LA PIEL</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <tr><td style="padding: 8px; font-weight: bold; width: 40%;">Tipo de piel:</td><td style="padding: 8px;">${Array.isArray(valuation.step9?.tipoPiel) ? valuation.step9.tipoPiel.join(', ') : 'No especificado'}</td></tr>
              <tr style="background: #f9f9f9;"><td style="padding: 8px; font-weight: bold;">Estado actual:</td><td style="padding: 8px;">${Array.isArray(valuation.step9?.estadoActual) ? valuation.step9.estadoActual.join(', ') : 'No especificado'}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Condiciones presentes:</td><td style="padding: 8px;">${Array.isArray(valuation.step9?.condicionesPresentes) ? valuation.step9.condicionesPresentes.join(', ') : 'Ninguna'}</td></tr>
            </table>
          </div>

          <!-- Paso 10: Análisis de Manchas -->
          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 16px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px;">10. ANÁLISIS DE MANCHAS Y FOTOENVEJECIMIENTO</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <tr><td style="padding: 8px; font-weight: bold; width: 40%;">Acne empeora período:</td><td style="padding: 8px;">${valuation.step10?.acneEmpeoraPeriodo || 'No'}</td></tr>
              <tr style="background: #f9f9f9;"><td style="padding: 8px; font-weight: bold;">Manipula granitos:</td><td style="padding: 8px;">${valuation.step10?.manipulaGranitos || 'No'}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Escala Fitzpatrick:</td><td style="padding: 8px;">${valuation.step10?.escalaFitzpatrick || 'No especificado'}</td></tr>
              <tr style="background: #f9f9f9;"><td style="padding: 8px; font-weight: bold;">Escala Glogau:</td><td style="padding: 8px;">${valuation.step10?.escalaGlogau || 'No especificado'}</td></tr>
            </table>
          </div>

          <!-- Paso 11: Circulación y Objetivos Corporales -->
          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 16px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px;">11. CIRCULACIÓN Y OBJETIVOS CORPORALES</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <tr><td style="padding: 8px; font-weight: bold; width: 40%;">Piernas cansadas:</td><td style="padding: 8px;">${valuation.step11?.circulacionPiernasCansadas || 'No'}</td></tr>
              <tr style="background: #f9f9f9;"><td style="padding: 8px; font-weight: bold;">Varices:</td><td style="padding: 8px;">${valuation.step11?.circulacionVarices || 'No'}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Retención de líquidos:</td><td style="padding: 8px;">${valuation.step11?.circulacionRetencionLiquidos || 'No'}</td></tr>
              <tr style="background: #f9f9f9;"><td style="padding: 8px; font-weight: bold;">Actividad/Ejercicio:</td><td style="padding: 8px;">${valuation.step11?.actividadEjercicio || 'No'}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Objetivo zona a mejorar:</td><td style="padding: 8px;">${valuation.step11?.objetivoZonaMejorar || 'No especificado'}</td></tr>
            </table>
          </div>
        ` : ''}

        ${protocolHtml}

        <!-- Mapas interactivos -->
        ${mapsHtml}

        <!-- Fotografías (páginas finales) -->
        ${photosHtml}

        <!-- Pie de página -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #333; text-align: center; font-size: 11px; color: #666;">
          <p>Este informe fue generado automáticamente el ${formatDate(new Date().toISOString())} a las ${new Date().toLocaleTimeString('es-MX')}</p>
        </div>
      </div>
    `

    const clientName = (valuation.clienteNombre || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_')
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `Informe_${clientName}_${timestamp}.pdf`

    const options = {
      margin: 10,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    }

    // Generate the PDF and try to download it in a way that works better on Safari/iOS.
    const worker = html2pdf().set(options).from(htmlContent)

    try {
      const pdf = await worker.toPdf().get('pdf')
      const blob = pdf.output('blob')
      const finalFilename = filename

      // Try Web Share API (Level 2) to allow saving to Files app on mobile Safari if available
      try {
        const fileForShare = (typeof File !== 'undefined') ? new File([blob], finalFilename, { type: 'application/pdf' }) : null

        if (fileForShare && navigator?.canShare && navigator.canShare({ files: [fileForShare] })) {
          await navigator.share({ files: [fileForShare], title: finalFilename })
          return true
        }
      } catch (shareErr) {
        // ignore and fallback to download link
        console.warn('Web Share failed, falling back to download:', shareErr)
      }

      // Fallback: create object URL and trigger anchor download
      try {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = finalFilename
        // Some browsers (Safari) may ignore download attribute; opening in a new tab is the best we can do then
        document.body.appendChild(a)
        a.click()
        a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 10000)
        return true
      } catch (dlErr) {
        console.error('Download fallback failed:', dlErr)
        // As a last resort, open PDF in a new tab
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank')
        setTimeout(() => URL.revokeObjectURL(url), 10000)
        return true
      }
    } catch (error) {
      console.error('Error generating or downloading PDF:', error)
      // final fallback to original behavior
      await html2pdf().set(options).from(htmlContent).save()
      return true
    }
  } catch (error) {
    console.error('Error exporting valuation to PDF:', error)
    alert('No se pudo exportar el informe. Intenta de nuevo.')
    return false
  }
}
