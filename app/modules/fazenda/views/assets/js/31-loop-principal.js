      // ====================================================================================================
      // FARMEDU 3D — 31-loop-principal.js (Fase 3B da refatoração: seção 31)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================
      // ====================================================================================================
      // SEÇÃO 31 — LOOP PRINCIPAL (ATUALIZAÇÃO E DESENHO A CADA QUADRO)
      // Tudo o que se move é atualizado aqui com o tempo decorrido desde o quadro anterior (independente da taxa de quadros).
      // ====================================================================================================
      const relogio = new THREE.Clock();
      // Controle do primeiro quadro: a seção 28 liga o loop UMA vez e espera este quadro ser desenhado para encerrar a tela de
      // carregamento. Se o primeiro quadro falhar, o loop para e o erro vai para a tela de carregamento (em vez de travar nela).
      let aoTerminarPrimeiroQuadro = null, loopInterrompido = false;
      // Loop principal (requestAnimationFrame). A cada quadro: mede o tempo, atualiza ciclo de dia e noite,
      // fazendeiros, luzes, pedra secreta, áudio, invasões, câmera, nuvens, água e animais, e desenha a cena.
      const animarCena = function animarCena() {
        if (loopInterrompido) return;
        requestAnimationFrame(animarCena);
        if (!aoTerminarPrimeiroQuadro) { atualizarEDesenharQuadro(); return; }
        const avisar = aoTerminarPrimeiroQuadro;
        try { atualizarEDesenharQuadro(); aoTerminarPrimeiroQuadro = null; avisar.resolver(); }
        catch (erro) { loopInterrompido = true; avisar.rejeitar(erro); }
      };
      // Um quadro completo do jogo (chamado só por animarCena).
      const atualizarEDesenharQuadro = function atualizarEDesenharQuadro() {
        const segundosDesdeUltimoFrame = Math.min(relogio.getDelta(), 0.05), tempo = relogio.elapsedTime;
        atualizarMovimento(segundosDesdeUltimoFrame, shiftPressionado);
        atualizarCicloDiaNoite(segundosDesdeUltimoFrame);                 // dia e noite: céu, sol, lua, estrelas, luzes e cores
        atualizarFazendeiros(segundosDesdeUltimoFrame, tempo);
        atualizarLuzesDosPostes(segundosDesdeUltimoFrame, tempo);
        atualizarIluminacaoNoturna(segundosDesdeUltimoFrame, tempo);        // janelas e luz da casa, faróis do trator
        atualizarPedraSecreta(tempo, segundosDesdeUltimoFrame);
        atualizarAudio(segundosDesdeUltimoFrame, tempo);
        atualizarInvasao(segundosDesdeUltimoFrame, tempo);               // mobs, ataque e conferência do relógio real
        atualizarSistemasDaMark82(segundosDesdeUltimoFrame, tempo);      // mina, trabalhadores, monstros noturnos, lavoura e animais
        atualizarPainelDeTempo(false);
        for (const animar of animacoesDoCenario) animar(tempo, segundosDesdeUltimoFrame);
        for (const idDaArea in animacoesDaArea) for (const animar of animacoesDaArea[idDaArea]) animar(tempo, segundosDesdeUltimoFrame);
        for (const idDaArea in grupoDaArea) {
          const grupoDaInstalacao = grupoDaArea[idDaArea];
          if (grupoDaInstalacao.userData.progressoDoEfeitoDeEvolucao > 0) {
            grupoDaInstalacao.userData.progressoDoEfeitoDeEvolucao = Math.max(0, grupoDaInstalacao.userData.progressoDoEfeitoDeEvolucao - segundosDesdeUltimoFrame * 1.5);
            grupoDaInstalacao.scale.setScalar(1 + 0.2 * Math.sin(grupoDaInstalacao.userData.progressoDoEfeitoDeEvolucao * Math.PI));
          }
        }
        for (const nuvem of nuvens) {
          const dadosDaNuvem = nuvem.userData, borda = 105;
          nuvem.position[dadosDaNuvem.eixo] += segundosDesdeUltimoFrame * dadosDaNuvem.velocidade;
          if (nuvem.position[dadosDaNuvem.eixo] > borda) nuvem.position[dadosDaNuvem.eixo] = -borda; // reaparece já invisível (fade), sem salto
          nuvem.position.y = dadosDaNuvem.yBase + Math.sin(tempo * 0.1 + dadosDaNuvem.fase) * 0.6;
          dadosDaNuvem.mat.opacity = ESTADO_DO_CEU.opacidadeDasNuvens * 0.92 * Math.min(1, Math.max(0, (borda - Math.abs(nuvem.position[dadosDaNuvem.eixo])) / 20));
          dadosDaNuvem.mat.color.copy(ESTADO_DO_CEU.nuvem); dadosDaNuvem.mat.emissive.copy(ESTADO_DO_CEU.nuvemEmissiva); // nuvens seguem a cor do céu e continuam visíveis à noite
        }
        alvoAtualDaCamera.lerp(alvoDestinoDaCamera, 0.06);
        posicionarCamera();
        atualizarCeu(tempo);
        contadorDeQuadrosDaSombra = (contadorDeQuadrosDaSombra + 1) % INTERVALO_DE_QUADROS_DA_SOMBRA;
        if (renderizador.shadowMap.enabled && contadorDeQuadrosDaSombra === 0) renderizador.shadowMap.needsUpdate = true;
        renderizador.render(cena, camera);
      };
      let contadorDeQuadrosDaSombra = 0;
      // (animarCena() é chamada uma única vez, na seção 28, quando todo o resto já está pronto.)

      arquivoDaMontagemConcluido('31-loop-principal.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
