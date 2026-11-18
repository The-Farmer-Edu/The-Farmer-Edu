function renderizarAtividade() {
    const atividadeAtual = window.FarmAtividade;
    if (!atividadeAtual) return;
    if (atividadeAtual.vazia) {
        // sem atividade: deixa os quadros em branco
        document.querySelectorAll('.atv-sub, .atv-meta').forEach(e => e.style.display = 'none');
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

    // O id da atividade é repassado ao formulário da próxima tela para que o editor carregue a atividade correta.
    const campoIdAtividade = obterElemento('atvInputId');
    if (campoIdAtividade) campoIdAtividade.value = atividadeAtual.id;
}
renderizarAtividade();

/*  Status da entrega, prazo e botão principal  */
// A entrega é guardada por atividade
const CHAVE_ENTREGA = 'farmedu:entrega:' + window.FarmAtividade.chave;
const elementoStatus = document.querySelector('.status');
const textoOrientacao = document.getElementById('texto');
const botaoComecar = document.getElementById('comecar');
const elementoPrazo = document.getElementById('atvPrazo');

function lerEntrega() {
    try { return JSON.parse(localStorage.getItem(CHAVE_ENTREGA)); } catch (erro) { return null; }
}

function atualizarStatus() {
    const atividadeAtual = window.FarmAtividade;
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

    // A mesma CTA é reutilizada para três estados: começar, revisar e visualizar.
    // O texto muda conforme o tipo: atividade de texto fala em "resposta", as demais em "código".
    const conteudo = atividadeAtual.idLinguagem === 'texto' ? 'sua resposta' : 'seu código';
    botaoComecar.classList.toggle('visualizar', prazoEncerrado);
    if (prazoEncerrado) {
        botaoComecar.textContent = 'Visualizar';
        textoOrientacao.textContent = entregue
            ? `O prazo acabou. Clique em "Visualizar" para ver ${conteudo} entregue.`
            : 'O prazo de entrega acabou. Você pode apenas visualizar a atividade.';
    } else if (entregue) {
        botaoComecar.textContent = 'Revisar';
        textoOrientacao.textContent = `Atividade entregue! Clique em "Revisar" para ver ${conteudo}.`;
    } else {
        botaoComecar.textContent = 'Começar';
        textoOrientacao.textContent = `Escreva ${conteudo} direto na plataforma clicando em "Começar".`;
    }

    // Exibe o prazo da atividade, se existir, com estilo diferente quando acabou.
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
