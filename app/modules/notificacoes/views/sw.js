'use strict';

// Service Worker das notificações: recebe o push mesmo com o site fechado.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

function urlNotificacoes() {
    // O endereço do SW termina em /notificacoes/sw.js e a tela fica em /notificacoes
    // (vale tanto para index.php?rota=/notificacoes/sw.js quanto para URL limpa).
    return self.location.href.replace(/\/notificacoes\/sw\.js.*$/, '/notificacoes');
}

self.addEventListener('push', event => {
    let dados = {};

    try {
        dados = event.data ? event.data.json() : {};
    } catch (e) {
        dados = { mensagem: event.data ? event.data.text() : '' };
    }

    const titulo = dados.titulo || 'Farmer Edu';

    const opcoes = {
        body: dados.mensagem || 'Você tem uma nova notificação.',
        data: { url: dados.url || urlNotificacoes() },
        vibrate: [200, 100, 200]
    };

    if (dados.tag) {
        opcoes.tag = dados.tag;
        opcoes.renotify = true;
    }

    event.waitUntil((async () => {
        // Se a tela estiver aberta, atualiza a lista na hora.
        const janelas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        janelas.forEach(janela => janela.postMessage({ tipo: 'nova-notificacao' }));

        await self.registration.showNotification(titulo, opcoes);
    })());
});

self.addEventListener('notificationclick', event => {
    event.notification.close();

    const destino = (event.notification.data && event.notification.data.url) || urlNotificacoes();

    event.waitUntil((async () => {
        const janelas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        const janela = janelas[0];

        if (janela) {
            try {
                if ('navigate' in janela) {
                    await janela.navigate(destino);
                }
            } catch (e) { /* segue para o foco */ }

            return janela.focus();
        }

        return self.clients.openWindow(destino);
    })());
});
