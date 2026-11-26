/**
 * The Farmer Edu — Sobre os Desenvolvedores
 * Acordeão (sanfona) dos squads: cada squad abre/fecha de forma independente.
 */
(() => {
    const squads = Array.from(document.querySelectorAll('.squad'));
    const btnExpandir = document.getElementById('expandirTodos');
    const btnRecolher = document.getElementById('recolherTodos');

    const definirEstado = (squad, aberto) => {
        squad.classList.toggle('is-open', aberto);
        squad.querySelector('.squad-toggle').setAttribute('aria-expanded', String(aberto));
    };

    squads.forEach((squad) => {
        squad.querySelector('.squad-toggle').addEventListener('click', () => {
            definirEstado(squad, !squad.classList.contains('is-open'));
        });
    });

    btnExpandir?.addEventListener('click', () => squads.forEach((s) => definirEstado(s, true)));
    btnRecolher?.addEventListener('click', () => squads.forEach((s) => definirEstado(s, false)));

    // Link direto: /sobre/desenvolvedores#squad-7 abre o squad 7
    const abrirPeloHash = () => {
        const alvo = document.getElementById(location.hash.slice(1));
        if (alvo && alvo.classList.contains('squad')) {
            definirEstado(alvo, true);
            alvo.scrollIntoView({ block: 'center' });
        }
    };
    abrirPeloHash();
    window.addEventListener('hashchange', abrirPeloHash);
})();
