# Documentación de Modificación - Detalle de Productos en Compras

## Descripción de los Cambios

### 1. Frontend (React en `src/pages/Compras.jsx`)
Se detectó que al presionar el icono de visualizar detalles ("ojo") de una compra en el listado de Compras, la ventana modal se abría mostrando el nombre del proveedor pero la tabla interna de productos comprados se visualizaba vacía (sin productos, sin costo unitario y sin subtotales).
* **Causa:** Al igual que en las ventas, el listado general de compras obtenido a través del endpoint `/api/compra` (el cual se re-mapea automáticamente a `/api/ordencompra`) no incluye la colección de `detalles` para evitar sobrecargar la respuesta. La interfaz asignaba la fila básica del listado al estado `selected` y, al no contar con la propiedad `detalles`, la tabla de desglose resultaba vacía.
* **Acciones:**
  * Se creó una función asincrónica `handleShowDetail(item)` que realiza una petición explícita a la API utilizando el endpoint de consulta individual por ID:
    `GET /api/compra/{id}` (el cual es re-mapeado a `GET /api/ordencompra/{id}`).
    Este endpoint sí incluye de forma enriquecida todos los detalles de la orden de compra (`Detalles` -> `OrdenCompraDetalles`).
  * Se vinculó el botón del ojo para invocar a `handleShowDetail(c)` en lugar de realizar únicamente `setSelected(c); setShowDetail(true);`.

---

## Técnicas Utilizadas
* **Lazy Loading / On-Demand Fetching:** Optimización de recursos consumidos al recuperar los datos transaccionales específicos únicamente cuando el usuario interactúa con la interfaz.
* **API Route Mapping Translation:** Aprovechamiento del interceptor de Axios para traducir solicitudes `/compra` a `/ordencompra` transparentemente.

---

## Recursos Utilizados
* Endpoint de backend `GET /api/ordencompra/{id}` provisto por `OrdenCompraController.cs`.
* Componente React `Compras.jsx` ubicado en `FRONT_SI/src/pages/Compras.jsx`.
