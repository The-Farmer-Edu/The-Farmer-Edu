
const userBtn = document.getElementById('userMenuBtn');
if (userBtn) {
    userBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        this.classList.toggle('aberto');
    });
}
// Fecha o dropdown ao clicar em qualquer outra área da página
document.addEventListener('click', function(e) {
    if (userBtn && !userBtn.contains(e.target)) {
        userBtn.classList.remove('aberto');
    }
});
