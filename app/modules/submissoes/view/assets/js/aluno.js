const atividadeAtual = window.FarmAtividade;

function renderizarAtividade() {
    if (!atividadeAtual) return;
    if (atividadeAtual.vazia) {
        document.querySelectorAll('.atv-sub, .atv-meta').forEach(elemento => elemento.style.display = 'none');
        return;
    }
    const obterElemento = id => document.getElementById(id);
    const escreverTexto = (id, valor) => {
        const elemento = obterElemento(id);
        if (elemento) elemento.textContent = valor;
    };

    escreverTexto('atvTitulo', atividadeAtual.titulo);
    escreverTexto('atvDescricao', atividadeAtual.descricao);
    escreverTexto('atvLinguagem', atividadeAtual.linguagem.nome);
    escreverTexto('atvNota', `de 0 a ${atividadeAtual.notaMax} (mínima para aprovação: ${atividadeAtual.notaMin})`);

    const listaRequisitos = obterElemento('atvRequisitos');
    if (listaRequisitos) {
        listaRequisitos.innerHTML = '';
        atividadeAtual.requisitos.forEach(requisito => {
            const item = document.createElement('li');
            item.textContent = requisito;
            listaRequisitos.appendChild(item);
        });
    }

    // Leva o id da atividade para a página de execução ("Começar")
    const campoIdAtividade = obterElemento('atvInputId');
    if (campoIdAtividade) campoIdAtividade.value = atividadeAtual.id;
}
renderizarAtividade();

/* Status da entrega */
const CHAVE_ENTREGA = 'farmedu:entrega:' + atividadeAtual.chave;
const elementoStatus = document.querySelector('.status');
const textoOrientacao = document.getElementById('texto');
const botaoComecar = document.getElementById('comecar');
const elementoPrazo = document.getElementById('atvPrazo');

function lerEntrega() {
    try { return JSON.parse(localStorage.getItem(CHAVE_ENTREGA)); } catch (erro) { return null; }
}

function atualizarStatus() {
    if (atividadeAtual.vazia) {
        elementoStatus.style.display = 'none';
        elementoPrazo.hidden = true;
        textoOrientacao.style.display = 'none';
        botaoComecar.style.display = 'none';
        return;
    }
    const entrega = lerEntrega();
    const dataEntrega = entrega && new Date(entrega.data);
    const entregue = !!dataEntrega && !isNaN(dataEntrega);
    const prazoEncerrado = atividadeAtual.prazoExcedido();
    const pontoStatus = document.createElement('span');
    pontoStatus.className = 'ponto';
    elementoStatus.textContent = '';

    if (entregue) {
        elementoStatus.append(pontoStatus, ' Entregue em ' + atividadeAtual.formatarDataHora(entrega.data));
    } else {
        elementoStatus.append(pontoStatus, ' Não entregue');
    }
    elementoStatus.classList.toggle('entregue', entregue);

    // Botão: Começar, Revisar, Visualizar
    botaoComecar.classList.toggle('visualizar', prazoEncerrado);
    if (prazoEncerrado) {
        botaoComecar.textContent = 'Visualizar';
        textoOrientacao.textContent = entregue
            ? 'O prazo acabou. Clique em "Visualizar" para ver o código que você entregou.'
            : 'O prazo de entrega acabou. Você pode apenas visualizar a atividade.';
    } else if (entregue) {
        botaoComecar.textContent = 'Revisar';
        textoOrientacao.textContent = 'Atividade entregue! Clique em "Revisar" para ver o seu código.';
    } else {
        botaoComecar.textContent = 'Começar';
        textoOrientacao.textContent = 'Escreva seu código direto na plataforma clicando em "Começar".';
    }

    // Limite de entrega
    if (atividadeAtual.limite) {
        elementoPrazo.hidden = false;
        elementoPrazo.classList.toggle('encerrado', prazoEncerrado);
        elementoPrazo.textContent = prazoEncerrado
            ? 'Prazo encerrado em ' + atividadeAtual.limiteTexto()
            : 'Prazo de entrega até ' + atividadeAtual.limiteTexto();
    } else {
        elementoPrazo.hidden = true;
    }
}

atualizarStatus();
window.addEventListener('pageshow', atualizarStatus);
window.addEventListener('storage', atualizarStatus);
setInterval(atualizarStatus, 30000);

document.getElementById('btnVoltar').addEventListener('click', () => history.back());

/* Menus do cabeçalho */
const botaoIconi = document.getElementById('botaoIconi');
const botaoUsuario = document.getElementById('botaoUsuario');
const menuIconi = document.getElementById('menuIconi');
const menuUsuario = document.getElementById('menuUsuario');

function fecharMenus() {
    [menuIconi, menuUsuario].forEach(menu => {
        menu.classList.remove('active');
        menu.setAttribute('aria-hidden', 'true');
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

botaoIconi.addEventListener('click', evento => {
    evento.stopPropagation();
    alternarMenu(menuIconi, botaoIconi);
});

botaoUsuario.addEventListener('click', evento => {
    evento.stopPropagation();
    alternarMenu(menuUsuario, botaoUsuario);
});

[menuIconi, menuUsuario].forEach(menu => menu.addEventListener('click', evento => evento.stopPropagation()));

document.addEventListener('click', fecharMenus);
document.addEventListener('keydown', evento => {
    if (evento.key === 'Escape') fecharMenus();
});