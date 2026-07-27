import { useData } from "../../context/DataContext";
import {
  saldoGlobal,
  msiActivos,
  proximosVencimientos,
  proximoCorte,
  estaLiquidada,
} from "../../lib/calc";
import { formatMoney, formatDateShort } from "../../lib/format";
import CardTile from "../shared/CardTile";
import Chip from "../shared/Chip";
import LinkChip from "../shared/LinkChip";
import CorteSelector from "./CorteSelector";

export default function Dashboard() {
  const { tarjetas, compras, cuotas, pagos } = useData();

  const total = saldoGlobal(compras, cuotas, pagos);
  const vencimientos = proximosVencimientos(tarjetas, compras, cuotas, pagos);
  const proximo = vencimientos[0];
  const activos = tarjetas.filter((t) => t.activa);
  const corte = proximoCorte(activos);
  const restanteMSI = compras
    .filter((c) => c.esMSI)
    .reduce((sum, c) => sum + cuotas.filter((cu) => cu.compraId === c.id && cu.estado !== "pagada").length * c.montoMensual, 0);

  const recientes = compras
    .filter((c) => !estaLiquidada(c, cuotas, pagos))
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

  return (
    <section className="panel active">
      <div className="kpi-row kpi-row--3">
        <div className="kpi">
          <div className="kpi__label">Saldo pendiente</div>
          <div className="kpi__value">{formatMoney(total)}</div>
          <div className="kpi__meta">en {activos.length} tarjetas activas</div>
        </div>
        <div className="kpi">
          <div className="kpi__label">Próximo pago</div>
          <div className="kpi__value">{proximo ? formatMoney(proximo.monto) : "—"}</div>
          <div className="kpi__meta">
            {proximo ? (
              <Chip tone="warn">
                {proximo.tarjeta?.alias} · {formatDateShort(proximo.fecha)}
              </Chip>
            ) : (
              "sin pendientes"
            )}
          </div>
        </div>
        <div className="kpi">
          <div className="kpi__label">MSI activos</div>
          <div className="kpi__value">{msiActivos(compras, cuotas)}</div>
          <div className="kpi__meta">{formatMoney(restanteMSI)} restantes en cuotas</div>
        </div>
      </div>

      <h2 className="section-title">Próximo corte y fecha de pago</h2>
      <CorteSelector tarjetas={activos} defaultId={corte?.tarjeta.id} />

      <h2 className="section-title">Tus tarjetas</h2>
      <div className="card-gallery">
        {tarjetas.map((t) => (
          <CardTile key={t.id} tarjeta={t} />
        ))}
      </div>

      <div className="two-col" style={{ marginTop: 30 }}>
        <div>
          <h2 className="section-title" style={{ marginTop: 0 }}>Próximos pagos</h2>
          <div className="surface-list surface-list--scroll">
            {vencimientos.length === 0 && (
              <div className="row">
                <div className="row__main row__sub">No hay pagos pendientes.</div>
              </div>
            )}
            {vencimientos.map((v) => (
              <div className="row" key={v.key}>
                <div className="row__main">
                  <div className="row__title">{v.tarjeta?.alias}</div>
                  <div className="row__sub">
                    <Chip tone="warn">paga {formatDateShort(v.fecha)}</Chip>
                    {v.detalle}
                  </div>
                </div>
                <div className="row__amount">{formatMoney(v.monto)}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="section-title" style={{ marginTop: 0 }}>Compras recientes</h2>
          <div className="surface-list surface-list--scroll">
            {recientes.length === 0 && (
              <div className="row">
                <div className="row__main row__sub">No hay compras activas.</div>
              </div>
            )}
            {recientes.map((c) => (
              <div className="row" key={c.id}>
                <div className="row__main">
                  <div className="row__title">{c.concepto}</div>
                  <div className="row__sub">
                    {c.deudor} · {formatDateShort(c.fecha)} <LinkChip href={c.comercioUrl} />
                  </div>
                </div>
                <div className="row__amount">{formatMoney(c.montoTotal)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
