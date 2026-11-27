/**
 * Exibe notificação flutuante temporária.
 */
function exibirToast(msg, ok = true) {
    const toast = document.getElementById('toast');
    toast.textContent = (ok ? '✅ ' : '❌ ') + msg;
    toast.className = ok ? 'toast-ok' : 'toast-err';
    toast.style.display = 'flex';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 3500);
}

/**
 * Expande ou recolhe a seção do acordeão.
 */
function toggleAluno(headerElement) {
    const secao = headerElement.closest('.aluno-secao');
    secao.classList.toggle('fechado');
    const wrap = secao.querySelector('.tabela-wrap');
    if (wrap) {
        wrap.style.display = secao.classList.contains('fechado') ? 'none' : 'block';
    }
}

/**
 * Filtro em tempo real de alunos ou atividades.
 */
function filtrarAlunos(termo) {
        const secoes = document.querySelectorAll('.aluno-secao');
        const q = termo.toLowerCase().trim();
        secoes.forEach(s => {
            const nome = s.dataset.nome || '';
            s.style.display = (!q || nome.includes(q)) ? '' : 'none';
        });
}

function filtrarAtividades(termo) {
    const secoes = document.querySelectorAll('#view-atividade .aluno-secao');
    const q = termo.toLowerCase().trim();

    secoes.forEach(secao => {
        const nome = (secao.dataset.nome || '').toLowerCase().trim();
        secao.style.display = (!q || nome.includes(q)) ? '' : 'none';
    });
}

function alternarVisualizacao(modo) {
    const viewAluno = document.getElementById('view-aluno');
    const viewBoletim = document.getElementById('view-boletim');
    const viewAtividade = document.getElementById('view-atividade');

    const btnAluno = document.getElementById('btn-por-aluno');
    const btnBoletim = document.getElementById('btn-boletim');
    const btnAtividade = document.getElementById('btn-por-atividade');

    const filtroInput = document.getElementById('filtro-aluno');

    if (modo === 'boletim') {
        viewAluno.style.display = 'none';
        viewAtividade.style.display = 'none';
        viewBoletim.style.display = 'block';

        btnAluno.classList.remove('ativo');
        btnAluno.setAttribute('aria-pressed', 'false');
        btnAtividade.classList.remove('ativo');
        btnAtividade.setAttribute('aria-pressed', 'false');

        btnBoletim.classList.add('ativo');
        btnBoletim.setAttribute('aria-pressed', 'true');

        if (filtroInput) filtroInput.parentElement.style.display = 'none';
    } else if (modo === 'atividade') {
        viewAluno.style.display = 'none';
        viewBoletim.style.display = 'none';
        viewAtividade.style.display = 'block';

        btnAluno.classList.remove('ativo');
        btnAluno.setAttribute('aria-pressed', 'false');
        btnBoletim.classList.remove('ativo');
        btnBoletim.setAttribute('aria-pressed', 'false');

        btnAtividade.classList.add('ativo');
        btnAtividade.setAttribute('aria-pressed', 'true');

        if (filtroInput) {
            filtroInput.parentElement.style.display = 'flex';
            filtroInput.placeholder = 'Buscar atividade pelo título...';

            filtrarAtividades(filtroInput.value);
        }
    } else {
        viewBoletim.style.display = 'none';
        viewAtividade.style.display = 'none';
        viewAluno.style.display = 'block';

        btnBoletim.classList.remove('ativo');
        btnBoletim.setAttribute('aria-pressed', 'false');
        btnAtividade.classList.remove('ativo');
        btnAtividade.setAttribute('aria-pressed', 'false');

        btnAluno.classList.add('ativo');
        btnAluno.setAttribute('aria-pressed', 'true');

        if (filtroInput) {
            filtroInput.parentElement.style.display = 'flex';
            filtroInput.placeholder = 'Buscar aluno pelo nome...';
            filtrarAlunos(filtroInput.value);
        }
    }
}

function lancarNota(event, form) {
    event.preventDefault();

    const idSubmissao = form.dataset.submissao;
    const idTurma     = form.dataset.turma;
    const inputNota   = form.querySelector('input[name="valor"]');
    const btn         = form.querySelector('button[type="submit"]');
    const valor       = parseFloat(inputNota.value);

    if (isNaN(valor) || valor < 0 || valor > 10) {
        mostrarToast('⚠ Nota deve ser entre 0 e 10.', false);
        return;
    }

    btn.disabled = true;
    btn.textContent = '⏳ Salvando...';

    const body = new URLSearchParams({
        acao:         'salvar',
        id_submissao: idSubmissao,
        valor:        valor,
        id_turma:     idTurma,
    });

    fetch('salvar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest',
        },
        body: body.toString(),
    })
    .then(res => res.json())
    .then(data => {
        if (data.sucesso) {
            mostrarToast('✅ ' + data.mensagem, true);

            const notaFmt = valor.toFixed(1).replace('.', ',');
            let classe = 'nota-ruim';
            if (valor == 10)     classe = 'nota-10';
            else if (valor >= 7) classe = 'nota-boa';
            else if (valor >= 5) classe = 'nota-ok';

            // Sincroniza todas as ocorrências (Por aluno e Por atividades)
            document.querySelectorAll(`.form-nota[data-submissao="${idSubmissao}"]`).forEach(f => {
                const inp = f.querySelector('input[name="valor"]');
                if (inp) inp.value = valor;

                const tr = f.closest('tr');
                if (!tr) return;

                const isPorAtividade = f.closest('#view-atividade') !== null;
                const tdNota   = tr.querySelector(isPorAtividade ? 'td:nth-child(3)' : 'td:nth-child(5)');
                const tdStatus = tr.querySelector(isPorAtividade ? 'td:nth-child(2)' : 'td:nth-child(4)');

                if (tdNota) {
                    tdNota.innerHTML = `<span class="nota-atual ${classe}">${notaFmt}</span>`;
                }
                if (tdStatus) {
                    const substatus = tdStatus.querySelector('.substatus-prazo, .substatus-atraso');
                    tdStatus.innerHTML = '<span class="badge badge-corrigido">✔ Corrigida</span>' + (substatus ? substatus.outerHTML : '');
                }

                recalcularMedia(f);
            });

            // Atualiza também a célula correspondente na aba Boletim
            const tdBoletim = document.querySelector(`td[data-boletim-submissao="${idSubmissao}"]`);
            if (tdBoletim) {
                const statusEl = tdBoletim.querySelector('.status-boletim');
                const textoStatus = (statusEl && statusEl.classList.contains('atraso'))
                    ? '<span class="status-boletim atraso">Entregue com atraso</span>'
                    : '<span class="status-boletim">No prazo</span>';
                tdBoletim.innerHTML = `<span class="nota-boletim">${notaFmt}</span>${textoStatus}`;
            }

        } else {
            mostrarToast('❌ ' + data.mensagem, false);
        }
    })
    .catch(() => mostrarToast('❌ Erro de conexao. Tente novamente.', false))
    .finally(() => {
        btn.disabled = false;
        btn.innerHTML = '💾 Salvar';
    });
}

/**
 * Recalcula a média das notas dinamicamente na página.
 */
function recalcularMedia(formElement) {
    // Só recalcula média na aba "Por aluno" (não sobrescreve o Prazo em "Por atividades")
    if (formElement.closest('#view-aluno') === null) return;

    const secao = formElement.closest('.aluno-secao');
    if (!secao) return;

    const inputs = secao.querySelectorAll('input.input-nota');
    const valores = [];
    inputs.forEach(inp => {
        const v = parseFloat(inp.value);
        if (!isNaN(v)) valores.push(v);
    });

    if (valores.length === 0) return;

    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    const mediaFmt = media.toFixed(1).replace('.', ',');

    const mediaSpan = secao.querySelector('.aluno-media strong');
    if (mediaSpan) {
        mediaSpan.textContent = mediaFmt + ' / 10';
    }
}

// Busca o histórico diretamente do banco de dados MySQL
function abrirHistorico(idSubmissao) {
    const container = document.getElementById('historicoConteudo');
    container.innerHTML = '<li class="historico-item" style="color:var(--texto-secundario); text-align:center;">⏳ Carregando histórico...</li>';
    document.getElementById('modalHistorico').style.display = 'flex';

    const body = new URLSearchParams({
        acao: 'historico',
        id_submissao: idSubmissao
    });

    fetch('salvar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest',
        },
        body: body.toString()
    })
    .then(res => res.json())
    .then(data => {
        const lista = data.historico || [];
        if (lista.length === 0) {
            container.innerHTML = '<li class="historico-item" style="color:var(--texto-secundario); text-align:center;">Nenhuma alteração registrada ainda.</li>';
        } else {
            container.innerHTML = lista.map(h => {
                const novaFmt = parseFloat(h.nota_nova).toFixed(1).replace('.', ',');
                const antFmt  = h.nota_anterior !== null ? parseFloat(h.nota_anterior).toFixed(1).replace('.', ',') : 'Inicial';
                return `
                    <li class="historico-item">
                        <div><strong>Nota: ${novaFmt}</strong> (Anterior: ${antFmt})</div>
                        <div style="font-size:0.75rem; color:var(--texto-secundario)">Alterado por ${h.nome_instrutor} em ${h.data_fmt}</div>
                    </li>
                `;
            }).join('');
        }
    })
    .catch(() => {
        container.innerHTML = '<li class="historico-item" style="color:var(--vermelho); text-align:center;">Erro ao carregar histórico.</li>';
    });
}

function fecharHistorico() {
    document.getElementById('modalHistorico').style.display = 'none';
}

function mostrarToast(msg, sucesso) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className   = sucesso ? 'toast-ok' : 'toast-err';
    toast.style.display = 'flex';

    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// Controle de dropdown do perfil
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

function aplicarFiltroInicialDeAtividade() {
    const parametros = new URLSearchParams(window.location.search);
    const atividade = (parametros.get('atividade') || '').trim();

    if (!atividade) return;

    alternarVisualizacao('atividade');

    const filtroInput = document.getElementById('filtro-aluno');
    if (!filtroInput) return;

    filtroInput.value = atividade;
    filtroInput.placeholder = 'Buscar atividade pelo título...';
    filtroInput.setAttribute('aria-label', 'Buscar atividade pelo título');
    filtrarAtividades(atividade);
}

function filtrarCampoAtual(termo) {
    const viewAtividade = document.getElementById('view-atividade');

    if (viewAtividade && viewAtividade.style.display !== 'none') {
        filtrarAtividades(termo);
        return;
    }

    filtrarAlunos(termo);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', aplicarFiltroInicialDeAtividade);
} else {
    aplicarFiltroInicialDeAtividade();
}
