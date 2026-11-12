(function () {
    const PHP_ABRE = '<' + '?php\n\n';

    /* LINGUAGENS */
    const LINGUAGENS = {
        web: {
            id: 'web', nome: 'HTML + CSS + JS', rotulo: 'Web', modo: 'web', judge0: 63,
            badges: ['HTML5', 'CSS3', 'JS'],
            arquivos: [
                { nome: 'index.html', lang: 'html', rotulo: 'HTML' },
                { nome: 'style.css', lang: 'css', rotulo: 'CSS' },
                { nome: 'script.js', lang: 'js', rotulo: 'JavaScript' }
            ],
            inicial: {
                html: '<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n  <meta charset="UTF-8">\n  <title>Minha Fazenda</title>\n</head>\n<body>\n  <!-- Crie aqui o título, o parágrafo e o botão -->\n</body>\n</html>',
                css: '/* Estilize a página e o botão aqui */\n',
                js: '// Escreva aqui o que acontece quando o botão for clicado\n'
            }
        },
        71: {
            id: 71, nome: 'Python (3.8.1)', rotulo: 'Python', modo: 'terminal', judge0: 71,
            badges: ['Python'],
            arquivos: [{ nome: 'main.py', lang: 'py', rotulo: 'Python' }],
            inicial: { py: '# Escreva seu código Python abaixo\n' }
        },
        63: {
            id: 63, nome: 'JavaScript (Node.js)', rotulo: 'JavaScript', modo: 'terminal', judge0: 63,
            badges: ['JS'],
            arquivos: [{ nome: 'main.js', lang: 'js', rotulo: 'JavaScript' }],
            inicial: { js: '// Escreva seu código JavaScript abaixo\n' }
        },
        68: {
            id: 68, nome: 'PHP', rotulo: 'PHP', modo: 'terminal', judge0: 68,
            badges: ['PHP'],
            arquivos: [{ nome: 'main.php', lang: 'php', rotulo: 'PHP' }],
            inicial: { php: PHP_ABRE }
        }
    };

    /*
     * DADOS DA ATIVIDADE
     *
     * Este objeto representa o estado mínimo de uma tarefa no frontend. Ele é
     * preenchido tanto com dados vindos do banco quanto com dados de teste
     * locais (?teste=...). É o núcleo do sistema: todas as outras telas consultam
     * este objeto para saber qual atividade está ativa, qual linguagem deve ser
     * usada e quais limites de execução/entrega existem.
     */
    const base = {
        id: 1, titulo: 'Atividade', descricao: '', requisitos: [], objetivo: '',
        idLinguagem: 'web', notaMax: 10, notaMin: 6, entrada: '', codigoInicial: {},
        limiteEntrega: null, chave: null, queryAluno: ''
    };

    const bloco = document.getElementById('dadosAtividade');
    let lido = {};
    if (bloco) {
        try {
            lido = JSON.parse(bloco.textContent);
        } catch (e) {
            console.error('Bloco #dadosAtividade inválido:', e);
        }
    }

    // TESTE Atividades
    // O sistema permite testar o comportamento da UI sem depender do banco de
    // dados. Quando a URL inclui ?teste=web, ?teste=python ou ?teste=php, os
    // atributos da atividade são sobrescritos por este objeto. Isso é útil para
    // validar a interface e os limites de execução em ambiente de desenvolvimento.
    const TESTES = {
        web: {
            id: 1,
            chave: 'teste-web',
            titulo: '[TESTE] Web — Minha Fazenda',
            descricao: 'Turma, vocês vão criar uma página simples para a fazenda: um título, um parágrafo e um botão que reage ao clique.',
            requisitos: [
                'Criar um título h1 com o texto "Minha Fazenda" e um parágrafo de apresentação',
                'Adicionar um botão com id "btn" e o texto "Clique aqui"',
                'Estilizar o fundo da página e o botão no CSS',
                'Ao clicar, trocar o texto do botão para "Cocoricó!" e escrever uma mensagem no console'
            ],
            objetivo: "Criar uma página 'Minha Fazenda' com título, parágrafo e um botão que, ao ser clicado, muda o texto para 'Cocoricó!' e registra uma mensagem no console.",
            idLinguagem: 'web',
            entrada: ''
        },
        php: {
            id: 1,
            chave: 'teste-php',
            titulo: '[TESTE] PHP — saudação da fazenda',
            descricao: 'Atividade de teste do Judge0 com PHP. Leia um nome e mostre uma saudação.',
            requisitos: [
                'Ler uma linha da entrada com fgets(STDIN)',
                'Remover a quebra de linha com trim()',
                'Mostrar com echo no formato "Bem-vindo, <nome>!"'
            ],
            objetivo: 'Ler um nome da entrada e imprimir "Bem-vindo, <nome>!".',
            idLinguagem: 68,
            entrada: 'Maria\n',
            saidaEsperada: 'Bem-vindo, Maria!',
            codigoInicial: { php: PHP_ABRE + '// Leia o nome com fgets(STDIN) e mostre "Bem-vindo, <nome>!"\n' }
        },
        python: {
            id: 1,
            chave: 'teste-python',
            titulo: '[TESTE] Python — soma de dois números',
            descricao: 'Atividade de teste do Judge0 com Python. Leia dois números inteiros, some e mostre o resultado.',
            requisitos: [
                'Ler dois números inteiros com input(), um por linha',
                'Somar os dois números',
                'Mostrar o resultado com print no formato "Soma: <resultado>"'
            ],
            objetivo: 'Ler dois números inteiros, somá-los e imprimir "Soma: <resultado>".',
            idLinguagem: 71,
            entrada: '3\n5\n',
            saidaEsperada: 'Soma: 8',
            codigoInicial: { py: '# Leia dois números inteiros (um por linha), some e mostre "Soma: <resultado>"\n' }
        }
    };

    (function aplicarTeste() {
        try {
            const url = new URLSearchParams(location.search);
            const existe = n => Object.prototype.hasOwnProperty.call(TESTES, n);
            const memoria = 'farmedu:teste:atual';
            const paginaDeCodigo = !!document.getElementById('ed');

            // O fluxo de teste funciona assim:
            // - ?teste=web ativa um cenário específico;
            // - o limite pode ser informado com ?limite=... ou pode ser deixado em
            //   "hoje às 23:59" quando não for passado;
            // - se a página for de código, o último teste usado fica salvo em
            //   sessionStorage para que o estado continue ao voltar para o aluno.
            let nome = url.get('teste');
            let pedido = url.get('limite');
            if (existe(nome)) {
                sessionStorage.setItem(memoria, JSON.stringify({ nome, limite: pedido }));
            } else {
                nome = null;
                // Página do aluno sem ?teste= fica vazia
                if (paginaDeCodigo) {
                    const salvo = JSON.parse(sessionStorage.getItem(memoria) || 'null');
                    if (salvo && existe(salvo.nome)) { nome = salvo.nome; pedido = salvo.limite; }
                }
            }
            if (!nome) return;
            const teste = TESTES[nome];

            // Prazo: por padrão, hoje às 23:59. Isso impede que um teste de
            // validação fique sem limite de entrega e facilita a demonstração do
            // comportamento após o prazo.
            let limiteEntrega = null;
            if (pedido !== 'off') {
                let d = pedido ? new Date(pedido) : null;
                if (!d || isNaN(d)) { d = new Date(); d.setHours(23, 59, 0, 0); }
                limiteEntrega = d.toISOString();
            }

            // &limpar=1: recomeça o teste do zero, apagando os dados persistidos em
            // localStorage para essa atividade em particular.
            if (url.get('limpar')) {
                const re = new RegExp('^farmedu:(codigo|entrega|cancelamentos|avaliacao):' + teste.chave + '(:|$)');
                Object.keys(localStorage).filter(k => re.test(k)).forEach(k => localStorage.removeItem(k));
            }

            // queryAluno: quando a página volta para a tela do aluno, ela precisa
            // manter a referência ao teste original para não perder o contexto.
            const queryAluno = '?teste=' + nome + (pedido ? '&limite=' + encodeURIComponent(pedido) : '');
            lido = Object.assign({}, lido, teste, { limiteEntrega, queryAluno });

            // Quando o aluno clica em "Começar", o formulário envia os parâmetros do
            // teste para a rota /iniciarAtv, preservando a atividade atual.
            const form = document.querySelector('form[action="iniciarAtv"]');
            if (form) {
                [['teste', nome], ['limite', pedido]].forEach(([campo, valor]) => {
                    if (!valor) return;
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = campo;
                    input.value = valor;
                    form.appendChild(input);
                });
            }
        } catch (e) {
            console.warn('Atividade de teste não aplicada:', e);
        }
    })();


    /* MONTAGEM FINAL */
    // A atividade final é o merge entre os dados padrão, os dados vindos do
    // banco e os dados de teste, caso exista. Isso evita repetições e garante
    // que o frontend sempre possua um objeto consistente para renderizar o UI.
    const Assignments = Object.assign({}, base, lido);
    const L = LINGUAGENS[Assignments.idLinguagem] || LINGUAGENS.web;
    Assignments.linguagem = Object.assign({}, L, { inicial: Object.assign({}, L.inicial, Assignments.codigoInicial) });

    // A chave de persistência é usada para separar dados de diferentes atividades
    // no localStorage. Mesmo quando a entidade vier do banco, ela precisa de um
    // identificador único para salvar código, entrega e avaliação.
    Assignments.chave = String(Assignments.chave || Assignments.id);

    // Limite de entrega: vem do bloco #dadosAtividade (banco) ou do teste;
    // não hardcode aqui.
    const _lim = Assignments.limiteEntrega ? new Date(Assignments.limiteEntrega) : null;
    Assignments.limite = _lim && !isNaN(_lim) ? _lim : null;
    Assignments.prazoExcedido = () => !!Assignments.limite && Date.now() > Assignments.limite.getTime();
    Assignments.limiteTexto = () => Assignments.limite
        ? Assignments.limite.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
        : '';

    // Sem dados de atividade (nem do banco, nem de teste) -> tela vazia.
    Assignments.vazia = !lido.titulo;

    window.FarmAtividade = Assignments;
    window.FarmLinguagens = LINGUAGENS;
})();
