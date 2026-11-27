// ====================================================================================================
// EDIÇÃO PESSOAL — CAVERNA SECRETA · configuracao.js
// Valores da cena 2D da caverna. A ordem de carregamento dos arquivos fica em CAVERNA_SECRETA_CONFIG (js/30j-caverna-secreta.js).
// Todos os arquivos da caverna compartilham o objeto global window.CavernaSecreta (apelidado de `cavernaSecreta` em cada
// arquivo): ele é a interface entre os módulos (configuração, efeitos, cenário, personagens, falas e motor).
// ====================================================================================================
(() => {
  const cavernaSecreta = window.CavernaSecreta = window.CavernaSecreta || {};
  cavernaSecreta.LARGURA = 384;            // resolução lógica (pixels de verdade), ampliada em escala INTEIRA (nearest-neighbor)
  cavernaSecreta.ALTURA = 216;
  cavernaSecreta.QUADROS_POR_SEGUNDO_DOS_SPRITES = 12;   // trocas de quadro e deslocamentos dos personagens andam neste passo (pixel art)

  // Onde cada personagem fica ([x, y]: x = centro dos pés, y = linha do chão onde pisa). Cada um tem o SEU canto do cenário:
  //  fundo (plataforma de pedra, y = 148): Ultron (servidores, luz vermelha) e Doutor Destino (altar com braseiros verdes);
  //  alto à direita (passarela de aço, y = 104): Batman;  esquerda, no escuro entre as estalagmites (y = 176): Slenderman;
  //  frente (chão, y ≈ 206): Coringa (cartas, néon roxo), Hulk (entulho e viga torta), Venom (cano pingando gosma)
  //  e Freddy (palquinho de festa com holofote).
  cavernaSecreta.POSICOES = {
    slenderman: [27, 178],
    ultron: [96, 148],
    destino: [268, 148],
    batman: [347, 104],
    coringa: [118, 205],
    hulk: [194, 209],
    venom: [272, 207],
    freddy: [345, 206],
  };
  // plataforma de pedra do fundo: topo em y = 148, de x0 a x1 (nomes curtos por serem coordenadas de um retângulo)
  cavernaSecreta.PLATAFORMA = { y: 148, x0: 58, x1: 312 };
  cavernaSecreta.PASSARELA = { y: 104, x0: 318, x1: 384 };   // passarela de aço do Batman
})();
