-- Diárias — estrutura do banco de dados.
-- Rode este arquivo UMA vez no Supabase: menu "SQL Editor" → "New query" → cole tudo → "Run".

-- Quem pode ver e mexer nos dados (a mãe e o pai).
create table if not exists public.familia (
  user_id uuid primary key references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now()
);

create or replace function public.eh_da_familia()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.familia where user_id = auth.uid());
$$;

-- Lugares onde a faxina acontece.
create table if not exists public.locais (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (length(trim(nome)) > 0),
  tipo text not null check (tipo in ('apto', 'casa', 'loja')),
  valor_padrao numeric(10, 2) not null default 0 check (valor_padrao >= 0),
  arquivado boolean not null default false,
  created_at timestamptz not null default now()
);

-- Cada faxina feita.
create table if not exists public.faxinas (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references public.locais (id) on delete restrict,
  data date not null,
  valor numeric(10, 2) not null check (valor >= 0),
  observacao text,
  criado_por uuid default auth.uid() references auth.users (id) on delete set null,
  criado_por_nome text,
  created_at timestamptz not null default now()
);

create index if not exists faxinas_data_idx on public.faxinas (data desc);
create index if not exists faxinas_local_idx on public.faxinas (local_id);

-- Segurança: só quem está na tabela "familia" enxerga os dados.
alter table public.familia enable row level security;
alter table public.locais enable row level security;
alter table public.faxinas enable row level security;

drop policy if exists "familia ve o proprio cadastro" on public.familia;
create policy "familia ve o proprio cadastro" on public.familia
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "familia usa locais" on public.locais;
create policy "familia usa locais" on public.locais
  for all to authenticated using (public.eh_da_familia()) with check (public.eh_da_familia());

drop policy if exists "familia usa faxinas" on public.faxinas;
create policy "familia usa faxinas" on public.faxinas
  for all to authenticated using (public.eh_da_familia()) with check (public.eh_da_familia());

-- Atualização em tempo real: o que um celular registra aparece no outro.
do $$
begin
  alter publication supabase_realtime add table public.locais;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.faxinas;
exception when duplicate_object then null;
end $$;
