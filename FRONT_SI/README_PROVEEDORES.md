# Documentación de Modificación - Columna Dirección de Proveedores

## Descripción de los Cambios

### 1. Frontend (React en `src/pages/Proveedores.jsx`)
Se identificó que el campo **Dirección**, el cual ya era solicitado en el formulario de creación/edición de proveedores y se guardaba correctamente tanto en el backend como en la base de datos, no se visualizaba dentro de la tabla de listado de proveedores en el frontend.
* **Acciones:**
  * Se añadió la cabecera `<th>Dirección</th>` a la tabla en el archivo `Proveedores.jsx`.
  * Se agregó la celda `<td>{p.direccion||'—'}</td>` en el mapeo de registros del cuerpo de la tabla para renderizar la dirección del proveedor de forma dinámica, mostrando un guión (`—`) por defecto en caso de estar vacío.

---

## Técnicas Utilizadas
* **React JSX Table Rendering:** Incorporación y mapeo dinámico de propiedades adicionales provistas por respuestas JSON de la API.
* **Fallback Rendering:** Uso del operador lógico OR (`||`) para renderizar un indicador de vacío amigable en lugar de cadenas nulas o indefinidas.

---

## Recursos Utilizados
* Propiedad `.direccion` proveniente de los objetos del endpoint `/api/proveedor`.
* Componente React `Proveedores.jsx` ubicado en `FRONT_SI/src/pages/Proveedores.jsx`.
