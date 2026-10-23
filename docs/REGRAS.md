# Regras do projeto — Pets do Evento (nome provisório)

Fonte única de verdade do projeto. Quem mexe no código, seja pessoa ou IA (Codex, Claude), segue estas
regras. Se uma regra atrapalhar, ela é alterada **aqui primeiro** e só depois no código.

---

## 0. Metas não negociáveis

1. **150 pessoas ao mesmo tempo** (margem sobre os ~120 do evento) sem travar o servidor, o telão ou os
   celulares.
2. **Do QR ao pet na tela em menos de 15 s**, mesmo com a IA lenta.
3. **Nenhuma falha externa impede a pessoa de jogar.** IA fora do ar, Wi-Fi ruim ou celular sem AR
   sempre têm um plano B (ver seção 11).
4. **O servidor nunca cai por causa de entrada ruim.** Toda mensagem é validada e todo erro é tratado.
5. **A IA é chamada só na criação do pet.** Nada de IA por movimento, encontro ou mensagem.

---

## 1. Regras do jogo

### Pet
1. **Um pet por celular.** A identidade é um token aleatório salvo no `localStorage`. Não tem login.
2. O pet nasce de uma foto (da pessoa, da roupa ou de um objeto). A IA devolve o DNA: nome, espécie,
   cores, personalidade e frase (ver 3.4).
3. Enquanto a IA responde, o pet aparece como **ovo chocando** com as cores da foto. Quando a IA
   termina, ele choca.
4. A pessoa pode **refazer o pet até 2 vezes**, só nos primeiros 10 minutos. Depois disso, ele é
   definitivo. Os amigos sempre são mantidos.
5. O nome pode ser editado: de 2 a 16 caracteres, passando pelo filtro de palavras (6.7).

### Amizade
6. **A amizade só acontece pessoalmente:** uma pessoa escaneia o QR do pet da outra.
7. O QR **muda a cada 30 s** e o servidor aceita a janela atual e a anterior. Um print mandado no
   WhatsApp expira.
8. A amizade é **mútua** e conta **uma vez por par**. Ninguém faz amizade consigo mesmo.
9. Limite: **1 amizade nova a cada 5 s** por pessoa (contra scripts e escaneamento em massa).

### Evolução por número de amigos
| Amigos | O pet ganha |
|---|---|
| 0 | filhote pequeno e tímido, anda sozinho |
| 1 | cachecol e cresce um pouco |
| 3 | chapéu e animação de dança |
| 5 | asas, voa baixinho e deixa rastro de brilho |
| 10 | coroa e tamanho grande |
| 1º do ranking | aura dourada e destaque no telão |

10. **Pintinhas:** cada amigo pinta uma pintinha no pet com uma cor do pet dele. No máximo 20 aparecem.
11. *(Extra)* **Item da espécie do amigo:** dragão → chifrinhos, coruja → óculos, robô → antena,
    gato → bigodes, cachorro → coleira, slime → gotas brilhantes.
12. *(Extra)* **Turma:** três pets amigos entre si andam em grupo e o nome da turma aparece no telão.

### Coletivo e ranking
13. O telão mostra o total de amizades do evento. Com **100**, todos os pets dançam. Com **300**, tem
    fogos e um item especial para todo mundo.
14. O ranking é pelo número de amigos. Em caso de empate, ganha quem chegou primeiro ao número.
15. No fim do evento, o 1º do ranking é coroado **pet do evento**.
16. Cada pessoa tem a página **"Quem eu conheci"**, com nome do pet, dono e LinkedIn/GitHub de quem
    preencheu (opcional).

---

## 2. Arquitetura (fixa para hoje)

| Peça | Escolha |
|---|---|
| Linguagem | TypeScript em tudo |
| Front | Vite + Three.js; páginas `/` (celular), `/telao`, `/admin`, `/a/:codigo` (amizade) |
| AR | `<model-viewer>` (pet no chão, Android e iPhone); WebXR hit-test (mundo ao vivo, Android); MindAR com cartão na mesa (mundo ao vivo, iPhone); giroscópio como reserva |
| Servidor | Node 22 + Express + Socket.IO, **uma única instância** |
| Validação | `zod` em toda entrada (HTTP, socket e resposta da IA) |
| IA | OpenRouter (seção 3) |
| Dados | Em memória + snapshot JSON em volume (seção 6) |
| Deploy | Dokploy na VPS, atrás do Traefik com HTTPS (seção 8) |

1. **O servidor é a autoridade.** Ele decide onde cada pet está, quem é amigo de quem e o nível de cada
   pet. Os clientes só desenham e pedem ações.
2. **O mundo é um plano 2D** com x e z entre −1 e 1. O telão, o AR na mesa e o cartão mostram esse
   mesmo plano, cada um com a sua câmera.
3. **Uma instância só.** Não escalar réplicas no Dokploy: o estado está em memória e o Socket.IO sem
   Redis não funciona com várias réplicas. Uma instância aguenta folgado 150 conexões.
4. **A foto vai por HTTP** (`POST /api/pets`), nunca pelo WebSocket.

---

## 3. IA via OpenRouter

### 3.1 Chamada
- Endpoint: `POST https://openrouter.ai/api/v1/chat/completions` (formato compatível com OpenAI).
- Cabeçalhos: `Authorization: Bearer $OPENROUTER_API_KEY`, `HTTP-Referer: $PUBLIC_URL`,
  `X-Title: Pets do Evento`.
- Corpo:
  - `models: [OPENROUTER_MODEL, ...OPENROUTER_FALLBACK_MODELS]`: o OpenRouter tenta o próximo se o
    primeiro falhar.
  - `response_format: { type: "json_schema", json_schema: { name: "pet", strict: true, schema } }`
  - `provider: { require_parameters: true }`: só usa provedores que respeitam o JSON schema.
  - `reasoning: { effort: "low" }` e `max_tokens: 800`. Os modelos abaixo raciocinam, e com
    `max_tokens` baixo o raciocínio consome tudo e a resposta vem vazia.
- A foto vai como `image_url` com data URL `data:image/jpeg;base64,...`.

### 3.2 Modelos
Conferidos no catálogo do OpenRouter em 23/10/2026. Todos aceitam imagem e saída estruturada.

| Variável | Valor | Preço (US$/1M tokens entrada/saída) |
|---|---|---|
| `OPENROUTER_MODEL` | `openai/gpt-6-luna` | 0,10 / 0,50 |
| `OPENROUTER_FALLBACK_MODELS` | `google/gemini-3.1-flash-lite,anthropic/claude-haiku-5.5` | 0,25 / 1,50 e 0,10 / 0,50 |

1. **Medir a latência na primeira hora.** Se o p95 passar de 6 s, trocar a ordem dos modelos (só na
   variável de ambiente, sem mexer no código).
2. **Nunca usar modelos `:free`.** Eles têm limite de requisições por minuto que estoura com o evento
   inteiro entrando junto.
3. **Nunca usar variantes `:batch`.** São para processamento em lote e respondem devagar.
4. Custo estimado: menos de US$ 0,001 por pet. Criar uma **chave dedicada no OpenRouter com limite de
   crédito de US$ 5**.

### 3.3 Controle de carga
1. **Fila com no máximo 20 chamadas simultâneas.** O excedente espera na fila; o usuário vê o ovo
   chocando.
2. **Timeout de 15 s por chamada.** Depois disso, uma nova tentativa (com o fallback de modelos do
   OpenRouter). Se falhar de novo, usa o **DNA local** (3.5).
3. Erro 429 ou 5xx: espera exponencial (1 s, 2 s) e no máximo 2 tentativas. Nunca repetir em loop.
4. Se a fila passar de 60 pedidos, os novos pets usam DNA local direto. O jogo continua; o pet só fica
   menos criativo.

### 3.4 Contrato do DNA
```json
{
  "nome": "string, 2 a 16 caracteres",
  "especie": "gato | cachorro | dragao | coruja | slime | robo",
  "cores": ["#rrggbb", "#rrggbb", "#rrggbb"],
  "personalidade": "brincalhao | timido | curioso | dorminhoco | aventureiro | dramatico",
  "frase": "string, até 60 caracteres"
}
```
1. **Campos fechados sempre que possível** (enums). O modelo escolhe entre opções, não inventa.
2. A resposta passa pelo `zod`. Se algum campo vier inválido, ele é trocado pelo valor do DNA local;
   não é feita uma nova chamada.
3. O prompt manda: nada de nomes de pessoas reais, marcas ou conteúdo ofensivo; tom fofo e brincalhão;
   cores tiradas da foto.
4. O nome e a frase passam pelo filtro de palavras (6.7) antes de aparecer.

### 3.5 DNA local (plano B)
Calculado no próprio celular, sem rede:
- cores = as 3 cores dominantes da foto;
- espécie e personalidade = sorteio determinístico pelo token do celular;
- nome = combinação de sílabas.

Ele é usado como ovo e também quando a IA falha.

### 3.6 Foto
1. O celular **reduz a foto para no máximo 512 px** e a recodifica como **JPEG com qualidade 0,7** via
   canvas antes de enviar. Isso resolve HEIC do iPhone e fotos gigantes, e apaga o EXIF, que pode ter
   a localização GPS.
2. O servidor recusa uploads com mais de 300 KB.
3. **A foto nunca é salva nem registrada em log.** Ela vive só durante a chamada à IA.
4. Para escolher a foto, usar `<input type="file" accept="image/*">`. O celular oferece câmera ou
   galeria.

---

## 4. Tempo real sem travar

1. **Mandar intenções, não posições.** O servidor envia "o pet X anda até (x, z), começa em t, com
   velocidade v" só quando o pet muda de rumo (a cada 3 a 6 s). Cada cliente anima sozinho. Com 150
   pets dá cerca de 40 eventos/s no total, e o movimento continua suave mesmo com rede ruim.
2. O servidor simula a **10 Hz** (decide destinos e detecta encontros) e **agrupa** tudo o que mudou no
   tick em **uma mensagem** por cliente.
3. **O DNA vai uma vez só**, quando o cliente entra ou quando o pet muda (choca, sobe de nível, ganha
   pintinha). Nunca a cada tick.
4. **Relógio sincronizado:** toda mensagem leva `t` do servidor, e o cliente calcula a diferença para
   o próprio relógio.
5. **Reconexão automática.** Ao reconectar, o cliente pede o estado completo e mostra "reconectando…"
   em vez de congelar.
6. **Cada mensagem recebida passa pelo `zod`** e cada handler tem `try/catch`. Mensagem inválida é
   descartada e registrada, sem derrubar nada.
7. **Limites por pessoa, nunca por IP.** No Wi-Fi do evento, todo mundo sai pelo mesmo IP. Os limites
   ficam no token do celular:

| Ação | Limite |
|---|---|
| Criar ou refazer pet | 3 no total |
| Amizade nova | 1 a cada 5 s |
| Emoji ou petisco | 1 por segundo |
| Qualquer mensagem de socket | 20 por segundo (acima disso, desconecta) |

### Mensagens

| Direção | Evento | Conteúdo |
|---|---|---|
| servidor → todos | `estado` | lista completa de pets (DNA + rota atual) e total de amizades, só ao conectar |
| servidor → todos | `tick` | rotas novas, encontros, pets que mudaram |
| servidor → todos | `feed` | "fulano ficou amigo de ciclano", meta coletiva atingida |
| servidor → um | `meu-pet` | pet do dono, amigos e código do QR atual |
| cliente → servidor | `reacao` | `{ petId, tipo: "emoji" \| "petisco", valor }` |
| admin → servidor | `admin` | `{ acao: "festa" \| "chuva" \| "bots" \| "remover", ... }` |

---

## 5. Desempenho no celular e no telão

1. **Pet pequeno:** grade de no máximo 12×12×12 e até **400 cubos por pet**. Acessórios e pintinhas
   recolorem cubos ou somam no máximo 30.
2. **Uma geometria e um material por pet.** Juntar os cubos (merge) e usar cor por vértice. Nada de
   textura, sombra real ou pós-processamento. Para o chão, usar uma sombra falsa (um círculo escuro).
3. **No celular, no máximo 30 pets desenhados:** o próprio, os amigos e os mais próximos ou recentes.
   O telão desenha todos.
4. **Resolução limitada no celular:** `renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))`.
5. **Parar de desenhar quando a aba fica escondida** (`visibilitychange`).
6. Nomes no telão: textura de texto gerada uma vez por pet e reaproveitada. Nunca recriar a cada quadro.
7. Meta: **30 fps** num Android intermediário e **60 fps** no notebook do telão.

---

## 6. Estabilidade e dados

1. **Snapshot do mundo a cada 5 s** em `$DATA_DIR/mundo.json`. Escrita atômica: grava num arquivo
   temporário e renomeia.
2. Ao receber **`SIGTERM`** (redeploy do Dokploy), grava o snapshot antes de sair.
3. Ao subir, carrega o snapshot. Um redeploy no meio do evento não pode apagar nenhum pet.
4. `GET /health` responde `200`, e o Dokploy usa isso como healthcheck.
5. `GET /admin/stats` (protegido) mostra conexões, pets, tamanho da fila da IA, latência p95 da IA e
   erros.
6. **Token de identidade é secreto, `petId` é público.** O token nunca aparece em QR, URL ou mensagem
   para outros clientes.
7. **Moderação:**
   - lista de palavras proibidas aplicada a nomes, frases e nomes de turma;
   - o admin pode remover um pet ou trocar o nome dele;
   - LinkedIn e GitHub são validados (só URL do LinkedIn ou usuário do GitHub).
8. **Privacidade (LGPD):**
   - a foto nunca é guardada;
   - LinkedIn e GitHub são opcionais e só aparecem para quem virou amigo;
   - os dados são apagados até 7 dias depois do evento.

### QR de amizade
- URL: `$PUBLIC_URL/a/<petId>.<janela>.<assinatura>`.
- `janela = floor(agora / 30 s)`.
- `assinatura = HMAC-SHA256(QR_SECRET, petId + janela)`, truncada em 16 caracteres.
- O servidor aceita a janela atual e a anterior. A operação é idempotente: escanear duas vezes não cria
  duas amizades.
- Quem escaneia é identificado pelo token do próprio celular. Se a pessoa ainda não tem pet, cria um
  primeiro e a amizade é concluída em seguida.

---

## 7. Segredos e variáveis de ambiente

| Variável | Para quê |
|---|---|
| `OPENROUTER_API_KEY` | chave dedicada, com limite de crédito |
| `OPENROUTER_MODEL` | modelo principal (3.2) |
| `OPENROUTER_FALLBACK_MODELS` | modelos reserva, separados por vírgula |
| `QR_SECRET` | assinatura dos QR de amizade (32+ caracteres aleatórios) |
| `ADMIN_TOKEN` | acesso ao `/admin` |
| `PUBLIC_URL` | URL pública com HTTPS |
| `DATA_DIR` | pasta do volume persistente (`/data`) |
| `PORT` | porta interna do servidor |

1. **Nenhuma chave no front-end.** Toda chamada à IA passa pelo servidor.
2. As variáveis ficam no Dokploy. O `.env` local nunca é comitado.
3. O `.env.example` lista as variáveis sem valores.

---

## 8. Deploy (Dokploy na VPS)

1. **A `main` sempre funciona.** O Dokploy faz deploy automático da `main`.
2. Dockerfile multi-stage com `node:22-alpine`. O build roda no Docker, não na VPS.
3. **Uma réplica**, com um **volume montado em `/data`** e healthcheck em `/health`.
4. **Não mexer em nada além da própria aplicação na VPS.** Ela roda outros serviços, e o Traefik já
   ocupa as portas 80 e 443.
5. **Congelamento: nenhum deploy nos 30 min antes do pitch.** Anotar o hash do último commit bom para
   fazer rollback pelo Dokploy.

---

## 9. Fluxo de trabalho

1. Commits pequenos, com mensagem no imperativo (regra do README).
2. Antes de cada push: `npm run build` e `npm run typecheck` passando.
3. **Tudo que mexe em câmera ou AR é testado em celular de verdade**, num Android e num iPhone.
   O navegador do notebook não conta.
4. Funcionalidade inacabada fica desligada por flag (variável de ambiente ou botão no admin). Nunca vai
   para a `main` meio quebrada e visível.
5. **Corte de escopo às 15h:** o que for extra e não estiver funcionando é cortado. Sem negociação.

---

## 10. Testes obrigatórios antes da demo

| Teste | Como | Passa se |
|---|---|---|
| Carga | `npm run carga`: 150 clientes bots conectam, criam pets com a IA real em 30 s e fazem amizades | todos os pets chocam em menos de 60 s; CPU abaixo de 50%; event loop com atraso abaixo de 50 ms; nenhum erro |
| Reinício | reiniciar o container durante o teste de carga | clientes reconectam sozinhos e nenhum pet some |
| IA fora | rodar com `OPENROUTER_API_KEY` inválida | pets nascem com o DNA local e nada trava |
| Rede ruim | celular no 4G e com o modo "rede lenta" do navegador | pet nasce em menos de 15 s e os pets andam suave |
| Celulares | Android e iPhone reais, do QR à amizade | fluxo completo sem erro |
| Telão | notebook do telão com 150 pets | 60 fps estáveis |

---

## 11. Plano B para cada falha

| Se… | Então… |
|---|---|
| a IA demora | o ovo choca quando a resposta chegar; o pet já está no mundo |
| a IA cai ou a fila enche | DNA local |
| o celular não tem WebXR | cartão na mesa (MindAR); se não tiver cartão, giroscópio |
| o celular não deixa usar a câmera | o pet aparece em 3D normal, sem AR |
| a conexão cai | reconecta sozinho e pede o estado completo |
| o servidor reinicia | carrega o último snapshot (no máximo 5 s perdidos) |
| pouca gente entra | admin liga os pets bots |
| tudo dá errado na demo | vídeo gravado do fluxo completo, feito antes do congelamento |

---

## 12. Cronograma de hoje (23/10)

Ajustar quando os organizadores divulgarem o horário do pitch.

| Horário | Entrega |
|---|---|
| 10h – 11h30 | esqueleto, deploy com HTTPS e prova de AR nos dois celulares |
| 11h30 – 13h30 | foto → OpenRouter → DNA → pet em voxels |
| 13h30 – 15h | mundo em tempo real, telão e amizade por QR |
| **15h** | **corte de escopo** |
| 15h – 16h30 | teste de carga, correção de bugs, vídeo de reserva |
| 16h30 em diante | congelamento e ensaio do pitch |
