// O formulário de contacto (o Jesús, 25.10.2026). Duas maneiras, conforme scripts/build.mjs (FORMULARIO):
//  - com o servidor do estúdio (o formulário traz «data-servidor»): envia a mensagem para lá e diz o que aconteceu,
//    sem sair da página. O servidor entrega-a na caixa contacto@plasmatv.pt (servidor/formulario/index.php);
//  - sem servidor: compõe a mensagem e abre-a na aplicação de email de quem escreve, pronta a enviar.
// O navegador só deixa enviar com todos os campos preenchidos. Nada se guarda no aparelho.
// Serve qualquer página, também a que chega sem recarregar (src/transicao.js): ouve-se o documento inteiro.
(function () {
  // O tempo de escrita conta-se a partir do primeiro toque no formulário (o servidor desconfia de quem envia em 3 s).
  document.addEventListener('focusin', function (e) {
    var f = e.target.form;
    if (f && f.matches('form.contacto-form') && f.elements.t && !f.elements.t.value) f.elements.t.value = String(Date.now());
  });

  function avisar(f, texto) {
    var aviso = f.querySelector('.aviso');
    if (!aviso) return;
    aviso.textContent = texto;
    aviso.hidden = false;
  }

  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f.matches || !f.matches('form.contacto-form')) return;
    e.preventDefault();

    if (f.hasAttribute('data-servidor')) {
      var botao = f.querySelector('.enviar');
      if (f.elements.t && !f.elements.t.value) f.elements.t.value = String(Date.now());
      botao.disabled = true;
      avisar(f, f.getAttribute('data-a-enviar'));
      window.fetch(f.action, {
        method: 'POST',
        body: new URLSearchParams(new FormData(f)),
        headers: { Accept: 'application/json' },
        credentials: 'omit',
      }).then(function (r) { return r.json(); }).then(function (d) {
        avisar(f, d.texto);
        if (d.ok) { f.reset(); f.elements.t.value = ''; }
      }).catch(function () {
        avisar(f, f.getAttribute('data-falhou'));
      }).then(function () { botao.disabled = false; });
      return;
    }

    var v = function (nome) { return f.elements[nome].value.trim(); };
    var corpo = v('mensagem') + '\n\n— ' + v('nome') + ' (' + v('email') + ')';
    window.location.href = 'mailto:' + f.getAttribute('data-para') +
      '?subject=' + encodeURIComponent(v('assunto')) + '&body=' + encodeURIComponent(corpo);
    var aviso = f.querySelector('.aviso');
    if (aviso) aviso.hidden = false;
  });
})();
