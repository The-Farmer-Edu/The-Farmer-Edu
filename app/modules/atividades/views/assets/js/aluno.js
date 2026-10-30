const rotuloDoTipo = { codigo: 'Código', texto: 'Texto', quiz: 'Pergunta' };
const nomeDaLinguagem = { php: 'PHP', javascript: 'JavaScript', python: 'Python', java: 'Java', c: 'C', cpp: 'C++' };
const rotuloDoStatus = { enviada: 'Enviada', processando: 'Em correção', corrigida: 'Corrigida', erro: 'Erro na correção' };

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

function formatarNota(valor) {
    return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

async function pedir(url) {
    let resposta;
    try {
        resposta = await fetch(url);
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

function mostrarAviso(mensagem) {
    const aviso = document.getElementById('aviso');
    aviso.textContent = mensagem;
    aviso.className = 'aviso erro';
}

function esconderAviso() {
    document.getElementById('aviso').className = 'aviso hidden';
}

async function carregarCursos() {
    try {
        const dados = await pedir('atividades/aluno/cursos');
        const lista = document.getElementById('lista-cursos');
        lista.replaceChildren();

        if (!dados.cursos.length) {
            lista.append(criar('p', 'vazio', 'Você ainda não está matriculado em nenhum curso.'));
            return;
        }

        dados.cursos.forEach(curso => {
            const botao = criar('button', 'menu-item', curso.nome_curso);
            botao.type = 'button';
            botao.dataset.curso = curso.id_curso;
            botao.addEventListener('click', () => selecionarCurso(curso));
            lista.append(botao);
        });

        selecionarCurso(dados.cursos[0]);
    } catch (erro) {
        mostrarAviso(erro.message);
    }
}

async function selecionarCurso(curso) {
    esconderAviso();

    document.querySelectorAll('#lista-cursos .menu-item').forEach(botao => {
        botao.classList.toggle('active', Number(botao.dataset.curso) === Number(curso.id_curso));
    });
    document.getElementById('titulo-curso').textContent = curso.nome_curso.toUpperCase();

    try {
        const dados = await pedir('atividades/aluno/lista?curso=' + encodeURIComponent(curso.id_curso));
        desenharPendentes(dados.pendentes);
        desenharRealizadas(dados.realizadas);
    } catch (erro) {
        mostrarAviso(erro.message);
    }
}

function descricaoDaAtividade(atividade) {
    let texto = `${atividade.nome_turma} · ${rotuloDoTipo[atividade.tipo_atividade]}`;
    if (atividade.linguagem) {
        texto += ` (${nomeDaLinguagem[atividade.linguagem] || atividade.linguagem})`;
    }
    return texto;
}

function criarItem(atividade, detalhe, selo) {
    const item = criar('a', 'feed-item');
    item.href = 'aluno?atividade=' + encodeURIComponent(atividade.id_atividade);

    const info = criar('div', 'feed-info');
    info.append(
        criar('strong', '', atividade.titulo),
        criar('small', '', descricaoDaAtividade(atividade)),
        criar('small', '', detalhe)
    );

    item.append(info, selo);
    return item;
}

function desenharPendentes(pendentes) {
    const lista = document.getElementById('lista-pendentes');
    lista.replaceChildren();
    document.getElementById('total-pendentes').textContent = pendentes.length;

    if (!pendentes.length) {
        lista.append(criar('p', 'vazio', 'Nenhuma atividade pendente neste curso.'));
        return;
    }

    pendentes.forEach((atividade, posicao) => {
        const atrasada = Number(atividade.atrasada) === 1;
        const selo = criar('span', atrasada ? 'selo alerta' : 'selo', atrasada ? 'Atrasada' : 'No prazo');

        const item = criarItem(atividade, 'Prazo: ' + formatarData(atividade.data_entrega), selo);
        if (posicao === 0) {
            item.classList.add('destaque');
        }
        lista.append(item);
    });
}

function textoDoSelo(atividade) {
    if (atividade.nota !== null) {
        return 'Nota ' + formatarNota(atividade.nota);
    }
    // corrigida pela IA, mas a nota ainda não foi confirmada pelo instrutor
    if (atividade.status === 'corrigida') {
        return 'Aguardando revisão';
    }
    return rotuloDoStatus[atividade.status] || atividade.status;
}

function desenharRealizadas(realizadas) {
    const lista = document.getElementById('lista-realizadas');
    lista.replaceChildren();
    document.getElementById('total-realizadas').textContent = realizadas.length;

    if (!realizadas.length) {
        lista.append(criar('p', 'vazio', 'Você ainda não enviou nenhuma atividade neste curso.'));
        return;
    }

    realizadas.forEach(atividade => {
        const selo = criar('span', atividade.nota !== null ? 'selo ok' : 'selo', textoDoSelo(atividade));
        const detalhe = `Enviada em ${formatarData(atividade.data_envio)} · tentativa ${atividade.tentativa_num}`;

        lista.append(criarItem(atividade, detalhe, selo));
    });
}

carregarCursos();