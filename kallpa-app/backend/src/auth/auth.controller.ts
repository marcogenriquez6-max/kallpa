import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { UsuarioSesion } from '../common/usuario-sesion';
import { AuthService } from './auth.service';
import { Publico } from './decorators/publico.decorator';
import { UsuarioActual } from './decorators/usuario-actual.decorator';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Publico()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('perfil')
  perfil(@UsuarioActual() usuario: UsuarioSesion) {
    return this.auth.perfil(usuario.id);
  }

  @Post('cambiar-password')
  @HttpCode(200)
  cambiarPassword(@UsuarioActual() usuario: UsuarioSesion, @Body() dto: CambiarPasswordDto) {
    return this.auth.cambiarPassword(usuario.id, dto);
  }
}
