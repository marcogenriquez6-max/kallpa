/**
 * Datos iniciales de Kallpa. Es idempotente: puede ejecutarse varias veces
 * sin duplicar registros (usa upsert por clave única).
 *   npx prisma db seed
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client';
import { LineaCatalogo, Rol, TipoItemCatalogo, TipoUnidad } from '../src/generated/prisma/enums';
import { PARAMETROS } from '../src/parametros/parametros.definicion';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

// ---------------------------------------------------------------------
// Unidades. Factor = equivalencia en la unidad base de su tipo
// (gramo, mililitro o unidad). Medidas de mercado boliviano:
// libra = 460 g, arroba = 25 libras = 11,5 kg, cuartilla = ¼ arroba.
// Las unidades de conteo solo se convierten entre sí si el insumo
// define su peso unitario (p. ej. huevo = 60 g).
// ---------------------------------------------------------------------
const UNIDADES: [string, string, TipoUnidad, number][] = [
  ['G', 'Gramo', TipoUnidad.MASA, 1],
  ['KG', 'Kilogramo', TipoUnidad.MASA, 1000],
  ['LIBRA', 'Libra (mercado)', TipoUnidad.MASA, 460],
  ['CUARTILLA', 'Cuartilla (¼ arroba)', TipoUnidad.MASA, 2875],
  ['ARROBA', 'Arroba', TipoUnidad.MASA, 11500],
  ['ML', 'Mililitro', TipoUnidad.VOLUMEN, 1],
  ['L', 'Litro', TipoUnidad.VOLUMEN, 1000],
  ['UNID', 'Unidad', TipoUnidad.CONTEO, 1],
  ['TALLO', 'Tallo', TipoUnidad.CONTEO, 1],
  ['ATADO', 'Atado', TipoUnidad.CONTEO, 1],
  ['LATA', 'Lata', TipoUnidad.CONTEO, 1],
  ['BOTELLA', 'Botella', TipoUnidad.CONTEO, 1],
  ['PAQUETE', 'Paquete', TipoUnidad.CONTEO, 1],
];

const CATEGORIAS = [
  'Proteínas',
  'Vegetales y frutas',
  'Lácteos y huevos',
  'Abarrotes',
  'Condimentos y especias',
  'Licores y bebidas',
  'Desechables y limpieza',
];

// ---------------------------------------------------------------------
// Catálogo del proyecto (sección 5). Precios actuales Bs 50 / 60 / 70;
// el ajuste recomendado a 55 / 65 / 75 se hace desde el sistema.
// Guarniciones y ensalada van incluidas en el plato (precio 0).
// ---------------------------------------------------------------------
type ItemSeed = [codigo: string, nombre: string, tipo: TipoItemCatalogo, precio: number, linea?: LineaCatalogo];
const T = TipoItemCatalogo;
const L = LineaCatalogo;
const CATALOGO: ItemSeed[] = [
  ['PF-POL-01', 'Suprema rellena de espinaca y queso criollo, en salsa de champiñones', T.PLATO_FONDO, 50, L.CLASICA],
  ['PF-POL-02', 'Pollo al vino tinto de Tarija con hierbas andinas', T.PLATO_FONDO, 50, L.CLASICA],
  ['PF-POL-03', 'Pollo glaseado en miel de caña y mostaza antigua', T.PLATO_FONDO, 50, L.CLASICA],
  ['PF-CER-01', 'Lomo de cerdo en salsa de tumbo con reducción de su jugo', T.PLATO_FONDO, 60, L.RESERVA],
  ['PF-CER-02', 'Lomo de cerdo en ají amarillo y durazno con toque de singani', T.PLATO_FONDO, 60, L.RESERVA],
  ['PF-CER-03', 'Costillar de cerdo braseado en salsa de ají panca y cerveza', T.PLATO_FONDO, 60, L.RESERVA],
  ['PF-RES-01', 'Medallón de lomo fino en salsa de vino tinto Tannat', T.PLATO_FONDO, 70, L.GRAN_RESERVA],
  ['PF-RES-02', 'Lomo fino a la pimienta flambeado con singani', T.PLATO_FONDO, 70, L.GRAN_RESERVA],
  ['PF-RES-03', 'Asado de res braseado ocho horas, en su jugo', T.PLATO_FONDO, 70, L.GRAN_RESERVA],
  ['GU-01', 'Croquetas de papa', T.GUARNICION, 0],
  ['GU-02', 'Puré de papa cremoso', T.GUARNICION, 0],
  ['GU-03', 'Puré rústico de papa con queso', T.GUARNICION, 0],
  ['GU-04', 'Arroz graneado con verduras', T.GUARNICION, 0],
  ['GU-05', 'Arroz con queso', T.GUARNICION, 0],
  ['GU-06', 'Fideo al pesto de albahaca', T.GUARNICION, 0],
  ['GU-07', 'Papas doradas al romero', T.GUARNICION, 0],
  ['EN-01', 'Ensalada de la casa', T.ENSALADA, 0],
  ['PO-01', 'Tres leches', T.POSTRE, 12],
  ['PO-02', 'Mousse de maracuyá', T.POSTRE, 15],
  ['PO-03', 'Cheesecake de tumbo', T.POSTRE, 18],
  ['PO-04', 'Panna cotta de api morado', T.POSTRE, 15],
  ['CO-01', 'Cóctel de bienvenida (chuflay, singani sour o yungueñito)', T.COCTELERIA, 15],
  ['CO-02', 'Barra libre de coctelería (2 horas)', T.COCTELERIA, 35],
  ['BO-01', 'Mesa de bocaditos (6 por persona, salados y dulces)', T.BOCADITOS, 22],
  ['SE-01', 'Garzón adicional', T.SERVICIO, 150],
  ['SE-02', 'Cargo fijo de servicio (eventos pequeños)', T.SERVICIO, 800],
];

// ---------------------------------------------------------------------
// Insumos base: los del formulario F-001 de Percy (con las unidades
// corregidas) más los que exige el catálogo. Los pesos unitarios son
// referencias de mercado que el chef debe validar.
// [nombre, categoría, unidad base, unidad de compra, peso unit. g, requiere frío, especificación, marca]
// ---------------------------------------------------------------------
type InsumoSeed = [string, string, string, string | null, number | null, boolean, string?, string?];
const INSUMOS: InsumoSeed[] = [
  ['Pechuga de pollo', 'Proteínas', 'G', 'KG', null, true, 'Sin hueso, sin piel'],
  ['Pollo entero', 'Proteínas', 'G', 'KG', null, true],
  ['Lomo de cerdo', 'Proteínas', 'G', 'KG', null, true],
  ['Costillar de cerdo', 'Proteínas', 'G', 'KG', null, true],
  ['Lomo fino de res', 'Proteínas', 'G', 'KG', null, true],
  ['Carne de res para asado', 'Proteínas', 'G', 'KG', null, true, 'Punta de pecho o tapa'],
  ['Jamón', 'Proteínas', 'G', 'KG', null, true, 'Laminado'],
  ['Papa', 'Vegetales y frutas', 'G', 'ARROBA', null, false, 'Holandesa'],
  ['Papa morada', 'Vegetales y frutas', 'G', 'CUARTILLA', null, false, 'Pinta boca'],
  ['Lechuga', 'Vegetales y frutas', 'UNID', 'UNID', 400, false],
  ['Manzana verde', 'Vegetales y frutas', 'UNID', 'UNID', 180, false],
  ['Manzana roja', 'Vegetales y frutas', 'UNID', 'UNID', 180, false],
  ['Limón', 'Vegetales y frutas', 'UNID', 'UNID', 40, false],
  ['Apio', 'Vegetales y frutas', 'TALLO', 'ATADO', 40, false],
  ['Zanahoria', 'Vegetales y frutas', 'G', 'KG', null, false],
  ['Pimentón', 'Vegetales y frutas', 'UNID', 'UNID', 150, false],
  ['Arveja', 'Vegetales y frutas', 'G', 'KG', null, false],
  ['Cebollín', 'Vegetales y frutas', 'G', 'ATADO', null, false],
  ['Cebolla', 'Vegetales y frutas', 'G', 'KG', null, false],
  ['Espinaca', 'Vegetales y frutas', 'G', 'ATADO', null, false],
  ['Champiñones', 'Vegetales y frutas', 'G', 'KG', null, true],
  ['Tumbo', 'Vegetales y frutas', 'UNID', 'UNID', 120, false],
  ['Maracuyá', 'Vegetales y frutas', 'UNID', 'UNID', 100, false],
  ['Albahaca', 'Vegetales y frutas', 'G', 'ATADO', null, false],
  ['Queso mozzarella', 'Lácteos y huevos', 'G', 'KG', null, true],
  ['Queso criollo', 'Lácteos y huevos', 'G', 'KG', null, true],
  ['Leche', 'Lácteos y huevos', 'ML', 'L', null, true, undefined, 'PIL'],
  ['Crema de leche', 'Lácteos y huevos', 'ML', 'L', null, true],
  ['Huevo', 'Lácteos y huevos', 'UNID', 'UNID', 60, false],
  ['Margarina', 'Lácteos y huevos', 'G', 'KG', null, false],
  ['Arroz', 'Abarrotes', 'G', 'ARROBA', null, false, undefined, 'Grano de Oro'],
  ['Harina de trigo', 'Abarrotes', 'G', 'KG', null, false],
  ['Pan molido', 'Abarrotes', 'G', 'KG', null, false],
  ['Fideo', 'Abarrotes', 'G', 'KG', null, false],
  ['Pasas', 'Abarrotes', 'G', 'KG', null, false],
  ['Almendras', 'Abarrotes', 'G', 'KG', null, false],
  ['Choclo en lata', 'Abarrotes', 'LATA', 'LATA', null, false, 'Lata pequeña'],
  ['Aceite vegetal', 'Abarrotes', 'ML', 'L', null, false],
  ['Miel de caña', 'Abarrotes', 'ML', 'L', null, false],
  ['Mostaza', 'Condimentos y especias', 'G', 'KG', null, false],
  ['Mostaza antigua', 'Condimentos y especias', 'G', 'KG', null, false],
  ['Mayonesa', 'Condimentos y especias', 'G', 'KG', null, false],
  ['Sal', 'Condimentos y especias', 'G', 'KG', null, false],
  ['Comino', 'Condimentos y especias', 'G', 'KG', null, false],
  ['Pimienta negra', 'Condimentos y especias', 'G', 'KG', null, false],
  ['Nuez moscada', 'Condimentos y especias', 'UNID', 'UNID', 7, false],
  ['Curry', 'Condimentos y especias', 'G', 'KG', null, false],
  ['Ají amarillo', 'Condimentos y especias', 'G', 'KG', null, false],
  ['Ají panca', 'Condimentos y especias', 'G', 'KG', null, false],
  ['Romero', 'Condimentos y especias', 'G', 'ATADO', null, false],
  ['Vino tinto de Tarija', 'Licores y bebidas', 'ML', 'BOTELLA', null, false],
  ['Vino tinto Tannat', 'Licores y bebidas', 'ML', 'BOTELLA', null, false],
  ['Singani', 'Licores y bebidas', 'ML', 'BOTELLA', null, false],
  ['Cerveza', 'Licores y bebidas', 'ML', 'BOTELLA', null, false],
];

// ---------------------------------------------------------------------
// Usuarios de los socios. Los correos son provisionales: la gerente debe
// reemplazarlos por los reales. Todos entran con SEED_PASSWORD y el
// sistema les exige cambiarla en el primer ingreso.
// ---------------------------------------------------------------------
const USUARIOS: [string, string, Rol][] = [
  ['Maribel Pantoja', 'maribel@kallpa.bo', Rol.GERENTE],
  ['Percy Irahola', 'percy@kallpa.bo', Rol.GERENTE_GASTRONOMICO],
  ['Victor Blacutt', 'victor@kallpa.bo', Rol.LOGISTICA],
  ['Alex Pantoja', 'alex@kallpa.bo', Rol.LOGISTICA],
  ['Paola Pantoja', 'paola@kallpa.bo', Rol.LOGISTICA],
  ['Marina Montán', 'marina@kallpa.bo', Rol.LOGISTICA],
];

async function main() {
  const passwordInicial = process.env.SEED_PASSWORD;
  if (!passwordInicial || passwordInicial.length < 8) {
    throw new Error('Defina SEED_PASSWORD (mínimo 8 caracteres) en el archivo .env');
  }

  for (const [codigo, nombre, tipo, factorBase] of UNIDADES) {
    await prisma.unidadMedida.upsert({
      where: { codigo },
      update: { nombre, tipo, factorBase },
      create: { codigo, nombre, tipo, factorBase },
    });
  }

  const categoriaId = new Map<string, number>();
  for (const [orden, nombre] of CATEGORIAS.entries()) {
    const c = await prisma.categoriaInsumo.upsert({
      where: { nombre },
      update: { orden },
      create: { nombre, orden },
    });
    categoriaId.set(nombre, c.id);
  }

  for (const [nombre, cat, base, compra, peso, frio, espec, marca] of INSUMOS) {
    const datos = {
      categoriaId: categoriaId.get(cat)!,
      unidadBaseCodigo: base,
      unidadCompraCodigo: compra,
      pesoUnitarioGramos: peso,
      requiereFrio: frio,
      especificacionHabitual: espec ?? null,
      marcaPreferida: marca ?? null,
    };
    await prisma.insumo.upsert({ where: { nombre }, update: datos, create: { nombre, ...datos } });
  }

  for (const [codigo, nombre, tipo, precioVenta, linea] of CATALOGO) {
    // Si ya existe no se pisa el precio: puede haberlo ajustado la gerente.
    await prisma.itemCatalogo.upsert({
      where: { codigo },
      update: { nombre, tipo, linea: linea ?? null },
      create: { codigo, nombre, tipo, precioVenta, linea: linea ?? null },
    });
  }

  for (const [clave, def] of Object.entries(PARAMETROS)) {
    // Tampoco se pisan valores ya modificados desde el sistema.
    await prisma.parametro.upsert({
      where: { clave },
      update: { descripcion: def.descripcion },
      create: { clave, valor: String(def.valor), descripcion: def.descripcion },
    });
  }

  const hash = await bcrypt.hash(passwordInicial, 12);
  for (const [nombre, email, rol] of USUARIOS) {
    await prisma.usuario.upsert({
      where: { email },
      update: {},
      create: { nombre, email, rol, passwordHash: hash, debeCambiarPassword: true },
    });
  }

  console.log(
    `Seed completo: ${UNIDADES.length} unidades, ${CATEGORIAS.length} categorías, ` +
      `${INSUMOS.length} insumos, ${CATALOGO.length} ítems de catálogo, ` +
      `${Object.keys(PARAMETROS).length} parámetros, ${USUARIOS.length} usuarios.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
