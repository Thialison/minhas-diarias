import { Pressable, StyleSheet, View } from 'react-native';
import { brl } from '../lib/dinheiro';
import type { Faxina, Local, TipoLocal } from '../data/tipos';
import { nomeTipo } from '../data/tipos';
import { cor, tintaTipo } from '../tema';
import { Icone } from './Icone';
import { T } from './ui';

export function IconeTipo({ tipo, tamanho = 44 }: { tipo: TipoLocal; tamanho?: number }) {
  const t = tintaTipo[tipo];
  return (
    <View style={[est.icone, { width: tamanho, height: tamanho, backgroundColor: t.fundo }]}>
      <Icone nome={tipo} cor={t.frente} tamanho={22} espessura={2} />
    </View>
  );
}

interface CartaoFaxinaProps {
  faxina: Faxina;
  local: Local | undefined;
  /** Texto da segunda linha. Padrão: tipo + observação. */
  detalhe?: string;
  comIcone?: boolean;
  onPress?: () => void;
}

export function CartaoFaxina({ faxina, local, detalhe, comIcone = true, onPress }: CartaoFaxinaProps) {
  const tipo = local?.tipo ?? 'casa';
  const partes = [nomeTipo(tipo)];
  if (faxina.observacao) partes.push(faxina.observacao);
  if (faxina.criado_por_nome) partes.push(`por ${faxina.criado_por_nome}`);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${local?.nome ?? 'Local removido'}, ${brl(faxina.valor)}. Toque para editar.`}
      onPress={onPress}
      style={({ pressed }) => [est.cartao, pressed && { backgroundColor: cor.fundo }]}
    >
      {comIcone ? <IconeTipo tipo={tipo} /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <T negrito tam={17} linhas={1}>
          {local?.nome ?? 'Local removido'}
        </T>
        <T tam={15} cor={cor.suave} linhas={1}>
          {detalhe ?? partes.join(' · ')}
        </T>
      </View>
      <T negrito tam={17}>
        {brl(faxina.valor)}
      </T>
    </Pressable>
  );
}

export function CartaoLocal({ local, onPress }: { local: Local; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${local.nome}. Toque para editar.`}
      onPress={onPress}
      style={({ pressed }) => [est.cartao, pressed && { backgroundColor: cor.fundo }]}
    >
      <IconeTipo tipo={local.tipo} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <T negrito tam={17} linhas={1}>
          {local.nome}
        </T>
        <T tam={15} cor={cor.suave}>
          {nomeTipo(local.tipo)} · {brl(local.valor_padrao)}
        </T>
      </View>
      <Icone nome="avancar" cor={cor.radio} tamanho={20} />
    </Pressable>
  );
}

const est = StyleSheet.create({
  icone: { borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cartao: {
    backgroundColor: cor.superficie,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: cor.borda,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 68,
  },
});
