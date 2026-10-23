# AGENTS.md — leia antes de mexer

Briefing para quem chega no repositório (Julio e o agente dele, ou qualquer agente novo).
Atualizado em 23/10/2026. Branch de trabalho: **`mvp`**. A `main` ainda está no commit inicial (tarefa F1).

## O que é

**Quebra-Gelo**, para o OpenAI DevDay Community Hackathon São Paulo. Cumpre dois desafios:

- **nº 10, Aventura:** cada pessoa cria um pet e vive 4 Missões. Toda Missão começa quando ela
  **encontra outra pessoa de verdade** (código de 4 letras ou QR). A escolha mexe em
  **Alcance** (+2) ou **Profundidade** (+2), e isso leva a um de 3 finais.
- **nº 4, Academia:** 5 perguntas de diagnóstico geram uma trilha nas habilidades
  Abordar, Escutar e Conectar, com a mais fraca primeiro e 3 atividades em cada uma.
  A trilha indica qual Missão treina a habilidade fraca.

Regra principal: **interação entre pessoas**. Nada avança sozinho.

Entrega **até 16h**: vídeo de até 3 min, repositório, URL pública e formulário.

## Onde está cada coisa

| Precisa de | Leia |
|---|---|
| Ideia, decisões D1–D7, regras dos finais | `docs/QUEBRA-GELO.md` |
| Tarefas por frente, contratos, status | `docs/PLANO.md` |
| Textos da Aventura | `docs/HISTORIA.md` → código em `src/shared/story.ts` |
| Perguntas da Academia | `docs/ACADEMIA.md` → código em `src/shared/academia.ts` |
| Referência visual (manda no visual) | `docs/referencias/*.png` |

## Código

```
src/shared/engine.ts     motor puro da Aventura (estado, ação) → estado   + engine.test.ts
src/shared/academia.ts   motor puro da Academia                            + academia.test.ts
src/shared/story.ts      espécies, acessórios, temas, textos, finais
src/server/index.ts      Express: API, pets de exemplo, snapshot em data/mundo.json
src/client/main.ts       telas (criação, topo, cartão da Missão, abas, Academia, modal Escanear)
src/client/world.ts      cena Three.js: 5 ilhas, viagem do pet, zonas de escolha, final
src/client/pet.ts        pets voxel (PETS), acessórios, itens; criarPet(dna, itens)
src/client/style.css     tokens em :root (verde/preto/creme) + layout celular/computador
```

Rodar: `npm install` (se a rede do evento travar: `--registry=https://registry.npmmirror.com`),
depois `npm run dev`, que sobe em http://localhost:3000. A página `/demo` traz os pets de exemplo
(códigos XICA, CADE, LAMP, CORA, GLOB, CONE e NUVE).

Antes de commitar: `npx tsc --noEmit`, depois `npm test` e por fim `npm run build`.

## Contratos (não quebre sem combinar)

- **Tokens visuais** só em `:root` de `style.css`. O resto do CSS usa `var(--...)`.
- **`criarPet(dna, itens)`** devolve um `THREE.Group`. Para um pet novo:
  1. acrescente a entrada em `PETS` (`pet.ts`);
  2. acrescente a espécie em `ESPECIES`, `NOMES_ESPECIE`, `PERSONALIDADE` e `COR_ESPECIE` (`story.ts`).
- **`FASES[0..4]`** em `world.ts`: cada ilha tem `montar` (arte) e `zonas` (onde o pet escolhe).
  Se mudar a arte, mantenha as zonas.
- **API:** todas as rotas recebem `x-token` e devolvem a mesma `visao`
  (pet, estado, amigo, conhecidos, sugestões, academia).
- **Engines puras:** nada de DOM, rede ou `Date.now` em `src/shared`. Toda regra nova ganha um teste.

## Regras do time

- Commits em português, no imperativo, pequenos, **sem trailer de IA**. Faça `git fetch` antes de
  `git push`.
- Nunca commitar `.env` nem chave. A chave da OpenAI fica só no servidor.
- Celular e computador com **a mesma qualidade**: alvos de 44 px e o layout de `PLANO.md` §4.
- Decisão não tomada vira **ABERTA** no doc; nunca suponha.

## Status agora

Pronto e testado:

- Aventura completa: 4 Missões e 3 finais. O encontro é mútuo, com aviso "X te encontrou!" e
  retomada por capítulo.
- Academia completa (K1–K6).
- 10 pets voxel.
- Mapa de ilhas.
- UI nova.
- Dockerfile.

Testes: 9 de 9 passando.

Próximo:

| Tarefa | O que é | Quem |
|---|---|---|
| F1 | juntar o trabalho na `main` | Miguel |
| F2 | deploy no Dokploy com HTTPS | Miguel |
| F3 | conferir a paridade entre celular e computador | — |
| I1–I3 | pergunta quebra-gelo e epílogo pela API da OpenAI, com plano B | — |
| V1/V4/V5 | refinar identidade, arte das ilhas e UI | **Julio** |
| E1–E4 | ensaio, vídeo, README e formulário | os dois |

Para o Julio: o visual já segue as suas referências, então ajuste direto no código.

- Cores e fontes: `style.css`.
- Arte das ilhas: `world.ts`, em `FASES[i].montar`.
- Pets: `pet.ts`, em `PETS`.

Mudou algo grande? Anote em `docs/PLANO.md`.
