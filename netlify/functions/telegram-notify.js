import https from "https";

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

  const payload = JSON.stringify({
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });

  return new Promise((resolve) => {
    const options = {
      hostname: "api.telegram.org",
      port: 443,
      path: `/bot${botToken}/sendMessage`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
      family: 4, // FORZAR IPv4 para evitar que Node 18 se quede colgado en Netlify/AWS con IPv6
      timeout: 8000,
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const data = JSON.parse(body);
          if (!data.ok) {
            console.error("Telegram API error:", data);
            resolve({
              status: 502,
              data: { ok: false, error: data.description || `Error de Telegram (HTTP ${res.statusCode})` },
            });
          } else {
            resolve({ status: 200, data: { ok: true } });
          }
        } catch (e) {
          resolve({ status: 502, data: { ok: false, error: "Respuesta inválida de Telegram" } });
        }
      });
    });

    req.on("error", (err) => {
      console.error("Error HTTPS al contactar Telegram:", err);
      resolve({ status: 502, data: { ok: false, error: `No se pudo contactar a Telegram: ${err.message}` } });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({
        status: 502,
        data: { ok: false, error: "Tiempo de espera agotado al contactar Telegram (IPv4 Timeout)" },
      });
    });

    req.write(payload);
    req.end();
  });
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
