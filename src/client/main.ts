import QRCode from 'qrcode'
import type { Estado, Final, Opcao } from '../shared/engine.ts'
import { finalDe } from '../shared/engine.ts'
import {
  ACESSORIOS, CAPITULOS, CORES, ESPECIES, FINAIS, NOMES_ACESSORIO, NOMES_ESPECIE, PROLOGO, TEMAS, preencher,
  type Especie, type Tema,
} from '../shared/story.ts'
import { itensDe, type DNA } from './pet.ts'
import { Mundo } from './world.ts'
import './style.css'

interface PetPublico extends DNA {
  id: string; codigo: string; nome: string; dono: string; area: Tema; procura: Tema; oferece: Tema; demo: boolean
}
interface Visao {
  pet: PetPublico
  estado: Estado
  amigo: PetPublico | null
  conhecidos: PetPublico[]
  capitulosSalvos: number[]
  sugestoes: PetPublico[]
}

const NOMES_TEMA: Record<Tema, string> = {
  front: 'front-end', back: 'back-end', mobile: 'mobile', dados: 'dados', design: 'design', produto: 'produto', carreira: 'carreira',
}
const SUGESTOES_NOME = ['Xícaro', 'Bolacha', 'Pipoca', 'Tampinha', 'Biscoito', 'Faísca', 'Nuvem', 'Pudim', 'Teco', 'Bug']

const ui = document.querySelector<HTMLDivElement>('#ui')!
const mundo = new Mundo(document.querySelector<HTMLCanvasElement>('#cena')!)

const guardado = {
  get: (k: string) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k: string, v: string | null) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v) } catch { /* sem storage: segue sem salvar */ } },
}
let token = guardado.get('qg-token')

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
const h = (html: string) => { ui.innerHTML = html }

function aviso(msg: string) {
  const t = document.createElement('div')
  t.className = 'aviso'
  t.textContent = msg
  document.body.append(t)
  setTimeout(() => t.remove(), 3500)
}

async function api<T = Visao>(rota: string, corpo?: object): Promise<T> {
  const r = await fetch('/api/' + rota, {
    method: corpo ? 'POST' : 'GET',
    headers: { 'content-type': 'application/json', ...(token ? { 'x-token': token } : {}) },
    body: corpo ? JSON.stringify(corpo) : undefined,
  })
  const dados = await r.json().catch(() => ({}))
  if (!r.ok) throw Object.assign(new Error(dados.erro ?? 'falha na rede'), { status: r.status })
  return dados
}

// ---------- Criação do pet (D1: uma tela, sem IA, sem foto) ----------

function telaCriar() {
  const dna: DNA = { especie: 'gato', cor: CORES[0], acessorio: 'nenhum' }
  mundo.mostrarVitrine(dna)
  const opcoes = <T extends string>(nome: string, lista: readonly T[], rotulo: (v: T) => string) =>
    `<div class="opcoes" data-campo="${nome}">${lista.map((v, i) => `<button type="button" class="${i ? '' : 'sel'}" data-v="${v}">${rotulo(v)}</button>`).join('')}</div>`
  const select = (nome: string, rotulo: string) =>
    `<label>${rotulo}<select name="${nome}">${TEMAS.map((t) => `<option value="${t}">${NOMES_TEMA[t]}</option>`).join('')}</select></label>`

  h(`
    <form class="painel criar">
      <h1>Quebra-Gelo</h1>
      <p class="sub">Monte seu pet. Ele só avança quando você conversa com alguém de verdade.</p>
      <label>Espécie</label>${opcoes('especie', ESPECIES, (e) => NOMES_ESPECIE[e])}
      <label>Cor</label>
      <div class="opcoes cores" data-campo="cor">${CORES.map((c, i) => `<button type="button" class="${i ? '' : 'sel'}" data-v="${c}" style="background:${c}" aria-label="cor ${c}"></button>`).join('')}</div>
      <label>Acessório</label>${opcoes('acessorio', ACESSORIOS, (a) => NOMES_ACESSORIO[a])}
      <div class="linha">
        <label>Nome do pet<input name="nome" maxlength="16" required value="${SUGESTOES_NOME[Math.floor(Math.random() * SUGESTOES_NOME.length)]}"></label>
        <label>Seu primeiro nome<input name="dono" maxlength="16" required placeholder="Ana"></label>
      </div>
      <div class="linha">${select('area', 'Minha área')}${select('procura', 'Procuro ajuda com')}${select('oferece', 'Posso ajudar com')}</div>
      <button class="principal">Nascer! 🐣</button>
    </form>`)

  const form = ui.querySelector('form')!
  form.querySelectorAll<HTMLDivElement>('.opcoes').forEach((grupo) => {
    grupo.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest('button')
      if (!b) return
      grupo.querySelectorAll('button').forEach((x) => x.classList.toggle('sel', x === b))
      const campo = grupo.dataset.campo as keyof DNA
      ;(dna as unknown as Record<string, string>)[campo] = b.dataset.v!
      mundo.trocarPet(dna)
    })
  })
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const f = new FormData(form)
    try {
      const r = await api<{ token: string }>('pets', {
        ...dna, nome: f.get('nome'), dono: f.get('dono'), area: f.get('area'), procura: f.get('procura'), oferece: f.get('oferece'),
      })
      token = r.token
      guardado.set('qg-token', token)
      iniciarJogo()
    } catch (err) { aviso((err as Error).message) }
  })
}

// ---------- Jogo ----------

let visao: Visao | null = null
let chave = ''
let capMontado = -1
let itensChave = ''
let escolhaLocal: { cap: number; op: Opcao } | null = null

const dnaDe = (p: PetPublico): DNA => ({ especie: p.especie, cor: p.cor, acessorio: p.acessorio })

function variaveis(v: Visao) {
  const amigo = v.amigo
  const contato = v.conhecidos.find((c) => c.id !== amigo?.id) ?? null
  const ultimo = v.conhecidos.find((c) => c.id === v.estado.encontros.at(-1)) ?? v.conhecidos.at(-1)
  return {
    pet: v.pet.nome,
    amigo: amigo?.nome ?? '', dono_amigo: amigo?.dono ?? '', oferta: amigo ? NOMES_TEMA[amigo.oferece] : '',
    contato: (v.estado.fase === 'final' ? ultimo?.nome : contato?.nome) ?? 'alguém', dono_contato: contato?.dono ?? 'alguém',
    procura: NOMES_TEMA[v.pet.procura], minha_oferta: NOMES_TEMA[v.pet.oferece],
    lista_amigos: v.conhecidos.map((c) => c.nome).join(', ') || 'ninguém', n: v.conhecidos.length,
  }
}

async function iniciarJogo() {
  try {
    visao = await api('eu')
  } catch (err) {
    if ((err as { status?: number }).status === 401) { token = null; guardado.set('qg-token', null); return telaCriar() }
    aviso((err as Error).message)
    return
  }
  render()
  setInterval(async () => {
    try { visao = await api('eu'); render() } catch { /* rede oscilou: tenta de novo no próximo ciclo */ }
  }, 2000)
}

async function acao(rota: string, corpo: object = {}) {
  try { visao = await api(rota, corpo); render() } catch (err) { aviso((err as Error).message) }
}

function render() {
  const v = visao!
  const e = v.estado
  const k = `${e.cap}|${e.fase}|${v.amigo?.id}|${v.conhecidos.length}|${v.sugestoes.length}|${v.capitulosSalvos.join()}`
  if (k === chave) return
  chave = k

  const dna = dnaDe(v.pet)
  const itens = itensDe(e.alcance, e.profundidade)
  const ik = JSON.stringify(itens)
  const capMundo = e.fase === 'final' ? 5 : e.cap
  if (capMundo !== capMontado || e.fase === 'aguardando' || e.fase === 'final') {
    mundo.montarFase(capMundo, dna, itens)
    capMontado = capMundo
    itensChave = ik
    if (e.cap === 3 && e.fase !== 'final') {
      const contato = v.conhecidos.find((c) => c.id !== v.amigo?.id)
      if (contato) mundo.colocar(dnaDe(contato), 3.3, -0.6, -0.6)
    }
  } else if (ik !== itensChave) {
    mundo.trocarPet(dna, itens)
    itensChave = ik
  }

  const vars = variaveis(v)
  const cap = CAPITULOS[e.cap - 1]
  let balao = ''

  if (e.fase === 'prologo') {
    balao = `<p>${esc(preencher(PROLOGO, vars))}</p><button class="principal" data-acao="comecar">Começar a aventura</button>`
  } else if (e.fase === 'aguardando') {
    const sug = v.sugestoes.length
      ? `<div class="sugestoes">${v.sugestoes.map((s) => `<button data-codigo="${s.codigo}">${esc(s.nome)} (${esc(s.dono)}) · oferece ${NOMES_TEMA[s.oferece]} · <b>${s.codigo}</b></button>`).join('')}</div>`
      : ''
    balao = `<p>${esc(preencher(cap.abertura, vars))}</p>${sug}
      <form class="encontro"><input name="codigo" maxlength="4" placeholder="Código do outro pet" autocomplete="off" autocapitalize="characters"><button class="principal">Encontrar</button></form>
      <p class="dica">Mostre o seu código <b>${v.pet.codigo}</b> ou digite o de quem você conheceu.</p>`
    const pendente = sessionStorage.getItem('qg-c')
    if (pendente) { sessionStorage.removeItem('qg-c'); acao('encontro', { codigo: pendente }) }
  } else if (e.fase === 'encontro' && v.amigo) {
    mundo.chegarAmigo(dnaDe(v.amigo))
    const rotulos: [string, string] = [preencher(cap.ampla.opcao, vars), preencher(cap.profunda.opcao, vars)]
    mundo.mostrarZonas(e.cap, rotulos, (op) => escolher(op))
    balao = `<p>${esc(preencher(cap.encontro, vars))}</p><p><b>${esc(cap.pergunta)}</b> Ande até uma das zonas, ou toque:</p>
      <div class="escolhas"><button class="ampla" data-op="ampla">📣 ${esc(rotulos[0])}</button><button class="profunda" data-op="profunda">☕ ${esc(rotulos[1])}</button></div>`
  } else if (e.fase === 'consequencia') {
    const op = e.escolhas.at(-1)!
    if (v.amigo) mundo.chegarAmigo(dnaDe(v.amigo))
    if (escolhaLocal?.cap === e.cap) { mundo.consequencia(e.cap, op); escolhaLocal = null }
    balao = `<p class="${op}">${esc(preencher(cap[op].consequencia, vars))}</p><button class="principal" data-acao="avancar">${e.cap < 4 ? 'Seguir para o próximo capítulo' : 'Ir para o palco'} →</button>`
  } else if (e.fase === 'final') {
    const tipo: Final = finalDe(e)
    mundo.cenaFinal(tipo, v.conhecidos.map(dnaDe))
    const salvos = v.capitulosSalvos.map((c) => `<button data-retomar="${c}">⏪ Cap. ${c}</button>`).join('')
    balao = `<h2>${FINAIS[tipo].titulo}</h2><p>${esc(preencher(FINAIS[tipo].texto, vars))}</p>
      <details><summary>Quem eu conheci (${v.conhecidos.length})</summary><ul>${v.conhecidos.map((c) => `<li><b>${esc(c.nome)}</b>, de ${esc(c.dono)} · ${NOMES_TEMA[c.area]} · oferece ${NOMES_TEMA[c.oferece]}</li>`).join('')}</ul></details>
      <p class="dica">Retomar de um capítulo salvo e tentar outro caminho:</p><div class="salvos">${salvos}</div>`
  }

  const titulo = e.fase === 'final' ? 'Final' : e.cap === 0 ? 'Prólogo · Credenciamento' : `Capítulo ${e.cap} · ${cap.titulo}`
  const barra = (nome: string, valor: number, cls: string) =>
    `<div class="barra ${cls}"><span>${nome}</span><i style="width:${Math.min(100, (valor / 12) * 100)}%"></i><b>${valor}</b></div>`
  h(`
    <header class="hud">
      <div class="titulo">${titulo}${cap && e.fase !== 'final' ? `<small>${cap.local}</small>` : ''}</div>
      <div class="barras">${barra('📣 Alcance', e.alcance, 'ampla')}${barra('☕ Profundidade', e.profundidade, 'profunda')}</div>
      <button class="codigo" data-acao="qr">${esc(v.pet.nome)} · <b>${v.pet.codigo}</b></button>
    </header>
    <section class="balao">${balao}</section>`)
}

function escolher(op: Opcao) {
  escolhaLocal = { cap: visao!.estado.cap, op }
  acao('escolha', { opcao: op })
}

ui.addEventListener('click', async (ev) => {
  const b = (ev.target as HTMLElement).closest('button')
  if (!b) return
  if (b.dataset.acao === 'comecar') acao('comecar')
  else if (b.dataset.acao === 'avancar') acao('avancar')
  else if (b.dataset.acao === 'qr') mostrarQr()
  else if (b.dataset.op) escolher(b.dataset.op as Opcao)
  else if (b.dataset.codigo) acao('encontro', { codigo: b.dataset.codigo })
  else if (b.dataset.retomar) { capMontado = -1; acao('retomar', { cap: Number(b.dataset.retomar) }) }
})
ui.addEventListener('submit', (ev) => {
  ev.preventDefault()
  const codigo = new FormData(ev.target as HTMLFormElement).get('codigo')
  if (codigo) acao('encontro', { codigo })
})

async function mostrarQr() {
  const p = visao!.pet
  const url = await QRCode.toDataURL(`${location.origin}/?c=${p.codigo}`, { margin: 1, width: 280 })
  const d = document.createElement('div')
  d.className = 'modal'
  d.innerHTML = `<div class="painel"><img src="${url}" alt="QR do pet ${esc(p.nome)}"><p class="grande">${p.codigo}</p><p>Peça para escanear ou digitar este código.</p><button class="principal">Fechar</button></div>`
  d.addEventListener('click', (e) => { if (e.target === d || (e.target as HTMLElement).tagName === 'BUTTON') d.remove() })
  document.body.append(d)
}

// ---------- Página /demo: pets de exemplo com QR (QUEBRA-GELO.md, seção 7) ----------

async function telaDemo() {
  document.body.classList.add('demo')
  const pets = await api<PetPublico[]>('demo')
  const cards = await Promise.all(pets.map(async (p) => {
    const qr = await QRCode.toDataURL(`${location.origin}/?c=${p.codigo}`, { margin: 1, width: 200 })
    return `<div class="card"><img src="${qr}" alt=""><b class="grande">${p.codigo}</b><span>${esc(p.nome)} · ${esc(p.dono)}</span><small>${NOMES_ESPECIE[p.especie as Especie]} · ${NOMES_TEMA[p.area]} · oferece ${NOMES_TEMA[p.oferece]}</small></div>`
  }))
  h(`<div class="painel demo-lista"><h1>Pets de exemplo</h1><p class="sub">Para testar e demonstrar sem depender do público.</p><div class="cards">${cards.join('')}</div></div>`)
}

// ---------- Entrada ----------

const params = new URLSearchParams(location.search)
if (params.get('c')) {
  sessionStorage.setItem('qg-c', params.get('c')!.toUpperCase())
  history.replaceState(null, '', '/')
}
if (location.pathname === '/demo') telaDemo()
else if (token) iniciarJogo()
else telaCriar()

