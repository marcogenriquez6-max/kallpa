import { Controller, Get } from '@nestjs/common';

@Controller('gastos')
export class GastosController {
  @Get()
  listar() {
    return [];
  }
}
