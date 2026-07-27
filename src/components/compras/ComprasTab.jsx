import { useState } from "react";
import { useData } from "../../context/DataContext";
import { formatMoney, formatDateShort } from "../../lib/format";
import { estaLiquidada } from "../../lib/calc";
import Pill from "../shared/Pill";
import Chip from "../shared/Chip";
import LinkChip from "../shared/LinkChip";
import CompraModal from "./CompraModal";

export default function ComprasTab() {
  const { tarjetas, compras, cuotas, pagos, deleteCompra } = useData();
  const [open, setOpen] = useState(false);

  const tarjetaById = Object.fromEntries(tarjetas.map((t) => [t.id, t]));
  const ordenadas = compras
    .filter((c) => !estaLiquidada(c, cuotas, pagos))
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

  function handleDelete(compra) {
    if (window.confirm(`¿Eliminar "${compra.concepto}"? También se eliminan sus pagos y cuotas.`)) {
      deleteCompra(compra.id);
    }
  }

  return (
    <section className="panel active">
      <div className="toolbar">
        <h2 className="section-title" style={{ margin: 0 }}>
          Registro de compras
        </h2>
        <button className="btn btn--primary" onClick={() => setOpen(true)}>
          + Registrar compra
        </button>
      </div>

      <div className="table-wrap" style={{ marginTop: 14 }}>
        <table>
          <thead>
            <tr>
              <th>Deudor</th>
              <th>Concepto</th>
              <th>Comercio</th>
              <th>Tarjeta</th>
              <th>Fecha</th>
              <th style={{ textAlign: "right" }}>Monto</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {ordenadas.map((c) => {
              const tarjeta = tarjetaById[c.tarjetaId];
              return (
                <tr key={c.id}>
                  <td>{c.deudor}</td>
                  <td>
                    {c.concepto}
                    {c.esMSI && (
                      <Chip tone="info"> MSI {c.numeroMeses}m</Chip>
                    )}
                  </td>
                  <td>
                    <LinkChip href={c.comercioUrl} />
                  </td>
                  <td>{tarjeta && <Pill tarjeta={tarjeta} />}</td>
                  <td>{formatDateShort(c.fecha)}</td>
                  <td className="amount">{formatMoney(c.montoTotal)}</td>
                  <td>
                    <button className="btn" onClick={() => handleDelete(c)} title="Eliminar compra">
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
            {ordenadas.length === 0 && (
              <tr>
                <td colSpan={7} style={{ color: "var(--muted)" }}>
                  Aún no hay compras registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CompraModal open={open} onClose={() => setOpen(false)} />
    </section>
  );
}
