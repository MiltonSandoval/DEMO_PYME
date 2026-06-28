# Documentación de Modificación - Detalle de Productos en Ventas

## Descripción de los Cambios

### 1. Frontend (React en `src/pages/Ventas.jsx`)
Se identificó que al presionar el icono de visualizar detalles ("ojo") de una venta en el historial, la ventana modal se abría mostrando la información general de la venta (cliente, método, fecha, total), pero la tabla interna de productos vendidos se visualizaba vacía.
* **Causa:** El listado general de ventas obtenido a través de `GET /api/venta` (ejecutado por la función `loadData`) no incluye la colección de `detalles` (el detalle de productos de cada venta) por motivos de rendimiento y diseño de la API. Al hacer clic, se guardaba el objeto de la lista en el estado local `selected`, y al intentar renderizar `selected.detalles`, el valor resultaba indefinido.
* **Acciones:**
  * Se creó una función asincrónica `handleShowDetail(item)` que realiza una petición explícita a la API utilizando el endpoint de consulta individual:
    `GET /api/venta/{id}`
    Este endpoint sí incluye de forma enriquecida todos los detalles de la venta (los productos, sus cantidades, precios unitarios y subtotales).
  * Se vinculó el botón del ojo para invocar a `handleShowDetail(v)` en lugar de realizar únicamente `setSelected(v); setShowDetail(true);`.

---

## Técnicas Utilizadas
* **Lazy Loading / On-Demand Fetching:** Recuperación de los detalles transaccionales específicos de una fila solo cuando el usuario lo solicita explícitamente (al hacer clic), optimizando el ancho de banda y el consumo de recursos de la API.
* **React State Management:** Actualización del estado `selected` con la respuesta completa del servidor para desencadenar el re-renderizado automático del modal con la información correcta.

---

## Recursos Utilizados
* Endpoint de backend `GET /api/venta/{id}` provisto por `VentasController.cs`.
* Componente React `Ventas.jsx` ubicado en `FRONT_SI/src/pages/Ventas.jsx`.
