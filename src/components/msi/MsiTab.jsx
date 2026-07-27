import { useData } from "../../context/DataContext";
import { cuotasDeCompra, cuotasPagadas, estaLiquidada } from "../../lib/calc";
import { formatMoney, formatDateShort } from "../../lib/format";
import Pill from "../shared/Pill";
import ProgressBar from "../shared/ProgressBar";
import { resolveBrand } from "../../lib/brands";

export default function MsiTab() {
  const { tarjetas, compras, cuotas, pagos } = useData();
  const tarjetaById = Object.fromEntries(tarjetas.map((t) => [t.id, t]));
  const msi = compras.filter((c) => c.esMSI && !estaLiquidada(c, cuotas, pagos));

  return (
    <section className="panel active">
      <h2 className="section-title" style={{ marginTop: 0 }}>
        Meses sin intereses
      </h2>
      <div className="msi-grid">
        {msi.map((c) => {
          const tarjeta = tarjetaById[c.tarjetaId];
          const brand = resolveBrand(tarjeta);
          const pagadas = cuotasPagadas(c, cuotas);
          const pendientes = cuotasDeCompra(c.id, cuotas).filter((cu) => cu.estado !== "pagada");
          const restante = pendientes.reduce((sum, cu) => sum + cu.montoProgramado, 0);
          const proxima = pendientes[0];
          const percent = (pagadas / c.numeroMeses) * 100;

          return (
            <div className="msi-card" key={c.id}>
              <div className="msi-card__top">
                <div>
                  <div className="msi-card__title">{c.concepto}</div>
                  <div className="msi-card__sub">
                    <Pill tarjeta={tarjeta} /> · {c.deudor}
                  </div>
                </div>
                <div className="msi-card__count">Pago {pagadas} de {c.numeroMeses}</div>
              </div>
              <ProgressBar percent={percent} color={brand.c1} />
              <div className="msi-card__stats">
                <div>
                  Mensualidad
                  <strong>{formatMoney(c.montoMensual)}</strong>
                </div>
                <div>
                  Restante
                  <strong>{formatMoney(restante)}</strong>
                </div>
                <div>
                  Próx. pago
                  <strong>{proxima ? formatDateShort(proxima.fechaLimite) : "—"}</strong>
                </div>
              </div>
            </div>
          );
        })}
        {msi.length === 0 && (
          <div className="surface-list">
            <div className="row">
              <div className="row__main row__sub">
                No hay MSI activos. Los que ya se liquidaron están en la pestaña Liquidado.
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
