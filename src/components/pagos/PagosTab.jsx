import { useMemo, useState } from "react";
import { useData } from "../../context/DataContext";
import { cuotasDeCompra, pagosDeCompra, saldoCompra, cuotasPagadas, estaLiquidada } from "../../lib/calc";
import { formatMoney, formatDateShort } from "../../lib/format";
import Chip from "../shared/Chip";
import ProgressBar from "../shared/ProgressBar";
import { resolveBrand } from "../../lib/brands";
import PagoModal from "./PagoModal";
import ComprobanteModal from "./ComprobanteModal";

const ESTADOS = [
  { key: "pendiente", label: "Por pagar" },
  { key: "completado", label: "Completado" },
  { key: "todas", label: "Todas" },
];

export default function PagosTab() {
  const { tarjetas, compras, cuotas, pagos } = useData();
  const [open, setOpen] = useState(false);
  const [tarjetaId, setTarjetaId] = useState("todas");
  const [estado, setEstado] = useState("pendiente");
  const [expandedId, setExpandedId] = useState(null);
  const [comprobante, setComprobante] = useState(null);
  const tarjetaById = Object.fromEntries(tarjetas.map((t) => [t.id, t]));

  const filas = useMemo(() => {
    return compras
      .filter((c) => tarjetaId === "todas" || c.tarjetaId === tarjetaId)
      .filter((c) => {
        const liquidada = estaLiquidada(c, cuotas, pagos);
        if (estado === "pendiente") return !liquidada;
        if (estado === "completado") return liquidada;
        return true;
      })
      .map((c) => {
        const tarjeta = tarjetaById[c.tarjetaId];
        const brand = resolveBrand(tarjeta);
        const saldo = saldoCompra(c, cuotas, pagos);
        const pagado = round(c.montoTotal - saldo);
        const percent = c.montoTotal ? (pagado / c.montoTotal) * 100 : 0;
        const liquidada = saldo <= 0;
        const historial = c.esMSI
          ? cuotasDeCompra(c.id, cuotas)
              .filter((cu) => cu.estado === "pagada")
              .map((cu) => ({ id: cu.id, monto: cu.montoProgramado, fecha: cu.fechaLimite, tipo: "total" }))
          : pagosDeCompra(c.id, pagos);
        return { compra: c, tarjeta, brand, saldo, pagado, percent, liquidada, historial };
      })
      .sort((a, b) => (a.compra.fecha < b.compra.fecha ? 1 : -1));
  }, [compras, cuotas, pagos, tarjetaId, estado, tarjetaById]);

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

      <div className="filtro-chips" style={{ marginTop: 14 }}>
        <button
          className={"filtro-chip" + (tarjetaId === "todas" ? " active" : "")}
          onClick={() => setTarjetaId("todas")}
        >
          Todas las tarjetas
        </button>
        {tarjetas.map((t) => {
          const brand = resolveBrand(t);
          const activo = tarjetaId === t.id;
          return (
            <button
              key={t.id}
              className={"filtro-chip" + (activo ? " active" : "")}
              style={activo ? { background: brand.c1, color: brand.text, borderColor: brand.c1 } : undefined}
              onClick={() => setTarjetaId(t.id)}
            >
              {t.alias}
            </button>
          );
        })}
      </div>

      <div className="filtro-chips" style={{ marginTop: 8 }}>
        {ESTADOS.map((e) => (
          <button
            key={e.key}
            className={"filtro-chip filtro-chip--estado" + (estado === e.key ? " active" : "")}
            onClick={() => setEstado(e.key)}
          >
            {e.label}
          </button>
        ))}
      </div>

      <div className="surface-list" style={{ marginTop: 14 }}>
        {filas.map(({ compra: c, tarjeta, brand, saldo, pagado, percent, liquidada, historial }) => {
          const expanded = expandedId === c.id;
          const barColor = liquidada ? "var(--good)" : brand.c1;
          return (
            <div className="row row--clickable" style={{ alignItems: "flex-start", flexDirection: "column" }} key={c.id}>
              <div
                style={{ display: "flex", width: "100%", alignItems: "flex-start", cursor: "pointer" }}
                onClick={() => setExpandedId(expanded ? null : c.id)}
              >
                <div className="row__main">
                  <div className="row__title">
                    {c.concepto} · {tarjeta?.alias}
                    {c.esMSI && ` — cuota ${cuotasPagadas(c, cuotas)} de ${c.numeroMeses}`}
                    {liquidada && <Chip tone="good"> Completado</Chip>}
                  </div>
                  <div className="row__sub">
                    {c.esMSI
                      ? `${cuotasPagadas(c, cuotas)} cuota(s) pagada(s)`
                      : `${historial.length} abono(s) registrado(s)`}{" "}
                    · saldo pendiente {formatMoney(saldo)} de {formatMoney(c.montoTotal)}
                  </div>
                  <ProgressBar percent={percent} color={barColor} />
                </div>
                <div className="row__amount">{formatMoney(saldo)}</div>
              </div>

              {expanded && (
                <div className="row__expand">
                  {historial.length > 0 ? (
                    <div className="row__sub" style={{ gap: 6, flexWrap: "wrap", display: "flex" }}>
                      {historial.map((p) => (
                        <Chip tone="good" key={p.id}>
                          {p.tipo === "total" ? "Total" : "Parcial"} · {formatMoney(p.monto)} · {formatDateShort(p.fecha)}
                        </Chip>
                      ))}
                    </div>
                  ) : (
                    <p className="row__sub" style={{ margin: 0 }}>
                      Aún no hay pagos registrados para esta compra.
                    </p>
                  )}
                  <button
                    type="button"
                    className="btn btn--ghost"
                    style={{ marginTop: 10 }}
                    onClick={() => setComprobante({ compra: c, tarjeta, historial, saldo, pagado })}
                  >
                    Ver comprobante / Descargar PDF
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {filas.length === 0 && (
          <div className="row">
            <div className="row__main row__sub">
              {estado === "completado" ? "No hay compras completadas todavía." : "No hay saldos pendientes con este filtro."}
            </div>
          </div>
        )}
      </div>

      <PagoModal open={open} onClose={() => setOpen(false)} />
      <ComprobanteModal
        open={!!comprobante}
        onClose={() => setComprobante(null)}
        compra={comprobante?.compra}
        tarjeta={comprobante?.tarjeta}
        historial={comprobante?.historial || []}
        saldo={comprobante?.saldo}
        pagado={comprobante?.pagado}
      />
    </section>
  );
}

function round(n) {
  return Math.round(n * 100) / 100;
}
