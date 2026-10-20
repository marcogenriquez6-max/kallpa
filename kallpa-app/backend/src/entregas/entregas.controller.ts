import { Controller, Get } from '@nestjs/common';

@Controller('entregas')
export class EntregasController {
  @Get()
  listar() {
    return [];
  }
}
