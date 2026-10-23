import { animate, MotionGlobalConfig, stagger } from 'motion'
import QRCode from 'qrcode'
import type { Estado, Final, Opcao } from '../shared/engine.ts'
import { finalDe, TOTAL_CAPITULOS } from '../shared/engine.ts'
import {
  ACESSORIOS, CAPITULOS, COR_ESPECIE, ESPECIES, FINAIS, NOMES_ACESSORIO, NOMES_ESPECIE, PERSONALIDADE, PROLOGO, TEMAS, preencher,
  type Tema,
} from '../shared/story.ts'
import {
  ATIVIDADES, CAPITULO_SUGERIDO, DIAGNOSTICO, HABILIDADES, NOMES_HABILIDADE, type Academia, type Habilidade, type Questao,
} from '../shared/academia.ts'
import { itensDe, retrato, type DNA } from './pet.ts'
import { Mundo } from './world.ts'
import './mao.ts'
import './style.css'

interface PetPublico extends DNA {
  id: string; codigo: string; nome: string; dono: string; linkedin?: string
  area: Tema[]; procura: Tema[]; oferece: Tema[]; demo: boolean
}
interface Visao {
  pet: PetPublico
  estado: Estado
  amigo: PetPublico | null
  conhecidos: PetPublico[]
  capitulosSalvos: number[]
  sugestoes: PetPublico[]
  academia: Academia & { progresso: Record<Habilidade, { feitas: number; total: number }>; proxima: string | null; fraca: Habilidade | null }
}
type Aba = 'mapa' | 'academia' | 'contatos' | 'conexoes' | 'finais'

const NOMES_TEMA: Record<Tema, string> = {
  front: 'front-end', back: 'back-end', fullstack: 'fullstack', mobile: 'mobile', dados: 'dados', design: 'design', produto: 'produto',
  marketing: 'marketing', comercial: 'comercial', rh: 'RH e pessoas', gestao: 'gestão', carreira: 'carreira',
}
// na criação, as áreas de fora da tecnologia vêm primeiro: quem é de RH ou comercial se acha sem rolar
const FORA_DA_TI: readonly Tema[] = ['marketing', 'comercial', 'rh', 'gestao']
const ORDEM_TEMAS = [...FORA_DA_TI, ...TEMAS.filter((t) => !FORA_DA_TI.includes(t))]
/** Lista de áreas em português: "front-end", "front-end e design", "front-end, design e dados". */
const nomes = (ts: Tema[] = []) =>
  ts.length > 1 ? `${ts.slice(0, -1).map((t) => NOMES_TEMA[t]).join(', ')} e ${NOMES_TEMA[ts[ts.length - 1]]}` : NOMES_TEMA[ts[0]] ?? ''
const SUGESTOES_NOME = ['Xícaro', 'Bolacha', 'Pipoca', 'Tampinha', 'Biscoito', 'Faísca', 'Pudim', 'Teco', 'Bug', 'Cometa']

// Ícones de traço (24px, traço 1.75): desenhados aqui, sem biblioteca e sem emoji
const svg = (d: string) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" aria-hidden="true">${d}</svg>`
const ICONE = {
  mapa: svg('<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>'),
  academia: svg('<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/>'),
  contatos: svg('<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M16 14c3 0 5 2.2 5 5"/>'),
  conexoes: svg('<path d="M5 20V12M12 20V5M19 20v-9"/>'),
  finais: svg('<path d="M7 4h10v5a5 5 0 01-10 0z"/><path d="M7 6H4v1a3 3 0 003 3M17 6h3v1a3 3 0 01-3 3M12 14v4M8 20h8"/>'),
  escanear: svg('<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/><path d="M8 12h8"/>'),
  conversa: svg('<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10.5h.01M12 10.5h.01M16 10.5h.01" stroke-width="2.6"/>'),
  aprofundar: svg('<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M3 20c0-3 2.2-5 5-5 1.6 0 3 .6 4 1.7 1-1.1 2.4-1.7 4-1.7 2.8 0 5 2 5 5"/>'),
  seta: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  voltar: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  dado: svg('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9h.01M15 15h.01M15 9h.01M9 15h.01M12 12h.01" stroke-width="2.6"/>'),
}
// Marca: o cubo de gelo voxel, rachado no topo, com os olhos de anel do banner do evento
// Os olhos seguem o ponteiro (spring do motion); o render reaproveita a última posição
const olhar = { x: 0, y: 0 }
const MARCA = () => {
  const t = `style="transform: translate(${olhar.x}px, ${olhar.y}px)"`
  // olhos desenhados no plano da face esquerda (matrix = inclinação isométrica)
  const olho = (x: number) => `<ellipse class="olho" ${t} cx="${x}" cy="39" rx="5" ry="7.2"/>`
  // as duas metades se separam pela rachadura e voltam; duas lascas saltam (animação no CSS)
  const costura = 'M50 10 44 19 53 27 45 36 50 46'
  return `<svg class="marca" viewBox="0 0 100 100" data-amp="3.2" aria-hidden="true"><g stroke="var(--tinta)" stroke-width="3.2" stroke-linejoin="round">` +
    `<g class="metade esq"><path d="${costura} 14 28z" fill="#e8f7ed"/><path d="M14 28 50 46 50 92 14 72z" fill="var(--verde)"/>` +
    `<g transform="matrix(1 .5 0 1 0 0)" fill="none" stroke-width="3.6">${olho(25)}${olho(39)}</g></g>` +
    `<g class="metade dir"><path d="${costura} 86 28z" fill="#e8f7ed"/><path d="M86 28 50 46 50 92 86 72z" fill="#178a39"/></g>` +
    `<path class="lasca um" d="M44 2 49 4.5 44 7 39 4.5z" fill="#e8f7ed" stroke-width="2"/><path class="lasca dois" d="M57 0 61 2 57 4 53 2z" fill="var(--verde)" stroke-width="2"/></g></svg>`
}
const LOGO = () => `<span class="logo">${MARCA()}<span>Quebra-Gelo</span></span>`
const EVENTO = '<span class="evento"><span>DevDay</span><span>Community Hackathon</span><span>São Paulo</span></span>'

const ui = document.querySelector<HTMLDivElement>('#ui')!
const mundo = new Mundo(document.querySelector<HTMLCanvasElement>('#cena')!)

// prefers-reduced-motion: o motion pula direto para o estado final e o mundo para de balançar
const calmo = matchMedia('(prefers-reduced-motion: reduce)')
const aplicarCalmo = () => { MotionGlobalConfig.skipAnimations = calmo.matches; mundo.calmo = calmo.matches }
aplicarCalmo()
calmo.addEventListener('change', aplicarCalmo)

// iOS com cookies bloqueados lança erro só de tocar no storage
const armazem = (s: () => Storage) => ({
  get: (k: string) => { try { return s().getItem(k) } catch { return null } },
  set: (k: string, v: string | null) => { try { v === null ? s().removeItem(k) : s().setItem(k, v) } catch { /* sem storage: segue sem salvar */ } },
})
const guardado = armazem(() => localStorage)
const sessao = armazem(() => sessionStorage)
let token = guardado.get('qg-token')

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
// o servidor só manda o LinkedIn de quem você já encontrou, e só letras, números e hífen
const IN = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="4" fill="currentColor"/><text x="12" y="16.6" text-anchor="middle" font-size="11.5" font-weight="700" fill="var(--papel)" font-family="Inter Tight, sans-serif">in</text></svg>'
const linkedin = (c: { linkedin?: string; dono: string }, classe: string, rotulo = '') => c.linkedin
  ? `<a class="${classe}" href="https://www.linkedin.com/in/${encodeURIComponent(c.linkedin)}" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn de ${esc(c.dono)}">${IN}${rotulo}</a>`
  : ''
const h = (html: string) => { ui.innerHTML = html }
const foto = (p: DNA, cls = 'foto') => `<img class="${cls}" src="${retrato(p)}" alt="">`

function aviso(msg: string, tipo: 'erro' | 'ok' = 'erro') {
  const t = document.createElement('div')
  t.className = 'aviso ' + tipo
  t.setAttribute('role', 'status')
  t.textContent = msg
  document.body.append(t)
  animate(t, { opacity: [0, 1], y: [-12, 0] }, { type: 'spring', stiffness: 380, damping: 26 })
  setTimeout(() => animate(t, { opacity: 0, y: -8 }, { duration: 0.2 }).then(() => t.remove()), 3200)
}

async function api<T = Visao>(rota: string, corpo?: object): Promise<T> {
  let r: Response
  try {
    r = await fetch('/api/' + rota, {
      method: corpo ? 'POST' : 'GET',
      headers: { 'content-type': 'application/json', ...(token ? { 'x-token': token } : {}) },
      body: corpo ? JSON.stringify(corpo) : undefined,
      signal: AbortSignal.timeout(8000),
    })
  } catch {
    throw new Error('sem conexão, tente de novo') // em vez de "Failed to fetch"
  }
  const dados = await r.json().catch(() => ({}))
  // token velho (servidor perdeu os pets): recomeça pela criação em vez de travar em erro
  if (r.status === 401 && token) { guardado.set('qg-token', null); location.reload() }
  if (!r.ok) throw Object.assign(new Error(dados.erro ?? 'falha na rede'), { status: r.status })
  return dados
}

// ---------- Criação do pet (D1: uma tela, sem IA, sem foto) ----------

interface Stats { pessoas: number; encontros: number; linkedins: number; jogando: number; finais: number }

/** Prova social da sala: some se a rede falhar, nunca atrapalha a criação. */
function mostrarStats() {
  const alvo = ui.querySelector<HTMLElement>('[data-stats]')
  if (!alvo) return
  fetch('/api/stats', { signal: AbortSignal.timeout(4000) })
    .then((r) => (r.ok ? (r.json() as Promise<Stats>) : null))
    .then((s) => {
      if (!s || !alvo.isConnected) return
      alvo.hidden = false
      alvo.innerHTML = s.pessoas
        ? `<b>${s.pessoas}</b> ${s.pessoas === 1 ? 'pessoa com pet' : 'pessoas com pet'} · <b>${s.encontros}</b> ${s.encontros === 1 ? 'encontro' : 'encontros'} entre gente de verdade` +
          (s.finais ? ` · <b>${s.finais}</b> ${s.finais === 1 ? 'final' : 'finais'}` : '')
        : 'Seja o primeiro a criar um pet hoje.'
    })
    .catch(() => {})
}

/** Criação em três passos curtos: o pet, os nomes e o que a pessoa busca hoje. */
function telaCriar() {
  document.body.className = 'criando'
  // a bola do banner fica atrás do canvas (fora do #ui) e olha o ponteiro como a marca do topo
  if (!document.querySelector('.bola-criar')) document.body.insertAdjacentHTML('beforeend',
    `<svg class="marca bola-criar" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="50" fill="var(--verde)"/><ellipse class="olho" cx="24" cy="26" rx="6" ry="8.2" fill="none" stroke="var(--tinta)" stroke-width="3.4"/><ellipse class="olho" cx="52" cy="24" rx="6" ry="8.2" fill="none" stroke="var(--tinta)" stroke-width="3.4"/></svg>`)
  const dna: DNA = { especie: 'xicara', cor: COR_ESPECIE.xicara, acessorio: 'nenhum' }
  // procura começa diferente da área: o par procura/oferece é o que cruza as pessoas na Missão 2
  type Campo = 'nome' | 'dono' | 'linkedin'
  type Pergunta = 'area' | 'procura' | 'oferece'
  const perfil: Record<Campo, string> = {
    nome: SUGESTOES_NOME[Math.floor(Math.random() * SUGESTOES_NOME.length)], dono: '', linkedin: '',
  }
  // mais de uma por pergunta: "trabalho com front e design" é comum, e restringir a uma empobrece as sugestões
  const marcados: Record<Pergunta, Tema[]> = { area: ['front'], procura: ['back'], oferece: ['front'] }
  // o primeiro toque troca a sugestão inicial em vez de somar a ela: quem toca "marketing" quer marketing
  const tocou = new Set<Pergunta>()
  let passo = -1 // -1 é a boas-vindas: proposta e como funciona antes de pedir qualquer coisa
  mundo.mostrarVitrine(dna)

  // pet, nomes e as três perguntas do dia, uma por tela
  const TOTAL = 5
  const progresso = () =>
    `<div class="progresso" aria-label="Passo ${passo + 1} de ${TOTAL}">${Array.from({ length: TOTAL }, (_, i) => `<i class="${i < passo ? 'feito' : i === passo ? 'atual' : ''}"></i>`).join('')}<span>${passo + 1} de ${TOTAL}</span></div>`
  const opcao = (grupo: string, v: string, rotulo: string, sel: boolean, extra = '') =>
    `<button type="button" class="${sel ? 'sel' : ''}" aria-pressed="${sel}" data-v="${v}" ${grupo === 'especie' ? `aria-label="${rotulo}"` : ''}>${extra}${grupo === 'especie' ? `<span>${rotulo}</span>` : rotulo}</button>`
  const chips = (campo: Pergunta) =>
    `<div class="chips" data-perfil="${campo}" role="group" aria-label="Escolha uma ou mais">${ORDEM_TEMAS.map((t) => opcao(campo, t, NOMES_TEMA[t], marcados[campo].includes(t))).join('')}</div>`
  const proximo = `<button class="principal">Próximo ${ICONE.seta}</button>`
  // as três perguntas do dia: título, por que importa e as áreas para tocar
  const PERGUNTAS: Record<number, { campo: 'area' | 'procura' | 'oferece'; titulo: string; dica: string }> = {
    2: { campo: 'area', titulo: 'Com o que você trabalha?', dica: 'Pode marcar mais de uma. É assim que o jogo sugere com quem conversar.' },
    3: { campo: 'procura', titulo: 'Com o que você quer ajuda hoje?', dica: 'Pode marcar mais de uma. Na Missão 2 a gente mostra quem pode ajudar com isso.' },
    4: { campo: 'oferece', titulo: 'Com o que você pode ajudar?', dica: 'Pode marcar mais de uma. Quem precisa disso vê o seu pet como sugestão.' },
  }
  const voltar = (para: number) => `<button type="button" class="discreto" data-ir="${para}">${ICONE.voltar} Voltar</button>`

  const conteudo = () => {
    if (passo === -1) return `
      <div class="hero">
        <p class="rotulo">O jogo de networking do DevDay</p>
        <h2 class="chamada">Seu pet só cresce quando você conversa com alguém de verdade.</h2>
        <p class="subchamada">Cada missão pede um encontro com uma pessoa do evento. Quanto melhor a conversa, mais longe vocês vão.</p>
        <p class="prova" data-stats hidden></p>
      </div>
      <ol class="como">
        <li><b>Crie seu pet</b><span>Leva 30 segundos e não precisa de login.</span></li>
        <li><b>Encontre alguém</b><span>Vocês trocam o código dos pets e a missão avança.</span></li>
        <li><b>Escolha a conversa</b><span>Papo rápido conhece mais gente, conversa funda cria laço. Seu jeito leva a um dos 3 finais.</span></li>
      </ol>
      <button class="principal">Criar meu pet ${ICONE.seta}</button>`
    if (passo === 0) return `
      ${progresso()}<h2>Escolha seu pet</h2>
      <div class="pets" data-campo="especie">${ESPECIES.map((e) => opcao('especie', e, NOMES_ESPECIE[e], dna.especie === e, foto({ especie: e, cor: '', acessorio: 'nenhum' }))).join('')}</div>
      <div class="previa"><img src="${retrato(dna)}" alt=""><p class="personalidade">${PERSONALIDADE[dna.especie]}</p></div>
      <div class="acessorio"><span>Acessório</span><div class="segmentos" data-campo="acessorio">${ACESSORIOS.map((a) => opcao('acessorio', a, NOMES_ACESSORIO[a], dna.acessorio === a)).join('')}</div></div>
      ${proximo}`
    if (passo === 1) return `
      ${progresso()}<h2>Como vocês se chamam?</h2>
      <label>Seu nome<input name="dono" minlength="2" maxlength="16" required placeholder="Ana" autocomplete="given-name" value="${esc(perfil.dono)}"></label>
      <label>Nome do pet<span class="com-botao"><input name="nome" minlength="2" maxlength="16" required value="${esc(perfil.nome)}"><button type="button" data-sortear aria-label="Sortear outro nome">${ICONE.dado}</button></span></label>
      <label>Seu LinkedIn (opcional)<input name="linkedin" maxlength="140" placeholder="linkedin.com/in/ana" inputmode="url" autocomplete="url" spellcheck="false" value="${esc(perfil.linkedin)}"></label>
      <p class="dica">Quem encontrar seu pet vê esses dois nomes. O LinkedIn é opcional: só quem te encontrar no evento vê, para vocês continuarem a conversa depois.</p>
      <div class="navegacao">${voltar(0)}${proximo}</div>`
    const q = PERGUNTAS[passo]
    const ultimo = passo === TOTAL - 1
    return `
      ${progresso()}<h2>${q.titulo}</h2>
      <p class="dica">${q.dica}</p>
      ${chips(q.campo)}
      <div class="navegacao">${voltar(passo - 1)}${ultimo ? `<button class="principal">Criar meu pet ${ICONE.seta}</button>` : proximo}</div>`
  }

  const desenhar = () => {
    h(`<form class="criar"><header class="criar-topo">${LOGO()}${EVENTO}</header>${conteudo()}</form>
      <div class="legenda-pet" aria-live="polite"><b></b><span></span></div>`)
    const form = ui.querySelector<HTMLFormElement>('form.criar')!
    // legenda do palco: nome do pet, espécie e personalidade
    const legenda = () => {
      // na boas-vindas o pet que acena puxa assunto com quem chegou
      ui.querySelector('.legenda-pet b')!.textContent = passo === -1 ? 'Oi! Bora quebrar o gelo?' : perfil.nome.trim() || NOMES_ESPECIE[dna.especie]
      ui.querySelector('.legenda-pet span')!.textContent = passo === -1 ? 'Crie o seu pet e me apresente para alguém do evento.' : `${NOMES_ESPECIE[dna.especie]} · ${PERSONALIDADE[dna.especie]}`
    }
    legenda()
    if (passo === -1) mostrarStats()
    animate(form.querySelectorAll(':scope > :not(.criar-topo)'), { opacity: [0, 1], y: [10, 0] }, { delay: stagger(0.04), duration: 0.35, ease: [0.2, 0.8, 0.2, 1] })
    // foco no que se faz agora: o campo do nome ou o título do passo (leitor de tela anuncia a troca)
    if (passo === 1 && !perfil.dono) form.querySelector<HTMLInputElement>('input[name=dono]')!.focus({ preventScroll: true })
    else {
      const titulo = form.querySelector<HTMLElement>('h2')!
      titulo.tabIndex = -1
      titulo.focus({ preventScroll: true })
    }

    form.addEventListener('input', (e) => {
      const input = e.target as HTMLInputElement
      perfil[input.name as Campo] = input.value
      if (input.name === 'nome') legenda()
    })
    form.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest('button')
      if (!b) return
      if (b.dataset.ir) { passo = Number(b.dataset.ir); desenhar(); return }
      if (b.hasAttribute('data-sortear')) {
        const outros = SUGESTOES_NOME.filter((n) => n !== perfil.nome)
        perfil.nome = outros[Math.floor(Math.random() * outros.length)]
        form.querySelector<HTMLInputElement>('input[name=nome]')!.value = perfil.nome
        legenda()
        return
      }
      const grupo = b.closest<HTMLElement>('[data-campo], [data-perfil]')
      if (!grupo || !b.dataset.v) return
      if (grupo.dataset.perfil) {
        // alterna: o primeiro não sai (a resposta precisa de pelo menos uma área)
        const campo = grupo.dataset.perfil as Pergunta
        const t = b.dataset.v as Tema
        if (!tocou.has(campo)) {
          tocou.add(campo)
          marcados[campo] = [t]
        } else {
          const dentro = marcados[campo].includes(t)
          if (dentro && marcados[campo].length === 1) return
          marcados[campo] = dentro ? marcados[campo].filter((x) => x !== t) : [...marcados[campo], t]
        }
        grupo.querySelectorAll('button').forEach((x) => {
          const sel = marcados[campo].includes(x.dataset.v as Tema)
          x.classList.toggle('sel', sel)
          x.setAttribute('aria-pressed', String(sel))
        })
        return
      }
      grupo.querySelectorAll('button').forEach((x) => { x.classList.toggle('sel', x === b); x.setAttribute('aria-pressed', String(x === b)) })
      ;(dna as unknown as Record<string, string>)[grupo.dataset.campo!] = b.dataset.v
      dna.cor = COR_ESPECIE[dna.especie]
      form.querySelector('.personalidade')!.textContent = PERSONALIDADE[dna.especie]
      form.querySelector<HTMLImageElement>('.previa img')!.src = retrato(dna) // no celular o palco 3D some: o retrato mostra a escolha
      legenda()
      mundo.trocarPet(dna)
    })
    // Enter e o botão principal avançam; no último passo, criam o pet
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      if (passo < TOTAL - 1) { passo++; desenhar(); return }
      const botao = form.querySelector<HTMLButtonElement>('.navegacao .principal')!
      if (botao.disabled) return
      botao.disabled = true // clique duplo criava dois pets
      try {
        const r = await api<{ token: string }>('pets', {
          ...dna, nome: perfil.nome.trim(), dono: perfil.dono.trim(), linkedin: perfil.linkedin.trim(),
          area: marcados.area, procura: marcados.procura, oferece: marcados.oferece,
        })
        token = r.token
        guardado.set('qg-token', token)
        iniciarJogo(true)
      } catch (err) {
        aviso((err as Error).message)
        botao.disabled = false
      }
    })
  }
  desenhar()
}

// ---------- Jogo ----------

let visao: Visao | null = null
let aba: Aba = 'mapa'
let chave = ''
let capMontado = -1
let itensChave = ''
let mapaChave = '' // selos, contatos nas ilhas e cena final só remontam quando o progresso muda
let escolhaLocal: number | null = null
let qrMeu = '' // QR do próprio pet, mostrado no cartão da missão
// Academia (desafio nº 4)
let diagRespostas: number[] = []
let ultimoToqueDiag = 0 // toque duplo respondia duas situações de uma vez
let diagFalhou = false // envio deu erro: as 5 respostas ficam guardadas para tentar de novo
let atividadeAberta: string | null = null
let resultado: { acertou: boolean; explicacao: string } | null = null
let medidas = { ampla: 0, profunda: 0 }
let chaveCartao = ''
// sobe a cada ação: resposta de sondagem que saiu antes dela chega velha e é descartada
let versao = 0
let sondando = false
let sondagem: ReturnType<typeof setInterval> | undefined

// Pessoas online: a pílula do cabeçalho consulta a cada 3 s; só com o painel aberto vem também a lista
type PetOnline = Pick<PetPublico, 'id' | 'nome' | 'dono' | 'especie' | 'acessorio'>
let totalOnline = 0
let petsOnline: PetOnline[] | null = null
let painelOnline: HTMLElement | null = null
let chaveOnline = ''
let buscandoOnline = false
let relogioOnline: ReturnType<typeof setInterval> | undefined
const contagem = () => Math.max(1, totalOnline) // você mesmo está online

async function atualizarOnline(forcar = false) {
  if ((buscandoOnline && !forcar) || document.hidden || !token) return
  buscandoOnline = true
  try {
    const o = await api<{ total: number; pets?: PetOnline[] }>(painelOnline ? 'online?lista=1' : 'online')
    totalOnline = o.total
    if (o.pets) petsOnline = o.pets
    mostrarOnline()
  } catch { /* rede oscilou: fica o último número */ } finally { buscandoOnline = false }
}

function mostrarOnline() {
  const n = String(contagem())
  const pilula = ui.querySelector<HTMLElement>('.online')
  pilula?.setAttribute('aria-label', `${n} online agora: ver quem`)
  const b = pilula?.querySelector('b')
  if (b && b.textContent !== n) {
    b.textContent = n
    animate(b, { scale: [1.45, 1] }, { type: 'spring', stiffness: 420, damping: 16 })
  }
  desenharOnline()
}

/** Lista do painel: você primeiro, depois em ordem alfabética; quem acabou de chegar entra deslizando. */
function desenharOnline() {
  if (!painelOnline || !petsOnline) return
  const meu = visao?.pet.id
  const lista = [...petsOnline].sort((a, b) => Number(b.id === meu) - Number(a.id === meu))
  const k = totalOnline + '|' + lista.map((p) => p.id).join()
  if (k === chaveOnline) return
  const antes = chaveOnline ? new Set(chaveOnline.split('|')[1].split(',')) : null
  chaveOnline = k
  const n = contagem()
  painelOnline.querySelector('h2')!.textContent = `${n} ${n === 1 ? 'pessoa' : 'pessoas'} com o app aberto`
  const ul = painelOnline.querySelector('ul')!
  ul.innerHTML = lista.map((p) => `<li data-id="${p.id}">${foto({ ...p, cor: '' }, 'mini')}<span><b>${esc(p.nome)}</b><small>${esc(p.dono)}</small></span>${p.id === meu ? '<em>você</em>' : ''}</li>`).join('') +
    (totalOnline > lista.length ? `<li class="mais">e mais ${totalOnline - lista.length}</li>` : '')
  if (antes) {
    const novos = [...ul.querySelectorAll<HTMLElement>('li[data-id]')].filter((li) => !antes.has(li.dataset.id!))
    if (novos.length) animate(novos, { opacity: [0, 1], x: [-14, 0] }, { duration: 0.35, ease: [0.2, 0.8, 0.2, 1] })
  }
}

function abrirOnline() {
  if (painelOnline) return
  const m = document.createElement('div')
  m.className = 'modal'
  m.innerHTML = `<div class="escanear-painel online-painel" role="dialog" aria-modal="true" aria-label="Pessoas online agora">
      <div class="cartao-topo"><span class="ao-vivo"><i class="ponto" aria-hidden="true"></i>Ao vivo</span><button type="button" class="discreto" data-fechar>Fechar</button></div>
      <h2>Quem está online</h2>
      <ul class="online-lista"><li class="mais">Carregando…</li></ul>
      <p class="nota">Achou alguém? Vá até a pessoa e leia o QR do pet.</p>
    </div>`
  painelOnline = m
  chaveOnline = ''
  const fechar = () => { m.remove(); removeEventListener('keydown', tecla); painelOnline = null }
  const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar() }
  addEventListener('keydown', tecla)
  m.addEventListener('click', (e) => { if (e.target === m || (e.target as HTMLElement).closest('[data-fechar]')) fechar() })
  document.body.append(m)
  animate(m, { opacity: [0, 1] }, { duration: 0.18 })
  animate(m.firstElementChild!, { opacity: [0, 1], y: [16, 0], scale: [0.98, 1] }, { type: 'spring', stiffness: 320, damping: 26 })
  m.querySelector<HTMLElement>('[data-fechar]')!.focus()
  desenharOnline()
  atualizarOnline(true)
}

// segundo plano ou app fechado: sai da contagem na hora; de volta, entra de novo sem esperar a sondagem
document.addEventListener('visibilitychange', () => {
  if (!token || !visao) return
  if (document.hidden) fetch('/api/sair', { method: 'POST', headers: { 'x-token': token }, keepalive: true }).catch(() => {})
  else api('eu').then(() => atualizarOnline()).catch(() => {})
})

const questao = (q: Questao, attr: string, rotulo: string) =>
  `<p class="rotulo">${rotulo} <span>${NOMES_HABILIDADE[q.habilidade]}</span></p><p class="situacao">${esc(q.situacao)}</p>
   <div class="alternativas">${q.opcoes.map((o, i) => `<button ${attr}="${i}"><b>${'abc'[i]}</b><span>${esc(o)}</span></button>`).join('')}</div>`

/** Diagnóstico: 5 situações, uma por vez. */
function diagnostico() {
  const i = diagRespostas.length
  if (i >= DIAGNOSTICO.length) {
    return diagFalhou
      ? `<p class="texto">Não deu para enviar suas respostas.</p><button class="principal" data-acao="reenviar-diag">Tentar de novo ${ICONE.seta}</button>`
      : '<p class="texto">Montando sua trilha…</p>'
  }
  return `<p class="texto">A Academia treina você para puxar conversa no evento. Responda 5 situações e a gente monta uma trilha começando pelo que você mais precisa. Não muda seu Alcance nem sua Profundidade.</p>
    ${questao(DIAGNOSTICO[i], 'data-diag', `${i + 1}/${DIAGNOSTICO.length}`)}`
}

/** Aba Academia: trilha de círculos, mais fraca primeiro (K5). */
function academia(v: Visao) {
  const a = v.academia
  if (!a.diagnostico) return `<h2>Academia</h2>${diagnostico()}`
  if (atividadeAberta) {
    const q = HABILIDADES.flatMap((hb) => ATIVIDADES[hb]).find((x) => x.id === atividadeAberta)!
    if (resultado) {
      return `<p class="rotulo">${resultado.acertou ? 'Certo' : 'Quase'} <span>${NOMES_HABILIDADE[q.habilidade]}</span></p><p class="situacao">${esc(q.situacao)}</p>
        <p class="explicacao ${resultado.acertou ? 'certo' : 'errado'}">${esc(resultado.explicacao)}</p>
        <button class="principal" data-acao="continuar">Continuar ${ICONE.seta}</button>`
    }
    return `${questao(q, 'data-resposta', 'Atividade')}<button class="discreto" data-acao="voltar-trilha">${ICONE.voltar} Trilha</button>`
  }
  const fraca = a.fraca!
  const trilha = a.trilha.map((hb) => {
    const p = a.progresso[hb]
    const bolinhas = ATIVIDADES[hb].map((q, i) => {
      const feita = q.id in a.feitas
      const atual = q.id === a.proxima
      const cls = feita ? (a.feitas[q.id] ? 'certa' : 'errada') : atual ? 'atual' : 'bloqueada'
      return `<button class="bolinha ${cls}" ${atual ? `data-atividade="${q.id}"` : 'disabled'} aria-label="Atividade ${i + 1}: ${cls}">${i + 1}</button>`
    }).join('<i class="elo"></i>')
    return `<div class="habilidade"><div class="hab-topo"><b>${NOMES_HABILIDADE[hb]}</b><span>${p.feitas}/${p.total}</span></div><div class="bolinhas">${bolinhas}</div></div>`
  }).join('')
  const n = CAPITULO_SUGERIDO[fraca]
  return `<div class="cartao-topo"><span>Academia</span></div><h2>Sua trilha</h2>
    <p class="texto">Começa por <b>${NOMES_HABILIDADE[fraca]}</b>, sua habilidade mais fraca. Na Aventura, você treina isso na Missão ${n}, ${CAPITULOS[n - 1].titulo}.</p>
    <div class="trilha">${trilha}</div>${a.proxima ? '' : '<p class="texto"><b>Trilha completa.</b></p>'}`
}

const dnaDe = (p: PetPublico): DNA => ({ especie: p.especie, cor: p.cor, acessorio: p.acessorio })

function variaveis(v: Visao) {
  const amigo = v.amigo
  const contato = v.conhecidos.find((c) => c.id !== amigo?.id) ?? null
  const ultimo = v.conhecidos.find((c) => c.id === v.estado.encontros.at(-1)) ?? v.conhecidos.at(-1)
  return {
    pet: v.pet.nome,
    amigo: amigo?.nome ?? 'essa pessoa', dono_amigo: amigo?.dono ?? 'essa pessoa', oferta: amigo ? nomes(amigo.oferece) : '',
    contato: (v.estado.fase === 'final' ? ultimo?.nome : contato?.nome) ?? 'alguém', dono_contato: contato?.dono ?? 'alguém',
    procura: nomes(v.pet.procura), minha_oferta: nomes(v.pet.oferece),
    lista_amigos: v.conhecidos.map((c) => c.nome).join(', ') || 'ninguém', n: v.conhecidos.length,
  }
}

async function iniciarJogo(acabouDeNascer = false) {
  try {
    visao = await api('eu')
  } catch (err) {
    if ((err as { status?: number }).status === 401) { token = null; guardado.set('qg-token', null); return telaCriar() }
    aviso((err as Error).message)
    setTimeout(() => iniciarJogo(acabouDeNascer), 3000) // Wi-Fi do evento caiu na abertura: tenta de novo sozinho
    return
  }
  // o cartão da missão mostra o QR do pet: quem está na frente lê com a câmera do celular
  qrMeu = await QRCode.toDataURL(`${location.origin}/?c=${visao!.pet.codigo}`, { margin: 1, width: 240, color: { dark: '#141414', light: '#ffffff' } }).catch(() => '')
  // sem tela de prólogo: o pet nasce e a Missão 1 já começa (o diagnóstico fica na aba Academia)
  if (visao!.estado.fase === 'prologo') visao = await api('comecar', {}).catch(() => visao)
  document.body.className = 'jogando'
  render()
  if (acabouDeNascer) aviso(`${visao!.pet.nome} nasceu! Agora encontre alguém de verdade.`, 'ok')
  // QR lido fora de hora: o código espera a próxima missão, e a pessoa precisa saber disso
  const pendente = sessao.get('qg-c')
  if (pendente && visao!.estado.fase !== 'aguardando') aviso(`Código ${pendente} guardado: o encontro acontece quando a próxima missão começar.`, 'ok')
  clearInterval(sondagem)
  sondagem = setInterval(async () => {
    if (sondando || document.hidden) return
    sondando = true
    const v0 = versao
    try {
      const antes = visao!.conhecidos.length
      const nova = await api('eu')
      if (versao !== v0) return
      visao = nova
      const novo = nova.conhecidos.at(-1)
      if (nova.conhecidos.length > antes && novo) aviso(`${novo.nome}, de ${novo.dono}, te encontrou`, 'ok')
      render()
    } catch { /* rede oscilou: tenta de novo no próximo ciclo */ } finally { sondando = false }
  }, 2000)
  clearInterval(relogioOnline)
  relogioOnline = setInterval(() => atualizarOnline(), 3000)
  atualizarOnline()
}

/** true quando o servidor aceitou a ação. */
async function acao(rota: string, corpo: object = {}): Promise<boolean> {
  versao++
  try { visao = await api(rota, corpo); render(); return true } catch (err) {
    // 409 = a ação já aconteceu (clique duplo, outra aba): só sincroniza, sem mensagem técnica
    if ((err as { status?: number }).status === 409) { visao = await api('eu').catch(() => visao); render(); return false }
    aviso((err as Error).message)
    return false
  }
}

function enviarDiagnostico() {
  diagFalhou = false
  acao('diagnostico', { respostas: diagRespostas }).then((ok) => {
    if (ok) diagRespostas = []
    else diagFalhou = true
    render()
  })
}

/** Atualiza o mundo 3D a partir do estado. Só mexe no que mudou. */
function sincronizarMundo(v: Visao) {
  const e = v.estado
  const dna = dnaDe(v.pet)
  const itens = itensDe(e.alcance, e.profundidade)
  const ik = JSON.stringify(itens)
  const capMundo = Math.min(e.cap, TOTAL_CAPITULOS)

  if (capMundo !== capMontado || e.fase === 'aguardando') {
    mundo.irPara(capMundo, dna, itens)
    capMontado = capMundo
    itensChave = ik
  } else if (ik !== itensChave) {
    mundo.trocarPet(dna, itens)
    itensChave = ik
  }

  const feitos = e.fase === 'final' ? TOTAL_CAPITULOS : e.cap - 1
  const porIlha = e.encontros.slice(0, Math.max(0, feitos)).map((id) => {
    const p = v.conhecidos.find((c) => c.id === id)
    return p ? dnaDe(p) : null
  })
  const mk = `${e.cap}|${e.fase}|${e.encontros.length}`
  const remontar = mk !== mapaChave
  mapaChave = mk
  if (remontar) mundo.atualizarMapa(e.fase === 'final' ? 5 : e.cap, e.escolhas, porIlha)

  if ((e.fase === 'encontro' || e.fase === 'consequencia') && v.amigo) mundo.chegarAmigo(dnaDe(v.amigo))
  if (e.fase === 'consequencia' && escolhaLocal === e.cap) { mundo.consequencia(e.escolhas.at(-1)!); escolhaLocal = null }
  if (e.fase === 'final' && remontar) mundo.cenaFinal(finalDe(e), v.conhecidos.map(dnaDe))
}

function cartaoMissao(v: Visao) {
  const e = v.estado
  const vars = variaveis(v)
  const cap = CAPITULOS[e.cap - 1]
  const pontos = Array.from({ length: TOTAL_CAPITULOS }, (_, i) =>
    `<i class="${i < e.cap - 1 || e.fase === 'final' ? 'feito' : i === e.cap - 1 ? 'atual' : ''}"></i>`).join('')
  const topo = (rotulo: string, titulo: string) => `<div class="cartao-topo"><span>${rotulo}</span><span class="pontos" aria-hidden="true">${pontos}</span></div><h2>${esc(titulo)}</h2>`
  // cada missão é o mesmo ciclo: encontrar alguém, escolher a conversa, ver o resultado
  const passoAtual = { aguardando: 0, encontro: 1, consequencia: 2 }[e.fase as string] ?? -1
  const etapas = passoAtual < 0 ? '' : `<ol class="etapas" aria-label="Passo ${passoAtual + 1} de 3 da missão">${['Encontrar', 'Conversar', 'Resultado'].map((n, i) =>
    `<li class="${i < passoAtual ? 'feito' : i === passoAtual ? 'atual' : ''}"><i>${i < passoAtual ? '✓' : i + 1}</i>${n}</li>`).join('')}</ol>`
  const escolhas = (ativas: boolean) => {
    const op = (o: Opcao, icone: string, efeito: string) =>
      `<button class="escolha ${o}" ${ativas ? `data-op="${o}"` : 'disabled'}>${icone}<span>${esc(preencher(cap[o].opcao, vars))}<small>${efeito}</small></span></button>`
    return `<div class="escolhas">${op('ampla', ICONE.conversa, '+2 Alcance')}${op('profunda', ICONE.aprofundar, '+2 Profundidade')}</div>`
  }

  if (e.fase === 'prologo') {
    // só aparece se o começo automático falhou (rede): um botão e pronto
    return `${topo('Credenciamento', 'Tudo pronto')}<p class="texto">${esc(preencher(PROLOGO, vars))}</p>
      <button class="principal" data-acao="comecar">Começar a aventura ${ICONE.seta}</button>`
  }
  if (e.fase === 'aguardando') {
    const sug = v.sugestoes.length
      // gente real: o encontro só vale com o código que a pessoa mostra; pet de exemplo (sem dono no evento) abre no toque
      ? `<div class="sugestoes"><p class="rotulo">${e.cap === 4 ? 'Seus contatos' : e.cap === 2 ? `Oferecem ${nomes(v.pet.procura)}` : 'De outra área'} <span>procure no evento e peça o código</span></p>${v.sugestoes.map((s) => s.demo
        ? `<button data-codigo="${s.codigo}">${foto(s, 'mini')}<span><b>${esc(s.nome)}</b> · ${esc(s.dono)}<small>pet de exemplo · toque para encontrar</small></span><code>${s.codigo}</code></button>`
        : `<button data-procurar="${esc(s.dono)}">${foto(s, 'mini')}<span><b>${esc(s.nome)}</b> · ${esc(s.dono)}<small>${nomes(s.area)}</small></span></button>`).join('')}</div>`
      : ''
    const f = v.academia.fraca
    const treino = f && CAPITULO_SUGERIDO[f] === e.cap ? `<p class="nota">Aqui você treina <b>${NOMES_HABILIDADE[f]}</b>, sua habilidade mais fraca.</p>` : ''
    // o encontro acontece aqui mesmo: o seu código à mostra e o campo para o código da outra pessoa
    const como = e.cap === 1 ? '<p class="nota"><b>Como funciona:</b> são 4 missões. Cada uma começa quando você encontra uma pessoa aqui no evento. No fim, o jeito como você conversou decide o seu final.</p>' : ''
    return `${topo(`Missão ${e.cap} de ${TOTAL_CAPITULOS}`, cap.objetivo)}${etapas}${como}<p class="texto">${esc(preencher(cap.abertura, vars))}</p>${treino}
      <div class="encontrar">
        <div class="meu-qr">${qrMeu ? `<img src="${qrMeu}" alt="QR do seu pet">` : ''}<div><p class="rotulo">Seu código</p><p class="grande">${v.pet.codigo}</p><small>Mostre para a pessoa: ela digita o código ou lê o QR com a câmera do celular.</small></div></div>
        <form class="codigo-dela" data-encontro><label class="rotulo" for="codigo-dela">Código da outra pessoa</label><div><input id="codigo-dela" name="codigo" maxlength="4" placeholder="ABCD" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="principal">Encontrar</button></div></form>
      </div>${sug}
      <p class="dica">Vá até a pessoa, conversem e troquem os códigos: um digita o do outro ou lê o QR.</p>`
  }
  if (e.fase === 'encontro') {
    const a = v.amigo!
    return `${topo(`Missão ${e.cap} de ${TOTAL_CAPITULOS}`, cap.objetivo)}${etapas}
      <div class="encontro">${foto(a, 'mini')}<p class="texto">${esc(preencher(cap.encontro, vars))}</p></div>
      ${linkedin(a, 'botao-linkedin', `Conectar com ${esc(a.dono)} no LinkedIn`)}
      <p class="pergunta">${esc(cap.pergunta)}</p>${escolhas(true)}
      <p class="dica">Papo rápido soma Alcance: você conhece mais gente. Conversa funda soma Profundidade: você conhece melhor. As duas contam para o final.</p>`
  }
  if (e.fase === 'consequencia') {
    const o = e.escolhas.at(-1)!
    const total = o === 'ampla' ? e.alcance : e.profundidade
    return `${topo(`Missão ${e.cap} de ${TOTAL_CAPITULOS}`, cap.objetivo)}${etapas}
      <div class="ganho ${o}"><b>+2</b><span>${o === 'ampla' ? 'Alcance' : 'Profundidade'}<small>Agora ${total}: ${o === 'ampla' ? 'gente que você conheceu' : 'conversas que foram fundo'}</small></span></div>
      <p class="consequencia ${o}">${esc(preencher(cap[o].consequencia, vars))}</p>
      <button class="principal" data-acao="avancar">${e.cap < TOTAL_CAPITULOS ? `Seguir para a Missão ${e.cap + 1}` : 'Subir ao palco'} ${ICONE.seta}</button>`
  }
  const tipo: Final = finalDe(e)
  // o que a pessoa leva embora: a lista é o produto, não um detalhe de aba
  const leva = v.conhecidos.length
    ? `<div class="leva"><p class="rotulo">O que você leva</p><b>${v.conhecidos.length} ${v.conhecidos.length === 1 ? 'pessoa conhecida' : 'pessoas conhecidas'}</b><div class="leva-pets">${v.conhecidos.slice(0, 6).map((c) => foto(c, 'mini')).join('')}</div><button data-aba="contatos">Ver quem eu conheci ${ICONE.seta}</button></div>`
    : ''
  return `${topo('Final', FINAIS[tipo].titulo)}<p class="texto">${esc(preencher(FINAIS[tipo].texto, vars))}</p>${leva}${retomar(v)}`
}

const retomar = (v: Visao) => v.capitulosSalvos.length
  ? `<p class="rotulo">Quer ver outro final?</p><p class="dica">Volte a uma missão e escolha diferente. Seus contatos continuam salvos.</p><div class="salvos">${v.capitulosSalvos.map((c) => `<button data-retomar="${c}">Missão ${c}</button>`).join('')}</div>`
  : ''

function painelAba(v: Visao) {
  const e = v.estado
  if (aba === 'contatos') {
    const lista = v.conhecidos.length
      ? `<ul class="lista">${v.conhecidos.map((c) => `<li>${foto(c, 'mini')}<div><b>${esc(c.nome)}</b> · ${esc(c.dono)}<small>${nomes(c.area)} · ajuda com ${nomes(c.oferece)}</small></div>${linkedin(c, 'linkedin')}<code>${c.codigo}</code></li>`).join('')}</ul>`
      : '<p class="texto">Ninguém ainda. Na aba Mapa, mostre seu código para alguém ou digite o código da pessoa.</p>'
    return `<div class="cartao-topo"><span>${v.conhecidos.length} ${v.conhecidos.length === 1 ? 'pessoa' : 'pessoas'}</span></div><h2>Quem eu conheci</h2>${lista}`
  }
  if (aba === 'conexoes') {
    const linhas = CAPITULOS.map((c, i) => {
      const o = e.escolhas[i]
      const quem = v.conhecidos.find((p) => p.id === e.encontros[i])
      return `<li class="${o ?? ''}"><i>${i + 1}</i><div><b>${c.titulo}</b><small>${o ? `${esc(preencher(c[o].opcao, { ...variaveis(v), dono_amigo: quem?.dono ?? '', amigo: quem?.nome ?? '' }))}` : 'ainda não'}</small></div><span>${o ? (o === 'ampla' ? '+2 A' : '+2 P') : ''}</span></li>`
    }).join('')
    return `<div class="cartao-topo"><span>Minhas conexões</span></div><h2>Alcance ${e.alcance} · Profundidade ${e.profundidade}</h2>
      <p class="texto">Alcance: quanta gente você conheceu. Profundidade: até onde você levou cada conversa.</p><ol class="conexoes">${linhas}</ol>`
  }
  if (aba === 'finais') {
    const atual = e.fase === 'final' ? finalDe(e) : null
    // antes do fim, mostra para qual final as escolhas de até agora levam
    const rumo = atual ?? (e.alcance + e.profundidade > 0 ? finalDe(e) : null)
    const regra: Record<Final, string> = {
      time: 'Alcance e Profundidade a partir de 4',
      colecionador: 'Mais Alcance que Profundidade',
      amigo: 'Profundidade igual ou maior que o Alcance',
    }
    const todos = (Object.keys(FINAIS) as Final[]).map((f) => `<li class="${f === atual ? 'feito' : f === rumo ? 'rumo' : ''}"><b>${FINAIS[f].titulo}</b><small>${regra[f]}</small>${f === atual ? '<em>seu final</em>' : f === rumo ? '<em>você está indo para cá</em>' : ''}</li>`).join('')
    const texto = atual ? `Você chegou em <b>${FINAIS[atual].titulo}</b>. Volte a uma missão e escolha diferente para ver outro final.`
      : `Hoje você tem Alcance ${e.alcance} e Profundidade ${e.profundidade}. As próximas escolhas ainda mudam o final.`
    return `<div class="cartao-topo"><span>Aonde suas escolhas levam</span></div><h2>Meus finais</h2>
      <p class="texto">${texto}</p><ul class="finais">${todos}</ul>${atual ? retomar(v) : ''}`
  }
  return academia(v)
}

function render() {
  const v = visao!
  const e = v.estado
  const k = `${e.cap}|${e.fase}|${v.amigo?.id}|${v.conhecidos.length}|${v.sugestoes.length}|${v.capitulosSalvos.join()}|${aba}` +
    `|${diagRespostas.length}|${diagFalhou}|${!!v.academia.diagnostico}|${Object.keys(v.academia.feitas).length}|${atividadeAberta}|${!!resultado}`
  if (k === chave) return
  chave = k
  sincronizarMundo(v)

  if (e.fase === 'aguardando') {
    const pendente = sessao.get('qg-c')
    if (pendente) { sessao.set('qg-c', null); acao('encontro', { codigo: pendente }) }
  }

  const medidor = (nome: string, valor: number, cls: string) =>
    `<div class="medidor ${cls}" title="${cls === 'ampla' ? 'Quanta gente você conheceu' : 'Até onde você levou cada conversa'}"><span>${nome}</span><b>${valor}</b><small>${cls === 'ampla' ? 'gente que você conheceu' : 'conversas que foram fundo'}</small><i><em data-alvo="${Math.min(100, (valor / 12) * 100)}" style="width:${Math.min(100, (medidas[cls as keyof typeof medidas] / 12) * 100)}%"></em></i></div>`
  // a Academia ganha um ponto verde enquanto o diagnóstico (5 perguntas) não foi feito
  // curto: rótulo sob o ícone no celular, onde o nome inteiro não cabe
  const abaBtn = (id: Aba, nome: string, curto = nome) =>
    `<button class="${aba === id ? 'ativa' : ''}" data-aba="${id}" aria-label="${nome}" ${aba === id ? 'aria-current="page"' : ''}>${ICONE[id]}<span>${nome}</span><small aria-hidden="true">${curto}</small>${id === 'academia' && !v.academia.diagnostico ? '<i class="novo" aria-hidden="true"></i>' : ''}</button>`

  h(`
    <header class="topo">
      ${LOGO()}${EVENTO}
      <button class="eu" data-acao="escanear" aria-label="Meu código e QR">${foto(v.pet, 'avatar')}<span><small>Minha aventura</small><b>${esc(v.pet.nome)}</b></span></button>
      <button class="online" data-acao="online" aria-label="${contagem()} online agora: ver quem"><i class="ponto" aria-hidden="true"></i><b>${contagem()}</b><span>online</span></button>
      <div class="medidores">${medidor('Alcance', e.alcance, 'ampla')}${medidor('Profundidade', e.profundidade, 'profunda')}</div>
    </header>
    <section class="cartao">${aba === 'mapa' ? cartaoMissao(v) : painelAba(v)}</section>
    <nav class="abas" aria-label="Seções">
      ${abaBtn('mapa', 'Mapa')}${abaBtn('academia', 'Academia')}${abaBtn('contatos', 'Quem eu conheci', 'Conheci')}${abaBtn('conexoes', 'Minhas conexões', 'Conexões')}${abaBtn('finais', 'Meus finais', 'Finais')}
    </nav>`)

  for (const em of ui.querySelectorAll<HTMLElement>('.medidor em')) {
    animate(em, { width: em.dataset.alvo + '%' }, { type: 'spring', stiffness: 140, damping: 18 })
  }
  medidas = { ampla: e.alcance, profunda: e.profundidade }
  // o cartão só anima quando muda de conteúdo (não a cada sondagem)
  const ck = `${aba}|${e.cap}|${e.fase}|${diagRespostas.length}|${atividadeAberta}|${!!resultado}|${!!v.academia.diagnostico}`
  if (ck !== chaveCartao) {
    chaveCartao = ck
    animate(ui.querySelectorAll('.cartao > *'), { opacity: [0, 1], y: [10, 0] }, { delay: stagger(0.035), duration: 0.38, ease: [0.2, 0.8, 0.2, 1] })
    // o innerHTML apagou o botão com foco: quem usa teclado ou leitor de tela continua no cartão
    ui.querySelector<HTMLElement>('.cartao button:not([disabled])')?.focus({ preventScroll: true })
  }
}

// Olhos das marcas: um laço só, com mola amortecida até o alvo (o ponteiro move o alvo, não reinicia animação).
// Ponteiro parado ou toque: os olhos passeiam devagar. Piscada em intervalo aleatório, às vezes dupla.
const ponteiro = { x: 0, y: 0, t: 0 }
addEventListener('pointermove', (ev) => { ponteiro.x = ev.clientX; ponteiro.y = ev.clientY; ponteiro.t = performance.now() })
const molas = new WeakMap<Element, { x: number; y: number; vx: number; vy: number }>()
let proximaPiscada = performance.now() + 2500
let passeio = { x: 0, y: 0, ate: 0 }
let quadroAnterior = performance.now()
function olhos(agora: number) {
  requestAnimationFrame(olhos)
  const dt = Math.min(0.05, (agora - quadroAnterior) / 1000)
  quadroAnterior = agora
  if (calmo.matches) return
  let sy = 1
  if (agora >= proximaPiscada) {
    const p = (agora - proximaPiscada) / 170
    if (p >= 1) proximaPiscada = agora + (Math.random() < 0.18 ? 140 : 2400 + Math.random() * 3600)
    else sy = 1 - 0.9 * Math.sin(Math.PI * p)
  }
  const parado = !ponteiro.t || agora - ponteiro.t > 2600
  if (parado && agora > passeio.ate) {
    const a = Math.random() * Math.PI * 2, r = 0.25 + Math.random() * 0.6
    passeio = { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.6, ate: agora + 1100 + Math.random() * 2200 }
  }
  document.querySelectorAll<SVGSVGElement>('.marca').forEach((m, i) => {
    const r = m.getBoundingClientRect()
    if (!r.width) return
    const amp = Number(m.dataset.amp) || 2.6 * (m.viewBox.baseVal.width / 40)
    let tx = passeio.x * amp, ty = passeio.y * amp
    if (!parado) {
      const dx = ponteiro.x - (r.left + r.width / 2), dy = ponteiro.y - (r.top + r.height / 2)
      const d = Math.hypot(dx, dy) || 1
      const k = Math.min(1, d / Math.max(160, r.width)) * amp
      tx = (dx / d) * k; ty = (dy / d) * k
    }
    const s = molas.get(m) ?? { x: olhar.x, y: olhar.y, vx: 0, vy: 0 }
    const rigidez = 90, amortecer = 2 * Math.sqrt(rigidez) * 0.9
    s.vx += ((tx - s.x) * rigidez - s.vx * amortecer) * dt
    s.vy += ((ty - s.y) * rigidez - s.vy * amortecer) * dt
    s.x += s.vx * dt; s.y += s.vy * dt
    molas.set(m, s)
    if (i === 0) { olhar.x = s.x; olhar.y = s.y }
    m.querySelectorAll<SVGElement>('.olho').forEach((o) => { o.style.transform = `translate(${s.x}px, ${s.y}px) scaleY(${sy})` })
  })
}
requestAnimationFrame(olhos)

function escolher(op: Opcao) {
  escolhaLocal = visao!.estado.cap
  acao('escolha', { opcao: op })
}

ui.addEventListener('click', (ev) => {
  const b = (ev.target as HTMLElement).closest('button')
  if (!b || !visao) return
  const d = b.dataset
  if (d.acao === 'comecar') acao('comecar')
  else if (d.acao === 'avancar') acao('avancar')
  else if (d.acao === 'escanear') abrirEscanear()
  else if (d.acao === 'online') abrirOnline()
  else if (d.op) escolher(d.op as Opcao)
  else if (d.procurar) { aviso(`Procure ${d.procurar} no evento e peça o código de 4 letras.`); ui.querySelector<HTMLInputElement>('#codigo-dela')?.focus() }
  else if (d.codigo) acao('encontro', { codigo: d.codigo })
  else if (d.retomar) { capMontado = -1; aba = 'mapa'; acao('retomar', { cap: Number(d.retomar) }) }
  else if (d.diag !== undefined) {
    if (ev.timeStamp - ultimoToqueDiag < 300) return
    ultimoToqueDiag = ev.timeStamp
    diagRespostas.push(Number(d.diag))
    if (diagRespostas.length === DIAGNOSTICO.length) enviarDiagnostico()
    render()
  } else if (d.acao === 'reenviar-diag') {
    enviarDiagnostico()
    render()
  } else if (d.atividade) { atividadeAberta = d.atividade; resultado = null; render() }
  else if (d.resposta !== undefined) {
    versao++
    api<Visao & { resultado: typeof resultado }>('atividade', { id: atividadeAberta, opcao: Number(d.resposta) })
      .then((r) => { resultado = r.resultado; visao = r; render() })
      .catch((err) => aviso((err as Error).message))
  } else if (d.acao === 'continuar' || d.acao === 'voltar-trilha') {
    atividadeAberta = null; resultado = null
    // segue direto para a próxima atividade, como no Duolingo
    if (d.acao === 'continuar' && visao.academia.proxima) atividadeAberta = visao.academia.proxima
    render()
  } else if (d.aba) {
    aba = d.aba as Aba
    render()
  }
})

// código digitado direto no cartão da missão
ui.addEventListener('submit', (ev) => {
  const f = (ev.target as HTMLElement).closest<HTMLFormElement>('[data-encontro]')
  if (!f || !visao) return
  ev.preventDefault()
  const codigo = String(new FormData(f).get('codigo') ?? '').trim().toUpperCase()
  if (codigo.length === 4) acao('encontro', { codigo })
  else aviso('O código do pet tem 4 letras.')
})

/** Escanear: o celular lê o QR com a câmera nativa; no computador, digita o código. */
let escaneando = false // dois toques rápidos abriam dois modais
async function abrirEscanear() {
  if (escaneando) return
  escaneando = true
  const p = visao!.pet
  const url = await QRCode.toDataURL(`${location.origin}/?c=${p.codigo}`, { margin: 1, width: 240, color: { dark: '#141414', light: '#ffffff' } })
  const m = document.createElement('div')
  m.className = 'modal'
  m.innerHTML = `<div class="escanear-painel" role="dialog" aria-modal="true" aria-label="Encontrar pet">
      <div class="cartao-topo"><span>Encontro</span><button type="button" class="discreto" data-fechar>Fechar</button></div>
      <h2>Digite o código de outro pet</h2>
      <form><input name="codigo" maxlength="4" placeholder="ABCD" autocomplete="off" autocapitalize="characters" aria-label="Código do outro pet"><button class="principal">Encontrar</button></form>
      <p class="nota">No celular, aponte a câmera para o QR do outro pet.</p>
      <div class="meu-codigo"><img src="${url}" alt="QR do pet ${esc(p.nome)}"><div><p class="rotulo">Seu código</p><p class="grande">${p.codigo}</p></div></div>
    </div>`
  const fechar = () => { m.remove(); removeEventListener('keydown', tecla); escaneando = false }
  const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar() }
  addEventListener('keydown', tecla)
  m.addEventListener('click', (e) => { if (e.target === m || (e.target as HTMLElement).closest('[data-fechar]')) fechar() })
  m.querySelector('form')!.addEventListener('submit', (e) => {
    e.preventDefault()
    const codigo = new FormData(e.target as HTMLFormElement).get('codigo')
    if (codigo) { fechar(); acao('encontro', { codigo }) }
  })
  document.body.append(m)
  animate(m, { opacity: [0, 1] }, { duration: 0.18 })
  animate(m.firstElementChild!, { opacity: [0, 1], y: [16, 0], scale: [0.98, 1] }, { type: 'spring', stiffness: 320, damping: 26 })
  m.querySelector('input')!.focus()
}

// ---------- Página /demo: pets de exemplo com QR (QUEBRA-GELO.md, seção 7) ----------

async function telaDemo() {
  document.body.className = 'demo'
  const pets = await api<PetPublico[]>('demo')
  const cards = await Promise.all(pets.map(async (p) => {
    const qr = await QRCode.toDataURL(`${location.origin}/?c=${p.codigo}`, { margin: 1, width: 200, color: { dark: '#141414', light: '#ffffff' } })
    return `<div class="card">${foto(p, 'mini')}<b class="grande">${p.codigo}</b><span>${esc(p.nome)} · ${esc(p.dono)}</span><small>${nomes(p.area)} · ajuda com ${nomes(p.oferece)}</small><img src="${qr}" alt=""></div>`
  }))
  h(`<div class="demo-lista"><header class="criar-topo">${LOGO()}${EVENTO}</header><h2>Pets de exemplo</h2><p class="texto">Para testar e demonstrar sem depender do público.</p><div class="cards">${cards.join('')}</div></div>`)
}

// ---------- Entrada ----------

const params = new URLSearchParams(location.search)
if (params.get('c')) {
  sessao.set('qg-c', params.get('c')!.toUpperCase())
  history.replaceState(null, '', '/')
}
if (location.pathname === '/demo') telaDemo()
else if (token) iniciarJogo()
else { telaCriar(); abertura() }

// Abertura: o cubo racha e o nome aparece; passa sozinha (ou num toque) e revela a boas-vindas já montada por trás.
// Só na primeira visita da sessão, e só para quem ainda não tem pet.
function abertura() {
  if (sessao.get('qg-abertura')) return
  sessao.set('qg-abertura', '1')
  const calma = matchMedia('(prefers-reduced-motion: reduce)').matches
  const el = document.createElement('div')
  el.className = 'abertura'
  el.setAttribute('aria-hidden', 'true')
  el.innerHTML = `${MARCA()}<b>Quebra-Gelo</b><p>O networking do DevDay, <em>jogável.</em></p>`
  document.body.append(el)
  if (!calma) animate(el.children, { opacity: [0, 1], y: [18, 0] }, { delay: stagger(0.12), duration: 0.5, ease: [0.2, 0.8, 0.2, 1] })
  let saiu = false
  const sair = () => {
    if (saiu) return
    saiu = true
    animate(el, { opacity: 0 }, { duration: calma ? 0.01 : 0.35 }).then(() => el.remove())
  }
  el.addEventListener('pointerdown', sair)
  setTimeout(sair, calma ? 1200 : 2300)
}
