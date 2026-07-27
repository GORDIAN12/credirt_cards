// Función serverless (Netlify Functions v2) que reenvía un mensaje a Telegram.
// - TELEGRAM_BOT_TOKEN: un solo bot para toda la app (secreto del servidor)
// - chatId: viene en el body (chat personal de cada usuario)
// - TELEGRAM_CHAT_ID: fallback opcional si el body no trae chatId

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error("Falta TELEGRAM_BOT_TOKEN en las variables de entorno");
    return Response.json({ ok: false, error: "Telegram no configurado" }, { status: 500 });
  }

  let text;
  let chatId;
  try {
    const body = await req.json();
    text = typeof body?.text === "string" ? body.text.trim() : "";
    chatId =
      (typeof body?.chatId === "string" && body.chatId.trim()) ||
      (typeof body?.chat_id === "string" && body.chat_id.trim()) ||
      process.env.TELEGRAM_CHAT_ID ||
      "";
  } catch {
    return Response.json({ ok: false, error: "Body inválido" }, { status: 400 });
  }

  if (!text) {
    return Response.json({ ok: false, error: "Falta el texto del mensaje" }, { status: 400 });
  }
  if (!chatId) {
    return Response.json({ ok: false, error: "Falta chatId del usuario" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      console.error("Telegram API error:", data);
      return Response.json({ ok: false, error: data.description || "Error de Telegram" }, { status: 502 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Error al contactar Telegram:", err);
    return Response.json({ ok: false, error: "No se pudo contactar a Telegram" }, { status: 502 });
  }
};
