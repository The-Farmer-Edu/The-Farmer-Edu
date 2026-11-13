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
      // ---- Etapa 0 (desempenho): níveis de qualidade gráfica ----
      // O antigo "Modo Leve" virou o nível BAIXO: MODO_LEVE.ativo continua existindo e vale true só no nível baixo, então tudo o
      // que já respeitava o Modo Leve (luzes reais da noite, brilhos reforçados, nuvens baixas, teto de monstros) segue igual.
      // Os números de cada nível saíram das medições da Etapa 0 (docs/DESEMPENHO-DA-FAZENDA.md).
      //  limiteDePixelRatio: pixels do canvas por pixel CSS (no máximo) · escalaDaResolucao: fração extra da resolução interna
      //  antialias: suavização de bordas (MSAA); só muda ao recarregar, porque é escolhida ao criar o renderizador
      //  mapaDeSombra / quadrosEntreSombras: resolução do mapa de sombras e de quantos em quantos quadros ele é redesenhado
      //  tipoDeSombra: "suave" (PCF, várias leituras por pixel, bordas suaves) ou "simples" (uma leitura, bordas mais duras).
      //  Etapa 0b: a sombra "simples" era ~30% mais rápida, mas sumia de dia e serrilhava à noite (capturas comparadas): o médio
      //  voltou à "suave". O que diferencia o médio do alto é o mapa menor e a resolução limitada a 1 pixel por pixel CSS.
      //  orcamentoDePixels: teto de pixels desenhados por quadro (protege telas muito grandes)
      //  luzesDosPostes / luzDaCasa / luzDosFarois: luzes reais acesas À NOITE (de dia ficam desligadas em todos os níveis: com
      //  intensidade 0 elas não mudam a imagem, mas cada uma ainda custava ~2–3% do quadro). Halos e brilhos no chão existem sempre.
      //  Etapa 0b (revisão visual): o baixo agora usa resolução 100% e MSAA nativo. Medido: 80% sem suavização ficava borrado e
      //  serrilhado; FXAA borrava placas e texturas; o MSAA nativo custou o mesmo que o FXAA (38,9 × 38,8 FPS) com imagem nítida.
      const NIVEIS_DE_QUALIDADE = {
        baixo: { nome: 'Baixa', limiteDePixelRatio: 1, escalaDaResolucao: 1, antialias: true, sombras: false, tipoDeSombra: 'simples', mapaDeSombra: 1024, quadrosEntreSombras: 4, orcamentoDePixels: 1920 * 1080, luzesDosPostes: 3, luzDaCasa: true, luzDosFarois: false },
        medio: { nome: 'Média', limiteDePixelRatio: 1, escalaDaResolucao: 1, antialias: true, sombras: true, tipoDeSombra: 'suave', mapaDeSombra: 1024, quadrosEntreSombras: 3, orcamentoDePixels: 1920 * 1080, luzesDosPostes: LUZES_DINAMICAS_DOS_POSTES, luzDaCasa: true, luzDosFarois: true },
        alto: { nome: 'Alta', limiteDePixelRatio: 2, escalaDaResolucao: 1, antialias: true, sombras: true, tipoDeSombra: 'suave', mapaDeSombra: 2048, quadrosEntreSombras: 2, orcamentoDePixels: 3840 * 2160, luzesDosPostes: LUZES_DINAMICAS_DOS_POSTES, luzDaCasa: true, luzDosFarois: true },
      };
      const ORDEM_DOS_NIVEIS = ['baixo', 'medio', 'alto'];
      const CHAVE_DA_QUALIDADE_GRAFICA = 'fazenda3d-qualidade-v1';
      // Avaliação inicial do modo Automático (só quando ainda não há um nível medido salvo). NÃO usa o nome da placa nem o número
      // de núcleos: usa o aviso do próprio navegador de que o 3D vai rodar num caminho lento (failIfMajorPerformanceCaveat), o
      // tipo do renderizador (rasterização por software, quando o navegador informa) e a memória do aparelho, quando disponível.
      // É só o ponto de partida: durante a partida o monitor (seção 30d) mede os quadros de verdade e ajusta com limites.
      const avaliarAparelhoNaAbertura = function avaliarAparelhoNaAbertura() {
        const pistas = []; let nivel = 'medio';
        try {
          const teste = document.createElement('canvas'), contexto = teste.getContext('webgl');
          if (!contexto) { pistas.push('sem WebGL comum'); nivel = 'baixo'; }
          else {
            const extensao = contexto.getExtension('WEBGL_debug_renderer_info');
            const descricao = String(extensao ? contexto.getParameter(extensao.UNMASKED_RENDERER_WEBGL) : contexto.getParameter(contexto.RENDERER));
            if (/swiftshader|basic render|llvmpipe|softpipe|software|warp/i.test(descricao)) { pistas.push('rasterização por software'); nivel = 'baixo'; }
            const perda = contexto.getExtension('WEBGL_lose_context'); if (perda) perda.loseContext();
            const lento = document.createElement('canvas').getContext('webgl', { failIfMajorPerformanceCaveat: true });
            if (!lento) { pistas.push('o navegador avisou que o 3D é lento neste aparelho'); nivel = 'baixo'; }
            else { const perdaDoLento = lento.getExtension('WEBGL_lose_context'); if (perdaDoLento) perdaDoLento.loseContext(); }
          }
        } catch (erro) { pistas.push('teste do WebGL falhou'); nivel = 'baixo'; }
        if (navigator.deviceMemory && navigator.deviceMemory <= 2) { pistas.push('memória ≤ 2 GB'); nivel = 'baixo'; }
        return { nivel, pistas };
      };
      const QUALIDADE_GRAFICA = (() => {
        let salvo = null;
        try { salvo = JSON.parse(localStorage.getItem(CHAVE_DA_QUALIDADE_GRAFICA) || 'null'); } catch (erro) { salvo = null; }
        let escolha = salvo && ['auto', ...ORDEM_DOS_NIVEIS].includes(salvo.escolha) ? salvo.escolha : null;
        if (!escolha) escolha = MODO_LEVE.ativo ? 'baixo' : 'auto';   // quem já usava o Modo Leve continua no nível baixo
        const detectado = salvo && NIVEIS_DE_QUALIDADE[salvo.detectado] ? salvo.detectado : null;
        const qualidade = {
          escolha,                                   // 'auto' | 'baixo' | 'medio' | 'alto' (o que o jogador escolheu)
          atual: escolha,                            // nível aplicado agora ('baixo' | 'medio' | 'alto')
          detectado,                                 // último nível que o Automático considerou estável neste aparelho
          escalaAutomatica: salvo && typeof salvo.escalaAutomatica === 'number' ? Math.min(1, Math.max(0.9, salvo.escalaAutomatica)) : null,
          teto: salvo && NIVEIS_DE_QUALIDADE[salvo.teto] ? salvo.teto : 'alto',   // nível mais alto que o Automático ainda pode tentar
          pistas: [],
        };
        if (escolha === 'auto') {
          if (detectado) qualidade.atual = detectado;
          else { const avaliacao = avaliarAparelhoNaAbertura(); qualidade.atual = avaliacao.nivel; qualidade.pistas = avaliacao.pistas; }
        }
        qualidade.antialiasNaAbertura = NIVEIS_DE_QUALIDADE[qualidade.atual].antialias;   // fixo até recarregar a página
        return qualidade;
      })();
      MODO_LEVE.ativo = QUALIDADE_GRAFICA.atual === 'baixo';
      const perfilDaQualidade = () => NIVEIS_DE_QUALIDADE[QUALIDADE_GRAFICA.atual];
      // Escala da resolução interna: no nível baixo o Automático pode reduzir só até 0,9 (e voltar a 1): abaixo disso a imagem
      // fica borrada (medido na Etapa 0b), então a nitidez tem prioridade sobre os últimos quadros por segundo.
      const escalaDaResolucaoAtual = () => QUALIDADE_GRAFICA.atual === 'baixo' && QUALIDADE_GRAFICA.escolha === 'auto' && QUALIDADE_GRAFICA.escalaAutomatica ? QUALIDADE_GRAFICA.escalaAutomatica : perfilDaQualidade().escalaDaResolucao;
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
