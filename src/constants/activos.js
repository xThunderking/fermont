export const CATEGORIAS_ACTIVOS = [
  'Hidratantes y humectantes', 'Exfoliantes', 'Despigmentantes',
  'Antioxidantes', 'Antiinflamatorios y calmantes', 'Seborreguladores',
  'Reparadores de la barrera cutánea', 'Oclusivos', 'Antiedad y reafirmantes',
  'Emolientes', 'Regeneradores y cicatrizantes', 'Queratolíticos',
  'Queratoplásticos', 'Antimicrobianos', 'Descongestivos',
  'Fotoprotectores', 'Tensores', 'Iluminadores',
]
export const TIPOS_PIEL = ['Eudérmica', 'Alípica', 'Grasa', 'Grasa deshidratada', 'Sensible']

// Las fichas anteriores tienen una sola categoría guardada como texto.
export const normalizeCategorias = (value) => [...new Set((Array.isArray(value)
  ? value : typeof value === 'string' ? [value] : [])
  .filter((item) => typeof item === 'string')
  .map((item) => item.trim()).filter(Boolean))]
export const MAX_CONTRAINDICACIONES = 20
export const MAX_FOTO_BYTES = 10 * 1024 * 1024
export const FOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const normalizeTextList = (value) => (Array.isArray(value)
  ? value
  : typeof value === 'string' ? value.split(/\r?\n/) : [])
  .filter((item) => typeof item === 'string')
  .map((item) => item.trim())
  .filter(Boolean)

// Acepta tanto las listas guardadas como los campos de texto por renglón.
export const normalizeContraindicaciones = normalizeTextList
export const normalizePropiedades = normalizeTextList

export const validateActivoPhoto = (file) => {
  if (!file) return { ok: true }
  if (!FOTO_TYPES.includes(file.type)) {
    return { ok: false, message: 'Selecciona una foto en formato JPG, PNG o WebP.' }
  }
  if (!file.size || file.size > MAX_FOTO_BYTES) {
    return { ok: false, message: 'La foto debe pesar como máximo 10 MB y no estar vacía.' }
  }
  return { ok: true }
}

export const normalizeActivoSearch = (value) => String(value ?? '')
  .trim()
  .toLocaleLowerCase('es-MX')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')

export const validateActivo = (data) => {
  const activo = {
    nombre: String(data?.nombre ?? '').trim(),
    categoria: normalizeCategorias(data?.categoria),
    propiedades: normalizePropiedades(data?.propiedades).join('\n'),
    tiposPiel: TIPOS_PIEL.filter((tipo) => Array.isArray(data?.tiposPiel) && data.tiposPiel.includes(tipo)),
    contraindicaciones: normalizeContraindicaciones(data?.contraindicaciones),
  }

  if (!activo.nombre || !activo.categoria.length || !activo.propiedades) {
    return { ok: false, message: 'Completa el nombre, selecciona al menos una categoría y describe las propiedades.' }
  }

  if (activo.categoria.some((categoria) => !CATEGORIAS_ACTIVOS.includes(categoria))) {
    return { ok: false, message: 'Selecciona las categorías del catálogo actualizado.' }
  }

  if (activo.nombre.length > 150
    || activo.propiedades.length > 3000) {
    return { ok: false, message: 'Revisa la longitud de los campos del activo.' }
  }

  if (activo.contraindicaciones.length > MAX_CONTRAINDICACIONES
    || activo.contraindicaciones.some((item) => item.length > 3000)
    || activo.contraindicaciones.join('').length > 10000) {
    return { ok: false, message: 'Puedes agregar hasta 20 contraindicaciones, de 3000 caracteres cada una y 10000 en total.' }
  }

  if (activo.tiposPiel.length === 0) {
    return { ok: false, message: 'Selecciona al menos un tipo de piel.' }
  }

  return { ok: true, activo: { ...activo, nombreBusqueda: normalizeActivoSearch(activo.nombre) } }
}
