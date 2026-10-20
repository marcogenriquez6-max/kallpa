import { BitacoraService } from '../bitacora/bitacora.service';
import { Prisma } from '../generated/prisma/client';
import { EstadoContrato } from '../generated/prisma/enums';

export const redondear = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export const aMil = (n: number) => Math.round((n + Number.EPSILON) * 1000) / 1000;

/** Avanza el contrato a `hacia` solo si está en alguno de los estados `desde`. */
export async function avanzarContrato(
  tx: Prisma.TransactionClient,
  bitacora: BitacoraService,
  contratoId: string,
  desde: EstadoContrato[],
  hacia: EstadoContrato,
  usuarioId: string,
  motivo: string,
) {
  const c = await tx.contrato.findUniqueOrThrow({ where: { id: contratoId } });
  if (!desde.includes(c.estado)) return;
  await tx.contrato.update({ where: { id: contratoId }, data: { estado: hacia } });
  await bitacora.registrar(
    {
      entidad: 'Contrato',
      entidadId: contratoId,
      accion: 'CAMBIAR_ESTADO',
      usuarioId,
      estadoAnterior: c.estado,
      estadoNuevo: hacia,
      detalle: { motivo },
    },
    tx,
  );
}

/** Movimiento de kardex dentro de una transacción; el stock nunca queda negativo. */
export async function moverStock(
  tx: Prisma.TransactionClient,
  datos: {
    insumoId: string;
    cantidad: number;
    tipo: 'ENTRADA' | 'SALIDA';
    motivo: 'COMPRA' | 'ENTREGA';
    costoUnitario?: number | null;
    contratoId?: string | null;
    referenciaTipo: string;
    referenciaId: string;
    observacion?: string | null;
    usuarioId: string;
  },
) {
  const insumo = await tx.insumo.findUniqueOrThrow({ where: { id: datos.insumoId } });
  const saldo = aMil(Number(insumo.stockActual) + datos.cantidad);
  if (saldo < 0) {
    throw new Error(
      `Stock insuficiente de «${insumo.nombre}»: hay ${Number(insumo.stockActual)} ${insumo.unidadBaseCodigo}`,
    );
  }
  await tx.movimientoInventario.create({
    data: {
      insumoId: insumo.id,
      tipo: datos.tipo,
      motivo: datos.motivo,
      cantidad: aMil(datos.cantidad),
      saldo,
      costoUnitario: datos.costoUnitario ?? null,
      contratoId: datos.contratoId ?? null,
      referenciaTipo: datos.referenciaTipo,
      referenciaId: datos.referenciaId,
      observacion: datos.observacion ?? null,
      registradoPorId: datos.usuarioId,
    },
  });
  await tx.insumo.update({ where: { id: insumo.id }, data: { stockActual: saldo } });
}
