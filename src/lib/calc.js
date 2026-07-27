import { makeId } from "./id";
import { round2 } from "./format";

export function generateCuotas(compra, tarjeta) {
  const [y, m] = compra.fecha.split("-").map(Number);
  const cuotas = [];
  for (let i = 0; i < compra.numeroMeses; i += 1) {
    const dueDate = new Date(y, m - 1 + 1 + i, tarjeta.fechaLimitePago);
    cuotas.push({
      id: makeId("cu"),
      compraId: compra.id,
      numero: i + 1,
      montoProgramado: compra.montoMensual,
      fechaLimite: dueDate.toISOString().slice(0, 10),
      estado: "pendiente",
      pagoId: null,
    });
  }
  return cuotas;
}

export function cuotasDeCompra(compraId, cuotas) {
  return cuotas.filter((c) => c.compraId === compraId).sort((a, b) => a.numero - b.numero);
}

export function pagosDeCompra(compraId, pagos) {
  return pagos.filter((p) => p.compraId === compraId);
}

export function estadoCuota(cuota) {
  if (cuota.estado === "pagada") return "pagada";
  const hoy = new Date();
  const [y, m, d] = cuota.fechaLimite.split("-").map(Number);
  return new Date(y, m - 1, d) < hoy ? "vencida" : "pendiente";
}

export function saldoCompra(compra, cuotas, pagos) {
  if (compra.esMSI) {
    return cuotasDeCompra(compra.id, cuotas)
      .filter((c) => c.estado !== "pagada")
      .reduce((sum, c) => sum + c.montoProgramado, 0);
  }
  const pagado = pagosDeCompra(compra.id, pagos).reduce((sum, p) => sum + p.monto, 0);
  return Math.max(0, round2(compra.montoTotal - pagado));
}

export function cuotasPagadas(compra, cuotas) {
  return cuotasDeCompra(compra.id, cuotas).filter((c) => c.estado === "pagada").length;
}

export function estaLiquidada(compra, cuotas, pagos) {
  return saldoCompra(compra, cuotas, pagos) <= 0;
}

export function fechaLiquidacion(compra, cuotas, pagos) {
  if (compra.esMSI) {
    const cuotasCompra = cuotasDeCompra(compra.id, cuotas);
    const ultima = cuotasCompra[cuotasCompra.length - 1];
    if (!ultima || ultima.estado !== "pagada") return null;
    const pago = pagos.find((p) => p.id === ultima.pagoId);
    return pago ? pago.fecha : ultima.fechaLimite;
  }
  const relacionados = pagosDeCompra(compra.id, pagos);
  if (!relacionados.length) return null;
  return relacionados.reduce((latest, p) => (p.fecha > latest ? p.fecha : latest), relacionados[0].fecha);
}

export function saldoTarjeta(tarjetaId, compras, cuotas, pagos) {
  return compras
    .filter((c) => c.tarjetaId === tarjetaId)
    .reduce((sum, c) => sum + saldoCompra(c, cuotas, pagos), 0);
}

export function saldoGlobal(compras, cuotas, pagos) {
  return compras.reduce((sum, c) => sum + saldoCompra(c, cuotas, pagos), 0);
}

export function msiActivos(compras, cuotas) {
  return compras.filter((c) => c.esMSI && cuotasDeCompra(c.id, cuotas).some((cu) => cu.estado !== "pagada")).length;
}

export function nextOccurrenceOfDay(day) {
  const now = new Date();
  let d = new Date(now.getFullYear(), now.getMonth(), day);
  if (d < now) d = new Date(now.getFullYear(), now.getMonth() + 1, day);
  return d;
}

export function diasHastaDia(day) {
  const now = new Date();
  const objetivo = nextOccurrenceOfDay(day);
  return Math.ceil((objetivo - now) / 86400000);
}

export function proximosVencimientos(tarjetas, compras, cuotas, pagos) {
  const items = [];

  cuotas
    .filter((cu) => cu.estado !== "pagada")
    .forEach((cu) => {
      const compra = compras.find((c) => c.id === cu.compraId);
      if (!compra) return;
      const tarjeta = tarjetas.find((t) => t.id === compra.tarjetaId);
      items.push({
        key: cu.id,
        tarjeta,
        monto: cu.montoProgramado,
        fecha: cu.fechaLimite,
        detalle: `${compra.concepto} · cuota ${cu.numero} de ${compra.numeroMeses}`,
      });
    });

  compras
    .filter((c) => !c.esMSI)
    .forEach((compra) => {
      const saldo = saldoCompra(compra, cuotas, pagos);
      if (saldo <= 0) return;
      const tarjeta = tarjetas.find((t) => t.id === compra.tarjetaId);
      if (!tarjeta) return;
      const fecha = nextOccurrenceOfDay(tarjeta.fechaLimitePago).toISOString().slice(0, 10);
      items.push({ key: compra.id, tarjeta, monto: saldo, fecha, detalle: compra.concepto });
    });

  return items.sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
}

export function proximoCorte(tarjetas) {
  const now = new Date();
  const withNext = tarjetas
    .filter((t) => t.activa)
    .map((t) => ({ tarjeta: t, fecha: nextOccurrenceOfDay(t.fechaCorte) }));
  withNext.sort((a, b) => a.fecha - b.fecha);
  const soonest = withNext[0];
  if (!soonest) return null;
  const dias = Math.ceil((soonest.fecha - now) / 86400000);
  return { tarjeta: soonest.tarjeta, dias };
}
