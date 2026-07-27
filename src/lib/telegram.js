// Envía notificaciones de Telegram vía la Edge Function de Netlify.
// Cada usuario pasa SU chatId (guardado en profiles.telegram_chat_id).
// El token del bot es único y vive solo en el servidor.
// Nota: usa Edge Function (no una función clásica) porque AWS Lambda
// (us-east-1) se quedaba colgado al contactar api.telegram.org.

const ENDPOINT = "/api/telegram-notify";

export async function notifyTelegram(text, chatId) {
  if (!text || !chatId) return { ok: false, error: "Falta texto o chatId" };
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, chatId: String(chatId) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || `Error servidor HTTP ${res.status}` };
    }
    return data;
  } catch (err) {
    console.warn("No se pudo enviar la notificación de Telegram:", err.message);
    return { ok: false, error: err.message || "Error de red" };
  }
}
