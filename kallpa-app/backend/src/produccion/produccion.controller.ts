import { Controller, Get } from '@nestjs/common';

@Controller('produccion')
export class ProduccionController {
  @Get()
  listar() {
    return [];
  }

  @Get('ordenes')
  ordenes() {
    return [];
  }
}
