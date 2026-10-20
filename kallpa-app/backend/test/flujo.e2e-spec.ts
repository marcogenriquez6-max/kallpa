import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { cabecera, crearAplicacion, iniciarSesion, SUFIJO, USUARIOS } from './utils';

/** Recorrido completo de un evento: contrato → compra → entrega → cocina → liquidación. */
describe('Flujo completo de un evento (e2e)', () => {
  let app: INestApplication;
  let http: Parameters<typeof request>[0];
  let g: string;
  let log: string;

  beforeAll(async () => {
    app = await crearAplicacion();
    http = app.getHttpServer();
    g = await iniciarSesion(app, USUARIOS.gerente);
    log = await iniciarSesion(app, USUARIOS.logistica);
  });
  afterAll(async () => app?.close());

  it('cubre todos los módulos', async () => {
    const H = cabecera(g);
    const insumos = (await request(http).get('/api/insumos?activo=true').set(H).expect(200)).body;
    const ins = insumos.find((i: { unidadBaseCodigo: string }) => i.unidadBaseCodigo === 'G') ?? insumos[0];

    const cliente = (await request(http).post('/api/clientes').set(H)
      .send({ nombre: `Flujo ${SUFIJO}`, telefono: '70000001', tipo: 'SOCIAL' }).expect(201)).body;
    const item = (await request(http).post('/api/catalogo/items').set(H)
      .send({ codigo: `FL-${SUFIJO}`.slice(0, 20), nombre: 'Plato flujo', tipo: 'PLATO_FONDO', precioVenta: 60 }).expect(201)).body;
    await request(http).post(`/api/catalogo/items/${item.id}/fichas`).set(H)
      .send({ lineas: [{ insumoId: ins.id, cantidadPorPorcion: 150, unidadCodigo: ins.unidadBaseCodigo }] }).expect(201);
    const contrato = (await request(http).post('/api/contratos').set(H).send({
      clienteId: cliente.id, tipoEvento: 'Matrimonio', fechaEvento: '2027-03-20', horaServicio: '13:00',
      lugar: 'Salón flujo', numeroPlatos: 100, items: [{ itemId: item.id, cantidad: 100 }],
    }).expect(201)).body;
    await request(http).post(`/api/contratos/${contrato.id}/pagos`).set(H)
      .send({ tipo: 'ANTICIPO', monto: 3000, metodo: 'QR' }).expect(201);

    const sol = (await request(http).post('/api/solicitudes').set(H).send({ contratoId: contrato.id }).expect(201)).body;
    for (const it of sol.items) {
      if (it.origen !== 'COMPRAR') {
        await request(http).patch(`/api/solicitudes/${sol.id}/items/${it.id}`).set(H).send({ origen: 'COMPRAR' }).expect(200);
      }
    }
    await request(http).post(`/api/solicitudes/${sol.id}/aprobar`).set(H).expect(201);
    const detalle = (await request(http).get(`/api/solicitudes/${sol.id}`).set(H).expect(200)).body;

    const prov = (await request(http).post('/api/proveedores').set(cabecera(log)).send({ razonSocial: `Prov ${SUFIJO}` }).expect(201)).body;
    const compra = (await request(http).post('/api/compras').set(cabecera(log)).send({
      solicitudId: sol.id, proveedorId: prov.id, tipoComprobante: 'RECIBO',
      items: detalle.items.map((i: { id: string; cantidad: string }) => ({ solicitudItemId: i.id, cantidad: Number(i.cantidad), precioUnitario: 0.05 })),
    }).expect(201)).body;
    expect(Number(compra.total)).toBeCloseTo(750, 1);
    expect((await request(http).get(`/api/contratos/${contrato.id}`).set(H)).body.estado).toBe('EN_COMPRA');

    const receptores = (await request(http).get('/api/entregas/receptores').set(H).expect(200)).body;
    await request(http).post('/api/entregas').set(cabecera(log)).send({
      solicitudId: sol.id, recibidoPorId: receptores[0].id, lugar: 'Cocina central', conformidad: 'CONFORME',
      items: detalle.items.map((i: { id: string; cantidad: string }) => ({ solicitudItemId: i.id, cantidadRecibida: Number(i.cantidad), conformidad: 'CONFORME' })),
    }).expect(201);
    expect((await request(http).get(`/api/solicitudes/${sol.id}`).set(H)).body.estado).toBe('ENTREGADA');
    expect((await request(http).get(`/api/contratos/${contrato.id}`).set(H)).body.estado).toBe('INSUMOS_ENTREGADOS');

    await request(http).post('/api/produccion').set(H).send({ contratoId: contrato.id, etapa: 'MISE_EN_PLACE' }).expect(201);
    const t = (await request(http).post('/api/calidad/temperaturas').set(H)
      .send({ contratoId: contrato.id, punto: 'COCCION', alimento: 'Pollo', temperaturaC: 60 }).expect(201)).body;
    expect(t.fueraDeRango).toBe(true);
    await request(http).post('/api/produccion').set(H).send({ contratoId: contrato.id, etapa: 'SERVICIO' }).expect(201);
    expect((await request(http).get(`/api/contratos/${contrato.id}`).set(H)).body.estado).toBe('SERVIDO');

    const persona = (await request(http).post('/api/personal/personas').set(H)
      .send({ nombre: 'Pasante flujo', ci: SUFIJO.slice(-10), tipo: 'PASANTE' }).expect(201)).body;
    const rem = (await request(http).post('/api/personal/remuneraciones').set(H).send({
      contratoId: contrato.id, personaId: persona.id, concepto: 'Pasante cocina', modalidad: 'POR_DIA', cantidad: 2, tarifa: 100,
    }).expect(201)).body;
    await request(http).post(`/api/personal/remuneraciones/${rem.id}/pagar`).set(H).expect(201);
    await request(http).post('/api/finanzas/gastos').set(H)
      .send({ tipo: 'EVENTO', categoria: 'Garrafas', monto: 50, contratoId: contrato.id }).expect(201);

    await request(http).post(`/api/finanzas/contratos/${contrato.id}/liquidar`).set(H).expect(400);
    await request(http).post(`/api/contratos/${contrato.id}/pagos`).set(H).send({ tipo: 'SALDO', monto: 3000, metodo: 'efectivo' }).expect(201);
    const liq = (await request(http).get(`/api/finanzas/contratos/${contrato.id}/liquidacion`).set(H).expect(200)).body;
    expect(liq.resumen.costos).toBeCloseTo(1000, 1);
    expect(liq.resumen.utilidad).toBeCloseTo(5000, 1);
    await request(http).post(`/api/finanzas/contratos/${contrato.id}/liquidar`).set(H).expect(201);

    const rep = (await request(http).get('/api/reportes/resumen?desde=2027-03-01&hasta=2027-03-31').set(H).expect(200)).body;
    expect(rep.indicadores.contratos).toBeGreaterThan(0);
    await request(http).get('/api/reportes/resumen').set(cabecera(log)).expect(403);
  });
});
