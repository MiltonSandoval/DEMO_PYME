# Documentación de Cambios - ElectroShop POS

Este archivo registra las modificaciones, técnicas y configuraciones aplicadas al proyecto.

## 1. Ajuste de Puerto de Comunicación (Localhost)
*   **Archivo Modificado**: `FRONT_SI/.env`
*   **Cambio**: Se actualizó la variable de entorno `VITE_API_URL` de `http://localhost:5183/api` a `http://localhost:5100/api`.
*   **Motivo**: El backend (ASP.NET Core Web API) está configurado en `API_SI/API_SI/Properties/launchSettings.json` para ejecutarse en el puerto `5100` bajo el perfil HTTP estándar. La configuración previa del frontend provocaba fallos de comunicación debido a que apuntaba al puerto `5183`.
*   **Resultado**: Ahora el frontend y el backend están correctamente enlazados para las pruebas de desarrollo local.

## 2. Habilitación de Redirección HTTPS Condicional
*   **Archivo Modificado**: `API_SI/API_SI/Program.cs`
*   **Cambio**: Se condicionó el uso de `app.UseHttpsRedirection()` para que solo se ejecute cuando NO esté en el entorno de desarrollo (`IsDevelopment()`).
*   **Motivo**: La redirección automática a HTTPS (puerto `7294`) rompía la petición preflight de CORS (petición OPTIONS) que realiza el navegador desde el frontend (puerto `5173`), lanzando el error de bloqueo *"Redirect is not allowed for a preflight request"*.
*   **Resultado**: Al desactivar la redirección en desarrollo local, el preflight de CORS se completa de forma directa sobre HTTP (puerto `5100`), resolviendo el bloqueo del navegador.

## 3. Corrección del Mapeo de Login y Permisos
*   **Archivo Modificado**: `FRONT_SI/src/context/AuthContext.jsx`
*   **Cambio**: Se actualizó el envío de parámetros en la petición POST a `/auth/login` (de `{ usuario, contrasena }` a `{ email: usuario, password: contrasena }`). También se reestructuró la asignación del objeto retornado mapeando la respuesta del backend al objeto `trabajador` y transformando `moduloClave` a `modulo` para los permisos.
*   **Motivo**: El backend en C# requiere un DTO `LoginRequest` con los campos `Email` y `Password` (lo que provocaba un error HTTP 400 Bad Request al no recibirlos). Asimismo, el objeto retornado por la API (`nombre`, `email`, `rol` y `permisos` con `moduloClave`) difería de lo que esperaba la interfaz de React (`trabajador` y `modulo`), lo que habría bloqueado los accesos en el frontend.
*   **Resultado**: El inicio de sesión se procesa con éxito y los permisos de los módulos se aplican de forma correcta en el Sidebar y Topbar.

## 4. Interceptor de Redireccionamiento de Rutas Dinámico (Pluralización y Acciones Especiales)
*   **Archivo Modificado**: `FRONT_SI/src/services/api.js`
*   **Cambio**: Se introdujo un interceptor de solicitudes de Axios que traduce dinámicamente rutas en singular del frontend a rutas en plural esperadas por la convención de controladores de ASP.NET Core (`/categoria` -> `/categorias`, `/cliente` -> `/clientes`, etc.). También se mapearon acciones personalizadas como `/pos/vender` a `/ventas` y `/venta/{id}/anular` a `/ventas/{id}/cancelar`.
*   **Motivo**: Los controladores de C# exponen rutas basadas en sus nombres de clase en plural (ej. `CategoriasController`), mientras que el frontend asumía rutas en singular. El interceptor centraliza la traducción de URLs y evita tener que modificar de forma disruptiva las llamadas API de múltiples componentes.

## 5. Mapeo del Módulo de Control de Caja (Apertura y Cierre)
*   **Archivo Modificado**: `FRONT_SI/src/pages/Caja.jsx`
*   **Cambios**:
    *   Se alineó el payload del método `handleAbrir` para usar `montoApertura` (casing correcto).
    *   Se reestructuró `handleCerrar` para utilizar el método `PUT` hacia `/sesioncaja/{id}/cerrar` con propiedades serializadas (`montoCierre`, `conteoEfectivo` como string JSON y `notas` para las observaciones).
    *   Se actualizaron las propiedades de renderizado del historial (`montoApertura` en lugar de `montoInicialBs` y `montoCierre` en lugar de `totalConteoBs`).
*   **Motivo**: El backend utiliza el verbo `PUT` para el cierre de caja, exige que el conteo físico se envíe como stringified JSON para la columna `jsonb` de PostgreSQL y define el modelo con propiedades tipo PascalCase (mapeadas a camelCase por el serializador JSON).

## 6. Corrección en Punto de Venta (POS) y Detalle de Ventas
*   **Archivos Modificados**: `FRONT_SI/src/pages/POS.jsx`, `FRONT_SI/src/pages/Ventas.jsx`
*   **Cambios**:
    *   En `POS.jsx`, se mapeó el método de pago seleccionado por el usuario a los IDs de base de datos pre-sembrados (1 para Efectivo, 2 para Transferencia/QR, 3 para Delivery). Se resolvió `idCliente` de forma segura (fallando a `1` si es venta de mostrador) para evitar violaciones de clave foránea.
    *   Se reestructuró el payload de venta para usar `idCliente`, `idMetodoPago`, `subtotal`, `descuento`, `montoDescuento`, `total`, y el array de detalles con `idProducto` y `precioUnitario`.
    *   En `Ventas.jsx`, se corrigieron los nombres de los campos en la tabla y en el modal de detalles para usar las propiedades devueltas por la consulta select del backend (e.g., `fecha` en lugar de `creadoEn`, `cliente.nombre`, `trabajador.nombre`, `total` en lugar de `totalUSD`).
*   **Motivo**: El backend exige relaciones y llaves foráneas válidas para registrar ventas de manera consistente en la base de datos y evitar excepciones de validación de modelo o fallos de deserialización.

## 7. Integración de Órdenes de Compra y Cotizaciones
*   **Archivos Modificados**: `FRONT_SI/src/pages/Compras.jsx`, `FRONT_SI/src/pages/Cotizaciones.jsx`, `API_SI/API_SI/Controllers/CotizacionesController.cs`
*   **Cambios**:
    *   En `Compras.jsx`, se adaptó el payload de registro de compras a la firma `CrearOrdenCompraRequest` (`idProveedor`, `total`, `detalles` con `idProducto` y `costoUnitario`).
    *   En `CotizacionesController.cs`, se extendió el método `GetAll` para incluir los campos `ClienteTelefono`, `DiasValidez` y `FechaCreacion` en la proyección del select.
    *   En `Cotizaciones.jsx`, se corrigieron las llamadas al endpoint y el payload de creación de cotizaciones según `CrearCotizacionRequest` (`clienteTelefono`, `diasValidez`, `plantilla`, etc.).
*   **Motivo**: Garantizar el intercambio correcto de tipos complejos e incluir datos cruciales de envío (WhatsApp) en la cotización a nivel del listado de la interfaz.

## 8. Sincronización de Devoluciones y Mermas
*   **Archivos Modificados**: `FRONT_SI/src/pages/Devoluciones.jsx`, `API_SI/API_SI/Controllers/DevolucionesController.cs`
*   **Cambios**:
    *   En `DevolucionesController.cs`, se actualizaron los campos proyectados en la consulta `GetAll` para incluir sumas de cantidades y detalles del primer producto, habilitando columnas descriptivas en el listado del frontend.
    *   En `Devoluciones.jsx`, se ajustó la acción `handleSave` para realizar una consulta previa a la factura (`/venta/{id}`), obtener el precio de venta unitario original del artículo y calcular el total de reembolso exacto antes de enviar la devolución al servidor.
*   **Motivo**: Mantener la integridad de los saldos, calcular correctamente el reingreso de stock y respetar el modelo de transacciones financieras de las devoluciones.

## 9. Sincronización del Módulo de Trabajadores y Roles Asignados
*   **Archivo Modificado**: `FRONT_SI/src/pages/Trabajadores.jsx`
*   **Cambios**:
    *   Se actualizó el binding de la columna Rol para acceder a la propiedad anidada `t.rol?.nombre` en lugar del campo inexistente `t.rolNombre`.
    *   Se corrigieron las vinculaciones del listado y el formulario para mapear `email` a la propiedad `usuario`, `telefono` a `celular`, `estado === 'activo'` a la propiedad de selección `activo`, e `idRol` a `rolId`.
    *   Se estructuró el payload de guardado en `handleSave` para enviar el DTO correcto al backend, incluyendo los campos `email`, `password`, `telefono`, `idRol` y `estado` ("activo"/"inactivo").
*   **Motivo**: El backend almacena el rol como una entidad relacionada anidada (`Rol`) en lugar de aplanada en el primer nivel del JSON, y usa el campo `Email` como identificador de login de los trabajadores.

## 10. Sincronización del Módulo de Configuración/Configuraciones
*   **Archivo Modificado**: `FRONT_SI/src/pages/Configuracion.jsx`
*   **Cambios**:
    *   Se renombraron todas las variables del estado y del formulario (`nombreNegocio` -> `nombre`, `nit` -> `ruc`, `tipoCambioBs` -> `tipoCambio`, `monedaPrincipal` -> `monedaVisualizacion`, y `logoUrl` -> `logoImagen`) para alinearse exactamente con el DTO `ConfiguracionUpdateDto` y el modelo de C#.
    *   Se preservan todos los campos por defecto al enviar el payload `PUT` al backend.
*   **Motivo**: Evitar campos vacíos o no guardados debido a discrepancias en el casing y nombres de campos con el backend.

## 11. Alineación del Módulo de Productos y Unidades
*   **Archivo Modificado**: `FRONT_SI/src/pages/Productos.jsx`
*   **Cambios**:
    *   Se reestructuraron las referencias a código de barras (`p.codigoBarras` -> `p.codigo`), categoría (`p.categoriaId` -> `p.idCategoria`), precios (`p.precioCompraUSD`/`p.precioVentaUSD` -> `p.precioCompra`/`p.precioVenta`), estado (`p.activo` -> `p.estado`) y nombre de categoría (`p.categoriaNombre` -> `p.categoria?.nombre`).
    *   Se añadió un selector en la interfaz para elegir el tipo de Unidad (`und`, `kg`, `lt`, `gr`), asegurando que no se viole la restricción de base de datos (`Unidad` no nula).
*   **Motivo**: Sincronizar el componente CRUD con las restricciones de clave foránea y nombres de columnas de la base de datos PostgreSQL mapeadas en Entity Framework.

## 12. Sincronización de Kardex/Inventario
*   **Archivo Modificado**: `FRONT_SI/src/pages/Inventario.jsx`
*   **Cambios**:
    *   Se actualizaron las propiedades de renderizado de la tabla de movimientos para usar `m.fecha` en lugar de `m.creadoEn`, `m.producto` en lugar de `m.productoNombre`, y `m.motivo` en lugar de `m.referencia`.
    *   Se adaptó el filtro de búsqueda y la lógica de colores de insignias badge a minúsculas para coincidir con la serialización JSON.
*   **Motivo**: El método `GetAll` del controlador proyecta un tipo anónimo con campos específicos (`Fecha`, `Producto`, `Motivo`) que no se mostraban en la UI.

## 13. Mapeo del Módulo de Validación de Documentos/Código QR
*   **Archivo Modificado**: `FRONT_SI/src/pages/Validar.jsx`
*   **Cambios**:
    *   Se corrigió la petición GET para enviar el hash como un parámetro de consulta (`/validar?qr=HASH`) en lugar de como ruta (`/validar/{hash}`).
    *   Se actualizaron las proyecciones en el frontend para soportar los campos devueltos de forma condicional para ventas y cotizaciones (`fecha`/`fechaCreacion`, `total`/`totalUSD`, y `cliente?.nombre`/`clienteNombre`).
*   **Motivo**: El endpoint público `ValidarController.Validar` en C# solo acepta parámetros del query string y retorna esquemas de datos diferenciados según el tipo de documento.

## 14. Normalización de Casing en Roles y Permisos
*   **Archivo Modificado**: `FRONT_SI/src/pages/Roles.jsx`
*   **Cambios**:
    *   Se reescribió `getPermiso` para comprobar todas las variantes de casing del campo identificador de módulo (`idModulo`, `idmodulo` o `IdModulo`) y resolver y mapear condicionalmente las acciones tanto en camelCase como en PascalCase (`leer`/`Leer`, `crear`/`Crear`, `editar`/`Editar`, `eliminar`/`Eliminar`).
    *   Se adaptaron `togglePermiso` y `handleSave` para soportar y persistir ambos casings.
*   **Motivo**: El backend convierte los nombres de las columnas a minúsculas (`idmodulo`) para PostgreSQL y la serialización JSON puede variar entre camelCase o PascalCase según la configuración del serializador del framework. Esto provocaba que el frontend no pudiera emparejar los permisos de la base de datos y mostrara todas las casillas vacías (desmarcadas).

## 15. Resolución de Ciclos de Referencia en Serialización JSON (Excepción 500)
*   **Archivos Modificados**: `API_SI/API_SI/Program.cs` y `API_SI/API_SI/Controllers/RolesController.cs`
*   **Cambios**:
    *   **Backend Global**: Se configuró `ReferenceHandler.IgnoreCycles` en el pipeline de controladores (`AddJsonOptions`) de `Program.cs` para evitar crashes por recursión de grafos en Entity Framework Core.
    *   **Optimización del Controlador**: Se modificó `GetPermisos` en `RolesController.cs` para usar una proyección `Select` explícita, retornando solo los campos primitivos de los permisos necesarios para la interfaz (`Id`, `IdRol`, `IdModulo`, `Leer`, `Crear`, `Editar`, `Eliminar`).
*   **Motivo**: Las propiedades de navegación bidireccionales de Entity Framework Core (como `RolPermiso` -> `Rol` -> `RolPermisos` -> `Rol`...) producían una recursividad circular infinita al serializar la respuesta HTTP, lo que generaba una excepción de ciclo de objetos (`JsonException: A possible object cycle was detected`) y causaba un error 500 al cargar los permisos.

## 16. Corrección de Error de Validación 400 (Campos Rol/Modulo Requeridos) al Modificar Permisos
*   **Archivo Modificado**: `API_SI/API_SI/Models/RolPermiso.cs`
*   **Cambios**:
    *   Se cambiaron las propiedades de navegación de la entidad `RolPermiso` (`Rol` y `Modulo`) para ser tipos anulables (`Rol?` y `Modulo?`) en lugar de tipos no anulables por defecto (`= null!`).
*   **Motivo**: Al habilitar Nullable Reference Types en C#, el validador automático de modelos de ASP.NET Core requería que la petición HTTP de actualización de permisos incluyera los objetos completos `Rol` y `Modulo` anidados en el JSON. Al enviar solo los IDs correspondientes (`idRol` y `idModulo`) sin enviar los objetos completos, la API rechazaba la petición con un error `400 Bad Request` indicando que los campos eran requeridos.

## 17. Sincronización del Formulario de Categorías (Campos Color e Icono Requeridos)
*   **Archivo Modificado**: `FRONT_SI/src/pages/Categorias.jsx`
*   **Cambios**:
    *   Se agregaron las propiedades `color` (por defecto `#ff3b30`) e `icono` (por defecto `tag`) al estado del formulario.
    *   Se añadieron inputs visuales en el modal para que el usuario pueda escribir la clave del icono y seleccionar un color mediante un selector (`type="color"`).
    *   Se actualizó la tabla para mostrar una vista previa del color y las siglas del icono de la categoría.
*   **Motivo**: El modelo del backend `Categoria.cs` y la estructura de la base de datos PostgreSQL definen las columnas `color` e `icono` como `NOT NULL` (requeridas). Dado que el formulario frontend omitía enviar estas variables en el payload `POST/PUT`, el backend rechazaba la creación con un error de validación `400 Bad Request`.

## 18. Corrección de Validación 400 (Campo Tipo Requerido) al Registrar Clientes
*   **Archivos Modificados**: `API_SI/API_SI/Models/Cliente.cs` y `API_SI/API_SI/Controllers/ClientesController.cs`
*   **Cambios**:
    *   **Modelo**: Se cambió la propiedad `Tipo` en `Cliente.cs` a tipo anulable (`string? Tipo`) para que el serializador y el validador del body JSON no lo marquen como requerido.
    *   **Controlador**: Se configuró fallback automático en los métodos `Create` y `Update` de `ClientesController.cs` para asignar el valor `"normal"` si `Tipo` llega nulo o vacío de la petición HTTP.
*   **Motivo**: En el formulario rápido del POS y en el formulario de clientes no se define explícitamente el tipo de cliente. Al ser un campo `NOT NULL` en base de datos y no-anulable en C#, la API rechazaba los registros con un error `400 Bad Request` indicando que el campo `Tipo` es requerido.

## 19. Alineación del Campo Celular/Teléfono del Cliente
*   **Archivos Modificados**: `FRONT_SI/src/pages/Clientes.jsx` y `FRONT_SI/src/pages/POS.jsx`
*   **Cambios**:
    *   Se renombraron todas las referencias de la variable de estado `celular` a `telefono` (`form.celular` -> `form.telefono`, `nuevoCliente.celular` -> `nuevoCliente.telefono`, etc.).
    *   Se actualizaron las propiedades enviadas en la petición POST y PUT para que coincidan con la estructura del modelo C# del backend.
*   **Motivo**: El modelo de datos en C# (`Cliente.cs`) y la columna en la base de datos de Supabase esperan la propiedad `telefono` (o `Telefono` en C#). El frontend estaba enviando y leyendo una propiedad denominada `celular`. Esto hacía que la API guardara el campo en la base de datos como nulo y la interfaz no pudiera mostrarlo a pesar de haberlo digitado.






