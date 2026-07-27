import { useState, useMemo } from "react";
import { useData } from "../../context/DataContext";
import { formatMoney, formatDateShort } from "../../lib/format";
import AdeudoModal from "./AdeudoModal";
import AbonoModal from "./AbonoModal";

export default function AdeudosTab() {
  const { adeudos, abonosAdeudo, compras, deleteAdeudo } = useData();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [abonoTarget, setAbonoTarget] = useState(null);

  const withSaldo = useMemo(() => {
    return adeudos.map((a) => {
      const totalAbonado = abonosAdeudo
        .filter((ab) => ab.adeudoId === a.id)
        .reduce((sum, ab) => sum + ab.monto, 0);
      const pendiente = Math.max(0, a.montoOriginal - totalAbonado);
      return { ...a, totalAbonado, pendiente };
    });
  }, [adeudos, abonosAdeudo]);

  const totalOriginal = withSaldo.reduce((s, a) => s + a.montoOriginal, 0);
  const totalCobrado = withSaldo.reduce((s, a) => s + a.totalAbonado, 0);
  const totalPendiente = withSaldo.reduce((s, a) => s + a.pendiente, 0);

  function handleDelete(adeudo) {
    const abonos = abonosAdeudo.filter((ab) => ab.adeudoId === adeudo.id).length;
    const msg = abonos
      ? "Eliminar el adeudo de " + adeudo.persona + "? Se borran " + abonos + " abono(s)."
      : "Eliminar el adeudo de " + adeudo.persona + "?";
    if (window.confirm(msg)) deleteAdeudo(adeudo.id);
  }

  return (
    <section className="panel active">
      <h2 className="section-title" style={{ marginTop: 0 }}>
        Adeudos de Terceros
      </h2>
      <p className="adeudos-subtitle">
        Registra lo que te deben por compras que hiciste con tu tarjeta y lleva el control de cada abono.
      </p>

      <div className="adeudos-summary">
        <div className="adeudo-stat">
          <span className="adeudo-stat__label">Total prestado</span>
          <span className="adeudo-stat__value">{formatMoney(totalOriginal)}</span>
        </div>
        <div className="adeudo-stat adeudo-stat--good">
          <span className="adeudo-stat__label">Ya cobrado</span>
          <span className="adeudo-stat__value">{formatMoney(totalCobrado)}</span>
        </div>
        <div className="adeudo-stat adeudo-stat--warn">
          <span className="adeudo-stat__label">Por cobrar</span>
          <span className="adeudo-stat__value">{formatMoney(totalPendiente)}</span>
        </div>
      </div>

      {withSaldo.length === 0 ? (
        <div className="adeudos-empty">
          <p>Aun no tienes adeudos registrados.</p>
          <button className="btn btn--primary" onClick={() => setAddOpen(true)}>
            Registrar primer adeudo
          </button>
        </div>
      ) : (
        <div className="adeudos-list">
          {withSaldo.map((a) => {
            const pct = a.montoOriginal > 0 ? Math.min(100, (a.totalAbonado / a.montoOriginal) * 100) : 0;
            const liquidado = a.pendiente === 0;
            const compraVinculada = compras.find((c) => c.id === a.compraId);
            return (
              <div key={a.id} className={"adeudo-card" + (liquidado ? " adeudo-card--done" : "")}>
                <div className="adeudo-card__header">
                  <div className="adeudo-card__persona">
                    <span className="adeudo-card__avatar">
                      {a.persona.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <div className="adeudo-card__name">{a.persona}</div>
                      <div className="adeudo-card__meta">
                        {formatDateShort(a.fecha)}
                        {compraVinculada && (
                          <span className="adeudo-card__linked"> · {compraVinculada.concepto}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="adeudo-card__amounts">
                    {liquidado ? (
                      <span className="adeudo-badge adeudo-badge--done">Saldado</span>
                    ) : (
                      <>
                        <span className="adeudo-card__pending">{formatMoney(a.pendiente)}</span>
                        <span className="adeudo-card__total">de {formatMoney(a.montoOriginal)}</span>
                      </>
                    )}
                  </div>
                </div>

                {a.concepto && (
                  <div className="adeudo-card__concepto">{a.concepto}</div>
                )}

                <div className="adeudo-progress">
                  <div
                    className={"adeudo-progress__fill" + (liquidado ? " adeudo-progress__fill--done" : "")}
                    style={{ width: pct + "%" }}
                  />
                </div>
                <div className="adeudo-card__pct">
                  {liquidado
                    ? "100% cobrado"
                    : pct.toFixed(0) + "% cobrado · " + formatMoney(a.totalAbonado) + " abonado"}
                </div>

                {a.notas && <div className="adeudo-card__notas">{a.notas}</div>}

                <div className="adeudo-card__actions">
                  {!liquidado && (
                    <button
                      className="btn btn--primary btn--sm"
                      onClick={() => setAbonoTarget(a)}
                    >
                      + Registrar abono
                    </button>
                  )}
                  <button
                    className="btn btn--sm"
                    onClick={() => { setEditTarget(a); setAddOpen(true); }}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn--danger btn--sm"
                    onClick={() => handleDelete(a)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {withSaldo.length > 0 && (
        <button
          className="btn btn--primary"
          style={{ marginTop: 20 }}
          onClick={() => { setEditTarget(null); setAddOpen(true); }}
        >
          + Registrar adeudo
        </button>
      )}

      <AdeudoModal
        open={addOpen}
        onClose={() => { setAddOpen(false); setEditTarget(null); }}
        adeudo={editTarget}
      />
      <AbonoModal
        open={!!abonoTarget}
        onClose={() => setAbonoTarget(null)}
        adeudo={abonoTarget}
      />
    </section>
  );
}
