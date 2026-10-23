import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ErroDeFase, comecar, novoEstado } from '../shared/engine.ts'
import { ErroHttp, Limite, alvoDoEncontro } from './regras.ts'

test('S1: fora de aguardando, código real e inexistente dão o mesmo erro', () => {
  const achar = (c: string) => (c === 'REAL' ? { id: 'x' } : undefined)
  for (const c of ['REAL', 'NADA']) assert.throws(() => alvoDoEncontro(novoEstado(), c, achar), ErroDeFase)
  const e = comecar(novoEstado())
  assert.deepEqual(alvoDoEncontro(e, 'REAL', achar), { id: 'x' })
  assert.throws(() => alvoDoEncontro(e, 'NADA', achar), (err: unknown) => err instanceof ErroHttp && err.status === 404)
})

test('S2: um encontro a cada 5 s e pausa depois de 20 códigos errados', () => {
  const l = new Limite()
  l.encontrou('a', 0)
  assert.throws(() => l.checar('a', 4999), ErroHttp)
  l.checar('a', 5000)
  l.checar('b', 0) // outro token não é afetado
  for (let i = 0; i < 19; i++) l.errou('b', 0)
  l.checar('b', 0)
  l.errou('b', 0)
  assert.throws(() => l.checar('b', 1000), ErroHttp)
  l.checar('b', 10 * 60_000)
})
