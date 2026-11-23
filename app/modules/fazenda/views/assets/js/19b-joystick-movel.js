      // ====================================================================================================
      // FARMEDU 3D — 19b-joystick-movel.js (seção 19b: joystick virtual de movimento para telas de toque)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA), logo depois da seção 19. Visual em
      // css/12-joystick-movel.css.
      // ====================================================================================================
      // O joystick NÃO move nada sozinho: ele só preenche `entradaDoJoystick` (seção 19), que a mesma atualizarMovimento() do
      // teclado lê a cada quadro. Assim velocidade máxima, limites do mapa, Shift e WASD continuam exatamente iguais.
      //  • Inclinação → intensidade: o manete pode ir até a borda da base; dentro da ZONA MORTA (centro) nada se move, e daí
      //    até a borda a intensidade sobe de 0 a 1 (nunca passa de 1, nem na diagonal).
      //  • Um dedo de cada vez no joystick (pointerId guardado); os outros dedos continuam livres para girar/aproximar a câmera
      //    e tocar em botões ao mesmo tempo (multitoque).
      //  • Soltar, cancelar o toque, perder a captura, trocar de aba/janela ou girar a tela: para NA HORA (entrada volta a 0).
      //  • Só aparece em telas de toque (ponteiro principal "grosso" ou enquanto se usa o dedo; ver deveMostrarJoystick) e some quando a Fazenda
      //    está suspensa (celeiro, caverna), na tela de carregamento e quando a gaveta de construções cobre o canto.
      // ====================================================================================================
      const JOYSTICK_ZONA_MORTA = 0.18;          // fração do raio em que o manete ainda não move (evita deslize involuntário)
      const JOYSTICK_INTERVALO_DE_CONFERENCIA = 250;   // ms entre conferências de visibilidade/posição (barato; sem laço próprio)

      const joystickDeMovimento = document.createElement('div');
      joystickDeMovimento.id = 'joystick-de-movimento';
      // controle só de toque: quem usa teclado ou leitor de tela anda com WASD/setas, por isso ele fica fora da árvore acessível
      joystickDeMovimento.setAttribute('aria-hidden', 'true');
      const maneteDoJoystick = document.createElement('div');
      maneteDoJoystick.className = 'manete-do-joystick';
      joystickDeMovimento.appendChild(maneteDoJoystick);
      document.body.appendChild(joystickDeMovimento);

      // QUANDO MOSTRAR — reavaliado a cada conferência (nunca "trava" ligado):
      //  • ponteiro PRINCIPAL grosso agora → celular, tablet e modo dispositivo (Ctrl+Shift+M) do DevTools;
      //  • ou o ÚLTIMO toque/clique foi com o dedo E o aparelho ainda tem toque → notebook com tela de toque, só enquanto a
      //    pessoa usa o dedo (um clique de mouse esconde de novo).
      // Abrir o F12 não muda nada disso (só redimensiona a página); a largura da tela NÃO entra na conta. Ao sair do modo
      // dispositivo, o ponteiro volta a ser fino e maxTouchPoints volta a 0, então o joystick some na hora (evento "change").
      // (Antes: matchMedia era lido UMA vez no carregamento e o primeiro toque ligava o joystick para sempre — por isso, depois
      // de tocar na emulação e sair dela, ele ficava na tela do computador.)
      const PONTEIRO_PRINCIPAL_GROSSO = matchMedia('(pointer: coarse)');
      const ALGUM_PONTEIRO_GROSSO = matchMedia('(any-pointer: coarse)');
      const aparelhoTemToque = () => navigator.maxTouchPoints > 0 || ALGUM_PONTEIRO_GROSSO.matches;
      const estadoDoJoystick = { dedo: null, centroX: 0, centroY: 0, raio: 1, ultimoPonteiroFoiToque: false };
      const deveMostrarJoystick = () => PONTEIRO_PRINCIPAL_GROSSO.matches || (estadoDoJoystick.ultimoPonteiroFoiToque && aparelhoTemToque());

      const soltarJoystick = function soltarJoystick() {
        estadoDoJoystick.dedo = null;
        entradaDoJoystick.avanco = 0;
        entradaDoJoystick.lateral = 0;
        maneteDoJoystick.style.transform = '';
        joystickDeMovimento.classList.remove('joystick-ativo');
      };

      // posição do dedo → manete desenhado (limitado à borda) e entrada analógica (com zona morta e intensidade 0–1)
      const moverManete = function moverManete(dedoX, dedoY) {
        const distanciaX = dedoX - estadoDoJoystick.centroX, distanciaY = dedoY - estadoDoJoystick.centroY;
        const distancia = Math.hypot(distanciaX, distanciaY), raio = estadoDoJoystick.raio;
        // direção (vetor unitário) calculada ANTES de limitar o manete à borda: com o dedo fora da base a direção continua a
        // mesma e a intensidade fica em 1 (limitar primeiro e dividir pela distância original encolheria a entrada)
        const direcaoX = distancia > 0 ? distanciaX / distancia : 0, direcaoY = distancia > 0 ? distanciaY / distancia : 0;
        const inclinacao = Math.min(1, distancia / raio);
        maneteDoJoystick.style.transform = 'translate(' + (direcaoX * inclinacao * raio).toFixed(1) + 'px, ' + (direcaoY * inclinacao * raio).toFixed(1) + 'px)';
        if (inclinacao <= JOYSTICK_ZONA_MORTA) { entradaDoJoystick.avanco = 0; entradaDoJoystick.lateral = 0; return; }
        const intensidade = (inclinacao - JOYSTICK_ZONA_MORTA) / (1 - JOYSTICK_ZONA_MORTA);
        entradaDoJoystick.lateral = direcaoX * intensidade;     // direita = D
        entradaDoJoystick.avanco = -direcaoY * intensidade;     // para cima = W (o y da tela cresce para baixo)
        jogadorMexeu = true;
      };

      joystickDeMovimento.addEventListener('pointerdown', evento => {
        if (estadoDoJoystick.dedo !== null) return;   // já há um dedo controlando: o segundo dedo não rouba o joystick
        evento.preventDefault();
        evento.stopPropagation();
        const retangulo = joystickDeMovimento.getBoundingClientRect();
        estadoDoJoystick.dedo = evento.pointerId;
        estadoDoJoystick.centroX = retangulo.left + retangulo.width / 2;
        estadoDoJoystick.centroY = retangulo.top + retangulo.height / 2;
        estadoDoJoystick.raio = retangulo.width / 2;
        try { joystickDeMovimento.setPointerCapture(evento.pointerId); } catch (erro) { }   // continua recebendo o dedo fora da base
        joystickDeMovimento.classList.add('joystick-ativo');
        moverManete(evento.clientX, evento.clientY);
      });
      joystickDeMovimento.addEventListener('pointermove', evento => {
        if (evento.pointerId !== estadoDoJoystick.dedo) return;
        evento.preventDefault();
        moverManete(evento.clientX, evento.clientY);
      });
      for (const nomeDoEvento of ['pointerup', 'pointercancel', 'lostpointercapture']) {
        joystickDeMovimento.addEventListener(nomeDoEvento, evento => { if (evento.pointerId === estadoDoJoystick.dedo) soltarJoystick(); });
      }
      // segurança: nenhum toque do joystick vira menu de contexto/seleção; perder foco, esconder a aba ou girar a tela solta
      joystickDeMovimento.addEventListener('contextmenu', evento => evento.preventDefault());
      addEventListener('blur', soltarJoystick);
      document.addEventListener('visibilitychange', () => { if (document.hidden) soltarJoystick(); });
      addEventListener('orientationchange', soltarJoystick);
      addEventListener('resize', () => { if (estadoDoJoystick.dedo !== null) soltarJoystick(); conferirJoystick(); });
      // lembra se o último toque/clique foi com o dedo ou com o mouse (caneta não muda nada) e confere na hora
      addEventListener('pointerdown', evento => {
        if (evento.pointerType !== 'touch' && evento.pointerType !== 'mouse') return;
        const foiToque = evento.pointerType === 'touch';
        if (foiToque !== estadoDoJoystick.ultimoPonteiroFoiToque) { estadoDoJoystick.ultimoPonteiroFoiToque = foiToque; conferirJoystick(); }
      }, { capture: true, passive: true });
      // entrar/sair do modo dispositivo do DevTools (ou ligar/desligar um mouse num tablet) muda estas consultas: reage na hora
      for (const consulta of [PONTEIRO_PRINCIPAL_GROSSO, ALGUM_PONTEIRO_GROSSO]) consulta.addEventListener('change', () => conferirJoystick());

      // ÁREAS SEGURAS (entalhe, barra de gestos): o CSS posiciona com env(safe-area-inset-*); este medidor invisível traz os
      // mesmos valores para o JavaScript, que precisa deles para calcular a área reservada sem contar a margem duas vezes.
      const medidorDeAreaSegura = document.createElement('div');
      medidorDeAreaSegura.setAttribute('aria-hidden', 'true');
      medidorDeAreaSegura.style.cssText = 'position:fixed;left:0;bottom:0;width:env(safe-area-inset-left,0px);height:env(safe-area-inset-bottom,0px);visibility:hidden;pointer-events:none';
      document.body.appendChild(medidorDeAreaSegura);
      const MARGEM_DO_JOYSTICK = 16;   // distância da borda (além da área segura), igual ao CSS
      // mesmo tamanho do CSS: clamp(96px, 28vmin, 140px) — calculado aqui porque o joystick escondido mede 0
      const tamanhoDoJoystick = () => Math.min(140, Math.max(96, 0.28 * Math.min(innerWidth, innerHeight)));

      // CONVIVÊNCIA COM A INTERFACE (sem passar por cima de nada):
      //  • ÁREA RESERVADA: onde o joystick fica quando deve aparecer. Outros elementos que dividem o canto (o cartão do tutorial,
      //    seção 32b) leem essa área por farmEduJoystick.areaReservada() e se posicionam FORA dela; o evento
      //    "farmedu-joystick-area" avisa quando ela muda. A área não depende de o joystick estar visível, então um não empurra o
      //    outro em ciclo.
      //  • CONFERÊNCIA DO TOQUE: com a posição definida, pergunta ao navegador o que um dedo atingiria em 5 pontos da base
      //    (elementsFromPoint respeita pointer-events). Se algum painel, janela ou aviso estiver por cima, o joystick se ESCONDE
      //    em vez de ficar visível e sem resposta — e volta sozinho quando o caminho fica livre.
      //  • A gaveta de construções continua com a regra própria: o joystick sobe para cima dela quando os dois disputam o canto e
      //    some se a gaveta aberta ocupar boa parte da altura da tela.
      let ultimaAreaAnunciada = '';
      let areaReservadaAtual = null;
      const pontoEstaLivre = function pontoEstaLivre(x, y) {
        for (const elemento of document.elementsFromPoint(x, y)) {
          if (elemento === joystickDeMovimento || joystickDeMovimento.contains(elemento)) continue;
          return elemento === renderizador.domElement || elemento === document.body || elemento === document.documentElement;
        }
        return true;
      };
      const conferirJoystick = function conferirJoystick() {
        const telaDeCarregamento = document.querySelector('#tela-de-carregamento');
        // FAZENDA_SUSPENSA é declarada na seção 31 (carregada depois desta): até lá, typeof evita o erro de referência
        const fazendaSuspensa = typeof FAZENDA_SUSPENSA !== 'undefined' && FAZENDA_SUSPENSA.ativa;
        const ocupado = !deveMostrarJoystick() || fazendaSuspensa || (telaDeCarregamento && !telaDeCarregamento.hidden);
        const areaSeguraEsquerda = medidorDeAreaSegura.offsetWidth, areaSeguraDeBaixo = medidorDeAreaSegura.offsetHeight;
        const tamanho = tamanhoDoJoystick(), esquerda = areaSeguraEsquerda + MARGEM_DO_JOYSTICK;
        // distância acima da área segura de baixo (o CSS soma a área segura de novo: bottom = área segura + esta distância)
        let distanciaDoRodape = MARGEM_DO_JOYSTICK;
        const gaveta = document.querySelector('#lista-cards');
        if (!ocupado && gaveta) {
          const retanguloDaGaveta = gaveta.getBoundingClientRect();
          const cobreOCanto = retanguloDaGaveta.width > 0 && retanguloDaGaveta.left < esquerda + tamanho + 8 && retanguloDaGaveta.top < innerHeight - areaSeguraDeBaixo - MARGEM_DO_JOYSTICK;
          if (cobreOCanto) distanciaDoRodape = Math.max(MARGEM_DO_JOYSTICK, innerHeight - retanguloDaGaveta.top + 12 - areaSeguraDeBaixo);
        }
        const baseDoJoystick = innerHeight - areaSeguraDeBaixo - distanciaDoRodape;
        const cabe = areaSeguraDeBaixo + distanciaDoRodape + tamanho < innerHeight * 0.62;
        areaReservadaAtual = !ocupado && cabe ? { left: esquerda, top: baseDoJoystick - tamanho, right: esquerda + tamanho, bottom: baseDoJoystick } : null;
        joystickDeMovimento.style.setProperty('--distancia-do-rodape', distanciaDoRodape + 'px');
        let livre = false;
        if (areaReservadaAtual) {
          const centroX = esquerda + tamanho / 2, centroY = baseDoJoystick - tamanho / 2, afastamento = tamanho * 0.32;
          livre = pontoEstaLivre(centroX, centroY) && pontoEstaLivre(centroX - afastamento, centroY) && pontoEstaLivre(centroX + afastamento, centroY)
            && pontoEstaLivre(centroX, centroY - afastamento) && pontoEstaLivre(centroX, centroY + afastamento);
        }
        const visivel = !!areaReservadaAtual && livre;
        joystickDeMovimento.classList.toggle('joystick-visivel', visivel);
        if (!visivel && estadoDoJoystick.dedo !== null) soltarJoystick();
        const areaAnunciada = areaReservadaAtual ? [areaReservadaAtual.left, areaReservadaAtual.top, areaReservadaAtual.right, areaReservadaAtual.bottom].map(Math.round).join(',') : '';
        if (areaAnunciada !== ultimaAreaAnunciada) { ultimaAreaAnunciada = areaAnunciada; dispatchEvent(new CustomEvent('farmedu-joystick-area')); }
      };
      setInterval(conferirJoystick, JOYSTICK_INTERVALO_DE_CONFERENCIA);
      conferirJoystick();

      // testes automatizados e diagnóstico (mesmo padrão de farmEduCaverna/farmEduCeleiro)
      window.farmEduJoystick = {
        entrada: () => ({ avanco: entradaDoJoystick.avanco, lateral: entradaDoJoystick.lateral }),
        visivel: () => joystickDeMovimento.classList.contains('joystick-visivel'),
        elemento: joystickDeMovimento,
        conferir: conferirJoystick,
        // retângulo (px da janela) que o joystick ocupa quando deve aparecer, ou null; usado pelo tutorial (seção 32b)
        areaReservada: () => areaReservadaAtual && Object.assign({}, areaReservadaAtual),
      };

      arquivoDaMontagemConcluido('19b-joystick-movel.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
