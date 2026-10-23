import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  ATIVIDADES, DIAGNOSTICO, habilidadeFraca, novaAcademia, progresso, proximaAtividade,
  responderAtividade, responderDiagnostico, type Habilidade,
} from './academia.ts'

// Respostas do diagnóstico: acerta tudo, menos as habilidades listadas.
const errando = (...fracas: Habilidade[]) =>
  DIAGNOSTICO.map((q) => (fracas.includes(q.habilidade) ? (q.correta + 1) % q.opcoes.length : q.correta))

test('banco tem 5 diagnósticas e 3 atividades por habilidade, com resposta válida', () => {
  assert.equal(DIAGNOSTICO.length, 5)
  const todas = [...DIAGNOSTICO, ...Object.values(ATIVIDADES).flat()]
  for (const h of Object.keys(ATIVIDADES) as Habilidade[]) {
    assert.equal(ATIVIDADES[h].length, 3)
    assert.ok(DIAGNOSTICO.some((q) => q.habilidade === h))
  }
  for (const q of todas) assert.ok(q.opcoes.length === 3 && q.correta >= 0 && q.correta < 3, q.id)
  assert.equal(new Set(todas.map((q) => q.id)).size, todas.length)
})

test('dois perfis geram trilhas em ordem diferente (demo do desafio 4)', () => {
  const a = responderDiagnostico(novaAcademia(), errando('abordar'))
  const b = responderDiagnostico(novaAcademia(), errando('conectar'))
  assert.deepEqual(a.trilha, ['abordar', 'escutar', 'conectar'])
  assert.deepEqual(b.trilha, ['conectar', 'abordar', 'escutar'])
  assert.equal(habilidadeFraca(a), 'abordar')
  assert.equal(habilidadeFraca(b), 'conectar')
})

test('trilha usa proporção e empate respeita a ordem fixa', () => {
  assert.deepEqual(responderDiagnostico(novaAcademia(), errando()).trilha, ['abordar', 'escutar', 'conectar'])
  // erra 1 de 2 em Conectar (50%) e a única de Escutar (0%): Escutar vem antes
  const r = errando('escutar')
  const i = DIAGNOSTICO.findIndex((q) => q.id === 'diag-conectar-1')
  r[i] = (DIAGNOSTICO[i].correta + 1) % 3
  assert.deepEqual(responderDiagnostico(novaAcademia(), r).trilha, ['escutar', 'conectar', 'abordar'])
})

test('diagnóstico duplo, incompleto ou com opção inválida é recusado', () => {
  const a = responderDiagnostico(novaAcademia(), errando())
  assert.throws(() => responderDiagnostico(a, errando()))
  assert.throws(() => responderDiagnostico(novaAcademia(), [0, 1]))
  assert.throws(() => responderDiagnostico(novaAcademia(), [0, 1, 2, 0, 3]))
})

test('atividade antes do diagnóstico ou com id inválido é recusada', () => {
  assert.throws(() => responderAtividade(novaAcademia(), 'abordar-1', 0))
  assert.throws(() => responderAtividade(responderDiagnostico(novaAcademia(), errando()), 'nada', 0))
  assert.equal(proximaAtividade(novaAcademia()), null)
})

test('proximaAtividade segue a trilha e progresso conta certo', () => {
  let a = responderDiagnostico(novaAcademia(), errando('conectar'))
  const ordem: string[] = []
  for (let q = proximaAtividade(a); q; q = proximaAtividade(a)) {
    ordem.push(q.id)
    const r = responderAtividade(a, q.id, q.id === 'conectar-1' ? (q.correta + 1) % 3 : q.correta)
    assert.equal(r.acertou, q.id !== 'conectar-1')
    assert.equal(r.explicacao, q.explicacao)
    a = r.academia
    if (ordem.length === 4) assert.deepEqual(progresso(a), {
      conectar: { feitas: 3, total: 3 }, abordar: { feitas: 1, total: 3 }, escutar: { feitas: 0, total: 3 },
    })
  }
  assert.deepEqual(ordem, ['conectar-1', 'conectar-2', 'conectar-3', 'abordar-1', 'abordar-2', 'abordar-3', 'escutar-1', 'escutar-2', 'escutar-3'])
  assert.equal(a.feitas['conectar-1'], false)
  assert.equal(proximaAtividade(a), null)
})
