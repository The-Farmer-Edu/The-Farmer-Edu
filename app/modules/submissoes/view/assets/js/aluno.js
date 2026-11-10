function renderizarAtividade() {
    const A = window.FarmAtividade;
    if (!A) return;
    if (A.vazia) {
        // sem atividade: deixa os quadros em branco
        document.querySelectorAll('.atv-sub, .atv-meta').forEach(e => e.style.display = 'none');
        return;
    }
    const el = id => document.getElementById(id);
    // Se um elemento não existir no HTML, ele é simplesmente ignorado (não quebra a página)
    const escrever = (id, valor) => { const e = el(id); if (e) e.textContent = valor; };

    escrever('atvTitulo', A.titulo);
    escrever('atvDescricao', A.descricao);
    escrever('atvLinguagem', A.linguagem.nome);
    escrever('atvNota', `de 0 a ${A.notaMax} (mínima para aprovação: ${A.notaMin})`);

    const lista = el('atvRequisitos');
    if (lista) {
        lista.innerHTML = '';
        A.requisitos.forEach(r => {
            const li = document.createElement('li');
            li.textContent = r;
            lista.appendChild(li);
        });
    }

    const inputId = el('atvInputId');
    if (inputId) inputId.value = A.id;

    const box = el('atvBadges');
    if (box) {
        const cores = { HTML5: 'badge-html', CSS3: 'badge-css', JS: 'badge-js' };
        box.innerHTML = '';
        A.linguagem.badges.forEach(b => {
            const sp = document.createElement('span');
            sp.className = 'badge-padrao ' + (cores[b] || 'badge-outra');
            sp.textContent = b;
            box.appendChild(sp);
        });
    }
}
renderizarAtividade();

/*  Status da entrega, prazo e botão principal  */
// A entrega é guardada por atividade
const CHAVE_ENTREGA = 'farmedu:entrega:' + window.FarmAtividade.chave;
const status = document.querySelector('.status');
const texto = document.getElementById('texto');
const botaoComecar = document.getElementById('comecar');
const prazoEl = document.getElementById('atvPrazo');

function lerEntrega() {
    try { return JSON.parse(localStorage.getItem(CHAVE_ENTREGA)); } catch (e) { return null; }
}

/*  Pontuação da IA (feedback final)  */
// A avaliação da IA é guardada quando o aluno entrega (iniciaratv.js) e só abre depois do prazo.
// INTEGRAÇÃO
const btnNota = document.getElementById('btnNota');
const notaAviso = document.getElementById('notaAviso');
const modalNota = document.getElementById('modalNota');
const notaConteudo = document.getElementById('notaConteudo');

function lerAvaliacao() {
    try { return JSON.parse(localStorage.getItem(CHAVE_AVALIACAO)); } catch (e) { return null; }
}

// Bloqueado até o prazo acabar; depois do prazo, só abre se o aluno entregou e a IA já avaliou
function atualizarNota(entregue, encerrado) {
    if (!btnNota) return;
    const A = window.FarmAtividade;
    let liberado = false;
    let msg;
    if (!encerrado) {
        msg = A.limite
            ? '🔒 Disponível depois do prazo de entrega (' + A.limiteTexto() + ').'
            : '🔒 Disponível quando o prazo de entrega terminar.';
    } else if (!entregue) {
        msg = 'Você não entregou esta atividade, então não há pontuação.';
    } else if (!lerAvaliacao()) {
        msg = 'Sua entrega ainda não foi avaliada pela IA.';
    } else {
        liberado = true;
        msg = 'O prazo acabou. Sua pontuação já está disponível.';
    }
    btnNota.disabled = !liberado;
    btnNota.textContent = liberado ? 'Ver pontuação da IA' : '🔒 Pontuação da IA';
    if (notaAviso) notaAviso.textContent = msg;
}

function abrirNota() {
    const A = window.FarmAtividade;
    const aval = lerAvaliacao();
    // segurança: só abre depois do prazo e com avaliação guardada
    if (!modalNota || !notaConteudo || !aval || !A.prazoExcedido()) return;

    // monta com textContent (o texto vem da IA: nunca entra como HTML)
    const novo = (tag, classe, texto) => {
        const e = document.createElement(tag);
        if (classe) e.className = classe;
        if (texto !== undefined) e.textContent = texto;
        return e;
    };
    const lista = (titulo, itens) => {
        if (!itens || !itens.length) return;
        notaConteudo.appendChild(novo('h4', '', titulo));
        const ul = novo('ul');
        itens.forEach(t => ul.appendChild(novo('li', '', String(t))));
        notaConteudo.appendChild(ul);
    };

    notaConteudo.innerHTML = '';
    const nota = aval.nota != null ? aval.nota : '—';
    const aprovado = aval.status ? /^aprovado$/i.test(String(aval.status).trim()) : Number(aval.nota) >= A.notaMin;

    const valor = novo('p', 'nota-valor', `Nota atribuída: ${nota} / ${A.notaMax}`);
    valor.appendChild(novo('span', 'nota-selo ' + (aprovado ? 'aprovado' : 'reprovado'), aprovado ? 'Aprovado' : 'Reprovado'));
    notaConteudo.appendChild(valor);
    notaConteudo.appendChild(novo('p', 'nota-pequeno', `Nota mínima para aprovação: ${A.notaMin}`));

    if (aval.compilador) {
        const p = novo('p');
        p.append(novo('strong', '', 'Status do compilador: '), String(aval.compilador));
        notaConteudo.appendChild(p);
    }
    if (aval.saida && String(aval.saida).trim()) {
        notaConteudo.appendChild(novo('h4', '', 'Terminal'));
        notaConteudo.appendChild(novo('pre', '', String(aval.saida).trim()));
    }
    if (aval.feedback) {
        notaConteudo.appendChild(novo('h4', '', 'Feedback do Professor IA'));
        notaConteudo.appendChild(novo('p', '', String(aval.feedback)));
    }
    lista('✔ O que você fez', aval.feitos);
    lista('✖ O que ficou faltando', aval.faltando);
    lista('Missões de correção (pontos de melhoria)', aval.melhorias);
    if (!(aval.faltando || []).length && !(aval.melhorias || []).length) {
        notaConteudo.appendChild(novo('p', 'nota-pequeno', 'Lógica perfeita! Nenhuma correção necessária.'));
    }
    if (aval.exemplo) {
        notaConteudo.appendChild(novo('p', 'nota-pequeno', '(Resposta de exemplo: a IA não respondeu na hora da entrega.)'));
    }
    if (aval.data) {
        const quando = new Date(aval.data);
        if (!isNaN(quando)) {
            notaConteudo.appendChild(novo('p', 'nota-pequeno', 'Avaliado em ' + quando.toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
            })));
        }
    }
    modalNota.classList.add('active');
}

function fecharNota() {
    if (modalNota) modalNota.classList.remove('active');
}

function atualizarStatus() {
    const A = window.FarmAtividade;
    if (A.vazia) {
        // sem atividade: nada de status, prazo, texto nem botão
        status.style.display = 'none';
        prazoEl.hidden = true;
        texto.style.display = 'none';
        botaoComecar.style.display = 'none';
        if (btnNota) btnNota.style.display = 'none';
        if (notaAviso) notaAviso.style.display = 'none';
        return;
    }
    const entrega = lerEntrega();
    const data = entrega && new Date(entrega.data);
    const entregue = !!data && !isNaN(data);
    const encerrado = A.prazoExcedido();

    const ponto = document.createElement('span');
    ponto.className = 'ponto';
    status.textContent = '';

    if (entregue) {
        const quando = data.toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
        });
        status.append(ponto, ' Entregue em ' + quando);
    } else {
        status.append(ponto, ' Não entregue');
    }
    status.classList.toggle('entregue', entregue);

    // Botão e texto: Começar, Revisar, Visualizar
    botaoComecar.classList.toggle('visualizar', encerrado);
    if (encerrado) {
        botaoComecar.textContent = 'Visualizar';
        texto.textContent = entregue
            ? 'O prazo acabou. Clique em "Visualizar" para ver o código que você entregou.'
            : 'O prazo de entrega acabou. Você pode apenas visualizar a atividade.';
    } else if (entregue) {
        botaoComecar.textContent = 'Revisar';
        texto.textContent = 'Atividade entregue! Clique em "Revisar" para ver o seu código.';
    } else {
        botaoComecar.textContent = 'Começar';
        texto.textContent = 'Escreva seu código direto na plataforma clicando em "Começar".';
    }

    // Limite de entrega
    if (A.limite) {
        prazoEl.hidden = false;
        prazoEl.classList.toggle('encerrado', encerrado);
        prazoEl.textContent = encerrado
            ? 'Prazo encerrado em ' + A.limiteTexto()
            : 'Prazo de entrega até ' + A.limiteTexto();
    } else {
        prazoEl.hidden = true;
    }

    atualizarNota(entregue, encerrado);
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
    if (e.key === 'Escape') { fecharMenus(); fecharNota(); }
});

/*  Pontuação da IA: abrir e fechar  */
if (btnNota) btnNota.addEventListener('click', abrirNota);
const notaFechar = document.getElementById('notaFechar');
if (notaFechar) notaFechar.addEventListener('click', fecharNota);
if (modalNota) modalNota.addEventListener('click', e => { if (e.target === modalNota) fecharNota(); });