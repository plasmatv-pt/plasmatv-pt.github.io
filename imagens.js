// As imagens do site (os logótipos, as capas) têm direitos de autor (o Jesús, 25.10.2026). Quando alguém tenta
// guardá-las (o botão direito, ou o toque longo no telemóvel) ou arrastá-las, aparece um aviso em vez do menu.
// Não impede uma captura de ecrã, nem quem saiba procurar: nada na internet o impede. Diz só, com cuidado, de quem são.
// O aviso está nas três línguas do site, pela língua da página. Não guarda nada.
(function () {
  var AVISO = {
    pt: 'Imagem com direitos de autor · © 2026 plasmatv. Todos os direitos reservados.',
    en: 'Copyrighted image · © 2026 plasmatv. All rights reserved.',
    es: 'Imagen con derechos de autor · © 2026 plasmatv. Todos los derechos reservados.',
  };
  var caixa = null, apagar = null, toque = null;

  function imagem(alvo) { return alvo && alvo.closest && alvo.closest('main img, .marca img'); }

  // O aviso aparece por cima da própria imagem, ao centro dela (o Jesús, 25.10.2026); se não houver espaço por cima,
  // fica junto ao cimo da imagem, por dentro, e nunca sai do ecrã.
  function avisar(img) {
    if (!caixa) {
      caixa = document.createElement('div');
      caixa.className = 'aviso-direitos';
      caixa.setAttribute('role', 'status');
      document.body.appendChild(caixa);
    }
    caixa.textContent = AVISO[(document.documentElement.lang || 'pt').slice(0, 2)] || AVISO.pt;
    var r = img.getBoundingClientRect(), metade = Math.min(caixa.offsetWidth / 2 + 8, window.innerWidth / 2);
    var x = Math.min(Math.max(r.left + r.width / 2, metade), window.innerWidth - metade);
    var y = Math.max(r.top - 8, caixa.offsetHeight + 8);
    caixa.style.left = x + 'px';
    caixa.style.top = y + 'px';
    caixa.classList.add('visivel');
    window.clearTimeout(apagar);
    apagar = window.setTimeout(function () { caixa.classList.remove('visivel'); }, 2800);
  }

  document.addEventListener('contextmenu', function (e) { var i = imagem(e.target); if (i) { e.preventDefault(); avisar(i); } });
  document.addEventListener('dragstart', function (e) { var i = imagem(e.target); if (i) { e.preventDefault(); avisar(i); } });
  // No iPhone, o toque longo não chega como «contextmenu»: conta-se o tempo do dedo parado sobre a imagem.
  document.addEventListener('touchstart', function (e) {
    var i = imagem(e.target);
    if (!i) return;
    window.clearTimeout(toque);
    toque = window.setTimeout(function () { avisar(i); }, 600);
  }, { passive: true });
  ['touchend', 'touchmove', 'touchcancel'].forEach(function (tipo) {
    document.addEventListener(tipo, function () { window.clearTimeout(toque); }, { passive: true });
  });
})();
