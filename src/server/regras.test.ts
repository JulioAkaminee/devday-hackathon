import { test } from 'node:test'
import { existsSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import assert from 'node:assert/strict'
import { ErroDeFase, comecar, novoEstado } from '../shared/engine.ts'
import { ErroHttp, Limite, alvoDoEncontro, completar, lerSnapshot, linkedinDe } from './regras.ts'

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

test('S4: snapshot ruim vira .bad e o servidor sobe vazio; pet antigo ganha os campos que faltam', () => {
  const dir = mkdtempSync(join(tmpdir(), 'qg-'))
  const arquivo = join(dir, 'mundo.json')
  assert.deepEqual(lerSnapshot(arquivo), [])
  writeFileSync(arquivo, '[{"id":')
  assert.deepEqual(lerSnapshot(arquivo), [])
  assert.ok(!existsSync(arquivo))
  assert.ok(readdirSync(dir).some((f) => f.startsWith('mundo.json.bad-')))
  writeFileSync(arquivo, '[{"id":"a"}]')
  assert.deepEqual(lerSnapshot(arquivo), [{ id: 'a' }])
  const p = completar({ id: 'a', estado: { cap: 2 } })
  assert.deepEqual([p.historico, p.estado.cap, p.estado.fase, p.estado.conhecidos, p.academia.diagnostico], [[], 2, 'prologo', [], null])
})

test('LinkedIn: aceita endereço ou identificador, recusa o que não é perfil', () => {
  assert.equal(linkedinDe('https://www.linkedin.com/in/ana-souza/?trk=x'), 'ana-souza')
  assert.equal(linkedinDe('linkedin.com/in/joão-123'), 'joão-123')
  assert.equal(linkedinDe('  ana-souza '), 'ana-souza')
  assert.equal(linkedinDe(''), undefined)
  assert.equal(linkedinDe(undefined), undefined)
  for (const ruim of ['javascript:alert(1)', 'ana souza', 'a"><b', 'ab', 42]) assert.throws(() => linkedinDe(ruim), ErroHttp)
})
