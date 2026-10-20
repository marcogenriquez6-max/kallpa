import { Module } from '@nestjs/common';
import { CalidadController } from './calidad.controller';

@Module({
  controllers: [CalidadController],
})
export class CalidadModule {}
