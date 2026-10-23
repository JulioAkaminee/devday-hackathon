import QRCode from 'qrcode'
import type { Estado, Final, Opcao } from '../shared/engine.ts'
import { finalDe, TOTAL_CAPITULOS } from '../shared/engine.ts'
import {
  ACESSORIOS, CAPITULOS, COR_ESPECIE, ESPECIES, FINAIS, NOMES_ACESSORIO, NOMES_ESPECIE, PERSONALIDADE, PROLOGO, TEMAS, preencher,
  type Especie, type Tema,
} from '../shared/story.ts'
import {
  ATIVIDADES, CAPITULO_SUGERIDO, DIAGNOSTICO, HABILIDADES, NOMES_HABILIDADE, type Academia, type Habilidade, type Questao,
} from '../shared/academia.ts'
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
  academia: Academia & { progresso: Record<Habilidade, { feitas: number; total: number }>; proxima: string | null; fraca: Habilidade | null }
}
type Aba = 'mapa' | 'academia' | 'contatos' | 'finais'

const NOMES_TEMA: Record<Tema, string> = {
  front: 'front-end', back: 'back-end', mobile: 'mobile', dados: 'dados', design: 'design', produto: 'produto', carreira: 'carreira',
}
const EMOJI: Record<Especie, string> = {
  xicara: '☕', caderninho: '📒', laptopinho: '💻', plantinha: '🪴', lampada: '💡',
  coracao: '💗', globinho: '🌍', estrelinha: '⭐', conezinho: '🚧', nuvem: '☁️',
}
const SUGESTOES_NOME = ['Xícaro', 'Bolacha', 'Pipoca', 'Tampinha', 'Biscoito', 'Faísca', 'Nuvem', 'Pudim', 'Teco', 'Bug']
const LOGO = '<span class="seta">›</span>QUEBRA-GELO<span class="seta">‹</span>'

const ui = document.querySelector<HTMLDivElement>('#ui')!
const mundo = new Mundo(document.querySelector<HTMLCanvasElement>('#cena')!)

const guardado = {
  get: (k: string) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k: string, v: string | null) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v) } catch { /* sem storage: segue sem salvar */ } },
}
let token = guardado.get('qg-token')

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
const h = (html: string) => { ui.innerHTML = html }

function aviso(msg: string, tipo: 'erro' | 'ok' = 'erro') {
  const t = document.createElement('div')
  t.className = 'aviso ' + tipo
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
  const dna: DNA = { especie: 'xicara', cor: COR_ESPECIE.xicara, acessorio: 'nenhum' }
  mundo.mostrarVitrine(dna)
  const opcoes = <T extends string>(nome: string, lista: readonly T[], rotulo: (v: T) => string) =>
    `<div class="opcoes" data-campo="${nome}">${lista.map((v, i) => `<button type="button" class="${i ? '' : 'sel'}" data-v="${v}">${rotulo(v)}</button>`).join('')}</div>`
  const select = (nome: string, rotulo: string) =>
    `<label>${rotulo}<select name="${nome}">${TEMAS.map((t) => `<option value="${t}">${NOMES_TEMA[t]}</option>`).join('')}</select></label>`

  h(`
    <form class="painel criar">
      <div class="logo">${LOGO}</div>
      <p class="sub">Monte seu pet. Ele só avança quando você conversa com alguém de verdade.</p>
      <label>Escolha seu pet</label>${opcoes('especie', ESPECIES, (e) => `${EMOJI[e]} ${NOMES_ESPECIE[e]}`)}
      <p class="personalidade">${PERSONALIDADE.xicara}</p>
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

const questao = (q: Questao, attr: string, rotulo: string) =>
  `<p class="rotulo">${rotulo} · ${NOMES_HABILIDADE[q.habilidade]}</p><p class="situacao">${esc(q.situacao)}</p>
   <div class="alternativas">${q.opcoes.map((o, i) => `<button ${attr}="${i}"><b>${'abc'[i]}</b> ${esc(o)}</button>`).join('')}</div>`

/** Diagnóstico: 5 situações, uma por vez, com o pet-recepcionista. */
function diagnostico() {
  const i = diagRespostas.length
  if (i >= DIAGNOSTICO.length) return '<p>Montando sua trilha…</p>'
  return `<p class="dica">Antes de entrar, 5 situações rápidas. Não tem resposta errada para entrar: elas montam sua trilha na Academia.</p>
    ${questao(DIAGNOSTICO[i], 'data-diag', `Situação ${i + 1} de ${DIAGNOSTICO.length}`)}`
}

/** Aba Academia: trilha de bolinhas estilo Duolingo, mais fraca primeiro (K5). */
function academia(v: Visao) {
  const a = v.academia
  if (!a.diagnostico) return `<h2>Academia</h2>${diagnostico()}`
  if (atividadeAberta) {
    const q = HABILIDADES.flatMap((h) => ATIVIDADES[h]).find((x) => x.id === atividadeAberta)!
    if (resultado) {
      return `<h2>${resultado.acertou ? '✅ Boa!' : '💡 Quase'}</h2><p class="situacao">${esc(q.situacao)}</p>
        <p class="explicacao ${resultado.acertou ? 'certo' : 'errado'}">${esc(resultado.explicacao)}</p>
        <button class="principal" data-acao="continuar">Continuar</button>`
    }
    return `<h2>Academia</h2>${questao(q, 'data-resposta', 'Atividade')}<button data-acao="voltar-trilha">← Trilha</button>`
  }
  const fraca = a.fraca!
  const trilha = a.trilha.map((h) => {
    const p = a.progresso[h]
    const bolinhas = ATIVIDADES[h].map((q) => {
      const feita = q.id in a.feitas
      const atual = q.id === a.proxima
      const cls = feita ? (a.feitas[q.id] ? 'certa' : 'errada') : atual ? 'atual' : 'bloqueada'
      const icone = feita ? (a.feitas[q.id] ? '✓' : '↺') : atual ? '★' : '🔒'
      return `<button class="bolinha ${cls}" ${feita || atual ? `data-atividade="${q.id}"` : 'disabled'} aria-label="${cls}">${icone}</button>`
    }).join('')
    return `<div class="habilidade"><div class="hab-topo"><b>${NOMES_HABILIDADE[h]}</b><span>${p.feitas}/${p.total}</span></div>
      <i class="hab-barra"><em style="width:${(p.feitas / p.total) * 100}%"></em></i><div class="bolinhas">${bolinhas}</div></div>`
  }).join('')
  const cap = CAPITULOS[CAPITULO_SUGERIDO[fraca] - 1]
  return `<h2>Academia</h2><p class="dica">Sua habilidade mais fraca é <b>${NOMES_HABILIDADE[fraca]}</b>: a Missão ${CAPITULO_SUGERIDO[fraca]} (${cap.titulo}) é o seu treino na Aventura.</p>
    <div class="trilha">${trilha}</div>${a.proxima ? '' : '<p>🏆 Trilha completa!</p>'}`
}

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
    try {
      const antes = visao!.conhecidos.length
      const nova = await api('eu')
      visao = nova
      const novo = nova.conhecidos.at(-1)
      if (nova.conhecidos.length > antes && novo) aviso(`${novo.nome}, de ${novo.dono}, te encontrou!`, 'ok')
      render()
    } catch { /* rede oscilou: tenta de novo no próximo ciclo */ }
  }, 2000)
}

async function acao(rota: string, corpo: object = {}) {
  try { visao = await api(rota, corpo); render() } catch (err) { aviso((err as Error).message) }
}

/** Atualiza o mundo 3D a partir do estado. Só mexe no que mudou. */
function sincronizarMundo(v: Visao) {
  const e = v.estado
  const dna = dnaDe(v.pet)
  const itens = itensDe(e.alcance, e.profundidade)
  const ik = JSON.stringify(itens)
  const capMundo = e.fase === 'final' ? TOTAL_CAPITULOS : e.cap

  if (capMundo !== capMontado || e.fase === 'aguardando' || e.fase === 'final') {
    mundo.irPara(capMundo, dna, itens)
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

  const feitos = e.fase === 'final' ? TOTAL_CAPITULOS : e.cap - 1
  const porIlha = e.encontros.slice(0, Math.max(0, feitos)).map((id) => {
    const p = v.conhecidos.find((c) => c.id === id)
    return p ? dnaDe(p) : null
  })
  mundo.atualizarMapa(e.fase === 'final' ? 5 : e.cap, e.escolhas, porIlha)

  const cap = CAPITULOS[e.cap - 1]
  if (e.fase === 'encontro' && v.amigo) {
    mundo.chegarAmigo(dnaDe(v.amigo))
    const vars = variaveis(v)
    mundo.mostrarZonas([preencher(cap.ampla.opcao, vars), preencher(cap.profunda.opcao, vars)], escolher)
  } else if (e.fase === 'consequencia') {
    if (v.amigo) mundo.chegarAmigo(dnaDe(v.amigo))
    if (escolhaLocal === e.cap) { mundo.consequencia(e.escolhas.at(-1)!); escolhaLocal = null }
  } else if (e.fase === 'final') {
    mundo.cenaFinal(finalDe(e), v.conhecidos.map(dnaDe))
  }
}

function cartaoMissao(v: Visao) {
  const e = v.estado
  const vars = variaveis(v)
  const cap = CAPITULOS[e.cap - 1]
  const pontos = Array.from({ length: TOTAL_CAPITULOS }, (_, i) => `<i class="${i < e.cap - 1 || e.fase === 'final' ? 'feito' : i === e.cap - 1 ? 'atual' : ''}"></i>`).join('')
  const topo = (rotulo: string, titulo: string) => `<div class="cartao-topo"><span>${rotulo}</span><span class="pontos">${pontos}</span></div><h2>${esc(titulo)}</h2>`
  const escanear = `<button class="escanear" data-acao="escanear"><span>⌗</span> Escanear pet</button>`

  if (e.fase === 'prologo') {
    // Credenciamento: o diagnóstico da Academia vem antes da aventura (K4)
    if (!v.academia.diagnostico) return `${topo('Credenciamento', 'A recepção quer te conhecer')}${diagnostico()}`
    const fraca = v.academia.fraca!
    return `${topo('Prólogo', 'Credenciamento')}<p class="dica">🎓 Sua trilha na Academia começa por <b>${NOMES_HABILIDADE[fraca]}</b>.</p><p>${esc(preencher(PROLOGO, vars))}</p><button class="principal" data-acao="comecar">Começar a aventura</button>`
  }
  if (e.fase === 'aguardando') {
    const sug = v.sugestoes.length
      ? `<div class="sugestoes">${v.sugestoes.map((s) => `<button data-codigo="${s.codigo}">${EMOJI[s.especie]} <b>${esc(s.nome)}</b> · ${esc(s.dono)} · oferece ${NOMES_TEMA[s.oferece]} <code>${s.codigo}</code></button>`).join('')}</div>`
      : ''
    const f = v.academia.fraca
    const treino = f && CAPITULO_SUGERIDO[f] === e.cap ? `<p class="dica">🎓 Esta missão treina <b>${NOMES_HABILIDADE[f]}</b>, sua habilidade mais fraca.</p>` : ''
    return `${topo(`Missão ${e.cap} de ${TOTAL_CAPITULOS}`, cap.objetivo)}<p>${esc(preencher(cap.abertura, vars))}</p>${treino}${sug}${escanear}`
  }
  if (e.fase === 'encontro') {
    const op = (o: Opcao, icone: string, efeito: string) =>
      `<button class="escolha ${o}" data-op="${o}"><span class="icone">${icone}</span><span>${esc(preencher(cap[o].opcao, vars))}<small>${efeito}</small></span></button>`
    return `${topo(`Missão ${e.cap} de ${TOTAL_CAPITULOS}`, cap.objetivo)}<p>${esc(preencher(cap.encontro, vars))}</p>
      <p class="pergunta">${esc(cap.pergunta)} <small>Toque numa opção ou ande até a zona.</small></p>
      <div class="escolhas">${op('ampla', '💬', '+2 Alcance')}${op('profunda', '🤝', '+2 Profundidade')}</div>`
  }
  if (e.fase === 'consequencia') {
    const o = e.escolhas.at(-1)!
    return `${topo(`Missão ${e.cap} de ${TOTAL_CAPITULOS}`, cap.objetivo)}<p class="consequencia ${o}">${esc(preencher(cap[o].consequencia, vars))}</p>
      <button class="principal" data-acao="avancar">${e.cap < TOTAL_CAPITULOS ? 'Seguir para a próxima ilha' : 'Subir ao palco'} →</button>`
  }
  const tipo: Final = finalDe(e)
  return `${topo('Final', FINAIS[tipo].titulo)}<p>${esc(preencher(FINAIS[tipo].texto, vars))}</p>${retomar(v)}`
}

const retomar = (v: Visao) => v.capitulosSalvos.length
  ? `<p class="dica">Volte a uma missão salva e tente o outro caminho:</p><div class="salvos">${v.capitulosSalvos.map((c) => `<button data-retomar="${c}">⏪ Missão ${c}</button>`).join('')}</div>`
  : ''

function painelAba(v: Visao) {
  if (aba === 'contatos') {
    const lista = v.conhecidos.length
      ? `<ul class="contatos">${v.conhecidos.map((c) => `<li><span class="avatar" style="background:${c.cor}">${EMOJI[c.especie]}</span><div><b>${esc(c.nome)}</b> · ${esc(c.dono)}<small>${NOMES_TEMA[c.area]} · oferece ${NOMES_TEMA[c.oferece]}</small></div></li>`).join('')}</ul>`
      : '<p>Ninguém ainda. Escaneie um pet para começar.</p>'
    return `<h2>Quem eu conheci</h2>${lista}`
  }
  if (aba === 'finais') {
    const e = v.estado
    const atual = e.fase === 'final' ? `<p>Você chegou em <b>${FINAIS[finalDe(e)].titulo}</b>.</p>` : '<p>Complete as 4 missões para chegar a um dos 3 finais.</p>'
    const todos = (Object.keys(FINAIS) as Final[]).map((f) => `<li class="${e.fase === 'final' && finalDe(e) === f ? 'feito' : ''}">🏆 ${FINAIS[f].titulo}</li>`).join('')
    return `<h2>Meus finais</h2>${atual}<ul class="finais">${todos}</ul>${retomar(v)}`
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
    `<div class="medidor ${cls}"><span>${nome}</span><b>${valor}</b><i><em style="width:${Math.min(100, (valor / 12) * 100)}%"></em></i></div>`
  const abaBtn = (id: Aba, icone: string, nome: string) =>
    `<button class="${aba === id ? 'ativa' : ''}" data-aba="${id}"><span>${icone}</span><span class="nome">${nome}</span></button>`

  h(`
    <header class="topo">
      <div class="logo">${LOGO}</div>
      <div class="evento"><b>DevDay · São Paulo</b><small>OpenAI DevDay Community</small></div>
      <button class="eu" data-acao="escanear" title="Meu código">
        <span class="avatar" style="background:${v.pet.cor}">${EMOJI[v.pet.especie]}</span>
        <span><small>Minha aventura</small><b>${esc(v.pet.nome)}</b></span><code>${v.pet.codigo}</code>
      </button>
      ${medidor('Alcance', e.alcance, 'ampla')}${medidor('Profundidade', e.profundidade, 'profunda')}
    </header>
    <section class="cartao">${aba === 'mapa' ? cartaoMissao(v) : painelAba(v)}</section>
    <nav class="abas">
      ${abaBtn('mapa', '🗺️', 'Mapa')}${abaBtn('academia', '🎓', 'Academia')}${abaBtn('contatos', '👥', 'Quem eu conheci')}${abaBtn('finais', '🏆', 'Meus finais')}
    </nav>`)
}

function escolher(op: Opcao) {
  escolhaLocal = visao!.estado.cap
  acao('escolha', { opcao: op })
}

ui.addEventListener('click', (ev) => {
  const b = (ev.target as HTMLElement).closest('button')
  if (!b) return
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
    // segue direto para a próxima bolinha, como no Duolingo
    if (d.acao === 'continuar' && visao!.academia.proxima) atividadeAberta = visao!.academia.proxima
    render()
  } else if (d.aba) {
    // Mapa de novo alterna entre a ilha atual e a visão de todas as ilhas
    if (d.aba === 'mapa' && aba === 'mapa') mundo.verModo(mundo.modoAtual === 'mapa' ? 'ilha' : 'mapa')
    aba = d.aba as Aba
    render()
  }
})

/** Escanear: o celular lê o QR com a câmera nativa; no computador, digita o código. */
async function abrirEscanear() {
  const p = visao!.pet
  const url = await QRCode.toDataURL(`${location.origin}/?c=${p.codigo}`, { margin: 1, width: 240 })
  const m = document.createElement('div')
  m.className = 'modal'
  m.innerHTML = `<div class="painel escanear-painel" role="dialog" aria-label="Encontrar pet">
      <h2>Encontrar um pet</h2>
      <form><input name="codigo" maxlength="4" placeholder="CÓDIGO" autocomplete="off" autocapitalize="characters" aria-label="Código do outro pet"><button class="principal">Encontrar</button></form>
      <p class="dica">No celular, aponte a câmera para o QR do outro pet. No computador, digite o código dele.</p>
      <hr>
      <p>Seu código</p><p class="grande">${p.codigo}</p><img src="${url}" alt="QR do pet ${esc(p.nome)}">
      <button type="button" data-fechar>Fechar</button>
    </div>`
  const fechar = () => { m.remove(); removeEventListener('keydown', tecla) }
  const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar() }
  addEventListener('keydown', tecla)
  m.addEventListener('click', (e) => { if (e.target === m || (e.target as HTMLElement).dataset.fechar !== undefined) fechar() })
  m.querySelector('form')!.addEventListener('submit', (e) => {
    e.preventDefault()
    const codigo = new FormData(e.target as HTMLFormElement).get('codigo')
    if (codigo) { fechar(); acao('encontro', { codigo }) }
  })
  document.body.append(m)
  m.querySelector('input')!.focus()
}

// ---------- Página /demo: pets de exemplo com QR (QUEBRA-GELO.md, seção 7) ----------

async function telaDemo() {
  document.body.classList.add('demo')
  const pets = await api<PetPublico[]>('demo')
  const cards = await Promise.all(pets.map(async (p) => {
    const qr = await QRCode.toDataURL(`${location.origin}/?c=${p.codigo}`, { margin: 1, width: 200 })
    return `<div class="card"><img src="${qr}" alt=""><b class="grande">${p.codigo}</b><span>${EMOJI[p.especie]} ${esc(p.nome)} · ${esc(p.dono)}</span><small>${NOMES_TEMA[p.area]} · oferece ${NOMES_TEMA[p.oferece]}</small></div>`
  }))
  h(`<div class="painel demo-lista"><div class="logo">${LOGO}</div><p class="sub">Pets de exemplo para testar e demonstrar sem depender do público.</p><div class="cards">${cards.join('')}</div></div>`)
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
