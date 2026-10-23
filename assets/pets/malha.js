/**
 * Monta e anima os pets em Three.js a partir dos dados de especies.js (ou de json/<id>.json).
 *
 * - Só as faces visíveis de cada parte viram geometria, com oclusão de ambiente por vértice
 *   (os cantos entre voxels ficam mais escuros) e uma textura de bisel que marca cada cubinho.
 * - Cada parte é um grupo com o próprio pivô, então dá para animar braços, pernas e acessórios.
 *
 * Uso:
 *   const pet = criarPet3D(gerarPet('xicara'));
 *   cena.add(pet.raiz);
 *   // a cada quadro:
 *   animarPet(pet, segundos, 'andar');
 */
import * as THREE from 'three';

export const ANIMACOES = {
  parado: 'Parado',
  andar: 'Andar',
  pular: 'Pular',
  acenar: 'Acenar',
  comemorar: 'Comemorar',
};

/** Partes que podem ser ligadas e desligadas (acessórios). */
export const ACESSORIOS = ['mochila', 'oculos', 'boina', 'caneta', 'vapor', 'brilhos'];

const FACES = [
  { n: [1, 0, 0], cantos: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]] },
  { n: [-1, 0, 0], cantos: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]] },
  { n: [0, 1, 0], cantos: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] },
  { n: [0, -1, 0], cantos: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
  { n: [0, 0, 1], cantos: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },
  { n: [0, 0, -1], cantos: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]] },
];
const LUZ_OCLUSAO = [0.5, 0.68, 0.85, 1];

let materiais;

/** Textura branca com as bordas escurecidas: multiplicada pela cor, desenha a junta entre os cubos. */
function texturaBisel() {
  const lado = 64;
  const tela = document.createElement('canvas');
  tela.width = tela.height = lado;
  const g = tela.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, lado, lado);
  for (const [recuo, alfa] of [[0, 0.24], [2, 0.12], [4, 0.06], [6, 0.025]]) {
    g.strokeStyle = `rgba(0, 0, 0, ${alfa})`;
    g.lineWidth = 2;
    g.strokeRect(recuo + 1, recuo + 1, lado - 2 * recuo - 2, lado - 2 * recuo - 2);
  }
  const textura = new THREE.CanvasTexture(tela);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = 4;
  return textura;
}

function obterMateriais() {
  if (!materiais) {
    const map = texturaBisel();
    materiais = {
      fosco: new THREE.MeshStandardMaterial({ vertexColors: true, map, roughness: 0.62, metalness: 0 }),
      brilho: new THREE.MeshBasicMaterial({ vertexColors: true, map }),
    };
  }
  return materiais;
}

function geometriaDaParte(parte, paleta, ocupado, brilhante) {
  const propria = new Set(parte.voxels.map(([x, y, z]) => `${x},${y},${z}`));
  const tem = (x, y, z) => ocupado.has(`${x},${y},${z}`);
  const [px, py, pz] = parte.pivo;
  const posicoes = [], normais = [], cores = [], uvs = [], indices = [];
  const cor = new THREE.Color();

  for (const [x, y, z, i] of parte.voxels) {
    const hex = paleta[i];
    if (hex.endsWith('*') !== brilhante) continue;
    cor.set(hex.replace('*', ''));
    for (const { n, cantos } of FACES) {
      const [nx, ny, nz] = n;
      if (propria.has(`${x + nx},${y + ny},${z + nz}`)) continue;
      const eixoN = nx ? 0 : ny ? 1 : 2;
      const [eu, ev] = [0, 1, 2].filter((e) => e !== eixoN);
      const base = posicoes.length / 3;
      const oclusao = cantos.map((c) => {
        const vizinho = [x + nx, y + ny, z + nz];
        const a = [...vizinho], b = [...vizinho], d = [...vizinho];
        a[eu] += c[eu] ? 1 : -1;
        b[ev] += c[ev] ? 1 : -1;
        d[eu] = a[eu];
        d[ev] = b[ev];
        const lado1 = tem(...a), lado2 = tem(...b);
        const nivel = lado1 && lado2 ? 0 : 3 - (lado1 + lado2 + tem(...d));
        const k = LUZ_OCLUSAO[nivel];
        posicoes.push(x + c[0] - px, y + c[1] - py, z + c[2] - pz);
        normais.push(nx, ny, nz);
        cores.push(cor.r * k, cor.g * k, cor.b * k);
        uvs.push(c[eu], c[ev]);
        return nivel;
      });
      // escolhe a diagonal do quadrado que não cria listras na sombra
      if (oclusao[0] + oclusao[2] >= oclusao[1] + oclusao[3]) indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
      else indices.push(base + 1, base + 2, base + 3, base + 1, base + 3, base);
    }
  }
  if (!indices.length) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(posicoes, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normais, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeBoundingSphere();
  return geo;
}

/**
 * Cria o pet 3D. A raiz fica no chão (y = 0), centralizada em x e z; 1 voxel = 1 unidade.
 * Devolve { raiz, grupos, partes, dados }.
 */
export function criarPet3D(dados) {
  const { paleta, limites } = dados;
  const ocupado = new Set();
  for (const p of dados.partes) for (const [x, y, z] of p.voxels) ocupado.add(`${x},${y},${z}`);
  const centro = [(limites.min[0] + limites.max[0] + 1) / 2, limites.min[1], (limites.min[2] + limites.max[2] + 1) / 2];
  const { fosco, brilho } = obterMateriais();

  const raiz = new THREE.Group();
  raiz.name = dados.id;
  const grupos = { raiz };
  const pivos = { raiz: centro };
  const pendentes = [...dados.partes];
  while (pendentes.length) {
    const i = pendentes.findIndex((p) => grupos[p.pai]);
    if (i < 0) throw new Error(`Parte sem pai em ${dados.id}: ${pendentes.map((p) => p.nome).join(', ')}`);
    const [p] = pendentes.splice(i, 1);
    const grupo = new THREE.Group();
    grupo.name = p.nome;
    const pp = pivos[p.pai];
    grupo.position.set(p.pivo[0] - pp[0], p.pivo[1] - pp[1], p.pivo[2] - pp[2]);
    for (const brilhante of [false, true]) {
      const geo = geometriaDaParte(p, paleta, ocupado, brilhante);
      if (!geo) continue;
      const malha = new THREE.Mesh(geo, brilhante ? brilho : fosco);
      malha.castShadow = !brilhante;
      malha.receiveShadow = true;
      grupo.add(malha);
    }
    grupos[p.pai].add(grupo);
    grupos[p.nome] = grupo;
    pivos[p.nome] = p.pivo;
    grupo.userData.repouso = { posicao: grupo.position.clone() };
  }
  raiz.userData.repouso = { posicao: new THREE.Vector3() };
  return { raiz, grupos, partes: Object.fromEntries(dados.partes.map((p) => [p.nome, p])), dados };
}

/** Libera a memória de vídeo de um pet que não vai mais ser usado. */
export function descartarPet(pet) {
  pet.raiz.traverse((o) => o.geometry?.dispose());
  pet.raiz.removeFromParent();
}

/** Mostra ou esconde um acessório (mochila, óculos, boina...). */
export function mostrarParte(pet, nome, visivel) {
  if (pet.grupos[nome]) pet.grupos[nome].visible = visivel;
}

/**
 * Posiciona o pet no instante t (segundos) da animação.
 * Animações: parado, andar, pular, acenar, comemorar (ver ANIMACOES).
 */
export function animarPet(pet, t, animacao = 'parado') {
  const { grupos, partes, dados, raiz } = pet;
  for (const [nome, g] of Object.entries(grupos)) {
    if (nome === 'raiz') continue;
    g.position.copy(g.userData.repouso.posicao);
    g.rotation.set(0, 0, 0);
    g.scale.set(1, 1, 1);
  }
  const lista = Object.values(partes);
  const bracos = lista.filter((p) => p.tipo === 'braco');
  const pernas = lista.filter((p) => p.tipo === 'perna');
  const sinal = (p) => (p.lado === 'E' ? -1 : 1);
  const corpo = grupos.corpo;
  const pose = dados.pose ?? {};
  const subir = (y) => raiz.children.forEach((filho) => (filho.position.y += y));
  const esticar = (e) => corpo.scale.set(1 / Math.sqrt(e), e, 1 / Math.sqrt(e));

  for (const b of bracos) grupos[b.nome].rotation.z = sinal(b) * (pose[b.nome] ?? 0);
  lista.filter((p) => p.tipo === 'flutuante').forEach((p, i) => {
    grupos[p.nome].position.y += Math.sin(t * 1.8 + i * 2) * 0.45;
    grupos[p.nome].rotation.y = Math.sin(t * 0.7 + i) * 0.3;
  });
  if (grupos.folhas) grupos.folhas.rotation.z = Math.sin(t * 1.6) * 0.06;

  switch (animacao) {
    case 'andar': {
      const f = t * 7.5, s = Math.sin(f);
      for (const p of pernas) grupos[p.nome].rotation.x = s * 0.6 * sinal(p);
      for (const b of bracos) grupos[b.nome].rotation.x = -s * 0.5 * sinal(b);
      corpo.position.y += Math.abs(Math.cos(f)) * 0.7;
      corpo.rotation.z = s * 0.05;
      break;
    }
    case 'pular': {
      const fase = (t % 1.1) / 1.1;
      if (fase < 0.18) {
        esticar(1 - Math.sin((fase / 0.18) * Math.PI) * 0.14);
      } else if (fase < 0.78) {
        const q = Math.sin(((fase - 0.18) / 0.6) * Math.PI);
        subir(q * 5);
        esticar(1 + q * 0.07);
        for (const b of bracos) grupos[b.nome].rotation.z += sinal(b) * q * 0.9;
        for (const p of pernas) grupos[p.nome].rotation.x = -q * 0.35 * sinal(p);
      } else {
        esticar(1 - Math.sin(((fase - 0.78) / 0.22) * Math.PI) * 0.12);
      }
      break;
    }
    case 'acenar': {
      const b = bracos.find((q) => q.lado === 'D') ?? bracos[0];
      const levantar = b?.levantar ?? 2.4;
      if (b) grupos[b.nome].rotation.z = sinal(b) * (levantar + Math.sin(t * 9) * Math.min(0.32, levantar * 0.45));
      else corpo.rotation.z = Math.sin(t * 6) * 0.12;
      corpo.rotation.z += Math.sin(t * 3) * 0.035;
      corpo.position.y += Math.sin(t * 2.2) * 0.15;
      break;
    }
    case 'comemorar': {
      const q = Math.abs(Math.sin(((t % 0.62) / 0.62) * Math.PI));
      subir(q * 2.6);
      esticar(1 + (q - 0.5) * 0.08);
      for (const b of bracos) grupos[b.nome].rotation.z = sinal(b) * ((b.levantar ?? 2.4) * 1.05 + Math.sin(t * 14) * 0.22);
      corpo.rotation.y = Math.sin(t * 5) * 0.18;
      break;
    }
    default: {
      corpo.position.y += Math.sin(t * 2.2) * 0.18;
      esticar(1 + Math.sin(t * 2.2 + Math.PI / 2) * 0.015);
      for (const b of bracos) grupos[b.nome].rotation.z += sinal(b) * (0.05 + Math.sin(t * 2.2) * 0.04);
    }
  }
}

/** Cena de estúdio: luz de cima à esquerda, preenchimento, contraluz e sombra macia no chão. */
export function criarEstudio({ sombra = true } = {}) {
  const cena = new THREE.Scene();
  cena.add(new THREE.HemisphereLight(0xffffff, 0xd8cdbb, 1.35));
  const sol = new THREE.DirectionalLight(0xffffff, 2.2);
  sol.position.set(-9, 18, 13);
  if (sombra) {
    sol.castShadow = true;
    sol.shadow.mapSize.set(1024, 1024);
    Object.assign(sol.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 70 });
    sol.shadow.bias = -0.0004;
    sol.shadow.normalBias = 0.03;
    sol.shadow.radius = 5;
  }
  cena.add(sol);
  const contraluz = new THREE.DirectionalLight(0xfff2dc, 0.6);
  contraluz.position.set(12, 10, -12);
  cena.add(contraluz);
  const preenchimento = new THREE.DirectionalLight(0xffffff, 0.35);
  preenchimento.position.set(12, 5, 9);
  cena.add(preenchimento);

  const chao = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.ShadowMaterial({ opacity: 0.15 }));
  chao.rotation.x = -Math.PI / 2;
  chao.receiveShadow = true;
  cena.add(chao);
  cena.add(sombraDeContato());
  return cena;
}

let texturaContato;
function sombraDeContato() {
  if (!texturaContato) {
    const tela = document.createElement('canvas');
    tela.width = tela.height = 128;
    const g = tela.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.32)');
    grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.12)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    texturaContato = new THREE.CanvasTexture(tela);
  }
  const plano = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 14),
    new THREE.MeshBasicMaterial({ map: texturaContato, transparent: true, depthWrite: false }),
  );
  plano.rotation.x = -Math.PI / 2;
  plano.position.y = 0.02;
  plano.renderOrder = -1;
  return plano;
}

/** Aponta a câmera para o pet, de frente e um pouco pela esquerda, cabendo inteiro no quadro. */
export function enquadrar(camera, pet, { azimute = -0.42, elevacao = 0.3, margem = 1.16 } = {}) {
  const [larg, alt, prof] = pet.dados.tamanho;
  const alvoY = alt * 0.46;
  const meiaFov = THREE.MathUtils.degToRad(camera.fov) / 2;
  const raioH = (Math.max(larg, prof) / 2) * margem;
  const raioV = (alt / 2) * margem;
  const dist = Math.max(raioV / Math.tan(meiaFov), raioH / (Math.tan(meiaFov) * camera.aspect)) + Math.max(larg, prof) * 0.5;
  camera.position.set(
    Math.sin(azimute) * Math.cos(elevacao) * dist,
    alvoY + Math.sin(elevacao) * dist,
    Math.cos(azimute) * Math.cos(elevacao) * dist,
  );
  camera.lookAt(0, alvoY, 0);
  camera.updateProjectionMatrix();
  return new THREE.Vector3(0, alvoY, 0);
}

export function configurarRenderizador(renderizador) {
  renderizador.outputColorSpace = THREE.SRGBColorSpace;
  renderizador.toneMapping = THREE.NeutralToneMapping;
  renderizador.toneMappingExposure = 1.0;
  renderizador.shadowMap.enabled = true;
  renderizador.shadowMap.type = THREE.PCFSoftShadowMap;
  return renderizador;
}
