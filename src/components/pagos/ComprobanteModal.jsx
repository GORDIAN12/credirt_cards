import { resolveBrand } from "../../lib/brands";
import { formatMoney, formatDateShort } from "../../lib/format";
import Chip from "../shared/Chip";

export default function ComprobanteModal({ open, onClose, compra, tarjeta, historial, saldo, pagado }) {
  if (!open || !compra || !tarjeta) return null;

  const brand = resolveBrand(tarjeta);
  const liquidada = saldo <= 0;
  const emitido = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric" }).format(new Date());

  return (
    <div className="modal-backdrop open comprobante-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal comprobante-modal" role="dialog" aria-modal="true" aria-label="Comprobante de pago">
        <div className="comprobante-actions no-print">
          <button type="button" className="btn" onClick={onClose}>
            Cerrar
          </button>
          <button type="button" className="btn btn--primary" onClick={() => window.print()}>
            Descargar PDF
          </button>
        </div>

        <div className="comprobante-print">
          <div className="comprobante__header">
            <div>
              <div className="comprobante__title">Control de Tarjetas</div>
              <div className="comprobante__sub">Comprobante de pago</div>
            </div>
            <Chip tone={liquidada ? "good" : "warn"}>{liquidada ? "Completado" : "En progreso"}</Chip>
          </div>

          <div className="comprobante__grid">
            <div>
              <div className="comprobante__label">Tarjeta</div>
              <div className="comprobante__value" style={{ color: brand.c1 }}>
                {tarjeta.alias} {tarjeta.ultimos4 && `· •••• ${tarjeta.ultimos4}`}
              </div>
            </div>
            <div>
              <div className="comprobante__label">Concepto</div>
              <div className="comprobante__value">{compra.concepto}</div>
            </div>
            {compra.deudor && (
              <div>
                <div className="comprobante__label">Deudor</div>
                <div className="comprobante__value">{compra.deudor}</div>
              </div>
            )}
            <div>
              <div className="comprobante__label">Fecha de compra</div>
              <div className="comprobante__value">{formatDateShort(compra.fecha)}</div>
            </div>
            <div>
              <div className="comprobante__label">Monto total</div>
              <div className="comprobante__value">{formatMoney(compra.montoTotal)}</div>
            </div>
            <div>
              <div className="comprobante__label">Pagado</div>
              <div className="comprobante__value">{formatMoney(pagado)}</div>
            </div>
            <div>
              <div className="comprobante__label">Saldo pendiente</div>
              <div className="comprobante__value">{formatMoney(saldo)}</div>
            </div>
            {compra.esMSI && (
              <div>
                <div className="comprobante__label">Meses sin intereses</div>
                <div className="comprobante__value">{compra.numeroMeses} meses</div>
              </div>
            )}
          </div>

          <h4 className="comprobante__historial-title">Historial de pagos</h4>
          <table className="comprobante__table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th style={{ textAlign: "right" }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((p) => (
                <tr key={p.id}>
                  <td>{formatDateShort(p.fecha)}</td>
                  <td>{p.tipo === "total" ? "Total / cuota" : "Abono parcial"}</td>
                  <td style={{ textAlign: "right" }}>{formatMoney(p.monto)}</td>
                </tr>
              ))}
              {historial.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ color: "var(--muted)" }}>
                    Aún no se registran pagos para esta compra.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="comprobante__footer">Generado el {emitido} · Control de Tarjetas</div>
        </div>
      </div>
    </div>
  );
}
