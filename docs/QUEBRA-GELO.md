# Quebra-Gelo (nome provisório)

> **Desafio nº 10, "Aventura com escolhas e consequências"** (ver [`DESAFIOS.md`](DESAFIOS.md)).
> Substitui o plano de pets em AR de [`INSIGHTS.md`](INSIGHTS.md). Revisado em 23/10/2026 com as
> decisões D1–D4 (seção 1) e as regras oficiais do evento (seção 2).
> [`REGRAS.md`](REGRAS.md) ainda descreve o plano antigo: valem dele só QR rotativo, limites por
> celular, snapshot e deploy, até ser atualizado.

---

## A ideia em uma frase

**Uma aventura narrativa em que cada capítulo só avança quando você conversa com uma pessoa real do
evento, e os pets dessas pessoas viram personagens da sua história.**

**Regra principal do projeto: a interação é o motor da aventura.** Nenhuma decisão acontece sozinha;
toda escolha nasce de um encontro.

---

## 1. Decisões tomadas

| # | Decisão |
|---|---|
| D1 | O pet é **personalizado na hora, em uma tela, sem IA e sem foto**: espécie, cor, acessório e nome |
| D2 | A narrativa é reforçada: cada missão é um **capítulo com texto**, e a consequência é **contada na história**, não só mostrada na barra |
| D3 | A demo não depende do público: **a dupla do time basta**, com pets de exemplo e partida salva (seção 7) |
| D4 | O critério é **complexidade, não tempo**: trabalho dividido em módulos com contrato, tocados em paralelo por duas pessoas e vários agentes (seção 9) |

## 2. Regras oficiais do evento

Fonte: guia do participante (openaihackathon.com.br).

- Escolher **1** desafio: o **nº 10**.
- Entrega **até 16h** pelo formulário: **vídeo de até 3 min**, **repositório** e **projeto publicado
  numa URL acessível**.
- Critérios, **25% cada**: Funcional · Criatividade · Apresentação · Cumpre o objetivo do desafio.

---

## 3. Como a pessoa joga

### Entrada (até 20 s)
1. Escaneia o QR do telão e abre o site, sem baixar app.
2. **Monta o pet numa tela só** (D1): espécie (6 opções), cor (8), acessório (4) e nome (sugestão
   sorteada, editável). Prévia ao vivo do pet.
3. Responde três perguntas com um toque cada:
   - **Minha área:** front, back, mobile, dados, design, produto, outra.
   - **O que eu procuro hoje:** time, mentoria, emprego, contratar, aprender algo novo.
   - **O que eu ofereço:** uma ou duas áreas em que pode ajudar.
4. *(Opcional)* LinkedIn ou GitHub. Só aparece para quem virar amigo.

### O encontro (mecânica central)
- Cada pet tem um QR (rotativo a cada 30 s) e, embaixo dele, um **código curto de 4 letras** para quem
  não conseguir escanear.
- Escanear o QR do outro registra o encontro **para os dois** e abre a cena do capítulo nos dois
  celulares, com os dois pets lado a lado.
- O pet do outro passa a ser **personagem** da sua história: aparece no texto dos capítulos seguintes
  e no seu final.

### A aventura: prólogo + 4 capítulos + final
**Prólogo:** seu pet chega ao DevDay perdido. Ele tem até o pitch para montar o time da jornada final.

| Cap. | Para abrir | A escolha | Ampla (+Alcance) | Profunda (+Profundidade) |
|---|---|---|---|---|
| 1 | encontrar alguém **de outra área** | como conduzir a conversa | papo rápido e segue em frente | faz a pergunta-desafio do pet e ouve a história |
| 2 | encontrar **quem oferece o que você procura** (o app sugere 3) | como pedir | pede ajuda direto | oferece ajuda primeiro |
| 3 | ter feito pelo menos 2 encontros | o que fazer com quem já conheceu | **apresenta duas pessoas** uma à outra | marca um café depois do evento |
| 4 | antes do pitch | como gastar o último tempo | dá uma volta pelas mesas | vai torcer pelo pitch de um contato |

Cada capítulo tem: **abertura** (o pet narra), **encontro**, **escolha** e **consequência narrada**
(um texto por opção, com o nome do pet do outro). 4 capítulos × 2 consequências + 3 finais: todo o
texto é fixo, escrito antes, com marcadores como `{petAmigo}`.

### As duas características
- **Alcance:** quantas pessoas você conheceu.
- **Profundidade:** quanto as conversas foram de verdade.

As barras aparecem o tempo todo e mudam o visual do pet:
- **Alcance alto:** crachás pendurados e um megafone.
- **Profundidade alta:** um coraçãozinho e a xícara de café na mão.
- **Equilíbrio:** uma capa de "conector".

### Os três finais
| Final | Quando | O que aparece |
|---|---|---|
| **Time dos Sonhos** | equilibrou as duas | o pet com o time reunido: os pets dos seus contatos reais |
| **Colecionador de Crachás** | muito alcance, pouca profundidade | o pet afogado em crachás: "conheceu todo mundo, ninguém lembra dele" |
| **Amigo de Um Só** | muita profundidade, pouco alcance | o pet e um único amigo num banquinho: "uma conversa incrível, só uma" |

### Regra dos finais (fixa no código)
- Começa com Alcance 0 e Profundidade 0.
- Escolha ampla: **+2 Alcance**. Escolha profunda: **+2 Profundidade**.
- Cada encontro nos capítulos 1 e 2: **+1 Alcance**.
- No fim:
  - se **Alcance ≥ 4 e Profundidade ≥ 4** → Time dos Sonhos;
  - senão, se **Alcance > Profundidade** → Colecionador de Crachás;
  - senão → Amigo de Um Só.

Com os 2 encontros e *k* escolhas profundas:

| *k* | Alcance | Profundidade | Final |
|---|---|---|---|
| 0 | 10 | 0 | Colecionador |
| 1 | 8 | 2 | Colecionador |
| 2 | 6 | 4 | Time dos Sonhos |
| 3 | 4 | 6 | Time dos Sonhos |
| 4 | 2 | 8 | Amigo de Um Só |

Um teste automatizado percorre todos os caminhos e garante os 3 finais a cada mudança de regra.

**A consequência é sempre sua.** A escolha de um jogador nunca muda as barras do outro; assim os finais
continuam previsíveis e a demo é reproduzível.

---

## 4. Onde entra a IA

Nada do jogo depende de IA (D1). Ela é extra, sempre com plano B:

| Momento | O que a IA faz | Se falhar ou demorar |
|---|---|---|
| Encontro | os dois pets "conversam" na tela com uma pergunta para quebrar o gelo, a partir dos dois perfis | pergunta tirada de um banco fixo por área |
| Final | epílogo de 2 frases citando os pets que você conheceu | texto fixo do final com `{petAmigo}` |

**A IA nunca decide consequência.** Barras e finais são regras fixas no código. Provedor: **API da
OpenAI direto**, com os créditos do check-in (variável `OPENAI_API_KEY`; o OpenRouter sai).

---

## 5. O telão (extra)

- Cada pet é um ponto e cada encontro é uma linha: o mapa de conexões do evento.
- Placar: pets criados, encontros, apresentações e quantos chegaram a cada final.
- Feed: "Xícaro e Tampinha se conheceram".

## 6. O que cada pessoa leva para casa

A página **"Quem eu conheci"**: pet e nome de cada contato, área, o que oferece e, se preenchido,
LinkedIn ou GitHub.

---

## 7. Demo sem depender do público (D3)

O risco era a demo e o vídeo dependerem de gente real se escaneando. Mitigação:

1. **A dupla basta.** Miguel e Julio são os dois jogadores; um escaneia o outro. Os encontros reais da
   demo são entre os dois celulares do time.
2. **Pets de exemplo** (semente): 6 pets fixos com perfis variados, cada um com QR e código de 4 letras,
   exibidos numa página `/demo` (notebook ou tela impressa). Cobrem o capítulo 2 ("quem oferece o que
   você procura") e o capítulo 3 (apresentar duas pessoas). Eles também populam o telão.
3. **Dois caminhos com partida salva:** a partida é salva antes do capítulo 3. Na demo, segue pelas
   escolhas amplas → Colecionador de Crachás; volta ao ponto salvo e segue pelas profundas → Time dos
   Sonhos. Isso prova ao mesmo tempo o salvamento e as consequências.
4. **Código de 4 letras** como alternativa ao QR: se a câmera falhar na frente da banca, digita.
5. **Vídeo gravado antes da entrega**, com os dois celulares e a gravação de tela. Ele é o plano B se a
   demo ao vivo falhar.

---

## 8. Como cumpre o desafio nº 10

| O desafio pede | Como cumprimos |
|---|---|
| Jogo narrativo / história interativa | prólogo, 4 capítulos com texto e 3 finais; os pets dos contatos são personagens |
| Escolhas com consequências perceptíveis | cada escolha tem consequência narrada, muda as barras, o visual do pet e o final |
| Duas características do personagem | Alcance e Profundidade |
| Salvar o progresso para retomar | salvo no servidor a cada passo e retomado pelo link do pet |
| Dois caminhos com finais diferentes | a mesma partida salva levando a dois finais (seção 7) |
| Até 5 decisões e 3 finais | 4 decisões e 3 finais |

---

## 9. Arquitetura e módulos (D4)

Módulos com contrato definido antes do código, para que cada um seja tocado em paralelo:

| Módulo | Responsabilidade | Depende de |
|---|---|---|
| **Motor da história** | `story.json` (textos) + função pura `(estado, ação) → estado` + regra dos finais + teste de todos os caminhos | nada |
| **Servidor** | API HTTP: criar pet, encontro por QR/código, escolha, salvar/retomar, sugestões do capítulo 2, semente de demo | motor |
| **Celular** | montar pet, perfil, QR e código, cenas dos capítulos, barras, final, "Quem eu conheci" | contrato da API |
| **Pet visual** | sprite 16×16 em canvas: espécie × cor × acessório + itens das barras | nada |
| **Telão** *(extra)* | mapa de conexões, placar, feed (polling a cada 2 s) | contrato da API |
| **IA** *(extra)* | pergunta quebra-gelo e epílogo, com fallback | servidor |

Peças:
- **Front:** Vite + TypeScript. Páginas: celular (`/`), encontro (`/a/:codigo`), telão (`/telao`),
  demo (`/demo`).
- **Servidor:** Node 22 + Express, **uma instância**, só HTTP. **Sem Socket.IO.**
- **Dados:** em memória, com snapshot JSON no volume a cada 5 s e ao receber `SIGTERM`.
- **Identidade:** token aleatório no `localStorage`; QR muda a cada 30 s.
- **Limites por celular, nunca por IP** (no Wi-Fi do evento todo mundo sai pelo mesmo IP).
- **Deploy:** Dokploy na VPS, deploy automático da `main`, URL pública com HTTPS.

---

## 10. Privacidade

- Não há foto.
- O perfil público mostra só o primeiro nome, a área, o que a pessoa procura e o que oferece.
- LinkedIn e GitHub são opcionais e só aparecem para quem virou amigo.
- Dados apagados até 7 dias depois do evento.

---

## 11. Lapidação (decidir antes dos contratos)

- [ ] **L1 — Todo capítulo nasce de um encontro.** Hoje os capítulos 3 e 4 não exigem escanear
  ninguém, o que quebra a regra principal. Proposta: cap. 3 = encontrar **alguém novo** e escolher
  entre apresentá-lo a um contato antigo ou marcar um café; cap. 4 = **reencontrar** um contato
  (reescanear). A regra vira "cada pessoa **nova**: +1 Alcance" (caps. 1–3). Os finais continuam
  alcançáveis: *k* = 0..4 dá A/P = 11/0, 9/2, 7/4, 5/6, 3/8.
- [ ] **L2 — Encontro que não cumpre a condição.** Se eu escaneio alguém da mesma área no cap. 1, o que
  acontece? (a) o capítulo não abre e a amizade conta mesmo assim; (b) o capítulo abre sempre e a
  condição só muda o texto. (b) é mais simples e nunca trava o jogador.
- [ ] **L3 — Capítulos diferentes no mesmo encontro.** Eu estou no cap. 1 e a outra pessoa no cap. 3:
  cada celular abre o **próprio** capítulo atual, com o outro como personagem.
- [ ] **L4 — Problema e solução em uma frase** para o README e o vídeo.
- [ ] **L5 — Nome do projeto** e trilha do evento.

## 12. Pendências

- [x] Provedor de IA: API da OpenAI (seção 4)
- [x] Textos: rascunho v1 em [`HISTORIA.md`](HISTORIA.md)
- [ ] Lista de espécies, cores e acessórios do pet
- [ ] Os 6 pets de exemplo da semente
- [ ] Subdomínio com HTTPS na VPS
- [ ] Atualizar `REGRAS.md` para este plano (ou apagar o que não vale mais)
- [ ] Nome do projeto e trilha do evento; seção "Nosso projeto" do README
