# Quebra-Gelo (nome provisório)

> **Ideia escolhida em 23/10/2026**, para o desafio nº 10, "Aventura com escolhas e consequências"
> (ver [`DESAFIOS.md`](DESAFIOS.md)). Ela substitui o plano de pets em AR de [`INSIGHTS.md`](INSIGHTS.md).
> Das regras técnicas de [`REGRAS.md`](REGRAS.md) continuam valendo OpenRouter, QR rotativo, limites
> por celular, snapshot e deploy. AR e o mundo com 150 pets em tempo real ficaram de fora.

---

## A ideia em uma frase

**Cada participante tem um pet cuja aventura é feita de conversas reais no evento. A IA sugere quem
ele deveria conhecer e por quê, e o pet puxa o assunto.**

O pet só avança quando o dono conhece gente de verdade, e é o pet que quebra o gelo por ele.

---

## Como a pessoa joga

### Entrada (30 segundos)
1. Escaneia o QR do telão e abre um site, sem baixar app.
2. Fotografa um **objeto** da mesa (caneca, garrafa, crachá…). A IA transforma o objeto num pet, com
   nome, cores e personalidade. Usamos objeto, e não rosto, porque é mais divertido e evita
   constrangimento e problemas com LGPD.
3. Responde três perguntas com um toque cada:
   - **Minha área:** front, back, mobile, dados, design, produto, outra.
   - **O que eu procuro hoje:** time, mentoria, emprego, contratar, aprender algo novo.
   - **O que eu ofereço:** uma ou duas áreas em que pode ajudar.
4. *(Opcional)* LinkedIn ou GitHub. Só aparece para quem virar amigo.

### A aventura: 4 missões
Para completar as missões 1 e 2, é preciso **escanear o QR do pet da outra pessoa**, e a amizade conta
para os dois.

| Missão | O que pede | Escolha ampla (+alcance) | Escolha profunda (+profundidade) |
|---|---|---|---|
| 1 | conhecer alguém **de uma área diferente** da sua | conversa rápida e segue em frente | faz a pergunta-desafio do pet e ouve a história |
| 2 | encontrar **quem oferece o que você procura** (a IA sugere 3 pessoas) | pede ajuda direto | oferece ajuda primeiro |
| 3 | o que fazer com quem você já conheceu | **apresenta duas pessoas** uma à outra | marca um café com um contato depois do evento |
| 4 | antes do pitch | dá uma volta pelas mesas e conhece mais gente | vai torcer pelo pitch de um contato |

### As duas características
- **Alcance:** quantas pessoas você conheceu.
- **Profundidade:** quanto as conversas foram de verdade.

O tempo é curto, e quase toda escolha obriga a decidir entre as duas.

### Os três finais
| Final | Quando | O que aparece |
|---|---|---|
| **Time dos Sonhos** | equilibrou as duas | o pet com o time reunido, cada membro sendo o pet de um contato real |
| **Colecionador de Crachás** | muito alcance, pouca profundidade | o pet afogado em crachás: "conheceu todo mundo, ninguém lembra dele" |
| **Amigo de Um Só** | muita profundidade, pouco alcance | o pet e um único amigo num banquinho: "uma conversa incrível, só uma" |

### Regra inicial dos finais (ajustável)
- Começa com Alcance 0 e Profundidade 0.
- Escolha ampla: **+2 Alcance**. Escolha profunda: **+2 Profundidade**.
- Cada amizade feita nas missões 1 e 2: **+1 Alcance**.
- No fim:
  - se **Alcance ≥ 4 e Profundidade ≥ 4** → Time dos Sonhos;
  - senão, se **Alcance > Profundidade** → Colecionador de Crachás;
  - senão → Amigo de Um Só.

Com as duas amizades e *k* escolhas profundas, o resultado fica assim:

| *k* | Alcance | Profundidade | Final |
|---|---|---|---|
| 0 | 10 | 0 | Colecionador |
| 1 | 8 | 2 | Colecionador |
| 2 | 6 | 4 | Time dos Sonhos |
| 3 | 4 | 6 | Time dos Sonhos |
| 4 | 2 | 8 | Amigo de Um Só |

Os três finais são alcançáveis. Um teste automatizado percorre todos os caminhos e garante isso a cada
mudança nas regras.

### Visual do pet
As barras mudam o pet:
- **Alcance alto:** crachás pendurados e um megafone.
- **Profundidade alta:** um coraçãozinho e a xícara de café na mão.
- **Equilíbrio:** uma capa de "conector".

Ele começa como **sprite 16×16** em 2D. Se der tempo, cada pixel vira um cubinho em 3D (Three.js).

---

## Onde a IA entra

| Momento | O que a IA faz | Se falhar ou demorar |
|---|---|---|
| Criação | foto → nome, espécie, cores e personalidade do pet (1 chamada) | o pet é montado no próprio celular com as cores da foto e um nome sorteado |
| Sugestão (missão 2) | as regras escolhem 3 pessoas pelos perfis; a IA escreve **por que** conhecer cada uma (1 chamada para as 3) | frase pronta: "Ana oferece produto, que é o que você procura" |
| Encontro | quando dois se escaneiam, os pets "conversam" na tela com uma pergunta para quebrar o gelo, feita a partir dos dois perfis (1 chamada) | uma pergunta tirada de um banco de perguntas por área |
| "Quem eu conheci" | uma linha resumindo cada contato | fica só a área e o que a pessoa oferece |

- Tudo pelo **OpenRouter**, com a configuração de `REGRAS.md`: modelo principal, reservas, JSON
  estruturado, fila e timeout.
- Estimativa para o dia: cerca de 800 chamadas, **menos de US$ 1** no total.
- **A IA nunca decide consequência.** Alcance, Profundidade e finais são regras fixas no código.

---

## O telão: mapa de conexões do DevDay

- Cada pet é um ponto e cada amizade é uma linha. A rede do evento vai se formando ao longo do dia.
- **Pontes** em destaque: pessoas que ligaram grupos que não se conheciam.
- Placar: pets criados, conexões, apresentações feitas e quantos chegaram a cada final.
- Feed: "Xícaro e Tampinha se conheceram: os dois odeiam CSS".

---

## O que cada pessoa leva para casa

A página **"Quem eu conheci"** traz:
- o pet e o nome de cada contato;
- a área dele e o que ele oferece;
- o LinkedIn ou GitHub, se a pessoa preencheu;
- uma linha sobre o que conversaram.

Ela serve de lembrete para o follow-up na segunda-feira.

---

## Pitch de 3 minutos

1. **Problema (30 s):** em evento, todo mundo fica com a própria turma e vai embora sem contatos de
   verdade. Quem organiza vende "networking" e não consegue medir.
2. **Demo (1 min 45 s):**
   - O telão mostra o **mapa de conexões real** do dia: "esse é o networking de hoje".
   - Duas pessoas da banca fotografam objetos, se escaneiam e **os pets quebram o gelo entre elas** ao
     vivo.
   - **Dois caminhos:** uma partida salva antes da missão 3 é retomada. Com escolhas amplas, ela chega
     ao Colecionador de Crachás. Voltando ao mesmo ponto com escolhas profundas, chega ao Time dos
     Sonhos. Isso prova o salvamento e as consequências.
3. **Por que agora (15 s):** a IA personaliza quem conhecer e o que perguntar por menos de
   US$ 0,001 por sugestão.
4. **O que vem depois (30 s):** produto para conferências, faculdades e comunidades, com um painel que
   mostra ao organizador quantas conexões o evento gerou.

---

## Como cumpre o desafio nº 10

| O desafio pede | Como cumprimos |
|---|---|
| História interativa | a aventura do pet em 4 missões ao longo do dia |
| Escolhas com consequências perceptíveis | amplo ou profundo muda as barras, o visual do pet e o final |
| Duas características do personagem | Alcance e Profundidade |
| Salvar o progresso para retomar | salvo no servidor a cada passo e retomado pelo link do pet |
| Dois caminhos com finais diferentes | demo com a mesma partida salva levando a dois finais |
| Até 5 decisões e 3 finais | 4 decisões e 3 finais |

---

## Arquitetura (enxuta)

- **Front:** Vite + TypeScript, com as páginas celular (`/`), telão (`/telao`), amizade (`/a/:codigo`)
  e admin (`/admin`). Sprite em canvas; voxels com Three.js como extra.
- **Servidor:** Node 22 + Express, **uma instância**. Escolhas e amizades vão por HTTP. O telão se
  atualiza a cada 2 s, por polling ou SSE. **Sem Socket.IO.**
- **Dados:** em memória, com snapshot JSON no volume a cada 5 s e ao receber `SIGTERM` (`REGRAS.md`,
  seção 6).
- **Identidade:** token aleatório no `localStorage`. O QR de amizade muda a cada 30 s
  (`REGRAS.md`, seção 6).
- **Limites por celular, nunca por IP**, porque no Wi-Fi do evento todo mundo sai pelo mesmo IP.
- **Foto:** `<input type="file" accept="image/*">`, reduzida para JPEG de 512 px no celular e nunca
  salva. Como esse seletor funciona sem HTTPS, o domínio não bloqueia o início, mas HTTPS continua
  recomendado.
- **Deploy:** Dokploy na VPS, com deploy automático a partir da `main`.

---

## Escopo

### Mínimo, até 13h30
- [ ] Entrada: foto → pet (com o fallback local) e as três perguntas
- [ ] QR de amizade rotativo, com amizade mútua
- [ ] As 4 missões com escolhas, barras, visual do pet e os 3 finais
- [ ] Teste dos caminhos garantindo os 3 finais
- [ ] Salvar e retomar pelo link
- [ ] Página "Quem eu conheci"
- [ ] Telão com placar e lista de pets

### Extras, até 15h (na ordem)
1. Sugestões da IA na missão 2, com o motivo
2. Pets quebrando o gelo no encontro
3. Mapa de conexões no telão, com as pontes
4. Apresentar duas pessoas, com aviso para as duas
5. Pet em voxels 3D

**Às 15h, corte de escopo:** o que não estiver funcionando sai.

---

## Privacidade

- A foto nunca é salva nem registrada em log.
- O perfil público mostra só o primeiro nome, a área, o que a pessoa procura e o que oferece.
- LinkedIn e GitHub são opcionais e só aparecem para quem virou amigo.
- O admin pode remover pets e nomes ofensivos.
- Os dados são apagados até 7 dias depois do evento.

---

## Pendências

- [ ] Confirmar com os organizadores que a ideia é aceita no desafio nº 10 e perguntar os critérios de julgamento
- [ ] Pedir para projetar o QR no almoço e nos intervalos
- [ ] Chave do OpenRouter com limite de crédito
- [ ] Subdomínio com HTTPS (recomendado)
- [ ] Atualizar `REGRAS.md` e a seção "Nosso projeto" do README para esta ideia
