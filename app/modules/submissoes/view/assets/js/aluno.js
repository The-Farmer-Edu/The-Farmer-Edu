/**
 * aluno.js — Página do aluno
 *
 * Responsabilidades:
 *   - Renderizar os dados da atividade no HTML (via window.FarmAtividade)
 *   - Exibir status de entrega, prazo e texto do botão Começar/Revisar/Visualizar
 *   - Modal de pontuação da IA (disponível só após o prazo)
 *   - Menus do cabeçalho (Iconi e Usuário)
 *
 * Depende de: atividade.js → window.FarmAtividade
 */

'use strict';

/* ─── Renderizar dados da atividade ──────────────────────────────── */
(function renderizarAtividade() {
    const FarmAtividade = window.FarmAtividade;
    if (!FarmAtividade) return;

    if (FarmAtividade.vazia) {
        document.querySelectorAll('.atv-sub, .atv-meta').forEach(e => e.style.display = 'none');
        return;
    }

    const escrever = (id, valor) => {
        const e = document.getElementById(id);
        if (e) e.textContent = valor;
    };

    escrever('atvTitulo',    FarmAtividade.titulo);
    escrever('atvDescricao', FarmAtividade.descricao);
    escrever('atvLinguagem', FarmAtividade.linguagem.nome);
    escrever('atvNota',      `de 0 a ${FarmAtividade.notaMax} (mínima para aprovação: ${FarmAtividade.notaMin})`);

    const lista = document.getElementById('atvRequisitos');
    if (lista) {
        lista.innerHTML = '';
        FarmAtividade.requisitos.forEach(r => {
            const li = document.createElement('li');
            li.textContent = r;
            lista.appendChild(li);
        });
    }

    const inputId = document.getElementById('atvInputId');
    if (inputId) inputId.value = FarmAtividade.id;

    const box = document.getElementById('atvBadges');
    if (box) {
        const cores = { HTML5: 'badge-html', CSS3: 'badge-css', JS: 'badge-js' };
        box.innerHTML = '';
        FarmAtividade.linguagem.badges.forEach(b => {
            const sp = document.createElement('span');
            sp.className = 'badge-padrao ' + (cores[b] || 'badge-outra');
            sp.textContent = b;
            box.appendChild(sp);
        });
    }
})();

/* ─── Chaves do localStorage ─────────────────────────────────────── */
const FarmAtividade = window.FarmAtividade;
const CHAVE_ENTREGA  = 'farmedu:entrega:'   + FarmAtividade.chave;
const CHAVE_AVALIACAO = 'farmedu:avaliacao:' + FarmAtividade.chave;

const statusEl      = document.querySelector('.status');
const textoEl       = document.getElementById('texto');
const botaoComecar  = document.getElementById('comecar');
const prazoEl       = document.getElementById('atvPrazo');
const btnNota       = document.getElementById('btnNota');
const notaAviso     = document.getElementById('notaAviso');
const modalNota     = document.getElementById('modalNota');
const notaConteudo  = document.getElementById('notaConteudo');

/* ─── Leitura do localStorage ────────────────────────────────────── */
function lerEntrega() {
    try { return JSON.parse(localStorage.getItem(CHAVE_ENTREGA)); } catch (e) { return null; }
}

function lerAvaliacao() {
    try { return JSON.parse(localStorage.getItem(CHAVE_AVALIACAO)); } catch (e) { return null; }
}

/* ─── Status de entrega e prazo ──────────────────────────────────── */
function atualizarStatus() {
    if (FarmAtividade.vazia) {
        if (statusEl)     statusEl.style.display = 'none';
        if (prazoEl)      prazoEl.hidden = true;
        if (textoEl)      textoEl.style.display = 'none';
        if (botaoComecar) botaoComecar.style.display = 'none';
        if (btnNota)      btnNota.style.display = 'none';
        if (notaAviso)    notaAviso.style.display = 'none';
        return;
    }

    const entrega  = lerEntrega();
    const data     = entrega && new Date(entrega.data);
    const entregue = !!data && !isNaN(data);
    const encerrado = FarmAtividade.prazoExcedido();

    // Status de entrega
    if (statusEl) {
        const ponto = document.createElement('span');
        ponto.className = 'ponto';
        statusEl.textContent = '';
        if (entregue) {
            const quando = data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            statusEl.append(ponto, ' Entregue em ' + quando);
        } else {
            statusEl.append(ponto, ' Não entregue');
        }
        statusEl.classList.toggle('entregue', entregue);
    }

    // Botão e texto: Começar / Revisar / Visualizar
    if (botaoComecar) {
        botaoComecar.classList.toggle('visualizar', encerrado);
        botaoComecar.textContent = encerrado ? 'Visualizar' : entregue ? 'Revisar' : 'Começar';
    }
    if (textoEl) {
        textoEl.textContent = encerrado
            ? (entregue
                ? 'O prazo acabou. Clique em "Visualizar" para ver o código que você entregou.'
                : 'O prazo de entrega acabou. Você pode apenas visualizar a atividade.')
            : (entregue
                ? 'Atividade entregue! Clique em "Revisar" para ver o seu código.'
                : 'Escreva seu código direto na plataforma clicando em "Começar".');
    }

    // Prazo
    if (prazoEl) {
        if (FarmAtividade.limite) {
            prazoEl.hidden = false;
            prazoEl.classList.toggle('encerrado', encerrado);
            prazoEl.textContent = encerrado
                ? 'Prazo encerrado em ' + FarmAtividade.limiteTexto()
                : 'Prazo de entrega até ' + FarmAtividade.limiteTexto();
        } else {
            prazoEl.hidden = true;
        }
    }

    atualizarNota(entregue, encerrado);
}

/* ─── Modal de pontuação da IA ───────────────────────────────────── */
function atualizarNota(entregue, encerrado) {
    if (!btnNota) return;

    let liberado = false;
    let msg;
    if (!encerrado) {
        msg = FarmAtividade.limite
            ? '🔒 Disponível depois do prazo de entrega (' + FarmAtividade.limiteTexto() + ').'
            : '🔒 Disponível quando o prazo de entrega terminar.';
    } else if (!entregue) {
        msg = 'Você não entregou esta atividade, então não há pontuação.';
    } else if (!lerAvaliacao()) {
        msg = 'Sua entrega ainda não foi avaliada pela IA.';
    } else {
        liberado = true;
        msg = 'O prazo acabou. Sua pontuação já está disponível.';
    }

    btnNota.disabled    = !liberado;
    btnNota.textContent = liberado ? 'Ver pontuação da IA' : '🔒 Pontuação da IA';
    if (notaAviso) notaAviso.textContent = msg;
}

function abrirNota() {
    const aval = lerAvaliacao();
    if (!modalNota || !notaConteudo || !aval || !FarmAtividade.prazoExcedido()) return;

    // Cria elementos com textContent (nunca innerHTML com dados da IA)
    const novo = (tag, classe, texto) => {
        const e = document.createElement(tag);
        if (classe) e.className = classe;
        if (texto !== undefined) e.textContent = texto;
        return e;
    };
    const lista = (titulo, itens) => {
        if (!itens || !itens.length) return;
        notaConteudo.appendChild(novo('h4', '', titulo));
        const ul = novo('ul');
        itens.forEach(t => ul.appendChild(novo('li', '', String(t))));
        notaConteudo.appendChild(ul);
    };

    notaConteudo.innerHTML = '';
    const nota     = aval.nota != null ? aval.nota : '—';
    const aprovado = aval.status
        ? /^aprovado$/i.test(String(aval.status).trim())
        : Number(aval.nota) >= FarmAtividade.notaMin;

    const valor = novo('p', 'nota-valor', `Nota atribuída: ${nota} / ${FarmAtividade.notaMax}`);
    valor.appendChild(novo('span', 'nota-selo ' + (aprovado ? 'aprovado' : 'reprovado'), aprovado ? 'Aprovado' : 'Reprovado'));
    notaConteudo.appendChild(valor);
    notaConteudo.appendChild(novo('p', 'nota-pequeno', `Nota mínima para aprovação: ${FarmAtividade.notaMin}`));

    if (aval.compilador) {
        const p = novo('p');
        p.append(novo('strong', '', 'Status do compilador: '), String(aval.compilador));
        notaConteudo.appendChild(p);
    }
    if (aval.saida && String(aval.saida).trim()) {
        notaConteudo.appendChild(novo('h4', '', 'Terminal'));
        notaConteudo.appendChild(novo('pre', '', String(aval.saida).trim()));
    }
    if (aval.feedback) {
        notaConteudo.appendChild(novo('h4', '', 'Feedback do Professor IA'));
        notaConteudo.appendChild(novo('p', '', String(aval.feedback)));
    }
    lista('✔ O que você fez', aval.feitos);
    lista('✖ O que ficou faltando', aval.faltando);
    lista('Missões de correção (pontos de melhoria)', aval.melhorias);
    if (!(aval.faltando || []).length && !(aval.melhorias || []).length) {
        notaConteudo.appendChild(novo('p', 'nota-pequeno', 'Lógica perfeita! Nenhuma correção necessária.'));
    }
    if (aval.exemplo) {
        notaConteudo.appendChild(novo('p', 'nota-pequeno', '(Resposta de exemplo: a IA não respondeu na hora da entrega.)'));
    }
    if (aval.data) {
        const quando = new Date(aval.data);
        if (!isNaN(quando)) {
            notaConteudo.appendChild(novo('p', 'nota-pequeno', 'Avaliado em ' + quando.toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
            })));
        }
    }
    modalNota.classList.add('active');
}

function fecharNota() {
    if (modalNota) modalNota.classList.remove('active');
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') fecharNota();
});

/* ─── Botão Voltar ───────────────────────────────────────────────── */
const btnVoltar = document.getElementById('btnVoltar');
if (btnVoltar) btnVoltar.addEventListener('click', () => history.back());

/* ─── Eventos do modal de nota ───────────────────────────────────── */
if (btnNota)   btnNota.addEventListener('click', abrirNota);
const notaFechar = document.getElementById('notaFechar');
if (notaFechar) notaFechar.addEventListener('click', fecharNota);
if (modalNota)  modalNota.addEventListener('click', e => { if (e.target === modalNota) fecharNota(); });

/* ─── Inicialização e polling ────────────────────────────────────── */
atualizarStatus();
window.addEventListener('pageshow', atualizarStatus);
window.addEventListener('storage',  atualizarStatus);
setInterval(atualizarStatus, 30_000); // Atualiza para "Visualizar" quando o prazo vencer
