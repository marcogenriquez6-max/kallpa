import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface EntradaBitacora {
  entidad: string;
  entidadId: string;
  accion: 'CREAR' | 'EDITAR' | 'CAMBIAR_ESTADO' | 'ANULAR' | 'INGRESO' | 'CAMBIO_PASSWORD';
  usuarioId: string;
  estadoAnterior?: string;
  estadoNuevo?: string;
  detalle?: Prisma.InputJsonValue;
}

/** Cliente de Prisma normal o el de una transacción en curso. */
type ClienteDb = PrismaService | Prisma.TransactionClient;

/**
 * Registro de auditoría de solo inserción. No expone métodos de edición ni borrado:
 * es la constancia de "quién hizo qué y cuándo" en cada paso del contrato.
 */
@Injectable()
export class BitacoraService {
  constructor(private readonly prisma: PrismaService) {}

  /** Pase `tx` para que la entrada se guarde en la misma transacción que el cambio. */
  registrar(entrada: EntradaBitacora, tx: ClienteDb = this.prisma) {
    return tx.bitacora.create({ data: entrada });
  }

  listar(filtro: { entidad?: string; entidadId?: string; limite?: number }) {
    return this.prisma.bitacora.findMany({
      where: { entidad: filtro.entidad, entidadId: filtro.entidadId },
      orderBy: { fechaHora: 'desc' },
      take: Math.min(filtro.limite ?? 100, 500),
      include: { usuario: { select: { nombre: true, rol: true } } },
    });
  }
}
