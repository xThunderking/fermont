import { doc, getDoc, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from '../services/firebase.js'
import { createDefaultServiceCategories, normalizeServiceCategoryIcons, validateServiceCategories } from '../constants/websiteServices.js'

const catalogRef = () => doc(db, 'publicWebsite', 'serviceCatalog')

const readCatalog = (snapshot) => {
  if (!snapshot.exists()) return { categories: createDefaultServiceCategories(), revision: 0 }
  const data = snapshot.data()
  const categories = normalizeServiceCategoryIcons(data.categories)
  if (data.schemaVersion !== 1 || !Number.isInteger(data.revision) || validateServiceCategories(categories)) {
    throw new Error('El catálogo guardado no es válido. Contacta al administrador.')
  }
  return { categories, revision: data.revision }
}

const errorMessage = (error) => error?.code === 'permission-denied'
  ? 'No se pudo acceder al catálogo. Verifica tu sesión y las reglas de acceso de Página web.'
  : error?.message === 'catalog-conflict'
    ? 'Otra sesión modificó el catálogo. Recarga los datos antes de volver a guardar.'
    : 'No se pudo guardar el catálogo. Revisa tu conexión e intenta de nuevo.'

export const loadWebsiteServices = async () => {
  try {
    return { ok: true, ...readCatalog(await getDoc(catalogRef())) }
  } catch (error) {
    return { ok: false, message: errorMessage(error) }
  }
}

export const observeWebsiteServices = (onChange, onError) => onSnapshot(catalogRef(), (snapshot) => {
  try {
    onChange(readCatalog(snapshot))
  } catch (error) {
    onError(error)
  }
}, onError)

export const saveWebsiteServices = async ({ categories, revision, userId }) => {
  if (!userId) return { ok: false, message: 'Inicia sesión para modificar los servicios.' }
  const validation = validateServiceCategories(categories)
  if (validation) return { ok: false, message: validation }
  try {
    await runTransaction(db, async (transaction) => {
      const reference = catalogRef()
      const snapshot = await transaction.get(reference)
      const currentRevision = snapshot.exists() ? snapshot.data().revision : 0
      if (currentRevision !== revision) throw new Error('catalog-conflict')
      transaction.set(reference, {
        schemaVersion: 1,
        categories,
        revision: revision + 1,
        updatedBy: userId,
        updatedAt: serverTimestamp(),
      })
    })
    return { ok: true, revision: revision + 1 }
  } catch (error) {
    return { ok: false, message: errorMessage(error), conflict: error?.message === 'catalog-conflict' }
  }
}
