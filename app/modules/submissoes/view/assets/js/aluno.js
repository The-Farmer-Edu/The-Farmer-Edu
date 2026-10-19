document.getElementById('btnVoltar').addEventListener('click', () => {
    history.back();
});

const balao = document.getElementById('balao');
const btnGalinha = document.getElementById('btnGalinha');
const frases = [
    'Cocoricó! Bora codar?',
    'Dica: um passo de cada vez 🌱',
    'Errou? Faz parte, tenta de novo!',
    'Clique em "Começar" 👆'
];

let timer;
btnGalinha.addEventListener('click', () => {
    balao.textContent = frases[Math.floor(Math.random() * frases.length)];
    balao.classList.add('on');


    clearTimeout(timer);
    timer = setTimeout(() => balao.classList.remove('on'), 2800);
});