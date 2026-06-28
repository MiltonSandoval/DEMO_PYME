# Documentación del Proceso de Versionado y Commits

Este documento detalla los cambios, técnicas y herramientas utilizadas durante el proceso de ordenamiento y subida secuencial de commits para el proyecto **ElectroShop POS** en la rama `Desarrollo` del repositorio `git@github.com:MiltonSandoval/DEMO_PYME.git`.

## Detalles del Proceso
- **Objetivo:** Subir de forma coordinada los commits correspondientes a Milton Sandoval siguiendo estrictamente la secuencia de 27 commits definidos en `GUIA_COMMITS.md`.
- **Coordinación en Tiempo Real:** En cada paso del flujo, se verificó el estado remoto del repositorio (`origin/Desarrollo`), se integraron mediante `git pull`/`git merge` los commits completados por David y Felipe, y se procedió a subir los commits correspondientes a Milton cuando correspondía.
- **Autoría:** Los commits de Milton se realizaron utilizando la configuración local (sin el parámetro `--author`), y los de los compañeros fueron integrados directamente desde el repositorio remoto.

## Commits Realizados y Subidos por Milton:
1. **Commit 2:** Creación del esquema relacional de base de datos en 3FN (`DB.sql`).
2. **Commit 3:** Scripts de inserción y población de datos de prueba (`supabase_insert_admin.sql` y `supabase_seeding_latam.sql`).
3. **Commit 13:** Controladores y modelos para el catálogo de productos y categorías (`CategoriasController.cs`, `ProductosController.cs`, `Categoria.cs`, `Producto.cs`).
4. **Commit 15:** Endpoints para la administración de clientes y proveedores (`ClientesController.cs`, `ProveedoresController.cs`, `Cliente.cs`, `Proveedor.cs`, `ProveedorCategoria.cs`).
5. **Commit 19:** Motor de transacciones de ventas y detalles de recibos (`VentasController.cs`, `Venta.cs`, `VentaDetalle.cs`, y DTOs de Ventas).
6. **Commit 21:** Gestión de órdenes de compra y kardex de inventario (`OrdenCompraController.cs`, `MovimientosInventarioController.cs`, y modelos/DTOs asociados).
7. **Commit 25:** Endpoints y agrupamiento de datos para el dashboard y estadísticas (`DashboardController.cs` y DTOs de Dashboard).
8. **Commit 27 (Commit Final):** Ajustes finales y preparación para despliegue (subida de archivos sueltos y configuración restante).

## Optimización de Git
Para asegurar un repositorio limpio y optimizado, se creó un archivo `.gitignore` en la raíz del proyecto para evitar la subida accidental de:
- Metadatos de Visual Studio (`.vs/`).
- Archivos de configuración de usuario (`*.csproj.user`, `slnx.sqlite`).
- Artefactos de compilación (`bin/`, `obj/`).
- Módulos de Node en el frontend (`node_modules/`, `dist/`).
