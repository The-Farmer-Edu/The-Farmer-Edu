// ====================================================================================================
// FARMEDU 3D — 02b-configuracao-dos-audios.js (Fase 3B da refatoração: seção 02 — configuração dos áudios)
// ====================================================================================================

const AUDIO_CONFIG = {
  // Música de fundo (toca em loop, só depois que o jogador clica em "Ativar áudio")
  musica: { arquivo: 'assets/audio/Theme_songs/noite_.mp3', volume: 1 },

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
      volume: 1, intervaloMin: 3, intervaloMax: 5
    },

    galinha: {
      arquivos: [
        'assets/audio/SFX/galinhas/cacarejo1.mp3',
        'assets/audio/SFX/galinhas/cacarejo2.mp3',
        'assets/audio/SFX/galinhas/galo.mp3'
      ],
      // arquivo: 'assets/audio/SFX/galinhas/cacarejo1.mp3',
      volume: 1, intervaloMin: 3, intervaloMax: 5
    },

    ovelha: {
      arquivos: [
        'assets/audio/SFX/ovelhas/balido1.mp3',
        'assets/audio/SFX/ovelhas/balido2.mp3'
      ],
      // arquivo: 'assets/audio/SFX/ovelhas/balido1.mp3',
      volume: 1, intervaloMin: 3, intervaloMax: 5
    },

    porco: {
      arquivos: [
        'assets/audio/SFX/porcos/roncocurto1.mp3',
        'assets/audio/SFX/porcos/roncocurto2.mp3',
        'assets/audio/SFX/porcos/roncolongo.mp3'
      ],
      // arquivo: 'assets/audio/SFX/porcos/roncolongo.mp3',
      volume: 1, intervaloMin: 3, intervaloMax: 5
    },

    cavalo: {
      arquivos: [
        'assets/audio/SFX/cavalo/bufando.mp3',
        'assets/audio/SFX/cavalo/relincho1.mp3',
        'assets/audio/SFX/cavalo/relincho2.mp3',
        'assets/audio/SFX/cavalo/relincho3.mp3'
      ],
      // arquivo: 'assets/audio/SFX/cavalo/relincho1.mp3',
      volume: 1, intervaloMin: 3, intervaloMax: 5
    },
  },

  // Sons ambientes contínuos (loop). O volume diminui com a distância entre a câmera e a fonte do som.
  ambiente: {
    cachoeira: { arquivo: 'assets/audio/SFX/areas-do-jogo/cachoeira.mp3', volume: 0.2, distanciaMaxima: 60, volumeMinimoDeLonge: 0.03 },
    fonte: { arquivo: 'assets/audio/SFX/areas-do-jogo/fonte.wav', volume: 0.2, distanciaMaxima: 60, volumeMinimoDeLonge: 0.05 },
    trator: { arquivo: 'assets/audio/SFX/areas-do-jogo/trator.mp3', volume: 1, distanciaMaxima: 45, volumeMinimoDeLonge: 0 },
    riacho: { arquivo: 'assets/audio/SFX/areas-do-jogo/riacho.mp3', volume: 1, distanciaMaxima: 50, volumeMinimoDeLonge: 0.04 } // <--- Ajustado para riacho.mp3 (ou .wav dependendo do teu ficheiro)
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
  analise:      { arquivo: 'assets/audio/SFX/sons-do-jogo/botoes-e-menu/analise.mp3', volume: 0.7 },
  analiseTbm:   { arquivo: 'assets/audio/SFX/sons-do-jogo/botoes-e-menu/analisetbm.mp3', volume: 0.7 },
  levelUp:      { arquivo: 'assets/audio/SFX/sons-do-jogo/botoes-e-menu/Level Up.mp3', volume: 0.9 },
  xp:           { arquivo: 'assets/audio/SFX/sons-do-jogo/botoes-e-menu/Xp.mp3', volume: 0.8 },
  mina: { arquivo: 'assets/audio/SFX/areas-do-jogo/carrinho_da_mina.mp3', volume: 0.7 },
fazendeiroDano: { arquivo: 'assets/audio/SFX/mobs/porradanosmobs.mp3', volume: 1, intervaloMinimo: 0.2, distanciaMaxima: 60 },
    fazendeiroMorte: { arquivo: 'assets/audio/SFX/mobs/fazendeiros/mortehomem.mp3', volume: 1, intervaloMinimo: 0.5, distanciaMaxima: 60 },





     


    golpe: {
      // arquivo: [
      //   'assets/audio/SFX/mobs/fazendeiros/ataquehomem.mp3',
      //   'assets/audio/SFX/mobs/fazendeiros/ataquemulher.mp3'
      // ],
      arquivo: 'assets/audio/SFX/mobs/fazendeiros/ataquehomem.mp3',
      volume: 0.5, intervaloMinimo: 0.25
    },

    monstroDerrotado: { arquivo: 'assets/audio/SFX/mobs/porradanosmobs.mp3', volume: 0.7 },
    alarmeDeInvasao: { arquivo: 'assets/audio/Theme_songs/ataque.mp3', volume: 0.9 },
    /* invasaoRepelida:     { arquivo: 'assets/audio/SFX/sons-do-jogo/acoes/invasao-repelida.mp3', volume: 0.9 }, */
    desabamento: { arquivo: 'assets/audio/SFX/sons-do-jogo/acoes/quebrando1.mp3', volume: 0.9 }
  },

  segredos: {
    pedraSecreta: { arquivo: 'assets/audio/SFX/sons-do-jogo/pedra-secreta.mp3', volume: 0.9 },
    // Etapa 2 (seção 30c): pontos de integração das músicas dos eventos. Os arquivos AINDA NÃO EXISTEM: coloque o seu arquivo
    // (MP3 ou OGG, de autoria própria ou com licença de uso) neste caminho e ele passa a tocar sozinho, sincronizado com a cena.
    // Sem o arquivo, o evento roda em silêncio (o sistema de áudio só marca o som como indisponível). Nome neutro de propósito.
    misterio: { arquivo: 'assets/audio/SFX/eventos/misterio.mp3', volume: 0.85 },      // começa quando o unicórnio aparece no céu
    discoVoador: { arquivo: 'assets/audio/SFX/eventos/disco-voador.mp3', volume: 0.8 } // opcional: chegada do disco voador
  },

  volumesIniciais: { musica: 0.5, animais: 0.7, cachoeira: 0.6, fonte: 0.6, trator: 0.5, riacho: 0.5, efeitos: 0.7 }
};

arquivoDaMontagemConcluido('02b-configuracao-dos-audios.js');