import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Platform, Pressable, Share, StyleSheet, View } from 'react-native';
import { Icone } from '../components/Icone';
import { Botao, Cabecalho, Cartao, T, Tela } from '../components/ui';
import { useDados } from '../data/dados';
import { anoMes, hoje, mudarMes, nomeMes } from '../lib/datas';
import { avisar } from '../lib/dialogos';
import { diasDoPeriodo, gerarRelatorio, linkWhatsApp, type PeriodoRelatorio } from '../lib/relatorio';
import { cor } from '../tema';

async function copiarTexto(texto: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch {
      // Navegadores antigos: copia por um campo escondido.
      const campo = document.createElement('textarea');
      campo.value = texto;
      campo.style.position = 'fixed';
      campo.style.opacity = '0';
      document.body.appendChild(campo);
      campo.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(campo);
      return ok;
    }
  }
  await Share.share({ message: texto });
  return true;
}

export default function TelaRelatorio() {
  const params = useLocalSearchParams<{ periodo?: string }>();
  const { faxinas, locais, localPorId } = useDados();
  const h = hoje();
  const diaHoje = Number(h.slice(8));
  const [mes, setMes] = useState(anoMes(h));
  const [periodo, setPeriodo] = useState<PeriodoRelatorio>(
    params.periodo === 'q1' || params.periodo === 'q2' || params.periodo === 'mes'
      ? params.periodo
      : diaHoje <= 15
        ? 'q1'
        : 'q2',
  );
  // Guarda os desmarcados: um local novo já entra marcado.
  const [fora, setFora] = useState<Set<string>>(new Set());
  const [copiado, setCopiado] = useState(false);

  const prefixo = `${mes.ano}-${String(mes.mes).padStart(2, '0')}`;
  const doMes = faxinas.filter((f) => f.data.startsWith(prefixo));

  // Locais que aparecem para escolher: os ativos e os que têm faxina no mês.
  const opcoes = useMemo(() => {
    const comFaxina = new Set(doMes.map((f) => f.local_id));
    return locais.filter((l) => !l.arquivado || comFaxina.has(l.id));
  }, [locais, doMes]);

  const relatorio = useMemo(() => {
    const itens = doMes
      .filter((f) => !fora.has(f.local_id))
      .map((f) => ({ data: f.data, valor: f.valor, local: localPorId.get(f.local_id)?.nome ?? 'Local removido' }));
    return gerarRelatorio(itens, periodo, mes.ano, mes.mes);
  }, [doMes, fora, periodo, mes, localPorId]);

  const todos = opcoes.every((l) => !fora.has(l.id));
  const mudou = () => setCopiado(false);

  function alternar(id: string) {
    const novo = new Set(fora);
    if (novo.has(id)) novo.delete(id);
    else novo.add(id);
    setFora(novo);
    mudou();
  }

  async function enviar() {
    const url = linkWhatsApp(relatorio.texto);
    if (Platform.OS === 'web') window.open(url, '_blank', 'noopener');
    else await Linking.openURL(url);
  }

  async function copiar() {
    const ok = await copiarTexto(relatorio.texto);
    if (ok) setCopiado(true);
    else avisar('Não deu para copiar', 'Use o botão "Enviar no WhatsApp".');
  }

  const ult = diasDoPeriodo('mes', mes.ano, mes.mes)[1];
  const periodos: { id: PeriodoRelatorio; nome: string; dias: string }[] = [
    { id: 'q1', nome: '1ª quinzena', dias: '1 a 15' },
    { id: 'q2', nome: '2ª quinzena', dias: `16 a ${ult}` },
    { id: 'mes', nome: 'Mês', dias: `1 a ${ult}` },
  ];

  return (
    <Tela
      rodape={
        <View style={{ gap: 10 }}>
          <Pressable
            accessibilityRole="button"
            onPress={enviar}
            style={({ pressed }) => [est.whats, pressed && { opacity: 0.85 }]}
          >
            <Icone nome="whatsapp" cor={cor.branco} tamanho={24} espessura={2} />
            <T negrito tam={19} cor={cor.branco}>
              Enviar no WhatsApp
            </T>
          </Pressable>
          <Botao
            rotulo={copiado ? 'Copiado!' : 'Copiar texto'}
            icone={copiado ? 'check' : 'copiar'}
            variante="contorno"
            altura={52}
            onPress={copiar}
          />
        </View>
      }
    >
      <Cabecalho titulo="Relatório" voltar />

      <View style={est.mes}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mês anterior"
          onPress={() => (setMes(mudarMes(mes.ano, mes.mes, -1)), mudou())}
          style={est.seta}
        >
          <Icone nome="voltar" cor={cor.texto} tamanho={20} espessura={2.2} />
        </Pressable>
        <T negrito tam={17}>
          {nomeMes(mes.ano, mes.mes)}
        </T>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Próximo mês"
          onPress={() => (setMes(mudarMes(mes.ano, mes.mes, 1)), mudou())}
          style={est.seta}
        >
          <Icone nome="avancar" cor={cor.texto} tamanho={20} espessura={2.2} />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }} accessibilityRole="radiogroup">
        {periodos.map((p) => {
          const on = p.id === periodo;
          return (
            <Pressable
              key={p.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => (setPeriodo(p.id), mudou())}
              style={[est.periodo, on && est.periodoOn]}
            >
              <T negrito tam={16} cor={on ? cor.primariaEscura : cor.texto}>
                {p.nome}
              </T>
              <T tam={13} cor={on ? cor.primariaEscura : cor.suave}>
                {p.dias}
              </T>
            </Pressable>
          );
        })}
      </View>

      {opcoes.length > 1 ? (
        <View style={{ gap: 8 }}>
          <T negrito tam={16}>
            Quais locais?
          </T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Chip
              rotulo="Todos"
              on={todos}
              onPress={() => {
                setFora(todos ? new Set(opcoes.map((l) => l.id)) : new Set());
                mudou();
              }}
            />
            {opcoes.map((l) => (
              <Chip key={l.id} rotulo={l.nome} on={!fora.has(l.id)} onPress={() => alternar(l.id)} />
            ))}
          </View>
        </View>
      ) : null}

      <View style={{ gap: 8 }}>
        <T negrito tam={16}>
          Como vai chegar
        </T>
        <View style={est.fundoConversa}>
          <View style={est.balao}>
            {relatorio.linhas.map((l, i) => (
              <T key={i} tam={15} negrito={l.negrito} cor="#111B21" style={{ lineHeight: 22 }}>
                {l.texto || ' '}
              </T>
            ))}
          </View>
        </View>
      </View>

      {relatorio.quantidade === 0 ? (
        <Cartao>
          <T tam={15} cor={cor.suave}>
            Não há faxinas nesse período com os locais escolhidos.
          </T>
        </Cartao>
      ) : null}
    </Tela>
  );
}

function Chip({ rotulo, on, onPress }: { rotulo: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={rotulo}
      onPress={onPress}
      style={[est.chip, on && est.chipOn]}
    >
      {on ? <Icone nome="check" cor={cor.branco} tamanho={16} espessura={3} /> : null}
      <T negrito={on} tam={15} cor={on ? cor.branco : cor.texto} linhas={1}>
        {rotulo}
      </T>
    </Pressable>
  );
}

const est = StyleSheet.create({
  mes: {
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
  periodo: {
    flex: 1,
    minHeight: 64,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: cor.borda,
    backgroundColor: cor.superficie,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 4,
  },
  periodoOn: { borderWidth: 2, borderColor: cor.primaria, backgroundColor: cor.primariaSuave },
  chip: {
    height: 44,
    maxWidth: '100%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: cor.borda,
    backgroundColor: cor.superficie,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  chipOn: { backgroundColor: cor.primaria, borderColor: cor.primaria },
  fundoConversa: { backgroundColor: '#EFE7DD', borderRadius: 18, padding: 12 },
  balao: {
    backgroundColor: '#D9FDD3',
    borderRadius: 12,
    borderBottomRightRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  whats: {
    height: 60,
    borderRadius: 18,
    backgroundColor: '#0F7A43',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
});
