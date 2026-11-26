/**
 * Menus locais da página de submissão (legado).
 * A navegação oficial fica em app/core/cabecalho.php; este script só age se os
 * botões antigos ainda existirem na página.
 */
const botaoIconi = document.getElementById('botaoIconi');
const botaoUsuario = document.getElementById('botaoUsuario');
const menuIconi = document.getElementById('menuIconi');
const menuUsuario = document.getElementById('menuUsuario');

if (botaoIconi && botaoUsuario && menuIconi && menuUsuario) {
    function fecharMenus() {
        [menuIconi, menuUsuario].forEach(menu => {
            menu.classList.remove('active');
            menu.setAttribute('aria-hidden', 'true');
        });
        botaoIconi.setAttribute('aria-expanded', 'false');
        botaoUsuario.setAttribute('aria-expanded', 'false');
    }

    function alternarMenu(menu, botao) {
        const vaiAbrir = !menu.classList.contains('active');
        fecharMenus();
        if (vaiAbrir) {
            menu.classList.add('active');
            menu.setAttribute('aria-hidden', 'false');
            botao.setAttribute('aria-expanded', 'true');
        }
    }

    botaoIconi.addEventListener('click', evento => {
        evento.stopPropagation();
        alternarMenu(menuIconi, botaoIconi);
    });

    botaoUsuario.addEventListener('click', evento => {
        evento.stopPropagation();
        alternarMenu(menuUsuario, botaoUsuario);
    });

    [menuIconi, menuUsuario].forEach(menu => menu.addEventListener('click', evento => evento.stopPropagation()));

    document.addEventListener('click', fecharMenus);
    document.addEventListener('keydown', evento => {
        if (evento.key === 'Escape') fecharMenus();
    });
}
