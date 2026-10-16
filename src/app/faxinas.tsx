import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CartaoFaxina } from '../components/faxina';
import { Icone } from '../components/Icone';
import { Botao, BotaoIcone, Opcao, Radio, T, Vazio, est as ui } from '../components/ui';
import { useDados } from '../data/dados';
import { TIPOS, type Faxina, type TipoLocal } from '../data/tipos';
import { anoMes, hoje, mudarMes, nomeMes, rotuloGrupo, ymd, type Ymd } from '../lib/datas';
import { brl, somar } from '../lib/dinheiro';
import { cor } from '../tema';

type FiltroTipo = 'todos' | TipoLocal;

export default function TodasFaxinas() {
  const router = useRouter();
  const ins = useSafeAreaInsets();
  const { faxinas, locais, localPorId } = useDados();
  const h = hoje();
  const [mes, setMes] = useState(anoMes(h));
  const [tipo, setTipo] = useState<FiltroTipo>('todos');
  const [localId, setLocalId] = useState<string>('todos');
  const [aberto, setAberto] = useState(false);

  const prefixo = ymd(mes.ano, mes.mes, 1).slice(0, 7);
  const lista = faxinas.filter((f) => {
    if (!f.data.startsWith(prefixo)) return false;
    const l = localPorId.get(f.local_id);
    if (tipo !== 'todos' && l?.tipo !== tipo) return false;
    if (localId !== 'todos' && f.local_id !== localId) return false;
    return true;
  });

  const grupos = useMemo(() => {
    const m = new Map<Ymd, Faxina[]>();
    for (const f of lista) m.set(f.data, [...(m.get(f.data) ?? []), f]);
    return [...m.entries()];
  }, [lista]);

  // Na gaveta: locais do tipo escolhido que estão ativos ou têm faxinas.
  const comFaxina = new Set(faxinas.map((f) => f.local_id));
  const opcoesLocal = locais.filter((l) => (!l.arquivado || comFaxina.has(l.id)) && (tipo === 'todos' || l.tipo === tipo));

  const tags: { rotulo: string; tirar: () => void }[] = [];
  if (tipo !== 'todos') tags.push({ rotulo: TIPOS.find((t) => t.id === tipo)!.nome, tirar: () => setTipo('todos') });
  if (localId !== 'todos')
    tags.push({ rotulo: localPorId.get(localId)?.nome ?? 'Local', tirar: () => setLocalId('todos') });

  const qtd = (n: number) => `${n} ${n === 1 ? 'faxina' : 'faxinas'}`;

  return (
    <View style={{ flex: 1, backgroundColor: cor.fundo }}>
      <View style={[ui.coluna, { paddingTop: ins.top }]}>
        <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 12 }}>
          <View style={ui.cabecalho}>
            <BotaoIcone icone="voltar" rotulo="Voltar" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
            <T titulo tam={26} style={{ flex: 1 }}>
              Todas as faxinas
            </T>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={est.mes}>
              <Pressable accessibilityRole="button" accessibilityLabel="Mês anterior" onPress={() => setMes(mudarMes(mes.ano, mes.mes, -1))} style={est.seta}>
                <Icone nome="voltar" cor={cor.texto} tamanho={20} espessura={2.2} />
              </Pressable>
              <T negrito tam={16} linhas={1} style={{ flexShrink: 1, textAlign: 'center' }}>
                {mes.ano === anoMes(h).ano ? nomeMes(mes.ano, mes.mes).replace(` ${mes.ano}`, '') : nomeMes(mes.ano, mes.mes)}
              </T>
              <Pressable accessibilityRole="button" accessibilityLabel="Próximo mês" onPress={() => setMes(mudarMes(mes.ano, mes.mes, 1))} style={est.seta}>
                <Icone nome="avancar" cor={cor.texto} tamanho={20} espessura={2.2} />
              </Pressable>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Filtrar${tags.length ? `, ${tags.length} filtros ativos` : ''}`}
              onPress={() => setAberto(true)}
              style={[est.filtrar, tags.length > 0 && est.filtrarOn]}
            >
              <Icone nome="filtro" cor={tags.length ? cor.branco : cor.texto} tamanho={20} espessura={2} />
              <T negrito tam={16} cor={tags.length ? cor.branco : cor.texto}>
                Filtrar
              </T>
              {tags.length ? (
                <View style={est.badge}>
                  <T negrito tam={13}>
                    {tags.length}
                  </T>
                </View>
              ) : null}
            </Pressable>
          </View>

          {tags.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {tags.map((t) => (
                <Pressable key={t.rotulo} accessibilityRole="button" accessibilityLabel={`Remover filtro ${t.rotulo}`} onPress={t.tirar} style={est.tag}>
                  <T negrito tam={15} cor={cor.primaria} linhas={1}>
                    {t.rotulo}
                  </T>
                  <Icone nome="fechar" cor={cor.primaria} tamanho={16} espessura={2.6} />
                </Pressable>
              ))}
            </View>
          ) : null}

          <View style={est.resumo}>
            <T negrito tam={17} cor={cor.branco}>
              {qtd(lista.length)}
            </T>
            <T titulo tam={22} cor={cor.branco}>
              {brl(somar(lista))}
            </T>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingTop: 14, paddingBottom: 24 + ins.bottom, gap: 14 }}>
          {grupos.length === 0 ? (
            <Vazio texto={tags.length ? 'Nenhuma faxina com esses filtros.' : 'Nenhuma faxina neste mês.'} />
          ) : null}
          {grupos.map(([dia, fs]) => (
            <View key={dia} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <T negrito tam={15} cor={cor.suave}>
                  {rotuloGrupo(dia, h)}
                </T>
                <T negrito tam={15} cor={cor.suave}>
                  {brl(somar(fs))}
                </T>
              </View>
              {fs.map((f) => (
                <CartaoFaxina
                  key={f.id}
                  faxina={f}
                  local={localPorId.get(f.local_id)}
                  comIcone={false}
                  onPress={() => router.push({ pathname: '/faxina', params: { id: f.id } })}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      </View>

      <Modal visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}>
        <View style={est.fundoGaveta}>
          <Pressable style={{ flex: 1 }} accessibilityLabel="Fechar filtros" onPress={() => setAberto(false)} />
          <View style={[est.gaveta, { paddingBottom: 20 + ins.bottom }]}>
            <View style={est.alca} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <T titulo tam={22}>
                Filtrar faxinas
              </T>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setTipo('todos');
                  setLocalId('todos');
                }}
                style={{ minHeight: 44, justifyContent: 'center' }}
              >
                <T negrito tam={16} cor={cor.primaria}>
                  Limpar
                </T>
              </Pressable>
            </View>

            <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 16 }}>
              <View style={{ gap: 8 }}>
                <T negrito tam={16}>
                  Tipo de lugar
                </T>
                <View style={{ flexDirection: 'row', gap: 8 }} accessibilityRole="radiogroup">
                  {([{ id: 'todos', nome: 'Todos' }, ...TIPOS] as { id: FiltroTipo; nome: string }[]).map((t) => {
                    const on = t.id === tipo;
                    return (
                      <Opcao
                        key={t.id}
                        rotulo={t.nome}
                        marcado={on}
                        style={{ flex: 1, height: 72 }}
                        onPress={() => {
                          setTipo(t.id);
                          if (t.id !== 'todos' && localId !== 'todos' && localPorId.get(localId)?.tipo !== t.id) setLocalId('todos');
                        }}
                      >
                        <Icone nome={t.id === 'todos' ? 'grade' : t.id} cor={on ? cor.primaria : cor.texto} tamanho={22} />
                      </Opcao>
                    );
                  })}
                </View>
              </View>

              <View style={{ gap: 2 }}>
                <T negrito tam={16}>
                  Local
                </T>
                {[{ id: 'todos', nome: 'Todos os locais', arquivado: false }, ...opcoesLocal].map((l) => {
                  const on = l.id === localId;
                  return (
                    <Pressable
                      key={l.id}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: on }}
                      onPress={() => setLocalId(l.id)}
                      style={est.itemLocal}
                    >
                      <Radio marcado={on} />
                      <T tam={17} style={{ flex: 1 }} linhas={1}>
                        {l.nome}
                        {l.arquivado ? ' (arquivado)' : ''}
                      </T>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <Botao rotulo={`Ver ${qtd(lista.length)}`} altura={60} onPress={() => setAberto(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const est = StyleSheet.create({
  mes: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: cor.borda,
    backgroundColor: cor.superficie,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  seta: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  filtrar: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: cor.borda,
    backgroundColor: cor.superficie,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  filtrarOn: { backgroundColor: cor.texto, borderColor: cor.texto },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: cor.destaque,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tag: {
    height: 36,
    maxWidth: '100%',
    borderRadius: 999,
    backgroundColor: cor.primariaSuave,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 14,
    paddingRight: 10,
  },
  resumo: {
    backgroundColor: cor.primaria,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fundoGaveta: { flex: 1, backgroundColor: cor.sombra, justifyContent: 'flex-end' },
  gaveta: {
    backgroundColor: cor.superficie,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 16,
    maxHeight: '88%',
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  alca: { width: 44, height: 5, borderRadius: 3, backgroundColor: cor.alca, alignSelf: 'center' },
  itemLocal: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: cor.divisoria,
  },
});
