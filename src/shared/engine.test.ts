import { test } from 'node:test'
import assert from 'node:assert/strict'
import { avancar, comecar, encontrar, ErroDeRegra, escolher, finalDe, novoEstado, type Final, type Opcao } from './engine.ts'

// Caps. 1–3 com pessoas novas, cap. 4 reencontro (L1).
function jogar(ops: Opcao[]) {
  let e = comecar(novoEstado())
  const pessoas = ['a', 'b', 'c', 'a']
  ops.forEach((op, i) => {
    e = avancar(escolher(encontrar(e, pessoas[i]), op))
  })
  return e
}

test('todo caminho termina e os 3 finais são alcançáveis', () => {
  const finais = new Set<Final>()
  for (let m = 0; m < 16; m++) {
    const ops = [0, 1, 2, 3].map((i) => ((m >> i) & 1 ? 'profunda' : 'ampla') as Opcao)
    const e = jogar(ops)
    assert.equal(e.fase, 'final')
    finais.add(finalDe(e))
  }
  assert.deepEqual([...finais].sort(), ['amigo', 'colecionador', 'time'])
})

test('tabela de k escolhas profundas (QUEBRA-GELO.md, L1)', () => {
  const esperado: [number, number, Final][] = [[11, 0, 'colecionador'], [9, 2, 'colecionador'], [7, 4, 'time'], [5, 6, 'time'], [3, 8, 'amigo']]
  esperado.forEach(([a, p, f], k) => {
    const e = jogar([0, 1, 2, 3].map((i) => (i < k ? 'profunda' : 'ampla')))
    assert.deepEqual([e.alcance, e.profundidade, finalDe(e)], [a, p, f])
  })
})

test('missões 1–3 pedem gente nova; a 4 pede reencontro', () => {
  let e = avancar(escolher(encontrar(comecar(novoEstado()), 'a'), 'ampla'))
  assert.throws(() => encontrar(e, 'a'), ErroDeRegra)
  for (const id of ['b', 'c']) e = avancar(escolher(encontrar(e, id), 'ampla'))
  assert.throws(() => encontrar(e, 'z'), ErroDeRegra)
  assert.equal(encontrar(e, 'b').fase, 'encontro')
})

test('ação fora de fase é recusada', () => {
  assert.throws(() => escolher(novoEstado(), 'ampla'))
})
