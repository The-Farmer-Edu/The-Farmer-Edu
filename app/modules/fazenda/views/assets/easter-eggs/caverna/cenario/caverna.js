// ====================================================================================================
// EDIÇÃO PESSOAL — CAVERNA SECRETA · cenario/caverna.js
// O esconderijo subterrâneo (só o AMBIENTE; os personagens ficam em personagens/). Pixel art em resolução lógica, paletas
// pequenas com pontilhado Bayer, sem degradê liso.
// Camadas: FUNDO (pré-desenhado uma vez: rocha, teto com estalactites, plataforma, chão, trilhos, objetos parados),
//          MEIO (corrimão da passarela, na frente das pernas do Batman), FRENTE (estalagmites em silhueta) e os elementos
//          ANIMADOS, cada um com o seu relógio: LEDs, telas, ventoinha, braseiros, runas, gotas, vapor, morcegos, varal de
//          lâmpadas, néon, caixa-surpresa, balão, luminária que balança, névoa e poeira.
// Cada personagem tem o seu canto (ver cavernaSecreta.POSICOES): Slenderman no recanto escuro, Ultron entre servidores, Destino
// entre braseiros verdes, Batman na passarela com o computador, Coringa com cartas e néon, Hulk no entulho, Venom no cano de
// gosma e Freddy no palquinho de festa.
// Interface usada pelo motor: criar, atualizar, desenharFundo, desenharAnimadosDoFundo, desenharMeio, desenharAnimadosDoChao,
// desenharFrente, luzes, brilhos, desenharAtmosfera, limpar. Os números soltos nas chamadas de desenho são coordenadas em
// pixels da cena (384 × 216) e cores da arte.
// ====================================================================================================
(() => {
  const cavernaSecreta = window.CavernaSecreta, ferramentasPixel = window.CenaDoCeleiro.pixel;
  const LARGURA = cavernaSecreta.LARGURA, ALTURA = cavernaSecreta.ALTURA;
  const { limiarPontilhado, sortearEntre, acenderPixel, desenharBrilho } = cavernaSecreta;

  // ---- ruído determinístico (a caverna é sempre a mesma) ----
  // espalhamento de bits: transforma (x, y, semente) num número entre 0 e 1 sempre igual para a mesma entrada
  const valorPseudoAleatorio = (x, y, semente) => {
    let mistura = (x * 374761393 + y * 668265263 + semente * 974634161) | 0;
    mistura = Math.imul(mistura ^ (mistura >>> 13), 1274126177);
    return ((mistura ^ (mistura >>> 16)) >>> 0) / 4294967295;
  };
  // ruído de valor suavizado (interpola os quatro cantos da célula da grade de tamanho `escala`)
  const ruidoSuave = (x, y, escala, semente) => {
    const posicaoX = x / escala, posicaoY = y / escala, celulaX = Math.floor(posicaoX), celulaY = Math.floor(posicaoY);
    const fracaoX = posicaoX - celulaX, fracaoY = posicaoY - celulaY;
    const suaveX = fracaoX * fracaoX * (3 - 2 * fracaoX), suaveY = fracaoY * fracaoY * (3 - 2 * fracaoY);
    const cantoSuperiorEsquerdo = valorPseudoAleatorio(celulaX, celulaY, semente), cantoSuperiorDireito = valorPseudoAleatorio(celulaX + 1, celulaY, semente);
    const cantoInferiorEsquerdo = valorPseudoAleatorio(celulaX, celulaY + 1, semente), cantoInferiorDireito = valorPseudoAleatorio(celulaX + 1, celulaY + 1, semente);
    return cantoSuperiorEsquerdo + (cantoSuperiorDireito - cantoSuperiorEsquerdo) * suaveX + (cantoInferiorEsquerdo - cantoSuperiorEsquerdo) * suaveY
      + (cantoSuperiorEsquerdo - cantoSuperiorDireito - cantoInferiorEsquerdo + cantoInferiorDireito) * suaveX * suaveY;
  };
  // ruído em camadas (fractal): três escalas somadas dão textura de rocha
  const ruidoFractal = (x, y, semente) => ruidoSuave(x, y, 26, semente) * 0.5 + ruidoSuave(x, y, 10, semente + 7) * 0.32 + ruidoSuave(x, y, 4, semente + 13) * 0.18;

  // ---- paletas ----
  const PEDRA = ['#0b0c13', '#141724', '#1d2133', '#272c42', '#323851', '#3f4661', '#4f5774', '#636c8a'];   // paredes (azul-acinzentado)
  const TERRA = ['#100d0b', '#1b1612', '#261f19', '#332a21', '#41362a', '#514334', '#635240'];             // chão e plataforma (marrom)
  // tom chapado (sem pontilhado): o pontilhado fica só numa faixa estreita na fronteira entre dois tons
  const tomDaPaleta = (paleta, valor, x, y) => {
    const posicaoNaPaleta = valor * paleta.length, nivel = Math.floor(posicaoNaPaleta), resto = posicaoNaPaleta - nivel;
    const sobeUmTom = resto > 0.82 && limiarPontilhado(x, y) < (resto - 0.82) * 5 ? 1 : 0;
    return paleta[Math.max(0, Math.min(paleta.length - 1, nivel + sobeUmTom))];
  };
  // nível de rocha em "blocos": o ruído vira patamares; a fronteira entre patamares vira rachadura (embaixo) e aresta clara (em cima)
  const nivelDaRocha = (x, y, semente) => Math.floor((ruidoFractal(x, y * 1.25, semente) * 0.92 + ruidoSuave(x, y, 7, semente + 40) * 0.12) * 4);

  // ---- geometria ----
  const ESTALACTITES = [[34, 7, 24], [63, 4, 13], [120, 8, 30], [178, 5, 17], [214, 8, 24], [246, 4, 12], [304, 6, 20], [331, 5, 15], [372, 8, 26]];   // [centroX, meiaLargura, comprimento]
  const alturaDoTetoSemPontas = x => 12 + Math.round(ruidoSuave(x, 0, 22, 3) * 9);
  const alturaDoTeto = x => {   // borda de baixo do teto, com as estalactites
    let bordaY = alturaDoTetoSemPontas(x);
    for (const [centroDaPontaX, meiaLargura, comprimento] of ESTALACTITES) {
      const distanciaRelativa = Math.abs(x - centroDaPontaX) / meiaLargura;
      if (distanciaRelativa < 1) bordaY = Math.max(bordaY, alturaDoTetoSemPontas(centroDaPontaX) + Math.round(comprimento * Math.pow(1 - distanciaRelativa, 1.4)));
    }
    return bordaY;
  };
  const FENDA_DO_TETO = [144, 160];   // fenda no teto por onde entra o luar (x inicial e final)
  const { y: TOPO_DA_PLATAFORMA_Y, x0: INICIO_DA_PLATAFORMA_X, x1: FIM_DA_PLATAFORMA_X } = cavernaSecreta.PLATAFORMA;
  const bordaDaPlataforma = x => {   // a plataforma termina irregular nas pontas
    if (x < INICIO_DA_PLATAFORMA_X - 6 || x > FIM_DA_PLATAFORMA_X + 6) return null;
    const recuo = x < INICIO_DA_PLATAFORMA_X ? (INICIO_DA_PLATAFORMA_X - x) * 2 : (x > FIM_DA_PLATAFORMA_X ? (x - FIM_DA_PLATAFORMA_X) * 2 : 0);
    return TOPO_DA_PLATAFORMA_Y + recuo + Math.round(ruidoSuave(x, 1, 6, 5) * 1.6);
  };
  const alturaDoChao = x => 172 + Math.round(ruidoSuave(x, 2, 18, 9) * 4);

  // ---- telas pré-desenhadas ----
  const telaDoFundo = cavernaSecreta.novaTela(LARGURA, ALTURA), telaDoMeio = cavernaSecreta.novaTela(LARGURA, ALTURA);
  const telaDaFrente = cavernaSecreta.novaTela(LARGURA, ALTURA), telaDaVinheta = cavernaSecreta.novaTela(LARGURA, ALTURA);
  const faixasDeNevoa = [cavernaSecreta.novaTela(LARGURA * 2, 30), cavernaSecreta.novaTela(LARGURA * 2, 30)];
  const LEDS = [];                // [x, y, cor, semente] dos servidores e do console
  const PONTAS_QUE_PINGAM = [];   // pontas de estalactite que gotejam [x, y, yDoChao]
  const CABOS = [[0, 28, 126, 24, 12], [150, 20, 300, 30, 14], [250, 26, 384, 22, 10]];   // [xInicial, yInicial, xFinal, yFinal, flecha] (catenárias)

  const desenharFundo = () => {
    const contexto = telaDoFundo.contexto, imagem = contexto.createImageData(LARGURA, ALTURA), pixels = imagem.data;
    const pintar = (x, y, cor) => {
      const indice = (y * LARGURA + x) * 4;
      pixels[indice] = parseInt(cor.slice(1, 3), 16);
      pixels[indice + 1] = parseInt(cor.slice(3, 5), 16);
      pixels[indice + 2] = parseInt(cor.slice(5, 7), 16);
      pixels[indice + 3] = 255;
    };
    for (let x = 0; x < LARGURA; x++) {
      const bordaDoTetoY = alturaDoTeto(x), bordaDaPlataformaY = bordaDaPlataforma(x), bordaDoChaoY = alturaDoChao(x);
      for (let y = 0; y < ALTURA; y++) {
        let cor;
        const naFenda = x >= FENDA_DO_TETO[0] && x <= FENDA_DO_TETO[1] && y < alturaDoTetoSemPontas(x) - 2 && Math.abs(x - 152) < 9 - y * 0.35 + ruidoSuave(x, y, 3, 2) * 3;
        if (naFenda) cor = y < 3 ? '#1b2a52' : (valorPseudoAleatorio(x, y, 77) < 0.03 ? '#cfd8ff' : '#101a38');
        else if (y < bordaDoTetoY) {   // teto: mais claro na borda de baixo (pega luz), escuro no alto
          const valor = ruidoFractal(x, y, 11) * 0.8 + (y / Math.max(1, bordaDoTetoY)) * 0.35 - 0.12;
          cor = y >= bordaDoTetoY - 1 ? PEDRA[1] : tomDaPaleta(PEDRA, valor, x, y);
        } else if (y >= bordaDoChaoY) {   // chão: estrias horizontais, mais claro na frente
          const valor = ruidoFractal(x * 0.6, y * 2.2, 21) * 0.7 + (y - 172) / 44 * 0.35;
          cor = y === bordaDoChaoY ? TERRA[5] : tomDaPaleta(TERRA, valor, x, y);
          if (valorPseudoAleatorio(x, y, 31) < 0.012) cor = TERRA[6];   // pedrinhas
        } else if (bordaDaPlataformaY !== null && y >= bordaDaPlataformaY) {   // plataforma: topo claro, face com estratos
          const profundidade = y - bordaDaPlataformaY;
          if (profundidade <= 1) cor = profundidade === 0 ? TERRA[6] : TERRA[5];
          else if (profundidade <= 3) cor = tomDaPaleta(TERRA, 0.55 + ruidoFractal(x, y, 41) * 0.3, x, y);
          else {
            const estrato = Math.sin(y * 0.9 + ruidoSuave(x, y, 12, 4) * 4) * 0.12;
            cor = tomDaPaleta(PEDRA, ruidoFractal(x, y, 43) * 0.75 + estrato + 0.08 - profundidade / 70, x, y);
          }
          if (profundidade === 4) cor = PEDRA[1];
        } else {   // parede do fundo: blocos de rocha chapados, rachadura escura embaixo de cada bloco e aresta clara em cima
          const nivel = nivelDaRocha(x, y, 1), nivelAbaixo = nivelDaRocha(x, y + 1, 1), nivelAcima = nivelDaRocha(x, y - 1, 1);
          let indiceDoTom = 3 + nivel;
          if (nivelAbaixo !== nivel) indiceDoTom = 1;
          else if (nivelAcima !== nivel && nivelAcima < nivel) indiceDoTom = Math.min(7, indiceDoTom + 1);
          if (x < 62) indiceDoTom -= Math.round((62 - x) / 62 * 3.2);   // recanto escuro do Slenderman
          if (y > 132) indiceDoTom -= 1;                                 // base da parede mais escura
          cor = PEDRA[Math.max(0, Math.min(7, indiceDoTom))];
        }
        pintar(x, y, cor);
      }
    }
    contexto.putImageData(imagem, 0, 0);
    // pontas das estalactites que gotejam (cada uma cai até o chão ou até a plataforma embaixo dela)
    for (const [centroDaPontaX] of ESTALACTITES) {
      const ondeCai = centroDaPontaX < INICIO_DA_PLATAFORMA_X || centroDaPontaX > FIM_DA_PLATAFORMA_X ? alturaDoChao(centroDaPontaX) : bordaDaPlataforma(centroDaPontaX) ?? alturaDoChao(centroDaPontaX);
      PONTAS_QUE_PINGAM.push([centroDaPontaX, alturaDoTeto(centroDaPontaX) + 1, ondeCai]);
    }

    // ---- objetos parados ----
    const ret = (...argumentos) => ferramentasPixel.ret(contexto, ...argumentos), px = (...argumentos) => ferramentasPixel.px(contexto, ...argumentos);
    const linha = (...argumentos) => ferramentasPixel.linha(contexto, ...argumentos), elipse = (...argumentos) => ferramentasPixel.elipse(contexto, ...argumentos);
    const poligono = (...argumentos) => ferramentasPixel.poligono(contexto, ...argumentos);
    // trilhos da mina que chegam da esquerda (continuação da mina da Fazenda) e o carrinho abandonado
    for (let dormenteX = 0; dormenteX < 78; dormenteX += 5) ret(dormenteX, 199, 3, 3, '#3a2a1c');
    ret(0, 198, 78, 1, '#7b818c'); ret(0, 201, 78, 1, '#5d636e'); ret(0, 199, 78, 1, '#2b2e35');
    ret(76, 193, 3, 9, '#5a3a22'); ret(74, 192, 7, 2, '#7a5032');                                                             // batente
    poligono([[38, 184], [64, 184], [61, 196], [41, 196]], '#5e3420'); ret(38, 184, 27, 2, '#7a4a2c');                        // carrinho
    for (const rebiteX of [42, 50, 58]) px(rebiteX, 189, '#a46a3c');
    elipse(51, 183, 9, 3, '#3c3a44'); px(47, 182, '#8f8a9c'); px(54, 181, '#6a7590'); px(51, 182, '#c08a3a');                // minério
    for (const rodaX of [44, 58]) { elipse(rodaX, 197, 2, 2, '#1b1b20'); px(rodaX, 197, '#55555f'); }
    // recanto do Slenderman: galhos secos pendurados e um poste de luz apagado e torto
    for (const [inicioX, inicioY, fimX, fimY] of [[10, 40, 16, 78], [16, 78, 12, 96], [24, 30, 30, 70], [30, 70, 27, 88], [44, 46, 42, 74]]) linha(inicioX, inicioY, fimX, fimY, '#07080c');
    linha(48, 176, 51, 120, '#1a1c22', 2); linha(51, 120, 44, 116, '#1a1c22', 2); ret(40, 116, 6, 3, '#24262e');

    // ULTRON: dois racks de servidores na plataforma, monitor, cabeça de drone quebrada e cabos descendo a face
    const desenharRack = (rackX, rackY, largura, altura) => {
      ret(rackX, rackY, largura, altura, '#07080c'); ret(rackX + 1, rackY + 1, largura - 2, altura - 2, '#1c1f27'); ret(rackX + 1, rackY + 1, largura - 2, 1, '#3a3f4c');
      for (let gavetaY = rackY + 4; gavetaY < rackY + altura - 3; gavetaY += 5) {
        ret(rackX + 2, gavetaY, largura - 4, 3, '#121419'); ret(rackX + 3, gavetaY + 1, largura - 8, 1, '#2a2e38');
        LEDS.push([rackX + largura - 4, gavetaY + 1, '#ff3322', valorPseudoAleatorio(rackX, gavetaY, 5)]);
        if (valorPseudoAleatorio(rackX, gavetaY, 9) > 0.5) LEDS.push([rackX + largura - 6, gavetaY + 1, '#ffaa22', valorPseudoAleatorio(gavetaY, rackX, 6)]);
      }
    };
    desenharRack(62, 106, 17, 42); desenharRack(113, 112, 16, 36);
    ret(133, 120, 22, 16, '#07080c'); ret(134, 121, 20, 14, '#160707'); ret(142, 136, 4, 8, '#1c1f27'); ret(138, 144, 12, 2, '#2a2e38');   // monitor
    elipse(166, 144, 6, 4, '#5d6573'); elipse(166, 143, 5, 3, '#8b94a3'); ret(163, 142, 2, 1, '#350707'); linha(168, 141, 171, 146, '#07080c');   // cabeça de drone rachada
    for (const [inicioX, fimX, tipoDeCabo] of [[70, 74, 1], [120, 128, 2], [126, 140, 3]]) {                                // cabos descendo a face da plataforma
      let anteriorX = inicioX, anteriorY = TOPO_DA_PLATAFORMA_Y + 2;
      for (let passo = 1; passo <= 8; passo++) {
        const proximoX = inicioX + (fimX - inicioX) * passo / 8, proximoY = TOPO_DA_PLATAFORMA_Y + 2 + Math.sin(passo / 8 * Math.PI) * 6 + passo * 3;
        linha(anteriorX, anteriorY, proximoX, proximoY, tipoDeCabo === 2 ? '#3a2020' : '#101216');
        anteriorX = proximoX; anteriorY = proximoY;
      }
    }

    // DESTINO: estandarte verde com borda dourada atrás dele, círculo de runas no chão e dois braseiros de pedra
    ret(256, 58, 26, 2, '#4a3a1c'); ret(258, 60, 22, 46, '#173d22'); ret(259, 60, 20, 46, '#21552e');
    ret(259, 60, 1, 46, '#b8902c'); ret(278, 60, 1, 46, '#b8902c');
    for (let pontaX = 258; pontaX < 280; pontaX += 4) poligono([[pontaX, 106], [pontaX + 4, 106], [pontaX + 2, 110]], '#21552e');
    elipse(269, 80, 6, 6, '#173d22'); elipse(269, 80, 4, 4, '#b8902c'); elipse(269, 80, 3, 3, '#21552e');
    for (const braseiroX of [240, 297]) {
      ret(braseiroX - 4, 130, 9, 18, '#2b2c33'); ret(braseiroX - 3, 130, 7, 18, '#40424c'); ret(braseiroX - 3, 130, 1, 18, '#5a5d68');
      ret(braseiroX - 7, 126, 15, 4, '#2b2c33'); ret(braseiroX - 6, 125, 13, 2, '#5a5d68'); ret(braseiroX - 5, 124, 11, 1, '#0b1e10');
    }
    // BATMAN: pernas de treliça da passarela até o chão, deck de aço e o computador com a tela azul
    const { y: PASSARELA_Y, x0: INICIO_DA_PASSARELA_X } = cavernaSecreta.PASSARELA;
    for (const pernaX of [322, 378]) {
      ret(pernaX - 2, PASSARELA_Y + 3, 4, alturaDoChao(pernaX) - PASSARELA_Y - 3, '#16181e');
      ret(pernaX - 1, PASSARELA_Y + 3, 1, alturaDoChao(pernaX) - PASSARELA_Y - 3, '#3a3e4a');
    }
    for (let trelicaY = PASSARELA_Y + 8; trelicaY < 168; trelicaY += 22) { linha(322, trelicaY, 378, trelicaY + 18, '#20232b'); linha(378, trelicaY, 322, trelicaY + 18, '#20232b'); }
    ret(INICIO_DA_PASSARELA_X, PASSARELA_Y, LARGURA - INICIO_DA_PASSARELA_X, 4, '#2b2f3a'); ret(INICIO_DA_PASSARELA_X, PASSARELA_Y, LARGURA - INICIO_DA_PASSARELA_X, 1, '#6c7385'); ret(INICIO_DA_PASSARELA_X, PASSARELA_Y + 3, LARGURA - INICIO_DA_PASSARELA_X, 1, '#0b0c10');
    for (let parafusoX = INICIO_DA_PASSARELA_X + 2; parafusoX < LARGURA; parafusoX += 4) px(parafusoX, PASSARELA_Y + 1, '#1a1c22');
    ret(366, 72, 18, 20, '#07080c'); ret(367, 73, 16, 17, '#061428'); ret(373, 92, 4, 12, '#20232b');
    LEDS.push([368, 94, '#4fb0ff', 0.3], [370, 94, '#4fb0ff', 0.7]);
    // CORINGA: caixote (com o néon em espiral em cima), cartas espalhadas no chão
    ret(70, 184, 22, 20, '#3a2416'); ret(71, 185, 20, 18, '#5a3a22');
    for (const ripaY of [190, 196]) ret(71, ripaY, 20, 1, '#3a2416');
    linha(71, 185, 90, 202, '#3a2416');
    ret(78, 180, 8, 4, '#1a1a1e');
    for (const [cartaX, cartaY, numeroDaCarta] of [[100, 206, 0], [109, 209, 1], [131, 207, 2], [140, 210, 3], [96, 211, 4], [124, 212, 5], [150, 205, 6]]) {
      ret(cartaX, cartaY, 3, 4, '#efeae0');
      px(cartaX + 1, cartaY + 1 + (numeroDaCarta % 2), numeroDaCarta % 3 === 0 ? '#c01a22' : '#16131a');
    }
    // HULK: rachaduras no chão saindo dos pés, montes de entulho e a viga torta encostada na plataforma
    for (const [rachaduraX, rachaduraY] of [[-22, 3], [-14, 6], [18, 4], [26, 7], [6, 7]]) linha(194, 209, 194 + rachaduraX, 209 + rachaduraY, '#0b0908');
    for (const [monteX, monteY, quantidadeDePedras] of [[164, 202, 7], [228, 204, 8], [176, 210, 4]]) for (let pedra = 0; pedra < quantidadeDePedras; pedra++) {
      const pedraX = monteX + Math.round((valorPseudoAleatorio(pedra, monteX, 3) - 0.5) * 18), pedraY = monteY + Math.round((valorPseudoAleatorio(monteX, pedra, 4) - 0.5) * 6);
      const raio = 1 + Math.round(valorPseudoAleatorio(pedra, pedra, monteX) * 3);
      elipse(pedraX, pedraY, raio + 1, raio, '#2a2c34'); elipse(pedraX - 1, pedraY - 1, raio, raio - 1 || 1, '#4a4e5c'); px(pedraX - raio + 1, pedraY - 1, '#636c8a');
    }
    linha(212, 204, 236, 158, '#1a1c22', 5); linha(211, 203, 235, 157, '#4a4f5c', 2); linha(236, 158, 246, 152, '#1a1c22', 4);   // viga
    // VENOM: o cano que desce do teto, junta rachada que pinga gosma, poça preta e manchas de simbionte na plataforma
    const tetoNoCanoY = alturaDoTeto(302);
    ret(300, tetoNoCanoY - 2, 6, 182 - tetoNoCanoY, '#14161c'); ret(301, tetoNoCanoY - 2, 2, 182 - tetoNoCanoY, '#3e4350'); ret(304, tetoNoCanoY, 1, 180 - tetoNoCanoY, '#07080c');
    for (const abracadeiraY of [60, 110, 158]) { ret(299, abracadeiraY, 8, 3, '#2a2d36'); ret(299, abracadeiraY, 8, 1, '#5a5f6c'); }
    elipse(303, 128, 5, 5, '#5a1c1c'); elipse(303, 128, 3, 3, '#14161c'); linha(298, 128, 308, 128, '#5a1c1c'); linha(303, 123, 303, 133, '#5a1c1c');   // registro
    ret(299, 182, 8, 3, '#2a2d36');
    elipse(309, 206, 11, 3, '#050509'); ret(302, 205, 6, 1, '#3a4a8a'); px(313, 207, '#3a4a8a');
    for (const [manchaX, manchaY, raio] of [[256, 160, 5], [266, 156, 3], [289, 164, 6], [280, 158, 2], [250, 168, 3]]) {
      elipse(manchaX, manchaY, raio, Math.max(1, raio - 1), '#050509'); px(manchaX - 1, manchaY - 1, '#2f3a74');
      linha(manchaX, manchaY + raio - 1, manchaX + (raio % 2 ? 1 : -1), manchaY + raio + 4, '#050509');
    }
    // FREDDY: palquinho (tábuas + frente xadrez) e o painel de estrelas pintadas atrás
    ret(318, 200, 60, 6, '#4a2c16');
    for (let tabuaX = 318; tabuaX < 378; tabuaX += 7) ret(tabuaX, 200, 1, 6, '#2b190c');
    ret(318, 200, 60, 1, '#7a4c28');
    for (let quadradoX = 318; quadradoX < 378; quadradoX += 4) for (let quadradoY = 206; quadradoY < 216; quadradoY += 4) ret(quadradoX, quadradoY, 4, 4, ((quadradoX - 318) / 4 + (quadradoY - 206) / 4) % 2 ? '#e8e2d2' : '#15131a');
    ret(326, 150, 40, 30, '#2a1a3e'); ret(327, 151, 38, 28, '#3a2456');
    for (const [estrelaX, estrelaY] of [[332, 156], [356, 158], [344, 168], [360, 172], [334, 174]]) {
      px(estrelaX, estrelaY, '#ffd24a'); px(estrelaX - 1, estrelaY, '#a8801a'); px(estrelaX + 1, estrelaY, '#a8801a'); px(estrelaX, estrelaY - 1, '#a8801a'); px(estrelaX, estrelaY + 1, '#a8801a');
    }
    // cabos pendurados no teto (catenárias)
    for (const [inicioX, inicioY, fimX, fimY, flecha] of CABOS) {
      let anteriorX = inicioX, anteriorY = inicioY;
      for (let passo = 1; passo <= 24; passo++) {
        const fracao = passo / 24, proximoX = inicioX + (fimX - inicioX) * fracao, proximoY = inicioY + (fimY - inicioY) * fracao + Math.sin(fracao * Math.PI) * flecha;
        linha(anteriorX, anteriorY, proximoX, proximoY, '#08090d');
        anteriorX = proximoX; anteriorY = proximoY;
      }
    }
    // ventoinha (o rotor é animado) no respiradouro da parede
    elipse(204, 60, 9, 9, '#07080c'); elipse(204, 60, 8, 8, '#2a2e38'); elipse(204, 60, 6, 6, '#0b0c10');
  };
  const lampadaNoCabo = (indiceDoCabo, fracao) => {
    const [inicioX, inicioY, fimX, fimY, flecha] = CABOS[indiceDoCabo];
    return [Math.round(inicioX + (fimX - inicioX) * fracao), Math.round(inicioY + (fimY - inicioY) * fracao + Math.sin(fracao * Math.PI) * flecha)];
  };
  const LAMPADAS = [[0, 0.3, '#ffd59a'], [0, 0.72, '#ffd59a'], [1, 0.45, '#ffcf8a'], [2, 0.62, '#bcd6ff']].map(([indiceDoCabo, fracao, cor], numero) => ({ pos: lampadaNoCabo(indiceDoCabo, fracao), cor, semente: numero * 1.7 }));

  const desenharMeio = () => {   // corrimão da passarela, NA FRENTE das pernas do Batman
    const contexto = telaDoMeio.contexto, { y: PASSARELA_Y, x0: INICIO_DA_PASSARELA_X } = cavernaSecreta.PASSARELA, comprimento = LARGURA - INICIO_DA_PASSARELA_X;
    ferramentasPixel.ret(contexto, INICIO_DA_PASSARELA_X, PASSARELA_Y - 11, comprimento, 1, '#4a4f5c');
    ferramentasPixel.ret(contexto, INICIO_DA_PASSARELA_X, PASSARELA_Y - 10, comprimento, 1, '#16181e');
    ferramentasPixel.ret(contexto, INICIO_DA_PASSARELA_X, PASSARELA_Y - 5, comprimento, 1, '#2b2f3a');
    for (let colunaX = INICIO_DA_PASSARELA_X + 1; colunaX < LARGURA; colunaX += 11) { ferramentasPixel.ret(contexto, colunaX, PASSARELA_Y - 11, 2, 11, '#16181e'); ferramentasPixel.px(contexto, colunaX, PASSARELA_Y - 11, '#6c7385'); }
  };
  const desenharFrente = () => {   // estalagmites em silhueta nas bordas, com contorno de luz fria
    const contexto = telaDaFrente.contexto;
    ferramentasPixel.poligono(contexto, [[0, 216], [0, 150], [4, 140], [7, 156], [11, 172], [15, 216]], '#050509');
    ferramentasPixel.poligono(contexto, [[15, 216], [20, 196], [24, 216]], '#050509');
    ferramentasPixel.poligono(contexto, [[372, 216], [377, 186], [380, 176], [384, 168], [384, 216]], '#050509');
    ferramentasPixel.linha(contexto, 4, 141, 7, 156, '#1e2438'); ferramentasPixel.linha(contexto, 377, 186, 380, 177, '#1e2438');
    ferramentasPixel.poligono(contexto, [[150, 216], [160, 212], [178, 211], [186, 216]], '#07070b');
  };
  const desenharVinheta = () => {   // bordas escurecidas (pontilhado), fixas
    const contexto = telaDaVinheta.contexto;
    contexto.fillStyle = '#000';
    for (let y = 0; y < ALTURA; y++) for (let x = 0; x < LARGURA; x++) {
      const distanciaX = (x - LARGURA / 2) / (LARGURA / 2), distanciaY = (y - ALTURA / 2) / (ALTURA / 2);
      const escurecimento = Math.max(0, Math.sqrt(distanciaX * distanciaX * 0.55 + distanciaY * distanciaY * 0.75) - 0.86) * 3;
      if (escurecimento > limiarPontilhado(x, y)) contexto.fillRect(x, y, 1, 1);
    }
  };
  const desenharNevoa = () => {   // duas faixas de névoa rasteira pontilhada, que andam em velocidades diferentes
    faixasDeNevoa.forEach(({ contexto, tela }, indiceDaFaixa) => {
      contexto.fillStyle = indiceDaFaixa ? '#8a94b8' : '#a8b0cc';
      for (let y = 0; y < tela.height; y++) for (let x = 0; x < tela.width; x++) {
        const densidade = ruidoSuave(x % LARGURA, y, 16, 50 + indiceDaFaixa) * Math.sin(y / tela.height * Math.PI) * (0.55 + 0.45 * ruidoSuave(x % LARGURA, 0, 40, 60 + indiceDaFaixa));
        if (densidade > 0.25 + limiarPontilhado(x, y) * 0.7) contexto.fillRect(x, y, 1, 1);
      }
      contexto.drawImage(tela, 0, 0, LARGURA, tela.height, LARGURA, 0, LARGURA, tela.height);   // costura sem emenda
    });
  };

  // ---- partes animadas ----
  // (partículas: x/y = posição, vx/vy = velocidade em px/s, vida/max = idade e duração em segundos — ver efeitos.js)
  const brasas = cavernaSecreta.criarParticulas({
    maximo: 26, taxa: 9,
    nascer: () => { const braseiroX = Math.random() < 0.5 ? 240 : 297; return { x: braseiroX + sortearEntre(-3, 3), y: 116, vx: sortearEntre(-3, 3), vy: sortearEntre(-16, -9), vida: 0, max: sortearEntre(1, 2.2) }; },
    atualizar: (particula, segundos) => { particula.x += particula.vx * segundos + Math.sin(particula.vida * 6) * 0.08; particula.y += particula.vy * segundos; },
    desenhar: (contexto, particula) => acenderPixel(contexto, particula.x, particula.y, particula.vida / particula.max < 0.5 ? '#9dffb0' : '#2fbf58', 1 - particula.vida / particula.max),
  });
  const poeiraNoLuar = cavernaSecreta.criarParticulas({
    maximo: 40, taxa: 6,
    nascer: () => ({ x: sortearEntre(150, 196), y: sortearEntre(20, 200), vx: sortearEntre(-1.2, 1.2), vy: sortearEntre(1, 3.5), vida: 0, max: sortearEntre(4, 9) }),
    atualizar: (particula, segundos) => {
      particula.x += particula.vx * segundos + Math.sin(particula.vida * 1.3 + particula.y) * 0.03;
      particula.y += particula.vy * segundos;
      particula.luz = Math.abs(particula.x - (152 + (particula.y - 16) * 0.18)) < 4 + (particula.y - 16) * 0.16;   // só aparece dentro do facho do luar
    },
    desenhar: (contexto, particula) => { if (particula.luz) acenderPixel(contexto, particula.x, particula.y, '#c8d4ff', 0.6 * cavernaSecreta.vaiEVolta(particula.vida / particula.max)); },
  });
  const poeiraCaindo = cavernaSecreta.criarParticulas({   // poeira do teto quando o Hulk muda o peso
    maximo: 30, taxa: 0,
    nascer: () => null,
    atualizar: (particula, segundos) => { particula.vy += 60 * segundos; particula.y += particula.vy * segundos; if (particula.y > 205) return false; },
    desenhar: (contexto, particula) => { contexto.fillStyle = '#7a7466'; contexto.fillRect(Math.round(particula.x), Math.round(particula.y), 1, 1); },
  });
  const vapor = cavernaSecreta.criarParticulas({
    maximo: 14, taxa: tempo => (Math.sin(tempo * 0.7) > 0.6 ? 7 : 0),
    nascer: () => ({ x: 308, y: 128, vx: sortearEntre(6, 12), vy: sortearEntre(-6, -2), vida: 0, max: sortearEntre(0.8, 1.6) }),
    atualizar: (particula, segundos) => { particula.x += particula.vx * segundos; particula.y += particula.vy * segundos; },
    desenhar: (contexto, particula) => {
      const idade = particula.vida / particula.max, raio = 1 + Math.round(idade * 2);
      contexto.fillStyle = 'rgba(200,205,220,' + (0.35 * (1 - idade)).toFixed(2) + ')';
      contexto.fillRect(Math.round(particula.x) - raio, Math.round(particula.y) - raio, raio * 2, raio * 2 - 1);
    },
  });
  const faiscas = cavernaSecreta.criarParticulas({
    maximo: 16, taxa: tempo => (Math.sin(tempo * 1.9) + Math.sin(tempo * 0.83) > 1.4 ? 30 : 0),
    nascer: () => ({ x: 141, y: 156, vx: sortearEntre(-14, 14), vy: sortearEntre(-22, -6), vida: 0, max: sortearEntre(0.25, 0.6) }),
    atualizar: (particula, segundos) => { particula.vy += 90 * segundos; particula.x += particula.vx * segundos; particula.y += particula.vy * segundos; },
    desenhar: (contexto, particula) => acenderPixel(contexto, particula.x, particula.y, '#ffd28a', 1 - particula.vida / particula.max),
  });
  const gotas = [];   // gotas d'água das estalactites e de gosma do cano, cada uma com o seu relógio
  const morcegos = { proxima: sortearEntre(4, 9), bando: [] };
  const caixaSurpresa = { fase: 'fechada', inicio: 0, proxima: sortearEntre(5, 9) };   // caixa-surpresa do Coringa: fechada → manivela → aberta
  const POSICOES_DOS_BRASEIROS = [[240, 1], [297, 5]];   // [x, semente do fogo]

  const cenario = {
    criar() {
      desenharFundo(); desenharMeio(); desenharFrente(); desenharVinheta(); desenharNevoa();
      for (const [gotaX, gotaY, chaoY] of PONTAS_QUE_PINGAM) gotas.push({ x: gotaX, y0: gotaY, yChao: chaoY, y: gotaY, caindo: false, proxima: sortearEntre(1, 7), respingo: 0, cor: '#9fb8e8' });
      gotas.push({ x: 307, y0: 162, yChao: 205, y: 162, caindo: false, proxima: sortearEntre(1, 3), respingo: 0, cor: '#0a0a14', gosma: true });
    },
    atualizar(segundosDoQuadro, tempo) {
      brasas.atualizar(segundosDoQuadro, tempo); poeiraNoLuar.atualizar(segundosDoQuadro, tempo); vapor.atualizar(segundosDoQuadro, tempo);
      faiscas.atualizar(segundosDoQuadro, tempo); poeiraCaindo.atualizar(segundosDoQuadro, tempo);
      if (cavernaSecreta.hulkPesou) {
        cavernaSecreta.hulkPesou = false;
        for (let grao = 0; grao < 14; grao++) poeiraCaindo.lista.push({ x: sortearEntre(176, 214), y: alturaDoTeto(194) + sortearEntre(0, 6), vx: 0, vy: sortearEntre(0, 20), vida: 0, max: 3 });
      }
      for (const gota of gotas) {
        if (!gota.caindo) { if (tempo >= gota.proxima) { gota.caindo = true; gota.y = gota.y0; gota.vy = 0; } continue; }
        gota.vy += 160 * segundosDoQuadro;
        gota.y += gota.vy * segundosDoQuadro;
        if (gota.y >= gota.yChao) { gota.caindo = false; gota.respingo = tempo; gota.proxima = tempo + (gota.gosma ? sortearEntre(0.8, 2.2) : sortearEntre(3, 11)); }
      }
      if (tempo >= morcegos.proxima && !morcegos.bando.length) {
        const vemDaEsquerda = Math.random() < 0.5, quantidade = 2 + Math.floor(Math.random() * 3);
        for (let morcego = 0; morcego < quantidade; morcego++) {
          morcegos.bando.push({ x: vemDaEsquerda ? -10 - morcego * 9 : LARGURA + 10 + morcego * 9, y: sortearEntre(30, 70), velocidade: (vemDaEsquerda ? 1 : -1) * sortearEntre(55, 80), fase: Math.random() * 6 });
        }
      }
      for (const morcego of morcegos.bando) { morcego.x += morcego.velocidade * segundosDoQuadro; morcego.y += Math.sin(tempo * 3 + morcego.fase) * 0.3; }
      if (morcegos.bando.length && morcegos.bando.every(morcego => morcego.x < -20 || morcego.x > LARGURA + 20)) { morcegos.bando.length = 0; morcegos.proxima = tempo + sortearEntre(12, 24); }
      if (caixaSurpresa.fase === 'fechada' && tempo >= caixaSurpresa.proxima) { caixaSurpresa.fase = 'manivela'; caixaSurpresa.inicio = tempo; }
      else if (caixaSurpresa.fase === 'manivela' && tempo - caixaSurpresa.inicio > 2.6) { caixaSurpresa.fase = 'aberta'; caixaSurpresa.inicio = tempo; }
      else if (caixaSurpresa.fase === 'aberta' && tempo - caixaSurpresa.inicio > 2.4) { caixaSurpresa.fase = 'fechada'; caixaSurpresa.proxima = tempo + sortearEntre(10, 18); }
    },
    // elementos animados que ficam ATRÁS dos personagens
    desenharAnimadosDoFundo(contexto, tempo) {
      const passoDaAnimacao = Math.floor(tempo * 12);
      // telas: monitor do Ultron (varredura vermelha) e computador do Batman (linhas azuis rolando)
      for (let linhaDaTela = 0; linhaDaTela < 14; linhaDaTela++) {
        const intensidade = Math.max(0, 1 - Math.abs(((tempo * 9) % 18) - linhaDaTela) / 3);
        if (intensidade > 0.1) ferramentasPixel.ret(contexto, 134, 121 + linhaDaTela, 20, 1, 'rgba(255,60,40,' + (0.25 + intensidade * 0.5).toFixed(2) + ')');
      }
      ferramentasPixel.ret(contexto, 135, 128 + Math.round(Math.sin(tempo * 3) * 3), 18, 1, '#ff5a3a');
      for (let linhaDeTexto = 0; linhaDeTexto < 5; linhaDeTexto++) {
        const linhaY = 74 + ((linhaDeTexto * 3 + Math.floor(tempo * 4)) % 15), largura = 3 + Math.round(valorPseudoAleatorio(linhaDeTexto, Math.floor(tempo * 4) + linhaDeTexto, 8) * 10);
        ferramentasPixel.ret(contexto, 368, linhaY, largura, 1, '#3aa0ff');
      }
      ferramentasPixel.ret(contexto, 368 + (passoDaAnimacao % 14), 88, 1, 1, '#bfe4ff');
      // ventoinha: 4 quadros de rotor
      const anguloDoRotor = (Math.floor(tempo * 14) % 4) * Math.PI / 8;
      for (let indiceDaPa = 0; indiceDaPa < 3; indiceDaPa++) {
        const anguloDaPa = anguloDoRotor + indiceDaPa * Math.PI * 2 / 3;
        ferramentasPixel.linha(contexto, 204, 60, 204 + Math.round(Math.cos(anguloDaPa) * 5), 60 + Math.round(Math.sin(anguloDaPa) * 5), '#3e4350', 2);
      }
      ferramentasPixel.px(contexto, 204, 60, '#6c7385');
      // braseiros: chamas verdes (línguas de fogo com alturas que mudam a cada passo)
      for (const [braseiroX, semente] of POSICOES_DOS_BRASEIROS) for (let deslocamento = -4; deslocamento <= 4; deslocamento++) {
        const altura = Math.max(1, Math.round((5 - Math.abs(deslocamento)) * (1.6 + ruidoSuave(deslocamento * 7 + semente, passoDaAnimacao * 0.9, 1.6, semente) * 1.6)));
        ferramentasPixel.ret(contexto, braseiroX + deslocamento, 124 - altura, 1, altura, '#127a34');
        if (altura > 3) ferramentasPixel.ret(contexto, braseiroX + deslocamento, 124 - altura + 2, 1, altura - 3, '#3ee06a');
        if (altura > 6 && Math.abs(deslocamento) < 2) ferramentasPixel.ret(contexto, braseiroX + deslocamento, 124 - altura + 4, 1, altura - 6, '#d8ffe0');
      }
      // morcegos (silhuetas de 5×2 que batem as asas)
      for (const morcego of morcegos.bando) {
        const morcegoX = Math.round(morcego.x), morcegoY = Math.round(morcego.y), asaParaCima = Math.floor(tempo * 12 + morcego.fase) % 2;
        ferramentasPixel.px(contexto, morcegoX, morcegoY, '#07070b');
        ferramentasPixel.px(contexto, morcegoX - 1, morcegoY - asaParaCima, '#07070b'); ferramentasPixel.px(contexto, morcegoX + 1, morcegoY - asaParaCima, '#07070b');
        ferramentasPixel.px(contexto, morcegoX - 2, morcegoY - 1 + asaParaCima, '#07070b'); ferramentasPixel.px(contexto, morcegoX + 2, morcegoY - 1 + asaParaCima, '#07070b');
      }
      // luminária do Hulk: cabo e cúpula que balançam devagar
      const balanco = Math.round(Math.sin(tempo * 0.8) * 1.4), luminariaX = 194 + balanco;
      ferramentasPixel.linha(contexto, 194, alturaDoTeto(194), luminariaX, 116, '#08090d');
      ferramentasPixel.poligono(contexto, [[luminariaX - 2, 116], [luminariaX + 2, 116], [luminariaX + 5, 121], [luminariaX - 5, 121]], '#3a3020');
      ferramentasPixel.ret(contexto, luminariaX - 5, 121, 11, 1, '#6a5838');
      cenario.luminaria = [luminariaX, 122];
      // balão do Coringa preso ao caixote
      const balaoX = 84 + Math.round(Math.sin(tempo * 0.9) * 1.5), balaoY = 156 + Math.round(Math.sin(tempo * 1.3) * 1);
      ferramentasPixel.linha(contexto, 82, 182, balaoX, balaoY + 6, '#c9c4d8');
      ferramentasPixel.elipse(contexto, balaoX, balaoY, 4, 5, '#5e1f8f');
      ferramentasPixel.px(contexto, balaoX - 2, balaoY - 3, '#b07ae0');
      ferramentasPixel.px(contexto, balaoX, balaoY + 6, '#5e1f8f');
    },
    // elementos animados na FRENTE das plataformas (chão), ainda atrás dos personagens da frente
    desenharAnimadosDoChao(contexto, tempo) {
      // caixa-surpresa: manivela girando, tampa que abre e a cabeça de palhaço na mola
      const caixaX = 144, caixaY = 196, fase = caixaSurpresa.fase, tempoNaFase = tempo - caixaSurpresa.inicio;
      ferramentasPixel.ret(contexto, caixaX, caixaY, 10, 10, '#16131a'); ferramentasPixel.ret(contexto, caixaX + 1, caixaY + 1, 8, 8, '#7a1e8a'); ferramentasPixel.ret(contexto, caixaX + 1, caixaY + 4, 8, 1, '#3cbf4a');
      const posicaoDaManivela = fase === 'manivela' ? Math.floor(tempoNaFase * 8) % 4 : 0;
      ferramentasPixel.ret(contexto, caixaX + 10, caixaY + 4, 2, 1, '#9a9aa6');
      ferramentasPixel.ret(contexto, caixaX + 11, caixaY + 2 + [0, 1, 2, 1][posicaoDaManivela], 1, 3, '#9a9aa6');
      if (fase === 'aberta') {
        const subida = Math.min(1, tempoNaFase / 0.2), alturaDaMola = Math.round(10 * subida + Math.sin(tempoNaFase * 12) * 2 * Math.max(0, 1 - tempoNaFase));
        for (let espira = 0; espira < alturaDaMola; espira += 2) ferramentasPixel.ret(contexto, caixaX + 4 - (espira % 4 ? 1 : 0), caixaY - espira, 3, 1, '#c8c8d0');
        const palhacoY = caixaY - alturaDaMola - 4;
        ferramentasPixel.ret(contexto, caixaX + 2, palhacoY, 6, 5, '#f1f0ea'); ferramentasPixel.ret(contexto, caixaX + 2, palhacoY - 1, 6, 1, '#3cbf4a');
        ferramentasPixel.px(contexto, caixaX + 3, palhacoY + 1, '#16131a'); ferramentasPixel.px(contexto, caixaX + 6, palhacoY + 1, '#16131a'); ferramentasPixel.ret(contexto, caixaX + 3, palhacoY + 3, 4, 1, '#d8202a');
        ferramentasPixel.ret(contexto, caixaX - 1, caixaY - 1, 12, 1, '#16131a');
      } else ferramentasPixel.ret(contexto, caixaX - 1, caixaY - 1, 12, 2, '#16131a');
      // néon em espiral do Coringa (cor alternando, às vezes falha) e o varal de lâmpadas do palco do Freddy
      const corDoNeon = Math.random() < 0.03 ? '#2a1a3a' : (Math.floor(tempo * 1.5) % 2 ? '#c46bff' : '#5cff7a');
      for (let ponto = 0; ponto < 26; ponto++) {
        const angulo = ponto * 0.55, raio = ponto * 0.32;
        ferramentasPixel.px(contexto, 82 + Math.round(Math.cos(angulo) * raio), 172 + Math.round(Math.sin(angulo) * raio * 0.8), corDoNeon);
      }
      cenario.neon = corDoNeon;
      let anteriorX = 318, anteriorY = 146;
      for (let passo = 1; passo <= 12; passo++) {
        const fracao = passo / 12, proximoX = 318 + 58 * fracao, proximoY = 146 + Math.sin(fracao * Math.PI) * 6;
        ferramentasPixel.linha(contexto, anteriorX, anteriorY, proximoX, proximoY, '#0b0b10');
        anteriorX = proximoX; anteriorY = proximoY;
      }
      cenario.bandeirinhas = [];
      for (let bandeirinha = 0; bandeirinha < 7; bandeirinha++) {
        const fracao = (bandeirinha + 0.5) / 7, bandeirinhaX = Math.round(318 + 58 * fracao), bandeirinhaY = Math.round(146 + Math.sin(fracao * Math.PI) * 6) + 1;
        const cor = ['#ff4a4a', '#ffd24a', '#4ad2ff', '#7aff4a'][(bandeirinha + Math.floor(tempo * 3)) % 4];
        ferramentasPixel.ret(contexto, bandeirinhaX, bandeirinhaY, 2, 2, cor);
        cenario.bandeirinhas.push([bandeirinhaX + 1, bandeirinhaY + 1, cor]);
      }
      // gotas (água azulada e gosma preta) e o respingo quando batem no chão
      for (const gota of gotas) {
        if (gota.caindo) ferramentasPixel.ret(contexto, gota.x, Math.round(gota.y), 1, 2, gota.cor);
        else {
          const tempoDesdeORespingo = tempo - gota.respingo;
          if (tempoDesdeORespingo < 0.25) {
            const abertura = 1 + Math.round(tempoDesdeORespingo * 12);
            ferramentasPixel.px(contexto, gota.x - abertura, gota.yChao - 1, gota.cor);
            ferramentasPixel.px(contexto, gota.x + abertura, gota.yChao - 1, gota.cor);
          } else if (!gota.gosma) ferramentasPixel.px(contexto, gota.x, gota.y0, gota.cor);
        }
      }
      faiscas.desenhar(contexto, tempo);
    },
    desenharFundo(contexto) { contexto.drawImage(telaDoFundo.tela, 0, 0); },
    desenharMeio(contexto) { contexto.drawImage(telaDoMeio.tela, 0, 0); },
    desenharFrente(contexto) { contexto.drawImage(telaDaFrente.tela, 0, 0); },
    // luzes do ambiente no mapa de luz (cada uma com a sua temperatura de cor e o seu jeito de piscar)
    luzes(luz, tempo) {
      luz.cone(156, 10, 54, 196, '#a9bfff', 0.42);                                              // luar pela fenda do teto
      luz.ponto(176, 205, 26, '#a9bfff', 0.22, 0.35);
      for (const { pos: [lampadaX, lampadaY], cor, semente } of LAMPADAS) { const falha = Math.sin(tempo * 13 + semente * 5) > 0.97 ? 0.2 : 1; luz.ponto(lampadaX, lampadaY + 6, 26, cor, 0.32 * falha); }
      const [luminariaX, luminariaY] = cenario.luminaria || [194, 122], tremor = 0.92 + Math.random() * 0.08;
      luz.cone(luminariaX, luminariaY, 64, 92, '#ffb45a', 0.55 * tremor); luz.ponto(luminariaX, luminariaY + 4, 20, '#ffcf8a', 0.4);   // luminária âmbar do Hulk
      for (const [braseiroX, semente] of POSICOES_DOS_BRASEIROS) luz.ponto(braseiroX, 116, 38, '#3aff70', 0.5 + 0.15 * Math.sin(tempo * 7 + semente) + Math.random() * 0.06);   // braseiros
      luz.ponto(144, 128, 28, '#ff3a26', 0.3 + 0.1 * Math.sin(tempo * 9));                     // monitor do Ultron
      luz.ponto(82, 172, 22, cenario.neon === '#5cff7a' ? '#5cff7a' : '#c46bff', cenario.neon === '#2a1a3a' ? 0.05 : 0.38);   // néon do Coringa
      for (const [bandeirinhaX, bandeirinhaY, cor] of cenario.bandeirinhas || []) luz.ponto(bandeirinhaX, bandeirinhaY + 2, 9, cor, 0.35);
      luz.ponto(308, 200, 18, '#3a5aff', 0.2, 0.4);                                             // brilho frio na poça de gosma
      luz.ponto(20, 150, 46, '#1a2240', 0.25);                                                  // recanto do Slenderman: quase nada
    },
    // halos e pontos que EMITEM luz (por cima do mapa de luz)
    brilhos(contexto, tempo) {
      for (const [ledX, ledY, cor, semente] of LEDS) {
        const aceso = Math.sin(tempo * (2 + semente * 5) + semente * 40) > -0.2;
        if (aceso) { acenderPixel(contexto, ledX, ledY, cor, 0.95); desenharBrilho(contexto, ledX, ledY, 2, cor, 0.25); }
      }
      for (const { pos: [lampadaX, lampadaY], cor, semente } of LAMPADAS) {
        const falha = Math.sin(tempo * 13 + semente * 5) > 0.97 ? 0.2 : 1;
        acenderPixel(contexto, lampadaX, lampadaY + 1, '#fff3d8', falha);
        desenharBrilho(contexto, lampadaX, lampadaY + 1, 4, cor, 0.5 * falha);
      }
      const [luminariaX, luminariaY] = cenario.luminaria || [194, 122];
      acenderPixel(contexto, luminariaX - 1, luminariaY - 1, '#fff1d0', 1, 3, 1);
      desenharBrilho(contexto, luminariaX, luminariaY, 5, '#ffb45a', 0.55);
      for (const [braseiroX, semente] of POSICOES_DOS_BRASEIROS) desenharBrilho(contexto, braseiroX, 119, 7, '#3aff70', 0.45 + 0.1 * Math.sin(tempo * 9 + semente));
      desenharBrilho(contexto, 144, 128, 8, '#ff3a26', 0.25);
      desenharBrilho(contexto, 374, 81, 9, '#3aa0ff', 0.3);
      if (cenario.neon !== '#2a1a3a') desenharBrilho(contexto, 82, 172, 9, cenario.neon, 0.35);
      for (const [bandeirinhaX, bandeirinhaY, cor] of cenario.bandeirinhas || []) desenharBrilho(contexto, bandeirinhaX, bandeirinhaY, 3, cor, 0.5);
      // runas no chão em volta do Destino (pontos que acendem em sequência)
      for (let runa = 0; runa < 14; runa++) {
        const angulo = runa / 14 * Math.PI * 2, intensidade = 0.5 + 0.5 * Math.sin(tempo * 2 - runa * 0.9);
        if (intensidade > 0.35) acenderPixel(contexto, 268 + Math.round(Math.cos(angulo) * 22), 150 + Math.round(Math.sin(angulo) * 2), '#5dff8a', intensidade * 0.8);
      }
      acenderPixel(contexto, 164, 142, '#ff2a1a', Math.sin(tempo * 1.7) > 0.7 ? 0.9 : 0.15, 1, 1);   // olho do drone quebrado tentando religar
      brasas.desenhar(contexto, tempo); poeiraNoLuar.desenhar(contexto, tempo); vapor.desenhar(contexto, tempo); poeiraCaindo.desenhar(contexto, tempo);
    },
    // névoa rasteira e vinheta (por último)
    desenharAtmosfera(contexto, tempo) {
      contexto.save();
      contexto.globalAlpha = 0.16; contexto.drawImage(faixasDeNevoa[0].tela, Math.round(-(tempo * 4) % LARGURA), 188);
      contexto.globalAlpha = 0.11; contexto.drawImage(faixasDeNevoa[1].tela, Math.round(-(tempo * 7 + 120) % LARGURA), 194);
      contexto.restore();
      contexto.drawImage(telaDaVinheta.tela, 0, 0);
    },
    limpar() { for (const sistema of [brasas, poeiraNoLuar, vapor, faiscas, poeiraCaindo]) sistema.limpar(); },
  };
  cavernaSecreta.cenario = cenario;
})();
