// A passagem entre páginas: uma mudança de canal de televisão antiga (o Jesús, 25.10.2026). O desenho está todo em
// src/estilo.css (html.a-sair, html.a-entrar); aqui só se decide quando.
// Entre duas páginas há sempre uma pausa (a página nova vem pela rede). Para que não se veja (o Jesús, 25.10.2026):
//  - a página seguinte pede-se cedo, logo que o rato passa ou o dedo toca numa ligação (rel=prefetch);
//  - o chuvisco da saída não pára: fica vivo até a página nova chegar, por mais que demore;
//  - a página nova já nasce com chuvisco (só CSS), sem esperar pelo JavaScript nem passar pelo negro.
// Só entre páginas do próprio site, e nunca com «reduzir movimento». A única marca é uma linha na memória da sessão do
// separador («vim de um clique interno», e se o menu do telemóvel estava aberto), que se apaga logo à chegada (a página
// da privacidade di-lo).
// Carrega no <head>, sem «defer», para pôr o chuvisco antes de a página se desenhar.
(function () {
  var raiz = document.documentElement;
  raiz.classList.add('com-js'); // o menu de bolso e o «ir ao topo» só aparecem quando há JavaScript (src/topo.js)
  var CHAVE = 'plasmatv:passagem';
  var calmo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SAIDA = 240; // milissegundos até o chuvisco tapar tudo e se mudar de página

  var marca = null;
  try { marca = sessionStorage.getItem(CHAVE); sessionStorage.removeItem(CHAVE); } catch (e) { /* sem memória: sem efeito */ }
  // Se a página foi escolhida no menu aberto, a nova começa com ele aberto; src/topo.js fecha-o devagar.
  if (marca === 'menu') raiz.classList.add('menu-vinha-aberto');
  if ((marca === '1' || marca === 'menu') && !calmo) {
    raiz.classList.add('a-entrar');
    // Tira-se quando o chuvisco acabar de ir (ou, se a animação não chegar a correr, ao fim de um segundo e meio).
    var acabar = function () { raiz.classList.remove('a-entrar'); };
    document.addEventListener('animationend', function (e) { if (e.animationName === 'chuvisco-vai') acabar(); });
    window.setTimeout(acabar, 1500);
  }

  // O dia e a noite do topo seguem o relógio, para não recomeçarem a cada página.
  var s = Date.now() / 1000;
  raiz.style.setProperty('--fase-dia', '-' + (s % 90).toFixed(2) + 's');
  raiz.style.setProperty('--fase-varrimento', '-' + (s % 9).toFixed(2) + 's');

  if (calmo) return;

  // Uma ligação para outra página do próprio site (e não para esta, nem para fora), ou nada.
  function interna(alvo) {
    var a = alvo && alvo.closest && alvo.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return null;
    var destino = new URL(a.href, window.location.href);
    if (destino.origin !== window.location.origin || destino.pathname === window.location.pathname) return null;
    return destino;
  }

  var pedidas = {};
  function pedirCedo(destino) {
    if (!destino || pedidas[destino.pathname]) return;
    pedidas[destino.pathname] = true;
    var l = document.createElement('link');
    l.rel = 'prefetch';
    l.href = destino.pathname;
    document.head.appendChild(l);
  }
  ['pointerover', 'touchstart', 'focusin'].forEach(function (tipo) {
    document.addEventListener(tipo, function (e) { pedirCedo(interna(e.target)); }, { passive: true });
  });
  // O grão do chuvisco também se pede cedo, para estar pronto no primeiro clique.
  window.addEventListener('load', function () { new Image().src = '/img/chuvisco.png'; });

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var destino = interna(e.target);
    if (!destino) return;
    e.preventDefault();
    pedirCedo(destino);
    var menuAberto = !!document.querySelector('.topo.aberto');
    try { sessionStorage.setItem(CHAVE, menuAberto ? 'menu' : '1'); } catch (err) { /* sem memória: a página nova aparece sem chuvisco */ }
    raiz.classList.add('a-sair');
    window.setTimeout(function () { window.location.href = destino.href; }, SAIDA);
  });

  // Ao voltar atrás, o navegador pode trazer a página tal como ficou, com o chuvisco por cima: tira-se.
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) raiz.classList.remove('a-sair', 'a-entrar');
  });
})();
