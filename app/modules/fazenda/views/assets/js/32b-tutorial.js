      // ====================================================================================================
      // FARMEDU 3D — 32b-tutorial.js (Fazenda 8.4.1: tutorial e ajuda)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. Segue a mesma
      // convenção dos outros arquivos: cada função de nível superior é "const nome = function nome(...) {...};" e as declarações
      // ficam no escopo global compartilhado entre os arquivos da fazenda (const, let e class não criam propriedades em window).
      // ====================================================================================================
      // ====================================================================================================
      // SEÇÃO 32b — TUTORIAL INTERATIVO E AJUDA
      // • Cartão #tutorial, que NÃO bloqueia o jogo: passos curtos agrupados em tópicos, com Voltar/Avançar, minimizar e pausar
      //   (continua depois no mesmo passo). Alguns passos têm uma tarefa prática ("Experimente: ...") marcada sozinha quando o
      //   jogador a cumpre; nenhuma é obrigatória para avançar.
      // • Moldura #tutorial-destaque: aponta o elemento explicado, sem bloquear cliques.
      // • Janela #janela-ajuda (botão "❓ Ajuda e tutorial" do menu): continuar, recomeçar ou consultar UM tópico isolado sem
      //   mexer no progresso do tutorial.
      // • Progresso no localStorage "fazenda3d-tutorial-v1" (separado do save da fazenda): { situacao, passo }, com
      //   situacao 'andamento' · 'pausado' · 'concluido' · 'dispensado' ("Explorar sozinho"); sem a chave = ainda não oferecido.
      // • Os textos leem os valores da configuração (custos, tempos, limite diário) e só descrevem o que o jogo já faz. As
      //   atividades escolares são apresentadas como a fonte principal de XP, deixando claro que a ligação automática com a
      //   Fazenda ainda está sendo preparada (window.adicionarXP não tem chamador no projeto).
      // ====================================================================================================
      const CHAVE_DO_TUTORIAL = 'fazenda3d-tutorial-v1';
      const SITUACOES_DO_TUTORIAL = ['andamento', 'pausado', 'concluido', 'dispensado'];
      const TOPICOS_DO_TUTORIAL = [
        ['inicio', '👋', 'Boas-vindas'], ['controles', '🎮', 'Controles e câmera'], ['xp', '⭐', 'XP e economia'],
        ['atividades', '📚', 'Atividades escolares'], ['construcoes', '🏗️', 'Construções e melhorias'], ['plantacoes', '🌱', 'Plantio e colheita'],
        ['mina', '⛏', 'Mina e recursos'], ['trabalhadores', '👷', 'Trabalhadores'], ['animais', '🐄', 'Animais'],
        ['tempo', '🌗', 'Dia, noite e monstros'], ['salvamento', '💾', 'Salvamento'], ['configuracoes', '🎚️', 'Menu, sons e configurações'],
        ['ajuda', '❓', 'Ajuda'],
      ].map(([id, icone, nome]) => ({ id, icone, nome }));

      // ---- apoio aos passos ----
      const plantacaoJaConstruida = () => PLANTACOES_COM_CANTEIROS.find(idDaArea => estado.niveis[idDaArea] > 0) || null;
      const cartaoDaGaveta = idDaArea => { const botao = selecionar(`#conteudo-da-gaveta [data-foco="${idDaArea}"]`); return botao ? botao.closest('.card') : null; };
      const abrirGavetaNoTutorial = () => { fecharMenuEPaineis(); definirGavetaAberta(true); };
      const abrirPainelNoTutorial = (painel, botao) => { if (painel.hidden) alternarPainel(painel, botao); atualizarPaineisDaMark82(true); };
      const visivel = seletor => { const elemento = selecionar(seletor); return !!elemento && !elemento.hidden; };
      const listaDasCulturas = () => '<ul class="tutorial-lista">' + Object.values(CULTURAS).map(cultura =>
        `<li>${cultura.icone} <b>${cultura.nome}</b>: ${cultura.minutosParaCrescer} min · +${cultura.colheita} no estoque · ${cultura.xp} XP</li>`).join('') + '</ul>';
      // Etapa 1.1: a mina entrega SOMENTE minérios (não há XP por viagem). Cada nível também libera uma faixa de receitas.
      const listaDaMina = () => '<ul class="tutorial-lista">' + MINERACAO_CONFIG.mineriosPorCicloPorNivel.map((minerios, indice) =>
        `<li>Nível ${indice + 1}: ${minerios} minérios por viagem · libera as poções ${Object.values(CATEGORIAS_DE_POCOES).filter(categoria => categoria.nivelDaMina <= indice + 1).map(categoria => categoria.plural).join(', ')}</li>`).join('') + '</ul>';
      // Texto das cotas diárias de XP, calculado a partir da configuração (o tutorial nunca fica diferente do jogo).
      const listaDasCotas = () => '<ul class="tutorial-lista">' + ATIVIDADES_COM_COTA.map(atividade => `<li>${COTAS_DIARIAS_DE_XP[atividade].icone} <b>${COTAS_DIARIAS_DE_XP[atividade].nome}</b>: ${COTAS_DIARIAS_DE_XP[atividade].fonte}</li>`).join('') + '</ul>';

      // Passos: topico · titulo · texto() (HTML) · destaque() → elemento apontado (ou null) · preparar() opcional (abre o que o
      // passo explica) · tarefa opcional { texto, feita() }.
      const PASSOS_DO_TUTORIAL = [
        { topico: 'inicio', titulo: 'Bem-vindo à sua fazenda!',
          texto: () => `<p>Aqui você constrói e cuida de uma fazenda que cresce com o seu <b>XP ⭐</b>.</p><p>Este tutorial mostra, em passos curtos, tudo o que já funciona no jogo. Você pode voltar, minimizar ou pausar e continuar depois. Para rever qualquer assunto, use <b>❓ Ajuda e tutorial</b>, no menu ☰.</p>` },
        { topico: 'controles', titulo: 'Olhando a fazenda',
          texto: () => `<p><b>Arraste</b> a tela com o mouse (ou com o dedo) para girar a vista.</p><p>A <b>rodinha do mouse</b>, ou o gesto de pinça, aproxima e afasta.</p>`,
          tarefa: { texto: 'Experimente: arraste a tela ou use a rodinha.', feita: () => jogadorMexeu } },
        { topico: 'controles', titulo: 'Teclado e cliques',
          texto: () => `<p><b>W A S D</b> andam · <b>setas</b> giram e inclinam · <b>Espaço</b> sobe · <b>C</b> ou Ctrl desce · <b>Shift</b> acelera.</p><p>Para descer e avançar ao mesmo tempo, use <b>C + W</b> (o navegador reserva Ctrl+W para fechar a aba).</p><p>No mapa, clique numa <b>plantação</b> ou na <b>mina</b> para abrir o painel dela.</p>` },
        { topico: 'xp', titulo: 'XP e recursos', destaque: () => selecionar('#barra-topo > b'),
          texto: () => `<p>O número com ⭐ no alto é o seu <b>XP</b>: é com ele que você constrói, evolui, contrata e repara. Ao lado ficam os <b>recursos</b> do estoque (trigo, milho, cenoura, abóbora, minérios e madeira).</p><p>Construir e evoluir pede <b>XP e madeira 🪵</b> ao mesmo tempo.</p><p>${ECONOMIA_CONFIG.xpInicial > 0 ? 'Uma fazenda nova começa com <b>' + ECONOMIA_CONFIG.xpInicial + ' XP</b>.' : 'Uma fazenda nova começa <b>sem XP</b>: a primeira plantação é grátis para você começar a produzir.'}</p>` },
        { topico: 'xp', titulo: 'O XP que a Fazenda rende',
          texto: () => `<p>Na Fazenda, cada atividade rende XP até a sua <b>cota diária</b>:</p>${listaDasCotas()}<p>Hoje, somando tudo, são <b>${ECONOMIA_CONFIG.limiteDiarioDeXPDaFazenda} XP por dia</b>, e esse total cresce com as construções e a equipe. Depois da cota, a atividade continua rendendo recursos, mas sem XP. As cotas renovam a cada dia, e o que você não usar fica guardado por mais um dia.</p><p><b>A mina não dá XP</b>: ela traz minérios. O XP da mina vem da <b>⭐ Poção de Experiência</b>, preparada pelo Guardião.</p><p>No painel 🌾 Fazenda, e ao parar o mouse sobre o XP, você vê quanto já ganhou hoje.</p>` },
        { topico: 'atividades', titulo: 'A principal fonte de XP: as atividades',
          texto: () => `<p>O XP mais importante vem das <b>atividades que o seu instrutor publica</b> na plataforma. É o instrutor quem define quanto XP cada atividade vale.</p><p>A Fazenda é um complemento: ela ajuda, mas não substitui os estudos.</p><p class="tutorial-observacao"`},
        { topico: 'construcoes', titulo: 'A gaveta de construções', destaque: () => selecionar('#botao-gaveta-construcoes'),
          texto: () => `<p>Na gaveta 🏗️, embaixo, ficam as ${AREAS.length} construções da fazenda, separadas por tipo. Cada cartão mostra o nível (0 a ${NIVEL_MAXIMO}), o custo e se já dá para construir, ou quantos XP faltam.</p>`,
          tarefa: { texto: 'Experimente: abra a gaveta de construções.', feita: () => visivel('#conteudo-da-gaveta') } },
        { topico: 'construcoes', titulo: 'Construir e evoluir', preparar: abrirGavetaNoTutorial, destaque: () => selecionar('#conteudo-da-gaveta'),
          texto: () => `<p>No nível 0 há só o terreno marcado: <b>Construir</b> leva ao nível 1. Depois, <b>Evoluir</b> custa ${CUSTO_PARA_PROXIMO_NIVEL[0]} XP + ${CUSTO_EM_MADEIRA_PARA_PROXIMO_NIVEL[0]} madeiras (1 → 2) e ${CUSTO_PARA_PROXIMO_NIVEL[1]} XP + ${CUSTO_EM_MADEIRA_PARA_PROXIMO_NIVEL[1]} madeiras (2 → 3), e cada nível amplia a construção: mais canteiros, mais animais, mais vagas na casa.</p><p>Cada cartão mostra os <b>dois requisitos</b> (⭐ XP e 🪵 madeira) e quanto você já tem. Faltando qualquer um, nada é cobrado. A madeira vem do <b>🪓 lenhador</b>, no acampamento da floresta depois da ponte: clique nele e peça uma coleta. Cada árvore rende ${LENHADOR_CONFIG.madeiraPorArvore} madeiras, até ${LENHADOR_CONFIG.limiteDiarioDeMadeira} por dia; a ponte evoluída aumenta os dois, e a madeira que você não coletar hoje fica guardada por mais um dia.</p><p>A casa começa na base e a ponte começa quebrada: as duas também evoluem.</p>` },
        { topico: 'plantacoes', titulo: 'Sua primeira plantação é grátis', preparar: abrirGavetaNoTutorial,
          destaque: () => cartaoDaGaveta(plantacaoJaConstruida() || 'plantacaoGrande'),
          texto: () => estado.primeiraPlantacaoGratuitaUsada
            ? `<p>Você já construiu a sua primeira plantação, que saiu de graça. A outra custa ${CUSTO_DE_CONSTRUCAO.novaPlantacao} XP.</p>`
            : `<p>A Grande plantação e a Nova plantação custam ${CUSTO_DE_CONSTRUCAO.plantacaoGrande} XP cada, mas a <b>primeira</b> que você construir sai por <b>0 XP</b>. Escolha qualquer uma.</p>`,
          tarefa: { texto: 'Experimente: construa uma plantação.', feita: () => estado.primeiraPlantacaoGratuitaUsada } },
        { topico: 'plantacoes', titulo: 'Plantar',
          preparar: () => { const idDaArea = plantacaoJaConstruida(); if (idDaArea) abrirPainelDaFazenda(idDaArea); },
          destaque: () => visivel('#painel-fazenda') ? selecionar('#painel-fazenda') : null,
          texto: () => `<p>Clique na plantação no mapa, ou abra <b>🌾 Fazenda</b> no menu. Escolha a cultura e plante um canteiro ou todos de uma vez. Plantar não custa XP.</p>${listaDasCulturas()}`,
          tarefa: { texto: 'Experimente: plante pelo menos um canteiro.', feita: () => PLANTACOES_COM_CANTEIROS.some(idDaArea => canteirosDaArea(idDaArea).some(canteiro => canteiro.cultura)) } },
        { topico: 'plantacoes', titulo: 'Crescimento e colheita',
          texto: () => `<p>As plantas crescem em <b>tempo real</b>, mesmo com o jogo fechado. Fazendeiros na equipe aceleram um pouco o crescimento.</p><p>Com o canteiro maduro, colha um por um, use <b>🧺 Colher tudo</b> ou mande um trabalhador colher. A colheita vai para o estoque e rende XP, dentro da cota diária de Lavoura.</p>` },
        { topico: 'mina', titulo: 'A mina', preparar: abrirGavetaNoTutorial, destaque: () => cartaoDaGaveta('mina'),
          texto: () => `<p>A mina custa <b>${custoParaProximoNivel('mina', 0)} XP</b>.${ECONOMIA_CONFIG.xpInicial >= custoParaProximoNivel('mina', 0) ? ' O XP inicial de uma fazenda nova é suficiente para comprá-la.' : ''}</p><p>Construída, o carrinho entra na caverna e volta a cada <b>${MINERACAO_CONFIG.minutosMinerando} min</b> com <b>minérios</b>. A mina <b>não dá XP</b>:</p>${listaDaMina()}<p>Com o jogo fechado, o carrinho termina a viagem que estava fazendo. Os minérios ficam guardados no estoque. Clique na mina para ver o que o carrinho está fazendo.</p><p>Ao lado da entrada da caverna fica o <b>🧙 Guardião da Mina</b>, que transforma os minérios em <b>poções</b>:</p><ul class="tutorial-lista"><li><b>⭐ Poção de Experiência</b> (${POCOES_DO_GUARDIAO.experiencia.minerios} minérios): a <b>única</b> que dá XP, <b>+${POCOES_DO_GUARDIAO.experiencia.xp} XP</b>. Só ela usa o <b>Limite da alquimia</b> (${COTAS_DIARIAS_DE_XP.mina.base} XP por dia).</li><li>As outras poções dão <b>efeitos por um tempo</b> (plantas crescendo mais rápido, cocho durando mais, equipe mais forte...), e uma delas guarda um mistério. Elas <b>não dão XP</b> e podem ser usadas mesmo com o limite cheio.</li></ul>` },
        { topico: 'trabalhadores', titulo: 'Sua equipe', preparar: () => abrirPainelNoTutorial(painelDaEquipe, botaoDaEquipe), destaque: () => visivel('#painel-equipe') ? selecionar('#painel-equipe') : null,
          texto: () => `<p>Em <b>👷 Equipe</b>, no menu, ficam os seus trabalhadores. Você começa com o fazendeiro <b>${FAZENDEIRO_INICIAL.nome}</b>.</p><p>As vagas dependem do nível da casa: ${CAPACIDADE_DE_TRABALHADORES_POR_NIVEL_DA_CASA.join(', ')} trabalhadores (da base ao nível ${NIVEL_MAXIMO}).</p>` },
        { topico: 'trabalhadores', titulo: 'Contratar, melhorar e dispensar',
          texto: () => `<ul class="tutorial-lista"><li><b>Fazendeiro</b> (${CLASSES_DE_TRABALHADORES.fazendeiro.custo} XP): colhe mais rápido e acelera as plantações.</li><li><b>Guarda</b> (${CLASSES_DE_TRABALHADORES.guarda.custo} XP): mais forte, persegue os monstros e defende as instalações.</li><li>Sempre há pelo menos um fazendeiro e um guarda entre os candidatos.</li><li><b>🏠 Mandar para casa</b> protege o trabalhador (ele recupera a vida), mas em casa ele não trabalha nem defende. <b>🚜 Voltar ao trabalho</b> o traz de volta.</li><li>Cada atributo pode ser <b>melhorado</b> com XP (a partir de ${MELHORIAS_DOS_TRABALHADORES.custoPorNivel[0]} XP).</li><li>Quem cair em combate pode ser <b>recuperado</b> com XP.</li><li><b>Dispensar</b> devolve ${Math.round(MELHORIAS_DOS_TRABALHADORES.fracaoDevolvidaAoDispensar * 100)}% do XP investido no trabalhador (o fazendeiro inicial não devolve nada).</li></ul><p>Os trabalhadores colhem quando você manda, pelo painel da plantação.</p>` },
        { topico: 'animais', titulo: 'Animais',
          texto: () => `<p>Curral, ovelhal, estábulo, galinheiro e chiqueiro recebem animais quando são construídos, e mais animais a cada nível.</p><p>Quem enche o cocho é você: em <b>🌾 Fazenda</b>, toque em <b>Alimentar</b>, e o cocho é abastecido com as colheitas do estoque. Cheio, ele dura cerca de ${ALIMENTACAO_CONFIG.horasParaAComidaAcabar} horas (mais com o celeiro), e o jogo avisa quando está acabando.</p><p>Bem alimentado, cada animal produz um item a cada ${PRODUCAO_DOS_ANIMAIS.horasPorProduto} horas (leite, lã, adubo, ovos ou trufas). Em <b>🌾 Fazenda</b>, toque em <b>Coletar</b>: cada item vale ${PRODUCAO_DOS_ANIMAIS.xpPorProduto} XP, dentro da cota diária de Criação.</p><p>Sem comida, os animais perdem saúde e podem morrer. Repor um animal custa ${ALIMENTACAO_CONFIG.custoParaReporAnimal} XP.</p>` },
        { topico: 'tempo', titulo: 'Dia e noite',
          texto: () => `<p>Um dia completo na fazenda dura <b>${Math.round(DURACAO_DO_CICLO_SEGUNDOS / 60)} minutos</b>. O relógio fica em <b>🌗 Tempo</b>, no menu. À noite, a fazenda acende as luzes.</p>` },
        { topico: 'tempo', titulo: 'Monstros noturnos',
          texto: () => `<p>À noite, monstros podem surgir perto dos trabalhadores que estão no campo. Eles atacam <b>só os trabalhadores</b>, nunca as construções.</p><p>Os trabalhadores se defendem, e cada monstro derrotado rende ${TRABALHADORES_CONFIG.xpPorMonstroDerrotado} XP (dentro da cota diária de Defesa). De dia, os feridos recuperam a vida aos poucos.</p><p>Quando a fazenda crescer, criaturas da floresta poderão atacar as instalações. Antes disso, o jogo mostra um aviso explicando como preparar a defesa.</p>` },
        { topico: 'salvamento', titulo: 'Seu progresso fica salvo',
          texto: () => `<p>A fazenda é salva sozinha a cada ação, <b>neste navegador e neste computador</b>. Use sempre o mesmo navegador para continuar de onde parou.</p><p>Limpar os dados do navegador apaga a fazenda.</p>` },
        { topico: 'configuracoes', titulo: 'O menu', preparar: fecharMenuEPaineis, destaque: () => selecionar('#botao-menu'),
          texto: () => `<p>No menu <b>☰</b> você muda o nome da fazenda, vê o relógio e abre os painéis 🌾 Fazenda e 👷 Equipe. Em <b>🎨 Qualidade</b> você deixa o jogo mais leve em computadores mais lentos (no modo Automático ele se ajusta sozinho).</p>`,
          tarefa: { texto: 'Experimente: abra o menu.', feita: () => visivel('#menu-principal') || PAINEIS_DA_BARRA.some(([painel]) => !painel.hidden) } },
        { topico: 'configuracoes', titulo: 'Sons', destaque: () => selecionar('#botao-som-global'),
          texto: () => `<p>Os navegadores só tocam sons depois de um toque ou de uma tecla: o som começa sozinho no seu primeiro toque no jogo. O botão de som aqui no alto também ativa, e liga ou desliga todos os sons de uma vez.</p><p>Em <b>🎚️ Áudio</b>, no menu, você ajusta o volume de cada tipo de som. O painel avisa quando um som ainda não foi instalado.</p>` },
        { topico: 'ajuda', titulo: 'Ajuda sempre à mão', destaque: () => selecionar('#botao-menu'),
          texto: () => `<p>Pronto! Para rever qualquer assunto, abra o menu ☰ e escolha <b>❓ Ajuda e tutorial</b>. Lá você também pode recomeçar o tutorial.</p><p>Bom trabalho na fazenda, e nas atividades!</p>` },
      ];

      // ---- progresso salvo ----
      let progressoDoTutorial = null;   // null = o tutorial ainda não foi oferecido neste navegador
      try {
        const salvo = JSON.parse(localStorage.getItem(CHAVE_DO_TUTORIAL));
        if (salvo && SITUACOES_DO_TUTORIAL.includes(salvo.situacao)) progressoDoTutorial = { situacao: salvo.situacao, passo: Number.isInteger(salvo.passo) ? Math.min(PASSOS_DO_TUTORIAL.length - 1, Math.max(0, salvo.passo)) : 0 };
      } catch (erro) { }
      const salvarProgressoDoTutorial = function salvarProgressoDoTutorial(situacao, passo = progressoDoTutorial ? progressoDoTutorial.passo : 0) {
        progressoDoTutorial = { situacao, passo };
        try { localStorage.setItem(CHAVE_DO_TUTORIAL, JSON.stringify(progressoDoTutorial)); } catch (erro) { }
      };

      // ---- cartão do tutorial ----
      const cartaoDoTutorial = selecionar('#tutorial'), molduraDoTutorial = selecionar('#tutorial-destaque');
      const textoDoTopico = selecionar('#tutorial-topico'), tituloDoTutorial = selecionar('#tutorial-titulo'), corpoDoTutorial = selecionar('#tutorial-corpo');
      const conteudoDoTutorial = selecionar('#tutorial-texto'), tarefaDoTutorial = selecionar('#tutorial-tarefa'), barraDoTutorial = selecionar('#tutorial-barra'), acoesDoTutorial = selecionar('#tutorial-acoes');
      const botaoMinimizarTutorial = selecionar('#tutorial-minimizar'), botaoPausarTutorial = selecionar('#tutorial-pausar');
      // modo: null (fechado) · 'convite' · 'tutorial' (sequência completa) · 'consulta' (um tópico aberto pela ajuda, sem mexer no progresso)
      let modoDoTutorial = null, passoDoTutorial = 0, topicoEmConsulta = null, vigiaDoTutorial = null;
      const passosDoModo = () => modoDoTutorial === 'consulta' ? PASSOS_DO_TUTORIAL.map((passo, indice) => passo.topico === topicoEmConsulta ? indice : -1).filter(indice => indice >= 0) : PASSOS_DO_TUTORIAL.map((passo, indice) => indice);
      const definirMinimizado = function definirMinimizado(minimizado) {
        cartaoDoTutorial.classList.toggle('minimizado', minimizado); corpoDoTutorial.hidden = minimizado;
        botaoMinimizarTutorial.textContent = minimizado ? '▸' : '▾'; botaoMinimizarTutorial.setAttribute('aria-expanded', String(!minimizado));
        botaoMinimizarTutorial.setAttribute('aria-label', minimizado ? 'Mostrar o tutorial' : 'Minimizar o tutorial');
        atualizarMolduraDoTutorial();
      };
      // Moldura sobre o elemento do passo e posição do cartão, sem cobrir a gaveta:
      //  • telas largas: com o cartão aberto, a gaveta aberta se desloca para a direita (classe "tutorial-aberto" no body, 08-tutorial.css);
      //  • telas estreitas: o cartão fica logo acima da gaveta (aberta ou fechada) ou, se o elemento apontado estiver na metade de
      //    baixo, no alto; a altura máxima acompanha o espaço livre (o texto rola dentro do cartão).
      const atualizarMolduraDoTutorial = function atualizarMolduraDoTutorial() {
        const minimizado = cartaoDoTutorial.classList.contains('minimizado');
        document.body.classList.toggle('tutorial-aberto', !!modoDoTutorial && !minimizado);
        const passo = modoDoTutorial === 'convite' || !modoDoTutorial ? null : PASSOS_DO_TUTORIAL[passoDoTutorial];
        const alvo = passo && passo.destaque && !minimizado ? passo.destaque() : null, retangulo = alvo ? alvo.getBoundingClientRect() : null;
        const mostrar = !!retangulo && retangulo.width > 0 && retangulo.height > 0;
        molduraDoTutorial.hidden = !mostrar;
        if (mostrar) Object.assign(molduraDoTutorial.style, { left: (retangulo.left - 6) + 'px', top: (retangulo.top - 6) + 'px', width: (retangulo.width + 12) + 'px', height: (retangulo.height + 12) + 'px' });
        const estreita = innerWidth < 720, noAlto = estreita && mostrar && retangulo.top + retangulo.height / 2 > innerHeight / 2;
        cartaoDoTutorial.classList.toggle('no-alto', noAlto);
        if (!estreita) { cartaoDoTutorial.style.bottom = cartaoDoTutorial.style.maxHeight = ''; return; }
        const topoDaGaveta = selecionar('#lista-cards').getBoundingClientRect().top, topoLivre = selecionar('#barra-topo').getBoundingClientRect().bottom + 8;
        cartaoDoTutorial.style.bottom = noAlto ? '' : Math.max(8, innerHeight - topoDaGaveta + 8) + 'px';
        cartaoDoTutorial.style.maxHeight = Math.max(140, topoDaGaveta - 8 - topoLivre) + 'px';
      };
      const atualizarTarefaDoTutorial = function atualizarTarefaDoTutorial() {
        const passo = modoDoTutorial === 'convite' || !modoDoTutorial ? null : PASSOS_DO_TUTORIAL[passoDoTutorial];
        tarefaDoTutorial.hidden = !(passo && passo.tarefa);
        if (!passo || !passo.tarefa) return;
        let feita = false; try { feita = !!passo.tarefa.feita(); } catch (erro) { }
        const texto = (feita ? '✔ Feito! ' : '👉 ') + passo.tarefa.texto;
        if (tarefaDoTutorial.textContent !== texto) { tarefaDoTutorial.textContent = texto; tarefaDoTutorial.classList.toggle('feita', feita); }
      };
      const vigiarTutorial = function vigiarTutorial(ligado) {
        clearInterval(vigiaDoTutorial); vigiaDoTutorial = null;
        if (ligado) vigiaDoTutorial = setInterval(() => { atualizarMolduraDoTutorial(); atualizarTarefaDoTutorial(); }, 400);
      };
      const botaoDoTutorial = (texto, aoClicar, classe = '') => { const botao = document.createElement('button'); botao.type = 'button'; botao.className = 'botao-pequeno ' + classe; botao.textContent = texto; botao.onclick = aoClicar; return botao; };
      const fecharTutorial = function fecharTutorial() {
        modoDoTutorial = null; cartaoDoTutorial.hidden = true; molduraDoTutorial.hidden = true; vigiarTutorial(false);
        document.body.classList.remove('tutorial-aberto');   // a gaveta volta à largura normal
      };
      const mostrarPassoDoTutorial = function mostrarPassoDoTutorial(indice) {
        const passos = passosDoModo(), posicao = Math.max(0, passos.indexOf(indice)), passo = PASSOS_DO_TUTORIAL[indice];
        passoDoTutorial = indice;
        if (passo.preparar) try { passo.preparar(); } catch (erro) { console.warn('[FarmEdu] tutorial: não foi possível preparar o passo', erro); }
        const topico = TOPICOS_DO_TUTORIAL.find(item => item.id === passo.topico), numeroDoTopico = TOPICOS_DO_TUTORIAL.indexOf(topico) + 1;
        textoDoTopico.textContent = topico.icone + ' ' + (modoDoTutorial === 'consulta' ? 'Ajuda · ' + topico.nome : 'Tópico ' + numeroDoTopico + ' de ' + TOPICOS_DO_TUTORIAL.length + ' · ' + topico.nome);
        tituloDoTutorial.textContent = passo.titulo; conteudoDoTutorial.innerHTML = passo.texto();
        barraDoTutorial.style.width = Math.round((posicao + 1) / passos.length * 100) + '%';
        barraDoTutorial.parentElement.setAttribute('aria-valuenow', String(posicao + 1)); barraDoTutorial.parentElement.setAttribute('aria-valuemax', String(passos.length));
        barraDoTutorial.parentElement.setAttribute('aria-label', 'Passo ' + (posicao + 1) + ' de ' + passos.length);
        // O foco só passa para o novo botão se o jogador já navegava pelo cartão com o teclado (:focus-visible): um foco automático
        // faria a barra de espaço (que sobe a câmera) também "clicar" no botão.
        const navegandoPeloTeclado = cartaoDoTutorial.contains(document.activeElement) && document.activeElement.matches(':focus-visible');
        const ultimo = posicao === passos.length - 1, voltar = botaoDoTutorial('‹ Voltar', () => mostrarPassoDoTutorial(passos[posicao - 1]), 'secundario');
        voltar.disabled = posicao === 0;
        const avancar = botaoDoTutorial(ultimo ? (modoDoTutorial === 'consulta' ? 'Fechar' : 'Concluir ✔') : 'Avançar ›', () => {
          if (!ultimo) { mostrarPassoDoTutorial(passos[posicao + 1]); return; }
          if (modoDoTutorial === 'tutorial') { salvarProgressoDoTutorial('concluido', 0); mostrarAviso('🎉 Tutorial concluído! Ele continua disponível em ☰ Menu → ❓ Ajuda e tutorial.'); }
          fecharTutorial();
        });
        acoesDoTutorial.replaceChildren(voltar, Object.assign(document.createElement('span'), { className: 'contagem-do-tutorial', textContent: (posicao + 1) + ' / ' + passos.length }), avancar);
        if (modoDoTutorial === 'tutorial') salvarProgressoDoTutorial('andamento', indice);
        tarefaDoTutorial.textContent = ''; atualizarTarefaDoTutorial(); atualizarMolduraDoTutorial();
        if (navegandoPeloTeclado) avancar.focus({ preventScroll: true });
      };
      const abrirCartaoDoTutorial = function abrirCartaoDoTutorial(modo) {
        fecharAjuda(); modoDoTutorial = modo; cartaoDoTutorial.hidden = false; definirMinimizado(false);
        botaoPausarTutorial.hidden = modo === 'convite'; botaoMinimizarTutorial.hidden = modo === 'convite';
        botaoPausarTutorial.textContent = modo === 'consulta' ? '✕' : '⏸';
        botaoPausarTutorial.setAttribute('aria-label', modo === 'consulta' ? 'Fechar este tópico' : 'Pausar o tutorial (continua depois)');
        botaoPausarTutorial.title = botaoPausarTutorial.getAttribute('aria-label');
        vigiarTutorial(modo !== 'convite');
      };
      const iniciarTutorial = function iniciarTutorial(indice = 0) { abrirCartaoDoTutorial('tutorial'); mostrarPassoDoTutorial(indice); };
      const consultarTopicoDoTutorial = function consultarTopicoDoTutorial(idDoTopico) {
        topicoEmConsulta = idDoTopico; abrirCartaoDoTutorial('consulta');
        mostrarPassoDoTutorial(PASSOS_DO_TUTORIAL.findIndex(passo => passo.topico === idDoTopico));
      };
      const pausarTutorial = function pausarTutorial() {
        if (modoDoTutorial === 'tutorial') { salvarProgressoDoTutorial('pausado', passoDoTutorial); mostrarAviso('⏸ Tutorial pausado. Continue quando quiser em ☰ Menu → ❓ Ajuda e tutorial.'); }
        fecharTutorial();
      };
      botaoPausarTutorial.onclick = pausarTutorial;
      botaoMinimizarTutorial.onclick = () => definirMinimizado(!cartaoDoTutorial.classList.contains('minimizado'));
      // Convite (uma vez por navegador): começar agora ou explorar sozinho. Fecha sem decidir = continua sem a chave salva.
      const mostrarConviteDoTutorial = function mostrarConviteDoTutorial() {
        abrirCartaoDoTutorial('convite');
        textoDoTopico.textContent = '📘 Tutorial'; tituloDoTutorial.textContent = existiaSalvamento ? 'Conheça o tutorial da Fazenda' : 'Quer aprender a jogar?';
        conteudoDoTutorial.innerHTML = `<p>Um passeio curto pelos controles, construções, plantações, mina, trabalhadores, animais e XP.</p><p>Você pode pausar a qualquer momento e rever tudo depois em <b>☰ Menu → ❓ Ajuda e tutorial</b>.</p>`;
        tarefaDoTutorial.hidden = true; barraDoTutorial.style.width = '0%';
        const comecar = botaoDoTutorial('▶ Começar o tutorial', () => iniciarTutorial(0));
        const sozinho = botaoDoTutorial('Explorar sozinho', () => { salvarProgressoDoTutorial('dispensado', 0); fecharTutorial(); mostrarAviso('Tudo bem! O tutorial fica em ☰ Menu → ❓ Ajuda e tutorial.'); }, 'secundario');
        acoesDoTutorial.replaceChildren(sozinho, comecar);   // sem foco automático: o convite não rouba as teclas do jogo
      };
      // Chamada pela seção 33 ao abrir: oferece o tutorial se ele nunca foi oferecido neste navegador, depois da janela do nome.
      const oferecerTutorial = function oferecerTutorial() {
        if (progressoDoTutorial) return;
        const tentar = () => { if (progressoDoTutorial || modoDoTutorial) return; if (!selecionar('#janela-nome-da-fazenda').hidden || !selecionar('#janela-ajuda').hidden) { setTimeout(tentar, 800); return; } mostrarConviteDoTutorial(); };
        setTimeout(tentar, 2200);
      };

      // ---- janela de ajuda ----
      const janelaDeAjuda = selecionar('#janela-ajuda');
      let focoAntesDaAjuda = null;
      const fecharAjuda = function fecharAjuda() {
        if (janelaDeAjuda.hidden) return;
        janelaDeAjuda.hidden = true;
        if (focoAntesDaAjuda && document.contains(focoAntesDaAjuda)) focoAntesDaAjuda.focus({ preventScroll: true });
      };
      const abrirAjuda = function abrirAjuda() {
        focoAntesDaAjuda = document.activeElement;
        if (modoDoTutorial === 'tutorial') salvarProgressoDoTutorial('pausado', passoDoTutorial);
        fecharTutorial(); fecharMenuEPaineis();
        const situacao = progressoDoTutorial ? progressoDoTutorial.situacao : null, passo = progressoDoTutorial ? progressoDoTutorial.passo : 0;
        const emAndamento = situacao === 'andamento' || situacao === 'pausado';
        selecionar('#ajuda-situacao').textContent = situacao === 'concluido' ? '✔ Você já concluiu o tutorial. Reveja qualquer tópico abaixo.'
          : emAndamento ? 'Você parou no passo ' + (passo + 1) + ' de ' + PASSOS_DO_TUTORIAL.length + ' (' + TOPICOS_DO_TUTORIAL.find(item => item.id === PASSOS_DO_TUTORIAL[passo].topico).nome + ').'
          : 'O tutorial apresenta a Fazenda em ' + PASSOS_DO_TUTORIAL.length + ' passos curtos.';
        const acoes = [];
        if (emAndamento) acoes.push(botaoDoTutorial('▶ Continuar do passo ' + (passo + 1), () => iniciarTutorial(passo)));
        acoes.push(botaoDoTutorial(emAndamento || situacao === 'concluido' ? '↺ Recomeçar do início' : '▶ Começar o tutorial', () => iniciarTutorial(0), emAndamento ? 'secundario' : ''));
        selecionar('#ajuda-acoes').replaceChildren(...acoes);
        selecionar('#ajuda-topicos').replaceChildren(...TOPICOS_DO_TUTORIAL.map(topico => {
          const botao = botaoDoTutorial('', () => consultarTopicoDoTutorial(topico.id), 'topico-da-ajuda');
          const quantidade = PASSOS_DO_TUTORIAL.filter(passoDaLista => passoDaLista.topico === topico.id).length;
          botao.innerHTML = `<span aria-hidden="true">${topico.icone}</span> ${topico.nome} <small>${quantidade} ${quantidade === 1 ? 'passo' : 'passos'}</small>`;
          return botao;
        }));
        janelaDeAjuda.hidden = false;
        acoes[0].focus({ preventScroll: true });
      };
      selecionar('#botao-ajuda').onclick = abrirAjuda;
      selecionar('#fechar-ajuda').onclick = fecharAjuda;
      janelaDeAjuda.addEventListener('click', evento => { if (evento.target === janelaDeAjuda) fecharAjuda(); });   // clique fora do cartão fecha
      // Com a ajuda aberta, as teclas ficam com ela (Esc fecha; WASD, letras e Esc não chegam ao jogo nem aos painéis).
      janelaDeAjuda.addEventListener('keydown', evento => { if (evento.key === 'Escape') fecharAjuda(); if (evento.key !== 'Tab') evento.stopPropagation(); });
      addEventListener('resize', () => { if (modoDoTutorial) atualizarMolduraDoTutorial(); });

      arquivoDaMontagemConcluido('32b-tutorial.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
