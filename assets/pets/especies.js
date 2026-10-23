/**
 * Os 10 pets do evento, modelados em voxel a partir de docs/referencias/pets-do-evento-v1.png.
 *
 * Cada pet tem: id, numero, nome, personalidade, animacao (a animação padrão na galeria),
 * pose (ângulo de repouso dos braços, em radianos) e construir(m), que monta o modelo.
 * Use gerarPet(id) para obter os dados prontos (o mesmo formato salvo em json/).
 */
import { Modelo, ruido } from './voxel.js';

export const CORES = {
  tinta: '#1f2024',
  brilhoOlho: '#ffffff',
  bochecha: '#ff8ea6',
  lingua: '#ef5d6c',
  branco: '#f6f3ec',
  brancoSombra: '#e4ddcf',
  verde: '#2bb24c',
  verdeEscuro: '#1d8a3a',
  verdeClaro: '#69d067',
  azul: '#2f6be3',
  azulEscuro: '#1f4fb5',
  azulCeu: '#4b92ff',
  azulCeuClaro: '#8cbcff',
  azulCeuEscuro: '#3576e6',
  amarelo: '#ffd43b',
  amareloClaro: '#fff1a3',
  amareloEscuro: '#f0b20c',
  rosa: '#ff3f8f',
  rosaClaro: '#ff8bbd',
  rosaEscuro: '#d92a74',
  laranja: '#ff5631',
  laranjaEscuro: '#d63f1f',
  cinza: '#cfd3d8',
  cinzaEscuro: '#a2a9b1',
  grafite: '#3b4048',
  grafiteClaro: '#535a64',
  tela: '#14171c',
  telaVerde: '#3ee07f*',
  cafe: '#5a3725',
  creme: '#d9b48c',
  terra: '#5b3b27',
  vapor: '#f2ecdf',
  mochila: '#27282d',
  mochilaBolso: '#41444c',
  ziper: '#80858f',
  gelo: '#73cff2',
  brilho: '#ffe45e*',
  lente: '#17181b',
  lenteBrilho: '#626a77',
  rosca: '#2e3035',
  roscaClara: '#4b4e55',
  continente: '#3cc05a',
  continenteEscuro: '#2a9e47',
  oceano: '#2f6fe4',
  oceanoClaro: '#5f95f2',
  pernaGlobo: '#33415a',
};

const C = CORES;

// ---------------------------------------------------------------------------------------------
// Ajudantes de forma e de rosto

const normalizar = ([x, y, z]) => {
  const d = Math.hypot(x, y, z) || 1;
  return [x / d, y / d, z / d];
};

function dentroPoligono(x, y, vertices) {
  let dentro = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const [xi, yi] = vertices[i], [xj, yj] = vertices[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
}

/** Clareia a superfície de um corpo redondo do lado de onde vem a luz. */
function realce(m, [cx, cy, cz], raio, corBase, corClara, limiar = 0.86) {
  const luz = normalizar([-0.45, 0.65, 0.62]);
  m.pintar((x, y, z, cor) => {
    if (cor !== corBase) return;
    const d = [x + 0.5 - cx, y + 0.5 - cy, z + 0.5 - cz];
    const dist = Math.hypot(...d);
    if (dist < raio - 1.6) return;
    if ((d[0] * luz[0] + d[1] * luz[1] + d[2] * luz[2]) / dist > limiar) return corClara;
  });
}

/** Olhos fechados de alegria (^ ^), 4×2 cada. */
function olhosFelizes(m, xE, xD, y) {
  for (const x of [xE, xD]) m.desenhar(['.KK.', 'K..K'], x, y + 1, { K: C.tinta });
}

/** Olhos abertos 2×altura, com um ponto de brilho no canto de cima. */
function olhosOvais(m, xE, xD, yTopo, altura = 3) {
  const linhas = Array.from({ length: altura }, (_, i) => (i === 0 ? 'BK' : 'KK'));
  for (const x of [xE, xD]) m.desenhar(linhas, x, yTopo, { K: C.tinta, B: C.brilhoOlho });
}

function bochechas(m, xE, xD, y) {
  for (const x of [xE, xD]) m.desenhar(['BB'], x, y, { B: C.bochecha });
}

/** Braço pendurado; o pivô fica no ombro, junto ao corpo. */
function braco(m, lado, { x0, yTopo, comprimento = 5, largura = 2, z0, prof = 2, cor, corMao, levantar = 2.4 }) {
  const x1 = x0 + largura - 1, z1 = z0 + prof - 1, yBase = yTopo - comprimento + 1;
  const pivoX = lado === 'D' ? x0 + 0.5 : x1 + 0.5;
  m.parte(`braco${lado}`, { tipo: 'braco', lado, pai: 'corpo', pivo: [pivoX, yTopo + 0.5, (z0 + z1 + 1) / 2], levantar });
  m.caixa(x0, yBase, z0, x1, yTopo, z1, cor);
  if (corMao) m.caixa(x0, yBase, z0, x1, yBase + 1, z1, corMao);
}

/** Duas pernas presas à raiz (não acompanham o balanço do corpo). */
function pernas(m, { xE, xD, largura = 3, altura = 3, z0, z1, cor }) {
  for (const [lado, x0] of [['E', xE], ['D', xD]]) {
    const x1 = x0 + largura - 1;
    m.parte(`perna${lado}`, { tipo: 'perna', lado, pai: 'raiz', pivo: [(x0 + x1 + 1) / 2, altura, (z0 + z1 + 1) / 2] });
    m.caixa(x0, 0, z0, x1, altura - 1, z1, cor);
  }
}

/** Mochila nas costas: corpo arredondado, bolso e alça de mão. `zFrente` é a camada encostada no pet. */
function mochila(m, { x0, x1, y0, y1, zFrente, prof = 3, pivo, frentePorAltura }) {
  m.parte('mochila', { tipo: 'item', pai: 'corpo', pivo });
  for (let y = y0; y <= y1; y++) {
    const zf = frentePorAltura ? frentePorAltura(y) : zFrente;
    const z0 = zf - prof + 1;
    for (let x = x0; x <= x1; x++) {
      for (let z = z0; z <= zf; z++) {
        const quina = (x === x0 || x === x1) && (z === z0 || y === y0 || y === y1);
        if (!quina) m.set(x, y, z, C.mochila);
      }
    }
    const topoBolso = y0 + Math.floor((y1 - y0) / 2);
    if (y <= topoBolso) {
      for (let x = x0 + 1; x <= x1 - 1; x++) m.set(x, y, z0 - 1, y === topoBolso ? C.ziper : C.mochilaBolso);
    }
  }
  const zTopo = (frentePorAltura ? frentePorAltura(y1) : zFrente) - 1;
  const meio = Math.floor((x0 + x1) / 2);
  for (const x of [meio - 1, meio, meio + 1]) m.set(x, y1 + 1, zTopo, C.mochila);
}

// ---------------------------------------------------------------------------------------------
// Os pets

export const PETS = [
  {
    id: 'xicara',
    numero: 1,
    nome: 'Xícara',
    personalidade: 'Curioso e sempre puxa assunto.',
    animacao: 'acenar',
    construir(m) {
      m.parte('corpo', { pivo: [7, 3, 6] });
      m.caixaArredondada(0, 3, 0, 13, 16, 11, 3, C.branco);
      // boca da caneca com café e um coraçãozinho de espuma
      m.caixaArredondada(1, 16, 1, 12, 16, 10, 2, null);
      m.caixaArredondada(1, 15, 1, 12, 15, 10, 2, C.cafe);
      const coracao = { 4: [4, 5, 8, 9], 5: [4, 5, 6, 7, 8, 9], 6: [5, 6, 7, 8], 7: [6, 7] };
      for (const [z, xs] of Object.entries(coracao)) for (const x of xs) m.set(x, 15, Number(z), C.creme);
      // faixa verde na base
      m.pintar((x, y, z, cor) => (y <= 6 && cor === C.branco ? C.verde : undefined));
      // alça
      m.caixa(-2, 13, 4, -1, 14, 7, C.verde);
      m.caixa(-2, 6, 4, -1, 7, 7, C.verde);
      m.caixa(-4, 6, 4, -3, 14, 7, C.verde);
      for (let z = 4; z <= 7; z++) m.set(-4, 6, z, null).set(-4, 14, z, null);
      // rosto
      olhosFelizes(m, 2, 8, 12);
      m.desenhar(['KKKK', 'KLLK', '.KK.'], 5, 10, { K: C.tinta, L: C.lingua });
      bochechas(m, 1, 11, 10);
      // estampa </> na faixa verde
      m.desenhar(['.W...W.W.', 'W...W...W', '.W.W...W.'], 3, 6, { W: C.branco });
      braco(m, 'D', { x0: 14, yTopo: 10, comprimento: 5, z0: 5, cor: C.verde, corMao: C.branco });
      pernas(m, { xE: 3, xD: 8, z0: 4, z1: 7, cor: C.tinta });
      // vapor do café
      m.parte('vapor', { tipo: 'flutuante', pai: 'raiz', pivo: [7.5, 20, 6.5] });
      for (const [x, y, z] of [[7, 19, 6], [6, 19, 6], [8, 19, 6], [7, 18, 6], [7, 20, 6], [7, 19, 5], [7, 19, 7], [8, 22, 6], [8, 23, 6], [9, 23, 6]]) {
        m.set(x, y, z, C.vapor);
      }
      m.ancora('cabeca', [7, 17, 6]).ancora('rosto', [7, 11, 12]).ancora('costas', [7, 10, 0]).ancora('maoD', [15, 6, 6]);
    },
  },
  {
    id: 'caderninho',
    numero: 2,
    nome: 'Caderninho',
    personalidade: 'Organizado e adora trocar ideias.',
    animacao: 'parado',
    pose: { bracoD: 0.45 },
    construir(m) {
      m.parte('corpo', { pivo: [6.5, 3, 2.5] });
      m.caixa(0, 3, 0, 12, 18, 0, C.azul);
      m.caixa(0, 3, 4, 12, 18, 4, C.azul);
      m.caixa(0, 3, 1, 12, 18, 3, (x, y, z) => (z === 2 ? C.brancoSombra : C.branco));
      // espiral
      for (let y = 5; y <= 17; y += 2) {
        for (let z = 0; z <= 4; z++) m.set(-1, y, z, C.grafite);
        for (let z = 1; z <= 3; z++) m.set(-2, y, z, C.grafite);
      }
      // rosto
      olhosOvais(m, 3, 8, 14);
      bochechas(m, 1, 10, 11);
      m.desenhar(['KKK', 'KLK'], 5, 11, { K: C.tinta, L: C.lingua });
      // etiqueta com a marca do Quebra-Gelo
      m.desenhar(['WWWWW', 'WWIWW', 'WIIIW', 'WWIWW', 'WWWWW'], 4, 8, { W: C.branco, I: C.gelo }, { relevo: 1 });
      // braço com a caneta
      braco(m, 'D', { x0: 13, yTopo: 11, comprimento: 5, z0: 1, prof: 3, cor: C.azul, corMao: C.azulEscuro, levantar: 1.4 });
      m.parte('caneta', { tipo: 'item', pai: 'bracoD', pivo: [15, 8, 2.5] });
      m.caixa(15, 5, 2, 16, 5, 3, C.verdeEscuro);
      m.caixa(15, 6, 2, 16, 11, 3, C.verde);
      m.caixa(15, 12, 2, 16, 12, 3, C.branco);
      m.caixa(15, 13, 2, 16, 13, 3, C.verdeEscuro);
      pernas(m, { xE: 3, xD: 7, z0: 1, z1: 3, cor: C.azulEscuro });
      m.ancora('cabeca', [6.5, 19, 2.5]).ancora('rosto', [6.5, 12, 5]).ancora('costas', [6.5, 10, 0]).ancora('maoD', [14, 7, 2.5]);
    },
  },
  {
    id: 'laptopinho',
    numero: 3,
    nome: 'Laptopinho',
    personalidade: 'Criativo e sempre tem um projeto.',
    animacao: 'parado',
    construir(m) {
      m.parte('corpo', { pivo: [7.5, 4, 5.5] });
      // base com teclado e touchpad
      m.caixa(0, 4, 1, 14, 6, 10, C.cinza);
      m.pintar((x, y, z) => {
        if (y !== 6 || x < 1 || x > 13) return;
        if (z >= 3 && z <= 5) return (x + z) % 2 ? C.grafite : C.grafiteClaro;
        if (z >= 7 && z <= 8 && x >= 5 && x <= 9) return C.cinzaEscuro;
      });
      m.desenhar(['.I.', 'III', '.I.'], 6, 6, { I: C.gelo });
      // tampa com a tela
      m.caixa(0, 7, 1, 14, 17, 2, C.cinza);
      m.caixa(1, 8, 2, 13, 16, 2, C.tela);
      m.desenhar(['.GG.', 'G..G'], 2, 14, { G: C.telaVerde });
      m.desenhar(['.GG.', 'G..G'], 9, 14, { G: C.telaVerde });
      m.set(13, 17, 2, C.telaVerde);
      // marca do Quebra-Gelo atrás da tampa
      for (const [x, y] of [[7, 13], [6, 12], [7, 12], [8, 12], [7, 11]]) m.set(x, y, 1, C.gelo);
      braco(m, 'E', { x0: -2, yTopo: 6, comprimento: 4, z0: 5, cor: C.cinza, corMao: C.cinzaEscuro });
      braco(m, 'D', { x0: 15, yTopo: 6, comprimento: 4, z0: 5, cor: C.cinza, corMao: C.cinzaEscuro });
      pernas(m, { xE: 3, xD: 9, altura: 4, z0: 4, z1: 7, cor: C.tinta });
      m.ancora('cabeca', [7.5, 18, 1.5]).ancora('rosto', [7.5, 13, 3]).ancora('costas', [7.5, 12, 0]);
    },
  },
  {
    id: 'plantinha',
    numero: 4,
    nome: 'Plantinha',
    personalidade: 'Tranquila e faz conexões inesperadas.',
    animacao: 'parado',
    construir(m) {
      m.parte('corpo', { pivo: [6.5, 3, 5.5] });
      m.caixaArredondada(1, 3, 1, 11, 4, 9, 2.5, C.branco);
      m.caixaArredondada(0, 5, 0, 12, 11, 10, 3, C.branco);
      m.caixaArredondada(-1, 12, -1, 13, 13, 11, 3.5, C.branco);
      m.caixaArredondada(0, 13, 0, 12, 13, 10, 3, C.terra);
      m.pintar((x, y, z, cor) => (y === 12 && cor === C.branco ? C.brancoSombra : undefined));
      // rosto
      olhosOvais(m, 3, 8, 9);
      m.desenhar(['K.K', '.K.'], 5, 6, { K: C.tinta });
      bochechas(m, 1, 10, 6);
      // folhas (parte própria, para balançar)
      m.parte('folhas', { tipo: 'item', pai: 'corpo', pivo: [6.5, 14, 5.5] });
      m.cilindro(6.5, 5.5, 1.2, 14, 16, C.verdeEscuro);
      const folha = (cx, cy, cz, comp, larg, giroZ, giroY = 0) => m.elipsoide(cx, cy, cz, comp, larg, 1.3, C.verde, { giroZ, giroY });
      folha(6.5, 20.4, 5.5, 4.2, 2.2, Math.PI / 2);
      folha(3.2, 18.6, 5.5, 4.0, 2.0, Math.PI * 0.78);
      folha(9.8, 18.6, 5.5, 4.0, 2.0, Math.PI * 0.22);
      folha(4.6, 18.0, 8.3, 3.6, 1.9, Math.PI * 0.7, 0.9);
      folha(8.4, 18.0, 8.3, 3.6, 1.9, Math.PI * 0.3, -0.9);
      folha(4.6, 18.0, 2.7, 3.6, 1.9, Math.PI * 0.7, -0.9);
      folha(8.4, 18.0, 2.7, 3.6, 1.9, Math.PI * 0.3, 0.9);
      folha(1.0, 15.6, 5.5, 3.2, 1.7, Math.PI * 0.93);
      folha(12.0, 15.6, 5.5, 3.2, 1.7, Math.PI * 0.07);
      m.pintar((x, y, z, cor) => {
        if (cor === C.verdeEscuro) return;
        const n = ruido(x, y, z, 7);
        if (!m.ocupado(x, y + 1, z, 'folhas') && n < 0.55) return C.verdeClaro;
        if (y <= 16 || n > 0.8) return C.verdeEscuro;
      }, 'folhas');
      mochila(m, { x0: 3, x1: 9, y0: 5, y1: 10, zFrente: -1, pivo: [6.5, 8, -1] });
      braco(m, 'E', { x0: -2, yTopo: 9, comprimento: 4, z0: 5, cor: C.verde, corMao: C.verdeClaro });
      braco(m, 'D', { x0: 13, yTopo: 9, comprimento: 4, z0: 5, cor: C.verde, corMao: C.verdeClaro });
      pernas(m, { xE: 2, xD: 8, z0: 4, z1: 7, cor: C.verdeEscuro });
      m.ancora('cabeca', [6.5, 24, 5.5]).ancora('rosto', [6.5, 8, 11]).ancora('costas', [6.5, 8, -1]);
    },
  },
  {
    id: 'lampada',
    numero: 5,
    nome: 'Lâmpada',
    personalidade: 'Cheio de ideias e energia.',
    animacao: 'parado',
    construir(m) {
      m.parte('corpo', { pivo: [6.5, 3, 6.5] });
      m.cilindro(6.5, 6.5, 4.4, 3, 7, (x, y) => (y % 2 ? C.roscaClara : C.rosca));
      m.cilindro(6.5, 6.5, 4.3, 8, 9, C.amarelo);
      m.esfera(6.5, 14.6, 6.5, 6.6, C.amarelo);
      realce(m, [6.5, 14.6, 6.5], 6.6, C.amarelo, C.amareloClaro, 0.93);
      olhosOvais(m, 3, 8, 15);
      braco(m, 'E', { x0: -1, yTopo: 11, comprimento: 5, z0: 6, cor: C.amarelo, corMao: C.amareloEscuro });
      braco(m, 'D', { x0: 12, yTopo: 11, comprimento: 5, z0: 6, cor: C.amarelo, corMao: C.amareloEscuro });
      pernas(m, { xE: 3, xD: 7, z0: 5, z1: 7, cor: C.amarelo });
      m.parte('brilhos', { tipo: 'flutuante', pai: 'raiz', pivo: [6.5, 17, 6.5] });
      for (const [x, y, z, t] of [[-4, 18, 6, 2], [-1, 22, 5, 1], [14, 19, 7, 2], [12, 23, 5, 1], [16, 14, 6, 1], [-4, 13, 8, 1]]) {
        m.caixa(x, y, z, x + t - 1, y + t - 1, z + t - 1, C.brilho);
      }
      m.ancora('cabeca', [6.5, 21, 6.5]).ancora('rosto', [6.5, 14, 13]).ancora('costas', [6.5, 12, 0]);
    },
  },
  {
    id: 'coracao',
    numero: 6,
    nome: 'Coração',
    personalidade: 'Empático e sempre escuta de verdade.',
    animacao: 'parado',
    construir(m) {
      m.parte('corpo', { pivo: [8.5, 4, 4.5] });
      const forma = (cx, cy) => {
        const u = (cx - 8.5) / 7.3, v = (cy - 11.3) / 7.3;
        return (u * u + v * v - 1) ** 3 - u * u * v ** 3 <= 0;
      };
      m.extrudar(0, 4, 16, 20, 0, 8, forma, C.rosa, 2);
      m.pintar((x, y, z, cor) => (cor === C.rosa && z >= 6 && (x - 4) ** 2 + (y - 17.5) ** 2 < 2.5 ? C.rosaClaro : undefined));
      m.desenhar(['K...K', '.KKK.'], 6, 10, { K: C.tinta });
      bochechas(m, 3, 12, 10);
      // óculos escuros (acessório)
      m.parte('oculos', { tipo: 'item', pai: 'corpo', pivo: [8.5, 13.5, 9] });
      for (const cx of [5.5, 11.5]) {
        m.preencher(Math.floor(cx - 3), 11, 9, Math.ceil(cx + 3), 16, 9, (x, y) => (x - cx) ** 2 + (y - 13.5) ** 2 <= 2.5 ** 2, C.lente);
      }
      m.set(8, 14, 9, C.lente);
      m.set(4, 15, 9, C.lenteBrilho).set(10, 15, 9, C.lenteBrilho);
      braco(m, 'E', { x0: -1, yTopo: 12, comprimento: 4, z0: 3, prof: 3, cor: C.rosa, corMao: C.rosaEscuro });
      braco(m, 'D', { x0: 16, yTopo: 12, comprimento: 4, z0: 3, prof: 3, cor: C.rosa, corMao: C.rosaEscuro });
      pernas(m, { xE: 6, xD: 9, largura: 2, altura: 5, z0: 3, z1: 5, cor: C.rosaEscuro });
      m.ancora('cabeca', [8.5, 21, 4.5]).ancora('rosto', [8.5, 13, 10]).ancora('costas', [8.5, 12, 0]);
    },
  },
  {
    id: 'globinho',
    numero: 7,
    nome: 'Globinho',
    personalidade: 'Adora gente de todas as áreas.',
    animacao: 'parado',
    pose: { bracoD: 0.35 },
    construir(m) {
      const [cx, cy, cz, r] = [7.5, 11.5, 7.5, 7.6];
      m.parte('corpo', { pivo: [cx, 4, cz] });
      m.esfera(cx, cy, cz, r, C.oceano);
      const continentes = [
        [[-0.78, 0.42, 0.46], 0.62], [[0.86, 0.05, 0.5], 0.42], [[0.35, -0.72, 0.6], 0.3],
        [[-0.25, 0.3, -0.92], 0.6], [[0.7, 0.55, -0.45], 0.5], [[-0.6, -0.55, -0.55], 0.45], [[0.05, 0.98, 0.1], 0.38],
      ].map(([d, a]) => [normalizar(d), a]);
      m.pintar((x, y, z) => {
        const d = normalizar([x + 0.5 - cx, y + 0.5 - cy, z + 0.5 - cz]);
        if (d[2] > 0.72 && Math.abs(d[0]) < 0.6 && Math.abs(d[1]) < 0.55) return; // o rosto fica no oceano
        const variacao = (ruido(x, y, z, 3) - 0.5) * 0.22;
        for (const [c, a] of continentes) {
          const angulo = Math.acos(Math.min(1, d[0] * c[0] + d[1] * c[1] + d[2] * c[2]));
          if (angulo < a + variacao) return ruido(x, y, z, 5) < 0.18 ? C.continenteEscuro : C.continente;
        }
      });
      realce(m, [cx, cy, cz], r, C.oceano, C.oceanoClaro, 0.9);
      olhosFelizes(m, 2, 9, 12);
      m.desenhar(['KKK', 'KLK', '.K.'], 6, 10, { K: C.tinta, L: C.lingua });
      bochechas(m, 2, 11, 10);
      mochila(m, { x0: 4, x1: 10, y0: 7, y1: 14, zFrente: 0, pivo: [7.5, 11, 0] });
      braco(m, 'E', { x0: -2, yTopo: 11, comprimento: 4, z0: 7, cor: C.continente, corMao: C.continenteEscuro });
      braco(m, 'D', { x0: 15, yTopo: 11, comprimento: 4, z0: 7, cor: C.continente, corMao: C.continenteEscuro });
      pernas(m, { xE: 4, xD: 8, altura: 5, z0: 6, z1: 8, cor: C.pernaGlobo });
      m.ancora('cabeca', [7.5, 20, 7.5]).ancora('rosto', [7.5, 12, 15]).ancora('costas', [7.5, 11, 0]);
    },
  },
  {
    id: 'estrelinha',
    numero: 8,
    nome: 'Estrelinha',
    personalidade: 'Animado e sempre incentiva os outros.',
    animacao: 'acenar',
    construir(m) {
      const [cx, cy, R, r] = [9.5, 10.9, 9.6, 4.7];
      const vertices = Array.from({ length: 10 }, (_, i) => {
        const a = Math.PI / 2 + (i * Math.PI) / 5, raio = i % 2 ? r : R;
        return [cx + raio * Math.cos(a), cy + raio * Math.sin(a)];
      });
      m.parte('corpo', { pivo: [cx, 3, 3.5] });
      m.extrudar(0, 1, 19, 21, 0, 6, (x, y) => dentroPoligono(x, y, vertices), C.amarelo, 1);
      m.pintar((x, y, z, cor) => (cor === C.amarelo && z >= 4 && (x - 9) ** 2 + (y - 17) ** 2 < 4 ? C.amareloClaro : undefined));
      // as pontas laterais viram braços (só a parte de fora, para não abrir buraco ao acenar)
      const ponta = (angulo) => (x, y) => {
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
        let dif = Math.atan2(dy, dx) - angulo;
        dif = Math.atan2(Math.sin(dif), Math.cos(dif));
        return Math.hypot(dx, dy) > r * 1.5 && Math.abs(dif) < 0.5;
      };
      for (const [lado, angulo] of [['D', Math.PI / 10], ['E', (Math.PI * 9) / 10]]) {
        m.parte('corpo').separar(ponta(angulo), `braco${lado}`, {
          tipo: 'braco', lado, pai: 'corpo', levantar: 0.45,
          pivo: [cx + r * 1.5 * Math.cos(angulo), cy + r * 1.5 * Math.sin(angulo), 3.5],
        });
      }
      m.parte('corpo');
      olhosFelizes(m, 4, 11, 12);
      m.desenhar(['KKK', 'KLK'], 8, 11, { K: C.tinta, L: C.lingua });
      bochechas(m, 4, 13, 10);
      mochila(m, { x0: 7, x1: 11, y0: 7, y1: 13, zFrente: -1, pivo: [9.5, 10, -1] });
      pernas(m, { xE: 4, xD: 13, largura: 2, altura: 4, z0: 2, z1: 4, cor: C.amareloEscuro });
      m.ancora('cabeca', [9.5, 21, 3.5]).ancora('rosto', [9.5, 12, 7]).ancora('costas', [9.5, 10, 0]);
    },
  },
  {
    id: 'conezinho',
    numero: 9,
    nome: 'Conezinho',
    personalidade: 'Direto e ajuda a focar no objetivo.',
    animacao: 'parado',
    construir(m) {
      m.parte('corpo', { pivo: [7.5, 2, 7.5] });
      m.caixaArredondada(0, 2, 0, 14, 3, 14, 2, (x, y) => (y === 2 ? C.laranjaEscuro : C.laranja));
      const raio = (y) => 5.7 - (y - 4) * 0.25;
      const listra = (y) => (y >= 10 && y <= 12) || (y >= 16 && y <= 17);
      m.cilindro(7.5, 7.5, raio, 4, 21, (x, y) => (listra(y) ? C.branco : C.laranja));
      olhosOvais(m, 5, 8, 8);
      braco(m, 'E', { x0: 1, yTopo: 8, comprimento: 4, z0: 7, cor: C.laranja, corMao: C.laranjaEscuro });
      braco(m, 'D', { x0: 12, yTopo: 8, comprimento: 4, z0: 7, cor: C.laranja, corMao: C.laranjaEscuro });
      mochila(m, {
        x0: 4, x1: 10, y0: 5, y1: 11, prof: 3, pivo: [7.5, 8, 2],
        frentePorAltura: (y) => Math.floor(7.5 - raio(y + 0.5) + 0.5),
      });
      pernas(m, { xE: 4, xD: 8, altura: 2, z0: 6, z1: 8, cor: C.laranjaEscuro });
      m.ancora('cabeca', [7.5, 22, 7.5]).ancora('rosto', [7.5, 7, 13]).ancora('costas', [7.5, 8, 2]);
    },
  },
  {
    id: 'nuvem',
    numero: 10,
    nome: 'Nuvem',
    personalidade: 'Observador e sempre vê o lado diferente.',
    animacao: 'parado',
    construir(m) {
      m.parte('corpo', { pivo: [8.5, 4, 6.5] });
      for (const [x, y, z, r] of [[8.5, 9.8, 6.5, 5.6], [3.9, 8.4, 6.5, 3.9], [13.1, 8.4, 6.5, 3.9], [10.2, 13.2, 6.5, 4.3], [5.9, 12.4, 6.5, 3.4]]) {
        m.esfera(x, y, z, r, C.azulCeu);
      }
      m.elipsoide(8.5, 9.5, 9.3, 4.6, 3.6, 3.2, C.azulCeu); // rosto mais cheio e plano
      m.caixa(-2, -2, -2, 20, 3, 15, null);
      m.pintar((x, y, z) => {
        if (y >= 10 && !m.ocupado(x, y + 1, z)) return C.azulCeuClaro;
        if (y <= 5) return C.azulCeuEscuro;
      });
      olhosOvais(m, 5, 10, 11, 4);
      // boina (acessório)
      m.parte('boina', { tipo: 'item', pai: 'corpo', pivo: [9.5, 17, 6.5] });
      m.elipsoide(9.8, 17.4, 6.5, 5.4, 1.5, 4.8, C.tinta, { giroZ: -0.12 });
      m.set(9, 19, 6, C.tinta);
      mochila(m, { x0: 5, x1: 12, y0: 5, y1: 11, zFrente: 1, pivo: [8.5, 8, 1] });
      pernas(m, { xE: 5, xD: 9, altura: 4, z0: 5, z1: 7, cor: C.azulCeuEscuro });
      m.ancora('cabeca', [9.5, 19, 6.5]).ancora('rosto', [8.5, 10, 12]).ancora('costas', [8.5, 8, 0]);
    },
  },
];

/** Monta o pet e devolve os dados (o mesmo formato dos arquivos em json/). */
export function gerarPet(id) {
  const def = PETS.find((p) => p.id === id);
  if (!def) throw new Error(`Pet desconhecido: ${id}`);
  const m = new Modelo();
  def.construir(m);
  const { id: _, construir, ...meta } = def;
  return { id, versao: 1, ...meta, pose: def.pose ?? {}, ...m.exportar() };
}
