# Guía de Commits y Versionado - ElectroShop POS

Esta guía detalla el orden exacto en el que **David**, **Milton** y **Felipe** deben subir los archivos al repositorio. Seguir este orden estricto garantiza que si el profesor u otra persona hace un `git clone` en cualquier punto de la historia, el proyecto no se romperá por dependencias faltantes (ej. código frontend que llama a una API que aún no existe, o controladores que usan modelos no subidos).

## Roles y Enfoque

- **David**: Inicialización, Base de Datos, Configuración Base del Backend, Seguridad (Autenticación) y Gestión de Caja.
- **Milton**: Controladores Maestros (CRUDs), Lógica de Ventas, Compras y Cotizaciones.
- **Felipe**: Inicialización del Frontend, Layout, Componentes React, y Vistas del Sistema.

---

## ⚠️ Instrucciones de Ejecución (Muy Importante)

Dado que ya tienen todo el código en sus computadoras, usaremos un comando especial para ir guardando el historial poco a poco. **Sigan estos pasos exactos**:

1. Creen una copia de seguridad de toda la carpeta `PROYECTO_SI_Combinado` por si acaso.
2. Abran la terminal en la carpeta raíz (`PROYECTO_SI_Combinado`).
3. Si ya existe una carpeta oculta `.git`, bórrenla para empezar de cero limpio.
4. Ejecuten: `git init`
5. Vayan ejecutando **solo los comandos exactos** que aparecen en los recuadros grises a continuación, en el orden estricto del 1 al 27.

*(Nota: En cada commit, Git usa el parámetro `--author` para asignar la autoría al compañero correspondiente, incluso si lo están haciendo desde una sola computadora).*

---

## Secuencia Exacta de Commits (27 Commits)

### Fase 1: Estructura Base y Base de Datos (Para no romper el setup inicial)

**1. Inicialización y Documentación** (David)
```bash
git add README.md CONTEXTOCONSIGNA.md
git commit --author="David <david@correo.com>" -m "chore: inicializacion del repositorio y consigna del proyecto"
```

**2. Script de Base de Datos** (Milton)
```bash
git add DB.sql
git commit --author="Milton <milton@correo.com>" -m "db: creacion del esquema relacional de base de datos en 3FN"
```

**3. Datos de Prueba (Seeding)** (Milton)
```bash
git add supabase_insert_admin.sql supabase_seeding_latam.sql
git commit --author="Milton <milton@correo.com>" -m "db: scripts de insercion y poblacion de datos para entorno de desarrollo"
```

**4. Scaffolding del Backend ASP.NET** (David)
*(Nota: Añade la solución y configuración base, sin código de la API todavía).*
```bash
git add API_SI/API_SI.sln API_SI/API_SI.slnx API_SI/API_SI/API_SI.csproj API_SI/API_SI/appsettings.json API_SI/API_SI/appsettings.Development.json
git commit --author="David <david@correo.com>" -m "chore: scaffolding inicial de la API en ASP.NET Core"
```

**5. Scaffolding del Frontend React** (Felipe)
```bash
git add FRONT_SI/package.json FRONT_SI/vite.config.js FRONT_SI/index.html FRONT_SI/src/main.jsx
git commit --author="Felipe <felipe@correo.com>" -m "chore: scaffolding inicial del frontend React con Vite"
```

### Fase 2: Configuración Core (Preparación de la conexión y layout)

**6. Contexto de BD y Middleware Global** (David)
```bash
git add API_SI/API_SI/Data/AppDbContext.cs API_SI/API_SI/Middleware/ExceptionMiddleware.cs API_SI/API_SI/Program.cs
git commit --author="David <david@correo.com>" -m "feat(api): configuracion del DbContext y middleware de excepciones globales"
```

**7. Configuración de API en Frontend** (Felipe)
```bash
git add FRONT_SI/src/services/api.js FRONT_SI/src/index.css FRONT_SI/src/App.jsx
git commit --author="Felipe <felipe@correo.com>" -m "feat(front): configuracion de interceptores Axios y enrutador global"
```

**8. Componentes del Layout Base** (Felipe)
```bash
git add FRONT_SI/src/components/Sidebar.jsx FRONT_SI/src/components/Sidebar.css FRONT_SI/src/components/Topbar.jsx FRONT_SI/src/components/Topbar.css
git commit --author="Felipe <felipe@correo.com>" -m "feat(front): implementacion del Sidebar y Topbar de navegacion"
```

**9. Componentes UI Reutilizables** (Felipe)
```bash
git add FRONT_SI/src/components/Modal.jsx FRONT_SI/src/components/Toast.jsx FRONT_SI/src/components/ConfirmDialog.jsx
git commit --author="Felipe <felipe@correo.com>" -m "feat(front): creacion de modales y dialogos base para la UI"
```

### Fase 3: Seguridad y Autenticación

**10. Backend: JWT y Autenticación** (David)
```bash
git add API_SI/API_SI/Controllers/AuthController.cs API_SI/API_SI/DTOs/Auth/
git commit --author="David <david@correo.com>" -m "feat(api): endpoints de login y generacion de tokens JWT"
```

**11. Backend: Usuarios y Roles** (David)
```bash
git add API_SI/API_SI/Controllers/TrabajadoresController.cs API_SI/API_SI/Controllers/RolesController.cs API_SI/API_SI/Models/Trabajador.cs API_SI/API_SI/Models/Rol.cs API_SI/API_SI/Models/RolPermiso.cs
git commit --author="David <david@correo.com>" -m "feat(api): crud de trabajadores y gestion de accesos por roles"
```

**12. Frontend: Login y Protección de Rutas** (Felipe)
```bash
git add FRONT_SI/src/context/AuthContext.jsx FRONT_SI/src/pages/Login.jsx FRONT_SI/src/pages/Login.css FRONT_SI/src/pages/Trabajadores.jsx FRONT_SI/src/pages/Roles.jsx
git commit --author="Felipe <felipe@correo.com>" -m "feat(front): modulo de login, contexto auth y paneles de usuarios"
```

### Fase 4: Catálogo y Módulos Maestros

**13. Backend: Categorías y Productos** (Milton)
```bash
git add API_SI/API_SI/Controllers/CategoriasController.cs API_SI/API_SI/Controllers/ProductosController.cs API_SI/API_SI/Models/Categoria.cs API_SI/API_SI/Models/Producto.cs
git commit --author="Milton <milton@correo.com>" -m "feat(api): controladores para el catalogo de productos y categorias"
```

**14. Frontend: Catálogo de Productos** (Felipe)
```bash
git add FRONT_SI/src/pages/Categorias.jsx FRONT_SI/src/pages/Productos.jsx
git commit --author="Felipe <felipe@correo.com>" -m "feat(front): vistas de gestion para categorias y productos"
```

**15. Backend: Clientes y Proveedores** (Milton)
```bash
git add API_SI/API_SI/Controllers/ClientesController.cs API_SI/API_SI/Controllers/ProveedoresController.cs API_SI/API_SI/Models/Cliente.cs API_SI/API_SI/Models/Proveedor.cs API_SI/API_SI/Models/ProveedorCategoria.cs
git commit --author="Milton <milton@correo.com>" -m "feat(api): endpoints para la administracion de clientes y proveedores"
```

**16. Frontend: Clientes y Proveedores** (Felipe)
```bash
git add FRONT_SI/src/pages/Clientes.jsx FRONT_SI/src/pages/Proveedores.jsx
git commit --author="Felipe <felipe@correo.com>" -m "feat(front): interfaces administrativas para clientes y proveedores"
```

### Fase 5: Operativa (Punto de Venta y Cajas)

**17. Backend: Control de Caja** (David)
```bash
git add API_SI/API_SI/Controllers/SesionCajaController.cs API_SI/API_SI/Controllers/MetodoPagoController.cs API_SI/API_SI/Models/SesionCaja.cs API_SI/API_SI/Models/MetodoPago.cs API_SI/API_SI/DTOs/SesionCaja/
git commit --author="David <david@correo.com>" -m "feat(api): modelos y endpoints para apertura y cierre de caja"
```

**18. Frontend: Control de Caja** (Felipe)
```bash
git add FRONT_SI/src/pages/Caja.jsx
git commit --author="Felipe <felipe@correo.com>" -m "feat(front): implementacion del panel de control de sesiones de caja"
```

**19. Backend: Motor de Ventas** (Milton)
```bash
git add API_SI/API_SI/Controllers/VentasController.cs API_SI/API_SI/Models/Venta.cs API_SI/API_SI/Models/VentaDetalle.cs API_SI/API_SI/DTOs/Ventas/
git commit --author="Milton <milton@correo.com>" -m "feat(api): motor de transacciones de ventas y detalles de recibos"
```

**20. Frontend: Punto de Venta (POS)** (Felipe)
```bash
git add FRONT_SI/src/pages/POS.jsx FRONT_SI/src/pages/POS.css FRONT_SI/src/pages/Ventas.jsx
git commit --author="Felipe <felipe@correo.com>" -m "feat(front): terminal punto de venta interactivo y listado de transacciones"
```

### Fase 6: Inventarios, Compras y Extensiones

**21. Backend: Compras e Inventarios** (Milton)
```bash
git add API_SI/API_SI/Controllers/OrdenCompraController.cs API_SI/API_SI/Controllers/MovimientosInventarioController.cs API_SI/API_SI/Models/OrdenCompra.cs API_SI/API_SI/Models/OrdenCompraDetalle.cs API_SI/API_SI/Models/MovimientoInventario.cs API_SI/API_SI/DTOs/OrdenCompra/
git commit --author="Milton <milton@correo.com>" -m "feat(api): gestion de ordenes de compra y kardex de inventario"
```

**22. Backend: Cotizaciones y Devoluciones** (David)
```bash
git add API_SI/API_SI/Controllers/DevolucionesController.cs API_SI/API_SI/Controllers/CotizacionesController.cs API_SI/API_SI/Models/Devolucion.cs API_SI/API_SI/Models/DevolucionDetalle.cs API_SI/API_SI/Models/Cotizacion.cs API_SI/API_SI/Models/CotizacionDetalle.cs API_SI/API_SI/DTOs/Devoluciones/ API_SI/API_SI/DTOs/Cotizaciones/
git commit --author="David <david@correo.com>" -m "feat(api): controladores para procesamiento de devoluciones y presupuestos"
```

**23. Frontend: Módulos Extendidos** (Felipe)
```bash
git add FRONT_SI/src/pages/Compras.jsx FRONT_SI/src/pages/Devoluciones.jsx FRONT_SI/src/pages/Cotizaciones.jsx FRONT_SI/src/pages/Inventario.jsx
git commit --author="Felipe <felipe@correo.com>" -m "feat(front): paneles de gestion de compras, devoluciones, cotizaciones y kardex"
```

### Fase 7: Finalización y Configuraciones Restantes

**24. Backend: Configuración y Validación QR** (David)
```bash
git add API_SI/API_SI/Controllers/ConfiguracionController.cs API_SI/API_SI/Controllers/ValidarController.cs API_SI/API_SI/Models/Configuracion.cs API_SI/API_SI/Models/HistorialTipoCambio.cs API_SI/API_SI/Controllers/PendientesController.cs API_SI/API_SI/Models/PendienteConfiguracion.cs API_SI/API_SI/Models/PendientePeriodo.cs API_SI/API_SI/DTOs/Configuracion/ API_SI/API_SI/DTOs/Pendientes/ API_SI/API_SI/Models/Modulo.cs
git commit --author="David <david@correo.com>" -m "feat(api): configuracion global del negocio e integracion de validacion por QR"
```

**25. Backend: Dashboard y Analíticas** (Milton)
```bash
git add API_SI/API_SI/Controllers/DashboardController.cs API_SI/API_SI/DTOs/Dashboard/
git commit --author="Milton <milton@correo.com>" -m "feat(api): endpoints y agrupamiento de datos para el dashboard y estadisticas"
```

**26. Frontend: Dashboard y Settings** (Felipe)
```bash
git add FRONT_SI/src/pages/Configuracion.jsx FRONT_SI/src/pages/Validar.jsx FRONT_SI/src/pages/Dashboard.jsx FRONT_SI/src/pages/Dashboard.css
git commit --author="Felipe <felipe@correo.com>" -m "feat(front): implementacion del dashboard principal con graficos y validacion de documentos"
```

**27. Commit Final: Resto de archivos sueltos** (Milton)
*(Nota: Añade cualquier archivo de entorno, carpetas vacías o utilería restante para cerrar el proyecto completo).*
```bash
git add .
git commit --author="Milton <milton@correo.com>" -m "chore: ajustes finales y preparacion para despliegue"
```

---

## 🚀 ¿Qué hacer al terminar?

1. Una vez ejecutados todos estos comandos en orden, verifiquen su historial escribiendo:
   ```bash
   git log --oneline
   ```
2. Deberán ver los 27 commits listados con los nombres de **David, Milton y Felipe**.
3. Finalmente, vinculen con su repositorio de GitHub y suban todo:
   ```bash
   git remote add origin https://github.com/SuUsuario/sis321-electroshop-grupo.git
   git branch -M main
   git push -u origin main
   ```
