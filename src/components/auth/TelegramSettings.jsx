import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { notifyTelegram } from "../../lib/telegram";
import Modal from "../shared/Modal";

const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "";

export default function TelegramSettings({ open, onClose }) {
  const { profile, updateProfile } = useAuth();
  const [chatId, setChatId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (!open) return;
    setChatId(profile?.telegram_chat_id || "");
    setError("");
    setInfo("");
  }, [open, profile?.telegram_chat_id]);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setInfo("");
    try {
      const cleaned = chatId.trim();
      await updateProfile({ telegram_chat_id: cleaned || null });
      setInfo(cleaned ? "Telegram vinculado. Los avisos llegarán a tu chat." : "Telegram desvinculado.");
    } catch (err) {
      setError(err.message || "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }

  function sendTest() {
    const id = chatId.trim() || profile?.telegram_chat_id;
    if (!id) {
      setError("Guarda primero tu Chat ID.");
      return;
    }
    notifyTelegram("✅ Prueba de <b>Control de Tarjetas</b>: tu Telegram está vinculado.", id);
    setInfo("Mensaje de prueba enviado. Revisa Telegram.");
  }

  const botLink = BOT_USERNAME ? `https://t.me/${BOT_USERNAME.replace(/^@/, "")}` : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Notificaciones Telegram"
      hint="Un solo bot para la app; cada usuario recibe avisos en su propio chat."
    >
      <form onSubmit={save}>
        <ol className="telegram-steps">
          <li>
            {botLink ? (
              <>
                Abre el bot{" "}
                <a href={botLink} target="_blank" rel="noreferrer">
                  @{BOT_USERNAME.replace(/^@/, "")}
                </a>{" "}
                y envía <code>/start</code>.
              </>
            ) : (
              <>
                Abre el bot de la app en Telegram y envía <code>/start</code>.
              </>
            )}
          </li>
          <li>
            Obtén tu Chat ID con{" "}
            <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer">
              @userinfobot
            </a>{" "}
            (te responde un número, ej. <code>123456789</code>).
          </li>
          <li>Pégalo abajo y guarda. Solo tú recibirás tus avisos.</li>
        </ol>

        <div className="field">
          <label htmlFor="telegram-chat-id">Tu Chat ID</label>
          <input
            id="telegram-chat-id"
            type="text"
            inputMode="numeric"
            placeholder="123456789"
            value={chatId}
            onChange={(e) => setChatId(e.target.value.replace(/[^\d-]/g, ""))}
          />
        </div>

        {error && <p className="auth-msg auth-msg--error">{error}</p>}
        {info && <p className="auth-msg auth-msg--info">{info}</p>}

        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cerrar
          </button>
          <button type="button" className="btn btn--ghost" onClick={sendTest} disabled={busy}>
            Probar
          </button>
          <button type="submit" className="btn btn--primary" disabled={busy}>
            {busy ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
