      // ====================================================================================================
      // FARMEDU 3D — 02-configuracao-do-dia-e-da-noite.js (Fase 3B da refatoração: seção 02)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================
      // ====================================================================================================
      // SEÇÃO 02 — CONFIGURAÇÃO DO CICLO DE DIA E NOITE
      // Duração do ciclo, hora inicial, horas dos modos "Dia fixo"/"Noite fixa", quantidade de luzes reais e ajustes da iluminação noturna.
      // ====================================================================================================
      const DURACAO_DO_CICLO_SEGUNDOS = 600;          // ← duração de um dia completo (dia + noite) em segundos reais. 600 = 10 minutos.
      const HORA_INICIAL_DO_CICLO = 8.5;              // hora do relógio do jogo (0–24) em que a fazenda começa
      const HORA_DIA_FIXO = 12, HORA_NOITE_FIXA = 0;  // horas usadas pelos modos "Dia fixo" e "Noite fixa"
      const VELOCIDADE_MAXIMA_DE_TRANSICAO = 3;       // horas de jogo por segundo real ao ir para dia/noite fixos (movimento suave, sem salto)
      const INTERVALO_DE_QUADROS_DA_SOMBRA = 2;       // Mark 8.2: o mapa de sombras é redesenhado a cada 2 quadros (o sol anda devagar; metade do custo das sombras)
      const LUZES_DINAMICAS_DOS_POSTES = 8;           // luzes de ponto reais COMPARTILHADAS por postes e lampiões das construções (as demais lanternas usam halo e brilho no chão, mais leves)
      // Modo Leve (seção 21): preferência salva no navegador. Lido aqui, logo no início, para que as luzes (seção 20) e o resto
      // da montagem já respeitem a escolha do jogador desde o primeiro quadro.
      const CHAVE_DO_MODO_LEVE = 'fazenda3d-modo-leve-v1';
      const MODO_LEVE = {
        ativo: (() => { try { return localStorage.getItem(CHAVE_DO_MODO_LEVE) === 'ligado'; } catch (erro) { return false; } })(),
        limiteDePixelRatio: 1,           // resolução máxima de renderização no Modo Leve (1 pixel do canvas por pixel CSS)
        reforcoDosBrilhos: 1.35,         // sem as luzes reais, halos e manchas de luz no chão ficam um pouco mais fortes à noite
      };
      // Iluminação artificial noturna (seção 20). Só existem duas luzes dedicadas além das compartilhadas: a da casa e a dos faróis do trator.
      // Todas acendem com o mesmo fator do ciclo (0 de dia → 1 à noite), então dia e noite continuam bem diferentes.
      const ILUMINACAO_NOTURNA = {
        forcaDosLampioes: 0.8,          // intensidade relativa da luz real quando ela acompanha um lampião de construção (poste = 1)
        luzDaCasa: { cor: 0xffb565, intensidade: 1.25, alcance: 9 },              // luz quente que "sai" pela porta e pelas janelas da casa
        intensidadeDasJanelas: 1,
      brilhoDaPlacaANoite: 0.6,       // brilho próprio do texto da placa de boas-vindas à noite (legibilidade sem estourar)       // brilho máximo (emissivo) das janelas da casa à noite
        farois: { cor: 0xfff1d6, intensidade: 2.4, alcance: 17, abertura: 0.42 }, // faróis do trator (luz de foco apontada para a frente)
      };

      arquivoDaMontagemConcluido('02-configuracao-do-dia-e-da-noite.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
