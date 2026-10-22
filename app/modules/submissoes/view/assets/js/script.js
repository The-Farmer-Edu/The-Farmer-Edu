document.addEventListener('DOMContentLoaded', function () {
    const botaoIconi = document.getElementById('botaoIconi');
    const menuIconi = document.getElementById('menuIconi');
    const botaoUsuario = document.getElementById('botaoUsuario');
    const menuUsuario = document.getElementById('menuUsuario');
    const btnAbrirModal = document.getElementById('btnAbrirModal');
    const modalLinguagens = document.getElementById('modalLinguagens');

    if (botaoIconi && menuIconi) {
        botaoIconi.addEventListener('click', function (event) {
            event.stopPropagation();

            if (menuUsuario && menuUsuario.classList.contains('active')) {
                menuUsuario.classList.remove('active');
                menuUsuario.setAttribute('aria-hidden', 'true');
            }

            const isOpen = menuIconi.classList.toggle('active');
            botaoIconi.setAttribute('aria-expanded', String(isOpen));
            menuIconi.setAttribute('aria-hidden', String(!isOpen));
        });

        menuIconi.querySelectorAll('.menu-item').forEach(function (item) {
            item.addEventListener('click', function () {
                menuIconi.classList.remove('active');
                botaoIconi.setAttribute('aria-expanded', 'false');
                menuIconi.setAttribute('aria-hidden', 'true');
            });
        });
    }

    if (botaoUsuario && menuUsuario) {
        botaoUsuario.addEventListener('click', function (event) {
            event.stopPropagation();

            if (menuIconi && menuIconi.classList.contains('active')) {
                menuIconi.classList.remove('active');
                menuIconi.setAttribute('aria-hidden', 'true');
                if (botaoIconi) {
                    botaoIconi.setAttribute('aria-expanded', 'false');
                }
            }

            const isOpen = menuUsuario.classList.toggle('active');
            botaoUsuario.setAttribute('aria-expanded', String(isOpen));
            menuUsuario.setAttribute('aria-hidden', String(!isOpen));
        });

        menuUsuario.querySelectorAll('.menu-item').forEach(function (item) {
            item.addEventListener('click', function () {
                menuUsuario.classList.remove('active');
                botaoUsuario.setAttribute('aria-expanded', 'false');
                menuUsuario.setAttribute('aria-hidden', 'true');
            });
        });
    }

    document.addEventListener('click', function (event) {
        const clickDentroDoMenuIconi = menuIconi && menuIconi.contains(event.target);
        const clickDentroDoBotaoIconi = botaoIconi && botaoIconi.contains(event.target);
        const clickDentroDoMenuUsuario = menuUsuario && menuUsuario.contains(event.target);
        const clickDentroDoBotaoUsuario = botaoUsuario && botaoUsuario.contains(event.target);

        if (!clickDentroDoMenuIconi && !clickDentroDoBotaoIconi && menuIconi) {
            menuIconi.classList.remove('active');
            botaoIconi && botaoIconi.setAttribute('aria-expanded', 'false');
            menuIconi.setAttribute('aria-hidden', 'true');
        }

        if (!clickDentroDoMenuUsuario && !clickDentroDoBotaoUsuario && menuUsuario) {
            menuUsuario.classList.remove('active');
            botaoUsuario && botaoUsuario.setAttribute('aria-expanded', 'false');
            menuUsuario.setAttribute('aria-hidden', 'true');
        }
    });

    if (btnAbrirModal && modalLinguagens) {
        btnAbrirModal.addEventListener('click', () => {
            modalLinguagens.classList.add('active');
        });

        modalLinguagens.addEventListener('click', (e) => {
            if (e.target === modalLinguagens) {
                modalLinguagens.classList.remove('active');
            }
        });
    }

    function selecionarLinguagem(linguagem) {
        alert(`Linguagem selecionada: ${linguagem}. Redirecionando para o ambiente de envio...`);
        if (modalLinguagens) {
            modalLinguagens.classList.remove('active');
        }
    }
});