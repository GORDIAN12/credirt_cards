import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Mappers DB (snake_case) → App (camelCase) ───────────────────────────────

export const mapTarjeta = (r) => ({
  id: r.id,
  alias: r.alias,
  emisor: r.emisor,
  color: r.color ?? null,
  ultimos4: r.ultimos4 ?? "",
  fechaCorte: r.fecha_corte,
  fechaLimitePago: r.fecha_limite_pago,
  activa: r.activa,
});

export const mapCompra = (r) => ({
  id: r.id,
  tarjetaId: r.tarjeta_id,
  deudor: r.deudor ?? "",
  montoTotal: Number(r.monto_total),
  concepto: r.concepto ?? "",
  fecha: r.fecha,
  comercioUrl: r.comercio_url ?? null,
  esMSI: r.es_msi,
  numeroMeses: r.numero_meses ?? null,
  montoMensual: r.monto_mensual ? Number(r.monto_mensual) : null,
});

export const mapCuota = (r) => ({
  id: r.id,
  compraId: r.compra_id,
  numero: r.numero,
  montoProgramado: Number(r.monto_programado),
  fechaLimite: r.fecha_limite,
  estado: r.estado,
  pagoId: r.pago_id ?? null,
});

export const mapPago = (r) => ({
  id: r.id,
  compraId: r.compra_id ?? null,
  cuotaId: r.cuota_id ?? null,
  monto: Number(r.monto),
  fecha: r.fecha,
  tipo: r.tipo,
  saldoResultante: r.saldo_resultante ? Number(r.saldo_resultante) : null,
});

export const mapAdeudo = (r) => ({
  id: r.id,
  persona: r.persona,
  compraId: r.compra_id ?? null,
  montoOriginal: Number(r.monto_original),
  concepto: r.concepto ?? "",
  fecha: r.fecha,
  notas: r.notas ?? "",
});

export const mapAbonoAdeudo = (r) => ({
  id: r.id,
  adeudoId: r.adeudo_id,
  monto: Number(r.monto),
  fecha: r.fecha,
  notas: r.notas ?? "",
});

// ── Helpers para cargar todas las colecciones ───────────────────────────────

export async function fetchAll() {
  const [t, c, cu, p, a, ab] = await Promise.all([
    supabase.from("tarjetas").select("*").order("created_at"),
    supabase.from("compras").select("*").order("fecha"),
    supabase.from("cuotas").select("*").order("fecha_limite"),
    supabase.from("pagos").select("*").order("fecha"),
    supabase.from("adeudos").select("*").order("fecha"),
    supabase.from("abonos_adeudo").select("*").order("fecha"),
  ]);

  const firstError = [t, c, cu, p, a, ab].find((r) => r.error)?.error;
  if (firstError) throw new Error(firstError.message);

  return {
    tarjetas: (t.data || []).map(mapTarjeta),
    compras: (c.data || []).map(mapCompra),
    cuotas: (cu.data || []).map(mapCuota),
    pagos: (p.data || []).map(mapPago),
    adeudos: (a.data || []).map(mapAdeudo),
    abonosAdeudo: (ab.data || []).map(mapAbonoAdeudo),
  };
}
