import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icone } from '../components/Icone';
import { Botao, Cabecalho, Campo, Cartao, FaixaErro, Link, Rotulo, T, Tela, Vazio } from '../components/ui';
import { incluirMembro, listarMembros, redefinirSenha, removerMembro, type Membro } from '../data/membros';
import { useSessao } from '../data/sessao';
import { avisar, confirmar } from '../lib/dialogos';
import { cor } from '../tema';

export default function Membros() {
  const { admin, email: meuEmail } = useSessao();
  const [membros, setMembros] = useState<Membro[] | null>(null);
  const [erroLista, setErroLista] = useState<string | null>(null);
  const [novo, setNovo] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setMembros(await listarMembros());
      setErroLista(null);
    } catch {
      setErroLista('Não foi possível carregar os membros.');
    }
  }, []);

  useEffect(() => {
    if (admin) carregar();
  }, [admin, carregar]);

  async function incluir() {
    setSalvando(true);
    setErro(null);
    setOk(null);
    const e = await incluirMembro(novo);
    setSalvando(false);
    if (e) return setErro(e);
    setOk(`Pronto! ${novo.trim().toLowerCase()} já pode abrir o app, digitar o e-mail e criar uma senha.`);
    setNovo('');
    carregar();
  }

  async function redefinir(m: Membro) {
    const ok = await confirmar(
      'Redefinir senha',
      `A senha de ${m.email} será apagada. No próximo acesso, a pessoa digita o e-mail e cria uma senha nova.`,
      'Redefinir',
    );
    if (!ok) return;
    const e = await redefinirSenha(m.email);
    avisar(e ? 'Ops' : 'Senha redefinida', e ?? `Avise ${m.email} para entrar de novo e criar uma senha nova.`);
  }

  async function remover(m: Membro) {
    if (!(await confirmar('Tirar acesso', `${m.email} não vai mais conseguir ver nem registrar faxinas.`, 'Tirar acesso'))) return;
    try {
      await removerMembro(m.email);
      carregar();
    } catch {
      setErro('Não foi possível tirar o acesso. Tente de novo.');
    }
  }

  if (!admin) {
    return (
      <Tela>
        <Cabecalho titulo="Membros" voltar />
        <Vazio texto="Só o administrador pode ver esta tela." />
      </Tela>
    );
  }

  return (
    <Tela>
      <Cabecalho titulo="Membros" voltar />
      <T tam={16} cor={cor.suave}>
        Quem está nesta lista pode entrar no app com o próprio e-mail e ver os mesmos dados. No primeiro acesso, a
        pessoa cria a própria senha.
      </T>

      <Cartao style={{ gap: 10 }}>
        <Rotulo>Incluir pessoa</Rotulo>
        <Campo
          value={novo}
          onChangeText={(t) => {
            setNovo(t);
            setErro(null);
            setOk(null);
          }}
          placeholder="email@exemplo.com"
          autoCapitalize="none"
          keyboardType="email-address"
          inputMode="email"
          accessibilityLabel="E-mail da pessoa"
          onSubmitEditing={incluir}
        />
        {erro ? (
          <T tam={15} cor={cor.perigo}>
            {erro}
          </T>
        ) : null}
        {ok ? (
          <T tam={15} cor={cor.primaria}>
            {ok}
          </T>
        ) : null}
        <Botao rotulo="Dar acesso" icone="mais" variante="destaque" altura={56} carregando={salvando} onPress={incluir} />
      </Cartao>

      {erroLista ? <FaixaErro texto={erroLista} onTentar={carregar} /> : null}

      <View style={{ gap: 8 }}>
        <T negrito tam={18}>
          Com acesso
        </T>
        {membros?.map((m) => (
          <View key={m.email} style={est.linha}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <T negrito tam={17} linhas={1}>
                {m.email}
              </T>
              <T tam={14} cor={cor.suave}>
                {m.papel === 'admin' ? 'Administrador' : 'Membro'}
                {m.email === meuEmail ? ' · você' : ''}
              </T>
              {m.papel === 'membro' ? <Link rotulo="Redefinir senha" onPress={() => redefinir(m)} /> : null}
            </View>
            {m.papel === 'membro' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Tirar acesso de ${m.email}`}
                onPress={() => remover(m)}
                hitSlop={6}
                style={est.remover}
              >
                <Icone nome="lixeira" cor={cor.perigo} tamanho={20} />
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>
    </Tela>
  );
}

const est = StyleSheet.create({
  linha: {
    backgroundColor: cor.superficie,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: cor.borda,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
  },
  remover: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
