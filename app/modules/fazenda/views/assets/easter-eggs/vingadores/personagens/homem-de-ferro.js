// ====================================================================================================
// EDIÇÃO PESSOAL — CENA DO CELEIRO · personagens/homem-de-ferro.js
// Tony Stark de armadura: pixel art original desenhada em código, parte por parte (43 px de altura, escala Floor796).
// Armadura vermelha e dourada, capacete com placa facial dourada e olhos brilhantes, reator Arc pulsante no peito (com halo e luz
// no entorno), ombreiras, joelheiras e manoplas com repulsores na palma quando a mão abre.
// Poses base: "trabalhando" (de frente para a bancada, à esquerda) e "conversando" (de frente para o Fury, à direita).
// Nomes de coordenada: origemX/origemY = pés; centroX = meio do corpo; ombrosY = linha dos ombros.
// ====================================================================================================
(() => {
  const cenaDoCeleiro = window.CenaDoCeleiro, ferramentasPixel = cenaDoCeleiro.pixel;
  const CORES_DO_HOMEM_DE_FERRO = {
    vermelho: '#b3202a', vermelhoClaro: '#e0484a', vermelhoEscuro: '#7d141b', vermelhoProfundo: '#5a0d13',
    dourado: '#d6a334', douradoClaro: '#f6d978', douradoEscuro: '#95691e', aco: '#3e4350', acoClaro: '#646b7a',
    olho: '#f2fdff', olhoFraco: '#bfeaf5', anelDoReator: '#8feaff', nucleoDoReator: '#f8ffff', contorno: '#170709',
    // luzes aditivas (halo do reator, reflexo no chão, repulsor)
    haloExterno: '#4fd2f0', haloMedio: '#6fe0ff', haloInterno: '#bff6ff', reflexoNoChao: '#3fb8d8', brilhoDoRepulsor: '#e8fdff', brancoDoPulso: '#ffffff',
  };
  const cores = CORES_DO_HOMEM_DE_FERRO;

  // ---------------------------------------------------------------- partes (personagem olhando para a DIREITA)
  // perna com joelheira dourada e bota; ehDeTras = perna de trás (tons escuros)
  const desenharPerna = (contexto, origemX, origemY, quadrilX, peX, ehDeTras, elevacaoDoPe, agachamento) => {
    const corDaArmadura = ehDeTras ? cores.vermelhoEscuro : cores.vermelho, corDaJoelheira = ehDeTras ? cores.douradoEscuro : cores.dourado;
    const joelhoX = origemX + (quadrilX + peX) / 2 + 1, joelhoY = origemY - 10 + agachamento;
    ferramentasPixel.linha(contexto, origemX + quadrilX, origemY - 18 + agachamento, joelhoX, joelhoY, corDaArmadura, 4);
    ferramentasPixel.linha(contexto, joelhoX, joelhoY, origemX + peX, origemY - 3 - elevacaoDoPe, corDaArmadura, 4);
    if (!ehDeTras) ferramentasPixel.linha(contexto, origemX + quadrilX - 1, origemY - 18 + agachamento, joelhoX - 2, joelhoY, cores.vermelhoClaro, 1);
    ferramentasPixel.ret(contexto, joelhoX - 1, joelhoY - 1, 3, 2, corDaJoelheira); if (!ehDeTras) ferramentasPixel.px(contexto, joelhoX - 1, joelhoY - 1, cores.douradoClaro);
    // bota
    ferramentasPixel.ret(contexto, origemX + peX - 2, origemY - 4 - elevacaoDoPe, 6, 3, corDaArmadura);
    ferramentasPixel.ret(contexto, origemX + peX - 2, origemY - 1 - elevacaoDoPe, 7, 1, ehDeTras ? cores.vermelhoProfundo : cores.vermelhoEscuro);
    if (!ehDeTras) ferramentasPixel.ret(contexto, origemX + peX - 1, origemY - 4 - elevacaoDoPe, 2, 1, cores.vermelhoClaro);
  };

  // capacete: giro = +1 (3/4 para a frente), 0 (de frente), −1 (3/4 olhando para trás)
  const desenharCapacete = (contexto, centroX, centroY, giro, brilhoDosOlhos, inclinacao) => {
    centroY += inclinacao;
    ferramentasPixel.elipse(contexto, centroX, centroY, 4, 5, cores.vermelho);
    ferramentasPixel.px(contexto, centroX - 2, centroY - 4, cores.vermelhoClaro); ferramentasPixel.px(contexto, centroX - 3, centroY - 3, cores.vermelhoClaro); ferramentasPixel.px(contexto, centroX - 1, centroY - 5, cores.vermelhoClaro);
    const corDosOlhos = brilhoDosOlhos > 0.5 ? cores.olho : cores.olhoFraco;
    if (giro === 0) {
      ferramentasPixel.poligono(contexto, [[centroX - 3, centroY - 4], [centroX + 4, centroY - 4], [centroX + 4, centroY + 1], [centroX + 3, centroY + 4], [centroX - 2, centroY + 4], [centroX - 3, centroY + 1]], cores.dourado);   // placa facial
      ferramentasPixel.ret(contexto, centroX - 2, centroY - 4, 1, 3, cores.douradoClaro);
      ferramentasPixel.ret(contexto, centroX - 2, centroY - 1, 2, 1, corDosOlhos); ferramentasPixel.ret(contexto, centroX + 1, centroY - 1, 2, 1, corDosOlhos);
      ferramentasPixel.ret(contexto, centroX - 1, centroY + 2, 3, 1, cores.douradoEscuro);
      ferramentasPixel.px(contexto, centroX - 4, centroY, cores.vermelhoEscuro); ferramentasPixel.px(contexto, centroX + 4, centroY, cores.vermelhoEscuro);
    } else {
      const colunaNoCapacete = deslocamento => centroX + deslocamento * giro;
      const placaFacial = giro > 0
        ? [[colunaNoCapacete(-0.5), centroY - 4], [colunaNoCapacete(4.5), centroY - 4], [colunaNoCapacete(5), centroY + 1], [colunaNoCapacete(4), centroY + 4], [colunaNoCapacete(0), centroY + 4], [colunaNoCapacete(-0.5), centroY + 1]]
        : [[colunaNoCapacete(4.5), centroY - 4], [colunaNoCapacete(-0.5), centroY - 4], [colunaNoCapacete(-0.5), centroY + 1], [colunaNoCapacete(0), centroY + 4], [colunaNoCapacete(4), centroY + 4], [colunaNoCapacete(5), centroY + 1]];
      ferramentasPixel.poligono(contexto, placaFacial, cores.dourado);
      ferramentasPixel.ret(contexto, colunaNoCapacete(0.5), centroY - 4, 1, 3, cores.douradoClaro);
      ferramentasPixel.ret(contexto, giro > 0 ? colunaNoCapacete(1) : colunaNoCapacete(2), centroY - 1, 2, 1, corDosOlhos); ferramentasPixel.px(contexto, colunaNoCapacete(4), centroY - 1, corDosOlhos);
      ferramentasPixel.ret(contexto, giro > 0 ? colunaNoCapacete(1) : colunaNoCapacete(3), centroY + 2, 3, 1, cores.douradoEscuro);
      ferramentasPixel.elipse(contexto, colunaNoCapacete(-2.5), centroY, 1, 1, cores.vermelhoEscuro); ferramentasPixel.px(contexto, colunaNoCapacete(-2.5), centroY, cores.acoClaro);   // disco lateral do capacete
    }
  };

  // tronco com o reator Arc, abdômen dourado em placas, cinto e pescoço
  const desenharTronco = (contexto, centroX, ombrosY, vista) => {
    ferramentasPixel.poligono(contexto, [[centroX - 7, ombrosY - 1], [centroX + 8, ombrosY - 1], [centroX + 6, ombrosY + 8], [centroX - 5, ombrosY + 8]], cores.vermelho);
    ferramentasPixel.ret(contexto, centroX - 6, ombrosY, 4, 1, cores.vermelhoClaro); ferramentasPixel.ret(contexto, centroX - 6, ombrosY + 1, 2, 2, cores.vermelhoClaro);
    const reatorX = vista === 'frente' ? centroX : centroX + 1;
    ferramentasPixel.ret(contexto, reatorX - 4, ombrosY + 5, 3, 1, cores.vermelhoEscuro); ferramentasPixel.ret(contexto, reatorX + 2, ombrosY + 5, 3, 1, cores.vermelhoEscuro);   // linhas do peitoral
    ferramentasPixel.elipse(contexto, reatorX, ombrosY + 3, 2, 2, cores.aco); ferramentasPixel.elipse(contexto, reatorX, ombrosY + 3, 1.5, 1.5, cores.anelDoReator); ferramentasPixel.px(contexto, reatorX, ombrosY + 3, cores.nucleoDoReator);
    // abdômen dourado em placas
    ferramentasPixel.poligono(contexto, [[centroX - 4, ombrosY + 8], [centroX + 5, ombrosY + 8], [centroX + 4, ombrosY + 13], [centroX - 3, ombrosY + 13]], cores.dourado);
    ferramentasPixel.ret(contexto, centroX - 3, ombrosY + 10, 7, 1, cores.douradoEscuro); ferramentasPixel.ret(contexto, centroX - 3, ombrosY + 8, 2, 2, cores.douradoClaro);
    ferramentasPixel.ret(contexto, centroX - 5, ombrosY + 8, 1, 5, cores.vermelhoEscuro); ferramentasPixel.ret(contexto, centroX + 5, ombrosY + 8, 1, 5, cores.vermelhoEscuro);
    // cinto e quadril
    ferramentasPixel.ret(contexto, centroX - 5, ombrosY + 13, 11, 3, cores.dourado); ferramentasPixel.ret(contexto, centroX - 5, ombrosY + 15, 11, 1, cores.douradoEscuro); ferramentasPixel.ret(contexto, centroX - 1, ombrosY + 13, 3, 3, cores.vermelho);
    // pescoço
    ferramentasPixel.ret(contexto, centroX - 1, ombrosY - 3, 3, 2, cores.aco);
  };

  const desenharOmbreira = (contexto, x, y, ehDeTras) => {
    ferramentasPixel.elipse(contexto, x, y, 3, 2.5, ehDeTras ? cores.vermelhoEscuro : cores.vermelho);
    if (!ehDeTras) { ferramentasPixel.px(contexto, x - 1, y - 2, cores.vermelhoClaro); ferramentasPixel.px(contexto, x - 2, y - 1, cores.vermelhoClaro); }
    ferramentasPixel.ret(contexto, x - 2, y + 2, 5, 1, ehDeTras ? cores.vermelhoProfundo : cores.vermelhoEscuro);
  };

  // braço com cotovelo dourado, punho da manopla e mão; com a mão aberta (braço da frente) acende o repulsor na palma
  const desenharBracoArticulado = (contexto, ombroX, ombroY, anguloDoOmbro, anguloDoCotovelo, ehDeTras, maoAberta) => {
    const braco = cenaDoCeleiro.desenharBraco(contexto, ombroX, ombroY, anguloDoOmbro, anguloDoCotovelo, {
      comprimentoDoBraco: 6, comprimentoDoAntebraco: 6, grossuraDoBraco: 3, grossuraDoAntebraco: 3,
      corDoBraco: ehDeTras ? cores.vermelhoEscuro : cores.vermelho, corDoAntebraco: ehDeTras ? cores.vermelhoEscuro : cores.vermelho, corDaLuz: ehDeTras ? null : cores.vermelhoClaro,
    });
    const [maoX, maoY] = braco.mao, [cotoveloX, cotoveloY] = braco.cotovelo;
    ferramentasPixel.elipse(contexto, cotoveloX, cotoveloY, 1.5, 1.5, ehDeTras ? cores.douradoEscuro : cores.dourado);                 // cotovelo dourado
    const pulsoX = cotoveloX + (maoX - cotoveloX) * 0.75, pulsoY = cotoveloY + (maoY - cotoveloY) * 0.75;
    ferramentasPixel.ret(contexto, pulsoX - 1, pulsoY - 1, 3, 2, ehDeTras ? cores.douradoEscuro : cores.dourado);                      // punho dourado da manopla
    ferramentasPixel.ret(contexto, maoX - 1, maoY - 1, 3, 3, ehDeTras ? cores.vermelhoProfundo : cores.vermelhoEscuro);                // mão
    if (maoAberta && !ehDeTras) { ferramentasPixel.px(contexto, maoX, maoY, cores.anelDoReator); braco.repulsor = true; }
    return braco;
  };

  // posições guardadas no último desenho, usadas pelas luzes (coordenadas LOCAIS a partir dos pés; mão na tela da figura)
  const estadoDasLuzes = { reator: [1, -29], bracoDaFrente: null, origem: [0, 0] };

  const desenharPartes = (camadas, pose, tempo) => {
    const { origemX, origemY } = camadas;
    estadoDasLuzes.origem = [origemX, origemY];
    if (pose.vista === 'frente') return desenharDeFrente(camadas, pose, tempo);
    const elevacaoDaRespiracao = -Math.round(pose.respira), inclinacao = Math.round(pose.inclina), deslocamentoDoQuadril = Math.round(pose.quadril), agachamento = Math.round(pose.agacha);
    const ombrosY = origemY - 32 + elevacaoDaRespiracao + agachamento, centroX = origemX + inclinacao + deslocamentoDoQuadril;
    // camada de trás: perna e braço de trás (mais escuros)
    desenharPerna(camadas.tras, origemX + deslocamentoDoQuadril, origemY, -2, -3, true, 0, agachamento);
    desenharOmbreira(camadas.tras, centroX - 6, ombrosY, true);
    desenharBracoArticulado(camadas.tras, centroX - 5, ombrosY + 1, pose.bracoDeTrasOmbro, pose.bracoDeTrasCotovelo, true, false);
    // corpo
    desenharPerna(camadas.corpo, origemX + deslocamentoDoQuadril, origemY, 2, 3, false, Math.round(pose.elevacaoDoPe), agachamento);
    desenharTronco(camadas.corpo, centroX, ombrosY, 'lado');
    const brilhoDosOlhos = pose.falando ? (Math.sin(tempo * 22) > -0.3 ? 1 : 0.4) : 1;   // falando, os olhos oscilam
    desenharCapacete(camadas.corpo, centroX + 1, ombrosY - 8 + Math.round(pose.cabecaInclina) + (pose.olhandoParaBaixo ? 1 : 0), pose.giroDaCabeca, brilhoDosOlhos, 0);
    // frente: ombreira e braço da frente
    desenharOmbreira(camadas.frente, centroX + 7, ombrosY, false);
    estadoDasLuzes.bracoDaFrente = desenharBracoArticulado(camadas.frente, centroX + 6, ombrosY + 1, pose.bracoDaFrenteOmbro, pose.bracoDaFrenteCotovelo, false, pose.maoAberta);
    estadoDasLuzes.reator = [centroX + 1 - origemX, ombrosY + 3 - origemY];
  };
  // de frente (no meio de uma virada): pose fixa, simétrica
  const desenharDeFrente = (camadas, pose) => {
    const { origemX, origemY } = camadas, ombrosY = origemY - 32 - Math.round(pose.respira), centroX = origemX;
    desenharPerna(camadas.tras, origemX, origemY, -2, -3, true, 0, 0);
    desenharBracoArticulado(camadas.tras, centroX - 7, ombrosY + 1, 4, 6, true, false);
    desenharPerna(camadas.corpo, origemX, origemY, 2, 3, false, 0, 0);
    desenharTronco(camadas.corpo, centroX, ombrosY, 'frente');
    desenharCapacete(camadas.corpo, centroX + 0.5, ombrosY - 8, 0, 1, 0);
    desenharOmbreira(camadas.frente, centroX + 8, ombrosY, false); desenharOmbreira(camadas.frente, centroX - 7, ombrosY, false);
    estadoDasLuzes.bracoDaFrente = desenharBracoArticulado(camadas.frente, centroX + 8, ombrosY + 1, -4, -6, false, false);
    estadoDasLuzes.reator = [centroX - origemX, ombrosY + 3 - origemY];
  };

  // luzes por cima: halo pulsante do reator Arc (com luz no entorno), brilho dos olhos e repulsor
  const desenharLuzes = (contexto, pose, tempo, paraTela) => {
    const pulso = 0.65 + 0.35 * Math.sin(tempo * 2.4) + 0.08 * Math.sin(tempo * 13.7);
    const [reatorX, reatorY] = paraTela(estadoDasLuzes.reator[0], estadoDasLuzes.reator[1]);
    // halo em anéis CHAPADOS translúcidos (pixel art: sem ruído de pontilhado); a intensidade pulsa
    contexto.save(); contexto.globalCompositeOperation = 'lighter';
    contexto.globalAlpha = 0.10 * pulso; ferramentasPixel.elipse(contexto, reatorX, reatorY, 7, 6, cores.haloExterno);
    contexto.globalAlpha = 0.16 * pulso; ferramentasPixel.elipse(contexto, reatorX, reatorY, 4, 4, cores.haloMedio);
    contexto.globalAlpha = 0.30 * pulso; ferramentasPixel.elipse(contexto, reatorX, reatorY, 2, 2, cores.haloInterno);
    contexto.globalAlpha = 0.10 * pulso; ferramentasPixel.elipse(contexto, reatorX + 1, reatorY + 27, 11, 2, cores.reflexoNoChao);    // reflexo ciano no chão
    const bracoDaFrente = estadoDasLuzes.bracoDaFrente;
    if (bracoDaFrente && bracoDaFrente.repulsor) {
      const [maoX, maoY] = bracoDaFrente.mao, [repulsorX, repulsorY] = paraTela(maoX - estadoDasLuzes.origem[0], maoY - estadoDasLuzes.origem[1]);
      contexto.globalAlpha = 0.22; ferramentasPixel.elipse(contexto, repulsorX, repulsorY, 3, 3, cores.haloMedio);
      contexto.globalAlpha = 0.4; ferramentasPixel.px(contexto, repulsorX, repulsorY, cores.brilhoDoRepulsor);
    }
    contexto.restore();
    ferramentasPixel.px(contexto, reatorX, reatorY, pulso > 0.9 ? cores.brancoDoPulso : cores.nucleoDoReator);
  };

  // ---------------------------------------------------------------- poses base
  const poses = {
    trabalhando: { direcao: -1, vista: 'lado', giroDaCabeca: 1, olhandoParaBaixo: true, bracoDaFrenteOmbro: 55, bracoDaFrenteCotovelo: 35, bracoDeTrasOmbro: 45, bracoDeTrasCotovelo: 40, inclina: 1, quadril: 0, maoAberta: false },
    conversando: { direcao: 1, vista: 'lado', giroDaCabeca: 1, olhandoParaBaixo: false, bracoDaFrenteOmbro: 8, bracoDaFrenteCotovelo: 10, bracoDeTrasOmbro: -6, bracoDeTrasCotovelo: 12, inclina: 0, quadril: 0, maoAberta: false },
    // braço de trás apoiado na cintura: confiança
    confiante: { direcao: 1, vista: 'lado', giroDaCabeca: 1, olhandoParaBaixo: false, bracoDaFrenteOmbro: 10, bracoDaFrenteCotovelo: 15, bracoDeTrasOmbro: -40, bracoDeTrasCotovelo: 100, inclina: 0, quadril: -1, maoAberta: false },
  };
  // ---------------------------------------------------------------- gestos (quadros-chave)
  const gestos = {
    // levanta a mão aberta e explica, "desenhando" no ar
    explicar: [{ t: 0 }, { t: 0.35, bracoDaFrenteOmbro: 70, bracoDaFrenteCotovelo: 55, maoAberta: true }, { t: 0.9, bracoDaFrenteOmbro: 80, bracoDaFrenteCotovelo: 35, maoAberta: true }, { t: 1.4, bracoDaFrenteOmbro: 65, bracoDaFrenteCotovelo: 60, maoAberta: true }, { t: 1.9, bracoDaFrenteOmbro: 78, bracoDaFrenteCotovelo: 40, maoAberta: true }, { t: 2.4 }],
    // aponta para o Fury
    apontar: [{ t: 0 }, { t: 0.3, bracoDaFrenteOmbro: 85, bracoDaFrenteCotovelo: 5 }, { t: 1.3, bracoDaFrenteOmbro: 88, bracoDaFrenteCotovelo: 2 }, { t: 1.7 }],
    // dá de ombros, com as duas mãos para cima (ironia)
    darDeOmbros: [{ t: 0 }, { t: 0.3, bracoDaFrenteOmbro: 35, bracoDaFrenteCotovelo: 105, bracoDeTrasOmbro: 25, bracoDeTrasCotovelo: 100, respira: 1, cabecaInclina: 1, maoAberta: true }, { t: 1.0, bracoDaFrenteOmbro: 35, bracoDaFrenteCotovelo: 105, bracoDeTrasOmbro: 25, bracoDeTrasCotovelo: 100, respira: 1, cabecaInclina: 1, maoAberta: true }, { t: 1.4 }],
    // "tchauzinho" irônico com a mão
    acenar: [{ t: 0 }, { t: 0.25, bracoDaFrenteOmbro: 150, bracoDaFrenteCotovelo: 20, maoAberta: true }, { t: 0.45, bracoDaFrenteOmbro: 150, bracoDaFrenteCotovelo: 40, maoAberta: true }, { t: 0.65, bracoDaFrenteOmbro: 150, bracoDaFrenteCotovelo: 10, maoAberta: true }, { t: 0.85, bracoDaFrenteOmbro: 150, bracoDaFrenteCotovelo: 40, maoAberta: true }, { t: 1.2 }],
    // impaciência: bate o pé e inclina a cabeça
    impaciente: [{ t: 0 }, { t: 0.15, elevacaoDoPe: 1 }, { t: 0.3, elevacaoDoPe: 0 }, { t: 0.45, elevacaoDoPe: 1 }, { t: 0.6, elevacaoDoPe: 0, cabecaInclina: 1 }, { t: 0.75, elevacaoDoPe: 1 }, { t: 0.9, elevacaoDoPe: 0 }, { t: 1.2, cabecaInclina: 0 }],
    // reação: recua um pouco (surpresa / "como é?")
    recuar: [{ t: 0 }, { t: 0.2, inclina: -1, cabecaInclina: -1, bracoDaFrenteOmbro: 30, bracoDaFrenteCotovelo: 60, maoAberta: true }, { t: 0.9, inclina: -1, cabecaInclina: -1, bracoDaFrenteOmbro: 30, bracoDaFrenteCotovelo: 60, maoAberta: true }, { t: 1.2 }],
    // aponta o polegar por cima do ombro, para a bancada/armadura
    mostrarAtras: [{ t: 0 }, { t: 0.3, bracoDeTrasOmbro: -60, bracoDeTrasCotovelo: -50, giroDaCabeca: -1 }, { t: 1.2, bracoDeTrasOmbro: -62, bracoDeTrasCotovelo: -55, giroDaCabeca: -1 }, { t: 1.5 }],
    // olha para a armadura/monitores atrás dele
    olharEquipamento: [{ t: 0 }, { t: 0.3, giroDaCabeca: -1 }, { t: 1.6, giroDaCabeca: -1, cabecaInclina: -1 }, { t: 1.9 }],
    // concorda com a cabeça (ouvindo)
    assentir: [{ t: 0 }, { t: 0.15, cabecaInclina: 1 }, { t: 0.3, cabecaInclina: 0 }, { t: 0.45, cabecaInclina: 1 }, { t: 0.6, cabecaInclina: 0 }],
    // ajusta a manopla (mexe nos dedos)
    ajustarManopla: [{ t: 0 }, { t: 0.3, bracoDaFrenteOmbro: 50, bracoDaFrenteCotovelo: 70, bracoDeTrasOmbro: 40, bracoDeTrasCotovelo: 75 }, { t: 0.5, bracoDaFrenteOmbro: 52, bracoDaFrenteCotovelo: 74, bracoDeTrasOmbro: 42, bracoDeTrasCotovelo: 70 }, { t: 0.7, bracoDaFrenteOmbro: 50, bracoDaFrenteCotovelo: 70, bracoDeTrasOmbro: 40, bracoDeTrasCotovelo: 76 }, { t: 0.9, bracoDaFrenteOmbro: 52, bracoDaFrenteCotovelo: 72, bracoDeTrasOmbro: 42, bracoDeTrasCotovelo: 72 }, { t: 1.3 }],
  };
  // ---------------------------------------------------------------- comportamentos ociosos (ritmos próprios)
  // aplicar(pose, fracao do comportamento 0–1, variante sorteada, tempo)
  const ociosos = [
    { nome: 'respirar', intervalo: [0.6, 1.2], duracao: 1.6, aplicar: (pose, fracao) => { pose.respira += fracao > 0.25 && fracao < 0.75 ? 1 : 0; } },
    { nome: 'trabalharComAsMaos', intervalo: [0, 0.1], duracao: 1.1, somenteSe: ator => ator.poseBase === 'trabalhando', semGesto: true,
      aplicar: (pose, fracao, variante) => { const passo = Math.floor(fracao * 6) % 2; pose.bracoDaFrenteCotovelo += passo ? 12 : -4; pose.bracoDeTrasCotovelo += passo ? -6 : 10; if (variante > 0.7) pose.cabecaInclina += fracao > 0.5 ? 0 : 1; } },
    { nome: 'trocarOPeso', intervalo: [3, 7], duracao: 2.5, somenteSe: ator => ator.poseBase !== 'trabalhando', aplicar: (pose, fracao) => { pose.quadril += fracao > 0.1 && fracao < 0.9 ? 1 : 0; } },
    { nome: 'olharEmVolta', intervalo: [5, 11], duracao: 1.6, semGesto: true, somenteSe: ator => !ator.falando,
      aplicar: (pose, fracao, variante) => { if (fracao > 0.15 && fracao < 0.85) { if (variante < 0.5) pose.giroDaCabeca = pose.vista === 'frente' ? 0 : -1; else pose.cabecaInclina += -1; } } },
    { nome: 'olhosOscilam', intervalo: [2, 5], duracao: 0.25, aplicar: (pose, fracao) => { pose.falando = pose.falando || fracao < 0.5; } },
  ];
  // falando, ele marca o ritmo com a cabeça (um em cada três passos)
  const sempre = (pose, tempo, ator) => { if (ator.falando) { const passoDoRitmo = Math.floor(tempo * 4) % 3; pose.cabecaInclina += passoDoRitmo === 1 ? 1 : 0; } };

  cenaDoCeleiro.criarHomemDeFerro = (x, y) => cenaDoCeleiro.criarAtor({ nome: 'Tony', x, y, altura: 46, poses, poseInicial: 'trabalhando', gestos, ociosos, sempre, desenharPartes, desenharLuzes, contorno: CORES_DO_HOMEM_DE_FERRO.contorno });
})();
