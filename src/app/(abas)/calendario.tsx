import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { GradeMes, SeletorMes } from '../../components/calendario';
import { CartaoFaxina } from '../../components/faxina';
import { Link, T, Tela, Vazio } from '../../components/ui';
import { useDados } from '../../data/dados';
import {
  anoMes,
  dentro,
  hoje,
  intervalo,
  MESES,
  mudarMes,
  parseYmd,
  tituloDia,
  ultimoDiaDoMes,
  ymd,
  type Periodo,
  type Ymd,
} from '../../lib/datas';
import { brl, somar } from '../../lib/dinheiro';
import { cor } from '../../tema';

const ddmm = (s: Ymd) => `${s.slice(8)}/${s.slice(5, 7)}`;

export default function Calendario() {
  const router = useRouter();
  const { faxinas, localPorId } = useDados();
  const h = hoje();
  const [sel, setSel] = useState<Ymd>(h);
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const { ano, mes } = anoMes(sel);
  const ultimo = ultimoDiaDoMes(ano, mes);

  const contagem = useMemo(() => {
    const m = new Map<Ymd, number>();
    for (const f of faxinas) m.set(f.data, (m.get(f.data) ?? 0) + 1);
    return m;
  }, [faxinas]);

  const faixa = intervalo(periodo, sel);
  const doPeriodo = faxinas.filter((f) => dentro(f.data, faixa));
  const doDia = faxinas.filter((f) => f.data === sel);

  const rotulos: Record<Periodo, string> = {
    dia: 'Dia',
    semana: 'Semana',
    q1: '1 a 15',
    q2: `16 a ${ultimo}`,
    mes: 'Mês',
  };
  const descricao: Record<Periodo, string> = {
    dia: tituloDia(sel),
    semana: `Semana de ${ddmm(faixa.inicio)} a ${ddmm(faixa.fim)}`,
    q1: `De 1 a 15 de ${MESES[mes - 1]}`,
    q2: `De 16 a ${ultimo} de ${MESES[mes - 1]}`,
    mes: `${MESES[mes - 1].charAt(0).toUpperCase()}${MESES[mes - 1].slice(1)} inteiro`,
  };

  const mudar = (delta: number) => {
    const novo = mudarMes(ano, mes, delta);
    const atual = anoMes(h);
    setSel(novo.ano === atual.ano && novo.mes === atual.mes ? h : ymd(novo.ano, novo.mes, 1));
  };

  return (
    <Tela comAbas>
      <SeletorMes ano={ano} mes={mes} onMudar={mudar} />

      <View style={est.periodos} accessibilityRole="radiogroup">
        {(Object.keys(rotulos) as Periodo[]).map((p) => {
          const on = p === periodo;
          return (
            <Pressable
              key={p}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => setPeriodo(p)}
              style={[est.periodo, on && est.periodoOn]}
            >
              <T negrito tam={15} cor={on ? cor.branco : cor.texto}>
                {rotulos[p]}
              </T>
            </Pressable>
          );
        })}
      </View>

      <View style={est.resumo}>
        <View style={{ flex: 1 }}>
          <T tam={15} cor={cor.branco}>
            {descricao[periodo]}
          </T>
          <T titulo tam={26} cor={cor.branco}>
            {doPeriodo.length} {doPeriodo.length === 1 ? 'faxina' : 'faxinas'}
          </T>
        </View>
        <T titulo tam={26} cor={cor.branco}>
          {brl(somar(doPeriodo))}
        </T>
      </View>

      <GradeMes
        ano={ano}
        mes={mes}
        hoje={h}
        selecionado={sel}
        intervaloDestaque={faixa}
        contagem={contagem}
        onSelecionar={setSel}
      />

      <View style={est.titulo}>
        <T negrito tam={18} style={{ flex: 1 }}>
          {tituloDia(sel)}
          {parseYmd(sel).getFullYear() !== anoMes(h).ano ? ` de ${ano}` : ''}
        </T>
        <Link
          rotulo="Adicionar"
          icone="mais"
          onPress={() => router.push({ pathname: '/faxina', params: { data: sel } })}
        />
      </View>
      <View style={{ gap: 8, marginTop: -8 }}>
        {doDia.length === 0 ? <Vazio texto="Nenhuma faxina neste dia." /> : null}
        {doDia.map((f) => (
          <CartaoFaxina
            key={f.id}
            faxina={f}
            local={localPorId.get(f.local_id)}
            comIcone={false}
            onPress={() => router.push({ pathname: '/faxina', params: { id: f.id } })}
          />
        ))}
      </View>
    </Tela>
  );
}

const est = StyleSheet.create({
  periodos: { flexDirection: 'row', gap: 6 },
  periodo: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: cor.borda,
    backgroundColor: cor.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodoOn: { backgroundColor: cor.texto, borderColor: cor.texto },
  resumo: {
    backgroundColor: cor.primaria,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titulo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
