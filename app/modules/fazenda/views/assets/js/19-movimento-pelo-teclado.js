      // ====================================================================================================
      // FARMEDU 3D — 19-movimento-pelo-teclado.js (Fase 3B da refatoração: seção 19)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================
      // ====================================================================================================
      // SEÇÃO 19 — MOVIMENTO DO ALVO DA CÂMERA (TECLADO)
      // Setas giram e inclinam, WASD andam, Espaço/Ctrl sobem e descem, Shift acelera. O alvo respeita os limites do mapa.
      // ====================================================================================================
      const teclas = { KeyW: false, KeyA: false, KeyS: false, KeyD: false, ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, Space: false, ControlLeft: false, ControlRight: false, KeyC: false };
      const ALTURA_MAXIMA_DO_ALVO = 45, VELOCIDADE_VERTICAL = 14; // Espaço sobe · Ctrl (ou C) desce
      const LIMITE_DO_MAPA = 75;       // limite reduzido para acompanhar o mapa compacto
      const VELOCIDADE_BASE = 0.6;     // unidades/s para cada unidade de distância da câmera
      const VELOCIDADE_COM_SHIFT = 1.8; // multiplicador ao segurar Shift

      // Combinações com Ctrl, Cmd ou Alt (Ctrl+S, Ctrl+C, Ctrl+Shift+I...) são do navegador: o jogo não as captura nem as
      // bloqueia. Ctrl sozinho continua servindo para descer a câmera (sem preventDefault, para não interferir em atalhos).
      const ehTeclaDeControle = codigo => codigo === 'ControlLeft' || codigo === 'ControlRight';
      const descendoComCtrl = () => teclas.ControlLeft || teclas.ControlRight;
      // Fazenda 8.4 (C2): com o Ctrl do jogo pressionado (descendo), WASD, setas e Espaço continuam valendo e o atalho do navegador
      // (Ctrl+S, Ctrl+A, Ctrl+D...) é bloqueado só nessas teclas. Ctrl+C fica com o navegador (C já desce sozinho). Ctrl+W, Ctrl+T e
      // Ctrl+N são reservados pelo Chrome e nem chegam à página: por isso o aviso de saída abaixo e a dica "C + W" no menu.
      const combinacaoDoJogo = evento => ehTeclaDeControle(evento.code) || !(evento.ctrlKey || evento.metaKey || evento.altKey)
        || (evento.ctrlKey && !evento.metaKey && !evento.altKey && descendoComCtrl() && evento.code !== 'KeyC');
      addEventListener('keydown', evento => {
        if (evento.target && evento.target.closest && evento.target.closest('input, textarea, select, [contenteditable="true"]')) return;   // Mark 8.3: digitando (ex.: nome da fazenda)
        if (!evento.ctrlKey && descendoComCtrl()) teclas.ControlLeft = teclas.ControlRight = false;   // Ctrl solto fora da página (keyup perdido)
        if (evento.code in teclas && combinacaoDoJogo(evento)) {
          jogadorMexeu = true; teclas[evento.code] = true;
          if (!ehTeclaDeControle(evento.code)) evento.preventDefault();
          if (evento.code === 'Space' && document.activeElement && document.activeElement.blur) document.activeElement.blur(); // Espaço não aciona o botão focado
        }
      });
      addEventListener('keyup', evento => { if (evento.code in teclas) { teclas[evento.code] = false; if (evento.code === 'Space') evento.preventDefault(); } });
      addEventListener('blur', () => { for (const tecla in teclas) teclas[tecla] = false; }); // evita tecla "presa" ao trocar de aba
      // Se o Ctrl+W escapar enquanto o jogador desce com Ctrl, o navegador pergunta antes de fechar a aba (não é garantido: o
      // Chrome só mostra a pergunta se já houve interação com a página, e o texto é o padrão dele).
      addEventListener('beforeunload', evento => { if (descendoComCtrl()) { evento.preventDefault(); evento.returnValue = ''; } });

      const frente = new THREE.Vector3(), direita = new THREE.Vector3(), deslocamento = new THREE.Vector3();

      // Move o alvo da câmera com as teclas (setas giram, WASD andam, Espaço/Ctrl sobem/descem), respeitando o
      // limite do mapa e acelerando com Shift.
      const atualizarMovimento = function atualizarMovimento(segundosDesdeUltimoFrame, shift) {
        anguloHorizontal += ((teclas.ArrowLeft ? 1 : 0) - (teclas.ArrowRight ? 1 : 0)) * 1.4 * segundosDesdeUltimoFrame;   // setas: girar e inclinar
        ajustarInclinacao(((teclas.ArrowDown ? 1 : 0) - (teclas.ArrowUp ? 1 : 0)) * 1.2 * segundosDesdeUltimoFrame);
        const vertical = (teclas.Space ? 1 : 0) - ((teclas.ControlLeft || teclas.ControlRight || teclas.KeyC) ? 1 : 0);
        if (vertical) for (const alvo of [alvoDestinoDaCamera, alvoAtualDaCamera]) // altura do alvo ≥ 0: a câmera nunca desce abaixo do chão
          alvo.y = Math.max(0, Math.min(ALTURA_MAXIMA_DO_ALVO, alvo.y + vertical * VELOCIDADE_VERTICAL * (shift ? VELOCIDADE_COM_SHIFT : 1) * segundosDesdeUltimoFrame));
        let avanco = (teclas.KeyW ? 1 : 0) - (teclas.KeyS ? 1 : 0);
        let lateral = (teclas.KeyD ? 1 : 0) - (teclas.KeyA ? 1 : 0);
        if (!avanco && !lateral) return;

        // A câmera fica em (sin h, cos h) em relação ao alvo, então "para frente" é o oposto disso
        frente.set(-Math.sin(anguloHorizontal), 0, -Math.cos(anguloHorizontal));
        direita.set(Math.cos(anguloHorizontal), 0, -Math.sin(anguloHorizontal));

        deslocamento.set(0, 0, 0).addScaledVector(frente, avanco).addScaledVector(direita, lateral);
        deslocamento.normalize(); // diagonal não fica mais rápida

        // Quanto mais longe a câmera, mais rápido anda (sensação constante na tela)
        const velocidade = distanciaDaCamera * VELOCIDADE_BASE * (shift ? VELOCIDADE_COM_SHIFT : 1);
        deslocamento.multiplyScalar(velocidade * segundosDesdeUltimoFrame);

        // Move destino e atual juntos: resposta imediata e sem brigar com o focarCameraNaArea
        for (const alvo of [alvoDestinoDaCamera, alvoAtualDaCamera]) {
          alvo.add(deslocamento);
          alvo.x = Math.max(-LIMITE_DO_MAPA, Math.min(LIMITE_DO_MAPA, alvo.x));
          alvo.z = Math.max(-LIMITE_DO_MAPA, Math.min(LIMITE_DO_MAPA, alvo.z));
        }
      };
      let shiftPressionado = false;
      addEventListener('keydown', evento => { if (evento.key === 'Shift') shiftPressionado = true; });
      addEventListener('keyup', evento => { if (evento.key === 'Shift') shiftPressionado = false; });


      arquivoDaMontagemConcluido('19-movimento-pelo-teclado.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
