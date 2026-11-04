function renderizarAtividade() {
    const A = window.FarmAtividade;
    if (!A) return;
    const el = id => document.getElementById(id);
    const escrever = (id, valor) => { const e = el(id); if (e) e.textContent = valor; };

    escrever('atvTitulo', A.titulo);
    escrever('atvDescricao', A.descricao);
    escrever('atvLinguagem', A.linguagem.nome);
    escrever('atvNota', `de 0 a ${A.notaMax} (mínima para aprovação: ${A.notaMin})`);

    const lista = el('atvRequisitos');
    if (lista) {
        lista.innerHTML = '';
        A.requisitos.forEach(r => {
            const li = document.createElement('li');
            li.textContent = r;
            lista.appendChild(li);
        });
    }

    const inputId = el('atvInputId');
    if (inputId) inputId.value = A.id;

    const box = el('atvBadges');
    if (box) {
        const cores = { HTML5: 'badge-html', CSS3: 'badge-css', JS: 'badge-js' };
        box.innerHTML = '';
        A.linguagem.badges.forEach(b => {
            const sp = document.createElement('span');
            sp.className = 'badge-padrao ' + (cores[b] || 'badge-outra');
            sp.textContent = b;
            box.appendChild(sp);
        });
    }
}
renderizarAtividade();

/*  Status da entrega, prazo e botão principal  */
// A entrega é guardada por atividade
const CHAVE_ENTREGA = 'farmedu:entrega:' + window.FarmAtividade.chave;
const status = document.querySelector('.status');
const texto = document.getElementById('texto');
const botaoComecar = document.getElementById('comecar');
const prazoEl = document.getElementById('atvPrazo');

function lerEntrega() {
    try { return JSON.parse(localStorage.getItem(CHAVE_ENTREGA)); } catch (e) { return null; }
}

function atualizarStatus() {
    const A = window.FarmAtividade;
    const entrega = lerEntrega();
    const data = entrega && new Date(entrega.data);
    const entregue = !!data && !isNaN(data);
    const encerrado = A.prazoExcedido();

    const ponto = document.createElement('span');
    ponto.className = 'ponto';
    status.textContent = '';

    if (entregue) {
        const quando = data.toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
        });
        status.append(ponto, ' Entregue em ' + quando);
    } else {
        status.append(ponto, ' Não entregue');
    }
    status.classList.toggle('entregue', entregue);

    // Botão e texto: Começar, Revisar, Visualizar
    botaoComecar.classList.toggle('visualizar', encerrado);
    if (encerrado) {
        botaoComecar.textContent = 'Visualizar';
        texto.textContent = entregue
            ? 'O prazo acabou. Clique em "Visualizar" para ver o código que você entregou.'
            : 'O prazo de entrega acabou. Você pode apenas visualizar a atividade.';
    } else if (entregue) {
        botaoComecar.textContent = 'Revisar';
        texto.textContent = 'Atividade entregue! Clique em "Revisar" para ver o seu código.';
    } else {
        botaoComecar.textContent = 'Começar';
        texto.textContent = 'Escreva seu código direto na plataforma clicando em "Começar".';
    }

    // Limite de entrega
    if (A.limite) {
        prazoEl.hidden = false;
        prazoEl.classList.toggle('encerrado', encerrado);
        prazoEl.textContent = encerrado
            ? 'Prazo encerrado em ' + A.limiteTexto()
            : 'Prazo de entrega até ' + A.limiteTexto();
    } else {
        prazoEl.hidden = true;
    }
}

atualizarStatus();
window.addEventListener('pageshow', atualizarStatus);
window.addEventListener('storage', atualizarStatus);
setInterval(atualizarStatus, 30000); // vira "Visualizar" sozinho quando o prazo vence

document.getElementById('btnVoltar').addEventListener('click', () => history.back());

/*  Menus do cabeçalho */
const botaoIconi = document.getElementById('botaoIconi');
const botaoUsuario = document.getElementById('botaoUsuario');
const menuIconi = document.getElementById('menuIconi');
const menuUsuario = document.getElementById('menuUsuario');

function fecharMenus() {
    [menuIconi, menuUsuario].forEach(m => {
        m.classList.remove('active');
        m.setAttribute('aria-hidden', 'true');
    });
    botaoIconi.setAttribute('aria-expanded', 'false');
    botaoUsuario.setAttribute('aria-expanded', 'false');
}

function alternarMenu(menu, botao) {
    const vaiAbrir = !menu.classList.contains('active');
    fecharMenus();
    if (vaiAbrir) {
        menu.classList.add('active');
        menu.setAttribute('aria-hidden', 'false');
        botao.setAttribute('aria-expanded', 'true');
    }
}

botaoIconi.addEventListener('click', (e) => {
    e.stopPropagation();
    alternarMenu(menuIconi, botaoIconi);
});

botaoUsuario.addEventListener('click', (e) => {
    e.stopPropagation();
    alternarMenu(menuUsuario, botaoUsuario);
});

// Clicar dentro do menu não fecha por engano
[menuIconi, menuUsuario].forEach(m => m.addEventListener('click', e => e.stopPropagation()));

// Clicar fora ou apertar Esc fecha
document.addEventListener('click', fecharMenus);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fecharMenus();
});