import { useEffect, useState } from "react";
import { useData } from "../../context/DataContext";
import Modal from "../shared/Modal";
import { BRANDS, BRAND_ORDER } from "../../lib/brands";

const DIAS = Array.from({ length: 28 }, (_, i) => i + 1);

const empty = {
  alias: "",
  emisor: "nu",
  color: BRANDS.otro.c1,
  ultimos4: "",
  fechaCorte: 5,
  fechaLimitePago: 20,
  activa: true,
};

export default function TarjetaModal({ open, onClose, tarjeta }) {
  const { addTarjeta, updateTarjeta } = useData();
  const [form, setForm] = useState(empty);
  const isEdit = !!tarjeta;

  useEffect(() => {
    setForm(tarjeta ? { ...empty, ...tarjeta } : empty);
  }, [tarjeta, open]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function submit(e) {
    e.preventDefault();
    if (!form.alias) return;
    const payload = {
      ...form,
      fechaCorte: Number(form.fechaCorte),
      fechaLimitePago: Number(form.fechaLimitePago),
      ultimos4: form.ultimos4 ? form.ultimos4.slice(0, 4) : "",
    };
    if (isEdit) updateTarjeta(tarjeta.id, payload);
    else addTarjeta(payload);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar tarjeta" : "Agregar tarjeta"}
      hint="Solo alias y, opcionalmente, los últimos 4 dígitos. Nunca el número completo, CVV ni NIP."
    >
      <form onSubmit={submit}>
        <div className="field">
          <label>Alias</label>
          <input type="text" placeholder="Ej. Nu Personal" value={form.alias} onChange={(e) => set("alias", e.target.value)} required />
        </div>
        <div className="field">
          <label>Emisor</label>
          <div className="swatch-row">
            {BRAND_ORDER.map((key) =>
              key === "otro" ? (
                <span
                  key={key}
                  className={`swatch swatch--custom${form.emisor === key ? " selected" : ""}`}
                  title="Personalizado"
                  onClick={() => set("emisor", key)}
                />
              ) : (
                <span
                  key={key}
                  className={`swatch${form.emisor === key ? " selected" : ""}`}
                  style={{ background: BRANDS[key].c1, borderColor: key === "plata" ? "var(--line)" : undefined }}
                  title={BRANDS[key].label}
                  onClick={() => set("emisor", key)}
                />
              )
            )}
          </div>
        </div>
        {form.emisor === "otro" && (
          <div className="field">
            <label>Color personalizado</label>
            <div className="swatch-row">
              <label className="swatch swatch--picker selected" title="Elegir un color" style={{ background: form.color }}>
                <input type="color" value={form.color} onChange={(e) => set("color", e.target.value)} />
              </label>
            </div>
            <p className="hint" style={{ margin: "8px 0 0" }}>Color elegido: {form.color}.</p>
          </div>
        )}
        <div className="field">
          <label>Últimos 4 dígitos (opcional)</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            placeholder="1234"
            value={form.ultimos4}
            onChange={(e) => set("ultimos4", e.target.value.replace(/\D/g, ""))}
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Fecha de corte</label>
            <select value={form.fechaCorte} onChange={(e) => set("fechaCorte", e.target.value)}>
              {DIAS.map((d) => (
                <option key={d} value={d}>
                  Día {d}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Fecha de pago</label>
            <select value={form.fechaLimitePago} onChange={(e) => set("fechaLimitePago", e.target.value)}>
              {DIAS.map((d) => (
                <option key={d} value={d}>
                  Día {d}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="checkbox-row">
          <input type="checkbox" id="activa-toggle" checked={form.activa} onChange={(e) => set("activa", e.target.checked)} />
          <label htmlFor="activa-toggle">Tarjeta activa</label>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary">
            {isEdit ? "Guardar cambios" : "Guardar tarjeta"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
