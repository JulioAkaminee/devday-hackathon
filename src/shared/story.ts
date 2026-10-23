// Textos da aventura. Fonte: docs/HISTORIA.md (rascunho v1). Mudou lá, muda aqui.
import type { Final } from './engine.ts'

// Pets do evento: docs/referencias/pets-do-evento-v1.png (Julio)
export const ESPECIES = [
  'xicara', 'caderninho', 'laptopinho', 'plantinha', 'lampada', 'coracao', 'globinho', 'estrelinha', 'conezinho', 'nuvem',
] as const
// Todo pet já usa a mochila com a logo da OpenAI; o acessório é um extra por cima.
export const ACESSORIOS = ['nenhum', 'oculos', 'boina'] as const
export const TEMAS = ['front', 'back', 'fullstack', 'mobile', 'dados', 'design', 'produto', 'marketing', 'comercial', 'rh', 'gestao', 'carreira'] as const

export type Especie = (typeof ESPECIES)[number]
export type Acessorio = (typeof ACESSORIOS)[number]
export type Tema = (typeof TEMAS)[number]

export const NOMES_ESPECIE: Record<Especie, string> = {
  xicara: 'Xícara', caderninho: 'Caderninho', laptopinho: 'Laptopinho', plantinha: 'Plantinha', lampada: 'Lâmpada',
  coracao: 'Coração', globinho: 'Globinho', estrelinha: 'Estrelinha', conezinho: 'Conezinho', nuvem: 'Nuvem',
}
export const PERSONALIDADE: Record<Especie, string> = {
  xicara: 'Curioso, puxa assunto com qualquer um.',
  caderninho: 'Organizado, anota tudo e adora trocar ideias.',
  laptopinho: 'Criativo, tem um projeto novo por semana.',
  plantinha: 'Tranquila, junta pessoas que ninguém juntaria.',
  lampada: 'Cheio de ideias, fala rápido e anima a mesa.',
  coracao: 'Empático, escuta até o fim antes de falar.',
  globinho: 'Faz amizade com gente de todas as áreas.',
  estrelinha: 'Animado, é o primeiro a aplaudir os outros.',
  conezinho: 'Direto, ajuda o time a focar no objetivo.',
  nuvem: 'Observador, vê o problema por outro ângulo.',
}
/** Cor principal de cada pet (avatar, rótulos). A cor não é escolhida: vem do pet. */
export const COR_ESPECIE: Record<Especie, string> = {
  xicara: '#1fbf5f', caderninho: '#2f7bf5', laptopinho: '#9aa0a6', plantinha: '#2f9e44', lampada: '#ffd60a',
  coracao: '#ff3d8b', globinho: '#2f7bf5', estrelinha: '#ffd60a', conezinho: '#ff4d3d', nuvem: '#3d8bff',
}
export const NOMES_ACESSORIO: Record<Acessorio, string> = {
  nenhum: 'Nada', oculos: 'Óculos', boina: 'Boina',
}

export const PROLOGO =
  'Oi, eu sou {pet}. Nasci agora, no meio do DevDay, onde todo mundo já tem turma, ideia e café. ' +
  'Até o fim do evento a gente precisa montar um time, e eu não conheço ninguém, então você vai me apresentar.'

export interface Capitulo {
  titulo: string
  objetivo: string
  abertura: string
  encontro: string
  pergunta: string
  ampla: { opcao: string; consequencia: string }
  profunda: { opcao: string; consequencia: string }
}

export const CAPITULOS: Capitulo[] = [
  {
    titulo: 'Novas pessoas',
    objetivo: 'Conheça alguém de outra área',
    abertura: 'Primeira missão: achar alguém de uma área diferente da sua. Se você é de front, procura alguém de dados ou de design. Mostra meu código por aí.',
    encontro: '{amigo}, o pet de {dono_amigo}, apareceu e me olhou de cima a baixo. Acho que passei no teste.',
    pergunta: 'Como a gente puxa essa conversa?',
    ampla: {
      opcao: 'Papo rápido e segue em frente',
      consequencia: 'Vocês trocaram nomes, uma piada sobre o Wi-Fi e cada um foi para um lado. {amigo} acenou de longe. Será que vai lembrar do meu nome?',
    },
    profunda: {
      opcao: 'Perguntar algo pessoal e ouvir',
      consequencia: 'Você perguntou qual foi o pior bug da vida de {dono_amigo}. Virou dez minutos de história, com servidor caindo em plena Black Friday e deploy às 3 da manhã. Eu ouvi tudo sem piscar.',
    },
  },
  {
    titulo: 'Troca de ajuda',
    objetivo: 'Encontre quem pode te ajudar',
    abertura: 'Você disse que hoje procura ajuda com {procura}. Farejei o evento e separei três pessoas que oferecem isso. Escolhe uma e vai lá.',
    encontro: '{amigo} chegou pulando na minha frente. {dono_amigo} entende de {oferta}. Sua vez.',
    pergunta: 'Como você chega?',
    ampla: {
      opcao: 'Pedir ajuda direto',
      consequencia: 'Você foi ao ponto e saiu com uma dica em dois minutos. Logo depois chamaram {dono_amigo} do outro lado da sala. A dica ficou anotada, mas eu não sei nada sobre a pessoa.',
    },
    profunda: {
      opcao: 'Oferecer ajuda primeiro',
      consequencia: 'Antes de pedir, você ofereceu ajuda com {minha_oferta}, o que travava o projeto de {dono_amigo}. Depois a pessoa respondeu a sua dúvida com calma. E {amigo} me deu metade do biscoito.',
    },
  },
  {
    titulo: 'Cultive conexões',
    objetivo: 'Ligue pessoas que combinam',
    abertura: 'Você já conhece algumas pessoas aqui. Agora quero que você ligue duas delas. Encontra alguém novo e repara se combina com quem a gente já conheceu.',
    encontro: 'Esse é {amigo}, de {dono_amigo}. Me lembrou {contato}, que a gente conheceu mais cedo: os dois falam do mesmo assunto.',
    pergunta: 'O que você faz com essa coincidência?',
    ampla: {
      opcao: 'Apresentar os dois',
      consequencia: 'Você apresentou {dono_amigo} a {dono_contato} e saiu de fininho. Quando olhei para trás, os dois rabiscavam um projeto num guardanapo. Ganhei mais um crachá pendurado.',
    },
    profunda: {
      opcao: 'Marcar um café para depois',
      consequencia: 'Vocês trocaram contato e marcaram um café para a próxima terça. {dono_amigo} já mandou o endereço. Ganhei uma xícara de presente.',
    },
  },
  {
    titulo: 'Palco DevDay',
    objetivo: 'Reencontre alguém antes das apresentações finais',
    abertura: 'Faltam poucos minutos para as apresentações finais. Última missão: encontrar de novo alguém que você já conheceu hoje. Digita o código de um contato de novo.',
    encontro: '{amigo} voltou! Faz duas horas, mas para mim pareceu uma semana.',
    pergunta: 'O que a gente faz com o tempo que sobrou?',
    ampla: {
      opcao: 'Pedir para conhecer mais gente',
      consequencia: '{dono_amigo} te levou até uma roda de seis pessoas e apresentou uma por uma. Eu decorei três nomes e perdi o resto. Minha cabeça está girando.',
    },
    profunda: {
      opcao: 'Ficar e torcer pela apresentação',
      consequencia: 'Você sentou na primeira fila da apresentação de {dono_amigo} e aplaudiu quando o slide travou. No fim, a primeira pessoa que {dono_amigo} procurou foi você. Agora eu sei a quem pedir ajuda amanhã.',
    },
  },
]

export const FINAIS: Record<Final, { titulo: string; texto: string }> = {
  time: {
    titulo: 'Time dos Sonhos',
    texto: 'Chegou o fim do evento e {lista_amigos} vieram comigo. Cada um trabalha numa área, e com alguns você foi além do oi. Esse é o time que você montou hoje.',
  },
  colecionador: {
    titulo: 'Colecionador de Crachás',
    texto: 'Olha quanta gente: {n} crachás pendurados em mim. Na hora de montar o time no fim do evento, ninguém lembrou do meu nome. Da próxima vez, fica um pouco mais em cada conversa?',
  },
  amigo: {
    titulo: 'Amigo de Um Só',
    texto: 'Eu e {contato} num banquinho, dividindo o último café. A conversa foi ótima e foi a única do dia, com um salão cheio de gente que eu não conheci. Da próxima vez, arrisca mais um oi?',
  },
}

export const preencher = (texto: string, vars: Record<string, string | number>) =>
  texto.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m))
