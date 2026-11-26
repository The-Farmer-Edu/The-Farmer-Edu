// ====================================================================================================
// EDIÇÃO PESSOAL — CAVERNA SECRETA · efeitos.js
// Iluminação e partículas em estética de pixel art:
//  • LUZ: um "mapa de luz" do tamanho da cena começa com a cor ambiente (escuro azulado da caverna); cada fonte soma um
//    sprite de luz em FAIXAS (sem degradê liso); o mapa é MULTIPLICADO sobre a cena. Assim cada canto tem a sua temperatura
//    de cor (vermelho do Ultron, verde do Destino, âmbar do Freddy, azul frio do Batman...).
//  • BRILHO: halos aditivos pequenos (olhos, telas, fogo) desenhados DEPOIS do mapa, para o que emite luz não escurecer.
//  • PARTÍCULAS: poeira nos fachos, brasas, faíscas, vapor, cada sistema com o seu ritmo.
// Os sprites de luz são calculados uma vez (cache por raio/cor) e reaproveitados em todos os quadros.
// Funções publicadas em window.CavernaSecreta: novaTela, limiarPontilhado, sortearEntre, luz, desenharBrilho, acenderPixel,
// criarParticulas.
// ====================================================================================================
(() => {
  const cavernaSecreta = window.CavernaSecreta = window.CavernaSecreta || {};

  // Matriz de Bayer 4×4: o limiar de cada pixel decide o pontilhado ordenado (pixel aceso se o valor passar do limiar)
  const MATRIZ_DE_BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const limiarPontilhado = (x, y) => (MATRIZ_DE_BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
  const corHexParaRgb = corHex => [parseInt(corHex.slice(1, 3), 16), parseInt(corHex.slice(3, 5), 16), parseInt(corHex.slice(5, 7), 16)];
  // tela auxiliar (canvas fora da página) já sem suavização: devolve { tela, contexto }
  const novaTela = (largura, altura) => {
    const tela = document.createElement('canvas');
    tela.width = largura;
    tela.height = altura;
    const contexto = tela.getContext('2d');
    contexto.imageSmoothingEnabled = false;
    return { tela, contexto };
  };
  cavernaSecreta.novaTela = novaTela;
  cavernaSecreta.limiarPontilhado = limiarPontilhado;

  // ---- sprite de luz: disco com queda (1 − distância)^expoente, quantizado em `faixas` níveis (anéis em degraus) ----
  const cacheDeLuz = new Map();
  const spriteDeLuz = (raio, cor, faixas = 5, expoente = 1.6, achatamento = 1) => {
    const chave = raio + '|' + cor + '|' + faixas + '|' + expoente + '|' + achatamento;
    if (cacheDeLuz.has(chave)) return cacheDeLuz.get(chave);
    const largura = raio * 2 + 1, altura = Math.max(3, Math.round(raio * 2 * achatamento) + 1), { tela, contexto } = novaTela(largura, altura);
    const imagem = contexto.createImageData(largura, altura), [vermelho, verde, azul] = corHexParaRgb(cor);
    for (let y = 0; y < altura; y++) for (let x = 0; x < largura; x++) {
      const distanciaX = (x - raio) / raio, distanciaY = (y - (altura - 1) / 2) / (raio * achatamento);
      const distancia = Math.sqrt(distanciaX * distanciaX + distanciaY * distanciaY);
      if (distancia >= 1) continue;
      const intensidade = Math.pow(1 - distancia, expoente);
      const nivel = Math.max(0, Math.min(faixas, Math.ceil(intensidade * faixas))) / faixas;
      const indice = (y * largura + x) * 4;
      imagem.data[indice] = vermelho * nivel;
      imagem.data[indice + 1] = verde * nivel;
      imagem.data[indice + 2] = azul * nivel;
      imagem.data[indice + 3] = 255;
    }
    contexto.putImageData(imagem, 0, 0);
    cacheDeLuz.set(chave, tela);
    return tela;
  };
  // facho em cone (luz de holofote/luminária): triângulo que se abre para baixo, em faixas
  const cacheDeCone = new Map();
  const spriteDeCone = (largura, altura, cor, faixas = 4) => {
    const chave = largura + '|' + altura + '|' + cor + '|' + faixas;
    if (cacheDeCone.has(chave)) return cacheDeCone.get(chave);
    const { tela, contexto } = novaTela(largura, altura), imagem = contexto.createImageData(largura, altura), [vermelho, verde, azul] = corHexParaRgb(cor);
    for (let y = 0; y < altura; y++) {
      const fracaoDaAltura = y / altura, meiaLarguraDaLinha = 1 + (largura / 2 - 1) * fracaoDaAltura;
      for (let x = 0; x < largura; x++) {
        const fracaoDoCentro = Math.abs(x - largura / 2) / meiaLarguraDaLinha;
        if (fracaoDoCentro >= 1) continue;
        const intensidade = (1 - fracaoDoCentro * fracaoDoCentro) * (1 - fracaoDaAltura * 0.65);
        const nivel = Math.max(0, Math.min(faixas, Math.ceil(intensidade * faixas - 0.3))) / faixas;
        const indice = (y * largura + x) * 4;
        imagem.data[indice] = vermelho * nivel;
        imagem.data[indice + 1] = verde * nivel;
        imagem.data[indice + 2] = azul * nivel;
        imagem.data[indice + 3] = 255;
      }
    }
    contexto.putImageData(imagem, 0, 0);
    cacheDeCone.set(chave, tela);
    return tela;
  };

  // ---- mapa de luz ----
  let mapaDeLuz = null, corAmbiente = '#30344c';
  cavernaSecreta.luz = {
    iniciar(largura, altura, novaCorAmbiente) { mapaDeLuz = novaTela(largura, altura); corAmbiente = novaCorAmbiente || corAmbiente; },
    // começa o quadro: o mapa volta à cor ambiente e passa a SOMAR as fontes
    comecar() {
      const { contexto } = mapaDeLuz;
      contexto.globalCompositeOperation = 'source-over';
      contexto.globalAlpha = 1;
      contexto.fillStyle = corAmbiente;
      contexto.fillRect(0, 0, mapaDeLuz.tela.width, mapaDeLuz.tela.height);
      contexto.globalCompositeOperation = 'lighter';
    },
    // fonte pontual (raio em px da cena; intensidade 0–1 multiplica o sprite; achatamento < 1 = elipse deitada, para o chão)
    ponto(x, y, raio, cor, intensidade = 1, achatamento = 1) {
      if (intensidade <= 0.01) return;
      const sprite = spriteDeLuz(Math.round(raio), cor, 5, 1.6, achatamento);
      mapaDeLuz.contexto.globalAlpha = Math.min(1, intensidade);
      mapaDeLuz.contexto.drawImage(sprite, Math.round(x - sprite.width / 2), Math.round(y - sprite.height / 2));
    },
    cone(x, y, largura, altura, cor, intensidade = 1) {
      if (intensidade <= 0.01) return;
      mapaDeLuz.contexto.globalAlpha = Math.min(1, intensidade);
      mapaDeLuz.contexto.drawImage(spriteDeCone(largura, altura, cor), Math.round(x - largura / 2), Math.round(y));
    },
    // multiplica o mapa sobre a cena
    aplicar(contexto) {
      mapaDeLuz.contexto.globalAlpha = 1;
      contexto.save();
      contexto.globalCompositeOperation = 'multiply';
      contexto.drawImage(mapaDeLuz.tela, 0, 0);
      contexto.restore();
    },
  };
  // halo aditivo (depois do mapa de luz): o que emite luz continua aceso mesmo no escuro
  cavernaSecreta.desenharBrilho = (contexto, x, y, raio, cor, intensidade = 1, achatamento = 1) => {
    if (intensidade <= 0.01) return;
    const sprite = spriteDeLuz(Math.round(raio), cor, 4, 2.2, achatamento);
    contexto.save();
    contexto.globalCompositeOperation = 'lighter';
    contexto.globalAlpha = Math.min(1, intensidade);
    contexto.drawImage(sprite, Math.round(x - sprite.width / 2), Math.round(y - sprite.height / 2));
    contexto.restore();
  };
  // pixel aceso (aditivo), para pontos emissivos de 1 px (LEDs, olhos)
  cavernaSecreta.acenderPixel = (contexto, x, y, cor, intensidade = 1, largura = 1, altura = 1) => {
    contexto.save();
    contexto.globalCompositeOperation = 'lighter';
    contexto.globalAlpha = Math.min(1, intensidade);
    contexto.fillStyle = cor;
    contexto.fillRect(Math.round(x), Math.round(y), largura, altura);
    contexto.restore();
  };

  // ---- partículas ----
  // Cada sistema: lista de partículas { x, y, vx, vy, vida, max, ... } (vx/vy = velocidade em px/s; vida e max em segundos) e
  // as funções de nascer/atualizar/desenhar. Quantidade limitada (máximo fixo por sistema): nada cresce sem limite.
  const sortearEntre = (minimo, maximo) => minimo + Math.random() * (maximo - minimo);
  cavernaSecreta.sortearEntre = sortearEntre;
  cavernaSecreta.criarParticulas = ({ maximo, taxa, nascer, atualizar, desenhar }) => {
    const lista = [];
    let nascimentosAcumulados = 0;
    return {
      lista,
      atualizar(segundosDoQuadro, tempo) {
        nascimentosAcumulados += segundosDoQuadro * (typeof taxa === 'function' ? taxa(tempo) : taxa);
        while (nascimentosAcumulados >= 1) {
          nascimentosAcumulados -= 1;
          if (lista.length < maximo) { const particula = nascer(tempo); if (particula) lista.push(particula); }
        }
        for (let indice = lista.length - 1; indice >= 0; indice--) {
          const particula = lista[indice];
          particula.vida += segundosDoQuadro;
          if (particula.vida >= particula.max || atualizar(particula, segundosDoQuadro, tempo) === false) lista.splice(indice, 1);
        }
      },
      desenhar(contexto, tempo) { for (const particula of lista) desenhar(contexto, particula, tempo); },
      limpar() { lista.length = 0; nascimentosAcumulados = 0; },
    };
  };
})();
