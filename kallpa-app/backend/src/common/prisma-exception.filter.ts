import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '../generated/prisma/client';

/** Convierte errores conocidos de la base de datos en respuestas HTTP claras. */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(error: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const mapa: Record<string, [HttpStatus, string]> = {
      P2025: [HttpStatus.NOT_FOUND, 'El registro solicitado no existe'],
      P2002: [HttpStatus.CONFLICT, 'Ya existe un registro con esos datos únicos'],
      P2003: [HttpStatus.BAD_REQUEST, 'El registro hace referencia a datos inexistentes'],
    };
    const [status, mensaje] = mapa[error.code] ?? [
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Error interno de base de datos',
    ];
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) this.logger.error(error);
    res.status(status).json({ statusCode: status, message: mensaje, codigo: error.code });
  }
}
