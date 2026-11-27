// Entrega da atividade: modal, cancelamento, contadores de limite e sincronização com o BD.
// Todas as contagens de entrega/cancelamento e os bloqueios de botões usam o banco de dados
// como fonte da verdade; o localStorage atua apenas como cache auxiliar.
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
    const prazoEncerrado = atividadeAtual.prazoExcedido();

    // No modo instrutor, exibe o status da última submissão ativa do aluno no BD e mantém somente leitura.
    if (MODO_INSTRUTOR) {
        const sub = atividadeAtual.submissao;
        editorTexto.readOnly = true;
        porId('chipEntrega').hidden = false;
        porId('chipEntrega').textContent = sub && sub.dataEnvio
            ? `✔ Última entrega em ${atividadeAtual.formatarDataHora(sub.dataEnvio)} (Tentativa #${sub.tentativa})`
            : 'Sem entrega ativa';

        porId('chipPrazo').hidden = !atividadeAtual.limite;
        porId('chipPrazo').classList.toggle('encerrado', prazoEncerrado);
        porId('chipPrazo').textContent = prazoEncerrado
            ? 'Prazo encerrado em ' + atividadeAtual.limiteTexto()
            : 'Prazo para entregar até ' + atividadeAtual.limiteTexto();
        return;
    }

    const entregue = !!entrega;
    const entregaFinal = entregue && cancelamentos >= LIMITE_CANCELAMENTOS;

    editorTexto.readOnly = entregue || prazoEncerrado || atividadeAtual.vazia;

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
    const cancelamentosRestantes = Math.max(0, LIMITE_CANCELAMENTOS - cancelamentos);
    porId('avisoCancelar').textContent = cancelamentosRestantes > 0
        ? `Depois de entregar, você poderá cancelar a entrega mais ${cancelamentosRestantes} ${cancelamentosRestantes === 1 ? 'vez' : 'vezes'}.`
        : 'Seus cancelamentos acabaram: esta entrega será final.';
    modalEntrega.classList.add('active');
    porId('btnConfirmar').focus();
}

const fecharModalEntrega = () => modalEntrega.classList.remove('active');

/* Antes de confirmar, o aluno sempre vê como ficou */
async function iniciarEntrega() {
    if (MODO_INSTRUTOR) return;
    if (entrega) return aviso('Você já possui uma entrega ativa');
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

// Monta o texto que será gravado em submissoes.conteudo_resposta:
// - atividade de texto ou linguagem com 1 arquivo: o próprio conteúdo
// - atividade Web (html/css/js): os 3 arquivos em JSON
function montarConteudoResposta() {
    if (ARQUIVOS.length === 1) return dadosDosArquivos[ARQUIVOS[0].lang] || '';
    return JSON.stringify(dadosDosArquivos);
}

// Envia a resolução ao servidor (rota salvarResolucao) e retorna os dados confirmados pelo BD.
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

        let resultado;
        try {
            resultado = JSON.parse(textoBruto);
        } catch (erro) {
            aviso('O servidor não devolveu JSON (status ' + resposta.status + ')');
            return null;
        }

        if (!resposta.ok || !resultado.sucesso) {
            aviso(resultado.erro || 'Não foi possível salvar a entrega');
            return null;
        }
        return resultado;
    } catch (erro) {
        console.error(erro);
        aviso('Erro de conexão ao salvar a entrega');
        return null;
    }
}

// Só marca como entregue após confirmação do banco de dados e exibe eventual aviso do SIAE.
async function confirmarEntrega() {
    if (MODO_INSTRUTOR) return;
    if (atividadeAtual.prazoExcedido()) { fecharModalEntrega(); return aviso('O prazo de entrega acabou'); }
    salvar();

    const botao = porId('btnConfirmar');
    botao.disabled = true;
    const resultado = await salvarResolucaoNoBanco();
    botao.disabled = false;
    if (!resultado) return; // Mantém o modal aberto para o aluno tentar de novo.

    // Atualiza o estado em memória usando os valores reais persistidos no BD.
    const dataEnvio = resultado.data_envio || new Date().toISOString();
    cancelamentos = typeof resultado.cancelamentos === 'number' ? resultado.cancelamentos : cancelamentos;
    entrega = {
        id: resultado.id_submissao,
        data: dataEnvio,
        tentativa: resultado.tentativa,
        status: 'enviada',
        atividadeId: atividadeAtual.id,
        linguagem: linguagemAtual.id
    };

    try {
        localStorage.setItem(CHAVE_ENTREGA, JSON.stringify(entrega));
        localStorage.setItem(CHAVE_CANCELAMENTOS, String(cancelamentos));
    } catch (erro) { }

    fecharModalEntrega();
    atualizarEntrega();

    // Judge0 + IA: avalia a entrega já gravada. Roda em segundo plano e nunca desfaz a entrega se falhar.
    enviarParaAvaliacao();

    // Se a análise do SIAE retornou alerta de possível uso de IA (> 60%), exibe ao aluno.
    if (resultado.aviso_ia) {
        aviso(resultado.aviso_ia);
        sophiaFala(resultado.aviso_ia, 10000);
        if (typeof escreverConsole === 'function') {
            escreverConsole('SIAE: ' + resultado.aviso_ia, 'warn');
        }
    } else {
        sophiaFala('Atividade entregue!', 6000);
    }
}

// Cancela a entrega diretamente no banco de dados (status = 'cancelado') antes de liberar o editor.
async function cancelarEntrega() {
    if (MODO_INSTRUTOR) return;
    if (atividadeAtual.prazoExcedido()) return aviso('O prazo acabou: a entrega não pode mais ser cancelada');
    if (cancelamentos >= LIMITE_CANCELAMENTOS) return aviso('Você já usou os 3 cancelamentos. A entrega é final.');

    const botaoEntregar = porId('btnEntregar');
    botaoEntregar.disabled = true;

    try {
        const resposta = await fetch('cancelarEntrega', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_atividade: atividadeAtual.id })
        });
        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.sucesso) {
            aviso(resultado.erro || 'Não foi possível cancelar a entrega');
            return;
        }

        // Atualiza os contadores e libera o editor somente após o BD confirmar o cancelamento.
        cancelamentos = Number(resultado.cancelamentos) || (cancelamentos + 1);
        entrega = null;
        cancelarAvaliacao();   // descarta avaliação em andamento/guardada da entrega cancelada
        try {
            localStorage.setItem(CHAVE_CANCELAMENTOS, String(cancelamentos));
            localStorage.removeItem(CHAVE_ENTREGA);
        } catch (erro) { }

        aviso(`Entrega cancelada. Cancelamentos restantes: ${Math.max(0, LIMITE_CANCELAMENTOS - cancelamentos)}/${LIMITE_CANCELAMENTOS}`);
    } catch (erro) {
        console.error(erro);
        aviso('Erro de conexão ao cancelar a entrega');
    } finally {
        atualizarEntrega();
    }
}

porId('btnEntregar').onclick = () => (entrega ? cancelarEntrega() : iniciarEntrega());
porId('btnConfirmar').onclick = confirmarEntrega;
porId('btnCancelarModal').onclick = fecharModalEntrega;
modalEntrega.addEventListener('click', evento => { if (evento.target === modalEntrega) fecharModalEntrega(); });