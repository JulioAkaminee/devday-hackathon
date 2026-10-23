/**
 * Telão do evento: QR para entrar e os números da sala ao vivo.
 * Página independente do SPA, para abrir num monitor ou projetor. Sem build e sem dependência de CDN.
 */

const estilos = `
  :root{--tinta:#141414;--papel:#fff;--verde:#22b04b;--cinza:#6e6e6e;--fio:#e4e4e0;--suave:#f4f4f1}
  *{box-sizing:border-box}
  html,body{margin:0;height:100%;background:var(--papel);color:var(--tinta);
    font-family:'Inter Tight','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;
    overflow:hidden;user-select:none}
  .tela{height:100%;display:grid;grid-template-rows:auto 1fr auto;gap:0}
  header{display:flex;align-items:center;gap:14px;padding:22px 40px;border-bottom:2px solid var(--tinta)}
  header svg{width:44px;height:44px;flex:none}
  header b{font-size:2rem;letter-spacing:-.04em;font-weight:600}
  header span{margin-left:auto;font-size:1rem;color:var(--cinza);text-align:right;line-height:1.25}
  main{display:grid;grid-template-columns:1.35fr .65fr;gap:40px;padding:40px;min-height:0}
  .numeros{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;align-content:center}
  .num{border-top:4px solid var(--tinta);padding-top:14px}
  .num b{display:block;font-size:clamp(64px,11vw,190px);line-height:.86;letter-spacing:-.055em;font-variant-numeric:tabular-nums}
  .num small{display:block;margin-top:10px;font-size:clamp(14px,1.3vw,22px);color:var(--cinza);font-weight:500}
  .num.verde{border-color:var(--verde)}
  .num.verde b{color:var(--verde)}
  .lado{display:flex;flex-direction:column;justify-content:center;gap:26px;border-left:2px solid var(--fio);padding-left:40px}
  .qr{text-align:center}
  .qr img{width:min(300px,20vw);height:auto;display:block;margin:0 auto 14px}
  .qr b{font-size:1.4rem;letter-spacing:-.02em}
  .qr small{display:block;color:var(--cinza);font-size:1rem;margin-top:6px}
  footer{border-top:2px solid var(--tinta);padding:20px 40px;display:flex;align-items:baseline;gap:18px}
  footer p{margin:0;font-size:clamp(18px,2vw,34px);font-weight:600;letter-spacing:-.03em}
  footer span{margin-left:auto;color:var(--cinza);font-size:.95rem}
  footer .ao-vivo{margin-left:16px}
  .online{display:flex;align-items:center;gap:9px;color:var(--tinta);font-size:clamp(15px,1.4vw,22px);font-weight:600;letter-spacing:-.01em}
  .online i{width:10px;height:10px;border-radius:50%;background:var(--verde);animation:pulso 2.2s ease-in-out infinite}
  .online b{font-variant-numeric:tabular-nums}
  @keyframes pulso{50%{opacity:.3}}
  #topo{list-style:none;margin:0;padding:0;display:grid;gap:8px;font-size:clamp(13px,1.1vw,18px)}
  #topo li{display:flex;gap:10px;align-items:baseline;color:var(--cinza)}
  #topo b{color:var(--tinta);font-weight:600}
  #topo em{margin-left:auto;font-style:normal;font-variant-numeric:tabular-nums;color:var(--verde);font-weight:600}
  .vazio{color:var(--cinza);font-size:1rem}
  @media (max-aspect-ratio:1/1){main{grid-template-columns:1fr;gap:24px}.lado{border-left:0;padding-left:0}.qr img{width:180px}}
`

const roteiro = `
  const $ = (id) => document.getElementById(id);
  const desenhar = (d) => {
    $('pessoas').textContent = d.pessoas;
    $('encontros').textContent = d.encontros;
    $('linkedins').textContent = d.linkedins ? ' · ' + d.linkedins + (d.linkedins === 1 ? ' trocou' : ' trocaram') + ' LinkedIn' : '';
    $('finais').textContent = d.finais;
    const lista = $('topo');
    lista.innerHTML = '';
    if (!d.top.length) {
      const p = document.createElement('li');
      p.className = 'vazio';
      p.textContent = 'Seja o primeiro: monte seu pet no celular.';
      lista.append(p);
      return;
    }
    for (const t of d.top) {
      const li = document.createElement('li');
      const nome = document.createElement('b');
      nome.textContent = t.nome;
      const dono = document.createElement('span');
      dono.textContent = t.dono;
      const n = document.createElement('em');
      n.textContent = t.conhecidos + (t.conhecidos === 1 ? ' conexão' : ' conexões');
      li.append(nome, dono, n);
      lista.append(li);
    }
  };
  const puxar = () => fetch('/api/stats', { cache: 'no-store' }).then((r) => r.json()).then(desenhar).catch(() => {});
  puxar();
  setInterval(puxar, 3000);

  // quantas pessoas estão com o app aberto agora: se a rota falhar ou vier zero, o bloco some
  const online = $('online');
  const onlineN = $('onlineN');
  const puxarOnline = () => fetch('/api/online', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      const n = d && typeof d.total === 'number' ? d.total : 0;
      onlineN.textContent = n;
      online.hidden = n <= 0;
    })
    .catch(() => { online.hidden = true; });
  puxarOnline();
  setInterval(puxarOnline, 5000);
`

export function telao(qr: string, url: string) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Quebra-Gelo · telão do evento</title>
<style>${estilos}</style>
</head>
<body>
<div class="tela">
  <header>
    <svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="22" r="18" fill="#22b04b"/><g fill="none" stroke="#141414" stroke-width="2.4"><ellipse cx="11" cy="17" rx="3.2" ry="4.2"/><ellipse cx="24" cy="16.5" rx="3.2" ry="4.2"/></g></svg>
    <b>Quebra-Gelo</b>
    <span>DevDay · Community Hackathon<br>São Paulo</span>
  </header>
  <main>
    <div class="numeros">
      <div class="num"><b id="pessoas">0</b><small>pessoas com pet</small></div>
      <div class="num verde"><b id="encontros">0</b><small>encontros entre gente de verdade<span id="linkedins"></span></small></div>
      <div class="num"><b id="finais">0</b><small>chegaram a um final</small></div>
    </div>
    <div class="lado">
      <div class="qr">
        <img src="${qr}" alt="QR para entrar no Quebra-Gelo">
        <b>Aponte a câmera e crie seu pet em 30 segundos</b>
        <small>${url}</small>
      </div>
      <ul id="topo"></ul>
    </div>
  </main>
  <footer>
    <p>Encontre 4 pessoas pelo evento. Seu pet só cresce quando você conversa com alguém de verdade.</p>
    <span class="online" id="online" hidden><i></i><b id="onlineN">0</b> online agora</span>
    <span class="ao-vivo">ao vivo</span>
  </footer>
</div>
<script>${roteiro}</script>
</body>
</html>`
}
