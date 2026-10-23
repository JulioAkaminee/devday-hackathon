import express from 'express'
import { randomBytes } from 'node:crypto'
import { mkdirSync, renameSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import {
  ErroDeFase, ErroDeRegra, amigoAtual, motivoRecusa, avancar, comecar, conhecer, encontrar, escolher, novoEstado, type Estado,
} from '../shared/engine.ts'
import {
  habilidadeFraca, novaAcademia, progresso, proximaAtividade, responderAtividade, responderDiagnostico, type Academia,
} from '../shared/academia.ts'
import { ACESSORIOS, COR_ESPECIE, ESPECIES, TEMAS, type Acessorio, type Especie, type Tema } from '../shared/story.ts'
import { ErroHttp, Limite, alvoDoEncontro, completar, lerSnapshot, linkedinDe } from './regras.ts'
import { telao } from './telao.ts'
import QRCode from 'qrcode'

interface Pet {
  id: string
  token: string
  codigo: string
  nome: string
  dono: string
  linkedin?: string // só vai para quem já encontrou este pet (visao)
  especie: Especie
  cor: string
  acessorio: Acessorio
  // sempre lista: desde 23/10 a pessoa pode marcar mais de uma área em cada pergunta
  area: Tema[]
  procura: Tema[]
  oferece: Tema[]
  demo: boolean
  estado: Estado
  historico: Estado[] // estado no início de cada capítulo, para retomar dali (demo dos dois caminhos)
  academia: Academia // desafio nº 4: separado de Alcance e Profundidade (QUEBRA-GELO.md, 3B)
}

const PORT = Number(process.env.PORT ?? 3000)
const DATA_DIR = process.env.DATA_DIR ?? 'data'
const ARQUIVO = join(DATA_DIR, 'mundo.json')
const PROD = process.env.NODE_ENV === 'production'

// ponytail: tudo em memória + snapshot JSON; uma instância só (QUEBRA-GELO.md, seção 9)
const pets = new Map<string, Pet>()
let sujo = false

const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // sem I e O, que confundem com 1 e 0
const sortear = (n: number) => Array.from(randomBytes(n), (b) => LETRAS[b % LETRAS.length]).join('')
function novoCodigo() {
  let c: string
  do c = sortear(4)
  while ([...pets.values()].some((p) => p.codigo === c))
  return c
}

const publico = (p: Pet) => ({
  id: p.id, codigo: p.codigo, nome: p.nome, dono: p.dono, especie: p.especie, cor: p.cor, acessorio: p.acessorio,
  area: p.area, procura: p.procura, oferece: p.oferece, demo: p.demo,
})

// Semente: pets de exemplo para a demo não depender do público (QUEBRA-GELO.md, seção 7)
const SEMENTE: [string, string, Especie, Acessorio, Tema[], Tema[], Tema[]][] = [
  ['XICA', 'Xícara|Ana', 'xicara', 'nenhum', ['design'], ['back'], ['design']],
  ['CADE', 'Caderninho|Bruno', 'caderninho', 'nenhum', ['back'], ['design'], ['back']],
  ['LAMP', 'Lâmpada|Carla', 'lampada', 'nenhum', ['dados'], ['produto'], ['dados']],
  ['CORA', 'Coração|Diego', 'coracao', 'nenhum', ['front'], ['carreira'], ['front']],
  ['GLOB', 'Globinho|Elisa', 'globinho', 'nenhum', ['mobile'], ['front'], ['mobile']],
  ['CONE', 'Conezinho|Fábio', 'conezinho', 'nenhum', ['produto'], ['dados'], ['produto']],
  ['NUVE', 'Nuvem|Gabi', 'nuvem', 'boina', ['carreira'], ['mobile'], ['carreira']],
]
function semear() {
  for (const [codigo, nomes, especie, acessorio, area, procura, oferece] of SEMENTE) {
    if ([...pets.values()].some((p) => p.codigo === codigo)) continue
    const id = 'demo-' + codigo.toLowerCase()
    const [nome, dono] = nomes.split('|')
    pets.set(id, {
      id, token: randomBytes(16).toString('hex'), codigo, nome, dono, especie, cor: COR_ESPECIE[especie], acessorio,
      area, procura, oferece, demo: true, estado: novoEstado(), historico: [], academia: novaAcademia(),
    })
  }
}

function carregar() {
  // pets de uma versão antiga (espécie que não existe mais) ficam de fora
  const lista = (v: unknown, padrao: Tema): Tema[] =>
    Array.isArray(v) ? (v as Tema[]).filter((t) => TEMAS.includes(t)) :
      typeof v === 'string' && TEMAS.includes(v as Tema) ? [v as Tema] : [padrao]
  for (const p of lerSnapshot(ARQUIVO) as Pet[]) {
    if (!ESPECIES.includes(p?.especie)) continue
    // snapshot de antes do multi-escolha guardava uma área só (string): vira lista de um item
    const antigo = p as unknown as { area?: unknown; procura?: unknown; oferece?: unknown }
    pets.set(p.id, completar({
      ...p,
      area: lista(antigo.area, 'front'),
      procura: lista(antigo.procura, 'back'),
      oferece: lista(antigo.oferece, 'front'),
    }))
  }
}
function salvar() {
  if (!sujo) return
  try {
    mkdirSync(DATA_DIR, { recursive: true })
    writeFileSync(ARQUIVO + '.tmp', JSON.stringify([...pets.values()]))
    renameSync(ARQUIVO + '.tmp', ARQUIVO)
    sujo = false
  } catch (e) {
    console.error('falha ao salvar o snapshot; tento de novo em 5 s:', (e as Error).message) // sujo continua true
  }
}

function mudar(p: Pet, novo: Estado) {
  if (novo.fase === 'aguardando' && p.estado.fase !== 'aguardando') p.historico[novo.cap] = novo
  p.estado = novo
  sujo = true
}

const um = <T extends string>(v: unknown, lista: readonly T[], campo: string): T => {
  if (typeof v !== 'string' || !lista.includes(v as T)) throw new ErroHttp(400, `${campo} inválido`)
  return v as T
}

/** Uma ou mais áreas por pergunta: tira repetido, exige pelo menos uma e cabe nos dedos de uma mão. */
const temas = (v: unknown, campo: string): Tema[] => {
  if (!Array.isArray(v) || v.length === 0) throw new ErroHttp(400, `escolha pelo menos uma opção em ${campo}`)
  const lista = [...new Set(v)]
  if (lista.length > 4) throw new ErroHttp(400, `escolha até 4 opções em ${campo}`)
  for (const t of lista) if (typeof t !== 'string' || !TEMAS.includes(t as Tema)) throw new ErroHttp(400, `${campo} inválido`)
  return lista as Tema[]
}

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '10kb' }))

app.get('/health', (_req, res) => { res.send('ok') })

const MAX_PETS = 2000 // sem teto, novoCodigo fica lento e trava quando os códigos acabam
app.post('/api/pets', (req, res) => {
  if (pets.size >= MAX_PETS) throw new ErroHttp(503, 'evento lotado: não cabem mais pets')
  const b = req.body ?? {}
  const nome = typeof b.nome === 'string' ? b.nome.trim() : ''
  const dono = typeof b.dono === 'string' ? b.dono.trim() : ''
  if (nome.length < 2 || nome.length > 16) throw new ErroHttp(400, 'nome do pet deve ter de 2 a 16 caracteres')
  if (dono.length < 2 || dono.length > 16) throw new ErroHttp(400, 'seu nome deve ter de 2 a 16 caracteres')
  const p: Pet = {
    id: randomBytes(6).toString('hex'),
    token: randomBytes(16).toString('hex'),
    codigo: novoCodigo(),
    nome,
    dono,
    linkedin: linkedinDe(b.linkedin),
    especie: um(b.especie, ESPECIES, 'especie'),
    cor: COR_ESPECIE[b.especie as Especie],
    acessorio: um(b.acessorio, ACESSORIOS, 'acessorio'),
    area: temas(b.area, 'area'),
    procura: temas(b.procura, 'procura'),
    oferece: temas(b.oferece, 'oferece'),
    demo: false,
    estado: novoEstado(),
    historico: [],
    academia: novaAcademia(),
  }
  pets.set(p.id, p)
  sujo = true
  res.json({ token: p.token })
})

app.get('/api/demo', (_req, res) => {
  res.json([...pets.values()].filter((p) => p.demo).map(publico))
})

/**
 * Números públicos do evento: a faixa da tela de criação e o telão. Sempre ao vivo, sem dado inflado.
 * Encontro = par único de pets reais que já se conheceram (o mesmo par conta uma vez).
 */
function estatisticas() {
  const reais = [...pets.values()].filter((p) => !p.demo)
  const pares = new Set<string>()
  const trocas = new Set<string>() // encontros em que os dois deixaram o LinkedIn
  for (const p of reais) {
    for (const id of p.estado.conhecidos) {
      const outro = pets.get(id)
      if (!outro || outro.demo) continue
      const par = [p.id, outro.id].sort().join('|')
      pares.add(par)
      if (p.linkedin && outro.linkedin) trocas.add(par)
    }
  }
  const top = reais
    .map((p) => ({
      nome: p.nome, dono: p.dono,
      conhecidos: p.estado.conhecidos.filter((id) => pets.has(id) && !pets.get(id)!.demo).length,
    }))
    .sort((a, b) => b.conhecidos - a.conhecidos || a.nome.localeCompare(b.nome))
    .slice(0, 6)
  return {
    pessoas: reais.length,
    encontros: pares.size,
    linkedins: trocas.size,
    jogando: reais.filter((p) => p.estado.fase !== 'prologo').length,
    finais: reais.filter((p) => p.estado.fase === 'final').length,
    top,
  }
}

app.get('/api/stats', (_req, res) => { res.json(estatisticas()) })

// Presença: online = fez requisição com token nos últimos 10 s (com o app aberto, o celular consulta /api/eu a cada 2 s).
// Fica só em memória, fora do Pet: não vai para o snapshot nem marca `sujo`.
const ONLINE_MS = 10_000
const vistos = new Map<string, number>()

// Pílula do cabeçalho e telão: { total }. Com ?lista=1 (painel aberto) vêm também os pets, até 60.
app.get('/api/online', (req, res) => {
  const desde = Date.now() - ONLINE_MS
  const online: Pet[] = []
  for (const [id, t] of vistos) {
    const p = pets.get(id)
    if (t >= desde && p && !p.demo) online.push(p)
  }
  res.set('Cache-Control', 'no-store')
  if (req.query.lista === undefined) return void res.json({ total: online.length })
  res.json({
    total: online.length,
    pets: online.sort((a, b) => a.nome.localeCompare(b.nome)).slice(0, 60)
      .map((p) => ({ id: p.id, nome: p.nome, dono: p.dono, especie: p.especie, acessorio: p.acessorio })),
  })
})

// Telão do evento: QR para entrar e os números ao vivo. Página própria, sem passar pelo SPA.
app.get('/tela', async (req, res) => {
  const url = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`
  const qr = await QRCode.toDataURL(url.replace(/\/$/, '') + '/', { margin: 1, width: 520, color: { dark: '#141414', light: '#ffffff' } })
  res.type('html').send(telao(qr, url.replace(/\/$/, '')))
})

// Rotas abaixo exigem o token do celular
const eu = (req: express.Request) => {
  const t = req.header('x-token')
  const p = t ? [...pets.values()].find((x) => x.token === t) : undefined
  if (!p) throw new ErroHttp(401, 'pet não encontrado')
  vistos.set(p.id, Date.now())
  return p
}

function visao(p: Pet) {
  // o LinkedIn só sai para quem já se encontrou: é a prova da conversa, não uma lista aberta
  const pub = (id: string | null) => {
    const x = id ? pets.get(id) : undefined
    if (!x) return null
    return p.estado.conhecidos.includes(x.id) && x.linkedin ? { ...publico(x), linkedin: x.linkedin } : publico(x)
  }
  // caps. 1 e 3: gente nova de outra área; cap. 2: quem oferece o que você procura; cap. 4: seus contatos
  // gente real esperando encontro primeiro, depois gente real, pets de exemplo por último
  const peso = (x: Pet) => (x.demo ? 2 : x.estado.fase === 'aguardando' ? 0 : 1)
  const novos = (f: (x: Pet) => boolean) =>
    [...pets.values()].filter((x) => x.id !== p.id && !p.estado.conhecidos.includes(x.id) && f(x))
      .sort((a, b) => peso(a) - peso(b)).slice(0, 3)
      // gente real vai sem o código: o encontro só vale com o código que a pessoa mostra ao vivo
      .map((x) => (x.demo ? publico(x) : { ...publico(x), codigo: '' }))
  const cap = p.estado.cap
  const cruza = (a: Tema[], b: Tema[]) => a.some((t) => b.includes(t))
  const sugestoes = cap === 1 || cap === 3 ? novos((x) => !cruza(x.area, p.area))
    : cap === 2 ? novos((x) => cruza(x.oferece, p.procura))
    : cap === 4 ? p.estado.conhecidos.map(pub).filter((x) => x !== null) : []
  return {
    pet: publico(p),
    estado: p.estado,
    amigo: pub(amigoAtual(p.estado)),
    conhecidos: p.estado.conhecidos.map(pub).filter(Boolean),
    capitulosSalvos: p.historico.map((e, i) => (e ? i : -1)).filter((i) => i > 0),
    sugestoes,
    academia: {
      ...p.academia,
      progresso: progresso(p.academia),
      proxima: proximaAtividade(p.academia)?.id ?? null,
      fraca: habilidadeFraca(p.academia),
    },
  }
}

app.get('/api/eu', (req, res) => { res.json(visao(eu(req))) })

// App fechado ou em segundo plano: sai da contagem na hora, sem esperar os 10 s
app.post('/api/sair', (req, res) => {
  const p = eu(req)
  vistos.delete(p.id)
  res.json(visao(p))
})

app.post('/api/comecar', (req, res) => {
  const p = eu(req)
  mudar(p, comecar(p.estado))
  res.json(visao(p))
})

const limite = new Limite()
app.post('/api/encontro', (req, res) => {
  const p = eu(req)
  const codigo = String(req.body?.codigo ?? '').trim().toUpperCase()
  const agora = Date.now()
  limite.checar(p.token, agora)
  let outro: Pet
  try {
    outro = alvoDoEncontro(p.estado, codigo, (c) => [...pets.values()].find((x) => x.codigo === c))
  } catch (e) {
    if (e instanceof ErroHttp) limite.errou(p.token, agora)
    throw e
  }
  if (outro.id === p.id) throw new ErroHttp(400, 'esse é o seu próprio pet')
  mudar(p, encontrar(p.estado, outro.id))
  limite.encontrou(p.token, agora)
  // O encontro vale para os dois: se o outro está esperando alguém, o capítulo dele abre também (L3)
  // (se a missão do outro não aceita este encontro, ele só registra que te conheceu)
  if (!outro.demo) {
    const abre = outro.estado.fase === 'aguardando' && !motivoRecusa(outro.estado, p.id)
    mudar(outro, abre ? encontrar(outro.estado, p.id) : conhecer(outro.estado, p.id))
  }
  res.json(visao(p))
})

app.post('/api/escolha', (req, res) => {
  const p = eu(req)
  mudar(p, escolher(p.estado, um(req.body?.opcao, ['ampla', 'profunda'] as const, 'opcao')))
  res.json(visao(p))
})

app.post('/api/avancar', (req, res) => {
  const p = eu(req)
  mudar(p, avancar(p.estado))
  res.json(visao(p))
})

// Retomar do início de um capítulo salvo: é o que mostra os dois caminhos na demo
// Academia (desafio nº 4): diagnóstico uma vez, depois atividades da trilha
const errosAcademia = (f: () => void) => {
  try { f() } catch (e) { throw new ErroHttp(400, (e as Error).message) }
}
app.post('/api/diagnostico', (req, res) => {
  const p = eu(req)
  const respostas: unknown = req.body?.respostas
  // Number(null) e Number('1') viravam resposta válida
  if (!Array.isArray(respostas) || !respostas.every((r) => typeof r === 'number')) throw new ErroHttp(400, 'respostas inválidas')
  errosAcademia(() => { p.academia = responderDiagnostico(p.academia, respostas) })
  sujo = true
  res.json(visao(p))
})
app.post('/api/atividade', (req, res) => {
  const p = eu(req)
  let r!: ReturnType<typeof responderAtividade>
  errosAcademia(() => { r = responderAtividade(p.academia, String(req.body?.id), Number(req.body?.opcao)) })
  p.academia = r.academia
  sujo = true
  res.json({ ...visao(p), resultado: { acertou: r.acertou, explicacao: r.explicacao } })
})

app.post('/api/retomar', (req, res) => {
  const p = eu(req)
  const salvo = p.historico[Number(req.body?.cap)]
  if (!salvo) throw new ErroHttp(404, 'não há progresso salvo nesse capítulo')
  mudar(p, salvo)
  res.json(visao(p))
})

app.use('/api', (_req, _res, next) => next(new ErroHttp(404, 'rota não encontrada')))

if (PROD) {
  const dist = resolve('dist')
  app.use(express.static(dist))
  // arquivo com ponto que não existe (ex.: /app.js velho) dá 404, não a página
  app.get('/{*rota}', (req, res, next) => { if (req.path.includes('.')) return next(); res.sendFile(join(dist, 'index.html')) })
} else {
  const { createServer } = await import('vite')
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' })
  app.use(vite.middlewares)
}

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof ErroHttp) return void res.status(err.status).json({ erro: err.message })
  if (err instanceof ErroDeRegra) return void res.status(400).json({ erro: err.message })
  if (err instanceof ErroDeFase) return void res.status(409).json({ erro: 'essa ação não vale agora; a tela foi atualizada' })
  // JSON inválido, corpo grande demais etc. (body-parser): culpa do pedido, sem stack no log
  const status = (err as { status?: unknown }).status
  if (typeof status === 'number' && status >= 400 && status < 500) {
    return void res.status(status === 413 ? 413 : 400).json({ erro: status === 413 ? 'pedido grande demais' : 'pedido inválido' })
  }
  console.error(err)
  res.status(500).json({ erro: 'erro interno' })
})

carregar()
semear()
setInterval(salvar, 5000)
for (const sinal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(sinal, () => { sujo = true; salvar(); process.exit(0) })
}
app.listen(PORT, () => console.log(`Quebra-Gelo em http://localhost:${PORT}`))
