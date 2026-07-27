import { useState } from "react";
import { useData } from "../../context/DataContext";
import { cuotasDeCompra, pagosDeCompra, saldoCompra, cuotasPagadas, estaLiquidada } from "../../lib/calc";
import { formatMoney, formatDateShort } from "../../lib/format";
import Chip from "../shared/Chip";
import ProgressBar from "../shared/ProgressBar";
import { resolveBrand } from "../../lib/brands";
import PagoModal from "./PagoModal";

export default function PagosTab() {
  const { tarjetas, compras, cuotas, pagos } = useData();
  const [open, setOpen] = useState(false);
  const tarjetaById = Object.fromEntries(tarjetas.map((t) => [t.id, t]));
  const activas = compras.filter((c) => !estaLiquidada(c, cuotas, pagos));

  return (
    <section className="panel active">
      <div className="toolbar">
        <h2 className="section-title" style={{ margin: 0 }}>
          Registro de pagos
        </h2>
        <button className="btn btn--primary" onClick={() => setOpen(true)}>
          + Registrar pago
        </button>
      </div>

      <div className="surface-list" style={{ marginTop: 14 }}>
        {activas.map((c) => {
          const tarjeta = tarjetaById[c.tarjetaId];
          const brand = resolveBrand(tarjeta);
          const saldo = saldoCompra(c, cuotas, pagos);
          const pagado = round(c.montoTotal - saldo);
          const percent = c.montoTotal ? (pagado / c.montoTotal) * 100 : 0;
          const barColor = saldo <= 0 ? "var(--good)" : brand.c1;

          const historial = c.esMSI
            ? cuotasDeCompra(c.id, cuotas)
                .filter((cu) => cu.estado === "pagada")
                .map((cu) => ({ id: cu.id, monto: cu.montoProgramado, fecha: cu.fechaLimite, tipo: "total" }))
            : pagosDeCompra(c.id, pagos);

          return (
            <div className="row" style={{ alignItems: "flex-start" }} key={c.id}>
              <div className="row__main">
                <div className="row__title">
                  {c.concepto} · {tarjeta.alias}
                  {c.esMSI && ` — cuota ${cuotasPagadas(c, cuotas)} de ${c.numeroMeses}`}
                </div>
                <div className="row__sub">
                  {c.esMSI
                    ? `${cuotasPagadas(c, cuotas)} cuota(s) pagada(s)`
                    : `${historial.length} abono(s) registrado(s)`}{" "}
                  · saldo pendiente {formatMoney(saldo)} de {formatMoney(c.montoTotal)}
                </div>
                <ProgressBar percent={percent} color={barColor} />
                {historial.length > 0 && (
                  <div className="row__sub" style={{ marginTop: 6, gap: 6 }}>
                    {historial.map((p) => (
                      <Chip tone="good" key={p.id}>
                        {p.tipo === "total" ? "Total" : "Parcial"} · {formatMoney(p.monto)} · {formatDateShort(p.fecha)}
                      </Chip>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {activas.length === 0 && (
          <div className="row">
            <div className="row__main row__sub">
              No hay saldos pendientes. Las compras liquidadas se guardan en la pestaña Liquidado.
            </div>
          </div>
        )}
      </div>

      <PagoModal open={open} onClose={() => setOpen(false)} />
    </section>
  );
}

function round(n) {
  return Math.round(n * 100) / 100;
}
