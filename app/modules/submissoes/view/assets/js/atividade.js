(function () {
    const PHP_ABRE = '<' + '?php\n\n';

    const LINGUAGENS = {
        web: {
            id: 'web', nome: 'HTML + CSS + JS', rotulo: 'Web', modo: 'web', judge0: 63,
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
            arquivos: [{ nome: 'main.py', lang: 'py', rotulo: 'Python' }],
            inicial: { py: '# Escreva seu código Python abaixo\n' }
        },
        63: {
            id: 63, nome: 'JavaScript (Node.js)', rotulo: 'JavaScript', modo: 'terminal', judge0: 63,
            arquivos: [{ nome: 'main.js', lang: 'js', rotulo: 'JavaScript' }],
            inicial: { js: '// Escreva seu código JavaScript abaixo\n' }
        },
        68: {
            id: 68, nome: 'PHP', rotulo: 'PHP', modo: 'terminal', judge0: 68,
            arquivos: [{ nome: 'main.php', lang: 'php', rotulo: 'PHP' }],
            inicial: { php: PHP_ABRE }
        }
    };

    const ATIVIDADE_PADRAO = {
        id: null, titulo: '', descricao: '', requisitos: [],
        idLinguagem: 'web', notaMax: 10, notaMin: 6, codigoInicial: {},
        limiteEntrega: null, chave: null
    };

    const FORMATO_DATA_HORA = { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' };

    const blocoDadosAtividade = document.getElementById('dadosAtividade');
    let dadosDoBanco = {};
    if (blocoDadosAtividade && blocoDadosAtividade.textContent.trim()) {
        try {
            dadosDoBanco = JSON.parse(blocoDadosAtividade.textContent) || {};
        } catch (erro) {
            console.error('Bloco #dadosAtividade inválido:', erro);
        }
    }

    const atividade = Object.assign({}, ATIVIDADE_PADRAO, dadosDoBanco);
    const linguagem = LINGUAGENS[atividade.idLinguagem] || LINGUAGENS.web;
    atividade.linguagem = Object.assign({}, linguagem, {
        inicial: Object.assign({}, linguagem.inicial, atividade.codigoInicial)
    });
    atividade.chave = String(atividade.chave || atividade.id);

    const dataLimite = atividade.limiteEntrega ? new Date(atividade.limiteEntrega) : null;
    atividade.limite = dataLimite && !isNaN(dataLimite) ? dataLimite : null;
    atividade.formatarDataHora = iso => new Date(iso).toLocaleString('pt-BR', FORMATO_DATA_HORA);
    atividade.prazoExcedido = () => !!atividade.limite && Date.now() > atividade.limite.getTime();
    atividade.limiteTexto = () => atividade.limite
        ? atividade.limite.toLocaleString('pt-BR', FORMATO_DATA_HORA)
        : '';

    atividade.vazia = !dadosDoBanco.titulo;
    window.FarmAtividade = atividade;
    window.FarmLinguagens = LINGUAGENS;
})();