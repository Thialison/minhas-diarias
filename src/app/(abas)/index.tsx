import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { CartaoFaxina } from '../../components/faxina';
import { Botao, Cartao, FaixaErro, Link, T, Tela, Vazio } from '../../components/ui';
import { useDados } from '../../data/dados';
import { useSessao } from '../../data/sessao';
import { nomeTipo } from '../../data/tipos';
import { anoMes, dentro, hoje, intervalo, MESES, quando, saudacao, tituloDia, ultimoDiaDoMes, type Intervalo } from '../../lib/datas';
import { brl, somar } from '../../lib/dinheiro';
import { cor } from '../../tema';

export default function Inicio() {
  const router = useRouter();
  const { nome } = useSessao();
  const { faxinas, locaisAtivos, localPorId, erro, recarregar } = useDados();
  const h = hoje();
  const { ano, mes } = anoMes(h);

  const resumo = (i: Intervalo) => {
    const fs = faxinas.filter((f) => dentro(f.data, i));
    return { qtd: fs.length, total: somar(fs) };
  };
  const doMes = resumo(intervalo('mes', h));
  const blocos = [
    { rotulo: 'Quinzena', dias: '1 ao 15', fundo: '#E8F0FD', borda: '#CFDDF5', ...resumo(intervalo('q1', h)) },
    { rotulo: 'Quinzena', dias: `16 ao ${ultimoDiaDoMes(ano, mes)}`, fundo: '#FFF4DD', borda: '#F3DFB2', ...resumo(intervalo('q2', h)) },
  ];
  const ultimas = faxinas.slice(0, 3);
  const semLocais = locaisAtivos.length === 0;

  return (
    <Tela comAbas>
      <View style={{ gap: 2 }}>
        <T tam={15} cor={cor.suave}>
          {tituloDia(h)}
        </T>
        <T titulo tam={24}>
          {saudacao()}, {nome}!
        </T>
      </View>

      {erro ? <FaixaErro texto={erro} onTentar={recarregar} /> : null}

      <View style={est.ganhos}>
        <T tam={16} cor={cor.branco}>
          Ganhos de {MESES[mes - 1]}
        </T>
        <T titulo tam={44} cor={cor.branco}>
          {brl(doMes.total)}
        </T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <View style={est.chip}>
            <T negrito tam={15}>
              {doMes.qtd} {doMes.qtd === 1 ? 'faxina' : 'faxinas'}
            </T>
          </View>
          <T tam={15} cor={cor.branco}>
            no mês
          </T>
        </View>
      </View>

      <View style={est.grade}>
        {blocos.map((b) => (
          <Cartao key={b.dias} style={[est.bloco, { backgroundColor: b.fundo, borderColor: b.borda }]}>
            <T negrito tam={15} cor={cor.suave}>
              {b.rotulo} <T tam={15} cor={cor.suave}>({b.dias})</T>
            </T>
            <T titulo tam={28}>
              {b.qtd}
            </T>
            <T negrito tam={15} cor={cor.primaria}>
              {brl(b.total)}
            </T>
          </Cartao>
        ))}
      </View>

      {semLocais ? (
        <Cartao style={{ gap: 12 }}>
          <T negrito tam={18}>
            Para começar, cadastre um local
          </T>
          <T tam={16} cor={cor.suave}>
            Primeiro diga onde a faxina acontece (apto, casa ou loja) e quanto costuma pagar. Depois é só registrar as
            faxinas.
          </T>
          <Botao rotulo="Adicionar local" icone="mais" variante="destaque" altura={56} onPress={() => router.push('/local')} />
        </Cartao>
      ) : (
        <Botao rotulo="Registrar faxina" icone="mais" variante="destaque" onPress={() => router.push('/faxina')} />
      )}

      <View style={est.titulo}>
        <T negrito tam={19}>
          Últimas faxinas
        </T>
        {faxinas.length > 0 ? <Link rotulo="Ver tudo" onPress={() => router.push('/faxinas')} /> : null}
      </View>
      <View style={{ gap: 8, marginTop: -8 }}>
        {ultimas.length === 0 ? <Vazio texto="Nenhuma faxina registrada ainda." /> : null}
        {ultimas.map((f) => {
          const local = localPorId.get(f.local_id);
          return (
            <CartaoFaxina
              key={f.id}
              faxina={f}
              local={local}
              detalhe={`${quando(f.data, h)} · ${local ? nomeTipo(local.tipo) : ''}`}
              onPress={() => router.push({ pathname: '/faxina', params: { id: f.id } })}
            />
          );
        })}
      </View>
    </Tela>
  );
}

const est = StyleSheet.create({
  ganhos: { backgroundColor: cor.primaria, borderRadius: 24, padding: 22, gap: 4 },
  chip: { backgroundColor: cor.destaque, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  bloco: { flexBasis: '45%', flexGrow: 1, paddingVertical: 14, gap: 2 },
  titulo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
});
