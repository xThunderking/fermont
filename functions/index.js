const { createHash } = require('node:crypto')
const { initializeApp } = require('firebase-admin/app')
const { FieldValue, getFirestore } = require('firebase-admin/firestore')
const { HttpsError, onCall } = require('firebase-functions/v2/https')
const { setGlobalOptions } = require('firebase-functions/v2/options')

initializeApp()
setGlobalOptions({ region: 'us-central1', maxInstances: 10 })

const db = getFirestore()

const normalizeText = (value) => String(value ?? '').trim().replace(/\s+/g, ' ')

const normalizeName = (value) => normalizeText(value)
  .toLocaleLowerCase('es-MX')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')

const normalizePhone = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '')
  return digits.length > 10 ? digits.slice(-10) : digits
}

const buildIdentityKey = (type, value) => createHash('sha256')
  .update(`${type}:${value}`)
  .digest('hex')

const getIdentityReferences = (nombreNormalizado, telefonoNormalizado) => ({
  nameReference: db.collection('preregistroIdentidades').doc(buildIdentityKey('name', nombreNormalizado)),
  phoneReference: db.collection('preregistroIdentidades').doc(buildIdentityKey('phone', telefonoNormalizado)),
})

const assertActiveStaff = async (request, requiredRole = '') => {
  const userId = request.auth?.uid
  if (!userId) {
    throw new HttpsError('unauthenticated', 'Inicia sesión para continuar.')
  }

  const userSnapshot = await db.collection('users').doc(userId).get()
  const user = userSnapshot.data() || {}
  const validStaffRole = user.role === 'admin' || user.role === 'user'

  if (!userSnapshot.exists || user.status !== 'active' || !validStaffRole) {
    throw new HttpsError('permission-denied', 'Tu usuario no tiene permiso para realizar esta acción.')
  }

  if (requiredRole && user.role !== requiredRole) {
    throw new HttpsError('permission-denied', 'Solo un administrador puede realizar esta acción.')
  }

  return { userId, role: user.role }
}

const findExistingClient = async ({ nombreNormalizado, telefonoNormalizado }) => {
  const clientsSnapshot = await db.collection('clientes')
    .select('nombreCompleto', 'telefono', 'telefonoNormalizado', 'status')
    .get()

  return clientsSnapshot.docs.some((clientDocument) => {
    const client = clientDocument.data() || {}
    if (client.status === 'deleted') return false

    const clientName = normalizeName(client.nombreCompleto)
    const clientPhone = normalizePhone(client.telefonoNormalizado || client.telefono)

    return clientName === nombreNormalizado
      || (Boolean(telefonoNormalizado) && clientPhone === telefonoNormalizado)
  })
}

const findExistingPreRegistration = async ({ nombreNormalizado, telefonoNormalizado }) => {
  const preRegistrationsSnapshot = await db.collection('preregistros')
    .where('status', 'in', ['pending', 'completed'])
    .select('nombreNormalizado', 'telefonoNormalizado')
    .get()

  return preRegistrationsSnapshot.docs.some((preRegistrationDocument) => {
    const preRegistration = preRegistrationDocument.data() || {}
    return normalizeName(preRegistration.nombreNormalizado) === nombreNormalizado
      || normalizePhone(preRegistration.telefonoNormalizado) === telefonoNormalizado
  })
}

exports.createPreRegistrationInvitation = onCall(async (request) => {
  const { userId } = await assertActiveStaff(request)
  const nombreCompleto = normalizeText(request.data?.nombreCompleto)
  const telefono = normalizeText(request.data?.telefono)

  if (nombreCompleto.length < 3 || nombreCompleto.length > 120) {
    throw new HttpsError('invalid-argument', 'Escribe el nombre completo.')
  }

  if (normalizePhone(telefono).length !== 10) {
    throw new HttpsError('invalid-argument', 'El número de teléfono debe tener 10 dígitos.')
  }

  const nombreNormalizado = normalizeName(nombreCompleto)
  const telefonoNormalizado = normalizePhone(telefono)

  const clientExists = await findExistingClient({
    nombreNormalizado,
    telefonoNormalizado,
  })

  if (clientExists) {
    throw new HttpsError(
      'already-exists',
      'Ya existe un cliente con ese nombre o número de teléfono.',
      { reason: 'existing-client' },
    )
  }

  if (await findExistingPreRegistration({ nombreNormalizado, telefonoNormalizado })) {
    throw new HttpsError(
      'already-exists',
      'Ya existe un prerregistro pendiente o finalizado con ese nombre o número de teléfono.',
      { reason: 'existing-preregistration' },
    )
  }

  const { nameReference, phoneReference } = getIdentityReferences(nombreNormalizado, telefonoNormalizado)
  const preRegistrationReference = db.collection('preregistros').doc()

  try {
    await db.runTransaction(async (transaction) => {
      const [existingName, existingPhone] = await Promise.all([
        transaction.get(nameReference),
        transaction.get(phoneReference),
      ])

      if (existingName.exists || existingPhone.exists) {
        throw new HttpsError(
          'already-exists',
          'Ya existe un prerregistro con ese nombre o número de teléfono.',
          { reason: 'existing-preregistration' },
        )
      }

      transaction.create(preRegistrationReference, {
        schemaVersion: 1,
        status: 'pending',
        source: 'internal-invitation',
        nombreCompleto,
        nombreNormalizado,
        telefono,
        telefonoNormalizado,
        answers: {},
        createdBy: userId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })

      const identityData = {
        preRegistrationId: preRegistrationReference.id,
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
      }
      transaction.create(nameReference, { ...identityData, type: 'name' })
      transaction.create(phoneReference, { ...identityData, type: 'phone' })
    })
  } catch (error) {
    if (error instanceof HttpsError) throw error
    throw new HttpsError('internal', 'No se pudo generar el prerregistro. Intenta nuevamente.')
  }

  return {
    ok: true,
    preRegistrationId: preRegistrationReference.id,
    message: 'Prerregistro generado correctamente. Ya está disponible en la página web.',
  }
})

exports.listPendingPreRegistrations = onCall(async () => {
  try {
    const snapshot = await db.collection('preregistros')
      .where('status', '==', 'pending')
      .limit(100)
      .get()

    const preRegistrations = snapshot.docs
      .map((document) => {
        const data = document.data() || {}
        const phone = normalizePhone(data.telefonoNormalizado || data.telefono)
        return {
          id: document.id,
          nombreCompleto: normalizeText(data.nombreCompleto),
          telefonoUltimos4: phone.slice(-4),
          createdAtMs: data.createdAt?.toMillis?.() || 0,
        }
      })
      .sort((left, right) => left.nombreCompleto.localeCompare(right.nombreCompleto, 'es-MX'))

    return { ok: true, preRegistrations }
  } catch {
    throw new HttpsError('internal', 'No se pudieron cargar los prerregistros disponibles.')
  }
})

exports.verifyPreRegistrationInvitation = onCall(async (request) => {
  const preRegistrationId = normalizeText(request.data?.preRegistrationId)
  const telefonoNormalizado = normalizePhone(request.data?.telefono)

  if (!preRegistrationId || preRegistrationId.length > 128 || telefonoNormalizado.length !== 10) {
    throw new HttpsError('invalid-argument', 'Selecciona tu nombre y escribe tu teléfono de 10 dígitos.')
  }

  const snapshot = await db.collection('preregistros').doc(preRegistrationId).get()
  if (!snapshot.exists || snapshot.data()?.status !== 'pending') {
    throw new HttpsError('not-found', 'Este prerregistro ya no está disponible.')
  }

  const preRegistration = snapshot.data() || {}
  const expectedPhone = normalizePhone(
    preRegistration.telefonoNormalizado || preRegistration.telefono,
  )
  if (expectedPhone !== telefonoNormalizado) {
    throw new HttpsError(
      'permission-denied',
      'El número de teléfono no coincide con el prerregistro seleccionado.',
    )
  }

  return { ok: true }
})

exports.submitPreRegistration = onCall(async (request) => {
  const preRegistrationId = normalizeText(request.data?.preRegistrationId)
  const telefonoNormalizado = normalizePhone(request.data?.telefono)
  const website = normalizeText(request.data?.website)

  if (website) {
    throw new HttpsError('invalid-argument', 'No se pudo procesar el prerregistro.')
  }

  if (!preRegistrationId || preRegistrationId.length > 128) {
    throw new HttpsError('invalid-argument', 'Selecciona un prerregistro válido.')
  }

  if (telefonoNormalizado.length !== 10) {
    throw new HttpsError('invalid-argument', 'Escribe tu número de teléfono de 10 dígitos.')
  }

  const preRegistrationReference = db.collection('preregistros').doc(preRegistrationId)

  try {
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(preRegistrationReference)

      if (!snapshot.exists) {
        throw new HttpsError('not-found', 'Este prerregistro ya no está disponible.')
      }

      const preRegistration = snapshot.data() || {}
      if (preRegistration.status !== 'pending') {
        throw new HttpsError('failed-precondition', 'Este prerregistro ya fue finalizado o utilizado.')
      }

      const expectedPhone = normalizePhone(
        preRegistration.telefonoNormalizado || preRegistration.telefono,
      )
      if (expectedPhone !== telefonoNormalizado) {
        throw new HttpsError(
          'permission-denied',
          'El número de teléfono no coincide con el prerregistro seleccionado.',
        )
      }

      transaction.update(preRegistrationReference, {
        status: 'completed',
        answers: {},
        completedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })

      const nombreNormalizado = normalizeName(preRegistration.nombreNormalizado || preRegistration.nombreCompleto)
      const { nameReference, phoneReference } = getIdentityReferences(nombreNormalizado, expectedPhone)
      transaction.set(nameReference, {
        preRegistrationId,
        status: 'completed',
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true })
      transaction.set(phoneReference, {
        preRegistrationId,
        status: 'completed',
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true })
    })
  } catch (error) {
    if (error instanceof HttpsError) throw error
    throw new HttpsError('internal', 'No se pudo finalizar el prerregistro. Intenta nuevamente.')
  }

  return {
    ok: true,
    preRegistrationId,
    message: 'Tu prerregistro quedó finalizado correctamente.',
  }
})

exports.deletePreRegistration = onCall(async (request) => {
  await assertActiveStaff(request, 'admin')
  const preRegistrationId = normalizeText(request.data?.preRegistrationId)

  if (!preRegistrationId || preRegistrationId.length > 128) {
    throw new HttpsError('invalid-argument', 'Selecciona un prerregistro válido.')
  }

  const preRegistrationReference = db.collection('preregistros').doc(preRegistrationId)

  try {
    await db.runTransaction(async (transaction) => {
      const preRegistrationSnapshot = await transaction.get(preRegistrationReference)
      if (!preRegistrationSnapshot.exists) {
        throw new HttpsError('not-found', 'El prerregistro ya no existe.')
      }

      const preRegistration = preRegistrationSnapshot.data() || {}
      const nombreNormalizado = normalizeName(preRegistration.nombreNormalizado || preRegistration.nombreCompleto)
      const telefonoNormalizado = normalizePhone(preRegistration.telefonoNormalizado || preRegistration.telefono)
      const { nameReference, phoneReference } = getIdentityReferences(nombreNormalizado, telefonoNormalizado)
      const [nameSnapshot, phoneSnapshot] = await Promise.all([
        transaction.get(nameReference),
        transaction.get(phoneReference),
      ])

      transaction.delete(preRegistrationReference)
      if (nameSnapshot.data()?.preRegistrationId === preRegistrationId) transaction.delete(nameReference)
      if (phoneSnapshot.data()?.preRegistrationId === preRegistrationId) transaction.delete(phoneReference)
    })
  } catch (error) {
    if (error instanceof HttpsError) throw error
    throw new HttpsError('internal', 'No se pudo eliminar el prerregistro.')
  }

  return { ok: true, message: 'Prerregistro eliminado correctamente.' }
})
