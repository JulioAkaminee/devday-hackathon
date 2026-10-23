// Regras do servidor que dá para testar sem subir o Express (docs/AUDITORIA.md).
import { existsSync, readFileSync, renameSync } from 'node:fs'
import { ErroDeFase, novoEstado, type Estado } from '../shared/engine.ts'
import { novaAcademia, type Academia } from '../shared/academia.ts'

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

/** S2: limite por token, nunca por IP (o evento inteiro sai pelo mesmo Wi-Fi). */
// ponytail: em memória, zera ao reiniciar o servidor
export class Limite {
  private ultimo = new Map<string, number>()
  private erros = new Map<string, number>()
  private bloqueio = new Map<string, number>()
  constructor(private intervalo = 5000, private maxErros = 20, private pausa = 10 * 60_000) {}

  checar(token: string, agora: number) {
    if (agora < (this.bloqueio.get(token) ?? 0)) throw new ErroHttp(429, 'muitos códigos errados. Tente de novo em alguns minutos')
    if (agora - (this.ultimo.get(token) ?? -Infinity) < this.intervalo) throw new ErroHttp(429, 'espere alguns segundos antes do próximo encontro')
  }
  errou(token: string, agora: number) {
    const n = (this.erros.get(token) ?? 0) + 1
    this.erros.set(token, n >= this.maxErros ? 0 : n)
    if (n >= this.maxErros) this.bloqueio.set(token, agora + this.pausa)
  }
  encontrou(token: string, agora: number) { this.ultimo.set(token, agora) }
}

/** S4: snapshot ilegível não derruba o servidor: vira <arquivo>.bad-<data> e o jogo sobe vazio. */
export function lerSnapshot(arquivo: string, agora = new Date()): unknown[] {
  if (!existsSync(arquivo)) return []
  try {
    const dados = JSON.parse(readFileSync(arquivo, 'utf8'))
    if (!Array.isArray(dados)) throw new Error('não é uma lista')
    return dados
  } catch (e) {
    const destino = `${arquivo}.bad-${agora.toISOString().replace(/[:.]/g, '-')}`
    console.error(`snapshot ilegível (${(e as Error).message}); movido para ${destino}`)
    try { renameSync(arquivo, destino) } catch { /* sem permissão: segue vazio do mesmo jeito */ }
    return []
  }
}

/** Pet de um snapshot antigo ganha os campos que faltam. */
export const completar = <P extends { historico?: Estado[]; estado?: Partial<Estado>; academia?: Academia }>(p: P) =>
  ({ ...p, historico: p.historico ?? [], estado: { ...novoEstado(), ...p.estado }, academia: p.academia ?? novaAcademia() })

// LinkedIn opcional: aceita o endereço inteiro ou só o identificador; guarda só o identificador
// (o link é montado a partir dele, então só letras, números e hífen chegam no href)
export function linkedinDe(v: unknown): string | undefined {
  if (v === undefined || v === null || v === '') return undefined
  if (typeof v !== 'string') throw new ErroHttp(400, 'LinkedIn inválido')
  const id = v.trim().replace(/^(https?:\/\/)?([a-z]{2,3}\.)?linkedin\.com\/in\//i, '').replace(/[/?#].*$/, '')
  if (!id) return undefined
  if (!/^[\p{L}\p{N}-]{3,100}$/u.test(id)) throw new ErroHttp(400, 'LinkedIn inválido: use linkedin.com/in/seu-nome')
  return id
}
