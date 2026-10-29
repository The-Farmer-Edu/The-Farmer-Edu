(function () {
    const PHP_ABRE = '<' + '?php\n\n';

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

    const base = {
        id: 1, titulo: 'Atividade', descricao: '', requisitos: [], objetivo: '',
        idLinguagem: 'web', notaMax: 10, notaMin: 6, entrada: '', codigoInicial: {}
    };

    let lido = {};
    try {
        lido = JSON.parse(document.getElementById('dadosAtividade').textContent);
    } catch (e) {
        console.error('Bloco #dadosAtividade ausente ou inválido:', e);
    }

    const A = Object.assign({}, base, lido);
    const L = LINGUAGENS[A.idLinguagem] || LINGUAGENS.web;
    A.linguagem = Object.assign({}, L, { inicial: Object.assign({}, L.inicial, A.codigoInicial) });

    window.FarmAtividade = A;
    window.FarmLinguagens = LINGUAGENS;
})();