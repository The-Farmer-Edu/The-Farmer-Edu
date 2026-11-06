
let notifications = [
    { id: 1, text: "Sua fazenda esta sendo atacada.", time: "Há 5 min", read: false },
    { id: 2, text: "Seu relatório da IA esta pronto.", time: "Há 1 hora", read: false },
    { id: 3, text: "Sua senha foi alterada com sucesso.", time: "Há 3 horas", read: false }
];


const container = document.querySelector(".notification-container");
const button = document.getElementById("notificationButton");
const box = document.getElementById("notificationBox");
const list = document.getElementById("notificationList");
const countBadge = document.getElementById("notificationCount");
const markReadBtn = document.getElementById("markRead");
const clearBtn = document.getElementById("clearNotifications");


button.addEventListener("click", (e) => {
    e.stopPropagation();
    box.classList.toggle("active");
});


document.addEventListener("click", (e) => {
    if (!container.contains(e.target)) {
        box.classList.remove("active");
    }
});


function render() {
    list.innerHTML = "";

    if (notifications.length === 0) {
        list.innerHTML = `<div class="empty-message">Nenhuma notificação por aqui.</div>`;
    } else {
        notifications.forEach((item) => {
            const div = document.createElement("div");
            div.className = `notification-item ${item.read ? "" : "unread"}`;
            div.innerHTML = `
                <p>${item.text}</p>
                <span class="time">${item.time}</span>
            `;

           
            div.addEventListener("click", () => markAsRead(item.id));
            list.appendChild(div);
        });
    }

    updateCount();
}


function updateCount() {
    const unreadCount = notifications.filter(n => !n.read).length;
    countBadge.textContent = unreadCount;

    if (unreadCount === 0) {
        countBadge.style.display = "none";
    } else {
        countBadge.style.display = "inline-block";
    }
}


function markAsRead(id) {
    notifications = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    render();
}


markReadBtn.addEventListener("click", () => {
    notifications = notifications.map(n => ({ ...n, read: true }));
    render();
});


clearBtn.addEventListener("click", () => {
    notifications = [];
    render();
});


render();