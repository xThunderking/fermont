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
- Activos cosméticos: Inventario y Registro, con categoría, propiedades, tipos de piel, lista de contraindicaciones y foto opcional
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

El flujo de prerregistro utiliza Cloud Functions. El personal genera una invitación con nombre, teléfono y sexo; en ese momento también se crea el cliente y su identidad queda protegida para que no pueda modificarse desde la página pública. El cliente completa un cuestionario responsivo, lee y acepta el consentimiento informado y lo firma desde su dispositivo. Al finalizar, la invitación deja de estar disponible públicamente. Cuando el personal inicia la valoración desde ese prerregistro, las respuestas y la firma se aplican al expediente, y la interfaz muestra únicamente las preguntas pendientes. Solo los administradores pueden eliminar invitaciones. Antes del primer despliegue instala las dependencias con `npm install --prefix functions` y confirma que el proyecto de Firebase permita desplegar Functions.

## Almacenamiento

- Fotografías: `valoraciones/{valuationId}/fotografias-clinicas/...`
- Firmas: `valoraciones/{valuationId}/consentimiento-firmas/...`
- Firestore conserva únicamente URLs y rutas de las firmas nuevas.
- Al reemplazar fotografías se eliminan los archivos anteriores.
- Al eliminar una valoración se eliminan también sus archivos de Storage y su referencia en el historial clínico.

Los activos se guardan en la colección `activos` de Firestore. El módulo tiene dos secciones: Inventario para consultar y buscar, y Registro para crear o editar una ficha. El personal activo puede consultarlos y registrar nuevos; cada autor puede editar sus registros y los administradores pueden editar cualquiera. El formulario permite escribir libremente la categoría, seleccionar varios tipos de piel y agregar o quitar contraindicaciones individuales (hasta 20). Las fichas anteriores con contraindicaciones en texto se convierten en lista al leerlas, sin perder su contenido.

La foto del activo es opcional y acepta JPG, PNG y WebP de hasta 10 MB. Se guarda en Storage bajo `activos/{uploaderId}/{activoId}/{photoId}`; Firestore conserva su URL y ruta. Al reemplazarla o quitarla, la ficha se actualiza antes de intentar eliminar el archivo anterior. Si falla el guardado después de subir una foto, se intenta eliminar la nueva para evitar archivos sin ficha. Despliega las reglas de Firestore y Storage junto con la interfaz para habilitar el módulo; desplegar solo Hosting no actualiza los permisos.

Las reglas de fotos consultan el perfil del personal en Firestore. Firebase Storage necesita que su cuenta de servicio tenga el rol `roles/firebaserules.firestoreServiceAgent`; el CLI de Firebase permite habilitarlo durante el despliegue interactivo. Valida previamente con `npx firebase-tools deploy --only firestore:rules,storage --dry-run`.

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
