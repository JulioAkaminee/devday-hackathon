# Pets do evento (assets)

Os 10 pets do Quebra-Gelo em **voxel 3D**, feitos a partir da referência
[`docs/referencias/pets-do-evento-v1.png`](../../docs/referencias/pets-do-evento-v1.png). Os modelos são
gerados por código: não há arquivo de modelagem externo para manter.

| | Pet | Personalidade | Voxels | Tamanho (L × A × P) |
|---|---|---|---|---|
| <img src="png/xicara.png" width="72"> | **01 Xícara** | Curioso e sempre puxa assunto. | 2.378 | 20 × 24 × 12 |
| <img src="png/caderninho.png" width="72"> | **02 Caderninho** | Organizado e adora trocar ideias. | 1.241 | 19 × 19 × 6 |
| <img src="png/laptopinho.png" width="72"> | **03 Laptopinho** | Criativo e sempre tem um projeto. | 908 | 19 × 18 × 10 |
| <img src="png/plantinha.png" width="72"> | **04 Plantinha** | Tranquila e faz conexões inesperadas. | 2.096 | 17 × 25 × 16 |
| <img src="png/lampada.png" width="72"> | **05 Lâmpada** | Cheio de ideias e energia. | 1.668 | 21 × 24 × 13 |
| <img src="png/coracao.png" width="72"> | **06 Coração** | Empático e sempre escuta de verdade. | 1.600 | 19 × 20 × 10 |
| <img src="png/globinho.png" width="72"> | **07 Globinho** | Adora gente de todas as áreas. | 2.091 | 19 × 19 × 18 |
| <img src="png/estrelinha.png" width="72"> | **08 Estrelinha** | Animado e sempre incentiva os outros. | 914 | 17 × 20 × 11 |
| <img src="png/conezinho.png" width="72"> | **09 Conezinho** | Direto e ajuda a focar no objetivo. | 1.391 | 15 × 22 × 16 |
| <img src="png/nuvem.png" width="72"> | **10 Nuvem** | Observador e sempre vê o lado diferente. | 1.499 | 17 × 20 × 15 |

## Arquivos

| Arquivo | O que é |
|---|---|
| `especies.js` | **Fonte da verdade.** A paleta e a construção de cada pet, voxel a voxel |
| `voxel.js` | Ferramentas de modelagem (caixa, esfera, cilindro, extrusão, desenhar o rosto…), sem dependências |
| `malha.js` | Transforma os dados em malha Three.js (só as faces visíveis, com sombreamento nos cantos) e anima |
| `index.html` | Galeria para ver, girar, animar e baixar cada pet |
| `json/<id>.json` | Os dados de cada pet, prontos para o jogo carregar sem rodar `especies.js` |
| `png/<id>.png` | Imagem 1024 × 1024 com fundo transparente, para README, slides e vídeo |
| `exportar.mjs` | Regenera a pasta `json/` |

## Ver a galeria

Os módulos JavaScript só carregam por HTTP, então é preciso servir a pasta:

```bash
cd assets/pets && python3 -m http.server 8765
# abra http://localhost:8765
```

Na galeria, passar o mouse faz o pet comemorar. Clicar abre o detalhe, que tem:
- vistas de 3/4, frente, lado, costas e de cima;
- as 5 animações;
- liga e desliga dos acessórios;
- paleta, ficha técnica e download de PNG e JSON.

O Three.js vem da CDN (jsDelivr), então a página precisa de internet.

## Usar no jogo

```js
import { gerarPet } from './assets/pets/especies.js';
import { criarPet3D, animarPet, mostrarParte } from './assets/pets/malha.js';

const pet = criarPet3D(gerarPet('xicara')); // ou: criarPet3D(await (await fetch('json/xicara.json')).json())
pet.raiz.scale.setScalar(0.1);              // 1 voxel = 1 unidade; ajuste ao tamanho do mundo
cena.add(pet.raiz);

// a cada quadro
animarPet(pet, relogio.getElapsedTime(), 'andar'); // parado | andar | pular | acenar | comemorar
pet.raiz.rotation.y = direcao;

mostrarParte(pet, 'mochila', false);               // acessórios podem ser escondidos
```

`malha.js` também exporta `criarEstudio()` (luzes e sombra da galeria), `enquadrar()` (câmera) e
`configurarRenderizador()`.

## Formato dos dados (`json/<id>.json`)

```jsonc
{
  "id": "xicara", "numero": 1, "nome": "Xícara", "personalidade": "...",
  "animacao": "acenar",            // animação padrão na galeria
  "pose": { "bracoD": 0.45 },      // ângulo de repouso dos braços (radianos), quando houver
  "paleta": ["#f6f3ec", "#3ee07f*", ...], // '*' = voxel que brilha (não recebe luz)
  "limites": { "min": [x, y, z], "max": [x, y, z] },
  "tamanho": [largura, altura, profundidade],
  "totalVoxels": 2378,
  "partes": [
    { "nome": "corpo",  "tipo": "corpo", "pai": "raiz",  "pivo": [7, 3, 6], "voxels": [[x, y, z, corDaPaleta], ...] },
    { "nome": "bracoD", "tipo": "braco", "pai": "corpo", "pivo": [14.5, 10.5, 6], "lado": "D", "levantar": 2.4, "voxels": [...] }
  ],
  "ancoras": { "cabeca": [x, y, z], "rosto": [...], "costas": [...] }
}
```

- **Coordenadas:** y para cima, a frente olha para +z, e a esquerda de quem olha é −x.
- **Partes:**
  - `corpo` é a parte principal;
  - `braco` e `perna` são as partes animadas;
  - `item` é um acessório preso a outra parte, como mochila, óculos, boina, caneta ou folhas;
  - `flutuante` balança sozinho, como o vapor ou os brilhos.
- **Pivô:** cada parte gira em torno do próprio `pivo`, no espaço do modelo.
- **Âncoras:** pontos para prender itens novos, como os itens das barras (crachás, coraçãozinho, capa).

## Editar ou criar um pet

1. Altere ou acrescente uma entrada em `PETS`, no arquivo `especies.js`. As funções de rosto
   (`olhosFelizes`, `olhosOvais`, `bochechas`), de membros (`braco`, `pernas`) e a `mochila` já estão
   prontas.
2. Rode `node assets/pets/exportar.mjs` para atualizar `json/`.
3. Confira na galeria e baixe o PNG pelo botão do detalhe.

## Diferenças em relação à referência

- **Marca:** o logo da OpenAI que aparece no Caderninho e no Laptopinho foi trocado pela marca do
  Quebra-Gelo (um cristal de gelo azul), porque o evento é não oficial.
- **Texto:** "Oriativo" virou "Criativo".
- **Nome:** a caneca se chama **Xícara**, como na referência dos pets. No mapa da aventura ela aparece
  como "Xícaro".
