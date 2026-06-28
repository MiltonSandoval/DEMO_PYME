-- ====================================================================
-- SCRIPT DE BASE DE DATOS: DATOS DE PRUEBA LATINOAMERICANOS (SEEDING)
-- Diseñado para ejecutarse en el editor SQL de Supabase (PostgreSQL).
-- Contiene más de 100 registros cruzados respetando llaves foráneas.
-- ====================================================================

-- Asegurar que la extensión pgcrypto esté activa para la encriptación de contraseñas
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Limpieza preventiva para evitar colisiones durante la demo (opcional pero recomendada)
TRUNCATE TABLE public.ventadetalle CASCADE;
TRUNCATE TABLE public.venta CASCADE;
TRUNCATE TABLE public.movimientoinventario CASCADE;
TRUNCATE TABLE public.producto CASCADE;
TRUNCATE TABLE public.proveedorcategoria CASCADE;
TRUNCATE TABLE public.proveedor CASCADE;
TRUNCATE TABLE public.categoria CASCADE;
TRUNCATE TABLE public.trabajador CASCADE;
TRUNCATE TABLE public.rolpermiso CASCADE;
TRUNCATE TABLE public.rol CASCADE;
TRUNCATE TABLE public.modulo CASCADE;
TRUNCATE TABLE public.metodopago CASCADE;
TRUNCATE TABLE public.configuracion CASCADE;

-- 1. Insertar Métodos de Pago
INSERT INTO public.metodopago (clave, nombre, icono, activo, banco, nombrecuenta, numerocuenta, titular) VALUES
('Efectivo', 'Efectivo en Caja', 'cash', true, NULL, NULL, NULL, NULL),
('Tarjeta', 'Tarjeta de Débito/Crédito', 'card', true, 'Banco Nacional de Bolivia', 'Caja de Ahorros', '100-293847-2', 'ElectroShop S.R.L.'),
('QR', 'Pago Simple QR', 'qr', true, 'Banco Mercantil Santa Cruz', 'Cuenta Corriente', '401-928374-1', 'ElectroShop S.R.L.');

-- 2. Insertar Módulos
INSERT INTO public.modulo (clave, nombre, orden) VALUES
('Dashboard', 'Dashboard General', 1),
('POS', 'Punto de Venta (POS)', 2),
('Caja', 'Control de Caja', 3),
('Productos', 'Inventario Productos', 4),
('Categorias', 'Categorías de Prod.', 5),
('Clientes', 'Registro de Clientes', 6),
('Trabajadores', 'Personal / Trabajadores', 7),
('Proveedores', 'Gestión Proveedores', 8),
('Ventas', 'Historial Ventas', 9),
('Cotizaciones', 'Módulo Cotizaciones', 10),
('Compras', 'Órdenes de Compra', 11),
('Devoluciones', 'Devoluciones Clientes', 12),
('Inventario', 'Movim. Inventario', 13),
('Roles', 'Roles y Permisos', 14),
('Configuracion', 'Ajustes Sistema', 15);

-- 3. Insertar Roles (5 Roles de negocio)
INSERT INTO public.rol (nombre, descripcion, color, essistema) VALUES
('Administrador', 'Acceso total y configuración global del sistema', '#E11D48', true),
('Gerente de Ventas', 'Supervisión de transacciones y generación de reportes analíticos', '#2563EB', false),
('Cajero / Operador', 'Operaciones diarias de venta y apertura/cierre de caja', '#16A34A', false),
('Supervisor de Almacén', 'Administración de stock, compras y movimientos de inventario', '#D97706', false),
('Soporte Técnico', 'Mantenimiento del software y configuraciones básicas', '#7C3AED', true);

-- 4. Insertar Permisos de Roles (75 Registros: 5 roles * 15 módulos)
-- Permisos totales para el Administrador
INSERT INTO public.rolpermiso (idrol, idmodulo, leer, crear, editar, eliminar)
SELECT (SELECT id FROM public.rol WHERE nombre = 'Administrador'), m.id, true, true, true, true FROM public.modulo m;

-- Permisos para Gerente de Ventas (Leer todos, crear/editar ventas y clientes, no eliminar)
INSERT INTO public.rolpermiso (idrol, idmodulo, leer, crear, editar, eliminar)
SELECT (SELECT id FROM public.rol WHERE nombre = 'Gerente de Ventas'), m.id, true, 
       CASE WHEN m.clave IN ('POS', 'Clientes', 'Devoluciones') THEN true ELSE false END,
       CASE WHEN m.clave IN ('POS', 'Clientes') THEN true ELSE false END,
       false
FROM public.modulo m;

-- Permisos para Cajero / Operador (Solo POS, Clientes, Caja y Ventas)
INSERT INTO public.rolpermiso (idrol, idmodulo, leer, crear, editar, eliminar)
SELECT (SELECT id FROM public.rol WHERE nombre = 'Cajero / Operador'), m.id,
       CASE WHEN m.clave IN ('Dashboard', 'POS', 'Caja', 'Clientes', 'Ventas') THEN true ELSE false END,
       CASE WHEN m.clave IN ('POS', 'Caja', 'Clientes') THEN true ELSE false END,
       CASE WHEN m.clave IN ('Clientes') THEN true ELSE false END,
       false
FROM public.modulo m;

-- Permisos para Supervisor de Almacén (Productos, Categorías, Proveedores, Inventario, Compras)
INSERT INTO public.rolpermiso (idrol, idmodulo, leer, crear, editar, eliminar)
SELECT (SELECT id FROM public.rol WHERE nombre = 'Supervisor de Almacén'), m.id,
       CASE WHEN m.clave IN ('Dashboard', 'Productos', 'Categorias', 'Proveedores', 'Inventario', 'Compras') THEN true ELSE false END,
       CASE WHEN m.clave IN ('Productos', 'Categorias', 'Proveedores', 'Inventario', 'Compras') THEN true ELSE false END,
       CASE WHEN m.clave IN ('Productos', 'Categorias', 'Proveedores') THEN true ELSE false END,
       false
FROM public.modulo m;

-- Permisos para Soporte Técnico
INSERT INTO public.rolpermiso (idrol, idmodulo, leer, crear, editar, eliminar)
SELECT (SELECT id FROM public.rol WHERE nombre = 'Soporte Técnico'), m.id, true, false, true, false FROM public.modulo m;

-- 5. Insertar Trabajadores (5 Cuentas reales con hash de contraseña 'admin123' o 'user123')
INSERT INTO public.trabajador (nombre, idrol, email, password, telefono, direccion, estado, fechaingreso, salario, coloravatar) VALUES
('Milton Sandoval (Admin)', (SELECT id FROM public.rol WHERE nombre = 'Administrador'), 'milton@electroshop.com', crypt('admin123', gen_salt('bf', 10)), '71234567', 'Av. Beni entre 3er y 4to Anillo, Santa Cruz', 'activo', '2025-01-15', 5500.00, '#E11D48'),
('Felipe Salvatierra (Gerente)', (SELECT id FROM public.rol WHERE nombre = 'Gerente de Ventas'), 'felipe@electroshop.com', crypt('user123', gen_salt('bf', 10)), '68923456', 'Plan 3000, Calle 5, Santa Cruz', 'activo', '2025-02-10', 4200.00, '#2563EB'),
('David Gorena (Cajero)', (SELECT id FROM public.rol WHERE nombre = 'Cajero / Operador'), 'david@electroshop.com', crypt('user123', gen_salt('bf', 10)), '75489312', 'Av. Melchor Pinto #120, Santa Cruz', 'activo', '2025-03-01', 2800.00, '#16A34A'),
('Carlos Condori (Almacén)', (SELECT id FROM public.rol WHERE nombre = 'Supervisor de Almacén'), 'carlos@electroshop.com', crypt('user123', gen_salt('bf', 10)), '70129384', 'Zona Villa Fátima, La Paz', 'activo', '2025-03-12', 3200.00, '#D97706'),
('Sofía Rojas (Soporte)', (SELECT id FROM public.rol WHERE nombre = 'Soporte Técnico'), 'sofia@electroshop.com', crypt('user123', gen_salt('bf', 10)), '67201938', 'Zona Sur, Calacoto Calle 15, La Paz', 'activo', '2025-04-01', 3500.00, '#7C3AED');

-- 6. Insertar Categorías (10 Categorías comerciales)
INSERT INTO public.categoria (nombre, descripcion, icono, color) VALUES
('Laptops', 'Computadoras portátiles de oficina y gaming', 'laptop', '#4F46E5'),
('Celulares', 'Smartphones Android y Apple y sus accesorios principales', 'phone', '#10B981'),
('Monitores', 'Pantallas de alta resolución para productividad y juegos', 'monitor', '#3B82F6'),
('Componentes', 'Procesadores, Tarjetas de video, RAM y fuentes de poder', 'cpu', '#F59E0B'),
('Accesorios', 'Mouse, teclados, parlantes y cables', 'mouse', '#EC4899'),
('Almacenamiento', 'Discos duros sólidos (SSD), externos y memorias USB', 'database', '#8B5CF6'),
('Impresoras', 'Equipos de impresión y cartuchos de tinta/tóner', 'printer', '#06B6D4'),
('Redes y Connectividad', 'Routers, switches, antenas y cableado estructurado', 'wifi', '#059669'),
('Audio', 'Audífonos inalámbricos, diademas y barras de sonido', 'volume-2', '#EF4444'),
('Consolas y Videojuegos', 'Consolas PlayStation, Nintendo Switch y accesorios de juego', 'gamepad-2', '#6366F1');

-- 7. Insertar Proveedores (5 Proveedores importadores)
INSERT INTO public.proveedor (nombre, contacto, ruc, email, telefono, direccion, condicionpago, estado) VALUES
('Importadora Mayorista El Alto S.R.L.', 'Lic. Jorge Mamani', '1029384029', 'ventas@mayoristaelalto.com', '2-2819283', 'Av. 6 de Marzo #450, El Alto', 'credito', 'activo'),
('Tecnología Global Santa Cruz', 'Ing. Patricia Vaca', '2938471029', 'contacto@tecglobal.bo', '3-3482938', 'Av. Banzer Km 5, Santa Cruz', 'contado', 'activo'),
('Distribuidora Cochabamba S.A.', 'Sr. Roberto Vargas', '3029182049', 'roberto.vargas@districocha.com', '4-4293847', 'Av. Heroínas #890, Cochabamba', 'credito', 'activo'),
('Suministros Digitales Bolivia', 'Ing. Luis Condori', '4019283049', 'luis.condori@sumidigital.bo', '71092837', 'Calle Murillo #1025, La Paz', 'contado', 'activo'),
('ElectroImportaciones Chuquisaca', 'Sra. Clara Ortiz', '5029384019', 'ortiz.clara@electroimport.com', '4-6428938', 'Calle Calvo #120, Sucre', 'credito', 'activo');

-- 8. Insertar Productos (25 Productos tecnológicos)
INSERT INTO public.producto (codigo, nombre, idcategoria, preciocompra, precioventa, stock, stockminimo, unidad, estado, idproveedor, unidadesvendidas) VALUES
('LPT-ASUS-01', 'Laptop ASUS TUF Gaming F15 16GB', (SELECT id FROM public.categoria WHERE nombre = 'Laptops'), 750.00, 950.00, 15, 3, 'unidad', 'activo', (SELECT id FROM public.proveedor WHERE nombre = 'Importadora Mayorista El Alto S.R.L.'), 0),
('LPT-HP-02', 'Laptop HP Pavilion 14 Ryzen 5 8GB', (SELECT id FROM public.categoria WHERE nombre = 'Laptops'), 480.00, 620.00, 20, 4, 'unidad', 'activo', (SELECT id FROM public.proveedor WHERE nombre = 'Importadora Mayorista El Alto S.R.L.'), 0),
('CEL-XIA-01', 'Smartphone Xiaomi Redmi Note 13 Pro', (SELECT id FROM public.categoria WHERE nombre = 'Celulares'), 210.00, 280.00, 40, 5, 'unidad', 'activo', (SELECT id FROM public.proveedor WHERE nombre = 'Tecnología Global Santa Cruz'), 0),
('CEL-SAMS-02', 'Smartphone Samsung Galaxy S24 Ultra', (SELECT id FROM public.categoria WHERE nombre = 'Celulares'), 900.00, 1200.00, 8, 2, 'unidad', 'activo', (SELECT id FROM public.proveedor WHERE nombre = 'Tecnología Global Santa Cruz'), 0),
('MON-LG-24', 'Monitor LG 24" IPS Full HD 75Hz', (SELECT id FROM public.categoria WHERE nombre = 'Monitores'), 110.00, 155.00, 25, 5, 'unidad', 'activo', (SELECT id FROM public.proveedor WHERE nombre = 'Distribuidora Cochabamba S.A.'), 0),
('MON-SAMS-27', 'Monitor Samsung Odyssey G3 27" 144Hz', (SELECT id FROM public.categoria WHERE nombre = 'Monitores'), 190.00, 260.00, 12, 3, 'unidad', 'activo', (SELECT id FROM public.proveedor WHERE nombre = 'Distribuidora Cochabamba S.A.'), 0),
('CPU-INT-I5', 'Procesador Intel Core i5-13400F', (SELECT id FROM public.categoria WHERE nombre = 'Componentes'), 160.00, 215.00, 18, 4, 'unidad', 'activo', (SELECT id FROM public.proveedor WHERE nombre = 'Suministros Digitales Bolivia'), 0),
('CPU-AMD-R5', 'Procesador AMD Ryzen 5 5600G', (SELECT id FROM public.categoria WHERE nombre = 'Componentes'), 115.00, 150.00, 30, 6, 'unidad', 'activo', (SELECT id FROM public.proveedor WHERE nombre = 'Suministros Digitales Bolivia'), 0),
('GPU-NVI-4060', 'Tarjeta Gráfica MSI RTX 4060 8GB', (SELECT id FROM public.categoria WHERE nombre = 'Componentes'), 310.00, 410.00, 10, 2, 'unidad', 'activo', (SELECT id FROM public.proveedor WHERE nombre = 'Importadora Mayorista El Alto S.R.L.'), 0),
('RAM-COR-16', 'Memoria RAM Corsair Vengeance 16GB DDR4', (SELECT id FROM public.categoria WHERE nombre = 'Componentes'), 45.00, 65.00, 50, 10, 'unidad', 'activo', (SELECT id FROM public.proveedor WHERE nombre = 'Suministros Digitales Bolivia'), 0),
('SSD-KIN-1TB', 'Disco SSD Kingston NV2 1TB PCIe 4.0', (SELECT id FROM public.categoria WHERE nombre = 'Almacenamiento'), 50.00, 72.00, 45, 8, 'unidad', 'activo', (SELECT id FROM public.proveedor WHERE nombre = 'Distribuidora Cochabamba S.A.'), 0),
('SSD-SAM-980', 'Disco SSD Samsung 980 Pro 1TB M.2', (SELECT id FROM public.categoria WHERE nombre = 'Almacenamiento'), 85.00, 115.00, 22, 5, 'unidad', 'activo', (SELECT id FROM public.proveedor WHERE nombre = 'Distribuidora Cochabamba S.A.'), 0),
('MOU-LOG-G502', 'Mouse Gamer Logitech G502 Hero USB', (SELECT id FROM public.categoria WHERE nombre = 'Accesorios'), 35.00, 55.00, 35, 6, 'unidad', 'activo', (SELECT id FROM public.proveedor WHERE nombre = 'Suministros Digitales Bolivia'), 0),
('KEY-REDR-K552', 'Teclado Mecánico Redragon Kumara K552', (SELECT id FROM public.categoria WHERE nombre = 'Accesorios'), 28.00, 48.00, 28, 5, 'unidad', 'activo', (SELECT id FROM public.proveedor WHERE nombre = 'Suministros Digitales Bolivia'), 0),
('PRN-EPS-L3250', 'Impresora Multifuncional Epson L3250 EcoTank', (SELECT id FROM public.categoria WHERE nombre = 'Impresoras'), 160.00, 220.00, 14, 3, 'unidad', 'activo', (SELECT id FROM public.proveedor WHERE nombre = 'ElectroImportaciones Chuquisaca'), 0),
('RTR-TPL-C6', 'Router TP-Link Archer C6 AC1200 WiFi', (SELECT id FROM public.categoria WHERE nombre = 'Redes y Connectividad'), 22.00, 35.00, 40, 8, 'unidad', 'activo', (SELECT id FROM public.proveedor WHERE nombre = 'Tecnología Global Santa Cruz'), 0),
('SWT-TPL-8P', 'Switch TP-Link 8 Puertos Gigabit Metálico', (SELECT id FROM public.categoria WHERE nombre = 'Redes y Connectividad'), 15.00, 26.00, 30, 5, 'unidad', 'activo', (SELECT id FROM public.proveedor WHERE nombre = 'Tecnología Global Santa Cruz'), 0),
('AUD-SONY-CH520', 'Audífonos Sony WH-CH520 Bluetooth', (SELECT id FROM public.categoria WHERE nombre = 'Audio'), 42.00, 68.00, 25, 5, 'unidad', 'activo', (SELECT id FROM public.proveedor WHERE nombre = 'ElectroImportaciones Chuquisaca'), 0),
('AUD-JBL-T510', 'Audífonos JBL Tune 510BT Inalámbricos', (SELECT id FROM public.categoria WHERE nombre = 'Audio'), 32.00, 50.00, 30, 5, 'unidad', 'activo', (SELECT id FROM public.proveedor WHERE nombre = 'ElectroImportaciones Chuquisaca'), 0),
('CON-NIN-SW', 'Consola Nintendo Switch OLED 64GB', (SELECT id FROM public.categoria WHERE nombre = 'Consolas y Videojuegos'), 290.00, 380.00, 10, 2, 'unidad', 'activo', (SELECT id FROM public.proveedor WHERE nombre = 'Importadora Mayorista El Alto S.R.L.'), 0),
('CON-PS5-SL', 'Consola Sony PlayStation 5 Slim 1TB', (SELECT id FROM public.categoria WHERE nombre = 'Consolas y Videojuegos'), 490.00, 630.00, 6, 2, 'unidad', 'activo', (SELECT id FROM public.proveedor WHERE nombre = 'Importadora Mayorista El Alto S.R.L.'), 0),
('CAB-CAT6-305', 'Bobina Cable Red Cat6 UTP Dixon 305m', (SELECT id FROM public.categoria WHERE nombre = 'Redes y Connectividad'), 68.00, 95.00, 15, 3, 'unidad', 'activo', (SELECT id FROM public.proveedor WHERE nombre = 'Tecnología Global Santa Cruz'), 0),
('ACC-FTE-EVGA', 'Fuente de Poder EVGA 600W 80 Plus Bronze', (SELECT id FROM public.categoria WHERE nombre = 'Componentes'), 40.00, 58.00, 20, 4, 'unidad', 'activo', (SELECT id FROM public.proveedor WHERE nombre = 'Suministros Digitales Bolivia'), 0),
('CEL-IPH-15', 'Smartphone Apple iPhone 15 Pro 128GB', (SELECT id FROM public.categoria WHERE nombre = 'Celulares'), 950.00, 1280.00, 5, 2, 'unidad', 'activo', (SELECT id FROM public.proveedor WHERE nombre = 'Tecnología Global Santa Cruz'), 0),
('MOU-LOG-M170', 'Mouse Inalámbrico Logitech M170 Básico', (SELECT id FROM public.categoria WHERE nombre = 'Accesorios'), 8.50, 14.00, 60, 10, 'unidad', 'activo', (SELECT id FROM public.proveedor WHERE nombre = 'Suministros Digitales Bolivia'), 0);

-- 9. Insertar Clientes (15 Clientes bolivianos reales con CI y tipos)
INSERT INTO public.cliente (nombre, email, telefono, ci, direccion, tipo, puntos, totalcompras, totalgastado, fecharegistro) VALUES
('Juan Carlos Choque', 'jc.choque@gmail.com', '78945612', '4859182 SC', 'Av. Grigotá, 3er Anillo, Santa Cruz', 'normal', 10, 1, 950.00, '2025-01-20'),
('María Elena Quispe', 'maria.quispe@outlook.com', '69012345', '6029384 LP', 'Zona Sopocachi, Calle Aspiazu #145, La Paz', 'frecuente', 125, 4, 1850.00, '2025-02-02'),
('Roberto Carlos Mendez', 'rober.mendez@hotmail.com', '75098765', '5938472 SC', 'Barrio Equipetrol, Calle 9 Oeste, Santa Cruz', 'vip', 450, 8, 5400.00, '2025-02-15'),
('Gisela Vaca Ortiz', 'gisela.vaca@gmail.com', '70239481', '7829103 SC', 'Doble Vía La Guardia, Km 6, Santa Cruz', 'normal', 0, 0, 0.00, '2025-03-01'),
('Alejandro Mamani Condori', 'alex.mamani@gmail.com', '68102938', '8920192 LP', 'Av. Juan Pablo II, El Alto', 'normal', 15, 1, 155.00, '2025-03-10'),
('Daniela Rojas Flores', 'daniela.rojas@gmail.com', '71902938', '4019283 CB', 'Av. Blanco Galindo Km 4, Cochabamba', 'frecuente', 80, 2, 740.00, '2025-03-18'),
('Rodrigo Torrico Suarez', 'rodrigo.torrico@gmail.com', '73019283', '3910293 SC', 'Villa 1ro de Mayo, Calle 3, Santa Cruz', 'normal', 0, 0, 0.00, '2025-04-02'),
('Paola Andrea Guzman', 'paola.guzman@outlook.com', '79845302', '9029384 SC', 'Av. Santos Dumont, 4to Anillo, Santa Cruz', 'vip', 310, 5, 3850.00, '2025-04-10'),
('Luis Fernando Siles', 'fernando.siles@gmail.com', '67910293', '7892019 CB', 'Zona Queru Queru, Cochabamba', 'normal', 20, 1, 260.00, '2025-04-15'),
('Carmen Rosa Benitez', 'carmen.rose@gmail.com', '65239102', '5819203 SC', 'Pampa de la Isla, Av. Virgen de Luján, Santa Cruz', 'normal', 5, 1, 55.00, '2025-04-20'),
('Javier Alberto Prado', 'javi.prado@gmail.com', '78501923', '6738192 LP', 'Zona Obrajes, Calle 10 #120, La Paz', 'normal', 0, 0, 0.00, '2025-04-25'),
('Vanessa Andrea Roca', 'vanesa.roca@hotmail.com', '76912304', '8302918 SC', 'Av. San Aurelio, 3er Anillo, Santa Cruz', 'frecuente', 65, 2, 580.00, '2025-05-01'),
('Sebastian Pinto Melgar', 'seb.pinto@gmail.com', '70291834', '9203918 SC', 'Av. Bush, Calle 4, Santa Cruz', 'normal', 0, 0, 0.00, '2025-05-05'),
('Claudia Lizeth Pinto', 'claudia.p@gmail.com', '69102938', '5920391 LP', 'Zona Miraflores, Av. Busch, La Paz', 'normal', 12, 1, 115.00, '2025-05-10'),
('Mauricio Marcelo Arce', 'marce.arce@outlook.com', '71029384', '3029182 SC', 'Av. Piraí, 2do Anillo, Santa Cruz', 'vip', 280, 3, 3100.00, '2025-05-12');

-- 10. Insertar una Configuración General del Sistema
INSERT INTO public.configuracion (nombre, razonsocial, ruc, direccion, ciudad, pais, telefono, celular, email, sitioweb, regimentributario, logoimagen, iva, prefijofactura, secuencialfactura, secuencialcotizacion, monedabase, simbolomoneda, monedavisualizacion, tipocambio, mensajerecibo, piefactura, plantillarecibo, plantillacotizacion, codigopaiswhatsapp, mensajewhatsapp) VALUES
('ElectroShop POS', 'ElectroShop Santa Cruz S.R.L.', '1029384021', 'Av. Cristo Redentor entre 3er y 4to Anillo', 'Santa Cruz de la Sierra', 'Bolivia', '3-3458923', '71234567', 'facturacion@electroshop.com', 'www.electroshop.bo', 'Régimen General', '', 13.00, 'EF', 100, 100, 'USD', '$', 'Bs', 6.96, '¡Gracias por su compra en ElectroShop!', 'Este ticket constituye una constancia de venta oficial.', 'ticket', 'pdf', '591', 'Estimado cliente, adjuntamos su nota de venta digital de ElectroShop.');

-- 11. Insertar Cierres / Sesiones de Caja (5 Sesiones)
INSERT INTO public.sesioncaja (idtrabajador, fechaapertura, fechacierre, montoapertura, conteoefectivo, montocierre, montoesperado, diferencia, estado, notas) VALUES
((SELECT id FROM public.trabajador WHERE email = 'david@electroshop.com'), '2025-06-20 08:00:00+04', '2025-06-20 18:00:00+04', 100.00, '{"100": 2, "50": 4, "20": 10}', 600.00, 600.00, 0.00, 'cerrada', 'Cierre de caja sin novedades, cuadre perfecto.'),
((SELECT id FROM public.trabajador WHERE email = 'david@electroshop.com'), '2025-06-21 08:00:00+04', '2025-06-21 18:00:00+04', 100.00, '{"100": 3, "50": 2, "20": 15}', 700.00, 700.00, 0.00, 'cerrada', 'Cierre regular.'),
((SELECT id FROM public.trabajador WHERE email = 'david@electroshop.com'), '2025-06-22 08:00:00+04', '2025-06-22 18:00:00+04', 150.00, '{"200": 1, "100": 2, "50": 5}', 650.00, 650.00, 0.00, 'cerrada', 'Caja cerrada por David, todo verificado.'),
((SELECT id FROM public.trabajador WHERE email = 'david@electroshop.com'), '2025-06-23 08:00:00+04', '2025-06-23 18:00:00+04', 100.00, '{"100": 4, "50": 2, "20": 5}', 600.00, 600.00, 0.00, 'cerrada', 'Sin observaciones.'),
((SELECT id FROM public.trabajador WHERE email = 'david@electroshop.com'), '2025-06-24 08:00:00+04', NULL, 150.00, NULL, NULL, NULL, NULL, 'abierta', 'Sesión de caja activa para el día actual.');

-- 12. Insertar Ventas (10 Ventas de prueba transaccionales en USD)
INSERT INTO public.venta (fecha, idcliente, idtrabajador, idmetodopago, subtotal, descuento, montodescuento, impuesto, total, efectivorecibido, direccionenvio, estado) VALUES
('2025-06-20 09:30:00+04', (SELECT id FROM public.cliente WHERE nombre = 'Juan Carlos Choque'), (SELECT id FROM public.trabajador WHERE email = 'david@electroshop.com'), (SELECT id FROM public.metodopago WHERE clave = 'Efectivo'), 950.00, 0.00, 0.00, 123.50, 950.00, 1000.00, NULL, 'completada'),
('2025-06-20 14:15:00+04', (SELECT id FROM public.cliente WHERE nombre = 'María Elena Quispe'), (SELECT id FROM public.trabajador WHERE email = 'david@electroshop.com'), (SELECT id FROM public.metodopago WHERE clave = 'Tarjeta'), 620.00, 5.00, 31.00, 76.57, 589.00, NULL, NULL, 'completada'),
('2025-06-21 10:00:00+04', (SELECT id FROM public.cliente WHERE nombre = 'Roberto Carlos Mendez'), (SELECT id FROM public.trabajador WHERE email = 'david@electroshop.com'), (SELECT id FROM public.metodopago WHERE clave = 'QR'), 1200.00, 10.00, 120.00, 140.40, 1080.00, NULL, 'Av. Bush, Calle 4, Santa Cruz', 'completada'),
('2025-06-21 16:45:00+04', (SELECT id FROM public.cliente WHERE nombre = 'Alejandro Mamani Condori'), (SELECT id FROM public.trabajador WHERE email = 'david@electroshop.com'), (SELECT id FROM public.metodopago WHERE clave = 'Efectivo'), 155.00, 0.00, 0.00, 20.15, 155.00, 200.00, NULL, 'completada'),
('2025-06-22 11:20:00+04', (SELECT id FROM public.cliente WHERE nombre = 'Daniela Rojas Flores'), (SELECT id FROM public.trabajador WHERE email = 'david@electroshop.com'), (SELECT id FROM public.metodopago WHERE clave = 'QR'), 430.00, 0.00, 0.00, 55.90, 430.00, NULL, NULL, 'completada'),
('2025-06-22 15:00:00+04', (SELECT id FROM public.cliente WHERE nombre = 'Paola Andrea Guzman'), (SELECT id FROM public.trabajador WHERE email = 'david@electroshop.com'), (SELECT id FROM public.metodopago WHERE clave = 'Tarjeta'), 630.00, 0.00, 0.00, 81.90, 630.00, NULL, NULL, 'completada'),
('2025-06-23 09:10:00+04', (SELECT id FROM public.cliente WHERE nombre = 'Luis Fernando Siles'), (SELECT id FROM public.trabajador WHERE email = 'david@electroshop.com'), (SELECT id FROM public.metodopago WHERE clave = 'Efectivo'), 260.00, 0.00, 0.00, 33.80, 260.00, 300.00, NULL, 'completada'),
('2025-06-23 13:40:00+04', (SELECT id FROM public.cliente WHERE nombre = 'Carmen Rosa Benitez'), (SELECT id FROM public.trabajador WHERE email = 'david@electroshop.com'), (SELECT id FROM public.metodopago WHERE clave = 'Efectivo'), 55.00, 0.00, 0.00, 7.15, 55.00, 60.00, NULL, 'completada'),
('2025-06-24 10:30:00+04', (SELECT id FROM public.cliente WHERE nombre = 'Vanessa Andrea Roca'), (SELECT id FROM public.trabajador WHERE email = 'david@electroshop.com'), (SELECT id FROM public.metodopago WHERE clave = 'QR'), 310.00, 0.00, 0.00, 40.30, 310.00, NULL, NULL, 'completada'),
('2025-06-24 15:20:00+04', (SELECT id FROM public.cliente WHERE nombre = 'Claudia Lizeth Pinto'), (SELECT id FROM public.trabajador WHERE email = 'david@electroshop.com'), (SELECT id FROM public.metodopago WHERE clave = 'Efectivo'), 115.00, 0.00, 0.00, 14.95, 115.00, 120.00, NULL, 'completada');

-- 13. Insertar Detalle de Ventas (15 Detalles cruzados)
INSERT INTO public.ventadetalle (idventa, idproducto, cantidad, preciounitario, subtotal) VALUES
(1, (SELECT id FROM public.producto WHERE codigo = 'LPT-ASUS-01'), 1, 950.00, 950.00),
(2, (SELECT id FROM public.producto WHERE codigo = 'LPT-HP-02'), 1, 620.00, 620.00),
(3, (SELECT id FROM public.producto WHERE codigo = 'CEL-SAMS-02'), 1, 1200.00, 1200.00),
(4, (SELECT id FROM public.producto WHERE codigo = 'MON-LG-24'), 1, 155.00, 155.00),
(5, (SELECT id FROM public.producto WHERE codigo = 'CPU-INT-I5'), 2, 215.00, 430.00),
(6, (SELECT id FROM public.producto WHERE codigo = 'CON-PS5-SL'), 1, 630.00, 630.00),
(7, (SELECT id FROM public.producto WHERE codigo = 'MON-SAMS-27'), 1, 260.00, 260.00),
(8, (SELECT id FROM public.producto WHERE codigo = 'MOU-LOG-G502'), 1, 55.00, 55.00),
(9, (SELECT id FROM public.producto WHERE codigo = 'GPU-NVI-4060'), 1, 310.00, 310.00),
(10, (SELECT id FROM public.producto WHERE codigo = 'SSD-SAM-980'), 1, 115.00, 115.00),
(2, (SELECT id FROM public.producto WHERE codigo = 'MOU-LOG-M170'), 2, 14.00, 28.00),
(3, (SELECT id FROM public.producto WHERE codigo = 'RAM-COR-16'), 2, 65.00, 130.00),
(5, (SELECT id FROM public.producto WHERE codigo = 'SSD-KIN-1TB'), 1, 72.00, 72.00),
(7, (SELECT id FROM public.producto WHERE codigo = 'KEY-REDR-K552'), 1, 48.00, 48.00),
(9, (SELECT id FROM public.producto WHERE codigo = 'AUD-SONY-CH520'), 1, 68.00, 68.00);

-- 14. Insertar Movimientos de Inventario (5 Movimientos iniciales)
INSERT INTO public.movimientoinventario (fecha, tipo, idproducto, cantidad, motivo, idproveedor, idtrabajador) VALUES
('2025-06-20 08:30:00+04', 'entrada', (SELECT id FROM public.producto WHERE codigo = 'LPT-ASUS-01'), 10, 'Compra de stock inicial', (SELECT id FROM public.proveedor WHERE nombre = 'Importadora Mayorista El Alto S.R.L.'), (SELECT id FROM public.trabajador WHERE email = 'carlos@electroshop.com')),
('2025-06-20 10:00:00+04', 'entrada', (SELECT id FROM public.producto WHERE codigo = 'CEL-XIA-01'), 20, 'Stock de temporada', (SELECT id FROM public.proveedor WHERE nombre = 'Tecnología Global Santa Cruz'), (SELECT id FROM public.trabajador WHERE email = 'carlos@electroshop.com')),
('2025-06-21 11:30:00+04', 'salida', (SELECT id FROM public.producto WHERE codigo = 'SSD-KIN-1TB'), 2, 'Ajuste por merma / daño físico', NULL, (SELECT id FROM public.trabajador WHERE email = 'carlos@electroshop.com')),
('2025-06-22 09:00:00+04', 'entrada', (SELECT id FROM public.producto WHERE codigo = 'RAM-COR-16'), 30, 'Reabastecimiento mensual', (SELECT id FROM public.proveedor WHERE nombre = 'Suministros Digitales Bolivia'), (SELECT id FROM public.trabajador WHERE email = 'carlos@electroshop.com')),
('2025-06-23 15:45:00+04', 'salida', (SELECT id FROM public.producto WHERE codigo = 'AUD-JBL-T510'), 1, 'Muestra para exhibición en vitrina', NULL, (SELECT id FROM public.trabajador WHERE email = 'carlos@electroshop.com'));
