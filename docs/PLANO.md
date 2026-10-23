# Plano — Quebra-Gelo (implementação)

Ordem de execução do projeto, aprovada pela equipe em 23/10/2026. O **o quê** está em
[`QUEBRA-GELO.md`](QUEBRA-GELO.md) (produto) e [`HISTORIA.md`](HISTORIA.md) (textos); este arquivo é o
**como e quem**. Quem pegar uma tarefa daqui consegue tocá-la sem o histórico de nenhuma conversa.

**Mudou alguma coisa?** Qualquer um pode mudar o plano: edita este arquivo **no mesmo commit** da
mudança, com mensagem `Ajuste o plano: …`. Se afeta a frente do outro, avisa no grupo antes de subir.

---

## 1. Frentes

| Frente | Dono | Escopo |
|---|---|---|
| **Visual e identidade** | Julio | nome, marca, paleta, tipografia, menu do mundo, arte das fases, pets, UI (HUD, balões, telas) |
| **Implementação** | Miguel + agentes | motor, servidor, fluxos da Aventura e da Academia, IA, deploy, testes, paridade celular/computador |

As duas frentes se encontram em **contratos** (seção 3). Enquanto o contrato não muda, cada um trabalha
sem esperar o outro.

## 2. Estado em 23/10/2026

- [x] Ideia, decisões D1–D6 e regras oficiais (`QUEBRA-GELO.md`)
- [x] Textos v1 da Aventura (`HISTORIA.md`)
- [x] MVP jogável da Aventura: criação do pet, 6 fases, encontro por código/QR, escolha por zona,
      3 finais, retomada por capítulo, `/demo`, Dockerfile (commit `868304b`, branch `mvp`)
- [x] Lapidação aplicada no MVP por padrão: **L1** (todo capítulo nasce de um encontro), **L2 (b)**
      (encontro sempre abre o capítulo), **L3** (cada um abre o próprio capítulo)
- [ ] L4 (problema e solução em uma frase) e L5 (nome e trilha): com o Julio, junto da identidade

---

## 3. Contratos entre as frentes

O Julio pode trocar **tudo o que é visual** sem tocar em regra; a implementação pode mudar regra sem
quebrar o visual. Arquivos e pontos de contato:

| Contrato | Arquivo | Regra |
|---|---|---|
| **Tokens visuais** | `src/client/style.css`, bloco `:root` | cores, fontes, raios, sombras só como variáveis CSS; o resto do CSS usa as variáveis |
| **Pet 3D** | `src/client/pet.ts` | assinatura fixa: `criarPet(dna, itens) → THREE.Group`, com `userData.corpo` (grupo que quica). Altura ~1,3, frente em +z |
| **Fases** | `src/client/world.ts`, array `FASES` | cada fase tem `chao`, `parede`, `limites`, `zonas` [ampla, profunda] e `montar(g)`. Arte pode mudar livremente; posição das zonas e `limites` combinam com a implementação |
| **Menu do mundo** | `src/client/menu.ts` (a criar pelo Julio) | expõe `abrirMenu(destinos)`; cada destino chama uma função da implementação: `abrirAventura()`, `abrirAcademia()`, `abrirContatos()` |
| **Textos** | `docs/HISTORIA.md` → `src/shared/story.ts` | o texto muda no `.md` e no `.ts` no mesmo commit; marcadores `{…}` não mudam de nome |
| **API** | `src/server/index.ts` | rotas em `/api/*`; formato da resposta `visao` (pet, estado, amigo, conhecidos, sugestões) |

---

## 4. Celular e computador com a mesma qualidade

O computador tende a ser o uso principal (todo mundo está de notebook), mas **nenhuma função pode
existir só num dos dois**. Regras que valem para toda tarefa:

1. **Entrada:** tudo funciona com **toque**, **mouse** e **teclado** (WASD/setas para andar, Enter para
   confirmar). Nada depende de hover.
2. **Encontro:** no celular, a câmera nativa lê o QR e abre o link; no computador, **digitar o código
   de 4 letras** é o caminho principal. Os dois levam ao mesmo lugar.
3. **Layout:** duas formas testadas, **paisagem** (notebook: HUD em cima, balão embaixo no centro,
   até 640 px) e **retrato** (celular: HUD compacto, balão de largura total). Respeitar `safe-area` do
   iPhone.
4. **Leitura e toque:** texto do balão com no mínimo 16 px no celular; alvos de toque com no mínimo
   44 px; contraste AA.
5. **Câmera 3D:** a fase inteira cabe na tela nas duas orientações (a distância da câmera já se ajusta
   pela proporção da tela).
6. **Desempenho:** 60 fps no notebook, 30 fps num Android intermediário; `pixelRatio` no máximo 1,5;
   sem sombra real.
7. **Matriz de teste** (antes de cada entrega de bloco): Chrome no notebook · Chrome no Android ·
   Safari no iPhone · janela estreita no notebook (simula celular).

---

## 5. Tarefas

Formato: **ID · tarefa** — dono · depende de · pronto quando. Tarefas sem dependência podem andar em
paralelo (inclusive por agentes). Marcar `[x]` com o hash do commit.

### F — Fundação

- [ ] **F1 · Juntar o trabalho na `main`** — Miguel · — · `mvp` e `docs/planejamento` na `main`; a
      partir daí, branch curta por tarefa e merge na `main`
- [ ] **F2 · Deploy no Dokploy com HTTPS** — Miguel · F1 · app no ar numa URL `https://`, deploy
      automático da `main`, volume `/data`, healthcheck `/health` respondendo. HTTPS é obrigatório:
      sem ele o celular não abre a câmera e a regra do evento pede URL pública
- [ ] **F3 · Paridade celular/computador** — Miguel/agente · — · seção 4 cumprida no que já existe
      (layout retrato, safe-area, alvos de 44 px, Enter confirma); matriz de teste passada
- [ ] **F4 · `.env.example` e `REGRAS.md` atualizados** — Miguel · — · OpenRouter sai, entra
      `OPENAI_API_KEY`; `REGRAS.md` só com o que ainda vale

### V — Visual e identidade (Julio)

- [ ] **V1 · Identidade** — Julio · — · nome final, logo, paleta e tipografia aplicados como tokens em
      `:root` (contrato da seção 3)
- [ ] **V2 · Menu do mundo** — Julio · V1 · hub com Credenciamento, Aventura, Academia e Quem eu
      conheci, chamando as funções do contrato
- [ ] **V3 · Pets** — Julio · — · 6 espécies e 4 acessórios refinados em `pet.ts`, mantendo a assinatura
- [ ] **V4 · Arte das fases e dos finais** — Julio · — · `FASES[].montar` e `cenaFinal` com a
      identidade nova
- [ ] **V5 · UI** — Julio · V1 · HUD, balões, tela de criação e tela da trilha seguindo os tokens,
      nas duas formas da seção 4
- [ ] **V6 · Telão** *(extra)* — Julio · A4 · mapa de conexões e placar

### A — Aventura (desafio nº 10)

- [ ] **A1 · Aviso de encontro** — Miguel/agente · — · quando alguém digita o seu código, aparece
      "X te encontrou!" e o pet dele entra pela porta, sem recarregar
- [ ] **A2 · Colisão com os móveis** — agente · — · o pet não atravessa mesas e paredes (caixas
      simples por fase)
- [ ] **A3 · Mapa entre as fases** — Miguel + Julio · V2 · a transição de capítulo passa pelo mapa
      da ilha (pode ser o próprio menu do mundo)
- [ ] **A4 · Rota de estatísticas** — agente · — · `/api/stats`: pets, encontros, finais (alimenta
      telão e pitch)
- [ ] **A5 · Limites por celular** — agente · — · limites por token (criar pet, encontro a cada 5 s,
      20 requisições/s), nunca por IP
- [ ] **A6 · QR rotativo** *(decisão ABERTA)* — vale o anti-fraude no hackathon? Se sim: QR e código
      mudam a cada 30 s com HMAC (`QR_SECRET`)

### K — Academia (desafio nº 4)

- [ ] **K1 · Conteúdo** — Miguel (rascunho por agente) · — · `docs/ACADEMIA.md`: 5 questões
      diagnósticas (cada uma ligada a Abordar, Escutar ou Conectar) e 3 atividades por habilidade,
      cada uma com opções, resposta certa e explicação
- [ ] **K2 · Motor da Academia** — agente · K1 · funções puras em `src/shared/academia.ts`:
      pontuar diagnóstico, ordenar trilha (mais fraca primeiro), registrar atividade; teste provando
      que **dois perfis geram trilhas diferentes**
- [ ] **K3 · Rotas e persistência** — Miguel · K2 · `/api/diagnostico`, `/api/atividade`; progresso
      salvo com o pet; **separado** de Alcance e Profundidade
- [ ] **K4 · Diagnóstico no credenciamento** — Miguel · K3 · na primeira entrada, o pet-recepcionista
      faz as 5 perguntas na fase do prólogo
- [ ] **K5 · Tela da trilha** — Miguel + Julio (V5) · K3 · caminho de bolinhas, cadeados, atividade
      com explicação, barras por habilidade
- [ ] **K6 · Ligação com a Aventura** — Miguel · K5 · a trilha sugere o capítulo da habilidade fraca

### I — IA (API da OpenAI, sempre com plano B)

- [ ] **I1 · Cliente da OpenAI** — agente · F4 · chamada só no servidor, timeout de 8 s, fila de 20,
      resposta em JSON validada; sem chave ou com erro, cai no texto fixo
- [ ] **I2 · Pergunta quebra-gelo no encontro** — Miguel · I1 · os dois pets "conversam" com uma
      pergunta feita a partir dos dois perfis
- [ ] **I3 · Epílogo do final** — Miguel · I1 · 2 frases citando os pets que a pessoa conheceu

### E — Entrega (regras oficiais: até 16h)

- [ ] **E1 · Ensaio de ponta a ponta** — os dois · F2 · matriz da seção 4 com os dois desafios
- [ ] **E2 · Vídeo de 3 min** — os dois · E1 · roteiro: problema → Academia (dois perfis) →
      Aventura (dois caminhos) → por que agora → o que vem depois
- [ ] **E3 · README final** — Miguel · E1 · problema, solução, link, como rodar, banco de questões
      próprio declarado
- [ ] **E4 · Formulário enviado** — Miguel · E2, E3 · antes das 16h

---

## 6. Ordem sugerida

Caminho crítico: **F1 → F2 → E1 → E2 → E4**. O resto anda em paralelo em volta dele.

| Bloco | Implementação (Miguel + agentes) | Visual (Julio) |
|---|---|---|
| 1 | F1, F2, F3, F4 · agentes em K1 e A2 | V1, V3 |
| 2 | K2, K3, K4 · agentes em I1 e A1 | V2, V4 |
| 3 | K5, K6, I2, I3 | V5 |
| 4 | E1, E3 · extras (A3–A6, V6) só se o bloco 3 estiver fechado | E1 |
| 5 | E2, E4 | E2 |

## 7. Regras que não quebram

- `npm test` passando antes de cada push: os 3 finais da Aventura e os 2 perfis da Academia.
- A Aventura tem **4 decisões e 3 finais**; a Academia nunca mexe em Alcance e Profundidade.
- A IA nunca decide consequência e nunca é obrigatória para jogar.
- Nenhuma chave no front-end; `.env` nunca vai para o repositório.
- A `main` sempre funciona: é ela que o Dokploy publica.

## 8. Trabalho com agentes

- **Decide sozinho:** o que já está neste plano e no `QUEBRA-GELO.md`; estrutura interna de código.
- **Pergunta antes:** mudar regra do jogo, textos aprovados, contrato da seção 3, dependência nova.
- **Se travar:** anota em `docs/PENDENCIAS.md` (onde, o que travou, opções) e segue para a próxima
  tarefa.
- Um commit por tarefa, mensagem no imperativo, sem trailer de IA.
