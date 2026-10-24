// A passagem entre páginas: uma dissolução em píxeis (pedido do Jesús, 24.10.2026).
// À saída, a página desfaz-se em quadrados da cor da página seguinte; à entrada, a página nova aparece quadrado a
// quadrado. Só entre páginas do próprio site, e nunca com «reduzir movimento». Sem guardar nada: a única marca é uma
// linha na memória da sessão do separador («vim de um clique interno»), que se apaga logo à chegada.
// Carrega no <head>, sem «defer», para tapar a página antes de ela se desenhar.
(function () {
  var raiz = document.documentElement;
  var CHAVE = 'plasmatv:passagem';
  var calmo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var OCRE = '#c8860a', NOITE = '#15131c';
  var SAIDA = 300, ENTRADA = 420; // milissegundos

  var vimDeDentro = false;
  try { vimDeDentro = sessionStorage.getItem(CHAVE) === '1'; sessionStorage.removeItem(CHAVE); } catch (e) { /* sem memória: sem efeito */ }
  if (vimDeDentro && !calmo) raiz.classList.add('a-entrar');

  function corDe(caminho) { return /^\/(en\/)?teatro\//.test(caminho) ? OCRE : NOITE; }

  function tela() {
    var lado = Math.max(14, Math.round(Math.min(window.innerWidth, window.innerHeight) / 26));
    var cols = Math.ceil(window.innerWidth / lado), linhas = Math.ceil(window.innerHeight / lado);
    var c = document.createElement('canvas');
    c.width = cols * lado; c.height = linhas * lado;
    c.className = 'passagem';
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:fixed;left:0;top:0;width:' + c.width + 'px;height:' + c.height + 'px;z-index:2147483647;pointer-events:none';
    var ordem = [];
    for (var i = 0; i < cols * linhas; i++) ordem.push(i);
    for (var j = ordem.length - 1; j > 0; j--) { var k = Math.floor(Math.random() * (j + 1)); var t = ordem[j]; ordem[j] = ordem[k]; ordem[k] = t; }
    return { c: c, ctx: c.getContext('2d'), lado: lado, cols: cols, ordem: ordem };
  }

  // Desenha (ou apaga) os quadrados pela ordem sorteada, ao longo de «duracao»; no fim, chama «depois».
  function animar(t, duracao, pintar, depois) {
    var feitos = 0, inicio = null, total = t.ordem.length;
    function passo(agora) {
      if (inicio === null) inicio = agora;
      var p = Math.min(1, (agora - inicio) / duracao);
      var alvo = Math.floor(total * p);
      for (; feitos < alvo; feitos++) {
        var n = t.ordem[feitos];
        pintar((n % t.cols) * t.lado, Math.floor(n / t.cols) * t.lado, t.lado);
      }
      if (p < 1) window.requestAnimationFrame(passo); else depois();
    }
    window.requestAnimationFrame(passo);
  }

  function entrar() {
    if (!raiz.classList.contains('a-entrar')) return;
    var t = tela();
    t.ctx.fillStyle = window.getComputedStyle(document.body).backgroundColor;
    t.ctx.fillRect(0, 0, t.c.width, t.c.height);
    document.body.appendChild(t.c);
    raiz.classList.remove('a-entrar');
    animar(t, ENTRADA, function (x, y, l) { t.ctx.clearRect(x, y, l, l); }, function () { t.c.remove(); });
  }

  function sair(destino) {
    var t = tela();
    t.ctx.fillStyle = corDe(destino.pathname);
    document.body.appendChild(t.c);
    try { sessionStorage.setItem(CHAVE, '1'); } catch (e) { /* sem memória: a página nova aparece sem dissolução */ }
    animar(t, SAIDA, function (x, y, l) { t.ctx.fillRect(x, y, l, l); }, function () { window.location.href = destino.href; });
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

  // Ao voltar atrás, o navegador pode trazer a página tal como ficou, com os quadrados por cima: tiram-se.
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    raiz.classList.remove('a-entrar');
    var restos = document.querySelectorAll('canvas.passagem');
    for (var i = 0; i < restos.length; i++) restos[i].remove();
  });
})();
