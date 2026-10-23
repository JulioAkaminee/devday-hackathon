// Mão do mapa: segue o ponteiro sobre o mapa e muda de pose (aberta, agarrando, pinça do zoom).
// Cada dedo dobra na própria junta por CSS, então a troca de pose é animada; a inclinação 3D vem da velocidade.
// Só em mouse/trackpad: no toque não há cursor. Lê as classes que o world.ts põe no canvas.
const fina = matchMedia('(hover: hover) and (pointer: fine)')
const calmo = matchMedia('(prefers-reduced-motion: reduce)')
const canvas = document.getElementById('cena') as HTMLCanvasElement

const dedo = (nome: string, x: number, topo: number) =>
  `<rect class="dedo ${nome}" x="${x}" y="${topo}" width="6" height="${30 - topo}" rx="3"/>`
const mao = document.createElement('div')
mao.className = 'mao'
mao.setAttribute('aria-hidden', 'true')
mao.innerHTML = `<svg viewBox="0 0 48 48"><defs><linearGradient id="mao-luz" x1="0" y1="0" x2="1" y2="1">` +
  `<stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#d9ded5"/></linearGradient></defs>` +
  `<g fill="url(#mao-luz)" stroke="#141414" stroke-width="1.9" stroke-linejoin="round">` +
  `${dedo('indicador', 14, 8)}${dedo('medio', 19.7, 5)}${dedo('anelar', 25.4, 6.5)}${dedo('minimo', 31.1, 10)}` +
  `<rect class="dedao" x="9.5" y="21" width="6.6" height="17" rx="3.3"/>` +
  // palma sem contorno em cima: os dedos saem dela sem uma linha cortando a base
  `<path d="M14 23h23.1v9.5a10 10 0 0 1-10 10h-3.3a9.8 9.8 0 0 1-9.8-9.8z" stroke="none"/>` +
  `<path d="M14 22v10.7a9.8 9.8 0 0 0 9.8 9.8h3.3a10 10 0 0 0 10-10V22" fill="none"/>` +
  `</g></svg>`
document.body.append(mao)

let x = 0, y = 0, px = 0, py = 0, rx = 0, ry = 0, vrx = 0, vry = 0, ativa = false, antes = performance.now()
addEventListener('pointermove', (e) => {
  x = e.clientX; y = e.clientY
  const sobre = fina.matches && e.target === canvas && document.body.classList.contains('jogando')
  if (sobre !== ativa) { ativa = sobre; canvas.classList.toggle('mao-ativa', sobre); mao.classList.toggle('visivel', sobre) }
})
document.documentElement.addEventListener('pointerleave', () => { ativa = false; canvas.classList.remove('mao-ativa'); mao.classList.remove('visivel') })

function quadro(agora: number) {
  requestAnimationFrame(quadro)
  const dt = Math.min(0.05, (agora - antes) / 1000)
  antes = agora
  if (!ativa) return
  const c = canvas.classList
  mao.dataset.pose = c.contains('zoom-mais') ? 'mais' : c.contains('zoom-menos') ? 'menos' : c.contains('arrastando') ? 'fechada' : 'aberta'
  // inclina para o lado do movimento, como uma mão de verdade arrastando o ar (mola criticamente amortecida)
  const vx = dt ? (x - px) / dt : 0, vy = dt ? (y - py) / dt : 0
  px = x; py = y
  const alvoY = calmo.matches ? 0 : Math.max(-28, Math.min(28, vx * 0.03))
  const alvoX = calmo.matches ? 0 : Math.max(-28, Math.min(28, -vy * 0.03))
  const k = 160, d = 2 * Math.sqrt(k)
  vry += (k * (alvoY - ry) - d * vry) * dt; ry += vry * dt
  vrx += (k * (alvoX - rx) - d * vrx) * dt; rx += vrx * dt
  mao.style.transform = `translate3d(${x - 23}px, ${y - 20}px, 0) perspective(220px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`
}
requestAnimationFrame(quadro)
