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

const callPreRegistrationFunction = async (name, data, fallbackMessage) => {
  try {
    const callable = httpsCallable(functions, name)
    const response = await callable(data)
    return {
      ok: Boolean(response.data?.ok),
      ...response.data,
      message: String(response.data?.message ?? fallbackMessage),
    }
  } catch (error) {
    return {
      ok: false,
      reason: String(error?.details?.reason ?? ''),
      message: String(error?.message ?? fallbackMessage),
    }
  }
}

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
    updatedAtMs: data.updatedAt?.toMillis?.() ?? 0,
    createdBy: String(data.createdBy ?? ''),
    clientId: String(data.clientId ?? ''),
    valuationId: String(data.valuationId ?? ''),
  }
}

export const createPreRegistrationInvitation = async ({ nombreCompleto, telefono }) => (
  callPreRegistrationFunction('createPreRegistrationInvitation', {
    nombreCompleto: normalizeText(nombreCompleto),
    telefono: normalizeText(telefono),
  }, 'No se pudo generar el prerregistro. Intenta nuevamente.')
)

export const listPublicPendingPreRegistrations = async () => {
  const result = await callPreRegistrationFunction(
    'listPendingPreRegistrations',
    {},
    'No se pudieron cargar los prerregistros disponibles.',
  )

  return {
    ...result,
    preRegistrations: Array.isArray(result.preRegistrations)
      ? result.preRegistrations.map((preRegistration) => ({
        id: String(preRegistration?.id ?? ''),
        nombreCompleto: String(preRegistration?.nombreCompleto ?? ''),
        telefonoUltimos4: String(preRegistration?.telefonoUltimos4 ?? ''),
        createdAtMs: Number(preRegistration?.createdAtMs ?? 0),
      }))
      : [],
  }
}

export const verifyPreRegistrationInvitation = async ({ preRegistrationId, telefono }) => (
  callPreRegistrationFunction('verifyPreRegistrationInvitation', {
    preRegistrationId: normalizeText(preRegistrationId),
    telefono: normalizeText(telefono),
  }, 'No se pudo verificar el prerregistro.')
)

export const submitPublicPreRegistration = async ({
  preRegistrationId,
  telefono,
  website = '',
  answers = {},
}) => (
  callPreRegistrationFunction('submitPreRegistration', {
    preRegistrationId: normalizeText(preRegistrationId),
    telefono: normalizeText(telefono),
    website: normalizeText(website),
    answers,
  }, 'No se pudo finalizar el prerregistro. Intenta nuevamente.')
)

export const deletePreRegistration = async (preRegistrationId) => (
  callPreRegistrationFunction('deletePreRegistration', {
    preRegistrationId: normalizeText(preRegistrationId),
  }, 'No se pudo eliminar el prerregistro.')
)

export const listManagedPreRegistrations = async () => {
  try {
    const snapshots = await getDocs(query(
      collection(db, PRE_REGISTRATIONS_COLLECTION),
      where('status', 'in', ['pending', 'completed']),
      limit(200),
    ))
    const preRegistrations = snapshots.docs
      .map(mapPreRegistrationSnapshot)
      .sort((left, right) => right.createdAtMs - left.createdAtMs)

    return { ok: true, preRegistrations }
  } catch {
    return {
      ok: false,
      preRegistrations: [],
      message: 'No se pudieron cargar los prerregistros.',
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
