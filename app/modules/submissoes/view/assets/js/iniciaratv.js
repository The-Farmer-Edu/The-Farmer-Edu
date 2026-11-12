// IDE: editor, destaque de sintaxe, abas de arquivos, execução e modo celular.
// Este arquivo é o núcleo funcional da experiência de desenvolvimento dentro da atividade.
const atividadeAtual = window.FarmAtividade;
const linguagemAtual = atividadeAtual.linguagem;
const modoExecucao = linguagemAtual.modo;
const ARQUIVOS = linguagemAtual.arquivos;
const LIMITE_EXECUCOES = 10;
const LIMITE_CANCELAMENTOS = 3;
const ID_LINGUAGEM_PYTHON = 71;
const CONSULTA_CELULAR = '(max-width: 780px)';

/**
 * Regras de destaque por linguagem.
 *
 * Cada valor é um array de pares [classeCss, expressãoRegex].
 * O algoritmo percorre o texto e aplica classes de cor conforme o tipo do token identificado.
 * Isso permite que o editor tenha uma experiência de syntax highlighting sem bibliotecas externas.
 */
const REGRAS_DESTAQUE = {
    html: [['c', '<!--[\\s\\S]*?-->'], ['t', '<\\/?[a-zA-Z!][\\w-]*|\\/?>'], ['s', '"[^"]*"|\'[^\']*\''], ['a', '[\\w-]+(?==)']],
    css: [['c', '\\/\\*[\\s\\S]*?\\*\/'], ['s', '"[^"]*"|\'[^\']*\''], ['k', '@[\\w-]+'],
          ['n', '#[0-9a-fA-F]{3,8}\\b|-?\\d*\\.?\\d+(?:px|rem|em|%|vh|vw|s|ms|deg)?'], ['p', '[\\w-]+(?=\\s*:)']],
    js: [['c', '\\/\\/.*|\\/\\*[\\s\\S]*?\\*\/'],
         ['s', '`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|\'(?:[^\'\\]|\\.)*\''],
         ['k', '\\b(?:const|let|var|function|return|if|else|for|while|class|new|import|from|export|default|async|await|try|catch|throw|switch|case|break|continue|true|false|null|undefined|this)\\b'],
         ['n', '\\b\\d+(?:\\.\\d+)?\\b'], ['f', '\\b[a-zA-Z_$][\\w$]*(?=\\()']],
    py: [['c', '#.*'], ['s', '"""[\\s\\S]*?"""|"(?:[^"\\\\\\n]|\\\\.)*"|\'(?:[^\'\\\\\\n]|\\\\.)*\''],
         ['k', '\\b(?:def|return|if|elif|else|for|while|in|not|and|or|is|class|import|from|as|try|except|finally|raise|with|pass|break|continue|lambda|True|False|None)\\b'],
         ['n', '\\b\\d+(?:\\.\\d+)?\\b'], ['f', '\\b[a-zA-Z_][\\w]*(?=\\()']],
    php: [['c', '\\/\\/.*|#.*|\\/\\*[\\s\\S]*?\\*\/'], ['s', '"(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\''],
          ['a', '\\$[a-zA-Z_]\\w*'],
          ['k', '\\b(?:function|return|if|else|elseif|foreach|for|while|echo|print|class|new|true|false|null|fgets|trim)\\b'],
          ['n', '\\b\\d+(?:\\.\\d+)?\\b'], ['f', '\\b[a-zA-Z_]\\w*(?=\\()']]
};

/* Elementos da página */
const porId = id => document.getElementById(id);
const editorTexto = porId('ed');
const camadaDestaque = porId('hl');
const numeracaoLinhas = porId('gutter');
const quadroPreview = porId('pv');
const saidaTerminal = porId('pvPy');
const consoleCorpo = porId('console');
const areaIde = porId('ide');
const botaoInicio = porId('btnInicio');
const botaoFecharEditor = porId('fecharEditor');

/* Chaves do localStorage (por atividade, para não misturar atividades) */
const CHAVE_CODIGO = `farmedu:codigo:${atividadeAtual.chave}:${linguagemAtual.id}`;
const CHAVE_ENTREGA = `farmedu:entrega:${atividadeAtual.chave}`;
const CHAVE_CANCELAMENTOS = `farmedu:cancelamentos:${atividadeAtual.chave}`;

/*
 * Estado da página.
 *
 * O sistema guarda código, entrega e cancelamentos por atividade em localStorage para não misturar
 * uma atividade da outra enquanto o aluno navega entre telas.
 */
let dadosDosArquivos;
try {
    dadosDosArquivos = { ...linguagemAtual.inicial, ...JSON.parse(localStorage.getItem(CHAVE_CODIGO)) };
} catch (erro) {
    dadosDosArquivos = { ...linguagemAtual.inicial };
}
if (atividadeAtual.vazia) ARQUIVOS.forEach(arquivo => { dadosDosArquivos[arquivo.lang] = ''; });

let entrega = null;
try { entrega = JSON.parse(localStorage.getItem(CHAVE_ENTREGA)); } catch (erro) {}
let cancelamentos = 0;
try { cancelamentos = Number(localStorage.getItem(CHAVE_CANCELAMENTOS)) || 0; } catch (erro) {}

let arquivoAtual = ARQUIVOS[0].lang;
let resultadoAberto = false;
let executadoAtual = false;
let executando = false;
let usosExecutar = 0;

/* Utilitários */
const ehCelular = () => window.matchMedia(CONSULTA_CELULAR).matches;
const escaparHtml = texto => texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const esperar = ms => new Promise(resolver => setTimeout(resolver, ms));

function aviso(mensagem) {
    const aviso_ = porId('toast');
    aviso_.textContent = mensagem;
    aviso_.classList.add('on');
    clearTimeout(aviso.temporizador);
    aviso.temporizador = setTimeout(() => aviso_.classList.remove('on'), 3000);
}

function salvar() {
    try { localStorage.setItem(CHAVE_CODIGO, JSON.stringify(dadosDosArquivos)); } catch (erro) {}
}

/* Informações da atividade na tela (vindas do atividade.js) */
if (atividadeAtual.vazia) {
    porId('atvTitulo').textContent = 'Nenhuma atividade carregada';
    porId('atvDescricao').textContent = 'Volte à página do aluno e clique em "Começar" na atividade.';
    porId('atvId').hidden = true;
    porId('atvLang').hidden = true;
    const detalhes = document.querySelector('.atv-detalhes');
    if (detalhes) detalhes.hidden = true;
} else {
    const totalRequisitos = atividadeAtual.requisitos.length;
    porId('atvId').textContent = `Atividade #${atividadeAtual.id}`;
    porId('atvTitulo').textContent = atividadeAtual.titulo;
    porId('atvLang').textContent = linguagemAtual.nome;
    porId('atvDescricao').textContent = atividadeAtual.descricao;
    porId('atvResumo').textContent = `O que fazer (${totalRequisitos} ${totalRequisitos === 1 ? 'item' : 'itens'})`;
    atividadeAtual.requisitos.forEach(requisito => {
        const item = document.createElement('li');
        item.textContent = requisito;
        porId('atvRequisitos').appendChild(item);
    });
}

/*
 * Editor e destaque de sintaxe.
 *
 * A função `colorir` percorre o código com regex e cria spans para cada token detectado.
 * Isso torna possível preservar a sintaxe original e apenas “decorar” o texto em tela.
 */
function colorir(codigo, regras) {
    const expressao = new RegExp(regras.map(regra => '(' + regra[1] + ')').join('|'), 'g');
    let saida = '', ultimoIndice = 0, correspondencia;
    while ((correspondencia = expressao.exec(codigo))) {
        if (!correspondencia[0]) { expressao.lastIndex++; continue; }
        const indiceRegra = correspondencia.slice(1).findIndex(grupo => grupo !== undefined);
        saida += escaparHtml(codigo.slice(ultimoIndice, correspondencia.index))
            + `<span class="${regras[indiceRegra][0]}">${escaparHtml(correspondencia[0])}</span>`;
        ultimoIndice = expressao.lastIndex;
    }
    return saida + escaparHtml(codigo.slice(ultimoIndice));
}

function sincronizar() {
    camadaDestaque.scrollTop = editorTexto.scrollTop;
    camadaDestaque.scrollLeft = editorTexto.scrollLeft;
    numeracaoLinhas.scrollTop = editorTexto.scrollTop;
    atualizarBtnInicio();
}

function atualizarEditor() {
    camadaDestaque.innerHTML = colorir(editorTexto.value, REGRAS_DESTAQUE[arquivoAtual]) + '\n';
    numeracaoLinhas.textContent = Array.from({ length: editorTexto.value.split('\n').length }, (_, indice) => indice + 1).join('\n');
    sincronizar();
}

function posicao() {
    const linhasAntes = editorTexto.value.slice(0, editorTexto.selectionStart).split('\n');
    porId('stPos').textContent = `Ln ${linhasAntes.length}, Col ${linhasAntes[linhasAntes.length - 1].length + 1}`;
}

function montarAbas() {
    porId('arquivos').innerHTML = '';
    ARQUIVOS.forEach(arquivo => {
        const item = document.createElement('li');
        if (arquivo.lang === arquivoAtual) item.className = 'on';
        const bolinha = document.createElement('span');
        bolinha.className = 'dot dot-' + arquivo.lang;
        item.append(bolinha, arquivo.nome);
        item.onclick = () => trocar(arquivo.lang);
        porId('arquivos').appendChild(item);
    });
    porId('stLang').textContent = ARQUIVOS.find(arquivo => arquivo.lang === arquivoAtual).rotulo;
}

function trocar(lang) {
    arquivoAtual = lang;
    editorTexto.value = dadosDosArquivos[arquivoAtual];
    montarAbas();
    atualizarEditor();
    posicao();
    if (!ehCelular()) editorTexto.focus();
}

/* Executar */
function setAba(aba) {
    areaIde.dataset.aba = aba;
    document.querySelectorAll('.aba').forEach(botao => botao.classList.toggle('on', botao.dataset.aba === aba));
}

function mostrarResultado(focar) {
    if (!resultadoAberto) {
        resultadoAberto = true;
        porId('painelResultado').hidden = false;
        areaIde.classList.add('com-resultado');
        porId('abaResultado').disabled = false;
    }
    if (focar && ehCelular()) setAba('resultado');
}

function escreverConsole(mensagem, tipo = 'log') {
    const linha = document.createElement('div');
    linha.className = tipo;
    linha.textContent = mensagem;
    consoleCorpo.appendChild(linha);
    consoleCorpo.scrollTop = consoleCorpo.scrollHeight;
}

// Ponte que envia console.log/erros da página executada para o console da IDE.
// O iframe preview usa postMessage para reportar erros e logs sem quebrar a segurança do navegador.
const PONTE_CONSOLE = '<script>(function(){' +
    'var enviar=function(tipo,args){parent.postMessage({farm:1,t:tipo,m:[].map.call(args,function(x){' +
    'try{return typeof x==="object"?JSON.stringify(x):String(x)}catch(e){return String(x)}}).join(" ")},"*")};' +
    '["log","warn","error"].forEach(function(k){var original=console[k];console[k]=function(){enviar(k,arguments);original.apply(console,arguments)}});' +
    'window.addEventListener("error",function(e){enviar("error",[e.message])});' +
    '})()<\/script>';

function rodarWeb() {
    quadroPreview.hidden = false;
    saidaTerminal.hidden = true;

    // Em HTML/CSS/JS, o código é transformado em um documento completo em um iframe.
    const estilo = `<style>${dadosDosArquivos.css}</style>`;
    const script = PONTE_CONSOLE + `<script>${dadosDosArquivos.js}<\/script>`;
    let documentoHtml = dadosDosArquivos.html;
    documentoHtml = documentoHtml.includes('</head>') ? documentoHtml.replace('</head>', () => estilo + '</head>') : estilo + documentoHtml;
    documentoHtml = documentoHtml.includes('</body>') ? documentoHtml.replace('</body>', () => script + '</body>') : documentoHtml + script;
    quadroPreview.srcdoc = documentoHtml;
    escreverConsole('Página renderizada com o código do momento do clique.', 'info');
}

window.addEventListener('message', evento => {
    if (evento.source !== quadroPreview.contentWindow || !evento.data || !evento.data.farm) return;
    escreverConsole((evento.data.t === 'error' ? '✖ ' : '› ') + evento.data.m, evento.data.t);
});

// Python, PHP e Node: o sistema ainda marca a execução como “em breve” e não liga ao Judge0 de verdade.
function rodarTerminal() {
    quadroPreview.hidden = true;
    saidaTerminal.hidden = false;
    saidaTerminal.textContent = `$ ${ARQUIVOS[0].nome}\nA execução de ${linguagemAtual.rotulo} será integrada em breve.`;
    escreverConsole('Execução no servidor (Judge0) ainda não integrada.', 'info');
}

async function executar(opcoes = {}) {
    if (executando) return;
    executando = true;
    atualizarBotoes();
    consoleCorpo.innerHTML = '';
    mostrarResultado(!!opcoes.focar);
    try {
        if (modoExecucao === 'web') rodarWeb(); else rodarTerminal();
        executadoAtual = true;
        porId('pvStale').hidden = true;
    } finally {
        executando = false;
        atualizarBotoes();
    }
}

function atualizarBotoes() {
    porId('btnRodar').disabled = atividadeAtual.vazia || executando || usosExecutar >= LIMITE_EXECUCOES;
    porId('btnRodar').textContent = executando ? 'Executando...' : '▶ Executar';
    porId('btnSophia').disabled = atividadeAtual.vazia;
    atualizarEntrega();
}

/* Eventos do editor */
editorTexto.addEventListener('input', () => {
    dadosDosArquivos[arquivoAtual] = editorTexto.value;
    executadoAtual = false;
    if (resultadoAberto) porId('pvStale').hidden = false;
    atualizarEditor();
    posicao();
    salvar();
});
editorTexto.addEventListener('scroll', sincronizar);
editorTexto.addEventListener('click', posicao);
editorTexto.addEventListener('keyup', posicao);

editorTexto.addEventListener('keydown', evento => {
    if (evento.key === 'Tab' && !editorTexto.readOnly) {
        evento.preventDefault();
        const recuo = modoExecucao === 'terminal' && linguagemAtual.id === ID_LINGUAGEM_PYTHON ? '    ' : '  ';
        editorTexto.setRangeText(recuo, editorTexto.selectionStart, editorTexto.selectionEnd, 'end');
        editorTexto.dispatchEvent(new Event('input'));
    }
    if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 's') {
        evento.preventDefault();
        if (editorTexto.readOnly) return;
        salvar();
        aviso('Código salvo');
    }
});

document.addEventListener('keydown', evento => {
    if (evento.key !== 'Escape') return;
    fecharModalEntrega();
    if (document.body.classList.contains('editor-expandido')) recolherEditor();
});
document.querySelectorAll('.aba').forEach(botao => botao.addEventListener('click', () => setAba(botao.dataset.aba)));
porId('btnLimpar').onclick = () => { consoleCorpo.innerHTML = ''; };

porId('btnRodar').onclick = () => {
    if (porId('btnRodar').disabled) return;
    usosExecutar++;
    atualizarContadores();
    executar({ focar: true });
};

// Voltar sempre leva à página do aluno.
porId('btnVoltar').onclick = () => { location.href = 'aluno'; };

document.querySelectorAll('.logo img, .sophia-avatar img').forEach(imagem => {
    const semImagem = () => imagem.parentElement.classList.add('sem-img');
    imagem.addEventListener('error', semImagem);
    if (imagem.complete && !imagem.naturalWidth) semImagem();
});

/* Celular: o editor ocupa a tela toda enquanto o aluno digita (X para voltar ao normal) */
function atualizarBtnInicio() {
    if (!botaoInicio) return;
    botaoInicio.hidden = !(document.body.classList.contains('editor-expandido') && editorTexto.scrollLeft > 24);
}
function expandirEditor() {
    if (!ehCelular() || editorTexto.readOnly) return;
    document.body.classList.add('editor-expandido');
    atualizarBtnInicio();
}
function recolherEditor() {
    document.body.classList.remove('editor-expandido');
    editorTexto.blur();
    atualizarBtnInicio();
}
editorTexto.addEventListener('focus', expandirEditor);
if (botaoFecharEditor) botaoFecharEditor.addEventListener('click', recolherEditor);
if (botaoInicio) botaoInicio.addEventListener('click', () => editorTexto.scrollTo({ left: 0, behavior: 'smooth' }));
window.addEventListener('resize', () => { if (!ehCelular()) recolherEditor(); });

function iniciarPagina() {
    atualizarBotoes();
    setInterval(atualizarEntrega, 30000);
    trocar(arquivoAtual);
    if (!atividadeAtual.vazia) {
        setTimeout(() => sophiaFala('Oi, sou a Sophia! Estou aqui para ajudar. Se precisar, é só clicar em mim.', 6000), 600);
    }
}