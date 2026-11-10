/**
 * submissao.js — Entrega e avaliação pela IA
 *
 * Gerencia o fluxo completo de entrega: modal de confirmação, cancelamento,
 * chamadas à IA (Judge0 + Gemini/Ollama), armazenamento do feedback em
 * localStorage e exibição dos contadores de limite.
 *
 * Depende de: atividade.js (window.FarmAtividade), iniciaratv.js (escreverConsole,
 *             contextoEntrega, executar, aviso, mostrarResultado)
 */

/* ─── Configuração do endpoint de feedback ───────────────────────── */
const FEEDBACK = {
    endpoints: ['feedback_ia/sendAvaliacao', 'enviarSubmissao'],
    usarExemploSeFalhar: true,

    montarPayload(ctx) {
        const A = window.FarmAtividade;
        return {
            linguagem:          ctx.linguagem,
            codigo_aluno:       ctx.codigo,
            id_linguagem:       ctx.idLinguagem,
            objetivo_atividade: A.objetivo,
            nota_max:           String(A.notaMax),
            nota_min:           String(A.notaMin),
            dados_entrada:      A.entrada,
            atividadeId:        A.id
        };
    },

    interpretar(data) {
        const av = data.avaliacao || {};
        const st = data.compilacao && data.compilacao.status;
        return {
            nota:      av.nota_atribuida,
            status:    av.status_avaliacao,
            feedback:  av.feedback_geral,
            melhorias: av.pontos_melhoria      || [],
            feitos:    av.pontos_positivos     || av.o_que_foi_feito  || [],
            faltando:  av.o_que_falta          || av.pontos_faltantes || [],
            compilador: st && (st.description || st),
            saida:     data.compilacao && data.compilacao.saida_terminal
        };
    },

    /** Resposta de exemplo usada quando a IA falha */
    exemplo() {
        const A    = window.FarmAtividade;
        const modo = A.linguagem.modo;
        const req  = A.requisitos || [];
        const erros = window._errosConsole ? window._errosConsole() : [];
        const exec  = window._executadoAtual || false;

        const saidaOk = modo === 'terminal'
            && typeof A.saidaEsperada === 'string'
            && exec && erros.length === 0;

        if (saidaOk) {
            return {
                sucesso: true,
                compilacao: { status: 'Accepted', saida_terminal: A.saidaEsperada },
                avaliacao: {
                    nota_atribuida:   A.notaMax,
                    status_avaliacao: 'aprovado',
                    feedback_geral:   'A saída do seu código confere com o esperado.',
                    pontos_positivos: req.map(r => 'Você cumpriu: ' + r),
                    o_que_falta:      [],
                    pontos_melhoria:  []
                }
            };
        }

        const metade = Math.ceil(req.length / 2);
        return {
            sucesso: true,
            compilacao: { status: 'Código Aceito!', saida_terminal: '' },
            avaliacao: {
                nota_atribuida:   5,
                status_avaliacao: 'reprovado',
                feedback_geral:   'Você está no caminho certo, mas faltam alguns itens.',
                pontos_positivos: req.slice(0, metade).map(r => 'Você já trabalhou neste item: ' + r),
                o_que_falta:      req.slice(metade).map(r => 'Ainda falta: ' + r),
                pontos_melhoria:  ['Releia os itens que faltam, execute o código e confira o resultado no console.']
            }
        };
    }
};

/* ─── Parsing de resposta do servidor ───────────────────────────── */

/**
 * Lê a resposta como JSON, tolerando avisos PHP antes do JSON.
 */
function lerJson(texto) {
    try { return JSON.parse(texto); } catch (e) {}
    // Remove avisos PHP no formato <br /><b>Warning</b>: ...
    const limpo = texto.replace(/<br\s*\/?\s*>\s*<b>[^<]*<\/b>:[\s\S]*?<br\s*\/?>/gi, '').trim();
    try { return JSON.parse(limpo); } catch (e) {}
    // Último recurso: começa no primeiro { ou [ válido
    let tentativas = 0;
    for (const m of texto.matchAll(/[\[{]/g)) {
        if (++tentativas > 20) break;
        try { return JSON.parse(texto.slice(m.index)); } catch (e) {}
    }
    const legivel = texto.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim().slice(0, 700);
    throw new Error(legivel || 'resposta vazia');
}

/** Detecta se o texto é um erro impresso pelo PHP (Warning, Fatal error…). */
const erroDoPHP = texto =>
    /<b>\s*(Warning|Fatal error|Notice|Parse error|Deprecated)\s*<\/b>|Fatal error:|Warning:|Uncaught/i.test(texto);

/* ─── Chamada ao servidor de avaliação ──────────────────────────── */

/**
 * Faz POST para o endpoint de avaliação (Judge0 + IA).
 * Tenta cada endpoint em ordem; lança erro se todos falharem.
 */
async function avaliarNoServidor(extra = {}) {
    const corpo = JSON.stringify({ ...FEEDBACK.montarPayload(contextoEntrega()), ...extra });
    let ultimoErro = null;

    for (const endereco of FEEDBACK.endpoints) {
        let resposta, texto;
        const ctl    = new AbortController();
        const relogio = setTimeout(() => ctl.abort(), 120_000);
        try {
            resposta = await fetch(endereco, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: corpo,
                signal: ctl.signal
            });
            texto = await resposta.text();
        } catch (e) {
            ultimoErro = e.name === 'AbortError'
                ? new Error('o servidor demorou demais para responder') : e;
            continue;
        } finally {
            clearTimeout(relogio);
        }

        if (resposta.status === 404 || resposta.status === 405) {
            ultimoErro = new Error(`endereço "${endereco}" não encontrado (HTTP ${resposta.status})`);
            continue;
        }

        let data;
        try {
            data = lerJson(texto);
        } catch (e) {
            console.error(`"${endereco}" não devolveu JSON. Resposta:`, texto);
            ultimoErro = new Error('o servidor não devolveu JSON: ' + e.message);
            if (erroDoPHP(texto)) throw ultimoErro;
            continue;
        }

        console.log('Resposta do servidor:', data);
        if (!data.sucesso) throw new Error(data.erro || 'Erro desconhecido');
        return data;
    }

    throw ultimoErro || new Error('Sem resposta do servidor de avaliação');
}

/* ─── Cache de resposta ──────────────────────────────────────────── */
let _ultimaResposta = null;

/**
 * Reutiliza a resposta da última execução se o código não mudou.
 */
async function consultarIA(extra = {}) {
    const ctx = contextoEntrega();
    if (_ultimaResposta && _ultimaResposta.codigo === ctx.codigo) return _ultimaResposta.f;
    return FEEDBACK.interpretar(await avaliarNoServidor(extra));
}

async function consultarIAcomFallback(extra = {}) {
    try {
        return await consultarIA(extra);
    } catch (erro) {
        console.warn('IA indisponível:', erro);
        if (FEEDBACK.usarExemploSeFalhar) {
            return { ...FEEDBACK.interpretar(FEEDBACK.exemplo()), exemplo: true };
        }
        throw erro;
    }
}

/** Expõe para sophia.js e iniciaratv.js */
window.consultarIA            = consultarIA;
window.consultarIAcomFallback = consultarIAcomFallback;

/* ─── Estado da entrega ──────────────────────────────────────────── */
const LIMITE_CLICKS       = 10;
const LIMITE_CANCELAMENTOS = 3;

const A = window.FarmAtividade;

const CHAVE_ENTREGA      = `farmedu:entrega:${A.chave}`;
const CHAVE_CANCELAMENTOS_KEY = `farmedu:cancelamentos:${A.chave}`;
const CHAVE_AVALIACAO    = `farmedu:avaliacao:${A.chave}`;

let entrega      = null;
let cancelamentos = 0;
let enviando     = false;
let avaliacaoSeq = 0;

try { entrega      = JSON.parse(localStorage.getItem(CHAVE_ENTREGA)); }      catch (e) {}
try { cancelamentos = Number(localStorage.getItem(CHAVE_CANCELAMENTOS_KEY)) || 0; } catch (e) {}

/** Formata data ISO para pt-BR compacto */
const formatarData = iso =>
    new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

/* ─── Contadores de limite ───────────────────────────────────────── */
function atualizarContadores() {
    const usos = window._usos || { executar: 0, sophia: 0 };
    const exec = Math.max(0, LIMITE_CLICKS - usos.executar);
    const soph = Math.max(0, LIMITE_CLICKS - usos.sophia);
    const canc = Math.max(0, LIMITE_CANCELAMENTOS - cancelamentos);

    const $id = id => document.getElementById(id);
    if ($id('contadorExecutar')) $id('contadorExecutar').textContent = `${exec}/${LIMITE_CLICKS}`;
    if ($id('contadorSophia'))  $id('contadorSophia').textContent  = `${soph}/${LIMITE_CLICKS}`;
    if ($id('contadorCancelar')) $id('contadorCancelar').textContent = `${canc}/${LIMITE_CANCELAMENTOS}`;

    const lim = $id('contadorLimite');
    if (lim) lim.classList.toggle('is-limitado', exec === 0 || soph === 0 || canc === 0);
}

/* ─── Atualizar estado do botão de entrega ───────────────────────── */
function atualizarEntrega() {
    const entregue  = !!entrega;
    const encerrado = A.prazoExcedido();
    const bloqueado = entregue && cancelamentos >= LIMITE_CANCELAMENTOS;
    const $id       = id => document.getElementById(id);

    // Editor: somente leitura quando entregue ou encerrado
    const ed = $id('ed');
    if (ed) ed.readOnly = entregue || encerrado || A.vazia;

    // Chip de entrega
    const chipEntrega = $id('chipEntrega');
    if (chipEntrega) {
        chipEntrega.hidden = !entregue;
        if (entregue)
            chipEntrega.textContent = '✔ Entregue em ' + formatarData(entrega.data) + (enviando ? ' · IA avaliando...' : '');
    }

    // Chip de prazo
    const chipPrazo = $id('chipPrazo');
    if (chipPrazo) {
        chipPrazo.hidden = !A.limite;
        chipPrazo.classList.toggle('encerrado', encerrado);
        chipPrazo.textContent = encerrado
            ? 'Prazo encerrado em ' + A.limiteTexto()
            : 'Prazo para entregar até ' + A.limiteTexto();
    }

    // Botão de entrega
    const btn = $id('btnEntregar');
    if (btn) {
        const executando = window._executando || false;
        btn.disabled = A.vazia || bloqueado || encerrado || (!entregue && executando);
        btn.textContent = encerrado   ? 'Prazo encerrado'
            : bloqueado               ? 'Entrega final'
            : entregue                ? 'Cancelar entrega'
            :                           'Entregar atividade';
        btn.className = entregue || encerrado ? 'btn btn-cinza' : 'btn btn-verde';
    }

    atualizarContadores();
}

window.atualizarEntrega = atualizarEntrega;

/* ─── Modal de confirmação de entrega ───────────────────────────── */
const modalEntrega = document.getElementById('modalEntrega');

function abrirModalEntrega() {
    const $id    = id => document.getElementById(id);
    const dados  = window._dadosCodigo ? window._dadosCodigo() : {};
    const arquivos = A.linguagem.arquivos;

    const resumo = $id('resumoEntrega');
    if (resumo) {
        resumo.innerHTML = '';
        arquivos.forEach(a => {
            const linhas = dados[a.lang] && dados[a.lang].trim() ? dados[a.lang].split('\n').length : 0;
            const li = document.createElement('li');
            const bolinha = document.createElement('span');
            bolinha.className = 'dot dot-' + a.lang;
            li.append(bolinha, `${a.nome} — ${linhas} ${linhas === 1 ? 'linha' : 'linhas'}`);
            resumo.appendChild(li);
        });
    }

    const rest = LIMITE_CANCELAMENTOS - cancelamentos;
    const aviso = $id('avisoCancelar');
    if (aviso) {
        aviso.textContent = rest > 0
            ? `Depois de entregar, você poderá cancelar a entrega mais ${rest} ${rest === 1 ? 'vez' : 'vezes'}.`
            : 'Seus cancelamentos acabaram: esta entrega será final.';
    }

    if (modalEntrega) modalEntrega.classList.add('active');
    const btnConfirmar = $id('btnConfirmar');
    if (btnConfirmar) btnConfirmar.focus();
}

const fecharModalEntrega = () => modalEntrega && modalEntrega.classList.remove('active');

/** Antes de confirmar, o aluno sempre vê o resultado (executa à força se ainda não viu) */
async function iniciarEntrega() {
    if (A.prazoExcedido()) return aviso('O prazo de entrega acabou');
    const dados   = window._dadosCodigo ? window._dadosCodigo() : {};
    const arquivos = A.linguagem.arquivos;
    if (arquivos.every(a => !dados[a.lang] || !dados[a.lang].trim()))
        return aviso('Escreva algum código antes de entregar');

    if (typeof salvar === 'function') salvar();

    const resultadoAberto  = window._resultadoAberto || false;
    const executadoAtual   = window._executadoAtual || false;

    if (!resultadoAberto || !executadoAtual) {
        aviso('Vamos ver como ficou antes de confirmar a entrega');
        await executar({ focar: true });
        await new Promise(r => setTimeout(r, 900));
    } else if (window.matchMedia('(max-width: 780px)').matches) {
        if (typeof setAba === 'function') setAba('resultado');
    }
    abrirModalEntrega();
}

function confirmarEntrega() {
    if (A.prazoExcedido()) { fecharModalEntrega(); return aviso('O prazo de entrega acabou'); }
    if (typeof salvar === 'function') salvar();
    const dados    = window._dadosCodigo ? window._dadosCodigo() : {};
    const L        = A.linguagem;
    entrega = { data: new Date().toISOString(), atividadeId: A.id, linguagem: L.id, arquivos: { ...dados } };
    try { localStorage.setItem(CHAVE_ENTREGA, JSON.stringify(entrega)); } catch (e) {}
    fecharModalEntrega();
    atualizarEntrega();
    if (typeof sophiaFala === 'function')
        sophiaFala('Atividade entregue! Sua nota será liberada depois do prazo de entrega.', 6000);
    enviarParaAvaliacao();
}

function cancelarEntrega() {
    if (A.prazoExcedido()) return aviso('O prazo acabou: a entrega não pode mais ser cancelada');
    if (cancelamentos >= LIMITE_CANCELAMENTOS) return aviso('Você já usou os 3 cancelamentos. A entrega é final.');
    cancelamentos++;
    try { localStorage.setItem(CHAVE_CANCELAMENTOS_KEY, String(cancelamentos)); } catch (e) {}
    entrega = null;
    avaliacaoSeq++;
    enviando = false;
    try { localStorage.removeItem(CHAVE_ENTREGA); }    catch (e) {}
    try { localStorage.removeItem(CHAVE_AVALIACAO); }  catch (e) {}
    atualizarEntrega();
    aviso(`Entrega cancelada. Cancelamentos restantes: ${LIMITE_CANCELAMENTOS - cancelamentos}/${LIMITE_CANCELAMENTOS}`);
}

/* ─── Avaliação em segundo plano ─────────────────────────────────── */
async function enviarParaAvaliacao() {
    const seq = ++avaliacaoSeq;
    enviando  = true;
    atualizarEntrega();
    try {
        const erros = window._errosConsole ? window._errosConsole() : [];
        const r = await consultarIAcomFallback({ erros_execucao: erros });
        if (seq !== avaliacaoSeq) return;
        try {
            localStorage.setItem(CHAVE_AVALIACAO, JSON.stringify({
                nota:       r.nota,
                status:     r.status,
                feedback:   r.feedback,
                melhorias:  r.melhorias,
                feitos:     r.feitos,
                faltando:   r.faltando,
                compilador: r.compilador,
                saida:      r.saida,
                exemplo:    !!r.exemplo,
                data:       new Date().toISOString()
            }));
        } catch (e) {}
    } catch (erro) {
        console.warn('Não foi possível avaliar a entrega agora:', erro);
    }
    if (seq === avaliacaoSeq) { enviando = false; atualizarEntrega(); }
}

/* ─── Expõe para iniciaratv.js e sophia.js ──────────────────────── */
window._ultimaResposta      = () => _ultimaResposta;
window._setUltimaResposta   = (v) => { _ultimaResposta = v; };
window._enviando            = () => enviando;
window._entrega             = () => entrega;
window.LIMITE_CLICKS        = LIMITE_CLICKS;
window.LIMITE_CANCELAMENTOS = LIMITE_CANCELAMENTOS;
window.FEEDBACK             = FEEDBACK;
window.lerJson              = lerJson;
window.erroDoPHP            = erroDoPHP;
window.avaliarNoServidor    = avaliarNoServidor;
window.abrirModalEntrega    = abrirModalEntrega;
window.fecharModalEntrega   = fecharModalEntrega;
window.iniciarEntrega       = iniciarEntrega;
window.confirmarEntrega     = confirmarEntrega;
window.cancelarEntrega      = cancelarEntrega;
window.enviarParaAvaliacao  = enviarParaAvaliacao;

/* ─── Eventos dos botões de entrega ─────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    const $id = id => document.getElementById(id);

    const btnEntregar     = $id('btnEntregar');
    const btnConfirmar    = $id('btnConfirmar');
    const btnCancelarModal = $id('btnCancelarModal');

    if (btnEntregar)     btnEntregar.addEventListener('click', () => entrega ? cancelarEntrega() : iniciarEntrega());
    if (btnConfirmar)    btnConfirmar.addEventListener('click', confirmarEntrega);
    if (btnCancelarModal) btnCancelarModal.addEventListener('click', fecharModalEntrega);

    if (modalEntrega)
        modalEntrega.addEventListener('click', e => { if (e.target === modalEntrega) fecharModalEntrega(); });

    // Encerramento de prazo: avisa o usuário se estiver avaliando
    let saindo = false;
    const btnVoltar = $id('btnVoltar');
    if (btnVoltar) {
        btnVoltar.addEventListener('click', () => {
            if (enviando && !confirm('A IA ainda está avaliando a sua entrega. Se sair agora, a pontuação pode não ser gerada. Sair mesmo assim?')) return;
            saindo = true;
            location.href = 'aluno' + (A.queryAluno || '');
        });
    }

    window.addEventListener('beforeunload', e => {
        if (enviando && !saindo) { e.preventDefault(); e.returnValue = ''; }
    });

    atualizarEntrega();
    setInterval(atualizarEntrega, 30_000);
});

