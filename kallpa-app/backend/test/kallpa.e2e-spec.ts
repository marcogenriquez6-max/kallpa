import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  cabecera,
  crearAplicacion,
  iniciarSesion,
  SUFIJO,
  USUARIOS,
} from './utils';

/** Códigos esperados (Nest: POST=201 salvo @HttpCode; errores 400/401/403/404). */
describe('KALLPA API (e2e)', () => {
  let app: INestApplication;
  let http: Parameters<typeof request>[0];
  let gerente: string;
  let gg: string;
  let logistica: string;

  // Datos compartidos entre bloques (se crean en orden).
  let insumoId: string;
  let insumoUnidad: string;
  let insumoStockInicial: number;
  let clienteId: string;
  let itemId: string;
  let itemCodigo: string;
  let fichaId: string;
  let contratoId: string;
  let contratoCodigo: string;
  let contratoBId: string;
  let proveedorId: string;

  beforeAll(async () => {
    app = await crearAplicacion();
    http = app.getHttpServer();
    gerente = await iniciarSesion(app, USUARIOS.gerente);
    gg = await iniciarSesion(app, USUARIOS.gerenteGastronomico);
    logistica = await iniciarSesion(app, USUARIOS.logistica);

    const ex = await request(http)
      .get('/api/inventario/existencias')
      .set(cabecera(gg))
      .expect(200);
    expect(Array.isArray(ex.body)).toBe(true);
    expect(ex.body.length).toBeGreaterThan(0);
    insumoId = ex.body[0].id;
    insumoUnidad = ex.body[0].unidadBaseCodigo;
    insumoStockInicial = Number(ex.body[0].stockActual);
  });

  afterAll(async () => {
    await app?.close();
  });

  // ------------------------------------------------------------------
  describe('Salud (público)', () => {
    it('GET /api/salud responde sin autenticación', async () => {
      const res = await request(http).get('/api/salud').expect(200);
      expect(res.body.estado).toBe('ok');
      expect(res.body.baseDeDatos).toBe('conectada');
    });
  });

  // ------------------------------------------------------------------
  describe('Autenticación', () => {
    it('rechaza contraseña incorrecta (401)', async () => {
      await request(http)
        .post('/api/auth/login')
        .send({ email: USUARIOS.gerente, password: 'contraseña-mala' })
        .expect(401);
    });

    it('rechaza correo inexistente (401, mismo mensaje)', async () => {
      const res = await request(http)
        .post('/api/auth/login')
        .send({ email: 'fantasma@kallpa.bo', password: 'loquesea' })
        .expect(401);
      expect(res.body.message).toBe('Correo o contraseña incorrectos');
    });

    it('rechaza cuerpo inválido (400)', async () => {
      await request(http).post('/api/auth/login').send({ email: 'no-es-correo' }).expect(400);
    });

    it('inicia sesión y devuelve token + usuario', async () => {
      const res = await request(http)
        .post('/api/auth/login')
        .send({ email: USUARIOS.gerente, password: process.env.SEED_PASSWORD })
        .expect(200);
      expect(typeof res.body.token).toBe('string');
      expect(res.body.usuario.email).toBe(USUARIOS.gerente);
      expect(res.body.usuario.rol).toBe('GERENTE');
    });

    it('protege /api/auth/perfil sin token (401)', async () => {
      await request(http).get('/api/auth/perfil').expect(401);
    });

    it('protege /api/auth/perfil con token inválido (401)', async () => {
      await request(http).get('/api/auth/perfil').set(cabecera('token-falso')).expect(401);
    });

    it('devuelve el perfil autenticado', async () => {
      const res = await request(http).get('/api/auth/perfil').set(cabecera(gerente)).expect(200);
      expect(res.body.email).toBe(USUARIOS.gerente);
      expect(res.body).not.toHaveProperty('passwordHash');
    });
  });

  // ------------------------------------------------------------------
  describe('Guard de roles y validación', () => {
    it('LOGISTICA no puede listar usuarios (403)', async () => {
      await request(http).get('/api/usuarios').set(cabecera(logistica)).expect(403);
    });

    it('GERENTE sí puede listar usuarios (200)', async () => {
      const res = await request(http).get('/api/usuarios').set(cabecera(gerente)).expect(200);
      expect(res.body.length).toBeGreaterThanOrEqual(6);
    });

    it('sin token no se accede a usuarios (401)', async () => {
      await request(http).get('/api/usuarios').expect(401);
    });

    it('LOGISTICA no puede crear contratos (403)', async () => {
      await request(http).post('/api/contratos').set(cabecera(logistica)).send({}).expect(403);
    });

    it('GERENTE_GASTRONOMICO no puede editar parámetros (403)', async () => {
      await request(http)
        .patch('/api/parametros/PLATOS_MIN')
        .set(cabecera(gg))
        .send({ valor: 100 })
        .expect(403);
    });

    it('rechaza campos no declarados (400)', async () => {
      await request(http)
        .post('/api/clientes')
        .set(cabecera(gerente))
        .send({ nombre: 'X', telefono: '12345678', tipo: 'SOCIAL', campoPirata: true })
        .expect(400);
    });
  });

  // ------------------------------------------------------------------
  describe('Clientes', () => {
    it('crea un cliente', async () => {
      const res = await request(http)
        .post('/api/clientes')
        .set(cabecera(gerente))
        .send({ nombre: `Cliente ${SUFIJO}`, telefono: '70011223', tipo: 'SOCIAL' })
        .expect(201);
      clienteId = res.body.id;
      expect(clienteId).toBeTruthy();
      expect(res.body.tipo).toBe('SOCIAL');
    });

    it('lista y encuentra al cliente', async () => {
      const res = await request(http)
        .get(`/api/clientes?q=${SUFIJO}`)
        .set(cabecera(gg))
        .expect(200);
      expect(res.body.some((c: { id: string }) => c.id === clienteId)).toBe(true);
    });

    it('obtiene el cliente por id', async () => {
      const res = await request(http)
        .get(`/api/clientes/${clienteId}`)
        .set(cabecera(gg))
        .expect(200);
      expect(res.body.id).toBe(clienteId);
    });
  });

  // ------------------------------------------------------------------
  describe('Catálogo y fichas técnicas', () => {
    it('crea un ítem de catálogo', async () => {
      itemCodigo = `PF-E2E-${SUFIJO}`.slice(0, 20);
      const res = await request(http)
        .post('/api/catalogo/items')
        .set(cabecera(gg))
        .send({ codigo: itemCodigo, nombre: `Plato ${SUFIJO}`, tipo: 'PLATO_FONDO', precioVenta: 55 })
        .expect(201);
      itemId = res.body.id;
      expect(itemId).toBeTruthy();
    });

    it('crea la ficha técnica vigente del ítem', async () => {
      const res = await request(http)
        .post(`/api/catalogo/items/${itemId}/fichas`)
        .set(cabecera(gg))
        .send({
          porcionGramos: 300,
          lineas: [{ insumoId, cantidadPorPorcion: 100, unidadCodigo: insumoUnidad }],
        })
        .expect(201);
      fichaId = res.body.id;
      expect(res.body.vigente).toBe(true);
      expect(res.body.version).toBe(1);
      expect(res.body.lineas.length).toBe(1);
    });

    it('calcula el costo de la ficha (posiblemente incompleto sin precios)', async () => {
      const res = await request(http)
        .get(`/api/catalogo/fichas/${fichaId}/costo`)
        .set(cabecera(gg))
        .expect(200);
      expect(res.body).toHaveProperty('costoPorcion');
      expect(Array.isArray(res.body.detalle)).toBe(true);
    });

    it('rechaza código de ítem duplicado (409)', async () => {
      await request(http)
        .post('/api/catalogo/items')
        .set(cabecera(gg))
        .send({ codigo: itemCodigo, nombre: 'Duplicado', tipo: 'PLATO_FONDO', precioVenta: 10 })
        .expect(409);
    });

    it('LOGISTICA no puede crear ítems (403)', async () => {
      await request(http)
        .post('/api/catalogo/items')
        .set(cabecera(logistica))
        .send({ codigo: 'X-E2E', nombre: 'Nope', tipo: 'PLATO_FONDO', precioVenta: 1 })
        .expect(403);
    });
  });

  // ------------------------------------------------------------------
  describe('Contratos: alta, pagos y estados', () => {
    const fechaFutura = '2026-12-31T19:00:00.000Z';

    function cuerpoContrato(numeroPlatos = 120) {
      return {
        clienteId,
        tipoEvento: 'Boda',
        fechaEvento: fechaFutura,
        horaServicio: '19:00',
        lugar: `Salón ${SUFIJO}`,
        numeroPlatos,
        items: [{ itemId, cantidad: numeroPlatos }],
      };
    }

    it('rechaza contrato sin ítems (400)', async () => {
      await request(http)
        .post('/api/contratos')
        .set(cabecera(gerente))
        .send({ ...cuerpoContrato(), items: [] })
        .expect(400);
    });

    it('rechaza número de platos fuera de rango (400)', async () => {
      await request(http)
        .post('/api/contratos')
        .set(cabecera(gerente))
        .send(cuerpoContrato(50))
        .expect(400);
    });

    it('crea el contrato y calcula total/garzones', async () => {
      const res = await request(http)
        .post('/api/contratos')
        .set(cabecera(gerente))
        .send(cuerpoContrato())
        .expect(201);
      contratoId = res.body.id;
      contratoCodigo = res.body.codigo;
      expect(contratoCodigo).toMatch(/^KAL-CT-\d{4}-\d{4}$/);
      expect(res.body.estado).toBe('COTIZACION');
      expect(Number(res.body.precioTotal)).toBe(6600); // 55 * 120
      expect(res.body.garzonesIncluidos).toBe(5); // ceil(120/25)
    });

    it('obtiene el contrato con su resumen', async () => {
      const res = await request(http)
        .get(`/api/contratos/${contratoId}`)
        .set(cabecera(gg))
        .expect(200);
      expect(res.body.resumen.anticipoPorcentaje).toBe(50);
      expect(res.body.resumen.anticipoEsperado).toBe(3300);
      expect(res.body.resumen.saldo).toBe(6600);
      expect(res.body.items.length).toBe(1);
    });

    it('registra el anticipo y confirma el contrato', async () => {
      await request(http)
        .post(`/api/contratos/${contratoId}/pagos`)
        .set(cabecera(gerente))
        .send({ tipo: 'ANTICIPO', monto: 3300, metodo: 'efectivo' })
        .expect(201);
      const res = await request(http)
        .get(`/api/contratos/${contratoId}`)
        .set(cabecera(gerente))
        .expect(200);
      expect(res.body.estado).toBe('CONFIRMADO');
      expect(res.body.resumen.abonado).toBe(3300);
      expect(res.body.resumen.saldo).toBe(3300);
    });

    it('rechaza una transición de estado inválida (400)', async () => {
      await request(http)
        .patch(`/api/contratos/${contratoId}/estado`)
        .set(cabecera(gerente))
        .send({ estado: 'LIQUIDADO' })
        .expect(400);
    });

    it('avanza a PLANIFICADO', async () => {
      const res = await request(http)
        .patch(`/api/contratos/${contratoId}/estado`)
        .set(cabecera(gerente))
        .send({ estado: 'PLANIFICADO' })
        .expect(200);
      expect(res.body.estado).toBe('PLANIFICADO');
    });

    it('confirma el número final de platos', async () => {
      const res = await request(http)
        .post(`/api/contratos/${contratoId}/confirmar-platos`)
        .set(cabecera(gerente))
        .send({ numeroPlatosFinal: 120 })
        .expect(201);
      expect(res.body.numeroPlatosFinal).toBe(120);
    });
  });

  // ------------------------------------------------------------------
  describe('Solicitud de insumos (F-001)', () => {
    beforeAll(async () => {
      const res = await request(http)
        .post('/api/contratos')
        .set(cabecera(gerente))
        .send({
          clienteId,
          tipoEvento: 'Bautizo',
          fechaEvento: '2027-01-15T12:00:00.000Z',
          horaServicio: '12:00',
          lugar: `Salón B ${SUFIJO}`,
          numeroPlatos: 150,
          items: [{ itemId, cantidad: 150 }],
        })
        .expect(201);
      contratoBId = res.body.id;
      await request(http)
        .post(`/api/contratos/${contratoBId}/pagos`)
        .set(cabecera(gerente))
        .send({ tipo: 'ANTICIPO', monto: 4125, metodo: 'transferencia' })
        .expect(201);
    });

    let solicitudId: string;

    it('genera la solicitud por explosión de insumos', async () => {
      const res = await request(http)
        .post('/api/solicitudes')
        .set(cabecera(gg))
        .send({ contratoId: contratoBId })
        .expect(201);
      solicitudId = res.body.id;
      expect(res.body.folio).toMatch(/^KAL-SI-\d{4}-\d{4}$/);
      expect(res.body.estado).toBe('BORRADOR');
      expect(res.body.items.length).toBeGreaterThan(0);
      expect(res.body.platosBase).toBe(150);
    });

    it('rechaza generar solicitud de un contrato inexistente (400)', async () => {
      await request(http)
        .post('/api/solicitudes')
        .set(cabecera(gg))
        .send({ contratoId: '00000000-0000-0000-0000-000000000000' })
        .expect(400);
    });

    it('agrega un insumo manualmente', async () => {
      const res = await request(http)
        .post(`/api/solicitudes/${solicitudId}/items`)
        .set(cabecera(gg))
        .send({ insumoId, cantidad: 500, origen: 'COMPRAR' })
        .expect(201);
      expect(res.body.insumoId).toBe(insumoId);
    });

    it('aprueba la solicitud y planifica el contrato', async () => {
      const res = await request(http)
        .post(`/api/solicitudes/${solicitudId}/aprobar`)
        .set(cabecera(gg))
        .expect(201);
      expect(res.body.estado).toBe('APROBADA');

      const contrato = await request(http)
        .get(`/api/contratos/${contratoBId}`)
        .set(cabecera(gg))
        .expect(200);
      expect(contrato.body.estado).toBe('PLANIFICADO');
    });

    it('no permite volver a aprobar (400)', async () => {
      await request(http)
        .post(`/api/solicitudes/${solicitudId}/aprobar`)
        .set(cabecera(gg))
        .expect(400);
    });

    it('no permite editar insumos fuera de BORRADOR (400)', async () => {
      await request(http)
        .post(`/api/solicitudes/${solicitudId}/items`)
        .set(cabecera(gg))
        .send({ insumoId, cantidad: 10 })
        .expect(400);
    });

    it('anula una solicitud aprobada', async () => {
      const res = await request(http)
        .post(`/api/solicitudes/${solicitudId}/anular`)
        .set(cabecera(gg))
        .send({ motivo: 'prueba e2e' })
        .expect(201);
      expect(res.body.estado).toBe('ANULADA');
    });

    it('LOGISTICA no puede generar solicitudes (403)', async () => {
      await request(http)
        .post('/api/solicitudes')
        .set(cabecera(logistica))
        .send({ contratoId: contratoBId })
        .expect(403);
    });
  });

  // ------------------------------------------------------------------
  describe('Inventario (existencias y kardex)', () => {
    it('lista existencias y resumen', async () => {
      const ex = await request(http)
        .get('/api/inventario/existencias')
        .set(cabecera(logistica))
        .expect(200);
      expect(ex.body.length).toBeGreaterThan(0);
      expect(ex.body[0]).toHaveProperty('bajoMinimo');

      const res = await request(http)
        .get('/api/inventario/resumen')
        .set(cabecera(logistica))
        .expect(200);
      expect(res.body.insumosActivos).toBeGreaterThan(0);
      expect(typeof res.body.movimientosMes).toBe('number');
    });

    it('registra una ENTRADA (LOGISTICA permitido) y actualiza el saldo', async () => {
      const previo = await request(http)
        .get(`/api/inventario/insumos/${insumoId}/movimientos?limite=1`)
        .set(cabecera(logistica))
        .expect(200);
      const saldoPrevio = previo.body[0] ? Number(previo.body[0].saldo) : insumoStockInicial;

      const res = await request(http)
        .post('/api/inventario/movimientos')
        .set(cabecera(logistica))
        .send({ insumoId, tipo: 'ENTRADA', motivo: 'INVENTARIO_INICIAL', cantidad: 1000 })
        .expect(201);
      expect(Number(res.body.cantidad)).toBe(1000);
      expect(Number(res.body.saldo)).toBe(Number((saldoPrevio + 1000).toFixed(3)));
    });

    it('exige signo coherente con el tipo', async () => {
      await request(http)
        .post('/api/inventario/movimientos')
        .set(cabecera(logistica))
        .send({ insumoId, tipo: 'ENTRADA', motivo: 'COMPRA', cantidad: -5 })
        .expect(400);
      await request(http)
        .post('/api/inventario/movimientos')
        .set(cabecera(logistica))
        .send({ insumoId, tipo: 'SALIDA', motivo: 'MERMA', cantidad: 5 })
        .expect(400);
    });

    it('rechaza cantidad cero (400)', async () => {
      await request(http)
        .post('/api/inventario/movimientos')
        .set(cabecera(logistica))
        .send({ insumoId, tipo: 'AJUSTE', motivo: 'CONTEO_FISICO', cantidad: 0 })
        .expect(400);
    });

    it('registra una SALIDA válida', async () => {
      const res = await request(http)
        .post('/api/inventario/movimientos')
        .set(cabecera(logistica))
        .send({ insumoId, tipo: 'SALIDA', motivo: 'CONSUMO_INTERNO', cantidad: -100 })
        .expect(201);
      expect(Number(res.body.cantidad)).toBe(-100);
    });

    it('rechaza una salida que dejaría el stock negativo (400)', async () => {
      await request(http)
        .post('/api/inventario/movimientos')
        .set(cabecera(logistica))
        .send({ insumoId, tipo: 'SALIDA', motivo: 'MERMA', cantidad: -99999999 })
        .expect(400);
    });

    it('acepta un AJUSTE por conteo físico', async () => {
      const res = await request(http)
        .post('/api/inventario/movimientos')
        .set(cabecera(gerente))
        .send({ insumoId, tipo: 'AJUSTE', motivo: 'CONTEO_FISICO', cantidad: -25 })
        .expect(201);
      expect(res.body.motivo).toBe('CONTEO_FISICO');
    });

    it('rechaza motivo inválido (400)', async () => {
      await request(http)
        .post('/api/inventario/movimientos')
        .set(cabecera(logistica))
        .send({ insumoId, tipo: 'ENTRADA', motivo: 'MOTIVO_INVENTADO', cantidad: 1 })
        .expect(400);
    });

    it('filtra el kardex por insumo y tipo', async () => {
      const res = await request(http)
        .get(`/api/inventario/movimientos?insumoId=${insumoId}&tipo=SALIDA`)
        .set(cabecera(logistica))
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.every((m: { tipo: string }) => m.tipo === 'SALIDA')).toBe(true);
    });

    it('404 para insumo inexistente en el kardex', async () => {
      await request(http)
        .get('/api/inventario/insumos/00000000-0000-0000-0000-000000000000/movimientos')
        .set(cabecera(logistica))
        .expect(404);
    });
  });

  // ------------------------------------------------------------------
  describe('Proveedores e historial de precios', () => {
    it('crea un proveedor (LOGISTICA permitido)', async () => {
      const res = await request(http)
        .post('/api/proveedores')
        .set(cabecera(logistica))
        .send({ razonSocial: `Mercado ${SUFIJO}`, condicionPago: 'CONTADO' })
        .expect(201);
      proveedorId = res.body.id;
      expect(proveedorId).toBeTruthy();
    });

    it('GERENTE_GASTRONOMICO no puede crear proveedores (403)', async () => {
      await request(http)
        .post('/api/proveedores')
        .set(cabecera(gg))
        .send({ razonSocial: 'Nope SA' })
        .expect(403);
    });

    it('registra un precio de insumo', async () => {
      const res = await request(http)
        .post(`/api/proveedores/${proveedorId}/precios`)
        .set(cabecera(logistica))
        .send({ insumoId, precioUnitario: 12.5 })
        .expect(201);
      expect(Number(res.body.precioUnitario)).toBe(12.5);
    });

    it('lista los precios del proveedor', async () => {
      const res = await request(http)
        .get(`/api/proveedores/${proveedorId}/precios`)
        .set(cabecera(gg))
        .expect(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('compara precios por insumo', async () => {
      const res = await request(http)
        .get(`/api/proveedores/precios-insumo/${insumoId}`)
        .set(cabecera(gg))
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((p: { proveedor: { id: string } }) => p.proveedor.id === proveedorId)).toBe(
        true,
      );
    });

    it('rechaza precio con insumo inexistente (400)', async () => {
      await request(http)
        .post(`/api/proveedores/${proveedorId}/precios`)
        .set(cabecera(logistica))
        .send({ insumoId: '00000000-0000-0000-0000-000000000000', precioUnitario: 1 })
        .expect(400);
    });
  });

  // ------------------------------------------------------------------
  describe('Parámetros de negocio', () => {
    it('lista los parámetros', async () => {
      const res = await request(http).get('/api/parametros').set(cabecera(logistica)).expect(200);
      expect(res.body.some((p: { clave: string }) => p.clave === 'PLATOS_MIN')).toBe(true);
    });

    it('GERENTE actualiza un parámetro', async () => {
      const res = await request(http)
        .patch('/api/parametros/PLATOS_MIN')
        .set(cabecera(gerente))
        .send({ valor: 100 })
        .expect(200);
      expect(Number(res.body.valor)).toBe(100);
    });

    it('rechaza valor fuera de rango (400)', async () => {
      await request(http)
        .patch('/api/parametros/PLATOS_MIN')
        .set(cabecera(gerente))
        .send({ valor: 99999 })
        .expect(400);
    });
  });

  // ------------------------------------------------------------------
  describe('Bitácora de auditoría', () => {
    it('registra las acciones y es visible para la gerente', async () => {
      const res = await request(http)
        .get(`/api/bitacora?entidad=Contrato&limite=50`)
        .set(cabecera(gerente))
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((f: { entidadId: string }) => f.entidadId === contratoId)).toBe(true);
    });

    it('LOGISTICA no puede ver la bitácora (403)', async () => {
      await request(http).get('/api/bitacora').set(cabecera(logistica)).expect(403);
    });
  });
});
