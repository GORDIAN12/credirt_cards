-- ============================================================
-- MIGRACIÓN: de uso personal → multi-usuario con Auth
-- Ejecuta SOLO si ya tienes las tablas sin user_id.
-- Si partes de cero, usa supabase_schema.sql en su lugar.
--
-- IMPORTANTE:
--   1. Crea tu cuenta en la app (o en Authentication → Users).
--   2. Copia el UUID del usuario en Auth → Users.
--   3. Reemplaza 'TU_USER_UUID' abajo y ejecuta el bloque de
--      reclamo de datos existentes (opcional).
-- ============================================================

-- 1) Perfiles
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  nombre     text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2) Columna user_id en tablas existentes
alter table tarjetas      add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table compras       add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table cuotas        add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table pagos         add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table adeudos       add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table abonos_adeudo add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists tarjetas_user_id_idx      on tarjetas(user_id);
create index if not exists compras_user_id_idx       on compras(user_id);
create index if not exists cuotas_user_id_idx        on cuotas(user_id);
create index if not exists pagos_user_id_idx         on pagos(user_id);
create index if not exists adeudos_user_id_idx       on adeudos(user_id);
create index if not exists abonos_adeudo_user_id_idx on abonos_adeudo(user_id);

-- 3) Trigger perfil al registrarse
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
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4) OPCIONAL — reclamar datos viejos (sin dueño) para TU usuario
-- Descomenta y sustituye el UUID:
/*
update tarjetas      set user_id = 'TU_USER_UUID' where user_id is null;
update compras       set user_id = 'TU_USER_UUID' where user_id is null;
update cuotas        set user_id = 'TU_USER_UUID' where user_id is null;
update pagos         set user_id = 'TU_USER_UUID' where user_id is null;
update adeudos       set user_id = 'TU_USER_UUID' where user_id is null;
update abonos_adeudo set user_id = 'TU_USER_UUID' where user_id is null;
*/

-- 5) NOT NULL en user_id (falla si aún hay filas sin dueño)
-- Ejecuta después de reclamar datos, o si la BD está vacía:
/*
alter table tarjetas      alter column user_id set not null;
alter table compras       alter column user_id set not null;
alter table cuotas        alter column user_id set not null;
alter table pagos         alter column user_id set not null;
alter table adeudos       alter column user_id set not null;
alter table abonos_adeudo alter column user_id set not null;
*/

-- 6) Activar RLS
alter table profiles      enable row level security;
alter table tarjetas      enable row level security;
alter table compras       enable row level security;
alter table cuotas        enable row level security;
alter table pagos         enable row level security;
alter table adeudos       enable row level security;
alter table abonos_adeudo enable row level security;

drop policy if exists "profiles_select_own" on profiles;
drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

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
