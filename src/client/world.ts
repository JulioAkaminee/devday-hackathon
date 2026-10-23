import * as THREE from 'three'
import type { Opcao } from '../shared/engine.ts'
import { criarPet, type DNA, type Itens } from './pet.ts'

// Mundo estilo Overcooked: fase pequena, câmera fixa, o pet anda e escolhe caminhando (QUEBRA-GELO.md, 3A)

interface Zona { op: Opcao; x: number; z: number; rotulo: string }
interface Fase {
  chao: string
  parede: string
  limites: [number, number, number, number] // xmin, xmax, zmin, zmax
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
const banco = (g: THREE.Object3D, x: number, z: number, cor = '#e8590c') => {
  caixa(g, cor, 0.45, 0.1, 0.45, x, 0.35, z)
  caixa(g, '#495057', 0.08, 0.35, 0.08, x, 0, z)
}
const laptop = (g: THREE.Object3D, x: number, z: number) => {
  caixa(g, '#adb5bd', 0.4, 0.03, 0.28, x, 0.74, z)
  caixa(g, '#343a40', 0.4, 0.26, 0.03, x, 0.77, z - 0.13)
}
const planta = (g: THREE.Object3D, x: number, z: number) => {
  caixa(g, '#d9480f', 0.4, 0.4, 0.4, x, 0, z)
  caixa(g, '#2f9e44', 0.55, 0.5, 0.55, x, 0.4, z)
  caixa(g, '#40c057', 0.35, 0.3, 0.35, x, 0.9, z)
}

const FASES: Fase[] = [
  { // 0 prólogo: credenciamento
    chao: '#ffe8cc', parede: '#74c0fc', limites: [-5.5, 5.5, -3.5, 3.8], zonas: [],
    montar(g) {
      caixa(g, '#4263eb', 4, 1, 0.8, 0, 0, -2.6)
      caixa(g, '#ffffff', 4.1, 0.1, 0.9, 0, 1, -2.6)
      for (let i = -1; i <= 1; i++) caixa(g, '#ffd43b', 0.3, 0.02, 0.4, i * 1.2, 1.1, -2.5)
      planta(g, -5, -3.2); planta(g, 5, -3.2)
    },
  },
  { // 1 mesas do hackathon
    chao: '#e7f5ff', parede: '#9775fa', limites: [-5.5, 5.5, -3.5, 3.8], zonas: [[-3.6, 2.2], [3.6, 2.2]],
    montar(g) {
      for (const x of [-2.5, 0, 2.5]) { mesa(g, x, -2); laptop(g, x - 0.35, -2); laptop(g, x + 0.4, -2) }
      for (const [x, z] of [[-4.4, 2.2], [-2.8, 2.2], [-3.6, 1.3], [-3.6, 3.1]]) banco(g, x, z, '#f76707')
      caixa(g, '#8d6748', 1.4, 0.4, 0.45, 3.6, 0, 3.2)
      caixa(g, '#8d6748', 1.4, 0.4, 0.12, 3.6, 0.4, 3.4)
      planta(g, 5, -3.2)
    },
  },
  { // 2 balcão de mentoria
    chao: '#fff3bf', parede: '#20c997', limites: [-5.5, 5.5, -3.5, 3.8], zonas: [[-3.6, 1.8], [3.6, 1.8]],
    montar(g) {
      caixa(g, '#0ca678', 6, 1, 0.8, 0, 0, -2.6)
      caixa(g, '#ffffff', 6.1, 0.1, 0.9, 0, 1, -2.6)
      for (let i = 0; i < 4; i++) caixa(g, '#ff922b', 0.3, 0.6, 0.3, -3.6, 0, -1 + i * 0.7)
      mesa(g, 3.6, 1.8, 1.4, 1.0, '#a9e34b'); banco(g, 3.0, 2.7, '#5c7cfa'); banco(g, 4.2, 2.7, '#5c7cfa')
      laptop(g, 3.3, 1.8); laptop(g, 3.9, 1.8)
    },
  },
  { // 3 ilhas separadas por um vão
    chao: '#d3f9d8', parede: '#ff8787', limites: [-5.5, -1.1, -3.5, 3.8], zonas: [[-1.6, 0.5], [-4.4, 2.6]],
    montar(g) {
      caixa(g, '#4dabf7', 2, 0.02, 9, 0, 0.01, 0.1)
      mesa(g, -3.3, -2); laptop(g, -3.3, -2)
      mesa(g, 3.3, -2); laptop(g, 3.3, -2)
      caixa(g, '#495057', 0.7, 1.1, 0.6, -4.4, 0, 3.3)
      caixa(g, '#e03131', 0.5, 0.15, 0.1, -4.4, 0.8, 3.0)
    },
  },
  { // 4 auditório
    chao: '#f3d9fa', parede: '#e64980', limites: [-5.5, 5.5, -1.6, 3.8], zonas: [[-4.8, 2.6], [0, -1.2]],
    montar(g) {
      caixa(g, '#862e9c', 8, 0.6, 1.6, 0, 0, -3)
      caixa(g, '#f8f9fa', 3, 1.6, 0.1, 0, 0.6, -3.7)
      for (const z of [0.2, 1.4, 2.6]) for (let x = -3; x <= 3; x += 1) banco(g, x, z, '#c2255c')
    },
  },
  { // 5 final: palco
    chao: '#fff9db', parede: '#fab005', limites: [-5.5, 5.5, -3.5, 3.8], zonas: [],
    montar(g) {
      caixa(g, '#e8590c', 7, 0.5, 3, 0, 0, -1.5)
      for (let x = -3; x <= 3; x += 1.5) caixa(g, '#ffd43b', 0.15, 2.5, 0.15, x, 0.5, -2.9)
    },
  },
]

const PORTA = new THREE.Vector3(4.6, 0, -3.2)

function rotulo(texto: string, cor: string) {
  const cv = document.createElement('canvas')
  cv.width = 1024; cv.height = 128
  const ctx = cv.getContext('2d')!
  ctx.font = 'bold 46px system-ui, sans-serif'
  const t = texto.length > 40 ? texto.slice(0, 39) + '…' : texto
  const w = Math.min(1016, ctx.measureText(t).width + 70)
  ctx.fillStyle = cor
  ctx.beginPath(); ctx.roundRect(512 - w / 2, 4, w, 120, 40); ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(t, 512, 66)
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), depthTest: false }))
  s.scale.set(4.4, 0.55, 1)
  return s
}

export class Mundo {
  private renderer: THREE.WebGLRenderer
  private cena = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
  private fase = new THREE.Group()
  private extras = new THREE.Group()
  private pet: THREE.Group | null = null
  private amigo: THREE.Group | null = null
  private porta!: THREE.Mesh
  private alvo = new THREE.Vector3()
  private teclas = new Set<string>()
  private zonas: (Zona & { obj: THREE.Group })[] = []
  private aoEscolher: ((op: Opcao) => void) | null = null
  private limites: Fase['limites'] = [-5, 5, -3, 3]
  private relogio = new THREE.Clock()
  private vitrine = false
  private ponte = false

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
    this.cena.background = new THREE.Color('#a5d8ff')
    this.cena.add(new THREE.HemisphereLight('#ffffff', '#8c6e54', 2.2))
    const sol = new THREE.DirectionalLight('#ffffff', 1.6)
    sol.position.set(4, 10, 6)
    this.cena.add(sol, this.fase, this.extras)

    addEventListener('resize', () => this.ajustar())
    addEventListener('keydown', (e) => this.teclas.add(e.key.toLowerCase()))
    addEventListener('keyup', (e) => this.teclas.delete(e.key.toLowerCase()))
    canvas.addEventListener('pointerdown', (e) => this.tocar(e))
    document.addEventListener('visibilitychange', () => this.relogio.getDelta())
    this.ajustar()
    this.renderer.setAnimationLoop(() => this.quadro())
  }

  private ajustar() {
    const w = innerWidth, h = innerHeight
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    // retrato (celular em pé) precisa de mais distância para caber a fase
    const d = w / h < 0.8 ? 1.9 : w / h < 1.2 ? 1.35 : 1
    this.camera.position.set(0, 11 * d, 10 * d)
    this.camera.lookAt(this.vitrine ? new THREE.Vector3(0, 0.6, 0) : new THREE.Vector3(0, 0, 0.6))
    if (this.vitrine) { this.camera.position.set(0, 2.2, 5.2); this.camera.lookAt(0, 0.6, 0) }
    this.camera.updateProjectionMatrix()
  }

  /** Tela de criação: só o pet girando, de perto. */
  mostrarVitrine(dna: DNA) {
    this.vitrine = true
    this.limparFase()
    this.trocarPet(dna)
    this.cena.background = new THREE.Color('#ffe8cc')
    this.ajustar()
  }

  montarFase(cap: number, dna: DNA, itens: Itens) {
    this.vitrine = false
    this.limparFase()
    const f = FASES[cap]
    this.cena.background = new THREE.Color(f.parede).lerp(new THREE.Color('#ffffff'), 0.55)
    const [x0, x1, z0, z1] = [-6, 6, -4, 4.3]
    caixa(this.fase, f.chao, x1 - x0, 0.3, z1 - z0, 0, -0.3, (z0 + z1) / 2)
    caixa(this.fase, f.parede, x1 - x0, 1.6, 0.3, 0, 0, z0)
    caixa(this.fase, f.parede, 0.3, 1.6, z1 - z0, x0, 0, (z0 + z1) / 2)
    caixa(this.fase, f.parede, 0.3, 1.6, z1 - z0, x1, 0, (z0 + z1) / 2)
    this.porta = caixa(this.fase, '#5c3d2e', 1.1, 1.5, 0.15, PORTA.x, 0, z0 + 0.2)
    caixa(this.fase, '#ffd43b', 0.1, 0.1, 0.05, PORTA.x - 0.35, 0.7, z0 + 0.3)
    f.montar(this.fase)
    this.limites = [...f.limites]
    this.ponte = false
    this.trocarPet(dna, itens)
    this.pet!.position.set(-1.5, 0, 2.6)
    this.alvo.copy(this.pet!.position)
    this.ajustar()
  }

  private limparFase() {
    for (const g of [this.fase, this.extras]) g.clear()
    this.zonas = []
    this.aoEscolher = null
    if (this.amigo) { this.cena.remove(this.amigo); this.amigo = null }
  }

  trocarPet(dna: DNA, itens?: Itens) {
    const pos = this.pet?.position.clone()
    if (this.pet) this.cena.remove(this.pet)
    this.pet = criarPet(dna, itens)
    if (pos) this.pet.position.copy(pos)
    this.cena.add(this.pet)
  }

  /** O pet do outro entra pela porta e passa a seguir o seu. */
  chegarAmigo(dna: DNA) {
    if (this.amigo) return
    this.amigo = criarPet(dna)
    this.amigo.position.copy(PORTA).add(new THREE.Vector3(0, 0, 0.6))
    this.amigo.userData.entrando = 1
    this.cena.add(this.amigo)
  }

  /** Coloca um pet parado na fase (contato antigo do cap. 3, amigos no final). */
  colocar(dna: DNA, x: number, z: number, rotY = 0) {
    const p = criarPet(dna)
    p.position.set(x, 0, z)
    p.rotation.y = rotY
    this.extras.add(p)
    return p
  }

  mostrarZonas(cap: number, rotulos: [string, string], aoEscolher: (op: Opcao) => void) {
    const f = FASES[cap]
    for (const z of this.zonas) this.extras.remove(z.obj)
    this.zonas = (['ampla', 'profunda'] as const).map((op, i) => {
      const [x, z] = f.zonas[i]
      const cor = op === 'ampla' ? '#f76707' : '#7048e8'
      const obj = new THREE.Group()
      const anel = new THREE.Mesh(new THREE.RingGeometry(0.75, 0.95, 32), new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.85 }))
      anel.rotation.x = -Math.PI / 2
      anel.position.y = 0.03
      const disco = new THREE.Mesh(new THREE.CircleGeometry(0.75, 32), new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.25 }))
      disco.rotation.x = -Math.PI / 2
      disco.position.y = 0.02
      const r = rotulo((op === 'ampla' ? '📣 ' : '☕ ') + rotulos[i], cor)
      r.position.y = 2.1
      obj.add(anel, disco, r)
      obj.position.set(x, 0, z)
      this.extras.add(obj)
      return { op, x, z, rotulo: rotulos[i], obj }
    })
    this.aoEscolher = aoEscolher
  }

  /** Consequência visível no mundo. */
  consequencia(cap: number, op: Opcao) {
    for (const z of this.zonas) this.extras.remove(z.obj)
    this.zonas = []
    this.aoEscolher = null
    if (cap === 3 && op === 'ampla') {
      this.ponte = true
      for (let i = 0; i < 5; i++) {
        const tabua = caixa(this.extras, '#a0522d', 0.35, 0.12, 1.2, -0.8 + i * 0.4, -0.8, 0.5)
        tabua.userData.subir = 0.25 + i * 0.12
      }
      this.limites[1] = 5.5
    }
    this.pulo = 1
  }

  private pulo = 0

  private tocar(e: PointerEvent) {
    if (this.vitrine || !this.pet) return
    const r = (e.target as HTMLElement).getBoundingClientRect()
    const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    const ray = new THREE.Raycaster()
    ray.setFromCamera(ndc, this.camera)
    const p = new THREE.Vector3()
    if (ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p)) this.alvo.copy(p)
  }

  private quadro() {
    const dt = Math.min(this.relogio.getDelta(), 0.05)
    const t = this.relogio.elapsedTime
    if (document.hidden) return
    if (this.vitrine && this.pet) {
      this.pet.rotation.y += dt * 0.8
      this.pet.userData.corpo.position.y = Math.abs(Math.sin(t * 3)) * 0.06
    } else if (this.pet) {
      this.moverPet(dt, t)
      this.moverAmigo(dt, t)
      this.animarExtras(dt, t)
    }
    this.renderer.render(this.cena, this.camera)
  }

  private moverPet(dt: number, t: number) {
    const pet = this.pet!
    const k = this.teclas
    const dir = new THREE.Vector3(
      (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0), 0,
      (k.has('s') || k.has('arrowdown') ? 1 : 0) - (k.has('w') || k.has('arrowup') ? 1 : 0),
    )
    if (dir.lengthSq() > 0) this.alvo.copy(pet.position).addScaledVector(dir.normalize(), 0.5)
    const [x0, x1, z0, z1] = this.limites
    this.alvo.x = THREE.MathUtils.clamp(this.alvo.x, x0, x1)
    this.alvo.z = THREE.MathUtils.clamp(this.alvo.z, z0, z1)

    const delta = this.alvo.clone().sub(pet.position)
    const andando = delta.length() > 0.05
    if (andando) {
      const passo = Math.min(delta.length(), 4.5 * dt)
      pet.position.addScaledVector(delta.normalize(), passo)
      pet.rotation.y = Math.atan2(delta.x, delta.z)
    }
    // quicar estilo Overcooked: pula ao andar, respira parado
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
      for (const z of this.zonas) {
        if (Math.hypot(pet.position.x - z.x, pet.position.z - z.z) < 0.8) {
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
    // porta abre enquanto o amigo entra
    if (a.userData.entrando > 0) {
      a.userData.entrando = Math.max(0, a.userData.entrando - dt * 0.7)
      this.porta.rotation.y = Math.sin(a.userData.entrando * Math.PI) * 1.4
    }
    const pet = this.pet!
    const destino = pet.position.clone().add(new THREE.Vector3(Math.sin(pet.rotation.y + 2.2), 0, Math.cos(pet.rotation.y + 2.2)).multiplyScalar(1.1))
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
        if (o.userData.subir < 0 && o.position.y < 0.02) o.position.y = Math.min(0.02, o.position.y + dt * 3)
      }
      if (o.userData.festa) o.userData.corpo.position.y = Math.abs(Math.sin(t * 6 + o.position.x)) * 0.3
    }
  }

  /** Final: os pets dos contatos aparecem conforme o final (QUEBRA-GELO.md, 3). */
  cenaFinal(tipo: 'time' | 'colecionador' | 'amigo', contatos: DNA[]) {
    const pet = this.pet!
    pet.position.set(0, 0.5, -1.2)
    this.alvo.copy(pet.position)
    this.limites = [-3.2, 3.2, -2.6, -0.2]
    if (tipo === 'time') {
      contatos.slice(0, 6).forEach((d, i) => {
        const p = this.colocar(d, (i % 2 ? 1 : -1) * (1.2 + Math.floor(i / 2) * 1.1), -1.5 + (i % 2) * 0.1)
        p.position.y = 0.5
        p.userData.festa = true
      })
    } else if (tipo === 'colecionador') {
      for (let i = 0; i < 26; i++) {
        const c = caixa(this.extras, i % 2 ? '#4dabf7' : '#ffffff', 0.35, 0.02, 0.45, (Math.random() - 0.5) * 5, 0.5 + Math.random() * 0.1, -1.2 + (Math.random() - 0.5) * 2)
        c.rotation.y = Math.random() * 3
      }
    } else {
      caixa(this.extras, '#8d6748', 2, 0.35, 0.6, 0, 0.5, 0.6)
      pet.position.set(-0.5, 0.85, 0.6)
      this.alvo.copy(pet.position)
      this.limites = [-0.5, -0.5, 0.6, 0.6]
      if (contatos[0]) { const p = this.colocar(contatos[0], 0.5, 0.6); p.position.y = 0.85 }
    }
  }
}
