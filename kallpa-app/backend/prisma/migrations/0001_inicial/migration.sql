-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('GERENTE', 'GERENTE_GASTRONOMICO', 'LOGISTICA', 'COCINA', 'CONSULTA');

-- CreateEnum
CREATE TYPE "TipoUnidad" AS ENUM ('MASA', 'VOLUMEN', 'CONTEO');

-- CreateEnum
CREATE TYPE "CondicionPago" AS ENUM ('CONTADO', 'CREDITO_7', 'CREDITO_15', 'CREDITO_30');

-- CreateEnum
CREATE TYPE "TipoItemCatalogo" AS ENUM ('PLATO_FONDO', 'GUARNICION', 'ENSALADA', 'POSTRE', 'COCTELERIA', 'BOCADITOS', 'SERVICIO');

-- CreateEnum
CREATE TYPE "LineaCatalogo" AS ENUM ('CLASICA', 'RESERVA', 'GRAN_RESERVA');

-- CreateEnum
CREATE TYPE "TipoCliente" AS ENUM ('SOCIAL', 'FOLKLORICO', 'ACADEMICO', 'INSTITUCIONAL');

-- CreateEnum
CREATE TYPE "EstadoContrato" AS ENUM ('COTIZACION', 'CONFIRMADO', 'PLANIFICADO', 'EN_COMPRA', 'INSUMOS_ENTREGADOS', 'EN_PRODUCCION', 'SERVIDO', 'LIQUIDADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoPago" AS ENUM ('ANTICIPO', 'SALDO', 'ADICIONAL', 'DEVOLUCION');

-- CreateEnum
CREATE TYPE "EstadoSolicitud" AS ENUM ('BORRADOR', 'APROBADA', 'EN_COMPRA', 'ENTREGADA_PARCIAL', 'ENTREGADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "OrigenInsumo" AS ENUM ('COMPRAR', 'STOCK', 'A_CRITERIO');

-- CreateEnum
CREATE TYPE "TipoComprobante" AS ENUM ('FACTURA', 'RECIBO', 'NOTA_VENTA', 'SIN_COMPROBANTE');

-- CreateEnum
CREATE TYPE "Conformidad" AS ENUM ('CONFORME', 'CON_OBSERVACIONES', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "PuntoControl" AS ENUM ('RECEPCION', 'ALMACENAMIENTO', 'COCCION', 'ENFRIAMIENTO', 'TRANSPORTE', 'SERVICIO');

-- CreateEnum
CREATE TYPE "TipoPersona" AS ENUM ('SOCIO', 'PASANTE', 'GARZON_EXTERNO', 'COCINERO_APOYO');

-- CreateEnum
CREATE TYPE "ModalidadPago" AS ENUM ('POR_DIA', 'POR_PLATO', 'FIJO');

-- CreateEnum
CREATE TYPE "TipoGasto" AS ENUM ('EVENTO', 'FIJO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "debeCambiarPassword" BOOLEAN NOT NULL DEFAULT true,
    "ultimoAcceso" TIMESTAMP(3),
    "personaId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bitacora" (
    "id" BIGSERIAL NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "estadoAnterior" TEXT,
    "estadoNuevo" TEXT,
    "detalle" JSONB,
    "usuarioId" TEXT NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bitacora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parametro" (
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descripcion" TEXT,
    "actualizado" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Parametro_pkey" PRIMARY KEY ("clave")
);

-- CreateTable
CREATE TABLE "UnidadMedida" (
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoUnidad" NOT NULL,
    "factorBase" DECIMAL(12,4) NOT NULL,

    CONSTRAINT "UnidadMedida_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "CategoriaInsumo" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CategoriaInsumo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insumo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    "unidadBaseCodigo" TEXT NOT NULL,
    "unidadCompraCodigo" TEXT,
    "pesoUnitarioGramos" DECIMAL(10,2),
    "especificacionHabitual" TEXT,
    "marcaPreferida" TEXT,
    "perecible" BOOLEAN NOT NULL DEFAULT true,
    "requiereFrio" BOOLEAN NOT NULL DEFAULT false,
    "stockActual" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Insumo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proveedor" (
    "id" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "nombreContacto" TEXT,
    "nitOCi" TEXT,
    "telefono" TEXT,
    "whatsapp" TEXT,
    "direccion" TEXT,
    "ubicacionMercado" TEXT,
    "condicionPago" "CondicionPago" NOT NULL DEFAULT 'CONTADO',
    "emiteFactura" BOOLEAN NOT NULL DEFAULT false,
    "calificacion" INTEGER,
    "observaciones" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProveedorInsumo" (
    "id" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "insumoId" TEXT NOT NULL,
    "precioUnitario" DECIMAL(12,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProveedorInsumo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemCatalogo" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoItemCatalogo" NOT NULL,
    "linea" "LineaCatalogo",
    "precioVenta" DECIMAL(10,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ItemCatalogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FichaTecnica" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "vigente" BOOLEAN NOT NULL DEFAULT true,
    "porcionGramos" DECIMAL(8,2),
    "procedimiento" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FichaTecnica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FichaTecnicaLinea" (
    "id" TEXT NOT NULL,
    "fichaId" TEXT NOT NULL,
    "insumoId" TEXT NOT NULL,
    "cantidadPorPorcion" DECIMAL(12,4) NOT NULL,
    "unidadCodigo" TEXT NOT NULL,
    "porcentajeMerma" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "aCriterio" BOOLEAN NOT NULL DEFAULT false,
    "especificacion" TEXT,

    CONSTRAINT "FichaTecnicaLinea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ci" TEXT,
    "nit" TEXT,
    "razonSocial" TEXT,
    "telefono" TEXT NOT NULL,
    "email" TEXT,
    "tipo" "TipoCliente" NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contrato" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "registradoPorId" TEXT NOT NULL,
    "tipoEvento" TEXT NOT NULL,
    "fechaEvento" DATE NOT NULL,
    "horaServicio" TEXT NOT NULL,
    "lugar" TEXT NOT NULL,
    "direccion" TEXT,
    "numeroPlatos" INTEGER NOT NULL,
    "numeroPlatosFinal" INTEGER,
    "fechaConfirmacion" TIMESTAMP(3),
    "garzonesIncluidos" INTEGER NOT NULL,
    "precioTotal" DECIMAL(12,2) NOT NULL,
    "estado" "EstadoContrato" NOT NULL DEFAULT 'COTIZACION',
    "requisitosEspeciales" TEXT,
    "observaciones" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContratoItem" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "ContratoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "tipo" "TipoPago" NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "metodo" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comprobante" TEXT,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolicitudInsumos" (
    "id" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "platosBase" INTEGER NOT NULL,
    "creadaPorId" TEXT NOT NULL,
    "fechaHoraSolicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaHoraRequerida" TIMESTAMP(3) NOT NULL,
    "aprobadaPorId" TEXT,
    "fechaHoraAprobacion" TIMESTAMP(3),
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'BORRADOR',
    "observaciones" TEXT,

    CONSTRAINT "SolicitudInsumos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolicitudItem" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "insumoId" TEXT NOT NULL,
    "cantidadCalculada" DECIMAL(12,3),
    "cantidad" DECIMAL(12,3),
    "unidadCodigo" TEXT NOT NULL,
    "especificacion" TEXT,
    "marca" TEXT,
    "marcaObligatoria" BOOLEAN NOT NULL DEFAULT false,
    "origen" "OrigenInsumo" NOT NULL DEFAULT 'COMPRAR',
    "observacion" TEXT,

    CONSTRAINT "SolicitudItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Compra" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "compradoPorId" TEXT NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total" DECIMAL(12,2) NOT NULL,
    "tipoComprobante" "TipoComprobante" NOT NULL DEFAULT 'SIN_COMPROBANTE',
    "comprobanteUrl" TEXT,

    CONSTRAINT "Compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompraItem" (
    "id" TEXT NOT NULL,
    "compraId" TEXT NOT NULL,
    "solicitudItemId" TEXT NOT NULL,
    "insumoId" TEXT NOT NULL,
    "cantidad" DECIMAL(12,3) NOT NULL,
    "unidadCodigo" TEXT NOT NULL,
    "precioUnitario" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "marcaComprada" TEXT,
    "justificacion" TEXT,

    CONSTRAINT "CompraItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntregaInsumos" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "entregadoPorId" TEXT NOT NULL,
    "recibidoPorId" TEXT NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lugar" TEXT NOT NULL,
    "conformidad" "Conformidad" NOT NULL,
    "observaciones" TEXT,

    CONSTRAINT "EntregaInsumos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntregaItem" (
    "id" TEXT NOT NULL,
    "entregaId" TEXT NOT NULL,
    "solicitudItemId" TEXT NOT NULL,
    "cantidadRecibida" DECIMAL(12,3) NOT NULL,
    "conformidad" "Conformidad" NOT NULL,
    "observacion" TEXT,

    CONSTRAINT "EntregaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroProduccion" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "etapa" TEXT NOT NULL,
    "responsableId" TEXT NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacion" TEXT,

    CONSTRAINT "RegistroProduccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ControlTemperatura" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "punto" "PuntoControl" NOT NULL,
    "alimento" TEXT NOT NULL,
    "temperaturaC" DECIMAL(5,1) NOT NULL,
    "fueraDeRango" BOOLEAN NOT NULL DEFAULT false,
    "accionCorrectiva" TEXT,
    "responsableId" TEXT NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ControlTemperatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Persona" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ci" TEXT NOT NULL,
    "telefono" TEXT,
    "tipo" "TipoPersona" NOT NULL,
    "carnetSanitarioVence" DATE,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Persona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemuneracionEvento" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "modalidad" "ModalidadPago" NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "tarifa" DECIMAL(10,2) NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "fechaPago" TIMESTAMP(3),

    CONSTRAINT "RemuneracionEvento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gasto" (
    "id" TEXT NOT NULL,
    "tipo" "TipoGasto" NOT NULL,
    "categoria" TEXT NOT NULL,
    "descripcion" TEXT,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contratoId" TEXT,
    "comprobanteUrl" TEXT,
    "registradoPorId" TEXT NOT NULL,

    CONSTRAINT "Gasto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_personaId_key" ON "Usuario"("personaId");

-- CreateIndex
CREATE INDEX "Bitacora_entidad_entidadId_idx" ON "Bitacora"("entidad", "entidadId");

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaInsumo_nombre_key" ON "CategoriaInsumo"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Insumo_nombre_key" ON "Insumo"("nombre");

-- CreateIndex
CREATE INDEX "ProveedorInsumo_insumoId_fecha_idx" ON "ProveedorInsumo"("insumoId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "ItemCatalogo_codigo_key" ON "ItemCatalogo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "FichaTecnica_itemId_version_key" ON "FichaTecnica"("itemId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "Contrato_codigo_key" ON "Contrato"("codigo");

-- CreateIndex
CREATE INDEX "Contrato_fechaEvento_idx" ON "Contrato"("fechaEvento");

-- CreateIndex
CREATE INDEX "Contrato_estado_idx" ON "Contrato"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "SolicitudInsumos_folio_key" ON "SolicitudInsumos"("folio");

-- CreateIndex
CREATE UNIQUE INDEX "SolicitudInsumos_contratoId_version_key" ON "SolicitudInsumos"("contratoId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "Persona_ci_key" ON "Persona"("ci");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bitacora" ADD CONSTRAINT "Bitacora_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insumo" ADD CONSTRAINT "Insumo_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "CategoriaInsumo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insumo" ADD CONSTRAINT "Insumo_unidadBaseCodigo_fkey" FOREIGN KEY ("unidadBaseCodigo") REFERENCES "UnidadMedida"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insumo" ADD CONSTRAINT "Insumo_unidadCompraCodigo_fkey" FOREIGN KEY ("unidadCompraCodigo") REFERENCES "UnidadMedida"("codigo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProveedorInsumo" ADD CONSTRAINT "ProveedorInsumo_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProveedorInsumo" ADD CONSTRAINT "ProveedorInsumo_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "Insumo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FichaTecnica" ADD CONSTRAINT "FichaTecnica_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ItemCatalogo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FichaTecnicaLinea" ADD CONSTRAINT "FichaTecnicaLinea_fichaId_fkey" FOREIGN KEY ("fichaId") REFERENCES "FichaTecnica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FichaTecnicaLinea" ADD CONSTRAINT "FichaTecnicaLinea_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "Insumo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FichaTecnicaLinea" ADD CONSTRAINT "FichaTecnicaLinea_unidadCodigo_fkey" FOREIGN KEY ("unidadCodigo") REFERENCES "UnidadMedida"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContratoItem" ADD CONSTRAINT "ContratoItem_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContratoItem" ADD CONSTRAINT "ContratoItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ItemCatalogo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudInsumos" ADD CONSTRAINT "SolicitudInsumos_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudInsumos" ADD CONSTRAINT "SolicitudInsumos_creadaPorId_fkey" FOREIGN KEY ("creadaPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudInsumos" ADD CONSTRAINT "SolicitudInsumos_aprobadaPorId_fkey" FOREIGN KEY ("aprobadaPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudItem" ADD CONSTRAINT "SolicitudItem_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "SolicitudInsumos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudItem" ADD CONSTRAINT "SolicitudItem_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "Insumo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudItem" ADD CONSTRAINT "SolicitudItem_unidadCodigo_fkey" FOREIGN KEY ("unidadCodigo") REFERENCES "UnidadMedida"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "SolicitudInsumos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_compradoPorId_fkey" FOREIGN KEY ("compradoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompraItem" ADD CONSTRAINT "CompraItem_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "Compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompraItem" ADD CONSTRAINT "CompraItem_solicitudItemId_fkey" FOREIGN KEY ("solicitudItemId") REFERENCES "SolicitudItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompraItem" ADD CONSTRAINT "CompraItem_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "Insumo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompraItem" ADD CONSTRAINT "CompraItem_unidadCodigo_fkey" FOREIGN KEY ("unidadCodigo") REFERENCES "UnidadMedida"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaInsumos" ADD CONSTRAINT "EntregaInsumos_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "SolicitudInsumos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaInsumos" ADD CONSTRAINT "EntregaInsumos_entregadoPorId_fkey" FOREIGN KEY ("entregadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaInsumos" ADD CONSTRAINT "EntregaInsumos_recibidoPorId_fkey" FOREIGN KEY ("recibidoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaItem" ADD CONSTRAINT "EntregaItem_entregaId_fkey" FOREIGN KEY ("entregaId") REFERENCES "EntregaInsumos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaItem" ADD CONSTRAINT "EntregaItem_solicitudItemId_fkey" FOREIGN KEY ("solicitudItemId") REFERENCES "SolicitudItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroProduccion" ADD CONSTRAINT "RegistroProduccion_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroProduccion" ADD CONSTRAINT "RegistroProduccion_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlTemperatura" ADD CONSTRAINT "ControlTemperatura_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlTemperatura" ADD CONSTRAINT "ControlTemperatura_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemuneracionEvento" ADD CONSTRAINT "RemuneracionEvento_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemuneracionEvento" ADD CONSTRAINT "RemuneracionEvento_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
