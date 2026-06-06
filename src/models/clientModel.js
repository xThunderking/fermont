import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  deleteDoc,
  setDoc,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../services/firebase'

const CLIENTS_COLLECTION = 'clientes'
const CLIENT_HISTORY_COLLECTION = 'historiaClinica'

const normalizeText = (value) => String(value ?? '').trim()

const normalizeClientData = (data) => {
  const nombre = normalizeText(data.nombre)
  const apellidoPaterno = normalizeText(data.apellidoPaterno)
  const apellidoMaterno = normalizeText(data.apellidoMaterno)
  const nombreCompleto = [nombre, apellidoPaterno, apellidoMaterno].filter(Boolean).join(' ').trim()
  const correoElectronico = normalizeText(data.correoElectronico).toLowerCase()

  return {
    apellidoPaterno,
    apellidoMaterno,
    nombre,
    nombreCompleto,
    nombreCompletoLower: nombreCompleto.toLowerCase(),
    edad: normalizeText(data.edad),
    fechaNacimiento: normalizeText(data.fechaNacimiento),
    telefono: normalizeText(data.telefono),
    correoElectronico,
    correoElectronicoLower: correoElectronico,
    ocupacion: normalizeText(data.ocupacion),
    contactoEmergencia: normalizeText(data.contactoEmergencia),
  }
}

const mapClientSnapshot = (snapshot) => {
  const data = snapshot.data() || {}

  return {
    id: snapshot.id,
    apellidoPaterno: String(data.apellidoPaterno ?? ''),
    apellidoMaterno: String(data.apellidoMaterno ?? ''),
    nombre: String(data.nombre ?? ''),
    nombreCompleto: String(data.nombreCompleto ?? ''),
    nombreCompletoLower: String(data.nombreCompletoLower ?? ''),
    edad: String(data.edad ?? ''),
    fechaNacimiento: String(data.fechaNacimiento ?? ''),
    telefono: String(data.telefono ?? ''),
    correoElectronico: String(data.correoElectronico ?? ''),
    correoElectronicoLower: String(data.correoElectronicoLower ?? ''),
    ocupacion: String(data.ocupacion ?? ''),
    contactoEmergencia: String(data.contactoEmergencia ?? ''),
    status: String(data.status ?? 'active'),
    createdBy: String(data.createdBy ?? ''),
    createdAtMs: data.createdAt?.toMillis?.() ?? 0,
    updatedAtMs: data.updatedAt?.toMillis?.() ?? 0,
  }
}

const readClientById = async (clientId) => {
  const snapshot = await getDoc(doc(db, CLIENTS_COLLECTION, clientId))

  if (!snapshot.exists()) {
    return null
  }

  return mapClientSnapshot(snapshot)
}

export const saveClientFromStepOne = async ({ userId, stepOneData, clientId }) => {
  const normalizedClient = normalizeClientData(stepOneData)

  if (!normalizedClient.nombre || !normalizedClient.apellidoPaterno || !normalizedClient.apellidoMaterno) {
    return {
      ok: false,
      message: 'Completa nombre y apellidos del cliente para guardarlo.',
    }
  }

  try {
    if (clientId) {
      await updateDoc(doc(db, CLIENTS_COLLECTION, clientId), {
        ...normalizedClient,
        updatedAt: serverTimestamp(),
      })

      const updated = await readClientById(clientId)
      return { ok: true, client: updated }
    }

    let existingClient = null

    if (normalizedClient.correoElectronicoLower) {
      const byEmail = query(
        collection(db, CLIENTS_COLLECTION),
        where('correoElectronicoLower', '==', normalizedClient.correoElectronicoLower),
        limit(1),
      )
      const emailSnapshots = await getDocs(byEmail)

      if (!emailSnapshots.empty) {
        existingClient = mapClientSnapshot(emailSnapshots.docs[0])
      }
    }

    if (existingClient) {
      await updateDoc(doc(db, CLIENTS_COLLECTION, existingClient.id), {
        ...normalizedClient,
        updatedAt: serverTimestamp(),
      })

      const updated = await readClientById(existingClient.id)
      return { ok: true, client: updated }
    }

    const created = await addDoc(collection(db, CLIENTS_COLLECTION), {
      ...normalizedClient,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    const saved = await readClientById(created.id)
    return { ok: true, client: saved }
  } catch {
    return {
      ok: false,
      message: 'No se pudo guardar el cliente. Intenta de nuevo.',
    }
  }
}

export const listClients = async () => {
  try {
    const snapshots = await getDocs(collection(db, CLIENTS_COLLECTION))

    const clients = snapshots.docs
      .map(mapClientSnapshot)
      .filter((client) => client.status !== 'deleted')
      .sort((left, right) => left.nombreCompleto.localeCompare(right.nombreCompleto, 'es'))

    return { ok: true, clients }
  } catch {
    return {
      ok: false,
      message: 'No se pudieron cargar los clientes.',
      clients: [],
    }
  }
}

export const deleteClientById = async (clientId) => {
  if (!clientId) {
    return {
      ok: false,
      message: 'No se encontro el cliente para eliminar.',
    }
  }

  try {
    await updateDoc(doc(db, CLIENTS_COLLECTION, clientId), {
      status: 'deleted',
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return {
      ok: true,
      message: 'Cliente eliminado correctamente.',
    }
  } catch (error) {
    if (error?.code === 'not-found') {
      return {
        ok: false,
        message: 'No se encontro el cliente para eliminar.',
      }
    }

    return {
      ok: false,
      message: error?.code
        ? `No se pudo eliminar el cliente (${error.code}).`
        : 'No se pudo eliminar el cliente. Intenta de nuevo.',
    }
  }
}

const cloneStepData = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => cloneStepData(item))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cloneStepData(item)]),
    )
  }

  return value ?? null
}

export const saveClientClinicalHistoryFromValuation = async ({
  clientId,
  valuationId,
  clientSnapshot,
  valuationSnapshot,
}) => {
  if (!clientId || !valuationId) {
    return {
      ok: false,
      message: 'No se pudo guardar la historia clínica.',
    }
  }

  const historyEntry = {
    valuationId,
    clientId,
    clienteNombre: String(valuationSnapshot?.clienteNombre || clientSnapshot?.nombreCompleto || ''),
    step1: cloneStepData(valuationSnapshot?.step1),
    step3: cloneStepData(valuationSnapshot?.step3),
    step4: cloneStepData(valuationSnapshot?.step4),
    step5: cloneStepData(valuationSnapshot?.step5),
    step6: cloneStepData(valuationSnapshot?.step6),
    step7: cloneStepData(valuationSnapshot?.step7),
    step8: cloneStepData(valuationSnapshot?.step8),
    step9: cloneStepData(valuationSnapshot?.step9),
    step10: cloneStepData(valuationSnapshot?.step10),
    step11: cloneStepData(valuationSnapshot?.step11),
    semaforoCutaneo: String(valuationSnapshot?.semaforoCutaneo ?? ''),
    mapaInteractivo: cloneStepData(valuationSnapshot?.mapaInteractivo),
    fotografiasClinicas: cloneStepData(valuationSnapshot?.fotografiasClinicas),
    createdAt: serverTimestamp(),
  }

  try {
    await setDoc(doc(db, CLIENTS_COLLECTION, clientId, CLIENT_HISTORY_COLLECTION, valuationId), historyEntry, {
      merge: true,
    })

    return {
      ok: true,
      message: 'Historia clínica guardada correctamente.',
    }
  } catch (error) {
    if (error?.code === 'not-found') {
      return {
        ok: false,
        message: 'No se encontro el cliente para guardar la historia clínica.',
      }
    }

    return {
      ok: false,
      message: 'No se pudo guardar la historia clínica. Intenta de nuevo.',
    }
  }
}

export const listClientClinicalHistory = async (clientId) => {
  if (!clientId) {
    return {
      ok: false,
      message: 'No se encontro el cliente para cargar la historia clínica.',
      history: [],
    }
  }

  try {
    const snapshots = await getDocs(collection(db, CLIENTS_COLLECTION, clientId, CLIENT_HISTORY_COLLECTION))
    const history = snapshots.docs
      .map((snapshot) => {
        const data = snapshot.data() || {}
        return {
          id: snapshot.id,
          valuationId: String(data.valuationId ?? ''),
          clienteNombre: String(data.clienteNombre ?? ''),
          step1: data.step1 ?? null,
          step3: data.step3 ?? null,
          step4: data.step4 ?? null,
          step5: data.step5 ?? null,
          step6: data.step6 ?? null,
          step7: data.step7 ?? null,
          step8: data.step8 ?? null,
          step9: data.step9 ?? null,
          step10: data.step10 ?? null,
          step11: data.step11 ?? null,
          semaforoCutaneo: String(data.semaforoCutaneo ?? ''),
          createdAtMs: data.createdAt?.toMillis?.() ?? 0,
        }
      })
      .sort((left, right) => right.createdAtMs - left.createdAtMs)

    return { ok: true, history }
  } catch {
    return {
      ok: true,
      message: 'Aun no hay historia clínica registrada para este cliente.',
      history: [],
    }
  }
}
