import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../services/firebase'

const CLIENTS_COLLECTION = 'clientes'

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
