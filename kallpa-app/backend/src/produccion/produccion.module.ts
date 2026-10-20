import { Module } from '@nestjs/common';
import { ProduccionController } from './produccion.controller';

@Module({
  controllers: [ProduccionController],
})
export class ProduccionModule {}
