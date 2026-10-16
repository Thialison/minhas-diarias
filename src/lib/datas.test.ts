/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDias, gradeDoMes, intervalo, quando, rotuloGrupo, tituloDia, ultimoDiaDoMes, mudarMes } from './datas.ts';
import { brl, lerValor, valorParaTexto } from './dinheiro.ts';

test('quinzenas acompanham o tamanho do mês', () => {
  assert.deepEqual(intervalo('q1', '2026-10-16'), { inicio: '2026-10-01', fim: '2026-10-15' });
  assert.deepEqual(intervalo('q2', '2026-10-16'), { inicio: '2026-10-16', fim: '2026-10-31' });
  assert.deepEqual(intervalo('q2', '2026-02-03'), { inicio: '2026-02-16', fim: '2026-02-28' });
  assert.deepEqual(intervalo('q2', '2028-02-20'), { inicio: '2028-02-16', fim: '2028-02-29' });
  assert.equal(ultimoDiaDoMes(2026, 11), 30);
});

test('semana vai de domingo a sábado, mesmo atravessando o mês', () => {
  assert.deepEqual(intervalo('semana', '2026-10-16'), { inicio: '2026-10-11', fim: '2026-10-17' });
  assert.deepEqual(intervalo('semana', '2026-11-02'), { inicio: '2026-11-01', fim: '2026-11-07' });
  assert.deepEqual(intervalo('semana', '2026-10-01'), { inicio: '2026-09-27', fim: '2026-10-03' });
});

test('grade de outubro/2026 começa numa quinta', () => {
  const g = gradeDoMes(2026, 10);
  assert.equal(g.length, 35);
  assert.deepEqual(g.slice(0, 5), [null, null, null, null, '2026-10-01']);
});

test('textos de data', () => {
  assert.equal(tituloDia('2026-10-16'), 'Sexta, 16 de outubro');
  assert.equal(rotuloGrupo('2026-10-16', '2026-10-16'), 'SEX, 16 OUT · HOJE');
  assert.equal(quando('2026-10-15', '2026-10-16'), 'Ontem');
  assert.equal(quando('2026-10-03', '2026-10-16'), '03/10');
  assert.equal(addDias('2026-12-31', 1), '2027-01-01');
  assert.deepEqual(mudarMes(2026, 1, -1), { ano: 2025, mes: 12 });
});

test('dinheiro', () => {
  assert.equal(brl(2430), 'R$ 2.430');
  assert.equal(brl(180.5), 'R$ 180,50');
  assert.equal(valorParaTexto(1200), '1.200,00');
  assert.equal(lerValor('180'), 180);
  assert.equal(lerValor('180,50'), 180.5);
  assert.equal(lerValor('1.200,00'), 1200);
  assert.equal(lerValor('R$ 1.200'), 1200);
  assert.equal(lerValor('12.5'), 12.5);
  assert.equal(lerValor('abc'), null);
  assert.equal(lerValor(''), null);
});
