/**
 * Modelagem dos pets em voxel. Sem dependências: roda no navegador e no Node.
 *
 * Duas unidades
 * - Unidade do projeto: as formas (caixas, esferas, cilindros…) são descritas nela, em números
 *   contínuos. Um corpo típico tem 13 a 17 unidades de largura.
 * - Voxel fino: o modelo é voxelizado com `escala` voxels por unidade (2 por padrão). O voxel fino
 *   (i, j, k) ocupa [i, i+1] / escala em cada eixo, e os testes de forma usam o centro dele.
 *   Rostos, logos e outros desenhos de pixel são feitos direto em voxels finos.
 *
 * Convenções
 * - y aponta para cima e a frente do pet olha para +z. A esquerda de quem olha é −x.
 * - Cor: '#rrggbb'. Com '*' no fim ('#rrggbb*') o voxel brilha (não recebe luz nem sombra).
 * - Cada pet é dividido em partes animáveis (corpo, braços, pernas, acessórios), cada uma com um pivô.
 *   Um voxel pertence só à primeira parte que o ocupa (o corpo vem primeiro).
 */

const chave = (i, j, k) => `${i},${j},${k}`;

export class Modelo {
  constructor({ escala = 2 } = {}) {
    this.S = escala;
    this.partes = [];
    this.ancoras = {};
    this.decalques = [];
    this.hastes = [];
    this.parte('corpo', { tipo: 'corpo', pai: 'raiz' });
  }

  /**
   * Seleciona a parte que recebe os próximos voxels, criando-a se preciso.
   * opcoes: tipo ('corpo' | 'braco' | 'perna' | 'item' | 'flutuante'), pai, pivo [x, y, z] em
   * unidades do projeto, lado ('E' | 'D') e levantar (ângulo do braço ao acenar, em radianos).
   */
  parte(nome, opcoes = {}) {
    let p = this.partes.find((q) => q.nome === nome);
    if (!p) {
      p = { nome, tipo: 'item', pai: 'corpo', pivo: [0, 0, 0], voxels: new Map() };
      this.partes.push(p);
    }
    Object.assign(p, opcoes);
    this.atual = p;
    return this;
  }

  obterParte(nome) {
    return this.partes.find((q) => q.nome === nome);
  }

  // ----- voxels finos -----

  setFino(i, j, k, cor) {
    if (cor) this.atual.voxels.set(chave(i, j, k), cor);
    else this.atual.voxels.delete(chave(i, j, k));
    return this;
  }

  ocupado(i, j, k, nome = 'corpo') {
    return this.obterParte(nome)?.voxels.has(chave(i, j, k)) ?? false;
  }

  /** Índice fino da primeira linha/coluna cujo centro passa de `u` (unidade do projeto). */
  indice(u) {
    return Math.ceil(u * this.S - 0.5);
  }

  /** Índice inicial de um desenho de `largura` voxels finos centrado em `u`. */
  centrar(u, largura) {
    return Math.round(u * this.S - largura / 2);
  }

  // ----- formas, em unidades do projeto -----

  /**
   * Preenche a região contínua [xa, xb) × [ya, yb) × [za, zb) onde teste(cx, cy, cz) for verdadeiro.
   * `cor` pode ser uma função (cx, cy, cz) => cor. Cor nula apaga.
   */
  regiao(xa, xb, ya, yb, za, zb, teste, cor) {
    const S = this.S;
    const faixa = (a, b) => [Math.ceil(a * S - 0.5), Math.ceil(b * S - 0.5) - 1];
    const [i0, i1] = faixa(xa, xb), [j0, j1] = faixa(ya, yb), [k0, k1] = faixa(za, zb);
    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) {
        for (let k = k0; k <= k1; k++) {
          const cx = (i + 0.5) / S, cy = (j + 0.5) / S, cz = (k + 0.5) / S;
          if (teste && !teste(cx, cy, cz)) continue;
          this.setFino(i, j, k, typeof cor === 'function' ? cor(cx, cy, cz) : cor);
        }
      }
    }
    return this;
  }

  /** Caixa de unidades inteiras, inclusiva: [x0..x1] × [y0..y1] × [z0..z1]. */
  caixa(x0, y0, z0, x1, y1, z1, cor) {
    return this.regiao(x0, x1 + 1, y0, y1 + 1, z0, z1 + 1, null, cor);
  }

  /**
   * Bloco com as quinas arredondadas. eixo 'y' arredonda as arestas verticais (planta vista de cima);
   * eixo 'z' arredonda o contorno visto de frente.
   */
  bloco(xa, xb, ya, yb, za, zb, raio, cor, eixo = 'y') {
    return this.regiao(xa, xb, ya, yb, za, zb, (x, y, z) => {
      const [u, ua, ub, v, va, vb] = eixo === 'y' ? [x, xa, xb, z, za, zb] : [x, xa, xb, y, ya, yb];
      return dentroRetanguloArredondado(u, v, ua, ub, va, vb, raio);
    }, cor);
  }

  /** Elipsoide com rotação opcional: giroZ inclina no plano da frente, giroY vira para os lados. */
  elipsoide(cx, cy, cz, rx, ry, rz, cor, { giroZ = 0, giroY = 0 } = {}) {
    const r = Math.max(rx, ry, rz);
    const cZ = Math.cos(-giroZ), sZ = Math.sin(-giroZ), cY = Math.cos(-giroY), sY = Math.sin(-giroY);
    return this.regiao(cx - r, cx + r, cy - r, cy + r, cz - r, cz + r, (x, y, z) => {
      let dx = x - cx, dy = y - cy, dz = z - cz;
      [dx, dz] = [dx * cY + dz * sY, -dx * sY + dz * cY];
      [dx, dy] = [dx * cZ - dy * sZ, dx * sZ + dy * cZ];
      return (dx / rx) ** 2 + (dy / ry) ** 2 + (dz / rz) ** 2 <= 1;
    }, cor);
  }

  esfera(cx, cy, cz, r, cor) {
    return this.elipsoide(cx, cy, cz, r, r, r, cor);
  }

  /** Cilindro de eixo vertical entre ya e yb. O raio pode ser uma função da altura (cones, roscas). */
  cilindro(cx, cz, raio, ya, yb, cor) {
    const r = typeof raio === 'function' ? raio : () => raio;
    let rMax = 0;
    for (let y = ya; y <= yb; y += 0.25) rMax = Math.max(rMax, r(y));
    return this.regiao(cx - rMax, cx + rMax, ya, yb, cz - rMax, cz + rMax, (x, y, z) => (x - cx) ** 2 + (z - cz) ** 2 <= r(y) ** 2, cor);
  }

  /** Bastão arredondado de p0 a p1. `cor` pode ser função (cx, cy, cz, t), com t de 0 (p0) a 1 (p1). */
  capsula(p0, p1, raio, cor) {
    const d = p1.map((v, n) => v - p0[n]);
    const L2 = d[0] ** 2 + d[1] ** 2 + d[2] ** 2;
    const min = p0.map((v, n) => Math.min(v, p1[n]) - raio), max = p0.map((v, n) => Math.max(v, p1[n]) + raio);
    const param = (x, y, z) => Math.max(0, Math.min(1, ((x - p0[0]) * d[0] + (y - p0[1]) * d[1] + (z - p0[2]) * d[2]) / L2));
    return this.regiao(min[0], max[0], min[1], max[1], min[2], max[2], (x, y, z) => {
      const t = param(x, y, z);
      return (x - p0[0] - t * d[0]) ** 2 + (y - p0[1] - t * d[1]) ** 2 + (z - p0[2] - t * d[2]) ** 2 <= raio * raio;
    }, typeof cor === 'function' ? (x, y, z) => cor(x, y, z, param(x, y, z)) : cor);
  }

  /**
   * Extruda uma forma 2D (forma(cx, cy) no plano da frente) de za a zb, com as bordas da frente e de
   * trás arredondadas por `raioBorda` (efeito "almofadado").
   */
  extrudar(xa, xb, ya, yb, za, zb, forma, cor, raioBorda = 0) {
    const S = this.S;
    const i0 = this.indice(xa), i1 = this.indice(xb) - 1, j0 = this.indice(ya), j1 = this.indice(yb) - 1;
    const dentro = new Map();
    for (let i = i0 - 1; i <= i1 + 1; i++) {
      for (let j = j0 - 1; j <= j1 + 1; j++) {
        dentro.set(`${i},${j}`, i >= i0 && i <= i1 && j >= j0 && j <= j1 && forma((i + 0.5) / S, (j + 0.5) / S));
      }
    }
    const fora = [...dentro].filter(([, v]) => !v).map(([k]) => k.split(',').map(Number));
    const k0 = this.indice(za), k1 = this.indice(zb) - 1;
    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) {
        if (!dentro.get(`${i},${j}`)) continue;
        let d2 = Infinity;
        for (const [a, b] of fora) d2 = Math.min(d2, (a - i) ** 2 + (b - j) ** 2);
        const borda = (Math.sqrt(d2) - 0.5) / S; // distância do centro até o contorno
        const cx = (i + 0.5) / S, cy = (j + 0.5) / S;
        for (let k = k0; k <= k1; k++) {
          const cz = (k + 0.5) / S;
          const face = Math.min(cz - za, zb - cz);
          if (raioBorda && borda < raioBorda && face < raioBorda && (raioBorda - borda) ** 2 + (raioBorda - face) ** 2 > raioBorda ** 2) continue;
          this.setFino(i, j, k, typeof cor === 'function' ? cor(cx, cy, cz) : cor);
        }
      }
    }
    return this;
  }

  // ----- desenho de pixel, em voxels finos -----

  /** k do voxel mais à frente (lado 'frente') ou mais atrás (lado 'tras') da coluna (i, j), ou null. */
  superficie(i, j, nome = 'corpo', lado = 'frente') {
    const p = this.obterParte(nome);
    if (lado === 'frente') {
      for (let k = 120; k >= -120; k--) if (p.voxels.has(chave(i, j, k))) return k;
    } else {
      for (let k = -120; k <= 120; k++) if (p.voxels.has(chave(i, j, k))) return k;
    }
    return null;
  }

  /**
   * Desenha um padrão de pixels na superfície. `linhas` vai de cima para baixo; cada letra com cor em
   * `cores` pinta o voxel da superfície naquela coluna. Com `relevo` > 0, cria voxels novos para fora.
   * Em lado 'tras' o desenho é espelhado, para ser lido corretamente por quem olha as costas.
   */
  desenhar(linhas, i0, jTopo, cores, { relevo = 0, parte = 'corpo', em = parte, lado = 'frente' } = {}) {
    const alvo = this.obterParte(em) ?? this.parte(em).atual;
    const largura = Math.max(...linhas.map((l) => l.length));
    const passo = lado === 'frente' ? 1 : -1;
    linhas.forEach((linha, r) => {
      const j = jTopo - r;
      [...linha].forEach((letra, c) => {
        const cor = cores[letra];
        if (!cor) return;
        const i = lado === 'frente' ? i0 + c : i0 + (largura - 1 - c);
        const k = this.superficie(i, j, parte, lado);
        if (k === null) return;
        if (relevo === 0) alvo.voxels.set(chave(i, j, k), cor);
        else for (let n = 1; n <= relevo; n++) alvo.voxels.set(chave(i, j, k + passo * n), cor);
      });
    });
    return this;
  }

  /** Desenha centrado na coordenada x (unidade do projeto), com o topo na altura yTopo. */
  desenharEm(linhas, x, yTopo, cores, opcoes) {
    const largura = Math.max(...linhas.map((l) => l.length));
    return this.desenhar(linhas, this.centrar(x, largura), Math.round(yTopo * this.S) - 1, cores, opcoes);
  }

  /** Recolore uma parte: fn(cx, cy, cz, cor, i, j, k) devolve a cor nova ou undefined. */
  pintar(fn, nome = this.atual.nome) {
    const p = this.obterParte(nome);
    const S = this.S;
    for (const [kk, cor] of p.voxels) {
      const [i, j, k] = kk.split(',').map(Number);
      const nova = fn((i + 0.5) / S, (j + 0.5) / S, (k + 0.5) / S, cor, i, j, k);
      if (nova) p.voxels.set(kk, nova);
    }
    return this;
  }

  /** Move para outra parte os voxels da parte atual em que teste(cx, cy, cz) for verdadeiro. */
  separar(teste, destino, opcoes) {
    const origem = this.atual;
    const S = this.S;
    this.parte(destino, opcoes);
    for (const [kk, cor] of [...origem.voxels]) {
      const [i, j, k] = kk.split(',').map(Number);
      if (teste((i + 0.5) / S, (j + 0.5) / S, (k + 0.5) / S)) {
        origem.voxels.delete(kk);
        this.atual.voxels.set(kk, cor);
      }
    }
    return this;
  }

  ancora(nome, ponto) {
    this.ancoras[nome] = ponto;
    return this;
  }

  /**
   * Adesivo plano e nítido sobre a superfície (logo ou texto), como uma estampa.
   * centro na superfície, normal apontando para fora, largura e altura em unidades do projeto.
   */
  decalque({ parte = this.atual.nome, tipo = 'logo', texto, centro, normal = [0, 0, 1], largura, altura = largura, cor = '#ffffff' }) {
    this.decalques.push({ parte, tipo, ...(texto && { texto }), centro, normal, largura, altura, cor });
    return this;
  }

  /** Haste fina (arame) de `de` até `para`, para detalhes menores que um voxel, como a armação dos óculos. */
  haste({ parte = this.atual.nome, de, para, raio = 0.14, cor }) {
    this.hastes.push({ parte, de, para, raio, cor });
    return this;
  }

  /** Dados prontos para salvar em JSON ou montar a malha 3D. Tudo sai em voxels finos. */
  exportar() {
    const S = this.S;
    const ocupados = new Set();
    const paleta = [];
    const indice = new Map();
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    const partes = [];
    for (const p of this.partes) {
      const voxels = [];
      for (const [k, cor] of p.voxels) {
        if (ocupados.has(k)) continue;
        ocupados.add(k);
        if (!indice.has(cor)) {
          indice.set(cor, paleta.length);
          paleta.push(cor);
        }
        const v = k.split(',').map(Number);
        for (let n = 0; n < 3; n++) {
          min[n] = Math.min(min[n], v[n]);
          max[n] = Math.max(max[n], v[n]);
        }
        voxels.push([...v, indice.get(cor)]);
      }
      if (!voxels.length) continue;
      const { nome, tipo, pai, lado, levantar } = p;
      const pivo = p.pivo.map((u) => u * S);
      partes.push({ nome, tipo, pai, pivo, ...(lado && { lado }), ...(levantar && { levantar }), voxels });
    }
    const ancoras = Object.fromEntries(Object.entries(this.ancoras).map(([n, p]) => [n, p.map((u) => u * S)]));
    const vezes = (v) => v.map((u) => u * S);
    const decalques = this.decalques.map((d) => ({ ...d, centro: vezes(d.centro), largura: d.largura * S, altura: d.altura * S }));
    const hastes = this.hastes.map((h) => ({ ...h, de: vezes(h.de), para: vezes(h.para), raio: h.raio * S }));
    return {
      escala: S,
      paleta,
      limites: { min, max },
      tamanho: [max[0] - min[0] + 1, max[1] - min[1] + 1, max[2] - min[2] + 1],
      totalVoxels: ocupados.size,
      partes,
      ...(decalques.length && { decalques }),
      ...(hastes.length && { hastes }),
      ancoras,
    };
  }
}

/** Verdadeiro se (u, v) está dentro do retângulo [ua, ub] × [va, vb] com cantos de raio r. */
export function dentroRetanguloArredondado(u, v, ua, ub, va, vb, r) {
  const du = Math.max(ua + r - u, 0, u - (ub - r));
  const dv = Math.max(va + r - v, 0, v - (vb - r));
  return u >= ua && u <= ub && v >= va && v <= vb && du * du + dv * dv <= r * r;
}

/** Ruído determinístico em [0, 1) para variar cores sem aleatoriedade entre execuções. */
export function ruido(x, y, z, semente = 0) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647 + semente * 144665) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
