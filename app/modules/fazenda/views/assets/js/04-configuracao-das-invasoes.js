      // ====================================================================================================
      // FARMEDU 3D — 04-configuracao-das-invasoes.js (Fase 3B da refatoração: seção 04)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================
      // ====================================================================================================
      // SEÇÃO 04 — CONFIGURAÇÃO DAS INVASÕES POR INATIVIDADE
      // Dias sem jogar até as invasões, intervalo entre elas, probabilidade, quantidade de mobs, instalações elegíveis, custo de reparo e tempos da sequência.
      // O ajuste fino da mecânica é feito somente neste objeto (INVASOES_CONFIG).
      // ====================================================================================================
      const DIA_EM_MS = 24 * 60 * 60 * 1000;
      const INVASOES_CONFIG = {
        // REGRA ORIGINAL DOS 5 DIAS REAIS DE INATIVIDADE (mantida exatamente como era): conta o tempo real desde a última ação
        // VÁLIDA do jogador (estado.atividade.ultima, salvo), não o ciclo de dia e noite. É um sistema SEPARADO dos monstros
        // noturnos da Mark 8.2 (seção 30): estes atacam só trabalhadores e nunca danificam construções; ganhos automáticos
        // (mina, colheita automática, monstros derrotados) não contam como atividade, para não zerar este contador.
        ativas: true,
        diasDeInatividade: 5,               // dias REAIS sem atividade do jogador até as invasões começarem
        intervaloEntreInvasoesDias: 2,      // depois do limite: uma chance de invasão a cada X dias reais de inatividade
        probabilidadeDeAtaque: 0.85,        // chance de cada janela gerar mesmo um ataque
        mobsPorInvasao: [3, 5],             // [mínimo, máximo] de criaturas em uma invasão
        maximoDeMobsSimultaneos: 6,         // teto de segurança para o desempenho
        instalacoesElegiveis: ['celeiro', 'estabulo', 'ovelhal', 'curral', 'galinheiro', 'chiqueiro', 'maquinario'], // casa, ponte, plantações e cenário nunca são alvo
        tiposDeMob: ['zumbi', 'esqueleto', 'vampiro'],
        custoDeReparoPorNivel: [60, 150, 250], // XP para reconstruir uma instalação destruída (índice = nível preservado − 1)
        atrasoAposCarregarSegundos: 3,      // tempo entre abrir a fazenda e as criaturas aparecerem
        tempoMaximoDeChegadaSegundos: 45,   // se alguma criatura travar, o ataque começa mesmo assim
        duracaoDoAtaqueSegundos: 9,         // tempo de ataque antes da instalação desabar
        velocidadeDosMobs: 2.2,             // unidades por segundo
        intervaloDeVerificacaoSegundos: 30, // com a aba aberta, confere o relógio real a cada X segundos
      };

      arquivoDaMontagemConcluido('04-configuracao-das-invasoes.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
