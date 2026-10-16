import { Pressable, StyleSheet, View } from 'react-native';
import { dentro, gradeDoMes, LETRAS_SEMANA, nomeMes, type Intervalo, type Ymd } from '../lib/datas';
import { cor, fonte } from '../tema';
import { BotaoIcone, T } from './ui';

export function SeletorMes({
  ano,
  mes,
  onMudar,
  destaque,
}: {
  ano: number;
  mes: number;
  onMudar: (delta: number) => void;
  /** Texto pequeno embaixo do mês (opcional). */
  destaque?: string;
}) {
  return (
    <View style={est.seletor}>
      <BotaoIcone icone="voltar" rotulo="Mês anterior" onPress={() => onMudar(-1)} />
      <View style={{ alignItems: 'center', flex: 1 }}>
        <T titulo tam={24}>
          {nomeMes(ano, mes)}
        </T>
        {destaque ? (
          <T tam={15} cor={cor.suave}>
            {destaque}
          </T>
        ) : null}
      </View>
      <BotaoIcone icone="avancar" rotulo="Próximo mês" onPress={() => onMudar(1)} />
    </View>
  );
}

interface GradeProps {
  ano: number;
  mes: number;
  hoje: Ymd;
  selecionado?: Ymd | null;
  intervaloDestaque?: Intervalo | null;
  contagem?: Map<Ymd, number>;
  onSelecionar: (dia: Ymd) => void;
}

export function GradeMes({ ano, mes, hoje, selecionado, intervaloDestaque, contagem, onSelecionar }: GradeProps) {
  const celulas = gradeDoMes(ano, mes);
  const semanas: (Ymd | null)[][] = [];
  for (let i = 0; i < celulas.length; i += 7) semanas.push(celulas.slice(i, i + 7));
  return (
    <View style={{ gap: 4 }}>
      <View style={est.linha}>
        {LETRAS_SEMANA.map((l, i) => (
          <T key={i} negrito tam={14} cor={cor.suave} style={est.letra}>
            {l}
          </T>
        ))}
      </View>
      {semanas.map((semana, i) => (
        <View key={i} style={est.linha}>
          {semana.map((dia, j) => {
            if (!dia) return <View key={j} style={est.celulaVazia} />;
            const n = contagem?.get(dia) ?? 0;
            const marcado = dia === selecionado;
            const noPeriodo = intervaloDestaque ? dentro(dia, intervaloDestaque) : false;
            const ehHoje = dia === hoje;
            return (
              <Pressable
                key={j}
                accessibilityRole="button"
                accessibilityState={{ selected: marcado }}
                accessibilityLabel={`Dia ${Number(dia.slice(8))}${ehHoje ? ', hoje' : ''}, ${n} ${n === 1 ? 'faxina' : 'faxinas'}`}
                onPress={() => onSelecionar(dia)}
                style={[
                  est.celula,
                  noPeriodo && { backgroundColor: cor.primariaSuave },
                  marcado && est.celulaMarcada,
                ]}
              >
                <T
                  tam={16}
                  negrito={ehHoje || marcado}
                  cor={ehHoje ? cor.primaria : cor.texto}
                  style={ehHoje ? { textDecorationLine: 'underline' } : null}
                >
                  {Number(dia.slice(8))}
                </T>
                {n > 0 ? (
                  <View style={est.bolinha}>
                    <T tam={13} style={{ fontFamily: fonte.negrito }}>
                      {n}
                    </T>
                  </View>
                ) : (
                  <View style={{ height: 20 }} />
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const est = StyleSheet.create({
  seletor: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  linha: { flexDirection: 'row', gap: 4 },
  letra: { flex: 1, textAlign: 'center' },
  celulaVazia: { flex: 1, height: 54 },
  celula: {
    flex: 1,
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: cor.borda,
    backgroundColor: cor.superficie,
    alignItems: 'center',
    paddingTop: 4,
    gap: 2,
  },
  celulaMarcada: { borderWidth: 2, borderColor: cor.primaria },
  bolinha: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: cor.destaque,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
