// A passagem entre páginas: uma mudança de canal de televisão antiga (o Jesús, 25.10.2026; antes, desde 24.10, era
// uma dissolução em píxeis). À saída, o corpo da página enche-se de chuvisco, com faixas a rolar; à entrada, o chuvisco
// vai-se embora e deixa ver a página nova. O topo (o logótipo, o menu) fica por cima e não muda: muda só o corpo.
// Só entre páginas do próprio site, e nunca com «reduzir movimento». A única marca é uma linha na memória da sessão do
// separador («vim de um clique interno»), que se apaga logo à chegada (a página da privacidade di-lo).
// Carrega no <head>, sem «defer», para tapar a página antes de ela se desenhar.
(function () {
  var raiz = document.documentElement;
  raiz.classList.add('com-js'); // o menu de bolso e o «ir ao topo» só aparecem quando há JavaScript (src/topo.js)
  var CHAVE = 'plasmatv:passagem';
  var calmo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SAIDA = 280, ENTRADA = 420; // milissegundos
  var GRAO = 3; // cada grão do chuvisco tem 3×3 píxeis do ecrã

  var vimDeDentro = false;
  try { vimDeDentro = sessionStorage.getItem(CHAVE) === '1'; sessionStorage.removeItem(CHAVE); } catch (e) { /* sem memória: sem efeito */ }
  if (vimDeDentro && !calmo) raiz.classList.add('a-entrar');

  // O dia e a noite do topo seguem o relógio, para não recomeçarem a cada página.
  var s = Date.now() / 1000;
  raiz.style.setProperty('--fase-dia', '-' + (s % 90).toFixed(2) + 's');
  raiz.style.setProperty('--fase-varrimento', '-' + (s % 9).toFixed(2) + 's');

  function tela() {
    var c = document.createElement('canvas');
    c.width = Math.ceil(window.innerWidth / GRAO);
    c.height = Math.ceil(window.innerHeight / GRAO);
    c.className = 'passagem';
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:1000;pointer-events:none;image-rendering:pixelated;opacity:0';
    var ctx = c.getContext('2d');
    return { c: c, ctx: ctx, img: ctx.createImageData(c.width, c.height) };
  }

  // Um quadro de chuvisco: grão cinzento ao acaso, com duas faixas mais escuras a rolar para cima e, de vez em
  // quando, uma linha clara, como quando a antena perde o sinal.
  function chuvisco(t, ms) {
    var d = t.img.data, w = t.c.width, h = t.c.height, i = 0;
    var fase = ms / 260;
    var linha = Math.random() < 0.35 ? Math.floor(Math.random() * h) : -1;
    for (var y = 0; y < h; y++) {
      var banda = 0.72 + 0.28 * Math.sin((y / h) * 12.566 + fase * 6.283);
      if (y === linha || y === linha + 1) banda = 1.25;
      for (var x = 0; x < w; x++, i += 4) {
        var v = Math.min(255, Math.random() * 235 * banda) | 0;
        d[i] = v; d[i + 1] = v; d[i + 2] = v + 6 > 255 ? 255 : v + 6; d[i + 3] = 255;
      }
    }
    t.ctx.putImageData(t.img, 0, 0);
  }

  // Corre o chuvisco ao longo de «duracao», com a opacidade dada por «opacidade(p)»; no fim, chama «depois».
  function animar(t, duracao, opacidade, depois) {
    var inicio = null;
    function passo(agora) {
      if (inicio === null) inicio = agora;
      var p = Math.min(1, (agora - inicio) / duracao);
      chuvisco(t, agora - inicio);
      t.c.style.opacity = String(opacidade(p));
      if (p < 1) window.requestAnimationFrame(passo); else depois();
    }
    window.requestAnimationFrame(passo);
  }

  function entrar() {
    if (!raiz.classList.contains('a-entrar')) return;
    var t = tela();
    chuvisco(t, 0);
    t.c.style.opacity = '1';
    document.body.appendChild(t.c);
    raiz.classList.remove('a-entrar');
    animar(t, ENTRADA, function (p) { return p < 0.3 ? 1 : 1 - (p - 0.3) / 0.7; }, function () { t.c.remove(); });
  }

  function sair(destino) {
    var t = tela();
    document.body.appendChild(t.c);
    try { sessionStorage.setItem(CHAVE, '1'); } catch (e) { /* sem memória: a página nova aparece sem passagem */ }
    animar(t, SAIDA, function (p) { return Math.min(1, p * 1.6); }, function () { window.location.href = destino.href; });
  }

  document.addEventListener('click', function (e) {
    if (calmo || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    var destino = new URL(a.href, window.location.href);
    if (destino.origin !== window.location.origin) return;
    if (destino.pathname === window.location.pathname) return; // a mesma página (ou uma âncora nela)
    e.preventDefault();
    sair(destino);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', entrar);
  else entrar();

  // Ao voltar atrás, o navegador pode trazer a página tal como ficou, com o chuvisco por cima: tira-se.
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    raiz.classList.remove('a-entrar');
    var restos = document.querySelectorAll('canvas.passagem');
    for (var i = 0; i < restos.length; i++) restos[i].remove();
  });
})();
