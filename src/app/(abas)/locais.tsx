import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { CartaoLocal } from '../../components/faxina';
import { Botao, Cartao, Link, T, Tela, Vazio } from '../../components/ui';
import { useDados } from '../../data/dados';
import { useSessao } from '../../data/sessao';
import { confirmar } from '../../lib/dialogos';
import { cor } from '../../tema';

export default function Locais() {
  const router = useRouter();
  const { locais, locaisAtivos } = useDados();
  const { nome, email, modo, sair } = useSessao();
  const [verArquivados, setVerArquivados] = useState(false);
  const arquivados = locais.filter((l) => l.arquivado);

  const abrir = (id: string) => router.push({ pathname: '/local', params: { id } });

  return (
    <Tela comAbas>
      <View style={{ gap: 4 }}>
        <T titulo tam={28}>
          Locais
        </T>
        <T tam={16} cor={cor.suave}>
          Onde a faxina acontece e quanto costuma pagar.
        </T>
      </View>

      <Botao rotulo="Adicionar local" icone="mais" variante="destaque" onPress={() => router.push('/local')} />

      <View style={{ gap: 8 }}>
        {locaisAtivos.length === 0 ? <Vazio texto="Nenhum local cadastrado ainda." /> : null}
        {locaisAtivos.map((l) => (
          <CartaoLocal key={l.id} local={l} onPress={() => abrir(l.id)} />
        ))}
      </View>

      {arquivados.length > 0 ? (
        <View style={{ gap: 8 }}>
          <Link
            rotulo={verArquivados ? 'Esconder arquivados' : `Ver arquivados (${arquivados.length})`}
            onPress={() => setVerArquivados((v) => !v)}
          />
          {verArquivados ? arquivados.map((l) => <CartaoLocal key={l.id} local={l} onPress={() => abrir(l.id)} />) : null}
        </View>
      ) : null}

      <Cartao style={{ gap: 8, marginTop: 12 }}>
        {modo === 'demo' ? (
          <T tam={15} cor={cor.suave}>
            Modo demonstração: os dados ficam guardados só neste aparelho. Veja no README do projeto como ligar o Supabase para
            sincronizar os celulares.
          </T>
        ) : (
          <T tam={15} cor={cor.suave}>
            Conectado como {nome}
            {email ? ` (${email})` : ''}.
          </T>
        )}
        <Link
          rotulo={modo === 'demo' ? 'Trocar nome' : 'Sair desta conta'}
          icone="sair"
          onPress={async () => {
            const ok = await confirmar(
              modo === 'demo' ? 'Trocar nome' : 'Sair',
              modo === 'demo' ? 'Quer trocar o nome usado nos registros?' : 'Quer sair desta conta neste celular?',
              modo === 'demo' ? 'Trocar' : 'Sair',
            );
            if (ok) await sair();
          }}
        />
      </Cartao>
    </Tela>
  );
}
