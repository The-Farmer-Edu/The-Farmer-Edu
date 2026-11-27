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
const LIMITE_SOPHIA = 10;

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
    ['s', '`(?:[^`\\\\]|\\\\.)*`|"(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\''],
    ['k', '\\b(?:const|let|var|function|return|if|else|for|while|class|new|import|from|export|default|async|await|try|catch|throw|switch|case|break|continue|true|false|null|undefined|this)\\b'],
    ['n', '\\b\\d+(?:\\.\\d+)?\\b'], ['f', '\\b[a-zA-Z_$][\\w$]*(?=\\()']],
    py: [['c', '#.*'], ['s', '"""[\\s\\S]*?"""|"(?:[^"\\\\\\n]|\\\\.)*"|\'(?:[^\'\\\\\\n]|\\\\.)*\''],
    ['k', '\\b(?:def|return|if|elif|else|for|while|in|not|and|or|is|class|import|from|as|try|except|finally|raise|with|pass|break|continue|lambda|True|False|None)\\b'],
    ['n', '\\b\\d+(?:\\.\\d+)?\\b'], ['f', '\\b[a-zA-Z_][\\w]*(?=\\()']],
    php: [['c', '\\/\\/.*|#.*|\\/\\*[\\s\\S]*?\\*\/'], ['s', '"(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\''],
    ['a', '\\$[a-zA-Z_]\\w*'],
    ['k', '\\b(?:function|return|if|else|elseif|foreach|for|while|echo|print|class|new|true|false|null|fgets|trim)\\b'],
    ['n', '\\b\\d+(?:\\.\\d+)?\\b'], ['f', '\\b[a-zA-Z_]\\w*(?=\\()']],
    sql: [['c', '--.*|\\/\\*[\\s\\S]*?\\*\/'], ['s', '\'(?:[^\'\\\\]|\\\\.)*\''],
    ['k', '\\b(?:SELECT|FROM|WHERE|CREATE|TABLE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|PRIMARY|KEY|NOT|NULL|AUTO_INCREMENT|INT|VARCHAR|DECIMAL|TEXT|DEFAULT|AND|OR)\\b'],
    ['n', '\\b\\d+(?:\\.\\d+)?\\b']],
    txt: []
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
const CHAVE_EXECUCOES = `farmedu:execucoes:${atividadeAtual.chave}`;
const CHAVE_SOPHIA = `farmedu:sophia:${atividadeAtual.chave}`;
const CHAVE_AVALIACAO = `farmedu:avaliacao:${atividadeAtual.chave}`;

// Contadores de limite gravados no navegador, por atividade, para sobreviverem ao refresh.
function lerContador(chave) {
    try { return Number(localStorage.getItem(chave)) || 0; } catch (erro) { return 0; }
}
function gravarContador(chave, valor) {
    try { localStorage.setItem(chave, String(valor)); } catch (erro) { }
}

/*
 * Estado da página.
 *
 * REGRA DE SEGURANÇA:
 * As contagens de cancelamentos/tentativas e o estado da entrega (`entrega`) são carregados
 * EXCLUSIVAMENTE do banco de dados (via `atividadeAtual`, injetada pelo PHP), e não do localStorage.
 * O localStorage continua sendo usado apenas como rascunho de código não entregue e espelho visual,
 * evitando manipulação dos bloqueios de botão pelo navegador.
 */
const MODO_INSTRUTOR = !!atividadeAtual.modoInstrutor;

/**
 * Converte a submissão retornada pelo banco no mapa de arquivos usado pelo editor.
 */
function extrairArquivosDaSubmissao(submissao, vazioSeAusente = false) {
    const mapaVazio = () => {
        const obj = {};
        ARQUIVOS.forEach(arquivo => { obj[arquivo.lang] = ''; });
        return obj;
    };

    if (!submissao) {
        return vazioSeAusente ? mapaVazio() : null;
    }

    const conteudo = submissao.conteudo || '';
    if (!conteudo && submissao.caminhoArquivo) {
        return { ...mapaVazio(), [ARQUIVOS[0].lang]: `Arquivo anexado: ${submissao.caminhoArquivo}` };
    }

    if (ARQUIVOS.length === 1) {
        return { ...(vazioSeAusente ? mapaVazio() : linguagemAtual.inicial), [ARQUIVOS[0].lang]: conteudo };
    }

    try {
        const parsed = JSON.parse(conteudo);
        if (parsed && typeof parsed === 'object') {
            return { ...(vazioSeAusente ? mapaVazio() : linguagemAtual.inicial), ...parsed };
        }
    } catch (erro) { }

    return vazioSeAusente ? mapaVazio() : { ...linguagemAtual.inicial };
}

// Estado real de entrega e cancelamentos vindos do banco de dados.
let entrega = (!MODO_INSTRUTOR && atividadeAtual.entregue && atividadeAtual.submissao)
    ? {
        id: atividadeAtual.submissao.id,
        data: atividadeAtual.submissao.dataEnvio,
        tentativa: atividadeAtual.submissao.tentativa,
        status: atividadeAtual.submissao.status,
        atividadeId: atividadeAtual.id,
        linguagem: linguagemAtual.id
    }
    : null;

let cancelamentos = MODO_INSTRUTOR ? 0 : (Number(atividadeAtual.cancelamentos) || 0);

// Sincroniza o cache local para refletir o banco de dados (anula eventuais edições manuais no DevTools).
if (!MODO_INSTRUTOR && !atividadeAtual.vazia) {
    try {
        if (entrega) {
            localStorage.setItem(CHAVE_ENTREGA, JSON.stringify(entrega));
        } else {
            localStorage.removeItem(CHAVE_ENTREGA);
            localStorage.removeItem(CHAVE_AVALIACAO);
        }
        localStorage.setItem(CHAVE_CANCELAMENTOS, String(cancelamentos));
    } catch (erro) { }
}

// Carrega os arquivos do editor priorizando sempre o banco quando entregue ou no modo instrutor.
let dadosDosArquivos;
if (MODO_INSTRUTOR) {
    // Instrutor recebe exclusivamente a última submissão ativa do aluno no BD (nunca o localStorage).
    dadosDosArquivos = extrairArquivosDaSubmissao(atividadeAtual.submissao, true);
} else if (entrega) {
    // Quando já foi entregue no BD, exibe exatamente a resolução gravada no banco.
    dadosDosArquivos = extrairArquivosDaSubmissao(atividadeAtual.submissao, false) || { ...linguagemAtual.inicial };
} else {
    try {
        const rascunhoLocal = JSON.parse(localStorage.getItem(CHAVE_CODIGO));
        dadosDosArquivos = rascunhoLocal
            ? { ...linguagemAtual.inicial, ...rascunhoLocal }
            : (extrairArquivosDaSubmissao(atividadeAtual.submissao, false) || { ...linguagemAtual.inicial });
    } catch (erro) {
        dadosDosArquivos = { ...linguagemAtual.inicial };
    }
}
if (atividadeAtual.vazia) ARQUIVOS.forEach(arquivo => { dadosDosArquivos[arquivo.lang] = ''; });

let arquivoAtual = ARQUIVOS[0].lang;
let resultadoAberto = false;
let executadoAtual = false;
let executando = false;
let usosExecutar = lerContador(CHAVE_EXECUCOES);
let usosSophia = lerContador(CHAVE_SOPHIA);

// Chamado pelo sophia.js a cada consulta à Sophia.
function registrarUsoSophia() {
    usosSophia++;
    gravarContador(CHAVE_SOPHIA, usosSophia);
    atualizarBotoes();
}

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
    // Modo instrutor e entregas já finalizadas não devem alterar o rascunho local.
    if (MODO_INSTRUTOR || entrega) return;
    try { localStorage.setItem(CHAVE_CODIGO, JSON.stringify(dadosDosArquivos)); } catch (erro) { }
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
function colorir(codigo, regras, flags = 'g') {
    if (!regras || !regras.length) return escaparHtml(codigo);
    try {
        const expressao = new RegExp(regras.map(regra => '(' + regra[1] + ')').join('|'), flags);
        let saida = '', ultimoIndice = 0, correspondencia;
        while ((correspondencia = expressao.exec(codigo))) {
            if (!correspondencia[0]) { expressao.lastIndex++; continue; }
            const indiceRegra = correspondencia.slice(1).findIndex(grupo => grupo !== undefined);
            saida += escaparHtml(codigo.slice(ultimoIndice, correspondencia.index))
                + `<span class="${regras[indiceRegra][0]}">${escaparHtml(correspondencia[0])}</span>`;
            ultimoIndice = expressao.lastIndex;
        }
        return saida + escaparHtml(codigo.slice(ultimoIndice));
    } catch (erro) {
        console.error('Erro no destaque de sintaxe:', erro);
        return escaparHtml(codigo);
    }
}
function sincronizar() {
    camadaDestaque.scrollTop = editorTexto.scrollTop;
    camadaDestaque.scrollLeft = editorTexto.scrollLeft;
    numeracaoLinhas.scrollTop = editorTexto.scrollTop;
    atualizarBtnInicio();
}
function atualizarEditor() {
    camadaDestaque.innerHTML = colorir(editorTexto.value, REGRAS_DESTAQUE[arquivoAtual], arquivoAtual === 'sql' ? 'gi' : 'g') + '\n';
    numeracaoLinhas.textContent = Array.from({ length: editorTexto.value.split('\n').length }, (_, indice) => indice + 1).join('\n');
    sincronizar();
}
function posicao() {
    const linhasAntes = editorTexto.value.slice(0, editorTexto.selectionStart).split('\n');
    porId('stPos').textContent = `Ln ${linhasAntes.length}, Col ${linhasAntes[linhasAntes.length - 1].length + 1}`;
}

function montarAbas() {
    porId('arquivos').innerHTML = '';

    // Sem atividade: seção de arquivos vazia
    if (atividadeAtual.vazia) {
        porId('stLang').textContent = '—';
        return;
    }
    // Atividade de texto: lista de arquivos vazia
    if (modoExecucao === 'texto') {
        porId('stLang').textContent = 'Texto';
        return;
    }

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
    // Sem atividade: editor vazio, desativado e sem arquivos
    if (atividadeAtual.vazia) {
        editorTexto.value = '';
        editorTexto.disabled = true;
        editorTexto.placeholder = 'Abra uma atividade na página do aluno para escrever código.';
        porId('painelCodigo').classList.add('sem-atividade');
        montarAbas();
        atualizarEditor();
        porId('stPos').textContent = '—';
        return;
    }

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
function escreverTerminal(texto) {
    saidaTerminal.textContent += texto + '\n';
    saidaTerminal.scrollTop = saidaTerminal.scrollHeight;
}

// // JavaScript roda em um Web Worker (isolado da página, com limite de 5s).
// function rodarJs(codigo) {
//     return new Promise(resolver => {
//         const fonte = [
//             "const _e=(t,a)=>postMessage({t:t,m:Array.from(a).map(x=>{try{return typeof x==='object'?JSON.stringify(x):String(x)}catch(e){return String(x)}}).join(' ')});",
//             "['log','info','warn','error'].forEach(k=>{console[k]=(...a)=>_e(k,a)});",
//             "try{(0,eval)(" + JSON.stringify(codigo) + ")}catch(e){_e('error',[e&&e.name?e.name+': '+e.message:String(e)])}",
//             "setTimeout(()=>postMessage({fim:true}),300);"
//         ].join('\n');
//         const url = URL.createObjectURL(new Blob([fonte], { type: 'text/javascript' }));
//         const worker = new Worker(url);
//         let linhas = 0, terminou = false;
//         const encerrar = () => {
//             if (terminou) return;
//             terminou = true;
//             clearTimeout(limite);
//             worker.terminate();
//             URL.revokeObjectURL(url);
//             if (!linhas) escreverTerminal('(sem saída)');
//             resolver();
//         };
//         const limite = setTimeout(() => { linhas++; escreverTerminal('✖ Tempo limite de 5 segundos excedido.'); encerrar(); }, 5000);
//         worker.onmessage = evento => {
//             if (evento.data.fim) return encerrar();
//             linhas++;
//             escreverTerminal((evento.data.t === 'error' ? '✖ ' : '') + evento.data.m);
//         };
//         worker.onerror = evento => { linhas++; escreverTerminal('✖ ' + evento.message); evento.preventDefault(); };
//     });
// }

// // SQL roda em SQLite no navegador (sql.js), o mesmo motor do Judge0 (language_id 82).
// let sqlJsPromessa = null;
// function carregarSqlJs() {
//     if (!sqlJsPromessa) {
//         const base = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/';
//         sqlJsPromessa = new Promise((ok, falha) => {
//             const script = document.createElement('script');
//             script.src = base + 'sql-wasm.js';
//             script.onload = () => initSqlJs({ locateFile: arquivo => base + arquivo }).then(ok, falha);
//             script.onerror = () => falha(new Error('Não foi possível baixar o motor SQL (verifique a internet).'));
//             document.head.appendChild(script);
//         });
//         sqlJsPromessa.catch(() => { sqlJsPromessa = null; });
//     }
//     return sqlJsPromessa;
// }

// function formatarTabela(resultado) {
//     const texto = valor => (valor === null || valor === undefined ? 'NULL' : String(valor));
//     const larguras = resultado.columns.map((coluna, i) =>
//         Math.max(coluna.length, ...resultado.values.map(linha => texto(linha[i]).length)));
//     const linhaTexto = linha => linha.map((valor, i) => texto(valor).padEnd(larguras[i])).join(' | ');
//     return [
//         linhaTexto(resultado.columns),
//         larguras.map(n => '-'.repeat(n)).join('-+-'),
//         ...resultado.values.map(linhaTexto)
//     ].join('\n');
// }

// async function rodarSql(codigo) {
//     escreverTerminal('Carregando motor SQL...');
//     try {
//         const SQL = await carregarSqlJs();
//         const banco = new SQL.Database();   // banco novo e vazio a cada execução
//         saidaTerminal.textContent = `$ ${ARQUIVOS[0].nome}\n`;
//         banco.exec(codigo).forEach(resultado => escreverTerminal(formatarTabela(resultado) + '\n'));
//         const tabelas = banco.exec("SELECT name FROM sqlite_master WHERE type='table'");
//         escreverTerminal(tabelas.length
//             ? 'Tabelas no banco: ' + tabelas[0].values.map(linha => linha[0]).join(', ')
//             : 'Comando executado. Nenhuma tabela criada.');
//         banco.close();
//     } catch (erro) {
//         saidaTerminal.textContent = `$ ${ARQUIVOS[0].nome}\n`;
//         escreverTerminal('✖ ' + erro.message);
//         escreverConsole(erro.message, 'error');
//     }
// }

async function rodarTerminal() {
    quadroPreview.hidden = true;
    saidaTerminal.hidden = false;
    saidaTerminal.textContent = `$ ${ARQUIVOS[0].nome}\n`;
    // const codigo = dadosDosArquivos[ARQUIVOS[0].lang] || '';

    enviarParaAvaliacao();
    // if (linguagemAtual.id === 63) {
    //     await rodarJs(codigo);
    //     escreverConsole('Execução concluída.', 'info');
    // } else if (linguagemAtual.id === 'sql') {
    //     await rodarSql(codigo);
    //     escreverConsole('Execução concluída.', 'info');
    // } else {
    //     escreverTerminal(`A execução de ${linguagemAtual.rotulo} será integrada em breve.`);
    //     escreverConsole('Execução no servidor (Judge0) ainda não integrada.', 'info');
    // }
}

async function executar(opcoes = {}) {
    if (executando) return;
    executando = true;
    atualizarBotoes();
    consoleCorpo.innerHTML = '';
    mostrarResultado(!!opcoes.focar);
    try {
        if (modoExecucao === 'web') rodarWeb(); else await rodarTerminal();
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
    porId('btnSophia').disabled = atividadeAtual.vazia || usosSophia >= LIMITE_SOPHIA;
    atualizarEntrega();
}

/*
 * Avaliação no servidor (Judge0 + IA).
 *
 * Restaurado da versão "com_integracao_judge0". O navegador envia o código para
 * POST /submissoes/enviarSubmissao (views/processar_submissao.php -> AvaliadorController),
 * que executa no Judge0 e pede a avaliação da IA. A resposta esperada é:
 *   { sucesso, compilacao: { status, saida_terminal }, avaliacao: { nota_atribuida, status_avaliacao,
 *     feedback_geral, pontos_melhoria, ... } }
 * A entrega em si já foi gravada no banco por salvarResolucao; esta avaliação NUNCA desfaz a entrega.
 */
const FEEDBACK = {
    // Rota registrada em routes.php. Tenta nesta ordem; só passa ao próximo se não existir (404/405) ou não responder.
    endpoints: ['enviarSubmissao'],
    timeoutMs: 120000,

    montarPayload(ctx) {
        return {
            linguagem: ctx.linguagem,
            codigo_aluno: ctx.codigo,
            id_linguagem: ctx.idLinguagem,
            // O banco não envia "objetivo" ao navegador; a descrição da atividade cumpre esse papel.
            objetivo_atividade: atividadeAtual.objetivo || atividadeAtual.descricao || '',
            nota_max: String(atividadeAtual.notaMax),
            nota_min: String(atividadeAtual.notaMin),
            dados_entrada: atividadeAtual.entrada || '',
            atividadeId: atividadeAtual.id
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
            feitos: av.pontos_positivos || av.o_que_foi_feito || [],
            faltando: av.o_que_falta || av.pontos_faltantes || [],
            compilador: st && (st.description || st),
            saida: data.compilacao && data.compilacao.saida_terminal
        };
    }
};

// Estado da avaliação da entrega atual.
let avaliacaoSeq = 0;       // sobe a cada cancelamento: descarta respostas de avaliações antigas
let enviando = false;
let ultimaResposta = null;  // última resposta crua do servidor (Judge0 + IA) para a entrega atual

// Monta o que o servidor precisa saber sobre o código atual do editor.
function contextoEntrega() {
    const web = modoExecucao === 'web';
    return {
        linguagem: web ? 'HTML/CSS/JS' : linguagemAtual.rotulo,
        idLinguagem: linguagemAtual.judge0,
        codigo: web
            ? ARQUIVOS.map(arquivo => `/* ${arquivo.nome} */\n${dadosDosArquivos[arquivo.lang]}`).join('\n\n')
            : dadosDosArquivos[ARQUIVOS[0].lang]
    };
}

// Converte o corpo da resposta em JSON, tolerando BOM ou avisos do PHP impressos antes do objeto.
function lerJson(texto) {
    const limpo = String(texto || '').replace(/^\uFEFF/, '').trim();
    try {
        return JSON.parse(limpo);
    } catch (erroInicial) {
        const inicio = limpo.indexOf('{'), fim = limpo.lastIndexOf('}');
        if (inicio === -1 || fim <= inicio) throw erroInicial;
        return JSON.parse(limpo.slice(inicio, fim + 1));
    }
}

// Detecta mensagens de erro/aviso do próprio PHP no corpo da resposta.
function erroDoPHP(texto) {
    return /\b(Fatal error|Parse error|Warning|Notice|Deprecated|Uncaught)\b/i.test(String(texto || ''));
}

// Chamada ao servidor de avaliação (Judge0 + IA).
async function avaliarNoServidor(extra = {}) {
    const corpo = JSON.stringify({ ...FEEDBACK.montarPayload(contextoEntrega()), ...extra });
    let ultimoErro = null;
    for (const endereco of FEEDBACK.endpoints) {
        let resposta, texto;
        const controle = new AbortController();
        const relogio = setTimeout(() => controle.abort(), FEEDBACK.timeoutMs);
        try {
            resposta = await fetch(endereco, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: corpo,
                signal: controle.signal
            });
            texto = await resposta.text();
        } catch (erro) {
            ultimoErro = erro.name === 'AbortError' ? new Error('o servidor demorou demais para responder') : erro;
            continue;   // sem conexão com este endereço: tenta o próximo
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
        } catch (erro) {
            console.error(`"${endereco}" não devolveu JSON. Resposta:`, texto);
            ultimoErro = new Error('o servidor não devolveu JSON: ' + erro.message);
            if (erroDoPHP(texto)) throw ultimoErro;   // erro do próprio servidor: não repete em outro endereço
            continue;                                  // página qualquer (rota inexistente): tenta o próximo
        }
        if (!data.sucesso) throw new Error(data.erro || 'Erro desconhecido');
        return data;
    }
    throw ultimoErro || new Error('Sem resposta do servidor de avaliação');
}

// Disparada por submissao.js depois que o banco confirmou a entrega. Não bloqueia a tela.
async function enviarParaAvaliacao() {
    // Judge0 só faz sentido para código; atividades de texto não passam por aqui.
    if (MODO_INSTRUTOR || enviando || modoExecucao === 'texto') return;
    const sequencia = ++avaliacaoSeq;
    enviando = true;
    escreverConsole('Enviando a entrega para avaliação automática...', 'info');
    try {
        const data = await avaliarNoServidor();
        if (sequencia !== avaliacaoSeq) return;   // a entrega foi cancelada enquanto avaliava
        ultimaResposta = data;
        try { localStorage.setItem(CHAVE_AVALIACAO, JSON.stringify(data)); } catch (erro) { }
        const resumo = FEEDBACK.interpretar(data);
        if (resumo.compilador) escreverConsole('Judge0: ' + resumo.compilador, 'info');
        escreverConsole('Avaliação automática concluída. A nota será liberada depois do prazo de entrega.', 'info');
    } catch (erro) {
        if (sequencia !== avaliacaoSeq) return;
        console.error('Falha na avaliação automática:', erro);
        escreverConsole('Não foi possível concluir a avaliação automática agora: ' + erro.message, 'warn');
    } finally {
        if (sequencia === avaliacaoSeq) enviando = false;
    }
}

// Chamada por submissao.js quando o banco confirma o cancelamento da entrega.
function cancelarAvaliacao() {
    avaliacaoSeq++;
    enviando = false;
    ultimaResposta = null;
    try { localStorage.removeItem(CHAVE_AVALIACAO); } catch (erro) { }
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
    if (evento.key === 'Tab' && !editorTexto.readOnly && modoExecucao !== 'texto') {
        evento.preventDefault();
        const recuo = modoExecucao === 'terminal' && linguagemAtual.id === ID_LINGUAGEM_PYTHON ? '    ' : '  ';
        editorTexto.setRangeText(recuo, editorTexto.selectionStart, editorTexto.selectionEnd, 'end');
        editorTexto.dispatchEvent(new Event('input'));
    }
    if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 's') {
        evento.preventDefault();
        if (editorTexto.readOnly) return;
        salvar();
        aviso(modoExecucao === 'texto' ? 'Resposta salva' : 'Código salvo');
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
    gravarContador(CHAVE_EXECUCOES, usosExecutar);
    atualizarContadores();
    executar({ focar: true });
};

// Voltar preserva id_aluno no modo instrutor para não perder a permissão de acesso na URL.
porId('btnVoltar').onclick = () => {
    if (MODO_INSTRUTOR && atividadeAtual.idAluno) {
        location.href = 'aluno?id=' + encodeURIComponent(atividadeAtual.id) + '&id_aluno=' + encodeURIComponent(atividadeAtual.idAluno);
        return;
    }
    location.href = 'aluno?id=' + encodeURIComponent(atividadeAtual.id);
};
// -----------------------------------------------------------------^

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

function aplicarModoTexto() {
    if (modoExecucao !== 'texto') return;
    porId('btnRodar').hidden = true;                          // sem botão Executar
    porId('contadorExecutar').parentElement.hidden = true;    // sem limite de Executar
    porId('abasMobile').hidden = true;                        // sem aba Resultado no celular
    porId('painelCodigo').classList.add('modo-texto');
    editorTexto.wrap = 'soft';
    editorTexto.placeholder = 'Escreva sua resposta aqui...';
    editorTexto.setAttribute('aria-label', 'Editor de texto');
}
// Instrutor só visualiza a última submissão do aluno (sem executar, entregar nem Sophia).
function aplicarModoInstrutor() {
    if (!MODO_INSTRUTOR) return;
    porId('btnRodar').hidden = true;
    porId('btnEntregar').hidden = true;
    document.querySelector('.sophia').hidden = true;
    porId('contadorLimite').hidden = true;
    editorTexto.readOnly = true;

    const chipSiae = porId('chipSiae');
    if (chipSiae && atividadeAtual.feedbackIa && typeof atividadeAtual.feedbackIa.percentual === 'number') {
        const pct = Math.round(atividadeAtual.feedbackIa.percentual);
        chipSiae.hidden = false;
        chipSiae.classList.toggle('encerrado', pct > 60);
        chipSiae.textContent = `SIAE: ${pct}% IA`;
        if (atividadeAtual.feedbackIa.motivo) {
            chipSiae.title = atividadeAtual.feedbackIa.motivo;
        }
    }

    if (!atividadeAtual.submissao) {
        editorTexto.placeholder = 'Este aluno ainda não enviou resolução para esta atividade.';
    }
}
function iniciarPagina() {
    aplicarModoTexto();
    aplicarModoInstrutor();
    atualizarBotoes();
    setInterval(atualizarEntrega, 30000);
    trocar(arquivoAtual);

    // Evita que o botão Voltar do navegador restaure estado obsoleto do cache (bfcache).
    window.addEventListener('pageshow', evento => {
        if (evento.persisted) location.reload();
    });
    // Mantém os bloqueios coerentes com o BD mesmo se o localStorage for alterado em outra aba.
    window.addEventListener('storage', () => {
        atualizarBotoes();
    });

    if (!atividadeAtual.vazia && !MODO_INSTRUTOR) {
        setTimeout(() => sophiaFala('Oi, sou a Sophia! Estou aqui para ajudar. Se precisar, é só clicar em mim.', 6000), 600);
    }
}