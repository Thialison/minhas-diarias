-- Libera o acesso para as contas da família.
-- 1) Antes, crie as contas em "Authentication" → "Users" → "Add user" → "Create new user".
-- 2) Troque os e-mails abaixo pelos que você usou e rode no "SQL Editor".
-- Para incluir mais alguém depois, é só rodar de novo com o novo e-mail.

insert into public.familia (user_id)
select id
from auth.users
where email in ('mae@exemplo.com', 'pai@exemplo.com')
on conflict do nothing;

-- Confira quem tem acesso:
select u.email
from public.familia f
join auth.users u on u.id = f.user_id;
