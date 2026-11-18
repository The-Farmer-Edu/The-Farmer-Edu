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
        // foi substituída). Liberadas quando uma INSTALAÇÃO ATACÁVEL (instalacoesElegiveis) evolui pela primeira vez do nível 1 para o
        // 2 (casa, ponte, plantações, moinho e mina não liberam); depois disso há uma invasão a
        // cada 2 dias úteis (segunda a sexta, no dia local do aparelho), avisada no dia útil anterior. É um sistema SEPARADO
        // dos monstros noturnos da Mark 8.2 (seção 30), que atacam só trabalhadores e nunca danificam construções.
        ativas: true,
        // Chave do CALENDÁRIO. false (versão de entrega) = invasões pelo calendário ligadas. TEMPORARIAMENTE true até a conclusão da
        // preparação da versão de entrega (pedido da equipe no ajuste do estábulo); na entrega, trocar para false.
        // true = pausado: nada é liberado, avisado ou atacado pelo calendário, e os dias de invasão da pausa não ficam pendentes;
        // continuam valendo "Invasão agora" e "Avançar um dia elegível" (Modo desenvolvedor), os reparos e a conclusão de uma invasão
        // já em andamento. Ao voltar de true para false, o calendário recomeça no dia em que o jogo for aberto, sem ataques
        // retroativos (seção 26). Não use "ativas: false" para pausar: ela desliga também o teste e a conclusão de invasões em andamento.
        calendarioPausado: true,
        diasUteisEntreInvasoes: 2,          // o 2º, o 4º, o 6º... dia útil depois da liberação é dia de invasão
        // Missão final: as criaturas só aparecem À NOITE do ciclo do jogo (seção 17; a mesma noite dos monstros noturnos,
        // MONSTROS_NOTURNOS_CONFIG.horaDeInicio a horaDeFim). No dia de invasão, durante o dia, a invasão fica pendente (a data não
        // muda) e começa sozinha ao anoitecer; uma invasão salva em andamento (página fechada no meio) também continua só à noite.
        // Vale para invasões e rondas do calendário; "Invasão agora" (Modo desenvolvedor) continua imediata, para testes.
        // Enquanto uma invasão está em curso, não surgem monstros noturnos novos (seção 30a): desempenho e equilíbrio medidos.
        somenteANoite: true,
        // Finalização das invasões: a QUANTIDADE de criaturas acompanha a força dos guardas (seção 26, quantidadeDeCriaturas):
        //   F = (soma do dano por segundo) × (soma da vida máxima) dos GUARDAS contratados e vivos (inclusive os mandados para casa;
        //       os derrotados ainda não recuperados não contam; fazendeiros e o Juca não entram: na simulação, o peso real deles na
        //       defesa foi ~0, porque só lutam dentro do próprio raio);
        //   N = floor(fatorDaFormula × √(F / forcaDeUmaCriatura)), limitado a mobsPorInvasao.
        // forcaDeUmaCriatura = dano por segundo médio (3,83) × vida média (60) das três criaturas (MONSTROS_NOTURNOS_CONFIG).
        // Ex. (atributos médios): 1 guarda → 3 · 1 guarda com vida, precisão e dano no máximo → 5 · 2 guardas → 5 (no teto).
        // A distância NÃO reduz a quantidade: o tempo de chegada dos guardas já pesa naturalmente no resultado.
        formulaDaDificuldade: { forcaDeUmaCriatura: 230, fatorDaFormula: 0.95 },
        // [mínimo, máximo] de criaturas em uma invasão COM guarda (antes: sorteio fixo de 3 a 5). TETO 5 por desempenho: medido na
        // qualidade Baixa, com renderizador por software e CPU 4× mais lenta (computador fraco), 5 criaturas → 22 FPS e 6 → 19 FPS;
        // abaixo de 20 FPS o relógio do jogo (passo máximo de 0,05 s por quadro) começa a atrasar. Com a CPU normal, 5 e 6 custam o mesmo.
        mobsPorInvasao: [3, 5],
        maximoDeMobsSimultaneos: 5,         // teto de segurança para o desempenho (também limita invasões antigas retomadas)
        // Sem nenhum guarda contratado e vivo, as criaturas só fazem uma RONDA: aparecem, vão até a instalação, olham e vão embora,
        // sem atacar ninguém e sem destruir nada. O dia de invasão conta como cumprido e não há recompensa.
        mobsDaRonda: 3, segundosDaRonda: 4,
        // Recompensa por REPELIR uma invasão real (não vale para invasões de teste nem para rondas): XP fixo, FORA da cota diária de
        // Defesa (as criaturas derrotadas continuam dando o XP delas dentro da cota, como os monstros noturnos). Concedida uma vez por
        // invasão (estado.invasao.recompensadaId).
        recompensaPorRepelir: 10,
        // Proteções: a invasão não começa durante uma cena especial, com o tutorial, o painel do Guardião ou uma janela de tela cheia
        // aberta; ela espera (a conferência roda de novo a cada segundo). Se as criaturas não conseguirem chegar (sem caminho ou
        // travadas), nada é destruído: depois deste tempo na fase de ataque sem nenhuma criatura batendo, elas desistem e vão embora.
        segundosAteDesistirSemChegar: 60,
        instalacoesElegiveis: ['celeiro', 'estabulo', 'ovelhal', 'curral', 'galinheiro', 'chiqueiro', 'maquinario'], // casa, ponte, plantações e cenário nunca são alvo; só elas liberam as invasões
        // Ajuste do estábulo: por padrão as criaturas se distribuem pelo perímetro INTEIRO da instalação (seção 26, posicoesDeAtaque).
        // Para as instalações listadas aqui, os pontos de ataque ficam concentrados num ARCO de um lado só: anguloCentral em graus
        // (0 = leste/+x, 90 = sul/+z, 180 = oeste, 270 = norte/−z) e abertura total do arco em graus. O estábulo é a instalação mais
        // longe da casa e, espalhadas pelos 4 lados do cercado grande, as criaturas obrigavam os guardas a dar a volta inteira nele;
        // agora elas batem no lado NORTE (portão, lado do caminho por onde a equipe chega). As outras instalações não mudam.
        // guardasEsperamNoPontoDeAtaque: enquanto a criatura ainda caminha e está a mais de 12 unidades, o guarda vai ao ponto de ataque
        // dela (seção 29, decidirTrabalhador) em vez de seguir a posição atual, que o fazia contornar o estábulo pelo sul, por trás delas.
        ladoDeAtaquePorAlvo: { estabulo: { anguloCentral: 270, abertura: 80, guardasEsperamNoPontoDeAtaque: true } },
        tiposDeMob: ['zumbi', 'esqueleto', 'vampiro'],
        // XP para reconstruir uma instalação destruída (índice = nível preservado − 1). Rebalanceamento: antes [150, 400, 800] (e
        // [60, 150, 250] antes da 8.4.1). Acompanha a queda dos custos das construções: reparar continua mais barato que reconstruir.
        custoDeReparoPorNivel: [100, 250, 450],
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
