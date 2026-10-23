// Mão do mapa: segue o ponteiro sobre o mapa e muda de pose (aberta, agarrando, pinça do zoom).
// Cada dedo dobra na própria junta por CSS, então a troca de pose é animada; a inclinação 3D vem da velocidade.
// Só em mouse/trackpad: no toque não há cursor. Lê as classes que o world.ts põe no canvas.
const fina = matchMedia('(hover: hover) and (pointer: fine)')
const calmo = matchMedia('(prefers-reduced-motion: reduce)')
const canvas = document.getElementById('cena') as HTMLCanvasElement

// Dedo afinando até a ponta, com o vinco da junta do meio. A base fica escondida sob a palma.
// O <g> de fora posiciona e abre o leque; o de dentro (.dedo) é o que a pose dobra.
const dedo = (nome: string, x: number, y: number, comp: number, angulo: number, base = 6.4, ponta = 5.4) => {
  const r = ponta / 2
  const vinco = -comp * 0.5
  return `<g transform="translate(${x} ${y}) rotate(${angulo})"><g class="${nome}">` +
    `<path d="M${-base / 2} 3L${-r} ${-comp + r}A${r} ${r} 0 0 1 ${r} ${-comp + r}L${base / 2} 3Z"/>` +
    `<path class="vinco" d="M${-r * 0.55} ${vinco}h${r * 1.1}" fill="none"/></g></g>`
}
const mao = document.createElement('div')
mao.className = 'mao'
mao.setAttribute('aria-hidden', 'true')
mao.innerHTML = `<svg viewBox="0 0 60 60"><defs><linearGradient id="mao-luz" x1="0" y1="0" x2="1" y2="1">` +
  `<stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#d9ded5"/></linearGradient></defs>` +
  `<g fill="url(#mao-luz)" stroke="#141414" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">` +
  // médio é o mais longo; mínimo é curto e nasce mais baixo; os quatro se abrem em leque
  dedo('dedo indicador', 20.3, 30, 18.5, -9, 7, 6) + dedo('dedo medio', 26.6, 29, 20.5, -2, 7, 6) +
  dedo('dedo anelar', 32.7, 29.5, 19, 5, 6.8, 5.8) + dedo('dedo minimo', 38.2, 31, 14.5, 12, 6, 5) +
  dedo('dedao', 18.4, 39, 16, -50, 7.8, 6.6) +
  // palma sem contorno em cima: os dedos saem dela sem uma linha cortando a base
  `<path d="M16.6 29Q28 26 42 30V41Q42 51 31 51H27.6Q16.6 51 16.6 42Z" stroke="none"/>` +
  `<path d="M16.6 28V42Q16.6 51 27.6 51H31Q42 51 42 41V30" fill="none"/></g></svg>`
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
  mao.style.transform = `translate3d(${x - 19}px, ${y - 25}px, 0) perspective(220px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`
}
requestAnimationFrame(quadro)
