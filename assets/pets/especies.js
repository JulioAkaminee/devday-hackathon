/**
 * Os 10 pets do evento, modelados em voxel a partir de docs/referencias/pets-do-evento-v1.png.
 *
 * Estilo da referência: cubos grandes, rostos de poucos blocos, plástico macio e estampas nítidas
 * (logo e texto) aplicadas como decalques. Todos usam uma mochila preta com a logo da OpenAI.
 *
 * Cada pet tem: id, numero, nome, personalidade, animacao (a animação padrão na galeria),
 * pose (ângulo de repouso dos braços, em radianos) e construir(m), que monta o modelo.
 * Coordenadas em voxels (escala 1): x para a direita, y para cima, a frente olha para +z.
 * Use gerarPet(id) para obter os dados prontos (o mesmo formato salvo em json/).
 */
import { Modelo, ruido } from './voxel.js';

export const ESCALA = 1;

export const CORES = {
  tinta: '#1f2024',
  brilhoOlho: '#ffffff',
  bochecha: '#ff7f9a',
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
  amareloBrilho: '#fffbe6',
  amareloEscuro: '#f0b20c',
  rosa: '#ff3f8f',
  rosaClaro: '#ff70ad',
  rosaEscuro: '#e02f5a',
  laranja: '#ff5631',
  laranjaEscuro: '#d63f1f',
  cinza: '#cfd3d8',
  cinzaEscuro: '#a2a9b1',
  tecla: '#3f454e',
  teclaClara: '#555c66',
  grafite: '#2c2f35',
  tela: '#14171c',
  telaVerde: '#3ee07f*',
  cafe: '#5a3725',
  cafeEscuro: '#3c2416',
  terra: '#5b3b27',
  vapor: '#f2ecdf',
  mochila: '#26272c',
  logoBranco: '#f3f4f6',
  logoCinza: '#5b6067',
  brilho: '#ffe45e*',
  lente: '#17181b',
  rosca: '#2e3035',
  roscaClara: '#45484f',
  continente: '#3cc05a',
  continenteEscuro: '#2a9e47',
  oceano: '#2f6fe4',
  oceanoClaro: '#5f95f2',
  pernaGlobo: '#3d4659',
};

const C = CORES;
const TINTAS = { K: C.tinta, W: C.brilhoOlho, L: C.lingua, B: C.bochecha, G: C.telaVerde };

// Rostos de poucos blocos, como na referência
const OLHO_FELIZ = ['.KK.', 'K..K'];
const OLHO_FELIZ_PEQUENO = ['.K.', 'K.K'];
const OLHO_OVAL = ['KK', 'KK', 'KK'];
const OLHO_BRILHO = ['WK', 'KK', 'KK'];
const OLHO_TELA = ['.GG.', 'G..G'];
const BOCA_ABERTA = ['KKKK', 'KLLK', '.LL.'];
const BOCA_PEQUENA = ['KKK', 'KLK'];
const SORRISO = ['K.K', '.K.'];
const LENTE = ['.KKKK.', 'KKKKKK', 'KKKKKK', 'KKKKKK', 'KKKKKK', '.KKKK.'];

// ---------------------------------------------------------------------------------------------
// Ajudantes

const normalizar = ([x, y, z]) => {
  const d = Math.hypot(x, y, z) || 1;
  return [x / d, y / d, z / d];
};

function dentroPoligono(x, y, vertices) {
  let dentro = false;
  for (let a = 0, b = vertices.length - 1; a < vertices.length; b = a++) {
    const [xa, ya] = vertices[a], [xb, yb] = vertices[b];
    if ((ya > y) !== (yb > y) && x < ((xb - xa) * (y - ya)) / (yb - ya) + xa) dentro = !dentro;
  }
  return dentro;
}

/** Desenha o mesmo padrão nas colunas xE e xD, com o topo na linha y. */
function par(m, linhas, xE, xD, y, opcoes) {
  m.desenhar(linhas, xE, y, TINTAS, opcoes);
  m.desenhar(linhas, xD, y, TINTAS, opcoes);
}

/** Clareia a superfície de um corpo redondo do lado de onde vem a luz (um ou mais níveis). */
function realce(m, [cx, cy, cz], raio, corBase, niveis) {
  const luz = normalizar([-0.45, 0.65, 0.62]);
  m.pintar((x, y, z, cor) => {
    if (cor !== corBase) return;
    const d = [x - cx, y - cy, z - cz];
    const dist = Math.hypot(...d);
    if (dist < raio - 1.2) return;
    const alinhamento = (d[0] * luz[0] + d[1] * luz[1] + d[2] * luz[2]) / dist;
    for (const [limiar, nova] of niveis) if (alinhamento > limiar) return nova;
  });
}

/** Braço 2×2 pendurado no ombro, com mão colorida ou punho 3×3 (luva). */
function braco(m, lado, { x, yTopo, comprimento = 3, z, cor, mao, punho, levantar = 2.4 }) {
  const pivoX = lado === 'D' ? x + 0.5 : x + 1.5;
  m.parte(`braco${lado}`, { tipo: 'braco', lado, pai: 'corpo', pivo: [pivoX, yTopo - 0.5, z + 1], levantar });
  const yBase = yTopo - comprimento;
  m.caixa(x, yBase, z, x + 1, yTopo - 1, z + 1, cor);
  if (mao) m.caixa(x, yBase, z, x + 1, yBase, z + 1, mao);
  if (punho) {
    const xp = lado === 'D' ? x : x - 1;
    m.caixa(xp, yBase - 3, z, xp + 2, yBase - 1, z + 2, punho);
  }
}

/** Duas pernas presas à raiz (não acompanham o balanço do corpo), com pé de outra cor opcional. */
function pernas(m, { xE, xD, larg = 2, altura = 3, z, prof = 2, cor, corPe, pe = 1, bico = 0 }) {
  for (const [lado, x] of [['E', xE], ['D', xD]]) {
    m.parte(`perna${lado}`, { tipo: 'perna', lado, pai: 'raiz', pivo: [x + larg / 2, altura, z + prof / 2] });
    m.caixa(x, 0, z, x + larg - 1, altura - 1, z + prof - 1, cor);
    if (corPe) m.caixa(x, 0, z, x + larg - 1, pe - 1, z + prof - 1 + bico, corPe);
  }
}

/**
 * Mochila preta nas costas, com alça de mão e a logo da OpenAI estampada.
 * x0..x1 e y0..y1 são inclusivos. zFrente é a camada encostada no pet (número ou função de y);
 * a face de trás fica reta em zTras (calculada pela profundidade se não for informada).
 */
function mochila(m, { x0, x1, y0, y1, zFrente, zTras, prof = 3, pivo }) {
  const zF = typeof zFrente === 'function' ? zFrente : () => zFrente;
  if (zTras === undefined) {
    zTras = Infinity;
    for (let y = y0; y <= y1; y++) zTras = Math.min(zTras, zF(y) - prof + 1);
  }
  m.parte('mochila', { tipo: 'item', pai: 'corpo', pivo: pivo ?? [(x0 + x1 + 1) / 2, (y0 + y1 + 1) / 2, zTras] });
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if ((x === x0 || x === x1) && (y === y0 || y === y1)) continue;
      const beirada = x === x0 || x === x1 || y === y0 || y === y1;
      for (let z = zTras + (beirada ? 1 : 0); z <= zF(y); z++) m.setFino(x, y, z, C.mochila);
    }
  }
  const meioE = Math.floor((x0 + x1) / 2), meioD = Math.ceil((x0 + x1) / 2);
  for (let x = meioE - 1; x <= meioD + 1; x++) m.setFino(x, y1 + 2, zTras + 1, C.mochila);
  m.setFino(meioE - 1, y1 + 1, zTras + 1, C.mochila).setFino(meioD + 1, y1 + 1, zTras + 1, C.mochila);
  m.decalque({
    parte: 'mochila', tipo: 'logo', normal: [0, 0, -1], cor: C.logoBranco,
    centro: [(x0 + x1 + 1) / 2, (y0 + y1 + 1) / 2, zTras],
    largura: Math.min(x1 - x0 - 1, y1 - y0 - 1) * 0.86,
  });
}

/** Folha achatada, mais larga no meio e pontuda, que se curva para baixo na ponta. */
function folha(m, [bx, by, bz], azimute, elevacao, comp, larg, esp = 1.4, curva = 0.04) {
  const a = (azimute * Math.PI) / 180, e = (elevacao * Math.PI) / 180;
  const u = [Math.cos(e) * Math.cos(a), Math.sin(e), Math.cos(e) * Math.sin(a)];
  let w = [-u[2], 0, u[0]];
  const nw = Math.hypot(...w);
  w = nw < 0.15 ? [1, 0, 0] : w.map((v) => v / nw);
  const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
  const desce = n[1] <= 0 ? 1 : -1;
  const local = (x, y, z) => {
    const d = [x - bx, y - by, z - bz];
    const lu = d[0] * u[0] + d[1] * u[1] + d[2] * u[2];
    return [lu, d[0] * w[0] + d[1] * w[1] + d[2] * w[2], d[0] * n[0] + d[1] * n[1] + d[2] * n[2] - desce * curva * lu * lu];
  };
  const meiaLargura = (t) => (larg / 2) * Math.sin(Math.PI * Math.min(1, Math.max(0, t))) ** 0.55;
  const r = comp + larg;
  m.regiao(bx - r, bx + r, by - r, by + r, bz - r, bz + r, (x, y, z) => {
    const [lu, lw, ln] = local(x, y, z);
    return lu >= 0 && lu <= comp && Math.abs(lw) <= meiaLargura(lu / comp) && Math.abs(ln) <= esp / 2;
  }, (x, y, z) => {
    const [lu, lw] = local(x, y, z);
    if (Math.abs(lw) < 0.45 && lu / comp < 0.75) return C.verdeEscuro;
    return Math.abs(lw) > meiaLargura(lu / comp) * 0.65 ? C.verdeClaro : C.verde;
  });
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
      m.parte('corpo', { pivo: [6, 4, 5] });
      m.bloco(0, 12, 7, 18, 0, 10, 2, C.branco);
      // boca da caneca: café logo abaixo da borda, com um grão no meio
      m.caixa(1, 17, 1, 10, 17, 8, null);
      m.caixa(1, 16, 1, 10, 16, 8, C.cafe);
      m.caixa(5, 17, 4, 6, 17, 5, C.cafeEscuro);
      // shorts verdes
      m.bloco(1, 11, 4, 7, 1, 9, 1, C.verde);
      // alça
      m.caixa(-3, 9, 2, -2, 15, 5, C.verde);
      m.caixa(-1, 14, 2, -1, 15, 5, C.verde);
      m.caixa(-1, 9, 2, -1, 10, 5, C.verde);
      for (let z = 2; z <= 5; z++) m.setFino(-3, 15, z, null).setFino(-3, 9, z, null);
      // rosto
      par(m, OLHO_FELIZ, 1, 7, 14);
      m.desenhar(BOCA_ABERTA, 4, 12, TINTAS);
      par(m, ['B'], 1, 10, 11);
      // crachá </> pendurado nos shorts
      m.caixa(4, 2, 9, 7, 4, 9, C.branco);
      m.decalque({ tipo: 'texto', texto: '</>', centro: [6, 3.5, 10], largura: 3.4, altura: 2.2, cor: C.tinta });
      braco(m, 'D', { x: 12, yTopo: 12, comprimento: 3, z: 4, cor: C.verde, punho: C.branco });
      braco(m, 'E', { x: -2, yTopo: 9, comprimento: 2, z: 6, cor: C.verde, punho: C.branco, levantar: 2 });
      pernas(m, { xE: 2, xD: 7, larg: 3, altura: 4, z: 3, prof: 4, cor: C.branco, corPe: C.tinta, pe: 2, bico: 1 });
      mochila(m, { x0: 2, x1: 9, y0: 8, y1: 15, zFrente: -1, zTras: -3 });
      // vapor do café
      m.parte('vapor', { tipo: 'flutuante', pai: 'raiz', pivo: [6.5, 21, 5.5] });
      for (const [x, y, z] of [[6, 19, 5], [6, 20, 5], [6, 21, 5], [5, 21, 5], [7, 21, 5], [6, 21, 4], [6, 21, 6], [6, 22, 5]]) {
        m.setFino(x, y, z, C.vapor);
      }
      m.ancora('cabeca', [6, 18, 5]).ancora('rosto', [6, 12, 10]).ancora('costas', [6, 12, -3]);
    },
  },
  {
    id: 'caderninho',
    numero: 2,
    nome: 'Caderninho',
    personalidade: 'Organizado e adora trocar ideias.',
    animacao: 'parado',
    pose: { bracoD: 0.45, caneta: -0.95 },
    construir(m) {
      m.parte('corpo', { pivo: [5.5, 4, 2.5] });
      m.caixa(0, 4, 0, 10, 18, 0, C.azul);
      m.caixa(0, 4, 4, 10, 18, 4, C.azul);
      m.caixa(0, 4, 1, 10, 18, 3, (x, y, z) => (Math.floor(z) === 2 ? C.brancoSombra : C.branco));
      // espiral
      for (let y = 5; y <= 17; y += 2) {
        for (let z = 0; z <= 4; z++) m.setFino(-1, y, z, C.grafite);
        for (let z = 1; z <= 3; z++) m.setFino(-2, y, z, C.grafite);
      }
      // rosto
      par(m, OLHO_BRILHO, 2, 7, 15);
      par(m, ['B'], 1, 9, 12);
      m.desenhar(BOCA_PEQUENA, 4, 12, TINTAS);
      // etiqueta com a logo
      m.caixa(4, 5, 5, 6, 7, 5, C.branco);
      m.decalque({ tipo: 'logo', centro: [5.5, 6.5, 6], largura: 2.4, cor: C.logoCinza });
      // braço com a caneta
      braco(m, 'D', { x: 11, yTopo: 12, comprimento: 4, z: 1, cor: C.azul, mao: C.azulEscuro, levantar: 1.4 });
      // caneta reta presa na mão; a inclinação vem da pose, para não virar escadinha
      m.parte('caneta', { tipo: 'item', pai: 'bracoD', pivo: [14, 8.5, 2] });
      m.caixa(13, 5, 1, 14, 5, 2, C.verdeEscuro);
      m.caixa(13, 6, 1, 14, 11, 2, C.verde);
      m.caixa(13, 12, 1, 14, 12, 2, C.branco);
      m.caixa(13, 13, 1, 14, 14, 2, C.verdeClaro);
      pernas(m, { xE: 2, xD: 7, altura: 4, z: 1, prof: 3, cor: C.azul, corPe: C.azulEscuro });
      mochila(m, { x0: 2, x1: 8, y0: 6, y1: 16, zFrente: -1, zTras: -3 });
      m.ancora('cabeca', [5.5, 19, 2.5]).ancora('rosto', [5.5, 13, 5]).ancora('costas', [5.5, 11, -3]);
    },
  },
  {
    id: 'laptopinho',
    numero: 3,
    nome: 'Laptopinho',
    personalidade: 'Criativo e sempre tem um projeto.',
    animacao: 'parado',
    construir(m) {
      m.parte('corpo', { pivo: [7, 4, 5] });
      // base com teclado e touchpad
      m.caixa(0, 4, 1, 13, 6, 9, C.cinza);
      m.pintar((x, y, z, cor, i, j, k) => {
        if (j !== 6 || i < 1 || i > 12) return;
        if (k >= 3 && k <= 5) return (i + k) % 2 ? C.tecla : C.teclaClara;
        if (k >= 7 && k <= 8 && i >= 5 && i <= 8) return C.cinzaEscuro;
      });
      m.decalque({ tipo: 'logo', centro: [7, 5, 10], largura: 1.9, cor: C.logoCinza });
      // tampa com a tela
      m.caixa(0, 7, 1, 13, 17, 2, C.cinza);
      m.caixa(1, 8, 2, 12, 16, 2, C.tela);
      par(m, OLHO_TELA, 2, 8, 13);
      m.setFino(13, 17, 2, C.telaVerde);
      braco(m, 'E', { x: -2, yTopo: 7, comprimento: 4, z: 4, cor: C.cinza, mao: C.cinzaEscuro });
      braco(m, 'D', { x: 14, yTopo: 7, comprimento: 4, z: 4, cor: C.cinza, mao: C.cinzaEscuro });
      pernas(m, { xE: 3, xD: 8, larg: 3, altura: 4, z: 4, prof: 3, cor: C.tinta });
      mochila(m, { x0: 3, x1: 10, y0: 8, y1: 16, zFrente: 0, zTras: -2 });
      m.ancora('cabeca', [7, 18, 1.5]).ancora('rosto', [7, 13, 3]).ancora('costas', [7, 12, -2]);
    },
  },
  {
    id: 'plantinha',
    numero: 4,
    nome: 'Plantinha',
    personalidade: 'Tranquila e faz conexões inesperadas.',
    animacao: 'parado',
    construir(m) {
      m.parte('corpo', { pivo: [5.5, 3, 4.5] });
      m.bloco(0, 11, 3, 10, 0, 9, 2, C.branco);
      m.bloco(-1, 12, 10, 11, -1, 10, 2.5, C.branco);
      m.caixa(0, 10, 0, 10, 10, 8, C.terra);
      // rosto
      par(m, OLHO_BRILHO, 2, 7, 8);
      m.desenhar(SORRISO, 4, 5, TINTAS);
      par(m, ['B'], 1, 9, 5);
      // folhas (parte própria, para balançar)
      m.parte('folhas', { tipo: 'item', pai: 'corpo', pivo: [5.5, 10.5, 4.5] });
      m.cilindro(5.5, 4.5, 0.8, 10, 13, C.verdeEscuro);
      const base = (az, d = 0.6) => [5.5 + d * Math.cos((az * Math.PI) / 180), 11.5, 4.5 + d * Math.sin((az * Math.PI) / 180)];
      folha(m, base(0, 0), 0, 85, 8.2, 5);
      for (const az of [0, 180]) folha(m, base(az), az, 50, 7.4, 4.6);
      for (const az of [90, 270]) folha(m, base(az), az, 62, 6.6, 4.4);
      for (const az of [45, 135, 225, 315]) folha(m, base(az), az, 40, 6.6, 4.2);
      for (const az of [20, 160]) folha(m, base(az, 1), az, 15, 5.4, 3.6);
      braco(m, 'E', { x: -2, yTopo: 8, comprimento: 3, z: 4, cor: C.verde, mao: C.verdeClaro });
      braco(m, 'D', { x: 11, yTopo: 8, comprimento: 3, z: 4, cor: C.verde, mao: C.verdeClaro });
      pernas(m, { xE: 2, xD: 7, altura: 3, z: 3, prof: 3, cor: C.verdeEscuro });
      mochila(m, { x0: 2, x1: 8, y0: 3, y1: 9, zFrente: -1, zTras: -3 });
      m.ancora('cabeca', [5.5, 20, 4.5]).ancora('rosto', [5.5, 7, 9]).ancora('costas', [5.5, 6, -3]);
    },
  },
  {
    id: 'lampada',
    numero: 5,
    nome: 'Lâmpada',
    personalidade: 'Cheio de ideias e energia.',
    animacao: 'parado',
    construir(m) {
      const [cx, cy, cz, r] = [6, 13.6, 6, 5.9];
      m.parte('corpo', { pivo: [cx, 3, cz] });
      m.cilindro(cx, cz, 3.9, 3, 7, (x, y) => (Math.floor(y) % 2 ? C.roscaClara : C.rosca));
      m.cilindro(cx, cz, 3.6, 7, 9, C.amarelo);
      m.esfera(cx, cy, cz, r, C.amarelo);
      realce(m, [cx, cy, cz], r, C.amarelo, [[0.975, C.amareloBrilho], [0.93, C.amareloClaro]]);
      par(m, OLHO_OVAL, 3, 7, 14);
      braco(m, 'E', { x: -1, yTopo: 11, comprimento: 4, z: 5, cor: C.amarelo, mao: C.amareloEscuro });
      braco(m, 'D', { x: 11, yTopo: 11, comprimento: 4, z: 5, cor: C.amarelo, mao: C.amareloEscuro });
      pernas(m, { xE: 3, xD: 7, altura: 3, z: 5, prof: 2, cor: C.amarelo, corPe: C.amareloEscuro });
      mochila(m, { x0: 2, x1: 9, y0: 9, y1: 17, zFrente: (y) => Math.ceil(cz - Math.sqrt(Math.max(0, r * r - (y + 0.5 - cy) ** 2))) });
      m.parte('brilhos', { tipo: 'flutuante', pai: 'raiz', pivo: [cx, 17, cz] });
      for (const [x, y, z] of [[-3, 17, 6], [-1, 21, 5], [14, 18, 7], [12, 22, 5], [15, 13, 6]]) m.setFino(x, y, z, C.brilho);
      m.ancora('cabeca', [cx, 19.5, cz]).ancora('rosto', [cx, 13, 12]).ancora('costas', [cx, 13, -2]);
    },
  },
  {
    id: 'coracao',
    numero: 6,
    nome: 'Coração',
    personalidade: 'Empático e sempre escuta de verdade.',
    animacao: 'parado',
    construir(m) {
      m.parte('corpo', { pivo: [9.5, 4, 3.5] });
      const forma = (cx, cy) => {
        const u = (cx - 9.5) / 8.2, v = (cy - 12) / 8.2;
        return (u * u + v * v - 1) ** 3 - u * u * v ** 3 <= 0;
      };
      m.extrudar(0, 19, 4, 23, 0, 7, forma, C.rosa, 1.6);
      m.pintar((x, y, z, cor) => (cor === C.rosa && z > 5 && (x - 5) ** 2 + (y - 19.5) ** 2 < 1.2 ? C.rosaClaro : undefined));
      // óculos escuros: lentes de voxel e armação de arame
      m.parte('oculos', { tipo: 'item', pai: 'corpo', pivo: [9.5, 14.5, 7] });
      par(m, LENTE, 3, 10, 17, { relevo: 1, em: 'oculos' });
      const fio = { parte: 'oculos', raio: 0.17, cor: C.lente };
      m.haste({ ...fio, de: [8.9, 15.3, 7.5], para: [9.5, 15.75, 7.5] }).haste({ ...fio, de: [9.5, 15.75, 7.5], para: [10.1, 15.3, 7.5] });
      for (const [xLente, xLado] of [[3.05, 0.35], [15.95, 18.65]]) {
        m.haste({ ...fio, de: [xLente, 15.4, 7.45], para: [xLado, 15.4, 5.6] }).haste({ ...fio, de: [xLado, 15.4, 5.6], para: [xLado, 15.4, 1.6] });
      }
      braco(m, 'E', { x: 0, yTopo: 11, comprimento: 3, z: 2, cor: C.rosa, punho: C.branco });
      braco(m, 'D', { x: 17, yTopo: 11, comprimento: 3, z: 2, cor: C.rosa, punho: C.branco });
      pernas(m, { xE: 6, xD: 11, altura: 5, z: 2, prof: 3, cor: C.rosa, corPe: C.rosaEscuro, bico: 1 });
      mochila(m, { x0: 6, x1: 12, y0: 9, y1: 18, zFrente: -1, zTras: -3 });
      m.ancora('cabeca', [9.5, 22, 3.5]).ancora('rosto', [9.5, 14, 8]).ancora('costas', [9.5, 13, -3]);
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
      const [cx, cy, cz, r] = [6.5, 10.6, 6.5, 6.4];
      m.parte('corpo', { pivo: [cx, 4, cz] });
      m.esfera(cx, cy, cz, r, C.oceano);
      const continentes = [
        [[-0.78, 0.42, 0.46], 0.62], [[0.86, 0.05, 0.5], 0.42], [[0.35, -0.72, 0.6], 0.3],
        [[-0.25, 0.3, -0.92], 0.6], [[0.7, 0.55, -0.45], 0.5], [[-0.6, -0.55, -0.55], 0.45], [[0.05, 0.98, 0.1], 0.38],
      ].map(([d, a]) => [normalizar(d), a]);
      m.pintar((x, y, z, cor, i, j, k) => {
        const d = normalizar([x - cx, y - cy, z - cz]);
        if (d[2] > 0.72 && Math.abs(d[0]) < 0.6 && Math.abs(d[1]) < 0.55) return; // o rosto fica no oceano
        const variacao = (ruido(i, j, k, 3) - 0.5) * 0.22;
        for (const [c, a] of continentes) {
          const angulo = Math.acos(Math.min(1, d[0] * c[0] + d[1] * c[1] + d[2] * c[2]));
          if (angulo < a + variacao) return ruido(i, j, k, 5) < 0.18 ? C.continenteEscuro : C.continente;
        }
      });
      realce(m, [cx, cy, cz], r, C.oceano, [[0.9, C.oceanoClaro]]);
      par(m, OLHO_FELIZ_PEQUENO, 2, 8, 12);
      m.desenhar(BOCA_PEQUENA, 5, 10, TINTAS);
      par(m, ['B'], 1, 11, 9);
      braco(m, 'E', { x: -2, yTopo: 11, comprimento: 3, z: 5, cor: C.continente, mao: C.continenteEscuro });
      braco(m, 'D', { x: 13, yTopo: 11, comprimento: 3, z: 5, cor: C.continente, mao: C.continenteEscuro });
      pernas(m, { xE: 3, xD: 8, altura: 5, z: 5, prof: 3, cor: C.pernaGlobo });
      mochila(m, { x0: 3, x1: 9, y0: 6, y1: 14, zFrente: (y) => Math.ceil(cz - Math.sqrt(Math.max(0, r * r - (y + 0.5 - cy) ** 2))) });
      m.ancora('cabeca', [cx, 17, cz]).ancora('rosto', [cx, 11, 13]).ancora('costas', [cx, 10, -2]);
    },
  },
  {
    id: 'estrelinha',
    numero: 8,
    nome: 'Estrelinha',
    personalidade: 'Animado e sempre incentiva os outros.',
    animacao: 'acenar',
    construir(m) {
      const [cx, cy, R, r] = [9.5, 10.9, 9.4, 4.6];
      const vertices = Array.from({ length: 10 }, (_, n) => {
        const a = Math.PI / 2 + (n * Math.PI) / 5, raio = n % 2 ? r : R;
        return [cx + raio * Math.cos(a), cy + raio * Math.sin(a)];
      });
      m.parte('corpo', { pivo: [cx, 3, 3] });
      m.extrudar(0, 19, 1, 21, 0, 6, (x, y) => dentroPoligono(x, y, vertices), C.amarelo, 1.5);
      m.pintar((x, y, z, cor) => (cor === C.amarelo && z > 3 && (x - 9) ** 2 + (y - 17.5) ** 2 < 2.5 ? C.amareloClaro : undefined));
      // as pontas laterais viram braços (só a parte de fora, para não abrir buraco ao acenar)
      const ponta = (angulo) => (x, y) => {
        const dx = x - cx, dy = y - cy;
        let dif = Math.atan2(dy, dx) - angulo;
        dif = Math.atan2(Math.sin(dif), Math.cos(dif));
        return Math.hypot(dx, dy) > r * 1.5 && Math.abs(dif) < 0.5;
      };
      for (const [lado, angulo] of [['D', Math.PI / 10], ['E', (Math.PI * 9) / 10]]) {
        m.parte('corpo').separar(ponta(angulo), `braco${lado}`, {
          tipo: 'braco', lado, pai: 'corpo', levantar: 0.45,
          pivo: [cx + r * 1.5 * Math.cos(angulo), cy + r * 1.5 * Math.sin(angulo), 3],
        });
      }
      m.parte('corpo');
      par(m, OLHO_FELIZ_PEQUENO, 5, 11, 13);
      m.desenhar(BOCA_PEQUENA, 8, 11, TINTAS);
      par(m, ['B'], 4, 14, 10);
      mochila(m, { x0: 7, x1: 11, y0: 7, y1: 14, zFrente: -1, zTras: -3 });
      pernas(m, { xE: 4, xD: 13, altura: 4, z: 2, prof: 2, cor: C.amareloEscuro });
      m.ancora('cabeca', [cx, 20.5, 3]).ancora('rosto', [cx, 12, 6]).ancora('costas', [cx, 10.5, -3]);
    },
  },
  {
    id: 'conezinho',
    numero: 9,
    nome: 'Conezinho',
    personalidade: 'Direto e ajuda a focar no objetivo.',
    animacao: 'parado',
    construir(m) {
      m.parte('corpo', { pivo: [7.5, 0, 7.5] });
      m.bloco(0, 15, 0, 2, 0, 15, 2, (x, y) => (y < 1 ? C.laranjaEscuro : C.laranja));
      const raio = (y) => 5.4 - (y - 2) * 0.25;
      const listra = (y) => (y >= 9 && y < 12) || (y >= 14.5 && y < 16.5);
      m.cilindro(7.5, 7.5, raio, 2, 21, (x, y) => (listra(y) ? C.branco : C.laranja));
      par(m, OLHO_OVAL, 4, 9, 7);
      braco(m, 'E', { x: 1, yTopo: 7, comprimento: 3, z: 6, cor: C.laranja, mao: C.laranjaEscuro });
      braco(m, 'D', { x: 12, yTopo: 7, comprimento: 3, z: 6, cor: C.laranja, mao: C.laranjaEscuro });
      mochila(m, { x0: 4, x1: 10, y0: 3, y1: 11, zFrente: (y) => Math.ceil(7.5 - raio(y + 0.5)) });
      m.ancora('cabeca', [7.5, 21, 7.5]).ancora('rosto', [7.5, 6, 13]).ancora('costas', [7.5, 7, 0]);
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
      m.regiao(-3, 21, -3, 4, -3, 16, null, null);
      m.pintar((x, y, z, cor, i, j, k) => {
        if (y >= 12.5 && !m.ocupado(i, j + 1, k)) return C.azulCeuClaro;
        if (y < 5.5) return C.azulCeuEscuro;
      });
      par(m, OLHO_OVAL, 5, 10, 11);
      // boina (acessório)
      m.parte('boina', { tipo: 'item', pai: 'corpo', pivo: [9.5, 17, 6.5] });
      m.elipsoide(9.6, 17.2, 6.5, 5.6, 1.5, 4.9, C.tinta, { giroZ: -0.14 });
      m.esfera(9.3, 19, 6.3, 0.75, C.tinta);
      mochila(m, { x0: 5, x1: 11, y0: 5, y1: 13, zFrente: 1, zTras: -2 });
      pernas(m, { xE: 5, xD: 10, altura: 4, z: 5, prof: 3, cor: C.azulCeuEscuro });
      m.ancora('cabeca', [9.5, 19.5, 6.5]).ancora('rosto', [8.5, 10, 12]).ancora('costas', [8.5, 9, -2]);
    },
  },
];

/** Monta o pet e devolve os dados (o mesmo formato dos arquivos em json/). */
export function gerarPet(id) {
  const def = PETS.find((p) => p.id === id);
  if (!def) throw new Error(`Pet desconhecido: ${id}`);
  const m = new Modelo({ escala: ESCALA });
  def.construir(m);
  const { id: _id, construir: _construir, ...meta } = def;
  return { id, versao: 3, ...meta, pose: def.pose ?? {}, ...m.exportar() };
}
