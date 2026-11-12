// Entrega da atividade: modal, cancelamento, contadores de limite e localStorage.
const modalEntrega = porId('modalEntrega');

function atualizarContadores() {
    const execucoesRestantes = Math.max(0, LIMITE_EXECUCOES - usosExecutar);
    const cancelamentosRestantes = Math.max(0, LIMITE_CANCELAMENTOS - cancelamentos);
    porId('contadorExecutar').textContent = `${execucoesRestantes}/${LIMITE_EXECUCOES}`;
    porId('contadorCancelar').textContent = `${cancelamentosRestantes}/${LIMITE_CANCELAMENTOS}`;
    porId('contadorLimite').classList.toggle('is-limitado', execucoesRestantes === 0 || cancelamentosRestantes === 0);
}

function atualizarEntrega() {
    const entregue = !!entrega;
    const prazoEncerrado = atividadeAtual.prazoExcedido();
    const entregaFinal = entregue && cancelamentos >= LIMITE_CANCELAMENTOS;

    editorTexto.readOnly = entregue || prazoEncerrado || atividadeAtual.vazia;

    porId('chipEntrega').hidden = !entregue;
    if (entregue) porId('chipEntrega').textContent = '✔ Entregue em ' + atividadeAtual.formatarDataHora(entrega.data);

    // Limite de entrega
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
    if (ARQUIVOS.every(arquivo => !dadosDosArquivos[arquivo.lang].trim())) return aviso('Escreva algum código antes de entregar');
    salvar();
    if (!resultadoAberto || !executadoAtual) {
        aviso('Vamos ver como ficou antes de confirmar a entrega');
        await executar({ focar: true });
        await esperar(900);
    } else if (ehCelular()) {
        setAba('resultado');
    }
    abrirModalEntrega();
}

function confirmarEntrega() {
    if (atividadeAtual.prazoExcedido()) { fecharModalEntrega(); return aviso('O prazo de entrega acabou'); }
    salvar();
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