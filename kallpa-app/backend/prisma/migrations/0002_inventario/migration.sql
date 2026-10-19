-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE');

-- CreateEnum
CREATE TYPE "MotivoMovimiento" AS ENUM ('COMPRA', 'DEVOLUCION', 'ENTREGA', 'MERMA', 'VENCIMIENTO', 'CONSUMO_INTERNO', 'INVENTARIO_INICIAL', 'CONTEO_FISICO', 'CORRECCION', 'OTRO');

-- AlterTable
ALTER TABLE "Insumo" ADD COLUMN     "stockMinimo" DECIMAL(12,3) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "MovimientoInventario" (
    "id" TEXT NOT NULL,
    "insumoId" TEXT NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "motivo" "MotivoMovimiento" NOT NULL,
    "cantidad" DECIMAL(12,3) NOT NULL,
    "saldo" DECIMAL(12,3) NOT NULL,
    "costoUnitario" DECIMAL(12,4),
    "contratoId" TEXT,
    "referenciaTipo" TEXT,
    "referenciaId" TEXT,
    "observacion" TEXT,
    "registradoPorId" TEXT NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoInventario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MovimientoInventario_insumoId_fechaHora_idx" ON "MovimientoInventario"("insumoId", "fechaHora");

-- CreateIndex
CREATE INDEX "MovimientoInventario_motivo_idx" ON "MovimientoInventario"("motivo");

-- CreateIndex
CREATE INDEX "MovimientoInventario_contratoId_idx" ON "MovimientoInventario"("contratoId");

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "Insumo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
