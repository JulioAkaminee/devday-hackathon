import * as THREE from 'three'
import type { Opcao } from '../shared/engine.ts'
import { criarPet, type DNA, type Itens } from './pet.ts'

// Mapa de ilhas voxel (docs/referencias/mapa-aventura-v1.png). Cada ilha é a fase de um capítulo,
// no estilo Overcooked: a câmera aproxima, o pet anda livre e escolhe caminhando até uma zona (D5).
// Coordenadas de FASES são locais à ilha: x de -6 a 6, z de -4 a 4,3.

export const CORES_MUNDO = {
  fundo: '#f4efe4',
  agua: '#bfe6ee',
  terra: '#f3ead7',
  penhasco: '#e6dcc6',
  grama: '#4cc960',
  gramaEscura: '#2f9e44',
  caminho: '#2b2b2b',
  caminhoBorda: '#1fbf5f',
  ampla: '#1fbf5f',
  profunda: '#1b1b1b',
}

interface Fase {
  titulo: string
  limites: [number, number, number, number] // xmin, xmax, zmin, zmax (locais)
  montar(g: THREE.Group): void
  zonas: [x: number, z: number][] // [ampla, profunda]
}

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
const mesa = (g: THREE.Object3D, x: number, z: number, w = 1.6, d = 0.9, cor = '#c8946a') => {
  caixa(g, cor, w, 0.12, d, x, 0.62, z)
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) caixa(g, '#8d6748', 0.1, 0.62, 0.1, x + dx * (w / 2 - 0.1), 0, z + dz * (d / 2 - 0.1))
}
const banco = (g: THREE.Object3D, x: number, z: number, cor = '#2b2b2b') => {
  caixa(g, cor, 0.45, 0.1, 0.45, x, 0.35, z)
  caixa(g, '#6c6c6c', 0.08, 0.35, 0.08, x, 0, z)
}
const laptop = (g: THREE.Object3D, x: number, z: number) => {
  caixa(g, '#adb5bd', 0.4, 0.03, 0.28, x, 0.74, z)
  caixa(g, '#343a40', 0.4, 0.26, 0.03, x, 0.77, z - 0.13)
}
const arvore = (g: THREE.Object3D, x: number, z: number, a = 1) => {
  caixa(g, '#8d6748', 0.3, 0.9 * a, 0.3, x, 0, z)
  caixa(g, CORES_MUNDO.gramaEscura, 1.2 * a, 0.9 * a, 1.2 * a, x, 0.8 * a, z)
  caixa(g, CORES_MUNDO.grama, 0.8 * a, 0.6 * a, 0.8 * a, x, 1.6 * a, z)
}

const FASES: Fase[] = [
  { // 0 prólogo: credenciamento
    titulo: 'Credenciamento', limites: [-5.5, 5.5, -2.8, 3.8], zonas: [],
    montar(g) {
      caixa(g, '#1b1b1b', 4, 1, 0.8, 0, 0, -2.6)
      caixa(g, '#ffffff', 4.1, 0.1, 0.9, 0, 1, -2.6)
      for (let i = -1; i <= 1; i++) caixa(g, CORES_MUNDO.ampla, 0.3, 0.02, 0.4, i * 1.2, 1.1, -2.5)
    },
  },
  { // 1 Novas pessoas: mesas do hackathon
    titulo: 'Novas pessoas', limites: [-5.5, 5.5, -1.2, 3.8], zonas: [[-3.6, 2.2], [3.6, 2.2]],
    montar(g) {
      for (const x of [-2.5, 0]) { mesa(g, x, -2); laptop(g, x - 0.35, -2); laptop(g, x + 0.4, -2) }
      for (const [x, z] of [[-4.4, 2.2], [-2.8, 2.2], [-3.6, 1.3], [-3.6, 3.1]]) banco(g, x, z, CORES_MUNDO.ampla)
      caixa(g, '#8d6748', 1.4, 0.4, 0.45, 3.6, 0, 3.2)
      caixa(g, '#8d6748', 1.4, 0.4, 0.12, 3.6, 0.4, 3.4)
    },
  },
  { // 2 Troca de ajuda: balcão de mentoria
    titulo: 'Troca de ajuda', limites: [-5.5, 5.5, -1.6, 3.8], zonas: [[-3.6, 1.8], [3.6, 1.8]],
    montar(g) {
      caixa(g, '#1b1b1b', 5, 1, 0.8, -0.8, 0, -2.6)
      caixa(g, '#ffffff', 5.1, 0.1, 0.9, -0.8, 1, -2.6)
      for (let i = 0; i < 4; i++) caixa(g, CORES_MUNDO.ampla, 0.3, 0.6, 0.3, -3.6, 0, -1 + i * 0.7)
      mesa(g, 3.6, 1.8, 1.4, 1.0, '#e9e2d0'); banco(g, 3.0, 2.7); banco(g, 4.2, 2.7)
      laptop(g, 3.3, 1.8); laptop(g, 3.9, 1.8)
    },
  },
  { // 3 Cultive conexões: duas metades separadas por um vão
    titulo: 'Cultive conexões', limites: [-5.5, -1.1, -1.5, 3.8], zonas: [[-1.6, 0.5], [-4.4, 2.6]],
    montar(g) {
      caixa(g, CORES_MUNDO.agua, 2, 0.05, 9.2, 0, -0.03, 0.15)
      mesa(g, -3.3, -1.8); laptop(g, -3.3, -1.8)
      mesa(g, 3.3, -1.8); laptop(g, 3.3, -1.8)
      caixa(g, '#1b1b1b', 0.7, 1.1, 0.6, -4.4, 0, 3.3)
      caixa(g, '#ffffff', 0.3, 0.3, 0.05, -4.4, 0.6, 2.98)
      for (let x = -5; x <= 5; x += 1) caixa(g, x % 2 ? '#ffe066' : '#fff3bf', 0.12, 0.12, 0.12, x, 2.4 - Math.abs(x) * 0.06, -3)
    },
  },
  { // 4 Palco DevDay: auditório (também é o cenário do final)
    titulo: 'Palco DevDay', limites: [-5.5, 5.5, -1.6, 3.8], zonas: [[-4.8, 2.6], [0, -1.2]],
    montar(g) {
      caixa(g, '#1b1b1b', 8, 0.6, 1.6, 0, 0, -3)
      caixa(g, '#ffffff', 4, 2, 0.1, 0, 0.6, -3.7)
      caixa(g, CORES_MUNDO.ampla, 1.2, 1.2, 0.12, 0.8, 1, -3.62)
      for (const z of [0.2, 1.4, 2.6]) for (let x = -3; x <= 3; x += 1) banco(g, x, z)
    },
  },
]

// Centros das ilhas no mapa: zigue-zague da esquerda para a direita, como na referência
const ILHAS = [new THREE.Vector3(-34, 0, 6), new THREE.Vector3(-17, 0, -2), new THREE.Vector3(0, 0, 6), new THREE.Vector3(17, 0, -2), new THREE.Vector3(34, 0, 4)]
const ARCO = new THREE.Vector3(4.6, 0, -3.3) // por onde o pet do outro chega (local)
const INICIO = new THREE.Vector3(-1.5, 0, 2.6) // onde o pet entra na ilha (local)

function textoSprite(texto: string, fundo: string, cor = '#ffffff', altura = 0.55) {
  const cv = document.createElement('canvas')
  cv.width = 1024; cv.height = 128
  const ctx = cv.getContext('2d')!
  ctx.font = 'bold 50px system-ui, sans-serif'
  const t = texto.length > 40 ? texto.slice(0, 39) + '…' : texto
  const w = Math.min(1016, ctx.measureText(t).width + 70)
  ctx.fillStyle = fundo
  ctx.beginPath(); ctx.roundRect(512 - w / 2, 4, w, 120, 30); ctx.fill()
  ctx.fillStyle = cor
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(t, 512, 66)
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), depthTest: false }))
  s.scale.set(altura * 8, altura, 1)
  return s
}

// pseudo-aleatório determinístico: o mapa é igual em todo dispositivo
let semente = 7
const rnd = () => ((semente = (semente * 16807) % 2147483647) / 2147483647)

export type Modo = 'mapa' | 'ilha' | 'vitrine'

export class Mundo {
  private renderer: THREE.WebGLRenderer
  private cena = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(36, 1, 0.1, 300)
  private camPos = new THREE.Vector3()
  private camOlhar = new THREE.Vector3()
  private olharAtual = new THREE.Vector3()
  private mapa = new THREE.Group()
  private marcas = new THREE.Group() // ✓ das ilhas concluídas, ponte do cap. 3, contatos
  private extras = new THREE.Group() // zonas e efeitos da ilha atual (coordenadas locais)
  private pet: THREE.Group | null = null
  private amigo: THREE.Group | null = null
  private alvo = new THREE.Vector3()
  private teclas = new Set<string>()
  private zonas: { op: Opcao; x: number; z: number; obj: THREE.Group }[] = []
  private aoEscolher: ((op: Opcao) => void) | null = null
  private limites: Fase['limites'] = [-5, 5, -3, 3]
  private relogio = new THREE.Clock()
  private modo: Modo = 'vitrine'
  private ilha = -1
  private viagem: { de: THREE.Vector3; para: THREE.Vector3; t: number; fim: () => void } | null = null
  private pulo = 0

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
    this.cena.background = new THREE.Color(CORES_MUNDO.fundo)
    this.cena.fog = new THREE.Fog(CORES_MUNDO.fundo, 45, 140)
    this.cena.add(new THREE.HemisphereLight('#ffffff', '#b8a98c', 2.3))
    const sol = new THREE.DirectionalLight('#ffffff', 1.5)
    sol.position.set(6, 12, 8)
    this.cena.add(sol, this.mapa, this.marcas, this.extras)
    this.montarMapa()

    addEventListener('resize', () => this.ajustar())
    addEventListener('keydown', (e) => { if (!(e.target instanceof HTMLInputElement)) this.teclas.add(e.key.toLowerCase()) })
    addEventListener('keyup', (e) => this.teclas.delete(e.key.toLowerCase()))
    addEventListener('blur', () => this.teclas.clear())
    canvas.addEventListener('pointerdown', (e) => this.tocar(e))
    this.ajustar()
    this.camera.position.copy(this.camPos)
    this.olharAtual.copy(this.camOlhar)
    this.renderer.setAnimationLoop(() => this.quadro())
  }

  // ---------- construção ----------

  private montarMapa() {
    const agua = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshLambertMaterial({ color: CORES_MUNDO.agua }))
    agua.rotation.x = -Math.PI / 2
    agua.position.y = -0.9
    this.mapa.add(agua)
    for (let i = 0; i < 40; i++) {
      const s = 0.6 + rnd() * 1.6
      caixa(this.mapa, rnd() > 0.5 ? '#e9e2d0' : '#bfe8b5', s, s, s, (rnd() - 0.5) * 110, -1.2 + rnd() * 0.6, (rnd() - 0.5) * 50)
    }

    ILHAS.forEach((c, i) => {
      const g = new THREE.Group()
      g.position.copy(c)
      // terra, penhasco e borda de grama
      caixa(g, CORES_MUNDO.terra, 12.4, 0.3, 9.4, 0, -0.3, 0.15)
      caixa(g, CORES_MUNDO.penhasco, 12.4, 2.4, 9.4, 0, -2.7, 0.15)
      for (let x = -6; x <= 6; x += 0.8) {
        if (rnd() > 0.35) caixa(g, rnd() > 0.5 ? CORES_MUNDO.grama : CORES_MUNDO.gramaEscura, 0.8, 0.25 + rnd() * 0.3, 0.8, x, -0.05, -4.4)
        if (rnd() > 0.7) caixa(g, CORES_MUNDO.grama, 0.8, 0.2, 0.8, x, -0.05, 4.6)
      }
      arvore(g, -5.4, -3.8, 1.1); arvore(g, 5.6, 3.9, 0.8)
      if (i % 2) arvore(g, -5.5, 3.6, 0.9); else arvore(g, 1.8, -3.9, 1)
      FASES[i].montar(g)
      // arco de entrada com o número da missão
      caixa(g, '#f8f4ea', 0.4, 2.4, 0.4, ARCO.x - 0.9, 0, ARCO.z)
      caixa(g, '#f8f4ea', 0.4, 2.4, 0.4, ARCO.x + 0.9, 0, ARCO.z)
      caixa(g, '#f8f4ea', 2.4, 0.5, 0.5, ARCO.x, 2.4, ARCO.z)
      const n = textoSprite(i === 0 ? '★' : String(i), '#1b1b1b', '#ffffff', 0.9)
      n.scale.set(0.9, 0.9, 1)
      n.position.set(ARCO.x, 3.5, ARCO.z)
      const t = textoSprite(FASES[i].titulo, '#f8f4ea', '#1b1b1b', 0.6)
      t.position.set(ARCO.x - 3.2, 2.6, ARCO.z)
      g.add(n, t)
      // marcador verde onde o pet chega
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.12, 24), mat(CORES_MUNDO.caminhoBorda))
      m.position.set(INICIO.x, 0.03, INICIO.z)
      g.add(m)
      this.mapa.add(g)
    })

    // caminho entre as ilhas
    for (let i = 0; i < ILHAS.length - 1; i++) {
      const a = ILHAS[i].clone().add(new THREE.Vector3(6.2, 0, 1.5))
      const b = ILHAS[i + 1].clone().add(new THREE.Vector3(-6.2, 0, 1.5))
      const meio = a.clone().add(b).multiplyScalar(0.5)
      const comp = a.distanceTo(b)
      const ang = Math.atan2(b.x - a.x, b.z - a.z)
      for (const [w, cor, y] of [[1.6, CORES_MUNDO.caminhoBorda, -0.12], [1.1, CORES_MUNDO.caminho, -0.08]] as const) {
        const p = caixa(this.mapa, cor, w, 0.2, comp, meio.x, y, meio.z)
        p.rotation.y = ang
      }
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
      this.camPos.set(0, 2.2, 5.2)
      this.camOlhar.set(0, 0.6, 0)
    } else if (this.modo === 'mapa' || this.ilha < 0) {
      const d = r < 0.8 ? 2.6 : r < 1.2 ? 1.6 : 1
      this.camPos.set(0, 42 * d, 46 * d)
      this.camOlhar.set(0, 0, 1)
    } else {
      // retrato (celular em pé) precisa de mais distância para caber a ilha
      const d = r < 0.8 ? 1.9 : r < 1.2 ? 1.35 : 1
      const c = ILHAS[this.ilha]
      this.camPos.set(c.x, 11 * d, c.z + 10 * d)
      this.camOlhar.set(c.x, 0, c.z + 0.6)
    }
  }

  /** 'mapa' mostra todas as ilhas; 'ilha' aproxima da ilha atual. */
  verModo(modo: Exclude<Modo, 'vitrine'>) {
    this.modo = modo
    this.ajustar()
  }
  get modoAtual() { return this.modo }

  // ---------- pets ----------

  /** Tela de criação: só o pet girando, de perto. */
  mostrarVitrine(dna: DNA) {
    this.modo = 'vitrine'
    this.mapa.visible = false
    this.trocarPet(dna)
    this.pet!.position.set(0, 0, 0)
    this.ajustar()
    this.camera.position.copy(this.camPos)
    this.olharAtual.copy(this.camOlhar)
  }

  trocarPet(dna: DNA, itens?: Itens) {
    const pos = this.pet?.position.clone()
    const rot = this.pet?.rotation.y ?? 0
    if (this.pet) this.cena.remove(this.pet)
    this.pet = criarPet(dna, itens)
    if (pos) this.pet.position.copy(pos)
    this.pet.rotation.y = rot
    this.cena.add(this.pet)
  }

  /**
   * Leva o pet para a ilha do capítulo. Ilha nova: a câmera abre o mapa, o pet atravessa o caminho e
   * a câmera aproxima. Mesma ilha: só reinicia a ilha (zonas, amigo).
   */
  irPara(cap: number, dna: DNA, itens: Itens) {
    this.mapa.visible = true
    const primeira = this.ilha < 0 || this.modo === 'vitrine'
    if (!this.pet || primeira) this.trocarPet(dna, itens)
    this.limparIlha()
    const destino = ILHAS[cap].clone().add(INICIO)
    if (cap === this.ilha && !primeira) return
    const de = this.ilha >= 0 && !primeira ? this.pet!.position.clone() : null
    this.ilha = cap
    this.limites = [...FASES[cap].limites]
    this.extras.position.copy(ILHAS[cap])
    if (!de) {
      this.pet!.position.copy(destino)
      this.alvo.copy(destino)
      this.verModo('ilha')
      return
    }
    this.verModo('mapa')
    this.viagem = { de, para: destino, t: 0, fim: () => { this.alvo.copy(destino); this.verModo('ilha') } }
  }

  private limparIlha() {
    this.extras.clear()
    this.zonas = []
    this.aoEscolher = null
    if (this.amigo) { this.cena.remove(this.amigo); this.amigo = null }
  }

  /** Estado persistente do mapa: ilhas concluídas, ponte do cap. 3 e contatos parados nas ilhas onde foram conhecidos. */
  atualizarMapa(capAtual: number, escolhas: Opcao[], contatosPorIlha: (DNA | null)[]) {
    this.marcas.clear()
    for (let i = 1; i < Math.min(capAtual, 5); i++) {
      const v = textoSprite('✓', CORES_MUNDO.ampla, '#ffffff', 0.9)
      v.scale.set(0.9, 0.9, 1)
      v.position.copy(ILHAS[i]).add(new THREE.Vector3(ARCO.x + 1.4, 3.4, ARCO.z))
      this.marcas.add(v)
    }
    if (escolhas[2] === 'ampla') this.ponte(this.marcas, ILHAS[3], false)
    contatosPorIlha.forEach((dna, i) => {
      if (!dna || i + 1 === this.ilha) return
      const p = criarPet(dna)
      p.position.copy(ILHAS[i + 1]).add(new THREE.Vector3(-4.6, 0, -0.6))
      p.rotation.y = 0.5
      this.marcas.add(p)
    })
  }

  /** O pet do outro chega pelo arco e passa a seguir o seu. */
  chegarAmigo(dna: DNA) {
    if (this.amigo || this.ilha < 0) return
    this.amigo = criarPet(dna)
    this.amigo.position.copy(ILHAS[this.ilha]).add(ARCO).add(new THREE.Vector3(0, 0, 0.3))
    this.cena.add(this.amigo)
  }

  /** Pet parado na ilha atual (coordenadas locais): contato antigo no cap. 3, amigos no final. */
  colocar(dna: DNA, x: number, z: number, rotY = 0, y = 0) {
    const p = criarPet(dna)
    p.position.set(x, y, z)
    p.rotation.y = rotY
    this.extras.add(p)
    return p
  }

  mostrarZonas(rotulos: [string, string], aoEscolher: (op: Opcao) => void) {
    for (const z of this.zonas) this.extras.remove(z.obj)
    const f = FASES[this.ilha]
    this.zonas = (['ampla', 'profunda'] as const).map((op, i) => {
      const [x, z] = f.zonas[i]
      const cor = op === 'ampla' ? CORES_MUNDO.ampla : CORES_MUNDO.profunda
      const obj = new THREE.Group()
      const anel = new THREE.Mesh(new THREE.RingGeometry(0.75, 0.95, 32), new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.9 }))
      anel.rotation.x = -Math.PI / 2
      anel.position.y = 0.04
      const disco = new THREE.Mesh(new THREE.CircleGeometry(0.75, 32), new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.2 }))
      disco.rotation.x = -Math.PI / 2
      disco.position.y = 0.03
      const r = textoSprite(rotulos[i], cor)
      r.position.y = 2.1
      obj.add(anel, disco, r)
      obj.position.set(x, 0, z)
      this.extras.add(obj)
      return { op, x, z, obj }
    })
    this.aoEscolher = aoEscolher
  }

  private ponte(g: THREE.Object3D, base: THREE.Vector3, animar: boolean) {
    for (let i = 0; i < 5; i++) {
      const t = caixa(g, '#a0522d', 0.35, 0.12, 1.2, base.x - 0.8 + i * 0.4, animar ? -0.8 : 0, base.z + 0.5)
      if (animar) t.userData.subir = 0.25 + i * 0.12
    }
  }

  /** Consequência visível na ilha. */
  consequencia(op: Opcao) {
    for (const z of this.zonas) this.extras.remove(z.obj)
    this.zonas = []
    this.aoEscolher = null
    if (this.ilha === 3 && op === 'ampla') {
      this.ponte(this.extras, new THREE.Vector3(), true)
      this.limites[1] = 5.5
    }
    this.pulo = 1
  }

  /** Final no Palco DevDay: os pets dos contatos aparecem conforme o final. */
  cenaFinal(tipo: 'time' | 'colecionador' | 'amigo', contatos: DNA[]) {
    const c = ILHAS[4]
    const pet = this.pet!
    if (tipo === 'amigo') {
      caixa(this.extras, '#8d6748', 2, 0.35, 0.6, 0, 0.5, 0.6)
      pet.position.set(c.x - 0.5, 0.85, c.z + 0.6)
      this.limites = [-0.5, -0.5, 0.6, 0.6]
      if (contatos[0]) this.colocar(contatos[0], 0.5, 0.6, 0, 0.85)
    } else {
      pet.position.set(c.x, 0.6, c.z - 2.8)
      this.limites = [-3.5, 3.5, -3.2, -2.4]
      if (tipo === 'time') {
        contatos.slice(0, 6).forEach((d, i) => {
          const p = this.colocar(d, (i % 2 ? 1 : -1) * (1.2 + Math.floor(i / 2) * 1.1), -2.7, 0, 0.6)
          p.userData.festa = true
        })
      } else {
        for (let i = 0; i < 26; i++) {
          const k = caixa(this.extras, i % 2 ? '#1fbf5f' : '#ffffff', 0.35, 0.02, 0.45, (rnd() - 0.5) * 6, 0.6 + rnd() * 0.1, -2.8 + (rnd() - 0.5) * 1.2)
          k.rotation.y = rnd() * 3
        }
      }
    }
    pet.rotation.y = 0
    this.alvo.copy(pet.position)
  }

  // ---------- entrada e animação ----------

  private tocar(e: PointerEvent) {
    if (this.modo !== 'ilha' || !this.pet || this.viagem) return
    const r = (e.target as HTMLElement).getBoundingClientRect()
    const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    const ray = new THREE.Raycaster()
    ray.setFromCamera(ndc, this.camera)
    const p = new THREE.Vector3()
    if (ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -this.pet.position.y), p)) this.alvo.copy(p)
  }

  private quadro() {
    const dt = Math.min(this.relogio.getDelta(), 0.05)
    const t = this.relogio.elapsedTime
    if (document.hidden) return
    this.camera.position.lerp(this.camPos, Math.min(1, dt * 3))
    this.olharAtual.lerp(this.camOlhar, Math.min(1, dt * 3))
    this.camera.lookAt(this.olharAtual)
    if (this.modo === 'vitrine' && this.pet) {
      this.pet.rotation.y += dt * 0.8
      this.pet.userData.corpo.position.y = Math.abs(Math.sin(t * 3)) * 0.06
    } else if (this.pet) {
      if (this.viagem) this.viajar(dt, t)
      else this.moverPet(dt, t)
      this.moverAmigo(dt, t)
      this.animarExtras(dt, t)
    }
    this.renderer.render(this.cena, this.camera)
  }

  private viajar(dt: number, t: number) {
    const v = this.viagem!
    v.t = Math.min(1, v.t + dt / 2.2)
    const s = v.t * v.t * (3 - 2 * v.t)
    this.pet!.position.lerpVectors(v.de, v.para, s)
    this.pet!.rotation.y = Math.atan2(v.para.x - v.de.x, v.para.z - v.de.z)
    this.pet!.userData.corpo.position.y = Math.abs(Math.sin(t * 14)) * 0.15
    if (v.t >= 1) { this.viagem = null; v.fim() }
  }

  private moverPet(dt: number, t: number) {
    const pet = this.pet!
    const k = this.teclas
    const dir = new THREE.Vector3(
      (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0), 0,
      (k.has('s') || k.has('arrowdown') ? 1 : 0) - (k.has('w') || k.has('arrowup') ? 1 : 0),
    )
    if (dir.lengthSq() > 0 && this.modo === 'ilha') this.alvo.copy(pet.position).addScaledVector(dir.normalize(), 0.5)
    if (this.ilha >= 0) {
      const c = ILHAS[this.ilha]
      const [x0, x1, z0, z1] = this.limites
      this.alvo.x = THREE.MathUtils.clamp(this.alvo.x, c.x + x0, c.x + x1)
      this.alvo.z = THREE.MathUtils.clamp(this.alvo.z, c.z + z0, c.z + z1)
    }
    this.alvo.y = pet.position.y

    const delta = this.alvo.clone().sub(pet.position)
    const andando = delta.length() > 0.05
    if (andando) {
      pet.position.addScaledVector(delta.normalize(), Math.min(delta.length(), 4.5 * dt))
      pet.rotation.y = Math.atan2(delta.x, delta.z)
    }
    const corpo: THREE.Group = pet.userData.corpo
    if (this.pulo > 0) {
      this.pulo = Math.max(0, this.pulo - dt * 1.2)
      corpo.position.y = Math.sin(this.pulo * Math.PI * 3) ** 2 * 0.6
      pet.rotation.y += dt * 8
    } else {
      corpo.position.y = andando ? Math.abs(Math.sin(t * 14)) * 0.12 : 0
      corpo.scale.y = andando ? 1 : 1 + Math.sin(t * 3) * 0.03
    }

    if (this.aoEscolher) {
      const c = ILHAS[this.ilha]
      for (const z of this.zonas) {
        if (Math.hypot(pet.position.x - c.x - z.x, pet.position.z - c.z - z.z) < 0.8) {
          const cb = this.aoEscolher
          this.aoEscolher = null
          cb(z.op)
          break
        }
      }
    }
  }

  private moverAmigo(dt: number, t: number) {
    const a = this.amigo
    if (!a) return
    const pet = this.pet!
    const destino = pet.position.clone().add(new THREE.Vector3(Math.sin(pet.rotation.y + 2.2), 0, Math.cos(pet.rotation.y + 2.2)).multiplyScalar(1.1))
    destino.y = pet.position.y
    const delta = destino.sub(a.position)
    const andando = delta.length() > 0.15
    if (andando) {
      a.position.addScaledVector(delta.normalize(), Math.min(delta.length(), 4 * dt))
      a.rotation.y = Math.atan2(delta.x, delta.z)
    }
    a.userData.corpo.position.y = andando ? Math.abs(Math.sin(t * 13 + 1)) * 0.12 : 0
  }

  private animarExtras(dt: number, t: number) {
    for (const z of this.zonas) {
      z.obj.children[0].scale.setScalar(1 + Math.sin(t * 4) * 0.06)
      z.obj.children[2].position.y = 2.1 + Math.sin(t * 2) * 0.08
    }
    for (const o of this.extras.children) {
      if (o.userData.subir !== undefined) {
        o.userData.subir -= dt
        if (o.userData.subir < 0 && o.position.y < 0.06) o.position.y = Math.min(0.06, o.position.y + dt * 3)
      }
      if (o.userData.festa) o.userData.corpo.position.y = Math.abs(Math.sin(t * 6 + o.position.x)) * 0.3
    }
  }
}
