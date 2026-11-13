(function () {
    /**
     * Carregador de módulos do front-end da submissão.
     *
     * A página HTML carrega apenas um script principal; depois, esse módulo decide quais arquivos JS
     * da pasta /submissoes/file devem ser adicionados ao DOM dinamicamente.
     */
    const PASTA_JS = 'submissoes/file?type=js&file=';
    const MODULOS_POR_PAGINA = {
        aluno: ['atividade.js', 'aluno.js', 'menu.js'],
        iniciaratv: ['iniciaratv.js', 'atividade.js', 'submissao.js', 'sophia.js']
    };
    const modulos = MODULOS_POR_PAGINA[document.body.dataset.pagina] || [];

    function carregarModulo(indice) {
        if (indice >= modulos.length) {
            // Quando o último módulo terminar de baixar, a página chama a função de inicialização.
            if (typeof iniciarPagina === 'function') iniciarPagina();
            return;
        }

        const script = document.createElement('script');
        script.src = PASTA_JS + modulos[indice];
        script.onload = () => carregarModulo(indice + 1);
        script.onerror = () => console.error('Não foi possível carregar o módulo: ' + modulos[indice]);
        document.head.appendChild(script);
    }

    carregarModulo(0);
})();