// ====================================================================================================
// EDIÇÃO PESSOAL — CAVERNA SECRETA · personagens/freddy.js
// Freddy Fazbear: boneco articulado desenhado em código (técnica do celeiro, ver boneco.js), no palco, olhando para a
// ESQUERDA (o salão). Cabeça de urso com orelhas e cartola, focinho e nariz, olhos azuis com pálpebras, MANDÍBULA separada com
// dentes; pescoço e juntas de endoesqueleto à mostra; barriga clara; gravata-borboleta; mãos com dedos; MICROFONE na mão da
// frente, que ele leva à boca ao cantar. Movimentos de animatrônico: trancos secos, pausas, olhos noturnos.
// pose.olhos: 0 = olhos azuis abertos, 1 = piscando, 2 = olhos noturnos (pupilas brancas acesas).
// ====================================================================================================
(() => {
  const cavernaSecreta = window.CavernaSecreta, ferramentasPixel = window.CenaDoCeleiro.pixel;
  const paletaCores = {
    marromProfundo: '#120a06',
    pelagemEscura: '#5a3218',
    pelagem: '#7f4a24',
    pelagemClara: '#a46634',
    pelagemRealce: '#c88a4e',
    barrigaClara: '#dcb57f',
    barrigaSombra: '#b38a58',
    pretoDaCartola: '#121116',
    cinzaDaCartola: '#34333d',
    azulDosOlhos: '#2f78cf',
    brancoDosOlhos: '#eaf2ff',
    dentes: '#f4efe4',
    metalEscuro: '#34343a',
    metalClaro: '#7c7c84',
  };
  const OLHOS_ABERTOS = 0, OLHOS_PISCANDO = 1, OLHOS_NOTURNOS = 2;
  // Gestos escritos pelo DESTINO da mão (cavernaSecreta.angulosParaAlcancar), em coordenadas a partir do ombro de perto
  // (centroX + 6, ombrosY + 3). A boca fica em (centroX + 2…7, ombrosY − 6…−3) e a ponta do focinho em centroX + 6,5:
  // com a mão em (centroX + 6, ombrosY − 1,5), a cabeça do microfone (3,5 px acima do punho) para logo à frente do focinho,
  // sem esconder a mandíbula que canta. A dobra de referência (−70°) é a do repouso: o antebraço sobe pelo caminho curto.
  const COMPRIMENTO_DO_BRACO = 7;
  const MICROFONE_NA_BOCA = cavernaSecreta.angulosParaAlcancar(0, -4.5, COMPRIMENTO_DO_BRACO, COMPRIMENTO_DO_BRACO, true, -70);
  const cantarComAMandibula = (tempo, abertura) => ({ t: tempo, bracoDePertoOmbro: MICROFONE_NA_BOCA.anguloDaRaiz, bracoDePertoCotovelo: MICROFONE_NA_BOCA.anguloDaDobra, mandibula: abertura });
  // aceno com o braço de LONGE erguido para cima e para trás (no repouso ele fica atrás do tronco): assim a mão aparece livre,
  // ao lado da cabeça, em vez de sumir atrás das orelhas; o antebraço balança entre as duas dobras
  const acenoComODobra = (tempo, dobra) => ({ t: tempo, bracoDeLongeOmbro: -150, bracoDeLongeCotovelo: dobra });

  const desenharPerna = (contexto, quadrilX, quadrilY, anguloDoQuadril, anguloDoJoelho, ehDePerto) => {
    const corDaPerna = ehDePerto ? paletaCores.pelagem : paletaCores.pelagemEscura;
    const perna = cavernaSecreta.desenharMembro(contexto, quadrilX, quadrilY, anguloDoQuadril, anguloDoJoelho, {
      comprimentoSuperior: 8, comprimentoInferior: 8, grossuraSuperior: 5, grossuraInferior: 5, corSuperior: corDaPerna, corInferior: corDaPerna, corDoRealce: ehDePerto ? paletaCores.pelagemClara : null,
    });
    const [joelhoX, joelhoY] = perna.articulacao, [peX, peY] = perna.extremidade;
    ferramentasPixel.ret(contexto, joelhoX - 1, joelhoY, 3, 1, paletaCores.metalEscuro);   // junta do endoesqueleto
    ferramentasPixel.px(contexto, joelhoX, joelhoY, paletaCores.metalClaro);
    ferramentasPixel.poligono(contexto, [[peX - 3, peY - 2], [peX + 3, peY - 2], [peX + 5, peY + 1], [peX - 3, peY + 1]], corDaPerna);
    if (ehDePerto) ferramentasPixel.ret(contexto, peX, peY - 1, 3, 1, paletaCores.barrigaSombra);
  };

  const desenharPartes = (camadas, pose, tempo) => {
    const { origemX, origemY } = camadas, cores = paletaCores;
    const elevacaoDaRespiracao = -Math.round(pose.respira), centroX = origemX + Math.round(pose.inclina), ombrosY = origemY - 31 + elevacaoDaRespiracao;   // ombrosY: linha dos ombros
    // ---- trás: perna e braço de longe (cotovelo de endoesqueleto)
    desenharPerna(camadas.tras, origemX - 3, origemY - 16, 2, -3, false);
    const bracoDeLonge = cavernaSecreta.desenharMembro(camadas.tras, centroX - 6, ombrosY + 3, pose.bracoDeLongeOmbro, pose.bracoDeLongeCotovelo, {
      comprimentoSuperior: 7, comprimentoInferior: 7, grossuraSuperior: 4, grossuraInferior: 4, corSuperior: cores.pelagemEscura, corInferior: cores.pelagemEscura,
    });
    ferramentasPixel.px(camadas.tras, bracoDeLonge.articulacao[0], bracoDeLonge.articulacao[1], cores.metalClaro);
    ferramentasPixel.ret(camadas.tras, bracoDeLonge.extremidade[0] - 2, bracoDeLonge.extremidade[1] - 1, 4, 3, cores.pelagemEscura);

    // ---- corpo: perna de perto, tronco com a barriga clara, gravata, pescoço, cabeça
    const corpo = camadas.corpo;
    desenharPerna(corpo, origemX + 3, origemY - 16, 5, -5, true);
    ferramentasPixel.poligono(corpo, [[centroX - 7, ombrosY - 1], [centroX + 7, ombrosY - 1], [centroX + 8, ombrosY + 8], [centroX + 6, ombrosY + 15], [centroX - 6, ombrosY + 15], [centroX - 8, ombrosY + 8]], cores.pelagem);
    ferramentasPixel.elipse(corpo, centroX + 1, ombrosY + 8, 5, 5.5, cores.barrigaClara);
    ferramentasPixel.ret(corpo, centroX - 2, ombrosY + 5, 2, 3, cores.pelagemRealce);
    ferramentasPixel.linha(corpo, centroX + 5, ombrosY + 4, centroX + 5, ombrosY + 12, cores.barrigaSombra, 1);
    ferramentasPixel.poligono(corpo, [[centroX - 6, ombrosY], [centroX - 2, ombrosY], [centroX - 3, ombrosY + 12], [centroX - 7, ombrosY + 8]], cores.pelagemClara);
    ferramentasPixel.ret(corpo, centroX - 1, ombrosY - 3, 4, 3, cores.metalEscuro);                                                                            // pescoço mecânico
    ferramentasPixel.px(corpo, centroX, ombrosY - 3, cores.metalClaro);
    ferramentasPixel.px(corpo, centroX + 2, ombrosY - 2, cores.metalClaro);
    ferramentasPixel.poligono(corpo, [[centroX - 3, ombrosY - 1], [centroX + 1, ombrosY + 1], [centroX + 5, ombrosY - 1], [centroX + 5, ombrosY + 2], [centroX + 1, ombrosY + 1], [centroX - 3, ombrosY + 2]], cores.pretoDaCartola);   // gravata-borboleta
    const cabecaX = centroX + 2 + Math.round(pose.cabecaGiro), cabecaY = ombrosY - 9 + Math.round(pose.cabecaInclina), aberturaDaMandibula = Math.round(pose.mandibula);
    // cabeça em 3/4 ABERTO para quem olha: as duas orelhas, os dois olhos, focinho no meio, mandíbula embaixo do focinho
    for (const ladoDaOrelha of [-5, 5]) {
      ferramentasPixel.elipse(corpo, cabecaX + ladoDaOrelha, cabecaY - 6, 2.5, 2.5, cores.pelagemEscura);
      ferramentasPixel.px(corpo, cabecaX + ladoDaOrelha, cabecaY - 6, cores.barrigaSombra);
    }
    ferramentasPixel.elipse(corpo, cabecaX, cabecaY - 1, 6, 5.5, cores.pelagem);                                                                               // cabeça
    ferramentasPixel.elipse(corpo, cabecaX - 2, cabecaY - 3, 2.5, 2, cores.pelagemClara);
    ferramentasPixel.ret(corpo, cabecaX - 2, cabecaY - 10, 6, 4, cores.pretoDaCartola);                                                                        // cartola
    ferramentasPixel.ret(corpo, cabecaX - 4, cabecaY - 6, 10, 1, cores.pretoDaCartola);
    ferramentasPixel.ret(corpo, cabecaX - 2, cabecaY - 9, 1, 2, cores.cinzaDaCartola);
    const mandibulaY = cabecaY + aberturaDaMandibula;
    ferramentasPixel.poligono(corpo, [[cabecaX - 3, mandibulaY + 3], [cabecaX + 5, mandibulaY + 3], [cabecaX + 4, mandibulaY + 6], [cabecaX - 2, mandibulaY + 6]], cores.barrigaClara);   // mandíbula com dentes
    for (let denteX = cabecaX - 2; denteX <= cabecaX + 4; denteX += 2) ferramentasPixel.px(corpo, denteX, mandibulaY + 3, cores.dentes);
    if (aberturaDaMandibula > 0) ferramentasPixel.ret(corpo, cabecaX - 2, cabecaY + 3, 7, aberturaDaMandibula, cores.marromProfundo);
    ferramentasPixel.elipse(corpo, cabecaX + 1, cabecaY + 1, 3.5, 2.2, cores.barrigaClara);                                                                     // focinho, nariz, dentes de cima
    ferramentasPixel.ret(corpo, cabecaX, cabecaY - 1, 3, 2, cores.pretoDaCartola);
    ferramentasPixel.px(corpo, cabecaX + 1, cabecaY - 1, cores.cinzaDaCartola);
    for (let denteX = cabecaX - 2; denteX <= cabecaX + 4; denteX += 2) ferramentasPixel.px(corpo, denteX, cabecaY + 3, cores.dentes);
    if (pose.olhos === OLHOS_PISCANDO) {
      ferramentasPixel.ret(corpo, cabecaX - 4, cabecaY - 3, 2, 2, cores.pelagem);
      ferramentasPixel.ret(corpo, cabecaX + 3, cabecaY - 3, 2, 2, cores.pelagem);
    } else if (pose.olhos === OLHOS_NOTURNOS) {
      ferramentasPixel.ret(corpo, cabecaX - 4, cabecaY - 3, 2, 2, cores.pretoDaCartola);
      ferramentasPixel.px(corpo, cabecaX - 3, cabecaY - 3, cores.brancoDosOlhos);
      ferramentasPixel.ret(corpo, cabecaX + 3, cabecaY - 3, 2, 2, cores.pretoDaCartola);
      ferramentasPixel.px(corpo, cabecaX + 4, cabecaY - 3, cores.brancoDosOlhos);
    } else {
      ferramentasPixel.ret(corpo, cabecaX - 4, cabecaY - 3, 2, 2, cores.brancoDosOlhos);
      ferramentasPixel.px(corpo, cabecaX - 3, cabecaY - 2, cores.azulDosOlhos);
      ferramentasPixel.ret(corpo, cabecaX + 3, cabecaY - 3, 2, 2, cores.brancoDosOlhos);
      ferramentasPixel.px(corpo, cabecaX + 3, cabecaY - 2, cores.azulDosOlhos);
    }
    ferramentasPixel.ret(corpo, cabecaX - 4, cabecaY - 4, 2, 1, cores.pelagemEscura);                                                                         // sobrancelhas
    ferramentasPixel.ret(corpo, cabecaX + 3, cabecaY - 4, 2, 1, cores.pelagemEscura);

    // ---- frente: braço de perto com o MICROFONE
    const frente = camadas.frente;
    ferramentasPixel.elipse(frente, centroX + 6, ombrosY + 1, 3, 2.5, cores.pelagem);
    const bracoDePerto = cavernaSecreta.desenharMembro(frente, centroX + 6, ombrosY + 3, pose.bracoDePertoOmbro, pose.bracoDePertoCotovelo, {
      comprimentoSuperior: 7, comprimentoInferior: 7, grossuraSuperior: 4, grossuraInferior: 4, corSuperior: cores.pelagem, corInferior: cores.pelagem, corDoRealce: cores.pelagemClara,
    });
    ferramentasPixel.px(frente, bracoDePerto.articulacao[0], bracoDePerto.articulacao[1], cores.metalClaro);
    // MICROFONE preso no punho, atravessado em relação ao antebraço (como se segura um microfone) e com a cabeça para CIMA.
    // Direção do antebraço na convenção de desenharMembro: (seno, cosseno) do ângulo; o microfone usa a perpendicular que sobe.
    const [maoX, maoY] = bracoDePerto.extremidade, anguloDoAntebraco = cavernaSecreta.grausParaRadianos(bracoDePerto.anguloFinal);
    let microfoneParaX = Math.cos(anguloDoAntebraco), microfoneParaY = -Math.sin(anguloDoAntebraco);
    if (microfoneParaY > 0) { microfoneParaX = -microfoneParaX; microfoneParaY = -microfoneParaY; }
    const pontoDoMicrofone = distancia => [maoX + microfoneParaX * distancia, maoY + microfoneParaY * distancia];
    ferramentasPixel.linha(frente, ...pontoDoMicrofone(-2), ...pontoDoMicrofone(0), cores.pretoDaCartola, 1);                                                // ponta do cabo, abaixo do punho
    ferramentasPixel.ret(frente, maoX - 2, maoY - 1, 4, 3, cores.pelagem);                                                                                     // punho fechado no cabo
    ferramentasPixel.px(frente, maoX - 1, maoY + 1, cores.pelagemEscura);
    ferramentasPixel.px(frente, maoX + 1, maoY + 1, cores.pelagemEscura);
    ferramentasPixel.linha(frente, ...pontoDoMicrofone(1), ...pontoDoMicrofone(2.5), cores.metalEscuro, 1);                                                   // cabo acima do punho
    const [microfoneX, microfoneY] = pontoDoMicrofone(3.5);
    ferramentasPixel.elipse(frente, microfoneX, microfoneY, 1.6, 1.6, cores.metalClaro);                                                                     // cabeça (grade de metal)
    ferramentasPixel.px(frente, Math.round(microfoneX) + 1, Math.round(microfoneY) + 1, cores.metalEscuro);
    ferramentasPixel.px(frente, Math.round(microfoneX) - 1, Math.round(microfoneY) - 1, cores.dentes);                                                        // reflexo do holofote
    return { olhos: [cabecaX - 0.5 - origemX, cabecaY - 2 - origemY] };
  };

  cavernaSecreta.registrarPersonagem({
    boneco: true, id: 'freddy', direcao: -1,
    falas: { frases: ['Hora do show!', 'Vamos começar a festa!', 'Pizza para todos!', 'Har-har-har!', '...você ainda está aí?'], intervalo: [17, 29], primeira: [6, 14], ancora: [0, -52], gesto: 'cantar' },
    largura: 52, altura: 60, origem: [26, 57], sombra: 11, contorno: '#0b0603',
    pose: { respira: 0, inclina: 0, cabecaGiro: 0, cabecaInclina: 0, mandibula: 0, olhos: OLHOS_ABERTOS, bracoDePertoOmbro: 30, bracoDePertoCotovelo: -70, bracoDeLongeOmbro: -6, bracoDeLongeCotovelo: -4 },
    gestos: {
      // leva o microfone à boca e "canta" (mandíbula abre e fecha), em trancos de animatrônico
      cantar: [{ t: 0 }, cantarComAMandibula(0.35, 0), cantarComAMandibula(0.6, 2), cantarComAMandibula(0.85, 0), cantarComAMandibula(1.1, 2), cantarComAMandibula(1.35, 1), cantarComAMandibula(1.6, 2), cantarComAMandibula(1.85, 0), { t: 2.3 }],
      tranco: [{ t: 0 }, { t: 0.08, cabecaGiro: 1, cabecaInclina: 1 }, { t: 0.9, cabecaGiro: 1, cabecaInclina: 1 }, { t: 1.0, cabecaGiro: -1 }, { t: 1.8, cabecaGiro: -1 }, { t: 1.9 }],
      acenar: [{ t: 0 }, acenoComODobra(0.3, 15), acenoComODobra(0.55, 45), acenoComODobra(0.8, 15), acenoComODobra(1.05, 45), acenoComODobra(1.3, 15), { t: 1.7 }],
      noturno: [{ t: 0 }, { t: 0.1, olhos: OLHOS_NOTURNOS }, { t: 2.6, olhos: OLHOS_NOTURNOS, cabecaInclina: 1 }, { t: 2.7 }],
    },
    gestosAutomaticos: [{ gesto: 'cantar', intervalo: [8, 14], primeira: [2, 5] }, { gesto: 'tranco', intervalo: [6, 11] }, { gesto: 'acenar', intervalo: [13, 21] }, { gesto: 'noturno', intervalo: [18, 30], primeira: [9, 15] }],
    ociosos: [
      { nome: 'piscar', intervalo: [2.5, 6], duracao: [0.15, 0.25], aplicar: pose => { if (pose.olhos === OLHOS_ABERTOS) pose.olhos = OLHOS_PISCANDO; } },
      { nome: 'respirar', intervalo: [2.4, 3.4], duracao: 1.2, aplicar: (pose, fracao) => { if (fracao > 0.4 && fracao < 0.7) pose.respira += 1; } },
    ],
    sempre: pose => { pose.olhos = Math.round(pose.olhos); },   // a interpolação dos gestos gera valores quebrados: os olhos só têm três estados
    desenharPartes,
    // holofote do palco (falha às vezes; quase apaga nos olhos noturnos)
    luzes(luz, pose, tempo, ponto) {
      const falha = pose.olhos === OLHOS_NOTURNOS ? (Math.random() < 0.5 ? 0.15 : 0.45) : (Math.random() < 0.015 ? 0.4 : 1);
      const [holofoteX, holofoteY] = ponto(0, -78);
      luz.cone(holofoteX, holofoteY, 44, 80, '#ffc871', 0.5 * falha);
      const [chaoX, chaoY] = ponto(0, -2);
      luz.ponto(chaoX, chaoY, 26, '#ffb85a', 0.35 * falha, 0.35);
    },
    brilhos(contexto, pose, tempo, ponto, estado) {
      const locais = estado.locais || {};
      if (pose.olhos === OLHOS_NOTURNOS && locais.olhos) for (const deslocamentoDoOlho of [-2.5, 3.5]) {
        const [olhoX, olhoY] = ponto(locais.olhos[0] + deslocamentoDoOlho, locais.olhos[1] - 1);
        cavernaSecreta.desenharBrilho(contexto, olhoX, olhoY, 3, '#ffffff', 0.5);
        cavernaSecreta.acenderPixel(contexto, olhoX, olhoY, '#ffffff', 0.9);
      }
    },
  });
})();
