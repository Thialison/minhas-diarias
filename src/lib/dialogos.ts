import { Alert, Platform } from 'react-native';

/** Pergunta Sim/Não. No navegador usa a janela de confirmação padrão. */
export function confirmar(titulo: string, mensagem: string, botaoOk: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${titulo}\n\n${mensagem}`));
  return new Promise((ok) =>
    Alert.alert(titulo, mensagem, [
      { text: 'Cancelar', style: 'cancel', onPress: () => ok(false) },
      { text: botaoOk, style: 'destructive', onPress: () => ok(true) },
    ]),
  );
}

export function avisar(titulo: string, mensagem: string) {
  if (Platform.OS === 'web') window.alert(`${titulo}\n\n${mensagem}`);
  else Alert.alert(titulo, mensagem);
}
