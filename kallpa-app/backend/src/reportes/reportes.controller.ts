import { Controller, Get } from '@nestjs/common';

@Controller('reportes')
export class ReportesController {
  @Get()
  listar() {
    return [];
  }
}
