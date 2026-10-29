      // ====================================================================================================
      // FARMEDU 3D — 02b-configuracao-dos-audios.js (Fase 3B da refatoração: seção 02 — configuração dos áudios)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================
      // ============================================================================================
      // CONFIGURAÇÃO DOS ÁUDIOS — ADICIONE SEUS ARQUIVOS AQUI
      // ============================================================================================
      // Todos os caminhos de áudio do jogo ficam NESTE objeto. Os arquivos NÃO acompanham o projeto:
      // crie as pastas ao lado deste HTML e coloque seus sons com os nomes abaixo (ou troque o caminho aqui).
      // Se um arquivo não existir, a fazenda continua funcionando e o painel de áudio mostra "arquivo não encontrado".
      const AUDIO_CONFIG = {
        // Música de fundo (toca em loop, só depois que o jogador clica em "Ativar áudio")
        musica: { arquivo: 'assets/audio/musica-fundo.mp3', volume: 1 },

        // Sons dos animais: tocam de vez em quando, em intervalos aleatórios (segundos) e nunca todos ao mesmo tempo.
        animais: {
          global: { intervaloMinimoEntreSons: 5, maximoSimultaneos: 2, distanciaMaxima: 70 },
          vaca:    { arquivo: 'assets/audio/animais/vaca.mp3',    volume: 1, intervaloMin: 30, intervaloMax: 80 }, // mugido
          galinha: { arquivo: 'assets/audio/animais/galinha.mp3', volume: 1, intervaloMin: 20, intervaloMax: 60 }, // cacarejo
          ovelha:  { arquivo: 'assets/audio/animais/ovelha.mp3',  volume: 1, intervaloMin: 28, intervaloMax: 75 }, // balido
          porco:   { arquivo: 'assets/audio/animais/porco.mp3',   volume: 1, intervaloMin: 30, intervaloMax: 80 }, // grunhido
          cavalo:  { arquivo: 'assets/audio/animais/cavalo.mp3',  volume: 1, intervaloMin: 45, intervaloMax: 110 }, // relincho
        },

        // Sons ambientes contínuos (loop). O volume diminui com a distância entre a câmera e a fonte do som.
        ambiente: {
          cachoeira: { arquivo: 'assets/audio/ambiente/cachoeira.mp3', volume: 1, distanciaMaxima: 90, volumeMinimoDeLonge: 0.15 }, // paredão da cachoeira
          fonte:     { arquivo: 'assets/audio/ambiente/fonte.mp3',     volume: 1, distanciaMaxima: 60, volumeMinimoDeLonge: 0.05 }, // chafariz do lago
        },

        // Segredos (Easter eggs)
        segredos: {
          pedraSecreta: { arquivo: 'assets/audio/segredos/pedra-secreta.mp3', volume: 0.9 }, // clique na pedra especial da floresta
        },

        // Volumes iniciais dos controles do painel (0 a 1)
        volumesIniciais: { musica: 0.5, animais: 0.7, cachoeira: 0.6, fonte: 0.6 },
      };

      arquivoDaMontagemConcluido('02b-configuracao-dos-audios.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
