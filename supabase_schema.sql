-- ============================================================
-- CONTROL DE TARJETAS — Schema Supabase
-- Ejecuta esto en: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Tarjetas de crédito
create table if not exists tarjetas (
  id                text primary key,
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
  id        text primary key,
  adeudo_id text references adeudos(id) on delete cascade,
  monto     numeric not null,
  fecha     date not null,
  notas     text default '',
  created_at timestamptz default now()
);

-- Deshabilitar RLS para uso personal (sin autenticación de usuarios)
alter table tarjetas     disable row level security;
alter table compras      disable row level security;
alter table cuotas       disable row level security;
alter table pagos        disable row level security;
alter table adeudos      disable row level security;
alter table abonos_adeudo disable row level security;

-- Verificar que se crearon correctamente
select table_name from information_schema.tables
where table_schema = 'public'
order by table_name;
