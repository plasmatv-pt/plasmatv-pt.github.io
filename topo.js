// O topo do site (o Jesús, 25.10.2026): o menu numa caixa no telemóvel, a escolha de língua, o cabeçalho que sobe e
// desaparece quando se desce a página e volta quando se sobe, e o botão «ir ao topo» (estes dois, em todos os ecrãs).
// Só guarda, na memória do separador, se o som foi desligado. Sem este ficheiro, o menu fica sempre à vista e a escolha de língua abre na mesma (é um <details>).
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

  // Página nova (src/transicao.js): o topo à vista e, quando o chuvisco começa a ir-se, o menu ou as línguas que
  // estivessem abertos fecham-se com o mesmo movimento com que abrem (sem tique: não foi a pessoa a fechar).
  document.addEventListener('plasmatv:pagina', function () {
    topo.classList.remove('escondido');
    ultimo = Math.max(0, window.scrollY);
    window.setTimeout(fecharTudo, 160);
    aoDeslocar();
  });

  // Abrir e fechar as caixas soa a um tique discreto (src/som.js); o fecho automático, à chegada, não soa.
  function soar(nome) { if (window.plasmatvSom) window.plasmatvSom.tocar(nome); }

  // Uma ligação para a página onde já se está (src/transicao.js): o menu ou as línguas que estivessem abertos fecham-se.
  document.addEventListener('plasmatv:mesma-pagina', function () {
    if (!topo.classList.contains('aberto') && !(linguas && linguas.open)) return;
    fecharTudo();
    soar('fechar');
  });

  if (botao) botao.addEventListener('click', function () {
    var abrir = botao.getAttribute('aria-expanded') !== 'true';
    if (linguas) linguas.open = false;
    menu(abrir);
    soar(abrir ? 'abrir' : 'fechar');
  });
  if (linguas) linguas.querySelector('summary').addEventListener('click', function () { soar(linguas.open ? 'fechar' : 'abrir'); });
  if (linguas) linguas.addEventListener('toggle', function () { if (linguas.open) menu(false); });

  // Fecha-se com um toque fora do topo, ou com a tecla Esc (e o foco volta a quem abriu).
  function algoAberto() { return topo.classList.contains('aberto') || (linguas && linguas.open); }
  document.addEventListener('click', function (e) {
    if (topo.contains(e.target) || !algoAberto()) return;
    fecharTudo();
    soar('fechar');
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (algoAberto()) soar('fechar');
    if (topo.classList.contains('aberto')) { menu(false); botao.focus(); }
    if (linguas && linguas.open) { linguas.open = false; linguas.querySelector('summary').focus(); }
  });
  if (estreito.addEventListener) estreito.addEventListener('change', function () { menu(false); });

  // Em todos os ecrãs, o cabeçalho sobe ao descer a página e volta ao subir. Com o menu ou as línguas abertos, fica;
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
      topo.classList.toggle('escondido', d > 0 && y > topo.offsetHeight && !ocupado);
      ultimo = y;
    }
    if (subir) subir.classList.toggle('visivel', y > Math.min(window.innerHeight * 0.6, 480)); // depois de descer mais de meio ecrã (ou de 480 px)
  }
  window.addEventListener('scroll', function () {
    if (!pedido) { pedido = true; window.requestAnimationFrame(aoDeslocar); }
  }, { passive: true });
  topo.addEventListener('focusin', function () { topo.classList.remove('escondido'); });

  // O som: ligado até alguém o desligar (src/som.js guarda a escolha na memória do separador e lê-a à chegada).
  var som = topo.querySelector('.som');
  if (som && window.plasmatvSom) {
    som.setAttribute('aria-pressed', window.plasmatvSom.ligado() ? 'true' : 'false');
    som.addEventListener('click', function () {
      som.setAttribute('aria-pressed', window.plasmatvSom.alternar() ? 'true' : 'false');
    });
  }

  // As alturas do topo e do rodapé, para a página de entrada caber no ecrã entre os dois, e para o «ir ao topo» ficar
  // por cima do rodapé (src/estilo.css).
  var raizEl = document.documentElement, rodape = document.querySelector('.rodape');
  function medirAlturas() {
    raizEl.style.setProperty('--topo-altura', topo.offsetHeight + 'px');
    rodape = document.querySelector('.rodape');
    if (rodape) raizEl.style.setProperty('--rodape-altura', rodape.offsetHeight + 'px');
  }
  medirAlturas();
  window.addEventListener('resize', medirAlturas);
  if (window.ResizeObserver && rodape) new ResizeObserver(medirAlturas).observe(rodape);
  document.addEventListener('plasmatv:pagina', medirAlturas);

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
