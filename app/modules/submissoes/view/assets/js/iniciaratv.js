const A = window.FarmAtividade;
const L = A.linguagem;
const modo = L.modo;
const ARQUIVOS = L.arquivos;
const LIMITE_CLICKS = 10;
const LIMITE_CANCELAMENTOS = 3;
const ID_LINGUAGEM_PYTHON = 71;
const CONSULTA_CELULAR = '(max-width: 780px)';
const LIMITE_SOPHIA = 10;
let usosSophia = 0;

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

const $ = id => document.getElementById(id);
const ed = $('ed'), hl = $('hl'), gutter = $('gutter'), pv = $('pv'), pvPy = $('pvPy'), con = $('console');
const ide = $('ide');
const btnInicio = $('btnInicio'), btnFecharEditor = $('fecharEditor');

const CHAVE = `farmedu:codigo:${A.chave}:${L.id}`;
// A entrega é guardada por atividade (assim o teste não mistura com a atividade real)
const CHAVE_ENTREGA = `farmedu:entrega:${A.chave}`;
const CHAVE_CANCELAMENTOS = `farmedu:cancelamentos:${A.chave}`;
const CHAVE_AVALIACAO = `farmedu:avaliacao:${A.chave}`;

let dados;
try { dados = { ...L.inicial, ...JSON.parse(localStorage.getItem(CHAVE)) }; } catch (e) { dados = { ...L.inicial }; }
if (A.vazia) ARQUIVOS.forEach(a => { dados[a.lang] = ''; });
let entrega = null;
try { entrega = JSON.parse(localStorage.getItem(CHAVE_ENTREGA)); } catch (erro) {}
let cancelamentos = 0;
try { cancelamentos = Number(localStorage.getItem(CHAVE_CANCELAMENTOS)) || 0; } catch (erro) {}

// Ajuda da Sophia: analisando = esperando a IA; aguardando = esperando o aluno digitar sim/não no console; dados = resposta da IA
const ajuda = { analisando: false, aguardando: false, dados: null, assinatura: '' };
// Erros de execução da página (capturados do iframe) enviados junto para a IA
let errosConsole = [];
// Última resposta do servidor para um código (a execução já traz o Judge0 e a avaliação da IA)
let ultimaResposta = null;

let atual = ARQUIVOS[0].lang;
let resultadoAberto = false;
let executadoAtual = false;
let executando = false;
let usosExecutar = 0;

const mobile = () => window.matchMedia('(max-width: 780px)').matches;
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const esperar = ms => new Promise(r => setTimeout(r, ms));

/*Informações da atividade na tela (vindas do atividade.js)*/
if (A.vazia) {
    $('atvTitulo').textContent = 'Nenhuma atividade carregada';
    $('atvDescricao').textContent = 'Volte à página do aluno e clique em "Começar" na atividade. (Para testar, abra a página do aluno com ?teste=web, ?teste=php ou ?teste=python na URL.)';
    $('atvId').hidden = true;
    $('atvLang').hidden = true;
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
    if (!mobile()) ed.focus();
}

/*Mensagens*/
function aviso(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(aviso.t);
    aviso.t = setTimeout(() => t.classList.remove('on'), 3000);
}

/*Balão da Sophia: fala curta (some sozinha)*/
function sophiaFala(msg, ms = 5000) {
    const b = $('balao');
    b.classList.remove('fixo');
    b.textContent = msg;
    b.classList.add('on');
    clearTimeout(sophiaFala.t);
    if (ms) sophiaFala.t = setTimeout(() => b.classList.remove('on'), ms);
}

function fecharBalao() {
    clearTimeout(sophiaFala.t);
    $('balao').classList.remove('on');
}

/*Balão da Sophia: ajuda (o que foi feito, o que falta e como corrigir). Fica aberto até o aluno fechar*/
function secaoAjuda(b, titulo, itens, classe) {
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
    b.appendChild(sec);
}

function sophiaMostrarAjuda(f, temProblema) {
    const b = $('balao');
    clearTimeout(sophiaFala.t);
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
        const errosExec = errosAtuais().map(m => 'Ao executar: ' + m);
        secaoAjuda(b, '✔ O que você já fez', f.feitos, 'ok');
        secaoAjuda(b, '✖ O que ainda falta', f.faltando, 'falta');
        secaoAjuda(b, '🔧 Como corrigir', errosExec.concat(f.melhorias), 'corrige');
    } else {
        const p = document.createElement('p');
        p.className = 'balao-texto';
        p.textContent = 'Não encontrei nenhum erro no seu código. ✔';
        b.appendChild(p);
        secaoAjuda(b, '✔ O que você já fez', f.feitos, 'ok');
    }
    if (f.exemplo) {
        const ex = document.createElement('p');
        ex.className = 'balao-status';
        ex.textContent = '(resposta de exemplo)';
        b.appendChild(ex);
    }
    b.classList.add('on');
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

function atualizarBotoes() {
    $('btnRodar').disabled = A.vazia || executando || usos.executar >= LIMITE_CLICKS;
    $('btnRodar').textContent = executando ? 'Executando...' : '▶ Executar';
    $('btnSophia').disabled = A.vazia || usos.sophia >= LIMITE_CLICKS;
    atualizarEntrega();
}

/*Entrega*/
const modalEntrega = $('modalEntrega');
const formatarData = iso => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

function atualizarEntrega() {
    const entregue = !!entrega;
    const encerrado = A.prazoExcedido();
    const bloqueado = entregue && cancelamentos >= LIMITE_CANCELAMENTOS;

    // Entregue ou com prazo excedido: o editor vira somente leitura
    ed.readOnly = entregue || encerrado || A.vazia;

    $('chipEntrega').hidden = !entregue;
    if (entregue) $('chipEntrega').textContent = '✔ Entregue em ' + formatarData(entrega.data);

    // Limite de entrega
    $('chipPrazo').hidden = !A.limite;
    $('chipPrazo').classList.toggle('encerrado', encerrado);
    $('chipPrazo').textContent = encerrado
        ? 'Prazo encerrado em ' + A.limiteTexto()
        : 'Prazo para entregar até ' + A.limiteTexto();

    const btn = $('btnEntregar');
    btn.disabled = A.vazia || bloqueado || encerrado || (!entregue && executando);
    btn.textContent = encerrado ? 'Prazo encerrado'
        : bloqueado ? 'Entrega final'
        : entregue ? 'Cancelar entrega' : 'Entregar atividade';
    btn.className = entregue || encerrado ? 'btn btn-cinza' : 'btn btn-verde';
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
    if (A.prazoExcedido()) return aviso('O prazo de entrega acabou');
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
    if (A.prazoExcedido()) { fecharModalEntrega(); return aviso('O prazo de entrega acabou'); }
    salvar();
    entrega = { data: new Date().toISOString(), atividadeId: A.id, linguagem: L.id, arquivos: { ...dados } };
    try { localStorage.setItem(CHAVE_ENTREGA, JSON.stringify(entrega)); } catch (e) {}
    fecharModalEntrega();
    atualizarEntrega();
    sophiaFala('Atividade entregue! Sua nota será liberada depois do prazo de entrega.', 6000);
    enviarParaAvaliacao();
}

function cancelarEntrega() {
    if (A.prazoExcedido()) return aviso('O prazo acabou: a entrega não pode mais ser cancelada');
    if (cancelamentos >= LIMITE_CANCELAMENTOS) return aviso('Você já usou os 3 cancelamentos. A entrega é final.');
    cancelamentos++;
    try { localStorage.setItem(CHAVE_CANCELAMENTOS, String(cancelamentos)); } catch (e) {}
    entrega = null;
    avaliacaoSeq++;
    enviando = false;
    try { localStorage.removeItem(CHAVE_ENTREGA); } catch (e) {}
    try { localStorage.removeItem(CHAVE_AVALIACAO); } catch (e) {}
    atualizarEntrega();
    aviso(`Entrega cancelada. Cancelamentos restantes: ${LIMITE_CANCELAMENTOS - cancelamentos}/${LIMITE_CANCELAMENTOS}`);
}

/*FEEDBACK — PONTO DE INTEGRAÇÃO COM O GRUPO feedback_ia*/
const FEEDBACK = {
    // Tenta nesta ordem; só passa para o próximo se o endereço não existir (404/405) ou não responder.
    endpoints: ['enviarSubmissao', 'sendAvaliacao', 'api/sendAvaliacao'],
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
            // Campos novos para a ajuda da Sophia (o backend do feedback_ia precisa devolver):
            feitos: av.pontos_positivos || av.o_que_foi_feito || [],
            faltando: av.o_que_falta || av.pontos_faltantes || [],
            compilador: st && (st.description || st),
            saida: data.compilacao && data.compilacao.saida_terminal
        };
    },

    /*Resposta de exemplo (usada só se a IA falhar). Monta o texto com os requisitos da própria
      atividade, então serve para web, Python, PHP e para as atividades que vierem do banco.
      Se o código acabou de rodar no Judge0 e a saída confere com "saidaEsperada", responde "aprovado".*/
    exemplo() {
        const req = A.requisitos || [];
        const saidaOk = modo === 'terminal' && typeof A.saidaEsperada === 'string'
            && executadoAtual && errosConsole.length === 0;
        if (saidaOk) {
            return {
                sucesso: true,
                compilacao: { status: 'Accepted', saida_terminal: A.saidaEsperada },
                avaliacao: {
                    nota_atribuida: A.notaMax,
                    status_avaliacao: 'aprovado',
                    feedback_geral: 'A saída do seu código confere com o esperado.',
                    pontos_positivos: req.map(r => 'Você cumpriu: ' + r),
                    o_que_falta: [],
                    pontos_melhoria: []
                }
            };
        }
        const metade = Math.ceil(req.length / 2);
        return {
            sucesso: true,
            compilacao: { status: 'Código Aceito!', saida_terminal: '' },
            avaliacao: {
                nota_atribuida: 5,
                status_avaliacao: 'reprovado',
                feedback_geral: 'Você está no caminho certo, mas faltam alguns itens.',
                pontos_positivos: req.slice(0, metade).map(r => 'Você já trabalhou neste item: ' + r),
                o_que_falta: req.slice(metade).map(r => 'Ainda falta: ' + r),
                pontos_melhoria: ['Releia os itens que faltam, execute o código e confira o resultado no console.']
            }
        };
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

/*Chamada à IA (usada pela ajuda da Sophia e pela avaliação da entrega)*/
async function avaliarNoServidor(extra = {}) {
    // payload com as regras da atividade (igual ao exemplo): linguagem, codigo_aluno, id_linguagem, objetivo_atividade, nota_max, nota_min...
    const corpo = JSON.stringify({ ...FEEDBACK.montarPayload(contextoEntrega()), ...extra });
    let ultimoErro = null;
    for (const endereco of FEEDBACK.endpoints) {
        let resposta, texto;
        const ctl = new AbortController();
        const relogio = setTimeout(() => ctl.abort(), 120000);
        try {
            // chama o Controller que orquestra o Judge0 e a IA
            resposta = await fetch(endereco, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: corpo,
                signal: ctl.signal
            });
            texto = await resposta.text();
        } catch (e) {
            ultimoErro = e.name === 'AbortError' ? new Error('o servidor demorou demais para responder') : e;
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
        } catch (e) {
            console.error(`"${endereco}" não devolveu JSON. Resposta:`, texto);
            ultimoErro = new Error('o servidor não devolveu JSON: ' + e.message);
            if (erroDoPHP(texto)) throw ultimoErro;   // erro do próprio servidor: não repete em outro endereço
            continue;                                  // página qualquer (rota inexistente): tenta o próximo
        }
        console.log('Resposta do servidor:', data);
        if (!data.sucesso) throw new Error(data.erro || 'Erro desconhecido');
        return data;
    }
    throw ultimoErro || new Error('Sem resposta do servidor de avaliação');
}

function formatarTabela(resultado) {
    const texto = valor => (valor === null || valor === undefined ? 'NULL' : String(valor));
    const larguras = resultado.columns.map((coluna, i) =>
        Math.max(coluna.length, ...resultado.values.map(linha => texto(linha[i]).length)));
    const linhaTexto = linha => linha.map((valor, i) => texto(valor).padEnd(larguras[i])).join(' | ');
    return [
        linhaTexto(resultado.columns),
        larguras.map(n => '-'.repeat(n)).join('-+-'),
        ...resultado.values.map(linhaTexto)
    ].join('\n');
}

async function rodarSql(codigo) {
    escreverTerminal('Carregando motor SQL...');
    try {
        const SQL = await carregarSqlJs();
        const banco = new SQL.Database();   // banco novo e vazio a cada execução
        saidaTerminal.textContent = `$ ${ARQUIVOS[0].nome}\n`;
        banco.exec(codigo).forEach(resultado => escreverTerminal(formatarTabela(resultado) + '\n'));
        const tabelas = banco.exec("SELECT name FROM sqlite_master WHERE type='table'");
        escreverTerminal(tabelas.length
            ? 'Tabelas no banco: ' + tabelas[0].values.map(linha => linha[0]).join(', ')
            : 'Comando executado. Nenhuma tabela criada.');
        banco.close();
    } catch (erro) {
        saidaTerminal.textContent = `$ ${ARQUIVOS[0].nome}\n`;
        escreverTerminal('✖ ' + erro.message);
        escreverConsole(erro.message, 'error');
    }
}

async function rodarTerminal() {
    quadroPreview.hidden = true;
    saidaTerminal.hidden = false;
    saidaTerminal.textContent = `$ ${ARQUIVOS[0].nome}\n`;
    const codigo = dadosDosArquivos[ARQUIVOS[0].lang] || '';

    if (linguagemAtual.id === 63) {
        await rodarJs(codigo);
        escreverConsole('Execução concluída.', 'info');
    } else if (linguagemAtual.id === 'sql') {
        await rodarSql(codigo);
        escreverConsole('Execução concluída.', 'info');
    } else {
        escreverTerminal(`A execução de ${linguagemAtual.rotulo} será integrada em breve.`);
        escreverConsole('Execução no servidor (Judge0) ainda não integrada.', 'info');
    }
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
    porId('btnSophia').disabled = atividadeAtual.vazia;
    atualizarEntrega();
}

/*  Eventos  */
function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(dados)); } catch (e) {}
}

ed.addEventListener('input', () => {
    dados[atual] = ed.value;
    executadoAtual = false;
    if (resultadoAberto) $('pvStale').hidden = false;
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

document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    fecharModalEntrega();
    if (document.body.classList.contains('editor-expandido')) recolherEditor();
});
document.querySelectorAll('.aba').forEach(b => b.addEventListener('click', () => setAba(b.dataset.aba)));
$('btnLimpar').onclick = () => { con.innerHTML = ''; };

porId('btnRodar').onclick = () => {
    if (porId('btnRodar').disabled) return;
    usosExecutar++;
    atualizarContadores();
    executar({ focar: true });
};

// Voltar sempre leva à página do aluno.
porId('btnVoltar').onclick = () => { location.href = 'aluno?id=' + encodeURIComponent(atividadeAtual.id); };

document.querySelectorAll('.logo img, .sophia-avatar img').forEach(imagem => {
    const semImagem = () => imagem.parentElement.classList.add('sem-img');
    imagem.addEventListener('error', semImagem);
    if (imagem.complete && !imagem.naturalWidth) semImagem();
});

// Voltar sempre leva à página do aluno (não às páginas visitadas antes)
$('btnVoltar').onclick = () => { location.href = 'aluno' + (A.queryAluno || ''); };
$('btnEntregar').onclick = () => (entrega ? cancelarEntrega() : iniciarEntrega());
$('btnConfirmar').onclick = confirmarEntrega;
$('btnCancelarModal').onclick = fecharModalEntrega;
modalEntrega.addEventListener('click', e => { if (e.target === modalEntrega) fecharModalEntrega(); });

document.querySelectorAll('.logo img, .sophia-avatar img').forEach(img => {
    const semImagem = () => img.parentElement.classList.add('sem-img');
    img.addEventListener('error', semImagem);
    if (img.complete && !img.naturalWidth) semImagem();
});

/*Celular: o editor ocupa a tela toda enquanto o aluno digita (X para voltar ao normal)*/
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

atualizarBotoes();
setInterval(atualizarEntrega, 30000);
trocar(atual);
if (!A.vazia) setTimeout(() => sophiaFala('Oi, sou a Sophia! Estou aqui para ajudar a ver se o seu código está dentro do que a atividade pede. Se precisar, é só clicar em mim.', 6000), 600);
