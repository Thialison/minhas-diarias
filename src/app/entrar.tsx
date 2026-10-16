import { useState } from 'react';
import { View } from 'react-native';
import { Botao, Campo, Cartao, Link, Rotulo, T, Tela } from '../components/ui';
import { useSessao } from '../data/sessao';
import { cor } from '../tema';

export default function Entrar() {
  const { logado, temAcesso, modo, email: emailLogado, enviarCodigo, confirmarCodigo, definirNome, sair, verificarAcesso } =
    useSessao();
  const [email, setEmail] = useState('');
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function executar(acao: () => Promise<string | null>, depois?: () => void) {
    setEnviando(true);
    setErro(null);
    const e = await acao();
    setEnviando(false);
    if (e) setErro(e);
    else depois?.();
  }

  const pedirCodigo = () =>
    executar(
      () => enviarCodigo(email),
      () => {
        setCodigoEnviado(true);
        setCodigo('');
        setAviso(`Mandamos um código para ${email.trim().toLowerCase()}. Pode demorar um minutinho; veja também o spam.`);
      },
    );

  // Etapas: 1) e-mail → 2) código → (sem acesso) → 3) nome
  const etapa = !logado ? (codigoEnviado ? 'codigo' : 'email') : !temAcesso ? 'semAcesso' : 'nome';

  const botoes = {
    email: <Botao rotulo="Receber código" carregando={enviando} onPress={pedirCodigo} />,
    codigo: <Botao rotulo="Entrar" icone="check" carregando={enviando} onPress={() => executar(() => confirmarCodigo(email, codigo))} />,
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
        <>
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
              onSubmitEditing={pedirCodigo}
            />
          </View>
          <T tam={15} cor={cor.suave}>
            Vamos mandar um código de 6 números para o seu e-mail. Não precisa de senha.
          </T>
        </>
      ) : null}

      {etapa === 'codigo' ? (
        <>
          {aviso ? (
            <Cartao>
              <T tam={16}>{aviso}</T>
            </Cartao>
          ) : null}
          <View style={{ gap: 8 }}>
            <Rotulo>Código recebido</Rotulo>
            <Campo
              value={codigo}
              onChangeText={(t) => {
                setCodigo(t.replace(/\D/g, '').slice(0, 10));
                setErro(null);
              }}
              placeholder="000000"
              keyboardType="number-pad"
              inputMode="numeric"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              autoFocus
              accessibilityLabel="Código recebido por e-mail"
              style={{ fontSize: 26, letterSpacing: 6 }}
              onSubmitEditing={() => executar(() => confirmarCodigo(email, codigo))}
            />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 20 }}>
            <Link rotulo="Mandar outro código" onPress={pedirCodigo} />
            <Link
              rotulo="Trocar e-mail"
              onPress={() => {
                setCodigoEnviado(false);
                setErro(null);
              }}
            />
          </View>
        </>
      ) : null}

      {etapa === 'semAcesso' ? (
        <Cartao style={{ gap: 10 }}>
          <T negrito tam={18}>
            Ainda sem acesso
          </T>
          <T tam={16} cor={cor.suave}>
            O e-mail {emailLogado} ainda não foi liberado. Peça para o administrador incluir você em “Membros” e depois
            toque em “Verificar de novo”.
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
