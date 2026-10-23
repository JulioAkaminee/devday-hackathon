import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ErroDeFase, comecar, novoEstado } from '../shared/engine.ts'
import { ErroHttp, alvoDoEncontro } from './regras.ts'

test('S1: fora de aguardando, código real e inexistente dão o mesmo erro', () => {
  const achar = (c: string) => (c === 'REAL' ? { id: 'x' } : undefined)
  for (const c of ['REAL', 'NADA']) assert.throws(() => alvoDoEncontro(novoEstado(), c, achar), ErroDeFase)
  const e = comecar(novoEstado())
  assert.deepEqual(alvoDoEncontro(e, 'REAL', achar), { id: 'x' })
  assert.throws(() => alvoDoEncontro(e, 'NADA', achar), (err: unknown) => err instanceof ErroHttp && err.status === 404)
})
