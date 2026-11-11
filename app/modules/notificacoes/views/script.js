const notification = document.getElementById("phoneNotification");
const closeBtn = document.getElementById("closeNotificationBtn");
let autoHideTimeout;

// Função para exibir a notificação
function showNotification() {
    clearTimeout(autoHideTimeout);
    notification.classList.add("show");

    // Esconde automaticamente após 5 segundos
    autoHideTimeout = setTimeout(() => {
        hideNotification();
    }, 5000);
}

// Função para esconder a notificação
function hideNotification() {
    notification.classList.remove("show");
}

// Dispara a notificação automaticamente 1 segundo após abrir a página
window.addEventListener("DOMContentLoaded", () => {
    setTimeout(showNotification, 1000);
});

// Fechar ao clicar no botão "X"
if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        hideNotification();
    });
}

// Fechar ao clicar no corpo da notificação
notification.addEventListener("click", hideNotification);
