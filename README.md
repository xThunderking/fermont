# Fermont

Sistema web para administrar clientes, valoraciones cosmetológicas, expedientes, consentimientos firmados, protocolos, mapas interactivos y fotografías clínicas.

## Tecnologías

- React 19 y Vite
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Firebase Hosting
- Cloud Functions para crear, consultar, finalizar y eliminar prerregistros de forma segura
- jsPDF y html2pdf para documentos

## Módulos

- Inicio de sesión con correo o Google
- Administración de usuarios y roles
- Clientes e historial clínico
- Valoraciones nuevas y recurrentes
- Valoraciones pendientes
- Consentimiento informado con firma táctil
- Protocolo de productos
- Fotografías clínicas y mapas interactivos
- Expedientes finalizados e informes PDF
- Invitaciones de prerregistro con estados pendiente y finalizado

## Desarrollo local

1. Instala las dependencias con `npm install`.
2. Copia `.env.example` como `.env` y configura Firebase.
3. Ejecuta `npm run dev`.
4. Valida con `npm run lint` y `npm run build`.

## Configuración de Firebase

Activa Authentication, Firestore y Storage. Configura los proveedores de acceso necesarios y crea el primer perfil administrador en `users/{uid}`.

La variable `VITE_ALLOWED_EMAILS` controla qué correos acepta la interfaz. Esta lista no sustituye las reglas de Firebase.

## Despliegue

Los cambios en consultas paginadas requieren desplegar índices, reglas de Firestore y reglas de Storage:

```bash
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage
npm run deploy
```

El flujo de prerregistro utiliza Cloud Functions. El personal genera una invitación con nombre y teléfono; el cliente la selecciona en la página pública y completa un cuestionario responsivo de datos personales, antecedentes de salud, hábitos, exposición solar, historial estético y rutina actual. Al finalizar, la invitación deja de estar disponible públicamente. Cuando el personal inicia la valoración desde ese prerregistro, las respuestas se precargan en los pasos correspondientes y se vinculan al expediente del cliente. Solo los administradores pueden eliminar invitaciones. Antes del primer despliegue instala las dependencias con `npm install --prefix functions` y confirma que el proyecto de Firebase permita desplegar Functions.

## Almacenamiento

- Fotografías: `valoraciones/{valuationId}/fotografias-clinicas/...`
- Firmas: `valoraciones/{valuationId}/consentimiento-firmas/...`
- Firestore conserva únicamente URLs y rutas de las firmas nuevas.
- Al reemplazar fotografías se eliminan los archivos anteriores.
- Al eliminar una valoración se eliminan también sus archivos de Storage y su referencia en el historial clínico.

## Requisitos para finalizar una valoración

Una valoración solo puede finalizar cuando tenga:

- Firma del cliente
- Firma de la cosmetóloga
- Al menos dos fotografías clínicas
- Al menos un producto en el protocolo

Una vez finalizada, el consentimiento se ofrece como documento de solo lectura desde Expedientes.

## Consideraciones operativas

- Las listas se cargan en páginas de 25 registros.
- Los generadores PDF se cargan bajo demanda.
- La pantalla de valoración advierte antes de cerrar la pestaña cuando detecta cambios sin guardar.
- Deben desplegarse las reglas e índices incluidos en este repositorio antes de usar los cambios en producción.
