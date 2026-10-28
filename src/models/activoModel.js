import {
  collection,
  doc,
  endAt,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  startAt,
  updateDoc,
} from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from '../services/firebase.js'
import { normalizeActivoSearch, normalizeCategorias, normalizeContraindicaciones, validateActivo, validateActivoPhoto } from '../constants/activos.js'

const ACTIVOS_COLLECTION = 'activos'
const PAGE_SIZE = 25

const errorMessage = (error, action) => ['permission-denied', 'storage/unauthorized'].includes(error?.code)
  ? 'No se pudo acceder a Activos. Vuelve a iniciar sesión o contacta al administrador.'
  : `No se pudieron ${action} los activos. Intenta de nuevo.`

const deleteUnusedPhoto = async (path) => {
  if (!path?.startsWith('activos/')) return
  try {
    await deleteObject(ref(storage, path))
  } catch {
    // Una limpieza fallida no revierte una ficha que ya se guardó correctamente.
  }
}

export const listActivos = async ({ search = '', cursor = null } = {}) => {
  const searchText = normalizeActivoSearch(search)

  try {
    const snapshots = await getDocs(query(
      collection(db, ACTIVOS_COLLECTION),
      orderBy('nombreBusqueda'),
      ...(cursor ? [startAfter(cursor)] : searchText ? [startAt(searchText)] : []),
      ...(searchText ? [endAt(`${searchText}\uf8ff`)] : []),
      limit(PAGE_SIZE),
    ))

    return {
      ok: true,
      activos: snapshots.docs.map((snapshot) => {
        const data = snapshot.data()
        return {
          ...data,
          id: snapshot.id,
          categoria: normalizeCategorias(data.categoria),
          tiposPiel: Array.isArray(data.tiposPiel) ? data.tiposPiel : [],
          contraindicaciones: normalizeContraindicaciones(data.contraindicaciones),
          fotoUrl: String(data.fotoUrl ?? ''),
          fotoPath: String(data.fotoPath ?? ''),
        }
      }),
      cursor: snapshots.docs.at(-1) || null,
      hasMore: snapshots.size === PAGE_SIZE,
    }
  } catch (error) {
    return { ok: false, message: errorMessage(error, 'cargar') }
  }
}

export const saveActivo = async ({ userId, activoId, data, photoFile = null, removePhoto = false }) => {
  if (!userId) {
    return { ok: false, message: 'Inicia sesión para guardar un activo.' }
  }

  const result = validateActivo(data)
  if (!result.ok) return result
  const photoResult = validateActivoPhoto(photoFile)
  if (!photoResult.ok) return photoResult

  let uploadedPath = ''
  let saved = false

  try {
    const activoRef = activoId
      ? doc(db, ACTIVOS_COLLECTION, activoId)
      : doc(collection(db, ACTIVOS_COLLECTION))
    let fotoUrl = removePhoto ? '' : String(data.fotoUrl ?? '')
    let fotoPath = removePhoto ? '' : String(data.fotoPath ?? '')

    if (photoFile) {
      uploadedPath = `activos/${userId}/${activoRef.id}/${crypto.randomUUID()}`
      const photoRef = ref(storage, uploadedPath)
      await uploadBytes(photoRef, photoFile, { contentType: photoFile.type })
      fotoUrl = await getDownloadURL(photoRef)
      fotoPath = uploadedPath
    }

    const payload = { ...result.activo, fotoUrl, fotoPath, updatedAt: serverTimestamp() }

    if (activoId) {
      await updateDoc(activoRef, payload)
    } else {
      await setDoc(activoRef, {
        ...payload,
        createdBy: userId,
        createdAt: serverTimestamp(),
      })
    }
    saved = true

    if (data.fotoPath && data.fotoPath !== fotoPath) {
      await deleteUnusedPhoto(data.fotoPath)
    }

    return { ok: true, message: activoId ? 'Activo actualizado correctamente.' : 'Activo registrado correctamente.' }
  } catch (error) {
    if (uploadedPath && !saved) await deleteUnusedPhoto(uploadedPath)
    return { ok: false, message: errorMessage(error, 'guardar') }
  }
}
