-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.configuracion (
  id integer NOT NULL DEFAULT 1 CHECK (id = 1),
  nombre character varying NOT NULL,
  razonsocial character varying,
  ruc character varying,
  direccion character varying,
  ciudad character varying,
  pais character varying,
  telefono character varying,
  celular character varying,
  email character varying,
  sitioweb character varying,
  regimentributario character varying,
  logoimagen character varying,
  iva numeric NOT NULL,
  prefijofactura character varying NOT NULL,
  secuencialfactura integer NOT NULL,
  secuencialcotizacion integer NOT NULL,
  monedabase character varying NOT NULL,
  simbolomoneda character varying NOT NULL,
  monedavisualizacion character varying NOT NULL,
  tipocambio numeric NOT NULL,
  mensajerecibo text,
  piefactura text,
  plantillarecibo USER-DEFINED NOT NULL,
  plantillacotizacion USER-DEFINED NOT NULL,
  codigopaiswhatsapp character varying NOT NULL,
  mensajewhatsapp text,
  clavefirmadigital character varying,
  creadoen timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizadoen timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT configuracion_pkey PRIMARY KEY (id)
);
CREATE TABLE public.metodopago (
  id integer NOT NULL DEFAULT nextval('metodopago_id_seq'::regclass),
  clave character varying NOT NULL UNIQUE,
  nombre character varying NOT NULL,
  icono character varying,
  activo boolean NOT NULL,
  banco character varying,
  nombrecuenta character varying,
  numerocuenta character varying,
  titular character varying,
  imagenqr text,
  creadoen timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizadoen timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT metodopago_pkey PRIMARY KEY (id)
);
CREATE TABLE public.historialtipocambio (
  id integer NOT NULL DEFAULT nextval('historialtipocambio_id_seq'::regclass),
  tipocambioanterior numeric NOT NULL,
  tipocambionuevo numeric NOT NULL,
  fecha timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  idtrabajador integer,
  creadoen timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT historialtipocambio_pkey PRIMARY KEY (id),
  CONSTRAINT fk_htc_trabajador FOREIGN KEY (idtrabajador) REFERENCES public.trabajador(id)
);
CREATE TABLE public.rol (
  id integer NOT NULL DEFAULT nextval('rol_id_seq'::regclass),
  nombre character varying NOT NULL,
  descripcion character varying,
  color character varying NOT NULL,
  essistema boolean NOT NULL,
  creadoen timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizadoen timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT rol_pkey PRIMARY KEY (id)
);
CREATE TABLE public.modulo (
  id integer NOT NULL DEFAULT nextval('modulo_id_seq'::regclass),
  clave character varying NOT NULL UNIQUE,
  nombre character varying NOT NULL,
  orden smallint NOT NULL,
  CONSTRAINT modulo_pkey PRIMARY KEY (id)
);
CREATE TABLE public.rolpermiso (
  id integer NOT NULL DEFAULT nextval('rolpermiso_id_seq'::regclass),
  idrol integer NOT NULL,
  idmodulo integer NOT NULL,
  leer boolean NOT NULL,
  crear boolean NOT NULL,
  editar boolean NOT NULL,
  eliminar boolean NOT NULL,
  CONSTRAINT rolpermiso_pkey PRIMARY KEY (id),
  CONSTRAINT fk_rp_rol FOREIGN KEY (idrol) REFERENCES public.rol(id),
  CONSTRAINT fk_rp_modulo FOREIGN KEY (idmodulo) REFERENCES public.modulo(id)
);
CREATE TABLE public.categoria (
  id integer NOT NULL DEFAULT nextval('categoria_id_seq'::regclass),
  nombre character varying NOT NULL,
  descripcion character varying,
  icono character varying NOT NULL,
  color character varying NOT NULL,
  colorfondo character varying,
  creadoen timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizadoen timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT categoria_pkey PRIMARY KEY (id)
);
CREATE TABLE public.trabajador (
  id integer NOT NULL DEFAULT nextval('trabajador_id_seq'::regclass),
  nombre character varying NOT NULL,
  idrol integer NOT NULL,
  email character varying,
  password character varying NOT NULL,
  telefono character varying,
  direccion character varying,
  estado USER-DEFINED NOT NULL,
  fechaingreso date NOT NULL,
  salario numeric NOT NULL,
  avatar character varying,
  coloravatar character varying,
  creadoen timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizadoen timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT trabajador_pkey PRIMARY KEY (id),
  CONSTRAINT fk_trab_rol FOREIGN KEY (idrol) REFERENCES public.rol(id)
);
CREATE TABLE public.cliente (
  id integer NOT NULL DEFAULT nextval('cliente_id_seq'::regclass),
  nombre character varying NOT NULL,
  email character varying,
  telefono character varying,
  ci character varying,
  direccion character varying,
  tipo USER-DEFINED NOT NULL,
  puntos integer NOT NULL,
  totalcompras integer NOT NULL,
  totalgastado numeric NOT NULL,
  fecharegistro date NOT NULL,
  creadoen timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizadoen timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT cliente_pkey PRIMARY KEY (id)
);
CREATE TABLE public.proveedor (
  id integer NOT NULL DEFAULT nextval('proveedor_id_seq'::regclass),
  nombre character varying NOT NULL,
  contacto character varying,
  ruc character varying,
  email character varying,
  telefono character varying,
  direccion character varying,
  condicionpago USER-DEFINED NOT NULL,
  estado USER-DEFINED NOT NULL,
  creadoen timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizadoen timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT proveedor_pkey PRIMARY KEY (id)
);
CREATE TABLE public.proveedorcategoria (
  idproveedor integer NOT NULL,
  idcategoria integer NOT NULL,
  CONSTRAINT proveedorcategoria_pkey PRIMARY KEY (idproveedor, idcategoria),
  CONSTRAINT fk_pc_proveedor FOREIGN KEY (idproveedor) REFERENCES public.proveedor(id),
  CONSTRAINT fk_pc_categoria FOREIGN KEY (idcategoria) REFERENCES public.categoria(id)
);
CREATE TABLE public.producto (
  id integer NOT NULL DEFAULT nextval('producto_id_seq'::regclass),
  codigo character varying NOT NULL UNIQUE,
  nombre character varying NOT NULL,
  idcategoria integer NOT NULL,
  preciocompra numeric NOT NULL,
  precioventa numeric NOT NULL,
  stock integer NOT NULL,
  stockminimo integer NOT NULL,
  unidad USER-DEFINED NOT NULL,
  estado USER-DEFINED NOT NULL,
  idproveedor integer,
  unidadesvendidas integer NOT NULL,
  imagen text,
  creadoen timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizadoen timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT producto_pkey PRIMARY KEY (id),
  CONSTRAINT fk_prod_categoria FOREIGN KEY (idcategoria) REFERENCES public.categoria(id),
  CONSTRAINT fk_prod_proveedor FOREIGN KEY (idproveedor) REFERENCES public.proveedor(id)
);
CREATE TABLE public.venta (
  id integer NOT NULL DEFAULT nextval('venta_id_seq'::regclass),
  fecha timestamp with time zone NOT NULL,
  idcliente integer NOT NULL,
  idtrabajador integer NOT NULL,
  idmetodopago integer NOT NULL,
  subtotal numeric NOT NULL,
  descuento numeric NOT NULL,
  montodescuento numeric NOT NULL,
  impuesto numeric NOT NULL,
  total numeric NOT NULL,
  efectivorecibido numeric,
  direccionenvio character varying,
  estado USER-DEFINED NOT NULL,
  hashqr character varying,
  creadoen timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT venta_pkey PRIMARY KEY (id),
  CONSTRAINT fk_vta_cliente FOREIGN KEY (idcliente) REFERENCES public.cliente(id),
  CONSTRAINT fk_vta_trabajador FOREIGN KEY (idtrabajador) REFERENCES public.trabajador(id),
  CONSTRAINT fk_vta_metodo FOREIGN KEY (idmetodopago) REFERENCES public.metodopago(id)
);
CREATE TABLE public.ventadetalle (
  id integer NOT NULL DEFAULT nextval('ventadetalle_id_seq'::regclass),
  idventa integer NOT NULL,
  idproducto integer NOT NULL,
  cantidad integer NOT NULL,
  preciounitario numeric NOT NULL,
  subtotal numeric NOT NULL,
  CONSTRAINT ventadetalle_pkey PRIMARY KEY (id),
  CONSTRAINT fk_vd_venta FOREIGN KEY (idventa) REFERENCES public.venta(id),
  CONSTRAINT fk_vd_producto FOREIGN KEY (idproducto) REFERENCES public.producto(id)
);
CREATE TABLE public.sesioncaja (
  id integer NOT NULL DEFAULT nextval('sesioncaja_id_seq'::regclass),
  idtrabajador integer NOT NULL,
  fechaapertura timestamp with time zone NOT NULL,
  fechacierre timestamp with time zone,
  montoapertura numeric NOT NULL,
  conteoefectivo jsonb,
  montocierre numeric,
  montoesperado numeric,
  diferencia numeric,
  estado USER-DEFINED NOT NULL,
  notas text,
  creadoen timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT sesioncaja_pkey PRIMARY KEY (id),
  CONSTRAINT fk_sc_trabajador FOREIGN KEY (idtrabajador) REFERENCES public.trabajador(id)
);
CREATE TABLE public.ordencompra (
  id integer NOT NULL DEFAULT nextval('ordencompra_id_seq'::regclass),
  fecha date NOT NULL,
  idproveedor integer NOT NULL,
  idtrabajador integer NOT NULL,
  subtotal numeric NOT NULL,
  impuesto numeric NOT NULL,
  total numeric NOT NULL,
  estado USER-DEFINED NOT NULL,
  fechaesperada date NOT NULL,
  fecharecepcion date,
  notas text,
  creadoen timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizadoen timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ordencompra_pkey PRIMARY KEY (id),
  CONSTRAINT fk_oc_proveedor FOREIGN KEY (idproveedor) REFERENCES public.proveedor(id),
  CONSTRAINT fk_oc_trabajador FOREIGN KEY (idtrabajador) REFERENCES public.trabajador(id)
);
CREATE TABLE public.ordencompradetalle (
  id integer NOT NULL DEFAULT nextval('ordencompradetalle_id_seq'::regclass),
  idordencompra integer NOT NULL,
  idproducto integer NOT NULL,
  cantidad integer NOT NULL,
  costounitario numeric NOT NULL,
  subtotal numeric NOT NULL,
  CONSTRAINT ordencompradetalle_pkey PRIMARY KEY (id),
  CONSTRAINT fk_ocd_orden FOREIGN KEY (idordencompra) REFERENCES public.ordencompra(id),
  CONSTRAINT fk_ocd_producto FOREIGN KEY (idproducto) REFERENCES public.producto(id)
);
CREATE TABLE public.devolucion (
  id integer NOT NULL DEFAULT nextval('devolucion_id_seq'::regclass),
  fecha timestamp with time zone NOT NULL,
  idventa integer NOT NULL,
  idtrabajador integer NOT NULL,
  total numeric NOT NULL,
  metodoreembolso USER-DEFINED NOT NULL,
  reingreso boolean NOT NULL,
  estado USER-DEFINED NOT NULL,
  notas text,
  creadoen timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT devolucion_pkey PRIMARY KEY (id),
  CONSTRAINT fk_dev_venta FOREIGN KEY (idventa) REFERENCES public.venta(id),
  CONSTRAINT fk_dev_trabajador FOREIGN KEY (idtrabajador) REFERENCES public.trabajador(id)
);
CREATE TABLE public.devoluciondetalle (
  id integer NOT NULL DEFAULT nextval('devoluciondetalle_id_seq'::regclass),
  iddevolucion integer NOT NULL,
  idproducto integer NOT NULL,
  cantidad integer NOT NULL,
  preciounitario numeric NOT NULL,
  subtotal numeric NOT NULL,
  motivo USER-DEFINED NOT NULL,
  CONSTRAINT devoluciondetalle_pkey PRIMARY KEY (id),
  CONSTRAINT fk_dd_devolucion FOREIGN KEY (iddevolucion) REFERENCES public.devolucion(id),
  CONSTRAINT fk_dd_producto FOREIGN KEY (idproducto) REFERENCES public.producto(id)
);
CREATE TABLE public.movimientoinventario (
  id integer NOT NULL DEFAULT nextval('movimientoinventario_id_seq'::regclass),
  fecha timestamp with time zone NOT NULL,
  tipo USER-DEFINED NOT NULL,
  idproducto integer NOT NULL,
  cantidad integer NOT NULL,
  motivo character varying NOT NULL,
  idproveedor integer,
  idtrabajador integer NOT NULL,
  creadoen timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT movimientoinventario_pkey PRIMARY KEY (id),
  CONSTRAINT fk_mi_producto FOREIGN KEY (idproducto) REFERENCES public.producto(id),
  CONSTRAINT fk_mi_proveedor FOREIGN KEY (idproveedor) REFERENCES public.proveedor(id),
  CONSTRAINT fk_mi_trabajador FOREIGN KEY (idtrabajador) REFERENCES public.trabajador(id)
);
CREATE TABLE public.cotizacion (
  id integer NOT NULL DEFAULT nextval('cotizacion_id_seq'::regclass),
  numero character varying NOT NULL UNIQUE,
  idcliente integer,
  clientenombre character varying NOT NULL,
  clienteci character varying,
  clientetelefono character varying,
  clienteemail character varying,
  descuentoglobal numeric NOT NULL,
  subtotal numeric NOT NULL,
  montodescuento numeric NOT NULL,
  total numeric NOT NULL,
  totalmonedalocal numeric NOT NULL,
  tipocambio numeric NOT NULL,
  monedalocal character varying NOT NULL,
  diasvalidez integer NOT NULL,
  fechavencimiento date NOT NULL,
  notas text,
  estado USER-DEFINED NOT NULL,
  fechacreacion timestamp with time zone NOT NULL,
  idtrabajador integer NOT NULL,
  plantilla USER-DEFINED NOT NULL,
  hashqr character varying,
  creadoen timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizadoen timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT cotizacion_pkey PRIMARY KEY (id),
  CONSTRAINT fk_cot_cliente FOREIGN KEY (idcliente) REFERENCES public.cliente(id),
  CONSTRAINT fk_cot_trabajador FOREIGN KEY (idtrabajador) REFERENCES public.trabajador(id)
);
CREATE TABLE public.cotizaciondetalle (
  id integer NOT NULL DEFAULT nextval('cotizaciondetalle_id_seq'::regclass),
  idcotizacion integer NOT NULL,
  idproducto integer NOT NULL,
  cantidad integer NOT NULL,
  preciounitario numeric NOT NULL,
  descuento numeric NOT NULL,
  subtotal numeric NOT NULL,
  CONSTRAINT cotizaciondetalle_pkey PRIMARY KEY (id),
  CONSTRAINT fk_cd_cotizacion FOREIGN KEY (idcotizacion) REFERENCES public.cotizacion(id),
  CONSTRAINT fk_cd_producto FOREIGN KEY (idproducto) REFERENCES public.producto(id)
);
CREATE TABLE public.pendienteconfiguracion (
  id integer NOT NULL DEFAULT 1 CHECK (id = 1),
  ahorros numeric NOT NULL,
  gastos numeric NOT NULL,
  facturas numeric NOT NULL,
  alquiler numeric NOT NULL,
  actualizadoen timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pendienteconfiguracion_pkey PRIMARY KEY (id)
);
CREATE TABLE public.pendienteperiodo (
  id integer NOT NULL DEFAULT nextval('pendienteperiodo_id_seq'::regclass),
  periodo character varying NOT NULL UNIQUE,
  etiqueta character varying NOT NULL,
  ingresobruto numeric NOT NULL,
  ahorros numeric NOT NULL,
  gastos numeric NOT NULL,
  facturas numeric NOT NULL,
  alquiler numeric NOT NULL,
  totalfijo numeric NOT NULL,
  sobrante numeric NOT NULL,
  notas text,
  cerradoen timestamp with time zone,
  creadoen timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pendienteperiodo_pkey PRIMARY KEY (id)
);