/**
 * sophia.js — Assistente IA "Sophia"
 *
 * Gerencia o balão de ajuda, as interações via console e as consultas à IA.
 * Depende de: atividade.js (window.FarmAtividade), iniciaratv.js (escreverConsole,
 *             contextoEntrega, errosAtuais, executadoAtual)
 */

/* ─── Estado interno ─────────────────────────────────────────────── */
const ajuda = { analisando: false, aguardando: false, dados: null, assinatura: '' };

/* ─── Balão: fala rápida (some sozinha) ─────────────────────────── */
function sophiaFala(msg, ms = 5000) {
    const b = document.getElementById('balao');
    if (!b) return;
    b.classList.remove('fixo');
    b.textContent = msg;
    b.classList.add('on');
    clearTimeout(sophiaFala._t);
    if (ms) sophiaFala._t = setTimeout(() => b.classList.remove('on'), ms);
}

function fecharBalao() {
    clearTimeout(sophiaFala._t);
    const b = document.getElementById('balao');
    if (b) b.classList.remove('on');
}

/* ─── Balão: ajuda detalhada (fica aberto até o aluno fechar) ───── */
function _secaoAjuda(balao, titulo, itens, classe) {
    if (!itens || !itens.length) return;
    const sec = document.createElement('div');
    sec.className = 'balao-sec ' + classe;
    const h = document.createElement('h4');
    h.textContent = titulo;
    const ul = document.createElement('ul');
    ul.className = 'balao-lista';
    itens.forEach(t => {
        const li = document.createElement('li');
        li.textContent = t;
        ul.appendChild(li);
    });
    sec.append(h, ul);
    balao.appendChild(sec);
}

function sophiaMostrarAjuda(f, temProblema) {
    const b = document.getElementById('balao');
    if (!b) return;
    clearTimeout(sophiaFala._t);
    b.innerHTML = '';
    b.classList.add('fixo');

    const topo = document.createElement('div');
    topo.className = 'balao-topo';

    const titulo = document.createElement('strong');
    titulo.textContent = temProblema ? 'Vamos corrigir juntos!' : 'Código sem erros!';

    const fechar = document.createElement('button');
    fechar.type = 'button';
    fechar.className = 'balao-fechar';
    fechar.setAttribute('aria-label', 'Fechar ajuda');
    fechar.textContent = '✕';
    fechar.onclick = fecharBalao;

    topo.append(titulo, fechar);
    b.appendChild(topo);

    if (temProblema) {
        if (f.feedback) {
            const p = document.createElement('p');
            p.className = 'balao-texto';
            p.textContent = f.feedback;
            b.appendChild(p);
        }
        // Erros de execução são adicionados como "Como corrigir"
        const errosExec = window._errosConsole
            ? window._errosConsole().map(m => 'Ao executar: ' + m)
            : [];
        _secaoAjuda(b, '✔ O que você já fez', f.feitos, 'ok');
        _secaoAjuda(b, '✖ O que ainda falta', f.faltando, 'falta');
        _secaoAjuda(b, '🔧 Como corrigir', errosExec.concat(f.melhorias), 'corrige');
    } else {
        const p = document.createElement('p');
        p.className = 'balao-texto';
        p.textContent = 'Não encontrei nenhum erro no seu código. ✔';
        b.appendChild(p);
        _secaoAjuda(b, '✔ O que você já fez', f.feitos, 'ok');
    }

    if (f.exemplo) {
        const ex = document.createElement('p');
        ex.className = 'balao-status';
        ex.textContent = '(resposta de exemplo)';
        b.appendChild(ex);
    }
    b.classList.add('on');
}

/* ─── Interação via console ──────────────────────────────────────── */
function habilitarConsole(ligado) {
    const inp = document.getElementById('conInput');
    const form = document.getElementById('conForm');
    if (!inp || !form) return;
    inp.disabled = !ligado;
    form.classList.toggle('ativo', ligado);
    if (ligado) inp.focus();
}

function perguntarAjuda() {
    ajuda.aguardando = true;
    if (typeof mostrarResultado === 'function') mostrarResultado(true);
    const msg = 'Encontrei algum problema no seu código. Quer a minha ajuda? Digite sim ou não no console.';
    sophiaFala(msg, 0);
    if (typeof escreverConsole === 'function') escreverConsole('Sophia: ' + msg, 'sophia-msg');
    habilitarConsole(true);
}

const _normalizar = t =>
    t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[.!?,]/g, '').trim();

function responderSophia(texto) {
    if (typeof escreverConsole === 'function') escreverConsole('› ' + texto, 'voce');
    if (!ajuda.aguardando) return;

    // Se o código mudou desde a pergunta, cancela
    const assinaturaAtual = typeof assinaturaDoCodigo === 'function' ? assinaturaDoCodigo() : '';
    if (assinaturaAtual !== ajuda.assinatura) {
        ajuda.aguardando = false;
        habilitarConsole(false);
        if (typeof escreverConsole === 'function')
            escreverConsole('Sophia: Você mexeu no código. Clique em mim de novo para eu olhar outra vez.', 'sophia-msg');
        return;
    }

    const r = _normalizar(texto);
    if (['sim', 's', 'quero', 'claro', 'pode', 'yes'].includes(r)) {
        ajuda.aguardando = false;
        habilitarConsole(false);
        if (typeof escreverConsole === 'function')
            escreverConsole('Sophia: Pronto! Minha ajuda está no balão.', 'sophia-msg');
        sophiaMostrarAjuda(ajuda.dados, true);
    } else if (['nao', 'n', 'agora nao', 'no'].includes(r)) {
        ajuda.aguardando = false;
        habilitarConsole(false);
        if (typeof escreverConsole === 'function')
            escreverConsole('Sophia: Tudo bem! Se precisar, é só clicar em mim.', 'sophia-msg');
        sophiaFala('Tudo bem! Se precisar, é só clicar em mim de novo.', 5000);
    } else {
        if (typeof escreverConsole === 'function')
            escreverConsole('Sophia: Não entendi. Digite sim ou não.', 'sophia-msg');
    }
}

/* ─── Verificação de problema no feedback ───────────────────────── */
function temProblema(f) {
    const modo = window.FarmAtividade ? window.FarmAtividade.linguagem.modo : 'web';
    const aceito = modo === 'web' || !f.compilador || /accepted|aceito/i.test(f.compilador);
    const aprovado = !f.status || /^aprovado$/i.test(String(f.status).trim());
    const erros = window._errosConsole ? window._errosConsole() : [];
    return !aceito || !aprovado || erros.length > 0 || f.faltando.length > 0;
}

/* ─── Evento: clique no avatar da Sophia ────────────────────────── */
function iniciarSophia() {
    const btn = document.getElementById('btnSophia');
    if (!btn) return;

    btn.addEventListener('click', async () => {
        if (btn.disabled) return;

        if (ajuda.analisando) {
            sophiaFala('Calma, ainda estou olhando o seu código...', 3000);
            return;
        }

        if (ajuda.aguardando) {
            const assinaturaAtual = typeof assinaturaDoCodigo === 'function' ? assinaturaDoCodigo() : '';
            if (assinaturaAtual === ajuda.assinatura) {
                if (typeof mostrarResultado === 'function') mostrarResultado(true);
                habilitarConsole(true);
                sophiaFala('Quer a minha ajuda? Digite sim ou não no console.', 0);
                return;
            }
            ajuda.aguardando = false;
            habilitarConsole(false);
        }

        const A = window.FarmAtividade;
        const arquivos = A ? A.linguagem.arquivos : [];
        const dados = window._dadosCodigo ? window._dadosCodigo() : {};
        if (arquivos.every(a => !dados[a.lang] || !dados[a.lang].trim())) {
            sophiaFala('Escreva um pouco de código e clique em mim de novo!', 4000);
            return;
        }

        if (typeof atualizarBotoes === 'function') {
            window._usosSophia = (window._usosSophia || 0) + 1;
            atualizarBotoes();
        }

        ajuda.analisando = true;
        ajuda.assinatura = typeof assinaturaDoCodigo === 'function' ? assinaturaDoCodigo() : '';
        sophiaFala('Deixa eu olhar o seu código...', 0);

        try {
            const erros = window._errosConsole ? window._errosConsole() : [];
            ajuda.dados = await consultarIAcomFallback({ erros_execucao: erros });
            if (temProblema(ajuda.dados)) {
                perguntarAjuda();
            } else {
                if (typeof escreverConsole === 'function')
                    escreverConsole('Sophia: Código sem erros!', 'sophia-msg');
                sophiaMostrarAjuda(ajuda.dados, false);
            }
        } catch (erro) {
            sophiaFala('Não consegui analisar agora. Tente novamente mais tarde.', 6000);
        } finally {
            ajuda.analisando = false;
        }
    });
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarSophia);
} else {
    iniciarSophia();
}

