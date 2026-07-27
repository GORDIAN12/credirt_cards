export const BRANDS = {
  nu: { label: "Nu", c1: "#8A05BE", c2: "#57037D", text: "#fff" },
  mercadopago: { label: "Mercado Pago", c1: "#0093D8", c2: "#0074AD", accent: "#00A650", text: "#fff" },
  plata: { label: "Plata Card", c1: "#D6D6D6", c2: "#9B9B9B", text: "#2A2A2A" },
  bbva: { label: "BBVA", c1: "#004481", c2: "#00224A", text: "#fff" },
  banamex: { label: "Banamex", c1: "#002A8F", c2: "#001A5C", accent: "#E4032E", text: "#fff" },
  otro: { label: "Personalizado", c1: "#4B5563", c2: "#33393F", text: "#fff" },
};

export const BRAND_ORDER = ["nu", "mercadopago", "plata", "bbva", "banamex", "otro"];

export function brandOf(emisor) {
  return BRANDS[emisor] || BRANDS.otro;
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function toHex({ r, g, b }) {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
}

export function darken(hex, amount = 0.35) {
  const { r, g, b } = hexToRgb(hex);
  return toHex({ r: r * (1 - amount), g: g * (1 - amount), b: b * (1 - amount) });
}

export function contrastText(hex) {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1B2126" : "#ffffff";
}

// Resuelve el color final de una tarjeta: el color de marca fijo para emisores
// conocidos, o el color elegido por el usuario con el selector cuando es "otro".
export function resolveBrand(tarjeta) {
  if (tarjeta.emisor !== "otro") return brandOf(tarjeta.emisor);
  const base = tarjeta.color || BRANDS.otro.c1;
  return { label: "Personalizado", c1: base, c2: darken(base), text: contrastText(base) };
}
