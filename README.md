# FERMONT

Aplicacion web para la gestion y control operativo de una cosmetologia.

## Stack

- React + Vite
- Firebase Authentication (email/password)
- Firebase Firestore
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
4. En Configuracion del proyecto, copia la config web.
5. Duplica `.env.example` como `.env` y completa tus valores.
6. Reemplaza el valor `default` en `.firebaserc` por tu `projectId`.
7. Crea tu admin inicial:
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

8. Para limitar acceso a correos especificos (por ejemplo solo 3), configura en `.env`:

```bash
VITE_ALLOWED_EMAILS=admin@tu-dominio.com,usuario1@tu-dominio.com,usuario2@tu-dominio.com
```

Solo esos correos podran iniciar sesion en la app.

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
