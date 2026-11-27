// ====================================================================================================
// EDIÇÃO PESSOAL — CAVERNA SECRETA · personagens/slenderman.js
// Slenderman: boneco articulado desenhado em código (técnica do celeiro, ver boneco.js), DE FRENTE para quem olha a cena,
// isolado no recanto escuro. Altíssimo e estreito, cabeça lisa SEM rosto, pescoço fino, terno preto, camisa branca e gravata
// vermelho-escura no meio, braços compridos dos dois lados com dedos longos, pernas paralelas; TENTÁCULOS saindo dos dois
// ombros, cada um com o seu ritmo. Inclina a cabeça devagar demais, estende a mão para quem olha, a imagem falha.
// Como ele está de frente, os braços se chamam "direito" e "esquerdo" (lados da tela), não "de perto" e "de longe".
// ====================================================================================================
(() => {
  const cavernaSecreta = window.CavernaSecreta, ferramentasPixel = window.CenaDoCeleiro.pixel;
  const paletaCores = {
    pretoProfundo: '#040406',
    sombraDoTerno: '#0f0f15',
    terno: '#22222b',
    realceDoTerno: '#34343f',
    pele: '#e6e6e1',
    peleSombra: '#b4b4ae',
    camisaBranca: '#f3f3f3',
    gravataVermelha: '#8e171c',
    gravataSombra: '#5a0b0f',
  };
  const TENTACULOS = [[-1, 0.0, 1.3], [-1, 1.7, 0.9], [1, 3.1, 1.1], [1, 4.4, 0.8]];   // [lado (−1 esquerdo, 1 direito), fase, velocidade]

  // mão de dedos longos: três dedos em leque na direção do antebraço; `abertura` (0–1) estica os dedos
  const desenharMao = (contexto, braco, abertura) => {
    const [maoX, maoY] = braco.extremidade, anguloDoAntebraco = cavernaSecreta.grausParaRadianos(braco.anguloFinal), comprimentoDoDedo = 4 + abertura * 4;
    ferramentasPixel.ret(contexto, maoX - 1, maoY - 1, 2, 2, paletaCores.pele);
    for (let dedo = -1; dedo <= 1; dedo++) {
      const anguloDoDedo = anguloDoAntebraco + dedo * 0.22;
      ferramentasPixel.linha(contexto, maoX, maoY, maoX + Math.sin(anguloDoDedo) * comprimentoDoDedo, maoY + Math.cos(anguloDoDedo) * comprimentoDoDedo, paletaCores.pele, 1);
    }
  };

  const desenharPartes = (camadas, pose, tempo) => {
    const { origemX, origemY } = camadas, cores = paletaCores;
    const elevacaoDaRespiracao = -Math.round(pose.respira), centroX = origemX + Math.round(pose.inclina), ombrosY = origemY - 53 + elevacaoDaRespiracao;   // ombrosY: linha dos ombros
    // ---- trás: tentáculos dos dois ombros (cada segmento gira um pouco, no ritmo do próprio tentáculo)
    if (pose.tentaculos > 0.05) for (const [lado, fase, velocidade] of TENTACULOS) {
      let pontaX = centroX + lado * 3, pontaY = ombrosY + 2, angulo = lado * (0.9 + fase * 0.12);
      const quantidadeDeSegmentos = Math.round(4 + pose.tentaculos * 8);
      for (let segmento = 0; segmento < quantidadeDeSegmentos; segmento++) {
        angulo += Math.sin(tempo * velocidade + fase + segmento * 0.6) * 0.25 * lado;
        const proximoX = pontaX + Math.sin(angulo) * 3, proximoY = pontaY - Math.cos(angulo) * 3;
        ferramentasPixel.linha(camadas.tras, pontaX, pontaY, proximoX, proximoY, segmento < 3 ? cores.terno : cores.sombraDoTerno, segmento < 4 ? 2 : 1);
        pontaX = proximoX; pontaY = proximoY;
      }
    }
    // ---- corpo: pernas paralelas, terno, camisa, gravata, pescoço, cabeça lisa centralizada
    const corpo = camadas.corpo;
    for (const lado of [-1, 1]) {
      const perna = cavernaSecreta.desenharMembro(corpo, centroX + lado * 2, origemY - 36, lado, -lado, {
        comprimentoSuperior: 18, comprimentoInferior: 17, grossuraSuperior: 3, grossuraInferior: 3,
        corSuperior: lado < 0 ? cores.realceDoTerno : cores.terno, corInferior: lado < 0 ? cores.realceDoTerno : cores.terno,
      });
      ferramentasPixel.ret(corpo, perna.extremidade[0] - 2, perna.extremidade[1] - 1, 4, 2, cores.pretoProfundo);   // sapato
    }
    ferramentasPixel.poligono(corpo, [[centroX - 4, ombrosY - 1], [centroX + 4, ombrosY - 1], [centroX + 3, ombrosY + 17], [centroX - 3, ombrosY + 17]], cores.terno);
    ferramentasPixel.linha(corpo, centroX - 3, ombrosY, centroX - 2, ombrosY + 16, cores.realceDoTerno, 1);
    ferramentasPixel.poligono(corpo, [[centroX - 1, ombrosY], [centroX + 1, ombrosY], [centroX, ombrosY + 6]], cores.camisaBranca);   // camisa e gravata no meio
    ferramentasPixel.linha(corpo, centroX, ombrosY + 1, centroX, ombrosY + 9, cores.gravataVermelha, 1);
    ferramentasPixel.px(corpo, centroX, ombrosY + 10, cores.gravataSombra);
    const cabecaX = centroX + Math.round(pose.cabecaGiro), cabecaY = ombrosY - 7 + Math.round(pose.cabecaInclina), torcao = Math.round(pose.torcer);
    ferramentasPixel.linha(corpo, centroX, ombrosY - 1, cabecaX, cabecaY + 4, cores.peleSombra, 2);                                      // pescoço fino
    ferramentasPixel.elipse(corpo, cabecaX + torcao, cabecaY, 3, 5, cores.pele);                                                        // cabeça lisa (sem rosto)
    ferramentasPixel.ret(corpo, cabecaX - 2 + torcao, cabecaY - 2, 1, 5, cores.peleSombra);
    // ---- braços compridos dos dois lados (o da esquerda mais escuro), dedos longos
    const bracoEsquerdo = cavernaSecreta.desenharMembro(camadas.frente, centroX - 4, ombrosY + 2, -4 - pose.bracoEsquerdoOmbro, 2 + pose.bracoEsquerdoCotovelo, {
      comprimentoSuperior: 14, comprimentoInferior: 15, grossuraSuperior: 2, grossuraInferior: 2, corSuperior: cores.terno, corInferior: cores.terno, corDoRealce: cores.realceDoTerno,
    });
    desenharMao(camadas.frente, bracoEsquerdo, 0);
    const bracoDireito = cavernaSecreta.desenharMembro(camadas.frente, centroX + 4, ombrosY + 2, pose.bracoDireitoOmbro, pose.bracoDireitoCotovelo, {
      comprimentoSuperior: 14, comprimentoInferior: 15, grossuraSuperior: 2, grossuraInferior: 2, corSuperior: cores.terno, corInferior: cores.terno,
    });
    desenharMao(camadas.frente, bracoDireito, pose.dedos);
  };

  cavernaSecreta.registrarPersonagem({
    boneco: true, id: 'slenderman', direcao: 1, largura: 56, altura: 80, origem: [28, 77], sombra: 7, contorno: '#020203',
    falas: { frases: ['...'], intervalo: [20, 36], primeira: [9, 18], ancora: [0, -67] },
    pose: { respira: 0, inclina: 0, cabecaGiro: 0, cabecaInclina: 0, torcer: 0, bracoDireitoOmbro: 4, bracoDireitoCotovelo: -2, bracoEsquerdoOmbro: 0, bracoEsquerdoCotovelo: 0, dedos: 0, tentaculos: 0, falha: 0, some: 0 },
    gestos: {
      inclinar: [{ t: 0 }, { t: 2.4, cabecaGiro: 1, cabecaInclina: 1, torcer: 1 }, { t: 6.0, cabecaGiro: 1, cabecaInclina: 1, torcer: 1 }, { t: 7.5 }],   // devagar demais
      tentaculos: [{ t: 0 }, { t: 0.8, tentaculos: 0.5 }, { t: 1.6, tentaculos: 1 }, { t: 3.4, tentaculos: 1 }, { t: 4.4, tentaculos: 0 }],
      alcancar: [{ t: 0 }, { t: 1.6, bracoDireitoOmbro: 40, bracoDireitoCotovelo: -10, dedos: 1 }, { t: 3.4, bracoDireitoOmbro: 44, bracoDireitoCotovelo: -12, dedos: 1 }, { t: 5.0 }],
      sumir: [{ t: 0 }, { t: 0.5, some: 0.8 }, { t: 1.5, some: 0.8 }, { t: 2.0 }],
    },
    gestosAutomaticos: [{ gesto: 'inclinar', intervalo: [10, 16], primeira: [2, 5] }, { gesto: 'tentaculos', intervalo: [12, 22], primeira: [6, 10] }, { gesto: 'alcancar', intervalo: [16, 26] }, { gesto: 'sumir', intervalo: [22, 34] }],
    ociosos: [
      { nome: 'falha', intervalo: [7, 15], duracao: [0.2, 0.45], aplicar: (pose, fracao, variante) => { pose.falha = 1 + variante; } },
      { nome: 'dedos', intervalo: [9, 17], duracao: [0.8, 1.4], semGesto: true, aplicar: pose => { pose.dedos = 1; } },
    ],
    // a cada quadro: transparência do "sumir" e, na falha de imagem, faixas horizontais deslocadas (estado.fatias)
    sempre: (pose, tempo, estado) => {
      estado.alfa = 1 - pose.some;
      if (pose.falha > 0.5) {
        const intensidadeDaFalha = pose.falha - 1, alturaDaFalha = Math.floor(intensidadeDaFalha * 30) + 20;
        estado.fatias = [
          [alturaDaFalha, alturaDaFalha + 3, intensidadeDaFalha < 0.5 ? 2 : -2],
          [alturaDaFalha + 9, alturaDaFalha + 11, intensidadeDaFalha < 0.5 ? -1 : 1],
          [alturaDaFalha + 20, alturaDaFalha + 26, intensidadeDaFalha < 0.3 ? 1 : 0],
        ];
        estado.extra.estatica = 1;
      }
      if (pose.tentaculos > 0.2) estado.extra.estatica = 0.5;
    },
    desenharPartes,
    // estática: pontos claros e escuros aleatórios em volta dele enquanto a imagem falha
    brilhos(contexto, pose, tempo, ponto, estado) {
      if (!estado.extra.estatica) return;
      for (let pontoDeEstatica = 0; pontoDeEstatica < 10; pontoDeEstatica++) {
        const [x, y] = ponto(Math.round(Math.random() * 30) - 15, -Math.round(Math.random() * 70));
        contexto.fillStyle = Math.random() < 0.5 ? 'rgba(220,220,220,0.5)' : 'rgba(0,0,0,0.7)';
        contexto.fillRect(x, y, 1 + (Math.random() < 0.3), 1);
      }
    },
  });
})();
