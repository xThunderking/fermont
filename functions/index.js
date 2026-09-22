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

const buildIdentityKey = (normalizedName, normalizedPhone) => createHash('sha256')
  .update(normalizedPhone ? `phone:${normalizedPhone}` : `name:${normalizedName}`)
  .digest('hex')

const findExistingClient = async ({ nombreNormalizado, telefonoNormalizado }) => {
  const clientsSnapshot = await db.collection('clientes')
    .select('nombreCompleto', 'telefono', 'telefonoNormalizado', 'status')
    .get()

  return clientsSnapshot.docs.some((clientDocument) => {
    const client = clientDocument.data() || {}
    if (client.status === 'deleted') return false

    const clientName = normalizeName(client.nombreCompleto)
    const clientPhone = normalizePhone(client.telefonoNormalizado || client.telefono)

    if (!telefonoNormalizado) {
      return clientName === nombreNormalizado
    }

    return clientPhone === telefonoNormalizado
      || (clientName === nombreNormalizado && clientPhone === telefonoNormalizado)
  })
}

exports.submitPreRegistration = onCall(async (request) => {
  const nombreCompleto = normalizeText(request.data?.nombreCompleto)
  const telefono = normalizeText(request.data?.telefono)
  const website = normalizeText(request.data?.website)

  if (website) {
    throw new HttpsError('invalid-argument', 'No se pudo procesar el prerregistro.')
  }

  if (nombreCompleto.length < 3 || nombreCompleto.length > 120) {
    throw new HttpsError('invalid-argument', 'Escribe tu nombre completo.')
  }

  if (telefono && normalizePhone(telefono).length !== 10) {
    throw new HttpsError('invalid-argument', 'El número de teléfono debe tener 10 dígitos.')
  }

  const nombreNormalizado = normalizeName(nombreCompleto)
  const telefonoNormalizado = normalizePhone(telefono)
  const identityKey = buildIdentityKey(nombreNormalizado, telefonoNormalizado)

  const clientExists = await findExistingClient({
    nombreCompleto,
    nombreNormalizado,
    telefono,
    telefonoNormalizado,
  })

  if (clientExists) {
    throw new HttpsError(
      'already-exists',
      'Ya existe un cliente con estos datos. Comunícate con Fermont para continuar como cliente frecuente.',
      { reason: 'existing-client' },
    )
  }

  const identityReference = db.collection('preregistroIdentidades').doc(identityKey)
  const preRegistrationReference = db.collection('preregistros').doc()

  try {
    await db.runTransaction(async (transaction) => {
      const existingIdentity = await transaction.get(identityReference)

      if (existingIdentity.exists) {
        throw new HttpsError(
          'already-exists',
          'Ya recibimos un prerregistro con estos datos.',
          { reason: 'existing-preregistration' },
        )
      }

      transaction.create(preRegistrationReference, {
        schemaVersion: 1,
        status: 'completed',
        source: 'public-web',
        nombreCompleto,
        nombreNormalizado,
        telefono,
        telefonoNormalizado,
        answers: {},
        createdAt: FieldValue.serverTimestamp(),
        completedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })

      transaction.create(identityReference, {
        preRegistrationId: preRegistrationReference.id,
        status: 'completed',
        createdAt: FieldValue.serverTimestamp(),
      })
    })
  } catch (error) {
    if (error instanceof HttpsError) throw error
    throw new HttpsError('internal', 'No se pudo guardar el prerregistro. Intenta nuevamente.')
  }

  return {
    ok: true,
    preRegistrationId: preRegistrationReference.id,
    message: 'Tu prerregistro quedó guardado correctamente.',
  }
})
