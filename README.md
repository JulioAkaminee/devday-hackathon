# DevDay Exchange Community Hackathon — São Paulo

Repositório do nosso time no **DevDay Exchange Community Hackathon: São Paulo** (23/10/2026).

> Evento **não oficial**, liderado pela comunidade e organizado pelos **Codex Ambassadors Brasil** —
> extensão local do DevDay Exchange.

---

## Sobre o evento

| | |
|---|---|
| **Data** | 23 de outubro de 2026 (sexta) |
| **Horário** | 8h às 18h (BRT, UTC−3) |
| **Local** | Universidade Anhembi Morumbi — **Biblioteca**, Mooca |
| **Endereço** | R. Dr. Almeida Lima, 1134 — Mooca, São Paulo/SP, 03101-001 |
| **Vagas** | 120 participantes (com aprovação dos organizadores) |
| **Organização** | Codex Ambassadors Brasil — Marcelo Okano, Matheus Pagani e Laura Napoles |
| **Parceiros** | Vibe Space · Universidade Anhembi Morumbi |
| **Hashtag** | `#DevDayCommunity` |

**Formato:** um dia de construção prática em equipes, com mentoria, troca de ideias, demonstrações e
pitches avaliados por uma banca de jurados.

Fonte oficial: <https://luma.com/openai-hackathon-sp>

## Trilhas

1. **Produtividade e trabalho**
2. **Educação e inclusão**
3. **Impacto local**
4. **Projetos livres**

## Premiação

| Colocação | Prêmio |
|---|---|
| 1º lugar | US$ 1.000 em créditos de Codex |
| 2º lugar | US$ 500 em créditos de Codex |
| 3º lugar | US$ 250 em créditos de Codex |

Os integrantes das três equipes melhores colocadas recebem **12 meses de ChatGPT Pro**.
Participantes elegíveis que fizerem check-in recebem **US$ 100 em créditos Codex + US$ 50 em créditos API**,
conforme as regras do programa.

---

## Nosso projeto: Quebra-Gelo

**Problema:** num evento cheio de gente, a maioria conversa só com quem já conhece. Quem chega sozinho
não sabe puxar assunto, e quem puxa costuma ficar no "oi, tudo bem" e não lembra de ninguém depois.

**Solução:** um pet virtual que só avança na história quando você conversa com uma pessoa de verdade.
Você mostra o código do seu pet, a outra pessoa digita (ou lê o QR), e o encontro vira um capítulo.
Como você conduz cada conversa decide o final.

**Trilha do evento:** Educação e inclusão. A Academia ensina networking (diagnóstico, trilha e
atividades com explicação), e a Aventura põe em prática com gente de verdade. É feito para quem chega
sozinho: roda no navegador do celular sem instalar nada, tem caminho sem câmera (digitar o código) e
respeita a preferência do sistema por menos movimento.

**Demo:** <https://quebra-gelo.julioakamine.com> · pets de exemplo em `/demo` · telão do evento em `/tela`

### Desafios que o projeto cumpre

| Desafio | Pedido | Onde está |
|---|---|---|
| **nº 10 · Aventura com escolhas e consequências** | história interativa, duas características, progresso salvo, dois caminhos com finais diferentes | 4 Missões, cada uma com uma decisão. **Papo rápido** soma **Alcance**; **ir a fundo** soma **Profundidade**. As duas barras ficam no topo. Ao fim, 3 finais: Time dos Sonhos, Colecionador de Crachás e Amigo de Um Só. O progresso fica salvo no servidor; no final, "Tente o outro caminho" volta a uma missão já jogada |
| **nº 4 · Trilha de estudo personalizada** | 5 questões diagnósticas, trilha pelos resultados, atividades com explicação, progresso | Aba **Academia**. O diagnóstico no Credenciamento mede Abordar, Escutar e Conectar. A trilha começa pela habilidade mais fraca, e cada atividade explica a resposta. A Missão que treina a habilidade fraca vem indicada no cartão |

**Banco de questões:** o desafio nº 4 prevê um banco fornecido pela organização. Como ele não veio,
escrevemos o nosso, sobre networking em eventos: [`docs/ACADEMIA.md`](docs/ACADEMIA.md).

### Como jogar

1. Crie o pet: espécie, acessório, nomes, área, o que você oferece e o que procura.
2. Responda as 5 perguntas do Credenciamento. Elas montam sua trilha na Academia.
3. Em cada Missão, encontre alguém: digite o código de 4 letras do pet da pessoa ou leia o QR.
   O cartão sugere quem procurar.
4. Escolha como conversar. A consequência aparece na história e nas barras.
5. Na Missão 4, reencontre um contato. As suas escolhas decidem o final no Palco DevDay.

Sem ninguém por perto, `/demo` mostra pets de exemplo com código e QR. O telão em `/tela` traz o QR
de entrada e os números da sala ao vivo: pessoas com pet, encontros entre gente de verdade e quantos
chegaram a um final.

### Tecnologia

Vite, TypeScript e Three.js (mundo e pets em voxel), Express no servidor, motion para animações de
interface. O motor do jogo é uma função pura `(estado, ação) → estado` em `src/shared/`, com testes que
provam os 3 finais e duas trilhas diferentes para dois perfis.

## Como rodar

```bash
npm install          # na rede do evento o registro oficial falha: use --registry=https://registry.npmmirror.com
npm run dev          # http://localhost:3000 (servidor + Vite na mesma porta)
npm test             # os 3 finais da Aventura e as trilhas da Academia
```

- `/` cria o pet e joga; `/demo` mostra os pets de exemplo com código e QR.
- Produção: `Dockerfile` (Dokploy), volume em `/data`, healthcheck em `/health`, variáveis em
  `.env.example`. HTTPS é obrigatório para a câmera do celular ler o QR.

## Estrutura do repositório

```
.
├── README.md          este arquivo
├── docs/              ideia, história, Academia, plano, auditoria e entrega
├── assets/pets/       os 10 pets em voxel: espécies, malha, galeria e PNGs
├── src/shared/        motores puros da Aventura e da Academia (com testes)
├── src/client/        telas, mundo 3D, pets, estilo
├── src/server/        API, snapshot, telão
└── .env.example       modelo de variáveis (sem segredos)
```

Regras do repo: **nada de segredo comitado** (`.env`, chaves, tokens), commits pequenos e mensagem no
imperativo, e o README atualizado antes de cada demo.

## Equipe

| Nome | GitHub |
|---|---|
| Julio Akamine | [@JulioAkaminee](https://github.com/JulioAkaminee) |
| Miguel Souza | [@miguelvzs](https://github.com/miguelvzs) |

## Checklist do dia

- [ ] Check-in feito (garante os créditos de Codex e API)
- [ ] Trilha escolhida e registrada
- [ ] Problema e solução em uma frase no README
- [ ] Protótipo rodando de ponta a ponta (mesmo que feio)
- [ ] Demo de 3 minutos ensaiada
- [ ] Pitch com: problema → demo → por que agora → o que vem depois
- [ ] Repositório público ou compartilhado com a banca, se pedido

---

<sub>As informações do evento acima vêm da página oficial no Luma (link nesta página). Regras de submissão,
critérios de julgamento e horários internos são definidos pelos organizadores no dia.</sub>
