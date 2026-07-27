// Función serverless compatible con Netlify Functions v1 y v2.
// Reenvía mensajes a la API de Telegram.

async function processNotify(text, chatId) {
  let rawToken = process.env.TELEGRAM_BOT_TOKEN || "";
  let botToken = rawToken.replace(/^["']|["']$/g, "").trim();
  if (botToken.toLowerCase().startsWith("bot")) {
    botToken = botToken.slice(3).trim();
  }

  if (!botToken) {
    console.error("Falta TELEGRAM_BOT_TOKEN en las variables de entorno");
    return { status: 500, data: { ok: false, error: "TELEGRAM_BOT_TOKEN no configurado en Netlify" } };
  }

  if (!text) {
    return { status: 400, data: { ok: false, error: "Falta el texto del mensaje" } };
  }
  if (!chatId) {
    return { status: 400, data: { ok: false, error: "Falta chatId del usuario" } };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await res.json();
    if (!res.ok || !data.ok) {
      console.error("Telegram API error:", data);
      return {
        status: 502,
        data: {
          ok: false,
          error: data.description || `Error de Telegram (código ${data.error_code || res.status})`,
        },
      };
    }

    return { status: 200, data: { ok: true } };
  } catch (err) {
    console.error("Error al contactar Telegram:", err);
    const msg =
      err.name === "AbortError"
        ? "Tiempo de espera agotado al contactar api.telegram.org. Verifica que TELEGRAM_BOT_TOKEN en Netlify sea el token secreto de @BotFather (ej. 123456789:ABC...) y no el @username."
        : `No se pudo contactar a Telegram: ${err.message}`;
    return { status: 502, data: { ok: false, error: msg } };
  }
}

// Formato v1 (exports.handler)
export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let text, chatId;
  try {
    const body = JSON.parse(event.body || "{}");
    text = typeof body?.text === "string" ? body.text.trim() : "";
    chatId =
      (typeof body?.chatId === "string" && body.chatId.trim()) ||
      (typeof body?.chat_id === "string" && body.chat_id.trim()) ||
      process.env.TELEGRAM_CHAT_ID ||
      "";
  } catch {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: "Body JSON inválido" }),
    };
  }

  const { status, data } = await processNotify(text, chatId);
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
}

// Formato v2 (export default)
export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let text, chatId;
  try {
    const body = await req.json();
    text = typeof body?.text === "string" ? body.text.trim() : "";
    chatId =
      (typeof body?.chatId === "string" && body.chatId.trim()) ||
      (typeof body?.chat_id === "string" && body.chat_id.trim()) ||
      process.env.TELEGRAM_CHAT_ID ||
      "";
  } catch {
    return Response.json({ ok: false, error: "Body JSON inválido" }, { status: 400 });
  }

  const { status, data } = await processNotify(text, chatId);
  return Response.json(data, { status });
};
