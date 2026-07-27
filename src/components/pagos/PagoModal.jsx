import { useMemo, useState } from "react";
import { useData } from "../../context/DataContext";
import Modal from "../shared/Modal";
import { cuotasDeCompra, saldoCompra } from "../../lib/calc";
import { formatMoney } from "../../lib/format";

export default function PagoModal({ open, onClose }) {
  const { tarjetas, compras, cuotas, pagos, addPago } = useData();
  const tarjetaById = Object.fromEntries(tarjetas.map((t) => [t.id, t]));

  const targets = useMemo(() => {
    const list = [];
    compras.forEach((c) => {
      const tarjeta = tarjetaById[c.tarjetaId];
      if (c.esMSI) {
        const siguiente = cuotasDeCompra(c.id, cuotas).find((cu) => cu.estado !== "pagada");
        if (siguiente) {
          list.push({
            key: `cuota:${siguiente.id}`,
            cuotaId: siguiente.id,
            compraId: null,
            monto: siguiente.montoProgramado,
            label: `${c.concepto} — cuota ${siguiente.numero} de ${c.numeroMeses} — ${tarjeta.alias}`,
          });
        }
      } else {
        const saldo = saldoCompra(c, cuotas, pagos);
        if (saldo > 0) {
          list.push({
            key: `compra:${c.id}`,
            cuotaId: null,
            compraId: c.id,
            monto: saldo,
            label: `${c.concepto} — ${tarjeta.alias} — saldo ${formatMoney(saldo)}`,
          });
        }
      }
    });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compras, cuotas, pagos]);

  const [targetKey, setTargetKey] = useState("");
  const [parcialMonto, setParcialMonto] = useState("");
  const [fecha, setFecha] = useState("");
  const [tipo, setTipo] = useState("parcial");

  const selected = targets.find((t) => t.key === targetKey);
  const isCuota = !!selected?.cuotaId;
  const locked = isCuota || tipo === "total";
  const monto = locked ? (selected ? String(selected.monto) : "") : parcialMonto;

  function close() {
    setTargetKey("");
    setParcialMonto("");
    setFecha("");
    setTipo("parcial");
    onClose();
  }

  function submit(e) {
    e.preventDefault();
    if (!selected || !monto || !fecha) return;
    addPago({
      compraId: selected.compraId,
      cuotaId: selected.cuotaId,
      monto,
      fecha,
      tipo: isCuota ? "total" : tipo,
    });
    close();
  }

  return (
    <Modal open={open} onClose={close} title="Registrar pago" hint="Aplica un abono parcial o la liquidación total de una compra o cuota MSI.">
      <form onSubmit={submit}>
        <div className="field">
          <label>Compra / cuota</label>
          <select value={targetKey} onChange={(e) => setTargetKey(e.target.value)} required>
            <option value="" disabled>
              Selecciona qué vas a pagar
            </option>
            {targets.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
          {targets.length === 0 && <p className="hint">No hay saldos pendientes por pagar.</p>}
        </div>
        {!isCuota && selected && (
          <div className="field">
            <label>Tipo</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="parcial">Abono parcial</option>
              <option value="total">Liquidación total (salda toda la compra)</option>
            </select>
          </div>
        )}
        <div className="field-row">
          <div className="field">
            <label>Monto del pago</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="$0.00"
              value={monto}
              onChange={(e) => setParcialMonto(e.target.value)}
              readOnly={locked}
              required
            />
            {locked && selected && <p className="hint">Se liquida el saldo completo: {formatMoney(selected.monto)}.</p>}
          </div>
          <div className="field">
            <label>Fecha de pago</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={close}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary" disabled={!selected}>
            Guardar pago
          </button>
        </div>
      </form>
    </Modal>
  );
}
