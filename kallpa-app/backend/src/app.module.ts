import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { BitacoraModule } from './bitacora/bitacora.module';
import { CatalogoModule } from './catalogo/catalogo.module';
import { ContratosModule } from './contratos/contratos.module';
import { InventarioModule } from './inventario/inventario.module';
import { ParametrosModule } from './parametros/parametros.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { SaludModule } from './salud/salud.module';
import { SolicitudesModule } from './solicitudes/solicitudes.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ComprasModule } from './compras/compras.module';
import { EntregasModule } from './entregas/entregas.module';
import { ProduccionModule } from './produccion/produccion.module';
import { CalidadModule } from './calidad/calidad.module';
import { PersonalModule } from './personal/personal.module';
import { FinanzasModule } from './finanzas/finanzas.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    BitacoraModule,
    AuthModule,
    UsuariosModule,
    ParametrosModule,
    SaludModule,
    CatalogoModule,
    ContratosModule,
    ProveedoresModule,
    SolicitudesModule,
    InventarioModule,
    ComprasModule,
    EntregasModule,
    ProduccionModule,
    CalidadModule,
    PersonalModule,
    FinanzasModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
