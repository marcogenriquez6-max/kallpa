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
import { CatalogoModule } from './catalogo/catalogo.module';
import { UnidadesModule } from './unidades/unidades.module';
import { CategoriasInsumoModule } from './categorias-insumo/categorias-insumo.module';
import { InsumosModule } from './insumos/insumos.module';
import { ClientesModule } from './clientes/clientes.module';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { ContratosModule } from './contratos/contratos.module';
import { SolicitudesModule } from './solicitudes/solicitudes.module';
import { ComprasModule } from './compras/compras.module';
import { InventarioModule } from './inventario/inventario.module';
import { EntregasModule } from './entregas/entregas.module';
import { ProduccionModule } from './produccion/produccion.module';
import { PersonalModule } from './personal/personal.module';
import { CalidadModule } from './calidad/calidad.module';
import { GastosModule } from './gastos/gastos.module';
import { ReportesModule } from './reportes/reportes.module';

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
    UnidadesModule,
    CategoriasInsumoModule,
    InsumosModule,
    ClientesModule,
    ProveedoresModule,
    ContratosModule,
    SolicitudesModule,
    ComprasModule,
    InventarioModule,
    EntregasModule,
    ProduccionModule,
    PersonalModule,
    CalidadModule,
    GastosModule,
    ReportesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
