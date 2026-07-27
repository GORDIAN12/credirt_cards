import { generateCuotas } from "./calc";

function tarjetas() {
  return [
    { id: "t1", alias: "Nu Personal", emisor: "nu", ultimos4: "4521", fechaCorte: 5, fechaLimitePago: 20, activa: true },
    { id: "t2", alias: "MP Crédito", emisor: "mercadopago", ultimos4: "7788", fechaCorte: 15, fechaLimitePago: 2, activa: true },
    { id: "t3", alias: "Plata Total", emisor: "plata", ultimos4: "3390", fechaCorte: 10, fechaLimitePago: 25, activa: true },
    { id: "t4", alias: "BBVA Azul", emisor: "bbva", ultimos4: "6612", fechaCorte: 20, fechaLimitePago: 7, activa: true },
    { id: "t5", alias: "Banamex Costco", emisor: "banamex", ultimos4: "9087", fechaCorte: 28, fechaLimitePago: 15, activa: true },
  ];
}

function compras() {
  return [
    {
      id: "c1", tarjetaId: "t1", deudor: "David", montoTotal: 12600,
      concepto: "iPhone 15 — funda + AppleCare", fecha: "2026-03-10",
      comercioUrl: "https://www.apple.com/mx", esMSI: true, numeroMeses: 12, montoMensual: 1050,
    },
    {
      id: "c2", tarjetaId: "t4", deudor: "Ana", montoTotal: 6000,
      concepto: 'Pantalla Smart TV 43"', fecha: "2026-05-02",
      comercioUrl: "https://www.liverpool.com.mx", esMSI: true, numeroMeses: 6, montoMensual: 1000,
    },
    {
      id: "c3", tarjetaId: "t2", deudor: "David", montoTotal: 1850,
      concepto: "Audífonos + cargador", fecha: "2026-07-01",
      comercioUrl: "https://www.amazon.com.mx", esMSI: false, numeroMeses: null, montoMensual: null,
    },
    {
      id: "c4", tarjetaId: "t5", deudor: "Fer (roomie)", montoTotal: 3240,
      concepto: "Despensa mensual", fecha: "2026-07-15",
      comercioUrl: "https://www.costco.com.mx", esMSI: false, numeroMeses: null, montoMensual: null,
    },
    {
      id: "c5", tarjetaId: "t3", deudor: "David", montoTotal: 420,
      concepto: "Cena viernes", fecha: "2026-07-18",
      comercioUrl: "https://www.ubereats.com", esMSI: false, numeroMeses: null, montoMensual: null,
    },
    {
      id: "c6", tarjetaId: "t1", deudor: "Ana", montoTotal: 8400,
      concepto: "Fin de semana Valle de Bravo", fecha: "2026-06-20",
      comercioUrl: "https://www.airbnb.mx", esMSI: true, numeroMeses: 3, montoMensual: 2800,
    },
  ];
}

function withPaidCuotas(cuotas, compraId, pagadasHasta, pagoIdFor) {
  return cuotas.map((cu) =>
    cu.compraId === compraId && cu.numero <= pagadasHasta
      ? { ...cu, estado: "pagada", pagoId: pagoIdFor(cu.numero) }
      : cu
  );
}

export function seedState() {
  const cards = tarjetas();
  const purchases = compras();
  const tarjetaById = Object.fromEntries(cards.map((t) => [t.id, t]));

  let cuotas = purchases
    .filter((c) => c.esMSI)
    .flatMap((c) => generateCuotas(c, tarjetaById[c.tarjetaId]));

  cuotas = withPaidCuotas(cuotas, "c1", 4, (n) => `p-c1-${n}`);
  cuotas = withPaidCuotas(cuotas, "c2", 2, (n) => `p-c2-${n}`);
  cuotas = withPaidCuotas(cuotas, "c6", 1, (n) => `p-c6-${n}`);

  const cuotaPagos = cuotas
    .filter((cu) => cu.estado === "pagada")
    .map((cu) => ({
      id: cu.pagoId,
      compraId: null,
      cuotaId: cu.id,
      monto: cu.montoProgramado,
      fecha: cu.fechaLimite,
      tipo: "total",
      saldoResultante: 0,
    }));

  const pagos = [
    ...cuotaPagos,
    { id: "p-c3-1", compraId: "c3", cuotaId: null, monto: 900, fecha: "2026-07-10", tipo: "parcial", saldoResultante: 950 },
    { id: "p-c5-1", compraId: "c5", cuotaId: null, monto: 420, fecha: "2026-07-19", tipo: "total", saldoResultante: 0 },
  ];

  return { tarjetas: cards, compras: purchases, cuotas, pagos };
}
