/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gerarRelatorio, linkWhatsApp } from './relatorio.ts';

const itens = [
  { data: '2026-10-16', valor: 220, local: 'Apto 1104' },
  { data: '2026-10-01', valor: 180, local: 'Apto 302' },
  { data: '2026-10-08', valor: 200, local: 'Apto 501' },
  { data: '2026-10-08', valor: 180, local: 'Apto 302' },
  { data: '2026-10-31', valor: 180.5, local: 'Apto 302' },
  { data: '2026-11-02', valor: 180, local: 'Apto 302' },
];

test('1ª quinzena: só dias 1 a 15, em ordem, com total', () => {
  const r = gerarRelatorio(itens, 'q1', 2026, 10);
  assert.equal(
    r.texto,
    [
      '*Faxinas – 1ª quinzena de outubro/2026*',
      '01/10 a 15/10',
      '',
      '01/10 (qui) – Apto 302 – R$ 180,00',
      '08/10 (qui) – Apto 302 – R$ 180,00',
      '08/10 (qui) – Apto 501 – R$ 200,00',
      '',
      '*Total: 3 faxinas – R$ 560,00*',
    ].join('\n'),
  );
  assert.equal(r.quantidade, 3);
});

test('2ª quinzena vai até o último dia do mês', () => {
  const r = gerarRelatorio(itens, 'q2', 2026, 10);
  assert.match(r.texto, /16\/10 a 31\/10/);
  assert.match(r.texto, /31\/10 \(sáb\) – Apto 302 – R\$ 180,50/);
  assert.match(r.texto, /\*Total: 2 faxinas – R\$ 400,50\*/);
  assert.doesNotMatch(r.texto, /02\/11/);
});

test('mês separado por quinzena com subtotais', () => {
  const r = gerarRelatorio(itens, 'mes', 2026, 10);
  assert.match(r.texto, /\*1ª quinzena \(01 a 15\)\*/);
  assert.match(r.texto, /Subtotal: 3 faxinas – R\$ 560,00/);
  assert.match(r.texto, /\*2ª quinzena \(16 a 31\)\*/);
  assert.match(r.texto, /\*Total do mês: 5 faxinas – R\$ 960,50\*/);
});

test('período sem faxinas e fevereiro', () => {
  const r = gerarRelatorio(itens, 'q2', 2026, 2);
  assert.match(r.texto, /16\/02 a 28\/02/);
  assert.match(r.texto, /Nenhuma faxina neste período/);
  assert.match(r.texto, /Total: 0 faxinas – R\$ 0,00/);
});

test('link do WhatsApp com o texto codificado', () => {
  assert.equal(linkWhatsApp('*Oi* – R$ 1,00\nok'), 'https://wa.me/?text=*Oi*%20%E2%80%93%20R%24%201%2C00%0Aok');
});
