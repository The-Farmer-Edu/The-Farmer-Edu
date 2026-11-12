(function () {
    /**
     * Módulo de bootstrapping da atividade.
     *
     * A lógica aqui converte os dados do banco em um objeto JavaScript pronto para uso pela UI.
     * Em vez de consultar a API toda vez que a tela montada, a página recebe um bloco JSON no HTML
     * e esse script transforma esse payload em `window.FarmAtividade`.
     */
    const PHP_ABRE = '<' + '?php\n\n';

    // Dicionário de linguagens suportadas. Cada item define como o editor deve se comportar,
    // quais arquivos iniciar e qual runtime é usado na execução.
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

    // Valores padrão para qualquer atividade que não tenha dados completos.
    const ATIVIDADE_PADRAO = {
        id: null, titulo: '', descricao: '', requisitos: [],
        idLinguagem: 'web', notaMax: 10, notaMin: 6, codigoInicial: {},
        limiteEntrega: null, chave: null
    };

    const FORMATO_DATA_HORA = { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' };

    // O PHP emite esse bloco JSON no HTML da página; o navegador converte em objeto para o front-end.
    const blocoDadosAtividade = document.getElementById('dadosAtividade');
    let dadosDoBanco = {};
    if (blocoDadosAtividade && blocoDadosAtividade.textContent.trim()) {
        try {
            dadosDoBanco = JSON.parse(blocoDadosAtividade.textContent) || {};
        } catch (erro) {
            console.error('Bloco #dadosAtividade inválido:', erro);
        }
    }

    // Junta os valores do banco com os defaults do sistema para garantir campos sempre presentes.
    const atividade = Object.assign({}, ATIVIDADE_PADRAO, dadosDoBanco);
    const linguagem = LINGUAGENS[atividade.idLinguagem] || LINGUAGENS.web;
    atividade.linguagem = Object.assign({}, linguagem, {
        inicial: Object.assign({}, linguagem.inicial, atividade.codigoInicial)
    });
    atividade.chave = String(atividade.chave || atividade.id);

    // Normaliza a data de entrega para facilitar uso em comparações e textos na tela.
    const dataLimite = atividade.limiteEntrega ? new Date(atividade.limiteEntrega) : null;
    atividade.limite = dataLimite && !isNaN(dataLimite) ? dataLimite : null;
    atividade.formatarDataHora = iso => new Date(iso).toLocaleString('pt-BR', FORMATO_DATA_HORA);
    atividade.prazoExcedido = () => !!atividade.limite && Date.now() > atividade.limite.getTime();
    atividade.limiteTexto = () => atividade.limite
        ? atividade.limite.toLocaleString('pt-BR', FORMATO_DATA_HORA)
        : '';

    // Se a atividade vier vazia, a UI sabe que não existe conteúdo real para renderizar.
    atividade.vazia = !dadosDoBanco.titulo;
    window.FarmAtividade = atividade;
    window.FarmLinguagens = LINGUAGENS;
})();