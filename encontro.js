// O encontro: duas famílias de pontos, ocres (o corpo, o palco) e lilases (o código, o ecrã).
// As linhas desenham-se só entre um ponto de cada família, quando se aproximam. Entre iguais, nunca.
// Com «reduzir movimento», desenha-se uma vez e fica quieto.
(function () {
  var c = document.getElementById('encontro');
  if (!c || !c.getContext) return;
  var ctx = c.getContext('2d');
  var calmo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var OCRE = [200, 134, 10], LILAS = [169, 156, 255];
  var pts = [], W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), visivel = true;

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

  function desenhar() {
    ctx.clearRect(0, 0, W, H);
    var D = Math.max(110, Math.min(170, W / 7));
    for (var i = 0; i < pts.length; i++) {
      var a = pts[i]; if (a.f !== 0) continue;
      for (var j = 0; j < pts.length; j++) {
        var b = pts[j]; if (b.f !== 1) continue;
        var dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < D) {
          var k = 1 - d / D, g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
          g.addColorStop(0, cor(OCRE, 0.55 * k)); g.addColorStop(1, cor(LILAS, 0.55 * k));
          ctx.strokeStyle = g; ctx.lineWidth = 0.8;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    for (var m = 0; m < pts.length; m++) {
      var p = pts[m]; ctx.fillStyle = cor(p.f ? LILAS : OCRE, 0.85);
      ctx.beginPath(); ctx.arc(p.x, p.y, p.f ? 1.6 : 2.1, 0, Math.PI * 2); ctx.fill();
    }
  }

  function mover() {
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i]; p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
    }
  }

  function ciclo() {
    if (visivel && !document.hidden) { mover(); desenhar(); }
    window.requestAnimationFrame(ciclo);
  }

  medir(); desenhar();
  window.addEventListener('resize', function () { medir(); desenhar(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visivel = e[0].isIntersecting; }).observe(c);
  }
  if (!calmo) window.requestAnimationFrame(ciclo);
})();
