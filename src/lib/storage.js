// Archivo mantenido por compatibilidad — ya no se usa.
// La app ahora usa Supabase como fuente de verdad.
// Si el usuario tenía datos en localStorage, se ignoran al recargar.

export function loadState() {
  return null; // ignorar localStorage
}

export function saveState() {
  // no-op
}

export function resetState() {
  localStorage.removeItem("controlTarjetas.v1");
}
