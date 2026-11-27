
// Menu de usuário dropdown
const userBtn = document.getElementById('userMenuBtn');
if (userBtn) {
    userBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        this.classList.toggle('aberto');
    });
}
document.addEventListener('click', function(e) {
    if (userBtn && !userBtn.contains(e.target)) {
        userBtn.classList.remove('aberto');
    }
});

// Filtro de pesquisa das atividades
function filtrarAtividades(termo) {
    const q = termo.toLowerCase().trim();
    document.querySelectorAll('.secao').forEach(secao => {
        const cards = secao.querySelectorAll('.card-atividade');
        let visiveis = 0;

        cards.forEach(card => {
            const titulo = card.dataset.titulo || '';
            const mostrar = !q || titulo.includes(q);
            card.style.display = mostrar ? '' : 'none';
            if (mostrar) visiveis++;
        });

        secao.style.display = visiveis > 0 ? '' : 'none';
    });
}

// Modal flutuante de feedback da IA (visão do aluno)
function abrirFeedbackIAAluno(idSubmissao) {
    const modal = document.getElementById('modalFeedbackIA');
    const container = document.getElementById('feedbackIAConteudo');
    container.innerHTML = '<div class="feedback-ia-loading">⏳ Carregando análise da IA...</div>';
    modal.style.display = 'flex';

    const baseUrl = window.BASE_URL || '';
    const body = new URLSearchParams({
        id_submissao: idSubmissao
    });

    fetch(baseUrl + '/notas/feedback-ia', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest',
        },
        body: body.toString()
    })
    .then(res => res.json())
    .then(data => {
        if (!data.sucesso) {
            container.innerHTML = '<div class="feedback-ia-vazio">Nenhum feedback da IA disponível para esta submissão.</div>';
            return;
        }

        let html = '';

        if (data.probabilidade) {
            const prob = data.probabilidade;
            const matchPct = (prob.probabilidade_ia || '').match(/([\d.]+)%/);
            const pctNum = matchPct ? parseFloat(matchPct[1]) : 0;

            let corBarra = '#1B5E20';
            let labelRisco = 'Baixo';
            if (pctNum > 80) { corBarra = '#DC2626'; labelRisco = 'Alto'; }
            else if (pctNum > 60) { corBarra = '#FF8D28'; labelRisco = 'Moderado'; }

            html += `
                <div class="feedback-ia-secao">
                    <div class="feedback-ia-titulo">📊 Probabilidade de Uso de IA</div>
                    <div class="feedback-ia-barra-wrap">
                        <div class="feedback-ia-barra-bg">
                            <div class="feedback-ia-barra-fill" style="width:${pctNum}%;background:${corBarra}"></div>
                        </div>
                        <div class="feedback-ia-barra-info">
                            <span class="feedback-ia-pct" style="color:${corBarra}">${pctNum}%</span>
                            <span class="feedback-ia-risco" style="background:${corBarra}">${labelRisco}</span>
                        </div>
                    </div>
                    ${prob.motivo_ia ? `<div class="feedback-ia-motivo"><strong>Motivo:</strong> ${escapeHtml(prob.motivo_ia.replace('Motivo: ', ''))}</div>` : ''}
                    ${prob.mensagem_aluno ? `<div class="feedback-ia-alerta-aluno">⚠️ ${escapeHtml(prob.mensagem_aluno.replace('Mensagem para o aluno: ', ''))}</div>` : ''}
                </div>
            `;
        }

        if (data.feedback_geral) {
            const fg = data.feedback_geral;
            if (fg.analise_tecnica) {
                html += `
                    <div class="feedback-ia-secao">
                        <div class="feedback-ia-titulo">🔍 Análise Técnica</div>
                        <div class="feedback-ia-texto">${escapeHtml(fg.analise_tecnica)}</div>
                    </div>
                `;
            }
            if (fg.resposta_aluno) {
                html += `
                    <div class="feedback-ia-secao">
                        <div class="feedback-ia-titulo">💬 Feedback para o Aluno</div>
                        <div class="feedback-ia-texto">${escapeHtml(fg.resposta_aluno)}</div>
                    </div>
                `;
            }
        }

        if (data.feedback_extra) {
            const fe = data.feedback_extra;
            if (fe.pontos_positivos) {
                html += `
                    <div class="feedback-ia-secao">
                        <div class="feedback-ia-titulo">✅ Pontos Positivos</div>
                        <div class="feedback-ia-texto">${escapeHtml(fe.pontos_positivos)}</div>
                    </div>
                `;
            }
            if (fe.pontos_negativos) {
                html += `
                    <div class="feedback-ia-secao">
                        <div class="feedback-ia-titulo">⚠️ Pontos a Melhorar</div>
                        <div class="feedback-ia-texto">${escapeHtml(fe.pontos_negativos)}</div>
                    </div>
                `;
            }
            if (fe.sugestao_resposta) {
                html += `
                    <div class="feedback-ia-secao">
                        <div class="feedback-ia-titulo">💡 Sugestão de Resposta</div>
                        <div class="feedback-ia-texto">${escapeHtml(fe.sugestao_resposta)}</div>
                    </div>
                `;
            }
        }

        if (!html) {
            html = '<div class="feedback-ia-vazio">Nenhum feedback da IA disponível para esta submissão.</div>';
        }

        container.innerHTML = html;
    })
    .catch(() => {
        container.innerHTML = '<div class="feedback-ia-erro">❌ Erro ao carregar feedback da IA. Tente novamente.</div>';
    });
}

function fecharFeedbackIAAluno() {
    document.getElementById('modalFeedbackIA').style.display = 'none';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
