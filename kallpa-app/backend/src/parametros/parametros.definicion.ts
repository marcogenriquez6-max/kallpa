/**
 * Parámetros de negocio de Kallpa, tomados del proyecto de emprendimiento.
 * Esta lista es la única fuente de verdad: la usan el seed y la validación
 * de cambios. Agregar un parámetro nuevo = agregar una entrada aquí.
 */
export interface DefinicionParametro {
  valor: number;
  descripcion: string;
  min: number;
  max: number;
}

export const PARAMETROS: Record<string, DefinicionParametro> = {
  TARIFA_CHEF_DIA: {
    valor: 500, min: 0, max: 5000,
    descripcion: 'Remuneración del chef principal por día de trabajo (Bs)',
  },
  DIAS_CHEF_POR_EVENTO: {
    valor: 2, min: 1, max: 5,
    descripcion: 'Días de chef por evento estándar (preparación y servicio)',
  },
  DIAS_CHEF_EVENTO_GRANDE: {
    valor: 3, min: 1, max: 6,
    descripcion: 'Días de chef para eventos desde UMBRAL_EVENTO_GRANDE platos',
  },
  UMBRAL_EVENTO_GRANDE: {
    valor: 500, min: 100, max: 2000,
    descripcion: 'Número de platos a partir del cual se suma un día de chef',
  },
  TARIFA_SOCIO_PLATO: {
    valor: 1.5, min: 0, max: 20,
    descripcion: 'Remuneración por plato de gerencia y logística, por persona (Bs)',
  },
  TARIFA_PASANTE_DIA: {
    valor: 100, min: 0, max: 1000,
    descripcion: 'Estipendio de pasante por día de trabajo (Bs)',
  },
  INVITADOS_POR_GARZON: {
    valor: 25, min: 5, max: 100,
    descripcion: 'Invitados atendidos por cada garzón incluido en el servicio',
  },
  TARIFA_GARZON_ADICIONAL: {
    valor: 150, min: 0, max: 2000,
    descripcion: 'Precio de cada garzón adicional sobre la dotación incluida (Bs)',
  },
  PLATOS_MIN: {
    valor: 100, min: 1, max: 1000,
    descripcion: 'Pedido mínimo de platos por contrato',
  },
  PLATOS_MAX: {
    valor: 500, min: 1, max: 5000,
    descripcion: 'Pedido máximo de platos por contrato',
  },
  UMBRAL_CARGO_FIJO: {
    valor: 150, min: 0, max: 1000,
    descripcion: 'Contratos con menos platos que este valor pagan cargo fijo de servicio',
  },
  CARGO_FIJO_SERVICIO: {
    valor: 800, min: 0, max: 10000,
    descripcion: 'Cargo fijo de servicio para eventos pequeños (Bs)',
  },
  ANTICIPO_PORCENTAJE: {
    valor: 50, min: 0, max: 100,
    descripcion: 'Anticipo exigido al firmar el contrato (% del total)',
  },
  HORAS_SALDO_ANTES: {
    valor: 72, min: 0, max: 720,
    descripcion: 'Horas antes del evento en que vence el pago del saldo',
  },
  DIAS_CONFIRMACION_PLATOS: {
    valor: 5, min: 1, max: 30,
    descripcion: 'Días antes del evento para confirmar el número final de platos',
  },
  ALQUILER_VAJILLA_PLATO: {
    valor: 3, min: 0, max: 50,
    descripcion: 'Costo de alquiler de vajilla por cubierto (Bs)',
  },
  IMPREVISTOS_PORCENTAJE: {
    valor: 2, min: 0, max: 20,
    descripcion: 'Reserva para imprevistos sobre los costos del evento (%)',
  },
  RESERVA_UTILIDADES_PORCENTAJE: {
    valor: 5, min: 0, max: 100,
    descripcion: 'Porcentaje de la utilidad destinado a reserva',
  },
  REINVERSION_PORCENTAJE: {
    valor: 25, min: 0, max: 100,
    descripcion: 'Porcentaje de la utilidad destinado a reinversión',
  },
  PARTICIPACION_FAMILIA: {
    valor: 60, min: 0, max: 100,
    descripcion: 'Participación de la Familia Pantoja Blacutt en las utilidades (%)',
  },
  PARTICIPACION_PERCY: {
    valor: 40, min: 0, max: 100,
    descripcion: 'Participación de Percy Irahola en las utilidades (%)',
  },
  DIAS_ALERTA_CARNET_SANITARIO: {
    valor: 30, min: 1, max: 180,
    descripcion: 'Días de anticipación para alertar el vencimiento del carnet sanitario',
  },
};
