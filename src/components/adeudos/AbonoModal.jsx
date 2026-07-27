import { useEffect, useState } from "react";
import { useData } from "../../context/DataContext";
import Modal from "../shared/Modal";
import { formatMoney, formatDateShort } from "../../lib/format";

const today = () => new Date().toISOString().slice(0, 10);

export default function AbonoModal({ open, onClose, adeudo }) {
  const { addAbonoAdeudo, deleteAbonoAdeudo, abonosAdeudo } = useData();

  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(today());
  const [notas, setNotas] = useState("");

  useEffect(() => {
    if (open) {
      setMonto("");
      setFecha(today());
      setNotas("");
    }
  }, [open, adeudo]);

  if (!adeudo) return null;

  const abonos = abonosAdeudo.filter((ab) => ab.adeudoId === adeudo.id);
  const totalAbonado = abonos.reduce((s, ab) => s + ab.monto, 0);
  const pendiente = Math.max(0, adeudo.montoOriginal - totalAbonado);

  function submit(e) {
    e.preventDefault();
    if (!monto || Number(monto) <= 0) return;
    addAbonoAdeudo({
      adeudoId: adeudo.id,
      monto: Number(monto),
      fecha,
      notas: notas.trim(),
    });
    setMonto("");
    setNotas("");
  }

  function handleDeleteAbono(id) {
    if (window.confirm("Eliminar este abono?")) {
      deleteAbonoAdeudo(id);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={"Abonos de " + adeudo.persona}
    >
      <div className="abono-resumen">
        <div className="abono-resumen__row">
          <span>Monto original</span>
          <strong>{formatMoney(adeudo.montoOriginal)}</strong>
        </div>
        <div className="abono-resumen__row">
          <span>Total abonado</span>
          <strong className="color-good">{formatMoney(totalAbonado)}</strong>
        </div>
        <div className="abono-resumen__row abono-resumen__row--total">
          <span>Pendiente</span>
          <strong className={pendiente === 0 ? "color-good" : "color-warn"}>
            {formatMoney(pendiente)}
          </strong>
        </div>
      </div>

      {abonos.length > 0 && (
        <div className="abono-history">
          <div className="abono-history__title">Historial de abonos</div>
          {abonos.map((ab) => (
            <div key={ab.id} className="abono-row">
              <div className="abono-row__left">
                <span className="abono-row__date">{formatDateShort(ab.fecha)}</span>
                {ab.notas && <span className="abono-row__nota">{ab.notas}</span>}
              </div>
              <div className="abono-row__right">
                <span className="abono-row__monto">{formatMoney(ab.monto)}</span>
                <button
                  className="icon-btn"
                  title="Eliminar abono"
                  onClick={() => handleDeleteAbono(ab.id)}
                >
                  x
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pendiente > 0 && (
        <form onSubmit={submit} style={{ marginTop: 16 }}>
          <div className="abono-history__title" style={{ marginBottom: 10 }}>
            Registrar nuevo abono
          </div>
          <div className="field">
            <label>Monto del abono (MXN)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder={"Max " + pendiente.toFixed(2)}
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Fecha del abono</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Notas (opcional)</label>
            <input
              type="text"
              placeholder="Ej. transferencia, efectivo..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cerrar
            </button>
            <button type="submit" className="btn btn--primary">
              Registrar abono
            </button>
          </div>
        </form>
      )}

      {pendiente === 0 && (
        <div className="modal-actions" style={{ marginTop: 16 }}>
          <button className="btn btn--primary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      )}
    </Modal>
  );
}
