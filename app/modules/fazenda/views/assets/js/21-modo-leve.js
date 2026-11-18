      // ====================================================================================================
      // FARMEDU 3D — 21-modo-leve.js (Fase 3B da refatoração: seção 21)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================

      // ====================================================================================================
      // SEÇÃO 21 — MODO LEVE: QUALIDADE DE RENDERIZAÇÃO (SOMBRAS, RESOLUÇÃO E LUZES DINÂMICAS)
      // Botão "⚡ Modo Leve" para computadores fracos. Liga/desliga durante a partida, sem recarregar e sem tocar no progresso.
      // Quando ligado: sem sombras em tempo real (nem o cálculo do mapa de sombra), pixelRatio no máximo 1 e as 10 luzes reais
      // da noite (pool de postes/lampiões, casa e faróis) desligadas. Halos, janelas acesas, manchas de luz no chão e todos os
      // modelos continuam no lugar. Ao desligar, tudo volta exatamente à configuração original guardada em QUALIDADE_NORMAL.
      // Observação: o antialias do WebGL é escolhido ao criar o renderizador e não pode mudar sem recriá-lo, então fica como está.
      // ====================================================================================================
      const QUALIDADE_NORMAL = {                   // configuração original do jogo (seção 06), usada para restaurar
        sombras: renderizador.shadowMap.enabled, sombraDoSol: luzDoSol.castShadow,   // (a resolução é recalculada sempre: seção 18)
      };
      const botaoDoModoLeve = selecionar('#botao-modo-leve');
      // Luzes reais com custo por pixel/vértice que o Modo Leve desliga (a hemisférica e o sol/lua continuam: são a luz principal).
      const luzesDinamicasDaNoite = () => [...luzesDosPostes.map(itemDoPool => itemDoPool.luz), luzDaCasa, luzDosFarois];

      // Etapa 0: a preferência agora é o nível de qualidade (seção 02). A chave antiga do Modo Leve continua sendo escrita
      // ('ligado' só no nível baixo) para que uma versão anterior do jogo, se aberta, encontre algo coerente.
      const salvarPreferenciaDoModoLeve = function salvarPreferenciaDoModoLeve() {
        try {
          localStorage.setItem(CHAVE_DO_MODO_LEVE, MODO_LEVE.ativo ? 'ligado' : 'desligado');
          localStorage.setItem(CHAVE_DA_QUALIDADE_GRAFICA, JSON.stringify({ escolha: QUALIDADE_GRAFICA.escolha, detectado: QUALIDADE_GRAFICA.detectado, escalaAutomatica: QUALIDADE_GRAFICA.escalaAutomatica, teto: QUALIDADE_GRAFICA.teto }));
        } catch (erro) { }
      };
      // ---- Etapa 0b: seletor em cartões (grupo de rádio) ----
      const seletorDaQualidade = selecionar('#seletor-de-qualidade'), textoDaQualidadeAtual = selecionar('#qualidade-atual'), textoDaDescricaoDaQualidade = selecionar('#descricao-da-qualidade');
      const opcoesDeQualidade = seletorDaQualidade ? [...seletorDaQualidade.querySelectorAll('[data-qualidade]')] : [];
      const DESCRICOES_DA_QUALIDADE = {
        auto: 'Mede o desempenho durante o jogo e escolhe sozinha o melhor nível para este computador.',
        baixo: 'Para computadores simples: imagem nítida e bordas suaves, sem sombras. À noite, os postes mais próximos continuam iluminando o chão.',
        medio: 'Equilíbrio: sombras suaves e todas as luzes da noite, com resolução limitada em telas de alta densidade.',
        alto: 'Visual completo: sombras suaves, todas as luzes e a resolução máxima da tela.',
      };
      // FPS no selo: SÓ com o Modo Desenvolvedor ligado (Etapa 1). Lê o mesmo estado do modo (modoDesenvolvedorAtivo, seção 32), sem
      // uma configuração própria; a leitura é protegida porque a seção 32 só é carregada depois desta. A medição continua sempre
      // (média móvel dos quadros; o texto muda no máximo 1×/s e só com o menu aberto) e o monitor do Automático (30d) não depende dela.
      const modoDesenvolvedorLigado = () => { try { return modoDesenvolvedorAtivo === true; } catch (erro) { return false; } };
      const fpsDaInterface = { anterior: 0, mediaMs: 0, proximaAtualizacao: 0 };
      const textoDoSeloDaQualidade = function textoDoSeloDaQualidade() {
        const nome = NIVEIS_DE_QUALIDADE[QUALIDADE_GRAFICA.atual].nome, escala = Math.round(escalaDaResolucaoAtual() * 100);
        const fps = fpsDaInterface.mediaMs ? Math.round(1000 / fpsDaInterface.mediaMs) : 0;
        return nome + (escala < 100 ? ' · ' + escala + '%' : '') + (fps && modoDesenvolvedorLigado() ? ' · ' + fps + ' FPS' : '');   // na Automática, o ponto verde marca o nível em uso
      };
      const registrarQuadroNaInterface = function registrarQuadroNaInterface() {
        const agora = performance.now(), intervalo = fpsDaInterface.anterior ? agora - fpsDaInterface.anterior : 0; fpsDaInterface.anterior = agora;
        if (intervalo > 0 && intervalo < 1000) fpsDaInterface.mediaMs = fpsDaInterface.mediaMs ? fpsDaInterface.mediaMs * 0.95 + intervalo * 0.05 : intervalo;
        if (agora < fpsDaInterface.proximaAtualizacao || !textoDaQualidadeAtual || !textoDaQualidadeAtual.offsetParent) return;   // menu fechado: nada no DOM
        fpsDaInterface.proximaAtualizacao = agora + 1000;
        const texto = textoDoSeloDaQualidade(); if (textoDaQualidadeAtual.textContent !== texto) textoDaQualidadeAtual.textContent = texto;
      };
      const atualizarBotaoDoModoLeve = function atualizarBotaoDoModoLeve() {
        for (const opcao of opcoesDeQualidade) {
          const escolhida = opcao.dataset.qualidade === QUALIDADE_GRAFICA.escolha;
          opcao.setAttribute('aria-checked', String(escolhida)); opcao.tabIndex = escolhida ? 0 : -1;
          opcao.classList.toggle('em-uso', QUALIDADE_GRAFICA.escolha === 'auto' && opcao.dataset.qualidade === QUALIDADE_GRAFICA.atual);   // o nível que o Automático escolheu
        }
        if (textoDaQualidadeAtual) textoDaQualidadeAtual.textContent = textoDoSeloDaQualidade();
        if (textoDaDescricaoDaQualidade) textoDaDescricaoDaQualidade.textContent = DESCRICOES_DA_QUALIDADE[QUALIDADE_GRAFICA.escolha]
          + (perfilDaQualidade().antialias !== QUALIDADE_GRAFICA.antialiasNaAbertura ? ' As bordas suaves voltam ao recarregar a página.' : '');
        if (botaoDoModoLeve) {
          botaoDoModoLeve.setAttribute('aria-pressed', String(MODO_LEVE.ativo));
          const estado = botaoDoModoLeve.querySelector('.estado-modo-leve'); if (estado) estado.textContent = MODO_LEVE.ativo ? 'ligado' : 'desligado';
        }
      };
      // ---- Etapa 0b: luzes reais da noite só quando estão acesas ----
      // Cada luz visível entra no cálculo de iluminação de TODOS os materiais, mesmo com intensidade 0 (medido: ~2–3% do quadro
      // por luz, de dia inclusive). De dia elas já ficavam apagadas (intensidade 0), então ficam invisíveis: a imagem é a mesma.
      // À noite acendem só as permitidas pelo nível (postes: 3 no baixo, 8 no médio/alto; casa; faróis). A troca recompila os
      // materiais uma vez (medido: maior quadro 46 ms contra 33 ms normais), só ao anoitecer, ao amanhecer e ao mudar o nível.
      let assinaturaDasLuzesDaNoite = '';
      const atualizarVisibilidadeDasLuzesDaNoite = function atualizarVisibilidadeDasLuzesDaNoite(forcar) {
        const noite = (CICLO_DE_DIA_E_NOITE.acesas || 0) > 0.0001, nivel = perfilDaQualidade();
        const assinatura = noite + '|' + nivel.luzesDosPostes + '|' + nivel.luzDaCasa + '|' + nivel.luzDosFarois;
        if (!forcar && assinatura === assinaturaDasLuzesDaNoite) return;
        assinaturaDasLuzesDaNoite = assinatura;
        luzesDosPostes.forEach((itemDoPool, indice) => { itemDoPool.luz.visible = noite && indice < nivel.luzesDosPostes; if (!itemDoPool.luz.visible) itemDoPool.luz.intensity = 0; });
        luzDaCasa.visible = noite && nivel.luzDaCasa; luzDosFarois.visible = noite && nivel.luzDosFarois;
        if (!luzDaCasa.visible) luzDaCasa.intensity = 0; if (!luzDosFarois.visible) luzDosFarois.intensity = 0;
      };
      // Aplica ao renderizador e às luzes o nível de qualidade atual (QUALIDADE_GRAFICA.atual). Pode ser chamada quantas vezes for preciso.
      const atualizarQualidadeDeRenderizacao = function atualizarQualidadeDeRenderizacao() {
        MODO_LEVE.ativo = QUALIDADE_GRAFICA.atual === 'baixo';
        const leve = MODO_LEVE.ativo, nivel = perfilDaQualidade();
        // A) Sombras: desligar castShadow do sol/lua faz os materiais deixarem de ler o mapa de sombra; desligar shadowMap
        //    evita que o mapa continue sendo desenhado a cada quadro. (Na troca os materiais recompilam uma vez.)
        //    Etapa 0: a resolução do mapa segue o nível; ao mudar, o mapa antigo é liberado e recriado no próximo desenho.
        if (luzDoSol.shadow.mapSize.x !== nivel.mapaDeSombra) {
          luzDoSol.shadow.mapSize.set(nivel.mapaDeSombra, nivel.mapaDeSombra);
          if (luzDoSol.shadow.map) { luzDoSol.shadow.map.dispose(); luzDoSol.shadow.map = null; }
        }
        // Etapa 0: tipo da sombra (suave = PCF no alto; simples = Basic no médio). Mudar o tipo exige recompilar os materiais uma vez.
        const tipoDeSombra = nivel.tipoDeSombra === 'suave' ? THREE.PCFShadowMap : THREE.BasicShadowMap;
        if (renderizador.shadowMap.type !== tipoDeSombra) {
          renderizador.shadowMap.type = tipoDeSombra;
          cena.traverse(objeto => { if (objeto.material) (Array.isArray(objeto.material) ? objeto.material : [objeto.material]).forEach(materialDoObjeto => { materialDoObjeto.needsUpdate = true; }); });
        }
        luzDoSol.castShadow = leve || !nivel.sombras ? false : QUALIDADE_NORMAL.sombraDoSol;
        renderizador.shadowMap.enabled = leve || !nivel.sombras ? false : QUALIDADE_NORMAL.sombras;
        if (renderizador.shadowMap.enabled) renderizador.shadowMap.needsUpdate = true;
        // B) Resolução: no máximo 1 no Modo Leve (2 no normal), sempre a partir da densidade ATUAL da tela (zoom incluído).
        ajustarTamanhoDaTela();
        // C) Luzes dinâmicas: luzes invisíveis saem do cálculo de iluminação. Ao voltar, as seções 20 recalculam as
        //    intensidades no quadro seguinte, conforme a hora do dia.
        atualizarVisibilidadeDasLuzesDaNoite(true);   // Etapa 0b: só à noite e até a cota do nível (ver abaixo)
        // D) Nuvens baixas, abaixo da ilha: Etapa 0b — voltam a aparecer em todos os níveis (1 chamada de desenho; preservam o visual).
        nuvensDeBaixoDaIlha.visible = true;
        atualizarBotaoDoModoLeve();
      };
      // ---- Etapa 0: escolha do jogador e ajustes do modo Automático ----
      let ultimaTrocaDeQualidadeEm = 0;   // performance.now() da última troca (o monitor da seção 30d ignora os quadros logo depois)
      const aplicarNivelDeQualidade = function aplicarNivelDeQualidade(nivel) {
        if (!NIVEIS_DE_QUALIDADE[nivel]) return;
        QUALIDADE_GRAFICA.atual = nivel; ultimaTrocaDeQualidadeEm = performance.now();
        atualizarQualidadeDeRenderizacao(); salvarPreferenciaDoModoLeve();
      };
      // Escolha manual (menu): 'auto', 'baixo', 'medio' ou 'alto'. Voltar ao Automático libera de novo o teste dos níveis acima.
      const definirEscolhaDeQualidade = function definirEscolhaDeQualidade(escolha) {
        if (escolha !== 'auto' && !NIVEIS_DE_QUALIDADE[escolha]) return;
        QUALIDADE_GRAFICA.escolha = escolha;
        if (escolha === 'auto') { QUALIDADE_GRAFICA.teto = 'alto'; aplicarNivelDeQualidade(QUALIDADE_GRAFICA.detectado || QUALIDADE_GRAFICA.atual); }
        else aplicarNivelDeQualidade(escolha);
      };
      // Mantidas para compatibilidade com a versão anterior (Modo Leve = nível baixo; desligar volta ao nível alto, como antes).
      const ativarModoLeve = function ativarModoLeve() { definirEscolhaDeQualidade('baixo'); };
      const desativarModoLeve = function desativarModoLeve() { definirEscolhaDeQualidade('alto'); };
      const quadrosEntreAsSombras = () => perfilDaQualidade().quadrosEntreSombras;   // usado pelo loop (seção 31)
      const escolherQualidadeNoMenu = function escolherQualidadeNoMenu(escolha) {
        if (escolha === QUALIDADE_GRAFICA.escolha) return;
        definirEscolhaDeQualidade(escolha);
        const nivel = NIVEIS_DE_QUALIDADE[QUALIDADE_GRAFICA.atual];
        const recarregar = nivel.antialias !== QUALIDADE_GRAFICA.antialiasNaAbertura ? ' A suavização das bordas muda quando a página for recarregada.' : '';
        mostrarAviso(QUALIDADE_GRAFICA.escolha === 'auto' ? '🎨 Qualidade automática: o jogo mede o desempenho e ajusta sozinho (agora: ' + nivel.nome + ').' + recarregar : '🎨 Qualidade ' + nivel.nome + ' aplicada.' + recarregar);
      };
      if (seletorDaQualidade) {
        seletorDaQualidade.addEventListener('click', evento => { const opcao = evento.target.closest('[data-qualidade]'); if (opcao) { escolherQualidadeNoMenu(opcao.dataset.qualidade); opcao.focus(); } });
        // Teclado (padrão de grupo de rádio): setas mudam a escolha; Home/End vão às pontas. As teclas não chegam à câmera.
        seletorDaQualidade.addEventListener('keydown', evento => {
          const atual = opcoesDeQualidade.indexOf(document.activeElement); if (atual < 0) return;
          const destino = { ArrowRight: atual + 1, ArrowDown: atual + 1, ArrowLeft: atual - 1, ArrowUp: atual - 1, Home: 0, End: opcoesDeQualidade.length - 1 }[evento.key];
          if (destino === undefined) return;
          evento.preventDefault(); evento.stopPropagation();
          const opcao = opcoesDeQualidade[(destino + opcoesDeQualidade.length) % opcoesDeQualidade.length];
          escolherQualidadeNoMenu(opcao.dataset.qualidade); opcao.focus();
        });
      }
      if (botaoDoModoLeve) botaoDoModoLeve.onclick = () => {
        if (MODO_LEVE.ativo) desativarModoLeve(); else ativarModoLeve();
        mostrarAviso(MODO_LEVE.ativo ? '⚡ Modo Leve ligado: sem sombras e luzes dinâmicas, resolução reduzida' : '✨ Modo Leve desligado: qualidade normal restaurada');
      };
      atualizarQualidadeDeRenderizacao();   // aplica a preferência salva já na abertura do jogo
      salvarPreferenciaDoModoLeve();        // grava a migração do Modo Leve antigo e a avaliação inicial do Automático

      arquivoDaMontagemConcluido('21-modo-leve.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
