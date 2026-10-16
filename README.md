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

## 2. Ligar a sincronização entre os celulares (Supabase, gratuito)

1. Crie uma conta em <https://supabase.com> e um **New project** (o plano grátis é suficiente).
2. No projeto, abra **SQL Editor**, cole todo o conteúdo de [`supabase/esquema.sql`](supabase/esquema.sql) e clique em **Run**.
3. Em **Authentication → Users → Add user → Create new user**, crie uma conta para a mãe e outra para o pai (e-mail e senha). Marque **Auto Confirm User**.
4. Abra [`supabase/familia.sql`](supabase/familia.sql), troque os dois e-mails pelos que você usou, cole no **SQL Editor** e rode. Só essas contas conseguem ver os dados.
5. Recomendado: em **Authentication → Sign In / Providers**, desligue **Allow new users to sign up**, para ninguém criar conta sozinho.
6. Em **Project Settings → API**, copie a **Project URL** e a chave pública (**publishable** ou **anon**). Crie o arquivo `.env` a partir do exemplo:

   ```bash
   cp .env.example .env
   # edite o .env e cole a URL e a chave
   ```

7. Rode `npm run web` de novo. Agora aparece a tela de **Entrar**. No primeiro acesso, o app pergunta como a pessoa quer ser chamada. Esse nome aparece na saudação e em "por Maria" em cada faxina registrada.

> A chave pública pode ficar no app. Quem protege os dados são as regras do banco (RLS), que só liberam as contas da tabela `familia`.

## 3. Colocar no ar (para abrir no celular)

O app precisa estar num endereço na internet (https) para ser instalado no celular.

**Jeito mais simples (Netlify Drop, sem GitHub):**

```bash
npm run build:web     # gera a pasta dist/ já com os dados do .env
```

Abra <https://app.netlify.com/drop> e arraste a pasta `dist`. O Netlify gera um link. O arquivo `public/_redirects` já faz as páginas internas funcionarem. Sempre que mudar algo, gere o `dist` de novo e arraste outra vez.

**Com GitHub + Vercel (atualiza sozinho a cada mudança):** suba o projeto para o GitHub, importe em <https://vercel.com/new> e, em **Environment Variables**, cadastre `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_KEY`. O `vercel.json` já tem o comando de build.

## 4. Instalar no celular

- **Android (Chrome):** abra o link → menu ⋮ → **Instalar app** (ou **Adicionar à tela inicial**).
- **iPhone (Safari):** abra o link → botão **Compartilhar** → **Adicionar à Tela de Início**.

Depois é só abrir pelo ícone, como qualquer aplicativo. Cada um entra uma vez com seu e-mail e senha.

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
    entrar.tsx         login e nome
  components/          botões, campos, calendário, cartões, ícones
  data/                Supabase, modo demonstração, sessão e dados
  lib/                 datas, dinheiro e diálogos (com testes)
  tema.ts              cores e fontes
supabase/              SQL do banco
public/                manifest, ícones e service worker do PWA
```

Cores principais: azul `#2B6CD4`, amarelo `#F2B33D` e fundo `#F4F8FE`. As fontes são Atkinson Hyperlegible, feita para leitura fácil, e Bricolage Grotesque nos títulos.
