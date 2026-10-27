const paginaDoTipo = { codigo: 'normal', texto: 'texto', quiz: 'pergunta' };
const rotuloDoTipo = { codigo: 'Código', texto: 'Texto', quiz: 'Pergunta' };
const nomeDaLinguagem = { php: 'PHP', javascript: 'JavaScript', python: 'Python', java: 'Java', c: 'C', cpp: 'C++' };
const paginasDoMenu = ['mural', 'pessoas'];

let atividades = [];

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
        // resposta sem json, cai na mensagem padrão abaixo
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

function abrirPagina(nome) {
    document.getElementById('aviso').className = 'aviso hidden';

    document.querySelectorAll('.pagina').forEach(pagina => pagina.classList.add('hidden'));
    document.getElementById('pagina-' + nome).classList.remove('hidden');

    // as telas de cadastro pertencem ao item "Atividades" do menu
    const menu = paginasDoMenu.includes(nome) ? nome : 'atividades';
    document.querySelectorAll('.sidebar .menu-item[data-menu]').forEach(botao => {
        botao.classList.toggle('active', botao.dataset.menu === menu);
    });
}

function preencherSelect(select, opcoes) {
    const primeira = select.options[0];
    select.replaceChildren(primeira);
    opcoes.forEach(opcao => select.append(new Option(opcao.texto, opcao.valor)));
}

function preencherCampos(dados) {
    const turmas = dados.turmas.map(turma => ({
        valor: turma.id_turma,
        texto: `${turma.nome_curso} - ${turma.nome_turma}`
    }));
    document.querySelectorAll('.select-turma').forEach(select => preencherSelect(select, turmas));

    const linguagens = dados.linguagens.map(linguagem => ({
        valor: linguagem,
        texto: nomeDaLinguagem[linguagem] || linguagem
    }));
    document.querySelectorAll('.select-linguagem').forEach(select => preencherSelect(select, linguagens));

    document.querySelectorAll('.formato').forEach(paragrafo => {
        paragrafo.textContent = 'Formato de resposta aceito: ' + dados.formatos[paragrafo.dataset.tipo];
    });
}

async function carregarDados() {
    try {
        const dados = await pedir('atividades/instrutor/dados');
        atividades = dados.atividades;

        preencherCampos(dados);
        desenharLista();
        desenharReutilizar();

        if (!dados.turmas.length) {
            mostrarAviso('Você ainda não tem turmas cadastradas, então não dá para publicar atividades.', false);
        }
    } catch (erro) {
        mostrarAviso(erro.message, false);
    }
}

function descricaoDaAtividade(atividade) {
    let texto = `${atividade.nome_curso} · ${atividade.nome_turma} · ${rotuloDoTipo[atividade.tipo_atividade]}`;
    if (atividade.linguagem) {
        texto += ` (${nomeDaLinguagem[atividade.linguagem] || atividade.linguagem})`;
    }
    return texto;
}

function criarInfo(atividade) {
    const info = criar('div', 'feed-info');
    info.append(
        criar('strong', '', atividade.titulo),
        criar('small', '', descricaoDaAtividade(atividade)),
        criar('small', '', 'Prazo: ' + formatarData(atividade.data_entrega))
    );
    return info;
}

function criarBotao(texto, classe, acao) {
    const botao = criar('button', classe, texto);
    botao.type = 'button';
    botao.addEventListener('click', acao);
    return botao;
}

function desenharLista() {
    const lista = document.getElementById('lista-atividades');
    lista.replaceChildren();

    if (!atividades.length) {
        lista.append(criar('p', 'vazio', 'Nenhuma atividade publicada ainda.'));
        return;
    }

    atividades.forEach(atividade => {
        const envios = Number(atividade.total_submissoes);
        const acoes = criar('div', 'feed-acoes');
        acoes.append(
            criar('span', 'selo', envios === 1 ? '1 envio' : `${envios} envios`),
            criarBotao('Editar', 'primary pequeno', () => abrirFormulario(atividade, false)),
            criarBotao('Remover', 'secondary pequeno', () => removerAtividade(atividade))
        );

        const item = criar('div', 'feed-item');
        item.append(criarInfo(atividade), acoes);
        lista.append(item);
    });
}

function desenharReutilizar() {
    const lista = document.getElementById('lista-reutilizar');
    lista.replaceChildren();

    if (!atividades.length) {
        lista.append(criar('p', 'vazio', 'Você ainda não publicou nenhuma atividade.'));
        return;
    }

    atividades.forEach(atividade => {
        const item = criar('div', 'feed-item');
        item.append(
            criarInfo(atividade),
            criarBotao('Usar como base', 'primary pequeno', () => abrirFormulario(atividade, true))
        );
        lista.append(item);
    });
}

function formularioDoTipo(tipo) {
    return document.querySelector(`#pagina-${paginaDoTipo[tipo]} form`);
}

function prepararFormulario(form, editando) {
    form.reset();
    form.elements.id_atividade.value = '';

    const titulo = form.closest('.form-card').querySelector('h2');
    const botao = form.querySelector('button[type="submit"]');

    if (!titulo.dataset.original) {
        titulo.dataset.original = titulo.textContent;
        botao.dataset.original = botao.textContent;
    }

    titulo.textContent = editando ? 'Editar atividade' : titulo.dataset.original;
    botao.textContent = editando ? 'Salvar alterações' : botao.dataset.original;
}

function novaAtividade(tipo) {
    prepararFormulario(formularioDoTipo(tipo), false);
    abrirPagina(paginaDoTipo[tipo]);
}

function abrirFormulario(atividade, reutilizando) {
    const tipo = atividade.tipo_atividade;
    const form = formularioDoTipo(tipo);
    const campos = form.elements;

    prepararFormulario(form, !reutilizando);

    campos.titulo.value = atividade.titulo;
    campos.descricao.value = atividade.descricao || '';
    campos.id_turma.value = atividade.id_turma;

    if (!reutilizando) {
        campos.id_atividade.value = atividade.id_atividade;
        campos.prazo.value = atividade.data_entrega.slice(0, 10);
    }

    if (tipo === 'quiz') {
        ['A', 'B', 'C'].forEach(letra => {
            campos['alternativa' + letra].value = (atividade.alternativas || {})[letra] || '';
        });
        campos.correta.value = atividade.resposta_referencia || '';
    } else {
        campos.resposta_referencia.value = atividade.resposta_referencia || '';
    }

    if (tipo === 'codigo') {
        campos.linguagem.value = atividade.linguagem || '';
    }

    abrirPagina(paginaDoTipo[tipo]);
}

function cancelarFormulario(botao) {
    const editando = botao.closest('form').elements.id_atividade.value !== '';
    abrirPagina(editando ? 'atividades' : 'opcoes');
}

async function salvarAtividade(evento) {
    evento.preventDefault();

    const form = evento.target;
    const botao = form.querySelector('button[type="submit"]');
    botao.disabled = true;

    try {
        const resposta = await pedir('atividades/instrutor/salvar', {
            method: 'POST',
            body: new FormData(form)
        });

        await carregarDados();
        abrirPagina('atividades');
        mostrarAviso(resposta.mensagem, true);
    } catch (erro) {
        mostrarAviso(erro.message, false);
    } finally {
        botao.disabled = false;
    }
}

async function removerAtividade(atividade) {
    if (!confirm(`Remover a atividade "${atividade.titulo}"?`)) {
        return;
    }

    const dados = new FormData();
    dados.append('id_atividade', atividade.id_atividade);

    try {
        const resposta = await pedir('atividades/instrutor/remover', { method: 'POST', body: dados });

        await carregarDados();
        mostrarAviso(resposta.mensagem, true);
    } catch (erro) {
        mostrarAviso(erro.message, false);
    }
}

carregarDados();