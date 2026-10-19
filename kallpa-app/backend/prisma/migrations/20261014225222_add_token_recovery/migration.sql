-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "tokenExpiracion" TIMESTAMP(3),
ADD COLUMN     "tokenRecuperacion" TEXT;
