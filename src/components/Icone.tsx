import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { TipoLocal } from '../data/tipos';

export type NomeIcone =
  | 'voltar' | 'avancar' | 'baixo' | 'mais' | 'check' | 'fechar' | 'lixeira' | 'sair'
  | 'inicio' | 'calendario' | 'calendarioSimples' | 'locais' | 'filtro' | 'grade'
  | TipoLocal;

interface Props {
  nome: NomeIcone;
  cor: string;
  tamanho?: number;
  espessura?: number;
}

export function Icone({ nome, cor, tamanho = 24, espessura = 1.9 }: Props) {
  const p = { stroke: cor, strokeWidth: espessura, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
      {desenho(nome, cor, p)}
    </Svg>
  );
}

function desenho(nome: NomeIcone, cor: string, p: any) {
  switch (nome) {
    case 'voltar':
      return <Path d="M15 6l-6 6 6 6" {...p} />;
    case 'avancar':
      return <Path d="M9 6l6 6-6 6" {...p} />;
    case 'baixo':
      return <Path d="M6 9l6 6 6-6" {...p} />;
    case 'mais':
      return <Path d="M12 5v14M5 12h14" {...p} />;
    case 'check':
      return <Path d="M5 12l5 5 9-10" {...p} />;
    case 'fechar':
      return <Path d="M6 6l12 12M18 6L6 18" {...p} />;
    case 'lixeira':
      return <Path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" {...p} />;
    case 'sair':
      return <Path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4" {...p} />;
    case 'inicio':
      return (
        <>
          <Path d="M3.5 11.5 12 4.8l5 4" {...p} />
          <Path d="M5.5 10v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-6.5" {...p} />
          <Path d="M10 21v-3.5a2 2 0 0 1 4 0V21" {...p} />
          <Path
            d="M19.5 2.3c.25 1.3.9 1.95 2.2 2.2-1.3.25-1.95.9-2.2 2.2-.25-1.3-.9-1.95-2.2-2.2 1.3-.25 1.95-.9 2.2-2.2z"
            {...p}
            fill={cor}
            strokeWidth={1.2}
          />
          <Path d="M21 9.3v.01" {...p} />
        </>
      );
    case 'calendario':
      return (
        <>
          <Rect x={3.5} y={5} width={17} height={15.5} rx={3} {...p} />
          <Path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" {...p} />
          <Path d="m9 14.5 2 2 4-4" {...p} />
        </>
      );
    case 'calendarioSimples':
      return (
        <>
          <Rect x={3.5} y={5} width={17} height={15.5} rx={3} {...p} />
          <Path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" {...p} />
        </>
      );
    case 'locais':
      return (
        <>
          <Path d="M3 21h18" {...p} />
          <Path d="M5 21V5.5A1.5 1.5 0 0 1 6.5 4h5A1.5 1.5 0 0 1 13 5.5V21" {...p} />
          <Path d="M8 8h2M8 11.5h2M8 15h2" {...p} />
          <Path d="m13 12.5 3.5-2.8 3.5 2.8V21" {...p} />
          <Path d="M15.5 21v-3h2v3" {...p} />
        </>
      );
    case 'filtro':
      return (
        <>
          <Path d="M4 7h10M18 7h2M4 17h4M12 17h8" {...p} />
          <Circle cx={16} cy={7} r={2} {...p} />
          <Circle cx={10} cy={17} r={2} {...p} />
        </>
      );
    case 'grade':
      return (
        <>
          <Rect x={4} y={4} width={6.5} height={6.5} rx={1.5} {...p} />
          <Rect x={13.5} y={4} width={6.5} height={6.5} rx={1.5} {...p} />
          <Rect x={4} y={13.5} width={6.5} height={6.5} rx={1.5} {...p} />
          <Rect x={13.5} y={13.5} width={6.5} height={6.5} rx={1.5} {...p} />
        </>
      );
    case 'apto':
      return (
        <>
          <Rect x={5} y={3} width={14} height={18} rx={1.5} {...p} />
          <Path d="M9 7h2M13 7h2M9 11h2M13 11h2M10.5 21v-4h3v4" {...p} />
        </>
      );
    case 'casa':
      return (
        <>
          <Path d="M3.5 11.5 12 4.8l8.5 6.7" {...p} />
          <Path d="M5.5 10v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9" {...p} />
          <Path d="M10 21v-3.5a2 2 0 0 1 4 0V21" {...p} />
        </>
      );
    case 'loja':
      return (
        <>
          <Path d="M4 9.5 5.5 4h13L20 9.5" {...p} />
          <Path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0" {...p} />
          <Path d="M5.5 12.5V20h13v-7.5" {...p} />
          <Path d="M10 20v-4h4v4" {...p} />
        </>
      );
  }
}
