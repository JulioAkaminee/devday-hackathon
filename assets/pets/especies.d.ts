// Tipos de especies.js, para o jogo (TypeScript) importar os pets.

export interface ParteDados {
  nome: string
  tipo: 'corpo' | 'braco' | 'perna' | 'item' | 'flutuante'
  pai: string
  pivo: number[]
  lado?: 'E' | 'D'
  levantar?: number
  voxels: number[][]
}

export interface DadosPet {
  id: string
  versao: number
  numero: number
  nome: string
  personalidade: string
  animacao: string
  pose: Record<string, number>
  escala: number
  paleta: string[]
  limites: { min: number[]; max: number[] }
  tamanho: number[]
  totalVoxels: number
  partes: ParteDados[]
  decalques?: unknown[]
  hastes?: unknown[]
  ancoras: Record<string, number[]>
}

export interface OpcoesPet {
  acessorio?: string
  itens?: { crachas?: boolean; xicara?: boolean; capa?: boolean }
}

export const ESCALA: number
export const CORES: Record<string, string>
export const PETS: { id: string; numero: number; nome: string; personalidade: string; animacao: string }[]
export function gerarPet(id: string, opcoes?: OpcoesPet): DadosPet
