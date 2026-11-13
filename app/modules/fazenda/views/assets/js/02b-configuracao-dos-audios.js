// ====================================================================================================
// FARMEDU 3D — 02b-configuracao-dos-audios.js (Fase 3B da refatoração: seção 02 — configuração dos áudios)
// ====================================================================================================

const AUDIO_CONFIG = {
  // Música de fundo (toca em loop, só depois que o jogador clica em "Ativar áudio")
  musica: { 
    arquivo: 'assets/audio/Theme_songs/noite_.mp3', volume: 1 },

  invasao: { 
    arquivo: 'assets/audio/Theme_songs/ataque.mp3', volume: 0.9 },


  // Sons dos animais: tocam de vez em quando, em intervalos aleatórios (segundos) e nunca todos ao mesmo tempo.
  animais: {
    global: { intervaloMinimoEntreSons: 5, maximoSimultaneos: 2, distanciaMaxima: 70 },

    vaca: {
      arquivos: [
        'assets/audio/SFX/vacas/mugido1.mp3',
        'assets/audio/SFX/vacas/mugido2.mp3',
        'assets/audio/SFX/vacas/mugido3.mp3'
      ],
      // arquivo: 'assets/audio/SFX/vacas/mugido3.mp3',
      volume: 1, intervaloMinimo: 3, intervaloMax: 5
    },

    galinha: {
      arquivos: [
        'assets/audio/SFX/galinhas/cacarejo1.mp3',
        'assets/audio/SFX/galinhas/cacarejo2.mp3',
        'assets/audio/SFX/galinhas/galo.mp3'
      ],
      // arquivo: 'assets/audio/SFX/galinhas/cacarejo1.mp3',
      volume: 1, intervaloMinimo: 3, intervaloMax: 5
    },

    ovelha: {
      arquivos: [
        'assets/audio/SFX/ovelhas/balido1.mp3',
        'assets/audio/SFX/ovelhas/balido2.mp3'
      ],
      // arquivo: 'assets/audio/SFX/ovelhas/balido1.mp3',
      volume: 1, intervaloMinimo: 3, intervaloMax: 5
    },

    porco: {
      arquivos: [
        'assets/audio/SFX/porcos/roncocurto1.mp3',
        'assets/audio/SFX/porcos/roncocurto2.mp3',
        'assets/audio/SFX/porcos/roncolongo.mp3'
      ],
      // arquivo: 'assets/audio/SFX/porcos/roncolongo.mp3',
      volume: 1, intervaloMinimo: 3, intervaloMax: 5
    },

    cavalo: {
      arquivos: [
        'assets/audio/SFX/cavalo/bufando.mp3',
        'assets/audio/SFX/cavalo/relincho1.mp3',
        'assets/audio/SFX/cavalo/relincho2.mp3',
        'assets/audio/SFX/cavalo/relincho3.mp3'
      ],
      // arquivo: 'assets/audio/SFX/cavalo/relincho1.mp3',
      volume: 1, intervaloMinimo: 3, intervaloMax: 5
    },
  },

  // Sons ambientes contínuos (loop). O volume diminui com a distância entre a câmera e a fonte do som.
  ambiente: {
    cachoeira: { arquivo: 'assets/audio/SFX/areas-do-jogo/cachoeira.wav', volume: 0.2, distanciaMaxima: 60, volumeMinimoDeLonge: 0.03 },
    fonte: { arquivo: 'assets/audio/SFX/areas-do-jogo/fonte.wav', volume: 0.2, distanciaMaxima: 60, volumeMinimoDeLonge: 0.05 },
    trator: { arquivo: 'assets/audio/SFX/areas-do-jogo/trator.mp3', volume: 1, distanciaMaxima: 45, volumeMinimoDeLonge: 0 },
    riacho: { arquivo: 'assets/audio/SFX/areas-do-jogo/riacho.mp3', volume: 1, distanciaMaxima: 50, volumeMinimoDeLonge: 0.04 },
    mina: { arquivo: 'assets/audio/SFX/areas-do-jogo/carrinho.mp3', volume: 0.7 },
  },

  // Efeitos sonoros gerais e de mecânicas do jogo unificados
efeitos: {
    global: { distanciaMaxima: 80, intervaloMinimo: 0.15 },

    // --- BOTÕES E MENUS ---
    Enter:   { arquivo: 'assets/audio/SFX/sons-do-jogo/botoes-e-menu/botaoenter.mp3', volume: 0.6, intervaloMinimo: 0.05 },
    Fecha:  { arquivo: 'assets/audio/SFX/sons-do-jogo/botoes-e-menu/botaovoltar.mp3', volume: 0.6, intervaloMinimo: 0.05 },
    ativar:       { arquivo: 'assets/audio/SFX/sons-do-jogo/botoes-e-menu/ativar.mp3', volume: 0.7 },
    desativar:    { arquivo: 'assets/audio/SFX/sons-do-jogo/botoes-e-menu/desativar.mp3', volume: 0.7 },
    desenvolvedor:{ arquivo: 'assets/audio/SFX/sons-do-jogo/botoes-e-menu/desenvolvedor.mp3', volume: 0.7 },
    erro:         { arquivo: 'assets/audio/SFX/sons-do-jogo/botoes-e-menu/erros.mp3', volume: 0.8 },
    // --- AÇÕES E PROGRESSÃO ---
    construir: { arquivo: 'assets/audio/SFX/sons-do-jogo/acoes/reparar_danos.mp3', volume: 0.8 },
    plantar:      { arquivo: 'assets/audio/SFX/sons-do-jogo/botoes-e-menu/plantar.mp3', volume: 1 },
    colher:       { arquivo: 'assets/audio/SFX/sons-do-jogo/botoes-e-menu/colher.mp3', volume: 1 },
    contratar:    { arquivo: 'assets/audio/SFX/sons-do-jogo/botoes-e-menu/contratar.mp3', volume: 0.7 },
    demitir:      { arquivo: 'assets/audio/SFX/sons-do-jogo/botoes-e-menu/demitir.mp3', volume: 0.7 },
    evoluir:      { arquivo: 'assets/audio/SFX/sons-do-jogo/botoes-e-menu/evoluir.mp3', volume: 0.9 },
    xp:           { arquivo: 'assets/audio/SFX/sons-do-jogo/botoes-e-menu/Xp.mp3', volume: 0.8 },
    desabamento: { arquivo: 'assets/audio/SFX/sons-do-jogo/acoes/destruicao.mp3', volume: 1, intervaloMinimo: 0.5, distanciaMaxima: 60 },

      // --- FAZENDEIROS / DEFENSORES ---
      fazendeiroAtaque:  { arquivos: 
        [
          'assets/audio/SFX/mobs/fazendeiros/ataquehomem.mp3',
          'assets/audio/SFX/mobs/fazendeiros/ataquemulher.mp3',        
          ],
          volume: 0.85, intervaloMinimo: 1.2 },
      fazendeiroDano:     { arquivo: 'assets/audio/SFX/mobs/fazendeiros/dano.mp3', volume: 0.7, intervaloMinimo: 1.0 },
      fazendeiroMorte:    { arquivo: 'assets/audio/SFX/mobs/fazendeiros/morte.mp3', volume: 0.9, intervaloMinimo: 0.5 },

      // --- ESQUELETO ---
      esqueletoAparecer:  { arquivo: 'assets/audio/SFX/mobs/esqueleto/surge.mp3', volume: 0.9, intervaloMinimo: 2.0, distanciaMaxima: 35 },
      esqueletoAtaque:    { arquivo: 'assets/audio/SFX/mobs/esqueleto/ataque.mp3', volume: 0.9, intervaloMinimo: 1.8 },
      esqueletoDano:      { arquivo: 'assets/audio/SFX/mobs/esqueleto/dano.mp3', volume: 0.8, intervaloMinimo: 0.9 },
      esqueletoDerrotado: { arquivo: 'assets/audio/SFX/mobs/esqueleto/morte.mp3', volume: 0.9, intervaloMinimo: 0.5 },

      // --- ZUMBI ---
      zumbiAparecer:     { arquivo: 'assets/audio/SFX/mobs/zumbi/surge.mp3', volume: 0.6, intervaloMinimo: 2.0, distanciaMaxima: 35 },
      zumbiAtaque:       { arquivo: 'assets/audio/SFX/mobs/zumbi/ataque.mp3', volume: 0.35, intervaloMinimo: 2.2 },
      zumbiDano:         { arquivo: 'assets/audio/SFX/mobs/zumbi/dano.mp3', volume: 0.45, intervaloMinimo: 0.9 },
      zumbiDerrotado:    { arquivo: 'assets/audio/SFX/mobs/zumbi/morte.mp3', volume: 0.65, intervaloMinimo: 0.5 },

      // --- VAMPIRO ---
      vampiroAparecer:   { arquivo: 'assets/audio/SFX/mobs/vampiro/surge.mp3', volume: 0.95, intervaloMinimo: 2.0, distanciaMaxima: 35 },
      vampiroAtaque:     { arquivo: 'assets/audio/SFX/mobs/vampiro/ataque.mp3', volume: 0.95, intervaloMinimo: 1.8 },
      vampiroDano:       { arquivo: 'assets/audio/SFX/mobs/vampiro/dano.mp3', volume: 0.85, intervaloMinimo: 0.9 },
      vampiroDerrotado:  { arquivo: 'assets/audio/SFX/mobs/vampiro/morte.mp3', volume: 0.95, intervaloMinimo: 0.5 },
},
 

  segredos: {
    pedraSecreta: { arquivo: 'assets/audio/SFX/sons-do-jogo/pedra-secreta.mp3', volume: 0.9 }
  },

  volumesIniciais: { musica: 0.5, animais: 0.7, cachoeira: 0.6, fonte: 0.6, trator: 0.5, riacho: 0.5, efeitos: 0.7 }
};

arquivoDaMontagemConcluido('02b-configuracao-dos-audios.js');