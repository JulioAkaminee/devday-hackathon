# Academia — banco de questões (desafio nº 4)

> **Banco de questões próprio.** O desafio diz que a organização fornece as questões; como não forneceu,
> escrevemos o nosso. Regras da Academia em `docs/QUEBRA-GELO.md`, seção 3B. O texto daqui é copiado em
> `src/shared/academia.ts`: mudou aqui, muda lá.

Assunto: **networking em eventos**. Três habilidades:

| Habilidade | O que é | Capítulo sugerido |
|---|---|---|
| **Abordar** | puxar conversa | 1 |
| **Escutar** | aprofundar | 2 |
| **Conectar** | apresentar pessoas, manter o contato depois | 3 |

## Distribuição do diagnóstico: 2 Abordar · 1 Escutar · 2 Conectar

Conectar junta dois comportamentos diferentes (apresentar pessoas e manter o contato depois) e treina dois
capítulos da Aventura (3 e 4), então ganha duas perguntas, uma para cada lado. Abordar é a porta de
entrada do evento e o exemplo oficial da seção 3B, então também tem duas. Escutar fica com uma: é a
habilidade mais parecida com o que a Aventura já mede em Profundidade.

Com 1 ou 2 perguntas por habilidade, a trilha compara a **proporção** de acertos (0, 50% ou 100%), não o
número bruto. Empate segue a ordem fixa Abordar → Escutar → Conectar.

Formato de cada item: situação, 3 opções (a/b/c), a correta marcada com ✅ e a explicação do pet.

---

## 1. Diagnóstico (credenciamento, pet-recepcionista)

### `diag-abordar-1` · Abordar
Você chega e vê 3 pessoas conversando em roda. O que faz?
- (a) Espera alguém olhar para você
- (b) Se aproxima e pergunta "posso entrar?" ✅
- (c) Vai pegar café e desiste

**Explicação:** Pedir licença abre espaço sem interromper ninguém. Esperar ser notado pode levar o
intervalo inteiro.

### `diag-escutar-1` · Escutar
Alguém conta que mudou de área depois de dez anos no mesmo emprego. Você:
- (a) Conta como foi a sua mudança, que deu muito certo
- (b) Diz que mudar de área a essa altura é arriscado
- (c) Pergunta o que fez a pessoa decidir pela troca ✅

**Explicação:** Perguntar o porquê mostra interesse de verdade e faz a pessoa contar a parte boa da
história. Falar de você logo de cara rouba a vez dela.

### `diag-conectar-1` · Conectar
Você está conversando com a Ana quando o Léo, que você conheceu de manhã, chega perto. Você:
- (a) Apresenta um ao outro dizendo o que cada um faz ✅
- (b) Continua o papo com a Ana e espera o Léo ir embora
- (c) Pede licença à Ana e vai falar com o Léo

**Explicação:** Apresentar os dois transforma duas conversas em uma rede. Dizer o que cada um faz dá aos
dois um assunto para começar.

### `diag-abordar-2` · Abordar
Na fila do credenciamento, a pessoa da frente está com a camiseta de um show que você também foi. Você:
- (a) Fica quieto: fila não é lugar de conversa
- (b) Vira o crachá dela para ler o nome
- (c) Comenta da camiseta e pergunta o que ela achou do show ✅

**Explicação:** Um detalhe em comum é o gancho mais fácil que existe. Fila é ótimo lugar para puxar
assunto: todo mundo está parado e sem pressa.

### `diag-conectar-2` · Conectar
No fim do dia, você trocou contato com alguém com quem o papo rendeu muito. O que faz?
- (a) Espera a pessoa chamar primeiro
- (b) Manda mensagem no dia seguinte lembrando do papo e sugerindo um próximo passo ✅
- (c) Adiciona no LinkedIn sem escrever nada

**Explicação:** O contato só vira conexão quando alguém dá o próximo passo. Lembrar do assunto na
mensagem ajuda a pessoa a saber quem você é no meio de tantos convites.

---

## 2. Atividades (prédio da Academia, pet-instrutor)

### Abordar

#### `abordar-1`
O intervalo do café começou e você não conhece ninguém. Qual abertura funciona melhor?
- (a) "E aí, o que você achou da última palestra?" ✅
- (b) "Oi, você trabalha onde?" e já mostra seu LinkedIn
- (c) Fica no celular até alguém falar com você

**Explicação:** Comentar algo que vocês acabaram de viver juntos é o jeito mais leve de começar. Ninguém
precisa se apresentar formalmente para responder.

#### `abordar-2`
Você quer falar com uma palestrante, mas ela está cercada de gente depois da palestra. Você:
- (a) Desiste: ela está ocupada demais
- (b) Fura a roda e faz sua pergunta de uma vez
- (c) Espera a roda diminuir e chega com uma pergunta específica sobre a palestra ✅

**Explicação:** Paciência e uma pergunta específica mostram que você prestou atenção. Palestrante adora
quem lembra de um detalhe do que ela falou.

#### `abordar-3`
Você puxou conversa e a pessoa respondeu curto, olhando para o celular. Você:
- (a) Insiste com mais três perguntas seguidas
- (b) Agradece, deseja um bom evento e segue para outra pessoa ✅
- (c) Fica parado ao lado esperando ela terminar

**Explicação:** Nem toda abordagem engata, e tudo bem. Sair com gentileza deixa a porta aberta para
outro momento.

### Escutar

#### `escutar-1`
A pessoa conta que acabou de sair de um emprego e está procurando algo novo. Você:
- (a) Muda de assunto para não ficar chato
- (b) Pergunta que tipo de trabalho ela quer encontrar agora ✅
- (c) Fala do seu emprego e de como você gosta dele

**Explicação:** Perguntar o que ela procura mostra que você ouviu e ainda abre a chance de ajudar.
Fugir do assunto passa a ideia de que ele incomoda.

#### `escutar-2`
No meio da conversa, você lembra de uma história ótima sua sobre o mesmo assunto. Você:
- (a) Espera a pessoa terminar e faz uma pergunta antes de contar a sua ✅
- (b) Interrompe para contar antes que esqueça
- (c) Guarda a história e não fala mais nada

**Explicação:** Deixar a pessoa terminar mostra que a vez dela importa. Depois disso, sua história
entra como troca, e não como disputa.

#### `escutar-3`
Alguém explica um projeto usando um termo que você não conhece. Você:
- (a) Balança a cabeça fingindo que entendeu
- (b) Pesquisa no celular enquanto a pessoa fala
- (c) Pergunta o que o termo significa ✅

**Explicação:** Perguntar não é sinal de fraqueza: é sinal de que você está ouvindo. E quase todo mundo
gosta de explicar o próprio projeto.

### Conectar

#### `conectar-1`
Você conheceu alguém que procura designer, e você conhece uma. O que faz?
- (a) Passa o contato da designer depois, por mensagem
- (b) Chama a designer e apresenta os dois na hora ✅
- (c) Comenta que conhece alguém, mas não lembra o nome

**Explicação:** Apresentar os dois na hora vale mais que passar o contato depois: a conversa já começa
com contexto.

#### `conectar-2`
Você vai apresentar duas pessoas. Qual frase ajuda mais?
- (a) "Bia, o Rafa está montando um app de saúde. Rafa, a Bia desenhou um app parecido no ano passado." ✅
- (b) "Bia, esse é o Rafa."
- (c) "Vocês dois deviam conversar, hein."

**Explicação:** Uma boa apresentação diz por que os dois deviam se falar. Só o nome deixa o resto do
trabalho para eles.

#### `conectar-3`
Você prometeu mandar um artigo para alguém que conheceu no evento. Você:
- (a) Manda quando lembrar, talvez semana que vem
- (b) Não manda: a pessoa já deve ter esquecido
- (c) Manda no mesmo dia, com uma linha lembrando a conversa ✅

**Explicação:** Cumprir uma promessa pequena rápido é o melhor jeito de manter o contato. A linha sobre
a conversa ajuda a pessoa a lembrar de você.
