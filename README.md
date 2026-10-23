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

## Nosso projeto

**Desafio:** 10 — Aventura com escolhas e consequências — ideia **Quebra-Gelo**, ver [`docs/QUEBRA-GELO.md`](docs/QUEBRA-GELO.md)
**Nome:** _(a definir)_
**Trilha:** _(a definir entre as quatro acima)_
**Problema:** _(o que dói hoje, para quem)_
**Solução em uma frase:** _(o que o protótipo faz)_
**Demo:** _(link do vídeo, deploy ou instruções para rodar)_

> Substituir os campos acima ainda hoje — o pitch começa por eles.

## Como rodar

```bash
npm install          # na rede do evento o registro oficial falha: use --registry=https://registry.npmmirror.com
npm run dev          # http://localhost:3000 (servidor + Vite na mesma porta)
npm test             # garante que os 3 finais são alcançáveis
```

- `/` cria o pet e joga; `/demo` mostra os pets de exemplo com código e QR.
- Produção: `docker build` com o `Dockerfile` (Dokploy), volume em `/data`, healthcheck em `/health`.

## Estrutura do repositório

```
.
├── README.md        este arquivo
├── docs/            decisões, pesquisa, roteiro do pitch
├── src/             código do protótipo
└── .env.example     modelo de variáveis (sem segredos)
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
