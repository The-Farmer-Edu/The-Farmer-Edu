/**
 * iniciaratv.js — IDE: editor de código, execução e navegação
 *
 * Este arquivo é o coração do ambiente de desenvolvimento do aluno. Ele monta o
 * editor visual, aplica destaque de sintaxe, salva o código em localStorage,
 * executa o programa em ambiente web ou em terminal e controla as abas de
 * arquivos e o console de saída.
 *
 * O algoritmo principal funciona assim:
 *   1. lê a atividade e a linguagem ativa;
 *   2. inicializa os arquivos do projeto;
 *   3. aplica o código atual no textarea e no highlight;
 *   4. executa o programa quando o usuário clica em "Executar";
 *   5. mostra resultado em iframe ou terminal;
 *   6. preserva o código entre recarregamentos via localStorage.
 *
 * Depende de: atividade.js  → window.FarmAtividade, window.FarmLinguagens
 *             submissao.js  → avaliarNoServidor, FEEDBACK, lerJson, erroDoPHP,
 *                             atualizarEntrega, LIMITE_CLICKS
 *             sophia.js     → sophiaFala (opcional)
 */

'use strict';

/* ─── Referências globais ─────────────────────────────────────────── */
const A    = window.FarmAtividade;
const L    = A.linguagem;
const modo = L.modo;
const ARQUIVOS = L.arquivos;

const $id = id => document.getElementById(id);

const ed           = $id('ed');
const hl           = $id('hl');
const gutter       = $id('gutter');
const pv           = $id('pv');
const pvPy         = $id('pvPy');
const con          = $id('console');
const ide          = $id('ide');
const btnInicio    = $id('btnInicio');
const btnFecharEditor = $id('fecharEditor');

/* ─── Chaves de armazenamento ────────────────────────────────────── */
const CHAVE = `farmedu:codigo:${A.chave}:${L.id}`;

/* ─── Estado do editor ───────────────────────────────────────────── */
// O código do aluno é salvo em localStorage usando uma chave específica para
// cada atividade e linguagem. Isso permite restaurar o progresso mesmo quando
// a página for recarregada ou o usuário voltar para a tela inicial.
let dados = {};
try { dados = { ...L.inicial, ...JSON.parse(localStorage.getItem(CHAVE)) }; }
catch (e) { dados = { ...L.inicial }; }
if (A.vazia) ARQUIVOS.forEach(a => { dados[a.lang] = ''; });

let atual          = ARQUIVOS[0].lang;
let resultadoAberto = false;
let executadoAtual  = false;
let executando      = false;
let errosConsole    = [];

// Expõe estado para sophia.js e submissao.js
window._errosConsole  = () => executadoAtual ? errosConsole : [];
window._dadosCodigo   = () => dados;
window._executadoAtual = false;
window._executando    = false;
window._resultadoAberto = false;

// Contadores de uso (compartilhados com submissao.js)
window._usos = { executar: 0, sophia: 0 };

/* ─── Regras de syntax highlight ─────────────────────────────────── */
const REGRAS = {
    html: [
        ['c', '<!--[\\s\\S]*?-->'],
        ['t', '<\\/?[a-zA-Z!][\\w-]*|\\/?>'],
        ['s', '"[^"]*"|\'[^\']*\''],
        ['a', '[\\w-]+(?==)']
    ],
    css: [
        ['c', '\\/\\*[\\s\\S]*?\\*\\/'],
        ['s', '"[^"]*"|\'[^\']*\''],
        ['k', '@[\\w-]+'],
        ['n', '#[0-9a-fA-F]{3,8}\\b|-?\\d*\\.?\\d+(?:px|rem|em|%|vh|vw|s|ms|deg)?'],
        ['p', '[\\w-]+(?=\\s*:)']
    ],
    js: [
        ['c', '\\/\\/.*|\\/\\*[\\s\\S]*?\\*\\/'],
        ['s', '`(?:[^`\\\\]|\\\\.)*`|"(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\''],
        ['k', '\\b(?:const|let|var|function|return|if|else|for|while|class|new|import|from|export|default|async|await|try|catch|throw|switch|case|break|continue|true|false|null|undefined|this)\\b'],
        ['n', '\\b\\d+(?:\\.\\d+)?\\b'],
        ['f', '\\b[a-zA-Z_$][\\w$]*(?=\\()']
    ],
    py: [
        ['c', '#.*'],
        ['s', '"""[\\s\\S]*?"""|"(?:[^"\\\\\\n]|\\\\.)*"|\'(?:[^\'\\\\\\n]|\\\\.)*\''],
        ['k', '\\b(?:def|return|if|elif|else|for|while|in|not|and|or|is|class|import|from|as|try|except|finally|raise|with|pass|break|continue|lambda|True|False|None)\\b'],
        ['n', '\\b\\d+(?:\\.\\d+)?\\b'],
        ['f', '\\b[a-zA-Z_][\\w]*(?=\\()']
    ],
    php: [
        ['c', '\\/\\/.*|#.*|\\/\\*[\\s\\S]*?\\*\\/'],
        ['s', '"(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\''],
        ['a', '\\$[a-zA-Z_]\\w*'],
        ['k', '\\b(?:function|return|if|else|elseif|foreach|for|while|echo|print|class|new|true|false|null|fgets|trim)\\b'],
        ['n', '\\b\\d+(?:\\.\\d+)?\\b'],
        ['f', '\\b[a-zA-Z_]\\w*(?=\\()']
    ]
};

/* ─── Utilitários ─────────────────────────────────────────────────── */
const esc    = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const esperar = ms => new Promise(r => setTimeout(r, ms));
const mobile  = () => window.matchMedia('(max-width: 780px)').matches;

/** Assinatura do código + erros para detectar mudanças (usado por sophia.js) */
function assinaturaDoCodigo() {
    return contextoEntrega().codigo + '\u0000' + JSON.stringify(window._errosConsole());
}
window.assinaturaDoCodigo = assinaturaDoCodigo;

/* ─── Editor: syntax highlight ───────────────────────────────────── */
function colorir(codigo, regras) {
    // O destaque de sintaxe funciona com uma expressão regular que separa
    // padrões como comentários, strings, palavras-chave, números e identificadores.
    // Cada trecho reconhecido recebe uma classe CSS para colorir a tela.
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
    hl.scrollTop  = ed.scrollTop;
    hl.scrollLeft = ed.scrollLeft;
    gutter.scrollTop = ed.scrollTop;
    atualizarBtnInicio();
}

function atualizarEditor() {
    hl.innerHTML = colorir(ed.value, REGRAS[atual]) + '\n';
    gutter.textContent = Array.from({ length: ed.value.split('\n').length }, (_, i) => i + 1).join('\n');
    sincronizar();
}

function posicao() {
    const antes = ed.value.slice(0, ed.selectionStart).split('\n');
    $id('stPos').textContent = `Ln ${antes.length}, Col ${antes[antes.length - 1].length + 1}`;
}

/* ─── Abas de arquivos ───────────────────────────────────────────── */
function montarAbas() {
    $id('arquivos').innerHTML = '';
    ARQUIVOS.forEach(a => {
        const li = document.createElement('li');
        if (a.lang === atual) li.className = 'on';
        const bolinha = document.createElement('span');
        bolinha.className = 'dot dot-' + a.lang;
        li.append(bolinha, a.nome);
        li.onclick = () => trocar(a.lang);
        $id('arquivos').appendChild(li);
    });
    $id('stLang').textContent = ARQUIVOS.find(a => a.lang === atual).rotulo;
}

function trocar(lang) {
    atual = lang;
    ed.value = dados[atual];
    montarAbas();
    atualizarEditor();
    posicao();
    if (!mobile()) ed.focus();
}

/* ─── Toast (aviso rápido) ───────────────────────────────────────── */
function aviso(msg) {
    const t = $id('toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(aviso._t);
    aviso._t = setTimeout(() => t.classList.remove('on'), 3000);
}
window.aviso = aviso;

/* ─── Console de saída ───────────────────────────────────────────── */
function escreverConsole(msg, tipo = 'log') {
    const linha = document.createElement('div');
    linha.className = tipo;
    linha.textContent = msg;
    con.appendChild(linha);
    con.scrollTop = con.scrollHeight;
}
window.escreverConsole = escreverConsole;

/* ─── Painel de resultado ─────────────────────────────────────────── */
function setAba(aba) {
    ide.dataset.aba = aba;
    document.querySelectorAll('.aba').forEach(b => b.classList.toggle('on', b.dataset.aba === aba));
}
window.setAba = setAba;

function mostrarResultado(focar) {
    if (!resultadoAberto) {
        resultadoAberto = true;
        window._resultadoAberto = true;
        $id('painelResultado').hidden = false;
        ide.classList.add('com-resultado');
        $id('abaResultado').disabled = false;
    }
    if (focar && mobile()) setAba('resultado');
}
window.mostrarResultado = mostrarResultado;

/* ─── Contexto de entrega ─────────────────────────────────────────── */
function contextoEntrega() {
    const web = modo === 'web';
    return {
        linguagem:   web ? 'HTML/CSS/JS' : L.rotulo,
        idLinguagem: L.judge0,
        codigo: web
            ? ARQUIVOS.map(a => `/* ${a.nome} */\n${dados[a.lang]}`).join('\n\n')
            : dados[ARQUIVOS[0].lang]
    };
}
window.contextoEntrega = contextoEntrega;

/* ─── Atualizar botões ────────────────────────────────────────────── */
function atualizarBotoes() {
    const usos = window._usos;
    $id('btnRodar').disabled  = A.vazia || executando || usos.executar >= LIMITE_CLICKS;
    $id('btnRodar').textContent = executando ? 'Executando...' : '▶ Executar';
    $id('btnSophia').disabled = A.vazia || usos.sophia >= LIMITE_CLICKS;
    if (typeof atualizarEntrega === 'function') atualizarEntrega();
}
window.atualizarBotoes = atualizarBotoes;

/* ─── Ponte para o console do iframe (modo web) ──────────────────── */
const PONTE = '<script>(function(){' +
    'var s=function(t,a){parent.postMessage({farm:1,t:t,m:[].map.call(a,function(x){' +
    'try{return typeof x==="object"?JSON.stringify(x):String(x)}catch(e){return String(x)}}).join(" ")' +
    '},"*")};' +
    '["log","warn","error"].forEach(function(k){var o=console[k];console[k]=function(){s(k,arguments);o.apply(console,arguments)}});' +
    'window.addEventListener("error",function(e){s("error",[e.message])});' +
    '})()\<\/script>';

/* ─── Execução web (iframe) ───────────────────────────────────────── */
function rodarWeb() {
    // Modo web: o navegador renderiza o HTML/JS/CSS em um iframe isolado.
    // O código da página é montado em um documento completo, com a tag <style>
    // injetada no <head> e o script de console no final do body.
    pv.hidden  = false;
    pvPy.hidden = true;
    const css = `<style>${dados.css}</style>`;
    const js  = PONTE + `<script>${dados.js}<\/script>`;
    let doc = dados.html;
    doc = doc.includes('</head>') ? doc.replace('</head>', () => css + '</head>') : css + doc;
    doc = doc.includes('</body>') ? doc.replace('</body>', () => js  + '</body>') : doc + js;
    pv.srcdoc = doc;
    escreverConsole('Página renderizada com o código do momento do clique.', 'info');
}

/* ─── Execução terminal (Judge0 via servidor) ────────────────────── */
async function rodarTerminal() {
    pv.hidden  = true;
    pvPy.hidden = false;
    const arq = ARQUIVOS[0];
    pvPy.textContent = `$ ${arq.nome}\nExecutando...`;
    escreverConsole('Enviando o código para executar no Judge0...', 'info');
    const codigoEnviado = contextoEntrega().codigo;
    try {
        const data = await avaliarNoServidor();
        const f    = FEEDBACK.interpretar(data);
        window._setUltimaResposta && window._setUltimaResposta({ codigo: codigoEnviado, f });
        const saida  = String(f.saida || '').trim();
        const aceito = !f.compilador || /accepted|aceito/i.test(f.compilador);
        pvPy.textContent = `$ ${arq.nome}\n` + (saida || '(sem saída)');
        escreverConsole(`Judge0: ${f.compilador || 'sem status'}`, aceito ? 'info' : 'error');
        if (saida) escreverConsole('Saída: ' + saida, aceito ? 'log' : 'error');
        if (!aceito) {
            errosConsole.push((saida || String(f.compilador)).slice(0, 300));
        } else if (typeof A.saidaEsperada === 'string') {
            const esperado = A.saidaEsperada.trim();
            const ok = saida === esperado;
            escreverConsole(ok
                ? '✔ Saída confere com o esperado'
                : '✖ Saída diferente. Esperado: ' + esperado,
                ok ? 'info' : 'error');
            if (!ok) errosConsole.push(`A saída foi "${saida}", mas o esperado é "${esperado}".`);
        }
    } catch (e) {
        pvPy.textContent = `$ ${arq.nome}\nNão foi possível executar agora.`;
        escreverConsole('Falha ao falar com o servidor: ' + e.message, 'error');
    }
}

/* ─── Executar (botão ▶) ─────────────────────────────────────────── */
async function executar(opcoes = {}) {
    if (executando) return;
    executando = true;
    window._executando = true;
    atualizarBotoes();
    con.innerHTML = '';
    errosConsole  = [];
    mostrarResultado(!!opcoes.focar);
    try {
        if (modo === 'web') rodarWeb(); else await rodarTerminal();
        executadoAtual = true;
        window._executadoAtual = true;
        $id('pvStale').hidden = true;
    } finally {
        executando = false;
        window._executando = false;
        atualizarBotoes();
    }
}
window.executar = executar;

/* ─── Salvar ─────────────────────────────────────────────────────── */
function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(dados)); } catch (e) {}
}
window.salvar = salvar;

/* ─── Inicializar informações da atividade na tela ───────────────── */
(function inicializarAtividade() {
    if (A.vazia) {
        $id('atvTitulo').textContent   = 'Nenhuma atividade carregada';
        $id('atvDescricao').textContent = 'Volte à página do aluno e clique em "Começar" na atividade.';
        $id('atvId').hidden  = true;
        $id('atvLang').hidden = true;
        const detalhes = document.querySelector('.atv-detalhes');
        if (detalhes) detalhes.hidden = true;
    } else {
        $id('atvId').textContent      = `Atividade #${A.id}`;
        $id('atvTitulo').textContent   = A.titulo;
        $id('atvLang').textContent     = L.nome;
        $id('atvDescricao').textContent = A.descricao;
        $id('atvResumo').textContent   = `O que fazer (${A.requisitos.length} ${A.requisitos.length === 1 ? 'item' : 'itens'})`;
        A.requisitos.forEach(r => {
            const li = document.createElement('li');
            li.textContent = r;
            $id('atvRequisitos').appendChild(li);
        });
    }
})();

/* ─── Eventos do editor ───────────────────────────────────────────── */
ed.addEventListener('input', () => {
    dados[atual] = ed.value;
    executadoAtual = false;
    window._executadoAtual = false;
    if (resultadoAberto) $id('pvStale').hidden = false;
    atualizarEditor();
    posicao();
    salvar();
});
ed.addEventListener('scroll', sincronizar);
ed.addEventListener('click',  posicao);
ed.addEventListener('keyup',  posicao);

ed.addEventListener('keydown', e => {
    if (e.key === 'Tab' && !ed.readOnly) {
        e.preventDefault();
        // Python: indentação de 4 espaços; demais: 2
        ed.setRangeText(
            modo === 'terminal' && L.id === 71 ? '    ' : '  ',
            ed.selectionStart, ed.selectionEnd, 'end'
        );
        ed.dispatchEvent(new Event('input'));
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (ed.readOnly) return;
        salvar();
        aviso('Código salvo');
    }
});

document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (typeof fecharModalEntrega === 'function') fecharModalEntrega();
    if (document.body.classList.contains('editor-expandido')) recolherEditor();
});

// Mensagens do iframe (console do modo web)
window.addEventListener('message', e => {
    if (e.source !== pv.contentWindow || !e.data || !e.data.farm) return;
    if (e.data.t === 'error') errosConsole.push(e.data.m);
    escreverConsole((e.data.t === 'error' ? '✖ ' : '› ') + e.data.m, e.data.t);
});

// Abas mobile
document.querySelectorAll('.aba').forEach(b => b.addEventListener('click', () => setAba(b.dataset.aba)));
$id('btnLimpar').onclick = () => { con.innerHTML = ''; };

// Botão Executar
$id('btnRodar').addEventListener('click', () => {
    if ($id('btnRodar').disabled) return;
    window._usos.executar++;
    atualizarContadores();  // de submissao.js
    executar({ focar: true });
});

// Resposta ao console da Sophia
$id('conForm').addEventListener('submit', e => {
    e.preventDefault();
    const texto = $id('conInput').value.trim();
    $id('conInput').value = '';
    if (texto && typeof responderSophia === 'function') responderSophia(texto);
});

// Fallback de imagens sem carregamento
document.querySelectorAll('.logo img, .sophia-avatar img').forEach(img => {
    const semImagem = () => img.parentElement.classList.add('sem-img');
    img.addEventListener('error', semImagem);
    if (img.complete && !img.naturalWidth) semImagem();
});

/* ─── Mobile: editor expandido ───────────────────────────────────── */
function atualizarBtnInicio() {
    if (!btnInicio) return;
    btnInicio.hidden = !(document.body.classList.contains('editor-expandido') && ed.scrollLeft > 24);
}

function expandirEditor() {
    if (!mobile() || ed.readOnly) return;
    document.body.classList.add('editor-expandido');
    atualizarBtnInicio();
}

function recolherEditor() {
    document.body.classList.remove('editor-expandido');
    ed.blur();
    atualizarBtnInicio();
}

ed.addEventListener('focus', expandirEditor);
if (btnFecharEditor) btnFecharEditor.addEventListener('click', recolherEditor);
if (btnInicio) btnInicio.addEventListener('click', () => ed.scrollTo({ left: 0, behavior: 'smooth' }));
window.addEventListener('resize', () => { if (!mobile()) recolherEditor(); });

/* ─── Inicialização ───────────────────────────────────────────────── */
atualizarBotoes();
trocar(atual);
if (!A.vazia)
    setTimeout(() => {
        if (typeof sophiaFala === 'function')
            sophiaFala('Oi, sou a Sophia! Estou aqui para ajudar a ver se o seu código está dentro do que a atividade pede. Se precisar, é só clicar em mim.', 6000);
    }, 600);
