// O topo do site (o Jesús, 25.10.2026): o menu numa caixa no telemóvel, a escolha de língua, o cabeçalho que sobe e
// desaparece quando se desce a página (no telemóvel) e volta quando se sobe, e o botão «ir ao topo».
// Não guarda nada. Sem este ficheiro, o menu fica sempre à vista e a escolha de língua abre na mesma (é um <details>).
(function () {
  var topo = document.querySelector('.topo');
  if (!topo) return;
  var botao = topo.querySelector('.menu-botao');
  var linguas = topo.querySelector('.linguas');
  var subir = document.querySelector('.ao-topo');
  var estreito = window.matchMedia('(max-width: 48rem)');
  var calmo = window.matchMedia('(prefers-reduced-motion: reduce)');

  function menu(aberto) {
    topo.classList.toggle('aberto', aberto);
    if (botao) botao.setAttribute('aria-expanded', aberto ? 'true' : 'false');
  }
  function fecharTudo() {
    menu(false);
    if (linguas) linguas.open = false;
  }

  // Vindo de uma escolha no menu aberto (src/transicao.js), o menu chega aberto e fecha-se com o mesmo movimento com
  // que abre, quando o chuvisco começa a ir-se.
  if (document.documentElement.classList.contains('menu-vinha-aberto')) {
    window.requestAnimationFrame(function () {
      window.setTimeout(function () { document.documentElement.classList.remove('menu-vinha-aberto'); }, 160);
    });
  }

  if (botao) botao.addEventListener('click', function () {
    var abrir = botao.getAttribute('aria-expanded') !== 'true';
    if (linguas) linguas.open = false;
    menu(abrir);
  });
  if (linguas) linguas.addEventListener('toggle', function () { if (linguas.open) menu(false); });

  // Fecha-se com um toque fora do topo, ou com a tecla Esc (e o foco volta a quem abriu).
  document.addEventListener('click', function (e) { if (!topo.contains(e.target)) fecharTudo(); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (topo.classList.contains('aberto')) { menu(false); botao.focus(); }
    if (linguas && linguas.open) { linguas.open = false; linguas.querySelector('summary').focus(); }
  });
  if (estreito.addEventListener) estreito.addEventListener('change', function () { menu(false); });

  // No telemóvel, o cabeçalho sobe ao descer a página e volta ao subir. Com o menu ou as línguas abertos, fica;
  // e volta sempre que alguém lá chega com o teclado.
  var ultimo = Math.max(0, window.scrollY);
  var pedido = false;
  function aoDeslocar() {
    pedido = false;
    var y = Math.max(0, window.scrollY);
    var d = y - ultimo;
    if (y <= 0) { topo.classList.remove('escondido'); ultimo = 0; }
    else if (Math.abs(d) > 6) {
      var ocupado = topo.classList.contains('aberto') || (linguas && linguas.open);
      topo.classList.toggle('escondido', estreito.matches && d > 0 && y > topo.offsetHeight && !ocupado);
      ultimo = y;
    }
    if (subir) subir.classList.toggle('visivel', estreito.matches && y > window.innerHeight * 0.8);
  }
  window.addEventListener('scroll', function () {
    if (!pedido) { pedido = true; window.requestAnimationFrame(aoDeslocar); }
  }, { passive: true });
  topo.addEventListener('focusin', function () { topo.classList.remove('escondido'); });

  if (subir) subir.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: calmo.matches ? 'auto' : 'smooth' });
    var marca = topo.querySelector('.marca');
    if (marca) marca.focus({ preventScroll: true });
  });

  // Ao voltar atrás, a página pode vir tal como ficou: o menu e as línguas fechados, o topo à vista.
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    fecharTudo();
    topo.classList.remove('escondido');
  });
})();
