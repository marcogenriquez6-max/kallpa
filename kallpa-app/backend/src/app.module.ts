import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { BitacoraModule } from './bitacora/bitacora.module';
import { ParametrosModule } from './parametros/parametros.module';
import { PrismaModule } from './prisma/prisma.module';
import { SaludModule } from './salud/salud.module';
import { UsuariosModule } from './usuarios/usuarios.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    BitacoraModule,
    AuthModule,
    UsuariosModule,
    ParametrosModule,
    SaludModule,
  ],
  providers: [
    // Todo endpoint exige sesión salvo los marcados con @Publico();
    // después se verifica el rol con @Roles(...).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
