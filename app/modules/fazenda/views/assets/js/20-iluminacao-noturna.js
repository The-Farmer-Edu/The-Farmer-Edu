      // ====================================================================================================
      // FARMEDU 3D — 20-iluminacao-noturna.js (Fase 3B da refatoração: seção 20)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================
      // ====================================================================================================
      // SEÇÃO 20 — ILUMINAÇÃO ARTIFICIAL NOTURNA: POSTES, LAMPIÕES, CASA E TRATOR
      // Postes e lampiões têm lanterna, halo e brilho no chão (materiais compartilhados, controlados pelo ciclo). Só algumas luzes
      // reais seguem o foco da câmera e são DIVIDIDAS entre postes e lampiões das construções. Além delas há só duas luzes
      // dedicadas: a luz quente da casa e a luz de foco dos faróis do trator. Tudo acende ao entardecer e apaga ao amanhecer.
      // ====================================================================================================
      // Pool de luzes reais (LUZES_DINAMICAS_DOS_POSTES): cada uma acompanha o ponto de luz (poste ou lampião) mais próximo do foco
      // da câmera que esteja livre. A troca é feita com fade, sem "piscadas". Nenhuma luz é criada ou removida durante o jogo
      // (isso obrigaria o renderizador a recompilar os materiais).
      const luzesDosPostes = Array.from({ length: LUZES_DINAMICAS_DOS_POSTES }, () => {
        const luz = new THREE.PointLight(0xffb45e, 0, 15, 1.6); luz.position.set(0, -50, 0); cena.add(luz);
        return { luz, ponto: null, nivel: 0 };
      });
      let proximosPontosDeLuz = [], temporizadorDosPostes = 0;
      const posicaoDoLampiao = new THREE.Vector3();
      // Lista os pontos que podem receber uma luz real: todos os postes (lanterna a 2,3 de altura) e todas as cabeças de lampião
      // das construções que estão na cena (posição atual no mundo). "chave" identifica o ponto entre uma atualização e outra.
      const listarPontosDeLuzArtificial = function listarPontosDeLuzArtificial() {
        const pontos = postesDaFazenda.map(poste => ({ chave: poste, x: poste.x, y: 2.3, z: poste.z, forca: 1 }));
        for (const idDaArea in lampioesDasConstrucoes) for (const lampiao of lampioesDasConstrucoes[idDaArea]) {
          if (!lampiao.parent) continue;
          lampiao.getWorldPosition(posicaoDoLampiao);
          pontos.push({ chave: lampiao, x: posicaoDoLampiao.x, y: posicaoDoLampiao.y, z: posicaoDoLampiao.z, forca: ILUMINACAO_NOTURNA.forcaDosLampioes });
        }
        return pontos;
      };
      // Escolhe periodicamente os pontos de luz mais próximos do foco da câmera para receberem as poucas luzes reais e faz cada
      // luz acender/apagar aos poucos (sem piscar), acompanhando o ciclo de dia e noite.
      const atualizarLuzesDosPostes = function atualizarLuzesDosPostes(segundosDesdeUltimoFrame, tempo) {
        if (MODO_LEVE.ativo) return;   // Modo Leve: as luzes do pool ficam desligadas (seção 21); nem a escolha dos postes é feita
        temporizadorDosPostes -= segundosDesdeUltimoFrame;
        if (temporizadorDosPostes <= 0) {
          temporizadorDosPostes = 0.35;
          const focoX = alvoAtualDaCamera.x, focoZ = alvoAtualDaCamera.z;
          proximosPontosDeLuz = listarPontosDeLuzArtificial().map(ponto => [Math.hypot(ponto.x - focoX, ponto.z - focoZ), ponto]).sort((itemA, itemB) => itemA[0] - itemB[0]).slice(0, luzesDosPostes.length).map(item => item[1]);
        }
        for (const luzDoPoste of luzesDosPostes) {   // quem saiu da lista apaga aos poucos; quem entrou espera uma luz livre
          const atualizado = luzDoPoste.ponto && proximosPontosDeLuz.find(ponto => ponto.chave === luzDoPoste.ponto.chave);
          if (atualizado) { luzDoPoste.ponto = atualizado; luzDoPoste.luz.position.set(atualizado.x, atualizado.y, atualizado.z); }
          luzDoPoste.nivel = Math.min(1, Math.max(0, luzDoPoste.nivel + (atualizado ? 1 : -1) * segundosDesdeUltimoFrame * 1.6));
          if (!atualizado && luzDoPoste.nivel === 0) luzDoPoste.ponto = null;
        }
        for (const ponto of proximosPontosDeLuz) {
          if (luzesDosPostes.some(luzDoPoste => luzDoPoste.ponto && luzDoPoste.ponto.chave === ponto.chave)) continue;
          const livre = luzesDosPostes.find(luzDoPoste => !luzDoPoste.ponto);
          if (livre) { livre.ponto = ponto; livre.luz.position.set(ponto.x, ponto.y, ponto.z); }
        }
        const acesas = CICLO_DE_DIA_E_NOITE.acesas || 0;
        luzesDosPostes.forEach((luzDoPoste, indiceDaLuz) => { luzDoPoste.luz.intensity = luzDoPoste.ponto ? 1.5 * luzDoPoste.nivel * acesas * luzDoPoste.ponto.forca * (1 + 0.04 * Math.sin(tempo * 7 + indiceDaLuz * 2.1)) : 0; });
      };

      // ---- Luzes dedicadas: casa e faróis do trator (criadas uma única vez; ficam com intensidade 0 de dia ou sem dono) ----
      const luzDaCasa = new THREE.PointLight(ILUMINACAO_NOTURNA.luzDaCasa.cor, 0, ILUMINACAO_NOTURNA.luzDaCasa.alcance, 1.4);
      luzDaCasa.position.set(0, -50, 0); cena.add(luzDaCasa);
      const CONFIGURACAO_DOS_FAROIS = ILUMINACAO_NOTURNA.farois;
      const luzDosFarois = new THREE.SpotLight(CONFIGURACAO_DOS_FAROIS.cor, 0, CONFIGURACAO_DOS_FAROIS.alcance, CONFIGURACAO_DOS_FAROIS.abertura, 0.45, 1.2);
      luzDosFarois.position.set(0, -50, 0); cena.add(luzDosFarois); cena.add(luzDosFarois.target);
      const COR_APAGADA_DO_FAROL = new THREE.Color(0x9aa3a8), COR_ACESA_DO_FAROL = new THREE.Color(0xfff6dc);
      // Aplica o fator "acesas" do ciclo (0 de dia, 1 à noite) às janelas da casa, à luz da casa e aos faróis do trator. A luz
      // da casa e a dos faróis seguem a posição do modelo atual (a casa e o maquinário podem ser reconstruídos ao evoluir).
      // No Modo Leve só as luzes reais ficam desligadas: janelas acesas, lentes, halos e feixe no chão continuam funcionando.
      const atualizarIluminacaoNoturna = function atualizarIluminacaoNoturna(segundosDesdeUltimoFrame, tempo) {
        const acesas = CICLO_DE_DIA_E_NOITE.acesas || 0;
        // casa: janelas com luz de dentro (oscilação mínima, como uma lâmpada quente) e luz real saindo pela frente
        materialDaJanelaAcesa.emissiveIntensity = acesas * ILUMINACAO_NOTURNA.intensidadeDasJanelas * (0.96 + 0.04 * Math.sin(tempo * 1.7));
        placaDeBoasVindas.materialDoTexto.emissiveIntensity = acesas * ILUMINACAO_NOTURNA.brilhoDaPlacaANoite;   // Mark 8.3: placa legível à noite (0 de dia)
        if (!MODO_LEVE.ativo && marcadorDaLuzDaCasa && marcadorDaLuzDaCasa.parent && acesas > 0.001) {
          marcadorDaLuzDaCasa.getWorldPosition(luzDaCasa.position);
          luzDaCasa.intensity = acesas * ILUMINACAO_NOTURNA.luzDaCasa.intensidade;
        } else luzDaCasa.intensity = 0;
        // trator: lentes, halo e feixe no chão acendem juntos; a luz de foco aponta para a frente do trator, rente ao chão
        materialDaLenteDoFarol.color.copy(COR_APAGADA_DO_FAROL).lerp(COR_ACESA_DO_FAROL, acesas);
        materialDoHaloDoFarol.opacity = acesas * 0.9; materialDoFeixeNoChao.opacity = acesas * 0.8;
        materialDoHaloDoFarol.visible = materialDoFeixeNoChao.visible = acesas > 0.01;
        const trator = farolDoTrator && farolDoTrator.trator;
        if (!MODO_LEVE.ativo && trator && trator.parent && acesas > 0.001) {
          trator.updateWorldMatrix(true, false);
          luzDosFarois.position.copy(farolDoTrator.origem); trator.localToWorld(luzDosFarois.position);
          luzDosFarois.target.position.copy(farolDoTrator.alvo); trator.localToWorld(luzDosFarois.target.position); luzDosFarois.target.updateMatrixWorld();
          luzDosFarois.intensity = acesas * CONFIGURACAO_DOS_FAROIS.intensidade;
        } else luzDosFarois.intensity = 0;
      };

      arquivoDaMontagemConcluido('20-iluminacao-noturna.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
