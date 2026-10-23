// Regras do servidor que dá para testar sem subir o Express (docs/AUDITORIA.md).
import { ErroDeFase, type Estado } from '../shared/engine.ts'

export class ErroHttp extends Error {
  constructor(public status: number, msg: string) { super(msg) }
}

/** S1: a fase vem antes da busca, para a resposta não revelar se um código existe. */
export function alvoDoEncontro<T>(e: Estado, codigo: string, achar: (c: string) => T | undefined): T {
  if (e.fase !== 'aguardando') throw new ErroDeFase(`esperava fase aguardando, está em ${e.fase}`)
  const alvo = achar(codigo)
  if (!alvo) throw new ErroHttp(404, 'código não encontrado')
  return alvo
}
