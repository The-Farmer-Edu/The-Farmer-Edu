// ====================================================================================================
// FARMEDU 3D — 02b-configuracao-dos-audios.js (Fase 3B da refatoração: seção 02 — configuração dos áudios)
// ====================================================================================================

const AUDIO_CONFIG = {
  // Música de fundo (toca em loop, só depois que o jogador clica em "Ativar áudio")
  musica: { 
    arquivos: [
      'assets/audio/Theme_songs/musica1.mp3', 
      'assets/audio/Theme_songs/musica2.mp3',
      'assets/audio/Theme_songs/musica3.mp3',
      'assets/audio/Theme_songs/musica4.mp3',
      'assets/audio/Theme_songs/musica5.mp3',
      ],
        volume: 1 },

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
      volume: 1, intervaloMinimo: 5, intervaloMax: 7
    },

    galinha: {
      arquivos: [
        'assets/audio/SFX/galinhas/cacarejo1.mp3',
        'assets/audio/SFX/galinhas/cacarejo2.mp3',
        'assets/audio/SFX/galinhas/galo.mp3'
      ],
      // arquivo: 'assets/audio/SFX/galinhas/cacarejo1.mp3',
      volume: 1, intervaloMinimo: 5, intervaloMax: 7
    },

    ovelha: {
      arquivos: [
        'assets/audio/SFX/ovelhas/balido1.mp3',
        'assets/audio/SFX/ovelhas/balido2.mp3'
      ],
      // arquivo: 'assets/audio/SFX/ovelhas/balido1.mp3',
      volume: 1, intervaloMinimo: 5, intervaloMax: 7
    },

    porco: {
      arquivos: [
        'assets/audio/SFX/porcos/roncocurto1.mp3',
        'assets/audio/SFX/porcos/roncocurto2.mp3',
        'assets/audio/SFX/porcos/roncolongo.mp3'
      ],
      // arquivo: 'assets/audio/SFX/porcos/roncolongo.mp3',
      volume: 1, intervaloMinimo: 5, intervaloMax: 7
    },

    cavalo: {
      arquivos: [
        'assets/audio/SFX/cavalo/bufando.mp3',
        'assets/audio/SFX/cavalo/relincho1.mp3',
        'assets/audio/SFX/cavalo/relincho2.mp3',
        'assets/audio/SFX/cavalo/relincho3.mp3'
      ],
      // arquivo: 'assets/audio/SFX/cavalo/relincho1.mp3',
      volume: 1, intervaloMinimo: 5, intervaloMax: 7
    },
  },

  // Sons ambientes contínuos (loop). O volume diminui com a distância entre a câmera e a fonte do som.
  ambiente: {
    cachoeira: { arquivo: 'assets/audio/SFX/areas-do-jogo/cachoeira.mp3', volume: 0.2, distanciaMaxima: 60, volumeMinimoDeLonge: 0.03 },
    fonte: { arquivo: 'assets/audio/SFX/areas-do-jogo/fonte.mp3', volume: 0.2, distanciaMaxima: 60, volumeMinimoDeLonge: 0.05 },
    trator: { arquivo: 'assets/audio/SFX/areas-do-jogo/trator.mp3', volume: 1, distanciaMaxima: 45, volumeMinimoDeLonge: 0 },
    riacho: { arquivo: 'assets/audio/SFX/areas-do-jogo/riacho.mp3', volume: 1, distanciaMaxima: 50, volumeMinimoDeLonge: 0.04 },
    mina: { arquivo: 'assets/audio/SFX/areas-do-jogo/carrinho.mp3', volume: 0.7 },
  },

  // Efeitos sonoros gerais e de mecânicas do jogo unificados
efeitos: {
    global: { distanciaMaxima: 80, intervaloMinimo: 0.15 },

    // --- BOTÕES E MENUS ---
    tutorialPasso:     { arquivo: 'assets/audio/SFX/sons-do-jogo/botoes-e-menu/tutorial-passo.mp3',     volume: 0.65, intervaloMinimo: 0.08 },
    tutorialTarefa:    { arquivo: 'assets/audio/SFX/sons-do-jogo/botoes-e-menu/tutorial-tarefa.mp3',    volume: 0.75, intervaloMinimo: 0.2 },
    tutorialConcluido: { arquivo: 'assets/audio/SFX/sons-do-jogo/botoes-e-menu/tutorial-concluido.mp3', volume: 0.80, intervaloMinimo: 0.5 },
    Enter:   { arquivo: 'assets/audio/SFX/sons-do-jogo/botoes-e-menu/botaoenter.mp3', volume: 0.6, intervaloMinimo: 0.05 },
    Fecha:  { arquivo: 'assets/audio/SFX/sons-do-jogo/botoes-e-menu/botaovoltar.mp3', volume: 0.6, intervaloMinimo: 0.05 },
    ativar:       { arquivo: 'assets/audio/SFX/sons-do-jogo/botoes-e-menu/ativar.mp3', volume: 0.7 },
    desativar:    { arquivo: 'assets/audio/SFX/sons-do-jogo/botoes-e-menu/desativar.mp3', volume: 0.7 },
    desenvolvedor:{ arquivo: 'assets/audio/SFX/sons-do-jogo/botoes-e-menu/desenvolvedor.mp3', volume: 0.7 },
    erro:         { arquivo: 'assets/audio/SFX/sons-do-jogo/botoes-e-menu/erros.mp3', volume: 0.8 },
    conquista: { arquivo: 'assets/audio/SFX/sons-do-jogo/botoes-e-menu/conquista.mp3', volume: 0.75, intervaloMinimo: 0.1 },

    // --- AÇÕES E PROGRESSÃO ---
    construir: { arquivo: 'assets/audio/SFX/sons-do-jogo/acoes/reparar_danos.mp3', volume: 0.8 },
    plantar:      { arquivo: 'assets/audio/SFX/sons-do-jogo/botoes-e-menu/plantar.mp3', volume: 1 },
    colher:       { arquivo: 'assets/audio/SFX/sons-do-jogo/botoes-e-menu/colher.mp3', volume: 1 },
    contratar:    { arquivo: 'assets/audio/SFX/sons-do-jogo/botoes-e-menu/contratar.mp3', volume: 0.7 },
    demitir:      { arquivo: 'assets/audio/SFX/sons-do-jogo/botoes-e-menu/demitir.mp3', volume: 0.7 },
    evoluir:      { arquivo: 'assets/audio/SFX/sons-do-jogo/botoes-e-menu/evoluir.mp3', volume: 0.9 },
    xp:           { arquivo: 'assets/audio/SFX/sons-do-jogo/botoes-e-menu/Xp.mp3', volume: 0.8 },
    desabamento: { arquivo: 'assets/audio/SFX/sons-do-jogo/acoes/destruicao.mp3', volume: 1, intervaloMinimo: 0.5, distanciaMaxima: 60 },

    // --- POÇÕES E GUARDIÃO (NPC) ---
    pocaoPreparar:  { arquivo: 'assets/audio/SFX/pocoes/preparar.mp3', volume: 0.85, intervaloMinimo: 0.2 },
    pocaoUsar:      { arquivo: 'assets/audio/SFX/pocoes/usar.mp3', volume: 0.9, intervaloMinimo: 0.3 },
    pocaoEfeitoFim: { arquivo: 'assets/audio/SFX/pocoes/fimefeito.mp3', volume: 0.75, intervaloMinimo: 0.5 },
    pocaoSecreta: { arquivo: 'assets/audio/SFX/pocoes/pocaosecreta.mp3', volume: 0.75, intervaloMinimo: 0.5 },
    guardiao:       { arquivo: 'assets/audio/SFX/pocoes/guardiao.mp3', volume: 1.5, intervaloMinimo: 0.5, distanciaMaxima: 45 },
      
    
    // --- FAZENDEIROS / DEFENSORES ---
      fazendeiroAtaque:  { arquivos: 
        [
          'assets/audio/SFX/mobs/fazendeiros/ataquehomem.mp3',
          'assets/audio/SFX/mobs/fazendeiros/ataquemulher.mp3',        
          ],
          volume: 0.85, intervaloMinimo: 1.2 },
      fazendeiroDano:     { arquivo: 'assets/audio/SFX/mobs/fazendeiros/dano.mp3', volume: 0.7, intervaloMinimo: 1.0 },
      fazendeiroMorte:    { arquivo: 'assets/audio/SFX/mobs/fazendeiros/morte.mp3', volume: 0.9, intervaloMinimo: 0.5 },

      // --- LENHADOR ---
      machado:     { arquivo: 'assets/audio/SFX/mobs/lenhador/machado.mp3', volume: 0.7, intervaloMinimo: 1.0 },
      quedaArvore:    { arquivo: 'assets/audio/SFX/mobs/lenhador/quedaarvore.mp3', volume: 0.2, intervaloMinimo: 0.5 },
      lenhador:    { arquivo: 'assets/audio/SFX/mobs/lenhador/lenhador.mp3', volume: 0.9, intervaloMinimo: 0.5 },

      // --- ESQUELETO ---
      esqueletoAparecer:  { arquivo: 'assets/audio/SFX/mobs/esqueleto/surge.mp3', volume: 0.9, intervaloMinimo: 2.0, distanciaMaxima: 35 },
      esqueletoAtaque:    { arquivo: 'assets/audio/SFX/mobs/esqueleto/ataque.mp3', volume: 0.9, intervaloMinimo: 1.8 },
      esqueletoDano:      { arquivo: 'assets/audio/SFX/mobs/esqueleto/dano.mp3', volume: 0.8, intervaloMinimo: 0.9 },
      esqueletoDerrotado: { arquivo: 'assets/audio/SFX/mobs/esqueleto/morte.mp3', volume: 1.5, intervaloMinimo: 0.5 },

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
   

     // --- NO MAPA--
      pedraSecreta: { arquivo: 'assets/audio/SFX/segredos/pedra-secreta.mp3', volume: 0.9 },
/*     unicornio:    { arquivo: 'assets/audio/SFX/segredos/temaunicornio.mp3', volume: 0.9 },
 */    unicornioTrilha:   { arquivo: 'assets/audio/SFX/segredos/unicornio.mp3', volume: 0.95, intervaloMinimo: 1.0 },
    discoVoador:    { arquivo: 'assets/audio/SFX/segredos/nave.mp3', volume: 0.9, intervaloMinimo: 1.0, distanciaMaxima: 90 },
    naveindoembora:    { arquivo: 'assets/audio/SFX/segredos/nave_indo_embora.mp3', volume: 0.9, intervaloMinimo: 1.0, distanciaMaxima: 90 },
    abducao:        { arquivo: 'assets/audio/SFX/segredos/pegavaca.mp3', volume: 0.95, intervaloMinimo: 1.0, distanciaMaxima: 90 },
    trilha:             { arquivo: 'assets/audio/SFX/segredos/temaaliens.mp3', volume: 0.9, intervaloMinimo: 0.5, distanciaMaxima: 70 },
    pegarvaca:  { arquivo: 'assets/audio/SFX/vacas/mugido1.mp3', volume: 0.85, intervaloMinimo: 1.0, distanciaMaxima: 90 },

   // --- EASTER EGGS (CELEIRO E CAVERNA) ---
    celeiroTema:     { arquivo: 'assets/audio/SFX/segredos/celeiro-tema.mp3', volume: 0.7 },
    tonyFala:        { arquivo: 'assets/audio/SFX/segredos/tony-fala.mp3', volume: 0.85 },
    furyFala:        { arquivo: 'assets/audio/SFX/segredos/fury-fala.mp3', volume: 0.85 },
    cavernaTema:    { arquivo: 'assets/audio/SFX/segredos/caverna.mp3',    volume: 0.7 },
    ultronFala:     { arquivo: 'assets/audio/SFX/segredos/ultron.mp3',     volume: 0.85 },
    coringaFala:    { arquivo: 'assets/audio/SFX/segredos/coringa.mp3',    volume: 0.3 },
    venomFala:      { arquivo: 'assets/audio/SFX/segredos/venom.mp3',      volume: 0.8 },
    hulkFala:       { arquivo: 'assets/audio/SFX/segredos/hulk.mp3',       volume: 0.4 },
    destinoFala:    { arquivo: 'assets/audio/SFX/segredos/drdestino.mp3',    volume: 0.2 },
    batmanFala:     { arquivo: 'assets/audio/SFX/segredos/batman.mp3',     volume: 5.0 },
    slendermanFala: { arquivo: 'assets/audio/SFX/segredos/slenderman.mp3', volume: 0.3 },
    freddyFala:     { arquivo: 'assets/audio/SFX/segredos/freddy.mp3',     volume: 0.3 },

    // --- 3 SONS ALEATÓRIOS PARA OS BALÕES DA CAVERNA ---
    cavernaFala1:   { arquivo: 'assets/audio/SFX/segredos/cavernafala1.mp3',   volume: 0.3 },
    cavernaFala2:   { arquivo: 'assets/audio/SFX/segredos/cavernafala2.mp3',   volume: 0.3 },
    cavernaFala3:   { arquivo: 'assets/audio/SFX/segredos/cavernafala3.mp3',   volume: 0.3 },
  
  },
  volumesIniciais: { musica: 0.5, animais: 0.7, cachoeira: 0.6, fonte: 0.6, trator: 0.5, riacho: 0.5, efeitos: 0.7 }
};

arquivoDaMontagemConcluido('02b-configuracao-dos-audios.js');