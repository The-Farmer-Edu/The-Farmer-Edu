    // ====================================================================================================
    // FARMEDU 3D — fazenda em Three.js (HTML + CSS + JavaScript, arquivo único)
    //
    // COMO LER ESTE ARQUIVO
    //  • As seções abaixo estão na ORDEM DE EXECUÇÃO: cada uma só usa o que foi definido nas anteriores.
    //    (Por isso as seções não podem ser reordenadas sem verificar as dependências.)
    //  • A seção 00 roda imediatamente (tela de carregamento). As seções 01 a 33 ficam dentro de iniciarFarmEdu(), executada uma
    //    única vez; entre as etapas há pausas curtas ("await carregamento.etapa") para a barra de progresso ser desenhada.
    //  • Dentro das funções, "grupo" é o objeto 3D pai; posicaoX/posicaoZ são coordenadas no mapa (Y é a altura).
    //  • Procure o número da seção para ir direto ao sistema desejado.
    //  • Os caminhos dos arquivos de áudio ficam em AUDIO_CONFIG, no bloco "CONFIGURAÇÃO DOS ÁUDIOS" logo depois da seção 02.
    //  • Posição e tamanho da praça central: PRACA_CENTRAL (seção 09). Ajustes da iluminação noturna: ILUMINACAO_NOTURNA (seção 02).
    //  • Modo Leve (desempenho gráfico): estado em MODO_LEVE (seção 02), aplicação e botão na seção 21.
    //  • Mark 8.3: placa com o nome da fazenda e brilho noturno (seção 11 + seção 20), caverna com face de rocha e túnel
    //    escurecendo (seção 11), ponte quebrada no nível 0 (seção 13), ordens de colheita e "COLHER TUDO" (seção 29),
    //    quantidade de monstros proporcional à equipe (MONSTROS_NOTURNOS_CONFIG.quantidade, seção 01; fórmula na seção 30),
    //    evolução visual da mina nos níveis 2 e 3 (seção 12) e janela do nome da fazenda (seção 32).
    //
    // ÍNDICE
    //  00. TELA DE CARREGAMENTO E INICIALIZAÇÃO EM ETAPAS
    //  01. CONFIGURAÇÕES GERAIS: ÁREAS, NÍVEIS E CORES
    //  02. CONFIGURAÇÃO DO CICLO DE DIA E NOITE (E DA ILUMINAÇÃO NOTURNA)
    //  03. COLISÕES DO MAPA E REGISTRO DE ÁRVORES
    //  04. CONFIGURAÇÃO DAS INVASÕES POR INATIVIDADE
    //  05. PROGRESSO E SALVAMENTO (XP, NÍVEIS, RECURSOS, LAVOURA, ANIMAIS, MINA E TRABALHADORES)
    //  06. CENA 3D BÁSICA: RENDERIZADOR, CÂMERA E LUZES PRINCIPAIS
    //  07. FUNÇÕES AUXILIARES DE MODELAGEM (E PEÇAS DE ILUMINAÇÃO COMPARTILHADAS)
    //  08. MODELOS REUTILIZÁVEIS: CERCAS, VEGETAÇÃO, OBJETOS, TRATOR COM FARÓIS E ANIMAIS
    //  09. CENÁRIO FIXO: CHÃO, CAMINHOS, POSTES, LAMPIÕES E NUVENS
    //  10. PRAÇA CENTRAL DO CHAFARIZ
    //  11. RELEVO E PAISAGEM: MONTANHAS, CACHOEIRA, RIO, FLORESTA, LAGO E PEDRA SECRETA
    //  12. CONSTRUTORES DAS ÁREAS (CONSTRUÇÕES, ANIMAIS, LAMPIÕES E PLANTAÇÕES COM CANTEIROS)
    //  13. DEMARCAÇÕES DE CONSTRUÇÃO E RUÍNAS
    //  14. GRUPOS 3D DAS ÁREAS E RECONSTRUÇÃO
    //  15. CÉU: CÚPULA EM GRADIENTE E SOL
    //  16. ESTRELAS E LUA
    //  17. CICLO DE DIA E NOITE
    //  18. CÂMERA E CONTROLES
    //  19. MOVIMENTO DO ALVO DA CÂMERA (TECLADO)
    //  20. ILUMINAÇÃO ARTIFICIAL NOTURNA: POSTES, LAMPIÕES, CASA E TRATOR
    //  21. MODO LEVE: QUALIDADE DE RENDERIZAÇÃO (SOMBRAS, RESOLUÇÃO E LUZES DINÂMICAS)
    //  22. FAZENDEIROS: MODELOS E NAVEGAÇÃO (OS FAZENDEIROS DECORATIVOS GRATUITOS FORAM DESLIGADOS NA MARK 8.2)
    //  23. ÁUDIO: MÚSICA, ANIMAIS, AMBIENTES E SEGREDO
    //  24. PAINÉIS FLUTUANTES DE TEMPO E ÁUDIO (E LISTA DOS PAINÉIS DA BARRA)
    //  25. MOBS HOSTIS: MODELOS, ANIMAÇÃO E POEIRA
    //  26. INVASÕES POR INATIVIDADE (REGRA ORIGINAL DOS 5 DIAS REAIS, SEPARADA DOS MONSTROS NOTURNOS)
    //  27. RECURSOS, PLANTAÇÕES (GRANDE E NOVA) E ALIMENTAÇÃO DOS ANIMAIS
    //  28. MINERAÇÃO: CICLO DO CARRINHO, MINÉRIOS E XP
    //  29. TRABALHADORES: CAPACIDADE DA CASA, CONTRATAÇÃO, MELHORIAS, DISPENSA, TAREFAS E COMBATE
    //  30. MONSTROS NOTURNOS E COMBATE; INTEGRAÇÃO E PAINÉIS DA MARK 8.2
    //  31. LOOP PRINCIPAL (ATUALIZAÇÃO E DESENHO A CADA QUADRO)
    //  32. INTERFACE: CARTÕES, XP, CONSTRUÇÃO E EVOLUÇÃO
    //  33. FINALIZAÇÃO DO CARREGAMENTO
    //
    // Ids de elementos HTML, chaves do localStorage ("fazenda3d-progresso-v3", "fazenda3d-audio-v1", "fazenda3d-modo-leve-v1"), ids das áreas e as funções
    // chamadas pelos botões (evoluirArea, repararArea, aoClicarNoCard) mantêm seus nomes: outras partes dependem deles
    // (essas três funções são publicadas em window na seção 32).
    // ====================================================================================================

    // Atalho para document.querySelector: devolve o elemento HTML que casa com o seletor CSS (ex.:
    // selecionar('#valor-xp')).
    const selecionar = seletor => document.querySelector(seletor);

    // ====================================================================================================
    // SEÇÃO 00 — TELA DE CARREGAMENTO E INICIALIZAÇÃO EM ETAPAS
    // Controla a tela "Preparando sua fazenda...": barra, porcentagem, mensagem, bloqueio dos controles e mensagens de erro.
    // Não depende do Three.js. A fazenda é montada por iniciarFarmEdu() (seções 01 a 33), que chama carregamento.etapa(...) ao
    // fim de cada etapa real; a porcentagem só chega a 100% depois que o primeiro quadro do jogo foi desenhado de verdade.
    // ====================================================================================================
    window.FARMEDU_INICIADO = true;   // avisa o vigia do HTML (antes do Three.js) que o script principal começou a rodar
    const carregamento = (() => {
      const tela = selecionar('#tela-de-carregamento'), preenchimento = selecionar('#carregamento-preenchimento'), barra = tela.querySelector('[role="progressbar"]');
      const textoDaMensagem = selecionar('#carregamento-mensagem'), textoDaPorcentagem = selecionar('#carregamento-porcentagem');
      const INTERFACE_DO_JOGO = ['#barra-topo', '#lista-cards', '#barra-ferramentas', '#faixa-invasao'];
      let progresso = 4, pronto = false, falhou = false;
      // Enquanto carrega, a interface do jogo fica "inerte" (sem foco por Tab nem clique) e as teclas (WASD, setas, Espaço...)
      // não chegam aos controles da câmera. A própria tela cobre o canvas, então toques e a rolagem do mouse também não passam.
      const segurarTeclas = evento => { if (!pronto) evento.stopImmediatePropagation(); };
      addEventListener('keydown', segurarTeclas, true); addEventListener('keyup', segurarTeclas, true);
      const definirInterfaceInerte = inerte => INTERFACE_DO_JOGO.forEach(seletor => { const elemento = selecionar(seletor); if (elemento) elemento.toggleAttribute('inert', inerte); });
      definirInterfaceInerte(true);
      // Atualiza barra, porcentagem e mensagem. A porcentagem nunca volta para trás.
      function mostrar(valor, mensagem) {
        progresso = Math.max(progresso, Math.min(100, Math.round(valor)));
        preenchimento.style.width = progresso + '%'; textoDaPorcentagem.textContent = progresso + '%'; barra.setAttribute('aria-valuenow', String(progresso));
        if (mensagem) textoDaMensagem.textContent = mensagem;
      }
      // Pausa curtíssima para o navegador desenhar a barra (requestAnimationFrame); com a aba em segundo plano usa um temporizador.
      const darVezAoNavegador = () => new Promise(resolver => { let seguiu = false; const seguir = () => { if (!seguiu) { seguiu = true; setTimeout(resolver, 0); } }; requestAnimationFrame(seguir); setTimeout(seguir, 80); });
      return {
        // Marca o fim de uma etapa REAL (valor em %, limitado a 99) e mostra o que vem a seguir.
        async etapa(valor, mensagemDaProximaEtapa) { mostrar(Math.min(valor, 99), mensagemDaProximaEtapa); await darVezAoNavegador(); },
        // Jogo pronto (primeiro quadro desenhado): 100%, libera interface e teclado e retira a tela suavemente.
        concluir() {
          if (falhou) return;
          mostrar(100, 'Fazenda pronta!'); pronto = true;
          removeEventListener('keydown', segurarTeclas, true); removeEventListener('keyup', segurarTeclas, true);
          definirInterfaceInerte(false);
          setTimeout(() => { tela.classList.add('saindo'); tela.setAttribute('aria-hidden', 'true'); setTimeout(() => { tela.hidden = true; }, 800); }, 350);
        },
        // Erro que impede a fazenda de abrir: mensagem compreensível e botão "Tentar novamente" (recarrega a página; nada salvo
        // é apagado). Erros que acontecem depois de o jogo abrir vão só para o console.
        falhar(erro) {
          console.error('[FarmEdu] Falha ao preparar a fazenda:', erro);
          if (pronto || falhou) return;
          falhou = true; tela.classList.add('com-erro');
          const mensagemTecnica = erro && erro.message ? erro.message : String(erro);
          let explicacao;
          if (window.FALHA_AO_CARREGAR_THREE || typeof THREE === 'undefined') explicacao = 'A biblioteca de gráficos 3D (Three.js) não pôde ser baixada. Verifique a conexão com a internet e tente novamente.';
          else if (/webgl/i.test(mensagemTecnica)) explicacao = 'Este navegador ou dispositivo não conseguiu iniciar os gráficos 3D (WebGL). Tente atualizar o navegador ou ativar a aceleração de hardware.';
          else explicacao = 'Ocorreu um erro ao montar a fazenda (' + mensagemTecnica + ').';
          textoDaMensagem.textContent = 'Falha ao preparar a fazenda';
          selecionar('#carregamento-erro-texto').textContent = explicacao + ' Seu progresso salvo não foi apagado.';
          selecionar('#carregamento-erro').hidden = false;
          selecionar('#carregamento-tentar').onclick = () => location.reload();
        },
      };
    })();

    // ====================================================================================================
    // MONTAGEM DA FAZENDA (SEÇÕES 01 A 33)
    // Tudo abaixo roda dentro de iniciarFarmEdu(), uma ÚNICA vez. As linhas "await carregamento.etapa(...)" marcam o fim de cada
    // etapa real e devolvem o controle ao navegador por um instante, para a barra de progresso ser redesenhada. Qualquer erro
    // durante a montagem cai em carregamento.falhar() (fim do arquivo), em vez de deixar a tela de carregamento infinita.
    // ====================================================================================================

    // ====================================================================================================
    // CARREGAMENTO DAS SEÇÕES EM ARQUIVOS SEPARADOS (FASE 3B DA REFATORAÇÃO)
    // O corpo de iniciarFarmEdu() foi dividido em arquivos assets/js/NN-....js, scripts clássicos (sem módulos ES) que este
    // carregador insere UM POR VEZ, na ordem original de execução, com as mesmas pausas da barra de progresso entre eles
    // (MONTAGEM_DA_FAZENDA). As declarações de nível superior desses arquivos ficam no escopo global compartilhado da página;
    // as funções foram escritas como "const nome = function nome(...) {...};" para não criarem propriedades em window (as
    // APIs globais continuam sendo publicadas só onde já eram: seções 26, 30 e 32).
    // O endereço de cada arquivo sai do endereço deste script: funciona aberto direto pelo arquivo (file://) e pela rota PHP
    // (index.php?rota=fazenda/script&arquivo=...), sem mudar o HTML nem o Controller.
    // ====================================================================================================
    const ENDERECO_DO_SCRIPT_PRINCIPAL = document.currentScript ? document.currentScript.src : '';
    // Ordem da montagem. Texto = arquivo a executar · [porcentagem, mensagem] = a mesma pausa "await carregamento.etapa" de antes.
    const MONTAGEM_DA_FAZENDA = [
      '01-configuracoes-gerais.js',
      '02-configuracao-do-dia-e-da-noite.js',
      '02b-configuracao-dos-audios.js',
      '03-colisoes-e-arvores.js',
      '04-configuracao-das-invasoes.js',
      '05-progresso-e-salvamento.js',
      '06-cena-3d.js',                        [12, 'Desenhando o terreno e os caminhos...'],
      '07-modelagem-basica.js',
      '08-modelos-reutilizaveis.js',
      '09-cenario-fixo.js',                   [20, 'Construindo a praça central...'],
      '10-praca-central.js',                  [26, 'Erguendo montanhas, rio e cachoeira...'],
      '11a-relevo-rio-e-postes.js',           [34, 'Plantando a floresta...'],
      '11b-floresta.js',                      [50, 'Espalhando arbustos, pedras e flores...'],
      '11c-pedra-secreta-e-vegetacao.js',     [58, 'Enchendo o lago do chafariz...'],
      '11d-lago-e-placa.js',
      '11e-margens-e-cachoeira.js',
      '11f-otimizacao-do-cenario.js',         [62, 'Preparando as instalações...'],
      '12a-plantacao-com-canteiros.js',
      '12b-construtores-das-areas.js',
      '13-demarcacoes-e-ruinas.js',           [64, 'Construindo as instalações e os animais...'],
      '14-areas-e-reconstrucao.js',           [74, 'Pintando o céu, o sol e a lua...'],
      '15-ceu-e-sol.js',
      '16-estrelas-e-lua.js',
      '17-ciclo-do-dia-e-da-noite.js',        [80, 'Ajustando câmera e iluminação...'],
      '18-camera-e-controles.js',
      '19-movimento-pelo-teclado.js',
      '20-iluminacao-noturna.js',             [84, 'Chamando os fazendeiros...'],
      '21-modo-leve.js',
      '22-fazendeiros-e-navegacao.js',        [88, 'Preparando sons e painéis...'],
      '23-audio.js',
      '24-paineis-de-tempo-e-audio.js',       [91, 'Preparando os sistemas do jogo...'],
      '25-mobs.js',
      '26-invasoes.js',
      '27-recursos-lavoura-e-animais.js',
      '28-mineracao.js',
      '29-trabalhadores.js',
      '30a-monstros-noturnos.js',
      '30b-integracao-e-paineis.js',
      '31-loop-principal.js',                 [93, 'Montando a interface...'],
      '32-interface.js',
      '33-finalizacao.js',                    // define concluirMontagemDaFazenda (seção 33), chamada no fim de iniciarFarmEdu()
    ];
    // Arquivo que cria o renderizador (seção 06): usado para reconhecer a falha do WebGL quando o navegador esconde o erro.
    const ARQUIVO_DO_RENDERIZADOR = '06-cena-3d.js';
    let ultimoArquivoDaMontagemConcluido = null;
    // Chamada na última linha de cada arquivo da montagem: confirma que ele rodou até o fim.
    const arquivoDaMontagemConcluido = arquivo => { ultimoArquivoDaMontagemConcluido = arquivo; };
    // Erro de um arquivo que parou no meio quando o navegador não entrega os detalhes: aberto direto pelo arquivo (file://), o
    // erro chega só como "Script error." (o erro completo continua no console). A falha do WebGL ainda é reconhecida com
    // segurança: entre salvarProgresso (já criada) e renderizador (ainda não criado) só a criação do renderizador pode falhar.
    const erroDoArquivoDaMontagem = arquivo => {
      let salvamentoCriado = false, renderizadorCriado = false;
      try { salvamentoCriado = typeof salvarProgresso === 'function'; } catch (erro) { }
      try { renderizadorCriado = !!renderizador; } catch (erro) { }
      if (arquivo === ARQUIVO_DO_RENDERIZADOR && salvamentoCriado && !renderizadorCriado) return new Error('WebGL: o renderizador 3D não pôde ser criado; detalhes no console do navegador');
      return new Error('o arquivo ' + arquivo + ' parou no meio; detalhes no console do navegador');
    };
    // Insere um arquivo da montagem e espera ele rodar. Rejeita se o arquivo não existir ou se parar no meio; com os detalhes
    // disponíveis (rota PHP), o erro original segue para carregamento.falhar, como antes da divisão.
    const carregarArquivoDaMontagem = arquivo => new Promise((resolver, rejeitar) => {
      const script = document.createElement('script');
      script.src = ENDERECO_DO_SCRIPT_PRINCIPAL ? ENDERECO_DO_SCRIPT_PRINCIPAL.replace(/fazenda\.js(?=$|[?#])/, arquivo) : 'assets/js/' + arquivo;
      let erroCompleto = null;
      const aoErrar = evento => { if (evento.error && evento.filename === script.src) { erroCompleto = evento.error; evento.preventDefault(); } };
      const terminar = () => { removeEventListener('error', aoErrar); script.remove(); };   // o <script> sai do documento: o DOM fica como antes
      addEventListener('error', aoErrar);
      script.onload = () => { terminar(); if (ultimoArquivoDaMontagemConcluido === arquivo) resolver(); else rejeitar(erroCompleto || erroDoArquivoDaMontagem(arquivo)); };
      script.onerror = () => { terminar(); rejeitar(new Error('arquivo da fazenda não encontrado: ' + arquivo)); };
      document.head.appendChild(script);
    });

    async function iniciarFarmEdu() {
      if (window.FARMEDU_EM_EXECUCAO) return;      // proteção: a fazenda nunca é montada duas vezes
      window.FARMEDU_EM_EXECUCAO = true;
      if (window.FALHA_AO_CARREGAR_THREE || typeof THREE === 'undefined') throw new Error('Three.js não carregado');
      await carregamento.etapa(8, 'Preparando a cena 3D...');
      // Montagem (seções 01 a 33): os arquivos rodam na ordem original, com as mesmas pausas de antes entre eles.
      for (const passo of MONTAGEM_DA_FAZENDA) {
        if (Array.isArray(passo)) await carregamento.etapa(passo[0], passo[1]);
        else await carregarArquivoDaMontagem(passo);
      }
      await concluirMontagemDaFazenda();   // seção 33: primeiro quadro, fim da tela de carregamento e invasões
    }
    iniciarFarmEdu().catch(erro => carregamento.falhar(erro));
