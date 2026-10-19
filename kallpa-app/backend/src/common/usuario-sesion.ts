import { Rol } from '../generated/prisma/enums';

/** Datos del usuario autenticado que viajan en cada petición. */
export interface UsuarioSesion {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
}
