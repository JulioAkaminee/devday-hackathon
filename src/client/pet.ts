import * as THREE from 'three'
import type { Acessorio, Especie } from '../shared/story.ts'

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

const mats = new Map<string, THREE.MeshLambertMaterial>()
const mat = (cor: THREE.ColorRepresentation) => {
  const k = new THREE.Color(cor).getHexString()
  if (!mats.has(k)) mats.set(k, new THREE.MeshLambertMaterial({ color: '#' + k }))
  return mats.get(k)!
}
const geo = new THREE.BoxGeometry(1, 1, 1)

/** Bloco de cor sólida: (largura, altura, profundidade) centrado em (x, y, z). */
function bloco(g: THREE.Object3D, cor: THREE.ColorRepresentation, w: number, h: number, d: number, x: number, y: number, z: number, rz = 0) {
  const m = new THREE.Mesh(geo, mat(cor))
  m.scale.set(w, h, d)
  m.position.set(x, y, z)
  m.rotation.z = rz
  g.add(m)
  return m
}

/**
 * Pet em blocos, estilo voxel. Frente = +z. Altura total ~1,3.
 * O corpo fica num subgrupo `corpo` para a animação de quicar não mexer na posição do pet.
 */
export function criarPet(dna: DNA, itens: Itens = { crachas: false, xicara: false, capa: false }) {
  const pet = new THREE.Group()
  const c = pet.userData.corpo = new THREE.Group()
  pet.add(c)
  const cor = new THREE.Color(dna.cor)
  const escuro = cor.clone().multiplyScalar(0.7)
  const claro = cor.clone().lerp(new THREE.Color('#ffffff'), 0.5)
  const olho = '#1b1b2f'

  // sombra falsa
  const sombra = new THREE.Mesh(new THREE.CircleGeometry(0.45, 20), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.18 }))
  sombra.rotation.x = -Math.PI / 2
  sombra.position.y = 0.01
  pet.add(sombra)

  if (dna.especie === 'slime') {
    bloco(c, cor, 0.9, 0.6, 0.9, 0, 0.3, 0)
    bloco(c, cor, 0.7, 0.3, 0.7, 0, 0.72, 0)
    bloco(c, claro, 0.25, 0.15, 0.05, -0.2, 0.55, 0.46)
    bloco(c, olho, 0.12, 0.18, 0.05, -0.18, 0.62, 0.46)
    bloco(c, olho, 0.12, 0.18, 0.05, 0.18, 0.62, 0.46)
    c.userData.topo = 0.87
  } else {
    // pés, corpo, cabeça
    bloco(c, escuro, 0.22, 0.15, 0.3, -0.2, 0.075, 0.05)
    bloco(c, escuro, 0.22, 0.15, 0.3, 0.2, 0.075, 0.05)
    bloco(c, cor, 0.7, 0.5, 0.55, 0, 0.4, 0)
    bloco(c, claro, 0.4, 0.3, 0.05, 0, 0.38, 0.28)
    bloco(c, cor, 0.75, 0.6, 0.65, 0, 0.95, 0.02)
    c.userData.topo = 1.25

    const olhos = (y: number, w = 0.12, h = 0.16) => {
      bloco(c, olho, w, h, 0.05, -0.17, y, 0.36)
      bloco(c, olho, w, h, 0.05, 0.17, y, 0.36)
    }
    switch (dna.especie) {
      case 'gato':
        bloco(c, cor, 0.18, 0.2, 0.15, -0.25, 1.32, 0, Math.PI / 4)
        bloco(c, cor, 0.18, 0.2, 0.15, 0.25, 1.32, 0, Math.PI / 4)
        bloco(c, '#ff8fab', 0.1, 0.06, 0.05, 0, 0.88, 0.36)
        bloco(c, escuro, 0.12, 0.12, 0.5, 0, 0.35, -0.45)
        olhos(1.0)
        break
      case 'cachorro':
        bloco(c, escuro, 0.15, 0.45, 0.3, -0.45, 0.95, 0)
        bloco(c, escuro, 0.15, 0.45, 0.3, 0.45, 0.95, 0)
        bloco(c, claro, 0.35, 0.22, 0.2, 0, 0.85, 0.4)
        bloco(c, olho, 0.12, 0.08, 0.05, 0, 0.92, 0.51)
        bloco(c, escuro, 0.1, 0.1, 0.35, 0, 0.5, -0.4)
        olhos(1.05)
        break
      case 'coruja':
        bloco(c, '#ffffff', 0.26, 0.26, 0.05, -0.17, 1.0, 0.35)
        bloco(c, '#ffffff', 0.26, 0.26, 0.05, 0.17, 1.0, 0.35)
        bloco(c, '#ffa94d', 0.1, 0.12, 0.12, 0, 0.85, 0.4)
        bloco(c, escuro, 0.12, 0.4, 0.4, -0.42, 0.45, 0)
        bloco(c, escuro, 0.12, 0.4, 0.4, 0.42, 0.45, 0)
        bloco(c, escuro, 0.15, 0.15, 0.1, -0.28, 1.3, 0)
        bloco(c, escuro, 0.15, 0.15, 0.1, 0.28, 1.3, 0)
        bloco(c, olho, 0.1, 0.1, 0.05, -0.17, 1.0, 0.38)
        bloco(c, olho, 0.1, 0.1, 0.05, 0.17, 1.0, 0.38)
        break
      case 'dragao':
        bloco(c, '#ffe066', 0.1, 0.25, 0.1, -0.22, 1.35, -0.05)
        bloco(c, '#ffe066', 0.1, 0.25, 0.1, 0.22, 1.35, -0.05)
        bloco(c, claro, 0.4, 0.2, 0.2, 0, 0.85, 0.4)
        bloco(c, escuro, 0.18, 0.18, 0.6, 0, 0.3, -0.5)
        bloco(c, escuro, 0.1, 0.15, 0.1, 0, 0.7, -0.3)
        bloco(c, escuro, 0.35, 0.3, 0.05, -0.4, 0.6, -0.25, 0.4)
        bloco(c, escuro, 0.35, 0.3, 0.05, 0.4, 0.6, -0.25, -0.4)
        olhos(1.05)
        break
      case 'robo':
        bloco(c, '#adb5bd', 0.05, 0.25, 0.05, 0, 1.38, 0)
        bloco(c, '#ff6b6b', 0.12, 0.12, 0.12, 0, 1.52, 0)
        bloco(c, '#1b1b2f', 0.55, 0.25, 0.05, 0, 1.0, 0.35)
        bloco(c, '#66d9e8', 0.12, 0.1, 0.06, -0.14, 1.0, 0.36)
        bloco(c, '#66d9e8', 0.12, 0.1, 0.06, 0.14, 1.0, 0.36)
        bloco(c, '#adb5bd', 0.12, 0.35, 0.15, -0.45, 0.45, 0)
        bloco(c, '#adb5bd', 0.12, 0.35, 0.15, 0.45, 0.45, 0)
        c.userData.topo = 1.6
        break
    }
  }

  const topo: number = c.userData.topo
  switch (dna.acessorio) {
    case 'chapeu':
      bloco(c, '#212529', 0.6, 0.05, 0.55, 0, topo + 0.03, 0)
      bloco(c, '#212529', 0.38, 0.32, 0.38, 0, topo + 0.2, 0)
      bloco(c, '#e03131', 0.39, 0.06, 0.39, 0, topo + 0.08, 0)
      break
    case 'laco':
      bloco(c, '#f03e3e', 0.18, 0.16, 0.08, -0.12, topo + 0.02, 0.15, 0.3)
      bloco(c, '#f03e3e', 0.18, 0.16, 0.08, 0.12, topo + 0.02, 0.15, -0.3)
      bloco(c, '#c92a2a', 0.08, 0.08, 0.09, 0, topo + 0.02, 0.15)
      break
    case 'oculos': {
      const y = dna.especie === 'slime' ? 0.62 : 1.0
      const z = dna.especie === 'slime' ? 0.49 : 0.4
      bloco(c, '#212529', 0.24, 0.2, 0.03, -0.17, y, z)
      bloco(c, '#212529', 0.24, 0.2, 0.03, 0.17, y, z)
      bloco(c, '#212529', 0.12, 0.04, 0.03, 0, y + 0.04, z)
      break
    }
  }

  // Itens das barras (QUEBRA-GELO.md, seção 3)
  if (itens.capa) {
    bloco(c, '#7048e8', 0.65, 0.6, 0.05, 0, 0.5, -0.32)
  }
  if (itens.crachas) {
    bloco(c, '#ffffff', 0.18, 0.22, 0.03, -0.15, 0.42, 0.3)
    bloco(c, '#4dabf7', 0.18, 0.06, 0.035, -0.15, 0.5, 0.3)
    bloco(c, '#ffffff', 0.18, 0.22, 0.03, 0.12, 0.36, 0.3, 0.2)
    bloco(c, '#ff922b', 0.18, 0.06, 0.035, 0.12, 0.44, 0.3, 0.2)
  }
  if (itens.xicara) {
    bloco(c, '#f8f9fa', 0.16, 0.18, 0.16, 0.5, 0.45, 0.15)
    bloco(c, '#7c4a1e', 0.13, 0.03, 0.13, 0.5, 0.54, 0.15)
  }
  return pet
}

export const itensDe = (alcance: number, profundidade: number): Itens => ({
  crachas: alcance >= 4,
  xicara: profundidade >= 4,
  capa: alcance >= 4 && profundidade >= 4,
})
