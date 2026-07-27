import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase, fetchAll } from "../lib/supabase";
import { generateCuotas } from "../lib/calc";
import { makeId } from "../lib/id";
import { round2 } from "../lib/format";

const DataContext = createContext(null);

const EMPTY_STATE = {
  tarjetas: [],
  compras: [],
  cuotas: [],
  pagos: [],
  adeudos: [],
  abonosAdeudo: [],
};

export function DataProvider({ children }) {
  const [data, setData]       = useState(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setDbError(null);
    try {
      const fresh = await fetchAll();
      setData(fresh);
    } catch (e) {
      setDbError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Helpers optimistas ─────────────────────────────────────────────────────
  // Actualiza el estado local inmediatamente (UX instantánea) y luego persiste
  // en Supabase. Si falla, recarga desde la BD para quedar consistente.

  async function run(optimisticFn, supabaseOp) {
    setData((d) => optimisticFn(d));
    const result = await supabaseOp();
    if (result?.error) {
      console.error("Supabase error:", result.error.message);
      loadAll(); // revert al estado real de la BD
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TARJETAS
  // ══════════════════════════════════════════════════════════════════════════

  async function addTarjeta(input) {
    const id = makeId("t");
    const tarjeta = { id, activa: true, ...input };
    await run(
      (d) => ({ ...d, tarjetas: [...d.tarjetas, tarjeta] }),
      () => supabase.from("tarjetas").insert({
        id,
        alias: input.alias,
        emisor: input.emisor,
        color: input.color ?? null,
        ultimos4: input.ultimos4 ?? "",
        fecha_corte: Number(input.fechaCorte),
        fecha_limite_pago: Number(input.fechaLimitePago),
        activa: input.activa ?? true,
      })
    );
  }

  async function updateTarjeta(id, patch) {
    await run(
      (d) => ({ ...d, tarjetas: d.tarjetas.map((t) => (t.id === id ? { ...t, ...patch } : t)) }),
      () => supabase.from("tarjetas").update({
        alias: patch.alias,
        emisor: patch.emisor,
        color: patch.color ?? null,
        ultimos4: patch.ultimos4 ?? "",
        fecha_corte: Number(patch.fechaCorte),
        fecha_limite_pago: Number(patch.fechaLimitePago),
        activa: patch.activa,
      }).eq("id", id)
    );
  }

  async function deleteTarjeta(id) {
    // La cascada en la BD borra compras → cuotas → (pagos referenciados)
    await run(
      (d) => {
        const compraIds = new Set(d.compras.filter((c) => c.tarjetaId === id).map((c) => c.id));
        const cuotaIds  = new Set(d.cuotas.filter((cu) => compraIds.has(cu.compraId)).map((cu) => cu.id));
        return {
          tarjetas:    d.tarjetas.filter((t) => t.id !== id),
          compras:     d.compras.filter((c) => !compraIds.has(c.id)),
          cuotas:      d.cuotas.filter((cu) => !compraIds.has(cu.compraId)),
          pagos:       d.pagos.filter((p) => !compraIds.has(p.compraId) && !cuotaIds.has(p.cuotaId)),
          adeudos:     d.adeudos,
          abonosAdeudo: d.abonosAdeudo,
        };
      },
      () => supabase.from("tarjetas").delete().eq("id", id)
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // COMPRAS
  // ══════════════════════════════════════════════════════════════════════════

  async function addCompra(input) {
    const tarjeta  = data.tarjetas.find((t) => t.id === input.tarjetaId);
    const esMSI    = !!input.esMSI;
    const compra   = {
      id:           input._id || makeId("c"),   // acepta ID pre-generado para vinculación
      tarjetaId:    input.tarjetaId,
      deudor:       input.deudor ?? "",
      montoTotal:   Number(input.montoTotal),
      concepto:     input.concepto ?? "",
      fecha:        input.fecha,
      comercioUrl:  input.comercioUrl || null,
      esMSI,
      numeroMeses:  esMSI ? Number(input.numeroMeses) : null,
      montoMensual: esMSI ? round2(Number(input.montoTotal) / Number(input.numeroMeses)) : null,
    };
    const nuevasCuotas = esMSI ? generateCuotas(compra, tarjeta) : [];

    await run(
      (d) => ({ ...d, compras: [...d.compras, compra], cuotas: [...d.cuotas, ...nuevasCuotas] }),
      async () => {
        const { error: ec } = await supabase.from("compras").insert({
          id:            compra.id,
          tarjeta_id:    compra.tarjetaId,
          deudor:        compra.deudor,
          monto_total:   compra.montoTotal,
          concepto:      compra.concepto,
          fecha:         compra.fecha,
          comercio_url:  compra.comercioUrl,
          es_msi:        compra.esMSI,
          numero_meses:  compra.numeroMeses,
          monto_mensual: compra.montoMensual,
        });
        if (ec) return { error: ec };
        if (nuevasCuotas.length) {
          return supabase.from("cuotas").insert(
            nuevasCuotas.map((cu) => ({
              id:               cu.id,
              compra_id:        cu.compraId,
              numero:           cu.numero,
              monto_programado: cu.montoProgramado,
              fecha_limite:     cu.fechaLimite,
              estado:           cu.estado,
              pago_id:          cu.pagoId,
            }))
          );
        }
        return { error: null };
      }
    );
  }

  async function deleteCompra(id) {
    await run(
      (d) => {
        const cuotaIds = new Set(d.cuotas.filter((cu) => cu.compraId === id).map((cu) => cu.id));
        return {
          ...d,
          compras: d.compras.filter((c) => c.id !== id),
          cuotas:  d.cuotas.filter((cu) => cu.compraId !== id),
          pagos:   d.pagos.filter((p) => p.compraId !== id && !cuotaIds.has(p.cuotaId)),
        };
      },
      () => supabase.from("compras").delete().eq("id", id)
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PAGOS
  // ══════════════════════════════════════════════════════════════════════════

  async function addPago({ compraId, cuotaId, monto, fecha, tipo }) {
    const id   = makeId("p");
    const pago = {
      id,
      compraId: compraId ?? null,
      cuotaId:  cuotaId  ?? null,
      monto:    Number(monto),
      fecha,
      tipo,
      saldoResultante: null,
    };
    await run(
      (d) => {
        const cuotas = cuotaId
          ? d.cuotas.map((cu) => (cu.id === cuotaId ? { ...cu, estado: "pagada", pagoId: id } : cu))
          : d.cuotas;
        return { ...d, pagos: [...d.pagos, pago], cuotas };
      },
      async () => {
        const { error: ep } = await supabase.from("pagos").insert({
          id,
          compra_id:        pago.compraId,
          cuota_id:         pago.cuotaId,
          monto:            pago.monto,
          fecha:            pago.fecha,
          tipo:             pago.tipo,
          saldo_resultante: pago.saldoResultante,
        });
        if (ep) return { error: ep };
        if (cuotaId) {
          return supabase.from("cuotas").update({ estado: "pagada", pago_id: id }).eq("id", cuotaId);
        }
        return { error: null };
      }
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ADEUDOS DE TERCEROS
  // ══════════════════════════════════════════════════════════════════════════

  async function addAdeudo(input) {
    const id     = makeId("a");
    const adeudo = {
      id,
      persona:       input.persona,
      compraId:      input.compraId || null,
      montoOriginal: Number(input.montoOriginal),
      concepto:      input.concepto ?? "",
      fecha:         input.fecha,
      notas:         input.notas ?? "",
    };
    await run(
      (d) => ({ ...d, adeudos: [...d.adeudos, adeudo] }),
      () => supabase.from("adeudos").insert({
        id,
        persona:        adeudo.persona,
        compra_id:      adeudo.compraId,
        monto_original: adeudo.montoOriginal,
        concepto:       adeudo.concepto,
        fecha:          adeudo.fecha,
        notas:          adeudo.notas,
      })
    );
  }

  async function updateAdeudo(id, patch) {
    await run(
      (d) => ({ ...d, adeudos: d.adeudos.map((a) => (a.id === id ? { ...a, ...patch } : a)) }),
      () => supabase.from("adeudos").update({
        persona:        patch.persona,
        compra_id:      patch.compraId || null,
        monto_original: Number(patch.montoOriginal),
        concepto:       patch.concepto ?? "",
        fecha:          patch.fecha,
        notas:          patch.notas ?? "",
      }).eq("id", id)
    );
  }

  async function deleteAdeudo(id) {
    await run(
      (d) => ({
        ...d,
        adeudos:      d.adeudos.filter((a) => a.id !== id),
        abonosAdeudo: d.abonosAdeudo.filter((ab) => ab.adeudoId !== id),
      }),
      () => supabase.from("adeudos").delete().eq("id", id)
    );
  }

  async function addAbonoAdeudo({ adeudoId, monto, fecha, notas }) {
    const id    = makeId("ab");
    const abono = { id, adeudoId, monto: Number(monto), fecha, notas: notas ?? "" };
    await run(
      (d) => ({ ...d, abonosAdeudo: [...d.abonosAdeudo, abono] }),
      () => supabase.from("abonos_adeudo").insert({
        id,
        adeudo_id: adeudoId,
        monto:     abono.monto,
        fecha:     abono.fecha,
        notas:     abono.notas,
      })
    );
  }

  async function deleteAbonoAdeudo(id) {
    await run(
      (d) => ({ ...d, abonosAdeudo: d.abonosAdeudo.filter((ab) => ab.id !== id) }),
      () => supabase.from("abonos_adeudo").delete().eq("id", id)
    );
  }

  // ── Contexto ───────────────────────────────────────────────────────────────
  const value = {
    ...data,
    loading,
    dbError,
    reload: loadAll,
    addTarjeta,
    updateTarjeta,
    deleteTarjeta,
    addCompra,
    deleteCompra,
    addPago,
    addAdeudo,
    updateAdeudo,
    deleteAdeudo,
    addAbonoAdeudo,
    deleteAbonoAdeudo,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData debe usarse dentro de <DataProvider>");
  return ctx;
}
