const ARQUIVOS = [
    { nome: 'index.html', lang: 'html', rotulo: 'HTML' },
    { nome: 'style.css',  lang: 'css',  rotulo: 'CSS' },
    { nome: 'script.js',  lang: 'js',   rotulo: 'JavaScript' }
];

const INICIAL = {
    html: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Minha Fazenda</title>
</head>
<body>
  <h1>Minha Fazenda</h1>
  <p>Edite o código e veja o resultado aqui ao lado.</p>
  <button id="btn">Clique aqui</button>
</body>
</html>`,
    css: `body {
  font-family: sans-serif;
  text-align: center;
  padding: 40px;
  background: #f1f8e9;
}

h1 { color: #1b5e20; }

button {
  background: #34C759;
  color: white;
  border: none;
  padding: 10px 22px;
  border-radius: 20px;
  cursor: pointer;
}`,
    js: `const btn = document.getElementById('btn');


btn.addEventListener('click', () => {
  btn.textContent = 'Cocoricó!';
  console.log('Botão clicado!');
});`
};

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
    ]
};

const $ = id => document.getElementById(id);
const ed = $('ed'), hl = $('hl'), gutter = $('gutter'), pv = $('pv'), con = $('console');
const CHAVE = 'farmedu:codigo';
const CHAVE_ENTREGA = 'farmedu:entrega';

let dados;
try {
    dados = { ...INICIAL, ...JSON.parse(localStorage.getItem(CHAVE)) };
} catch (e) {
    dados = { ...INICIAL };
}

let entrega = null;
try { entrega = JSON.parse(localStorage.getItem(CHAVE_ENTREGA)); } catch (e) {}

const pedida = new URLSearchParams(location.search).get('lang');
let atual = ARQUIVOS.some(a => a.lang === pedida) ? pedida : 'html';

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function colorir(codigo, regras) {
    const re = new RegExp(regras.map(r => '(' + r[1] + ')').join('|'), 'g');
    let saida = '', ultimo = 0, m;
    while ((m = re.exec(codigo))) {
        if (!m[0]) { re.lastIndex++; continue; }
        const i = m.slice(1).findIndex(x => x !== undefined);
        saida += esc(codigo.slice(ultimo, m.index)) +
                 `<span class="${regras[i][0]}">${esc(m[0])}</span>`;
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
    const linhas = ed.value.split('\n').length;
    gutter.textContent = Array.from({ length: linhas }, (_, i) => i + 1).join('\n');
    sincronizar();
}

function posicao() {
    const antes = ed.value.slice(0, ed.selectionStart).split('\n');
    $('stPos').textContent = `Ln ${antes.length}, Col ${antes[antes.length - 1].length + 1}`;
}

function criarItem(elemento, a, ativo) {
    elemento.className = (elemento.className.split(' ')[0] || '') + (ativo ? ' on' : '');
    elemento.title = a.nome;
    const bolinha = document.createElement('span');
    bolinha.className = 'dot dot-' + a.lang;
    const rotulo = document.createElement('span');
    rotulo.className = 'item-nome';
    rotulo.textContent = a.nome;
    elemento.appendChild(bolinha);
    elemento.appendChild(rotulo);
    elemento.onclick = () => trocar(a.lang);
    return elemento;
}

function montarAbas() {
    $('arquivos').innerHTML = '';


    ARQUIVOS.forEach(a => {
        const ativo = a.lang === atual;

        const item = document.createElement('li');
        $('arquivos').appendChild(criarItem(item, a, ativo));
    });


    $('stLang').textContent = ARQUIVOS.find(a => a.lang === atual).rotulo;
}

function trocar(lang) {
    atual = lang;
    ed.value = dados[atual];
    montarAbas();
    atualizarEditor();
    posicao();
    ed.focus();
}

const PONTE = '<script>(function(){' +
    'var s=function(t,a){parent.postMessage({farm:1,t:t,m:[].map.call(a,function(x){' +
    'try{return typeof x==="object"?JSON.stringify(x):String(x)}catch(e){return String(x)}}).join(" ")},"*")};' +
    '["log","warn","error"].forEach(function(k){var o=console[k];console[k]=function(){s(k,arguments);o.apply(console,arguments)}});' +
    'window.addEventListener("error",function(e){s("error",[e.message])});' +
    '})()<\/script>';

function executar() {
    con.innerHTML = '';
    const css = `<style>${dados.css}</style>`;
    const js = PONTE + `<script>${dados.js}<\/script>`;
    let doc = dados.html;
    doc = doc.includes('</head>') ? doc.replace('</head>', () => css + '</head>') : css + doc;
    doc = doc.includes('</body>') ? doc.replace('</body>', () => js + '</body>') : doc + js;
    pv.srcdoc = doc;
}

window.addEventListener('message', e => {
    if (e.source !== pv.contentWindow || !e.data || !e.data.farm) return;
    const linha = document.createElement('div');
    linha.className = e.data.t;
    linha.textContent = (e.data.t === 'error' ? '✖ ' : '› ') + e.data.m;
    con.appendChild(linha);
    con.scrollTop = con.scrollHeight;
});

$('btnLimpar').onclick = () => { con.innerHTML = ''; };

function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(dados)); } catch (e) {}
}

function aviso(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(aviso.t);
    aviso.t = setTimeout(() => t.classList.remove('on'), 2400);
}

function sophiaFala(msg, ms = 5000) {
    const b = $('balao');
    b.textContent = msg;
    b.classList.add('on');
    clearTimeout(sophiaFala.t);
    sophiaFala.t = setTimeout(() => b.classList.remove('on'), ms);
}

const adiar = (fn, ms) => {
    let t;
    return () => { clearTimeout(t); t = setTimeout(fn, ms); };
};
const salvarEExecutar = adiar(() => { salvar(); executar(); }, 500);

const modalEntrega = $('modalEntrega');
const LIMITE_CLICKS = 10;
const contagensBotoes = { executar: 0, sophia: 0 };
const contadorVisual = document.getElementById('contadorLimite');

function atualizarContadorVisual() {
    const executarRestante = Math.max(0, LIMITE_CLICKS - contagensBotoes.executar);
    const sophiaRestante = Math.max(0, LIMITE_CLICKS - contagensBotoes.sophia);

    const executarEl = document.getElementById('contadorExecutar');
    const sophiaEl = document.getElementById('contadorSophia');

    if (executarEl) executarEl.textContent = `${executarRestante}/${LIMITE_CLICKS}`;
    if (sophiaEl) sophiaEl.textContent = `${sophiaRestante}/${LIMITE_CLICKS}`;

    if (contadorVisual) {
        contadorVisual.classList.toggle('is-limitado', executarRestante === 0 || sophiaRestante === 0);
    }
}

function configurarLimiteDeCliques(botao, chave, acao) {
    if (!botao) return;

    const atualizarEstado = () => {
        const atingiuLimite = contagensBotoes[chave] >= LIMITE_CLICKS;
        botao.disabled = atingiuLimite;
        botao.setAttribute('aria-disabled', String(atingiuLimite));
        botao.classList.toggle('disabled', atingiuLimite);
        atualizarContadorVisual();
    };

    botao.addEventListener('click', () => {
        if (botao.disabled) return;

        const totalDepois = (contagensBotoes[chave] || 0) + 1;
        if (totalDepois > LIMITE_CLICKS) {
            botao.disabled = true;
            atualizarEstado();
            return;
        }

        contagensBotoes[chave] = totalDepois;
        if (acao) acao();
        atualizarEstado();
    });

    atualizarEstado();
}
// 
function formatarData(iso) {
    return new Date(iso).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
}

function atualizarEntrega() {
    const entregue = !!entrega;
    ed.readOnly = entregue;
    $('chipEntrega').hidden = !entregue;
    if (entregue) $('chipEntrega').textContent = '✔ Entregue em ' + formatarData(entrega.data);
    $('btnEntregar').textContent = entregue ? 'Cancelar entrega' : 'Entregar atividade';
    $('btnEntregar').className = entregue ? 'btn btn-cinza' : 'btn btn-verde';
}

function abrirModalEntrega() {
    const vazio = ARQUIVOS.every(a => !dados[a.lang].trim());
    if (vazio) {
        aviso('Escreva algum código antes de entregar');
        return;
    }
    $('resumoEntrega').innerHTML = '';
    ARQUIVOS.forEach(a => {
        const linhas = dados[a.lang].trim() ? dados[a.lang].split('\n').length : 0;
        const li = document.createElement('li');
        const bolinha = document.createElement('span');
        bolinha.className = 'dot dot-' + a.lang;
        li.appendChild(bolinha);
        li.appendChild(document.createTextNode(`${a.nome} — ${linhas} ${linhas === 1 ? 'linha' : 'linhas'}`));
        $('resumoEntrega').appendChild(li);
    });
    modalEntrega.classList.add('active');
    $('btnConfirmar').focus();
}

function fecharModalEntrega() {
    modalEntrega.classList.remove('active');
}

function confirmarEntrega() {
    salvar();
    entrega = { data: new Date().toISOString(), arquivos: { ...dados } };
    try { localStorage.setItem(CHAVE_ENTREGA, JSON.stringify(entrega)); } catch (e) {}
    
    fecharModalEntrega();
    atualizarEntrega();
    sophiaFala('Atividade entregue! Em breve eu te mando o feedback por aqui.', 6000);
}

function cancelarEntrega() {
    entrega = null;
    try { localStorage.removeItem(CHAVE_ENTREGA); } catch (e) {}
    atualizarEntrega();
    aviso('Entrega cancelada. Você já pode editar de novo.');
}

ed.addEventListener('input', () => {
    dados[atual] = ed.value;
    atualizarEditor();
    posicao();
    salvarEExecutar();
});

ed.addEventListener('scroll', sincronizar);
ed.addEventListener('click', posicao);
ed.addEventListener('keyup', posicao);

ed.addEventListener('keydown', e => {
    if (e.key === 'Tab' && !ed.readOnly) {
        e.preventDefault();
        ed.setRangeText('  ', ed.selectionStart, ed.selectionEnd, 'end');
        ed.dispatchEvent(new Event('input'));
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        salvar();
        executar();
        aviso('Código salvo');
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        executar();
    }
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') fecharModalEntrega();
});

configurarLimiteDeCliques($('btnRodar'), 'executar', executar);
$('btnVoltar').onclick = () => {
    if (document.referrer) {
        location.href = document.referrer;
    } else if (history.length > 1) {
        history.back();
    } else {
        location.href = 'aluno'
    }
};
$('btnEntregar').onclick = () => (entrega ? cancelarEntrega() : abrirModalEntrega());
$('btnConfirmar').onclick = confirmarEntrega;
$('btnCancelarModal').onclick = fecharModalEntrega;
modalEntrega.addEventListener('click', e => { if (e.target === modalEntrega) fecharModalEntrega(); });
configurarLimiteDeCliques($('btnSophia'), 'sophia', () => sophiaFala('Oi, eu sou a Sophia! Escreva seu código e entregue quando terminar.'));

document.querySelectorAll('.logo img, .sophia-avatar img').forEach(img => {
    const semImagem = () => img.parentElement.classList.add('sem-img');
    img.addEventListener('error', semImagem);
    if (img.complete && !img.naturalWidth) semImagem();
});

atualizarEntrega();
trocar(atual);
executar();
setTimeout(() => sophiaFala('Oi, eu sou a Sophia! Bora codar?', 4500), 600);
