/**
 * Renderização da página do aluno.
 *
 * Esse módulo recebe o objeto global `FarmAtividade` montado por `atividade.js` e o usa para
 * preencher os campos da tela com título, descrição, linguagem e requisitos.
 */
const atividadeAtual = window.FarmAtividade;

function renderizarAtividade() {
    if (!atividadeAtual) return;

    // Se a página chegou vazia, o aluno vê uma mensagem genérica em vez de estrutura quebrada.
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

    // O id da atividade é repassado ao formulário da próxima tela para que o editor carregue a atividade correta.
    const campoIdAtividade = obterElemento('atvInputId');
    if (campoIdAtividade) campoIdAtividade.value = atividadeAtual.id;
}
renderizarAtividade();

/*
 * Status da entrega:
 * a ideia é guardar no localStorage a última entrega do aluno por atividade.
 * Isso evita que a tela precise consultar o backend a cada refresh da página.
 */
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

    // A mesma CTA é reutilizada para três estados: começar, revisar e visualizar.
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
setInterval(atualizarStatus, 30000);

document.getElementById('btnVoltar').addEventListener('click', () => history.back());

