/**
 * menu.js — Gerenciamento dos menus toggle do cabeçalho.
 *
 * O módulo controla os dois botões do topo da interface: o menu do ícone da
 * plataforma e o menu do usuário. Ambos seguem o mesmo padrão: ao clicar,
 * alternam a classe active, ajustam aria-expanded e fecham qualquer outro menu
 * aberto para manter a navegação limpa e acessível.
 */
(function () {
    'use strict';

    function inicializarMenus() {
        const botaoIconi   = document.getElementById('botaoIconi');
        const botaoUsuario = document.getElementById('botaoUsuario');
        const menuIconi    = document.getElementById('menuIconi');
        const menuUsuario  = document.getElementById('menuUsuario');

        function fecharMenus() {
            [menuIconi, menuUsuario].forEach(m => {
                if (!m) return;
                m.classList.remove('active');
                m.setAttribute('aria-hidden', 'true');
            });
            if (botaoIconi)   botaoIconi.setAttribute('aria-expanded', 'false');
            if (botaoUsuario) botaoUsuario.setAttribute('aria-expanded', 'false');
        }

        function alternarMenu(menu, botao) {
            if (!menu) return;
            const vaiAbrir = !menu.classList.contains('active');
            fecharMenus();
            if (vaiAbrir) {
                menu.classList.add('active');
                menu.setAttribute('aria-hidden', 'false');
                if (botao) botao.setAttribute('aria-expanded', 'true');
            }
        }

        if (botaoIconi && menuIconi) {
            botaoIconi.addEventListener('click', e => {
                e.stopPropagation();
                alternarMenu(menuIconi, botaoIconi);
            });
        }

        if (botaoUsuario && menuUsuario) {
            botaoUsuario.addEventListener('click', e => {
                e.stopPropagation();
                alternarMenu(menuUsuario, botaoUsuario);
            });
        }

        [menuIconi, menuUsuario].forEach(m => {
            if (m) m.addEventListener('click', e => e.stopPropagation());
        });

        document.addEventListener('click', fecharMenus);

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') fecharMenus();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarMenus);
    } else {
        inicializarMenus();
    }
})();

