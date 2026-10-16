-- Diárias — estrutura do banco de dados.
-- Rode este arquivo UMA vez no Supabase: menu "SQL Editor" → "New query" → cole tudo → "Run".
-- Ele pode ser rodado de novo sem perder dados.

-- ============================================================
-- Quem pode usar o app
-- ============================================================
-- O administrador inclui e remove membros pela tela "Membros" do app.
create table if not exists public.membros (
  email text primary key check (email = lower(trim(email)) and email like '%@%'),
  papel text not null default 'membro' check (papel in ('admin', 'membro')),
  incluido_em timestamptz not null default now()
);

-- Administrador do app.
insert into public.membros (email, papel)
values ('thialisonbr@gmail.com', 'admin')
on conflict (email) do update set papel = 'admin';

create or replace function public.email_atual()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.eh_membro()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.membros where email = public.email_atual());
$$;

create or replace function public.eh_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.membros where email = public.email_atual() and papel = 'admin');
$$;

-- Usada na tela de entrar: diz se o e-mail pode entrar e se já criou senha.
-- Responde 'sem_acesso', 'criar_senha' (primeiro acesso) ou 'entrar'.
drop function if exists public.email_liberado(text);
create or replace function public.situacao_email(p_email text)
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select case
    when not exists (select 1 from public.membros where email = lower(trim(p_email))) then 'sem_acesso'
    when exists (select 1 from auth.users where lower(email) = lower(trim(p_email))) then 'entrar'
    else 'criar_senha'
  end;
$$;

revoke all on function public.situacao_email(text) from public;
grant execute on function public.situacao_email(text) to anon, authenticated;

-- "Esqueci a senha": o administrador apaga a conta de login do membro
-- (as faxinas continuam). No próximo acesso a pessoa cria uma senha nova.
create or replace function public.redefinir_senha_membro(p_email text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.eh_admin() then
    raise exception 'Somente o administrador pode redefinir senhas';
  end if;
  if not exists (select 1 from public.membros where email = lower(trim(p_email)) and papel = 'membro') then
    raise exception 'Esse e-mail não é um membro';
  end if;
  delete from auth.users where lower(email) = lower(trim(p_email));
end;
$$;

revoke all on function public.redefinir_senha_membro(text) from public, anon;
grant execute on function public.redefinir_senha_membro(text) to authenticated;

-- ============================================================
-- Dados do app
-- ============================================================
create table if not exists public.locais (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (length(trim(nome)) > 0),
  tipo text not null check (tipo in ('apto', 'casa', 'loja')),
  valor_padrao numeric(10, 2) not null default 0 check (valor_padrao >= 0),
  arquivado boolean not null default false,
  created_at timestamptz not null default now()
);

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

-- ============================================================
-- Segurança (RLS): sem estar na tabela "membros", não se vê nada.
-- ============================================================
alter table public.membros enable row level security;
alter table public.locais enable row level security;
alter table public.faxinas enable row level security;

drop policy if exists "membro ve o proprio cadastro e admin ve todos" on public.membros;
create policy "membro ve o proprio cadastro e admin ve todos" on public.membros
  for select to authenticated using (email = public.email_atual() or public.eh_admin());

drop policy if exists "admin inclui membros" on public.membros;
create policy "admin inclui membros" on public.membros
  for insert to authenticated with check (public.eh_admin() and papel = 'membro');

drop policy if exists "admin remove membros" on public.membros;
create policy "admin remove membros" on public.membros
  for delete to authenticated using (public.eh_admin() and papel = 'membro');

drop policy if exists "membros usam locais" on public.locais;
create policy "membros usam locais" on public.locais
  for all to authenticated using (public.eh_membro()) with check (public.eh_membro());

drop policy if exists "membros usam faxinas" on public.faxinas;
create policy "membros usam faxinas" on public.faxinas
  for all to authenticated using (public.eh_membro()) with check (public.eh_membro());

-- ============================================================
-- Tempo real: o que um celular registra aparece no outro.
-- ============================================================
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
