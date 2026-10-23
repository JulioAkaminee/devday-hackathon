import * as THREE from 'three'
import type { Opcao } from '../shared/engine.ts'
import { criarPet, type DNA, type Itens } from './pet.ts'

// Mapa da aventura (docs/referencias/mapa-aventura-v1.png): as 4 ilhas sempre à vista, ligadas por um
// caminho. A escolha é feita no cartão (D8); o mundo mostra onde o pet está e o que já aconteceu.
// Identidade: banner do evento (branco, preto, um verde só, bola verde com olhos de anel).

export const COR = {
  ceu: '#f2f3ef',
  agua: '#cfe8ea',
  espuma: '#e6f4f4',
  terra: '#f1ead9',
  penhasco: '#e3d8c2',
  penhascoClaro: '#ece3d0',
  verde: '#22b04b',
  verdeEscuro: '#178a39',
  verdeClaro: '#5fd07d',
  preto: '#141414',
  branco: '#ffffff',
  madeira: '#a77b52',
}

const E = 2.4 // escala dos pets no mapa: na referência o pet ocupa ~1/4 da ilha

// Centro de cada ilha (Missões 1 a 4) e estação onde o pet para em cada capítulo.
// Capítulo 0 (Credenciamento) fica na ilha 1, ao lado da bandeira.
const ILHAS = [new THREE.Vector3(-27, 0, 1), new THREE.Vector3(-9, 0, 8), new THREE.Vector3(9, 0, -4), new THREE.Vector3(29, 0, -4)]
const ESTACOES = [
  new THREE.Vector3(-31, 0, 4),
  new THREE.Vector3(-22.5, 0, 4.5),
  new THREE.Vector3(-8, 0, 11),
  new THREE.Vector3(5, 0, -0.5),
  new THREE.Vector3(25, 0, -0.5),
]
// Zoom (roda do mouse e pinça) multiplica a distância da câmera dentro destes limites:
// mais perto que 0,55 os pets estouram o quadro; mais longe que 1,7 o mapa vira miniatura.
const ZOOM_MIN = 0.55
const ZOOM_MAX = 1.7

const geo = new THREE.BoxGeometry(1, 1, 1)
const mats = new Map<string, THREE.MeshLambertMaterial>()
const mat = (cor: string) => {
  if (!mats.has(cor)) mats.set(cor, new THREE.MeshLambertMaterial({ color: cor }))
  return mats.get(cor)!
}
function caixa(g: THREE.Object3D, cor: string, w: number, h: number, d: number, x: number, y: number, z: number) {
  const m = new THREE.Mesh(geo, mat(cor))
  m.scale.set(w, h, d)
  m.position.set(x, y + h / 2, z)
  g.add(m)
  return m
}

// pseudo-aleatório determinístico: o mapa é igual em todo dispositivo
let semente = 11
const rnd = () => ((semente = (semente * 16807) % 2147483647) / 2147483647)

// ---------- texturas desenhadas em canvas ----------

const FONTE = '"Inter Tight", "Helvetica Neue", Arial, sans-serif'

function textura(w: number, h: number, desenhar: (c: CanvasRenderingContext2D) => void) {
  const cv = document.createElement('canvas')
  cv.width = w; cv.height = h
  desenhar(cv.getContext('2d')!)
  const t = new THREE.CanvasTexture(cv)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

/** Bola verde com olhos de anel, como no banner. `corte` desloca para fora do quadro. */
function bola(c: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  c.fillStyle = COR.verde
  c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill()
  c.strokeStyle = COR.preto
  c.lineWidth = r * 0.075
  for (const [ox, oy] of [[-0.62, -0.38], [0.12, -0.42]]) {
    c.beginPath(); c.ellipse(cx + ox * r, cy + oy * r, r * 0.11, r * 0.15, 0, 0, Math.PI * 2); c.stroke()
  }
}

/** Placa de texto que sempre olha para a câmera. */
function placa(texto: string, { fundo = COR.branco, cor = COR.preto, altura = 1.1, peso = 600 } = {}) {
  const px = 96
  const medir = document.createElement('canvas').getContext('2d')!
  medir.font = `${peso} ${px}px ${FONTE}`
  const w = Math.ceil(medir.measureText(texto).width + px * 0.9)
  const h = Math.ceil(px * 1.5)
  const t = textura(w, h, (c) => {
    c.fillStyle = fundo
    c.fillRect(0, 0, w, h)
    c.fillStyle = cor
    c.font = `${peso} ${px}px ${FONTE}`
    c.textBaseline = 'middle'
    c.fillText(texto, px * 0.45, h / 2 + px * 0.04)
  })
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t }))
  s.scale.set((altura * w) / h, altura, 1)
  return s
}

/** Número da missão: quadrado preto, algarismo branco. */
function numero(n: string, lado = 1.5) {
  const t = textura(160, 160, (c) => {
    c.fillStyle = COR.preto; c.fillRect(0, 0, 160, 160)
    c.fillStyle = COR.branco; c.font = `600 112px ${FONTE}`
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(n, 80, 86)
  })
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t }))
  s.scale.set(lado, lado, 1)
  return s
}

/** Selo de concluída: círculo verde com ✓ em traço preto. */
function selo() {
  const t = textura(160, 160, (c) => {
    c.fillStyle = COR.verde; c.beginPath(); c.arc(80, 80, 76, 0, Math.PI * 2); c.fill()
    c.strokeStyle = COR.preto; c.lineWidth = 14; c.lineCap = 'square'
    c.beginPath(); c.moveTo(46, 82); c.lineTo(70, 106); c.lineTo(116, 56); c.stroke()
  })
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t }))
  s.scale.set(1.4, 1.4, 1)
  return s
}

/** Balão de fala de um pet do mapa: retângulo branco com rabicho, símbolo desenhado. */
function balao(tipo: 'reticencias' | 'oi' | 'brilho') {
  const t = textura(160, 150, (c) => {
    c.fillStyle = COR.branco
    c.fillRect(8, 8, 144, 104)
    c.beginPath(); c.moveTo(56, 112); c.lineTo(80, 142); c.lineTo(92, 112); c.fill()
    c.fillStyle = COR.preto; c.strokeStyle = COR.preto
    if (tipo === 'reticencias') for (const x of [52, 80, 108]) { c.beginPath(); c.arc(x, 60, 9, 0, Math.PI * 2); c.fill() }
    else if (tipo === 'oi') { c.font = `600 60px ${FONTE}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('oi!', 80, 62) }
    else { c.lineWidth = 9; for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; c.beginPath(); c.moveTo(80 + Math.cos(a) * 16, 60 + Math.sin(a) * 16); c.lineTo(80 + Math.cos(a) * 36, 60 + Math.sin(a) * 36); c.stroke() } }
  })
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t }))
  s.scale.set(1.5, 1.4, 1)
  return s
}

// ---------- peças do cenário ----------

function arvore(g: THREE.Object3D, x: number, z: number, a = 1) {
  caixa(g, COR.madeira, 0.5 * a, 1.6 * a, 0.5 * a, x, 0, z)
  caixa(g, COR.verdeEscuro, 2.2 * a, 1.3 * a, 2.2 * a, x, 1.3 * a, z)
  caixa(g, COR.verde, 1.7 * a, 1.1 * a, 1.7 * a, x, 2.5 * a, z)
  caixa(g, COR.verdeClaro, 1 * a, 0.8 * a, 1 * a, x, 3.5 * a, z)
}
const arbusto = (g: THREE.Object3D, x: number, z: number) => {
  caixa(g, COR.verde, 1, 0.7, 1, x, 0, z)
  caixa(g, COR.verdeClaro, 0.6, 0.4, 0.6, x + 0.15, 0.7, z - 0.1)
}
function mesa(g: THREE.Object3D, x: number, z: number, w = 2.2, d = 1.3) {
  caixa(g, COR.madeira, w, 0.18, d, x, 0.95, z)
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) caixa(g, '#7d5a3c', 0.16, 0.95, 0.16, x + dx * (w / 2 - 0.15), 0, z + dz * (d / 2 - 0.15))
}
const xicara = (g: THREE.Object3D, x: number, z: number, y = 1.13) => caixa(g, COR.branco, 0.28, 0.3, 0.28, x, y, z)
function banco(g: THREE.Object3D, x: number, z: number, w = 2.4) {
  caixa(g, COR.madeira, w, 0.18, 0.7, x, 0.55, z)
  caixa(g, COR.madeira, w, 0.6, 0.14, x, 0.73, z - 0.3)
  for (const dx of [-1, 1]) caixa(g, '#7d5a3c', 0.16, 0.55, 0.6, x + dx * (w / 2 - 0.2), 0, z)
}
function cadeira(g: THREE.Object3D, x: number, z: number) {
  caixa(g, COR.preto, 0.7, 0.14, 0.7, x, 0.5, z)
  caixa(g, COR.preto, 0.7, 0.6, 0.12, x, 0.64, z + 0.3)
  caixa(g, '#3a3a3a', 0.12, 0.5, 0.12, x, 0, z)
}
function poste(g: THREE.Object3D, x: number, z: number, h = 5) {
  caixa(g, COR.preto, 0.3, h, 0.3, x, 0, z)
  caixa(g, COR.preto, 0.7, 0.2, 0.7, x, 0, z)
}
/** Varal de lâmpadas entre dois pontos (local), caindo no meio. */
function varal(g: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3) {
  const n = 12
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const p = a.clone().lerp(b, t)
    p.y -= Math.sin(t * Math.PI) * 0.9
    const l = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#fff1b8' }))
    l.scale.setScalar(0.22)
    l.position.copy(p)
    g.add(l)
  }
}
/** Arco de entrada com o nome e o número da missão. */
function arco(g: THREE.Object3D, x: number, z: number, n: number, nome: string) {
  for (const dx of [-1.9, 1.9]) {
    for (let y = 0; y < 4; y++) caixa(g, y % 2 ? COR.penhascoClaro : COR.branco, 0.9, 1, 0.9, x + dx, y, z)
  }
  caixa(g, COR.branco, 4.8, 0.9, 1, x, 4, z)
  caixa(g, COR.penhascoClaro, 4.8, 0.2, 1.05, x, 4.9, z)
  const p = placa(nome, { altura: 1.25 })
  p.position.set(x, 4.45, z + 0.7)
  const num = numero(String(n))
  num.position.set(x, 6.1, z)
  g.add(p, num)
}

/** Telão do palco: reproduz o banner do evento. */
function telao(g: THREE.Object3D, x: number, z: number) {
  const w = 10.5, h = 5.6
  const t = textura(1050, 560, (c) => {
    c.fillStyle = COR.branco; c.fillRect(0, 0, 1050, 560)
    c.fillStyle = COR.preto
    c.font = `500 64px ${FONTE}`
    c.textBaseline = 'top'
    c.fillText('OpenAI', 40, 34)
    ;['DevDay', 'Community Hackathon', 'São Paulo'].forEach((l, i) => c.fillText(l, 330, 34 + i * 70))
    c.save(); c.beginPath(); c.rect(0, 0, 1050, 560); c.clip()
    bola(c, 600, 700, 400)
    c.restore()
  })
  const painel = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t }))
  painel.position.set(x, 2.6 + h / 2, z + 0.06)
  g.add(painel)
  caixa(g, COR.preto, w + 0.4, h + 0.4, 0.1, x, 2.4, z - 0.02)
  // torres de treliça
  for (const s of [-1, 1]) {
    const tx = x + s * (w / 2 + 0.6)
    for (const dx of [-0.35, 0.35]) caixa(g, COR.preto, 0.12, 8.6, 0.12, tx + dx, 0, z)
    for (let y = 0.6; y < 8.6; y += 0.9) caixa(g, COR.preto, 0.8, 0.08, 0.1, tx, y, z)
    const luz = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#fff1b8' }))
    luz.scale.set(0.5, 0.35, 0.35); luz.position.set(tx, 8.8, z + 0.3); g.add(luz)
  }
}

// ---------- ilhas ----------

function montarIlha(g: THREE.Group, i: number) {
  const W = 15, D = 11
  caixa(g, COR.terra, W, 0.5, D, 0, -0.5, 0)
  caixa(g, COR.penhasco, W - 0.4, 3.6, D - 0.4, 0, -4.1, 0)
  // borda de penhasco em blocos, com grama por cima: o aspecto voxel da referência
  for (let x = -W / 2 + 0.5; x < W / 2; x += 1) {
    for (const z of [-D / 2 + 0.5, D / 2 - 0.5]) {
      const h = 2.4 + rnd() * 1.6
      caixa(g, rnd() > 0.5 ? COR.penhasco : COR.penhascoClaro, 1, h, 1.02, x, -0.5 - h + 0.02, z + Math.sign(z) * 0.05)
      if (rnd() > 0.45) caixa(g, rnd() > 0.5 ? COR.verde : COR.verdeEscuro, 1, 0.35 + rnd() * 0.25, 1, x, 0, z)
      if (rnd() > 0.8) caixa(g, COR.verde, 1, 0.5, 0.3, x, -0.9 - rnd(), z + Math.sign(z) * 0.55)
    }
  }
  for (let z = -D / 2 + 1.5; z < D / 2 - 1; z += 1) {
    for (const x of [-W / 2 + 0.5, W / 2 - 0.5]) {
      const h = 2.4 + rnd() * 1.6
      caixa(g, rnd() > 0.5 ? COR.penhasco : COR.penhascoClaro, 1.02, h, 1, x + Math.sign(x) * 0.05, -0.5 - h + 0.02, z)
      if (rnd() > 0.5) caixa(g, rnd() > 0.5 ? COR.verde : COR.verdeEscuro, 1, 0.35 + rnd() * 0.25, 1, x, 0, z)
    }
  }
  // espuma na água em volta
  caixa(g, COR.espuma, W + 1.2, 0.05, D + 1.2, 0, -3.38, 0)

  if (i === 0) {
    // Novas pessoas + Credenciamento: bandeira do evento, mesa com laptops
    caixa(g, COR.preto, 0.25, 7, 0.25, -6, 0, -3.5)
    const bandeira = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.4), new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      map: textura(260, 340, (c) => { c.fillStyle = COR.verde; c.fillRect(0, 0, 260, 340); c.save(); c.beginPath(); c.rect(0, 0, 260, 340); c.clip(); bola(c, 150, 330, 230); c.restore(); c.fillStyle = COR.verde; c.fillRect(0, 0, 260, 120) }),
    }))
    bandeira.position.set(-4.65, 5.2, -3.5)
    g.add(bandeira)
    arco(g, 0.5, -1.5, 1, 'Novas pessoas')
    mesa(g, 4.6, -3); caixa(g, '#cfd3d6', 0.7, 0.05, 0.5, 4.2, 1.13, -3); caixa(g, '#2b2b2b', 0.7, 0.45, 0.06, 4.2, 1.16, -3.25)
    banco(g, -4.5, 1.2, 2.2)
    arvore(g, -6.2, -4.2, 1.05); arvore(g, 6.4, 3.8, 0.85); arvore(g, 6.3, -4.4, 0.9)
    arbusto(g, -2.4, 4.4); arbusto(g, 2.6, -4.6)
  } else if (i === 1) {
    // Troca de ajuda: arco com placa </>, bancos, árvores
    arco(g, 1, -1.5, 2, 'Troca de ajuda')
    const tag = placa('</>', { fundo: COR.preto, cor: COR.branco, altura: 0.8, peso: 600 })
    tag.position.set(1, 2.2, -0.9)
    g.add(tag)
    mesa(g, 5, 1.5, 1.8, 1.2); xicara(g, 4.6, 1.5)
    arvore(g, -5.6, -3.8, 1.1); arvore(g, -6.2, 3.4, 0.9); arvore(g, 6.3, -3.8, 0.95)
    arbusto(g, 3.4, 4.3); arbusto(g, -3.4, -4.4)
  } else if (i === 2) {
    // Cultive conexões: varal de luzes, mesas de café, placa com xícara
    for (const [x, z] of [[-5.5, -3.8], [5.5, -3.8], [-5.5, 2.5]]) poste(g, x, z)
    varal(g, new THREE.Vector3(-5.5, 5, -3.8), new THREE.Vector3(5.5, 5, -3.8))
    varal(g, new THREE.Vector3(-5.5, 5, -3.8), new THREE.Vector3(-5.5, 5, 2.5))
    const p = placa('Cultive conexões', { altura: 1.25 }); p.position.set(0, 5.3, -3.6)
    const num = numero('3'); num.position.set(0, 6.8, -3.6)
    g.add(p, num)
    mesa(g, -2, -0.5); xicara(g, -2.5, -0.5); xicara(g, -1.6, -0.3)
    mesa(g, 2.6, 1.5); xicara(g, 2.3, 1.5)
    for (const [x, z] of [[-3.4, -0.5], [-0.6, -0.5], [1.2, 1.5], [4, 1.5]]) cadeira(g, x, z)
    caixa(g, COR.preto, 0.2, 2, 0.2, 5, 0, -1.2)
    const cafe = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), new THREE.MeshBasicMaterial({
      map: textura(140, 140, (c) => { c.fillStyle = COR.preto; c.fillRect(0, 0, 140, 140); c.strokeStyle = COR.branco; c.lineWidth = 10; c.strokeRect(38, 44, 50, 56); c.beginPath(); c.arc(92, 72, 14, -Math.PI / 2, Math.PI / 2); c.stroke() }),
    }))
    cafe.position.set(5, 2.6, -1.08)
    g.add(cafe)
    arvore(g, -6.3, 4.2, 0.85); arvore(g, 6.4, 3.6, 1)
  } else {
    // Palco DevDay: telão do banner, palco, plateia
    telao(g, 0, -4.4)
    caixa(g, COR.preto, 11, 0.7, 2.6, 0, 0, -3.1)
    for (let x = -3.5; x <= 3.5; x += 1.1) for (const z of [-0.6, 0.6, 1.8]) cadeira(g, x, z)
    arvore(g, -6.5, 3.8, 0.85); arbusto(g, 6.5, -1.5); arbusto(g, -6.6, -1.2)
  }
}

export type Modo = 'mapa' | 'final' | 'vitrine'

export class Mundo {
  private renderer: THREE.WebGLRenderer
  private cena = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(28, 1, 0.5, 400)
  private camPos = new THREE.Vector3()
  private camOlhar = new THREE.Vector3()
  private olharAtual = new THREE.Vector3()
  private mapa = new THREE.Group()
  private marcas = new THREE.Group() // selos, contatos conhecidos
  private extras = new THREE.Group() // cena do final
  private pet: THREE.Group | null = null
  private amigo: THREE.Group | null = null
  private amigoAlvo = new THREE.Vector3()
  private relogio = new THREE.Clock()
  private modo: Modo = 'vitrine'
  private cap = -1
  private viagem: { de: THREE.Vector3; para: THREE.Vector3; t: number } | null = null
  private pulo = 0
  // arrastar a tela (mouse e toque): deslocamento da câmera, com inércia ao soltar
  private base = new THREE.Vector3()
  private pan = new THREE.Vector3()
  private vel = new THREE.Vector3()
  private arrasto: { x: number; y: number; t: number } | null = null
  private dedos = new Map<number, { x: number; y: number }>()
  private pinca: { dist: number; zoom: number } | null = null
  private zoom = 1
  private zoomAlvo = 1

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    this.cena.background = new THREE.Color(COR.ceu)
    this.cena.fog = new THREE.Fog(COR.ceu, 70, 170)
    this.cena.add(new THREE.HemisphereLight('#ffffff', '#c9bfa8', 2.4))
    const sol = new THREE.DirectionalLight('#ffffff', 1.4)
    sol.position.set(-8, 14, 10)
    this.cena.add(sol, this.mapa, this.marcas, this.extras)
    this.montarMapa()
    addEventListener('resize', () => this.ajustar())
    canvas.addEventListener('pointerdown', (e) => this.agarrar(e, canvas))
    canvas.addEventListener('pointermove', (e) => this.arrastar(e))
    for (const ev of ['pointerup', 'pointercancel'] as const) canvas.addEventListener(ev, (e) => this.soltar(e, canvas))
    canvas.addEventListener('wheel', (e) => {
      if (this.modo === 'vitrine') return
      e.preventDefault()
      this.zoomAlvo = THREE.MathUtils.clamp(this.zoomAlvo * Math.exp(e.deltaY * 0.0015), ZOOM_MIN, ZOOM_MAX)
    }, { passive: false })
    this.ajustar()
    this.base.copy(this.camPos)
    this.olharAtual.copy(this.camOlhar)
    this.renderer.setAnimationLoop(() => this.quadro())
  }

  private montarMapa() {
    const agua = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat(COR.agua))
    agua.rotation.x = -Math.PI / 2
    agua.position.y = -3.4
    this.mapa.add(agua)
    // cubos boiando: creme e verde, alguns grandes perto da câmera
    for (let i = 0; i < 70; i++) {
      const perto = i < 10
      const s = perto ? 3 + rnd() * 4 : 0.8 + rnd() * 2.2
      const x = (rnd() - 0.5) * (perto ? 110 : 150)
      const z = perto ? 22 + rnd() * 18 : (rnd() - 0.5) * 80
      if (ILHAS.some((c) => Math.abs(c.x - x) < 9 + s && Math.abs(c.z - z) < 7 + s)) continue
      caixa(this.mapa, rnd() > 0.55 ? COR.penhascoClaro : rnd() > 0.5 ? COR.verdeClaro : COR.verde, s, s, s, x, -3.4 - s * 0.35, z)
    }
    ILHAS.forEach((c, i) => {
      const g = new THREE.Group()
      g.position.copy(c)
      montarIlha(g, i)
      this.mapa.add(g)
    })
    // caminho: faixa preta com bordas verdes e marcadores circulares
    for (let i = 1; i < ESTACOES.length - 1; i++) {
      const a = ESTACOES[i], b = ESTACOES[i + 1]
      const meio = a.clone().add(b).multiplyScalar(0.5)
      const ang = Math.atan2(b.x - a.x, b.z - a.z)
      const comp = a.distanceTo(b)
      for (const [w, cor, y] of [[2.1, COR.verde, -0.02], [1.4, COR.preto, 0]] as const) {
        const p = caixa(this.mapa, cor, w, 0.14, comp, meio.x, y, meio.z)
        p.rotation.y = ang
      }
      // pilares onde o caminho passa sobre a água
      for (let t = 0.15; t < 1; t += 0.14) {
        const p = a.clone().lerp(b, t)
        if (ILHAS.some((c) => Math.abs(c.x - p.x) < 7.5 && Math.abs(c.z - p.z) < 5.5)) continue
        caixa(this.mapa, COR.penhasco, 0.7, 3.4, 0.7, p.x, -3.4, p.z)
      }
    }
    for (const e of ESTACOES.slice(1)) {
      const anel = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.18, 40), mat(COR.verde))
      anel.position.set(e.x, 0.09, e.z)
      const meio = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.2, 40), mat(COR.verdeClaro))
      meio.position.set(e.x, 0.1, e.z)
      this.mapa.add(anel, meio)
    }
    // outros participantes no mapa, com balões (como na referência)
    const figurantes: [DNA, number, number, 'reticencias' | 'oi' | 'brilho' | null][] = [
      [{ especie: 'nuvem', cor: '', acessorio: 'boina' }, -13.5, 9.5, 'oi'],
      [{ especie: 'lampada', cor: '', acessorio: 'oculos' }, 12.5, -2.5, 'reticencias'],
      [{ especie: 'plantinha', cor: '', acessorio: 'oculos' }, 33, -1.5, null],
      [{ especie: 'coracao', cor: '', acessorio: 'oculos' }, 35.2, -2.3, 'brilho'],
    ]
    for (const [dna, x, z, b] of figurantes) {
      const p = criarPet(dna)
      p.scale.setScalar(E)
      p.position.set(x, 0, z)
      p.rotation.y = -0.4
      this.mapa.add(p)
      if (b) { const s = balao(b); s.position.set(x + 0.9, 4.1, z); this.mapa.add(s) }
    }
  }

  // ---------- câmera ----------

  private ajustar() {
    const w = innerWidth, h = innerHeight
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    const r = w / h
    if (this.modo === 'vitrine') {
      this.camPos.set(0, 1.5, 4.6)
      this.camOlhar.set(0, 0.55, 0)
    } else if (this.modo === 'final') {
      const c = ILHAS[3]
      const d = Math.max(1, 1.5 / r)
      this.camPos.set(c.x, 20 * d, c.z + 36 * d)
      this.camOlhar.set(c.x - 2, 1.5, c.z)
    } else if (r < 1.1) {
      // celular em pé: as 4 ilhas não cabem; a câmera acompanha a ilha atual
      const e = ESTACOES[Math.max(0, this.cap)]
      const d = r < 0.7 ? 1.25 : 1
      this.camPos.set(e.x, 34 * d, e.z + 36 * d)
      this.camOlhar.set(e.x, 0, e.z - 2.5)
    } else {
      // visão da referência: as 4 ilhas, de frente e de cima; janelas mais estreitas afastam
      const d = Math.max(1, 1.85 / r)
      this.camPos.set(0, 40 * d, 72 * d)
      this.camOlhar.set(0, -1, 0.5)
    }
  }

  // ---------- pets ----------

  /** Tela de criação: só o pet girando, de perto. */
  mostrarVitrine(dna: DNA) {
    this.modo = 'vitrine'
    this.mapa.visible = false
    this.marcas.visible = false
    this.trocarPet(dna)
    this.pet!.scale.setScalar(1)
    this.pet!.position.set(0, 0, 0)
    this.pan.set(0, 0, 0)
    this.ajustar()
    this.base.copy(this.camPos)
    this.olharAtual.copy(this.camOlhar)
  }

  trocarPet(dna: DNA, itens?: Itens) {
    const pos = this.pet?.position.clone()
    const rot = this.pet?.rotation.y ?? 0
    if (this.pet) this.cena.remove(this.pet)
    this.pet = criarPet(dna, itens)
    this.pet.scale.setScalar(this.modo === 'vitrine' ? 1 : E)
    if (pos) this.pet.position.copy(pos)
    this.pet.rotation.y = rot
    this.cena.add(this.pet)
  }

  /** Leva o pet até a estação do capítulo, andando pelo caminho. */
  irPara(cap: number, dna: DNA, itens: Itens) {
    const primeira = this.modo === 'vitrine' || !this.pet
    this.mapa.visible = true
    this.marcas.visible = true
    this.extras.clear()
    if (this.amigo && cap !== this.cap) { this.cena.remove(this.amigo); this.amigo = null }
    if (primeira) { this.modo = 'mapa'; this.trocarPet(dna, itens) }
    this.modo = 'mapa'
    const destino = ESTACOES[cap]
    if (primeira || cap < this.cap) { this.pet!.position.copy(destino); this.pet!.rotation.y = 0 }
    else if (cap !== this.cap) this.viagem = { de: this.pet!.position.clone(), para: destino.clone(), t: 0 }
    if (cap !== this.cap) { this.pan.set(0, 0, 0); this.vel.set(0, 0, 0) }
    this.cap = cap
    this.ajustar()
  }

  /** Selos nas missões concluídas e contatos parados nas ilhas onde foram conhecidos. */
  atualizarMapa(capAtual: number, _escolhas: Opcao[], contatosPorIlha: (DNA | null)[]) {
    this.marcas.clear()
    const ALTURA_SELO = [5.6, 5.6, 6.3, 9.8]
    const X_SELO = [2.6, 3.1, 2.4, 6.3]
    for (let i = 1; i < Math.min(capAtual, 5); i++) {
      const s = selo()
      const c = ILHAS[i - 1]
      s.position.set(c.x + X_SELO[i - 1], ALTURA_SELO[i - 1], c.z - (i === 3 ? 3.6 : 1.5) + 0.8)
      this.marcas.add(s)
    }
    contatosPorIlha.forEach((dna, i) => {
      if (!dna || i + 1 === this.cap) return
      const p = criarPet(dna)
      p.scale.setScalar(E)
      p.position.copy(ESTACOES[i + 1]).add(new THREE.Vector3(2.8, 0, 1.6))
      p.rotation.y = 0.5
      this.marcas.add(p)
    })
  }

  /** O pet de quem você encontrou chega e para ao lado do seu. */
  chegarAmigo(dna: DNA) {
    if (this.amigo || !this.pet) return
    this.amigo = criarPet(dna)
    this.amigo.scale.setScalar(E)
    const e = ESTACOES[this.cap]
    this.amigo.position.copy(e).add(new THREE.Vector3(5, 0, -3))
    this.amigoAlvo.copy(e).add(new THREE.Vector3(2.6, 0, 0.2))
    this.cena.add(this.amigo)
  }

  /** Consequência: o pet comemora. */
  consequencia(_op: Opcao) {
    this.pulo = 1
  }

  /** Final no Palco DevDay: a câmera aproxima e os contatos aparecem conforme o final. */
  cenaFinal(tipo: 'time' | 'colecionador' | 'amigo', contatos: DNA[]) {
    this.modo = 'final'
    this.pan.set(0, 0, 0)
    this.ajustar()
    if (this.amigo) { this.cena.remove(this.amigo); this.amigo = null }
    this.extras.clear()
    const c = ILHAS[3]
    const pet = this.pet!
    this.viagem = null
    pet.rotation.y = 0
    const no = (dna: DNA, x: number, y: number, z: number, festa = false) => {
      const p = criarPet(dna)
      p.scale.setScalar(E)
      p.position.set(c.x + x, y, c.z + z)
      p.userData.festa = festa
      this.extras.add(p)
    }
    if (tipo === 'amigo') {
      banco(this.extras, c.x, c.z + 3.6, 5.6)
      pet.position.set(c.x - 1.4, 0.55, c.z + 3.6)
      if (contatos[0]) no(contatos[0], 1.4, 0.55, 3.6)
    } else {
      pet.position.set(c.x, 0.7, c.z - 3)
      if (tipo === 'time') {
        contatos.slice(0, 4).forEach((d, i) => no(d, (i % 2 ? 1 : -1) * (2.6 + Math.floor(i / 2) * 2.4), 0.7, -3, true))
      } else {
        for (let i = 0; i < 40; i++) {
          const k = caixa(this.extras, i % 3 ? COR.branco : COR.verde, 0.5, 0.04, 0.7, c.x + (rnd() - 0.5) * 10, 0.72, c.z - 3 + (rnd() - 0.5) * 2.2)
          k.rotation.y = rnd() * 3
        }
      }
    }
  }

  // ---------- arrastar ----------

  private agarrar(e: PointerEvent, canvas: HTMLCanvasElement) {
    if (this.modo === 'vitrine') return
    canvas.setPointerCapture(e.pointerId)
    this.dedos.set(e.pointerId, { x: e.clientX, y: e.clientY })
    this.vel.set(0, 0, 0)
    if (this.dedos.size === 2) {
      // dois dedos: pinça; o arrasto pausa até sobrar um dedo
      this.arrasto = null
      this.pinca = { dist: this.distDedos(), zoom: this.zoomAlvo }
      return
    }
    canvas.classList.add('arrastando')
    this.arrasto = { x: e.clientX, y: e.clientY, t: performance.now() }
  }

  private distDedos() {
    const [a, b] = [...this.dedos.values()]
    return Math.hypot(a.x - b.x, a.y - b.y) || 1
  }

  private arrastar(e: PointerEvent) {
    if (this.dedos.has(e.pointerId)) this.dedos.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (this.pinca && this.dedos.size === 2) {
      this.zoomAlvo = THREE.MathUtils.clamp((this.pinca.zoom * this.pinca.dist) / this.distDedos(), ZOOM_MIN, ZOOM_MAX)
      return
    }
    const a = this.arrasto
    if (!a) return
    // pixels da tela viram unidades do chão na distância atual da câmera
    const dist = this.camera.position.distanceTo(this.olharAtual)
    const k = (2 * dist * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))) / innerHeight
    const dx = -(e.clientX - a.x) * k
    const dz = -(e.clientY - a.y) * k * 1.5 // o chão está inclinado: o vertical anda mais
    const agora = performance.now()
    const dt = Math.max(16, agora - a.t) / 1000
    this.pan.x += dx; this.pan.z += dz
    this.vel.set(dx / dt, 0, dz / dt).multiplyScalar(0.5).add(this.vel.multiplyScalar(0.5))
    if (this.vel.length() > 40) this.vel.setLength(40)
    a.x = e.clientX; a.y = e.clientY; a.t = agora
  }

  private soltar(e: PointerEvent, canvas: HTMLCanvasElement) {
    this.dedos.delete(e.pointerId)
    if (this.pinca) {
      this.pinca = null
      // o dedo que sobrou continua arrastando dali, sem pulo
      const [resto] = this.dedos.values()
      this.arrasto = resto ? { ...resto, t: performance.now() } : null
      return
    }
    // dedo parado antes de soltar: sem inércia
    if (this.arrasto && performance.now() - this.arrasto.t > 80) this.vel.set(0, 0, 0)
    this.arrasto = null
    canvas.classList.remove('arrastando')
  }

  // ---------- animação ----------

  private quadro() {
    const dt = Math.min(this.relogio.getDelta(), 0.05)
    const t = this.relogio.elapsedTime
    if (document.hidden) return
    if (!this.arrasto && this.vel.lengthSq() > 0.01) {
      this.pan.addScaledVector(this.vel, dt)
      this.vel.multiplyScalar(Math.exp(-dt * 4))
    }
    const lim = this.modo === 'final' ? 12 : 38
    this.pan.x = THREE.MathUtils.clamp(this.pan.x, -lim, lim)
    this.pan.z = THREE.MathUtils.clamp(this.pan.z, -Math.min(lim, 16), Math.min(lim, 22))
    this.base.lerp(this.camPos, Math.min(1, dt * 2.5))
    this.olharAtual.lerp(this.camOlhar, Math.min(1, dt * 2.5))
    this.zoom += (this.zoomAlvo - this.zoom) * Math.min(1, dt * 10)
    const z = this.modo === 'vitrine' ? 1 : this.zoom
    this.camera.position.copy(this.base).sub(this.olharAtual).multiplyScalar(z).add(this.olharAtual).add(this.pan)
    this.camera.lookAt(this.olharAtual.clone().add(this.pan))
    const pet = this.pet
    if (pet) {
      const corpo: THREE.Group = pet.userData.corpo
      if (this.modo === 'vitrine') {
        pet.rotation.y += dt * 0.8
        corpo.position.y = Math.abs(Math.sin(t * 3)) * 0.05
      } else if (this.viagem) {
        const v = this.viagem
        v.t = Math.min(1, v.t + dt / (v.de.distanceTo(v.para) / 9))
        const s = v.t * v.t * (3 - 2 * v.t)
        pet.position.lerpVectors(v.de, v.para, s)
        pet.rotation.y = Math.atan2(v.para.x - v.de.x, v.para.z - v.de.z)
        corpo.position.y = Math.abs(Math.sin(t * 12)) * 0.08
        if (v.t >= 1) { this.viagem = null; pet.rotation.y = 0 }
      } else if (this.pulo > 0) {
        this.pulo = Math.max(0, this.pulo - dt * 1.1)
        corpo.position.y = Math.sin(this.pulo * Math.PI * 3) ** 2 * 0.3
        pet.rotation.y += dt * 7
        if (this.pulo === 0) pet.rotation.y = 0
      } else {
        corpo.position.y = 0
        corpo.scale.y = 1 + Math.sin(t * 2.5) * 0.025
        if (this.modo === 'mapa') pet.rotation.y = Math.sin(t * 0.6) * 0.25
      }
    }
    const a = this.amigo
    if (a) {
      const delta = this.amigoAlvo.clone().sub(a.position)
      const andando = delta.length() > 0.05
      if (andando) {
        a.position.addScaledVector(delta.normalize(), Math.min(delta.length(), 7 * dt))
        a.rotation.y = Math.atan2(delta.x, delta.z)
      } else a.rotation.y = -0.5
      a.userData.corpo.position.y = andando ? Math.abs(Math.sin(t * 12 + 1)) * 0.08 : 0
    }
    for (const o of this.extras.children) {
      if (o.userData.festa) o.userData.corpo.position.y = Math.abs(Math.sin(t * 6 + o.position.x)) * 0.15
    }
    this.renderer.render(this.cena, this.camera)
  }
}
