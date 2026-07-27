// Netlify Edge Function (Deno Deploy), no AWS Lambda.
// Se migró desde netlify/functions/telegram-notify.js porque, incluso forzando
// IPv4, las funciones clásicas (AWS Lambda us-east-1) seguían colgándose al
// contactar api.telegram.org: Telegram limita/bloquea rangos de IP de nubes
// grandes y el tráfico se queda sin respuesta (timeout) en vez de rechazarse.
// La red de Edge Functions es distinta y evita ese bloqueo.

export default async (request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let text, chatId;
  try {
    const body = await request.json();
    text = typeof body?.text === "string" ? body.text.trim() : "";
    chatId =
      (typeof body?.chatId === "string" && body.chatId.trim()) ||
      (typeof body?.chat_id === "string" && body.chat_id.trim()) ||
      Deno.env.get("TELEGRAM_CHAT_ID") ||
      "";
  } catch {
    return Response.json({ ok: false, error: "Body JSON inválido" }, { status: 400 });
  }

  let rawToken = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
  let botToken = rawToken.replace(/^["']|["']$/g, "").trim();
  if (botToken.toLowerCase().startsWith("bot")) {
    botToken = botToken.slice(3).trim();
  }

  if (!botToken) {
    console.error("Falta TELEGRAM_BOT_TOKEN en las variables de entorno (scope Edge functions)");
    return Response.json(
      { ok: false, error: "TELEGRAM_BOT_TOKEN no configurado en Netlify (revisa el scope 'Edge functions')" },
      { status: 500 }
    );
  }
  if (!text) {
    return Response.json({ ok: false, error: "Falta el texto del mensaje" }, { status: 400 });
  }
  if (!chatId) {
    return Response.json({ ok: false, error: "Falta chatId del usuario" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

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
      signal: controller.signal,
    });

    const data = await res.json().catch(() => null);
    if (!data || !data.ok) {
      console.error("Telegram API error:", data);
      return Response.json(
        { ok: false, error: data?.description || `Error de Telegram (HTTP ${res.status})` },
        { status: 502 }
      );
    }
    return Response.json({ ok: true }, { status: 200 });
  } catch (err) {
    if (err.name === "AbortError") {
      return Response.json(
        { ok: false, error: "Tiempo de espera agotado al contactar Telegram (Edge Timeout)" },
        { status: 502 }
      );
    }
    console.error("Error al contactar Telegram desde Edge Function:", err);
    return Response.json({ ok: false, error: `No se pudo contactar a Telegram: ${err.message}` }, { status: 502 });
  } finally {
    clearTimeout(timeoutId);
  }
};

export const config = { path: "/api/telegram-notify" };