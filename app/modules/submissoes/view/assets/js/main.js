/**
 * main.js — Ponto de entrada único do módulo submissoes
 *
 * Detecta em qual página estamos e injeta dinamicamente apenas os scripts
 * necessários para aquela página, na ordem correta de dependência.
 *
 * Uso (substitui todas as tags <script src="..."> individuais):
 *
 *   <script src="submissoes/file?type=js&file=main.js"></script>
 *
 * Mapa de módulos:
 *   Todas as páginas  → atividade.js
 *   /aluno            → aluno.js
 *   /iniciarAtv       → iniciaratv.js → submissao.js → sophia.js
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

