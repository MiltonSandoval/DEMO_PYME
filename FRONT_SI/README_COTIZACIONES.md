# Documentación de Modificación - Corrección de Crash en Cotizaciones

## Descripción de los Cambios

### 1. Frontend (React en `src/pages/Cotizaciones.jsx`)
Se identificó que al seleccionar un producto para añadirlo a una cotización en el modal "Nueva Cotización", toda la pantalla se ponía en negro (un crash del árbol de renderizado de React).
* **Causa:** Al seleccionar un producto en el listado de búsqueda, el código intentaba obtener el precio usando la propiedad `p.precioVentaUSD`. Sin embargo, la API retorna el precio en el campo `precioVenta`. Debido a esto, la propiedad `precioUnitarioUSD` se guardaba en el estado local de detalles como `undefined`. Al renderizarse la tabla de productos seleccionados, se llamaba al método `.toFixed(2)` sobre `undefined`:
  `d.precioUnitarioUSD.toFixed(2)`
  Esto generaba un error de tipo en tiempo de ejecución (`TypeError: Cannot read properties of undefined (reading 'toFixed')`), provocando la caída completa de la interfaz de usuario en React.
* **Acciones:**
  * Se corrigió la asignación en la función `addDetalle` para mapear el campo correcto de precio de venta retornado por la API (`precioVenta`), incluyendo fallbacks preventivos:
    `precioUnitarioUSD: prod.precioVenta || prod.precioVentaUSD || 0`
  * Se modificó la visualización de los precios de productos sugeridos en la barra de búsqueda para leer `p.precioVenta` en lugar de `p.precioVentaUSD`.
  * Se envolvieron las llamadas a `.toFixed(2)` de la tabla de detalles con fallbacks de valor por defecto (`(d.precioUnitarioUSD || 0)`) para asegurar que siempre haya un número válido en el cálculo y formateo de la moneda.

---

## Técnicas Utilizadas
* **Safe Number Conversion & Fallbacks:** Empleo de operadores lógicos de contingencia (`|| 0`) para garantizar la robustez del tipado numérico en JavaScript antes de invocar métodos de formateo como `.toFixed()`.
* **Mapeo de Atributos de API:** Corrección de claves en objetos de transferencia de datos de React para alinearse a la nomenclatura del backend de ASP.NET Core (`precioVenta`).

---

## Recursos Utilizados
* Respuestas del endpoint `/api/producto`.
* Componente React `Cotizaciones.jsx` ubicado en `FRONT_SI/src/pages/Cotizaciones.jsx`.
