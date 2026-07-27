import { useEffect, useState } from "react";
import { useData } from "../../context/DataContext";
import Modal from "../shared/Modal";

const today = () => new Date().toISOString().slice(0, 10);

const empty = {
  persona: "",
  compraId: "",
  montoOriginal: "",
  concepto: "",
  fecha: today(),
  notas: "",
};

export default function AdeudoModal({ open, onClose, adeudo }) {
  const { addAdeudo, updateAdeudo, compras } = useData();
  const [form, setForm] = useState(empty);
  const isEdit = !!adeudo;

  useEffect(() => {
    if (adeudo) {
      setForm({
        persona: adeudo.persona,
        compraId: adeudo.compraId || "",
        montoOriginal: String(adeudo.montoOriginal),
        concepto: adeudo.concepto,
        fecha: adeudo.fecha,
        notas: adeudo.notas || "",
      });
    } else {
      setForm(empty);
    }
  }, [adeudo, open]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleCompraChange(e) {
    const compraId = e.target.value;
    if (compraId) {
      const compra = compras.find((c) => c.id === compraId);
      setForm((f) => ({
        ...f,
        compraId,
        montoOriginal: compra ? String(compra.montoTotal) : f.montoOriginal,
        concepto: compra ? compra.concepto : f.concepto,
      }));
    } else {
      set("compraId", "");
    }
  }

  function submit(e) {
    e.preventDefault();
    if (!form.persona || !form.montoOriginal) return;
    const payload = {
      persona: form.persona.trim(),
      compraId: form.compraId || null,
      montoOriginal: Number(form.montoOriginal),
      concepto: form.concepto.trim(),
      fecha: form.fecha,
      notas: form.notas.trim(),
    };
    if (isEdit) updateAdeudo(adeudo.id, payload);
    else addAdeudo(payload);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar adeudo" : "Registrar adeudo"}
    >
      <form onSubmit={submit}>
        <div className="field">
          <label>Persona que te debe</label>
          <input
            type="text"
            placeholder="Nombre del deudor"
            value={form.persona}
            onChange={(e) => set("persona", e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label>Vincular a compra del historial (opcional)</label>
          <select value={form.compraId} onChange={handleCompraChange}>
            <option value="">— Sin vincular —</option>
            {compras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.concepto} · {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(c.montoTotal)}
              </option>
            ))}
          </select>
          {form.compraId && (
            <p className="hint" style={{ margin: "6px 0 0" }}>
              Monto y concepto pre-llenados desde la compra seleccionada.
            </p>
          )}
        </div>

        <div className="field">
          <label>Monto que debe (MXN)</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={form.montoOriginal}
            onChange={(e) => set("montoOriginal", e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label>Concepto / Descripcion</label>
          <input
            type="text"
            placeholder="Por que te debe este monto"
            value={form.concepto}
            onChange={(e) => set("concepto", e.target.value)}
          />
        </div>

        <div className="field">
          <label>Fecha del adeudo</label>
          <input
            type="date"
            value={form.fecha}
            onChange={(e) => set("fecha", e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label>Notas (opcional)</label>
          <input
            type="text"
            placeholder="Acuerdos, plazos, etc."
            value={form.notas}
            onChange={(e) => set("notas", e.target.value)}
          />
        </div>

        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary">
            {isEdit ? "Guardar cambios" : "Registrar adeudo"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
