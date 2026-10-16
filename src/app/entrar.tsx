import { useState, type ReactElement } from 'react';
import { View } from 'react-native';
import { Botao, Campo, Cartao, Link, Rotulo, T, Tela } from '../components/ui';
import { useSessao } from '../data/sessao';
import { cor } from '../tema';

type Passo = 'email' | 'entrar' | 'criar_senha';

export default function Entrar() {
  const { logado, temAcesso, modo, email: emailLogado, verificarEmail, entrar, criarSenha, definirNome, sair, verificarAcesso } =
    useSessao();
  const [passo, setPasso] = useState<Passo>('email');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [senha2, setSenha2] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [esqueci, setEsqueci] = useState(false);
  const [nome, setNome] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function executar(acao: () => Promise<string | null>) {
    setEnviando(true);
    setErro(null);
    const e = await acao();
    setEnviando(false);
    if (e) setErro(e);
  }

  async function continuar() {
    setEnviando(true);
    setErro(null);
    const r = await verificarEmail(email);
    setEnviando(false);
    if (r.erro) return setErro(r.erro);
    setSenha('');
    setSenha2('');
    setPasso(r.situacao ?? 'entrar');
  }

  function salvarSenhaNova() {
    if (senha.length < 6) return setErro('A senha precisa ter pelo menos 6 caracteres.');
    if (senha !== senha2) return setErro('As duas senhas estão diferentes.');
    executar(() => criarSenha(email, senha));
  }

  const etapa = !logado ? passo : !temAcesso ? 'semAcesso' : 'nome';
  const voltar = () => {
    setPasso('email');
    setErro(null);
    setEsqueci(false);
  };

  const botoes: Record<typeof etapa, ReactElement> = {
    email: <Botao rotulo="Continuar" carregando={enviando} onPress={continuar} />,
    entrar: <Botao rotulo="Entrar" icone="check" carregando={enviando} onPress={() => executar(() => entrar(email, senha))} />,
    criar_senha: <Botao rotulo="Criar senha e entrar" icone="check" carregando={enviando} onPress={salvarSenhaNova} />,
    semAcesso: <Botao rotulo="Sair" variante="contorno" onPress={() => sair()} />,
    nome: (
      <Botao
        rotulo="Começar"
        icone="check"
        carregando={enviando}
        onPress={() => (nome.trim() ? executar(() => definirNome(nome)) : setErro('Digite como quer ser chamado(a).'))}
      />
    ),
  };

  const campoSenha = (valor: string, mudar: (t: string) => void, rotulo: string, aoEnviar: () => void, nova: boolean) => (
    <Campo
      value={valor}
      onChangeText={(t) => {
        mudar(t);
        setErro(null);
      }}
      placeholder={nova ? 'Mínimo 6 caracteres' : 'Sua senha'}
      secureTextEntry={!verSenha}
      autoCapitalize="none"
      autoComplete={nova ? 'new-password' : 'current-password'}
      textContentType={nova ? 'newPassword' : 'password'}
      accessibilityLabel={rotulo}
      onSubmitEditing={aoEnviar}
    />
  );

  return (
    <Tela
      rodape={
        <View style={{ gap: 10 }}>
          {erro ? (
            <T tam={15} cor={cor.perigo} style={{ textAlign: 'center' }}>
              {erro}
            </T>
          ) : null}
          {botoes[etapa]}
        </View>
      }
    >
      <View style={{ gap: 6, marginTop: 24 }}>
        <T titulo tam={36} cor={cor.primaria}>
          Diárias
        </T>
        <T tam={18} cor={cor.suave}>
          Controle das faxinas e dos ganhos, no seu celular.
        </T>
      </View>

      {etapa === 'email' ? (
        <View style={{ gap: 8 }}>
          <Rotulo>Seu e-mail</Rotulo>
          <Campo
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setErro(null);
            }}
            placeholder="seu@email.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            inputMode="email"
            accessibilityLabel="E-mail"
            onSubmitEditing={continuar}
          />
        </View>
      ) : null}

      {etapa === 'entrar' || etapa === 'criar_senha' ? (
        <>
          <Cartao style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
            <T tam={16} style={{ flex: 1 }} linhas={1}>
              {email.trim().toLowerCase()}
            </T>
            <Link rotulo="Trocar" onPress={voltar} />
          </Cartao>

          {etapa === 'criar_senha' ? (
            <T tam={16} cor={cor.suave}>
              Primeiro acesso! Crie uma senha para entrar. O celular pode guardar a senha para você.
            </T>
          ) : null}

          <View style={{ gap: 8 }}>
            <Rotulo>{etapa === 'criar_senha' ? 'Crie sua senha' : 'Senha'}</Rotulo>
            {campoSenha(
              senha,
              setSenha,
              etapa === 'criar_senha' ? 'Nova senha' : 'Senha',
              etapa === 'criar_senha' ? () => undefined : () => executar(() => entrar(email, senha)),
              etapa === 'criar_senha',
            )}
          </View>
          {etapa === 'criar_senha' ? (
            <View style={{ gap: 8 }}>
              <Rotulo>Repita a senha</Rotulo>
              {campoSenha(senha2, setSenha2, 'Repita a senha', salvarSenhaNova, true)}
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 20 }}>
            <Link rotulo={verSenha ? 'Esconder senha' : 'Mostrar senha'} onPress={() => setVerSenha((v) => !v)} />
            {etapa === 'entrar' ? <Link rotulo="Esqueci a senha" onPress={() => setEsqueci(true)} /> : null}
          </View>
          {esqueci ? (
            <Cartao>
              <T tam={16}>
                Peça para o administrador abrir “Membros” no app e tocar em “Redefinir senha” no seu e-mail. Depois é só
                entrar de novo e criar uma senha nova.
              </T>
            </Cartao>
          ) : null}
        </>
      ) : null}

      {etapa === 'semAcesso' ? (
        <Cartao style={{ gap: 10 }}>
          <T negrito tam={18}>
            Ainda sem acesso
          </T>
          <T tam={16} cor={cor.suave}>
            O e-mail {emailLogado} não está liberado. Peça para o administrador incluir você em “Membros” e depois toque em
            “Verificar de novo”.
          </T>
          <Link rotulo="Verificar de novo" onPress={verificarAcesso} />
        </Cartao>
      ) : null}

      {etapa === 'nome' ? (
        <>
          {modo === 'demo' ? (
            <Cartao>
              <T tam={15} cor={cor.suave}>
                Modo demonstração: os dados ficam só neste aparelho até o Supabase ser configurado.
              </T>
            </Cartao>
          ) : null}
          <View style={{ gap: 8 }}>
            <Rotulo>Como quer ser chamado(a)?</Rotulo>
            <Campo
              value={nome}
              onChangeText={setNome}
              placeholder="Ex.: Maria"
              autoCapitalize="words"
              autoFocus
              accessibilityLabel="Seu nome"
              onSubmitEditing={() => nome.trim() && executar(() => definirNome(nome))}
            />
            <T tam={15} cor={cor.suave}>
              Aparece na saudação e mostra quem registrou cada faxina.
            </T>
          </View>
        </>
      ) : null}
    </Tela>
  );
}
