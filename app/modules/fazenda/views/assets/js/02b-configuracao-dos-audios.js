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
      // Todos os caminhos de áudio do jogo ficam NESTE objeto. Os arquivos ficam em views/assets/audio/<subpasta>/ (musica,
      // ambiente, animais, segredos, efeitos), só MP3 ou OGG, com nomes em minúsculas, números e hífens; a origem e a licença de
      // cada arquivo são registradas em views/assets/audio/LEIA-ME.md. Fazenda 8.4.1: o endereço real é montado na seção 23
      // (enderecoDoAudio): aberto pelo arquivo (file://) é a própria pasta; pela aplicação PHP é a rota fazenda/audio.
      // Se um arquivo não existir, a fazenda continua funcionando e o painel de áudio mostra "arquivo não encontrado".


      const AUDIO_CONFIG = {
        // Música de fundo (toca em loop, só depois que o jogador clica em "Ativar áudio")
        musica: { arquivo: 'fazenda/arquivo?type=audio/Theme_songs&file=noite_.mp3', volume: 1 },

        // Sons dos animais: tocam de vez em quando, em intervalos aleatórios (segundos) e nunca todos ao mesmo tempo.
        animais: {
          global: { intervaloMinimoEntreSons: 5, maximoSimultaneos: 2, distanciaMaxima: 70 },

          vaca: {
            arquivos: [
              'fazenda/arquivo?type=audio/SFX/vacas&file=mugido1.mp3',
              'fazenda/arquivo?type=audio/SFX/vacas&file=mugido2.mp3',
              'fazenda/arquivo?type=audio/SFX/vacas&file=mugido3.mp3'
            ],
            volume: 1, intervaloMin: 30, intervaloMax: 80
          },

          galinha: {
            arquivos: [
                'fazenda/arquivo?type=audio/SFX/galinhas&file=cacarejo1.mp3',
                'fazenda/arquivo?type=audio/SFX/galinhas&file=cacarejo2.mp3',
                'fazenda/arquivo?type=audio/SFX/galinhas&file=cacarejo3.mp3',

              ],
                volume: 1, intervaloMin: 3, intervaloMax: 5   // volume vai de 0 a 1; intervalo 3–5 é de TESTE, vou colocar uma duração maior depois
              },

          ovelha:  {
            arquivos: [
              'fazenda/arquivo?type=audio/SFX/ovelhas&file=balido1.mp3',
              'fazenda/arquivo?type=audio/SFX/ovelhas&file=balido2.mp3',

            ],
            volume: 1, intervaloMin: 3, intervaloMax: 5   // intervalo de TESTE
            }, // balido

          porco:   {
            arquivos: [
              'fazenda/arquivo?type=audio/SFX/porcos&file=roncocurto1.mp3',
              'fazenda/arquivo?type=audio/SFX/porcos&file=roncocurto2.mp3',
              'fazenda/arquivo?type=audio/SFX/porcos&file=roncolongo.mp3',

            ],
            volume: 1, intervaloMin: 3, intervaloMax: 5   // intervalo de TESTE
            }, // grunhido

          cavalo:  {
            arquivos: [
              'fazenda/arquivo?type=audio/SFX/cavalo&file=bufando.mp3',      
              'fazenda/arquivo?type=audio/SFX/cavalo&file=relincho1.mp3',
              'fazenda/arquivo?type=audio/SFX/cavalo&file=relincho2.mp3',
              'fazenda/arquivo?type=audio/SFX/cavalo&file=relincho3.mp3',
            ],
            volume: 1, intervaloMin: 3, intervaloMax: 5   // intervalo de TESTE
            }, // relincho

        },

        //  efeitos sonoros curtos. Cada um aceita uma LISTA de variações (uma é sorteada a cada vez).
        //  • intervaloMinimo = segundos mínimos entre dois sons do mesmo efeito (evita "metralhadora").
        //  • distanciaMaxima = só para efeitos "no mundo" (combate, passos, invasões): o volume cai com a distância da câmera.
        //  • Para um som diferente por tipo de monstro, crie por exemplo mobAtaque_zumbi, mobAtaque_esqueleto, mobAtaque_vampiro
        //    (o mesmo vale para mobSurge, mobDano e mobMorte). Se não existir o específico, vale o geral.
        //  • Efeito sem arquivo é simplesmente ignorado (aparece uma linha no console, F12).
        efeitos: {
          // menus e botões (qualquer botão ou cartão da interface)
          cliqueMenu:         { arquivos: ['fazenda/arquivo?type=audio/SFX&file='], volume: 0.6, intervaloMinimo: 0.05 },

          // monstros noturnos e invasores
          mobSurge:           { arquivos: ['fazenda/arquivo?type=audio/SFX/mob&file='], volume: 0.8, intervaloMinimo: 1, distanciaMaxima: 70 },
          mobAtaque:          { arquivos: ['fazenda/arquivo?type=audio/SFX/mob&file='], volume: 1, intervaloMinimo: 0.3, distanciaMaxima: 60 },
          mobDano:            { arquivos: ['fazenda/arquivo?type=audio/SFX/mob&file='], volume: 1, intervaloMinimo: 0.2, distanciaMaxima: 60 },
          mobMorte:           { arquivos: ['fazenda/arquivo?type=audio/SFX/mob&file='], volume: 1, intervaloMinimo: 0.2, distanciaMaxima: 60 },

          // equipe (fazendeiro inicial e contratados)
          trabalhadorAtaque:  { arquivos: ['fazenda/arquivo?type=audio/SFX/sons-do-jogo&file='], volume: 1, intervaloMinimo: 0.3, distanciaMaxima: 60 },
          trabalhadorDano:    { arquivos: ['fazenda/arquivo?type=audio/SFX/sons-do-jogo&file='], volume: 1, intervaloMinimo: 0.2, distanciaMaxima: 60 },
          trabalhadorMorte:   { arquivos: ['fazenda/arquivo?type=audio/SFX/sons-do-jogo&file='], volume: 1, intervaloMinimo: 0.5, distanciaMaxima: 60 },

          // passos (detectados sozinhos pela caminhada de cada personagem)
          passoTrabalhador:   { arquivos: ['fazenda/arquivo?type=audio/SFX/sons-do-jogo&file='], volume: 0.35, intervaloMinimo: 0.12, distanciaMaxima: 25 },
          passoMob:           { arquivos: ['fazenda/arquivo?type=audio/SFX/sons-do-jogo&file='], volume: 0.4, intervaloMinimo: 0.12, distanciaMaxima: 30 },

          // invasão por inatividade (a instalação sendo atacada e destruída)
          invasaoChegada:     { arquivos: ['fazenda/arquivo?type=audio/&file='], volume: 1, intervaloMinimo: 2, distanciaMaxima: 120 },
          invasaoGolpe:       { arquivos: ['fazenda/arquivo?type=audio/&file='], volume: 1, intervaloMinimo: 0.25, distanciaMaxima: 100 },
          invasaoDesabamento: { arquivos: ['fazenda/arquivo?type=audio/&file='], volume: 1, intervaloMinimo: 2, distanciaMaxima: 120 },
        },

        // Sons ambientes contínuos (loop). O volume diminui com a distância entre a câmera e a fonte do som.
        ambiente: {
          cachoeira: { arquivo: 'fazenda/arquivo?type=audio/SFX/areas-do-jogo&file=cachoeira.mp3', volume: 1, distanciaMaxima: 90, volumeMinimoDeLonge: 0.15 }, // paredão da cachoeira
          fonte:     { arquivo: 'fazenda/arquivo?type=audio/SFX/areas-do-jogo&file=fonte.wav',     volume: 1, distanciaMaxima: 60, volumeMinimoDeLonge: 0.05 }, // chafariz do lago
          // Fazenda 8.4.1: o trator do Maquinário (níveis 2 e 3) fica estacionado com o motor ligado (vibra sem parar, seção 12b).
          // O som é o motor em MARCHA LENTA, em loop, só enquanto o trator existe na cena e o Maquinário não está destruído.
          trator:    { arquivo: 'fazenda/arquivo?type=audio/SFX/areas-do-jogo&file=trator.mp3', volume: 1, distanciaMaxima: 45, volumeMinimoDeLonge: 0 },
        },

        // Fazenda 8.4.1: efeitos curtos das mecânicas que existem no jogo (seção 23, tocarEfeito). Cada um tem um único <audio>;
        // repetições muito próximas do mesmo efeito são ignoradas (intervaloMinimo, em segundos). Os efeitos com posição ficam mais
        // baixos quando a câmera está longe (global.distanciaMaxima).
        efeitos: {
          global: { distanciaMaxima: 80, intervaloMinimo: 0.15 },
          plantar:            { arquivo: 'fazenda/arquivo?type=audio/SFX/sons-do-jogo/acoes&file=plantar.mp3',            volume: 0.6 },  // canteiro plantado
          colher:             { arquivo: 'fazenda/arquivo?type=audio/SFX/sons-do-jogo/acoes&file=colher.mp3',             volume: 0.7 },  // canteiro colhido (jogador ou trabalhador)
          construir:          { arquivo: 'fazenda/arquivo?type=audio/SFX/sons-do-jogo/acoes&file=construir.mp3',          volume: 0.8 },  // construção, evolução e reparo
          mina:               { arquivo: 'fazenda/arquivo?type=audio/SFX/sons-do-jogo/acoes&file=mina-carrinho.mp3**',      volume: 0.7 },  // carrinho descarrega minérios
          contratar:          { arquivo: 'fazenda/arquivo?type=audio/SFX/sons-do-jogo/acoes&file=contratar.mp3**',          volume: 0.7 },  // trabalhador contratado ou recuperado
          golpe:              { arquivo: 'fazenda/arquivo?type=audio/SFX/sons-do-jogo/acoes&file=golpe.mp3**',              volume: 0.5, intervaloMinimo: 0.25 }, // golpe que acerta em combate
          monstroDerrotado:   { arquivo: 'fazenda/arquivo?type=audio/SFX/sons-do-jogo/acoes&file=monstro-derrotado.mp3**',  volume: 0.7 },  // monstro noturno ou criatura da invasão
          alarmeDeInvasao:    { arquivo: 'fazenda/arquivo?type=audio/SFX/sons-do-jogo/acoes&file=alarme-invasao.mp3**',     volume: 0.9 },  // invasão começando
          invasaoRepelida:    { arquivo: 'fazenda/arquivo?type=audio/SFX/sons-do-jogo/acoes&file=invasao-repelida.mp3**',   volume: 0.9 },  // todas as criaturas derrotadas
          desabamento:        { arquivo: 'fazenda/arquivo?type=audio/SFX/sons-do-jogo/acoes&file=quebrando1.mp3',        volume: 0.9 },  // instalação destruída
        },

        // Segredos (Easter eggs). Cada item vira um som próprio (seção 23); para um segredo novo basta uma linha aqui e uma
        // chamada tocarSegredo('nome') onde ele for descoberto.
        segredos: {
          pedraSecreta: { arquivo: 'fazenda/arquivo?type=audio/&file=', volume: 0.9 }, // clique na pedra especial da floresta
        },

        // Volumes iniciais dos controles do painel (0 a 1)
        volumesIniciais: { musica: 0.5, animais: 0.7, cachoeira: 0.6, fonte: 0.6, trator: 0.5, efeitos: 0.7 },
      };

      arquivoDaMontagemConcluido('02b-configuracao-dos-audios.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim