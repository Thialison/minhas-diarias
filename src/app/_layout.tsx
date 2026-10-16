import { AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold } from '@expo-google-fonts/atkinson-hyperlegible';
import { BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Carregando } from '../components/ui';
import { DadosProvider } from '../data/dados';
import { SessaoProvider, useSessao } from '../data/sessao';
import { cor } from '../tema';

export default function Raiz() {
  const [fontesProntas, erroFontes] = useFonts({
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
    BricolageGrotesque_800ExtraBold,
  });
  return (
    <SafeAreaProvider>
      <SessaoProvider>
        <DadosProvider>
          <StatusBar style="dark" />
          <Navegacao pronto={fontesProntas || Boolean(erroFontes)} />
        </DadosProvider>
      </SessaoProvider>
    </SafeAreaProvider>
  );
}

function Navegacao({ pronto }: { pronto: boolean }) {
  const { carregando, logado, temAcesso, nome } = useSessao();
  if (!pronto || carregando) return <Carregando />;
  const liberado = logado && temAcesso && Boolean(nome);
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cor.fundo } }}>
      <Stack.Protected guard={liberado}>
        <Stack.Screen name="(abas)" />
        <Stack.Screen name="faxina" options={{ title: 'Faxina' }} />
        <Stack.Screen name="faxinas" options={{ title: 'Todas as faxinas' }} />
        <Stack.Screen name="local" options={{ title: 'Local' }} />
        <Stack.Screen name="membros" options={{ title: 'Membros' }} />
      </Stack.Protected>
      <Stack.Protected guard={!liberado}>
        <Stack.Screen name="entrar" options={{ title: 'Entrar' }} />
      </Stack.Protected>
    </Stack>
  );
}
