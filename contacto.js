// O formulário de contacto (o Jesús, 25.10.2026): compõe a mensagem e abre-a na aplicação de email de quem escreve,
// pronta a enviar. Nada passa pelo site, nada se guarda. O navegador só deixa enviar com todos os campos preenchidos.
// Serve qualquer página, também a que chega sem recarregar (src/transicao.js): ouve-se o envio no documento inteiro.
(function () {
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f.matches || !f.matches('form.contacto-form')) return;
    e.preventDefault();
    var v = function (nome) { return f.elements[nome].value.trim(); };
    var corpo = v('mensagem') + '\n\n— ' + v('nome') + ' (' + v('email') + ')';
    window.location.href = 'mailto:' + f.getAttribute('data-para') +
      '?subject=' + encodeURIComponent(v('assunto')) + '&body=' + encodeURIComponent(corpo);
    var aviso = f.querySelector('.aviso');
    if (aviso) aviso.hidden = false;
  });
})();
