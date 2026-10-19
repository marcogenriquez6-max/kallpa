import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BitacoraService } from '../bitacora/bitacora.service';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PARAMETROS } from './parametros.definicion';

@Injectable()
export class ParametrosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacora: BitacoraService,
  ) {}

  listar() {
    return this.prisma.parametro.findMany({ orderBy: { clave: 'asc' } });
  }

  /** Valor numérico vigente; si aún no está en la base, usa el valor por defecto. */
  async numero(clave: keyof typeof PARAMETROS): Promise<number> {
    const fila = await this.prisma.parametro.findUnique({ where: { clave } });
    return fila ? Number(fila.valor) : PARAMETROS[clave].valor;
  }

  async actualizar(clave: string, valor: number, usuarioId: string) {
    const def = PARAMETROS[clave];
    if (!def) throw new NotFoundException(`Parámetro desconocido: ${clave}`);
    if (valor < def.min || valor > def.max) {
      throw new BadRequestException(`${clave} debe estar entre ${def.min} y ${def.max}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const anterior = await tx.parametro.findUnique({ where: { clave } });
      await this.validarCoherencia(tx, clave, valor);
      const actualizado = await tx.parametro.upsert({
        where: { clave },
        update: { valor: String(valor) },
        create: { clave, valor: String(valor), descripcion: def.descripcion },
      });
      await this.bitacora.registrar(
        {
          entidad: 'Parametro',
          entidadId: clave,
          accion: 'EDITAR',
          usuarioId,
          estadoAnterior: anterior?.valor,
          estadoNuevo: String(valor),
        },
        tx,
      );
      return actualizado;
    });
  }

  /** Reglas que involucran a más de un parámetro. */
  private async validarCoherencia(
    tx: Prisma.TransactionClient,
    clave: string,
    valor: number,
  ) {
    const leer = async (c: string) => {
      const f = await tx.parametro.findUnique({ where: { clave: c } });
      return f ? Number(f.valor) : PARAMETROS[c].valor;
    };

    if (clave === 'PLATOS_MIN' && valor > (await leer('PLATOS_MAX'))) {
      throw new BadRequestException('PLATOS_MIN no puede superar a PLATOS_MAX');
    }
    if (clave === 'PLATOS_MAX' && valor < (await leer('PLATOS_MIN'))) {
      throw new BadRequestException('PLATOS_MAX no puede ser menor que PLATOS_MIN');
    }
    const pares: Record<string, string> = {
      PARTICIPACION_FAMILIA: 'PARTICIPACION_PERCY',
      PARTICIPACION_PERCY: 'PARTICIPACION_FAMILIA',
    };
    if (pares[clave] && valor + (await leer(pares[clave])) !== 100) {
      throw new BadRequestException(
        'Las participaciones deben sumar 100%: actualice primero la otra parte o ajústelas juntas desde el contrato entre socios',
      );
    }
    if (clave === 'RESERVA_UTILIDADES_PORCENTAJE' || clave === 'REINVERSION_PORCENTAJE') {
      const otra = clave === 'REINVERSION_PORCENTAJE' ? 'RESERVA_UTILIDADES_PORCENTAJE' : 'REINVERSION_PORCENTAJE';
      if (valor + (await leer(otra)) > 100) {
        throw new BadRequestException('Reserva y reinversión juntas no pueden superar el 100%');
      }
    }
  }
}
