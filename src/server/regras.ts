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
