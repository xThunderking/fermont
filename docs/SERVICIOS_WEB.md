# Catálogo de servicios de la página pública

En el sistema del personal: **Página web → Servicios** (`/app/pagina-web/servicios`).

Se pueden crear, editar, eliminar, ocultar y ordenar categorías y servicios. Los servicios se pueden mover a otra categoría desde su formulario. Las categorías permiten configurar nombre, título, descripción, icono y colores; los servicios, nombre, etiqueta, descripción e icono.

El selector ofrece 29 iconos de cosmetología facial y corporal, incluido alaciados, y permite buscar sin necesidad de escribir acentos. Los iconos retirados de peluquería o pies se convierten a alternativas del catálogo al leer registros anteriores.

Las ventanas de edición presentan información y apariencia en dos columnas en iPad y una columna en teléfono. El encabezado y las acciones permanecen visibles mientras se desplaza el contenido. Su altura se adapta al espacio de la pantalla disponible al aparecer el teclado.

**Aplicar** incorpora cada cambio al editor. **Vista previa** utiliza el mismo componente del catálogo público. **Guardar y publicar** guarda todo el catálogo en una transacción y lo muestra en la página pública sin reconstruir ni desplegar nuevamente el sitio.

## Datos y puesta en marcha

- Documento de Firestore: `publicWebsite/serviceCatalog`.
- La primera vez se cargan los 18 servicios originales de `src/publicSite/siteConfig.js` como plantilla. El primer guardado los copia a Firestore con las modificaciones realizadas. Esa plantilla queda solo como respaldo si no existe el documento o no hay conexión; no sustituye un catálogo publicado vacío.
- El documento solo contiene contenido público del catálogo. Lectura pública individual; escritura para cuentas autorizadas con perfil activo. Las reglas de expedientes, clientes y fotografías no cambian.
- Es necesario desplegar las reglas de `firestore.rules` junto con la aplicación para habilitar el guardado. No se necesita desplegar Functions ni Storage para esta función.
- Cada guardado incrementa una revisión. Si otra sesión ya publicó cambios, el guardado se rechaza y se pide recargar para evitar sobrescribirlos.
- Las categorías ocultas, vacías o sin servicios visibles no aparecen en la página pública. Los contadores incluyen únicamente servicios visibles de categorías visibles.
- El editor permite hasta 40 categorías y 200 servicios, y limita el tamaño total a 800 KB antes del guardado.

Pruebas del catálogo: `node --test tests/websiteServices.test.mjs`.
