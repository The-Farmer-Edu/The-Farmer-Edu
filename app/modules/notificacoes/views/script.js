const notification = document.getElementById("phoneNotification");
const appIcon = document.getElementById("appIcon");
const messageSender = document.getElementById("messageSender");

let autoHideTimeout;

// Lista com as 5 notificações solicitadas
const filaNotificacoes = [
    {
        mensagem: "O instrutor postou uma nova atividade!",
        icone: "📚",
        cor: "verde"
    },
    {
        mensagem: "Atividade pendente há mais de 5 dias sem entrega.",
        icone: "⏳",
        cor: "amarela"
    },
    {
        mensagem: "O feedback da IA para sua atividade está pronto!",
        icone: "🤖",
        cor: "verde"
    },
    {
        mensagem: "O instrutor atribuiu uma nota à sua atividade!",
        icone: "⭐",
        cor: "verde"
    },
    {
        mensagem: "Alerta! A fazenda foi atacada por mobs!",
        icone: "⚔️",
        cor: "vermelha"
    }
];

let indiceAtual = 0;

// Função para exibir uma notificação específica
function showNotification(dados) {
    clearTimeout(autoHideTimeout);

    // Atualiza texto e ícone
    messageSender.textContent = dados.mensagem;
    appIcon.textContent = dados.icone;

    // Reseta classes de cor e aplica a nova
    notification.classList.remove("verde", "amarela", "vermelha");
    notification.classList.add(dados.cor);

    // Mostra o balão
    notification.classList.add("show");

    // Esconde automaticamente após 4 segundos e agenda a próxima
    autoHideTimeout = setTimeout(() => {
        hideNotification();
    }, 4000);
}

// Função para esconder e chamar a próxima da fila
function hideNotification() {
    notification.classList.remove("show");
    clearTimeout(autoHideTimeout);

    indiceAtual++;
    if (indiceAtual < filaNotificacoes.length) {
        // Aguarda 800ms para a animação de saída terminar antes de mostrar a próxima
        setTimeout(() => {
            showNotification(filaNotificacoes[indiceAtual]);
        }, 800);
    }
}

// Inicia a sequência 1 segundo após carregar a página
window.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        showNotification(filaNotificacoes[0]);
    }, 1000);
});

// Fechar imediatamente ao clicar (e já puxar a próxima se houver)
notification.addEventListener("click", hideNotification);