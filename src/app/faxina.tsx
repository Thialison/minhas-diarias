import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { GradeMes, SeletorMes } from '../components/calendario';
import { IconeTipo } from '../components/faxina';
import { Icone } from '../components/Icone';
import { Botao, Cabecalho, Campo, Cartao, Link, Opcao, Radio, Rotulo, T, Tela } from '../components/ui';
import { useDados } from '../data/dados';
import { nomeTipo } from '../data/tipos';
import { addDias, anoMes, hoje, mudarMes, tituloDia, type Ymd } from '../lib/datas';
import { confirmar } from '../lib/dialogos';
import { brl, lerValor, valorParaTexto } from '../lib/dinheiro';
import { cor, fonte } from '../tema';

export default function TelaFaxina() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; data?: string }>();
  const { faxinas, locaisAtivos, localPorId, salvarFaxina, excluirFaxina } = useDados();
  const existente = params.id ? faxinas.find((f) => f.id === params.id) : undefined;
  const editando = Boolean(params.id);
  const h = hoje();

  const [data, setData] = useState<Ymd>(existente?.data ?? (params.data && /^\d{4}-\d{2}-\d{2}$/.test(params.data) ? params.data : h));
  const [verCalendario, setVerCalendario] = useState(false);
  const [mesCal, setMesCal] = useState(anoMes(data));
  const [localId, setLocalId] = useState<string | null>(existente?.local_id ?? null);
  const [valor, setValor] = useState(existente ? valorParaTexto(existente.valor) : '');
  const [obs, setObs] = useState(existente?.observacao ?? '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Ao abrir pelo link de edição antes de os dados chegarem, preenche quando chegarem.
  useEffect(() => {
    if (existente && localId === null) {
      setData(existente.data);
      setLocalId(existente.local_id);
      setValor(valorParaTexto(existente.valor));
      setObs(existente.observacao ?? '');
    }
  }, [existente]); // eslint-disable-line react-hooks/exhaustive-deps

  // Com um único local, já deixa escolhido.
  useEffect(() => {
    if (!editando && localId === null && locaisAtivos.length === 1) escolherLocal(locaisAtivos[0].id);
  }, [locaisAtivos]); // eslint-disable-line react-hooks/exhaustive-deps

  // No calendário de escolher o dia, mostra quantas faxinas cada dia já tem.
  const contagem = useMemo(() => {
    const m = new Map<Ymd, number>();
    for (const f of faxinas) m.set(f.data, (m.get(f.data) ?? 0) + 1);
    return m;
  }, [faxinas]);

  const opcoesLocal = useMemo(() => {
    const lista = [...locaisAtivos];
    const atual = localId ? localPorId.get(localId) : undefined;
    if (atual?.arquivado) lista.push(atual);
    return lista;
  }, [locaisAtivos, localPorId, localId]);

  function escolherLocal(id: string) {
    setLocalId(id);
    const l = localPorId.get(id) ?? locaisAtivos.find((x) => x.id === id);
    if (l) setValor(valorParaTexto(l.valor_padrao));
    setErro(null);
  }

  const ontem = addDias(h, -1);
  const atalho = data === h ? 'hoje' : data === ontem ? 'ontem' : 'outro';

  async function salvar() {
    const v = lerValor(valor);
    if (!localId) return setErro('Escolha onde foi a faxina.');
    if (v === null) return setErro('Digite quanto recebeu, por exemplo 180 ou 180,50.');
    setSalvando(true);
    try {
      await salvarFaxina({ id: params.id, local_id: localId, data, valor: v, observacao: obs.trim() || null });
      router.back();
    } catch (e) {
      console.warn(e);
      setErro('Não foi possível salvar. Verifique a internet e tente de novo.');
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!params.id) return;
    const local = localId ? localPorId.get(localId)?.nome : '';
    const ok = await confirmar('Excluir faxina', `Excluir a faxina de ${tituloDia(data).toLowerCase()}${local ? ` em ${local}` : ''}?`, 'Excluir');
    if (!ok) return;
    setSalvando(true);
    try {
      await excluirFaxina(params.id);
      router.back();
    } catch {
      setErro('Não foi possível excluir. Tente de novo.');
      setSalvando(false);
    }
  }

  if (editando && !existente && faxinas.length > 0) {
    return (
      <Tela>
        <Cabecalho titulo="Faxina" voltar />
        <T tam={17} cor={cor.suave}>
          Essa faxina não existe mais (talvez tenha sido excluída no outro celular).
        </T>
      </Tela>
    );
  }

  return (
    <Tela
      rodape={
        <View style={{ gap: 10 }}>
          {erro ? (
            <T tam={15} cor={cor.perigo} style={{ textAlign: 'center' }}>
              {erro}
            </T>
          ) : null}
          <Botao rotulo={editando ? 'Salvar alterações' : 'Salvar faxina'} icone="check" carregando={salvando} onPress={salvar} />
        </View>
      }
    >
      <Cabecalho titulo={editando ? 'Editar faxina' : 'Nova faxina'} voltar />

      <View style={{ gap: 8 }}>
        <Rotulo>Qual dia?</Rotulo>
        <View style={est.linha3} accessibilityRole="radiogroup">
          <Opcao rotulo="Hoje" marcado={atalho === 'hoje' && !verCalendario} onPress={() => (setData(h), setVerCalendario(false))} style={{ flex: 1 }} />
          <Opcao rotulo="Ontem" marcado={atalho === 'ontem' && !verCalendario} onPress={() => (setData(ontem), setVerCalendario(false))} style={{ flex: 1 }} />
          <Opcao
            rotulo="Outro"
            marcado={atalho === 'outro' || verCalendario}
            onPress={() => {
              setMesCal(anoMes(data));
              setVerCalendario(true);
            }}
            style={{ flex: 1, flexDirection: 'row', gap: 6 }}
          >
            <Icone nome="calendarioSimples" cor={atalho === 'outro' || verCalendario ? cor.primaria : cor.texto} tamanho={18} />
          </Opcao>
        </View>
        <T tam={16} cor={cor.suave}>
          {tituloDia(data)} de {data.slice(0, 4)}
          {data > h ? ' · data no futuro' : ''}
        </T>
        {verCalendario ? (
          <Cartao style={{ gap: 12, padding: 12 }}>
            <SeletorMes ano={mesCal.ano} mes={mesCal.mes} onMudar={(d) => setMesCal(mudarMes(mesCal.ano, mesCal.mes, d))} />
            <GradeMes
              ano={mesCal.ano}
              mes={mesCal.mes}
              hoje={h}
              selecionado={data}
              contagem={contagem}
              onSelecionar={(d) => {
                setData(d);
                setVerCalendario(false);
              }}
            />
          </Cartao>
        ) : null}
      </View>

      <View style={{ gap: 8 }}>
        <View style={est.titulo}>
          <Rotulo>Onde foi?</Rotulo>
          <Link rotulo="Novo local" icone="mais" onPress={() => router.push('/local')} />
        </View>
        {opcoesLocal.length === 0 ? (
          <Cartao>
            <T tam={16} cor={cor.suave}>
              Nenhum local cadastrado. Toque em “Novo local” para cadastrar o primeiro.
            </T>
          </Cartao>
        ) : null}
        {opcoesLocal.map((l) => {
          const on = l.id === localId;
          return (
            <Pressable
              key={l.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${l.nome}, ${nomeTipo(l.tipo)}, ${brl(l.valor_padrao)}`}
              onPress={() => escolherLocal(l.id)}
              style={[est.local, on && est.localOn]}
            >
              <Radio marcado={on} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <T negrito tam={17} linhas={1}>
                  {l.nome}
                </T>
                <T tam={14} cor={cor.suave}>
                  {nomeTipo(l.tipo)} · {brl(l.valor_padrao)}
                  {l.arquivado ? ' · arquivado' : ''}
                </T>
              </View>
              <IconeTipo tipo={l.tipo} tamanho={36} />
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: 8 }}>
        <Rotulo>Quanto recebeu?</Rotulo>
        <Campo
          prefixo="R$"
          value={valor}
          onChangeText={(t) => {
            setValor(t);
            setErro(null);
          }}
          placeholder="0,00"
          keyboardType="decimal-pad"
          inputMode="decimal"
          accessibilityLabel="Valor recebido em reais"
        />
        <T tam={15} cor={cor.suave}>
          Já vem preenchido com o valor do local. Pode mudar se foi diferente.
        </T>
      </View>

      <View style={{ gap: 8 }}>
        <Rotulo extra="(opcional)">Observação</Rotulo>
        <Campo
          value={obs}
          onChangeText={setObs}
          placeholder="Ex.: faxina pesada, passou roupa"
          multiline
          style={{ minHeight: 56, textAlignVertical: 'top', fontFamily: fonte.regular }}
          accessibilityLabel="Observação"
        />
      </View>

      {editando ? <Botao rotulo="Excluir faxina" icone="lixeira" variante="perigo" altura={56} onPress={excluir} /> : null}
    </Tela>
  );
}

const est = StyleSheet.create({
  linha3: { flexDirection: 'row', gap: 8 },
  titulo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  local: {
    minHeight: 64,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: cor.borda,
    backgroundColor: cor.superficie,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  localOn: { borderWidth: 2, borderColor: cor.primaria },
});
