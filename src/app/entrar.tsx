import { useState } from 'react';
import { View } from 'react-native';
import { Botao, Campo, Cartao, Rotulo, T, Tela } from '../components/ui';
import { useSessao } from '../data/sessao';
import { cor } from '../tema';

export default function Entrar() {
  const { logado, modo, entrar, definirNome, sair } = useSessao();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(acao: () => Promise<string | null>) {
    setEnviando(true);
    setErro(null);
    const e = await acao();
    setEnviando(false);
    if (e) setErro(e);
  }

  const passoNome = logado;

  return (
    <Tela
      rodape={
        <View style={{ gap: 10 }}>
          {erro ? (
            <T tam={15} cor={cor.perigo} style={{ textAlign: 'center' }}>
              {erro}
            </T>
          ) : null}
          {passoNome ? (
            <Botao
              rotulo="Começar"
              icone="check"
              carregando={enviando}
              onPress={() => (nome.trim() ? enviar(() => definirNome(nome)) : setErro('Digite como quer ser chamado(a).'))}
            />
          ) : (
            <Botao
              rotulo="Entrar"
              carregando={enviando}
              onPress={() => (email && senha ? enviar(() => entrar(email, senha)) : setErro('Preencha e-mail e senha.'))}
            />
          )}
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

      {passoNome ? (
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
              onSubmitEditing={() => nome.trim() && enviar(() => definirNome(nome))}
            />
            <T tam={15} cor={cor.suave}>
              Aparece na saudação e mostra quem registrou cada faxina.
            </T>
          </View>
          {modo === 'nuvem' ? (
            <Botao rotulo="Usar outra conta" variante="contorno" altura={52} onPress={() => sair()} />
          ) : null}
        </>
      ) : (
        <>
          <View style={{ gap: 8 }}>
            <Rotulo>E-mail</Rotulo>
            <Campo
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              inputMode="email"
              accessibilityLabel="E-mail"
            />
          </View>
          <View style={{ gap: 8 }}>
            <Rotulo>Senha</Rotulo>
            <Campo
              value={senha}
              onChangeText={setSenha}
              placeholder="Sua senha"
              secureTextEntry
              autoComplete="current-password"
              accessibilityLabel="Senha"
              onSubmitEditing={() => email && senha && enviar(() => entrar(email, senha))}
            />
          </View>
          <T tam={15} cor={cor.suave}>
            Você só precisa entrar uma vez neste celular.
          </T>
        </>
      )}
    </Tela>
  );
}
