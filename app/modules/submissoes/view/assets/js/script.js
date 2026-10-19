document.addEventListener('DOMContentLoaded', function(){
    const btnAbrirModal = document.getElementById('btnAbrirModal');
    const modalLinguagens = document.getElementById('modalLinguagens');

    btnAbrirModal.addEventListener('click', () => {
        modalLinguagens.classList.add('active');
    });

    modalLinguagens.addEventListener('click', (e) => {
        if (e.target === modalLinguagens) {
            modalLinguagens.classList.remove('active');
        }
    });

    function selecionarLinguagem(linguagem) {
        alert("Linguagem selecionada: ${linguagem}. Redirecionando para o ambiente de envio...");
        modalLinguagens.classList.remove('active');
    }
});