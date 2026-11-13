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
      // Rebalanceamento da economia (docs/ECONOMIA-XP-E-PROGRESSAO-DA-FAZENDA.md): antes [400, 1000] (e [100, 250] antes da 8.4.1).
      // As evoluções ficaram mais baratas porque agora também custam mais madeira e porque cada nível AUMENTA a cota diária da
      // atividade ligada à construção (ver COTAS_DIARIAS_DE_XP): evoluir passou a render XP todos os dias depois.
      const CUSTO_PARA_PROXIMO_NIVEL = [250, 550]; // posição 0 = custo do nível 1 → 2
      const PALETA_DE_CORES = { madeira: 0x8a5a2a, ripa: 0xb07a45, janela: 0xffe08a, vidro: 0xbfe3f2, feno: 0xe8c04a, pneu: 0x222222, telhaCasa: 0xd9532f, branco: 0xf2f2ea };

      // ---- MARK 8.2: progressão das construções ----
      // Todas as instalações evolutivas começam no nível 0 ("não construída"): no mapa aparece só a demarcação do lote
      // (seção 13). A CASA é a única construção física inicial: começa na BASE (nível 0, uma casa menor) e evolui até o 3.
      // A PONTE também começa no nível 0, mas a travessia do rio nunca some: no nível 0 há uma passarela provisória de tábuas
      // (infraestrutura fixa) dentro do lote demarcado; construir a ponte troca a passarela pela ponte evolutiva.
      // Mark 8.3: a ponte também existe desde o início — QUEBRADA (sem demarcação de obra); "reparar" a leva ao nível 1.
      const AREAS_COM_BASE_FISICA_NO_NIVEL_0 = ['casa', 'ponte'];
      const ROTULOS_DO_NIVEL_0 = { casa: { estado: '🏠 Base', acao: 'Evoluir' }, ponte: { estado: '🌉 Quebrada', acao: 'Reparar' } };
      // Rebalanceamento: antes { padrao: 150, casa: 250, ponte: 200, plantações: 300, moinho: 400, mina: 500 } (8.4.1). A cota inicial
      // da Fazenda ficou menor (só a lavoura rende no começo), então as primeiras construções ficaram mais baratas para o aluno
      // não passar semanas sem avançar: a 2ª plantação sai em ~6 dias de visita diária e a mina em ~15.
      const CUSTO_DE_CONSTRUCAO = { padrao: 120, casa: 150, ponte: 100, plantacaoGrande: 150, novaPlantacao: 150, celeiro: 150, maquinario: 180, moinho: 200, mina: 250 };
      // Custo (XP) para sair do nível atual: a partir do 0 (tabela acima; na casa é a 1ª evolução) ou evoluir 1 → 2 e 2 → 3.
      const custoParaProximoNivel = (idDaArea, nivelAtual) => nivelAtual === 0 ? (CUSTO_DE_CONSTRUCAO[idDaArea] ?? CUSTO_DE_CONSTRUCAO.padrao) : CUSTO_PARA_PROXIMO_NIVEL[nivelAtual - 1];
      // ---- Economia integrada: MADEIRA como segundo requisito de construir e evoluir ----
      // Toda construção (nível 0 → 1) e toda evolução (1 → 2 e 2 → 3) exige XP E madeira (a madeira vem do lenhador, seção 29b).
      // Rebalanceamento: antes { padrao: 15, casa: 25, ponte: 20, plantações: 30, moinho: 40, mina: 50 } e evoluções [40, 80].
      // Na versão anterior a madeira sobrava para todos os perfis (1.830 no total contra ~3.400 coletadas por quem visita 1×/dia).
      // Agora o total é 3.455 madeiras: quem faz UMA rodada do lenhador por dia (16) leva ~216 dias de madeira, o mesmo ritmo do
      // XP, e quem faz mais rodadas (até o limite diário da ponte) avança mais rápido nas evoluções. A ponte é a construção
      // mais barata em madeira porque é ela que aumenta o limite diário de madeira (LENHADOR_CONFIG).
      const CUSTO_EM_MADEIRA_DA_CONSTRUCAO = { padrao: 30, casa: 35, ponte: 20, plantacaoGrande: 35, novaPlantacao: 35, celeiro: 50, maquinario: 55, moinho: 60, mina: 60 };
      const CUSTO_EM_MADEIRA_PARA_PROXIMO_NIVEL = [80, 150];   // posição 0 = evoluir 1 → 2 · posição 1 = evoluir 2 → 3
      const madeiraParaProximoNivel = (idDaArea, nivelAtual) => nivelAtual === 0 ? (CUSTO_EM_MADEIRA_DA_CONSTRUCAO[idDaArea] ?? CUSTO_EM_MADEIRA_DA_CONSTRUCAO.padrao) : CUSTO_EM_MADEIRA_PARA_PROXIMO_NIVEL[nivelAtual - 1];
      // ---- Fazenda 8.4.1: balanceamento da economia ----
      // As atividades publicadas pelo instrutor são a fonte PRINCIPAL de XP: cada uma vale o XP que o instrutor definir e entra por
      // window.adicionarXP (seção 32, origem 'atividades'), SEM limite. A integração escolar ainda não existe no projeto.
      // A Fazenda complementa: colheitas, ciclos da mina e monstros (origem 'fazenda') rendem no máximo limiteDiarioDeXPDaFazenda
      // por dia do calendário local; passado o limite, continuam rendendo recursos, sem XP (seção 27, creditarXP). Devoluções da
      // dispensa e as ferramentas de teste não entram no limite.
      // PROGRESSÃO DE UM ANO (premissa interna, sem depender dos valores escolares): a Fazenda SOZINHA, mesmo rendendo o limite diário
      // todos os dias, NÃO deve completar a fazenda num ano letivo (~200 dias). Construir as 13 áreas e levá-las ao nível 3 custa
      // 20.900 XP (2.700 de construções com a 1ª plantação grátis + 13 × 1.400 de evoluções) → ~209 dias no limite, ~420 dias com uma
      // visita curta por dia (~50 XP). Melhorar os trabalhadores é um gasto extra opcional (até 6.000 XP por trabalhador).
      // DEPENDE DA INTEGRAÇÃO ESCOLAR (revisar quando a plataforma definir o XP das atividades e a frequência de publicação):
      //  • limiteDiarioDeXPDaFazenda — a Fazenda deve ficar bem abaixo do XP escolar esperado por dia (sugestão: até ~1/3);
      //  • a escala dos custos — o total (Fazenda + atividades) num ano deve ficar perto de 20.900 + o que se queira de equipe.
      // ---- Rebalanceamento: COTAS DIÁRIAS POR ATIVIDADE (substituem a cota única de 100 XP) ----
      // Problema da cota única: duas plantações de abóbora rendiam 96 dos 100 XP do dia; mina, poções, monstros, equipe e evoluções
      // não acrescentavam quase nada. Agora cada atividade tem a PRÓPRIA cota, que cresce com as construções ligadas a ela:
      //   lavoura  = 12 + 6 × (nível da Grande + nível da Nova plantação)        + bônus dos fazendeiros   → colheitas
      //   mina     = LIMITE DA ALQUIMIA: 20 por dia com a mina construída (0 sem mina) → SÓ a Poção de Experiência
      //   criacao  = 2 × (soma dos níveis das 5 instalações de animais)           → produção dos animais coletada
      //   defesa   = 5                                                            + bônus dos guardas      → monstros derrotados
      // Bônus da equipe: cada trabalhador ativo (vivo e em campo) soma 3 + 1 a cada 5 níveis de melhoria (máx. 8) à cota da sua
      // especialidade (fazendeiro → lavoura · guarda → defesa). É o retorno da contratação e das melhorias.
      // Etapa da alquimia: a MINA não dá mais XP (só minérios) e não mexe nesse limite. O id 'mina' foi mantido porque está nos
      // saves (estado.cotasDoDia.usado.mina); na interface ele se chama "Limite da alquimia". Antes: 8 + 6 × nível (14/20/26),
      // dividido entre os ciclos do carrinho e três poções de XP. Agora existe UMA poção de XP (+20) e o limite é exatamente uma
      // poção por dia (20), em qualquer nível da mina: o nível da mina passa a valer pelos minérios por viagem (3/5/8) e pelas
      // receitas que libera. Simulado: o ritmo de progressão ficou praticamente igual ao anterior (fazenda completa em 258 dias
      // contra 255 no perfil regular), porque o XP que saía dos ciclos e das poções antigas é o mesmo que sai agora da poção nova.
      // Com 14 (o limite antigo do nível 1) a poção de 20 XP nunca poderia ser usada — por isso o valor precisou mudar.
      // Reserva: a cota NÃO usada de um dia fica guardada por até RESERVA_DE_COTA_EM_DIAS dia(s) (por atividade). Quem joga todo dia
      // não ganha nada a mais; quem joga em dias alternados não perde a cota dos dias em que não pôde entrar.
      // Fora das cotas (sem limite): atividades escolares (window.adicionarXP), devoluções da dispensa e ferramentas de teste.
      const COTAS_DIARIAS_DE_XP = {
        lavoura: { nome: 'Lavoura', icone: '🌾', base: 12, porNivelDePlantacao: 6, fonte: 'colheitas' },
        mina: { nome: 'Limite da alquimia', icone: '⚗️', base: 20, porNivelDaMina: 0, fonte: 'só a Poção de Experiência' },
        criacao: { nome: 'Criação', icone: '🐄', porNivelDeInstalacao: 2, fonte: 'produção dos animais' },
        defesa: { nome: 'Defesa', icone: '🛡️', base: 5, fonte: 'monstros derrotados' },
      };
      const BONUS_DA_EQUIPE_NA_COTA = { porTrabalhador: 3, niveisDeMelhoriaPorPonto: 5, maximoPorTrabalhador: 8, especialidade: { fazendeiro: 'lavoura', guarda: 'defesa' } };
      const RESERVA_DE_COTA_EM_DIAS = 1;
      const ECONOMIA_CONFIG = {
        // Só em fazendas NOVAS (saves existentes não mudam). Etapa 1 — primeira construção no primeiro dia: com 0 XP, o aluno só
        // ganhava a cota do dia (Lavoura 12 + 6 da plantação grátis + 3 do fazendeiro Juca = 21 XP) e a construção mais barata (ponte,
        // 100 XP) saía no 5º dia; o curral (120 XP + 30 madeiras), no 6º. A madeira não era o problema (80 por dia). Com 100 XP
        // iniciais, o primeiro dia rende 121: dá para UMA construção (ponte 100, ou curral e as demais instalações de animais 120
        // depois de colher a cota do dia), nunca duas (220). Nenhum preço mudou; 100 XP são 0,5% dos ~20.900 XP do ano.
        xpInicial: 100,                    // antes 0 (Etapa 1); antes da 8.4.1 final: 200. A 1ª plantação continua grátis (seção 32)
        // Total do dia = soma das cotas das atividades AGORA (cresce com as construções e a equipe). Era um número fixo (100);
        // virou um getter para quem lê o "limite diário" (tutorial, painéis) mostrar sempre o valor real. Calculado na seção 27.
        get limiteDiarioDeXPDaFazenda() { return typeof somaDasCotasDiarias === 'function' ? somaDasCotasDiarias() : 0; },
      };
      // Capacidade de trabalhadores da casa por nível (índice 0 = base). O fazendeiro inicial ocupa uma vaga; trabalhadores
      // mortos continuam na equipe (ocupam vaga) até serem recuperados ou dispensados.
      const CAPACIDADE_DE_TRABALHADORES_POR_NIVEL_DA_CASA = [1, 2, 3, 4];

      // ---- Plantações (Grande e Nova): culturas, tempo de crescimento (minutos reais), colheita e canteiros ----
      const CULTURAS = {
        // Rebalanceamento: antes trigo 6 min/1 XP, milho 8/2, cenoura 10/2, abóbora 15/4. A abóbora era a melhor por minuto
        // (0,27 XP/min) E por visita (4 XP): nenhuma outra cultura fazia sentido. Agora:
        //   XP por minuto de crescimento → trigo 0,20 · milho 0,25 · cenoura 0,17 · abóbora 0,15 (milho é o melhor jogando ativo)
        //   XP por colheita              → abóbora 3 · milho/cenoura 2 · trigo 1   (abóbora é a melhor para quem volta só no dia seguinte)
        //   alimento por colheita        → trigo 4 × 12 = 48 · milho 3 × 15 = 45 · cenoura 45 · abóbora 2 × 30 = 60
        // e cada animal prefere culturas diferentes (ANIMAIS_DAS_AREAS): a escolha depende de como e para que o aluno joga.
        trigo: { nome: 'Trigo', icone: '🌾', minutosParaCrescer: 5, colheita: 4, xp: 1 },
        milho: { nome: 'Milho', icone: '🌽', minutosParaCrescer: 8, colheita: 3, xp: 2 },
        cenoura: { nome: 'Cenoura', icone: '🥕', minutosParaCrescer: 12, colheita: 3, xp: 2 },
        abobora: { nome: 'Abóbora', icone: '🎃', minutosParaCrescer: 20, colheita: 2, xp: 3 },
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
        custoParaReporAnimal: 60,         // XP para repor cada animal morto (rebalanceamento: antes 100, e 40 antes da 8.4.1); ~metade de uma instalação
        limiteDeTempoAusenteHoras: 8,     // tempo com a página fechada conta até este limite (evita perdas enormes de uma vez)
        avisoDeFomeAbaixoDe: 25,          // % do cocho a partir do qual o jogador é avisado
      };
      // ---- Função das construções que antes eram só decorativas (rebalanceamento; aplicadas nas seções 27 e 29b) ----
      // Todas têm relação com o que representam e nenhuma cria recurso infinito: o que elas aumentam continua preso às cotas
      // diárias, ao limite de madeira ou à comida que o próprio aluno colhe.
      const FUNCOES_DAS_CONSTRUCOES = {
        // Celeiro: guarda feno e ração — o cocho cheio dura mais (6 h → 7,5 / 9 / 10,5 h). Mais horas alimentados = mais produção.
        celeiro: { duracaoDoCochoPorNivel: 0.25 },
        // Moinho de pedra: mói trigo e milho — cada unidade desses grãos rende mais comida no cocho (+25% por nível).
        moinho: { alimentoDosGraosPorNivel: 0.25, graos: ['trigo', 'milho'] },
        // Maquinário: o trator e o arado aumentam a colheita — +1 unidade por canteiro colhido por nível (só recurso, não XP).
        maquinario: { colheitaExtraPorNivel: 1 },
        // Ponte: com a travessia reforçada, o lenhador entrega mais madeira por dia (80 / 96 / 112 / 128, mais a reserva de 1 dia) e tira
        // mais madeira de cada árvore (LENHADOR_CONFIG.madeiraPorArvorePorNivelDaPonte). Antes: 40/48/56/64 (etapa da alquimia) e 24/32/40/48.
        ponte: { madeiraDiariaBase: 80, madeiraDiariaPorNivel: 16 },   // limite diário de madeira: 80 / 96 / 112 / 128 (+20% por nível, como antes)
      };
      // Produção dos animais: cada animal VIVO produz 1 item a cada horasPorProduto horas em que o cocho tem comida (também com a
      // página fechada, dentro de limiteDeTempoAusenteHoras). Os itens ficam guardados na instalação (até maximoPorAnimal por
      // animal) e o aluno os COLETA no painel 🌾 Fazenda: cada item vale xpPorProduto XP na cota de Criação. O que não couber na
      // cota de hoje continua guardado. Nada é produzido sem comida, então a produção depende das colheitas (e do celeiro/moinho).
      const PRODUCAO_DOS_ANIMAIS = {
        horasPorProduto: 6, xpPorProduto: 1, maximoPorAnimal: 4,
        produtos: { curral: { nome: 'leite', icone: '🥛' }, ovelhal: { nome: 'lã', icone: '🧶' }, estabulo: { nome: 'adubo', icone: '🪣' }, galinheiro: { nome: 'ovos', icone: '🥚' }, chiqueiro: { nome: 'trufas', icone: '🍄' } },
      };
      // ---- Mineração (carrinho nos trilhos da caverna) ----
      const MINERACAO_CONFIG = {
        minutosMinerando: 40,                         // intervalo das recompensas informado no pedido da Mark 8.2
        // Etapa da alquimia: a mina entrega SOMENTE minérios (antes [3, 4, 5] XP por viagem, e [20, 35, 50] antes disso). O XP
        // vem da Poção de Experiência, preparada com esses minérios. A chave continua existindo (zerada) porque o tutorial a lê.
        xpPorCicloPorNivel: [0, 0, 0],
        mineriosPorCicloPorNivel: [3, 5, 8],
        velocidadeDoCarrinhoPorNivel: [1.6, 2.0, 2.4], // unidades por segundo nos trilhos
        segundosDescarregando: 4,
        profundidadeDeEscurecimento: 2.2,             // distância dentro da caverna em que o carrinho escurece até sumir
      };
      // ---- Guardião da Mina: ALQUIMIA (seção 28b) e efeitos das poções (seção 28c) ----
      // Economia: mina → minérios → poções. A mina NÃO dá XP. Das 9 poções, só a de EXPERIÊNCIA concede XP (+20) e só ela usa o
      // LIMITE DA ALQUIMIA (COTAS_DIARIAS_DE_XP.mina: 20 por dia = uma poção). As outras 8 dão efeitos e nunca tocam no limite:
      // podem ser preparadas e usadas com o limite cheio. Nenhum efeito cria XP fora das cotas das atividades (lavoura, criação,
      // defesa) nem passa dos limites já existentes (madeira por dia, itens guardados por animal, estágios das plantas).
      // Faixa de cada receita = nível mínimo da mina: COMUNS (nível 1), AVANÇADAS (nível 2), ESPECIAIS (nível 3).
      // PREÇOS (em minérios) — auditoria da Etapa 1.1. Base: 1 viagem = 3 / 5 / 8 minérios (mina nível 1 / 2 / 3). A Poção de
      // Experiência usa no máximo 8 minérios por dia (o Limite é uma poção); o resto é a SOBRA de minério, e é ela que paga as
      // poções de efeito. Hipótese das simulações: quem joga todo dia faz 2 viagens (uma volta com a página fechada, outra durante
      // a visita) → sobra de ~2 minérios/dia na mina nível 2 e ~8 na mina nível 3. Comuns ≈ 1 dia de sobra, avançadas ≈ 1,5 a 6 dias
      // (nível 2), especiais ≈ 2 a 3 dias (nível 3): poções fortes continuam sendo uma escolha, não um gasto automático.
      // Efeitos com duração usam o relógio do jogo (agoraNoJogo) e ficam salvos (estado.efeitosDasPocoes). O MESMO efeito não pode
      // ser usado de novo enquanto está ativo (não acumula nem renova); efeitos diferentes podem valer juntos.
      // Ids salvos em estado.pocoes: não os renomeie. Os ids antigos (tonico, elixir, essencia) são convertidos de volta em minérios
      // ao carregar um save antigo (seção 05).
      const CATEGORIAS_DE_POCOES = {
        comum: { nome: 'Comum', plural: 'Comuns', icone: '🟢', nivelDaMina: 1 },
        avancada: { nome: 'Avançada', plural: 'Avançadas', icone: '🔵', nivelDaMina: 2 },
        especial: { nome: 'Especial', plural: 'Especiais', icone: '🟣', nivelDaMina: 3 },
      };
      const POCOES_DO_GUARDIAO = {
        // ---- COMUNS (mina nível 1) ----
        // A única poção de XP. 8 minérios → 20 XP = 2,5 XP/minério (as antigas rendiam 1,7 a 2,1 XP/minério, mas a mina também dava
        // 3 a 5 XP por viagem; somando os dois, o XP por minério ficou quase igual). Com 6 minérios a fazenda ficava ~3% mais
        // rápida no simulador; com 10, ~4% mais lenta: 8 mantém o ritmo.
        experiencia: { nome: 'Poção de Experiência', icone: '⭐', cor: '#e0b04a', categoria: 'comum', minerios: 8, nivelMinimoDaMina: 1, xp: 20,
          efeito: 'Concede +20 XP na hora.', duracao: 'Instantânea · usa o Limite da alquimia',
          descricao: 'Dourada e morna. A única receita que transforma minério em experiência.' },
        vitalidade: { nome: 'Tônico da Vitalidade', icone: '❤️', cor: '#e0585a', categoria: 'comum', minerios: 4, nivelMinimoDaMina: 1, xp: 0, instantanea: true,
          efeito: 'Cura na hora todos os trabalhadores vivos até a vida máxima.', duracao: 'Instantânea · não revive quem caiu',
          descricao: 'Para depois de uma noite difícil: a equipe volta inteira ao trabalho.' },
        // Etapa 1.1: 60 min → 6 h. Em 1 h o cocho economizava ~8 de comida por instalação (menos de 1 trigo): o efeito não se notava.
        // Em 6 h ele cobre uma ausência (o cocho cheio dura 6 a 10,5 h e o tempo fechado conta até 8 h).
        racao: { nome: 'Ração Encantada', icone: '🌾', cor: '#d9a441', categoria: 'comum', minerios: 5, nivelMinimoDaMina: 1, xp: 0, minutos: 360, consumoDoCocho: 0.5,
          efeito: 'O cocho de todas as instalações gasta METADE da comida.', duracao: '6 h',
          descricao: 'Um punhado no cocho e os animais ficam satisfeitos com menos.' },
        // ---- AVANÇADAS (mina nível 2) ----
        seiva: { nome: 'Seiva da Floresta', icone: '🌲', cor: '#3f9a5a', categoria: 'avancada', minerios: 10, nivelMinimoDaMina: 2, xp: 0, instantanea: true,
          efeito: 'As árvores do acampamento que estão rebrotando voltam na hora.', duracao: 'Instantânea · o limite diário de madeira continua valendo',
          descricao: 'Regada nos tocos, faz a floresta do lenhador crescer de novo num instante.' },
        // Etapa 2: a POÇÃO MISTERIOSA (id 'misteriosa', neutro de propósito: aparece no HTML) ocupa o lugar do Elixir da Fertilidade (que saiu do catálogo; saves antigos
        // recebem de volta os 12 minérios de cada elixir guardado, seção 05). Tudo nela aparece como "???" na interface, menos o
        // custo. Só pode ser usada UMA vez por jogador (estado.eventosEspeciais.misterio) e o "efeito" é o evento do céu (30c).
        // Não dá XP e não toca no Limite. Preço: 60 minérios ≈ 7 a 30 dias da sobra de minério (ver PREÇOS acima): uma curiosidade
        // cara de propósito, que só aparece para quem acumula minério.
        misteriosa: { nome: 'Poção Misteriosa do Unicórnio', icone: '🦄', cor: '#c9b8ff', categoria: 'especial', minerios: 60, nivelMinimoDaMina: 1, xp: 0,
          instantanea: true, misteriosa: true, usoUnico: true,
          efeito: 'Faz um unicórnio atravessar o céu da fazenda, deixando um arco-íris.', duracao: 'Uma vez só',
          descricao: 'Ninguém sabe o que acontece. O Guardião diz que é melhor olhar para o céu.' },
        bravura: { nome: 'Poção da Bravura', icone: '🛡️', cor: '#c8553d', categoria: 'avancada', minerios: 10, nivelMinimoDaMina: 2, xp: 0, minutos: 10, dano: 2, danoRecebido: 0.5,
          efeito: 'A equipe causa o DOBRO de dano e recebe METADE do dano dos monstros.', duracao: '10 min',
          descricao: 'Coragem engarrafada para as noites de monstros e as invasões.' },
        // ---- ESPECIAIS (mina nível 3) ----
        // Etapa 1.1: Aceleração 24 → 16 e Crescimento 30 → 20. O jogador pode colher todos os canteiros na hora ("Colher tudo") e as
        // plantas crescem com a página fechada, então as duas economizam TEMPO dentro de uma visita, mas não aumentam o XP (a cota de
        // Lavoura costuma encher com uma colheita). O preço antigo (3 a 4 dias de sobra de minério) era alto para esse ganho.
        aceleracao: { nome: 'Poção da Aceleração dos Trabalhadores', icone: '⚡', cor: '#ff8c1a', categoria: 'especial', minerios: 16, nivelMinimoDaMina: 3, xp: 0, minutos: 2, colheita: 8, caminhada: 2,
          efeito: 'Os trabalhadores colhem 8× mais rápido e andam 2× mais rápido.', duracao: 'Exatamente 2 min',
          descricao: 'Raio em garrafa: a equipe vira um borrão pela plantação. Planeje antes de beber.' },
        crescimento: { nome: 'Poção do Crescimento Acelerado', icone: '🌱', cor: '#7ed957', categoria: 'especial', minerios: 20, nivelMinimoDaMina: 3, xp: 0, minutos: 5, crescimento: 6,
          efeito: 'As plantações crescem 6× mais rápido (5 min de efeito = 30 min de crescimento).', duracao: '5 min · todos os canteiros plantados',
          descricao: 'Passa pelos mesmos estágios (semente, broto, crescendo, pronto): só que muito mais depressa.' },
        serenidade: { nome: 'Poção da Noite Serena', icone: '🌙', cor: '#6c7fd8', categoria: 'especial', minerios: 26, nivelMinimoDaMina: 3, xp: 0, minutos: 10,
          efeito: 'Nenhum monstro noturno novo aparece perto da equipe.', duracao: '10 min · não afeta as invasões',
          descricao: 'Um perfume que os monstros da noite detestam. Os que já estão por perto continuam.' },
      };
      // ---- Lenhador (seção 29b): independente da equipe, trabalha só no próprio acampamento depois da ponte ----
      // Poucas árvores coletáveis de propósito: a floresta principal continua instanciada e otimizada; só estes pontos do
      // acampamento têm estado interativo. O tempo de rebrota usa o relógio do jogo (agoraNoJogo) e fica salvo por árvore.
      // Etapa 1.1 (auditoria da madeira): o total para levar tudo ao nível 3 é 3.455 madeiras. Com o limite de 40 a 64 por dia, o
      // jogador que aproveita o limite todo dia juntava ~4.800 madeiras SOBRANDO ao terminar as construções (estoque de até 8.300):
      // a madeira não pesava em nenhuma decisão. O rendimento por árvore (8 / 8 / 9 / 10) foi mantido (uma rodada de 4 árvores já
      // cobre o dia: pouca repetição) e o LIMITE diário passou a 20 / 24 / 28 / 32, com reserva de 1 dia (regra das cotas de XP)
      // para o jogador casual não perder a madeira dos dias em que não entrou. Simulado: os três perfis terminam as construções no
      // MESMO dia de antes (presos pelo XP) e sobram ~430 a ~700 madeiras (12% a 20% do total) em vez de ~4.800.
      // A rebrota (20 min) e o tempo de corte foram mantidos. (Correção do lenhador: 10 árvores e limite 80 / 96 / 112 / 128; ver abaixo.)
      const LENHADOR_CONFIG = {
        madeiraPorArvorePorNivelDaPonte: [8, 8, 9, 10],   // índice = nível da ponte (0 = quebrada)
        // Madeira creditada UMA vez, quando a árvore cai. Getter: acompanha o nível atual da ponte.
        get madeiraPorArvore() {
          const nivelDaPonte = typeof estado === 'object' && estado && estado.niveis ? Math.min(3, estado.niveis.ponte | 0) : 0;
          return this.madeiraPorArvorePorNivelDaPonte[nivelDaPonte];
        },
        segundosDeCorte: 6,                  // golpes de machado antes da queda
        segundosDaQueda: 1.4,                // animação da árvore tombando
        minutosParaRebrotar: 20,             // a árvore volta a ficar disponível depois disso (tempo real, salvo)
        // Limite diário de madeira (por dia do calendário local): depende do nível da PONTE (FUNCOES_DAS_CONSTRUCOES.ponte):
        // 80 / 96 / 112 / 128 nos níveis 0 / 1 / 2 / 3, mais a reserva de 1 dia (seção 29b). Getter: quem lê sempre recebe o valor atual.
        // Correção do lenhador: antes 20 / 24 / 28 / 32 com 4 árvores. Algumas construções pedem 35+ madeiras e o jogador esperava
        // vários dias para uma só. Agora são 10 árvores × 8 madeiras = 80 por rodada, o mesmo que o limite da ponte nível 0.
        get limiteDiarioDeMadeira() {
          const nivelDaPonte = typeof estado === 'object' && estado && estado.niveis ? estado.niveis.ponte | 0 : 0;
          return FUNCOES_DAS_CONSTRUCOES.ponte.madeiraDiariaBase + FUNCOES_DAS_CONSTRUCOES.ponte.madeiraDiariaPorNivel * nivelDaPonte;
        },
        velocidadeDeCaminhada: 1.7,          // unidades por segundo dentro do acampamento
      };
      // ---- Trabalhadores: classes, faixas dos atributos-base (sorteados por candidato), custos e modificadores ----
      // velocidade = unidades/s ao andar · vidaMaxima = pontos de vida · precisao = % de chance de acertar um golpe ·
      // dano = pontos por golpe · velocidadeDeTarefa = rapidez para executar tarefas (colheita).
      // eficienciaDeColheita é o modificador da CLASSE (especialização): multiplica a rapidez da colheita.
      const CLASSES_DE_TRABALHADORES = {
        // Rebalanceamento: fazendeiro antes 300/150 e guarda 500/250 (contratação/recuperação); na 8.4 eram 120/60 e 200/100.
        // Agora cada trabalhador ativo AUMENTA a cota diária da sua especialidade (BONUS_DA_EQUIPE_NA_COTA): a contratação se paga.
        fazendeiro: { nome: 'Fazendeiro', icone: '🧑‍🌾', custo: 250, custoDeRecuperacao: 125,
          atributos: { velocidade: [2.0, 2.4], vidaMaxima: [95, 115], precisao: [45, 60], dano: [7, 10], velocidadeDeTarefa: [1.1, 1.3] },
          eficienciaDeColheita: 1.5, alcance: 1.3, segundosEntreAtaques: 1.2, raioDeDefesa: 8, colheDeNoite: true, aceleracaoDaLavoura: 0.06,
          descricao: 'Colhe 1,5× mais rápido; luta para se defender e defender a equipe por perto.' },
        guarda: { nome: 'Guarda', icone: '🛡️', custo: 350, custoDeRecuperacao: 175,
          atributos: { velocidade: [1.75, 2.0], vidaMaxima: [170, 210], precisao: [75, 90], dano: [14, 18], velocidadeDeTarefa: [0.8, 1.0] },
          eficienciaDeColheita: 0.8, alcance: 1.6, segundosEntreAtaques: 1.0, raioDeDefesa: 18, colheDeNoite: false, aceleracaoDaLavoura: 0,
          descricao: 'Mais vida, precisão e dano; persegue monstros. Também colhe (mais devagar), durante o dia.' },
      };
      // Fazendeiro inicial: já pertence ao jogador, atributos baixos, concedido UMA única vez por jogo (estado.fazendeiroInicialConcedido).
      const FAZENDEIRO_INICIAL = { nome: 'Juca', classe: 'fazendeiro', velocidade: 1.9, vidaMaxima: 85, precisao: 40, dano: 6, velocidadeDeTarefa: 1.0 };
      // Melhorias com XP: cada atributo sobe até nivelMaximo (custo do próximo nível em custoPorNivel) e vale na hora no jogo.
      const MELHORIAS_DOS_TRABALHADORES = {
        // Rebalanceamento: antes [80, 140, 220, 320, 440] = 6.000 XP por trabalhador (mais que todas as construções juntas) e sem
        // retorno em XP. Agora 325 XP por atributo, 1.625 por trabalhador, e cada 5 níveis somados dão +1 na cota da especialidade.
        nivelMaximo: 5, custoPorNivel: [25, 40, 60, 85, 115],
        atributos: {
          velocidade: { nome: 'Velocidade', icone: '⚡', incremento: 0.15, casas: 2 },
          vidaMaxima: { nome: 'Vida', icone: '❤', incremento: 20, casas: 0 },
          precisao: { nome: 'Precisão', icone: '🎯', incremento: 4, casas: 0, maximo: 98 },
          dano: { nome: 'Dano', icone: '⚔', incremento: 2, casas: 0 },
          velocidadeDeTarefa: { nome: 'Tarefa', icone: '🧺', incremento: 0.12, casas: 2 },
        },
        // dispensar devolve 40% do XP investido (mínimo 10 XP, nunca acima do investido); sem XP investido (ex.: o Juca) devolve 0
        fracaoDevolvidaAoDispensar: 0.4, recompensaMinimaAoDispensar: 10,
      };
      const TRABALHADORES_CONFIG = {
        // candidatosNoMenu: sempre há pelo menos um de cada classe entre eles (seção 29, garantirCandidatos).
        // vidaRecuperadaPorMinutoEmCasa: quem foi mandado para casa recupera vida a qualquer hora (em campo, só de dia).
        candidatosNoMenu: 3, vidaRecuperadaPorMinutoDeDia: 10, vidaRecuperadaPorMinutoEmCasa: 20, segundosCaidoAntesDeSumir: 4, xpPorMonstroDerrotado: 5, segundosEntreDecisoes: 0.25,
        // Mark 8.3: trabalhadores só colhem quando o JOGADOR manda (um canteiro ou a plantação inteira). Com true, voltariam a
        // procurar canteiros maduros sozinhos quando ociosos (comportamento da 8.2, que parecia "colher sem parar").
        colheitaEspontanea: false,
        nomes: ['Aninha', 'Arrascaeta', 'Carlinhos', 'Dora', 'Eita', 'Lule', 'Gina', 'Harry', 'Yasmin', 'Jão', 'Liamey', 'Kamala', 'Nico B', 'Cardi B', 'Zé Gota', 'Ui', 'Jimmy', 'Téo', 'Lisa', 'Zeca Urubu'],
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

      // ---- Etapa 2: eventos especiais (seção 30c) ----
      // UNICÓRNIO: tempos da cena (segundos reais). A câmera sobe, o unicórnio atravessa o céu, o arco-íris fica um pouco e a câmera
      // volta. A música é opcional: AUDIO_CONFIG.segredos.unicornio (seção 02b); sem o arquivo, a cena roda em silêncio.
      // ABDUÇÃO ALIENÍGENA: análise da frequência. O calendário das invasões está pausado (seção 04) e os únicos eventos
      // recorrentes são os monstros, a cada noite de 10 min de jogo. Para a abdução ser RARA e nunca seguida, ela é sorteada só
      // enquanto o aluno está jogando (página visível), uma vez a cada 10 min de jogo, com 2% de chance, e nunca antes de 72 h
      // reais desde a última. Quem joga 1 h por dia faz 6 sorteios/dia → 1 − 0,98⁶ ≈ 11% ao dia → em média uma abdução a cada
      // ~12 dias (3 de intervalo + ~9 de espera). Quem joga 20 min, 3×/semana → ~2 sorteios por visita → ~1 a cada 2 meses.
      // Só acontece com o curral construído e uma vaca no curral, no máximo 1 vaca por vez (nunca com outra ainda fora), e nunca durante uma cena,
      // uma invasão, o tutorial ou com painéis de tela cheia abertos. A vaca levada VOLTA sozinha em 20 s (Etapa 1), sem custo.
      const EVENTOS_ESPECIAIS_CONFIG = {
        unicornio: { segundosDaSubida: 2.8, segundosDoVoo: 12, segundosDoArcoIris: 4.5, segundosDaVolta: 2.8, escala: 3.8 },
        // Etapa 1: a abdução virou TEMPORÁRIA. A vaca volta sozinha segundosParaVoltar depois de ser levada (sem custo) e nenhuma vaca
        // se perde. Por isso o mínimo caiu de 2 para 1 vaca: o evento acontece com o curral construído em qualquer nível (nível 1 = 1
        // vaca). Raridade, intervalo de 72 h e regras de segurança continuam iguais.
        abducao: { minutosDeJogoEntreSorteios: 10, chancePorSorteio: 0.02, horasDeIntervaloMinimo: 72, vacasMinimas: 1, segundosParadoParaFocar: 10, segundosParaVoltar: 20 },
        // Etapa 2 (corrigida) — EASTER EGG DO ET: clicar numa vaca pode fazer o ET ABDUZI-LA (a vaca sai de verdade do curral e volta
        // depois do mesmo prazo de 20 s da abdução normal; nada é gasto ou ganho). Intervalo mínimo entre aparições em minutos de relógio
        // real (salvo no save) e chance por clique elegível, para não acontecer em todo clique. A 1ª descoberta conclui um objetivo secreto.
        et: { minutosEntreAparicoes: 30, chancePorClique: 0.35, segundosDaCena: 9.5 },   // segundosDaCena = duração da animação da abdução (a vaca volta pelo mesmo prazo de 20 s da abdução normal)
      };

      arquivoDaMontagemConcluido('01-configuracoes-gerais.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
