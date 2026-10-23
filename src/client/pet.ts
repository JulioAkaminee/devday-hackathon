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
const VERDE = '#22b04b' // verde do banner do evento
const VERDE_ESCURO = '#178a3a'
const AZUL = '#2f7bf5'
const AMARELO = '#ffd60a'
const ROSA = '#ff3d8b'
const LARANJA = '#ff5a1f'

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
  /** Preenche onde f(x,y,z) devolve uma cor, dentro dos limites (arredondados para a grade). */
  forma(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, f: (x: number, y: number, z: number) => string | null) {
    const r = Math.round
    for (let x = r(x0); x <= r(x1); x++) for (let y = r(y0); y <= r(y1); y++) for (let z = r(z0); z <= r(z1); z++) {
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
const boina = (v: Voxels) => {
  // pousa na camada cheia mais alta do miolo (ignora vapor e brilhos soltos)
  let t = v.topo()
  const cheia = (y: number) => {
    let n = 0
    for (let x = -4; x <= 4; x++) for (let z = -4; z <= 4; z++) if (v.tem(x, y, z)) n++
    return n >= 6
  }
  while (t > 0 && !cheia(t)) t--
  v.forma(-7, t + 1, -7, 7, t + 2, 7, (x, y, z) => (Math.hypot(x + 1, z) <= (y === t + 1 ? 6.5 : 5.5) ? PRETO : null))
  v.set(0, t + 3, 0, PRETO)
}

// ---------- os 10 pets ----------

// olhos: altura dos olhos (para os óculos); tem: acessórios que já fazem parte do pet e não duplicam
type Montagem = { olhos: number; tem?: Acessorio[] }

const PETS: Record<Especie, (v: Voxels) => Montagem> = {
  xicara(v) {
    pernas(v, PRETO)
    v.caixa(-6, 3, -5, 6, 17, 5, BRANCO)
    v.caixa(-5, 17, -4, 5, 17, 4, '#5b3417') // café
    v.caixa(-6, 3, -5, 6, 8, 5, VERDE) // blusinha
    // selo </> no peito
    for (let x = -4; x <= 4; x++) for (let y = 3; y <= 7; y++) v.colar(x, y, BRANCO)
    for (const [x, y] of [[-2, 6], [-3, 5], [-2, 4], [1, 6], [0, 5], [-1, 4], [2, 6], [3, 5], [2, 4]]) v.pintar(x, y, PRETO)
    // alça
    v.caixa(-9, 8, -1, -7, 8, 1, VERDE); v.caixa(-9, 15, -1, -7, 15, 1, VERDE); v.caixa(-10, 8, -1, -9, 15, 1, VERDE)
    for (const [x, y] of [[0, 19], [0, 20], [-1, 21], [1, 21], [0, 22]]) v.set(x, y, 0, '#e4e4de') // vapor
    braco(v, 7, 9, VERDE, true); braco(v, -7, 5, VERDE)
    olhosFelizes(v, 13); bochechas(v, 11, 5); bocaAberta(v, 9)
    return { olhos: 13 }
  },
  caderninho(v) {
    pernas(v, '#1c5fd6')
    v.caixa(-6, 3, 3, 6, 20, 3, AZUL) // capa
    v.caixa(-6, 3, -3, 6, 20, -3, AZUL) // contracapa
    v.caixa(-6, 3, -3, -6, 20, 3, AZUL) // lombada
    v.caixa(-5, 4, -2, 5, 19, 2, BRANCO) // páginas
    for (let y = 5; y <= 17; y += 3) v.caixa(-8, y, -1, -7, y + 1, 1, PRETO) // espiral
    // caneta verde na mão erguida
    braco(v, 7, 9, AZUL, true)
    for (let i = 0; i < 9; i++) for (const z of [1, 2]) v.set(10 + Math.floor(i / 3), 9 + i, z, i < 1 ? PRETO : i > 6 ? VERDE_ESCURO : VERDE)
    olhosAltos(v, 13, 2); bochechas(v, 12, 4); bocaAberta(v, 10)
    return { olhos: 14 }
  },
  laptopinho(v) {
    pernas(v, PRETO, 4)
    v.caixa(-8, 3, -1, 8, 4, 9, '#e2e2e2') // base
    for (let x = -6; x <= 6; x += 2) for (let z = 1; z <= 7; z += 2) v.set(x, 5, z, '#2b2b2b') // teclado
    v.caixa(-8, 5, -3, 8, 20, -2, '#e2e2e2') // tampa
    v.caixa(-7, 7, -1, 7, 19, -1, '#111111') // tela
    // olhos ^ ^ verdes na tela
    for (const c of [-4, 4]) for (const [x, y] of [[-2, 13], [-2, 14], [-1, 15], [0, 15], [1, 15], [2, 14], [2, 13]]) v.set(c + x, y, 0, VERDE)
    v.set(7, 20, -1, VERDE) // luzinha
    braco(v, 9, 4, '#e2e2e2'); braco(v, -9, 4, '#e2e2e2')
    return { olhos: 13 }
  },
  plantinha(v) {
    pernas(v, VERDE)
    v.forma(-6, 3, -6, 6, 12, 6, (x, _y, z) => (Math.abs(x) === 6 && Math.abs(z) === 6 ? null : BRANCO)) // vaso
    // folhas pontudas: losangos ao longo de uma direção, saindo do vaso
    for (const [dx, dy, dz, L] of [[0, 1, 0, 12], [-0.6, 0.8, 0.2, 11], [0.6, 0.8, -0.1, 11], [0.1, 0.7, 0.7, 9], [-0.1, 0.7, -0.7, 9], [-0.9, 0.45, 0.1, 9], [0.9, 0.45, 0.2, 9]]) {
      const n = Math.hypot(dx, dy, dz)
      v.forma(-12, 12, -12, 12, 26, 12, (x, y, z) => {
        const t = (x * dx + (y - 12) * dy + z * dz) / n / L
        if (t < 0 || t > 1) return null
        const d = Math.hypot(x - (dx / n) * t * L, y - 12 - (dy / n) * t * L, z - (dz / n) * t * L)
        return d <= Math.sin(Math.PI * t) ** 0.7 * 3.4 + 0.3 ? (d < 0.7 ? VERDE_ESCURO : VERDE) : null
      })
    }
    mochila(v, 4, 11, 4)
    braco(v, 7, 7, VERDE); braco(v, -7, 7, VERDE)
    olhosAltos(v, 8); bochechas(v, 7, 4); sorriso(v, 6)
    return { olhos: 9, tem: ['mochila'] }
  },
  lampada(v) {
    pernas(v, '#f2c200')
    v.caixa(-4, 3, -4, 4, 8, 4, '#2a2a2a') // rosca
    for (let y = 4; y <= 8; y += 2) v.caixa(-5, y, -5, 5, y, 5, '#3d3d3d')
    v.forma(-8, 9, -8, 8, 23, 8, (x, y, z) => {
      const d = Math.hypot(x, (y - 15) * 1.05, z)
      return d <= 8 && (y >= 9 || Math.hypot(x, z) <= 6) ? AMARELO : null
    })
    for (const [x, y] of [[-4, 20], [-3, 20], [-4, 19]]) v.pintar(x, y, '#fff6c2') // reflexo
    for (const [x, y] of [[-10, 19], [10, 20], [11, 21], [7, 25], [-6, 25], [0, 27]]) v.set(x, y, 0, AMARELO) // brilhos
    braco(v, 8, 10, AMARELO); braco(v, -8, 10, AMARELO)
    olhosAltos(v, 13, 3)
    return { olhos: 14 }
  },
  coracao(v) {
    pernas(v, '#e8317a', 2)
    // dois lobos + ponta truncada; a espessura cresce longe da borda (bordas arredondadas)
    const dentro = (x: number, y: number) =>
      Math.hypot(x - 4.5, y - 14) <= 5 || Math.hypot(x + 4.5, y - 14) <= 5 || (y >= 3 && y <= 14 && Math.abs(x) <= 1.5 + (y - 3) * 0.72)
    const cheio = (x: number, y: number, r: number) => dentro(x + r, y) && dentro(x - r, y) && dentro(x, y + r) && dentro(x, y - r)
    v.forma(-10, 3, -5, 10, 19, 5, (x, y, z) => {
      if (!dentro(x, y)) return null
      const t = 2 + [1, 2, 3].filter((r) => cheio(x, y, r)).length
      return Math.abs(z) <= t ? ROSA : null
    })
    braco(v, 9, 11, ROSA); braco(v, -9, 11, ROSA)
    // óculos escuros redondos fazem parte do personagem
    for (const s of [-1, 1]) for (let x = 1; x <= 7; x++) for (let y = 11; y <= 16; y++) if (Math.hypot(x - 4, y - 13.5) <= 2.7) v.colar(s * x, y, PRETO)
    for (let x = -1; x <= 1; x++) v.colar(x, 14, PRETO)
    return { olhos: 13, tem: ['oculos'] }
  },
  globinho(v) {
    pernas(v, '#4a5568')
    v.forma(-8, 3, -8, 8, 19, 8, (x, y, z) => {
      if (Math.hypot(x, y - 11, z) > 8.2) return null
      const terra = Math.sin(x * 0.55 + z * 0.3) + Math.cos(y * 0.6 - z * 0.4) + Math.sin((x + y) * 0.35) > 1.1
      return terra ? VERDE : AZUL
    })
    mochila(v, 6, 15, 5)
    braco(v, 9, 10, VERDE, true); braco(v, -9, 10, VERDE)
    // rosto em área azul limpa
    for (let x = -5; x <= 5; x++) for (let y = 7; y <= 14; y++) v.pintar(x, y, AZUL)
    olhosFelizes(v, 12); bochechas(v, 10); bocaAberta(v, 8)
    return { olhos: 12, tem: ['mochila'] }
  },
  estrelinha(v) {
    pernas(v, '#f2c200', 4)
    // estrela de 5 pontas: polígono no plano xy
    const pts: [number, number][] = []
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 2 + (i * Math.PI) / 5
      const r = i % 2 ? 4.4 : 10
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
    // mais grossa no miolo, fina nas pontas
    const encolhida = (x: number, y: number, k: number) => dentro(x * k, (y - 12) * k + 12)
    v.forma(-10, 2, -4, 10, 22, 4, (x, y, z) =>
      dentro(x, y) && (Math.abs(z) < 3 || encolhida(x, y, 1.2)) && (Math.abs(z) < 4 || encolhida(x, y, 1.5)) ? AMARELO : null)
    mochila(v, 7, 14, 4)
    braco(v, 9, 14, AMARELO, true) // acenando
    olhosFelizes(v, 13); bochechas(v, 11, 4); bocaAberta(v, 9)
    return { olhos: 13, tem: ['mochila'] }
  },
  conezinho(v) {
    pernas(v, '#d9441a')
    v.caixa(-9, 3, -9, 9, 4, 9, LARANJA) // base
    for (let y = 5; y <= 22; y++) {
      const r = Math.round(7 - (y - 5) * 0.36)
      const listra = (y >= 11 && y <= 13) || (y >= 17 && y <= 19) ? BRANCO : LARANJA
      v.forma(-r, y, -r, r, y, r, (x, _y, z) => (Math.hypot(x, z) <= r + 0.5 ? listra : null))
    }
    mochila(v, 6, 12, 4)
    braco(v, 7, 7, LARANJA); braco(v, -7, 7, LARANJA)
    olhosAltos(v, 7, 2); bochechas(v, 6, 4)
    return { olhos: 8, tem: ['mochila'] }
  },
  nuvem(v) {
    pernas(v, '#1c5fd6')
    for (const [cx, cy, r] of [[0, 8, 6], [-3, 12, 5], [4, 11.5, 4.5], [-7, 9, 4], [7, 8.5, 4]]) {
      v.forma(cx - 7, cy - 7, -6, cx + 7, cy + 7, 6, (x, y, z) => (Math.hypot(x - cx, y - cy, z * 1.3) <= r && y >= 3 ? '#3d8bff' : null))
    }
    v.caixa(-9, 3, -4, 9, 6, 4, '#3d8bff')
    mochila(v, 6, 13, 5)
    boina(v)
    olhosAltos(v, 10)
    return { olhos: 11, tem: ['mochila', 'boina'] }
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
    m.setColorAt(i, c.set(cor).multiplyScalar(0.96 + ruido * 0.008))
  })
  return m
}

const cache = new Map<string, Voxels>()

export function criarPet(dna: DNA, itens: Itens = { crachas: false, xicara: false, capa: false }) {
  const chave = JSON.stringify([dna.especie, dna.acessorio, itens])
  let v = cache.get(chave)
  if (!v) {
    v = new Voxels()
    const { olhos, tem = [] } = PETS[dna.especie](v)
    if (tem.includes(dna.acessorio)) { /* já faz parte do pet */ }
    else if (dna.acessorio === 'boina') boina(v)
    else if (dna.acessorio === 'oculos') {
      for (const s of [-1, 1]) for (let x = 1; x <= 4; x++) for (let y = olhos - 1; y <= olhos + 2; y++) v.colar(s * x, y, PRETO)
      v.colar(0, olhos + 1, PRETO)
    } else if (dna.acessorio === 'mochila') mochila(v, 5, 12, 4)
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

export const itensDe =(alcance: number, profundidade: number): Itens => ({
  crachas: alcance >= 4,
  xicara: profundidade >= 4,
  capa: alcance >= 4 && profundidade >= 4,
})
