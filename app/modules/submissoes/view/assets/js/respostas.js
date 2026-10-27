document.addEventListener('DOMContentLoaded', async () => {
    try {
        const resposta = await fetch('api/submissoes/listar');
        const dados = await resposta.json();

        const container = document.body; 
        
        if (!dados || dados.length === 0) {
            container.innerHTML += '<p>Nenhuma resposta enviada ainda.</p>';
            return;
        }

        let html = '<h2>Suas Respostas e Feedbacks</h2><ul>';
        dados.forEach(sub => {
            html += `
                <li>
                    <strong>Atividade:</strong> ${sub.titulo_atividade} | 
                    <strong>Tentativa:</strong> ${sub.tentativa_num} | 
                    <strong>Status:</strong> ${sub.status}
                    <div class="feedback-ia">
                        <p><strong>Feedback da Sophia/IA:</strong> ${sub.sugestao_resposta || 'Aguardando processamento...'}</p>
                    </div>
                </li>
            `;
        });
        html += '</ul>';
        container.innerHTML += html;

    } catch (e) {
        console.error('Erro ao carregar o histórico de respostas', e);
    }
});
