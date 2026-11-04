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

    /* DADOS DA ATIVIDADE */
    const base = {
        id: 1, titulo: 'Atividade', descricao: '', requisitos: [], objetivo: '',
        idLinguagem: 'web', notaMax: 10, notaMin: 6, entrada: '', codigoInicial: {},
        limiteEntrega: null, chave: null
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

    // TESTE
    // atividades SÓ PARA TESTAR limite, Judge0, Sophia/IA e botões de entrega.
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
            let nome = url.get('teste');
            // Só carrega dados de teste quando a URL pede (?teste=web, php ou python)
            if (!Object.prototype.hasOwnProperty.call(TESTES, nome)) nome = null;
            if (!nome) return;
            const teste = TESTES[nome];

            // Prazo 
            const pedido = url.get('limite');
            let limiteEntrega = null;
            if (pedido !== 'off') {
                let d = pedido ? new Date(pedido) : null;
                if (!d || isNaN(d)) { d = new Date(); d.setHours(23, 59, 0, 0); }
                limiteEntrega = d.toISOString();
            }

            // limpar=1: recomeça o teste do zero
            if (url.get('limpar')) {
                const re = new RegExp('^farmedu:(codigo|entrega|cancelamentos|avaliacao):' + teste.chave + '(:|$)');
                Object.keys(localStorage).filter(k => re.test(k)).forEach(k => localStorage.removeItem(k));
            }

            lido = Object.assign({}, lido, teste, { limiteEntrega });

            // Leva teste= e limite= junto quando o aluno clica em "Começar" (só existe na página do aluno)
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

    /*MONTAGEM FINAL*/
    const A = Object.assign({}, base, lido);
    const L = LINGUAGENS[A.idLinguagem] || LINGUAGENS.web;
    A.linguagem = Object.assign({}, L, { inicial: Object.assign({}, L.inicial, A.codigoInicial) });
    A.chave = String(A.chave || A.id);

    // Limite de entrega
    const _lim = A.limiteEntrega ? new Date(A.limiteEntrega) : null;
    A.limite = _lim && !isNaN(_lim) ? _lim : null;
    A.prazoExcedido = () => !!A.limite && Date.now() > A.limite.getTime();
    A.limiteTexto = () => A.limite
        ? A.limite.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
        : '';

    // Sem dados de atividade (nem do banco, nem de teste): a tela do aluno fica vazia
    A.vazia = !lido.titulo;

    window.FarmAtividade = A;
    window.FarmLinguagens = LINGUAGENS;
})();