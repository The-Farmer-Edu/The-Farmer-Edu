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
try { entrega = JSON.parse(localStorage.getItem(CHAVE_ENTREGA)); } catch (e) {}
let cancelamentos = 0;
try { cancelamentos = Number(localStorage.getItem(CHAVE_CANCELAMENTOS)) || 0; } catch (e) {}

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
let enviando = false;
let avaliacaoSeq = 0;
const usos = { executar: 0, sophia: 0 };
// Erros da última execução: só valem enquanto o código não mudou depois dela
const errosAtuais = () => (executadoAtual ? errosConsole : []);
// "Foto" do código + erros: a Sophia usa para saber se o aluno mexeu no código depois da pergunta
const assinaturaDoCodigo = () => contextoEntrega().codigo + '\u0000' + JSON.stringify(errosAtuais());

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
    atualizarBtnInicio();
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

/*Lê a resposta do servidor como JSON (igual a response.json()), mas se o PHP imprimiu avisos em HTML
  antes do JSON, aproveita o JSON. Sem JSON, devolve a mensagem do servidor de forma legível.*/
function lerJson(texto) {
    try { return JSON.parse(texto); } catch (e) {}
    // tira avisos do PHP no formato <br /><b>Warning</b>: ... <br />
    const limpo = texto.replace(/<br\s*\/?>\s*<b>[^<]*<\/b>:[\s\S]*?<br\s*\/?>/gi, '').trim();
    try { return JSON.parse(limpo); } catch (e) {}
    // último recurso: começa no primeiro { ou [ que forme um JSON válido
    let tentativas = 0;
    for (const m of texto.matchAll(/[\[{]/g)) {
        if (++tentativas > 20) break;
        try { return JSON.parse(texto.slice(m.index)); } catch (e) {}
    }
    const legivel = texto.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim().slice(0, 700);
    throw new Error(legivel || 'resposta vazia');
}

/*Erro impresso pelo próprio PHP do servidor (aviso/erro fatal), e não uma página qualquer*/
const erroDoPHP = texto => /<b>\s*(Warning|Fatal error|Notice|Parse error|Deprecated)\s*<\/b>|Fatal error:|Warning:|Uncaught/i.test(texto);

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

/*Terminal (Python/PHP): envia o código ao servidor, que executa no Judge0 e avalia com a IA (como no exemplo
  sendAvaliacao). A resposta do Judge0 (compilacao) aparece no console; a avaliação fica guardada para a Sophia.*/
async function rodarTerminal() {
    pv.hidden = true;
    pvPy.hidden = false;
    const arq = ARQUIVOS[0];
    pvPy.textContent = `$ ${arq.nome}\nExecutando...`;
    escreverConsole('Enviando o código para executar no Judge0...', 'info');
    const codigoEnviado = contextoEntrega().codigo;
    try {
        const f = FEEDBACK.interpretar(await avaliarNoServidor());
        ultimaResposta = { codigo: codigoEnviado, f };
        const saida = String(f.saida || '').trim();
        const aceito = !f.compilador || /accepted|aceito/i.test(f.compilador);
        pvPy.textContent = `$ ${arq.nome}\n` + (saida || '(sem saída)');
        escreverConsole(`Judge0: ${f.compilador || 'sem status'}`, aceito ? 'info' : 'error');
        if (saida) escreverConsole('Saída: ' + saida, aceito ? 'log' : 'error');
        if (!aceito) {
            // erro de compilação/execução: vai para a Sophia e para a IA
            errosConsole.push((saida || String(f.compilador)).slice(0, 300));
        } else if (typeof A.saidaEsperada === 'string') {
            // se a atividade tiver "saidaEsperada", compara com o que o código imprimiu
            const esperado = A.saidaEsperada.trim();
            const ok = saida === esperado;
            escreverConsole(ok ? '✔ Saída confere com o esperado'
                               : '✖ Saída diferente. Esperado: ' + esperado, ok ? 'info' : 'error');
            if (!ok) errosConsole.push(`A saída foi "${saida}", mas o esperado é "${esperado}".`);
        }
    } catch (e) {
        pvPy.textContent = `$ ${arq.nome}\nNão foi possível executar agora.`;
        escreverConsole('Falha ao falar com o servidor: ' + e.message, 'error');
    }
}

async function executar(opcoes = {}) {
    if (executando) return;
    executando = true;
    atualizarBotoes();
    con.innerHTML = '';
    errosConsole = [];
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
    if (e.data.t === 'error') errosConsole.push(e.data.m);
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
    endpoints: ['feedback_ia/sendAvaliacao'],
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

/*Usada pela Sophia e pela entrega: reaproveita a resposta da última execução se o código não mudou*/
async function consultarIA(extra = {}) {
    if (ultimaResposta && ultimaResposta.codigo === contextoEntrega().codigo) return ultimaResposta.f;
    return FEEDBACK.interpretar(await avaliarNoServidor(extra));
}

async function consultarIAcomFallback(extra) {
    try {
        return await consultarIA(extra);
    } catch (erro) {
        console.warn('IA indisponível:', erro);
        if (FEEDBACK.usarExemploSeFalhar) return { ...FEEDBACK.interpretar(FEEDBACK.exemplo()), exemplo: true };
        throw erro;
    }
}

function temProblema(f) {
    const aceito = !f.compilador || /accepted|aceito/i.test(f.compilador);
    const aprovado = !f.status || /^aprovado$/i.test(String(f.status).trim());
    return !aceito || !aprovado || errosAtuais().length > 0 || f.faltando.length > 0;
}

function habilitarConsole(ligado) {
    const inp = $('conInput');
    inp.disabled = !ligado;
    $('conForm').classList.toggle('ativo', ligado);
    if (ligado) inp.focus();
}

function perguntarAjuda() {
    ajuda.aguardando = true;
    mostrarResultado(true);
    const msg = 'Encontrei algum problema no seu código. Quer a minha ajuda? Digite sim ou não no console.';
    sophiaFala(msg, 0);
    escreverConsole('Sophia: ' + msg, 'sophia-msg');
    habilitarConsole(true);
}

const normalizar = t => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[.!?,]/g, '').trim();

function responderSophia(texto) {
    escreverConsole('› ' + texto, 'voce');
    if (!ajuda.aguardando) return;
    if (assinaturaDoCodigo() !== ajuda.assinatura) {
        ajuda.aguardando = false;
        habilitarConsole(false);
        escreverConsole('Sophia: Você mexeu no código. Clique em mim de novo para eu olhar outra vez.', 'sophia-msg');
        return;
    }
    const r = normalizar(texto);
    if (['sim', 's', 'quero', 'claro', 'pode', 'yes'].includes(r)) {
        ajuda.aguardando = false;
        habilitarConsole(false);
        escreverConsole('Sophia: Pronto! Minha ajuda está no balão.', 'sophia-msg');
        sophiaMostrarAjuda(ajuda.dados, true);
    } else if (['nao', 'n', 'agora nao', 'no'].includes(r)) {
        ajuda.aguardando = false;
        habilitarConsole(false);
        escreverConsole('Sophia: Tudo bem! Se precisar, é só clicar em mim.', 'sophia-msg');
        sophiaFala('Tudo bem! Se precisar, é só clicar em mim de novo.', 5000);
    } else {
        escreverConsole('Sophia: Não entendi. Digite sim ou não.', 'sophia-msg');
    }
}

/*Na entrega a IA avalia em segundo plano: a nota fica guardada e NÃO é mostrada agora*/
async function enviarParaAvaliacao() {
    const seq = ++avaliacaoSeq;
    enviando = true;
    try {
        const r = await consultarIAcomFallback({ erros_execucao: errosAtuais() });
        if (seq !== avaliacaoSeq) return;
        try {
            localStorage.setItem(CHAVE_AVALIACAO, JSON.stringify({
                nota: r.nota, status: r.status, feedback: r.feedback, melhorias: r.melhorias,
                feitos: r.feitos, faltando: r.faltando, exemplo: !!r.exemplo, data: new Date().toISOString()
            }));
        } catch (e) {}
    } catch (erro) {
        console.warn('Não foi possível avaliar a entrega agora:', erro);
    }
    if (seq === avaliacaoSeq) enviando = false;
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
        if (ed.readOnly) return;
        salvar();
        aviso('Código salvo');
    }
});

document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    fecharModalEntrega();
    if (document.body.classList.contains('editor-expandido')) recolherEditor();
});
document.querySelectorAll('.aba').forEach(b => b.addEventListener('click', () => setAba(b.dataset.aba)));
$('btnLimpar').onclick = () => { con.innerHTML = ''; };

$('btnRodar').onclick = () => {
    if ($('btnRodar').disabled) return;
    usos.executar++;
    atualizarContadores();
    executar({ focar: true });
};

$('btnSophia').onclick = async () => {
    if ($('btnSophia').disabled) return;

    if (ajuda.analisando) return sophiaFala('Calma, ainda estou olhando o seu código...', 3000);
    if (ajuda.aguardando) {
        if (assinaturaDoCodigo() === ajuda.assinatura) {
            // nada mudou desde a pergunta: só lembra
            mostrarResultado(true);
            habilitarConsole(true);
            return sophiaFala('Quer a minha ajuda? Digite sim ou não no console.', 0);
        }
        // o aluno mexeu no código: a pergunta antiga não vale mais, olha de novo
        ajuda.aguardando = false;
        habilitarConsole(false);
    }
    if (ARQUIVOS.every(a => !dados[a.lang].trim())) {
        return sophiaFala('Escreva um pouco de código e clique em mim de novo!', 4000);
    }

    usos.sophia++;
    atualizarBotoes();
    ajuda.analisando = true;
    ajuda.assinatura = assinaturaDoCodigo();
    sophiaFala('Deixa eu olhar o seu código...', 0);
    try {
        ajuda.dados = await consultarIAcomFallback({ erros_execucao: errosAtuais() });
        if (temProblema(ajuda.dados)) {
            perguntarAjuda();
        } else {
            escreverConsole('Sophia: Código sem erros!', 'sophia-msg');
            sophiaMostrarAjuda(ajuda.dados, false);
        }
    } catch (erro) {
        sophiaFala('Não consegui analisar agora. Tente novamente mais tarde.', 6000);
    } finally {
        ajuda.analisando = false;
    }
};

$('conForm').addEventListener('submit', e => {
    e.preventDefault();
    const texto = $('conInput').value.trim();
    $('conInput').value = '';
    if (texto) responderSophia(texto);
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

atualizarBotoes();
setInterval(atualizarEntrega, 30000);
trocar(atual);
if (!A.vazia) setTimeout(() => sophiaFala('Oi, sou a Sophia! Estou aqui para ajudar a ver se o seu código está dentro do que a atividade pede. Se precisar, é só clicar em mim.', 6000), 600);
