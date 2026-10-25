// O encontro: duas famílias de pontos, ocres (o corpo, o palco) e lilases (o código, o ecrã).
// As ligações desenham-se só entre um ponto de cada família, quando se aproximam. Entre iguais, nunca.
// As ligações são linhas retas. Às vezes, uma descarga de plasma passa por elas (o Jesús, 25.10.2026; o arco partido
// vem do plasmateatro.pt): quase meio segundo quando dois pontos se enlaçam; uma breve de vez em quando, enquanto estão
// juntos (em média, uma a cada quatro ou cinco segundos por ligação); e uma última quando se separam.
// Os pontos vagueiam um pouco, em vez de andarem a direito.
// Com «reduzir movimento», desenha-se uma vez e fica quieto, só com as linhas retas.
// Carrega em todas as páginas: como a página não se desmonta (src/transicao.js), a constelação acorda quando se chega
// à página inicial e adormece quando se sai dela (o aviso «plasmatv:pagina»).
(function () {
  var c = null, ctx = null;
  var calmo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var OCRE = [200, 134, 10], LILAS = [169, 156, 255];
  var pts = [], W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), visivel = true;
  var observador = null, aCorrer = false;
  var ligados = {}, separados = []; // as ligações de agora (com a descarga que levam) e as que acabam de se desfazer
  var primeira = true; // na primeira imagem, as ligações que já lá estão não «nascem»: não acendem todas de uma vez
  // Durações em milissegundos. Só uma parte dos enlaces e das separações acende (PARTE), e cada ligação tem, a cada
  // imagem, uma probabilidade pequena (ACASO) de um lampejo: no computador, à volta de duas descargas por segundo no
  // ecrã inteiro; no telemóvel, uma a cada três segundos (medido a 25.10.2026, depois de o Jesús as achar intensas).
  var ENLACE = 450, LAMPEJO = 140, SEPARACAO = 350, PARTE = 0.4, ACASO = 0.00015;

  function semente(n) { var x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); }
  function cor(rgb, a) { return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')'; }

  function medir() {
    var r = c.getBoundingClientRect();
    var novoW = r.width, novoH = r.height;
    if (pts.length && W && H) {
      for (var i = 0; i < pts.length; i++) { pts[i].x *= novoW / W; pts[i].y *= novoH / H; }
    }
    W = novoW; H = novoH;
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!pts.length) {
      var n = Math.max(16, Math.min(70, Math.round(W * H / 15000)));
      for (var k = 0; k < n; k++) {
        pts.push({ x: semente(k) * W, y: semente(k + 101) * H, vx: (semente(k + 7) - 0.5) * 0.24, vy: (semente(k + 13) - 0.5) * 0.24, f: k % 2 });
      }
    }
  }

  function linha(a, b, k) {
    var g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
    g.addColorStop(0, cor(OCRE, 0.55 * k)); g.addColorStop(1, cor(LILAS, 0.55 * k));
    ctx.strokeStyle = g; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }

  function desenhar() {
    ctx.clearRect(0, 0, W, H);
    var D = Math.max(110, Math.min(170, W / 7));
    var agora = performance.now(), agoraLigados = {};
    for (var i = 0; i < pts.length; i++) {
      var a = pts[i]; if (a.f !== 0) continue;
      for (var j = 0; j < pts.length; j++) {
        var b = pts[j]; if (b.f !== 1) continue;
        var dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d >= D) continue;
        var k = 1 - d / D, chave = i + ':' + j, l = ligados[chave];
        if (!l) l = { ate: calmo || primeira || Math.random() > PARTE ? 0 : agora + ENLACE }; // acabam de se enlaçar
        else if (!calmo && agora > l.ate && Math.random() < ACASO) l.ate = agora + LAMPEJO; // um lampejo de vez em quando
        agoraLigados[chave] = l;
        linha(a, b, k);
        if (agora < l.ate && Math.random() < 0.7) descarga(a, b, Math.max(k, 0.35)); // tremeluz enquanto dura
      }
    }
    // As que se desfizeram nesta imagem levam uma última descarga, enquanto os pontos se afastam.
    if (!calmo) {
      for (var ch in ligados) {
        if (!agoraLigados[ch] && Math.random() < PARTE) { var par = ch.split(':'); separados.push({ a: pts[+par[0]], b: pts[+par[1]], ate: agora + SEPARACAO }); }
      }
      separados = separados.filter(function (s) { return agora < s.ate; });
      separados.forEach(function (s) { if (Math.random() < 0.7) descarga(s.a, s.b, 0.35 * (s.ate - agora) / SEPARACAO); });
    }
    ligados = agoraLigados;
    primeira = false;
    for (var m = 0; m < pts.length; m++) {
      var p = pts[m]; ctx.fillStyle = cor(p.f ? LILAS : OCRE, 0.85);
      ctx.beginPath(); ctx.arc(p.x, p.y, p.f ? 1.6 : 2.1, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Uma descarga entre dois pontos: um arco em sete troços, cada vértice desviado ao acaso (até 14 px), desenhado duas
  // vezes, largo e ténue (o halo) e fino e vivo (o fio), com a cor a passar do ocre ao lilás.
  var TROCOS = 7, DESVIO = 14;
  function descarga(a, b, k) {
    var xs = [a.x], ys = [a.y];
    for (var t = 1; t < TROCOS; t++) {
      xs.push(a.x + (b.x - a.x) * t / TROCOS + (Math.random() - 0.5) * DESVIO);
      ys.push(a.y + (b.y - a.y) * t / TROCOS + (Math.random() - 0.5) * DESVIO);
    }
    xs.push(b.x); ys.push(b.y);
    [[3.4, 0.2], [1, 0.95]].forEach(function (camada) {
      var g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      g.addColorStop(0, cor(OCRE, camada[1] * k)); g.addColorStop(1, cor(LILAS, camada[1] * k));
      ctx.strokeStyle = g; ctx.lineWidth = camada[0]; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(xs[0], ys[0]);
      for (var n = 1; n < xs.length; n++) ctx.lineTo(xs[n], ys[n]);
      ctx.stroke();
    });
  }

  function mover() {
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      // um vaguear leve: a direção roda um pouco ao acaso, e a velocidade fica sempre a mesma
      var v = Math.sqrt(p.vx * p.vx + p.vy * p.vy) || 0.1, ang = Math.atan2(p.vy, p.vx) + (Math.random() - 0.5) * 0.12;
      p.vx = Math.cos(ang) * v; p.vy = Math.sin(ang) * v;
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
    }
  }

  function ciclo() {
    if (!c) { aCorrer = false; return; } // já não há constelação nesta página: o ciclo pára
    if (visivel && !document.hidden) { mover(); desenhar(); }
    window.requestAnimationFrame(ciclo);
  }

  function iniciar() {
    var novo = document.getElementById('encontro');
    if (novo === c) return;
    if (observador) { observador.disconnect(); observador = null; }
    c = novo && novo.getContext ? novo : null;
    pts = []; W = 0; H = 0; visivel = true; ligados = {}; separados = []; primeira = true;
    if (!c) return;
    ctx = c.getContext('2d');
    medir(); desenhar();
    if ('IntersectionObserver' in window) {
      observador = new IntersectionObserver(function (e) { visivel = e[0].isIntersecting; });
      observador.observe(c);
    }
    if (!calmo && !aCorrer) { aCorrer = true; window.requestAnimationFrame(ciclo); }
  }

  window.addEventListener('resize', function () { if (c) { medir(); desenhar(); } });
  document.addEventListener('plasmatv:pagina', iniciar);
  iniciar();
})();
