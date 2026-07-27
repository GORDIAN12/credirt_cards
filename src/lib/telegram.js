// Envía notificaciones de Telegram vía la función serverless de Netlify.
// Cada usuario pasa SU chatId (guardado en profiles.telegram_chat_id).
// El token del bot es único y vive solo en el servidor.

const ENDPOINT = "/.netlify/functions/telegram-notify";

export function notifyTelegram(text, chatId) {
  if (!text || !chatId) return;
  fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, chatId: String(chatId) }),
  }).catch((err) => {
    console.warn("No se pudo enviar la notificación de Telegram:", err.message);
  });
}
