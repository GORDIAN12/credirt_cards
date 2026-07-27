const KEY = "controlTarjetas.v1";

export function loadState(seedFactory) {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // storage vacío o corrupto: se reinicia con datos de ejemplo
  }
  return seedFactory();
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function resetState() {
  localStorage.removeItem(KEY);
}
