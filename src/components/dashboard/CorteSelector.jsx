import { useState } from "react";
import { diasHastaDia } from "../../lib/calc";
import { resolveBrand } from "../../lib/brands";

export default function CorteSelector({ tarjetas, defaultId }) {
  const [selectedId, setSelectedId] = useState(defaultId || tarjetas[0]?.id);
  const seleccionada = tarjetas.find((t) => t.id === selectedId) || tarjetas[0];

  if (!seleccionada) {
    return (
      <div className="corte-widget">
        <div className="row__sub">No hay tarjetas activas.</div>
      </div>
    );
  }

  const diasCorte = diasHastaDia(seleccionada.fechaCorte);
  const diasPago = diasHastaDia(seleccionada.fechaLimitePago);

  return (
    <div className="corte-widget">
      <div className="corte-widget__bar">
        {tarjetas.map((t) => {
          const brand = resolveBrand(t);
          const active = t.id === seleccionada.id;
          return (
            <button
              key={t.id}
              type="button"
              className={`corte-widget__pill${active ? " active" : ""}`}
              onClick={() => setSelectedId(t.id)}
            >
              <span className="corte-widget__dot" style={{ background: brand.c1 }} />
              {t.alias}
            </button>
          );
        })}
      </div>
      <div className="corte-widget__stats">
        <div className="corte-widget__stat">
          <span>Días para el corte</span>
          <strong>{diasCorte}</strong>
        </div>
        <div className="corte-widget__stat corte-widget__stat--right">
          <span>Días para la fecha de pago</span>
          <strong>{diasPago}</strong>
        </div>
      </div>
    </div>
  );
}
