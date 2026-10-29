const A = window.FarmAtividade;
const L = A.linguagem;               
const modo = L.modo;                  
const ARQUIVOS = L.arquivos;
const LIMITE_CLICKS = 10;
const LIMITE_CANCELAMENTOS = 3;

const REGRAS = {
    html: [['c', '<!--[\\s\\S]*?-->'], ['t', '<\\/?[a-zA-Z!][\\w-]*|\\/?>'], ['s', '"[^"]*"|\'[^\']*\''], ['a', '[\\w-]+(?==)']],
    css: [['c', '\\/\\*[\\s\\S]*?\\*\\/'], ['s', '"[^"]*"|\'[^\']*\''], ['k', '@[\\w-]+'],
          ['n', '#[0-9a-fA-F]{3,8}\\b|-?\\d*\\.?\\d+(?:px|rem|em|%|vh|vw|s|ms|deg)?'], ['p', '[\\w-]+(?=\\s*:)']],
    js: [['c', '\\/\\/.*|\\/\\*[\\s\\S]*?\\*\\/'],
         ['s', '`(?:[^`\\\\]|\\\\.)*`|"(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\''],
         ['k', '\\b(?:const|let|var|function|return|if|else|for|while|class|new|import|from|export|default|async|await|try|catch|throw|switch|case|break|continue|true|false|null|undefined|this)\\b'],
         ['n', '\\b\\d+(?:\\.\\d+)?\\b'], ['f', '\\b[a-zA-Z_$][\\w$]*(?=\\()']],
    py: [['c', '#.*'], ['s', '"""[\\s\\S]*?"""|"(?:[^"\\\\\\n]|\\\\.)*"|\'(?:[^\'\\\\\\n]|\\\\.)*\''],
         ['k', '\\b(?:def|return|if|elif|else|for|while|in|not|and|or|is|class|import|from|as|try|except|finally|raise|with|pass|break|continue|lambda|True|False|None)\\b'],
         ['n', '\\b\\d+(?:\\.\\d+)?\\b'], ['f', '\\b[a-zA-Z_][\\w]*(?=\\()']],
    php: [['c', '\\/\\/.*|#.*|\\/\\*[\\s\\S]*?\\*\\/'], ['s', '"(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\''],
          ['a', '\\$[a-zA-Z_]\\w*'],
          ['k', '\\b(?:function|return|if|else|elseif|foreach|for|while|echo|print|class|new|true|false|null|fgets|trim)\\b'],
          ['n', '\\b\\d+(?:\\.\\d+)?\\b'], ['f', '\\b[a-zA-Z_]\\w*(?=\\()']]
};

const $ = id => document.getElementById(id);
const ed = $('ed'), hl = $('hl'), gutter = $('gutter'), pv = $('pv'), pvPy = $('pvPy'), con = $('console');
const ide = $('ide');

const CHAVE = `farmedu:codigo:${A.id}:${L.id}`;
const CHAVE_ENTREGA = 'farmedu:entrega';          
const CHAVE_CANCELAMENTOS = `farmedu:cancelamentos:${A.id}`;

let dados;
try { dados = { ...L.inicial, ...JSON.parse(localStorage.getItem(CHAVE)) }; } catch (e) { dados = { ...L.inicial }; }
let entrega = null;
try { entrega = JSON.parse(localStorage.getItem(CHAVE_ENTREGA)); } catch (e) {}
let cancelamentos = 0;
try { cancelamentos = Number(localStorage.getItem(CHAVE_CANCELAMENTOS)) || 0; } catch (e) {}

let atual = ARQUIVOS[0].lang;
let resultadoAberto = false;   
let executadoAtual = false;   
let executando = false;
let enviando = false;
const usos = { executar: 0, sophia: 0 };

const mobile = () => window.matchMedia('(max-width: 780px)').matches;
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const esperar = ms => new Promise(r => setTimeout(r, ms));

/*Informações da atividade na tela (vindas do HTML)*/
$('atvId').textContent = `Atividade #${A.id}`;
$('atvTitulo').textContent = A.titulo;
$('atvLang').textContent = L.nome;
$('atvDescricao').textContent = A.descricao;
$('atvResumo').textContent = `O que fazer (${A.requisitos.length} ${A.requisitos.length === 1 ? 'item' : 'itens'})`;
A.requisitos.forEach(r => {
    const li = document.createElement('li');
    li.textContent = r;
    $('atvRequisitos').appendChild(li);
});

/*Nome oficial da linguagem vindo do Judge0*/
if (modo === 'terminal') {
    fetch(`api/Judge0?isBase64=true&path=${encodeURIComponent(btoa('languages'))}`)
        .then(r => r.json())
        .then(lista => {
            const ling = Array.isArray(lista) && lista.find(x => x.id === L.judge0);
            if (ling) $('atvLang').textContent = ling.name;
        })
        .catch(() => {});
}

/*Editor*/
function colorir(codigo, regras) {
    const re = new RegExp(regras.map(r => '(' + r[1] + ')').join('|'), 'g');
    let saida = '', ultimo = 0, m;
    while ((m = re.exec(codigo))) {
        if (!m[0]) { re.lastIndex++; continue; }
        const i = m.slice(1).findIndex(x => x !== undefined);
        saida += esc(codigo.slice(ultimo, m.index)) + `<span class="${regras[i][0]}">${esc(m[0])}</span>`;
        ultimo = re.lastIndex;
    }
    return saida + esc(codigo.slice(ultimo));
}

function sincronizar() {
    hl.scrollTop = ed.scrollTop;
    hl.scrollLeft = ed.scrollLeft;
    gutter.scrollTop = ed.scrollTop;
}

function atualizarEditor() {
    hl.innerHTML = colorir(ed.value, REGRAS[atual]) + '\n';
    gutter.textContent = Array.from({ length: ed.value.split('\n').length }, (_, i) => i + 1).join('\n');
    sincronizar();
}

function posicao() {
    const antes = ed.value.slice(0, ed.selectionStart).split('\n');
    $('stPos').textContent = `Ln ${antes.length}, Col ${antes[antes.length - 1].length + 1}`;
}

function montarAbas() {
    $('arquivos').innerHTML = '';
    ARQUIVOS.forEach(a => {
        const li = document.createElement('li');
        if (a.lang === atual) li.className = 'on';
        const bolinha = document.createElement('span');
        bolinha.className = 'dot dot-' + a.lang;
        li.append(bolinha, a.nome);
        li.onclick = () => trocar(a.lang);
        $('arquivos').appendChild(li);
    });
    $('stLang').textContent = ARQUIVOS.find(a => a.lang === atual).rotulo;
}

function trocar(lang) {
    atual = lang;
    ed.value = dados[atual];
    montarAbas();
    atualizarEditor();
    posicao();
    if (!mobile()) ed.focus();
}

/*Mensagens*/
function aviso(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(aviso.t);
    aviso.t = setTimeout(() => t.classList.remove('on'), 2800);
}

function sophiaFala(msg, ms = 5000) {
    const b = $('balao');
    b.textContent = msg;
    b.classList.add('on');
    clearTimeout(sophiaFala.t);
    sophiaFala.t = setTimeout(() => b.classList.remove('on'), ms);
}

function escreverConsole(msg, tipo = 'log') {
    const linha = document.createElement('div');
    linha.className = tipo;
    linha.textContent = msg;
    con.appendChild(linha);
    con.scrollTop = con.scrollHeight;
}

/*Executar (só quando o aluno clica) */
function setAba(aba) {
    ide.dataset.aba = aba;
    document.querySelectorAll('.aba').forEach(b => b.classList.toggle('on', b.dataset.aba === aba));
}

function mostrarResultado(focar) {
    if (!resultadoAberto) {
        resultadoAberto = true;
        $('painelResultado').hidden = false;
        ide.classList.add('com-resultado');
        $('abaResultado').disabled = false;
    }
    if (focar && mobile()) setAba('resultado');
}

const b64e = s => btoa(Array.from(new TextEncoder().encode(s), c => String.fromCharCode(c)).join(''));
const b64d = s => s ? new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0))) : '';

/*Envia ao Judge0 (api/Judge0)*/
async function judge0(codigo, idLing, entrada) {
    const caminho = btoa('submissions?base64_encoded=true&wait=true');
    const r = await fetch(`api/Judge0?isBase64=true&path=${encodeURIComponent(caminho)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_code: b64e(codigo), language_id: idLing, stdin: b64e(entrada || '') })
    });
    if (!r.ok) throw new Error('Judge0 respondeu ' + r.status);
    const d = await r.json();
    return {
        status: (d.status && d.status.description) || 'Sem status',
        saida: b64d(d.stdout),
        erro: b64d(d.stderr) || b64d(d.compile_output) || b64d(d.message)
    };
}

const PONTE = '<script>(function(){' +
    'var s=function(t,a){parent.postMessage({farm:1,t:t,m:[].map.call(a,function(x){' +
    'try{return typeof x==="object"?JSON.stringify(x):String(x)}catch(e){return String(x)}}).join(" ")},"*")};' +
    '["log","warn","error"].forEach(function(k){var o=console[k];console[k]=function(){s(k,arguments);o.apply(console,arguments)}});' +
    'window.addEventListener("error",function(e){s("error",[e.message])});' +
    '})()<\/script>';

/* Judge0 não renderiza HTML*/
function rodarWeb() {
    pv.hidden = false;
    pvPy.hidden = true;
    const css = `<style>${dados.css}</style>`;
    const js = PONTE + `<script>${dados.js}<\/script>`;
    let doc = dados.html;
    doc = doc.includes('</head>') ? doc.replace('</head>', () => css + '</head>') : css + doc;
    doc = doc.includes('</body>') ? doc.replace('</body>', () => js + '</body>') : doc + js;
    pv.srcdoc = doc;
    escreverConsole('Página renderizada com o código do momento do clique.', 'info');
}

/*Terminal: manda o arquivo ao Judge0 e mostra a saída*/
async function rodarTerminal() {
    pv.hidden = true;
    pvPy.hidden = false;
    const arq = ARQUIVOS[0];
    pvPy.textContent = `$ ${arq.nome}\nExecutando no Judge0...`;
    escreverConsole('Enviando ao Judge0...', 'info');
    try {
        const r = await judge0(dados[arq.lang], L.judge0, A.entrada);
        pvPy.textContent = `$ ${arq.nome}\n` + (r.saida || r.erro || '(sem saída)');
        escreverConsole(`Judge0: ${r.status}`, r.status === 'Accepted' ? 'info' : 'error');
        if (r.erro) escreverConsole(r.erro, 'error');
    } catch (e) {
        pvPy.textContent = `$ ${arq.nome}\nNão foi possível executar agora.`;
        escreverConsole('Falha ao falar com o Judge0: ' + e.message, 'error');
    }
}

async function executar(opcoes = {}) {
    if (executando) return;
    executando = true;
    atualizarBotoes();
    con.innerHTML = '';
    mostrarResultado(!!opcoes.focar);
    try {
        if (modo === 'web') rodarWeb(); else await rodarTerminal();
        executadoAtual = true;
        $('pvStale').hidden = true;
    } finally {
        executando = false;
        atualizarBotoes();
    }
}

window.addEventListener('message', e => {
    if (e.source !== pv.contentWindow || !e.data || !e.data.farm) return;
    escreverConsole((e.data.t === 'error' ? '✖ ' : '› ') + e.data.m, e.data.t);
});

/*Limites e estado dos botões*/
function atualizarContadores() {
    const exec = Math.max(0, LIMITE_CLICKS - usos.executar);
    const soph = Math.max(0, LIMITE_CLICKS - usos.sophia);
    const canc = Math.max(0, LIMITE_CANCELAMENTOS - cancelamentos);
    $('contadorExecutar').textContent = `${exec}/${LIMITE_CLICKS}`;
    $('contadorSophia').textContent = `${soph}/${LIMITE_CLICKS}`;
    $('contadorCancelar').textContent = `${canc}/${LIMITE_CANCELAMENTOS}`;
    $('contadorLimite').classList.toggle('is-limitado', exec === 0 || soph === 0 || canc === 0);
}

function atualizarBotoes() {
    $('btnRodar').disabled = executando || usos.executar >= LIMITE_CLICKS;
    $('btnRodar').textContent = executando ? 'Executando...' : '▶ Executar';
    $('btnSophia').disabled = usos.sophia >= LIMITE_CLICKS;
    atualizarEntrega();
}

/*Entrega*/
const modalEntrega = $('modalEntrega');
const formatarData = iso => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

function atualizarEntrega() {
    const entregue = !!entrega;
    const bloqueado = entregue && cancelamentos >= LIMITE_CANCELAMENTOS;
    ed.readOnly = entregue;
    $('chipEntrega').hidden = !entregue;
    if (entregue) $('chipEntrega').textContent = '✔ Entregue em ' + formatarData(entrega.data);
    const btn = $('btnEntregar');
    btn.disabled = executando || enviando || bloqueado;
    btn.textContent = enviando ? 'Avaliando...' : bloqueado ? 'Entrega final' : entregue ? 'Cancelar entrega' : 'Entregar atividade';
    btn.className = entregue ? 'btn btn-cinza' : 'btn btn-verde';
    atualizarContadores();
}

function abrirModalEntrega() {
    $('resumoEntrega').innerHTML = '';
    ARQUIVOS.forEach(a => {
        const linhas = dados[a.lang].trim() ? dados[a.lang].split('\n').length : 0;
        const li = document.createElement('li');
        const bolinha = document.createElement('span');
        bolinha.className = 'dot dot-' + a.lang;
        li.append(bolinha, `${a.nome} — ${linhas} ${linhas === 1 ? 'linha' : 'linhas'}`);
        $('resumoEntrega').appendChild(li);
    });
    const rest = LIMITE_CANCELAMENTOS - cancelamentos;
    $('avisoCancelar').textContent = rest > 0
        ? `Depois de entregar, você poderá cancelar a entrega mais ${rest} ${rest === 1 ? 'vez' : 'vezes'}.`
        : 'Seus cancelamentos acabaram: esta entrega será final.';
    modalEntrega.classList.add('active');
    $('btnConfirmar').focus();
}

const fecharModalEntrega = () => modalEntrega.classList.remove('active');

/*Antes de confirmar, o aluno sempre vê como ficou (executa à força se ainda não viu)*/
async function iniciarEntrega() {
    if (ARQUIVOS.every(a => !dados[a.lang].trim())) return aviso('Escreva algum código antes de entregar');
    salvar();
    if (!resultadoAberto || !executadoAtual) {
        aviso('Vamos ver como ficou antes de confirmar a entrega');
        await executar({ focar: true });
        await esperar(900);
    } else if (mobile()) {
        setAba('resultado');
    }
    abrirModalEntrega();
}

function confirmarEntrega() {
    salvar();
    entrega = { data: new Date().toISOString(), atividadeId: A.id, linguagem: L.id, arquivos: { ...dados } };
    try { localStorage.setItem(CHAVE_ENTREGA, JSON.stringify(entrega)); } catch (e) {}
    fecharModalEntrega();
    atualizarEntrega();
    sophiaFala('Atividade entregue! Já estou avaliando seu código...', 6000);
    enviarParaAvaliacao();
}

function cancelarEntrega() {
    if (cancelamentos >= LIMITE_CANCELAMENTOS) return aviso('Você já usou os 3 cancelamentos. A entrega é final.');
    cancelamentos++;
    try { localStorage.setItem(CHAVE_CANCELAMENTOS, String(cancelamentos)); } catch (e) {}
    entrega = null;
    try { localStorage.removeItem(CHAVE_ENTREGA); } catch (e) {}
    atualizarEntrega();
    aviso(`Entrega cancelada. Cancelamentos restantes: ${LIMITE_CANCELAMENTOS - cancelamentos}/${LIMITE_CANCELAMENTOS}`);
}

/*FEEDBACK — PONTO DE INTEGRAÇÃO COM O GRUPO feedback_ia*/
const FEEDBACK = {
    endpoint: 'api/sendAvaliacao',
    usarExemploSeFalhar: true,

    montarPayload(ctx) {
        return {
            linguagem: ctx.linguagem,
            codigo_aluno: ctx.codigo,
            id_linguagem: ctx.idLinguagem,
            objetivo_atividade: A.objetivo,
            nota_max: String(A.notaMax),
            nota_min: String(A.notaMin),
            dados_entrada: A.entrada,
            atividadeId: A.id
        };
    },

    interpretar(data) {
        const av = data.avaliacao || {};
        const st = data.compilacao && data.compilacao.status;
        return {
            nota: av.nota_atribuida,
            status: av.status_avaliacao,
            feedback: av.feedback_geral,
            melhorias: av.pontos_melhoria || [],
            compilador: st && (st.description || st),
            saida: data.compilacao && data.compilacao.saida_terminal
        };
    },

    /*Resposta de exemplo*/
    exemplo: {
        sucesso: true,
        compilacao: { status: 'Código Aceito!', saida_terminal: 'Cocoricó!\n' },
        avaliacao: {
            nota_atribuida: 8,
            status_avaliacao: 'aprovado',
            feedback_geral: 'Muito bem! Sua página cumpre o objetivo da atividade.',
            pontos_melhoria: ['Adicione comentários explicando cada parte.', 'Use um nome mais descritivo no botão.']
        }
    }
};

function contextoEntrega() {
    const web = modo === 'web';
    return {
        linguagem: web ? 'HTML/CSS/JS' : L.rotulo,
        idLinguagem: L.judge0,
        codigo: web ? ARQUIVOS.map(a => `/* ${a.nome} */\n${dados[a.lang]}`).join('\n\n') : dados[ARQUIVOS[0].lang]
    };
}

function mostrarFeedback(f) {
    const tag = f.exemplo ? ' (exemplo)' : '';
    escreverConsole(`Sophia${tag}: nota ${f.nota} / ${A.notaMax}`, 'sophia-msg');
    if (f.status) escreverConsole(`Status: ${f.status}`, 'info');
    if (f.compilador) escreverConsole(`Judge0: ${f.compilador}`, 'info');
    if (f.saida) escreverConsole(`Saída: ${String(f.saida).trim()}`, 'info');
    if (f.feedback) escreverConsole(`Sophia: ${f.feedback}`, 'sophia-msg');
    if (f.melhorias.length) f.melhorias.forEach(p => escreverConsole('• ' + p));
    else escreverConsole('Parabéns! Nenhuma correção necessária.', 'sophia-msg');
    sophiaFala(`Nota atribuída: ${f.nota} / ${A.notaMax}`, 10000);
}

async function enviarParaAvaliacao() {
    enviando = true;
    atualizarEntrega();
    mostrarResultado(false);
    escreverConsole('Sophia está avaliando seu código...', 'info');
    let resultado = null;
    try {
        const r = await fetch(FEEDBACK.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(FEEDBACK.montarPayload(contextoEntrega()))
        });
        const texto = await r.text();
        let data;
        try {
            data = JSON.parse(texto);
        } catch (e) {
            console.error('O servidor não devolveu JSON. Resposta:', texto);
            throw new Error('Resposta do servidor não é JSON');
        }
        console.log('Resposta do feedback:', data);
        if (!data.sucesso) throw new Error(data.erro || 'Erro desconhecido');
        resultado = FEEDBACK.interpretar(data);
    } catch (erro) {
        console.warn('Feedback indisponível:', erro);
        if (FEEDBACK.usarExemploSeFalhar) {
            resultado = { ...FEEDBACK.interpretar(FEEDBACK.exemplo), exemplo: true };
        } else {
            escreverConsole('Não foi possível obter o feedback: ' + erro.message, 'error');
            sophiaFala('Não consegui avaliar agora. Tente novamente mais tarde.', 6000);
        }
    }
    enviando = false;
    atualizarEntrega();
    if (resultado) mostrarFeedback(resultado);
}
/* ---------- 7. Eventos ---------- */
function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(dados)); } catch (e) {}
}

ed.addEventListener('input', () => {
    dados[atual] = ed.value;
    executadoAtual = false;
    if (resultadoAberto) $('pvStale').hidden = false;   // só avisa; não atualiza sozinho
    atualizarEditor();
    posicao();
    salvar();
});
ed.addEventListener('scroll', sincronizar);
ed.addEventListener('click', posicao);
ed.addEventListener('keyup', posicao);

ed.addEventListener('keydown', e => {
    if (e.key === 'Tab' && !ed.readOnly) {
        e.preventDefault();
        ed.setRangeText(modo === 'terminal' && L.id === 71 ? '    ' : '  ', ed.selectionStart, ed.selectionEnd, 'end');
        ed.dispatchEvent(new Event('input'));
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        salvar();
        aviso('Código salvo');
    }
});

document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharModalEntrega(); });
document.querySelectorAll('.aba').forEach(b => b.addEventListener('click', () => setAba(b.dataset.aba)));
$('btnLimpar').onclick = () => { con.innerHTML = ''; };

$('btnRodar').onclick = () => {
    if ($('btnRodar').disabled) return;
    usos.executar++;
    atualizarContadores();
    executar({ focar: true });
};
$('btnSophia').onclick = () => {
    if ($('btnSophia').disabled) return;
    usos.sophia++;
    sophiaFala(`Oi, eu sou a Sophia! Objetivo: ${A.objetivo}`, 6000);
    atualizarBotoes();
};
$('btnVoltar').onclick = () => {
    if (document.referrer) location.href = document.referrer;
    else if (history.length > 1) history.back();
    else location.href = 'aluno';
};
$('btnEntregar').onclick = () => (entrega ? cancelarEntrega() : iniciarEntrega());
$('btnConfirmar').onclick = confirmarEntrega;
$('btnCancelarModal').onclick = fecharModalEntrega;
modalEntrega.addEventListener('click', e => { if (e.target === modalEntrega) fecharModalEntrega(); });

document.querySelectorAll('.logo img, .sophia-avatar img').forEach(img => {
    const semImagem = () => img.parentElement.classList.add('sem-img');
    img.addEventListener('error', semImagem);
    if (img.complete && !img.naturalWidth) semImagem();
});

atualizarBotoes();
trocar(atual);
setTimeout(() => sophiaFala(`Oi, eu sou a Sophia! Objetivo: ${A.objetivo}`, 4500), 600);