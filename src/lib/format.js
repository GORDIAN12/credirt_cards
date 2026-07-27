const money = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const dayMonth = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" });

export function formatMoney(n) {
  return money.format(Number(n) || 0);
}

export function formatDateShort(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return dayMonth.format(new Date(y, m - 1, d));
}

export function round2(n) {
  return Math.round(n * 100) / 100;
}
