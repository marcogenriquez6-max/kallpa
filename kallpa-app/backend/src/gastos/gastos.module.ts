import { Module } from '@nestjs/common';
import { GastosController } from './gastos.controller';

@Module({
  controllers: [GastosController],
})
export class GastosModule {}
