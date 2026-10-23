// Motor da aventura: funções puras (estado, ação) → estado. Regras em docs/QUEBRA-GELO.md, seção 3.

export type Opcao = 'ampla' | 'profunda'
export type Fase = 'prologo' | 'aguardando' | 'encontro' | 'consequencia' | 'final'
export type Final = 'time' | 'colecionador' | 'amigo'

export const TOTAL_CAPITULOS = 4

export interface Estado {
  cap: number // 0 = prólogo, 1..4 = capítulos, 5 = final
  fase: Fase
  alcance: number
  profundidade: number
  encontros: string[] // id do pet encontrado em cada capítulo, na ordem
  escolhas: Opcao[]
  conhecidos: string[]
}

export class ErroDeFase extends Error {}
/** Encontro que a missão atual não aceita; a mensagem vai direto para a pessoa. */
export class ErroDeRegra extends Error {}

export const novoEstado = (): Estado => ({
  cap: 0, fase: 'prologo', alcance: 0, profundidade: 0, encontros: [], escolhas: [], conhecidos: [],
})

function exigir(e: Estado, fase: Fase) {
  if (e.fase !== fase) throw new ErroDeFase(`esperava fase ${fase}, está em ${e.fase}`)
}

export function comecar(e: Estado): Estado {
  exigir(e, 'prologo')
  return { ...e, cap: 1, fase: 'aguardando' }
}

/** Amizade sem abrir capítulo (o outro lado de um encontro, quando não está aguardando). */
export function conhecer(e: Estado, id: string): Estado {
  return e.conhecidos.includes(id) ? e : { ...e, conhecidos: [...e.conhecidos, id] }
}

/** Encontro que abre o capítulo atual. Pessoa nova nos caps. 1–3 vale +1 Alcance (L1). */
/** Por que este encontro não vale agora (null = vale). Caps. 1–3 pedem gente nova; o 4, um reencontro (L1). */
export function motivoRecusa(e: Estado, id: string): string | null {
  const conhecido = e.conhecidos.includes(id)
  if (e.cap <= 3 && conhecido) return 'Vocês já se conheceram. Procure alguém novo para esta missão.'
  if (e.cap === 4 && !conhecido) return 'Na Missão 4, reencontre alguém que você já conheceu hoje.'
  return null
}

export function encontrar(e: Estado, id: string): Estado {
  exigir(e, 'aguardando')
  const motivo = motivoRecusa(e, id)
  if (motivo) throw new ErroDeRegra(motivo)
  return {
    ...conhecer(e, id),
    fase: 'encontro',
    encontros: [...e.encontros, id],
    alcance: e.alcance + (e.cap <= 3 ? 1 : 0),
  }
}

export function escolher(e: Estado, op: Opcao): Estado {
  exigir(e, 'encontro')
  return {
    ...e,
    fase: 'consequencia',
    escolhas: [...e.escolhas, op],
    alcance: e.alcance + (op === 'ampla' ? 2 : 0),
    profundidade: e.profundidade + (op === 'profunda' ? 2 : 0),
  }
}

export function avancar(e: Estado): Estado {
  exigir(e, 'consequencia')
  return e.cap >= TOTAL_CAPITULOS ? { ...e, cap: 5, fase: 'final' } : { ...e, cap: e.cap + 1, fase: 'aguardando' }
}

export function finalDe(e: Estado): Final {
  if (e.alcance >= 4 && e.profundidade >= 4) return 'time'
  return e.alcance > e.profundidade ? 'colecionador' : 'amigo'
}

export const amigoAtual = (e: Estado): string | null =>
  e.fase === 'encontro' || e.fase === 'consequencia' ? e.encontros[e.cap - 1] ?? null : null
