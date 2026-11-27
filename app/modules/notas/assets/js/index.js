
// Menu de usuário dropdown
const userBtn = document.getElementById('userMenuBtn');
if (userBtn) {
    userBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        this.classList.toggle('aberto');
    });
}
document.addEventListener('click', function(e) {
    if (userBtn && !userBtn.contains(e.target)) {
        userBtn.classList.remove('aberto');
    }
});

// Filtro de pesquisa das atividades
function filtrarAtividades(termo) {
    const q = termo.toLowerCase().trim();
    document.querySelectorAll('.secao').forEach(secao => {
        const cards = secao.querySelectorAll('.card-atividade');
        let visiveis = 0;

        cards.forEach(card => {
            const titulo = card.dataset.titulo || '';
            const mostrar = !q || titulo.includes(q);
            card.style.display = mostrar ? '' : 'none';
            if (mostrar) visiveis++;
        });

        secao.style.display = visiveis > 0 ? '' : 'none';
    });
}
