/**
 * Logo da OpenAI em pixels, para estampar nas mochilas dos pets.
 *
 * O desenho vem do caminho SVG do Simple Icons (ícone "openai", viewBox 24 × 24). Ele é rasterizado
 * com supersampling: '#' é pixel cheio, '+' é borda (meio coberto) e '.' fica vazio. Com dois tons,
 * a logo continua reconhecível mesmo com 13 a 15 voxels de lado.
 */

export const CAMINHO =
  'M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z';

/** Converte um arco elíptico do SVG (forma de pontas) em pontos. */
function arco(x1, y1, rx, ry, rotacao, grande, horario, x2, y2, saida) {
  const fi = (rotacao * Math.PI) / 180, cos = Math.cos(fi), sen = Math.sin(fi);
  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
  const xp = cos * dx + sen * dy, yp = -sen * dx + cos * dy;
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  const lambda = (xp * xp) / (rx * rx) + (yp * yp) / (ry * ry);
  if (lambda > 1) {
    rx *= Math.sqrt(lambda);
    ry *= Math.sqrt(lambda);
  }
  const num = rx * rx * ry * ry - rx * rx * yp * yp - ry * ry * xp * xp;
  let fator = Math.sqrt(Math.max(0, num / (rx * rx * yp * yp + ry * ry * xp * xp)));
  if (grande === horario) fator = -fator;
  const cxp = (fator * rx * yp) / ry, cyp = (-fator * ry * xp) / rx;
  const cx = cos * cxp - sen * cyp + (x1 + x2) / 2, cy = sen * cxp + cos * cyp + (y1 + y2) / 2;
  const angulo = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const inicio = angulo(1, 0, (xp - cxp) / rx, (yp - cyp) / ry);
  let delta = angulo((xp - cxp) / rx, (yp - cyp) / ry, (-xp - cxp) / rx, (-yp - cyp) / ry);
  if (!horario && delta > 0) delta -= 2 * Math.PI;
  if (horario && delta < 0) delta += 2 * Math.PI;
  const passos = Math.max(4, Math.ceil(Math.abs(delta) / 0.1));
  for (let n = 1; n <= passos; n++) {
    const t = inicio + (delta * n) / passos;
    saida.push([cx + rx * Math.cos(t) * cos - ry * Math.sin(t) * sen, cy + rx * Math.cos(t) * sen + ry * Math.sin(t) * cos]);
  }
}

/** Lê o caminho SVG (comandos M L H V A Z) e devolve uma lista de polígonos. */
function poligonos(d) {
  const tokens = d.match(/[a-zA-Z]|[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/g);
  const lista = [];
  let atual = null, x = 0, y = 0, x0 = 0, y0 = 0, cmd = null, n = 0;
  const num = () => parseFloat(tokens[n++]);
  while (n < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[n])) cmd = tokens[n++];
    const rel = cmd === cmd.toLowerCase();
    switch (cmd.toLowerCase()) {
      case 'm':
        x = x0 = num() + (rel ? x : 0);
        y = y0 = num() + (rel ? y : 0);
        atual = [[x, y]];
        lista.push(atual);
        cmd = rel ? 'l' : 'L';
        break;
      case 'l':
        x = num() + (rel ? x : 0);
        y = num() + (rel ? y : 0);
        atual.push([x, y]);
        break;
      case 'h':
        x = num() + (rel ? x : 0);
        atual.push([x, y]);
        break;
      case 'v':
        y = num() + (rel ? y : 0);
        atual.push([x, y]);
        break;
      case 'a': {
        const [rx, ry, rot, grande, horario] = [num(), num(), num(), num(), num()];
        const nx = num() + (rel ? x : 0), ny = num() + (rel ? y : 0);
        arco(x, y, rx, ry, rot, grande, horario, nx, ny, atual);
        x = nx;
        y = ny;
        break;
      }
      case 'z':
        atual.push([x0, y0]);
        x = x0;
        y = y0;
        break;
      default:
        throw new Error(`Comando de caminho não suportado: ${cmd}`);
    }
  }
  return lista;
}

let formas;

function dentro(px, py) {
  formas ??= poligonos(CAMINHO);
  let par = false;
  for (const poly of formas) {
    for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) {
      const [xa, ya] = poly[a], [xb, yb] = poly[b];
      if ((ya > py) !== (yb > py) && px < ((xb - xa) * (py - ya)) / (yb - ya) + xa) par = !par;
    }
  }
  return par;
}

const cache = new Map();

/** A logo com `lado` × `lado` pixels: linhas de cima para baixo com '#', '+' e '.'. */
export function mascaraLogo(lado) {
  if (cache.has(lado)) return cache.get(lado);
  const amostras = 6;
  const linhas = [];
  for (let r = 0; r < lado; r++) {
    let linha = '';
    for (let c = 0; c < lado; c++) {
      let cobertos = 0;
      for (let a = 0; a < amostras; a++) {
        for (let b = 0; b < amostras; b++) {
          if (dentro(((c + (a + 0.5) / amostras) / lado) * 24, ((r + (b + 0.5) / amostras) / lado) * 24)) cobertos++;
        }
      }
      const f = cobertos / (amostras * amostras);
      linha += f > 0.5 ? '#' : f > 0.2 ? '+' : '.';
    }
    linhas.push(linha);
  }
  cache.set(lado, linhas);
  return linhas;
}
