import { useState } from "react";
import { useData } from "../../context/DataContext";
import Modal from "../shared/Modal";
import { formatMoney } from "../../lib/format";

const empty = {
  deudor: "",
  montoTotal: "",
  concepto: "",
  fecha: "",
  comercioUrl: "",
  tarjetaId: "",
  esMSI: false,
  numeroMeses: "",
};

export default function CompraModal({ open, onClose }) {
  const { tarjetas, addCompra } = useData();
  const [form, setForm] = useState(empty);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function close() {
    setForm(empty);
    onClose();
  }

  function submit(e) {
    e.preventDefault();
    if (!form.deudor || !form.montoTotal || !form.concepto || !form.fecha || !form.tarjetaId) return;
    if (form.esMSI && !form.numeroMeses) return;
    addCompra(form);
    close();
  }

  const montoMensual =
    form.esMSI && form.montoTotal && form.numeroMeses
      ? formatMoney(Number(form.montoTotal) / Number(form.numeroMeses))
      : "";

  return (
    <Modal
      open={open}
      onClose={close}
      title="Registrar compra"
      hint="El comercio es solo un link de referencia — nunca se guardan datos de la tarjeta física."
    >
      <form onSubmit={submit}>
        <div className="field">
          <label>Deudor</label>
          <input
            type="text"
            placeholder="¿Quién realizó o debe la compra?"
            value={form.deudor}
            onChange={(e) => set("deudor", e.target.value)}
            required
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Monto total</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="$0.00"
              value={form.montoTotal}
              onChange={(e) => set("montoTotal", e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Fecha</label>
            <input type="date" value={form.fecha} onChange={(e) => set("fecha", e.target.value)} required />
          </div>
        </div>
        <div className="field">
          <label>Concepto</label>
          <input
            type="text"
            placeholder='Ej. Pantalla Smart TV 43"'
            value={form.concepto}
            onChange={(e) => set("concepto", e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>Comercio (link)</label>
          <input
            type="url"
            placeholder="https://..."
            value={form.comercioUrl}
            onChange={(e) => set("comercioUrl", e.target.value)}
          />
        </div>
        <div className="field">
          <label>Tarjeta</label>
          <select value={form.tarjetaId} onChange={(e) => set("tarjetaId", e.target.value)} required>
            <option value="" disabled>
              Selecciona una tarjeta
            </option>
            {tarjetas
              .filter((t) => t.activa)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.alias} {t.ultimos4 ? `•••• ${t.ultimos4}` : ""}
                </option>
              ))}
          </select>
        </div>
        <div className="checkbox-row">
          <input
            type="checkbox"
            id="msi-toggle"
            checked={form.esMSI}
            onChange={(e) => set("esMSI", e.target.checked)}
          />
          <label htmlFor="msi-toggle">Es una compra a meses sin intereses (MSI)</label>
        </div>
        {form.esMSI && (
          <div className="msi-extra show">
            <div className="field">
              <label>Número de meses</label>
              <input
                type="number"
                min="2"
                placeholder="Ej. 12"
                value={form.numeroMeses}
                onChange={(e) => set("numeroMeses", e.target.value)}
                required={form.esMSI}
              />
            </div>
            <div className="field">
              <label>Monto mensual</label>
              <input type="text" readOnly value={montoMensual} placeholder="Calculado automáticamente" />
            </div>
          </div>
        )}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={close}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary">
            Guardar compra
          </button>
        </div>
      </form>
    </Modal>
  );
}
