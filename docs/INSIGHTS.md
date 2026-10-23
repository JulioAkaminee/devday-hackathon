# Insights e decisões — Pets do Evento (nome provisório)

Resumo das conversas de planejamento de 23/10/2026. As regras técnicas e do jogo, que valem para o
código, estão em [`REGRAS.md`](REGRAS.md).

---

## 1. A ideia em uma frase

**Cada pessoa do evento ganha um bichinho 3D, de cubinhos tipo Minecraft, criado a partir de uma foto,
e o pet só evolui quando o dono faz amizade com gente nova.**

### Como a pessoa usa
1. Escaneia o QR do telão e abre um site, sem baixar app.
2. Tira uma foto (dela, da roupa ou de um objeto). A IA cria o pet com as cores da foto, um nome e uma
   personalidade.
3. Aponta a câmera para a mesa ou para o chão e vê o pet ali, junto com os pets dos outros.
4. Mostra o QR do pet para alguém. Quando a pessoa escaneia, os pets viram amigos.
5. No fim do dia, tem a lista de todo mundo que conheceu, com LinkedIn/GitHub.

### O que aparece no telão
- Todos os pets do evento andando juntos.
- Avisos do tipo "o dragão do Miguel ficou amigo da coruja da Ana".
- Ranking dos pets mais populares e a meta coletiva de amizades.

---

## 2. O que é viável em um dia

| Ideia | Viável hoje? | Por quê |
|---|---|---|
| Transformar a foto em um modelo 3D de verdade | **não** | leva de dezenas de segundos a minutos por imagem, custa caro, não sai pixelado e a VPS não tem GPU |
| Foto → IA descreve o pet em JSON ("DNA") → código monta o pet em voxels | **sim** | uma chamada rápida e barata; o visual fica sob nosso controle |
| Rodar modelos de IA na VPS | **não precisa** | a análise da foto roda no OpenRouter; o 3D é desenhado em cada celular |

O DNA do pet é um JSON com nome, espécie (de uma lista fixa), 3 cores tiradas da foto, personalidade e
uma frase. Com campos fechados, o modelo escolhe entre opções e não inventa formatos.

---

## 3. AR: o pet no chão e na mesa

O navegador do celular consegue detectar o chão e a mesa, mas o suporte muda entre Android e iPhone.

| | Android (Chrome) | iPhone (Safari) |
|---|---|---|
| Detectar chão e mesa com o mundo ao vivo | **sim**, com WebXR | **não**, até onde sabemos o Safari não tem WebXR para AR |
| Colocar o próprio pet no chão ou na mesa | sim | **sim**, pelo AR nativo do iOS (Quick Look) |
| Ver os pets dos outros ao vivo na mesa | sim (WebXR) | sim, com um cartão ou pôster deitado na mesa (MindAR) |

### Como fica
- **"Meu pet no chão" (todos os celulares):** o pet é exportado como modelo 3D e mostrado com o
  `<model-viewer>`, do Google. No Android ele usa WebXR; no iPhone, o AR nativo da Apple. Os dois
  detectam a superfície, colocam o pet em tamanho real e deixam tirar foto.
- **"Mundo vivo na sua mesa":** no Android, a pessoa toca na mesa e a arena aparece ali. No iPhone, a
  arena se apoia num cartão impresso deitado na mesa.
- **Reserva:** se não houver nada disso, o giroscópio mostra os pets flutuando ao redor da pessoa.

### Limitação assumida
Dois celulares não veem o mesmo pet no mesmo ponto físico sem um cartão em comum, porque isso exigiria
compartilhar âncoras entre aparelhos. A decisão: **o mundo é um só, mas cada pessoa escolhe a superfície
onde ele aparece.** Todos veem os mesmos pets fazendo as mesmas coisas ao mesmo tempo. Quem está lado a
lado e aponta para o mesmo cartão vê tudo no mesmo lugar.

---

## 4. Como fazer o evento inteiro interagir

### Princípio
**O pet só evolui quando o dono conhece gente pessoalmente.** Assim o jogo empurra as pessoas umas
para as outras.

### Amizade pelo QR, só ao vivo
- Cada pet tem um cartão com QR no celular. Quem escaneia com a câmera normal abre o link, e os dois
  pets viram amigos.
- O QR muda a cada 30 s, então um print mandado no WhatsApp não funciona.
- Interações à distância (emoji, petisco) são leves e despertam curiosidade, mas a amizade só sai no
  encontro.

### O que acontece com mais amizades
| Amigos | Como o pet fica |
|---|---|
| 0 | filhote pequeno e tímido, anda sozinho |
| 1 | cachecol e cresce um pouco |
| 3 | chapéu e aprende a dançar |
| 5 | asas, voa baixinho e deixa rastro de brilho |
| 10 | coroa e fica grande |
| o mais popular | aura dourada e destaque no telão |

- **Pintinhas:** cada amigo deixa uma pintinha com a cor do pet dele. O pet vira um **retrato de quem
  você conheceu**.
- **Itens da espécie do amigo** *(extra)*: dragão dá chifrinhos, coruja dá óculos, robô dá antena.
- **Turma** *(extra)*: três pessoas amigas entre si fazem os pets andarem em grupo, com nome no telão.
- **Meta coletiva:** com 100 amizades no evento, todos os pets dançam; com 300, tem fogos e um item
  para todo mundo. Até quem já tem muitos amigos passa a chamar os outros para jogar.
- **Fim do dia:** o pet mais popular é coroado pet do evento, e cada pessoa fica com a lista de quem
  conheceu.

### Fazer as pessoas entrarem
- **Não contar com adesão espontânea:** todo mundo passa o dia construindo. Pedir aos organizadores
  para projetar o QR no almoço e nos intervalos, e colocar o site no ar cedo para o mundo ir enchendo.
- **Entrada em menos de 15 s:** QR → foto → pet, sem formulário. O nome vem da IA e o LinkedIn fica
  para depois.
- **Painel de admin** para disparar "chuva de petiscos" e "festa", remover nomes ofensivos e colocar
  pets bots se pouca gente entrar.

---

## 5. Infraestrutura

- **A VPS própria aguenta.** Não precisa de uma máquina maior: o 3D é desenhado nos celulares e no
  telão, a IA roda no OpenRouter, e o servidor só repassa mensagens. 150 conexões é pouco.
- **Deploy pelo Dokploy que já roda na VPS.** O Traefik dele cuida do HTTPS (Let's Encrypt) e repassa
  WebSocket sem configuração extra. O app sobe como uma aplicação ligada a este repositório, com deploy
  automático da `main`.
- **HTTPS é obrigatório**, porque o celular só libera a câmera em HTTPS. O domínio `traefik.me` que o
  Dokploy gera sozinho funciona só em HTTP, então **precisamos de um subdomínio próprio** com registro A
  apontando para a VPS.
- **Redeploy reinicia o servidor.** Por isso o mundo é salvo em um volume a cada 5 s, para nenhum pet
  sumir no meio do evento.

### IA via OpenRouter
- Modelo principal `openai/gpt-6-luna`, com `google/gemini-3.1-flash-lite` e
  `anthropic/claude-haiku-5.5` como reserva (catálogo conferido em 23/10/2026). Todos aceitam imagem e
  saída estruturada.
- Custo: menos de US$ 0,001 por pet. Usar uma chave dedicada com limite de crédito.
- Os créditos de API da OpenAI ganhos no check-in **não** são usados pelo OpenRouter, a não ser que a
  chave da OpenAI seja cadastrada lá (BYOK).
- A IA é chamada **só na criação do pet**. Se demorar, o pet aparece como ovo chocando; se falhar, nasce
  com um DNA calculado no próprio celular.

Detalhes, limites e testes estão em [`REGRAS.md`](REGRAS.md).

---

## 6. Divisão do trabalho

| Frente 1: celular e servidor | Frente 2: telão e 3D |
|---|---|
| servidor, WebSocket, deploy e HTTPS | cena Three.js com os pets andando |
| foto → OpenRouter → DNA | gerador de voxels a partir do DNA |
| tela do pet, QR de amizade e "Quem eu conheci" | AR (`<model-viewer>`, WebXR, MindAR) e animações |
| painel de admin | telão com feed, ranking e meta coletiva |

Ordem: provar o AR nos celulares primeiro (é o maior risco); depois foto → pet; depois o mundo em tempo
real e as amizades. **Corte de escopo às 15h.**

---

## 7. Rascunho do pitch

Segue o roteiro do README: problema → demo → por que agora → o que vem depois.

1. **Problema:** em eventos, as pessoas ficam no próprio grupo, e o networking depende de coragem. No
   fim do dia, pouca gente conheceu alguém novo e quase ninguém guarda o contato.
2. **Demo (ao vivo):** pedir para a banca e a plateia escanearem o QR. Em segundos, os pets delas
   surgem no telão. Mostrar uma amizade acontecendo e um pet num celular em cima da mesa da banca.
3. **Por que agora:** modelos de visão ficaram rápidos e baratos (menos de US$ 0,001 por pet) e o AR
   roda no navegador, sem instalar app. Isso dá para usar num evento de 120 pessoas com um dia de
   trabalho.
4. **O que vem depois:** produto para organizadores de eventos e comunidades, com painel de métricas
   de conexões, temas por evento e o pet que continua de um evento para o outro.

---

## 8. Pendências

- [ ] Nome do projeto
- [ ] Trilha (sugestão: Projetos livres, ou Impacto local se o pitch focar em comunidades)
- [ ] Subdomínio com HTTPS apontando para a VPS
- [ ] Celulares de teste: pelo menos um Android com ARCore e um iPhone
- [ ] Imprimir cartões ou pôster para o modo mesa no iPhone (ou usar um notebook ou tablet deitado na mesa)
- [ ] Chave do OpenRouter com limite de crédito
- [ ] Horário do pitch, para ajustar o cronograma e o congelamento de deploy
- [ ] Atualizar a seção "Nosso projeto" do README
