-- ============================================================
-- CONTROL DE TARJETAS — Schema multi-usuario (instalación nueva)
-- Ejecuta en: Supabase Dashboard → SQL Editor → Run
--
-- Requisitos:
--   Authentication → Providers → Email habilitado
--   (opcional) desactivar "Confirm email" para pruebas rápidas
-- ============================================================

-- Perfiles (1:1 con auth.users)
create table if not exists profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  email             text,
  nombre            text not null default '',
  telegram_chat_id  text, -- chat personal; el bot es compartido (TELEGRAM_BOT_TOKEN)
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- Tarjetas de crédito
create table if not exists tarjetas (
  id                text primary key,
  user_id           uuid not null references auth.users(id) on delete cascade,
  alias             text not null,
  emisor            text not null default 'otro',
  color             text,
  ultimos4          text default '',
  fecha_corte       integer not null default 5,
  fecha_limite_pago integer not null default 20,
  activa            boolean not null default true,
  created_at        timestamptz default now()
);

-- Compras
create table if not exists compras (
  id             text primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  tarjeta_id     text references tarjetas(id) on delete cascade,
  deudor         text default '',
  monto_total    numeric not null,
  concepto       text default '',
  fecha          date not null,
  comercio_url   text,
  es_msi         boolean not null default false,
  numero_meses   integer,
  monto_mensual  numeric,
  created_at     timestamptz default now()
);

-- Cuotas MSI
create table if not exists cuotas (
  id               text primary key,
  user_id          uuid not null references auth.users(id) on delete cascade,
  compra_id        text references compras(id) on delete cascade,
  numero           integer not null,
  monto_programado numeric not null,
  fecha_limite     date not null,
  estado           text not null default 'pendiente',
  pago_id          text,
  created_at       timestamptz default now()
);

-- Pagos
create table if not exists pagos (
  id               text primary key,
  user_id          uuid not null references auth.users(id) on delete cascade,
  compra_id        text,
  cuota_id         text,
  monto            numeric not null,
  fecha            date not null,
  tipo             text not null default 'parcial',
  saldo_resultante numeric,
  created_at       timestamptz default now()
);

-- Adeudos de terceros
create table if not exists adeudos (
  id             text primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  persona        text not null,
  compra_id      text,
  monto_original numeric not null,
  concepto       text default '',
  fecha          date not null,
  notas          text default '',
  created_at     timestamptz default now()
);

-- Abonos a adeudos
create table if not exists abonos_adeudo (
  id         text primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  adeudo_id  text references adeudos(id) on delete cascade,
  monto      numeric not null,
  fecha      date not null,
  notas      text default '',
  created_at timestamptz default now()
);

-- Índices por usuario
create index if not exists tarjetas_user_id_idx      on tarjetas(user_id);
create index if not exists compras_user_id_idx       on compras(user_id);
create index if not exists cuotas_user_id_idx        on cuotas(user_id);
create index if not exists pagos_user_id_idx         on pagos(user_id);
create index if not exists adeudos_user_id_idx       on adeudos(user_id);
create index if not exists abonos_adeudo_user_id_idx on abonos_adeudo(user_id);

-- ============================================================
-- Trigger: crear perfil al registrarse
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nombre)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- RLS: cada usuario solo ve / edita sus datos
-- ============================================================
alter table profiles      enable row level security;
alter table tarjetas      enable row level security;
alter table compras       enable row level security;
alter table cuotas        enable row level security;
alter table pagos         enable row level security;
alter table adeudos       enable row level security;
alter table abonos_adeudo enable row level security;

-- profiles
drop policy if exists "profiles_select_own" on profiles;
drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- Helper macro-style policies for user-owned tables
do $$
declare
  t text;
begin
  foreach t in array array['tarjetas','compras','cuotas','pagos','adeudos','abonos_adeudo']
  loop
    execute format('drop policy if exists %I on %I', t || '_select_own', t);
    execute format('drop policy if exists %I on %I', t || '_insert_own', t);
    execute format('drop policy if exists %I on %I', t || '_update_own', t);
    execute format('drop policy if exists %I on %I', t || '_delete_own', t);

    execute format('create policy %I on %I for select using (auth.uid() = user_id)', t || '_select_own', t);
    execute format('create policy %I on %I for insert with check (auth.uid() = user_id)', t || '_insert_own', t);
    execute format('create policy %I on %I for update using (auth.uid() = user_id)', t || '_update_own', t);
    execute format('create policy %I on %I for delete using (auth.uid() = user_id)', t || '_delete_own', t);
  end loop;
end $$;

select table_name from information_schema.tables
where table_schema = 'public'
order by table_name;
