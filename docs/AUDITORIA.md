# Auditoria de 23/10/2026 (almoço)

Duas revisões só de leitura (servidor + motor, cliente), achados conferidos no código. Teste no
navegador passou de ponta a ponta: criação, diagnóstico, 4 missões, Colecionador, "Tente o outro
caminho" → Missão 3 → Time dos Sonhos, atividade da Academia. Sem XSS: todo texto passa por `esc()`.

Cada item vira **um commit**. Marcar `[x]` com o hash.

## Para o Julio (deploy, não é código)

- [ ] **Volume nomeado em `/data` no Dokploy** (Advanced → Mounts). Só o `VOLUME` do Dockerfile cria
      volume anônimo: a cada deploy os pets somem e todo celular fica com token inválido. Conferir:
      redeploy e `/api/eu` com um token antigo continua respondendo.
- [ ] **Apresentar sempre pela URL pública HTTPS**: o QR usa `location.origin`; aberto em
      `localhost`, o celular da banca não abre.

## Lote 1 — alto (antes do vídeo)

- [x] **S1 · Encontro só em `aguardando`, antes de buscar o código** (`server/index.ts:183`). Hoje um
      código inexistente dá 404 e um real dá 409: dá para enumerar os 4 caracteres, e com `retomar` para
      a Missão 1 um pet abre o capítulo de vários outros. Checar a fase primeiro.
- [x] **S2 · Limite por token** (PLANO A5): encontro a cada 5 s, bloqueio após ~20 códigos errados;
      `Map<token, …>` em memória, nunca por IP.
- [x] **S3 · Teto de pets** (`POST /api/pets`): `pets.size >= 2000` → 503 "evento lotado". Sem teto,
      `novoCodigo` fica O(n) e trava o loop quando os códigos acabam.
- [x] **S4 · Snapshot não derruba o processo**: `salvar` em try/catch (mantém `sujo` para tentar de
      novo); `carregar` em try/catch, renomeia o arquivo ruim para `.bad-<data>` e sobe vazio; ao
      carregar, preencher `historico ?? []` e `estado: { ...novoEstado(), ...p.estado }`.
- [x] **S5 · Erros 4xx do Express viram 400/413**, não 500 com stack no log (JSON inválido, corpo
      grande). Mensagem de `ErroDeFase` genérica (não expor a máquina de estados).
- [x] **C1 · Token velho se recupera**: 401 no polling ou em `acao` → apaga `qg-token` e recarrega.
- [ ] **C2 · iOS não dá zoom no formulário**: `font-size: 16px` em `input, select` (`style.css:50`).
- [ ] **C3 · Polling não sobrescreve ação** (`main.ts:241`): contador `versao` incrementado em `acao`
      e na atividade; descartar resposta do polling se mudou; não disparar com um polling em voo;
      pular quando `document.hidden`.
- [ ] **C4 · Clique duplo em "Criar meu pet"** cria dois pets e dois `setInterval`: desabilitar o
      botão durante o envio; guardar o id do intervalo.

## Lote 2 — médio

- [ ] **S6 · Sugestões mostram gente real primeiro** (`server/index.ts:153`): ordenar `demo` por último
      e quem está `aguardando` primeiro, antes do `slice(0, 3)`.
- [ ] **S7 · Atividade da Academia só na ordem e uma vez** (`shared/academia.ts:170`): recusar id
      diferente de `proximaAtividade`. Teste em `academia.test.ts`.
- [ ] **S8 · Diagnóstico só aceita números** (`server/index.ts:218`).
- [ ] **C5 · Safe-area do iPhone**: `.cartao` no celular com `bottom: calc(max(8px,
      env(safe-area-inset-bottom)) + 66px)`; topo de `.criar` e `.demo-lista` com
      `env(safe-area-inset-top)`.
- [ ] **C6 · Sem rede**: `fetch` com `AbortSignal.timeout(8000)` e mensagem "sem conexão, tente de
      novo" (hoje aparece "Failed to fetch"); boot que falha tenta de novo em 3 s.
- [ ] **C7 · Vazamento de GPU**: `atualizarMapa`, `cenaFinal` e `trocarPet` recriam texturas,
      geometrias e materiais sem `dispose`. Textura do selo e sombra do pet como constantes do módulo;
      só remontar quando `cap|fase|encontros.length` mudar (inclui a cena final, que hoje reseta ao
      trocar de aba).
- [ ] **C8 · Celular mais leve**: sem o blur (`body.jogando::before/::after`) até 760 px;
      `pixelRatio` até 1,5 em `pointer: coarse`.
- [ ] **C9 · Diagnóstico com erro não perde as 5 respostas**: `acao` devolve `true/false`; só zera
      em `true`.

## Lote 3 — baixo (se sobrar tempo)

- [ ] C10 `touch-action: manipulation` em `button`; ignorar segundo toque < 300 ms no diagnóstico
- [ ] C11 Avisar quando um código de QR fica guardado ("Você vai encontrar X ao começar a Missão")
- [ ] C12 `sessionStorage` em try (iOS com cookies bloqueados)
- [ ] C13 Modal do Escanear: não abrir dois; "Fechar" com 44 px
- [ ] C14 Foco volta ao primeiro botão do cartão após `render()`; `aria-pressed` nos seletores
- [ ] C15 `.rotulo span` com contraste AA (`#157a33`)
- [ ] C16 `retrato()` não guarda imagem de contexto perdido; `/demo` com `.catch`
- [ ] C17 `minlength="2"` nos nomes
- [ ] S9 `app.disable('x-powered-by')`; rota curinga não devolve `index.html` para arquivo com ponto
- [ ] S10 Dockerfile: `CMD ["node", "--import", "tsx", "src/server/index.ts"]` (SIGTERM chega ao
      salvamento) e `HEALTHCHECK` em `/health`

## Decisões abertas (não implementar sem o Miguel)

- **Encontro com alguém ocupado** (prólogo ou no meio de um encontro): o outro só registra que te
  conheceu e não pode mais te contar nas Missões 1–3. Aceitar ou pular o `conhecer` no prólogo?
- **Texto do Time dos Sonhos** diz "com cada um você teve uma conversa longa", mas o final sai com 2
  escolhas profundas de 4. Ajustar o texto (story.ts + HISTORIA.md)?
