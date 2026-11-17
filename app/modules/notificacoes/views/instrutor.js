const notification = document.getElementById("phoneNotification");
const appIcon = document.getElementById("appIcon");
const messageSender = document.getElementById("messageSender");

let autoHideTimeout;

const filaNotificacoesInstrutor = [
    {
        mensagem: "Atividade postada com sucesso!",
        icone: "✅",
        cor: "verde"
    },
    {
        mensagem: "Um aluno enviou a resposta de uma atividade!",
        icone: "📥",
        cor: "verde"
    },
    {
        mensagem: "Um aluno reenviou a resposta de uma atividade.",
        icone: "🔄",
        cor: "amarela"
    }
];

let indiceAtual = 0;

function showNotification(dados) {
    clearTimeout(autoHideTimeout);

    messageSender.textContent = dados.mensagem;
    appIcon.textContent = dados.icone;

    notification.classList.remove("verde", "amarela");
    notification.classList.add(dados.cor);

    notification.classList.add("show");

    autoHideTimeout = setTimeout(() => {
        hideNotification();
    }, 4000);
}

function hideNotification() {
    notification.classList.remove("show");
    clearTimeout(autoHideTimeout);

    indiceAtual++;
    if (indiceAtual < filaNotificacoesInstrutor.length) {
        setTimeout(() => {
            showNotification(filaNotificacoesInstrutor[indiceAtual]);
        }, 800);
    }
}

setTimeout(() => {
    showNotification(filaNotificacoesInstrutor[0]);
}, 500);

notification.addEventListener("click", hideNotification);