const idAtividade = Number(document.body.dataset.atividade);
const tokenCsrf = document.querySelector('meta[name="csrf"]').content;
const rotuloDoStatus = { enviada: 'Enviada', processando: 'Em correção', corrigida: 'Corrigida', erro: 'Erro na correção' };

let configuracao = null;

function criar(tag, classe, texto) {
    const elemento = document.createElement(tag);
    if (classe) {
        elemento.className = classe;
    }
    if (texto !== undefined) {
        elemento.textContent = texto;
    }
    return elemento;
}

function formatarData(valor) {
    const [ano, mes, dia] = valor.slice(0, 10).split('-');
    return `${dia}/${mes}/${ano}`;
}

function formatarDataHora(valor) {
    return formatarData(valor) + ' ' + valor.slice(11, 16);
}

function formatarTamanho(bytes) {
    return bytes >= 1048576
        ? (bytes / 1048576).toFixed(1).replace('.', ',') + ' MB'
        : Math.max(1, Math.round(bytes / 1024)) + ' KB';
}

async function pedir(url, opcoes) {
    let resposta;
    try {
        resposta = await fetch(url, opcoes);
    } catch (erro) {
        throw new Error('Não foi possível falar com o servidor.');
    }

    let dados = {};
    try {
        dados = await resposta.json();
    } catch (erro) {

    }

    if (!resposta.ok) {
        throw new Error(dados.mensagem || 'Algo deu errado. Tente novamente.');
    }
    return dados;
}

function mostrarAviso(mensagem, sucesso) {
    const aviso = document.getElementById('aviso');
    aviso.textContent = mensagem;
    aviso.className = 'aviso ' + (sucesso ? 'ok' : 'erro');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function desenharAtividade(atividade) {
    document.getElementById('titulo-atividade').textContent = atividade.titulo.toUpperCase();
    document.getElementById('enunciado').textContent = atividade.descricao || '';

    let info = `${atividade.nome_curso} · ${atividade.nome_turma} · Prazo: ${formatarData(atividade.data_entrega)}`;
    if (Number(atividade.atrasada) === 1) {
        info += ' (prazo encerrado)';
    }
    document.getElementById('info-atividade').textContent = info;
}

function configurarCampo(config) {
    configuracao = config;

    const campo = document.getElementById('arquivos');
    campo.accept = config.extensoes.map(extensao => '.' + extensao).join(',');

    document.getElementById('dica-arquivos').textContent =
        `Até ${config.max_arquivos} arquivos de ${config.max_mb} MB (${config.extensoes.join(', ')}).`;
}

function mostrarSelecionados() {
    const area = document.getElementById('selecionados');
    area.replaceChildren();

    [...document.getElementById('arquivos').files].forEach(arquivo => {
        const item = criar('div', 'arquivo-item');
        item.append(criar('span', '', `${arquivo.name} (${formatarTamanho(arquivo.size)})`));
        area.append(item);
    });
}

function desenharEnvios(envios) {
    const lista = document.getElementById('lista-envios');
    lista.replaceChildren();
    document.getElementById('total-envios').textContent = envios.length;

    if (!envios.length) {
        lista.append(criar('p', 'vazio', 'Você ainda não enviou arquivos nesta atividade.'));
        return;
    }

    envios.forEach(envio => {
        const links = criar('div', 'envio-arquivos');
        envio.arquivos.forEach(arquivo => {
            const link = criar('a', '', `${arquivo.nome_original} (${formatarTamanho(arquivo.tamanho_bytes)})`);
            link.href = 'atividades/anexo/baixar?id=' + encodeURIComponent(arquivo.id_anexo);
            links.append(link);
        });

        const info = criar('div', 'feed-info');
        info.append(
            criar('strong', '', `Tentativa ${envio.tentativa_num}`),
            criar('small', '', 'Enviada em ' + formatarDataHora(envio.data_envio)),
            links
        );

        const selo = envio.nota !== null
            ? criar('span', 'selo ok', 'Nota ' + Number(envio.nota).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 }))
            : criar('span', 'selo', rotuloDoStatus[envio.status] || envio.status);

        const item = criar('div', 'feed-item');
        item.append(info, selo);
        lista.append(item);
    });
}

async function carregar() {
    try {
        const dados = await pedir('atividades/aluno/anexo/dados?id=' + encodeURIComponent(idAtividade));
        desenharAtividade(dados.atividade);
        configurarCampo(dados.config);
        desenharEnvios(dados.envios);
    } catch (erro) {
        document.getElementById('form-anexo').classList.add('hidden');
        mostrarAviso(erro.message, false);
    }
}

function validarSelecao() {
    const arquivos = [...document.getElementById('arquivos').files];

    if (!arquivos.length) {
        return 'Selecione pelo menos um arquivo para enviar.';
    }
    if (arquivos.length > configuracao.max_arquivos) {
        return `Envie no máximo ${configuracao.max_arquivos} arquivos por vez.`;
    }

    const limite = configuracao.max_mb * 1048576;
    for (const arquivo of arquivos) {
        const extensao = arquivo.name.split('.').pop().toLowerCase();
        if (!configuracao.extensoes.includes(extensao)) {
            return `O arquivo "${arquivo.name}" não é de um tipo aceito.`;
        }
        if (arquivo.size > limite) {
            return `O arquivo "${arquivo.name}" passou de ${configuracao.max_mb} MB.`;
        }
    }
    return null;
}

async function enviar(evento) {
    evento.preventDefault();

    const problema = validarSelecao();
    if (problema) {
        mostrarAviso(problema, false);
        return;
    }

    const botao = document.getElementById('botao-enviar');
    botao.disabled = true;

    try {
        const dados = new FormData(evento.target);
        dados.append('id_atividade', idAtividade);
        dados.append('csrf', tokenCsrf);

        const resposta = await pedir('atividades/aluno/anexo/enviar', { method: 'POST', body: dados });

        evento.target.reset();
        mostrarSelecionados();
        await carregar();
        mostrarAviso(resposta.mensagem, true);
    } catch (erro) {
        mostrarAviso(erro.message, false);
    } finally {
        botao.disabled = false;
    }
}

document.getElementById('form-anexo').addEventListener('submit', enviar);
document.getElementById('arquivos').addEventListener('change', mostrarSelecionados);

carregar();