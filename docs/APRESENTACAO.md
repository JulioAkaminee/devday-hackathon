# Quebra-Gelo — apresentação interna

Deck para vocês dois se alinharem antes de gravar e de subir no palco. Cada slide tem **o que dizer** e
**o que mostrar na tela**. Não é o roteiro do vídeo (`docs/ENTREGA.md`) — é o do pitch e do alinhamento.

O resumo de tudo, se sobrar 30 segundos:

> Num evento cheio de gente, quem chega sozinho não puxa conversa e ninguém lembra de ninguém depois. O
> Quebra-Gelo transforma isso num jogo: o pet só avança quando você encontra uma pessoa de verdade, e o
> jeito de conduzir a conversa decide o final. No fim do dia, o evento inteiro pode ver e medir o
> networking que ele vendeu.

---

## 1 · Capa

**Dizer:** "Quebra-Gelo. Seu pet só avança quando você conversa com alguém de verdade."

**Mostrar:** `docs/entrega/capa.png` — a arte com os quatro pets, os dois desafios e a trilha.

## 2 · O problema

**Dizer:** "Num evento, a maioria conversa só com quem já conhece. Quem chegou sozinho fica no canto,
quem puxa assunto para no 'oi, tudo bem', e às 18h ninguém lembra com quem falou. O networking que o
evento vende acontece por acaso — e não deixa rastro nenhum."

**Mostrar:** nada, ou uma foto da sala no começo do dia.

**A frase para guardar:** o evento promete conexão e entrega sorte.

## 3 · A virada

**Dizer:** "A gente não colocou mais um app de networking. A gente tirou o atalho: o jogo não anda sem
outra pessoa. Se você não for falar com alguém, o seu pet fica parado na primeira missão."

**Por que isso importa:** todo app de evento falha porque o incentivo é fraco — perfil, chat, feed. Aqui
o incentivo é o próprio progresso da história, que é individual e imediato.

## 4 · A solução em uma frase

**Dizer:** "Cada pessoa monta um pet, e o pet só cresce quando ela encontra outra pessoa de verdade. O
encontro vira um capítulo da história — e como ela conduz a conversa decide o final."

**Mostrar:** a home em `https://quebra-gelo.julioakamine.com` — promessa, os passos e a faixa ao vivo.

## 5 · O ciclo, em quatro passos

**Dizer:** "Quatro passos: monte o pet em cinco telas curtas; encontre alguém mostrando o seu código ou
o QR; escolha entre papo rápido e conversa funda; chegue a um final e leve a lista de quem você
conheceu."

**Mostrar:** o cartão da Missão 1 — **SEU CÓDIGO**, o QR e o campo "Código da outra pessoa".

**Detalhe que impressiona:** o encontro é **mútuo**. Quem foi encontrado acorda na mesma missão, com o
aviso "X te encontrou!". Não existe jogar sozinho.

## 6 · A Aventura (desafio 10)

**Dizer:** "São quatro missões — **Novas pessoas**, **Troca de ajuda**, **Cultive conexões** e **Palco
DevDay** — cada uma com uma decisão e duas barras no topo. Papo rápido soma **Alcance**; ir a fundo
soma **Profundidade**. O progresso fica salvo no servidor, capítulo por capítulo."

| Final | Como se chega |
|---|---|
| **Time dos Sonhos** | Alcance **e** Profundidade ≥ 4 — conversou muito e conversou fundo |
| **Colecionador de Crachás** | Alcance maior que Profundidade — só papo rápido |
| **Amigo de Um Só** | Profundidade maior que Alcance — só conversa funda |

**Mostrar:** o final com o bloco **"O que você leva"**, depois "Tente o outro caminho" e o segundo final.

## 7 · A Academia (desafio 4)

**Dizer:** "A Academia treina o que falta. Cinco perguntas medem **abordar**, **escutar** e **conectar**,
e a trilha começa pela habilidade mais fraca, com três atividades em cada uma — nove no total, todas com
explicação. E ela indica qual missão põe aquela habilidade em prática."

**Mostrar:** a aba Academia com o ponto verde, as 5 perguntas e a trilha montada.

**Detalhe:** a Academia é opcional de propósito — fica na aba dela e não altera Alcance nem
Profundidade. A aventura não depende dela para funcionar.

## 8 · Por que ninguém burla

**Dizer:** "Como o jogo depende de gente, a gente protegeu as regras: o encontro vale para os dois; nas
Missões 1 a 3 quem você já conhece não conta de novo; a Missão 4 pede o contrário, reencontrar alguém;
e há cinco segundos entre encontros, com bloqueio de dez minutos depois de vinte códigos errados."

**Por que citar:** mostra que o produto pensa em comportamento real de evento — farmar código é
exatamente o que alguém tentaria fazer numa demo.

## 9 · Os dois desafios, pedido por pedido

| Desafio | O que pedia | Onde está |
|---|---|---|
| **nº 10 · Aventura** | história interativa, duas características, progresso salvo, dois caminhos com finais diferentes | 4 missões com uma decisão cada; Alcance e Profundidade; progresso no servidor com retomada por capítulo; 3 finais e o "Tente o outro caminho" para provar o segundo |
| **nº 4 · Trilha de estudo** | 5 questões diagnósticas, trilha pelos resultados, atividades com explicação, progresso | 5 perguntas, trilha pela mais fraca, 9 atividades com explicação, progresso por habilidade e a missão que treina cada uma |

**Dizer:** "A trilha do evento é **Educação e inclusão**: a Academia ensina as três habilidades e a
Aventura obriga a praticar com gente de verdade na mesma hora."

## 10 · O que está de pé (números para citar de cabeça)

**Dizer:** "Está no ar, com HTTPS: `quebra-gelo.julioakamine.com`. Quinze testes passando, tipagem limpa,
deploy automático a cada push. Dez pets voxel desenhados do zero. E o telão do evento mostra, ao vivo,
quantas pessoas têm pet, quantos encontros aconteceram e quem mais conectou."

**Mostrar:** `/tela` — QR grande, os contadores e o ranking.

**Se perguntarem por IA:** "o núcleo roda sem IA, de propósito: a história é autoral e as sugestões são
regra pura, então funciona com a rede do evento ruim."

## 11 · Como está feito

**Dizer:** "TypeScript em tudo: Vite e Three.js no cliente, Express no servidor. O motor do jogo é uma
função pura — estado entra, estado sai — sem DOM, rede ou relógio. É por isso que a gente consegue testar
regra de jogo sem abrir navegador: é o que garante os 3 finais e as duas trilhas nos testes."

**Mostrar:** `src/shared/engine.ts` e `src/shared/engine.test.ts` lado a lado, 20 segundos.

## 12 · O que a gente decidiu não fazer

- **Sem foto e sem geração de imagem.** O pet é montado em cinco telas: sem upload, sem espera, sem
  constrangimento de escolher foto no meio do evento.
- **Sem cadastro longo.** O perfil é o mínimo para sugerir com quem conversar.
- **Sem IA no núcleo.** O jogo não depende de chave, crédito ou latência.
- **Sem ranking de popularidade.** O telão mostra conexões, não pessoas famosas.

**Dizer:** "Cada corte foi para o jogo funcionar na hora, no celular, com a internet do lugar."

## 13 · Para onde isso vai

**Dizer:** "Hoje é o DevDay. O formato serve para qualquer evento que vende networking: a organização
passa a medir o que aconteceu na sala, e a pessoa sai com a lista de quem conheceu — não com um badge a
mais. O próximo passo é a IA opcional: gerar a pergunta quebra-gelo a partir do par de perfis e escrever
o epílogo com as escolhas da pessoa."

## 14 · As perguntas que a banca vai fazer

| Pergunta | Resposta curta |
|---|---|
| "Isso não é gamificação forçada?" | o jogo não pede nada além da conversa que o evento já promete; ele só dá um motivo e um registro |
| "Como vocês provam que houve conversa?" | não provamos a conversa, provamos o **encontro**: código trocado dos dois lados, com travas e registro |
| "Por que ninguém vai só trocar código?" | Missões 1 a 3 exigem gente nova, a 4 exige reencontro, e há 5 s entre encontros com bloqueio por erro |
| "E quem não tem celular ou câmera?" | o código de 4 letras faz o mesmo caminho sem câmera; o layout é o mesmo no computador |
| "Qual é o modelo de negócio?" | evento paga por engajamento medido; a pessoa leva a lista de contatos |
| "Onde entra IA?" | hoje não entra, e isso é decisão; o plano é pergunta quebra-gelo e epílogo, com plano B estático |

## 15 · Quem explica o quê

| Bloco | Quem | Tempo |
|---|---|---|
| Problema, solução e objetivo | Julio | 40 s |
| Demo: criação, encontro, escolha | Miguel | 60 s |
| Academia e os dois desafios | Julio | 40 s |
| Arquitetura e o que está testado | Miguel | 30 s |
| Fechamento e próximos passos | Julio | 30 s |

**Regra do pitch:** a demo vem antes da arquitetura. Se algo quebrar na frente da banca, a frase de
reserva é: "o jogo só anda com gente real — então, para a demo, a gente trouxe os pets de exemplo do
`/demo`, que fazem o mesmo caminho". O `/demo` funciona mesmo sem ninguém no evento.
