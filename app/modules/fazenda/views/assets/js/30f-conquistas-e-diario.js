      // ====================================================================================================
      // FARMEDU 3D — 30f-conquistas-e-diario.js (Etapa 3: conquistas e Diário da Fazenda)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA), depois do quadro de objetivos (30e) e
      // antes do loop (31). Mesmo padrão dos demais: declarações no escopo global compartilhado, funções como "const nome = function...".
      // ====================================================================================================
      // ====================================================================================================
      // SEÇÃO 30f — CONQUISTAS E DIÁRIO DA FAZENDA
      //
      // UM SÓ SISTEMA, DOIS PAPÉIS (sem redundância):
      //  • CONQUISTAS: catálogo + condições + registro do desbloqueio (estado.conquistas.desbloqueadas). As condições LEEM as fontes que
      //    já existem (níveis, estado.objetivos.contadores, estado.eventosEspeciais, estado.mina): nenhum contador novo.
      //  • DIÁRIO: um livro com 4 abas. "Coleção" é onde as medalhas aparecem (não há outra janela de conquistas); "Minha Fazenda",
      //    "Descobertas" e "Histórias" mostram registros (estado.diario.registros), cada um com uma chave única (nunca repete).
      // FATOS REAIS: os registros nascem de avisos reais do jogo (avisarObjetivos, seção 05) no momento em que algo acontece. Num save
      // antigo, o que já era fato no save (instalações construídas, poção usada, ET descoberto...) é registrado UMA vez, com a data
      // quando o save a guarda e "antes do Diário" quando não guarda. Nada é inventado.
      // DESEMPENHO: avaliação só depois de um aviso (agrupada, no máximo 1 a cada 300 ms), na abertura do jogo e ao abrir o livro; o
      // livro só é desenhado aberto; o aviso de conquista é UM elemento reaproveitado (fila), sem acumular nós no DOM.
      // RECOMPENSA: só reconhecimento (medalhas, selos, registros). Nenhum XP, recurso ou atalho na economia.
      // INTEGRAÇÃO FUTURA/OBJETIVOS: window.farmEduConquistas (lista, relacionadaAoObjetivo, abrirDiario) e o evento do navegador
      // "farmedu:conquista-desbloqueada" (detail: id, nivel, nome, quando).
      // ====================================================================================================
      const CATEGORIAS_DAS_CONQUISTAS = {
        progressao: { nome: 'Progressão', icone: '🏗️' }, agricultura: { nome: 'Agricultura', icone: '🌾' }, animais: { nome: 'Animais', icone: '🐄' },
        alquimia: { nome: 'Alquimia', icone: '⚗️' }, secretos: { nome: 'Eventos secretos', icone: '🛸' },
      };
      const NOMES_DOS_GRAUS = ['Bronze', 'Prata', 'Ouro'];
      const tiposDeReceitaPreparados = () => estado.objetivos.contadores.tiposDePocaoPreparados.filter(tipo => !POCOES_DO_GUARDIAO[tipo].misteriosa).length;
      const totalDeReceitasComuns = Object.values(POCOES_DO_GUARDIAO).filter(pocao => !pocao.misteriosa).length;
      // tipo: 'comum' | 'progressiva' (metas em 3 graus) | 'especial' | 'secreta' (nome, descrição e condição escondidos até acontecer)
      const CONQUISTAS_DA_FAZENDA = [
        // ---- progressão ----
        { id: 'primeira-construcao', categoria: 'progressao', tipo: 'comum', icone: '🏗️', nome: 'Mãos à obra', descricao: 'Construiu a primeira instalação da fazenda.', valor: () => instalacoesNoNivel(1) },
        { id: 'primeira-evolucao', categoria: 'progressao', tipo: 'comum', icone: '⬆️', nome: 'Subindo de nível', descricao: 'Evoluiu uma instalação até o nível 2.', valor: () => instalacoesNoNivel(2) },
        { id: 'mestre-de-obras', categoria: 'progressao', tipo: 'progressiva', icone: '🧱', nome: 'Mestre de obras', descricao: 'Instalações funcionando na fazenda.', metas: [3, 7, AREAS.length], valor: () => instalacoesNoNivel(1) },
        { id: 'mina-desbloqueada', categoria: 'progressao', tipo: 'comum', icone: '⛏️', nome: 'Riquezas da caverna', descricao: 'Construiu a mina e conheceu o Guardião.', valor: () => construidaParaObjetivo('mina') ? 1 : 0 },
        { id: 'primeiro-nivel-3', categoria: 'progressao', tipo: 'especial', icone: '⭐', nome: 'Obra-prima', descricao: 'Levou uma instalação ao nível máximo.', valor: () => instalacoesNoNivel(3) },
        { id: 'fazenda-completa', categoria: 'progressao', tipo: 'especial', icone: '🏆', nome: 'Fazenda lendária', descricao: 'Levou as 13 instalações ao nível 3.', metas: [AREAS.length], valor: () => instalacoesNoNivel(3) },
        // ---- agricultura ----
        { id: 'primeiro-plantio', categoria: 'agricultura', tipo: 'comum', icone: '🌱', nome: 'Primeira semente', descricao: 'Plantou o primeiro canteiro.', valor: () => estado.objetivos.contadores.plantios },
        { id: 'primeira-colheita', categoria: 'agricultura', tipo: 'comum', icone: '🧺', nome: 'Primeira colheita', descricao: 'Colheu o primeiro canteiro.', valor: () => estado.objetivos.contadores.colheitas },
        { id: 'colhedor', categoria: 'agricultura', tipo: 'progressiva', icone: '🌾', nome: 'Colhedor', descricao: 'Canteiros colhidos (você e a equipe).', metas: [50, 250, 1000], valor: () => estado.objetivos.contadores.colheitas },
        { id: 'dominio-das-plantacoes', categoria: 'agricultura', tipo: 'especial', icone: '🚜', nome: 'Domínio das plantações', descricao: 'Colheu as quatro culturas e levou as duas plantações ao nível 3.',
          valor: () => Object.values(estado.objetivos.contadores.colheitasPorCultura).every(quantidade => quantidade > 0) && PLANTACOES_COM_CANTEIROS.every(idDaArea => (estado.niveis[idDaArea] | 0) >= 3) ? 1 : 0 },
        // ---- animais ----
        { id: 'primeiro-animal', categoria: 'animais', tipo: 'comum', icone: '🐣', nome: 'Primeiros moradores', descricao: 'Construiu a primeira instalação de animais.', valor: () => temAnimaisParaObjetivo() ? 1 : 0 },
        { id: 'primeira-producao', categoria: 'animais', tipo: 'comum', icone: '🥚', nome: 'Primeira produção', descricao: 'Coletou a primeira produção dos animais.', valor: () => estado.objetivos.contadores.producaoColetada },
        { id: 'criador', categoria: 'animais', tipo: 'progressiva', icone: '🥛', nome: 'Criador dedicado', descricao: 'Produtos coletados dos animais.', metas: [10, 50, 200], valor: () => estado.objetivos.contadores.producaoColetada },
        { id: 'curral-completo', categoria: 'animais', tipo: 'especial', icone: '🐄', nome: 'Curral completo', descricao: 'Levou o curral ao nível 3, com todas as vacas.', valor: () => (estado.niveis.curral | 0) >= 3 ? 1 : 0 },
        // ---- alquimia ----
        { id: 'primeira-pocao', categoria: 'alquimia', tipo: 'comum', icone: '⚗️', nome: 'Aprendiz do Guardião', descricao: 'Preparou a primeira poção.', valor: () => estado.objetivos.contadores.pocoesPreparadas },
        { id: 'alquimista', categoria: 'alquimia', tipo: 'progressiva', icone: '📜', nome: 'Alquimista', descricao: 'Receitas diferentes preparadas.', metas: [3, 5, totalDeReceitasComuns], valor: tiposDeReceitaPreparados },
        { id: 'lenda-do-ceu', categoria: 'alquimia', tipo: 'secreta', icone: '🦄', nome: 'A lenda do céu', descricao: 'Usou a Poção Misteriosa e viu o unicórnio cruzar o céu.', valor: () => estado.eventosEspeciais.misterio.usadoEm ? 1 : 0 },
        // ---- eventos secretos ----
        { id: 'primeiro-contato', categoria: 'secretos', tipo: 'secreta', icone: '🛸', nome: 'Primeiro contato', descricao: 'Viu um disco voador sobre a fazenda.', valor: () => estado.eventosEspeciais.alienigena.abducoes > 0 || estado.eventosEspeciais.et.descobertoEm ? 1 : 0 },
        { id: 'vaca-viajante', categoria: 'secretos', tipo: 'secreta', icone: '🐮', nome: 'Vaca viajante', descricao: 'Presenciou uma abdução no curral.', valor: () => estado.eventosEspeciais.alienigena.abducoes },
        { id: 'amigo-das-estrelas', categoria: 'secretos', tipo: 'secreta', icone: '👽', nome: 'Amigo das estrelas', descricao: 'Descobriu o segredo do ET e das vacas.', valor: () => estado.eventosEspeciais.et.descobertoEm ? 1 : 0 },
        { id: 'pedra-que-canta', categoria: 'secretos', tipo: 'secreta', icone: '💎', nome: 'A pedra que canta', descricao: 'Encontrou a pedra secreta da fazenda.', valor: () => estado.objetivos.contadores.pedraSecreta },
      ];
      for (const conquista of CONQUISTAS_DA_FAZENDA) if (!conquista.metas) conquista.metas = [1];
      // Objetivo do quadro (seção 30e) → conquista ligada a ele (o quadro mostra a medalha quando os dois estão concluídos).
      const CONQUISTA_DO_OBJETIVO = { 'construir-mina': 'mina-desbloqueada', 'primeira-evolucao': 'primeira-evolucao', 'nivel-maximo': 'primeiro-nivel-3', 'fazenda-lendaria': 'fazenda-completa',
        'primeiros-animais': 'primeiro-animal', 'plantar-10': 'primeiro-plantio', 'primeira-pocao': 'primeira-pocao', 'tres-receitas': 'alquimista', 'lenda-do-ceu': 'lenda-do-ceu',
        'visitantes-do-espaco': 'vaca-viajante', 'amigo-das-estrelas': 'amigo-das-estrelas', 'pedra-secreta': 'pedra-que-canta', 'colher-20': 'primeira-colheita', 'producao-10': 'criador' };
      const grauDaConquista = id => Object.keys(estado.conquistas.desbloqueadas[id] || {}).length;   // 0 = bloqueada; 1–3 = graus conquistados
      const situacaoDaConquista = function situacaoDaConquista(conquista) {
        const grau = grauDaConquista(conquista.id), registro = estado.conquistas.desbloqueadas[conquista.id] || {};
        const valor = Math.max(0, Math.floor(conquista.valor() || 0)), proximaMeta = conquista.metas[grau] || null;
        return { grau, total: conquista.metas.length, valor, proximaMeta, ultimoQuando: grau ? registro[grau] : undefined, desbloqueada: grau > 0 };
      };

      // ---- Diário: registros com chave única (nunca duplicam) ----
      const nomeDaFazendaNoDiario = () => estado.nomeDaFazenda || 'a fazenda';
      const registrarNoDiario = function registrarNoDiario(chave, registro) {
        if (estado.diario.registros[chave]) return false;   // já existe: não repete (nem ao recarregar)
        estado.diario.registros[chave] = { categoria: registro.categoria, quando: registro.quando === null ? null : (registro.quando || Date.now()), icone: registro.icone || '📝', titulo: registro.titulo, texto: registro.texto || '' };
        diarioMudou = true;
        return true;
      };
      const tituloDaObra = (idDaArea, nivel) => {
        const nome = nomeDaArea(idDaArea);
        if (nivel === 1 && idDaArea === 'ponte') return nome + ' reparada';
        if (nivel === 1 && idDaArea === 'casa') return 'Casa reformada';
        return nivel === 1 ? 'Nova construção: ' + nome : nome + ' chegou ao nível ' + nivel;   // neutro: os nomes das áreas têm gêneros diferentes
      };
      const registrarObra = (idDaArea, nivel, quando) => registrarNoDiario('obra:' + idDaArea + ':' + nivel, { categoria: 'fazenda', quando, icone: nivel >= 3 ? '⭐' : nivel === 2 ? '⬆️' : (AREAS.find(area => area.id === idDaArea) || {}).icone || '🏗️',
        titulo: tituloDaObra(idDaArea, nivel), texto: nivel === 1 ? 'Uma nova parte de ' + nomeDaFazendaNoDiario() + ' começou a funcionar.' : 'Nível ' + nivel + ' de ' + NIVEL_MAXIMO + '.' });
      const TEXTO_DO_UNICORNIO = 'Uma criatura impossível cruzou os céus da Fazenda. Ninguém sabe de onde veio. Mas dizem que um arco-íris ainda guarda a lembrança de sua passagem.';
      const TEXTO_DO_ET = 'Um pequeno disco desceu bem em cima de uma vaca. Um ET verde espiou lá de dentro, acendeu o feixe e levou a vaca para um passeio. Vinte segundos depois, ela estava de volta ao curral, sem um arranhão.';
      const textoDaAbducao = hora => (hora === null ? 'Certa vez' : hora >= 19.9 || hora < 5.7 ? 'Durante a noite' : hora < 12 ? 'Numa manhã tranquila' : 'Numa tarde tranquila')
        + ', um estranho objeto cruzou o céu. Uma vaca desapareceu por alguns instantes e voltou como se nada tivesse acontecido. O Guardião prefere não comentar.';
      // Descobertas e histórias dos eventos especiais (usadas na hora do evento e, num save antigo, uma vez na preparação do Diário)
      const registrarUnicornio = quando => { registrarNoDiario('descoberta:unicornio', { categoria: 'descobertas', quando, icone: '🦄', titulo: 'A lenda do céu', texto: 'A Poção Misteriosa do Unicórnio foi usada.' });
        registrarNoDiario('historia:unicornio', { categoria: 'historias', quando, icone: '🌈', titulo: 'Uma criatura impossível', texto: TEXTO_DO_UNICORNIO }); };
      const registrarAbducao = (quando, hora) => { registrarNoDiario('descoberta:abducao', { categoria: 'descobertas', quando, icone: '🛸', titulo: 'Visitantes do espaço', texto: 'Um disco voador levou uma vaca do curral por alguns instantes.' });
        registrarNoDiario('historia:abducao', { categoria: 'historias', quando, icone: '🐮', titulo: 'O disco voador sobre o curral', texto: textoDaAbducao(hora) }); };
      const registrarET = quando => { registrarNoDiario('descoberta:et', { categoria: 'descobertas', quando, icone: '👽', titulo: 'O segredo do ET', texto: 'Quem dá atenção às vacas pode receber uma visita inesperada.' });
        registrarNoDiario('historia:et', { categoria: 'historias', quando, icone: '👽', titulo: 'Um passeio no espaço', texto: TEXTO_DO_ET }); };
      const registrarPedra = quando => { registrarNoDiario('descoberta:pedra', { categoria: 'descobertas', quando, icone: '💎', titulo: 'A pedra que canta', texto: 'Uma pedra da fazenda guarda um som escondido.' });
        registrarNoDiario('historia:pedra', { categoria: 'historias', quando, icone: '✨', titulo: 'Cristais que cantam', texto: 'Uma pedra da fazenda cantou quando foi tocada, e seus cristais brilharam por um instante.' }); };

      // ---- Avaliação das conquistas (só depois de um aviso relevante) ----
      let avaliacaoDasConquistasAgendada = null, diarioMudou = false, avaliacoesDasConquistas = 0;
      const filaDeAvisosDeConquista = [];
      const avaliarConquistas = function avaliarConquistas(silencioso = false) {
        avaliacaoDasConquistasAgendada = null; avaliacoesDasConquistas++;
        const novas = [];
        for (const conquista of CONQUISTAS_DA_FAZENDA) {
          const valor = Math.floor(conquista.valor() || 0), registro = estado.conquistas.desbloqueadas[conquista.id] || {};
          conquista.metas.forEach((meta, indice) => {
            const grau = indice + 1;
            if (registro[grau] !== undefined || valor < meta) return;
            registro[grau] = silencioso ? null : Date.now();   // silencioso = já valia antes do Diário: a data real é desconhecida
            estado.conquistas.desbloqueadas[conquista.id] = registro;
            novas.push({ conquista, grau, quando: registro[grau] });
          });
        }
        for (const { conquista, grau, quando } of novas) {
          const nomeDoGrau = conquista.tipo === 'progressiva' ? ' (' + NOMES_DOS_GRAUS[grau - 1] + ')' : '';
          registrarNoDiario('conquista:' + conquista.id + ':' + grau, { categoria: 'colecao', quando, icone: conquista.icone, titulo: conquista.nome + nomeDoGrau, texto: conquista.descricao });
          if (!silencioso) {
            filaDeAvisosDeConquista.push({ conquista, grau });
            try { document.dispatchEvent(new CustomEvent('farmedu:conquista-desbloqueada', { detail: { id: conquista.id, nivel: grau, nome: conquista.nome, quando } })); } catch (erro) { }
          }
        }
        if (novas.length || diarioMudou) { diarioMudou = false; salvarProgresso(); }
        if (filaDeAvisosDeConquista.length) mostrarProximoAvisoDeConquista();
        atualizarBotaoDoDiario();
        if (!janelaDoDiario.hidden) desenharDiario();
        return novas.map(item => item.conquista.id + ':' + item.grau);
      };
      const agendarAvaliacaoDasConquistas = () => { if (!avaliacaoDasConquistasAgendada) avaliacaoDasConquistasAgendada = setTimeout(() => avaliarConquistas(false), 300); };
      // Avisos do jogo (os mesmos do quadro de objetivos; o quadro já atualizou os contadores antes deste ouvinte).
      ouvintesDosObjetivos.push((tipo, detalhe) => {
        const contadores = estado.objetivos.contadores;
        if (tipo === 'construcao' && detalhe.idDaArea && detalhe.nivel) {
          registrarObra(detalhe.idDaArea, detalhe.nivel);
          if (detalhe.nivel === 1 && ANIMAIS_DAS_AREAS[detalhe.idDaArea] && Object.keys(ANIMAIS_DAS_AREAS).filter(construidaParaObjetivo).length === 1) {
            const animal = ANIMAIS_DAS_AREAS[detalhe.idDaArea];
            registrarNoDiario('historia:primeiros-animais', { categoria: 'historias', icone: animal.icone, titulo: 'Chegaram os primeiros moradores', texto: 'O ' + nomeDaArea(detalhe.idDaArea).toLowerCase() + ' recebeu os primeiros animais. A partir de agora, eles precisam de comida das plantações.' });
          }
        } else if (tipo === 'colheita' && contadores.colheitas === 1 && CULTURAS[detalhe.cultura]) {
          registrarNoDiario('historia:primeira-colheita', { categoria: 'historias', icone: CULTURAS[detalhe.cultura].icone, titulo: 'A primeira colheita', texto: 'O primeiro canteiro de ' + CULTURAS[detalhe.cultura].nome.toLowerCase() + ' foi colhido em ' + nomeDaFazendaNoDiario() + '. Foi o começo de tudo.' });
        } else if (tipo === 'arvore' && contadores.arvoresCortadas === 1) {
          registrarNoDiario('historia:lenhador', { categoria: 'historias', icone: '🪓', titulo: 'O lenhador do acampamento', texto: 'O lenhador derrubou a primeira árvore para a fazenda e entregou ' + (detalhe.madeira || 0) + ' madeiras. A árvore vai rebrotar.' });
        } else if (tipo === 'mina' && estado.mina.ciclos === 1) {
          registrarNoDiario('historia:mina', { categoria: 'historias', icone: '⛏️', titulo: 'O carrinho voltou da caverna', texto: 'Na primeira viagem, o carrinho da mina trouxe ' + (detalhe.minerios || 0) + ' minérios para o Guardião.' });
        } else if (tipo === 'pocao-preparada' && contadores.pocoesPreparadas === 1 && POCOES_DO_GUARDIAO[detalhe.tipo]) {
          const pocao = POCOES_DO_GUARDIAO[detalhe.tipo];
          registrarNoDiario('historia:guardiao', { categoria: 'historias', icone: '🧙', titulo: 'A primeira receita do Guardião', texto: 'O Guardião da Mina transformou minérios em ' + (pocao.misteriosa ? 'uma poção misteriosa que nem ele explica' : pocao.nome) + '.' });
        } else if (tipo === 'lenda') registrarUnicornio(estado.eventosEspeciais.misterio.usadoEm || Date.now());
        else if (tipo === 'abducao') registrarAbducao(Date.now(), CICLO_DE_DIA_E_NOITE.hora);
        else if (tipo === 'et') registrarET(estado.eventosEspeciais.et.descobertoEm || Date.now());
        else if (tipo === 'pedra-secreta') registrarPedra(Date.now());
        agendarAvaliacaoDasConquistas();
      });

      // ---- Aviso de conquista: UM elemento reaproveitado, uma conquista por vez (fila), animação curta ----
      const avisoDeConquista = selecionar('#aviso-de-conquista');
      let avisoDeConquistaOcupado = false;
      const htmlDaMedalha = (conquista, grau, revelada = true, tamanho = '') => {
        const classeDoGrau = conquista.tipo === 'progressiva' ? ['bronze', 'prata', 'ouro'][Math.max(0, grau - 1)] : conquista.tipo;
        return `<span class="medalha medalha-${classeDoGrau}${grau ? '' : ' bloqueada'}${revelada ? '' : ' oculta'}${tamanho ? ' ' + tamanho : ''}" aria-hidden="true"><span class="face-da-medalha">${revelada ? conquista.icone : '?'}</span></span>`;
      };
      const mostrarProximoAvisoDeConquista = function mostrarProximoAvisoDeConquista() {
        if (avisoDeConquistaOcupado || !filaDeAvisosDeConquista.length) return;
        avisoDeConquistaOcupado = true;
        const { conquista, grau } = filaDeAvisosDeConquista.shift();
        const nomeDoGrau = conquista.tipo === 'progressiva' ? ' · ' + NOMES_DOS_GRAUS[grau - 1] : '';
        avisoDeConquista.innerHTML = `${htmlDaMedalha(conquista, grau, true, 'media')}<div class="texto-do-aviso-de-conquista"><small>${conquista.tipo === 'secreta' ? '✨ Conquista secreta desbloqueada!' : '🏅 Conquista desbloqueada!'}</small><b>${conquista.nome}${nomeDoGrau}</b><span>${conquista.descricao}</span></div>`;
        avisoDeConquista.hidden = false; avisoDeConquista.classList.remove('saindo'); void avisoDeConquista.offsetWidth; avisoDeConquista.classList.add('entrando');
        tocarEfeito('levelUp');
        setTimeout(() => {
          avisoDeConquista.classList.remove('entrando'); avisoDeConquista.classList.add('saindo');
          setTimeout(() => { avisoDeConquista.hidden = true; avisoDeConquista.classList.remove('saindo'); avisoDeConquistaOcupado = false; mostrarProximoAvisoDeConquista(); }, 260);
        }, 3600);
      };

      // ---- O livro ----
      const botaoDoDiario = selecionar('#botao-diario'), janelaDoDiario = selecionar('#janela-diario'), paginasDoDiario = selecionar('#paginas-do-diario');
      const ABAS_DO_DIARIO = [['fazenda', '🏡', 'Minha Fazenda'], ['descobertas', '✨', 'Descobertas'], ['colecao', '🏅', 'Coleção'], ['historias', '📜', 'Histórias']];
      let abaDoDiario = 'fazenda', assinaturaDoDiario = '';
      const dataDoRegistro = quando => quando ? new Date(quando).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'antes do Diário';
      const registrosDaCategoria = categoria => Object.entries(estado.diario.registros).filter(([, registro]) => registro.categoria === categoria)
        .sort(([, a], [, b]) => (b.quando || 0) - (a.quando || 0));
      const htmlDoRegistro = ([chave, registro], extra = '') => `<li class="registro-do-diario" data-registro="${chave}"><span class="icone-do-registro" aria-hidden="true">${registro.icone}</span>
        <div><span class="data-do-registro">${dataDoRegistro(registro.quando)}</span><b>${registro.titulo}</b>${registro.texto ? `<p>${registro.texto}</p>` : ''}${extra}</div></li>`;
      const paginaVazia = texto => `<p class="pagina-vazia">${texto}</p>`;
      const desenharDiario = function desenharDiario() {
        const assinatura = JSON.stringify([abaDoDiario, Object.keys(estado.diario.registros).length, estado.conquistas.desbloqueadas, estado.eventosEspeciais.alienigena.abducoes, estado.eventosEspeciais.et.vezes,
          abaDoDiario === 'colecao' ? CONQUISTAS_DA_FAZENDA.map(conquista => Math.floor(conquista.valor() || 0)) : 0]);
        if (assinatura === assinaturaDoDiario) return;
        assinaturaDoDiario = assinatura;
        selecionar('#nome-no-diario').textContent = estado.nomeDaFazenda || '';
        for (const fita of janelaDoDiario.querySelectorAll('[data-aba-diario]')) { const ativa = fita.dataset.abaDiario === abaDoDiario; fita.classList.toggle('ativa', ativa); fita.setAttribute('aria-selected', String(ativa)); fita.tabIndex = ativa ? 0 : -1; }
        let html = '';
        if (abaDoDiario === 'fazenda') {
          const registros = registrosDaCategoria('fazenda');
          html = `<h3 class="titulo-da-pagina">🏡 Minha Fazenda</h3><p class="subtitulo-da-pagina">Construções, evoluções e marcos de ${nomeDaFazendaNoDiario()}.</p>`
            + (registros.length ? `<ol class="registros-do-diario">${registros.map(item => htmlDoRegistro(item)).join('')}</ol>` : paginaVazia('Nada construído ainda. A primeira plantação é grátis: comece por ela!'));
        } else if (abaDoDiario === 'descobertas') {
          const vezes = { 'descoberta:abducao': estado.eventosEspeciais.alienigena.abducoes, 'descoberta:et': estado.eventosEspeciais.et.vezes };
          const registros = registrosDaCategoria('descobertas');
          html = `<h3 class="titulo-da-pagina">✨ Descobertas</h3><p class="subtitulo-da-pagina">Acontecimentos especiais que você presenciou.</p>`
            + (registros.length ? `<ol class="registros-do-diario">${registros.map(item => htmlDoRegistro(item, vezes[item[0]] > 1 ? `<span class="vezes-do-registro">Aconteceu ${vezes[item[0]]} vezes</span>` : '')).join('')}</ol>` : paginaVazia('Nenhuma descoberta ainda. Este mundo guarda alguns segredos…'));
        } else if (abaDoDiario === 'colecao') {
          const situacoes = CONQUISTAS_DA_FAZENDA.map(conquista => ({ conquista, ...situacaoDaConquista(conquista) }));
          const graus = situacoes.reduce((soma, item) => soma + item.grau, 0), totalDeGraus = situacoes.reduce((soma, item) => soma + item.total, 0);
          html = `<h3 class="titulo-da-pagina">🏅 Coleção</h3><p class="subtitulo-da-pagina"><b>${situacoes.filter(item => item.desbloqueada).length}</b> de ${situacoes.length} conquistas · ${graus} de ${totalDeGraus} medalhas</p>`
            + Object.entries(CATEGORIAS_DAS_CONQUISTAS).map(([categoria, info]) => `<section class="grupo-de-medalhas"><h4>${info.icone} ${info.nome}</h4><ul class="medalhas">${situacoes.filter(item => item.conquista.categoria === categoria).map(item => {
              const { conquista, grau, total, valor, proximaMeta } = item, oculta = conquista.tipo === 'secreta' && !grau;
              const progresso = conquista.tipo === 'progressiva' && proximaMeta ? `<span class="progresso-da-medalha"><i style="width:${Math.min(100, Math.round(valor / proximaMeta * 100))}%"></i></span><small>${Math.min(valor, proximaMeta)} / ${proximaMeta} para ${NOMES_DOS_GRAUS[grau]}</small>` : '';
              const rotulo = oculta ? 'Conquista secreta' : conquista.tipo === 'progressiva' ? (grau ? NOMES_DOS_GRAUS[grau - 1] + (grau < total ? '' : ' · completa') : 'Bloqueada') : conquista.tipo === 'especial' ? 'Especial' : conquista.tipo === 'secreta' ? 'Secreta' : 'Comum';
              return `<li class="cartao-da-medalha${grau ? '' : ' bloqueada'}${oculta ? ' oculta' : ''}" title="${oculta ? 'Conquista secreta: continue explorando a fazenda' : conquista.nome + ' — ' + conquista.descricao}">
                ${htmlDaMedalha(conquista, grau, !oculta)}<b>${oculta ? '???' : conquista.nome}</b><span class="tipo-da-medalha">${rotulo}</span>
                <small>${oculta ? 'Continue explorando…' : conquista.descricao}</small>${progresso}${grau ? `<span class="data-da-medalha">${dataDoRegistro(item.ultimoQuando)}</span>` : ''}</li>`;
            }).join('')}</ul></section>`).join('')
            + (() => { const marcos = registrosDaCategoria('colecao').slice(0, 5); return marcos.length ? `<h4 class="titulo-dos-marcos">🕰️ Últimos marcos</h4><ol class="registros-do-diario compactos">${marcos.map(item => htmlDoRegistro(item)).join('')}</ol>` : ''; })();
        } else {
          const registros = registrosDaCategoria('historias');
          html = `<h3 class="titulo-da-pagina">📜 Histórias</h3><p class="subtitulo-da-pagina">Pequenos registros do que aconteceu por aqui.</p>`
            + (registros.length ? `<ol class="registros-do-diario historias">${registros.map(item => htmlDoRegistro(item)).join('')}</ol>` : paginaVazia('As histórias desta fazenda ainda vão começar.'));
        }
        paginasDoDiario.innerHTML = html;
      };
      const atualizarBotaoDoDiario = function atualizarBotaoDoDiario() {
        const ultimo = Math.max(0, ...Object.values(estado.diario.registros).map(registro => registro.quando || 0));
        selecionar('#novidade-do-diario').hidden = !(ultimo > estado.diario.vistoAte);
      };
      const abrirDiario = function abrirDiario(aba) {
        if (typeof fecharMenuEPaineis === 'function') fecharMenuEPaineis();
        if (!janelaDosObjetivos.hidden) fecharQuadroDeObjetivos();
        if (aba && ABAS_DO_DIARIO.some(([id]) => id === aba)) abaDoDiario = aba;
        avaliarConquistas(false);
        assinaturaDoDiario = ''; janelaDoDiario.hidden = false; botaoDoDiario.setAttribute('aria-expanded', 'true');
        desenharDiario();
        estado.diario.vistoAte = Date.now(); salvarProgresso(); atualizarBotaoDoDiario();
        tocarEfeito('Enter'); selecionar('#fechar-diario').focus();
      };
      const fecharDiario = function fecharDiario() { if (janelaDoDiario.hidden) return; janelaDoDiario.hidden = true; botaoDoDiario.setAttribute('aria-expanded', 'false'); botaoDoDiario.focus(); };
      botaoDoDiario.addEventListener('click', () => { if (janelaDoDiario.hidden) abrirDiario(); else fecharDiario(); });
      selecionar('#fechar-diario').addEventListener('click', fecharDiario);
      janelaDoDiario.addEventListener('click', evento => {
        if (evento.target === janelaDoDiario) { fecharDiario(); return; }
        const fita = evento.target.closest('[data-aba-diario]');
        if (fita) { abaDoDiario = fita.dataset.abaDiario; desenharDiario(); fita.focus(); }
      });
      janelaDoDiario.addEventListener('keydown', evento => {   // fitas do livro: setas/Home/End (padrão de abas)
        const fitas = [...janelaDoDiario.querySelectorAll('[data-aba-diario]')], atual = fitas.indexOf(document.activeElement);
        if (atual < 0) return;
        const destino = { ArrowRight: atual + 1, ArrowLeft: atual - 1, Home: 0, End: fitas.length - 1 }[evento.key];
        if (destino === undefined) return;
        evento.preventDefault(); evento.stopPropagation();
        const fita = fitas[(destino + fitas.length) % fitas.length]; abaDoDiario = fita.dataset.abaDiario; desenharDiario(); fita.focus();
      });
      addEventListener('keydown', evento => { if (evento.key === 'Escape' && !janelaDoDiario.hidden) fecharDiario(); });

      // ---- Abertura do jogo: preparação do Diário (uma vez por save) e avaliação inicial ----
      // 1ª vez neste save: o que JÁ era fato vira registro (sem data quando o save não a guarda) e as conquistas que já valiam são
      // desbloqueadas em silêncio (sem uma chuva de avisos). Depois disso, só avisos reais criam registros e conquistas.
      const primeiraVezDoDiario = !estado.diario.iniciadoEm;
      if (primeiraVezDoDiario) {
        const agora = Date.now(), saveNovo = !AREAS.some(area => (estado.niveis[area.id] | 0) > 0) && !estado.objetivos.contadores.colheitas;
        estado.diario.iniciadoEm = agora; estado.diario.vistoAte = agora;
        registrarNoDiario('fazenda:diario', { categoria: 'fazenda', quando: agora, icone: '📖', titulo: 'O Diário foi aberto', texto: saveNovo ? 'Uma fazenda nova começa aqui.' : 'A partir de hoje, o que acontecer em ' + nomeDaFazendaNoDiario() + ' fica registrado aqui.' });
        for (const area of AREAS) for (let nivel = 1; nivel <= (estado.niveis[area.id] | 0); nivel++) registrarObra(area.id, nivel, null);
        if (estado.eventosEspeciais.misterio.usadoEm) registrarUnicornio(estado.eventosEspeciais.misterio.usadoEm);
        if (estado.eventosEspeciais.alienigena.abducoes > 0) registrarAbducao(null, null);
        if (estado.eventosEspeciais.et.descobertoEm) registrarET(estado.eventosEspeciais.et.descobertoEm);
        if (estado.objetivos.contadores.pedraSecreta > 0) registrarPedra(null);
      }
      if (!estado.conquistas.iniciadoEm) { estado.conquistas.iniciadoEm = Date.now(); avaliarConquistas(true); }
      else setTimeout(() => avaliarConquistas(false), 1800);   // o que foi cumprido com o jogo fechado aparece uma vez
      if (primeiraVezDoDiario) salvarProgresso();
      atualizarBotaoDoDiario();
      window.farmEduConquistas = {
        lista: () => CONQUISTAS_DA_FAZENDA.map(conquista => ({ id: conquista.id, categoria: conquista.categoria, tipo: conquista.tipo, nome: conquista.nome, metas: conquista.metas.slice(), ...situacaoDaConquista(conquista) })),
        relacionadaAoObjetivo: idDoObjetivo => { const id = CONQUISTA_DO_OBJETIVO[idDoObjetivo], conquista = id && CONQUISTAS_DA_FAZENDA.find(item => item.id === id); return conquista ? { id, nome: conquista.nome, icone: conquista.icone, desbloqueada: grauDaConquista(id) > 0 } : null; },
        resumo: () => ({ desbloqueadas: CONQUISTAS_DA_FAZENDA.filter(conquista => grauDaConquista(conquista.id)).length, total: CONQUISTAS_DA_FAZENDA.length }),
        registros: () => JSON.parse(JSON.stringify(estado.diario.registros)),
        avaliar: () => avaliarConquistas(false), abrirDiario, fecharDiario,
        estatisticas: () => ({ avaliacoes: avaliacoesDasConquistas, filaDeAvisos: filaDeAvisosDeConquista.length }),
      };

      arquivoDaMontagemConcluido('30f-conquistas-e-diario.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
