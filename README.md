# FERMONT

Aplicacion web para la gestion y control operativo de una cosmetologia.

## Stack

- React + Vite
- Firebase Firestore (tiempo real)
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
2. Activa Firestore Database.
3. En Configuracion del proyecto, copia la config web.
4. Duplica `.env.example` como `.env` y completa tus valores.
5. Reemplaza el valor `default` en `.firebaserc` por tu `projectId`.

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

El archivo `firestore.rules` viene con reglas abiertas para facilitar pruebas iniciales.
Antes de pasar a produccion, reemplaza estas reglas por reglas seguras (autenticacion y permisos por rol).
