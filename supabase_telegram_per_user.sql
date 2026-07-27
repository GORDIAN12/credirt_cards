-- ============================================================
-- Telegram por usuario: cada perfil guarda su propio chat_id
-- El BOT es compartido (TELEGRAM_BOT_TOKEN en Netlify).
-- Cada persona recibe avisos solo en SU chat.
-- ============================================================

alter table profiles
  add column if not exists telegram_chat_id text;

comment on column profiles.telegram_chat_id is
  'Chat ID personal de Telegram. El bot es compartido; el destino es por usuario.';
