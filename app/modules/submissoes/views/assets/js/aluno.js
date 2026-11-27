/**
 * Renderização da página do aluno (e visualização do instrutor).
 *
 * Esse módulo recebe o objeto global `FarmAtividade` montado por `atividade.js` (vindo do BD)
 * e o usa para preencher os campos da tela, controlar o status da entrega e bloquear/ajustar
 * os botões com base exclusiva no banco de dados (evitando manipulação via localStorage).
 */
const ROTA_FAZENDA = '../fazenda';

const botaoFazenda = document.getElementById('btnFazenda');
if (botaoFazenda) {
    botaoFazenda.addEventListener('click', () => {
        location.href = ROTA_FAZENDA;
    });
}
const atividadeAtual = window.FarmAtividade;

function renderizarAtividade() {
    if (!atividadeAtual) return;

    // Se a página chegou vazia, o usuário vê uma mensagem genérica em vez de estrutura quebrada.
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

    // O id da atividade (e o id_aluno no modo instrutor) são repassados ao formulário de iniciarAtv.
    const campoIdAtividade = obterElemento('atvInputId');
    if (campoIdAtividade) campoIdAtividade.value = atividadeAtual.id;

    const campoIdAluno = obterElemento('atvInputAluno');
    if (campoIdAluno) {
        if (atividadeAtual.modoInstrutor && atividadeAtual.idAluno) {
            campoIdAluno.disabled = false;
            campoIdAluno.value = atividadeAtual.idAluno;
        } else {
            campoIdAluno.disabled = true;
            campoIdAluno.value = '';
        }
    }
}
renderizarAtividade();

/*
 * Status da entrega:
 * O banco de dados (atividadeAtual.entregue / atividadeAtual.submissao) é a fonte da verdade.
 * O localStorage é mantido apenas como espelho/cache para compatibilidade visual entre abas,
 * nunca como referência para liberar ou bloquear botões.
 */
const CHAVE_ENTREGA = 'farmedu:entrega:' + atividadeAtual.chave;
const CHAVE_CANCELAMENTOS = 'farmedu:cancelamentos:' + atividadeAtual.chave;
const elementoStatus = document.querySelector('.status');
const textoOrientacao = document.getElementById('texto');
const botaoComecar = document.getElementById('comecar');
const elementoPrazo = document.getElementById('atvPrazo');

/**
 * Obtém a última entrega ativa a partir dos dados vindos do banco de dados.
 */
function obterEntregaDoBanco() {
    if (!atividadeAtual.entregue || !atividadeAtual.submissao || !atividadeAtual.submissao.dataEnvio) {
        return null;
    }
    const dataEnvio = new Date(atividadeAtual.submissao.dataEnvio);
    if (isNaN(dataEnvio)) return null;

    return {
        id: atividadeAtual.submissao.id,
        data: atividadeAtual.submissao.dataEnvio,
        tentativa: atividadeAtual.submissao.tentativa,
        status: atividadeAtual.submissao.status,
        caminhoArquivo: atividadeAtual.submissao.caminhoArquivo || null,
        atividadeId: atividadeAtual.id
    };
}

/**
 * Mantém o localStorage sincronizado com o estado real do banco,
 * sobrescrevendo qualquer valor adulterado manualmente no navegador.
 */
function sincronizarCacheLocalComBanco(entregaBanco) {
    if (atividadeAtual.modoInstrutor) return;
    try {
        if (entregaBanco) {
            localStorage.setItem(CHAVE_ENTREGA, JSON.stringify({
                data: entregaBanco.data,
                atividadeId: atividadeAtual.id
            }));
        } else {
            localStorage.removeItem(CHAVE_ENTREGA);
        }
        if (typeof atividadeAtual.cancelamentos === 'number') {
            localStorage.setItem(CHAVE_CANCELAMENTOS, String(atividadeAtual.cancelamentos));
        }
    } catch (erro) { }
}

/**
 * Card "Feedback da IA": aparece somente para o aluno, em atividade de código com entrega ativa.
 * Texto e anexo não passam pela avaliação da IA, então o campo nem é exibido neles.
 * Enquanto a IA não gravou o feedback, mostra um aviso neutro (o polling do status atualiza sozinho).
 */
function atualizarFeedbackIa(entregue) {
    const bloco = document.getElementById('feedbackIa');
    const texto = document.getElementById('feedbackIaTexto');
    if (!bloco || !texto) return;

    const avaliadaPorIa = atividadeAtual.idLinguagem !== 'texto';
    const mostrar = entregue && !atividadeAtual.modoInstrutor && avaliadaPorIa;
    // bloco.hidden = !mostrar;
    // if (!mostrar) return;

    const feedback = String(atividadeAtual.feedbackAluno || '').trim();
    texto.textContent = feedback
        || 'O feedback da IA ainda não está disponível. Ele aparece aqui assim que a análise da sua entrega for concluída.';
    texto.classList.toggle('vazio', !feedback);
}

function atualizarStatus() {
    if (atividadeAtual.vazia) {
        elementoStatus.style.display = 'none';
        elementoPrazo.hidden = true;
        textoOrientacao.style.display = 'none';
        botaoComecar.style.display = 'none';
        return;
    }

    const entrega = obterEntregaDoBanco();
    sincronizarCacheLocalComBanco(entrega);

    const entregue = !!entrega;
    const prazoEncerrado = atividadeAtual.prazoExcedido();
    const modoInstrutor = !!atividadeAtual.modoInstrutor;

    const pontoStatus = document.createElement('span');
    pontoStatus.className = 'ponto';
    elementoStatus.textContent = '';

    if (entregue) {
        elementoStatus.append(pontoStatus, ' Entregue em ' + atividadeAtual.formatarDataHora(entrega.data));
    } else {
        elementoStatus.append(pontoStatus, ' Não entregue');
    }
    elementoStatus.classList.toggle('entregue', entregue);
    atualizarFeedbackIa(entregue);

    const conteudo = atividadeAtual.idLinguagem === 'texto' ? 'sua resposta' : 'seu código';
    const ehAnexo = atividadeAtual.tipo === 'anexo';

    if (modoInstrutor) {
        // No modo instrutor, a tela é exclusivamente para visualização da última submissão do aluno.
        document.getElementById('opcaoArquivo').style.display = 'none';
        document.getElementById('listaAnexos').style.display = 'none';
        botaoComecar.classList.add('visualizar');

        if (ehAnexo) {
            botaoComecar.style.display = 'none';
            textoOrientacao.textContent = entregue
                ? `Último anexo enviado (Tentativa #${entrega.tentativa}): ${entrega.caminhoArquivo || 'arquivo registrado'}`
                : 'Este aluno ainda não enviou anexos para esta atividade.';
        } else {
            botaoComecar.style.display = '';
            botaoComecar.textContent = 'Visualizar';
            textoOrientacao.textContent = entregue
                ? `Última entrega do aluno (Tentativa #${entrega.tentativa}). Clique em "Visualizar" para abrir em modo somente leitura.`
                : 'Este aluno ainda não enviou resolução para esta atividade.';
        }
    } else {
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

        // Atividade do tipo anexo: mostra "Anexar" e o botão vira "Entregar" / "Reenviar".
        const anexoAberto = ehAnexo && !prazoEncerrado;
        document.getElementById('opcaoArquivo').style.display = anexoAberto ? '' : 'none';
        document.getElementById('listaAnexos').style.display = anexoAberto ? '' : 'none';
        if (ehAnexo) {
            botaoComecar.style.display = prazoEncerrado ? 'none' : '';
            if (!prazoEncerrado) {
                botaoComecar.textContent = entregue ? 'Reenviar' : 'Entregar';
                textoOrientacao.textContent = `Anexe seu(s) arquivo(s) e clique em "${botaoComecar.textContent}".`;
            }
        }
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

/**
 * Consulta o endpoint `/submissoes/status` para revalidar o estado real no BD
 * ao voltar pelo histórico do navegador (bfcache) ou quando outra aba dispara evento `storage`.
 */
async function sincronizarStatusDoBanco() {
    if (atividadeAtual.vazia) return;
    try {
        let url = 'status?id=' + encodeURIComponent(atividadeAtual.id);
        if (atividadeAtual.modoInstrutor && atividadeAtual.idAluno) {
            url += '&id_aluno=' + encodeURIComponent(atividadeAtual.idAluno);
        }
        const resposta = await fetch(url, { cache: 'no-store' });
        if (!resposta.ok) return;
        const json = await resposta.json();
        if (!json.sucesso || !json.dados) return;

        atividadeAtual.entregue = !!json.dados.entregue;
        atividadeAtual.submissao = json.dados.submissao || null;
        atividadeAtual.cancelamentos = Number(json.dados.cancelamentos) || 0;
        atividadeAtual.tentativas = Number(json.dados.tentativas) || 0;
        atividadeAtual.feedbackAluno = json.dados.feedbackAluno || null;
        atualizarStatus();
    } catch (erro) {
        // Se falhar a consulta em segundo plano, mantém o último estado validado do BD.
    }
}

atualizarStatus();
window.addEventListener('pageshow', () => {
    atualizarStatus();
    sincronizarStatusDoBanco();
});
window.addEventListener('storage', () => {
    // Revalida com o BD para impedir que alterações manuais no localStorage enganem a interface.
    sincronizarStatusDoBanco();
});
setInterval(sincronizarStatusDoBanco, 30000);

document.getElementById('btnVoltar').addEventListener('click', () => {
    if (atividadeAtual.modoInstrutor) {
        if (history.length > 1) {
            history.back();
        } else {
            location.href = '../notas/instrutor';
        }
        return;
    }
    location.href = '../atividades/aluno?id=';
});
