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

  function avisar() {
    if (!caixa) {
      caixa = document.createElement('div');
      caixa.className = 'aviso-direitos';
      caixa.setAttribute('role', 'status');
      document.body.appendChild(caixa);
    }
    caixa.textContent = AVISO[(document.documentElement.lang || 'pt').slice(0, 2)] || AVISO.pt;
    caixa.classList.add('visivel');
    window.clearTimeout(apagar);
    apagar = window.setTimeout(function () { caixa.classList.remove('visivel'); }, 2800);
  }

  document.addEventListener('contextmenu', function (e) { if (imagem(e.target)) { e.preventDefault(); avisar(); } });
  document.addEventListener('dragstart', function (e) { if (imagem(e.target)) { e.preventDefault(); avisar(); } });
  // No iPhone, o toque longo não chega como «contextmenu»: conta-se o tempo do dedo parado sobre a imagem.
  document.addEventListener('touchstart', function (e) {
    if (!imagem(e.target)) return;
    window.clearTimeout(toque);
    toque = window.setTimeout(avisar, 600);
  }, { passive: true });
  ['touchend', 'touchmove', 'touchcancel'].forEach(function (tipo) {
    document.addEventListener(tipo, function () { window.clearTimeout(toque); }, { passive: true });
  });
})();
