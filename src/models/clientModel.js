import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  deleteDoc,
  setDoc,
  serverTimestamp,
  updateDoc,
  where,
  startAfter,
  startAt,
  endAt,
} from 'firebase/firestore'
import { db } from '../services/firebase'

const CLIENTS_COLLECTION = 'clientes'
const CLIENT_HISTORY_COLLECTION = 'historiaClinica'
const LIST_PAGE_SIZE = 25

const normalizeText = (value) => String(value ?? '').trim()

const normalizeIdentityName = (value) => normalizeText(value)
  .replace(/\s+/g, ' ')
  .toLocaleLowerCase('es-MX')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')

const normalizePhone = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '')
  return digits.length > 10 ? digits.slice(-10) : digits
}

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
    nombreNormalizado: normalizeIdentityName(nombreCompleto),
    sexo: ['masculino', 'femenino'].includes(normalizeText(data?.sexo).toLowerCase())
      ? normalizeText(data?.sexo).toLowerCase()
      : '',
    edad: normalizeText(data.edad),
    fechaNacimiento: normalizeText(data.fechaNacimiento),
    telefono: normalizeText(data.telefono),
    telefonoNormalizado: normalizePhone(data.telefono),
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
    nombreNormalizado: String(data.nombreNormalizado ?? ''),
    sexo: String(data.sexo ?? ''),
    edad: String(data.edad ?? ''),
    fechaNacimiento: String(data.fechaNacimiento ?? ''),
    telefono: String(data.telefono ?? ''),
    telefonoNormalizado: String(data.telefonoNormalizado ?? ''),
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

  if (!normalizedClient.nombre || !normalizedClient.apellidoPaterno) {
    return {
      ok: false,
      message: 'Completa el nombre y al menos un apellido del cliente para guardarlo.',
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

export const listClients = async (cursor = null) => {
  try {
    const snapshots = await getDocs(query(
      collection(db, CLIENTS_COLLECTION),
      orderBy('nombreCompletoLower'),
      ...(cursor ? [startAfter(cursor)] : []),
      limit(LIST_PAGE_SIZE),
    ))

    const clients = snapshots.docs
      .map(mapClientSnapshot)
      .filter((client) => client.status !== 'deleted')
      .sort((left, right) => left.nombreCompleto.localeCompare(right.nombreCompleto, 'es'))

    return {
      ok: true,
      clients,
      cursor: snapshots.docs.at(-1) || null,
      hasMore: snapshots.size === LIST_PAGE_SIZE,
    }
  } catch {
    return {
      ok: false,
      message: 'No se pudieron cargar los clientes.',
      clients: [],
      cursor: null,
      hasMore: false,
    }
  }
}

export const searchClientsByName = async (searchText) => {
  const normalizedSearch = normalizeText(searchText).toLowerCase()
  if (!normalizedSearch) return { ok: true, clients: [] }

  try {
    const snapshots = await getDocs(query(
      collection(db, CLIENTS_COLLECTION),
      orderBy('nombreCompletoLower'),
      startAt(normalizedSearch),
      endAt(`${normalizedSearch}\uf8ff`),
      limit(20),
    ))
    return {
      ok: true,
      clients: snapshots.docs.map(mapClientSnapshot).filter((client) => client.status !== 'deleted'),
    }
  } catch {
    return { ok: false, clients: [], message: 'No se pudo buscar clientes.' }
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
    const linkedValuations = await getDocs(query(
      collection(db, 'valoraciones'),
      where('clienteId', '==', clientId),
      limit(1),
    ))

    if (!linkedValuations.empty) {
      return {
        ok: false,
        message: 'El cliente tiene valoraciones asociadas. Elimina primero sus valoraciones para conservar la integridad del expediente.',
      }
    }

    const historySnapshots = await getDocs(collection(db, CLIENTS_COLLECTION, clientId, CLIENT_HISTORY_COLLECTION))
    await Promise.all(historySnapshots.docs.map((snapshot) => deleteDoc(snapshot.ref)))
    await deleteDoc(doc(db, CLIENTS_COLLECTION, clientId))
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

export const saveClientClinicalHistoryFromValuation = async ({
  clientId,
  valuationId,
  clientSnapshot,
  valuationSnapshot,
}) => {
  if (!clientId || !valuationId) {
    return {
      ok: false,
      message: 'No se pudo guardar el expediente cosmetológico.',
    }
  }

  const historyEntry = {
    valuationId,
    clientId,
    clienteNombre: String(valuationSnapshot?.clienteNombre || clientSnapshot?.nombreCompleto || ''),
    schemaVersion: 2,
    createdAt: serverTimestamp(),
  }

  try {
    await setDoc(doc(db, CLIENTS_COLLECTION, clientId, CLIENT_HISTORY_COLLECTION, valuationId), historyEntry, {
      merge: true,
    })

    return {
      ok: true,
      message: 'Expediente cosmetológico guardado correctamente.',
    }
  } catch (error) {
    if (error?.code === 'not-found') {
      return {
        ok: false,
        message: 'No se encontró el cliente para guardar el expediente cosmetológico.',
      }
    }

    return {
      ok: false,
      message: 'No se pudo guardar el expediente cosmetológico. Intenta de nuevo.',
    }
  }
}

export const listClientClinicalHistory = async (clientId, cursor = null) => {
  if (!clientId) {
    return {
      ok: false,
      message: 'No se encontró el cliente para cargar el expediente cosmetológico.',
      history: [],
    }
  }

  try {
    const snapshots = await getDocs(query(
      collection(db, CLIENTS_COLLECTION, clientId, CLIENT_HISTORY_COLLECTION),
      orderBy('createdAt', 'desc'),
      ...(cursor ? [startAfter(cursor)] : []),
      limit(LIST_PAGE_SIZE),
    ))
    const history = await Promise.all(snapshots.docs.map(async (snapshot) => {
        const data = snapshot.data() || {}
        const valuationId = String(data.valuationId ?? snapshot.id)
        const valuationDocument = valuationId
          ? await getDoc(doc(db, 'valoraciones', valuationId))
          : null
        const valuation = valuationDocument?.exists() ? valuationDocument.data() : data
        return {
          id: snapshot.id,
          valuationId,
          clienteNombre: String(valuation.clienteNombre ?? data.clienteNombre ?? ''),
          step1: valuation.step1 ?? null,
          step3: valuation.step3 ?? null,
          step4: valuation.step4 ?? null,
          step5: valuation.step5 ?? null,
          step6: valuation.step6 ?? null,
          step7: valuation.step7 ?? null,
          step8: valuation.step8 ?? null,
          step9: valuation.step9 ?? null,
          step10: valuation.step10 ?? null,
          step11: valuation.step11 ?? null,
          semaforoCutaneo: String(valuation.semaforoCutaneo ?? ''),
          createdAtMs: data.createdAt?.toMillis?.() ?? 0,
        }
      }))
    history.sort((left, right) => right.createdAtMs - left.createdAtMs)

    return {
      ok: true,
      history,
      cursor: snapshots.docs.at(-1) || null,
      hasMore: snapshots.size === LIST_PAGE_SIZE,
    }
  } catch {
    return {
      ok: true,
      message: 'Aún no hay registros en el expediente cosmetológico de este cliente.',
      history: [],
      cursor: null,
      hasMore: false,
    }
  }
}
