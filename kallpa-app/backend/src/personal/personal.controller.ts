import { Controller, Get } from '@nestjs/common';

@Controller('personal')
export class PersonalController {
  @Get()
  listar() {
    return [];
  }
}
