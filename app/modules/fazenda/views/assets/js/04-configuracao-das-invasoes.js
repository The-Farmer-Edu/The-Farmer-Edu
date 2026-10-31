      // ====================================================================================================
      // FARMEDU 3D — 04-configuracao-das-invasoes.js (Fase 3B da refatoração: seção 04)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================
      // ====================================================================================================
      // SEÇÃO 04 — CONFIGURAÇÃO DAS INVASÕES PELO CALENDÁRIO
      // Intervalo entre invasões em dias úteis, quantidade de mobs, instalações elegíveis, custo de reparo e tempos da sequência.
      // O ajuste fino da mecânica é feito somente neste objeto (INVASOES_CONFIG).
      // ====================================================================================================
      const DIA_EM_MS = 24 * 60 * 60 * 1000;
      const INVASOES_CONFIG = {
        // Fazenda 8.4.1: as invasões seguem o CALENDÁRIO, não a atividade do jogador (a regra antiga dos 5 dias reais sem jogar
        // foi substituída). Liberadas quando uma área evolui pela primeira vez do nível 1 para o 2; depois disso há uma invasão a
        // cada 2 dias úteis (segunda a sexta, no dia local do aparelho), avisada no dia útil anterior. É um sistema SEPARADO
        // dos monstros noturnos da Mark 8.2 (seção 30), que atacam só trabalhadores e nunca danificam construções.
        ativas: true,
        // Rebalanceamento (etapa 1): o CALENDÁRIO fica pausado até o sistema de defesa existir. Com true, nada é liberado, avisado
        // ou atacado pelo calendário, e os dias de invasão da pausa não ficam pendentes. Continuam valendo: "Invasão agora" e
        // "Avançar um dia elegível" (Modo desenvolvedor), os reparos e a conclusão de uma invasão já em andamento. Para retomar,
        // troque para false: o calendário volta a partir do dia em que o jogo for aberto, sem ataques retroativos (seção 26).
        // Não use "ativas: false" para isso: ela desliga também o teste e a conclusão de invasões em andamento.
        calendarioPausado: true,
        diasUteisEntreInvasoes: 2,          // o 2º, o 4º, o 6º... dia útil depois da liberação é dia de invasão
        mobsPorInvasao: [3, 5],             // [mínimo, máximo] de criaturas em uma invasão
        maximoDeMobsSimultaneos: 6,         // teto de segurança para o desempenho
        instalacoesElegiveis: ['celeiro', 'estabulo', 'ovelhal', 'curral', 'galinheiro', 'chiqueiro', 'maquinario'], // casa, ponte, plantações e cenário nunca são alvo
        tiposDeMob: ['zumbi', 'esqueleto', 'vampiro'],
        custoDeReparoPorNivel: [150, 400, 800], // XP para reconstruir uma instalação destruída (índice = nível preservado − 1); progressão de 1 ano (8.4.1): antes [60, 150, 250]
        atrasoAposCarregarSegundos: 3,      // tempo entre abrir a fazenda e as criaturas aparecerem
        tempoMaximoDeChegadaSegundos: 45,   // se alguma criatura travar, o ataque começa mesmo assim
        duracaoDoAtaqueSegundos: 9,         // tempo de ataque antes da instalação desabar
        velocidadeDosMobs: 2.2,             // unidades por segundo
        intervaloDeVerificacaoSegundos: 30, // com a aba aberta, confere o calendário a cada X segundos (virada do dia)
        // ---- Defesa (8.4.1, etapa da defesa; regras completas na seção 26) ----
        // As criaturas da invasão têm a vida, o dano, a precisão e o ritmo de ataque dos monstros noturnos do mesmo tipo
        // (MONSTROS_NOTURNOS_CONFIG.tipos) e dão o mesmo XP ao serem derrotadas (TRABALHADORES_CONFIG.xpPorMonstroDerrotado, dentro do
        // limite diário). A instalação desaba quando o dano acumulado chega a 100%: com TODAS as criaturas batendo nela, leva
        // duracaoDoAtaqueSegundos; com parte delas lutando contra a equipe (ou derrotada), leva proporcionalmente mais; com todas
        // lutando, não avança. Derrotar todas as criaturas repele a invasão e nada é destruído.
        defesa: {
          raioDeReacaoDosMobs: 6,           // a criatura larga a instalação para atacar um trabalhador em campo a até 6 unidades dela
          raioDePerseguicaoDosMobs: 10,     // e desiste dele (volta para a instalação) se ele ficar a mais de 10 unidades
        },
      };

      arquivoDaMontagemConcluido('04-configuracao-das-invasoes.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
