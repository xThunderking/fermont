import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { app, db } from '../services/firebase.js'

const PRE_REGISTRATIONS_COLLECTION = 'preregistros'
const functions = getFunctions(app, 'us-central1')

const normalizeText = (value) => String(value ?? '').trim().replace(/\s+/g, ' ')

const mapPreRegistrationSnapshot = (snapshot) => {
  const data = snapshot.data() || {}

  return {
    id: snapshot.id,
    schemaVersion: Number(data.schemaVersion ?? 1),
    status: String(data.status ?? ''),
    source: String(data.source ?? ''),
    nombreCompleto: String(data.nombreCompleto ?? ''),
    nombreNormalizado: String(data.nombreNormalizado ?? ''),
    telefono: String(data.telefono ?? ''),
    telefonoNormalizado: String(data.telefonoNormalizado ?? ''),
    answers: data.answers && typeof data.answers === 'object' ? data.answers : {},
    createdAtMs: data.createdAt?.toMillis?.() ?? 0,
    completedAtMs: data.completedAt?.toMillis?.() ?? 0,
    usedAtMs: data.usedAt?.toMillis?.() ?? 0,
    clientId: String(data.clientId ?? ''),
    valuationId: String(data.valuationId ?? ''),
  }
}

export const submitPublicPreRegistration = async ({ nombreCompleto, telefono = '', website = '' }) => {
  try {
    const submitPreRegistration = httpsCallable(functions, 'submitPreRegistration')
    const response = await submitPreRegistration({
      nombreCompleto: normalizeText(nombreCompleto),
      telefono: normalizeText(telefono),
      website: normalizeText(website),
    })

    return {
      ok: Boolean(response.data?.ok),
      id: String(response.data?.preRegistrationId ?? ''),
      message: String(response.data?.message ?? 'Prerregistro guardado correctamente.'),
    }
  } catch (error) {
    return {
      ok: false,
      reason: String(error?.details?.reason ?? ''),
      message: String(error?.message ?? 'No se pudo guardar el prerregistro. Intenta nuevamente.'),
    }
  }
}

export const listCompletedPreRegistrations = async () => {
  try {
    const snapshots = await getDocs(query(
      collection(db, PRE_REGISTRATIONS_COLLECTION),
      where('status', '==', 'completed'),
      limit(100),
    ))
    const preRegistrations = snapshots.docs
      .map(mapPreRegistrationSnapshot)
      .sort((left, right) => right.completedAtMs - left.completedAtMs)

    return { ok: true, preRegistrations }
  } catch {
    return {
      ok: false,
      preRegistrations: [],
      message: 'No se pudieron cargar los prerregistros finalizados.',
    }
  }
}

export const markPreRegistrationUsed = async ({ preRegistrationId, userId, clientId, valuationId }) => {
  if (!preRegistrationId || !userId || !clientId || !valuationId) {
    return { ok: false, message: 'No se pudo vincular el prerregistro con la valoración.' }
  }

  try {
    await updateDoc(doc(db, PRE_REGISTRATIONS_COLLECTION, preRegistrationId), {
      status: 'used',
      usedBy: userId,
      clientId,
      valuationId,
      usedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return { ok: true }
  } catch {
    return {
      ok: false,
      message: 'La valoración se guardó, pero no se pudo marcar el prerregistro como utilizado.',
    }
  }
}
