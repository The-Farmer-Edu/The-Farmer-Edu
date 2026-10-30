      // ====================================================================================================
      // FARMEDU 3D — 01-configuracoes-gerais.js (Fase 3B da refatoração: seção 01)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================


      // ====================================================================================================
      // SEÇÃO 01 — CONFIGURAÇÕES GERAIS: ÁREAS, NÍVEIS E CORES
      // As 13 áreas evolutivas da fazenda (id, nome, ícone e posição no mapa), nível máximo, custos de construção e evolução, paleta de
      // cores e a configuração dos sistemas da Mark 8.2 (lavoura, animais, mina, trabalhadores e monstros noturnos).
      // Os ids das áreas aparecem no salvamento e nos cartões: não os renomeie.
      // ====================================================================================================
      const AREAS = [
        { id: 'curral', nome: 'Curral das vacas', icone: '🐄', posicao: { x: 7, z: 6 } },
        { id: 'ovelhal', nome: 'Ovelhal', icone: '🐑', posicao: { x: 7, z: 21 } },
        { id: 'casa', nome: 'Casa', icone: '🏠', posicao: { x: -8, z: -9 } },
        { id: 'celeiro', nome: 'Celeiro', icone: '🛖', posicao: { x: 7, z: -9 } },
        { id: 'maquinario', nome: 'Maquinário', icone: '🚜', posicao: { x: -8, z: 6 } },
        { id: 'moinho', nome: 'Moinho de pedra', icone: '🌬️', posicao: { x: 35, z: -8 } },        // Mark 8.2: substitui a plantação pequena (marcação azul)
        { id: 'plantacaoGrande', nome: 'Grande plantação', icone: '🌾', posicao: { x: 43, z: 12 } },
        { id: 'galinheiro', nome: 'Galinheiro', icone: '🐔', posicao: { x: 19, z: 6 } },
        { id: 'chiqueiro', nome: 'Chiqueiro', icone: '🐖', posicao: { x: 19, z: -9 } },
        { id: 'estabulo', nome: 'Estábulo', icone: '🐎', posicao: { x: 19, z: 21 } },
        { id: 'ponte', nome: 'Ponte do rio', icone: '🌉', posicao: { x: -20.4, z: -1 } },
        { id: 'novaPlantacao', nome: 'Nova plantação', icone: '🥕', posicao: { x: 43, z: 32.3 } },   // Mark 8.2: marcação vermelha
        { id: 'mina', nome: 'Mina', icone: '⛏️', posicao: { x: -32.3, z: -3.3 } },                   // Mark 8.2: depósito da mina (caverna na marcação roxa)
      ];
      const NIVEL_MAXIMO = 3;
      const CUSTO_PARA_PROXIMO_NIVEL = [100, 250]; // posição 0 = custo do nível 1 → 2
      const PALETA_DE_CORES = { madeira: 0x8a5a2a, ripa: 0xb07a45, janela: 0xffe08a, vidro: 0xbfe3f2, feno: 0xe8c04a, pneu: 0x222222, telhaCasa: 0xd9532f, branco: 0xf2f2ea };

      // ---- MARK 8.2: progressão das construções ----
      // Todas as instalações evolutivas começam no nível 0 ("não construída"): no mapa aparece só a demarcação do lote
      // (seção 13). A CASA é a única construção física inicial: começa na BASE (nível 0, uma casa menor) e evolui até o 3.
      // A PONTE também começa no nível 0, mas a travessia do rio nunca some: no nível 0 há uma passarela provisória de tábuas
      // (infraestrutura fixa) dentro do lote demarcado; construir a ponte troca a passarela pela ponte evolutiva.
      // Mark 8.3: a ponte também existe desde o início — QUEBRADA (sem demarcação de obra); "reparar" a leva ao nível 1.
      const AREAS_COM_BASE_FISICA_NO_NIVEL_0 = ['casa', 'ponte'];
      const ROTULOS_DO_NIVEL_0 = { casa: { estado: '🏠 Base', acao: 'Evoluir' }, ponte: { estado: '🌉 Quebrada', acao: 'Reparar' } };
      const CUSTO_DE_CONSTRUCAO = { padrao: 60, casa: 100, ponte: 80, plantacaoGrande: 120, novaPlantacao: 120, moinho: 150, mina: 200 };
      // Custo (XP) para sair do nível atual: a partir do 0 (tabela acima; na casa é a 1ª evolução) ou evoluir 1 → 2 e 2 → 3.
      const custoParaProximoNivel = (idDaArea, nivelAtual) => nivelAtual === 0 ? (CUSTO_DE_CONSTRUCAO[idDaArea] ?? CUSTO_DE_CONSTRUCAO.padrao) : CUSTO_PARA_PROXIMO_NIVEL[nivelAtual - 1];
      // Capacidade de trabalhadores da casa por nível (índice 0 = base). O fazendeiro inicial ocupa uma vaga; trabalhadores
      // mortos continuam na equipe (ocupam vaga) até serem recuperados ou dispensados.
      const CAPACIDADE_DE_TRABALHADORES_POR_NIVEL_DA_CASA = [1, 2, 3, 4];

      // ---- Plantações (Grande e Nova): culturas, tempo de crescimento (minutos reais), colheita e canteiros ----
      const CULTURAS = {
        trigo: { nome: 'Trigo', icone: '🌾', minutosParaCrescer: 6, colheita: 4, xp: 2 },
        milho: { nome: 'Milho', icone: '🌽', minutosParaCrescer: 8, colheita: 3, xp: 3 },
        cenoura: { nome: 'Cenoura', icone: '🥕', minutosParaCrescer: 10, colheita: 3, xp: 3 },
        abobora: { nome: 'Abóbora', icone: '🎃', minutosParaCrescer: 15, colheita: 2, xp: 5 },
      };
      // As DUAS plantações usam exatamente as mesmas dimensões físicas por nível (as da Grande plantação original) e cada uma
      // tem os próprios canteiros. A grade de canteiros é calculada para caber no campo (seção 12).
      const PLANTACOES_COM_CANTEIROS = ['plantacaoGrande', 'novaPlantacao'];
      const LAVOURA_CONFIG = { larguraPorNivel: [11.8, 17.4, 20.2], profundidade: 15, tamanhoDoCanteiro: 2.6, corredor: 0.6, maximoDeCanteiros: 24,
        segundosBaseDaColheita: 5 };   // tempo de colheita de um canteiro com velocidade de tarefa 1 e eficiência 1 (dividido pelos dois)
      // ---- Animais: quantos existem por nível de cada instalação e o que comem (em ordem de preferência) ----
      // Limites máximos: curral 3 vacas, ovelhal 4 ovelhas, estábulo 3 cavalos (último valor de cada lista).
      const ANIMAIS_DAS_AREAS = {
        curral: { tipo: 'vaca', nome: 'vaca', icone: '🐄', porNivel: [1, 2, 3], come: ['milho', 'trigo', 'cenoura'] },
        ovelhal: { tipo: 'ovelha', nome: 'ovelha', icone: '🐑', porNivel: [2, 3, 4], come: ['trigo', 'cenoura', 'milho'] },
        estabulo: { tipo: 'cavalo', nome: 'cavalo', icone: '🐎', porNivel: [1, 2, 3], come: ['cenoura', 'milho', 'trigo'] },
        galinheiro: { tipo: 'galinha', nome: 'galinha', icone: '🐔', porNivel: [1, 3, 5], come: ['milho', 'trigo'] },
        chiqueiro: { tipo: 'porco', nome: 'porco', icone: '🐖', porNivel: [1, 1, 3], come: ['abobora', 'milho', 'cenoura', 'trigo'] },
      };
      const ALIMENTACAO_CONFIG = {
        horasParaAComidaAcabar: 6,        // com todos os animais vivos, o cocho cheio (100) dura isso
        perdaDeSaudePorHoraSemComida: 20, // saúde 100 → 0 em 5 h sem comida: nunca morre de repente
        recuperacaoDeSaudePorHora: 15,    // com comida no cocho, a saúde volta aos poucos
        saudeDepoisDeUmaMorte: 60,        // quando um animal morre de fome, os outros continuam (com aviso)
        comidaPorUnidade: { trigo: 12, milho: 15, cenoura: 15, abobora: 30 },
        custoParaReporAnimal: 40,         // XP para repor cada animal morto
        limiteDeTempoAusenteHoras: 8,     // tempo com a página fechada conta até este limite (evita perdas enormes de uma vez)
        avisoDeFomeAbaixoDe: 25,          // % do cocho a partir do qual o jogador é avisado
      };
      // ---- Mineração (carrinho nos trilhos da caverna) ----
      const MINERACAO_CONFIG = {
        minutosMinerando: 40,                         // intervalo das recompensas informado no pedido da Mark 8.2
        xpPorCicloPorNivel: [10, 30, 10],             // VALORES DE REFERÊNCIA DO PEDIDO, mantidos como estão: o nível 3 dá MENOS XP que o 2 (confirmar com o design)
        mineriosPorCicloPorNivel: [3, 5, 8],
        velocidadeDoCarrinhoPorNivel: [1.6, 2.0, 2.4], // unidades por segundo nos trilhos
        segundosDescarregando: 4,
        profundidadeDeEscurecimento: 2.2,             // distância dentro da caverna em que o carrinho escurece até sumir
      };
      // ---- Trabalhadores: classes, faixas dos atributos-base (sorteados por candidato), custos e modificadores ----
      // velocidade = unidades/s ao andar · vidaMaxima = pontos de vida · precisao = % de chance de acertar um golpe ·
      // dano = pontos por golpe · velocidadeDeTarefa = rapidez para executar tarefas (colheita).
      // eficienciaDeColheita é o modificador da CLASSE (especialização): multiplica a rapidez da colheita.
      const CLASSES_DE_TRABALHADORES = {
        fazendeiro: { nome: 'Fazendeiro', icone: '🧑‍🌾', custo: 120, custoDeRecuperacao: 60,
          atributos: { velocidade: [2.0, 2.4], vidaMaxima: [95, 115], precisao: [45, 60], dano: [7, 10], velocidadeDeTarefa: [1.1, 1.3] },
          eficienciaDeColheita: 1.5, alcance: 1.3, segundosEntreAtaques: 1.2, raioDeDefesa: 8, colheDeNoite: true, aceleracaoDaLavoura: 0.06,
          descricao: 'Colhe 1,5× mais rápido; luta para se defender e defender a equipe por perto.' },
        guarda: { nome: 'Guarda', icone: '🛡️', custo: 200, custoDeRecuperacao: 100,
          atributos: { velocidade: [1.75, 2.0], vidaMaxima: [170, 210], precisao: [75, 90], dano: [14, 18], velocidadeDeTarefa: [0.8, 1.0] },
          eficienciaDeColheita: 0.8, alcance: 1.6, segundosEntreAtaques: 1.0, raioDeDefesa: 18, colheDeNoite: false, aceleracaoDaLavoura: 0,
          descricao: 'Mais vida, precisão e dano; persegue monstros. Também colhe (mais devagar), durante o dia.' },
      };
      // Fazendeiro inicial: já pertence ao jogador, atributos baixos, concedido UMA única vez por jogo (estado.fazendeiroInicialConcedido).
      const FAZENDEIRO_INICIAL = { nome: 'Juca', classe: 'fazendeiro', velocidade: 1.9, vidaMaxima: 85, precisao: 40, dano: 6, velocidadeDeTarefa: 1.0 };
      // Melhorias com XP: cada atributo sobe até nivelMaximo (custo do próximo nível em custoPorNivel) e vale na hora no jogo.
      const MELHORIAS_DOS_TRABALHADORES = {
        nivelMaximo: 5, custoPorNivel: [40, 70, 110, 160, 220],
        atributos: {
          velocidade: { nome: 'Velocidade', icone: '⚡', incremento: 0.15, casas: 2 },
          vidaMaxima: { nome: 'Vida', icone: '❤', incremento: 20, casas: 0 },
          precisao: { nome: 'Precisão', icone: '🎯', incremento: 4, casas: 0, maximo: 98 },
          dano: { nome: 'Dano', icone: '⚔', incremento: 2, casas: 0 },
          velocidadeDeTarefa: { nome: 'Tarefa', icone: '🧺', incremento: 0.12, casas: 2 },
        },
        fracaoDevolvidaAoDispensar: 0.4, recompensaMinimaAoDispensar: 10,   // dispensar devolve 40% do XP investido (mínimo 10 XP)
      };
      const TRABALHADORES_CONFIG = {
        candidatosNoMenu: 3, vidaRecuperadaPorMinutoDeDia: 10, segundosCaidoAntesDeSumir: 4, xpPorMonstroDerrotado: 5, segundosEntreDecisoes: 0.25,
        // Mark 8.3: trabalhadores só colhem quando o JOGADOR manda (um canteiro ou a plantação inteira). Com true, voltariam a
        // procurar canteiros maduros sozinhos quando ociosos (comportamento da 8.2, que parecia "colher sem parar").
        colheitaEspontanea: false,
        nomes: ['Aninha', 'Arrascaeta', 'Carlinhos', 'Dora', 'Eita', 'Lule', 'Gina', 'Harry', 'Yasmin', 'Jão', 'Liamey', 'Malu-ka', 'Nico B', 'Otário', 'Pretobrás', 'Ui', 'Salamaleca', 'Téopai', 'Veraverao', 'Zecapgordinho'],
      };
      // ---- Monstros noturnos: atacam SOMENTE trabalhadores (nunca construções) ----
      const MONSTROS_NOTURNOS_CONFIG = {
        tipos: { zumbi: { vida: 60, dano: [6, 10], precisao: 0.55, velocidade: 2.0 }, esqueleto: { vida: 45, dano: [5, 9], precisao: 0.65, velocidade: 2.3 }, vampiro: { vida: 75, dano: [8, 12], precisao: 0.6, velocidade: 2.5 } },
        // Mark 8.3 — QUANTIDADE DE MONSTROS acompanha a equipe (fórmula em limiteDeMonstrosSimultaneos, seção 30):
        //   disponíveis = trabalhadores vivos já em campo (mortos, caídos e os que ainda saem da casa não contam);
        //   simultâneos = 0 se ninguém está disponível; senão mín(teto, máx(minimo, porTrabalhadorDisponivel × disponíveis));
        //   por noite = simultâneos × multiplicadorPorNoite (o total de uma noite nunca passa disso).
        //   Ex.: 1 trabalhador → 2 · 2 → 4 · 3+ → 6 (teto; 4 no Modo Leve). A capacidade máxima da casa é 4.
        quantidade: { minimo: 2, porTrabalhadorDisponivel: 2, teto: { normal: 6, leve: 4 }, multiplicadorPorNoite: 2 },
        segundosEntreSurgimentos: 16, alcanceDoAtaque: 1.5, segundosEntreAtaques: 1.3, segundosEntreDecisoes: 0.5,
        distanciaDeSurgimento: [11, 17],   // os monstros surgem a esta distância (mín., máx.) de um guarda ou de outro membro da equipe
        distanciaMinimaDosTrabalhadoresAoSurgir: 9, horaDeInicio: 19.5, horaDeFim: 5,
      };

      arquivoDaMontagemConcluido('01-configuracoes-gerais.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
