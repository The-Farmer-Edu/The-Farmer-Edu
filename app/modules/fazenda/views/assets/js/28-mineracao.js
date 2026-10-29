      // ====================================================================================================
      // FARMEDU 3D — 28-mineracao.js (Fase 3B da refatoração: seção 28)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================
      // ====================================================================================================
      // SEÇÃO 28 — MINERAÇÃO: CICLO DO CARRINHO, MINÉRIOS E XP (MARK 8.2)
      // Máquina de estados salva em estado.mina: parado → indo (vazio, nos trilhos) → minerando (dentro do escuro por
      // MINERACAO_CONFIG.minutosMinerando) → voltando (carregado) → descarregando (minérios e XP creditados UMA vez) → indo...
      // Os tempos usam o relógio real (agoraNoJogo), então recarregar a página não repete nem pula recompensas. Tempo com a página
      // fechada conclui no máximo o ciclo em andamento (o próximo começa quando o jogo é aberto).
      // ====================================================================================================
      const distanciaDoInicioAteABoca = MINA_GEOMETRIA.inicio.distanceTo(MINA_GEOMETRIA.boca);
      const segundosDeViagemDoCarrinho = () => MINA_GEOMETRIA.comprimento / MINERACAO_CONFIG.velocidadeDoCarrinhoPorNivel[Math.max(1, estado.niveis.mina) - 1];
      const mudarFaseDaMina = function mudarFaseDaMina(fase, inicioDaFase) { estado.mina.fase = fase; estado.mina.inicioDaFase = inicioDaFase; salvarProgresso(); };
      const concluirCicloDaMina = function concluirCicloDaMina() {
        const nivel = estado.niveis.mina, minerios = MINERACAO_CONFIG.mineriosPorCicloPorNivel[nivel - 1], xp = MINERACAO_CONFIG.xpPorCicloPorNivel[nivel - 1];
        estado.recursos.minerios += minerios; estado.mina.ciclos++;
        creditarXP(xp);                                                           // salva
        mostrarAviso('⛏ O carrinho voltou da mina com ' + minerios + ' minérios! +' + xp + ' XP');
      };
      // Texto curto do estado da mina (cartão, painel e clique no cartão).
      const textoDoEstadoDaMina = function textoDoEstadoDaMina() {
        if (!estado.niveis.mina) return 'Mina não construída';
        const mina = estado.mina, restante = Math.max(0, mina.inicioDaFase + MINERACAO_CONFIG.minutosMinerando * 60000 - agoraNoJogo());
        if (mina.fase === 'minerando') return '⛏ Minerando · faltam ' + Math.ceil(restante / 60000) + ' min';
        return { parado: 'Preparando o carrinho', indo: '🛤 Carrinho entrando na caverna', voltando: '🛤 Carrinho voltando carregado', descarregando: '📦 Descarregando minérios' }[mina.fase];
      };
      const atualizarMineracao = function atualizarMineracao(segundosDesdeUltimoFrame) {
        const nivel = estado.niveis.mina, mina = estado.mina;
        if (!nivel) return;
        const agora = agoraNoJogo(), viagemMs = segundosDeViagemDoCarrinho() * 1000, minerandoMs = MINERACAO_CONFIG.minutosMinerando * 60000, descargaMs = MINERACAO_CONFIG.segundosDescarregando * 1000;
        if (mina.fase === 'parado') mudarFaseDaMina('indo', agora);
        for (let transicoes = 0; transicoes < 4; transicoes++) {                   // várias fases podem ter passado com a página fechada
          const decorrido = agora - mina.inicioDaFase;
          if (mina.fase === 'indo' && decorrido >= viagemMs) mudarFaseDaMina('minerando', mina.inicioDaFase + viagemMs);
          // a volta SEMPRE começa agora (nunca retroativa): mesmo que a mineração tenha terminado com a aba fechada ou em segundo
          // plano, o jogador vê o carrinho sair da caverna e percorrer o trilho inteiro — sem "teletransporte" para o depósito
          else if (mina.fase === 'minerando' && decorrido >= minerandoMs) mudarFaseDaMina('voltando', agora);
          else if (mina.fase === 'voltando' && decorrido >= viagemMs) { mudarFaseDaMina('descarregando', agora); concluirCicloDaMina(); }
          else if (mina.fase === 'descarregando' && decorrido >= descargaMs) mudarFaseDaMina('indo', agora);
          else break;
        }
        // posição do carrinho nos trilhos (fração 0 = depósito, 1 = fundo da caverna)
        if (!carrinhoDaMina) return;
        const decorrido = agora - mina.inicioDaFase;
        const fracao = mina.fase === 'indo' ? Math.min(1, decorrido / viagemMs) : mina.fase === 'minerando' ? 1 : mina.fase === 'voltando' ? 1 - Math.min(1, decorrido / viagemMs) : 0;
        const distancia = fracao * MINA_GEOMETRIA.comprimento, ponto = MINA_GEOMETRIA.inicio.clone().addScaledVector(MINA_GEOMETRIA.direcaoParaDentro, distancia).sub(carrinhoDaMina.origem);
        const anterior = carrinhoDaMina.grupo.position.clone();
        carrinhoDaMina.grupo.position.set(ponto.x, mina.fase === 'indo' || mina.fase === 'voltando' ? Math.abs(Math.sin(agora / 90)) * 0.012 : 0, ponto.z);
        // dentro da caverna o carrinho escurece aos poucos até sumir (e reaparece aos poucos na volta)
        const profundidadeDentro = distancia - distanciaDoInicioAteABoca, claridade = Math.max(0, Math.min(1, 1 - profundidadeDentro / MINERACAO_CONFIG.profundidadeDeEscurecimento));
        carrinhoDaMina.grupo.visible = claridade > 0.02;
        if (carrinhoDaMina.claridadeAplicada !== claridade) { carrinhoDaMina.claridadeAplicada = claridade; for (const [materialDaPeca, corOriginal] of carrinhoDaMina.materiais) materialDaPeca.color.copy(corOriginal).multiplyScalar(claridade); }
        carrinhoDaMina.carga.visible = mina.fase === 'voltando' || mina.fase === 'descarregando';
        const andou = anterior.distanceTo(carrinhoDaMina.grupo.position), sentido = mina.fase === 'voltando' ? -1 : 1;
        for (const roda of carrinhoDaMina.rodas) roda.rotation.x += sentido * andou / 0.17;
      };

      arquivoDaMontagemConcluido('28-mineracao.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
