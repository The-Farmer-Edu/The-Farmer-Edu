// ====================================================================================================
// EDIÇÃO PESSOAL — CAVERNA SECRETA · personagens/hulk.js
// Hulk: boneco articulado desenhado em código (técnica do celeiro, ver boneco.js), DE LADO em 3/4 olhando para a DIREITA
// (encara o Venom), no padrão do Nick Fury do celeiro. Em 3/4 de verdade o ombro e o braço DE PERTO ficam no meio/atrás da
// silhueta (camada da frente) e o ombro e o punho DE LONGE aparecem na frente, atrás do peito (camada de trás); o peitoral de
// perto é o largo e o de longe fica encurtado na borda da frente; pescoço e cabeça projetados para o adversário. Trapézio
// enorme, pescoço grosso, deltoides, braços MUSCULOSOS articulados (bíceps, tríceps, cotovelo, antebraço e punho que acompanham
// cada ângulo); calça roxa com barra rasgada. Respiração pesada, rugido, flexão, soco na palma, punhos que apertam.
// Nomes de coordenada: centroDaSilhuetaX = centro da silhueta; meioDaFrenteX = linha do meio da frente (esterno);
// ombrosY = linha dos ombros.
// ====================================================================================================
(() => {
  const cavernaSecreta = window.CavernaSecreta, ferramentasPixel = window.CenaDoCeleiro.pixel;
  const paletaCores = {
    verdeQuasePreto: '#0b1508',
    verdeProfundo: '#1e3f16',
    peleSombra: '#2e6222',
    pele: '#46882d',
    peleClara: '#64aa3b',
    peleBrilho: '#93cf58',
    cabelo: '#141a10',
    cabeloReflexo: '#2d3a22',
    calcaSombra: '#2a1840',
    calca: '#4a2b72',
    calcaClara: '#6c45a3',
    brancoDosOlhos: '#f2f4d6',
    dentes: '#ece3b8',
    bocaAberta: '#3a0c0c',
  };

  const desenharPerna = (contexto, quadrilX, quadrilY, anguloDoQuadril, anguloDoJoelho, ehDePerto) => {
    const cores = paletaCores;
    const perna = cavernaSecreta.desenharMembro(contexto, quadrilX, quadrilY, anguloDoQuadril, anguloDoJoelho, {
      comprimentoSuperior: 11, comprimentoInferior: 10, grossuraSuperior: ehDePerto ? 8 : 7, grossuraInferior: ehDePerto ? 7 : 6,
      corSuperior: ehDePerto ? cores.calca : cores.calcaSombra, corInferior: ehDePerto ? cores.pele : cores.peleSombra, corDoRealce: ehDePerto ? cores.calcaClara : null,
    });
    const [joelhoX, joelhoY] = perna.articulacao, [peX, peY] = perna.extremidade;
    for (let deslocamento = -3; deslocamento <= 3; deslocamento += 2) {                                                  // barra rasgada
      ferramentasPixel.px(contexto, joelhoX + deslocamento, joelhoY + 2 + (deslocamento % 4 ? 1 : 0), ehDePerto ? cores.calca : cores.calcaSombra);
    }
    if (ehDePerto) { ferramentasPixel.elipse(contexto, joelhoX + 1, joelhoY + 5, 2.5, 2, cores.peleClara); ferramentasPixel.px(contexto, joelhoX, joelhoY + 4, cores.peleBrilho); }   // panturrilha
    ferramentasPixel.poligono(contexto, [[peX - 4, peY - 2], [peX + 4, peY - 2], [peX + 7, peY + 1], [peX - 4, peY + 1]], ehDePerto ? cores.pele : cores.peleSombra);   // pé largo
    ferramentasPixel.ret(contexto, peX - 4, peY + 1, 12, 1, cores.verdeProfundo);
    if (ehDePerto) for (const dedoX of [3, 5]) ferramentasPixel.px(contexto, peX + dedoX, peY, cores.verdeProfundo);
  };

  // BRAÇO MUSCULOSO articulado: todo o volume é calculado na direção de cada segmento, então acompanha o movimento — o bíceps
  // fica sempre na face da frente do braço (em cima quando o braço sobe), o tríceps na de trás, o cotovelo é arredondado, o
  // antebraço engrossa perto do cotovelo e afina no pulso, e o punho se orienta pelo antebraço (nada de peças fixas deslizando).
  // Ângulos em graus a partir da vertical para baixo; positivo = para a frente (como cavernaSecreta.desenharMembro).
  // cores: { base, luz, brilho, sombra }; flexao: quanto o bíceps estufa (0 = relaxado).
  const COMPRIMENTO_DO_BRACO = 10, COMPRIMENTO_DO_ANTEBRACO = 10;
  const desenharBracoMusculoso = (contexto, ombroX, ombroY, anguloDoOmbro, anguloDoCotovelo, cores, flexao, punhoFechado) => {
    const radianosDoBraco = cavernaSecreta.grausParaRadianos(anguloDoOmbro), radianosDoAntebraco = cavernaSecreta.grausParaRadianos(anguloDoOmbro + anguloDoCotovelo);
    const direcaoDoBraco = [Math.sin(radianosDoBraco), Math.cos(radianosDoBraco)], frenteDoBraco = [Math.cos(radianosDoBraco), -Math.sin(radianosDoBraco)];
    const direcaoDoAntebraco = [Math.sin(radianosDoAntebraco), Math.cos(radianosDoAntebraco)], frenteDoAntebraco = [Math.cos(radianosDoAntebraco), -Math.sin(radianosDoAntebraco)];
    // ponto a `aoLongo` px da origem na direção do segmento e `deLado` px para a face da frente (negativo: face de trás)
    const noSegmento = (origem, direcao, frente, aoLongo, deLado) => [origem[0] + direcao[0] * aoLongo + frente[0] * deLado, origem[1] + direcao[1] * aoLongo + frente[1] * deLado];
    const ombro = [ombroX, ombroY], noBraco = (aoLongo, deLado) => noSegmento(ombro, direcaoDoBraco, frenteDoBraco, aoLongo, deLado);
    const cotovelo = noBraco(COMPRIMENTO_DO_BRACO, 0), noAntebraco = (aoLongo, deLado) => noSegmento(cotovelo, direcaoDoAntebraco, frenteDoAntebraco, aoLongo, deLado);
    // braço: bíceps estufando na frente (mais quando flexiona), tríceps atrás
    ferramentasPixel.poligono(contexto, [noBraco(0, 4.5), noBraco(4.5, 5 + flexao), noBraco(8, 4), noBraco(10, 3.5), noBraco(10, -3.5), noBraco(5, -4.5), noBraco(0, -4.5)], cores.base);
    ferramentasPixel.poligono(contexto, [noBraco(2.5, 1.5), noBraco(4.5, 4 + flexao), noBraco(7, 3.2 + flexao * 0.6), noBraco(8.5, 1.5), noBraco(5.5, 0.5)], cores.luz);   // bíceps
    const brilhoDoBiceps = noBraco(4.5, 2.5 + flexao * 0.5);
    ferramentasPixel.px(contexto, brilhoDoBiceps[0], brilhoDoBiceps[1], cores.brilho);
    ferramentasPixel.linha(contexto, ...noBraco(3, -3.5), ...noBraco(9, -2.5), cores.sombra, 1);                                       // tríceps
    ferramentasPixel.elipse(contexto, cotovelo[0], cotovelo[1], 3.5, 3.5, cores.base);                                                  // cotovelo
    // antebraço: grosso perto do cotovelo, fino no pulso
    ferramentasPixel.poligono(contexto, [noAntebraco(0, 3.5), noAntebraco(3, 4.2), noAntebraco(9, 2.8), noAntebraco(9, -2.8), noAntebraco(3, -3.8), noAntebraco(0, -3.5)], cores.base);
    ferramentasPixel.linha(contexto, ...noAntebraco(1.5, 2.4), ...noAntebraco(6, 1.8), cores.luz, 2);
    ferramentasPixel.linha(contexto, ...noAntebraco(2, -3), ...noAntebraco(8, -2.2), cores.sombra, 1);
    // punho orientado pelo antebraço, com a linha dos nós dos dedos
    ferramentasPixel.poligono(contexto, [noAntebraco(8.5, 3.6), noAntebraco(13.5, 3.4), noAntebraco(13.5, -3.4), noAntebraco(8.5, -3.6)], cores.base);
    ferramentasPixel.linha(contexto, ...noAntebraco(9, 3), ...noAntebraco(13, 3), punhoFechado ? cores.brilho : cores.luz, 1);
    ferramentasPixel.linha(contexto, ...noAntebraco(12.5, 2.5), ...noAntebraco(12.5, -2.5), cores.sombra, 1);
    return { cotovelo, mao: noAntebraco(COMPRIMENTO_DO_ANTEBRACO, 0) };
  };

  const desenharPartes = (camadas, pose, tempo) => {
    const { origemX, origemY } = camadas, cores = paletaCores;
    const elevacaoDaRespiracao = -Math.round(pose.respira), centroX = origemX + Math.round(pose.inclina), ombrosY = origemY - 38 + elevacaoDaRespiracao;
    const centroDaSilhuetaX = centroX + 1, meioDaFrenteX = centroDaSilhuetaX + 5;
    // ---- trás: perna, braço e deltoide de longe (na frente do corpo, atrás do peito)
    desenharPerna(camadas.tras, origemX - 4, origemY - 22, -4, 5, false);
    desenharBracoMusculoso(camadas.tras, centroDaSilhuetaX + 9, ombrosY + 3, pose.bracoDeLongeOmbro, pose.bracoDeLongeCotovelo, { base: cores.peleSombra, luz: cores.pele, brilho: cores.peleClara, sombra: cores.verdeProfundo }, pose.flexiona * 0.6, pose.punho > 0.5);
    ferramentasPixel.elipse(camadas.tras, centroDaSilhuetaX + 9, ombrosY + 1, 5, 5, cores.peleSombra);                                 // deltoide de longe por cima da raiz do braço
    ferramentasPixel.elipse(camadas.tras, centroDaSilhuetaX + 10, ombrosY - 1, 2, 2, cores.pele);

    // ---- corpo: perna de perto, calça, tronco em 3/4, trapézio, pescoço, cabeça
    const corpo = camadas.corpo;
    desenharPerna(corpo, origemX + 4, origemY - 22, 8, -9, true);
    ferramentasPixel.poligono(corpo, [[centroX - 9, ombrosY + 19], [centroX + 9, ombrosY + 19], [centroX + 10, ombrosY + 26], [centroX - 9, ombrosY + 26]], cores.calca);   // calça
    ferramentasPixel.ret(corpo, centroX - 9, ombrosY + 19, 19, 2, cores.calcaSombra);
    for (const deslocamentoDaDobra of [-5, 1, 6]) ferramentasPixel.linha(corpo, centroX + deslocamentoDaDobra, ombrosY + 21, centroX + deslocamentoDaDobra + 1, ombrosY + 26, cores.calcaSombra, 1);
    ferramentasPixel.ret(corpo, centroX + 4, ombrosY + 21, 2, 4, cores.calcaClara);
    // tronco em V visto em 3/4: costas na sombra atrás, PEITO estufado para a frente (para o Venom)
    ferramentasPixel.poligono(corpo, [[centroDaSilhuetaX - 10, ombrosY - 2], [centroDaSilhuetaX + 9, ombrosY - 2], [centroDaSilhuetaX + 13, ombrosY + 3], [centroDaSilhuetaX + 12, ombrosY + 9], [centroDaSilhuetaX + 8, ombrosY + 20], [centroDaSilhuetaX - 8, ombrosY + 20], [centroDaSilhuetaX - 11, ombrosY + 7]], cores.pele);
    ferramentasPixel.poligono(corpo, [[centroDaSilhuetaX - 10, ombrosY - 2], [centroDaSilhuetaX - 6, ombrosY - 2], [centroDaSilhuetaX - 5, ombrosY + 10], [centroDaSilhuetaX - 4, ombrosY + 20], [centroDaSilhuetaX - 8, ombrosY + 20], [centroDaSilhuetaX - 11, ombrosY + 7]], cores.peleSombra);   // costas na sombra
    ferramentasPixel.elipse(corpo, meioDaFrenteX - 4, ombrosY + 4, 5.5, 4.5, cores.peleClara);                                             // peitorais: o de perto largo, o de longe encurtado na borda
    ferramentasPixel.elipse(corpo, meioDaFrenteX + 4, ombrosY + 4, 3.5, 4, cores.peleClara);
    ferramentasPixel.elipse(corpo, meioDaFrenteX - 4, ombrosY + 2, 3, 2, cores.peleBrilho);
    ferramentasPixel.px(corpo, meioDaFrenteX + 5, ombrosY + 2, cores.peleBrilho);
    ferramentasPixel.linha(corpo, meioDaFrenteX - 9, ombrosY + 8, meioDaFrenteX - 1, ombrosY + 8, cores.peleSombra, 1);                        // sombra sob o peito
    ferramentasPixel.linha(corpo, meioDaFrenteX + 1, ombrosY + 8, meioDaFrenteX + 7, ombrosY + 7, cores.peleSombra, 1);
    for (const alturaDoGomo of [10, 13, 16]) {                                                                                         // seis gomos (os de longe estreitos)
      ferramentasPixel.ret(corpo, meioDaFrenteX - 5, ombrosY + alturaDoGomo, 4, 2, cores.peleClara);
      ferramentasPixel.px(corpo, meioDaFrenteX - 4, ombrosY + alturaDoGomo, cores.peleBrilho);
      ferramentasPixel.ret(corpo, meioDaFrenteX + 1, ombrosY + alturaDoGomo, 2, 2, cores.peleClara);
      ferramentasPixel.ret(corpo, meioDaFrenteX - 5, ombrosY + alturaDoGomo + 2, 8, 1, cores.peleSombra);
    }
    ferramentasPixel.linha(corpo, meioDaFrenteX, ombrosY, meioDaFrenteX, ombrosY + 18, cores.peleSombra, 1);                                     // linha do meio (esterno)
    ferramentasPixel.linha(corpo, meioDaFrenteX - 8, ombrosY + 9, meioDaFrenteX - 6, ombrosY + 18, cores.peleSombra, 1);                        // oblíquos
    ferramentasPixel.linha(corpo, meioDaFrenteX + 4, ombrosY + 9, meioDaFrenteX + 3, ombrosY + 18, cores.peleSombra, 1);
    // trapézio descendo das costas até o pescoço, que vai para a frente
    ferramentasPixel.poligono(corpo, [[centroDaSilhuetaX - 10, ombrosY - 1], [centroDaSilhuetaX - 5, ombrosY - 6], [meioDaFrenteX + 1, ombrosY - 7], [centroDaSilhuetaX + 11, ombrosY - 1]], cores.pele);
    ferramentasPixel.linha(corpo, centroDaSilhuetaX - 5, ombrosY - 5, centroDaSilhuetaX - 10, ombrosY - 2, cores.peleClara, 1);
    ferramentasPixel.linha(corpo, meioDaFrenteX + 1, ombrosY - 6, centroDaSilhuetaX + 10, ombrosY - 2, cores.peleBrilho, 1);
    const cabecaX = meioDaFrenteX + 2 + Math.round(pose.cabecaGiro), cabecaY = ombrosY - 10 + Math.round(pose.cabecaInclina);
    ferramentasPixel.poligono(corpo, [[meioDaFrenteX - 6, ombrosY - 2], [cabecaX - 5, cabecaY + 2], [cabecaX + 3, cabecaY + 3], [meioDaFrenteX + 5, ombrosY - 2]], cores.pele);   // PESCOÇO grosso, inclinado para a frente
    ferramentasPixel.linha(corpo, meioDaFrenteX - 6, ombrosY - 3, cabecaX - 5, cabecaY + 2, cores.peleSombra, 1);
    ferramentasPixel.linha(corpo, cabecaX - 1, cabecaY + 6, cabecaX + 4, cabecaY + 6, cores.peleSombra, 1);                           // sombra sob a mandíbula
    // cabeça em 3/4 como a do Fury: nuca, orelha e cabelo atrás; testa, os dois olhos, nariz (saindo do contorno) e boca na frente
    ferramentasPixel.elipse(corpo, cabecaX, cabecaY - 1, 5.5, 5.5, cores.pele);                                                        // crânio
    ferramentasPixel.poligono(corpo, [[cabecaX - 3, cabecaY + 1], [cabecaX + 6, cabecaY + 1], [cabecaX + 5, cabecaY + 5], [cabecaX - 1, cabecaY + 5]], cores.pele);   // mandíbula quadrada na frente
    ferramentasPixel.ret(corpo, cabecaX - 5, cabecaY - 2, 1, 4, cores.peleSombra);                                                     // nuca na sombra, orelha
    ferramentasPixel.ret(corpo, cabecaX - 4, cabecaY - 1, 2, 3, cores.peleSombra);
    ferramentasPixel.px(corpo, cabecaX - 3, cabecaY, cores.peleClara);
    ferramentasPixel.poligono(corpo, [[cabecaX - 6, cabecaY - 1], [cabecaX - 6, cabecaY - 5], [cabecaX - 3, cabecaY - 8], [cabecaX + 2, cabecaY - 8], [cabecaX + 5, cabecaY - 6], [cabecaX + 5, cabecaY - 4], [cabecaX + 2, cabecaY - 5], [cabecaX - 2, cabecaY - 5], [cabecaX - 4, cabecaY - 2]], cores.cabelo);   // cabelo cobrindo a nuca
    ferramentasPixel.px(corpo, cabecaX - 2, cabecaY - 7, cores.cabeloReflexo);
    ferramentasPixel.px(corpo, cabecaX + 1, cabecaY - 6, cores.cabeloReflexo);
    ferramentasPixel.ret(corpo, cabecaX - 1, cabecaY - 3, 7, 1, cores.verdeQuasePreto);                                                // testa pesada, franzida
    ferramentasPixel.px(corpo, cabecaX + 2, cabecaY - 2, cores.verdeQuasePreto);
    ferramentasPixel.px(corpo, cabecaX, cabecaY - 2, cores.brancoDosOlhos);                                                             // os dois olhos (perto e longe), olhando para o Venom
    ferramentasPixel.px(corpo, cabecaX + 1, cabecaY - 2, cores.verdeQuasePreto);
    ferramentasPixel.px(corpo, cabecaX + 3, cabecaY - 2, cores.brancoDosOlhos);
    ferramentasPixel.px(corpo, cabecaX + 4, cabecaY - 2, cores.verdeQuasePreto);
    ferramentasPixel.ret(corpo, cabecaX + 5, cabecaY - 1, 2, 2, cores.peleClara);                                                      // nariz saindo do contorno, maçã do rosto
    ferramentasPixel.px(corpo, cabecaX + 6, cabecaY, cores.peleSombra);
    ferramentasPixel.px(corpo, cabecaX + 3, cabecaY + 1, cores.peleClara);
    if (pose.boca > 0.5) {                                                                                                              // rosnado
      ferramentasPixel.ret(corpo, cabecaX + 1, cabecaY + 2, 5, 3, cores.bocaAberta);
      ferramentasPixel.ret(corpo, cabecaX + 1, cabecaY + 2, 5, 1, cores.dentes);
      ferramentasPixel.ret(corpo, cabecaX + 1, cabecaY + 4, 5, 1, cores.dentes);
    } else {                                                                                                                            // boca cerrada
      ferramentasPixel.ret(corpo, cabecaX + 1, cabecaY + 3, 5, 1, cores.verdeQuasePreto);
      ferramentasPixel.px(corpo, cabecaX, cabecaY + 4, cores.peleSombra);
    }

    // ---- frente: braço de perto (preso ao ombro no meio da silhueta, sobre as costas) e o deltoide por cima da raiz
    const frente = camadas.frente;
    desenharBracoMusculoso(frente, centroDaSilhuetaX - 6, ombrosY + 4, pose.bracoDePertoOmbro, pose.bracoDePertoCotovelo, { base: cores.pele, luz: cores.peleClara, brilho: cores.peleBrilho, sombra: cores.peleSombra }, pose.flexiona, pose.punho > 0.5);
    ferramentasPixel.elipse(frente, centroDaSilhuetaX - 6, ombrosY + 2, 5.5, 5.5, cores.peleClara);
    ferramentasPixel.elipse(frente, centroDaSilhuetaX - 5, ombrosY, 3, 2, cores.peleBrilho);
    ferramentasPixel.linha(frente, centroDaSilhuetaX - 11, ombrosY + 3, centroDaSilhuetaX - 10, ombrosY + 6, cores.peleSombra, 1);
    return { cabeca: [cabecaX - origemX, cabecaY - origemY] };
  };

  cavernaSecreta.registrarPersonagem({
    boneco: true, id: 'hulk', direcao: 1,
    falas: { frases: ['Deus fraco.'], intervalo: [18, 30], primeira: [5, 12], ancora: [2, -59], gesto: 'rugir' },
    largura: 72, altura: 64, origem: [34, 61], sombra: 20, contorno: '#071005',
    pose: { respira: 0, inclina: 1, cabecaGiro: 0, cabecaInclina: 0, boca: 0, bracoDePertoOmbro: 6, bracoDePertoCotovelo: 14, bracoDeLongeOmbro: 12, bracoDeLongeCotovelo: 6, punho: 0, flexiona: 0 },
    gestos: {
      // rugido de peito aberto: os dois braços TENSOS ao lado do corpo, cotovelos dobrados e punhos cerrados à frente do quadril.
      // (Antes os braços giravam 35° para TRÁS: o braço de perto — preso ao ombro no meio da silhueta — saía inteiro pelas
      // costas e parecia ter trocado de lado. Ângulo do ombro de perto nunca abaixo de −5° evita isso.)
      rugir: [{ t: 0 }, { t: 0.35, cabecaInclina: -2, boca: 1, bracoDePertoOmbro: -4, bracoDePertoCotovelo: 34, bracoDeLongeOmbro: 18, bracoDeLongeCotovelo: 28, punho: 1, respira: 1, flexiona: 1 }, { t: 1.6, cabecaInclina: -2, boca: 1, bracoDePertoOmbro: -5, bracoDePertoCotovelo: 37, bracoDeLongeOmbro: 20, bracoDeLongeCotovelo: 30, punho: 1, respira: 1, flexiona: 1.3 }, { t: 2.1 }],
      // o braço de perto contrai à frente do abdômen; o de longe ergue o antebraço com o bíceps estufado
      flexionar: [{ t: 0 }, { t: 0.5, bracoDePertoOmbro: 30, bracoDePertoCotovelo: 75, bracoDeLongeOmbro: 60, bracoDeLongeCotovelo: 85, punho: 1, flexiona: 1.5, respira: 1 }, { t: 1.6, bracoDePertoOmbro: 32, bracoDePertoCotovelo: 78, bracoDeLongeOmbro: 62, bracoDeLongeCotovelo: 88, punho: 1, flexiona: 1.8, respira: 1 }, { t: 2.1 }],
      // o punho de perto vai e volta contra a mão de longe, à frente do peito
      socarPalma: [{ t: 0 }, { t: 0.4, bracoDePertoOmbro: 36, bracoDePertoCotovelo: 50, bracoDeLongeOmbro: -20, bracoDeLongeCotovelo: 110, punho: 1 }, { t: 0.6, bracoDePertoOmbro: 46, bracoDePertoCotovelo: 48, bracoDeLongeOmbro: -20, bracoDeLongeCotovelo: 110, punho: 1 }, { t: 0.8, bracoDePertoOmbro: 36, bracoDePertoCotovelo: 50, bracoDeLongeOmbro: -20, bracoDeLongeCotovelo: 110, punho: 1 }, { t: 1.0, bracoDePertoOmbro: 46, bracoDePertoCotovelo: 48, bracoDeLongeOmbro: -20, bracoDeLongeCotovelo: 110, punho: 1 }, { t: 1.5 }],
      olharDeLado: [{ t: 0 }, { t: 0.4, cabecaGiro: -1 }, { t: 1.8, cabecaGiro: -1 }, { t: 2.2 }],
    },
    gestosAutomaticos: [{ gesto: 'rugir', intervalo: [12, 20], primeira: [4, 9] }, { gesto: 'flexionar', intervalo: [10, 17] }, { gesto: 'socarPalma', intervalo: [13, 22] }, { gesto: 'olharDeLado', intervalo: [7, 12] }],
    ociosos: [
      { nome: 'respirar', intervalo: [0.2, 0.6], duracao: 3.0, aplicar: (pose, fracao) => { pose.respira += fracao < 0.45 ? Math.round(cavernaSecreta.vaiEVolta(fracao / 0.45)) : 0; } },   // respiração pesada e lenta
      { nome: 'punhos', intervalo: [3, 7], duracao: [0.8, 1.6], semGesto: true, aplicar: (pose, fracao) => { pose.punho = 1; pose.bracoDePertoCotovelo -= fracao > 0.2 && fracao < 0.8 ? 6 : 0; } },
      // muda o peso de pé: o corpo inclina e, no começo, avisa o cenário (cai poeira do teto)
      { nome: 'peso', intervalo: [8, 14], duracao: [1.6, 2.6], semGesto: true, aplicar: (pose, fracao) => { if (fracao > 0.15 && fracao < 0.85) { pose.inclina += 1; if (fracao < 0.25) cavernaSecreta.hulkPesou = true; } } },
    ],
    desenharPartes,
  });
})();
