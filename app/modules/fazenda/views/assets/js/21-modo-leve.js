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

      const salvarPreferenciaDoModoLeve = function salvarPreferenciaDoModoLeve() { try { localStorage.setItem(CHAVE_DO_MODO_LEVE, MODO_LEVE.ativo ? 'ligado' : 'desligado'); } catch (erro) { } };
      const atualizarBotaoDoModoLeve = function atualizarBotaoDoModoLeve() {
        botaoDoModoLeve.setAttribute('aria-pressed', String(MODO_LEVE.ativo));
        botaoDoModoLeve.querySelector('.estado-modo-leve').textContent = MODO_LEVE.ativo ? 'ligado' : 'desligado';
      };
      // Aplica ao renderizador e às luzes a qualidade correspondente a MODO_LEVE.ativo. Pode ser chamada quantas vezes for preciso.
      const atualizarQualidadeDeRenderizacao = function atualizarQualidadeDeRenderizacao() {
        const leve = MODO_LEVE.ativo;
        // A) Sombras: desligar castShadow do sol/lua faz os materiais deixarem de ler o mapa de sombra; desligar shadowMap
        //    evita que o mapa continue sendo desenhado a cada quadro. (Na troca os materiais recompilam uma vez.)
        luzDoSol.castShadow = leve ? false : QUALIDADE_NORMAL.sombraDoSol;
        renderizador.shadowMap.enabled = leve ? false : QUALIDADE_NORMAL.sombras;
        if (!leve) renderizador.shadowMap.needsUpdate = true;
        // B) Resolução: no máximo 1 no Modo Leve (2 no normal), sempre a partir da densidade ATUAL da tela (zoom incluído).
        ajustarTamanhoDaTela();
        // C) Luzes dinâmicas: luzes invisíveis saem do cálculo de iluminação. Ao voltar, as seções 20 recalculam as
        //    intensidades no quadro seguinte, conforme a hora do dia.
        for (const luz of luzesDinamicasDaNoite()) { luz.visible = !leve; if (leve) luz.intensity = 0; }
        atualizarBotaoDoModoLeve();
      };
      const ativarModoLeve = function ativarModoLeve() { MODO_LEVE.ativo = true; salvarPreferenciaDoModoLeve(); atualizarQualidadeDeRenderizacao(); };
      const desativarModoLeve = function desativarModoLeve() { MODO_LEVE.ativo = false; salvarPreferenciaDoModoLeve(); atualizarQualidadeDeRenderizacao(); };
      botaoDoModoLeve.onclick = () => {
        if (MODO_LEVE.ativo) desativarModoLeve(); else ativarModoLeve();
        mostrarAviso(MODO_LEVE.ativo ? '⚡ Modo Leve ligado: sem sombras e luzes dinâmicas, resolução reduzida' : '✨ Modo Leve desligado: qualidade normal restaurada');
      };
      atualizarQualidadeDeRenderizacao();   // aplica a preferência salva já na abertura do jogo

      arquivoDaMontagemConcluido('21-modo-leve.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
