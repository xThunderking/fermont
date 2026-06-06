# FERMONT

Aplicacion web para la gestion y control operativo de una cosmetologia.

## Stack

- React + Vite
- Firebase Authentication (email/password)
- Firebase Firestore
- Firebase Storage (fotografias clinicas)
- Firebase Hosting

## Modulos incluidos

- Panel con metricas principales
- Registro y listado de clientes
- Registro y listado de servicios
- Agenda de citas con actualizacion de estado

## 1) Instalar dependencias

```bash
npm install
```

## 2) Configurar Firebase

1. Crea un proyecto en Firebase Console.
2. Activa Firebase Authentication y habilita los proveedores Email/Password y Google.
3. Activa Firestore Database.
4. Activa Firebase Storage y crea el bucket por defecto del proyecto.
5. En Configuracion del proyecto, copia la config web.
6. Duplica `.env.example` como `.env` y completa tus valores.
7. Reemplaza el valor `default` en `.firebaserc` por tu `projectId`.
8. Crea tu admin inicial:
	 - En Authentication crea un usuario (email/password).
	 - En Firestore crea el documento `users/{uid}` con este contenido base:

```json
{
	"uid": "UID_DEL_USUARIO",
	"username": "admin",
	"usernameLower": "admin",
	"email": "admin@tu-dominio.com",
	"emailLower": "admin@tu-dominio.com",
	"role": "admin",
	"status": "active"
}
```

9. Para limitar acceso a correos especificos (por ejemplo solo 3), configura en `.env`:

```bash
VITE_ALLOWED_EMAILS=admin@tu-dominio.com,usuario1@tu-dominio.com,usuario2@tu-dominio.com
```

Solo esos correos podran iniciar sesion en la app.

10. Para desarrollo local (http://localhost:5173), configura CORS del bucket para permitir subidas desde el navegador.

Este repositorio ya incluye un archivo `cors.json` en la raiz con origenes de desarrollo y produccion.

Aplicar CORS (Google Cloud SDK o Cloud Shell):

```bash
gcloud storage buckets update gs://TU_BUCKET --cors-file=cors.json
```

Para este proyecto, el bucket actual es:

```bash
gs://fermont-bbade.firebasestorage.app
```

Comando directo para este bucket:

```bash
gcloud storage buckets update gs://fermont-bbade.firebasestorage.app --cors-file=cors.json
```

## 3) Ejecutar en desarrollo

```bash
npm run dev
```

## 4) Build

```bash
npm run build
```

## 5) Desplegar en Firebase Hosting

Primera vez (login):

```bash
npx firebase-tools login
```

Deploy:

```bash
npm run deploy
```

Preview channel:

```bash
npm run hosting:preview
```

## Reglas de Firestore

El archivo `firestore.rules` ya incluye reglas por autenticacion y rol para la coleccion `users`.
Recuerda desplegarlas cuando hagas cambios:

```bash
npx firebase-tools deploy --only firestore:rules
```

Para Storage (fotografias clinicas), este proyecto tambien incluye `storage.rules`:

```bash
npx firebase-tools deploy --only storage
```

Validacion rapida de carga de fotos:

1. Inicia sesion en la app con un usuario autenticado.
2. En Valoraciones Pendientes, abre una valoracion existente.
3. En el modal de Fotografias, sube una imagen en Antes o Despues.
4. Verifica que aparezca en Firebase Storage en la ruta `valoraciones/{valuationId}/fotografias-clinicas/...`.
