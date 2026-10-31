import { serviceCategories } from '../publicSite/siteConfig.js'

export const SERVICE_ICONS = [
  { value: 'sparkles', label: 'Destellos' },
  { value: 'body', label: 'Corporal' },
  { value: 'leaf', label: 'Natural' },
  { value: 'heart', label: 'Bienestar' },
  { value: 'stars', label: 'Luminosidad' },
  { value: 'scan', label: 'Facial' },
  { value: 'hair-straightener', label: 'Alaciados' },
  { value: 'droplet', label: 'Hidratación' },
  { value: 'flower', label: 'Rituales' },
  { value: 'sun', label: 'Vitalidad' },
  { value: 'moon', label: 'Relajación' },
  { value: 'waves', label: 'Masajes' },
  { value: 'eye', label: 'Contorno de ojos' },
  { value: 'bottle', label: 'Cosméticos' },
  { value: 'shield', label: 'Protección' },
  { value: 'gem', label: 'Especiales' },
  { value: 'wand', label: 'Aparatología' },
  { value: 'bubbles', label: 'Limpieza' },
  { value: 'exfoliation', label: 'Exfoliación' },
  { value: 'mask', label: 'Mascarillas' },
  { value: 'lifting', label: 'Firmeza' },
  { value: 'renewal', label: 'Renovación' },
  { value: 'balance', label: 'Equilibrio' },
  { value: 'feather', label: 'Calmantes' },
  { value: 'layers', label: 'Textura' },
  { value: 'wrap', label: 'Envolturas' },
  { value: 'flow', label: 'Drenaje' },
  { value: 'contour', label: 'Contorno corporal' },
  { value: 'seed', label: 'Nutrición' },
]

const retiredIcons = { comb: 'hair-straightener', scissors: 'sparkles', hand: 'body', foot: 'body' }

// Keep previously saved catalogs usable after retiring salon-specific choices.
export const normalizeServiceCategoryIcons = (categories) => Array.isArray(categories)
  ? categories.map((category) => category && typeof category === 'object' ? {
    ...category,
    icon: retiredIcons[category.icon] || category.icon,
    items: Array.isArray(category.items) ? category.items.map((item) => item && typeof item === 'object'
      ? { ...item, icon: retiredIcons[item.icon] || item.icon } : item) : category.items,
  } : category) : categories

export const SERVICE_PALETTES = [
  { name: 'Café', accent: '#9a6741', soft: '#f1dfd0' },
  { name: 'Salvia', accent: '#6b7f5b', soft: '#e3ead9' },
  { name: 'Rosa', accent: '#a66a78', soft: '#f1dde1' },
  { name: 'Arena', accent: '#88745d', soft: '#eee4d5' },
  { name: 'Lavanda', accent: '#80708d', soft: '#eae1ef' },
  { name: 'Durazno', accent: '#875c43', soft: '#fae1d1' },
  { name: 'Coral', accent: '#945458', soft: '#f5dede' },
  { name: 'Cielo', accent: '#536f8c', soft: '#dfeaf5' },
  { name: 'Menta', accent: '#4e7668', soft: '#dfefe7' },
  { name: 'Vainilla', accent: '#806c34', soft: '#f6edcf' },
]

const iconNames = SERVICE_ICONS.map(({ value }) => value)
const validId = (value) => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value)
const validText = (value, max, required = false) => typeof value === 'string'
  && value.length <= max && (!required || value.trim().length > 0)
const validColor = (value) => typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)

export const createDefaultServiceCategories = () => serviceCategories.map((category) => ({
  ...category,
  visible: true,
  items: category.items.map((item, index) => ({
    ...item,
    id: `${category.id}-${index + 1}`,
    visible: true,
  })),
}))

export const validateServiceCategories = (categories) => {
  if (!Array.isArray(categories) || categories.length > 40) return 'Puedes tener hasta 40 categorías.'
  const ids = new Set()
  let total = 0
  for (const category of categories) {
    if (!category || !validId(category.id) || ids.has(category.id)) return 'Hay una categoría con un identificador inválido o repetido.'
    ids.add(category.id)
    if (!validText(category.kicker, 100, true)) return 'Cada categoría necesita un nombre de hasta 100 caracteres.'
    if (!validText(category.title, 180, true)) return `Revisa el título de ${category.kicker}.`
    if (!validText(category.description, 1500)) return `La descripción de ${category.kicker} es demasiado larga.`
    if (!iconNames.includes(category.icon) || !validColor(category.accent) || !validColor(category.soft)) return `Revisa la apariencia de ${category.kicker}.`
    if (typeof category.visible !== 'boolean' || !Array.isArray(category.items)) return 'La configuración de la categoría no es válida.'
    total += category.items.length
    if (total > 200) return 'Puedes tener hasta 200 servicios en el catálogo.'
    const itemIds = new Set()
    for (const item of category.items) {
      if (!item || !validId(item.id) || itemIds.has(item.id)) return `Hay un servicio repetido en ${category.kicker}.`
      itemIds.add(item.id)
      if (!validText(item.title, 150, true)) return 'Cada servicio necesita un nombre de hasta 150 caracteres.'
      if (!validText(item.tag, 80) || !validText(item.description, 2000, true)) return `Revisa la etiqueta y descripción de ${item.title}.`
      if (!iconNames.includes(item.icon) || typeof item.visible !== 'boolean') return `Revisa la configuración de ${item.title}.`
    }
  }
  // Leave room for metadata within Firestore's document size limit.
  if (new TextEncoder().encode(JSON.stringify(categories)).length > 800000) return 'El catálogo es demasiado grande. Reduce la longitud de las descripciones.'
  return ''
}

export const getVisibleServiceCategories = (categories) => categories
  .filter((category) => category.visible)
  .map((category) => ({ ...category, items: category.items.filter((item) => item.visible) }))
  .filter((category) => category.items.length > 0)

export const moveCatalogEntry = (entries, id, direction) => {
  const index = entries.findIndex((entry) => entry.id === id)
  const next = index + direction
  if (index < 0 || next < 0 || next >= entries.length) return entries
  const reordered = [...entries]
  ;[reordered[index], reordered[next]] = [reordered[next], reordered[index]]
  return reordered
}
