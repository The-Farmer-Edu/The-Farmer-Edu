function renderizarAtividade() {
    const A = window.FarmAtividade;
    if (!A) return;
    document.getElementById('atvTitulo').textContent = A.titulo;
    document.getElementById('atvDescricao').textContent = A.descricao;
    const lista = document.getElementById('atvRequisitos');
    lista.innerHTML = '';
    A.requisitos.forEach(r => {
        const li = document.createElement('li');
        li.textContent = r;
        lista.appendChild(li);
    });
    document.getElementById('atvLinguagem').textContent = A.linguagem.nome;
    document.getElementById('atvNota').textContent = `de 0 a ${A.notaMax} (mínima para aprovação: ${A.notaMin})`;
    document.getElementById('atvInputId').value = A.id;
    const cores = { HTML5: 'badge-html', CSS3: 'badge-css', JS: 'badge-js' };
    const box = document.getElementById('atvBadges');
    box.innerHTML = '';
    A.linguagem.badges.forEach(b => {
        const s = document.createElement('span');
        s.className = 'badge-padrao ' + (cores[b] || 'badge-outra');
        s.textContent = b;
        box.appendChild(s);
    });
}
renderizarAtividade();

const CHAVE_ENTREGA = 'farmedu:entrega';
const status = document.querySelector('.status');
const texto = document.getElementById('texto');
const botaoComecar = document.getElementById('comecar');
function lerEntrega() {
    try { return JSON.parse(localStorage.getItem(CHAVE_ENTREGA)); } catch (e) { return null; }
}

function atualizarStatus() {
    const entrega = lerEntrega();
    const data = entrega && new Date(entrega.data);
    const entregue = !!data && !isNaN(data);

    const ponto = document.createElement('span');
    ponto.className = 'ponto';
    status.textContent = '';

    if (entregue) {
        const quando = data.toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
        });
        status.append(ponto, ' Entregue em ' + quando);
        texto.textContent = 'Atividade entregue! Clique em "Revisar" para ver o seu código.';
        botaoComecar.textContent = 'Revisar';
    } else {
        status.append(ponto, ' Não entregue');
        texto.textContent = 'Escreva seu código direto na plataforma clicando em "Começar".';
        botaoComecar.textContent = 'Começar';
    }
    status.classList.toggle('entregue', entregue);
}

atualizarStatus();
window.addEventListener('pageshow', atualizarStatus);  
window.addEventListener('storage', atualizarStatus);  

document.getElementById('btnVoltar').addEventListener('click', () => history.back());

const balao = document.getElementById('balao');
let timer;

document.getElementById('btnGalinha').addEventListener('click', () => {
    const frases = [
        'Cocoricó!',
        'Dica: um passo de cada vez 🌱',
        'Errou? Faz parte, tenta de novo!',
        'Clique em "' + botaoComecar.textContent + '" 👆'
    ];
    balao.textContent = frases[Math.floor(Math.random() * frases.length)];
    balao.classList.add('on');
    clearTimeout(timer);
    timer = setTimeout(() => balao.classList.remove('on'), 2800);
});