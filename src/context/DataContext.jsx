import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loadState, saveState } from "../lib/storage";
import { seedState } from "../lib/seed";
import { generateCuotas } from "../lib/calc";
import { makeId } from "../lib/id";
import { round2 } from "../lib/format";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [state, setState] = useState(() => loadState(seedState));

  useEffect(() => {
    saveState(state);
  }, [state]);

  const actions = useMemo(
    () => ({
      addTarjeta(input) {
        setState((s) => ({
          ...s,
          tarjetas: [...s.tarjetas, { id: makeId("t"), activa: true, ...input }],
        }));
      },

      updateTarjeta(id, patch) {
        setState((s) => ({
          ...s,
          tarjetas: s.tarjetas.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        }));
      },

      deleteTarjeta(id) {
        setState((s) => {
          const compraIds = new Set(s.compras.filter((c) => c.tarjetaId === id).map((c) => c.id));
          const cuotaIds = new Set(s.cuotas.filter((cu) => compraIds.has(cu.compraId)).map((cu) => cu.id));
          return {
            tarjetas: s.tarjetas.filter((t) => t.id !== id),
            compras: s.compras.filter((c) => !compraIds.has(c.id)),
            cuotas: s.cuotas.filter((cu) => !compraIds.has(cu.compraId)),
            pagos: s.pagos.filter((p) => !compraIds.has(p.compraId) && !cuotaIds.has(p.cuotaId)),
          };
        });
      },

      addCompra(input) {
        setState((s) => {
          const tarjeta = s.tarjetas.find((t) => t.id === input.tarjetaId);
          const esMSI = !!input.esMSI;
          const compra = {
            id: makeId("c"),
            tarjetaId: input.tarjetaId,
            deudor: input.deudor,
            montoTotal: Number(input.montoTotal),
            concepto: input.concepto,
            fecha: input.fecha,
            comercioUrl: input.comercioUrl || null,
            esMSI,
            numeroMeses: esMSI ? Number(input.numeroMeses) : null,
            montoMensual: esMSI ? round2(Number(input.montoTotal) / Number(input.numeroMeses)) : null,
          };
          const nuevasCuotas = esMSI ? generateCuotas(compra, tarjeta) : [];
          return { ...s, compras: [...s.compras, compra], cuotas: [...s.cuotas, ...nuevasCuotas] };
        });
      },

      deleteCompra(id) {
        setState((s) => {
          const cuotaIds = new Set(s.cuotas.filter((cu) => cu.compraId === id).map((cu) => cu.id));
          return {
            ...s,
            compras: s.compras.filter((c) => c.id !== id),
            cuotas: s.cuotas.filter((cu) => cu.compraId !== id),
            pagos: s.pagos.filter((p) => p.compraId !== id && !cuotaIds.has(p.cuotaId)),
          };
        });
      },

      addPago({ compraId, cuotaId, monto, fecha, tipo }) {
        setState((s) => {
          const pago = {
            id: makeId("p"),
            compraId: compraId ?? null,
            cuotaId: cuotaId ?? null,
            monto: Number(monto),
            fecha,
            tipo,
            saldoResultante: null,
          };
          const cuotas = cuotaId
            ? s.cuotas.map((cu) => (cu.id === cuotaId ? { ...cu, estado: "pagada", pagoId: pago.id } : cu))
            : s.cuotas;
          return { ...s, pagos: [...s.pagos, pago], cuotas };
        });
      },
    }),
    []
  );

  const value = useMemo(() => ({ ...state, ...actions }), [state, actions]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData debe usarse dentro de <DataProvider>");
  return ctx;
}
