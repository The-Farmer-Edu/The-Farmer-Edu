(function () {
    /**
     * Carregador de módulos do front-end da submissão.
     *
     * A página HTML carrega apenas um script principal; depois, esse módulo decide quais arquivos JS
     * da pasta /file devem ser adicionados ao DOM dinamicamente.
     * Carrega os JS em ordem e, se não houver atividade (sem id ou id inexistente),
     * mostra apenas o aviso "Nenhuma atividade encontrada".
     */
    const PASTA_JS = 'file?type=js&file=';
    const MODULOS_POR_PAGINA = {
        aluno: ['atividade.js', 'aluno.js', 'menu.js', 'anexo.js'],
        iniciaratv: ['atividade.js', 'iniciaratv.js', 'submissao.js', 'sophia.js']
    };
    const modulos = MODULOS_POR_PAGINA[document.body.dataset.pagina] || [];

    function mostrarSemAtividade() {
        document.title = 'Nenhuma atividade encontrada';
        const aviso = document.createElement('div');
        aviso.setAttribute('role', 'status');
        aviso.textContent = 'Nenhuma atividade encontrada';
        aviso.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;' +
            'padding:24px;text-align:center;background:#fff;color:#555;' +
            'font:600 1.3rem "Segoe UI",Tahoma,sans-serif;z-index:99999;';
        document.body.replaceChildren(aviso);
        document.body.style.setProperty('background', '#fff', 'important');
        document.body.style.padding = '0';
    }

    function carregarModulo(indice) {
        if (indice >= modulos.length) {
            if (typeof iniciarPagina === 'function') iniciarPagina();
            return;
        }

        const script = document.createElement('script');
        script.src = PASTA_JS + modulos[indice];
        script.onload = () => {
            // atividade.js é o primeiro módulo: depois dele já sabemos se há atividade.
            if (window.FarmAtividade && window.FarmAtividade.vazia) return mostrarSemAtividade();
            carregarModulo(indice + 1);
        };
        script.onerror = () => console.error('Não foi possível carregar o módulo: ' + modulos[indice]);
        document.head.appendChild(script);
    }

    carregarModulo(0);
})();