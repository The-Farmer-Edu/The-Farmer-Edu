// ====================================================================================================
// EDIÇÃO PESSOAL — CENA DO CELEIRO · configuracao.js
// Valores da cena 2D. A ordem de carregamento dos arquivos desta pasta fica em CENA_DO_CELEIRO_CONFIG.arquivos
// (js/30i-cena-do-celeiro.js).
// ====================================================================================================
(() => {
  const cenaDoCeleiro = window.CenaDoCeleiro = window.CenaDoCeleiro || {};
  cenaDoCeleiro.LARGURA = 384;            // resolução lógica da cena (pixels de verdade da pixel art), ampliada em escala INTEIRA
  cenaDoCeleiro.ALTURA = 216;
  // canto superior esquerdo de cada monitor (48×26) na parede de monitores, em ordem: gráfico, radar, código, arame, mapa, energia
  cenaDoCeleiro.MONITORES = [[108, 30], [164, 30], [220, 30], [108, 66], [164, 66], [220, 66]];
})();
