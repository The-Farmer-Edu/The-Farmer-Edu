const paginaDoTipo = { codigo: 'normal', texto: 'texto', quiz: 'pergunta' };
const rotuloDoTipo = { codigo: 'Código', texto: 'Texto', quiz: 'Pergunta' };
const nomeDaLinguagem = { php: 'PHP', javascript: 'JavaScript', python: 'Python', java: 'Java', c: 'C', cpp: 'C++' };
const paginasDoMenu = ['mural', 'pessoas'];

const nomeInstrutor = document.body.dataset.instrutor;

const iconeAtividade = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9z"/><path d="M8 11l1.2 1.2L11 10.4M13 11.5h3M8 16l1.2 1.2L11 15.4M13 16.5h3"/></svg>';

let atividades = [];
let formularioDosCriterios = null;

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

function formatarDia(valor) {
    const [ano, mes, dia] = valor.slice(0, 10).split('-').map(Number);
    return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
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

function abrirPagina(nome) {
    document.getElementById('aviso').className = 'aviso hidden';

    document.querySelectorAll('.pagina').forEach(pagina => pagina.classList.add('hidden'));
    document.getElementById('pagina-' + nome).classList.remove('hidden');

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

function atualizarCabecalho(turmas) {
    const titulo = document.getElementById('cabecalho-titulo');
    const sub = document.getElementById('cabecalho-sub');

    if (turmas.length === 1) {
        titulo.textContent = turmas[0].nome_curso.toUpperCase();
        sub.textContent = turmas[0].nome_turma;
    } else if (turmas.length > 1) {
        titulo.textContent = 'MINHAS TURMAS';
        sub.textContent = turmas.length + ' turmas';
    }
}

async function carregarDados() {
    try {
        const dados = await pedir('atividades/instrutor/dados');
        atividades = dados.atividades;

        preencherCampos(dados);
        atualizarCabecalho(dados.turmas);
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

function criarBotao(texto, classe, acao) {
    const botao = criar('button', classe, texto);
    botao.type = 'button';
    botao.addEventListener('click', acao);
    return botao;
}

function criarItemAtividade(atividade, titulo, acoes) {
    const icone = criar('span', 'item-icone');
    icone.innerHTML = iconeAtividade;

    const info = criar('div', 'feed-info');
    info.append(
        criar('strong', '', titulo),
        criar('small', '', `${formatarDia(atividade.criado_em)} · Prazo: ${formatarData(atividade.data_entrega)}`),
        criar('small', '', descricaoDaAtividade(atividade))
    );

    const lado = criar('div', 'feed-lado');
    lado.append(icone, info);

    const item = criar('div', 'feed-item');
    item.append(lado, acoes);
    return item;
}

function desenharLista() {
    const lista = document.getElementById('lista-atividades');
    lista.replaceChildren();

    if (!atividades.length) {
        lista.append(criar('p', 'vazio', 'Nenhuma atividade publicada ainda.'));
        return;
    }

    atividades.forEach((atividade, posicao) => {
        const envios = Number(atividade.total_submissoes);
        const acoes = criar('div', 'feed-acoes');
        acoes.append(
            criar('span', 'selo', envios === 1 ? '1 envio' : `${envios} envios`),
            criarBotao('Editar', 'primary pequeno', () => abrirFormulario(atividade, false)),
            criarBotao('Remover', 'secondary pequeno', () => removerAtividade(atividade))
        );

        const item = criarItemAtividade(atividade, `${nomeInstrutor} lançou uma nova atividade: ${atividade.titulo}`, acoes);
        if (posicao === 0) {
            item.classList.add('destaque');
        }
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
        const acoes = criar('div', 'feed-acoes');
        acoes.append(criarBotao('Usar como base', 'primary pequeno', () => abrirFormulario(atividade, true)));

        lista.append(criarItemAtividade(atividade, atividade.titulo, acoes));
    });
}

function criteriosDoFormulario(form) {
    try {
        const lista = JSON.parse(form.elements.criterios.value || '[]');
        return Array.isArray(lista) ? lista : [];
    } catch (erro) {
        return [];
    }
}

function definirCriterios(form, lista) {
    form.elements.criterios.value = JSON.stringify(lista);
    form.querySelector('.contagem').textContent = `(${lista.length})`;
}

function abrirCriterios(botao) {
    formularioDosCriterios = botao.closest('form');

    const quadro = document.createElement('iframe');
    quadro.title = 'Critérios de avaliação';
    quadro.src = 'atividades/criterios';
    quadro.addEventListener('load', () => preencherCriterios(quadro));

    document.getElementById('modal-corpo').replaceChildren(quadro);
    document.getElementById('modal-criterios').classList.remove('hidden');
}

function preencherCriterios(quadro) {
    const doc = quadro.contentDocument;
    const campo = doc && doc.getElementById('criteria-input');
    const adicionar = doc && doc.getElementById('add-criteria-btn');

    if (!campo || !adicionar) {
        return;
    }

    criteriosDoFormulario(formularioDosCriterios).forEach(texto => {
        campo.value = texto;
        adicionar.click();
    });
}

function aplicarCriterios() {
    const quadro = document.querySelector('#modal-corpo iframe');

    if (quadro && quadro.contentDocument) {
        const criterios = [...quadro.contentDocument.querySelectorAll('.criterio')]
            .map(criterio => criterio.textContent.trim())
            .filter(texto => texto !== '');

        definirCriterios(formularioDosCriterios, criterios);
    }
    fecharCriterios();
}

function fecharCriterios() {
    document.getElementById('modal-criterios').classList.add('hidden');
    document.getElementById('modal-corpo').replaceChildren();
}

document.getElementById('modal-criterios').addEventListener('click', evento => {
    if (evento.target.id === 'modal-criterios') {
        fecharCriterios();
    }
});

document.addEventListener('keydown', evento => {
    if (evento.key === 'Escape') {
        fecharCriterios();
    }
});

function formularioDoTipo(tipo) {
    return document.querySelector(`#pagina-${paginaDoTipo[tipo]} form`);
}

function prepararFormulario(form, editando) {
    form.reset();
    form.elements.id_atividade.value = '';
    definirCriterios(form, []);
    form.querySelector('.arquivos-existentes').replaceChildren();

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
    }

    if (tipo === 'codigo') {
        campos.linguagem.value = atividade.linguagem || '';
    }

    definirCriterios(form, atividade.criterios || []);
    desenharArquivos(form, atividade, reutilizando);

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