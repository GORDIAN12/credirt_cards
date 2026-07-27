import { useData } from "../../context/DataContext";
import { estaLiquidada, fechaLiquidacion } from "../../lib/calc";
import { formatMoney, formatDateShort } from "../../lib/format";
import Pill from "../shared/Pill";
import Chip from "../shared/Chip";
import LinkChip from "../shared/LinkChip";

export default function LiquidadoTab() {
  const { tarjetas, compras, cuotas, pagos } = useData();
  const tarjetaById = Object.fromEntries(tarjetas.map((t) => [t.id, t]));

  const liquidadas = compras
    .filter((c) => estaLiquidada(c, cuotas, pagos))
    .map((c) => ({ compra: c, fecha: fechaLiquidacion(c, cuotas, pagos) }))
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

  return (
    <section className="panel active">
      <h2 className="section-title" style={{ marginTop: 0 }}>
        Liquidado
      </h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Deudor</th>
              <th>Concepto</th>
              <th>Comercio</th>
              <th>Tarjeta</th>
              <th>Fecha de liquidación</th>
              <th style={{ textAlign: "right" }}>Monto</th>
            </tr>
          </thead>
          <tbody>
            {liquidadas.map(({ compra: c, fecha }) => {
              const tarjeta = tarjetaById[c.tarjetaId];
              return (
                <tr key={c.id}>
                  <td>{c.deudor}</td>
                  <td>
                    {c.concepto}
                    {c.esMSI && <Chip tone="good"> MSI {c.numeroMeses}m</Chip>}
                  </td>
                  <td>
                    <LinkChip href={c.comercioUrl} />
                  </td>
                  <td>{tarjeta && <Pill tarjeta={tarjeta} />}</td>
                  <td>
                    <Chip tone="good">{fecha ? formatDateShort(fecha) : "—"}</Chip>
                  </td>
                  <td className="amount">{formatMoney(c.montoTotal)}</td>
                </tr>
              );
            })}
            {liquidadas.length === 0 && (
              <tr>
                <td colSpan={6} style={{ color: "var(--muted)" }}>
                  Aún no hay compras liquidadas. Cuando termines de pagar una compra o un MSI completo, aparecerá aquí
                  como evidencia.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
