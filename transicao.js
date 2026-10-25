// A passagem entre páginas: uma mudança de canal de televisão antiga (o Jesús, 25.10.2026). O desenho está em
// src/estilo.css (html.a-sair, html.a-entrar); o som, em src/som.js.
// Desde 25.10.2026, à noite, a página nunca se desmonta (o Jesús: «vamos fazer a mudança agora!»): ao clicar numa
// ligação do site, o chuvisco cobre o corpo enquanto se vai buscar a página nova ao próprio site; depois troca-se só
// o corpo, o rodapé, o título e o que muda no topo (a língua, os nomes do menu), e o chuvisco vai-se. O topo, o dia e a
// noite e a mesa de som continuam vivos; um dia, uma canção pode continuar a tocar de página em página.
// As páginas continuam a existir inteiras, uma por endereço: sem JavaScript, ou se a página nova não chegar, muda-se
// de página à moda antiga. O botão «voltar» do navegador volta à página anterior, e ao sítio onde se estava nela.
// A página seguinte pede-se cedo, logo que o rato passa ou o dedo toca numa ligação. Com «reduzir movimento», a troca
// faz-se na mesma, sem chuvisco nem som de canal. Não guarda nada.
// Carrega no <head>, sem «defer».
(function () {
  var raiz = document.documentElement;
  raiz.classList.add('com-js'); // o menu de bolso, o som e o «ir ao topo» só aparecem quando há JavaScript
  var calmo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SAIDA = 240; // milissegundos de chuvisco, pelo menos, antes de trocar
  var ESPERA = 6000; // se a página nova não chegar neste tempo, muda-se à moda antiga

  // O dia e a noite do topo seguem o relógio (útil quando se entra no site por outra página, ou se recarrega).
  var s = Date.now() / 1000;
  raiz.style.setProperty('--fase-dia', '-' + (s % 90).toFixed(2) + 's');
  raiz.style.setProperty('--fase-varrimento', '-' + (s % 9).toFixed(2) + 's');

  // Quando o chuvisco acaba de ir, tira-se.
  document.addEventListener('animationend', function (e) {
    if (e.animationName === 'chuvisco-vai') raiz.classList.remove('a-entrar');
  });
  // O grão do chuvisco pede-se cedo, para estar pronto no primeiro clique.
  window.addEventListener('load', function () { new Image().src = '/img/chuvisco.png'; });

  if (!window.fetch || !window.DOMParser || !window.history || !history.pushState) return; // à moda antiga

  // Uma ligação para outra página do próprio site (e não para esta, nem para fora), ou nada.
  function interna(alvo) {
    var a = alvo && alvo.closest && alvo.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return null;
    var destino = new URL(a.href, window.location.href);
    if (destino.origin !== window.location.origin || destino.pathname === window.location.pathname) return null;
    return destino;
  }

  // As páginas pedidas, já em texto, guardadas enquanto o separador estiver aberto (são poucas e pequenas).
  var paginas = {};
  function pedir(caminho) {
    if (!paginas[caminho]) {
      paginas[caminho] = window.fetch(caminho, { credentials: 'same-origin' }).then(function (r) {
        if (!r.ok) throw new Error('página ' + r.status);
        return r.text();
      });
      paginas[caminho].catch(function () { delete paginas[caminho]; });
    }
    return paginas[caminho];
  }
  ['pointerover', 'touchstart', 'focusin'].forEach(function (tipo) {
    document.addEventListener(tipo, function (e) {
      var d = interna(e.target);
      if (d) pedir(d.pathname).catch(function () { /* logo se vê, ao clicar */ });
    }, { passive: true });
  });

  // Copia de «b» para «a» só os atributos dados (os outros, como o aberto/fechado do menu, são da página viva).
  function atributos(a, b, nomes) {
    nomes.forEach(function (n) {
      if (b.hasAttribute(n)) a.setAttribute(n, b.getAttribute(n)); else a.removeAttribute(n);
    });
  }

  // Troca a página: o <head> que conta (título, descrição, endereços), o corpo, o rodapé e o que muda no topo.
  function trocar(html) {
    var novo = new DOMParser().parseFromString(html, 'text/html');
    var mainNovo = novo.querySelector('main'), mainVelho = document.querySelector('main');
    var topo = document.querySelector('.topo'), topoNovo = novo.querySelector('.topo');
    if (!mainNovo || !mainVelho || !topo || !topoNovo) return false;

    document.title = novo.title;
    raiz.lang = novo.documentElement.lang;
    ['meta[name="description"]', 'link[rel="canonical"]'].forEach(function (sel) {
      var a = document.head.querySelector(sel), b = novo.head.querySelector(sel);
      if (a && b) a.replaceWith(document.importNode(b, true));
    });
    var alternativas = document.head.querySelectorAll('link[rel="alternate"]');
    for (var i = 0; i < alternativas.length; i++) alternativas[i].remove();
    var novas = novo.head.querySelectorAll('link[rel="alternate"]');
    for (var j = 0; j < novas.length; j++) document.head.appendChild(document.importNode(novas[j], true));
    document.body.className = novo.body.className;

    // No topo, só o que muda de página para página: ligações, nomes e línguas. O resto continua como está.
    var par = function (sel) { return [topo.querySelector(sel), topoNovo.querySelector(sel)]; };
    [['.marca', ['href', 'aria-label']], ['.nav', ['aria-label']], ['.menu-botao', ['aria-label']],
      ['.linguas summary', ['aria-label']], ['.som', ['aria-label']]].forEach(function (x) {
      var p = par(x[0]); if (p[0] && p[1]) atributos(p[0], p[1], x[1]);
    });
    ['.nav-itens', '.linguas summary', '.linguas ul'].forEach(function (sel) {
      var p = par(sel); if (p[0] && p[1]) p[0].innerHTML = p[1].innerHTML;
    });
    [['.saltar', ['href']], ['.ao-topo', ['aria-label']]].forEach(function (x) {
      var a = document.querySelector(x[0]), b = novo.querySelector(x[0]);
      if (a && b) { atributos(a, b, x[1]); if (x[0] === '.saltar') a.textContent = b.textContent; }
    });

    mainVelho.replaceWith(document.importNode(mainNovo, true));
    var rodape = document.querySelector('.rodape'), rodapeNovo = novo.querySelector('.rodape');
    if (rodape && rodapeNovo) rodape.replaceWith(document.importNode(rodapeNovo, true));
    return true;
  }

  // Depois da troca: o foco no título da página nova (quem usa leitor de ecrã ouve-o), e o aviso às outras peças
  // (src/topo.js fecha o menu devagar e mostra o topo; src/encontro.js acorda ou adormece a constelação).
  function chegou() {
    var titulo = document.querySelector('main h1');
    if (titulo) { titulo.setAttribute('tabindex', '-1'); titulo.focus({ preventScroll: true }); }
    document.dispatchEvent(new CustomEvent('plasmatv:pagina'));
  }

  var aMudar = false, pendente = null;
  var aqui = window.location.pathname; // a página que está (ou vai estar) à vista
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  // Vai para «destino». «comoVeio»: 'clique' (acrescenta à história) ou 'historia' (o «voltar» ou o «avançar»).
  function ir(destino, comoVeio, y) {
    if (aMudar) return;
    aMudar = true;
    // O endereço muda logo; se a página nova não chegar, recarrega-se esse endereço à moda antiga.
    if (comoVeio === 'clique') {
      history.replaceState({ y: window.scrollY }, '');
      history.pushState({ y: 0 }, '', destino.pathname + destino.search + destino.hash);
    }
    aqui = window.location.pathname;
    var aModaAntiga = function () { window.location.reload(); };
    if (!calmo) { raiz.classList.remove('a-entrar'); raiz.classList.add('a-sair'); }
    var soou = (!calmo && window.plasmatvSom) ? window.plasmatvSom.tocar('canal') : null;
    var inicio = Date.now(), texto = null, falhou = false;
    pedir(destino.pathname).then(function (t) { texto = t; }, function () { falhou = true; });

    (function esperar() {
      var passou = Date.now() - inicio;
      if (falhou || (texto === null && passou > ESPERA)) return aModaAntiga();
      var pronto = texto !== null && (calmo || (passou >= SAIDA && (!soou || soou() || passou >= 700)));
      if (!pronto) return void window.setTimeout(esperar, 20);

      if (!trocar(texto)) return aModaAntiga();
      window.scrollTo(0, y || 0);
      raiz.classList.remove('a-sair');
      if (!calmo) {
        raiz.classList.add('a-entrar');
        window.setTimeout(function () { raiz.classList.remove('a-entrar'); }, 1500);
      }
      aMudar = false;
      chegou();
      // Se alguém carregou em «voltar» (ou «avançar») a meio, vai-se agora para onde ficou o endereço.
      if (pendente && window.location.pathname !== aqui) {
        var p = pendente; pendente = null;
        ir(new URL(window.location.href), 'historia', p.y);
      }
      pendente = null;
    })();
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var destino = interna(e.target);
    if (!destino) return;
    e.preventDefault();
    ir(destino, 'clique', 0);
  });

  window.addEventListener('popstate', function (e) {
    if (window.location.pathname === aqui) return; // só mudou a âncora (o «saltar para o conteúdo»)
    if (aMudar) { pendente = { y: e.state && e.state.y }; return; }
    ir(new URL(window.location.href), 'historia', e.state && e.state.y);
  });

  // Ao voltar atrás para uma página guardada pelo navegador tal como ficou, tira-se o chuvisco que lá estivesse.
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) { raiz.classList.remove('a-sair', 'a-entrar'); aMudar = false; }
  });
})();
