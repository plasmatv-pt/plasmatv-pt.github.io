// A passagem entre páginas: uma mudança de canal de televisão antiga (o Jesús, 25.10.2026). O desenho está todo em
// src/estilo.css (html.a-sair, html.a-entrar); aqui só se decide quando.
// Entre duas páginas há sempre uma pausa (a página nova vem pela rede). Para que não se veja (o Jesús, 25.10.2026):
//  - a página seguinte pede-se cedo, logo que o rato passa ou o dedo toca numa ligação (rel=prefetch);
//  - o chuvisco da saída não pára: fica vivo até a página nova chegar, por mais que demore;
//  - a página nova já nasce com chuvisco (só CSS), sem esperar pelo JavaScript nem passar pelo negro.
// Só entre páginas do próprio site, e nunca com «reduzir movimento». A única marca é uma linha na memória da sessão do
// separador («vim de um clique interno», e se o menu do telemóvel estava aberto), que se apaga logo à chegada (a página
// da privacidade di-lo).
// Com o som ligado, a saída soa como o botão de uma televisão antiga a mudar de canal: um estalido e um sopro de
// chuvisco, baixinho (o Jesús, 25.10.2026). O som faz-se aqui, na hora (Web Audio), sem ficheiros. Só soa ao clicar,
// nunca sozinho. Quem o desliga (o botão do topo, src/topo.js) fica sem ele até fechar o separador.
// Carrega no <head>, sem «defer», para pôr o chuvisco antes de a página se desenhar.
(function () {
  var raiz = document.documentElement;
  raiz.classList.add('com-js'); // o menu de bolso e o «ir ao topo» só aparecem quando há JavaScript (src/topo.js)
  var CHAVE = 'plasmatv:passagem';
  try { if (sessionStorage.getItem('plasmatv:som') === 'nao') raiz.classList.add('sem-som'); } catch (e) { /* sem memória: som ligado */ }
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

  // A mudança de canal, em som: o estalido do botão (um baque grave e um clique) e um sopro de chuvisco que vem e se vai
  // em pouco mais de um quarto de segundo, a tempo de acabar antes de a página mudar. Volume baixo, para não incomodar.
  var VOLUME = 0.05;
  function somDeCanal() {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    try {
      var ac = new Ctx();
      var t = ac.currentTime + 0.01;
      var saida = ac.createGain();
      saida.gain.value = VOLUME;
      saida.connect(ac.destination);

      var n = Math.floor(ac.sampleRate * 0.3);
      var grao = ac.createBuffer(1, n, ac.sampleRate);
      var d = grao.getChannelData(0);
      for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;

      // o clique do botão: um grão curtíssimo, agudo
      var clique = ac.createBufferSource(); clique.buffer = grao;
      var agudo = ac.createBiquadFilter(); agudo.type = 'highpass'; agudo.frequency.value = 2500;
      var gc = ac.createGain();
      gc.gain.setValueAtTime(1.6, t); gc.gain.exponentialRampToValueAtTime(0.001, t + 0.012);
      clique.connect(agudo); agudo.connect(gc); gc.connect(saida);
      clique.start(t); clique.stop(t + 0.02);

      // o baque do botão: um tom grave que cai
      var baque = ac.createOscillator(); baque.type = 'sine';
      baque.frequency.setValueAtTime(140, t); baque.frequency.exponentialRampToValueAtTime(60, t + 0.05);
      var gb = ac.createGain();
      gb.gain.setValueAtTime(1.2, t); gb.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      baque.connect(gb); gb.connect(saida);
      baque.start(t); baque.stop(t + 0.07);

      // o chuvisco: ruído pelo meio da banda, com a antena a falhar (o volume a tremer)
      var sopro = ac.createBufferSource(); sopro.buffer = grao;
      var banda = ac.createBiquadFilter(); banda.type = 'bandpass'; banda.frequency.value = 2800; banda.Q.value = 0.6;
      var gs = ac.createGain();
      gs.gain.setValueAtTime(0.0001, t + 0.015);
      gs.gain.exponentialRampToValueAtTime(0.9, t + 0.045);
      for (var k = 1; k <= 6; k++) gs.gain.setValueAtTime(0.5 + Math.random() * 0.45, t + 0.045 + k * 0.025);
      gs.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
      sopro.connect(banda); banda.connect(gs); gs.connect(saida);
      sopro.start(t + 0.015); sopro.stop(t + 0.28);

      window.setTimeout(function () { if (ac.close) ac.close(); }, 400);
    } catch (e) { /* sem som: a passagem faz-se na mesma */ }
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var destino = interna(e.target);
    if (!destino) return;
    e.preventDefault();
    pedirCedo(destino);
    var menuAberto = !!document.querySelector('.topo.aberto');
    try { sessionStorage.setItem(CHAVE, menuAberto ? 'menu' : '1'); } catch (err) { /* sem memória: a página nova aparece sem chuvisco */ }
    raiz.classList.add('a-sair');
    if (!raiz.classList.contains('sem-som')) somDeCanal();
    window.setTimeout(function () { window.location.href = destino.href; }, SAIDA);
  });

  // Ao voltar atrás, o navegador pode trazer a página tal como ficou, com o chuvisco por cima: tira-se.
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) raiz.classList.remove('a-sair', 'a-entrar');
  });
})();
