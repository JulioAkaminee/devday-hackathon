import * as THREE from 'three'
import type { Acessorio, Especie } from '../shared/story.ts'

// Pets do evento em voxel, fiéis a docs/referencias/pets-do-evento-v1.png.
// Contrato (docs/PLANO.md §3): criarPet(dna, itens) → THREE.Group com userData.corpo (grupo que quica).
// Altura ~1,3–1,5, frente em +z. Cada pet é uma grade de cubinhos; só os cubos da superfície são desenhados.

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

const U = 0.06 // tamanho de um voxel
const PRETO = '#1b1b1b'
const BRANCO = '#f7f7f2'
const BOCHECHA = '#ff8fab'
const LINGUA = '#ff5c7a'
const VERDE = '#1fbf5f'
const VERDE_ESCURO = '#16934a'

/** Grade de voxels: chave "x,y,z" → cor. x centrado, y para cima a partir do chão, z para a frente. */
class Voxels {
  m = new Map<string, string>()
  private k = (x: number, y: number, z: number) => `${x},${y},${z}`
  set(x: number, y: number, z: number, cor: string) { this.m.set(this.k(x, y, z), cor) }
  tem(x: number, y: number, z: number) { return this.m.has(this.k(x, y, z)) }
  apagar(x: number, y: number, z: number) { this.m.delete(this.k(x, y, z)) }
  /** Caixa cheia, limites inclusivos. */
  caixa(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, cor: string) {
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) this.set(x, y, z, cor)
  }
  /** Preenche onde f(x,y,z) devolve uma cor, dentro dos limites. */
  forma(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, f: (x: number, y: number, z: number) => string | null) {
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
      const c = f(x, y, z)
      if (c) this.set(x, y, z, c)
    }
  }
  /** z da superfície da frente na coluna (x, y), ou null. */
  frente(x: number, y: number) {
    for (let z = 30; z >= -30; z--) if (this.tem(x, y, z)) return z
    return null
  }
  /** Pinta a superfície da frente (rosto, desenhos). */
  pintar(x: number, y: number, cor: string) {
    const z = this.frente(x, y)
    if (z !== null) this.set(x, y, z, cor)
  }
  /** Acrescenta um voxel à frente da superfície (óculos, crachás). */
  colar(x: number, y: number, cor: string, sobre = 1) {
    const z = this.frente(x, y)
    if (z !== null) this.set(x, y, z + sobre, cor)
  }
  /** Maior y ocupado (para chapéus). */
  topo() {
    let t = 0
    for (const k of this.m.keys()) t = Math.max(t, Number(k.split(',')[1]))
    return t
  }
  /** Menor z ocupado na altura y (para mochilas). */
  costas(y: number) {
    let z = 0
    for (const k of this.m.keys()) {
      const [, yy, zz] = k.split(',').map(Number)
      if (yy === y) z = Math.min(z, zz)
    }
    return z
  }
}

// ---------- partes comuns ----------

const pernas = (v: Voxels, cor: string, x = 3) => {
  v.caixa(-x - 1, 0, -1, -x + 1, 2, 1, cor)
  v.caixa(x - 1, 0, -1, x + 1, 2, 1, cor)
}
const braco = (v: Voxels, x: number, y: number, cor: string, acenando = false) => {
  const s = Math.sign(x)
  v.caixa(x, y, -1, x + s, y + 1, 0, cor)
  if (acenando) { v.caixa(x + s, y + 2, -1, x + 2 * s, y + 4, 0, cor); v.caixa(x + 2 * s, y + 5, -1, x + 2 * s, y + 5, 0, cor) }
  else v.caixa(x + s, y - 2, -1, x + s, y - 1, 0, cor)
}
const olhosAltos = (v: Voxels, y: number, abertura = 3, cor = PRETO) => {
  for (const s of [-1, 1]) for (let dy = 0; dy < 3; dy++) { v.pintar(s * abertura, y + dy, cor); v.pintar(s * abertura + s, y + dy, cor) }
}
const olhosFelizes = (v: Voxels, y: number, abertura = 3, cor = PRETO) => {
  // "^ ^"
  for (const s of [-1, 1]) {
    v.pintar(s * (abertura - 1), y, cor); v.pintar(s * abertura, y + 1, cor); v.pintar(s * (abertura + 1), y, cor)
  }
}
const bochechas = (v: Voxels, y: number, x = 5) => {
  for (const s of [-1, 1]) { v.pintar(s * x, y, BOCHECHA); v.pintar(s * (x + 1), y, BOCHECHA) }
}
const sorriso = (v: Voxels, y: number) => {
  v.pintar(-2, y + 1, PRETO); v.pintar(2, y + 1, PRETO)
  for (let x = -1; x <= 1; x++) v.pintar(x, y, PRETO)
}
const bocaAberta = (v: Voxels, y: number) => {
  for (let x = -1; x <= 1; x++) { v.pintar(x, y + 1, PRETO); v.pintar(x, y, x === 0 ? LINGUA : PRETO) }
}
const mochila = (v: Voxels, y0: number, y1: number, larg = 4) => {
  const z = v.costas(Math.round((y0 + y1) / 2))
  v.caixa(-larg, y0, z - 3, larg, y1, z - 1, PRETO)
  v.caixa(-larg + 1, y0 + 1, z - 4, larg - 1, y0 + 3, z - 4, '#333333')
}

// ---------- os 10 pets ----------

type Montagem = { olhos: number } // altura dos olhos, para os óculos

const PETS: Record<Especie, (v: Voxels) => Montagem> = {
  xicara(v) {
    pernas(v, PRETO)
    v.caixa(-6, 3, -6, 6, 15, 6, BRANCO)
    v.caixa(-5, 15, -5, 5, 15, 5, '#5b3417') // café
    v.caixa(-6, 3, -6, 6, 6, 6, VERDE) // blusinha
    for (const [x, y] of [[-1, 4], [0, 5], [1, 4]]) v.pintar(x, y, BRANCO) // selo </>
    // alça
    v.caixa(-9, 7, -1, -7, 7, 1, VERDE); v.caixa(-9, 13, -1, -7, 13, 1, VERDE); v.caixa(-10, 7, -1, -9, 13, 1, VERDE)
    for (const [x, y] of [[0, 17], [1, 18], [0, 19], [-1, 20]]) v.set(x, y, 0, '#e8e8e8') // vapor
    braco(v, 7, 7, VERDE, true)
    olhosFelizes(v, 11); bochechas(v, 9); bocaAberta(v, 8)
    return { olhos: 11 }
  },
  caderninho(v) {
    pernas(v, '#1c5fd6')
    v.caixa(-6, 3, -2, 6, 20, 2, '#2f7bf5')
    v.caixa(-5, 19, -1, 6, 20, 1, BRANCO) // páginas
    v.caixa(6, 4, -1, 6, 19, 1, BRANCO)
    for (let y = 4; y <= 19; y += 2) v.caixa(-8, y, -1, -7, y, 1, PRETO) // espiral
    v.caixa(-2, 5, 3, 2, 8, 3, BRANCO) // etiqueta
    // caneta verde na mão
    for (let i = 0; i < 9; i++) v.set(9, 8 + i, 1 + (i > 6 ? 1 : 0), i < 2 ? '#0f5c2e' : VERDE)
    braco(v, 7, 9, '#2f7bf5')
    braco(v, -9, 9, '#2f7bf5')
    olhosAltos(v, 13); bochechas(v, 12); sorriso(v, 11)
    return { olhos: 14 }
  },
  laptopinho(v) {
    pernas(v, PRETO, 4)
    v.caixa(-8, 3, -1, 8, 4, 9, '#d4d4d4') // base
    for (let x = -6; x <= 6; x += 2) for (let z = 1; z <= 7; z += 2) v.set(x, 5, z, '#3a3a3a') // teclado
    v.caixa(-8, 5, -3, 8, 19, -2, '#d4d4d4') // tampa
    v.caixa(-7, 6, -1, 7, 18, -1, '#111111') // tela
    for (const s of [-1, 1]) { v.set(s * 3 - 1, 12, 0, VERDE); v.set(s * 3, 13, 0, VERDE); v.set(s * 3 + 1, 12, 0, VERDE) }
    v.set(7, 19, -1, VERDE) // luzinha
    braco(v, 9, 5, '#d4d4d4'); braco(v, -9, 5, '#d4d4d4')
    return { olhos: 12 }
  },
  plantinha(v) {
    pernas(v, VERDE)
    v.forma(-6, 3, -6, 6, 13, 6, (x, _y, z) => (Math.abs(x) === 6 && Math.abs(z) === 6 ? null : BRANCO)) // vaso
    // folhagem: bolhas de verde
    for (const [cx, cy, cz, r] of [[0, 18, 0, 5], [-4, 16, 2, 3.5], [4, 17, -1, 3.5], [2, 22, 1, 3], [-2, 21, -2, 3], [0, 25, 0, 2]]) {
      v.forma(cx - 6, cy - 6, cz - 6, cx + 6, cy + 6, cz + 6, (x, y, z) => {
        const d = Math.hypot(x - cx, (y - cy) * 1.1, z - cz)
        return d <= r ? ((x * 7 + y * 3 + z * 5) % 4 === 0 ? VERDE_ESCURO : VERDE) : null
      })
    }
    mochila(v, 5, 12, 4)
    braco(v, 7, 7, BRANCO); braco(v, -7, 7, BRANCO)
    olhosAltos(v, 8); bochechas(v, 7); sorriso(v, 6)
    return { olhos: 9 }
  },
  lampada(v) {
    pernas(v, '#e0b000')
    v.caixa(-4, 3, -4, 4, 8, 4, '#3d3d3d') // rosca
    for (let y = 4; y <= 8; y += 2) v.caixa(-5, y, -5, 5, y, 5, '#555555')
    v.forma(-8, 9, -8, 8, 23, 8, (x, y, z) => {
      const d = Math.hypot(x, (y - 15) * 1.05, z)
      return d <= 8 && (y >= 9 || Math.hypot(x, z) <= 6) ? (y > 19 && x < -2 ? '#fff3a3' : '#ffd60a') : null
    })
    for (const [x, y] of [[-10, 20], [10, 19], [7, 25], [-6, 25], [0, 27]]) v.set(x, y, 0, '#ffd60a') // brilhos
    braco(v, 9, 12, '#ffd60a'); braco(v, -9, 12, '#ffd60a')
    olhosAltos(v, 13)
    return { olhos: 14 }
  },
  coracao(v) {
    pernas(v, '#d81b6a')
    // coração implícito (x²+y²−1)³ − x²y³ ≤ 0, extrudado com bordas arredondadas
    v.forma(-9, 3, -4, 9, 19, 4, (x, y, z) => {
      const X = x / 7.5, Y = (y - 12) / 7.5
      const h = (X * X + Y * Y - 1) ** 3 - X * X * Y ** 3
      if (h > 0) return null
      return Math.abs(z) <= 4 - (h > -0.05 ? 2 : h > -0.2 ? 1 : 0) ? (y < 8 ? '#e8317a' : '#ff3d8b') : null
    })
    braco(v, 9, 9, '#ff3d8b'); braco(v, -9, 9, '#ff3d8b')
    // óculos redondos fazem parte do personagem
    for (const s of [-1, 1]) for (let x = 1; x <= 4; x++) for (let y = 12; y <= 15; y++) if (!((x === 1 || x === 4) && (y === 12 || y === 15))) v.colar(s * x + (s < 0 ? 0 : 0), y, PRETO)
    v.colar(0, 14, PRETO)
    sorriso(v, 9)
    return { olhos: 13 }
  },
  globinho(v) {
    pernas(v, '#4a5568')
    v.forma(-8, 3, -8, 8, 19, 8, (x, y, z) => {
      if (Math.hypot(x, y - 11, z) > 8.2) return null
      const terra = Math.sin(x * 0.55 + z * 0.3) + Math.cos(y * 0.6 - z * 0.4) + Math.sin((x + y) * 0.35) > 1.1
      return terra ? VERDE : '#2f7bf5'
    })
    mochila(v, 6, 15, 5)
    braco(v, 9, 10, VERDE, true); braco(v, -9, 10, VERDE)
    // rosto em área azul limpa
    for (let x = -5; x <= 5; x++) for (let y = 7; y <= 14; y++) v.pintar(x, y, '#2f7bf5')
    olhosFelizes(v, 12); bochechas(v, 10); bocaAberta(v, 8)
    return { olhos: 12 }
  },
  estrelinha(v) {
    pernas(v, '#e0b000', 4)
    // estrela de 5 pontas: polígono no plano xy
    const pts: [number, number][] = []
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 2 + (i * Math.PI) / 5
      const r = i % 2 ? 4.2 : 10
      pts.push([Math.cos(a) * r, Math.sin(a) * r + 12])
    }
    const dentro = (x: number, y: number) => {
      let c = false
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j]
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c
      }
      return c
    }
    v.forma(-10, 2, -3, 10, 22, 3, (x, y, z) => (dentro(x, y) && (Math.abs(z) < 3 || dentro(x * 1.15, (y - 12) * 1.15 + 12)) ? '#ffd60a' : null))
    mochila(v, 7, 14, 4)
    olhosFelizes(v, 13); bochechas(v, 11, 4); bocaAberta(v, 9)
    return { olhos: 13 }
  },
  conezinho(v) {
    pernas(v, '#c92a2a')
    v.caixa(-9, 3, -9, 9, 4, 9, '#ff4d3d') // base
    for (let y = 5; y <= 22; y++) {
      const r = Math.round(7 - (y - 5) * 0.36)
      const listra = y >= 11 && y <= 13 ? BRANCO : y >= 17 && y <= 19 ? BRANCO : '#ff4d3d'
      v.forma(-r, y, -r, r, y, r, (x, _y, z) => (Math.hypot(x, z) <= r + 0.5 ? listra : null))
    }
    mochila(v, 6, 12, 4)
    braco(v, 7, 8, '#ff4d3d'); braco(v, -7, 8, '#ff4d3d')
    olhosAltos(v, 7, 2); bochechas(v, 6, 4)
    return { olhos: 8 }
  },
  nuvem(v) {
    pernas(v, '#1c5fd6')
    for (const [cx, cy, r] of [[0, 12, 6], [-5, 9, 4.5], [5, 10, 5], [-8, 7, 3], [8, 7, 3], [-2, 15, 4.5], [3, 15, 4]]) {
      v.forma(cx - 7, cy - 7, -6, cx + 7, cy + 7, 6, (x, y, z) => (Math.hypot(x - cx, y - cy, z * 1.3) <= r && y >= 3 ? '#3d8bff' : null))
    }
    v.caixa(-9, 3, -4, 9, 6, 4, '#3d8bff')
    mochila(v, 6, 13, 5)
    olhosAltos(v, 11)
    return { olhos: 12 }
  },
}

// ---------- montagem ----------

const geo = new THREE.BoxGeometry(U, U, U)
const material = new THREE.MeshLambertMaterial()

function malha(v: Voxels) {
  // só voxels com algum vizinho vazio aparecem
  const visiveis: [number, number, number, string][] = []
  for (const [k, cor] of v.m) {
    const [x, y, z] = k.split(',').map(Number)
    if (!v.tem(x + 1, y, z) || !v.tem(x - 1, y, z) || !v.tem(x, y + 1, z) || !v.tem(x, y - 1, z) || !v.tem(x, y, z + 1) || !v.tem(x, y, z - 1)) {
      visiveis.push([x, y, z, cor])
    }
  }
  const m = new THREE.InstancedMesh(geo, material, visiveis.length)
  const t = new THREE.Matrix4()
  const c = new THREE.Color()
  visiveis.forEach(([x, y, z, cor], i) => {
    t.makeTranslation(x * U, y * U + U / 2, z * U)
    m.setMatrixAt(i, t)
    // variação leve de tom: dá o aspecto de cubinhos da referência
    const ruido = ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) & 7
    m.setColorAt(i, c.set(cor).multiplyScalar(0.94 + ruido * 0.012))
  })
  return m
}

const cache = new Map<string, Voxels>()

export function criarPet(dna: DNA, itens: Itens = { crachas: false, xicara: false, capa: false }) {
  const chave = JSON.stringify([dna.especie, dna.acessorio, itens])
  let v = cache.get(chave)
  if (!v) {
    v = new Voxels()
    const { olhos } = PETS[dna.especie](v)
    const topo = v.topo()
    if (dna.acessorio === 'boina') {
      v.forma(-6, topo + 1, -6, 6, topo + 2, 6, (x, y, z) => (Math.hypot(x + 1, z) <= (y === topo + 1 ? 6 : 5) ? PRETO : null))
      v.set(0, topo + 3, 0, PRETO)
    } else if (dna.acessorio === 'oculos') {
      for (const s of [-1, 1]) for (let x = 1; x <= 4; x++) for (let y = olhos - 1; y <= olhos + 2; y++) v.colar(s * x, y, PRETO)
      v.colar(0, olhos + 1, PRETO)
    } else if (dna.acessorio === 'mochila') {
      mochila(v, 5, 12, 4)
    }
    // itens das barras (QUEBRA-GELO.md, seção 3)
    if (itens.crachas) for (const [x, y, cor] of [[-4, 5, BRANCO], [-4, 6, VERDE], [4, 4, BRANCO], [4, 5, PRETO]] as const) v.colar(x, y, cor)
    if (itens.xicara) { v.caixa(10, 6, 1, 12, 9, 3, BRANCO); v.caixa(11, 9, 2, 11, 9, 2, '#5b3417') }
    if (itens.capa) { const z = v.costas(8); v.caixa(-5, 4, z - 1, 5, 13, z - 1, VERDE) }
    cache.set(chave, v)
  }

  const pet = new THREE.Group()
  const corpo = new THREE.Group()
  corpo.add(malha(v))
  pet.add(corpo)
  pet.userData.corpo = corpo

  const sombra = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.18 }))
  sombra.rotation.x = -Math.PI / 2
  sombra.position.y = 0.01
  pet.add(sombra)
  return pet
}

export const itensDe = (alcance: number, profundidade: number): Itens => ({
  crachas: alcance >= 4,
  xicara: profundidade >= 4,
  capa: alcance >= 4 && profundidade >= 4,
})
