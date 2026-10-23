// Motor da Academia (desafio nº 4): funções puras. Regras em docs/QUEBRA-GELO.md, seção 3B.
// Textos: docs/ACADEMIA.md (banco próprio). Mudou lá, muda aqui.
// Separada da Aventura: nada aqui mexe em Alcance, Profundidade ou nas decisões dos capítulos.

export type Habilidade = 'abordar' | 'escutar' | 'conectar'

/** Ordem fixa, usada também para desempate da trilha. */
export const HABILIDADES: Habilidade[] = ['abordar', 'escutar', 'conectar']

export const NOMES_HABILIDADE: Record<Habilidade, string> = {
  abordar: 'Abordar', escutar: 'Escutar', conectar: 'Conectar',
}

/** Capítulo da Aventura que treina cada habilidade (Conectar também aparece no 4). */
export const CAPITULO_SUGERIDO: Record<Habilidade, number> = { abordar: 1, escutar: 2, conectar: 3 }

export interface Questao {
  id: string
  habilidade: Habilidade
  situacao: string
  opcoes: string[]
  correta: number
  explicacao: string
}

// 2 Abordar · 1 Escutar · 2 Conectar (justificativa em docs/ACADEMIA.md)
export const DIAGNOSTICO: Questao[] = [
  {
    id: 'diag-abordar-1', habilidade: 'abordar',
    situacao: 'Você chega e vê 3 pessoas conversando em roda. O que faz?',
    opcoes: ['Espera alguém olhar para você', 'Se aproxima e pergunta "posso entrar?"', 'Vai pegar café e desiste'],
    correta: 1,
    explicacao: 'Pedir licença abre espaço sem interromper ninguém. Esperar ser notado pode levar o coffee break inteiro.',
  },
  {
    id: 'diag-escutar-1', habilidade: 'escutar',
    situacao: 'Alguém conta que está migrando o time de REST para GraphQL. Você:',
    opcoes: ['Conta como foi a sua migração, que deu muito certo', 'Diz que GraphQL é modinha', 'Pergunta o que fez o time decidir pela troca'],
    correta: 2,
    explicacao: 'Perguntar o porquê mostra interesse de verdade e faz a pessoa contar a parte boa da história. Falar de você logo de cara rouba a vez dela.',
  },
  {
    id: 'diag-conectar-1', habilidade: 'conectar',
    situacao: 'Você está conversando com a Ana quando o Léo, que você conheceu de manhã, chega perto. Você:',
    opcoes: ['Apresenta um ao outro dizendo o que cada um faz', 'Continua o papo com a Ana e espera o Léo ir embora', 'Pede licença à Ana e vai falar com o Léo'],
    correta: 0,
    explicacao: 'Apresentar os dois transforma duas conversas em uma rede. Dizer o que cada um faz dá aos dois um assunto para começar.',
  },
  {
    id: 'diag-abordar-2', habilidade: 'abordar',
    situacao: 'Na fila do café, a pessoa da frente está com a camiseta de um framework que você usa. Você:',
    opcoes: ['Fica quieto: fila não é lugar de conversa', 'Vira o crachá dela para ler o nome', 'Comenta da camiseta e pergunta o que ela está achando do framework'],
    correta: 2,
    explicacao: 'Um detalhe em comum é o gancho mais fácil que existe. Fila é ótimo lugar para puxar assunto: todo mundo está parado e sem pressa.',
  },
  {
    id: 'diag-conectar-2', habilidade: 'conectar',
    situacao: 'No fim do dia, você trocou contato com alguém com quem o papo rendeu muito. O que faz?',
    opcoes: ['Espera a pessoa chamar primeiro', 'Manda mensagem no dia seguinte lembrando do papo e sugerindo um próximo passo', 'Adiciona no LinkedIn sem escrever nada'],
    correta: 1,
    explicacao: 'O contato só vira conexão quando alguém dá o próximo passo. Lembrar do assunto na mensagem ajuda a pessoa a saber quem você é no meio de tantos convites.',
  },
]

export const ATIVIDADES: Record<Habilidade, Questao[]> = {
  abordar: [
    {
      id: 'abordar-1', habilidade: 'abordar',
      situacao: 'O coffee break começou e você não conhece ninguém. Qual abertura funciona melhor?',
      opcoes: ['"E aí, o que você achou da última palestra?"', '"Oi, você trabalha onde?" e já mostra seu LinkedIn', 'Fica no celular até alguém falar com você'],
      correta: 0,
      explicacao: 'Comentar algo que vocês acabaram de viver juntos é o jeito mais leve de começar. Ninguém precisa se apresentar formalmente para responder.',
    },
    {
      id: 'abordar-2', habilidade: 'abordar',
      situacao: 'Você quer falar com uma palestrante, mas ela está cercada de gente depois da palestra. Você:',
      opcoes: ['Desiste: ela está ocupada demais', 'Fura a roda e faz sua pergunta de uma vez', 'Espera a roda diminuir e chega com uma pergunta específica sobre a palestra'],
      correta: 2,
      explicacao: 'Paciência e uma pergunta específica mostram que você prestou atenção. Palestrante adora quem lembra de um detalhe do que ela falou.',
    },
    {
      id: 'abordar-3', habilidade: 'abordar',
      situacao: 'Você puxou conversa e a pessoa respondeu curto, olhando para o celular. Você:',
      opcoes: ['Insiste com mais três perguntas seguidas', 'Agradece, deseja um bom evento e segue para outra pessoa', 'Fica parado ao lado esperando ela terminar'],
      correta: 1,
      explicacao: 'Nem toda abordagem engata, e tudo bem. Sair com gentileza deixa a porta aberta para outro momento.',
    },
  ],
  escutar: [
    {
      id: 'escutar-1', habilidade: 'escutar',
      situacao: 'A pessoa conta que acabou de sair de um emprego e está procurando algo novo. Você:',
      opcoes: ['Muda de assunto para não ficar chato', 'Pergunta que tipo de trabalho ela quer encontrar agora', 'Fala do seu emprego e de como você gosta dele'],
      correta: 1,
      explicacao: 'Perguntar o que ela procura mostra que você ouviu e ainda abre a chance de ajudar. Fugir do assunto passa a ideia de que ele incomoda.',
    },
    {
      id: 'escutar-2', habilidade: 'escutar',
      situacao: 'No meio da conversa, você lembra de uma história ótima sua sobre o mesmo assunto. Você:',
      opcoes: ['Espera a pessoa terminar e faz uma pergunta antes de contar a sua', 'Interrompe para contar antes que esqueça', 'Guarda a história e não fala mais nada'],
      correta: 0,
      explicacao: 'Deixar a pessoa terminar mostra que a vez dela importa. Depois disso, sua história entra como troca, e não como disputa.',
    },
    {
      id: 'escutar-3', habilidade: 'escutar',
      situacao: 'Alguém explica um projeto usando um termo que você não conhece. Você:',
      opcoes: ['Balança a cabeça fingindo que entendeu', 'Pesquisa no celular enquanto a pessoa fala', 'Pergunta o que o termo significa'],
      correta: 2,
      explicacao: 'Perguntar não é sinal de fraqueza: é sinal de que você está ouvindo. E quase todo mundo gosta de explicar o próprio projeto.',
    },
  ],
  conectar: [
    {
      id: 'conectar-1', habilidade: 'conectar',
      situacao: 'Você conheceu alguém que procura designer, e você conhece uma. O que faz?',
      opcoes: ['Passa o contato da designer depois, por mensagem', 'Chama a designer e apresenta os dois na hora', 'Comenta que conhece alguém, mas não lembra o nome'],
      correta: 1,
      explicacao: 'Apresentar os dois na hora vale mais que passar o contato depois: a conversa já começa com contexto.',
    },
    {
      id: 'conectar-2', habilidade: 'conectar',
      situacao: 'Você vai apresentar duas pessoas. Qual frase ajuda mais?',
      opcoes: ['"Bia, o Rafa está montando um app de saúde. Rafa, a Bia desenhou um app parecido no ano passado."', '"Bia, esse é o Rafa."', '"Vocês dois deviam conversar, hein."'],
      correta: 0,
      explicacao: 'Uma boa apresentação diz por que os dois deviam se falar. Só o nome deixa o resto do trabalho para eles.',
    },
    {
      id: 'conectar-3', habilidade: 'conectar',
      situacao: 'Você prometeu mandar um artigo para alguém que conheceu no evento. Você:',
      opcoes: ['Manda quando lembrar, talvez semana que vem', 'Não manda: a pessoa já deve ter esquecido', 'Manda no mesmo dia, com uma linha lembrando a conversa'],
      correta: 2,
      explicacao: 'Cumprir uma promessa pequena rápido é o follow-up mais forte que existe. A linha sobre a conversa ajuda a pessoa a lembrar de você.',
    },
  ],
}

export interface Academia {
  diagnostico: number[] | null // opção escolhida em cada questão do DIAGNOSTICO; null = ainda não fez
  acertos: Record<Habilidade, number> // acertos no diagnóstico
  trilha: Habilidade[] // mais fraca primeiro; vazia antes do diagnóstico
  feitas: Record<string, boolean> // id da atividade → acertou
}

const zerado = (): Record<Habilidade, number> => ({ abordar: 0, escutar: 0, conectar: 0 })

export const novaAcademia = (): Academia => ({ diagnostico: null, acertos: zerado(), trilha: [], feitas: {} })

const opcaoValida = (q: Questao, op: number) => Number.isInteger(op) && op >= 0 && op < q.opcoes.length

/** Pontua o diagnóstico e monta a trilha pela proporção de acertos (empate: ordem de HABILIDADES). */
export function responderDiagnostico(a: Academia, respostas: number[]): Academia {
  if (a.diagnostico) throw new Error('diagnóstico já feito')
  if (respostas.length !== DIAGNOSTICO.length || !DIAGNOSTICO.every((q, i) => opcaoValida(q, respostas[i])))
    throw new Error(`esperava ${DIAGNOSTICO.length} respostas válidas`)
  const acertos = zerado()
  const total = zerado()
  DIAGNOSTICO.forEach((q, i) => {
    total[q.habilidade]++
    if (respostas[i] === q.correta) acertos[q.habilidade]++
  })
  const proporcao = (h: Habilidade) => acertos[h] / total[h]
  // sort é estável: no empate fica a ordem fixa
  const trilha = [...HABILIDADES].sort((x, y) => proporcao(x) - proporcao(y))
  return { ...a, diagnostico: [...respostas], acertos, trilha }
}

export const proximaAtividade = (a: Academia): Questao | null =>
  a.trilha.flatMap((h) => ATIVIDADES[h]).find((q) => !(q.id in a.feitas)) ?? null

export function responderAtividade(a: Academia, id: string, opcao: number): { academia: Academia; acertou: boolean; explicacao: string } {
  if (!a.diagnostico) throw new Error('faça o diagnóstico antes das atividades')
  const q = HABILIDADES.flatMap((h) => ATIVIDADES[h]).find((x) => x.id === id)
  if (!q) throw new Error(`atividade desconhecida: ${id}`)
  if (!opcaoValida(q, opcao)) throw new Error(`opção inválida: ${opcao}`)
  const acertou = opcao === q.correta
  return { academia: { ...a, feitas: { ...a.feitas, [id]: acertou } }, acertou, explicacao: q.explicacao }
}

export function progresso(a: Academia): Record<Habilidade, { feitas: number; total: number }> {
  const r = {} as Record<Habilidade, { feitas: number; total: number }>
  for (const h of HABILIDADES)
    r[h] = { feitas: ATIVIDADES[h].filter((q) => q.id in a.feitas).length, total: ATIVIDADES[h].length }
  return r
}

export const habilidadeFraca = (a: Academia): Habilidade | null => a.trilha[0] ?? null
