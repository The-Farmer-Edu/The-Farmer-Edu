      // ====================================================================================================
      // FARMEDU 3D — 30b-integracao-e-paineis.js (Fase 3B da refatoração: seção 30 — integração e painéis da Mark 8.2)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================
      // ---- integração: um único ponto chamado pelo loop principal (seção 31) ----
      let temporizadorDeUmSegundo = 0, temporizadorDoSalvamento = 5, ultimaAssinaturaDosCards = '';
      const atualizarSistemasDaMark82 = function atualizarSistemasDaMark82(segundosDesdeUltimoFrame, tempo) {
        atualizarMineracao(segundosDesdeUltimoFrame);
        atualizarPainelDoGuardiao();                         // seção 28b: painel de poções aberto acompanha minérios e cota
        atualizarInventario();                               // seção 27b: inventário aberto acompanha coletas, gastos e poções
        atualizarPainelDaEstrutura();                        // seção 32: painel da estrutura aberto acompanha XP, madeira e nível
        atualizarGuardiao(tempo); atualizarLetreirosDosNpcs();  // seção 28b: animação do Guardião e letreiros dos NPCs
        atualizarLenhador(segundosDesdeUltimoFrame, tempo);    // seção 29b: lenhador e rebrota das árvores do acampamento
        atualizarTrabalhadores(segundosDesdeUltimoFrame, tempo);
        atualizarMonstrosNoturnos(segundosDesdeUltimoFrame, tempo);
        temporizadorDeUmSegundo -= segundosDesdeUltimoFrame;
        if (temporizadorDeUmSegundo <= 0) {
          temporizadorDeUmSegundo = 1;
          atualizarAlimentacao(); atualizarVisualDaLavoura(); atualizarSinaisDeFome(); atualizarResumoDeRecursos(); atualizarPaineisDaMark82(false);
          const assinatura = AREAS.map(area => informacaoExtraDoCard(area.id)).join('|');
          if (assinatura !== ultimaAssinaturaDosCards) { ultimaAssinaturaDosCards = assinatura; desenharCards(); }
        }
        temporizadorDoSalvamento -= segundosDesdeUltimoFrame;
        if (temporizadorDoSalvamento <= 0) { temporizadorDoSalvamento = 5; if (houveMudancaParaSalvar) { houveMudancaParaSalvar = false; salvarProgresso(); } }
      };
      // Linha extra dos cartões: cocho e saúde dos animais, estado da mina, canteiros prontos.
      const informacaoExtraDoCard = function informacaoExtraDoCard(idDaArea) {
        if (!estado.niveis[idDaArea]) return '';
        if (ANIMAIS_DAS_AREAS[idDaArea]) {
          const situacao = estado.animais[idDaArea], alerta = situacao.comida < ALIMENTACAO_CONFIG.avisoDeFomeAbaixoDe || situacao.saude < 50;
          return `<div class="info-extra${alerta ? ' alerta' : ''}">🍽 ${Math.floor(situacao.comida)}% · ❤ ${Math.floor(situacao.saude)}%${situacao.mortos ? ' · 💀 ' + Math.min(situacao.mortos, totalDeAnimais(idDaArea)) : ''}</div>`;
        }
        if (idDaArea === 'mina') return `<div class="info-extra">${textoDoEstadoDaMina()}</div>`;
        if (PLANTACOES_COM_CANTEIROS.includes(idDaArea)) {
          const canteiros = canteirosDaArea(idDaArea).slice(0, quantidadeDeCanteiros(idDaArea)), prontos = canteiros.filter(canteiro => estagioDoCanteiro(canteiro) === 3).length;
          return `<div class="info-extra">${prontos ? '✅ ' + prontos + ' pronto(s) para colher' : '🌱 ' + canteiros.filter(canteiro => canteiro.cultura).length + '/' + canteiros.length + ' plantados'}</div>`;
        }
        if (idDaArea === 'casa') return `<div class="info-extra">👷 ${vagasOcupadas()}/${capacidadeDaCasa()} vagas ocupadas</div>`;
        return '';
      };

      // ---- painéis "🌾 Fazenda" e "👷 Equipe" (mesmo estilo dos painéis Tempo e Áudio) ----
      const painelDaFazenda = selecionar('#painel-fazenda'), botaoDaFazenda = selecionar('#botao-painel-fazenda'), painelDaEquipe = selecionar('#painel-equipe'), botaoDaEquipe = selecionar('#botao-painel-equipe');
      PAINEIS_DA_BARRA.push([painelDaFazenda, botaoDaFazenda], [painelDaEquipe, botaoDaEquipe]);
      botaoDaFazenda.onclick = () => { alternarPainel(painelDaFazenda, botaoDaFazenda); atualizarPaineisDaMark82(true); };
      botaoDaEquipe.onclick = () => { alternarPainel(painelDaEquipe, botaoDaEquipe); atualizarPaineisDaMark82(true); };
      let plantacaoSelecionada = 'plantacaoGrande', canteiroSelecionado = null, confirmacaoDeDispensa = null;
      const trabalhadoresExpandidos = new Set();      // fichas abertas no painel Equipe (o estado sobrevive às atualizações do painel)
      let interagindoComPainel = false;               // não redesenha o painel enquanto o dedo/mouse está pressionado (o clique não se perde)
      for (const painel of [painelDaFazenda, painelDaEquipe]) {
        painel.addEventListener('pointerdown', () => { interagindoComPainel = true; });
        // Botão de ação: executa e redesenha NA HORA (o próximo toque já encontra os botões novos). Outros cliques (ex.: abrir
        // a ficha de um trabalhador pelo <summary>) NÃO redesenham: antes o redesenho no meio do clique desfazia a abertura.
        painel.addEventListener('click', evento => { const botao = evento.target.closest('[data-acao]'); interagindoComPainel = false; if (botao) { evento.preventDefault(); executarAcaoDoPainel(botao); atualizarPaineisDaMark82(true); } });
      }
      painelDaEquipe.addEventListener('toggle', evento => { const ficha = evento.target; if (ficha.dataset && ficha.dataset.ficha) { if (ficha.open) trabalhadoresExpandidos.add(+ficha.dataset.ficha); else trabalhadoresExpandidos.delete(+ficha.dataset.ficha); } }, true);
      addEventListener('pointerup', () => setTimeout(() => { interagindoComPainel = false; }, 250));
      const executarAcaoDoPainel = function executarAcaoDoPainel(botao) {
        if (!botao || botao.disabled) return;
        const { acao, indice, cultura, area, id, atributo } = botao.dataset;
        if (acao === 'aba') { plantacaoSelecionada = area; canteiroSelecionado = null; }
        else if (acao === 'cultura') culturaSelecionada = cultura;
        else if (acao === 'canteiro') {                                        // vazio: planta a cultura escolhida · maduro: escolher quem colhe
          const canteiro = canteirosDaArea(area)[+indice], estagio = estagioDoCanteiro(canteiro);
          if (estagio < 0) { if (plantarNoCanteiro(area, +indice)) registrarAtividade(); canteiroSelecionado = null; }
          else if (estagio === 3) canteiroSelecionado = +indice;
          else { canteiroSelecionado = null; mostrarAviso(CULTURAS[canteiro.cultura].icone + ' ' + CULTURAS[canteiro.cultura].nome + ': ' + Math.floor(progressoDoCanteiro(canteiro) * 100) + '% — ainda crescendo.'); }
        }
        else if (acao === 'colher-com') { ordenarColheitaDoCanteiro(area, +indice, id ? +id : null); canteiroSelecionado = null; }   // ordem individual a um trabalhador
        else if (acao === 'colher-eu') { colherCanteiroPeloJogador(area, +indice); canteiroSelecionado = null; }                  // o próprio jogador colhe este canteiro
        else if (acao === 'colher-tudo-jogador') { colherTudoPeloJogador(area); canteiroSelecionado = null; }                     // COLHER TUDO (jogador, só esta plantação)
        else if (acao === 'ordem-geral') ordenarColheitaGeral(area, +id);                                                          // trabalhador colhe a plantação inteira
        else if (acao === 'cancelar-ordem') { const entidade = trabalhadoresNaCena.get(+id); if (entidade && entidade.ordem) { cancelarOrdem(entidade); mostrarAviso(entidade.dados.nome + ' parou e voltou a explorar.'); } }
        else if (acao === 'plantar-todos') { plantarEmTodosOsVazios(area); registrarAtividade(); }
        else if (acao === 'alimentar') alimentarAnimais(area);
        else if (acao === 'coletar-producao') coletarProducao(area);                                        // rebalanceamento: produção dos animais → cota de Criação
        else if (acao === 'repor') reporAnimal(area);
        else if (acao === 'contratar') executarUmaVez(() => contratarTrabalhador(+id));
        else if (acao === 'recuperar') executarUmaVez(() => recuperarTrabalhador(+id));
        else if (acao === 'melhorar') executarUmaVez(() => melhorarAtributo(+id, atributo));
        else if (acao === 'dispensar') confirmacaoDeDispensa = { id: +id, ate: Date.now() + 6000 };
        else if (acao === 'cancelar-dispensa') confirmacaoDeDispensa = null;
        else if (acao === 'para-casa') executarUmaVez(() => mandarParaCasa(+id));          // defesa (8.4.1): seção 29
        else if (acao === 'ao-trabalho') executarUmaVez(() => voltarAoTrabalho(+id));
        else if (acao === 'todos-para-casa') executarUmaVez(mandarTodosParaCasa);
        else if (acao === 'todos-ao-trabalho') executarUmaVez(chamarTodosAoTrabalho);
        else if (acao === 'confirmar-dispensa') { if (confirmacaoDeDispensa && confirmacaoDeDispensa.id === +id && Date.now() < confirmacaoDeDispensa.ate) executarUmaVez(() => dispensarTrabalhador(+id)); confirmacaoDeDispensa = null; }
        atualizarResumoDeRecursos();
      };
      const barrinha = (valor, cor) => `<span class="barrinha"><i style="width:${Math.max(0, Math.min(100, valor))}%;background:${cor}"></i></span>`;
      const desenharPainelDaFazenda = function desenharPainelDaFazenda() {
        const NOMES_DOS_RECURSOS = { trigo: 'Trigo', milho: 'Milho', cenoura: 'Cenoura', abobora: 'Abóbora', minerios: 'Minérios', madeira: 'Madeira' };
        const partes = ['<h3>🌾 Fazenda</h3>', `<div class="linha-recursos">${Object.entries(ICONES_DOS_RECURSOS).map(([recurso, icone]) => `<span class="recurso" title="${NOMES_DOS_RECURSOS[recurso]}"><i>${icone}</i><b>${estado.recursos[recurso]}</b><small>${NOMES_DOS_RECURSOS[recurso]}</small></span>`).join('')}</div>`,
          htmlDasCotasDoDia()];   // rebalanceamento: uma cota por atividade (seção 27)
        // abas das plantações: cada uma é administrada separadamente
        partes.push(`<div class="segmentos abas">${PLANTACOES_COM_CANTEIROS.map(idDaArea => `<button data-acao="aba" data-area="${idDaArea}" class="${idDaArea === plantacaoSelecionada ? 'ativo' : ''}">${AREAS.find(area => area.id === idDaArea).icone} ${nomeDaArea(idDaArea)}</button>`).join('')}</div>`);
        const idDaArea = plantacaoSelecionada, nivel = estado.niveis[idDaArea];
        partes.push(`<h4 class="titulo-da-plantacao">🌱 ${nomeDaArea(idDaArea)}${nivel ? ' <small>nível ' + nivel + '</small>' : ''}</h4>`);
        if (!nivel) partes.push(`<p class="dica">Construa <b>${nomeDaArea(idDaArea)}</b> (cartão ${AREAS.find(area => area.id === idDaArea).icone}) para plantar trigo, milho, cenoura e abóbora.</p>`);
        else if (instalacaoDestruida(idDaArea)) partes.push('<p class="dica">Esta plantação está destruída. Repare-a no cartão.</p>');
        else {
          const { colunas } = quantidadeDeCanteirosNoNivel(nivel);
          partes.push('<p class="passos"><b>1</b> Escolha a cultura <b>2</b> Toque num canteiro vazio para plantar <b>3</b> Canteiro maduro: escolha quem colhe</p>');
          partes.push(`<div class="segmentos culturas">${Object.entries(CULTURAS).map(([id, cultura]) => `<button data-acao="cultura" data-cultura="${id}" class="${id === culturaSelecionada ? 'ativo' : ''}" title="${cultura.minutosParaCrescer} min · rende ${cultura.colheita}"><i>${cultura.icone}</i><span>${cultura.nome}</span><small>${cultura.minutosParaCrescer} min · rende ${cultura.colheita}</small></button>`).join('')}</div>`);
          partes.push(`<div class="grade-canteiros" style="grid-template-columns:repeat(${colunas},1fr)">` + canteirosDaArea(idDaArea).slice(0, quantidadeDeCanteiros(idDaArea)).map((canteiro, indice) => {
            const estagio = estagioDoCanteiro(canteiro), cultura = CULTURAS[canteiro.cultura], dono = reservasDeColheita.get(chaveDoCanteiro(idDaArea, indice)), quem = dono !== undefined && trabalhadoresNaCena.get(dono);
            const selecionado = indice === canteiroSelecionado ? ' selecionado' : '', atributos = `data-acao="canteiro" data-area="${idDaArea}" data-indice="${indice}"`;
            if (estagio < 0) return `<button class="canteiro vazio" ${atributos} title="Plantar ${CULTURAS[culturaSelecionada].nome}"><i>＋${CULTURAS[culturaSelecionada].icone}</i><small>plantar</small></button>`;
            if (estagio === 3) return `<button class="canteiro pronto${selecionado}" ${atributos} title="Maduro: escolher quem colhe"><i>${cultura.icone}</i><small>${quem ? '🧺 ' + quem.dados.nome : 'colher!'}</small></button>`;
            const porcentagem = Math.floor(progressoDoCanteiro(canteiro) * 100);
            return `<button class="canteiro crescendo" ${atributos} title="${cultura.nome}: ${porcentagem}%"><i>${cultura.icone}</i><small>${porcentagem}%</small><span class="progresso-do-canteiro"><span style="width:${porcentagem}%"></span></span></button>`;
          }).join('') + '</div>');
          partes.push('<div class="legenda-dos-canteiros"><span class="vazio">vazio</span><span class="crescendo">crescendo</span><span class="pronto">maduro</span></div>');
          if (canteiroSelecionado !== null && estagioDoCanteiro(canteirosDaArea(idDaArea)[canteiroSelecionado] || {}) === 3) {
            const disponiveis = [...trabalhadoresNaCena.values()].filter(entidade => trabalhadorDisponivel(entidade));
            partes.push('<div class="escolha-de-colheita"><b>Quem colhe este canteiro?</b> <small>(só este canteiro; depois volta a explorar)</small><br>'
              + `<button class="botao-pequeno" data-acao="colher-eu" data-area="${idDaArea}" data-indice="${canteiroSelecionado}">✋ Eu mesmo</button>`
              + (disponiveis.length ? `<button class="botao-pequeno" data-acao="colher-com" data-area="${idDaArea}" data-indice="${canteiroSelecionado}">⚡ O trabalhador mais rápido</button>` + disponiveis.map(entidade => `<button class="botao-pequeno secundario" data-acao="colher-com" data-area="${idDaArea}" data-indice="${canteiroSelecionado}" data-id="${entidade.dados.id}">${CLASSES_DE_TRABALHADORES[entidade.dados.classe].icone} ${entidade.dados.nome} · ≈${Math.ceil(estimativaDeColheita(entidade, idDaArea, canteiroSelecionado))} s</button>`).join('') : '') + '</div>');
          }
          const aceleracao = aceleracaoDaLavoura();
          const prontos = canteirosDaArea(idDaArea).slice(0, quantidadeDeCanteiros(idDaArea)).filter(canteiro => estagioDoCanteiro(canteiro) === 3).length;
          partes.push(`<div class="acoes"><button class="botao-colher-tudo" data-acao="colher-tudo-jogador" data-area="${idDaArea}" title="Você mesmo colhe todos os canteiros maduros desta plantação">🧺 COLHER TUDO <small>(você · ${prontos} pronto(s))</small></button>
            <button class="botao-plantar-todos" data-acao="plantar-todos" data-area="${idDaArea}">🌱 Plantar ${CULTURAS[culturaSelecionada].icone} nos vazios</button></div>${aceleracao ? `<p class="dica">🧑‍🌾 Fazendeiros aceleram o crescimento em ${Math.round(aceleracao * 100)}%.</p>` : ''}`);
          // ordens da equipe para ESTA plantação (colheita geral por trabalhador)
          const equipeEmCampo = [...trabalhadoresNaCena.values()].filter(trabalhadorDisponivel);
          if (equipeEmCampo.length) {
            partes.push('<div class="ordens-da-equipe"><b>Mandar um trabalhador colher tudo aqui</b>');
            for (const entidade of equipeEmCampo) {
              const ordem = entidade.ordem, icone = CLASSES_DE_TRABALHADORES[entidade.dados.classe].icone;
              const descricao = !ordem ? 'explorando' : ordem.tipo === 'canteiro' ? 'colhendo 1 canteiro em ' + nomeDaArea(ordem.area) : 'colhendo tudo em ' + nomeDaArea(ordem.area) + ' (' + ordem.colhidos + ' feito(s))';
              partes.push(`<div class="linha-painel"><span>${icone} ${entidade.dados.nome}<br><small>${entidade.estado === 'combatendo' ? '⚔️ combatendo · ' : ''}${descricao}</small></span>${ordem ? `<button class="botao-pequeno secundario" data-acao="cancelar-ordem" data-id="${entidade.dados.id}">Cancelar ordem</button>` : `<button class="botao-pequeno" data-acao="ordem-geral" data-area="${idDaArea}" data-id="${entidade.dados.id}">Colher tudo aqui</button>`}</div>`);
            }
            partes.push('</div>');
          }
        }
        partes.push('<h4>🐾 Animais</h4>');
        for (const idDaAreaAnimal in ANIMAIS_DAS_AREAS) {
          const informacao = ANIMAIS_DAS_AREAS[idDaAreaAnimal], situacao = estado.animais[idDaAreaAnimal];
          if (!estado.niveis[idDaAreaAnimal]) { partes.push(`<div class="linha-painel apagada">${informacao.icone} ${nomeDaArea(idDaAreaAnimal)} · não construído</div>`); continue; }
          const vivos = animaisVivosDaArea(idDaAreaAnimal), total = totalDeAnimais(idDaAreaAnimal), alerta = situacao.comida < ALIMENTACAO_CONFIG.avisoDeFomeAbaixoDe || situacao.saude < 50;
          partes.push(`<div class="linha-painel${alerta ? ' alerta' : ''}"><span>${informacao.icone} ${vivos}/${total}<br><small>come ${informacao.come.map(recurso => CULTURAS[recurso].icone).join('')}</small></span>
            <span>🍽 ${barrinha(situacao.comida, '#e67e22')}<br>❤ ${barrinha(situacao.saude, '#e74c3c')}</span>
            <span><button class="botao-pequeno" data-acao="alimentar" data-area="${idDaAreaAnimal}">Alimentar</button>${Math.floor(situacao.produtos || 0) ? `<br><button class="botao-pequeno" data-acao="coletar-producao" data-area="${idDaAreaAnimal}">Coletar ${PRODUCAO_DOS_ANIMAIS.produtos[idDaAreaAnimal].icone} ${Math.floor(situacao.produtos)}</button>` : `<br><small>${PRODUCAO_DOS_ANIMAIS.produtos[idDaAreaAnimal].icone} produzindo…</small>`}${vivos < total ? `<br><button class="botao-pequeno secundario" data-acao="repor" data-area="${idDaAreaAnimal}">Repor · ${ALIMENTACAO_CONFIG.custoParaReporAnimal} XP</button>` : ''}</span></div>`);
        }
        partes.push('<h4>⛏ Mina</h4>', estado.niveis.mina ? `<p class="dica">${textoDoEstadoDaMina()}<br>Nível ${estado.niveis.mina}: +${MINERACAO_CONFIG.mineriosPorCicloPorNivel[estado.niveis.mina - 1]} 🪨 e +${MINERACAO_CONFIG.xpPorCicloPorNivel[estado.niveis.mina - 1]} XP a cada ${MINERACAO_CONFIG.minutosMinerando} min · ciclos concluídos: ${estado.mina.ciclos}<br>🧙 Leve os minérios ao <b>Guardião da Mina</b>, ao lado da caverna, para preparar poções de XP.</p>` : '<p class="dica">Construa a <b>Mina</b> (cartão ⛏️) para o carrinho começar a trazer minérios da caverna.</p>');
        trocarConteudoDoPainel(painelDaFazenda, partes.join(''));
      };
      // Fazenda 8.4.1: só a apresentação mudou (resumo em selos, fichas com medalhão, atributos em linhas maiores, candidatos com os
      // atributos nomeados). As ações (data-acao, data-id, data-atributo), os valores, os custos e as condições são os mesmos.
      const desenharPainelDaEquipe = function desenharPainelDaEquipe() {
        const ocupadas = vagasOcupadas(), capacidade = capacidadeDaCasa(), cheia = ocupadas >= capacidade;
        const NIVEL_MAXIMO = MELHORIAS_DOS_TRABALHADORES.nivelMaximo, ATRIBUTOS = MELHORIAS_DOS_TRABALHADORES.atributos;
        const identidade = (classe, nome, extra) => `<span class="medalhao-do-trabalhador" aria-hidden="true">${classe.icone}</span><span class="identidade-do-trabalhador"><span class="linha-do-nome"><b class="nome-do-trabalhador">${nome}</b>${extra}</span><span class="classe-do-trabalhador">${classe.icone} ${classe.nome}</span>`;
        const partes = ['<h3>👷 Equipe</h3>', `<div class="resumo-da-equipe${cheia ? ' cheia' : ''}"><div class="selo-da-equipe"><small>Vagas da casa</small><b>${ocupadas}/${capacidade}</b>${barrinha(ocupadas / capacidade * 100, cheia ? '#c0392b' : '#4e9a35')}</div><div class="selo-da-equipe"><small>Seu XP</small><b>⭐ ${estado.xp}</b></div></div>`,
          `<p class="dica">Casa ${estado.niveis.casa ? 'nível ' + estado.niveis.casa : 'base'}${capacidade < CAPACIDADE_DE_TRABALHADORES_POR_NIVEL_DA_CASA[CAPACIDADE_DE_TRABALHADORES_POR_NIVEL_DA_CASA.length - 1] ? ' · evolua a casa para mais vagas' : ''}. Toque num trabalhador para ver atributos e ações.</p>`];
        // defesa (8.4.1): quem está em campo, quem está em casa e a invasão em curso; botões para todos irem ou voltarem
        const vivos = estado.trabalhadores.filter(dados => dados.estado === 'ativo'), emCasa = vivos.filter(dados => dados.emCasa).length;
        const emCampo = classe => [...trabalhadoresNaCena.values()].filter(entidade => trabalhadorDisponivel(entidade) && entidade.dados.classe === classe).length;
        const invasaoEmCurso = textoDaInvasaoEmCurso();
        partes.push(`<div class="defesa-da-equipe${invasaoEmCurso ? ' em-combate' : ''}"><p><b>🛡️ Defesa</b> · em campo: ${emCampo('guarda')} guarda(s), ${emCampo('fazendeiro')} fazendeiro(s) · 🏠 em casa: ${emCasa}</p>`
          + (invasaoEmCurso ? `<p class="invasao-em-curso">${invasaoEmCurso}</p>` : '')
          + `<p class="dica">Nas invasões, os guardas em campo correm até a instalação atacada; os fazendeiros lutam só com criaturas por perto. Quem está em casa fica protegido, mas não defende.</p>`
          + `<div class="acoes">${vivos.length - emCasa ? '<button class="botao-pequeno secundario" data-acao="todos-para-casa">🏠 Todos para casa</button>' : ''}${emCasa ? '<button class="botao-pequeno" data-acao="todos-ao-trabalho">🚜 Todos ao trabalho</button>' : ''}</div></div>`);
        partes.push(`<h4>Sua equipe <small>${estado.trabalhadores.length}</small></h4>`, estado.trabalhadores.length ? '' : '<p class="dica">Ninguém na equipe. Contrate abaixo.</p>');
        for (const dados of estado.trabalhadores) {
          const classe = CLASSES_DE_TRABALHADORES[dados.classe], entidade = trabalhadoresNaCena.get(dados.id), atributos = atributosDoTrabalhador(dados);
          const situacao = dados.estado === 'morto' ? '💀 Morto' : !entidade ? (dados.emCasa ? '🏠 Em casa (protegido)' : '…') : ({ 'indo para casa': '🏠 Indo para casa', saindo: '🚪 Saindo da casa', andando: '🚶 Explorando', 'indo colher': '🧺 Indo colher', colhendo: '🧺 Colhendo', procurando: '🔎 Procurando o próximo canteiro', combatendo: '⚔️ Combatendo', caido: '💀 Caído' }[entidade.estado] || '🚶 Explorando') + (entidade.ordem ? ' · ordem: ' + (entidade.ordem.tipo === 'canteiro' ? '1 canteiro' : 'colher tudo em ' + nomeDaArea(entidade.ordem.area)) : '');
          const linhas = Object.entries(ATRIBUTOS).map(([atributo, regra]) => {
            const custo = custoDaProximaMelhoria(dados, atributo), valor = atributos[atributo].toFixed(regra.casas), proximo = (atributos[atributo] + regra.incremento), nivel = dados.melhorias[atributo];
            const pontos = Array.from({ length: NIVEL_MAXIMO }, (_, indice) => `<i class="${indice < nivel ? 'cheio' : ''}"></i>`).join('');
            return `<div class="linha-atributo"><span class="nome-do-atributo"><span class="icone-do-atributo" aria-hidden="true">${regra.icone}</span>${regra.nome}</span><span class="valor-do-atributo"><b>${valor}${atributo === 'precisao' ? '%' : ''}</b><span class="nivel-do-atributo" title="nível ${nivel}/${NIVEL_MAXIMO}"><span class="pontos" aria-hidden="true">${pontos}</span><small>nível ${nivel}/${NIVEL_MAXIMO}</small></span></span>`
              + (custo === null ? '<span class="atributo-no-maximo">máximo</span>' : `<button class="botao-pequeno${estado.xp < custo ? ' sem-xp' : ''}" data-acao="melhorar" data-id="${dados.id}" data-atributo="${atributo}" title="Vai para ${(regra.maximo ? Math.min(regra.maximo, proximo) : proximo).toFixed(regra.casas)}">+${regra.incremento} · ${custo} XP</button>`) + '</div>';
          }).join('');
          const confirmando = confirmacaoDeDispensa && confirmacaoDeDispensa.id === dados.id && Date.now() < confirmacaoDeDispensa.ate;
          const fracaoDaVida = dados.vida / atributos.vidaMaxima * 100;
          partes.push(`<details class="ficha classe-${dados.classe}${dados.estado === 'morto' ? ' morta' : ''}" data-ficha="${dados.id}" ${trabalhadoresExpandidos.has(dados.id) ? 'open' : ''}><summary>${identidade(classe, dados.nome, dados.inicial ? ' <small class="inicial">(inicial)</small>' : '')}<span class="situacao-do-trabalhador">${situacao}</span></span>
            <span class="vida-do-trabalhador"><b>❤ ${Math.ceil(dados.vida)}/${Math.round(atributos.vidaMaxima)}</b>${barrinha(fracaoDaVida, fracaoDaVida > 50 ? '#2ecc71' : fracaoDaVida > 25 ? '#e6a23c' : '#e74c3c')}</span><span class="seta-da-ficha" aria-hidden="true">▾</span></summary>
            <div class="corpo-da-ficha"><p class="info-da-colheita">🧺 Colheita: ${classe.eficienciaDeColheita}× (classe) · ${tempoDeColheita(dados).toFixed(1)} s por canteiro</p><div class="atributos-da-ficha">${linhas}</div>
            <div class="acoes">${dados.estado === 'morto' ? `<button class="botao-pequeno" data-acao="recuperar" data-id="${dados.id}">Recuperar · ${classe.custoDeRecuperacao} XP</button>` : dados.emCasa ? `<button class="botao-pequeno" data-acao="ao-trabalho" data-id="${dados.id}">🚜 Voltar ao trabalho</button>` : `<button class="botao-pequeno secundario" data-acao="para-casa" data-id="${dados.id}">🏠 Mandar para casa</button>`}
            ${confirmando ? `<button class="botao-pequeno perigo" data-acao="confirmar-dispensa" data-id="${dados.id}">Confirmar dispensa (${textoDaDevolucaoAoDispensar(dados)})</button><button class="botao-pequeno secundario" data-acao="cancelar-dispensa">Cancelar</button>`
              : `<button class="botao-pequeno secundario" data-acao="dispensar" data-id="${dados.id}">Dispensar (${textoDaDevolucaoAoDispensar(dados)})</button>`}</div></div></details>`);
        }
        partes.push('<h4>Contratar</h4>', '<p class="dica">Sempre há pelo menos um fazendeiro e um guarda para escolher.</p>');
        const ordemDasClasses = Object.keys(CLASSES_DE_TRABALHADORES);
        for (const candidato of estado.candidatos.slice().sort((primeiro, segundo) => ordemDasClasses.indexOf(primeiro.classe) - ordemDasClasses.indexOf(segundo.classe))) {
          const classe = CLASSES_DE_TRABALHADORES[candidato.classe], falta = classe.custo - estado.xp, atributos = atributosDoTrabalhador(candidato);
          const valores = { velocidade: atributos.velocidade.toFixed(2), vidaMaxima: Math.round(atributos.vidaMaxima), precisao: Math.round(atributos.precisao) + '%', dano: Math.round(atributos.dano), velocidadeDeTarefa: atributos.velocidadeDeTarefa.toFixed(2) };
          partes.push(`<div class="candidato classe-${candidato.classe}"><div class="cabecalho-do-candidato">${identidade(classe, candidato.nome, '')}</span><span class="preco-do-candidato">${classe.custo} XP</span></div>
            <div class="atributos-do-candidato">${Object.entries(valores).map(([atributo, valor]) => `<span><span aria-hidden="true">${ATRIBUTOS[atributo].icone}</span><b>${valor}</b><small>${ATRIBUTOS[atributo].nome}</small></span>`).join('')}</div>
            <p class="descricao-do-candidato">${classe.descricao}</p>
            <button class="botao-pequeno${falta > 0 || cheia ? ' sem-xp' : ''}" data-acao="contratar" data-id="${candidato.id}">Contratar · ${classe.custo} XP</button>${cheia ? ' <small class="motivo-do-bloqueio">casa cheia</small>' : falta > 0 ? ` <small class="motivo-do-bloqueio">faltam ${falta} XP</small>` : ''}</div>`);
        }
        trocarConteudoDoPainel(painelDaEquipe, partes.join(''));
      };
      const conteudoAtualDosPaineis = new Map();
      const trocarConteudoDoPainel = function trocarConteudoDoPainel(painel, html) { if (conteudoAtualDosPaineis.get(painel) !== html) { conteudoAtualDosPaineis.set(painel, html); painel.innerHTML = html; } };
      const atualizarPaineisDaMark82 = function atualizarPaineisDaMark82(forcar) {
        if (interagindoComPainel && !forcar) return;
        if (confirmacaoDeDispensa && Date.now() > confirmacaoDeDispensa.ate) confirmacaoDeDispensa = null;
        if (!painelDaFazenda.hidden) desenharPainelDaFazenda();
        if (!painelDaEquipe.hidden) desenharPainelDaEquipe();
      };
      // Abre o painel Fazenda já na plantação (e no canteiro) tocado no mapa.
      const abrirPainelDaFazenda = function abrirPainelDaFazenda(idDaArea, indiceDoCanteiro) {
        if (idDaArea) { plantacaoSelecionada = idDaArea; canteiroSelecionado = Number.isInteger(indiceDoCanteiro) && estagioDoCanteiro(canteirosDaArea(idDaArea)[indiceDoCanteiro] || {}) === 3 ? indiceDoCanteiro : null; }
        if (painelDaFazenda.hidden) alternarPainel(painelDaFazenda, botaoDaFazenda); atualizarPaineisDaMark82(true);
      };

      // ---- ferramentas de teste (painel Tempo). Os botões originais da regra dos 5 dias continuam com o comportamento original. ----
      // Só funcionam com o Modo desenvolvedor ligado (seção 32), mesmo chamados direto pelo console.
      selecionar('#teste-monstros').onclick = () => {                         // vira noite e chama três monstros perto da equipe
        if (!modoDesenvolvedorAtivo) return;
        definirModoDoCiclo('noite'); atualizarPainelDeTempo(true);
        if (!ehNoiteParaMonstros()) CICLO_DE_DIA_E_NOITE.hora = 0;
        eraNoite = true; let criados = 0;
        while (monstrosVivos() < limiteDeMonstrosSimultaneos() && criados < 8) {   // respeita a mesma fórmula da noite
          const monstro = surgirMonstro(); if (!monstro) break;
          monstro.chamadoPeloTeste = true; criados++;                              // o XP dele vai para o contador 'teste' (seção 30a)
        }
        mostrarAviso(criados ? '👾 ' + criados + ' monstro(s) apareceram perto da equipe (limite atual: ' + limiteDeMonstrosSimultaneos() + ').' : limiteDeMonstrosSimultaneos() ? 'Limite de monstros simultâneos atingido.' : 'Nenhum trabalhador em campo: os monstros não aparecem.');
      };
      selecionar('#teste-avancar').onclick = () => {                         // avança 10 minutos no relógio das plantações, dos animais e da mina
        if (!modoDesenvolvedorAtivo) return;
        estado.tempoDeTesteMs += 10 * 60000; salvarProgresso(); atualizarAlimentacao(); atualizarVisualDaLavoura(); atualizarPaineisDaMark82(true); desenharCards();
        mostrarAviso('⏩ +10 minutos no relógio das plantações, dos animais, da mina e das árvores do lenhador (teste; não afeta o ciclo de dia e noite nem o calendário das invasões).');
      };
      window.FarmEduMark82 = { estado: () => estado, trabalhadores: () => [...trabalhadoresNaCena.values()].map(entidade => ({ id: entidade.dados.id, x: entidade.x, z: entidade.z, estado: entidade.estado, vida: entidade.dados.vida, velMax: entidade.velMax, tarefa: entidade.tarefa && { ...entidade.tarefa } })),
        monstros: () => monstrosNoturnos.map(monstro => ({ tipo: monstro.tipo, x: monstro.x, z: monstro.z, vida: monstro.vida, morto: monstro.morto, estado: monstro.estado, alvo: monstro.alvo ? monstro.alvo.dados.id : null })),
        reservas: () => [...reservasDeColheita.entries()], surgirMonstro };   // para depuração pelo console (F12)
      criarTrabalhadoresSalvos();

      arquivoDaMontagemConcluido('30b-integracao-e-paineis.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
