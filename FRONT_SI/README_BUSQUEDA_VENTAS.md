# Documentación de Modificación - Buscador en Historial de Ventas

## Descripción de los Cambios

### 1. Frontend (React en `src/pages/Ventas.jsx`)
Se identificó que el buscador de la pantalla de **Historial de Ventas** solo filtraba registros por el identificador de factura (`id`), ignorando las búsquedas por nombre de cliente o nombre de vendedor/trabajador.
* **Causa:** El filtro del frontend comprobaba los campos `v.clienteNombre` y `v.trabajadorNombre`. Sin embargo, la API retorna la información con las llaves `cliente` y `trabajador` (asociados a `v.cliente` y `v.trabajador` en camelCase). Al ser los campos anteriores `undefined`, las búsquedas por texto no producían coincidencias.
* **Acciones:**
  * Se corrigió la expresión del filtro para evaluar prioritariamente las propiedades correctas retornadas por el backend (`v.cliente` y `v.trabajador`) manteniendo un fallback de compatibilidad a los campos antiguos:
    ```javascript
    (v.cliente || v.clienteNombre)?.toLowerCase().includes(busqueda.toLowerCase())
    (v.trabajador || v.trabajadorNombre)?.toLowerCase().includes(busqueda.toLowerCase())
    ```

---

## Técnicas Utilizadas
* **React List Filtering:** Ajuste del predicado en la función `.filter()` de JavaScript para buscar subcadenas insensibles a mayúsculas/minúsculas.
* **Nullish / Fallback Operators:** Uso del operador lógico OR (`||`) y el operador de encadenamiento opcional (`?.`) para evitar errores en tiempo de ejecución al evaluar campos que pudiesen venir vacíos o indefinidos.

---

## Recursos Utilizados
* Propiedades `cliente` y `trabajador` retornadas en el listado del endpoint de la API `/api/venta`.
* Componente React `Ventas.jsx` ubicado en `FRONT_SI/src/pages/Ventas.jsx`.
