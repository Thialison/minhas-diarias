# Diárias — controle de faxinas

App (PWA) para registrar as faxinas e acompanhar os ganhos por **dia, semana, quinzena (1–15 e 16–fim do mês) e mês**. Feito em React Native + TypeScript com Expo, roda no navegador do celular e pode ser instalado na tela inicial como um aplicativo. A mãe e o pai entram cada um no seu celular e veem os mesmos dados, atualizados na hora.

## O que o app faz

- **Início**: ganhos do mês, faxinas de hoje, da semana e de cada quinzena, botão grande "Registrar faxina" e as últimas faxinas.
- **Calendário**: mostra quantas faxinas houve em cada dia. Os botões Dia / Semana / 1 a 15 / 16 a 31 / Mês mostram o total do período. Tocando num dia aparecem as faxinas dele e dá para adicionar uma faxina naquele dia, mesmo esquecida.
- **Registrar faxina**: escolhe o dia (Hoje, Ontem ou Outro, pelo calendário), o local e o valor, que já vem preenchido com o valor do local. A observação é opcional.
- **Todas as faxinas** (pelo "Ver tudo"): lista do mês com filtro por tipo (Apto, Casa, Loja) e por local. Mostra o total do que está filtrado.
- **Locais**: cadastro de cada lugar com tipo e valor da diária. Um local com histórico não é apagado, e sim arquivado, para não perder as contas antigas.
- Tocar numa faxina abre a tela de edição, onde também dá para excluir.

Regras das contas:

| Período | Como é contado |
|---|---|
| Semana | de domingo a sábado |
| 1ª quinzena | dia 1 ao 15 |
| 2ª quinzena | dia 16 ao último dia do mês (28, 29, 30 ou 31) |

---

## 1. Experimentar agora (modo demonstração)

Sem configurar nada, o app funciona guardando os dados **só no aparelho** em que está aberto. Serve para testar.

Requisitos: [Node.js 20 ou mais novo](https://nodejs.org).

```bash
npm install
npm run web
```

Abra o endereço que aparecer no terminal (normalmente http://localhost:8081).

## 2. Login e dados compartilhados (Supabase, gratuito)

O login é feito **por código no e-mail**: a pessoa digita o e-mail, recebe um código de 6 números e entra. Não tem senha. Só entra quem estiver na lista de **Membros**:

- `thialisonbr@gmail.com` é o **administrador**. Ele já vem cadastrado pelo SQL.
- O administrador abre **Locais → Membros do app** e inclui o e-mail de quem pode usar (mãe, pai…). Pela mesma tela ele tira o acesso.
- Um e-mail fora da lista não recebe código. Mesmo que alguém tente acessar o banco direto, as regras do banco (RLS) não mostram nada para quem não é membro.

Passo a passo (uma vez só):

1. Crie uma conta em <https://supabase.com> e um **New project**. O plano grátis é suficiente.
2. Abra **SQL Editor**, cole todo o conteúdo de [`supabase/esquema.sql`](supabase/esquema.sql) e clique em **Run**.
3. **Faça o e-mail mandar o código.** Em **Authentication → Emails → Templates**, abra os modelos **Magic Link** e **Confirm signup** e troque o texto por algo como:

   ```html
   <h2>Seu código para entrar no Diárias</h2>
   <p style="font-size:28px;letter-spacing:6px"><b>{{ .Token }}</b></p>
   <p>Se não foi você que pediu, é só ignorar este e-mail.</p>
   ```

4. Em **Authentication → Sign In / Providers**, deixe **Email** ligado e **Allow new users to sign up** também ligado. Isso é necessário no primeiro acesso de cada membro, e a lista de Membros continua controlando quem entra.
5. Em **Project Settings → API**, copie a **Project URL** e a chave pública (**publishable** ou **anon**).

> O envio de e-mail padrão do Supabase tem limite de poucos e-mails por hora. Para uma família isso basta. Se os códigos pararem de chegar, configure um SMTP próprio em **Authentication → Emails → SMTP Settings** (Gmail com senha de app ou Resend, por exemplo).

Para rodar no seu computador com o Supabase, crie o `.env` a partir do exemplo e cole a URL e a chave:

```bash
cp .env.example .env
npm run web
```

## 3. Publicar no GitHub Pages

O repositório já tem o workflow [`.github/workflows/publicar.yml`](.github/workflows/publicar.yml). A cada `push` na branch `main` ele testa, gera o site e publica.

1. No GitHub, em **Settings → Pages → Build and deployment → Source**, escolha **GitHub Actions**.
2. Em **Settings → Secrets and variables → Actions → Variables**, crie duas variáveis com os valores do passo 5 acima:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_KEY`
3. Em **Actions → Publicar no GitHub Pages → Run workflow** (ou faça um push).

O app fica em **https://thialison.github.io/minhas-diarias/**. Sem as variáveis, o site sobe em modo demonstração, com os dados só no aparelho.

> Se o repositório tiver outro nome, troque `"baseUrl": "/minhas-diarias"` no `app.json` pelo novo nome.

## 4. Instalar no celular

- **Android (Chrome):** abra o link → menu ⋮ → **Instalar app** (ou **Adicionar à tela inicial**).
- **iPhone (Safari):** abra o link → botão **Compartilhar** → **Adicionar à Tela de Início**.

Depois é só abrir pelo ícone. Cada pessoa entra uma vez com o próprio e-mail e o código.

---

## Para quem for mexer no código

```bash
npm run web          # desenvolvimento no navegador
npm run typecheck    # checagem de tipos (TypeScript)
npm test             # testes das contas de datas e dinheiro
npm run build:web    # build de produção em dist/
```

Também roda como app nativo com o Expo (`npx expo start` e o Expo Go), mas o foco é a versão web/PWA.

```
src/
  app/                 telas (Expo Router)
    (abas)/            Início, Calendário e Locais (barra de baixo)
    faxina.tsx         registrar / editar faxina
    faxinas.tsx        todas as faxinas com filtro
    local.tsx          novo / editar local
    entrar.tsx         login por código e nome
    membros.tsx        quem tem acesso (só o administrador)
  components/          botões, campos, calendário, cartões, ícones
  data/                Supabase, modo demonstração, sessão e dados
  lib/                 datas, dinheiro e diálogos (com testes)
  tema.ts              cores e fontes
supabase/              SQL do banco
public/                manifest, ícones e service worker do PWA
scripts/pos-build.mjs  ajustes para o GitHub Pages (caminho /minhas-diarias, 404.html)
.github/workflows/     publicação automática no GitHub Pages
```

Cores principais: azul `#2B6CD4`, amarelo `#F2B33D` e fundo `#F4F8FE`. As fontes são Atkinson Hyperlegible, feita para leitura fácil, e Bricolage Grotesque nos títulos.
