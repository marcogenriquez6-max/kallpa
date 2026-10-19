import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Publico } from '../auth/decorators/publico.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('salud')
export class SaludController {
  constructor(private readonly prisma: PrismaService) {}

  /** Comprobación para Docker y el monitoreo del servidor. */
  @Publico()
  @Get()
  async estado() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { estado: 'ok', baseDeDatos: 'conectada', fecha: new Date().toISOString() };
    } catch {
      throw new ServiceUnavailableException({ estado: 'error', baseDeDatos: 'sin conexión' });
    }
  }
}
