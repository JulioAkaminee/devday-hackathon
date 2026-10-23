// Perfis que parecem gente do evento, com encontros em rodadas (cada token espera 5 s entre encontros).
// uso: node repertorio.mjs https://quebra-gelo.julioakamine.com
const B = (process.argv[2] ?? 'http://localhost:3200').replace(/\/$/, '') + '/api/'
const req = async (rota, corpo, token) => {
  const r = await fetch(B + rota, { method: corpo ? 'POST' : 'GET', headers: { 'content-type': 'application/json', ...(token ? { 'x-token': token } : {}) }, body: corpo ? JSON.stringify(corpo) : undefined })
  const j = await r.json()
  if (!r.ok) throw new Error(`${rota} ${r.status} ${j.erro ?? ''}`)
  return j
}
const s = (ms) => new Promise((r) => setTimeout(r, ms))

// [pet, dono, espécie, acessório, área, procura, oferece, estilo]
const GENTE = [
  ['Faísca', 'Marina', 'nuvem', 'boina', ['marketing'], ['dados'], ['marketing'], 'ampla'],
  ['Pudim', 'Rafael', 'caderninho', 'oculos', ['back'], ['produto'], ['back'], 'profunda'],
  ['Teco', 'Júlia', 'lampada', 'nenhum', ['dados'], ['design'], ['dados'], 'misto'],
  ['Bolacha', 'Pedro', 'coracao', 'nenhum', ['comercial'], ['front'], ['comercial'], 'ampla'],
  ['Biscoito', 'Camila', 'globinho', 'oculos', ['design'], ['back'], ['design'], 'profunda'],
  ['Cometa', 'Lucas', 'estrelinha', 'boina', ['rh'], ['carreira'], ['rh'], 'misto'],
  ['Pipoca', 'Beatriz', 'xicara', 'nenhum', ['produto'], ['dados'], ['produto'], 'ampla'],
  ['Bug', 'Thiago', 'laptopinho', 'oculos', ['front'], ['mobile'], ['front'], 'profunda'],
  ['Brisa', 'Larissa', 'plantinha', 'boina', ['gestao'], ['marketing'], ['gestao'], 'misto'],
  ['Pixel', 'Gustavo', 'conezinho', 'nenhum', ['mobile'], ['design'], ['mobile'], 'ampla'],
  ['Mochi', 'Fernanda', 'xicara', 'oculos', ['fullstack'], ['carreira'], ['fullstack'], 'profunda'],
  ['Trovão', 'Rodrigo', 'nuvem', 'nenhum', ['carreira'], ['comercial'], ['carreira'], 'misto'],
  ['Kiwi', 'Aline', 'plantinha', 'nenhum', ['design'], ['produto'], ['design'], 'ampla'],
  ['Farol', 'Vinícius', 'lampada', 'boina', ['dados'], ['back'], ['dados'], 'profunda'],
]
// rodadas de pares disjuntos; a última repete pares da primeira (Missão 4 é reencontro)
const RODADAS = [
  [[0, 1], [2, 3], [4, 5], [6, 7], [8, 9], [10, 11]],
  [[0, 2], [1, 3], [4, 6], [5, 7], [8, 10], [12, 13]],
  [[0, 4], [1, 5], [2, 6], [3, 8], [7, 9]],
  [[0, 1], [4, 5], [6, 7]],
]

const pets = []
for (const [nome, dono, especie, acessorio, area, procura, oferece, estilo] of GENTE) {
  const { token } = await req('pets', { nome, dono, especie, acessorio, area, procura, oferece })
  const { pet } = await req('eu', null, token)
  await req('comecar', {}, token).catch(() => {})
  pets.push({ token, codigo: pet.codigo, estilo, nome })
}
const escolha = (p, cap) => (p.estilo === 'misto' ? (cap % 2 ? 'ampla' : 'profunda') : p.estilo)
const fechar = async (p) => {
  const v = await req('eu', null, p.token)
  if (v.estado?.fase !== 'encontro') return
  await req('escolha', { opcao: escolha(p, v.estado.cap) }, p.token)
  await req('avancar', {}, p.token)
}
for (const [i, rodada] of RODADAS.entries()) {
  await Promise.all(rodada.map(async ([a, b]) => {
    try {
      await req('encontro', { codigo: pets[b].codigo }, pets[a].token)
      await fechar(pets[a]); await fechar(pets[b])
    } catch (e) { console.log('rodada', i + 1, pets[a].nome, '→', pets[b].nome, e.message) }
  }))
  await s(5300)
}
console.log(await req('stats'))
