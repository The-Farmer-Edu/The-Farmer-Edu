// ====================================================================================================
// EDIÇÃO PESSOAL — CENA DO CELEIRO (Vingadores) · pixel.js
// Ferramentas de PIXEL ART desenhada em código: tudo em coordenadas inteiras, sem suavização, numa tela pequena (384×216) que é
// ampliada em escala inteira (nearest-neighbor). Carregado sob demanda por 30i-cena-do-celeiro.js na primeira entrada no celeiro.
//
// INTERFACE PÚBLICA (window.CenaDoCeleiro.pixel), usada também pela caverna secreta (easter-eggs/caverna/). Os nomes curtos dos
// métodos são a interface compartilhada e ficam como estão; o significado de cada um:
//   criarTela(largura, altura) → { canvas, ctx }      px(contexto, x, y, cor) → um pixel
//   ret(contexto, x, y, largura, altura, cor) → retângulo cheio                linha(contexto, x0, y0, x1, y1, cor, espessura)
//   elipse(contexto, centroX, centroY, raioX, raioY, cor)                       poligono(contexto, pontos, cor)
//   limiar(x, y) → limiar do pontilhado ordenado      pontilhar / pontilharCampo → pontilhado uniforme / com densidade variável
//   contornar(canvas, cor) → borda escura automática   espelhado(origem, destino) → espelho horizontal
//   aleatorio(semente) → sorteio repetível              texto(contexto, texto, x, y, cor) → fonte de 3×5 pixels
// ====================================================================================================
(() => {
  const cenaDoCeleiro = window.CenaDoCeleiro = window.CenaDoCeleiro || {};
  const ferramentasPixel = cenaDoCeleiro.pixel = {};
  const arredondar = Math.round;

  // Tela (canvas) offscreen, sem suavização. Devolve { canvas, ctx } (ctx = contexto 2D; nome da interface compartilhada).
  ferramentasPixel.criarTela = (largura, altura) => {
    const canvas = document.createElement('canvas'); canvas.width = largura; canvas.height = altura;
    const contexto = canvas.getContext('2d'); contexto.imageSmoothingEnabled = false;
    return { canvas, ctx: contexto };
  };
  ferramentasPixel.px = (contexto, x, y, cor) => { contexto.fillStyle = cor; contexto.fillRect(arredondar(x), arredondar(y), 1, 1); };
  ferramentasPixel.ret = (contexto, x, y, largura, altura, cor) => { contexto.fillStyle = cor; contexto.fillRect(arredondar(x), arredondar(y), arredondar(largura), arredondar(altura)); };

  // Linha de Bresenham com pincel quadrado (espessura em pixels).
  ferramentasPixel.linha = (contexto, inicioX, inicioY, fimX, fimY, cor, espessura = 1) => {
    inicioX = arredondar(inicioX); inicioY = arredondar(inicioY); fimX = arredondar(fimX); fimY = arredondar(fimY); contexto.fillStyle = cor;
    // proteção: coordenada inválida (NaN/infinito) ou absurda faria o laço nunca terminar
    if (![inicioX, inicioY, fimX, fimY].every(Number.isFinite) || Math.abs(fimX - inicioX) + Math.abs(fimY - inicioY) > 4000) return;
    const distanciaX = Math.abs(fimX - inicioX), distanciaY = -Math.abs(fimY - inicioY);
    const passoX = inicioX < fimX ? 1 : -1, passoY = inicioY < fimY ? 1 : -1, metadeDoPincel = Math.floor((espessura - 1) / 2);
    let erro = distanciaX + distanciaY;
    for (;;) {
      contexto.fillRect(inicioX - metadeDoPincel, inicioY - metadeDoPincel, espessura, espessura);
      if (inicioX === fimX && inicioY === fimY) break;
      const erroDobrado = 2 * erro;
      if (erroDobrado >= distanciaY) { erro += distanciaY; inicioX += passoX; }
      if (erroDobrado <= distanciaX) { erro += distanciaX; inicioY += passoY; }
    }
  };

  // Elipse cheia, linha a linha (bordas em degrau, como em pixel art feita à mão).
  ferramentasPixel.elipse = (contexto, centroX, centroY, raioX, raioY, cor) => {
    contexto.fillStyle = cor;
    for (let linhaY = -Math.ceil(raioY); linhaY <= Math.ceil(raioY); linhaY++) {
      const fracaoDaLargura = 1 - (linhaY * linhaY) / (raioY * raioY + 0.0001); if (fracaoDaLargura < 0) continue;
      const meiaLargura = Math.round(raioX * Math.sqrt(fracaoDaLargura));
      contexto.fillRect(arredondar(centroX) - meiaLargura, arredondar(centroY) + linhaY, meiaLargura * 2 + 1, 1);
    }
  };

  // Polígono cheio por varredura (pontos inteiros).
  ferramentasPixel.poligono = (contexto, pontos, cor) => {
    contexto.fillStyle = cor;
    const coordenadasY = pontos.map(ponto => ponto[1]), primeiraLinha = Math.floor(Math.min(...coordenadasY)), ultimaLinha = Math.ceil(Math.max(...coordenadasY));
    for (let linhaY = primeiraLinha; linhaY <= ultimaLinha; linhaY++) {
      const cruzamentos = [], meioDaLinha = linhaY + 0.5;
      for (let indice = 0; indice < pontos.length; indice++) {
        const [verticeAX, verticeAY] = pontos[indice], [verticeBX, verticeBY] = pontos[(indice + 1) % pontos.length];
        if ((verticeAY <= meioDaLinha && verticeBY > meioDaLinha) || (verticeBY <= meioDaLinha && verticeAY > meioDaLinha)) {
          cruzamentos.push(verticeAX + (meioDaLinha - verticeAY) / (verticeBY - verticeAY) * (verticeBX - verticeAX));
        }
      }
      cruzamentos.sort((primeiro, segundo) => primeiro - segundo);
      for (let indice = 0; indice + 1 < cruzamentos.length; indice += 2) {
        const entradaX = Math.round(cruzamentos[indice]), saidaX = Math.round(cruzamentos[indice + 1]);
        if (saidaX > entradaX) contexto.fillRect(entradaX, linhaY, saidaX - entradaX, 1);
      }
    }
  };

  // Pontilhado ordenado (matriz de Bayer 4×4): cobre uma fração "densidade" (0–1) do retângulo, sempre no mesmo padrão.
  const MATRIZ_DE_BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  ferramentasPixel.limiar = (x, y) => (MATRIZ_DE_BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
  ferramentasPixel.pontilhar = (contexto, x, y, largura, altura, cor, densidade) => {
    contexto.fillStyle = cor; x = arredondar(x); y = arredondar(y);
    for (let linha = 0; linha < altura; linha++) for (let coluna = 0; coluna < largura; coluna++) {
      if (ferramentasPixel.limiar(x + coluna, y + linha) < densidade) contexto.fillRect(x + coluna, y + linha, 1, 1);
    }
  };
  // Pontilhado com densidade variável (função de coluna, linha): luzes, poças de luz e degradês em degraus.
  ferramentasPixel.pontilharCampo = (contexto, x, y, largura, altura, cor, densidadeEm) => {
    contexto.fillStyle = cor; x = arredondar(x); y = arredondar(y);
    for (let linha = 0; linha < altura; linha++) for (let coluna = 0; coluna < largura; coluna++) {
      const densidade = densidadeEm(coluna, linha);
      if (densidade > 0 && ferramentasPixel.limiar(x + coluna, y + linha) < densidade) contexto.fillRect(x + coluna, y + linha, 1, 1);
    }
  };

  // Contorno automático: todo pixel transparente vizinho (4 direções) de um pixel opaco vira contorno. É a borda escura típica
  // dos sprites; aplicada por PARTE (braço, corpo...) para que as partes sobrepostas continuem legíveis.
  ferramentasPixel.contornar = (canvas, corDoContorno) => {
    const contexto = canvas.getContext('2d'), { width: largura, height: altura } = canvas;
    const pixels = contexto.getImageData(0, 0, largura, altura).data;
    const ehOpaco = (x, y) => x >= 0 && y >= 0 && x < largura && y < altura && pixels[(y * largura + x) * 4 + 3] > 0;
    const pontosDoContorno = [];
    for (let y = 0; y < altura; y++) for (let x = 0; x < largura; x++) {
      if (!ehOpaco(x, y) && (ehOpaco(x - 1, y) || ehOpaco(x + 1, y) || ehOpaco(x, y - 1) || ehOpaco(x, y + 1))) pontosDoContorno.push(x, y);
    }
    contexto.fillStyle = corDoContorno;
    for (let indice = 0; indice < pontosDoContorno.length; indice += 2) contexto.fillRect(pontosDoContorno[indice], pontosDoContorno[indice + 1], 1, 1);
    return canvas;
  };

  // Espelha um canvas na horizontal (personagens virando de lado).
  ferramentasPixel.espelhado = (origem, destino) => {
    const contexto = destino.getContext('2d'); contexto.clearRect(0, 0, destino.width, destino.height);
    contexto.save(); contexto.translate(destino.width, 0); contexto.scale(-1, 1); contexto.drawImage(origem, 0, 0); contexto.restore();
    return destino;
  };

  // Gerador pseudoaleatório com semente (o cenário sai sempre igual).
  ferramentasPixel.aleatorio = semente => () => { semente = (semente * 1664525 + 1013904223) >>> 0; return semente / 4294967296; };

  // ---- Fonte de 3×5 pixels para os monitores (só maiúsculas, números e sinais usados) ----
  // Cada glifo: 15 caracteres '0'/'1', linha a linha (3 colunas × 5 linhas).
  const GLIFOS = {
    A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100',
    G: '011100101101011', H: '101101111101101', I: '111010010010111', K: '101101110101101', L: '100100100100111', M: '101111111101101',
    N: '110101101101101', O: '010101101101010', P: '110101110100100', R: '110101110101101', S: '011100010001110', T: '111010010010010',
    U: '101101101101111', V: '101101101101010', Z: '111001010100111', Y: '101101010010010', 0: '111101101101111', 1: '010110010010111',
    2: '110001010100111', 3: '110001010001110', 4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010',
    8: '111101111101111', 9: '111101111001110', '%': '101001010100101', ':': '000010000010000', '.': '000000000000010', '-': '000000111000000',
    '>': '100010001010100', '/': '001001010100100', ' ': '000000000000000',
  };
  ferramentasPixel.texto = (contexto, texto, x, y, cor) => {
    contexto.fillStyle = cor; let cursorX = arredondar(x);
    for (const letra of String(texto).toUpperCase()) {
      const glifo = GLIFOS[letra] || GLIFOS[' '];
      for (let indice = 0; indice < 15; indice++) if (glifo[indice] === '1') contexto.fillRect(cursorX + (indice % 3), arredondar(y) + Math.floor(indice / 3), 1, 1);
      cursorX += 4;
    }
    return cursorX;
  };
})();
