import * as THREE from 'three'
import type { Acessorio, Especie } from '../shared/story.ts'
import { gerarPet, type DadosPet } from '../../assets/pets/especies.js'
import { animarPet, criarPet3D, type Animacao, type Pet3D } from '../../assets/pets/malha.js'

// Os pets do jogo são os mascotes de assets/pets (fonte única, a mesma da galeria), fiéis a
// docs/referencias/pets-do-evento-v1.png: cubos grandes, mochila com a logo da OpenAI, braços e
// pernas animáveis. Este arquivo só adapta ao contrato do jogo (docs/PLANO.md §3):
// criarPet(dna, itens) → THREE.Group com userData.corpo (grupo que quica), frente em +z.
// Para mudar um pet, mexa em assets/pets/especies.js e confira em assets/pets/index.html.

export type { Animacao }

export interface DNA {
  especie: Especie
  cor: string
  acessorio: Acessorio
}
export interface Itens {
  crachas: boolean
  xicara: boolean
  capa: boolean
}

const SEM_ITENS: Itens = { crachas: false, xicara: false, capa: false }
const U = 0.062 // tamanho de um voxel no mundo: os pets ficam com 1,2 a 1,5 de altura

// Um molde por espécie + acessório + itens. Cada pet é uma cópia que compartilha geometria e
// material com o molde: o mundo pode remontar o mapa a cada 2 s sem alocar nada na GPU.
const moldes = new Map<string, Pet3D>()
function molde(dna: DNA, itens: Itens) {
  const chave = [dna.especie, dna.acessorio, itens.crachas, itens.xicara, itens.capa].join('|')
  let m = moldes.get(chave)
  if (!m) {
    const dados: DadosPet = gerarPet(dna.especie, { acessorio: dna.acessorio, itens })
    m = criarPet3D(dados)
    moldes.set(chave, m)
  }
  return m
}

function copiar(m: Pet3D): Pet3D {
  const raiz = m.raiz.clone()
  const grupos: Record<string, THREE.Group> = { raiz: raiz.children[0] as THREE.Group }
  raiz.traverse((o) => {
    if (o !== raiz && o.name && m.grupos[o.name]) grupos[o.name] = o as THREE.Group
  })
  return { raiz, grupos, partes: m.partes, dados: m.dados }
}

const geoSombra = new THREE.CircleGeometry(0.5, 20)
const matSombra = new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.18 })

export function criarPet(dna: DNA, itens: Itens = SEM_ITENS) {
  const mascote = copiar(molde(dna, itens))
  mascote.raiz.scale.setScalar(U)

  const pet = new THREE.Group()
  const corpo = new THREE.Group()
  corpo.add(mascote.raiz)
  pet.add(corpo)
  pet.userData.corpo = corpo
  pet.userData.mascote = mascote

  const sombra = new THREE.Mesh(geoSombra, matSombra)
  sombra.rotation.x = -Math.PI / 2
  sombra.position.y = 0.01
  pet.add(sombra)
  return pet
}

/**
 * Anima braços, pernas e acessórios (parado, andar, pular, acenar, comemorar). O quique e o giro do
 * pet inteiro continuam com quem chama, em userData.corpo e no próprio grupo.
 */
export function animarMascote(pet: THREE.Object3D, t: number, animacao?: Animacao) {
  const mascote = pet.userData.mascote as Pet3D | undefined
  if (mascote) animarPet(mascote, t, animacao ?? mascote.dados.animacao)
}

// Retrato 2D do pet (avatar do cabeçalho, listas, criação): um renderer pequeno compartilhado
let fotografo: THREE.WebGLRenderer | null = null
const fotos = new Map<string, string>()
export function retrato(dna: DNA): string {
  const k = dna.especie + '|' + dna.acessorio
  if (fotos.has(k)) return fotos.get(k)!
  fotografo ??= new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
  fotografo.setSize(160, 160, false)
  const cena = new THREE.Scene()
  cena.add(new THREE.HemisphereLight('#ffffff', '#b8a98c', 2.3))
  const sol = new THREE.DirectionalLight('#ffffff', 1.5)
  sol.position.set(3, 6, 8)
  const pet = criarPet(dna)
  pet.children[1].visible = false // sem sombra no retrato
  animarMascote(pet, 0.35, 'parado')
  pet.rotation.y = 0.35
  cena.add(sol, pet)
  const caixa = new THREE.Box3().setFromObject(pet)
  const c = caixa.getCenter(new THREE.Vector3())
  const t = caixa.getSize(new THREE.Vector3()).length()
  const cam = new THREE.PerspectiveCamera(30, 1, 0.01, 50)
  cam.position.set(c.x + t * 0.5, c.y + t * 0.35, c.z + t * 1.75)
  cam.lookAt(c)
  fotografo.render(cena, cam)
  fotos.set(k, fotografo.domElement.toDataURL())
  return fotos.get(k)!
}

export const itensDe = (alcance: number, profundidade: number): Itens => ({
  crachas: alcance >= 4,
  xicara: profundidade >= 4,
  capa: alcance >= 4 && profundidade >= 4,
})
