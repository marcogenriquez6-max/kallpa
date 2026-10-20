import { Controller, Get } from '@nestjs/common';

@Controller('calidad')
export class CalidadController {
  @Get()
  listar() {
    return [];
  }

  @Get('controles')
  controles() {
    return [];
  }
}
