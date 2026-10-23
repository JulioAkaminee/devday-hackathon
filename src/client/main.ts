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
  academia: Academia & { progresso: Record<Habilidade, { feitas: number; total: number }>; proxima: string | null; fraca: Habilidade | null }
}
type Aba = 'mapa' | 'academia' | 'contatos' | 'conexoes' | 'finais'

const NOMES_TEMA: Record<Tema, string> = {
  front: 'front-end', back: 'back-end', mobile: 'mobile', dados: 'dados', design: 'design', produto: 'produto', carreira: 'carreira',
}
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
}
// Marca: a bola verde com olhos de anel do banner do evento
// Os olhos seguem o ponteiro (spring do motion); o render reaproveita a última posição
const olhar = { x: 0, y: 0 }
const MARCA = () => {
  const t = `style="transform: translate(${olhar.x}px, ${olhar.y}px)"`
  return `<svg class="marca" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="22" r="18" fill="var(--verde)"/><ellipse class="olho" ${t} cx="11" cy="17" rx="3.2" ry="4.2" fill="none" stroke="var(--tinta)" stroke-width="2.4"/><ellipse class="olho" ${t} cx="24" cy="16.5" rx="3.2" ry="4.2" fill="none" stroke="var(--tinta)" stroke-width="2.4"/></svg>`
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

const guardado = {
  get: (k: string) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k: string, v: string | null) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v) } catch { /* sem storage: segue sem salvar */ } },
}
let token = guardado.get('qg-token')

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
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
  document.body.className = 'criando'
  const dna: DNA = { especie: 'xicara', cor: COR_ESPECIE.xicara, acessorio: 'nenhum' }
  mundo.mostrarVitrine(dna)
  // procura começa diferente da área: o par procura/oferece é o que cruza as pessoas na Missão 2
  const select = (nome: string, rotulo: string, padrao: Tema = 'front') =>
    `<label>${rotulo}<select name="${nome}">${TEMAS.map((t) => `<option value="${t}" ${t === padrao ? 'selected' : ''}>${NOMES_TEMA[t]}</option>`).join('')}</select></label>`

  h(`
    <form class="criar">
      <header class="criar-topo">${LOGO()}${EVENTO}</header>
      <p class="chamada">Seu pet só avança quando você conversa com alguém de verdade.</p>
      <fieldset><legend><i>01</i> Pet</legend>
        <div class="pets" data-campo="especie">${ESPECIES.map((e, i) => `<button type="button" class="${i ? '' : 'sel'}" data-v="${e}" aria-label="${NOMES_ESPECIE[e]}">${foto({ especie: e, cor: '', acessorio: 'nenhum' })}<span>${NOMES_ESPECIE[e]}</span></button>`).join('')}</div>
        <p class="personalidade">${PERSONALIDADE.xicara}</p>
      </fieldset>
      <fieldset><legend><i>02</i> Acessório</legend>
        <div class="segmentos" data-campo="acessorio">${ACESSORIOS.map((a, i) => `<button type="button" class="${i ? '' : 'sel'}" data-v="${a}">${NOMES_ACESSORIO[a]}</button>`).join('')}</div>
      </fieldset>
      <fieldset><legend><i>03</i> Nomes</legend>
        <div class="linha">
          <label>Do pet<input name="nome" maxlength="16" required value="${SUGESTOES_NOME[Math.floor(Math.random() * SUGESTOES_NOME.length)]}"></label>
          <label>Seu primeiro nome<input name="dono" maxlength="16" required placeholder="Ana" autocomplete="given-name"></label>
        </div>
      </fieldset>
      <fieldset><legend><i>04</i> Hoje</legend>
        <div class="linha">${select('area', 'Minha área')}${select('procura', 'Procuro ajuda com', 'back')}${select('oferece', 'Posso ajudar com')}</div>
      </fieldset>
      <button class="principal">Criar meu pet ${ICONE.seta}</button>
    </form>`)

  const form = ui.querySelector('form')!
  animate(form.querySelectorAll('.criar > *'), { opacity: [0, 1], y: [14, 0] }, { delay: stagger(0.05), duration: 0.45, ease: [0.2, 0.8, 0.2, 1] })
  form.querySelectorAll<HTMLDivElement>('[data-campo]').forEach((grupo) => {
    grupo.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest('button')
      if (!b) return
      grupo.querySelectorAll('button').forEach((x) => x.classList.toggle('sel', x === b))
      ;(dna as unknown as Record<string, string>)[grupo.dataset.campo!] = b.dataset.v!
      dna.cor = COR_ESPECIE[dna.especie]
      form.querySelector('.personalidade')!.textContent = PERSONALIDADE[dna.especie]
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
let aba: Aba = 'mapa'
let chave = ''
let capMontado = -1
let itensChave = ''
let escolhaLocal: number | null = null
// Academia (desafio nº 4)
let diagRespostas: number[] = []
let atividadeAberta: string | null = null
let resultado: { acertou: boolean; explicacao: string } | null = null
let medidas = { ampla: 0, profunda: 0 }
let chaveCartao = ''

const questao = (q: Questao, attr: string, rotulo: string) =>
  `<p class="rotulo">${rotulo} <span>${NOMES_HABILIDADE[q.habilidade]}</span></p><p class="situacao">${esc(q.situacao)}</p>
   <div class="alternativas">${q.opcoes.map((o, i) => `<button ${attr}="${i}"><b>${'abc'[i]}</b><span>${esc(o)}</span></button>`).join('')}</div>`

/** Diagnóstico: 5 situações, uma por vez. */
function diagnostico() {
  const i = diagRespostas.length
  if (i >= DIAGNOSTICO.length) return '<p class="texto">Montando sua trilha…</p>'
  return `<p class="texto">Cinco situações rápidas. Suas respostas montam sua trilha na Academia.</p>
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
      return `<button class="bolinha ${cls}" ${feita || atual ? `data-atividade="${q.id}"` : 'disabled'} aria-label="Atividade ${i + 1}: ${cls}">${i + 1}</button>`
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
    amigo: amigo?.nome ?? 'essa pessoa', dono_amigo: amigo?.dono ?? 'essa pessoa', oferta: amigo ? NOMES_TEMA[amigo.oferece] : '',
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
  document.body.className = 'jogando'
  render()
  setInterval(async () => {
    try {
      const antes = visao!.conhecidos.length
      const nova = await api('eu')
      visao = nova
      const novo = nova.conhecidos.at(-1)
      if (nova.conhecidos.length > antes && novo) aviso(`${novo.nome}, de ${novo.dono}, te encontrou`, 'ok')
      render()
    } catch { /* rede oscilou: tenta de novo no próximo ciclo */ }
  }, 2000)
}

async function acao(rota: string, corpo: object = {}) {
  try { visao = await api(rota, corpo); render() } catch (err) {
    // 409 = a ação já aconteceu (clique duplo, outra aba): só sincroniza, sem mensagem técnica
    if ((err as { status?: number }).status === 409) { visao = await api('eu').catch(() => visao); render(); return }
    aviso((err as Error).message)
  }
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
  mundo.atualizarMapa(e.fase === 'final' ? 5 : e.cap, e.escolhas, porIlha)

  if ((e.fase === 'encontro' || e.fase === 'consequencia') && v.amigo) mundo.chegarAmigo(dnaDe(v.amigo))
  if (e.fase === 'consequencia' && escolhaLocal === e.cap) { mundo.consequencia(e.escolhas.at(-1)!); escolhaLocal = null }
  if (e.fase === 'final') mundo.cenaFinal(finalDe(e), v.conhecidos.map(dnaDe))
}

function cartaoMissao(v: Visao) {
  const e = v.estado
  const vars = variaveis(v)
  const cap = CAPITULOS[e.cap - 1]
  const pontos = Array.from({ length: TOTAL_CAPITULOS }, (_, i) =>
    `<i class="${i < e.cap - 1 || e.fase === 'final' ? 'feito' : i === e.cap - 1 ? 'atual' : ''}"></i>`).join('')
  const topo = (rotulo: string, titulo: string) => `<div class="cartao-topo"><span>${rotulo}</span><span class="pontos" aria-hidden="true">${pontos}</span></div><h2>${esc(titulo)}</h2>`
  const escanear = `<button class="escanear" data-acao="escanear">${ICONE.escanear} Escanear pet</button>`
  const escolhas = (ativas: boolean) => {
    const op = (o: Opcao, icone: string, efeito: string) =>
      `<button class="escolha ${o}" ${ativas ? `data-op="${o}"` : 'disabled'}>${icone}<span>${esc(preencher(cap[o].opcao, vars))}<small>${efeito}</small></span></button>`
    return `<div class="escolhas">${op('ampla', ICONE.conversa, '+2 Alcance')}${op('profunda', ICONE.aprofundar, '+2 Profundidade')}</div>`
  }

  if (e.fase === 'prologo') {
    // Credenciamento: o diagnóstico da Academia vem antes da aventura (K4)
    if (!v.academia.diagnostico) return `${topo('Credenciamento', 'Antes de entrar')}${diagnostico()}`
    const fraca = v.academia.fraca!
    return `${topo('Credenciamento', 'Boas-vindas ao DevDay')}<p class="texto">${esc(preencher(PROLOGO, vars))}</p>
      <ol class="passos">
        <li><span><b>Encontre alguém de verdade.</b> Digite o código ou leia o QR do pet da pessoa.</span></li>
        <li><span><b>Escolha como conversar.</b> Papo rápido soma Alcance; ir a fundo soma Profundidade.</span></li>
        <li><span><b>Chegue a um dos 3 finais</b> no Palco DevDay. Suas escolhas decidem qual.</span></li>
      </ol>
      <p class="nota">Sua trilha na Academia começa por <b>${NOMES_HABILIDADE[fraca]}</b>.</p>
      <button class="principal" data-acao="comecar">Começar a aventura ${ICONE.seta}</button>`
  }
  if (e.fase === 'aguardando') {
    const sug = v.sugestoes.length
      ? `<div class="sugestoes"><p class="rotulo">${e.cap === 4 ? 'Seus contatos' : e.cap === 2 ? `Oferecem ${NOMES_TEMA[v.pet.procura]}` : 'De outra área'} <span>toque para encontrar</span></p>${v.sugestoes.map((s) => `<button data-codigo="${s.codigo}">${foto(s, 'mini')}<span><b>${esc(s.nome)}</b> · ${esc(s.dono)}</span><code>${s.codigo}</code></button>`).join('')}</div>`
      : ''
    const f = v.academia.fraca
    const treino = f && CAPITULO_SUGERIDO[f] === e.cap ? `<p class="nota">Aqui você treina <b>${NOMES_HABILIDADE[f]}</b>, sua habilidade mais fraca.</p>` : ''
    return `${topo(`Missão ${e.cap} de ${TOTAL_CAPITULOS}`, cap.objetivo)}<p class="texto">${esc(preencher(cap.abertura, vars))}</p>${treino}<p class="rotulo">Depois do encontro, você escolhe</p>${escolhas(false)}${sug}${escanear}`
  }
  if (e.fase === 'encontro') {
    const a = v.amigo!
    return `${topo(`Missão ${e.cap} de ${TOTAL_CAPITULOS}`, cap.objetivo)}
      <div class="encontro">${foto(a, 'mini')}<p class="texto">${esc(preencher(cap.encontro, vars))}</p></div>
      <p class="pergunta">${esc(cap.pergunta)}</p>${escolhas(true)}`
  }
  if (e.fase === 'consequencia') {
    const o = e.escolhas.at(-1)!
    return `${topo(`Missão ${e.cap} de ${TOTAL_CAPITULOS}`, cap.objetivo)}
      <p class="consequencia ${o}"><b>${o === 'ampla' ? '+2 Alcance' : '+2 Profundidade'}</b>${esc(preencher(cap[o].consequencia, vars))}</p>
      <button class="principal" data-acao="avancar">${e.cap < TOTAL_CAPITULOS ? `Seguir para a Missão ${e.cap + 1}` : 'Subir ao palco'} ${ICONE.seta}</button>`
  }
  const tipo: Final = finalDe(e)
  return `${topo('Final', FINAIS[tipo].titulo)}<p class="texto">${esc(preencher(FINAIS[tipo].texto, vars))}</p>${retomar(v)}`
}

const retomar = (v: Visao) => v.capitulosSalvos.length
  ? `<p class="rotulo">Tente o outro caminho</p><div class="salvos">${v.capitulosSalvos.map((c) => `<button data-retomar="${c}">Missão ${c}</button>`).join('')}</div>`
  : ''

function painelAba(v: Visao) {
  const e = v.estado
  if (aba === 'contatos') {
    const lista = v.conhecidos.length
      ? `<ul class="lista">${v.conhecidos.map((c) => `<li>${foto(c, 'mini')}<div><b>${esc(c.nome)}</b> · ${esc(c.dono)}<small>${NOMES_TEMA[c.area]} · ajuda com ${NOMES_TEMA[c.oferece]}</small></div><code>${c.codigo}</code></li>`).join('')}</ul>`
      : '<p class="texto">Ninguém ainda. Escaneie um pet para começar.</p>'
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
    const todos = (Object.keys(FINAIS) as Final[]).map((f) => `<li class="${atual === f ? 'feito' : ''}"><b>${FINAIS[f].titulo}</b><small>${atual === f ? 'seu final' : 'bloqueado'}</small></li>`).join('')
    return `<div class="cartao-topo"><span>3 finais</span></div><h2>Meus finais</h2>
      <p class="texto">${atual ? `Você chegou em <b>${FINAIS[atual].titulo}</b>.` : 'Complete as 4 missões para chegar a um dos 3 finais.'}</p><ul class="finais">${todos}</ul>${retomar(v)}`
  }
  return academia(v)
}

function render() {
  const v = visao!
  const e = v.estado
  const k = `${e.cap}|${e.fase}|${v.amigo?.id}|${v.conhecidos.length}|${v.sugestoes.length}|${v.capitulosSalvos.join()}|${aba}` +
    `|${diagRespostas.length}|${!!v.academia.diagnostico}|${Object.keys(v.academia.feitas).length}|${atividadeAberta}|${!!resultado}`
  if (k === chave) return
  chave = k
  sincronizarMundo(v)

  if (e.fase === 'aguardando') {
    const pendente = sessionStorage.getItem('qg-c')
    if (pendente) { sessionStorage.removeItem('qg-c'); acao('encontro', { codigo: pendente }) }
  }

  const medidor = (nome: string, valor: number, cls: string) =>
    `<div class="medidor ${cls}" title="${cls === 'ampla' ? 'Quanta gente você conheceu' : 'Até onde você levou cada conversa'}"><span>${nome}</span><b>${valor}</b><i><em data-alvo="${Math.min(100, (valor / 12) * 100)}" style="width:${Math.min(100, (medidas[cls as keyof typeof medidas] / 12) * 100)}%"></em></i></div>`
  const abaBtn = (id: Aba, nome: string) =>
    `<button class="${aba === id ? 'ativa' : ''}" data-aba="${id}" aria-label="${nome}" ${aba === id ? 'aria-current="page"' : ''}>${ICONE[id]}<span>${nome}</span></button>`

  h(`
    <header class="topo">
      ${LOGO()}${EVENTO}
      <button class="eu" data-acao="escanear" aria-label="Meu código e QR">${foto(v.pet, 'avatar')}<span><small>Minha aventura</small><b>${esc(v.pet.nome)}</b></span></button>
      <div class="medidores">${medidor('Alcance', e.alcance, 'ampla')}${medidor('Profundidade', e.profundidade, 'profunda')}</div>
    </header>
    <section class="cartao">${aba === 'mapa' ? cartaoMissao(v) : painelAba(v)}</section>
    <nav class="abas" aria-label="Seções">
      ${abaBtn('mapa', 'Mapa')}${abaBtn('academia', 'Academia')}${abaBtn('contatos', 'Quem eu conheci')}${abaBtn('conexoes', 'Minhas conexões')}${abaBtn('finais', 'Meus finais')}
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
  }
}

addEventListener('pointermove', (ev) => {
  const m = document.querySelector('.marca')
  if (!m) return
  const r = m.getBoundingClientRect()
  const dx = ev.clientX - (r.left + r.width / 2)
  const dy = ev.clientY - (r.top + r.height / 2)
  const d = Math.hypot(dx, dy) || 1
  const k = Math.min(1, d / 160) * 2.6
  olhar.x = (dx / d) * k
  olhar.y = (dy / d) * k
  animate(document.querySelectorAll('.marca .olho'), { x: olhar.x, y: olhar.y }, { type: 'spring', stiffness: 220, damping: 16, mass: 0.6 })
})
// piscada de vez em quando
setInterval(() => calmo.matches || animate(document.querySelectorAll('.marca .olho'), { scaleY: [1, 0.12, 1] }, { duration: 0.22 }), 4800)

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
  else if (d.op) escolher(d.op as Opcao)
  else if (d.codigo) acao('encontro', { codigo: d.codigo })
  else if (d.retomar) { capMontado = -1; aba = 'mapa'; acao('retomar', { cap: Number(d.retomar) }) }
  else if (d.diag !== undefined) {
    diagRespostas.push(Number(d.diag))
    if (diagRespostas.length === DIAGNOSTICO.length) {
      const respostas = diagRespostas
      acao('diagnostico', { respostas }).then(() => { diagRespostas = []; render() })
    }
    render()
  } else if (d.atividade) { atividadeAberta = d.atividade; resultado = null; render() }
  else if (d.resposta !== undefined) {
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

/** Escanear: o celular lê o QR com a câmera nativa; no computador, digita o código. */
async function abrirEscanear() {
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
  const fechar = () => { m.remove(); removeEventListener('keydown', tecla) }
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
    return `<div class="card">${foto(p, 'mini')}<b class="grande">${p.codigo}</b><span>${esc(p.nome)} · ${esc(p.dono)}</span><small>${NOMES_TEMA[p.area]} · ajuda com ${NOMES_TEMA[p.oferece]}</small><img src="${qr}" alt=""></div>`
  }))
  h(`<div class="demo-lista"><header class="criar-topo">${LOGO()}${EVENTO}</header><h2>Pets de exemplo</h2><p class="texto">Para testar e demonstrar sem depender do público.</p><div class="cards">${cards.join('')}</div></div>`)
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
