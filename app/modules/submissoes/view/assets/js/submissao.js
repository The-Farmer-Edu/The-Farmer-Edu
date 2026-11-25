// Entrega da atividade: modal, cancelamento, contadores de limite e localStorage.
// Este módulo coordena a última etapa do fluxo: o aluno valida o código, confirma a entrega e o sistema
// grava um snapshot no navegador para representar a entrega concluída.
const modalEntrega = porId('modalEntrega');

function atualizarContadores() {
    const execucoesRestantes = Math.max(0, LIMITE_EXECUCOES - usosExecutar);
    const sophiaRestantes = Math.max(0, LIMITE_SOPHIA - usosSophia);
    const cancelamentosRestantes = Math.max(0, LIMITE_CANCELAMENTOS - cancelamentos);
    porId('contadorExecutar').textContent = `${execucoesRestantes}/${LIMITE_EXECUCOES}`;
    porId('contadorSophia').textContent = `${sophiaRestantes}/${LIMITE_SOPHIA}`;
    porId('contadorCancelar').textContent = `${cancelamentosRestantes}/${LIMITE_CANCELAMENTOS}`;
    porId('contadorLimite').classList.toggle('is-limitado',
        execucoesRestantes === 0 || sophiaRestantes === 0 || cancelamentosRestantes === 0);
}

function atualizarEntrega() {
    const entregue = !!entrega;
    const prazoEncerrado = atividadeAtual.prazoExcedido();
    const entregaFinal = entregue && cancelamentos >= LIMITE_CANCELAMENTOS;

   editorTexto.readOnly = entregue || prazoEncerrado || atividadeAtual.vazia || MODO_INSTRUTOR;

    porId('chipEntrega').hidden = !entregue;
    if (entregue) porId('chipEntrega').textContent = '✔ Entregue em ' + atividadeAtual.formatarDataHora(entrega.data);

    // Limite de entrega: a interface usa o mesmo critério do backend para bloquear entrega após o prazo.
    porId('chipPrazo').hidden = !atividadeAtual.limite;
    porId('chipPrazo').classList.toggle('encerrado', prazoEncerrado);
    porId('chipPrazo').textContent = prazoEncerrado
        ? 'Prazo encerrado em ' + atividadeAtual.limiteTexto()
        : 'Prazo para entregar até ' + atividadeAtual.limiteTexto();

    const botaoEntregar = porId('btnEntregar');
    botaoEntregar.disabled = atividadeAtual.vazia || entregaFinal || prazoEncerrado || (!entregue && executando);
    botaoEntregar.textContent = prazoEncerrado ? 'Prazo encerrado'
        : entregaFinal ? 'Entrega final'
        : entregue ? 'Cancelar entrega' : 'Entregar atividade';
    botaoEntregar.className = entregue || prazoEncerrado ? 'btn btn-cinza' : 'btn btn-verde';
    atualizarContadores();
}

function abrirModalEntrega() {
    // Texto do modal muda conforme o tipo da atividade
    document.querySelector('#modalEntrega .modal-card p').textContent = modoExecucao === 'texto'
        ? 'Você vai entregar esta resposta:'
        : 'Você viu o resultado e vai entregar estes arquivos:';

    porId('resumoEntrega').innerHTML = '';
    ARQUIVOS.forEach(arquivo => {
        const totalLinhas = dadosDosArquivos[arquivo.lang].trim() ? dadosDosArquivos[arquivo.lang].split('\n').length : 0;
        const item = document.createElement('li');
        const bolinha = document.createElement('span');
        bolinha.className = 'dot dot-' + arquivo.lang;
        item.append(bolinha, `${arquivo.nome} — ${totalLinhas} ${totalLinhas === 1 ? 'linha' : 'linhas'}`);
        porId('resumoEntrega').appendChild(item);
    });
    const cancelamentosRestantes = LIMITE_CANCELAMENTOS - cancelamentos;
    porId('avisoCancelar').textContent = cancelamentosRestantes > 0
        ? `Depois de entregar, você poderá cancelar a entrega mais ${cancelamentosRestantes} ${cancelamentosRestantes === 1 ? 'vez' : 'vezes'}.`
        : 'Seus cancelamentos acabaram: esta entrega será final.';
    modalEntrega.classList.add('active');
    porId('btnConfirmar').focus();
}

const fecharModalEntrega = () => modalEntrega.classList.remove('active');

/* Antes de confirmar, o aluno sempre vê como ficou */
async function iniciarEntrega() {
    if (atividadeAtual.prazoExcedido()) return aviso('O prazo de entrega acabou');
    if (ARQUIVOS.every(arquivo => !dadosDosArquivos[arquivo.lang].trim())) {
        return aviso(modoExecucao === 'texto' ? 'Escreva sua resposta antes de entregar' : 'Escreva algum código antes de entregar');
    }
    salvar();
    if (modoExecucao !== 'texto') {
        if (!resultadoAberto || !executadoAtual) {
            aviso('Vamos ver como ficou antes de confirmar a entrega');
            await executar({ focar: true });
            await esperar(900);
        } else if (ehCelular()) {
            setAba('resultado');
        }
    }
    abrirModalEntrega();
}

// monta o texto que será gravado em submissoes.conteudo_resposta
// - atividade de texto ou linguagem com 1 arquivo: o próprio conteúdo
// - atividade Web (html/css/js): os 3 arquivos em JSON
function montarConteudoResposta() {
    if (ARQUIVOS.length === 1) return dadosDosArquivos[ARQUIVOS[0].lang] || '';
    return JSON.stringify(dadosDosArquivos);
}

// envia a resolução ao servidor (rota salvarResolucao)
// Com diagnóstico: mostra no console (F12) o status e a resposta crua do servidor.
async function salvarResolucaoNoBanco() {
    try {
        const resposta = await fetch('salvarResolucao', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_atividade: atividadeAtual.id,
                conteudo: montarConteudoResposta()
            })
        });

        const textoBruto = await resposta.text();
        console.log('STATUS:', resposta.status, '| RESPOSTA:', textoBruto);

        let resultado;
        try {
            resultado = JSON.parse(textoBruto);
        } catch (erro) {
            aviso('O servidor não devolveu JSON (status ' + resposta.status + ')');
            return false;
        }

        if (!resultado.sucesso) {
            aviso(resultado.erro || 'Não foi possível salvar a entrega');
            return false;
        }
        return true;
    } catch (erro) {
        console.error(erro);
        aviso('Erro de conexão ao salvar a entrega');
        return false;
    }
}

//agora é async e só marca como entregue se o banco confirmar
async function confirmarEntrega() {
    if (atividadeAtual.prazoExcedido()) { fecharModalEntrega(); return aviso('O prazo de entrega acabou'); }
    salvar();

    // grava no banco antes de marcar como entregue
    const botao = porId('btnConfirmar');
    botao.disabled = true;
    const salvou = await salvarResolucaoNoBanco();
    botao.disabled = false;
    if (!salvou) return; // mantém o modal aberto para tentar de novo

    entrega = {
        data: new Date().toISOString(),
        atividadeId: atividadeAtual.id,
        linguagem: linguagemAtual.id,
        arquivos: { ...dadosDosArquivos }
    };
    try { localStorage.setItem(CHAVE_ENTREGA, JSON.stringify(entrega)); } catch (erro) {}
    fecharModalEntrega();
    atualizarEntrega();
    sophiaFala('Atividade entregue!', 6000);
}

function cancelarEntrega() {
    if (atividadeAtual.prazoExcedido()) return aviso('O prazo acabou: a entrega não pode mais ser cancelada');
    if (cancelamentos >= LIMITE_CANCELAMENTOS) return aviso('Você já usou os 3 cancelamentos. A entrega é final.');
    cancelamentos++;
    try { localStorage.setItem(CHAVE_CANCELAMENTOS, String(cancelamentos)); } catch (erro) {}
    entrega = null;
    try { localStorage.removeItem(CHAVE_ENTREGA); } catch (erro) {}
    atualizarEntrega();
    aviso(`Entrega cancelada. Cancelamentos restantes: ${LIMITE_CANCELAMENTOS - cancelamentos}/${LIMITE_CANCELAMENTOS}`);
}

porId('btnEntregar').onclick = () => (entrega ? cancelarEntrega() : iniciarEntrega());
porId('btnConfirmar').onclick = confirmarEntrega;
porId('btnCancelarModal').onclick = fecharModalEntrega;
modalEntrega.addEventListener('click', evento => { if (evento.target === modalEntrega) fecharModalEntrega(); });