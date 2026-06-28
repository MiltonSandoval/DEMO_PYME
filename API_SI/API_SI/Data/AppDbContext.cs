using Microsoft.EntityFrameworkCore;
using API_SI.Models;
using System;

namespace API_SI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Configuracion> Configuraciones { get; set; } = null!;
        public DbSet<MetodoPago> MetodosPago { get; set; } = null!;
        public DbSet<HistorialTipoCambio> HistorialTiposCambio { get; set; } = null!;
        public DbSet<Rol> Roles { get; set; } = null!;
        public DbSet<Modulo> Modulos { get; set; } = null!;
        public DbSet<RolPermiso> RolPermisos { get; set; } = null!;
        public DbSet<Categoria> Categorias { get; set; } = null!;
        public DbSet<Trabajador> Trabajadores { get; set; } = null!;
        public DbSet<Cliente> Clientes { get; set; } = null!;
        public DbSet<Proveedor> Proveedores { get; set; } = null!;
        public DbSet<ProveedorCategoria> ProveedorCategorias { get; set; } = null!;
        public DbSet<Producto> Productos { get; set; } = null!;
        public DbSet<Venta> Ventas { get; set; } = null!;
        public DbSet<VentaDetalle> VentaDetalles { get; set; } = null!;
        public DbSet<SesionCaja> SesionesCaja { get; set; } = null!;
        public DbSet<OrdenCompra> OrdenesCompra { get; set; } = null!;
        public DbSet<OrdenCompraDetalle> OrdenCompraDetalles { get; set; } = null!;
        public DbSet<Devolucion> Devoluciones { get; set; } = null!;
        public DbSet<DevolucionDetalle> DevolucionDetalles { get; set; } = null!;
        public DbSet<MovimientoInventario> MovimientosInventario { get; set; } = null!;
        public DbSet<Cotizacion> Cotizaciones { get; set; } = null!;
        public DbSet<CotizacionDetalle> CotizacionDetalles { get; set; } = null!;
        public DbSet<PendienteConfiguracion> PendientesConfiguracion { get; set; } = null!;
        public DbSet<PendientePeriodo> PendientesPeriodo { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Table Mapping (Singular names matching DB.sql)
            modelBuilder.Entity<Configuracion>().ToTable("Configuracion");
            modelBuilder.Entity<MetodoPago>().ToTable("MetodoPago");
            modelBuilder.Entity<HistorialTipoCambio>().ToTable("HistorialTipoCambio");
            modelBuilder.Entity<Rol>().ToTable("Rol");
            modelBuilder.Entity<Modulo>().ToTable("Modulo");
            modelBuilder.Entity<RolPermiso>().ToTable("RolPermiso");
            modelBuilder.Entity<Categoria>().ToTable("Categoria");
            modelBuilder.Entity<Trabajador>().ToTable("Trabajador");
            modelBuilder.Entity<Cliente>().ToTable("Cliente");
            modelBuilder.Entity<Proveedor>().ToTable("Proveedor");
            modelBuilder.Entity<ProveedorCategoria>().ToTable("ProveedorCategoria");
            modelBuilder.Entity<Producto>().ToTable("Producto");
            modelBuilder.Entity<Venta>().ToTable("Venta");
            modelBuilder.Entity<VentaDetalle>().ToTable("VentaDetalle");
            modelBuilder.Entity<SesionCaja>().ToTable("SesionCaja");
            modelBuilder.Entity<OrdenCompra>().ToTable("OrdenCompra");
            modelBuilder.Entity<OrdenCompraDetalle>().ToTable("OrdenCompraDetalle");
            modelBuilder.Entity<Devolucion>().ToTable("Devolucion");
            modelBuilder.Entity<DevolucionDetalle>().ToTable("DevolucionDetalle");
            modelBuilder.Entity<MovimientoInventario>().ToTable("MovimientoInventario");
            modelBuilder.Entity<Cotizacion>().ToTable("Cotizacion");
            modelBuilder.Entity<CotizacionDetalle>().ToTable("CotizacionDetalle");
            modelBuilder.Entity<PendienteConfiguracion>().ToTable("PendienteConfiguracion");
            modelBuilder.Entity<PendientePeriodo>().ToTable("PendientePeriodo");

            // Precision configurations for Decimal types
            modelBuilder.Entity<Configuracion>().Property(c => c.Iva).HasPrecision(5, 2);
            modelBuilder.Entity<Configuracion>().Property(c => c.TipoCambio).HasPrecision(10, 4);

            modelBuilder.Entity<HistorialTipoCambio>().Property(h => h.TipoCambioAnterior).HasPrecision(10, 4);
            modelBuilder.Entity<HistorialTipoCambio>().Property(h => h.TipoCambioNuevo).HasPrecision(10, 4);

            modelBuilder.Entity<Trabajador>().Property(t => t.Salario).HasPrecision(10, 2);

            modelBuilder.Entity<Cliente>().Property(c => c.TotalGastado).HasPrecision(12, 2);

            modelBuilder.Entity<Producto>().Property(p => p.PrecioCompra).HasPrecision(10, 2);
            modelBuilder.Entity<Producto>().Property(p => p.PrecioVenta).HasPrecision(10, 2);

            modelBuilder.Entity<Venta>().Property(v => v.Subtotal).HasPrecision(12, 2);
            modelBuilder.Entity<Venta>().Property(v => v.Descuento).HasPrecision(5, 2);
            modelBuilder.Entity<Venta>().Property(v => v.MontoDescuento).HasPrecision(12, 2);
            modelBuilder.Entity<Venta>().Property(v => v.Impuesto).HasPrecision(12, 2);
            modelBuilder.Entity<Venta>().Property(v => v.Total).HasPrecision(12, 2);
            modelBuilder.Entity<Venta>().Property(v => v.EfectivoRecibido).HasPrecision(12, 2);

            modelBuilder.Entity<VentaDetalle>().Property(vd => vd.PrecioUnitario).HasPrecision(10, 2);
            modelBuilder.Entity<VentaDetalle>().Property(vd => vd.Subtotal).HasPrecision(12, 2);

            modelBuilder.Entity<SesionCaja>().Property(s => s.MontoApertura).HasPrecision(12, 2);
            modelBuilder.Entity<SesionCaja>().Property(s => s.MontoCierre).HasPrecision(12, 2);
            modelBuilder.Entity<SesionCaja>().Property(s => s.MontoEsperado).HasPrecision(12, 2);
            modelBuilder.Entity<SesionCaja>().Property(s => s.Diferencia).HasPrecision(12, 2);
            modelBuilder.Entity<SesionCaja>().Property(s => s.ConteoEfectivo).HasColumnType("jsonb");

            modelBuilder.Entity<OrdenCompra>().Property(o => o.Subtotal).HasPrecision(12, 2);
            modelBuilder.Entity<OrdenCompra>().Property(o => o.Impuesto).HasPrecision(12, 2);
            modelBuilder.Entity<OrdenCompra>().Property(o => o.Total).HasPrecision(12, 2);

            modelBuilder.Entity<OrdenCompraDetalle>().Property(od => od.CostoUnitario).HasPrecision(10, 2);
            modelBuilder.Entity<OrdenCompraDetalle>().Property(od => od.Subtotal).HasPrecision(12, 2);

            modelBuilder.Entity<Devolucion>().Property(d => d.Total).HasPrecision(12, 2);

            modelBuilder.Entity<DevolucionDetalle>().Property(dd => dd.PrecioUnitario).HasPrecision(10, 2);
            modelBuilder.Entity<DevolucionDetalle>().Property(dd => dd.Subtotal).HasPrecision(12, 2);

            modelBuilder.Entity<Cotizacion>().Property(c => c.DescuentoGlobal).HasPrecision(5, 2);
            modelBuilder.Entity<Cotizacion>().Property(c => c.Subtotal).HasPrecision(12, 2);
            modelBuilder.Entity<Cotizacion>().Property(c => c.MontoDescuento).HasPrecision(12, 2);
            modelBuilder.Entity<Cotizacion>().Property(c => c.Total).HasPrecision(12, 2);
            modelBuilder.Entity<Cotizacion>().Property(c => c.TotalMonedaLocal).HasPrecision(12, 2);
            modelBuilder.Entity<Cotizacion>().Property(c => c.TipoCambio).HasPrecision(10, 4);

            modelBuilder.Entity<CotizacionDetalle>().Property(cd => cd.PrecioUnitario).HasPrecision(10, 2);
            modelBuilder.Entity<CotizacionDetalle>().Property(cd => cd.Descuento).HasPrecision(5, 2);
            modelBuilder.Entity<CotizacionDetalle>().Property(cd => cd.Subtotal).HasPrecision(12, 2);

            modelBuilder.Entity<PendienteConfiguracion>().Property(pc => pc.Ahorros).HasPrecision(12, 2);
            modelBuilder.Entity<PendienteConfiguracion>().Property(pc => pc.Gastos).HasPrecision(12, 2);
            modelBuilder.Entity<PendienteConfiguracion>().Property(pc => pc.Facturas).HasPrecision(12, 2);
            modelBuilder.Entity<PendienteConfiguracion>().Property(pc => pc.Alquiler).HasPrecision(12, 2);

            modelBuilder.Entity<PendientePeriodo>().Property(pp => pp.IngresoBruto).HasPrecision(12, 2);
            modelBuilder.Entity<PendientePeriodo>().Property(pp => pp.Ahorros).HasPrecision(12, 2);
            modelBuilder.Entity<PendientePeriodo>().Property(pp => pp.Gastos).HasPrecision(12, 2);
            modelBuilder.Entity<PendientePeriodo>().Property(pp => pp.Facturas).HasPrecision(12, 2);
            modelBuilder.Entity<PendientePeriodo>().Property(pp => pp.Alquiler).HasPrecision(12, 2);
            modelBuilder.Entity<PendientePeriodo>().Property(pp => pp.TotalFijo).HasPrecision(12, 2);
            modelBuilder.Entity<PendientePeriodo>().Property(pp => pp.Sobrante).HasPrecision(12, 2);

            // Composite Key for ProveedorCategoria
            modelBuilder.Entity<ProveedorCategoria>()
                .HasKey(pc => new { pc.IdProveedor, pc.IdCategoria });

            // Relationships
            modelBuilder.Entity<ProveedorCategoria>()
                .HasOne(pc => pc.Proveedor)
                .WithMany(p => p.ProveedorCategorias)
                .HasForeignKey(pc => pc.IdProveedor);

            modelBuilder.Entity<ProveedorCategoria>()
                .HasOne(pc => pc.Categoria)
                .WithMany(c => c.ProveedorCategorias)
                .HasForeignKey(pc => pc.IdCategoria);

            modelBuilder.Entity<RolPermiso>()
                .HasIndex(rp => new { rp.IdRol, rp.IdModulo })
                .IsUnique();

            modelBuilder.Entity<RolPermiso>()
                .HasOne(rp => rp.Rol)
                .WithMany(r => r.RolPermisos)
                .HasForeignKey(rp => rp.IdRol)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RolPermiso>()
                .HasOne(rp => rp.Modulo)
                .WithMany(m => m.RolPermisos)
                .HasForeignKey(rp => rp.IdModulo)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<HistorialTipoCambio>()
                .HasOne(h => h.Trabajador)
                .WithMany(t => t.HistorialTipoCambios)
                .HasForeignKey(h => h.IdTrabajador)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Trabajador>()
                .HasOne(t => t.Rol)
                .WithMany(r => r.Trabajadores)
                .HasForeignKey(t => t.IdRol)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Producto>()
                .HasOne(p => p.Categoria)
                .WithMany(c => c.Productos)
                .HasForeignKey(p => p.IdCategoria)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Producto>()
                .HasOne(p => p.Proveedor)
                .WithMany(pr => pr.Productos)
                .HasForeignKey(p => p.IdProveedor)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Venta>()
                .HasOne(v => v.Cliente)
                .WithMany(c => c.Ventas)
                .HasForeignKey(v => v.IdCliente)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Venta>()
                .HasOne(v => v.Trabajador)
                .WithMany(t => t.Ventas)
                .HasForeignKey(v => v.IdTrabajador)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Venta>()
                .HasOne(v => v.MetodoPago)
                .WithMany(m => m.Ventas)
                .HasForeignKey(v => v.IdMetodoPago)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<VentaDetalle>()
                .HasOne(vd => vd.Venta)
                .WithMany(v => v.VentaDetalles)
                .HasForeignKey(vd => vd.IdVenta)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<VentaDetalle>()
                .HasOne(vd => vd.Producto)
                .WithMany(p => p.VentaDetalles)
                .HasForeignKey(vd => vd.IdProducto)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<SesionCaja>()
                .HasOne(s => s.Trabajador)
                .WithMany(t => t.SesionesCaja)
                .HasForeignKey(s => s.IdTrabajador)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<OrdenCompra>()
                .HasOne(o => o.Proveedor)
                .WithMany(p => p.OrdenesCompra)
                .HasForeignKey(o => o.IdProveedor)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<OrdenCompra>()
                .HasOne(o => o.Trabajador)
                .WithMany(t => t.OrdenesCompra)
                .HasForeignKey(o => o.IdTrabajador)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<OrdenCompraDetalle>()
                .HasOne(od => od.OrdenCompra)
                .WithMany(o => o.OrdenCompraDetalles)
                .HasForeignKey(od => od.IdOrdenCompra)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<OrdenCompraDetalle>()
                .HasOne(od => od.Producto)
                .WithMany(p => p.OrdenCompraDetalles)
                .HasForeignKey(od => od.IdProducto)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Devolucion>()
                .HasOne(d => d.Venta)
                .WithMany(v => v.Devoluciones)
                .HasForeignKey(d => d.IdVenta)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Devolucion>()
                .HasOne(d => d.Trabajador)
                .WithMany(t => t.Devoluciones)
                .HasForeignKey(d => d.IdTrabajador)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<DevolucionDetalle>()
                .HasOne(dd => dd.Devolucion)
                .WithMany(d => d.DevolucionDetalles)
                .HasForeignKey(dd => dd.IdDevolucion)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DevolucionDetalle>()
                .HasOne(dd => dd.Producto)
                .WithMany(p => p.DevolucionDetalles)
                .HasForeignKey(dd => dd.IdProducto)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<MovimientoInventario>()
                .HasOne(m => m.Producto)
                .WithMany(p => p.MovimientosInventario)
                .HasForeignKey(m => m.IdProducto)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<MovimientoInventario>()
                .HasOne(m => m.Proveedor)
                .WithMany(p => p.MovimientosInventario)
                .HasForeignKey(m => m.IdProveedor)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<MovimientoInventario>()
                .HasOne(m => m.Trabajador)
                .WithMany(t => t.MovimientosInventario)
                .HasForeignKey(m => m.IdTrabajador)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Cotizacion>()
                .HasOne(c => c.Cliente)
                .WithMany(cl => cl.Cotizaciones)
                .HasForeignKey(c => c.IdCliente)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Cotizacion>()
                .HasOne(c => c.Trabajador)
                .WithMany(t => t.Cotizaciones)
                .HasForeignKey(c => c.IdTrabajador)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CotizacionDetalle>()
                .HasOne(cd => cd.Cotizacion)
                .WithMany(c => c.CotizacionDetalles)
                .HasForeignKey(cd => cd.IdCotizacion)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CotizacionDetalle>()
                .HasOne(cd => cd.Producto)
                .WithMany(p => p.CotizacionDetalles)
                .HasForeignKey(cd => cd.IdProducto)
                .OnDelete(DeleteBehavior.Restrict);

            // Singleton check constraints
            modelBuilder.Entity<Configuracion>()
                .HasCheckConstraint("chk_config_singleton", "Id = 1");

            modelBuilder.Entity<PendienteConfiguracion>()
                .HasCheckConstraint("chk_pendiente_singleton", "Id = 1");

            // Convertir todas las tablas y columnas a minúsculas para PostgreSQL
            foreach (var entity in modelBuilder.Model.GetEntityTypes())
            {
                var tableName = entity.GetTableName();
                if (tableName != null)
                {
                    entity.SetTableName(tableName.ToLower());
                }

                foreach (var property in entity.GetProperties())
                {
                    property.SetColumnName(property.Name.ToLower());
                }
            }

            // Seed Data
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            // Seed Roles
            modelBuilder.Entity<Rol>().HasData(
                new Rol { Id = 1, Nombre = "Administrador", Descripcion = "Administrador con acceso total", Color = "#FF0000", EsSistema = true, CreadoEn = DateTimeOffset.Parse("2026-01-01T00:00:00Z"), ActualizadoEn = DateTimeOffset.Parse("2026-01-01T00:00:00Z") },
                new Rol { Id = 2, Nombre = "Cajero", Descripcion = "Cajero de ventas y arqueos", Color = "#00FF00", EsSistema = true, CreadoEn = DateTimeOffset.Parse("2026-01-01T00:00:00Z"), ActualizadoEn = DateTimeOffset.Parse("2026-01-01T00:00:00Z") },
                new Rol { Id = 3, Nombre = "Vendedor", Descripcion = "Vendedor de productos y cotizaciones", Color = "#0000FF", EsSistema = true, CreadoEn = DateTimeOffset.Parse("2026-01-01T00:00:00Z"), ActualizadoEn = DateTimeOffset.Parse("2026-01-01T00:00:00Z") },
                new Rol { Id = 4, Nombre = "Repartidor", Descripcion = "Repartidor de pedidos delivery", Color = "#FFFF00", EsSistema = true, CreadoEn = DateTimeOffset.Parse("2026-01-01T00:00:00Z"), ActualizadoEn = DateTimeOffset.Parse("2026-01-01T00:00:00Z") }
            );

            // Seed Modulos
            modelBuilder.Entity<Modulo>().HasData(
                new Modulo { Id = 1, Clave = "dashboard", Nombre = "Dashboard", Orden = 1 },
                new Modulo { Id = 2, Clave = "pos", Nombre = "Punto de Venta (POS)", Orden = 2 },
                new Modulo { Id = 3, Clave = "productos", Nombre = "Productos", Orden = 3 },
                new Modulo { Id = 4, Clave = "categorias", Nombre = "Categorías", Orden = 4 },
                new Modulo { Id = 5, Clave = "clientes", Nombre = "Clientes", Orden = 5 },
                new Modulo { Id = 6, Clave = "trabajadores", Nombre = "Trabajadores", Orden = 6 },
                new Modulo { Id = 7, Clave = "proveedores", Nombre = "Proveedores", Orden = 7 },
                new Modulo { Id = 8, Clave = "inventario", Nombre = "Inventario", Orden = 8 },
                new Modulo { Id = 9, Clave = "ventas", Nombre = "Ventas", Orden = 9 },
                new Modulo { Id = 10, Clave = "cotizaciones", Nombre = "Cotizaciones", Orden = 10 },
                new Modulo { Id = 11, Clave = "compras", Nombre = "Órdenes de Compra", Orden = 11 },
                new Modulo { Id = 12, Clave = "devoluciones", Nombre = "Devoluciones", Orden = 12 },
                new Modulo { Id = 13, Clave = "caja", Nombre = "Control de Caja", Orden = 13 },
                new Modulo { Id = 14, Clave = "reportes", Nombre = "Reportes Financieros", Orden = 14 },
                new Modulo { Id = 15, Clave = "configuracion", Nombre = "Configuración", Orden = 15 }
            );

            // Seed RolPermisos for Rol 1 (Administrador)
            for (int i = 1; i <= 15; i++)
            {
                modelBuilder.Entity<RolPermiso>().HasData(
                    new RolPermiso { Id = i, IdRol = 1, IdModulo = i, Leer = true, Crear = true, Editar = true, Eliminar = true }
                );
            }

            // Seed Trabajador (Admin Inicial)
            // BCrypt hash of "Admin123!"
            string hashedPassword = BCrypt.Net.BCrypt.HashPassword("Admin123!");
            modelBuilder.Entity<Trabajador>().HasData(
                new Trabajador
                {
                    Id = 1,
                    Nombre = "Administrador Inicial",
                    IdRol = 1,
                    Email = "admin@electroshop.com",
                    Password = hashedPassword,
                    Telefono = "00000000",
                    Direccion = "Sede Principal",
                    Estado = "activo",
                    FechaIngreso = new DateOnly(2026, 1, 1),
                    Salario = 1000.00m,
                    Avatar = "A",
                    ColorAvatar = "#FF0000",
                    CreadoEn = DateTimeOffset.Parse("2026-01-01T00:00:00Z"),
                    ActualizadoEn = DateTimeOffset.Parse("2026-01-01T00:00:00Z")
                }
            );

            // Seed Configuracion
            modelBuilder.Entity<Configuracion>().HasData(
                new Configuracion
                {
                    Id = 1,
                    Nombre = "ElectroShop POS",
                    RazonSocial = "ElectroShop S.A.",
                    Ruc = "1234567890",
                    Direccion = "Av. Principal 123",
                    Ciudad = "Caracas",
                    Pais = "Venezuela",
                    Telefono = "0212-5555555",
                    Celular = "0412-5555555",
                    Email = "contacto@electroshop.com",
                    SitioWeb = "www.electroshop.com",
                    RegimenTributario = "Contribuyente Especial",
                    LogoImagen = null,
                    Iva = 16.00m,
                    PrefijoFactura = "FAC-",
                    SecuencialFactura = 1,
                    SecuencialCotizacion = 1,
                    MonedaBase = "USD",
                    SimboloMoneda = "$",
                    MonedaVisualizacion = "USD",
                    TipoCambio = 36.5000m,
                    MensajeRecibo = "¡Gracias por su compra!",
                    PieFactura = "ElectroShop - Su aliado en tecnología",
                    PlantillaRecibo = "T1",
                    PlantillaCotizacion = "T1",
                    CodigoPaisWhatsapp = "58",
                    MensajeWhatsapp = "Hola, adjuntamos su documento.",
                    ClaveFirmaDigital = null,
                    CreadoEn = DateTimeOffset.Parse("2026-01-01T00:00:00Z"),
                    ActualizadoEn = DateTimeOffset.Parse("2026-01-01T00:00:00Z")
                }
            );

            // Seed Metodos de Pago
            modelBuilder.Entity<MetodoPago>().HasData(
                new MetodoPago { Id = 1, Clave = "efectivo", Nombre = "Efectivo Tienda", Activo = true, CreadoEn = DateTimeOffset.Parse("2026-01-01T00:00:00Z"), ActualizadoEn = DateTimeOffset.Parse("2026-01-01T00:00:00Z") },
                new MetodoPago { Id = 2, Clave = "transferencia", Nombre = "Transferencia / QR", Activo = true, CreadoEn = DateTimeOffset.Parse("2026-01-01T00:00:00Z"), ActualizadoEn = DateTimeOffset.Parse("2026-01-01T00:00:00Z") },
                new MetodoPago { Id = 3, Clave = "delivery", Nombre = "Delivery", Activo = true, CreadoEn = DateTimeOffset.Parse("2026-01-01T00:00:00Z"), ActualizadoEn = DateTimeOffset.Parse("2026-01-01T00:00:00Z") }
            );

            // Seed PendienteConfiguracion
            modelBuilder.Entity<PendienteConfiguracion>().HasData(
                new PendienteConfiguracion { Id = 1, Ahorros = 0.00m, Gastos = 0.00m, Facturas = 0.00m, Alquiler = 0.00m, ActualizadoEn = DateTimeOffset.Parse("2026-01-01T00:00:00Z") }
            );
        }
    }
}
