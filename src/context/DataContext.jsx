import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase, fetchAll } from "../lib/supabase";
import { generateCuotas } from "../lib/calc";
import { makeId } from "../lib/id";
import { round2, formatMoney } from "../lib/format";
import { notifyTelegram } from "../lib/telegram";
import { useAuth } from "./AuthContext";

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
  const { user, profile } = useAuth();
  const [data, setData] = useState(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(null);

  const loadAll = useCallback(async () => {
    if (!user) {
      setData(EMPTY_STATE);
      setLoading(false);
      setDbError(null);
      return;
    }
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
  }, [user]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Actualiza el estado local de inmediato y luego persiste en Supabase.
  // Si falla, recarga. Si ok y hay mensaje, notifica por Telegram.
  async function run(optimisticFn, supabaseOp, notifyMessage) {
    setData((d) => optimisticFn(d));
    const result = await supabaseOp();
    if (result?.error) {
      console.error("Supabase error:", result.error.message);
      loadAll();
    } else if (notifyMessage) {
      notifyTelegram(notifyMessage, profile?.telegram_chat_id);
    }
  }

  function requireUserId() {
    if (!user?.id) throw new Error("Debes iniciar sesión.");
    return user.id;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TARJETAS
  // ══════════════════════════════════════════════════════════════════════════

  async function addTarjeta(input) {
    const userId = requireUserId();
    const id = makeId("t");
    const tarjeta = { id, activa: true, ...input };
    await run(
      (d) => ({ ...d, tarjetas: [...d.tarjetas, tarjeta] }),
      () =>
        supabase.from("tarjetas").insert({
          id,
          user_id: userId,
          alias: input.alias,
          emisor: input.emisor,
          color: input.color ?? null,
          ultimos4: input.ultimos4 ?? "",
          fecha_corte: Number(input.fechaCorte),
          fecha_limite_pago: Number(input.fechaLimitePago),
          activa: input.activa ?? true,
        }),
      `💳 Nueva tarjeta agregada: <b>${input.alias}</b> (${input.emisor})`
    );
  }

  async function updateTarjeta(id, patch) {
    await run(
      (d) => ({ ...d, tarjetas: d.tarjetas.map((t) => (t.id === id ? { ...t, ...patch } : t)) }),
      () =>
        supabase
          .from("tarjetas")
          .update({
            alias: patch.alias,
            emisor: patch.emisor,
            color: patch.color ?? null,
            ultimos4: patch.ultimos4 ?? "",
            fecha_corte: Number(patch.fechaCorte),
            fecha_limite_pago: Number(patch.fechaLimitePago),
            activa: patch.activa,
          })
          .eq("id", id),
      `✏️ Tarjeta actualizada: <b>${patch.alias}</b>`
    );
  }

  async function deleteTarjeta(id) {
    const tarjeta = data.tarjetas.find((t) => t.id === id);
    await run(
      (d) => {
        const compraIds = new Set(d.compras.filter((c) => c.tarjetaId === id).map((c) => c.id));
        const cuotaIds = new Set(d.cuotas.filter((cu) => compraIds.has(cu.compraId)).map((cu) => cu.id));
        return {
          tarjetas: d.tarjetas.filter((t) => t.id !== id),
          compras: d.compras.filter((c) => !compraIds.has(c.id)),
          cuotas: d.cuotas.filter((cu) => !compraIds.has(cu.compraId)),
          pagos: d.pagos.filter((p) => !compraIds.has(p.compraId) && !cuotaIds.has(p.cuotaId)),
          adeudos: d.adeudos,
          abonosAdeudo: d.abonosAdeudo,
        };
      },
      () => supabase.from("tarjetas").delete().eq("id", id),
      `🗑️ Tarjeta eliminada: <b>${tarjeta?.alias ?? id}</b>`
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // COMPRAS
  // ══════════════════════════════════════════════════════════════════════════

  async function addCompra(input) {
    const userId = requireUserId();
    const tarjeta = data.tarjetas.find((t) => t.id === input.tarjetaId);
    const esMSI = !!input.esMSI;
    const compra = {
      id: input._id || makeId("c"),
      tarjetaId: input.tarjetaId,
      deudor: input.deudor ?? "",
      montoTotal: Number(input.montoTotal),
      concepto: input.concepto ?? "",
      fecha: input.fecha,
      comercioUrl: input.comercioUrl || null,
      esMSI,
      numeroMeses: esMSI ? Number(input.numeroMeses) : null,
      montoMensual: esMSI ? round2(Number(input.montoTotal) / Number(input.numeroMeses)) : null,
    };
    const nuevasCuotas = esMSI ? generateCuotas(compra, tarjeta) : [];

    await run(
      (d) => ({ ...d, compras: [...d.compras, compra], cuotas: [...d.cuotas, ...nuevasCuotas] }),
      async () => {
        const { error: ec } = await supabase.from("compras").insert({
          id: compra.id,
          user_id: userId,
          tarjeta_id: compra.tarjetaId,
          deudor: compra.deudor,
          monto_total: compra.montoTotal,
          concepto: compra.concepto,
          fecha: compra.fecha,
          comercio_url: compra.comercioUrl,
          es_msi: compra.esMSI,
          numero_meses: compra.numeroMeses,
          monto_mensual: compra.montoMensual,
        });
        if (ec) return { error: ec };
        if (nuevasCuotas.length) {
          return supabase.from("cuotas").insert(
            nuevasCuotas.map((cu) => ({
              id: cu.id,
              user_id: userId,
              compra_id: cu.compraId,
              numero: cu.numero,
              monto_programado: cu.montoProgramado,
              fecha_limite: cu.fechaLimite,
              estado: cu.estado,
              pago_id: cu.pagoId,
            }))
          );
        }
        return { error: null };
      },
      `🛒 Nueva compra: <b>${compra.concepto || compra.deudor || "sin concepto"}</b> por ${formatMoney(compra.montoTotal)}` +
        (tarjeta ? ` en ${tarjeta.alias}` : "") +
        (esMSI ? ` a ${compra.numeroMeses} MSI` : "")
    );
  }

  async function deleteCompra(id) {
    const compra = data.compras.find((c) => c.id === id);
    await run(
      (d) => {
        const cuotaIds = new Set(d.cuotas.filter((cu) => cu.compraId === id).map((cu) => cu.id));
        return {
          ...d,
          compras: d.compras.filter((c) => c.id !== id),
          cuotas: d.cuotas.filter((cu) => cu.compraId !== id),
          pagos: d.pagos.filter((p) => p.compraId !== id && !cuotaIds.has(p.cuotaId)),
        };
      },
      () => supabase.from("compras").delete().eq("id", id),
      `🗑️ Compra eliminada: <b>${compra?.concepto || compra?.deudor || id}</b>`
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PAGOS
  // ══════════════════════════════════════════════════════════════════════════

  async function addPago({ compraId, cuotaId, monto, fecha, tipo }) {
    const userId = requireUserId();
    const id = makeId("p");
    const pago = {
      id,
      compraId: compraId ?? null,
      cuotaId: cuotaId ?? null,
      monto: Number(monto),
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
          user_id: userId,
          compra_id: pago.compraId,
          cuota_id: pago.cuotaId,
          monto: pago.monto,
          fecha: pago.fecha,
          tipo: pago.tipo,
          saldo_resultante: pago.saldoResultante,
        });
        if (ep) return { error: ep };
        if (cuotaId) {
          return supabase.from("cuotas").update({ estado: "pagada", pago_id: id }).eq("id", cuotaId);
        }
        return { error: null };
      },
      (() => {
        const cuota = cuotaId ? data.cuotas.find((cu) => cu.id === cuotaId) : null;
        const compra = data.compras.find((c) => c.id === (compraId ?? cuota?.compraId));
        const detalle = compra ? ` – ${compra.concepto || compra.deudor}` : "";
        const cuotaTxt = cuota
          ? ` (cuota ${cuota.numero}${compra?.numeroMeses ? `/${compra.numeroMeses}` : ""})`
          : "";
        return `💰 Pago registrado: <b>${formatMoney(pago.monto)}</b>${cuotaTxt}${detalle}`;
      })()
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ADEUDOS DE TERCEROS
  // ══════════════════════════════════════════════════════════════════════════

  async function addAdeudo(input) {
    const userId = requireUserId();
    const id = makeId("a");
    const adeudo = {
      id,
      persona: input.persona,
      compraId: input.compraId || null,
      montoOriginal: Number(input.montoOriginal),
      concepto: input.concepto ?? "",
      fecha: input.fecha,
      notas: input.notas ?? "",
    };
    await run(
      (d) => ({ ...d, adeudos: [...d.adeudos, adeudo] }),
      () =>
        supabase.from("adeudos").insert({
          id,
          user_id: userId,
          persona: adeudo.persona,
          compra_id: adeudo.compraId,
          monto_original: adeudo.montoOriginal,
          concepto: adeudo.concepto,
          fecha: adeudo.fecha,
          notas: adeudo.notas,
        }),
      `🤝 Nuevo adeudo de terceros: <b>${adeudo.persona}</b> por ${formatMoney(adeudo.montoOriginal)}`
    );
  }

  async function updateAdeudo(id, patch) {
    await run(
      (d) => ({ ...d, adeudos: d.adeudos.map((a) => (a.id === id ? { ...a, ...patch } : a)) }),
      () =>
        supabase
          .from("adeudos")
          .update({
            persona: patch.persona,
            compra_id: patch.compraId || null,
            monto_original: Number(patch.montoOriginal),
            concepto: patch.concepto ?? "",
            fecha: patch.fecha,
            notas: patch.notas ?? "",
          })
          .eq("id", id),
      `✏️ Adeudo actualizado: <b>${patch.persona}</b>`
    );
  }

  async function deleteAdeudo(id) {
    const adeudo = data.adeudos.find((a) => a.id === id);
    await run(
      (d) => ({
        ...d,
        adeudos: d.adeudos.filter((a) => a.id !== id),
        abonosAdeudo: d.abonosAdeudo.filter((ab) => ab.adeudoId !== id),
      }),
      () => supabase.from("adeudos").delete().eq("id", id),
      `🗑️ Adeudo eliminado: <b>${adeudo?.persona ?? id}</b>`
    );
  }

  async function addAbonoAdeudo({ adeudoId, monto, fecha, notas }) {
    const userId = requireUserId();
    const id = makeId("ab");
    const abono = { id, adeudoId, monto: Number(monto), fecha, notas: notas ?? "" };
    const adeudo = data.adeudos.find((a) => a.id === adeudoId);
    await run(
      (d) => ({ ...d, abonosAdeudo: [...d.abonosAdeudo, abono] }),
      () =>
        supabase.from("abonos_adeudo").insert({
          id,
          user_id: userId,
          adeudo_id: adeudoId,
          monto: abono.monto,
          fecha: abono.fecha,
          notas: abono.notas,
        }),
      `💵 Abono registrado: <b>${formatMoney(abono.monto)}</b>` +
        (adeudo ? ` al adeudo de ${adeudo.persona}` : "")
    );
  }

  async function deleteAbonoAdeudo(id) {
    const abono = data.abonosAdeudo.find((ab) => ab.id === id);
    const adeudo = abono ? data.adeudos.find((a) => a.id === abono.adeudoId) : null;
    await run(
      (d) => ({ ...d, abonosAdeudo: d.abonosAdeudo.filter((ab) => ab.id !== id) }),
      () => supabase.from("abonos_adeudo").delete().eq("id", id),
      `🗑️ Abono eliminado: <b>${abono ? formatMoney(abono.monto) : id}</b>` +
        (adeudo ? ` (adeudo de ${adeudo.persona})` : "")
    );
  }

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
