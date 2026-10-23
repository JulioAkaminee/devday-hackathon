/**
 * Modelagem dos pets em voxel. Sem dependências: roda no navegador e no Node.
 *
 * Convenções
 * - O voxel (x, y, z) ocupa o cubo [x, x+1] × [y, y+1] × [z, z+1]. Os testes de forma usam o centro
 *   do voxel (x + 0.5, y + 0.5, z + 0.5).
 * - y aponta para cima e a frente do pet olha para +z. A esquerda de quem olha é −x.
 * - Cor: '#rrggbb'. Com '*' no fim ('#rrggbb*') o voxel brilha (não recebe luz nem sombra).
 * - Cada pet é dividido em partes animáveis (corpo, braços, pernas, acessórios), cada uma com um pivô.
 *   Um voxel pertence só à primeira parte que o ocupa (o corpo vem primeiro).
 */

const chave = (x, y, z) => `${x},${y},${z}`;

export class Modelo {
  constructor() {
    this.partes = [];
    this.ancoras = {};
    this.parte('corpo', { tipo: 'corpo', pai: 'raiz' });
  }

  /**
   * Seleciona a parte que recebe os próximos voxels, criando-a se preciso.
   * opcoes: tipo ('corpo' | 'braco' | 'perna' | 'item' | 'flutuante'), pai, pivo [x, y, z],
   * lado ('E' | 'D', para braços e pernas), levantar (ângulo do braço ao acenar, em radianos).
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

  /** Grava (ou apaga, com cor nula) um voxel na parte atual. */
  set(x, y, z, cor) {
    if (cor) this.atual.voxels.set(chave(x, y, z), cor);
    else this.atual.voxels.delete(chave(x, y, z));
    return this;
  }

  get(x, y, z, nome = this.atual.nome) {
    return this.partes.find((p) => p.nome === nome)?.voxels.get(chave(x, y, z));
  }

  /** Preenche a caixa [x0..x1] × [y0..y1] × [z0..z1] onde teste(cx, cy, cz) for verdadeiro. */
  preencher(x0, y0, z0, x1, y1, z1, teste, cor) {
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        for (let z = z0; z <= z1; z++) {
          if (teste && !teste(x + 0.5, y + 0.5, z + 0.5)) continue;
          this.set(x, y, z, typeof cor === 'function' ? cor(x, y, z) : cor);
        }
      }
    }
    return this;
  }

  caixa(x0, y0, z0, x1, y1, z1, cor) {
    return this.preencher(x0, y0, z0, x1, y1, z1, null, cor);
  }

  /** Caixa com as quinas verticais arredondadas (raio no plano XZ). */
  caixaArredondada(x0, y0, z0, x1, y1, z1, raio, cor) {
    const ax = x0 + raio, bx = x1 + 1 - raio, az = z0 + raio, bz = z1 + 1 - raio;
    return this.preencher(x0, y0, z0, x1, y1, z1, (cx, cy, cz) => {
      const dx = cx < ax ? ax - cx : cx > bx ? cx - bx : 0;
      const dz = cz < az ? az - cz : cz > bz ? cz - bz : 0;
      return dx * dx + dz * dz <= raio * raio + 0.01;
    }, cor);
  }

  /** Elipsoide com rotação opcional: giroZ inclina no plano da frente, giroY vira para os lados. */
  elipsoide(cx, cy, cz, rx, ry, rz, cor, { giroZ = 0, giroY = 0 } = {}) {
    const r = Math.max(rx, ry, rz);
    const cz1 = Math.cos(-giroZ), sz1 = Math.sin(-giroZ), cy1 = Math.cos(-giroY), sy1 = Math.sin(-giroY);
    return this.preencher(
      Math.floor(cx - r), Math.floor(cy - r), Math.floor(cz - r),
      Math.ceil(cx + r), Math.ceil(cy + r), Math.ceil(cz + r),
      (x, y, z) => {
        let dx = x - cx, dy = y - cy, dz = z - cz;
        [dx, dz] = [dx * cy1 + dz * sy1, -dx * sy1 + dz * cy1];
        [dx, dy] = [dx * cz1 - dy * sz1, dx * sz1 + dy * cz1];
        return (dx / rx) ** 2 + (dy / ry) ** 2 + (dz / rz) ** 2 <= 1;
      },
      cor,
    );
  }

  esfera(cx, cy, cz, r, cor) {
    return this.elipsoide(cx, cy, cz, r, r, r, cor);
  }

  /** Cilindro de eixo vertical. O raio pode ser uma função da altura (para cones). */
  cilindro(cx, cz, raio, y0, y1, cor) {
    const r = typeof raio === 'function' ? raio : () => raio;
    let rMax = 0;
    for (let y = y0; y <= y1; y++) rMax = Math.max(rMax, r(y + 0.5));
    return this.preencher(
      Math.floor(cx - rMax), y0, Math.floor(cz - rMax), Math.ceil(cx + rMax), y1, Math.ceil(cz + rMax),
      (x, y, z) => (x - cx) ** 2 + (z - cz) ** 2 <= r(y) ** 2,
      cor,
    );
  }

  /**
   * Extruda uma forma 2D (forma(cx, cy) no plano da frente) de z0 a z1.
   * `chanfro` arredonda as bordas: as camadas da frente e de trás encolhem até `chanfro` voxels.
   */
  extrudar(x0, y0, x1, y1, z0, z1, forma, cor, chanfro = 0) {
    const larg = x1 - x0 + 1, alt = y1 - y0 + 1;
    const dentro = (i, j) => i >= 0 && j >= 0 && i < larg && j < alt && forma(x0 + i + 0.5, y0 + j + 0.5);
    const fora = [];
    for (let i = -1; i <= larg; i++) for (let j = -1; j <= alt; j++) if (!dentro(i, j)) fora.push([i, j]);
    for (let i = 0; i < larg; i++) {
      for (let j = 0; j < alt; j++) {
        if (!dentro(i, j)) continue;
        let prof = Infinity;
        for (const [a, b] of fora) prof = Math.min(prof, Math.hypot(a - i, b - j));
        for (let z = z0; z <= z1; z++) {
          const borda = Math.min(z - z0, z1 - z);
          const exigido = chanfro - borda;
          if (exigido > 0 && prof <= exigido + 0.5) continue;
          this.set(x0 + i, y0 + j, z, typeof cor === 'function' ? cor(x0 + i, y0 + j, z) : cor);
        }
      }
    }
    return this;
  }

  /** z do voxel mais à frente da coluna (x, y) numa parte, ou null. */
  frente(x, y, nome = 'corpo') {
    const p = this.partes.find((q) => q.nome === nome);
    for (let z = 64; z >= -64; z--) if (p.voxels.has(chave(x, y, z))) return z;
    return null;
  }

  /**
   * Desenha na superfície da frente. `linhas` vai de cima para baixo; cada letra com cor em `cores`
   * pinta o voxel mais à frente daquela coluna. Com `relevo` > 0, cria voxels novos na frente.
   */
  desenhar(linhas, x0, yTopo, cores, { relevo = 0, parte = 'corpo', em = parte } = {}) {
    const alvo = this.partes.find((q) => q.nome === em) ?? this.parte(em).atual;
    linhas.forEach((linha, i) => {
      const y = yTopo - i;
      [...linha].forEach((letra, j) => {
        const cor = cores[letra];
        if (!cor) return;
        const x = x0 + j;
        const z = this.frente(x, y, parte);
        if (z === null) return;
        if (relevo === 0) alvo.voxels.set(chave(x, y, z), cor);
        else for (let k = 1; k <= relevo; k++) alvo.voxels.set(chave(x, y, z + k), cor);
      });
    });
    return this;
  }

  /** Recolore os voxels de uma parte: fn(x, y, z, cor, modelo) devolve a cor nova ou undefined. */
  pintar(fn, nome = this.atual.nome) {
    const p = this.partes.find((q) => q.nome === nome);
    for (const [k, cor] of p.voxels) {
      const [x, y, z] = k.split(',').map(Number);
      const nova = fn(x, y, z, cor, this);
      if (nova) p.voxels.set(k, nova);
    }
    return this;
  }

  /** Move para outra parte os voxels da parte atual em que teste(x, y, z) for verdadeiro. */
  separar(teste, destino, opcoes) {
    const origem = this.atual;
    this.parte(destino, opcoes);
    for (const [k, cor] of [...origem.voxels]) {
      const [x, y, z] = k.split(',').map(Number);
      if (teste(x, y, z)) {
        origem.voxels.delete(k);
        this.atual.voxels.set(k, cor);
      }
    }
    return this;
  }

  /** Verdadeiro se algum voxel ocupa (x, y, z) na parte indicada. */
  ocupado(x, y, z, nome = 'corpo') {
    return this.partes.find((q) => q.nome === nome)?.voxels.has(chave(x, y, z)) ?? false;
  }

  ancora(nome, ponto) {
    this.ancoras[nome] = ponto;
    return this;
  }

  /** Dados prontos para salvar em JSON ou montar a malha 3D. */
  exportar() {
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
        for (let i = 0; i < 3; i++) {
          min[i] = Math.min(min[i], v[i]);
          max[i] = Math.max(max[i], v[i]);
        }
        voxels.push([...v, indice.get(cor)]);
      }
      if (!voxels.length) continue;
      const { nome, tipo, pai, pivo, lado, levantar } = p;
      partes.push({ nome, tipo, pai, pivo, ...(lado && { lado }), ...(levantar && { levantar }), voxels });
    }
    return {
      paleta,
      limites: { min, max },
      tamanho: [max[0] - min[0] + 1, max[1] - min[1] + 1, max[2] - min[2] + 1],
      totalVoxels: ocupados.size,
      partes,
      ancoras: this.ancoras,
    };
  }
}

/** Ruído determinístico em [0, 1) para variar cores sem aleatoriedade entre execuções. */
export function ruido(x, y, z, semente = 0) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647 + semente * 144665) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
