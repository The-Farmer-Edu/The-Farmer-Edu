
// nao manjo de js, pedi ajuda ao copilot
document.addEventListener('DOMContentLoaded', function () {
    const botaoIconi = document.getElementById('botaoIconi');
    const menuIconi = document.getElementById('menuIconi');
    const btnAbrirModal = document.getElementById('btnAbrirModal');
    const modalLinguagens = document.getElementById('modalLinguagens');

    if (botaoIconi && menuIconi) {
        botaoIconi.addEventListener('click', function (event) {
            event.stopPropagation();
            const isOpen = menuIconi.classList.toggle('active');
            botaoIconi.setAttribute('aria-expanded', String(isOpen));
            menuIconi.setAttribute('aria-hidden', String(!isOpen));
        });

        document.addEventListener('click', function (event) {
            if (!menuIconi.contains(event.target) && !botaoIconi.contains(event.target)) {
                menuIconi.classList.remove('active');
                botaoIconi.setAttribute('aria-expanded', 'false');
                menuIconi.setAttribute('aria-hidden', 'true');
            }
        });

        menuIconi.querySelectorAll('.menu-item').forEach(function (item) {
            item.addEventListener('click', function () {
                menuIconi.classList.remove('active');
                botaoIconi.setAttribute('aria-expanded', 'false');
                menuIconi.setAttribute('aria-hidden', 'true');
            });
        });
    }

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