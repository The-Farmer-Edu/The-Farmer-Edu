/**
 * Componente da IA assistente “Sophia”.
 *
 * É um balão de feedback visual: o sistema mostra mensagem curta, limpa automaticamente e
 * ainda pode ser acionado manualmente ao clicar no avatar. A proposta é dar feedback humano sem
 * interromper a experiência de criação de código.
 */
const balaoSophia = porId('balao');
const botaoSophia = porId('btnSophia');

function sophiaFala(mensagem, duracaoMs = 5000) {
    balaoSophia.textContent = mensagem;
    balaoSophia.classList.add('on');
    clearTimeout(sophiaFala.temporizador);
    if (duracaoMs) sophiaFala.temporizador = setTimeout(() => balaoSophia.classList.remove('on'), duracaoMs);
}

botaoSophia.onclick = () => {
    if (botaoSophia.disabled) return;
    if (usosSophia >= LIMITE_SOPHIA) {
        return sophiaFala('Você usou todas as ajudas da Sophia nesta atividade.', 4000);
    }
    // TODO (integração da IA): chamar o backend e, ao receber a resposta, fazer:
    // usosSophia++; atualizarContadores();
    sophiaFala('A ajuda da Sophia será integrada em breve.', 4000);
};