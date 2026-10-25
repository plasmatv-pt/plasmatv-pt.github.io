// O logótipo do topo com plasma (o Jesús, 25.10.2026): enquanto o rato está sobre ele (ou quando se lá chega com o
// teclado), pequenas descargas saltam entre pontos das letras, como numa lâmpada de plasma quando se lhe encosta a
// mão, e as letras ganham um brilho ténue. Os pontos tiram-se da própria imagem (onde ela não é transparente).
// No telemóvel não há rato por cima, por isso não acontece; nunca com «reduzir movimento». Não guarda nada.
(function () {
  var marca = document.querySelector('.marca');
  var img = marca && marca.querySelector('img');
  if (!img || !window.matchMedia || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var MARGEM = 8, TROCOS = 5, DESVIO = 6, PERTO = 12, LONGE = 46; // em píxeis do ecrã
  var tela = null, ctx = null, pontos = null, ativo = false, dpr = Math.min(window.devicePixelRatio || 1, 2);

  // Os pontos das letras, à escala a que o logótipo está no ecrã (uma amostra, para não pesar).
  function lerPontos(w, h) {
    var c = document.createElement('canvas');
    c.width = Math.round(w); c.height = Math.round(h);
    var x = c.getContext('2d');
    x.drawImage(img, 0, 0, c.width, c.height);
    var d = x.getImageData(0, 0, c.width, c.height).data, p = [];
    for (var y = 0; y < c.height; y += 2) {
      for (var i = 0; i < c.width; i += 2) if (d[(y * c.width + i) * 4 + 3] > 128) p.push([i, y]);
    }
    return p;
  }

  function preparar() {
    var r = img.getBoundingClientRect();
    if (!tela) {
      tela = document.createElement('canvas');
      tela.className = 'marca-plasma';
      tela.setAttribute('aria-hidden', 'true');
      marca.appendChild(tela);
      ctx = tela.getContext('2d');
    }
    tela.width = Math.round((r.width + MARGEM * 2) * dpr);
    tela.height = Math.round((r.height + MARGEM * 2) * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, MARGEM * dpr, MARGEM * dpr);
    if (!pontos || pontos.w !== Math.round(r.width)) {
      try { pontos = lerPontos(r.width, r.height); pontos.w = Math.round(r.width); } catch (e) { pontos = []; }
    }
  }

  // Uma descarga entre dois pontos das letras: um arco partido, com um halo por baixo, branco a puxar ao lilás.
  function descarga(a, b) {
    var xs = [a[0]], ys = [a[1]];
    for (var t = 1; t < TROCOS; t++) {
      xs.push(a[0] + (b[0] - a[0]) * t / TROCOS + (Math.random() - 0.5) * DESVIO);
      ys.push(a[1] + (b[1] - a[1]) * t / TROCOS + (Math.random() - 0.5) * DESVIO);
    }
    xs.push(b[0]); ys.push(b[1]);
    [[3, 'rgba(236, 230, 255, 0.25)'], [1, 'rgba(250, 248, 255, 0.95)']].forEach(function (camada) {
      ctx.strokeStyle = camada[1]; ctx.lineWidth = camada[0]; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(xs[0], ys[0]);
      for (var n = 1; n < xs.length; n++) ctx.lineTo(xs[n], ys[n]);
      ctx.stroke();
    });
  }

  function quadro() {
    if (!ativo) { if (ctx) ctx.clearRect(-MARGEM, -MARGEM, tela.width, tela.height); return; }
    ctx.clearRect(-MARGEM, -MARGEM, tela.width, tela.height);
    if (pontos.length && Math.random() < 0.75) {
      var quantas = 1 + Math.floor(Math.random() * 2);
      for (var q = 0; q < quantas; q++) {
        var a = pontos[Math.floor(Math.random() * pontos.length)];
        // procura um segundo ponto nem muito perto nem muito longe (salta, às vezes, de uma letra para outra)
        for (var tent = 0; tent < 12; tent++) {
          var b = pontos[Math.floor(Math.random() * pontos.length)];
          var d = Math.hypot(b[0] - a[0], b[1] - a[1]);
          if (d > PERTO && d < LONGE) { descarga(a, b); break; }
        }
      }
    }
    window.requestAnimationFrame(quadro);
  }

  function ligar() {
    if (ativo || !img.complete) return;
    preparar();
    ativo = true;
    marca.classList.add('a-faiscar');
    window.requestAnimationFrame(quadro);
  }
  function desligar() {
    ativo = false;
    marca.classList.remove('a-faiscar');
  }

  marca.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') ligar(); });
  marca.addEventListener('pointerleave', desligar);
  marca.addEventListener('focus', function () { if (marca.matches(':focus-visible')) ligar(); });
  marca.addEventListener('blur', desligar);
  document.addEventListener('plasmatv:pagina', desligar); // ao mudar de página pelo logótipo
})();
