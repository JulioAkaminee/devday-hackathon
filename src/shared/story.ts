// Textos da aventura. Fonte: docs/HISTORIA.md (rascunho v1). Mudou lá, muda aqui.
import type { Final } from './engine.ts'

export const ESPECIES = ['gato', 'cachorro', 'coruja', 'dragao', 'slime', 'robo'] as const
export const ACESSORIOS = ['nenhum', 'chapeu', 'laco', 'oculos'] as const
export const CORES = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#38d9a9', '#4dabf7', '#9775fa', '#f783ac'] as const
export const TEMAS = ['front', 'back', 'mobile', 'dados', 'design', 'produto', 'carreira'] as const

export type Especie = (typeof ESPECIES)[number]
export type Acessorio = (typeof ACESSORIOS)[number]
export type Tema = (typeof TEMAS)[number]

export const NOMES_ESPECIE: Record<Especie, string> = {
  gato: 'Gato', cachorro: 'Cachorro', coruja: 'Coruja', dragao: 'Dragão', slime: 'Slime', robo: 'Robô',
}
export const NOMES_ACESSORIO: Record<Acessorio, string> = {
  nenhum: 'Nada', chapeu: 'Cartola', laco: 'Laço', oculos: 'Óculos',
}

export const PROLOGO =
  'Oi! Eu sou {pet}. Acabei de nascer no meio de um hackathon e todo mundo aqui já tem time, ideia e café. Eu só tenho você. ' +
  'Até o pitch, a gente precisa montar o time da jornada final. Problema: eu não conheço ninguém. Solução: você vai me apresentar.'

export interface Capitulo {
  titulo: string
  local: string
  abertura: string
  encontro: string
  pergunta: string
  ampla: { opcao: string; consequencia: string }
  profunda: { opcao: string; consequencia: string }
}

export const CAPITULOS: Capitulo[] = [
  {
    titulo: 'Gente de outro planeta',
    local: 'Mesas do hackathon',
    abertura: 'Primeira missão: achar alguém que trabalha com algo bem diferente de você. Gente diferente é onde moram as ideias boas. Mostra meu código por aí.',
    encontro: '{amigo}, o pet de {dono_amigo}, apareceu! Ele me olhou desconfiado. Acho que gostou de mim.',
    pergunta: 'Como a gente conduz essa conversa?',
    ampla: {
      opcao: 'Papo rápido e segue em frente',
      consequencia: 'Vocês trocaram nomes, uma piada sobre o Wi-Fi e cada um foi para um lado. {amigo} acenou de longe. Acho que ele vai lembrar do meu nome… talvez.',
    },
    profunda: {
      opcao: 'Fazer a pergunta-desafio',
      consequencia: 'Você perguntou qual foi o pior bug da vida de {dono_amigo}. Virou uma história de 10 minutos com servidor caindo em plena Black Friday. Saí daqui sabendo coisas que nem estão no LinkedIn.',
    },
  },
  {
    titulo: 'Quem tem o que falta',
    local: 'Balcão de mentoria',
    abertura: 'Você disse que hoje procura ajuda com {procura}. Farejei por aí e achei gente que oferece exatamente isso. Escolhe uma e vai lá.',
    encontro: '{amigo} chegou abanando o rabo. {dono_amigo} entende de {oferta}. É agora.',
    pergunta: 'Como você chega?',
    ampla: {
      opcao: 'Pedir ajuda direto',
      consequencia: 'Você foi direto ao ponto e saiu com uma dica valiosa em dois minutos. {dono_amigo} já estava sendo chamado por outra pessoa. Eficiente! Mas fiquei com a sensação de que dava para ir além.',
    },
    profunda: {
      opcao: 'Oferecer ajuda primeiro',
      consequencia: 'Antes de pedir qualquer coisa, você ofereceu ajuda com {minha_oferta}. Era exatamente o que estava travando o projeto de {dono_amigo}. A ajuda voltou em dobro, e {amigo} me deu metade do biscoito dele.',
    },
  },
  {
    titulo: 'A ponte',
    local: 'Ilhas de mesas',
    abertura: 'Você já conhece gente. Agora vem a parte que quase ninguém faz: ligar pessoas. Encontra alguém novo e repara se ele combina com quem a gente já conheceu.',
    encontro: 'Esse é {amigo}, de {dono_amigo}. E olha só: tem tudo a ver com {contato}, que a gente conheceu antes.',
    pergunta: 'O que você faz com essa coincidência?',
    ampla: {
      opcao: 'Apresentar {dono_amigo} a {dono_contato}',
      consequencia: 'Você juntou os dois e saiu de fininho. Eles já estão falando em montar alguma coisa juntos. Virei ponte! Ganhei mais um crachá pendurado.',
    },
    profunda: {
      opcao: 'Marcar um café com {dono_amigo} depois do evento',
      consequencia: 'Vocês trocaram contato e marcaram um café na semana que vem. Sem pressa: essa conversa vai continuar. Ganhei uma xícara de presente.',
    },
  },
  {
    titulo: 'Antes do pitch',
    local: 'Auditório',
    abertura: 'O pitch está chegando. Última missão: reencontrar alguém que a gente já conheceu hoje. Digita o código de um contato de novo.',
    encontro: '{amigo} voltou! Parece que faz uma eternidade.',
    pergunta: 'Como gastar o último tempo?',
    ampla: {
      opcao: 'Pedir para {dono_amigo} te apresentar mais gente',
      consequencia: '{dono_amigo} te puxou para uma roda nova. Mais nomes, mais crachás, mais apertos de mão. Minha cabeça está girando.',
    },
    profunda: {
      opcao: 'Ficar e torcer pelo pitch de {dono_amigo}',
      consequencia: 'Você sentou na primeira fila e gritou quando o slide travou. {dono_amigo} olhou para você e sorriu. Tem gente que coleciona contatos. Você ganhou um aliado.',
    },
  },
]

export const FINAIS: Record<Final, { titulo: string; texto: string }> = {
  time: {
    titulo: 'Time dos Sonhos',
    texto: 'Chegou a hora da jornada final e eu não estou sozinho: {lista_amigos} vieram comigo. Gente diferente, conversas de verdade, conexões que vão durar mais que o evento. A gente é o Time dos Sonhos.',
  },
  colecionador: {
    titulo: 'Colecionador de Crachás',
    texto: 'Olha quanta gente! {n} crachás pendurados em mim. Eu conheço todo mundo… mas, quando chamei para a jornada final, ninguém lembrou do meu nome. Da próxima vez, que tal ficar um pouco mais em cada conversa?',
  },
  amigo: {
    titulo: 'Amigo de Um Só',
    texto: 'Eu e {contato} num banquinho, dividindo o último café. Foi uma conversa incrível. Só uma. Lá fora tinha um evento inteiro de gente que eu nunca vou conhecer. Da próxima vez, que tal arriscar mais um oi?',
  },
}

export const preencher = (texto: string, vars: Record<string, string | number>) =>
  texto.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m))
