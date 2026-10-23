/**
 * Monta e anima os pets em Three.js a partir dos dados de especies.js (ou de json/<id>.json).
 *
 * - Só as faces visíveis de cada parte viram geometria, com oclusão de ambiente por vértice
 *   (os cantos entre voxels ficam mais escuros).
 * - Um mapa de normais arredonda a beirada de cada cubo, dando o aspecto de plástico macio.
 * - Logos e textos são adesivos (decalques) nítidos por cima dos voxels; hastes finas fazem arames.
 * - Cada parte é um grupo com o próprio pivô, então dá para animar braços, pernas e acessórios.
 *
 * Uso:
 *   const pet = criarPet3D(gerarPet('xicara'));
 *   cena.add(pet.raiz);
 *   // a cada quadro:
 *   animarPet(pet, segundos, 'andar');
 */
import * as THREE from 'three';
import { CAMINHO as CAMINHO_LOGO } from './logo.js';

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
const LUZ_OCLUSAO = [0.64, 0.79, 0.91, 1];

let materiais;

/** Junta bem suave entre os cubos (multiplicada pela cor). */
function texturaJunta() {
  const lado = 64;
  const tela = document.createElement('canvas');
  tela.width = tela.height = lado;
  const g = tela.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, lado, lado);
  for (const [recuo, alfa] of [[0, 0.06], [2, 0.025]]) {
    g.strokeStyle = `rgba(0, 0, 0, ${alfa})`;
    g.lineWidth = 2;
    g.strokeRect(recuo + 1, recuo + 1, lado - 2 * recuo - 2, lado - 2 * recuo - 2);
  }
  const textura = new THREE.CanvasTexture(tela);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = 4;
  return textura;
}

/** Mapa de normais que inclina a beirada de cada face: cada voxel parece um cubo de quinas arredondadas. */
function texturaNormalBisel() {
  const lado = 64, largura = 0.13, forca = 0.6;
  const tela = document.createElement('canvas');
  tela.width = tela.height = lado;
  const g = tela.getContext('2d');
  const img = g.createImageData(lado, lado);
  for (let py = 0; py < lado; py++) {
    for (let px = 0; px < lado; px++) {
      const u = (px + 0.5) / lado, v = 1 - (py + 0.5) / lado;
      const eu = Math.min(u, 1 - u), ev = Math.min(v, 1 - v);
      const nx = eu < largura ? Math.sign(u - 0.5) * (1 - eu / largura) ** 1.5 * forca : 0;
      const ny = ev < largura ? Math.sign(v - 0.5) * (1 - ev / largura) ** 1.5 * forca : 0;
      const d = Math.hypot(nx, ny, 1);
      const o = (py * lado + px) * 4;
      img.data[o] = ((nx / d) * 0.5 + 0.5) * 255;
      img.data[o + 1] = ((ny / d) * 0.5 + 0.5) * 255;
      img.data[o + 2] = ((1 / d) * 0.5 + 0.5) * 255;
      img.data[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const textura = new THREE.CanvasTexture(tela);
  textura.colorSpace = THREE.NoColorSpace;
  textura.anisotropy = 4;
  return textura;
}

function obterMateriais() {
  if (!materiais) {
    const map = texturaJunta();
    const normalMap = texturaNormalBisel();
    materiais = {
      fosco: new THREE.MeshStandardMaterial({ vertexColors: true, map, normalMap, roughness: 0.5, metalness: 0 }),
      brilho: new THREE.MeshBasicMaterial({ vertexColors: true, map }),
    };
  }
  return materiais;
}

const texturasDecalque = new Map();

/** Textura de um decalque: a logo da OpenAI ou um texto, na cor pedida, com fundo transparente. */
function texturaDecalque({ tipo, texto, cor, largura, altura }) {
  const chave = `${tipo}|${texto}|${cor}|${(largura / altura).toFixed(2)}`;
  if (texturasDecalque.has(chave)) return texturasDecalque.get(chave);
  const base = 256;
  const tela = document.createElement('canvas');
  tela.width = Math.round(base * Math.max(1, largura / altura));
  tela.height = Math.round(base * Math.max(1, altura / largura));
  const g = tela.getContext('2d');
  g.fillStyle = cor;
  if (tipo === 'logo') {
    const lado = Math.min(tela.width, tela.height);
    g.translate((tela.width - lado) / 2, (tela.height - lado) / 2);
    g.scale(lado / 24, lado / 24);
    g.fill(new Path2D(CAMINHO_LOGO), 'evenodd');
  } else {
    g.font = `800 ${Math.round(tela.height * 0.62)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(texto, tela.width / 2, tela.height * 0.54);
  }
  const textura = new THREE.CanvasTexture(tela);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = 8;
  texturasDecalque.set(chave, textura);
  return textura;
}

/** Plano do decalque, virado para a normal, um pouco afastado da superfície. */
function malhaDecalque(d, pivo) {
  const material = new THREE.MeshStandardMaterial({
    map: texturaDecalque(d), transparent: true, roughness: 0.55, polygonOffset: true, polygonOffsetFactor: -4,
  });
  const malha = new THREE.Mesh(new THREE.PlaneGeometry(d.largura, d.altura), material);
  const normal = new THREE.Vector3(...d.normal).normalize();
  const cima = Math.abs(normal.y) > 0.9 ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 1, 0);
  const direita = new THREE.Vector3().crossVectors(cima, normal).normalize();
  cima.crossVectors(normal, direita);
  malha.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(direita, cima, normal));
  malha.position.set(d.centro[0] - pivo[0], d.centro[1] - pivo[1], d.centro[2] - pivo[2]).addScaledVector(normal, 0.03);
  malha.receiveShadow = true;
  return malha;
}

/** Cilindro fino entre dois pontos. */
function malhaHaste(h, pivo) {
  const de = new THREE.Vector3(...h.de).sub(new THREE.Vector3(...pivo));
  const para = new THREE.Vector3(...h.para).sub(new THREE.Vector3(...pivo));
  const eixo = new THREE.Vector3().subVectors(para, de);
  const malha = new THREE.Mesh(
    new THREE.CylinderGeometry(h.raio, h.raio, eixo.length(), 10),
    new THREE.MeshStandardMaterial({ color: h.cor, roughness: 0.5 }),
  );
  malha.position.copy(de).addScaledVector(eixo, 0.5);
  malha.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), eixo.normalize());
  malha.castShadow = true;
  return malha;
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
 * Cria o pet 3D. A raiz fica no chão (y = 0), centralizada em x e z. Uma unidade do mundo é uma
 * unidade do projeto (dados.escala voxels finos). Devolve { raiz, grupos, partes, dados }.
 */
export function criarPet3D(dados) {
  const { paleta, limites } = dados;
  const ocupado = new Set();
  for (const p of dados.partes) for (const [x, y, z] of p.voxels) ocupado.add(`${x},${y},${z}`);
  const centro = [(limites.min[0] + limites.max[0] + 1) / 2, limites.min[1], (limites.min[2] + limites.max[2] + 1) / 2];
  const { fosco, brilho } = obterMateriais();

  const raiz = new THREE.Group();
  raiz.name = dados.id;
  const modelo = new THREE.Group();
  modelo.scale.setScalar(1 / (dados.escala ?? 1));
  raiz.add(modelo);
  const grupos = { raiz: modelo };
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
    for (const d of dados.decalques ?? []) if (d.parte === p.nome) grupo.add(malhaDecalque(d, p.pivo));
    for (const h of dados.hastes ?? []) if (h.parte === p.nome) grupo.add(malhaHaste(h, p.pivo));
    grupos[p.pai].add(grupo);
    grupos[p.nome] = grupo;
    pivos[p.nome] = p.pivo;
    grupo.userData.repouso = { posicao: grupo.position.clone() };
  }
  return { raiz, grupos, partes: Object.fromEntries(dados.partes.map((p) => [p.nome, p])), dados };
}

/** Libera a memória de vídeo de um pet que não vai mais ser usado. */
export function descartarPet(pet) {
  pet.raiz.traverse((o) => {
    o.geometry?.dispose();
    if (o.material && o.material !== materiais?.fosco && o.material !== materiais?.brilho) o.material.dispose();
  });
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
  const { grupos, partes, dados } = pet;
  for (const [nome, g] of Object.entries(grupos)) {
    if (nome === 'raiz') continue;
    g.position.copy(g.userData.repouso.posicao);
    g.rotation.set(0, 0, 0);
    g.scale.set(1, 1, 1);
  }
  const S = dados.escala ?? 1; // deslocamentos abaixo estão em unidades do projeto
  const lista = Object.values(partes);
  const bracos = lista.filter((p) => p.tipo === 'braco');
  const pernas = lista.filter((p) => p.tipo === 'perna');
  const sinal = (p) => (p.lado === 'E' ? -1 : 1);
  const corpo = grupos.corpo;
  const pose = dados.pose ?? {};
  const subir = (y) => grupos.raiz.children.forEach((filho) => (filho.position.y += y * S));
  const esticar = (e) => corpo.scale.set(1 / Math.sqrt(e), e, 1 / Math.sqrt(e));

  for (const b of bracos) grupos[b.nome].rotation.z = sinal(b) * (pose[b.nome] ?? 0);
  for (const [nome, angulo] of Object.entries(pose)) if (partes[nome] && partes[nome].tipo !== 'braco') grupos[nome].rotation.z = angulo;
  lista.filter((p) => p.tipo === 'flutuante').forEach((p, i) => {
    grupos[p.nome].position.y += Math.sin(t * 1.8 + i * 2) * 0.45 * S;
    grupos[p.nome].rotation.y = Math.sin(t * 0.7 + i) * 0.3;
  });
  if (grupos.folhas) grupos.folhas.rotation.z = Math.sin(t * 1.6) * 0.06;

  switch (animacao) {
    case 'andar': {
      const f = t * 7.5, s = Math.sin(f);
      for (const p of pernas) grupos[p.nome].rotation.x = s * 0.6 * sinal(p);
      for (const b of bracos) grupos[b.nome].rotation.x = -s * 0.5 * sinal(b);
      corpo.position.y += Math.abs(Math.cos(f)) * 0.7 * S;
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
      corpo.position.y += Math.sin(t * 2.2) * 0.15 * S;
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
      corpo.position.y += Math.sin(t * 2.2) * 0.18 * S;
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
  const [larg, alt, prof] = pet.dados.tamanho.map((v) => v / (pet.dados.escala ?? 1));
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
