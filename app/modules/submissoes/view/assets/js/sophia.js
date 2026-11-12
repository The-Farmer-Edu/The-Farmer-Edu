// Sophia
const balaoSophia = porId('balao');
const botaoSophia = porId('btnSophia');

/* Balão da Sophia: fala curta (some sozinha) */
function sophiaFala(mensagem, duracaoMs = 5000) {
    balaoSophia.textContent = mensagem;
    balaoSophia.classList.add('on');
    clearTimeout(sophiaFala.temporizador);
    if (duracaoMs) sophiaFala.temporizador = setTimeout(() => balaoSophia.classList.remove('on'), duracaoMs);
}

botaoSophia.onclick = () => {
    if (botaoSophia.disabled) return;
    sophiaFala('A ajuda da Sophia será integrada em breve.', 4000);
};