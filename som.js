// Os sons do site (o Jesús, 25.10.2026): todos do mesmo aparelho, uma televisão antiga, e todos baixinhos.
//  - canal: mudar de página (src/transicao.js) — o estalido do botão e um sopro de chuvisco;
//  - sintonizar: mudar de língua (src/transicao.js) — um assobio que desliza e um sopro que se afina;
//  - abrir / fechar: abrir e fechar as caixas (a língua, o menu do telemóvel; src/topo.js) — um tique discreto;
//  - ligar: ligar o som (src/topo.js) — um sinal curto, que diz que o som voltou.
// Fazem-se na hora (Web Audio), sem ficheiros. Só soam depois de um toque ou clique, nunca sozinhos.
// Uma só «mesa de som» por página, acordada logo no primeiro toque: no telemóvel, a saída de áudio adormece quando
// não se ouve nada, e demora uma fração de segundo a acordar; um som curto, tocado a frio, perdia-se nesse tempo.
// Quem desliga o som fica sem ele até fechar o separador (a única marca é essa, na memória do separador).
// Carrega no <head>, antes de src/transicao.js, para o ícone do som nascer já certo.
(function () {
  var raiz = document.documentElement;
  var CHAVE = 'plasmatv:som';
  try { if (sessionStorage.getItem(CHAVE) === 'nao') raiz.classList.add('sem-som'); } catch (e) { /* sem memória: som ligado */ }

  var VOLUME = 0.05;
  var ac = null, saida = null, grao = null;

  function ligado() { return !raiz.classList.contains('sem-som'); }

  // A mesa de som desta página: cria-se no primeiro toque e acorda-se sempre que é precisa.
  function mesa() {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    try {
      if (!ac) {
        ac = new Ctx();
        saida = ac.createGain();
        saida.gain.value = VOLUME;
        saida.connect(ac.destination);
        var n = Math.floor(ac.sampleRate * 0.3);
        grao = ac.createBuffer(1, n, ac.sampleRate);
        var d = grao.getChannelData(0);
        for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ac.state === 'suspended' && ac.resume) {
        var acordar = ac.resume();
        if (acordar && acordar.catch) acordar.catch(function () { /* não acordou: fica calada, e o site segue */ });
      }
      return ac;
    } catch (e) { return null; }
  }
  // Acordar a mesa no primeiro toque (e a cada toque, se voltou a adormecer), antes de ser precisa.
  ['pointerdown', 'touchstart', 'keydown'].forEach(function (tipo) {
    document.addEventListener(tipo, function () { if (ligado()) mesa(); }, { passive: true, capture: true });
  });

  // Um envelope: sobe de quase nada a «pico» e cai até quase nada em «dura» segundos.
  function envelope(g, t, pico, dura) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(pico, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dura);
  }
  function ruido(t, dura, filtro, freq, q, pico, destino) {
    var s = ac.createBufferSource(); s.buffer = grao;
    var f = ac.createBiquadFilter(); f.type = filtro; f.frequency.value = freq; if (q) f.Q.value = q;
    var g = ac.createGain();
    envelope(g, t, pico, dura);
    s.connect(f); f.connect(g); g.connect(destino || saida);
    s.start(t, Math.random() * 0.1); s.stop(t + dura + 0.02);
    return g;
  }
  function tom(t, de, para, dura, pico, forma) {
    var o = ac.createOscillator(); o.type = forma || 'sine';
    o.frequency.setValueAtTime(de, t); o.frequency.exponentialRampToValueAtTime(para, t + dura);
    var g = ac.createGain();
    envelope(g, t, pico, dura);
    o.connect(g); g.connect(saida);
    o.start(t); o.stop(t + dura + 0.02);
  }

  // Cada som devolve o instante (no relógio da mesa) em que acaba, ou null se não soou.
  var sons = {
    // o estalido do botão (um clique e um baque grave) e um sopro de chuvisco com a antena a falhar
    canal: function (t) {
      ruido(t, 0.012, 'highpass', 2500, 0, 1.6);
      tom(t, 140, 60, 0.06, 1.2);
      var s = ac.createBufferSource(); s.buffer = grao;
      var f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2800; f.Q.value = 0.6;
      var g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.9, t + 0.045);
      for (var k = 1; k <= 6; k++) g.gain.setValueAtTime(0.5 + Math.random() * 0.45, t + 0.045 + k * 0.025);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
      s.connect(f); f.connect(g); g.connect(saida);
      s.start(t + 0.015); s.stop(t + 0.28);
      return t + 0.27;
    },
    // um tique de interruptor, mais agudo a abrir e mais grave a fechar
    abrir: function (t) { ruido(t, 0.02, 'bandpass', 3200, 1.2, 1.8); tom(t, 900, 700, 0.035, 0.32, 'triangle'); return t + 0.045; },
    fechar: function (t) { ruido(t, 0.02, 'bandpass', 2200, 1.2, 1.6); tom(t, 620, 480, 0.035, 0.3, 'triangle'); return t + 0.045; },
    // o som de volta: dois tons curtos a subir, como uma televisão a acordar
    // a outra língua a chegar como uma estação sintonizada: um assobio que desliza e um sopro que se afina
    sintonizar: function (t) {
      var o = ac.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(420, t);
      o.frequency.exponentialRampToValueAtTime(1500, t + 0.18);
      o.frequency.exponentialRampToValueAtTime(880, t + 0.42);
      var g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.6, t + 0.03);
      g.gain.setValueAtTime(0.6, t + 0.3);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      o.connect(g); g.connect(saida);
      o.start(t); o.stop(t + 0.47);
      var s = ac.createBufferSource(); s.buffer = grao;
      var f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 4;
      f.frequency.setValueAtTime(900, t);
      f.frequency.exponentialRampToValueAtTime(3500, t + 0.2);
      f.frequency.exponentialRampToValueAtTime(2000, t + 0.42);
      var gs = ac.createGain();
      envelope(gs, t, 1.4, 0.45);
      s.connect(f); f.connect(gs); gs.connect(saida);
      s.start(t); s.stop(t + 0.47);
      return t + 0.46;
    },
    ligar: function (t) { tom(t, 520, 540, 0.07, 0.35, 'sine'); tom(t + 0.08, 780, 800, 0.09, 0.35, 'sine'); return t + 0.18; },
  };

  // Toca um som, se o som estiver ligado. Devolve uma função que diz se ele já acabou de soar.
  function tocar(nome) {
    if (!ligado() || !sons[nome] || !mesa()) return null;
    try {
      var fim = sons[nome](ac.currentTime + 0.01);
      return function () { return ac.state !== 'running' ? false : ac.currentTime >= fim; };
    } catch (e) { return null; }
  }

  function alternar() {
    var calar = ligado();
    raiz.classList.toggle('sem-som', calar);
    try {
      if (calar) sessionStorage.setItem(CHAVE, 'nao');
      else sessionStorage.removeItem(CHAVE);
    } catch (e) { /* sem memória: a escolha vale só nesta página */ }
    if (!calar) tocar('ligar');
    return !calar;
  }

  window.plasmatvSom = { tocar: tocar, ligado: ligado, alternar: alternar };
})();
