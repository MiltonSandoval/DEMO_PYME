-- ====================================================================
-- SCRIPT DE BASE DE DATOS: CREACIÓN DE ADMINISTRADOR Y MÓDULOS DE SISTEMA
-- Diseñado para ejecutarse en el editor SQL de Supabase.
-- ====================================================================

-- Asegurar que la extensión pgcrypto esté activa para la encriptación
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Insertar Módulos del Sistema (si no existen ya)
INSERT INTO public.modulo (clave, nombre, orden) VALUES
('Dashboard', 'Dashboard', 1),
('POS', 'Punto de Venta', 2),
('Caja', 'Control de Caja', 3),
('Productos', 'Productos', 4),
('Categorias', 'Categorías', 5),
('Clientes', 'Clientes', 6),
('Trabajadores', 'Trabajadores', 7),
('Proveedores', 'Proveedores', 8),
('Ventas', 'Historial Ventas', 9),
('Cotizaciones', 'Cotizaciones', 10),
('Compras', 'Compras', 11),
('Devoluciones', 'Devoluciones', 12),
('Inventario', 'Inventario', 13),
('Roles', 'Roles y Permisos', 14),
('Configuracion', 'Configuración', 15)
ON CONFLICT (clave) DO NOTHING;

-- 2. Insertar Rol de Administrador
INSERT INTO public.rol (nombre, descripcion, color, essistema)
VALUES ('Administrador', 'Rol administrativo con acceso total al sistema', '#4F46E5', true)
ON CONFLICT DO NOTHING;

-- 3. Asignar Permisos Totales al Rol de Administrador para cada módulo
-- Eliminamos permisos existentes para evitar duplicados si ya existía el rol
DELETE FROM public.rolpermiso 
WHERE idrol = (SELECT id FROM public.rol WHERE nombre = 'Administrador' LIMIT 1);

INSERT INTO public.rolpermiso (idrol, idmodulo, leer, crear, editar, eliminar)
SELECT 
    (SELECT id FROM public.rol WHERE nombre = 'Administrador' LIMIT 1),
    m.id,
    true, -- Leer
    true, -- Crear
    true, -- Editar
    true  -- Eliminar
FROM public.modulo m;

-- 4. Crear el Trabajador Administrador
-- Nota: La contraseña 'admin123' está encriptada con BCrypt (Rounds: 10)
-- El hash generado es: $2a$10$R77S9fXqYgE3YI8e.9P5e.dGle/kHk3D7N4x4/r/i3E.B6J1t7SjC
INSERT INTO public.trabajador (
    nombre, 
    idrol, 
    email, 
    password, 
    telefono, 
    direccion, 
    estado, 
    fechaingreso, 
    salario, 
    avatar, 
    coloravatar
) VALUES (
    'Administrador', 
    (SELECT id FROM public.rol WHERE nombre = 'Administrador' LIMIT 1), 
    'admin@pos.com', 
    crypt('admin123', gen_salt('bf', 10)), 
    '123456789', 
    'Oficina Principal', 
    'activo', -- PostgreSQL casteará implícitamente este string al tipo USER-DEFINED 'estado'
    CURRENT_DATE, 
    3000.00, 
    NULL, 
    '#4F46E5'
)
ON CONFLICT DO NOTHING; -- Nota: Ajustar según si tiene restricción UNIQUE en email.
