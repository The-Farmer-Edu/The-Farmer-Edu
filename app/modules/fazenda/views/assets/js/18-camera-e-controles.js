      // ====================================================================================================
      // FARMEDU 3D — 18-camera-e-controles.js (Fase 3B da refatoração: seção 18)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================

      // ====================================================================================================
      // SEÇÃO 18 — CÂMERA E CONTROLES
      // Órbita da câmera ao redor do alvo, zoom, arrastar e pinçar, foco numa área e o enquadramento inicial.
      // ====================================================================================================
      let anguloHorizontal = -0.2, anguloVertical = 0.5, jogadorMexeu = false, olharParaCima = 0;
      const OLHAR_MAXIMO = 1.0, ELEVACAO_MINIMA = 0.35, ELEVACAO_MAXIMA = 1.35;
      // Enquadramento inicial: o alvo avançou um pouco para a frente (antes z = 6; distâncias antes 47/66) para que a praça
      // central apareça junto com as construções. Para voltar ao enquadramento antigo, use [0, 0, 6] e 47/66.
      const ALVO_INICIAL_DA_CAMERA = [1, 0, 15], DISTANCIA_INICIAL = { paisagem: 54, retrato: 72 };
      let distanciaDaCamera = innerWidth < innerHeight ? DISTANCIA_INICIAL.retrato : DISTANCIA_INICIAL.paisagem;
      const DISTANCIA_MINIMA = 12, DISTANCIA_MAXIMA = 100;
      const alvoAtualDaCamera = new THREE.Vector3(...ALVO_INICIAL_DA_CAMERA), alvoDestinoDaCamera = alvoAtualDaCamera.clone();
      // Move o alvo da câmera para a área e aproxima o zoom/ângulo aos poucos (animação por setInterval).
      const focarCameraNaArea = function focarCameraNaArea(idDaArea) {
        jogadorMexeu = true; olharParaCima = 0;
        const area = AREAS.find(areaDaLista => areaDaLista.id === idDaArea);
        alvoDestinoDaCamera.set(area.posicao.x, 0, area.posicao.z);
        let intervaloDoZoom = setInterval((argumentoDoIntervalo) => {
          if (distanciaDaCamera > 20) {
            distanciaDaCamera -= 2;
          } else if (anguloHorizontal > -0.38600000000000023) {
            anguloHorizontal -= 0.05;
            if (anguloVertical > 0.38499999999999956) {
              anguloVertical -= 0.05;
            }
          } else {
            clearInterval(intervaloDoZoom);
          }
        }, 10);
      };
      // Inclinação vertical contínua: arrastar para baixo/cima primeiro move a câmera (órbita), e ao chegar na elevação
      // mínima passa a inclinar o olhar para o céu (rotação real da câmera, sem entrar no chão). delta > 0 = olhar mais para baixo.
      const ajustarInclinacao = function ajustarInclinacao(delta) {
        if (!delta) return;
        jogadorMexeu = true;
        if (delta > 0) {
          const ajuste = Math.min(olharParaCima, delta); olharParaCima -= ajuste; delta -= ajuste;
          anguloVertical = Math.min(ELEVACAO_MAXIMA, anguloVertical + delta);
        } else {
          const ajuste = Math.min(anguloVertical - ELEVACAO_MINIMA, -delta); anguloVertical -= ajuste; delta += ajuste;
          olharParaCima = Math.min(OLHAR_MAXIMO, olharParaCima - delta);
        }
      };
      // Calcula a posição da câmera na órbita ao redor do alvo (ângulos e distância) e a aponta para ele.
      const posicionarCamera = function posicionarCamera() {
        camera.position.set(
          alvoAtualDaCamera.x + distanciaDaCamera * Math.cos(anguloVertical) * Math.sin(anguloHorizontal),
          alvoAtualDaCamera.y + distanciaDaCamera * Math.sin(anguloVertical), // acompanha a altura do alvo (Espaço/Ctrl)
          alvoAtualDaCamera.z + distanciaDaCamera * Math.cos(anguloVertical) * Math.cos(anguloHorizontal)
        );
        camera.lookAt(alvoAtualDaCamera);
        if (olharParaCima) camera.rotateX(olharParaCima);
      };
      // Posição inicial fixa (alvo, ângulos e altura); só a distância muda conforme a tela (retrato precisa de mais recuo).
      // Câmera a ~22 de altura sobre o gramado: acima de qualquer árvore/edifício e fora de montanhas.
      const enquadrarInicio = function enquadrarInicio() { distanciaDaCamera = camera.aspect < 0.9 ? DISTANCIA_INICIAL.retrato : DISTANCIA_INICIAL.paisagem; };
      // Ajusta renderizador e câmera ao tamanho da janela; antes de o jogador mexer, refaz o enquadramento
      // inicial.
      // ---- Resolução de renderização (correção da Mark 8.2 para o zoom do navegador) ----
      // CAUSA DO PROBLEMA: o pixelRatio era calculado UMA vez ao abrir (Math.min(devicePixelRatio, 2)) e nunca mais. O zoom do
      // navegador muda devicePixelRatio e o tamanho da janela em pixels CSS: com o valor congelado, o canvas passava a ter
      // muito menos pixels que a tela (imagem borrada no zoom) ou MUITO mais (ex.: aberto com zoom 200% e depois voltado a 100%
      // → pixelRatio 2 numa tela comum = 4× mais pixels por quadro → queda brusca de FPS e até travamento). Além disso, cada evento
      // de resize do zoom realocava o canvas várias vezes seguidas.
      // CORREÇÃO: o pixelRatio é recalculado a cada mudança de tamanho/densidade a partir do devicePixelRatio ATUAL (nunca acima
      // do limite do modo: 2 no normal, 1 no Modo Leve) e há um teto de pixels por quadro como proteção extra. Os eventos de
      // resize são agrupados em um único ajuste por quadro. Não existe outro loop de renderização: só o renderizador é ajustado.
      const LIMITE_DE_PIXEL_RATIO_NORMAL = 2;
      const ORCAMENTO_DE_PIXELS_POR_QUADRO = { normal: 3840 * 2160, leve: 1920 * 1080 };
      const calcularPixelRatioDeRenderizacao = function calcularPixelRatioDeRenderizacao() {
        const densidadeAtual = window.devicePixelRatio || 1;                 // muda com o zoom do navegador e ao trocar de monitor
        let razao = Math.min(densidadeAtual, MODO_LEVE.ativo ? MODO_LEVE.limiteDePixelRatio : LIMITE_DE_PIXEL_RATIO_NORMAL);
        const pixelsCss = Math.max(1, innerWidth * innerHeight), orcamento = MODO_LEVE.ativo ? ORCAMENTO_DE_PIXELS_POR_QUADRO.leve : ORCAMENTO_DE_PIXELS_POR_QUADRO.normal;
        if (pixelsCss * razao * razao > orcamento) razao = Math.sqrt(orcamento / pixelsCss);
        return razao;
      };
      // Ajusta resolução, canvas e câmera ao tamanho atual da janela; antes de o jogador mexer, refaz o enquadramento inicial.
      const ajustarTamanhoDaTela = function ajustarTamanhoDaTela() {
        const razao = calcularPixelRatioDeRenderizacao();
        if (renderizador.getPixelRatio() !== razao) renderizador.setPixelRatio(razao);
        renderizador.setSize(innerWidth, innerHeight);
        uniformesDasEstrelas.uPixel.value = razao;                             // as estrelas mantêm o tamanho na tela
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        if (!jogadorMexeu) enquadrarInicio();
      };
      let ajusteDaTelaAgendado = false;
      const agendarAjusteDaTela = function agendarAjusteDaTela() { if (ajusteDaTelaAgendado) return; ajusteDaTelaAgendado = true; requestAnimationFrame(() => { ajusteDaTelaAgendado = false; ajustarTamanhoDaTela(); }); };
      addEventListener('resize', agendarAjusteDaTela);
      // Trocar de monitor (ou o zoom em alguns navegadores) pode mudar devicePixelRatio sem "resize": acompanha com matchMedia.
      const vigiarDensidadeDaTela = function vigiarDensidadeDaTela() {
        if (!window.matchMedia) return;
        const consulta = matchMedia('(resolution: ' + (window.devicePixelRatio || 1) + 'dppx)'), aoMudar = () => { agendarAjusteDaTela(); vigiarDensidadeDaTela(); };
        if (consulta.addEventListener) consulta.addEventListener('change', aoMudar, { once: true }); else if (consulta.addListener) consulta.addListener(aoMudar);
      };
      vigiarDensidadeDaTela();
      ajustarTamanhoDaTela();

      const dedosNaTela = new Map();
      canvas.addEventListener('pointerdown', evento => { jogadorMexeu = true; canvas.setPointerCapture(evento.pointerId); dedosNaTela.set(evento.pointerId, [evento.clientX, evento.clientY]); });
      canvas.addEventListener('pointermove', evento => {
        const anterior = dedosNaTela.get(evento.pointerId);
        if (!anterior) return;
        if (dedosNaTela.size === 1) {
          anguloHorizontal -= (evento.clientX - anterior[0]) * 0.006;
          ajustarInclinacao((evento.clientY - anterior[1]) * 0.005);
        } else {
          const outro = [...dedosNaTela.entries()].find(([idDoToque]) => idDoToque !== evento.pointerId)[1];
          const antes = Math.hypot(anterior[0] - outro[0], anterior[1] - outro[1]);
          const agora = Math.hypot(evento.clientX - outro[0], evento.clientY - outro[1]);
          distanciaDaCamera = Math.min(DISTANCIA_MAXIMA, Math.max(DISTANCIA_MINIMA, distanciaDaCamera * antes / agora));
        }
        dedosNaTela.set(evento.pointerId, [evento.clientX, evento.clientY]);
      });
      ['pointerup', 'pointercancel'].forEach(nome => canvas.addEventListener(nome, evento => dedosNaTela.delete(evento.pointerId)));
      canvas.addEventListener('wheel', evento => { if (evento.ctrlKey || evento.metaKey) return;   // Ctrl/Cmd + roda (ou pinça) é o zoom do navegador: o jogo não reage nem bloqueia
        jogadorMexeu = true; distanciaDaCamera = Math.min(DISTANCIA_MAXIMA, Math.max(DISTANCIA_MINIMA, distanciaDaCamera + evento.deltaY * 0.03)); });

      arquivoDaMontagemConcluido('18-camera-e-controles.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
