import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Icone } from '../components/Icone';
import { Botao, Cabecalho, Campo, Cartao, Opcao, Rotulo, T, Tela } from '../components/ui';
import { useDados } from '../data/dados';
import { TIPOS, type TipoLocal } from '../data/tipos';
import { avisar, confirmar } from '../lib/dialogos';
import { lerValor, valorParaTexto } from '../lib/dinheiro';
import { cor } from '../tema';

export default function TelaLocal() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { locais, faxinas, salvarLocal, removerLocal, reativarLocal } = useDados();
  const existente = id ? locais.find((l) => l.id === id) : undefined;

  const [tipo, setTipo] = useState<TipoLocal>(existente?.tipo ?? 'apto');
  const [nome, setNome] = useState(existente?.nome ?? '');
  const [valor, setValor] = useState(existente ? valorParaTexto(existente.valor_padrao) : '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (existente && !nome) {
      setTipo(existente.tipo);
      setNome(existente.nome);
      setValor(valorParaTexto(existente.valor_padrao));
    }
  }, [existente]); // eslint-disable-line react-hooks/exhaustive-deps

  const qtdFaxinas = id ? faxinas.filter((f) => f.local_id === id).length : 0;

  async function salvar() {
    const v = lerValor(valor);
    if (!nome.trim()) return setErro('Digite o nome ou endereço do local.');
    if (v === null) return setErro('Digite o valor da diária, por exemplo 180 ou 180,50.');
    setSalvando(true);
    try {
      await salvarLocal({ id, nome: nome.trim(), tipo, valor_padrao: v });
      router.back();
    } catch (e) {
      console.warn(e);
      setErro('Não foi possível salvar. Verifique a internet e tente de novo.');
      setSalvando(false);
    }
  }

  async function remover() {
    if (!id) return;
    const msg = qtdFaxinas
      ? `Este local tem ${qtdFaxinas} ${qtdFaxinas === 1 ? 'faxina' : 'faxinas'} no histórico. Ele será arquivado: some da lista, mas o histórico continua.`
      : 'Este local ainda não tem faxinas e será excluído.';
    if (!(await confirmar('Remover local', msg, qtdFaxinas ? 'Arquivar' : 'Excluir'))) return;
    setSalvando(true);
    try {
      await removerLocal(id);
      router.back();
    } catch {
      setSalvando(false);
      avisar('Ops', 'Não foi possível remover. Tente de novo.');
    }
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
          <Botao rotulo="Salvar local" icone="check" carregando={salvando} onPress={salvar} />
        </View>
      }
    >
      <Cabecalho titulo={id ? 'Editar local' : 'Novo local'} voltar />

      {existente?.arquivado ? (
        <Cartao style={{ gap: 10 }}>
          <T tam={16}>Este local está arquivado e não aparece na hora de registrar faxinas.</T>
          <Botao
            rotulo="Reativar local"
            variante="contorno"
            altura={52}
            onPress={async () => {
              await reativarLocal(existente.id);
            }}
          />
        </Cartao>
      ) : null}

      <View style={{ gap: 8 }}>
        <Rotulo>Que tipo de lugar?</Rotulo>
        <View style={{ flexDirection: 'row', gap: 8 }} accessibilityRole="radiogroup">
          {TIPOS.map((t) => {
            const on = t.id === tipo;
            return (
              <Opcao key={t.id} rotulo={t.nome} marcado={on} onPress={() => setTipo(t.id)} style={{ flex: 1, height: 76 }}>
                <Icone nome={t.id} cor={on ? cor.primaria : cor.texto} />
              </Opcao>
            );
          })}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Rotulo>Nome ou endereço</Rotulo>
        <Campo
          value={nome}
          onChangeText={(t) => {
            setNome(t);
            setErro(null);
          }}
          placeholder="Ex.: Apto 302 · Ed. Mirante"
          autoCapitalize="sentences"
          accessibilityLabel="Nome ou endereço"
        />
      </View>

      <View style={{ gap: 8 }}>
        <Rotulo>Valor da diária</Rotulo>
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
          accessibilityLabel="Valor da diária em reais"
        />
        <T tam={15} cor={cor.suave}>
          Esse valor já vem preenchido quando registrar uma faxina aqui.
        </T>
      </View>

      {id && !existente?.arquivado ? (
        <Botao rotulo="Remover local" icone="lixeira" variante="perigo" altura={56} onPress={remover} />
      ) : null}
    </Tela>
  );
}
