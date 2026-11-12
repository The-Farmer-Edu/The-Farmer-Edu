/**
 * main.js — Ponto de entrada único do módulo submissoes
 *
 * Este arquivo atua como carregador de módulos. Em vez de incluir múltiplos
 * scripts diretamente no HTML, ele identifica a página atual e carrega apenas
 * os arquivos necessários para aquela tela.
 *
 * Essa estratégia reduz duplicação, facilita manutenção e garante que as
 * dependências sejam carregadas na ordem correta. Por exemplo, a tela do aluno
 * precisa de atividade.js + menu.js + aluno.js, enquanto o editor precisa de
 * atividade.js + menu.js + submissao.js + sophia.js + iniciaratv.js.
 *
 * Uso (substitui todas as tags <script src="..."> individuais):
 *
 *   <script src="submissoes/file?type=js&file=main.js"></script>
 */

(function () {
    'use strict';

    /** Carrega um script JS e retorna uma Promise que resolve quando ele terminar. */
    function carregarScript(arquivo) {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'submissoes/file?type=js&file=' + arquivo;
            s.onload  = resolve;
            s.onerror = () => reject(new Error('Falha ao carregar: ' + arquivo));
            document.head.appendChild(s);
        });
    }

    /** Carrega múltiplos scripts em sequência (ordem importa). */
    async function carregarSequencial(arquivos) {
        for (const arq of arquivos) {
            await carregarScript(arq);
        }
    }

    /* ─── Detectar página atual ─────────────────────────────────── */
    const params = new URLSearchParams(window.location.search);                                                                                                                                                                                                                                                                                                                                 
    const rotaParam = params.get('rota');
    const caminho = window.location.pathname.replace(/\/$/, '');
    const paginaRaw = rotaParam || caminho.split('/').pop() || '';
    const pagina = paginaRaw.replace(/\.php$/, ''); // ex: "aluno", "iniciarAtv", "index"

    /* ─── Mapa de módulos por página ────────────────────────────── */
    const modulos = {
        // Página do aluno: lista de atividades
        aluno: ['atividade.js', 'menu.js', 'aluno.js'],

        // IDE: editor de código, execução, Sophia
        iniciarAtv: [
            'atividade.js',
            'menu.js',
            'submissao.js',   // avaliarNoServidor, entrega, contadores
            'sophia.js',      // balão + interação console
            'iniciaratv.js'   // editor, execução, abas
        ]
    };

    const lista = modulos[pagina];

    if (!lista) {
        // Página sem módulos específicos (ex: home, 404)
        console.info('[main.js] Página sem módulos JS: "' + pagina + '"');
        return;
    }

    /* ─── Carregar módulos ───────────────────────────────────────── */
    carregarSequencial(lista).catch(err => {
        console.error('[main.js] Erro ao carregar módulos:', err);
    });
})();

