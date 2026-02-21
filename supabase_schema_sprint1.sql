-- ============================================================
-- Tequila El Viejito — Esquema BD Sprint 1
-- Pega este script en: Supabase → SQL Editor → New query
-- ============================================================

-- ── 1. Extensiones ──────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── 2. Tabla: productos ─────────────────────────────────────
create table if not exists public.productos (
  id          uuid primary key default uuid_generate_v4(),
  nombre      text not null,
  descripcion text,
  tipo        text check (tipo in ('blanco','reposado','añejo','extra_añejo')),
  precio      numeric(10,2) not null default 0,
  imagen_url  text,
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- RLS: cualquiera puede leer productos activos
alter table public.productos enable row level security;

create policy "Productos visibles al público"
  on public.productos for select
  using (activo = true);

create policy "Solo admin modifica productos"
  on public.productos for all
  using (auth.role() = 'authenticated');

-- ── 3. Tabla: pedidos ───────────────────────────────────────
create table if not exists public.pedidos (
  id             uuid primary key default uuid_generate_v4(),
  cliente_nombre text not null,
  cliente_email  text not null,
  producto_id    uuid references public.productos(id) on delete set null,
  cantidad       int not null default 1 check (cantidad > 0),
  total          numeric(10,2),
  estado         text not null default 'pendiente'
                 check (estado in ('pendiente','confirmado','enviado','entregado','cancelado')),
  notas          text,
  created_at     timestamptz not null default now()
);

-- RLS: solo admin ve y gestiona pedidos
alter table public.pedidos enable row level security;

create policy "Solo admin gestiona pedidos"
  on public.pedidos for all
  using (auth.role() = 'authenticated');

-- ── 4. Tabla: usuarios_admin ────────────────────────────────
create table if not exists public.usuarios_admin (
  id         uuid primary key references auth.users(id) on delete cascade,
  nombre     text not null,
  email      text not null unique,
  rol        text not null default 'admin'
             check (rol in ('admin','superadmin')),
  activo     boolean not null default true,
  created_at timestamptz not null default now()
);

-- RLS: solo el propio usuario o superadmin ve este registro
alter table public.usuarios_admin enable row level security;

create policy "Admin ve su propio perfil"
  on public.usuarios_admin for select
  using (auth.uid() = id);

-- ── 5. Datos de prueba (productos) ──────────────────────────
insert into public.productos (nombre, descripcion, tipo, precio) values
  ('Blanco Clásico',  'Cristalino, fresco, notas herbales del agave azul.',           'blanco',      320.00),
  ('Reposado Suave',  'Reposado 8 meses en barrica de roble. Notas a vainilla.',      'reposado',    450.00),
  ('Añejo Premium',   'Añejado 18 meses. Notas a chocolate amargo y frutos secos.',   'añejo',       680.00),
  ('Extra Añejo',     'Más de 3 años en barrica. La expresión máxima de la marca.',   'extra_añejo', 980.00);
