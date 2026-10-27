export const TIPOS_PIEL = ['Normal', 'Seca', 'Grasa', 'Mixta', 'Sensible', 'Madura']
export const MAX_CONTRAINDICACIONES = 20
export const MAX_FOTO_BYTES = 10 * 1024 * 1024
export const FOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Conserva las fichas anteriores, que guardaban las contraindicaciones como texto.
export const normalizeContraindicaciones = (value) => (Array.isArray(value)
  ? value
  : typeof value === 'string' ? value.split(/\r?\n/) : [])
  .filter((item) => typeof item === 'string')
  .map((item) => item.trim())
  .filter(Boolean)

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
    categoria: String(data?.categoria ?? '').trim(),
    propiedades: String(data?.propiedades ?? '').trim(),
    tiposPiel: TIPOS_PIEL.filter((tipo) => Array.isArray(data?.tiposPiel) && data.tiposPiel.includes(tipo)),
    contraindicaciones: normalizeContraindicaciones(data?.contraindicaciones),
  }

  if (!activo.nombre || !activo.categoria || !activo.propiedades) {
    return { ok: false, message: 'Completa el nombre, la categoría y las propiedades del activo.' }
  }

  if (activo.nombre.length > 150 || activo.categoria.length > 100
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
