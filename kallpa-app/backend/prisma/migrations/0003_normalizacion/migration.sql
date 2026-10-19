-- Normalización (3FN): se elimina la dependencia transitiva en CompraItem.
-- El insumo y su especificación se derivan de SolicitudItem (vía solicitudItemId),
-- por lo que repetir "insumoId" era redundante.

-- Integridad de dominio: la etapa de producción pasa de texto libre a un dominio fijo.
-- CreateEnum
CREATE TYPE "EtapaProduccion" AS ENUM ('MISE_EN_PLACE', 'COCCION', 'EMPLATADO', 'TRASLADO', 'SERVICIO');

-- DropForeignKey
ALTER TABLE "CompraItem" DROP CONSTRAINT "CompraItem_insumoId_fkey";

-- AlterTable
ALTER TABLE "CompraItem" DROP COLUMN "insumoId";

-- AlterTable
ALTER TABLE "RegistroProduccion" DROP COLUMN "etapa",
ADD COLUMN     "etapa" "EtapaProduccion" NOT NULL;
