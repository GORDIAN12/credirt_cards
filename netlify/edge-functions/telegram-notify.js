// Función Edge de Netlify que reenvía el mensaje a Telegram
// Las Edge Functions corren sobre Deno y el fetch nativo funciona perfecto.

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // En Netlify Edge Functions se accede a variables con Netlify.env
  let rawToken = Netlify.env.get("TELEGRAM_BOT_TOKEN") || "";
  let botToken = rawToken.replace(/^["']|["']$/g, "").trim();
  if (botToken.toLowerCase().startsWith("bot")) {
    botToken = botToken.slice(3).trim();
  }

  if (!botToken) {
    return Response.json({ ok: false, error: "TELEGRAM_BOT_TOKEN no configurado" }, { status: 500 });
  }

  let text, chatId;
  try {
    const body = await req.json();
    text = typeof body?.text === "string" ? body.text.trim() : "";
    chatId =
      (typeof body?.chatId === "string" && body.chatId.trim()) ||
      (typeof body?.chat_id === "string" && body.chat_id.trim()) ||
      Netlify.env.get("TELEGRAM_CHAT_ID") ||
      "";
  } catch {
    return Response.json({ ok: false, error: "Body JSON inválido" }, { status: 400 });
  }

  if (!text) {
    return Response.json({ ok: false, error: "Falta el texto" }, { status: 400 });
  }
  if (!chatId) {
    return Response.json({ ok: false, error: "Falta chatId" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

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
      return Response.json(
        { ok: false, error: data.description || `Error de Telegram (HTTP ${res.status})` },
        { status: 502 }
      );
    }
    return Response.json({ ok: true });
  } catch (err) {
    const msg = err.name === "AbortError" ? "Tiempo de espera agotado al contactar Telegram" : `Error de red: ${err.message}`;
    return Response.json({ ok: false, error: msg }, { status: 502 });
  }
};
