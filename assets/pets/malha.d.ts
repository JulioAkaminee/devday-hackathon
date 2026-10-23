// Tipos de malha.js, para o jogo (TypeScript) montar e animar os pets.
import type * as THREE from 'three'
import type { DadosPet, ParteDados } from './especies.js'

export type Animacao = 'parado' | 'andar' | 'pular' | 'acenar' | 'comemorar'

export interface Pet3D {
  raiz: THREE.Group
  grupos: Record<string, THREE.Group>
  partes: Record<string, ParteDados>
  dados: DadosPet
}

export const ANIMACOES: Record<Animacao, string>
export const ACESSORIOS: string[]
export function criarPet3D(dados: DadosPet): Pet3D
export function animarPet(pet: Pet3D, t: number, animacao?: string): void
export function descartarPet(pet: Pet3D): void
export function mostrarParte(pet: Pet3D, nome: string, visivel: boolean): void
export function criarEstudio(opcoes?: { sombra?: boolean }): THREE.Scene
export function enquadrar(camera: THREE.PerspectiveCamera, pet: Pet3D, opcoes?: { azimute?: number; elevacao?: number; margem?: number }): THREE.Vector3
export function configurarRenderizador(renderizador: THREE.WebGLRenderer): THREE.WebGLRenderer
