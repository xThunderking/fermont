import { jsPDF } from 'jspdf'

const TEMPLATE_WIDTH = 1224
const TEMPLATE_HEIGHT = 1584

const loadImage = (source) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('No se pudo cargar la plantilla del consentimiento.'))
    image.src = source
  })

const fitFontSize = (context, text, maxWidth, initialSize) => {
  let fontSize = initialSize

  while (fontSize > 12) {
    context.font = `${fontSize}px Arial, sans-serif`
    if (context.measureText(text).width <= maxWidth) return fontSize
    fontSize -= 1
  }

  return fontSize
}

const parseValuationDate = (dateValue) => {
  const match = String(dateValue || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})/)

  if (!match) return null

  return {
    day: match[3],
    month: match[2],
    year: match[1],
  }
}

const safeFilePart = (value) =>
  String(value || 'cliente')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'cliente'

const shareOrDownloadPdf = async (pdf, fileName) => {
  const pdfBlob = pdf.output('blob')
  const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' })

  if (navigator.share && navigator.canShare?.({ files: [pdfFile] })) {
    try {
      await navigator.share({
        files: [pdfFile],
        title: 'Consentimiento informado',
        text: 'Consentimiento informado de Fermont Skin Studio',
      })
      return
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === 'AbortError') return
      // Si el navegador no logra abrir el menú nativo, se usa la descarga normal.
    }
  }

  pdf.save(fileName)
}

export const downloadInformedConsent = async ({
  clientName,
  valuationDate,
  clientSignature,
  cosmetologistSignature,
}) => {
  const normalizedName = String(clientName || '').trim()
  const parsedDate = parseValuationDate(valuationDate)

  if (!normalizedName) {
    throw new Error('Esta valoración no tiene un nombre de cliente para el consentimiento.')
  }

  if (!parsedDate) {
    throw new Error('Esta valoración no tiene una fecha válida para el consentimiento.')
  }

  const templateUrl = `${import.meta.env.BASE_URL}consentimiento.png?v=2`
  const template = await loadImage(templateUrl)
  const canvas = document.createElement('canvas')
  canvas.width = TEMPLATE_WIDTH
  canvas.height = TEMPLATE_HEIGHT

  const context = canvas.getContext('2d')
  if (!context) throw new Error('No se pudo preparar el consentimiento.')

  context.drawImage(template, 0, 0, TEMPLATE_WIDTH, TEMPLATE_HEIGHT)
  context.fillStyle = '#2d1d17'
  context.textAlign = 'center'
  context.textBaseline = 'alphabetic'

  const nameFontSize = fitFontSize(context, normalizedName, 750, 24)
  context.font = `${nameFontSize}px Arial, sans-serif`
  context.fillText(normalizedName, 735, 292)

  context.font = '22px Arial, sans-serif'
  context.fillText(parsedDate.day, 214, 350)
  context.fillText(parsedDate.month, 324, 350)
  context.fillText(parsedDate.year, 465, 350)

  const drawSignature = async (signature, x, y, width, height) => {
    if (!signature) return
    const signatureImage = await loadImage(signature)
    const scale = Math.min(width / signatureImage.width, height / signatureImage.height)
    const renderedWidth = signatureImage.width * scale
    const renderedHeight = signatureImage.height * scale
    context.drawImage(
      signatureImage,
      x + (width - renderedWidth) / 2,
      y + (height - renderedHeight) / 2,
      renderedWidth,
      renderedHeight,
    )
  }

  await drawSignature(clientSignature, 132, 1295, 406, 105)
  await drawSignature(cosmetologistSignature, 686, 1295, 406, 105)

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [TEMPLATE_WIDTH, TEMPLATE_HEIGHT],
    hotfixes: ['px_scaling'],
  })
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, TEMPLATE_WIDTH, TEMPLATE_HEIGHT)
  await shareOrDownloadPdf(pdf, `consentimiento-informado-${safeFilePart(normalizedName)}.pdf`)
}
