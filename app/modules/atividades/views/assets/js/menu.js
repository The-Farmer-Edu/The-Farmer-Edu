(function () {
    const botao = document.getElementById('botao-perfil');
    const lista = document.getElementById('menu-perfil-lista');

    if (!botao || !lista) {
        return;
    }

    function definirAberto(aberto) {
        lista.classList.toggle('hidden', !aberto);
        botao.setAttribute('aria-expanded', String(aberto));
    }

    botao.addEventListener('click', event => {
        event.stopPropagation();
        definirAberto(lista.classList.contains('hidden'));
    });

    document.addEventListener('click', event => {
        if (!lista.contains(event.target)) {
            definirAberto(false);
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !lista.classList.contains('hidden')) {
            definirAberto(false);
            botao.focus();
        }
    });
})();
