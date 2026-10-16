import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cor, fonte, LARGURA_MAX } from '../tema';
import { Icone, type NomeIcone } from './Icone';

/* ---------- Texto ---------- */

interface TProps {
  children: ReactNode;
  tam?: number;
  negrito?: boolean;
  titulo?: boolean;
  cor?: string;
  style?: StyleProp<TextStyle>;
  linhas?: number;
}

export function T({ children, tam = 17, negrito, titulo, cor: c = cor.texto, style, linhas }: TProps) {
  return (
    <Text
      numberOfLines={linhas}
      style={[
        { fontSize: tam, color: c, fontFamily: titulo ? fonte.titulo : negrito ? fonte.negrito : fonte.regular },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/* ---------- Tela ---------- */

interface TelaProps {
  children: ReactNode;
  /** Barra fixa no fim da tela (ex.: botão Salvar). */
  rodape?: ReactNode;
  rolar?: boolean;
  /** Telas com abas: a barra de abas já cuida do espaço de baixo. */
  comAbas?: boolean;
}

export function Tela({ children, rodape, rolar = true, comAbas }: TelaProps) {
  const ins = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: cor.fundo }}>
      <View style={[est.coluna, { paddingTop: ins.top }]}>
        {rolar ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[est.conteudo, { paddingBottom: comAbas || rodape ? 24 : 24 + ins.bottom }]}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          children
        )}
        {rodape ? <View style={[est.rodape, { paddingBottom: 20 + ins.bottom }]}>{rodape}</View> : null}
      </View>
    </View>
  );
}

export function Cabecalho({ titulo, voltar, direita }: { titulo: string; voltar?: boolean; direita?: ReactNode }) {
  const router = useRouter();
  return (
    <View style={est.cabecalho}>
      {voltar ? (
        <BotaoIcone
          icone="voltar"
          rotulo="Voltar"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        />
      ) : null}
      <T titulo tam={26} style={{ flex: 1 }} linhas={1}>
        {titulo}
      </T>
      {direita}
    </View>
  );
}

/* ---------- Botões ---------- */

type Variante = 'primario' | 'destaque' | 'contorno' | 'perigo';

const coresBotao: Record<Variante, { fundo: string; texto: string; borda?: string }> = {
  primario: { fundo: cor.primaria, texto: cor.branco },
  destaque: { fundo: cor.destaque, texto: cor.texto },
  contorno: { fundo: cor.superficie, texto: cor.texto, borda: cor.borda },
  perigo: { fundo: cor.superficie, texto: cor.perigo, borda: cor.borda },
};

interface BotaoProps {
  rotulo: string;
  onPress: () => void;
  variante?: Variante;
  icone?: NomeIcone;
  carregando?: boolean;
  desabilitado?: boolean;
  altura?: number;
  style?: StyleProp<ViewStyle>;
}

export function Botao({ rotulo, onPress, variante = 'primario', icone, carregando, desabilitado, altura = 64, style }: BotaoProps) {
  const c = coresBotao[variante];
  const inativo = desabilitado || carregando;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inativo, busy: carregando }}
      onPress={onPress}
      disabled={inativo}
      style={({ pressed }) => [
        est.botao,
        {
          height: altura,
          backgroundColor: c.fundo,
          borderColor: c.borda ?? c.fundo,
          opacity: desabilitado ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={c.texto} />
      ) : (
        <>
          {icone ? <Icone nome={icone} cor={c.texto} tamanho={24} espessura={2.4} /> : null}
          <T negrito tam={altura >= 60 ? 20 : 18} cor={c.texto}>
            {rotulo}
          </T>
        </>
      )}
    </Pressable>
  );
}

export function BotaoIcone({ icone, rotulo, onPress }: { icone: NomeIcone; rotulo: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [est.botaoIcone, pressed && { backgroundColor: cor.primariaSuave }]}
    >
      <Icone nome={icone} cor={cor.texto} tamanho={22} espessura={2.2} />
    </Pressable>
  );
}

export function Link({ rotulo, onPress, icone }: { rotulo: string; onPress: () => void; icone?: NomeIcone }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} hitSlop={8} style={est.link}>
      {icone ? <Icone nome={icone} cor={cor.primaria} tamanho={20} espessura={2.4} /> : null}
      <T negrito tam={16} cor={cor.primaria}>
        {rotulo}
      </T>
    </Pressable>
  );
}

/** Botão em formato de chip/opção que pode estar marcado. */
export function Opcao({
  rotulo,
  marcado,
  onPress,
  style,
  children,
}: {
  rotulo: string;
  marcado: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: marcado }}
      accessibilityLabel={rotulo}
      onPress={onPress}
      style={({ pressed }) => [
        est.opcao,
        marcado ? est.opcaoMarcada : null,
        pressed && !marcado ? { backgroundColor: cor.fundo } : null,
        style,
      ]}
    >
      {children}
      <T negrito={marcado} tam={16} cor={marcado ? cor.primaria : cor.texto}>
        {rotulo}
      </T>
    </Pressable>
  );
}

/* ---------- Formulário ---------- */

export function Rotulo({ children, extra }: { children: string; extra?: string }) {
  return (
    <T negrito tam={17}>
      {children}
      {extra ? <T tam={17} cor={cor.suave}>{` ${extra}`}</T> : null}
    </T>
  );
}

export function Campo({ prefixo, style, onFocus, onBlur, ...props }: TextInputProps & { prefixo?: string }) {
  const [foco, setFoco] = useState(false);
  return (
    <View style={[est.campo, foco && est.campoFoco]}>
      {prefixo ? (
        <T tam={20} cor={cor.suave}>
          {prefixo}
        </T>
      ) : null}
      <TextInput
        placeholderTextColor={cor.radio}
        style={[est.campoTexto, prefixo ? { fontSize: 22, fontFamily: fonte.negrito } : null, style]}
        onFocus={(e) => {
          setFoco(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFoco(false);
          onBlur?.(e);
        }}
        {...props}
      />
    </View>
  );
}

export function Radio({ marcado }: { marcado: boolean }) {
  return <View style={[est.radio, marcado ? est.radioMarcado : null]} />;
}

/* ---------- Diversos ---------- */

export function Cartao({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[est.cartao, style]}>{children}</View>;
}

export function Vazio({ texto }: { texto: string }) {
  return (
    <T tam={17} cor={cor.suave} style={{ textAlign: 'center', paddingVertical: 28 }}>
      {texto}
    </T>
  );
}

export function Carregando() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: cor.fundo }}>
      <ActivityIndicator size="large" color={cor.primaria} />
    </View>
  );
}

export function FaixaErro({ texto, onTentar }: { texto: string; onTentar: () => void }) {
  return (
    <Pressable onPress={onTentar} style={est.erro} accessibilityRole="button">
      <T tam={15} cor={cor.perigo}>
        {texto} Toque para tentar de novo.
      </T>
    </Pressable>
  );
}

export const est = StyleSheet.create({
  coluna: { flex: 1, width: '100%', maxWidth: LARGURA_MAX, alignSelf: 'center' },
  conteudo: { paddingHorizontal: 20, paddingTop: 20, gap: 16 },
  rodape: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: cor.fundo },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  botao: {
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  botaoIcone: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: cor.borda,
    backgroundColor: cor.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 },
  opcao: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: cor.borda,
    backgroundColor: cor.superficie,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    gap: 4,
  },
  opcaoMarcada: { borderWidth: 2, borderColor: cor.primaria, backgroundColor: cor.primariaSuave },
  campo: {
    minHeight: 60,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: cor.borda,
    backgroundColor: cor.superficie,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  campoFoco: { borderWidth: 2, borderColor: cor.primaria, paddingHorizontal: 15 },
  campoTexto: {
    flex: 1,
    fontSize: 18,
    fontFamily: fonte.regular,
    color: cor.texto,
    paddingVertical: 14,
    minWidth: 0,
    // No navegador a borda do campo já mostra o foco.
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: cor.radio },
  radioMarcado: { borderWidth: 7, borderColor: cor.primaria },
  cartao: {
    backgroundColor: cor.superficie,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: cor.borda,
    padding: 16,
  },
  erro: { backgroundColor: '#FDECEA', borderRadius: 14, padding: 12 },
});
