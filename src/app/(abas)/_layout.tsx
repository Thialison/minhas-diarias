import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icone, type NomeIcone } from '../../components/Icone';
import { T } from '../../components/ui';
import { cor } from '../../tema';

function aba(titulo: string, icone: NomeIcone) {
  return {
    title: titulo,
    tabBarIcon: ({ focused }: { focused: boolean }) => (
      <View
        style={{
          width: 64,
          height: 32,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: focused ? cor.primariaSuave : 'transparent',
        }}
      >
        <Icone nome={icone} cor={focused ? cor.primaria : cor.suave} />
      </View>
    ),
    tabBarLabel: ({ focused }: { focused: boolean }) => (
      <T tam={13} negrito={focused} cor={focused ? cor.primaria : cor.suave}>
        {titulo}
      </T>
    ),
  };
}

export default function LayoutAbas() {
  const ins = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: cor.primaria,
        tabBarInactiveTintColor: cor.suave,
        tabBarStyle: {
          backgroundColor: cor.superficie,
          borderTopColor: cor.borda,
          height: 76 + ins.bottom,
          paddingTop: 8,
          paddingBottom: 10 + ins.bottom,
        },
        tabBarItemStyle: { gap: 4 },
        sceneStyle: { backgroundColor: cor.fundo },
      }}
    >
      <Tabs.Screen name="index" options={aba('Início', 'inicio')} />
      <Tabs.Screen name="calendario" options={aba('Calendário', 'calendario')} />
      <Tabs.Screen name="locais" options={aba('Locais', 'locais')} />
    </Tabs>
  );
}
