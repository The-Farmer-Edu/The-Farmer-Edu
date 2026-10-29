      // ====================================================================================================
      // FARMEDU 3D — 32-interface.js (Fase 3B da refatoração: seção 32)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================

      // ====================================================================================================
      // SEÇÃO 32 — INTERFACE: CARTÕES, XP E EVOLUÇÃO
      // Cartões das áreas no rodapé, contador de XP, botão de teste de XP, evolução e inicialização final.
      // ====================================================================================================
      let temporizadorDoAviso;
      // Mostra uma mensagem curta no topo da tela por alguns segundos.
      const mostrarAviso = function mostrarAviso(mensagem) {
        const elemento = selecionar('#aviso');
        elemento.textContent = mensagem; elemento.style.opacity = 1;
        clearTimeout(temporizadorDoAviso);
        temporizadorDoAviso = setTimeout(() => { elemento.style.opacity = 0; }, 2200);
      };
      // Sobe a área um nível se há XP suficiente e ela não está destruída; reconstrói o modelo, foca a câmera e
      // salva. Contagem como atividade do jogador.
      // Mark 8.2: no nível 0 o mesmo botão CONSTRÓI a área (nível 1). Sem XP suficiente, explica quanto falta.
      const evoluirArea = function evoluirArea(idDaArea) {
        if (instalacaoDestruida(idDaArea)) { mostrarAviso('Repare ' + nomeDaArea(idDaArea) + ' antes de evoluir.'); return; }
        const nivel = estado.niveis[idDaArea], custo = custoParaProximoNivel(idDaArea, nivel), nome = nomeDaArea(idDaArea);
        if (nivel >= NIVEL_MAXIMO) { mostrarAviso(nome + ' já está no nível máximo.'); return; }
        const construindo = nivel === 0 && !AREAS_COM_BASE_FISICA_NO_NIVEL_0.includes(idDaArea);
        if (estado.xp < custo) { mostrarAviso('XP insuficiente para ' + (construindo ? 'construir ' : 'evoluir ') + nome + ': faltam ' + (custo - estado.xp) + ' XP.'); return; }
        estado.xp -= custo;
        estado.niveis[idDaArea]++;
        if (nivel === 0) aoConstruirArea(idDaArea);   // estado inicial da instalação nova (cocho cheio, mina pronta para começar...)
        registrarAtividade();   // ação válida do jogador: renova a contagem de inatividade e salva
        reconstruirArea(idDaArea);
        focarCameraNaArea(idDaArea);
        desenharCards();
        mostrarAviso(construindo ? nome + ' construído! 🏗️' : nivel === 0 && idDaArea === 'ponte' ? nome + ' reparada! 🛠️ A travessia está inteira de novo.' : nome + ' evoluiu para o nível ' + (nivel + 1) + '! 🎉' + (idDaArea === 'casa' ? ' Agora cabem ' + CAPACIDADE_DE_TRABALHADORES_POR_NIVEL_DA_CASA[nivel + 1] + ' trabalhadores.' : ''));
        atualizarPaineisDaMark82(true);
      };
      // Clique em um cartão de área: conta como atividade do jogador e foca a câmera na área.
      const aoClicarNoCard = function aoClicarNoCard(idDaArea) { registrarAtividade(); focarCameraNaArea(idDaArea); if (idDaArea === 'mina' && estado.niveis.mina) mostrarAviso(textoDoEstadoDaMina()); };   // tocar numa área também conta como atividade
      const desenharCards = function desenharCards() {
        const lista = selecionar('#lista-cards'), rolagem = lista.scrollLeft;
        selecionar('#valor-xp').textContent = estado.xp;
        lista.innerHTML = AREAS.map(area => {
          const nivel = estado.niveis[area.id], maximo = nivel >= NIVEL_MAXIMO, custo = custoParaProximoNivel(area.id, nivel), semXp = !maximo && estado.xp < custo;
          if (instalacaoDestruida(area.id)) {   // instalação destruída: nível preservado, só dá para reparar
            const reparo = custoDeReparo(area.id);
            return `<div class="card destruida" onclick="aoClicarNoCard('${area.id}')">
        <div>${area.icone} <b>${area.nome}</b></div>
        <div class="pontos-nivel">💥 Destruído · nível ${nivel} preservado</div>
        <button ${estado.xp < reparo ? 'disabled' : ''} onclick="event.stopPropagation(); repararArea('${area.id}')">Reparar · ${reparo} XP</button>
      </div>`;
          }
          // nível 0: lote reservado com botão "Construir"; sem XP o botão continua clicável e explica quanto falta
          const temBase = AREAS_COM_BASE_FISICA_NO_NIVEL_0.includes(area.id), loteVazio = !nivel && !temBase;
          return `<div class="card${loteVazio ? ' nao-construido' : ''}" onclick="aoClicarNoCard('${area.id}')">
        <div>${area.icone} <b>${area.nome}</b></div>
        <div class="pontos-nivel">${nivel ? '●'.repeat(nivel) + '○'.repeat(NIVEL_MAXIMO - nivel) : temBase ? ROTULOS_DO_NIVEL_0[area.id].estado : '🚧 Não construído'}${area.id === 'casa' ? ' · ' + CAPACIDADE_DE_TRABALHADORES_POR_NIVEL_DA_CASA[nivel] + ' vaga(s)' : ''}</div>
        ${informacaoExtraDoCard(area.id)}
        <button class="${semXp ? 'sem-xp' : ''}" ${maximo ? 'disabled' : ''} title="${semXp ? 'Faltam ' + (custo - estado.xp) + ' XP' : ''}" onclick="event.stopPropagation(); evoluirArea('${area.id}')">${maximo ? 'Nível máximo' : (loteVazio ? 'Construir · ' : !nivel && temBase ? ROTULOS_DO_NIVEL_0[area.id].acao + ' · ' : 'Evoluir · ') + custo + ' XP'}</button>
      </div>`;
        }).join('');
        lista.scrollLeft = rolagem;
      };
      // O sistema de atividades deve chamar window.adicionarXP(quantidade) para creditar XP (isso conta como atividade do jogador).
      window.adicionarXP = quantidade => { estado.xp += quantidade; registrarAtividade(); desenharCards(); atualizarPaineisDaMark82(true); };
      selecionar('#botao-teste-xp').onclick = () => window.adicionarXP(5000);
      // Os cartões usam onclick="evoluirArea(...)" etc. no HTML; como o jogo roda dentro de iniciarFarmEdu(), essas funções
      // são publicadas em window com os mesmos nomes de antes.
      Object.assign(window, { evoluirArea, repararArea, aoClicarNoCard });
      // ---- Nome da fazenda (Mark 8.3): botão na barra superior → janela com prévia → placa redesenhada na hora ----
      const janelaDoNome = selecionar('#janela-nome-da-fazenda'), campoDoNome = selecionar('#campo-nome-da-fazenda'), previaDoNome = selecionar('#previa-nome-da-fazenda'), erroDoNome = selecionar('#erro-nome-da-fazenda');
      const atualizarNomeNaInterface = () => { selecionar('#nome-da-fazenda-na-barra').textContent = estado.nomeDaFazenda; };
      const atualizarPreviaDoNome = () => { previaDoNome.textContent = 'BEM-VINDO À ' + (limparNomeDaFazenda(campoDoNome.value) || NOME_PADRAO_DA_FAZENDA).toLocaleUpperCase('pt-BR'); erroDoNome.textContent = ''; };
      const abrirJanelaDoNome = function abrirJanelaDoNome() { campoDoNome.value = estado.nomeDaFazenda === NOME_PADRAO_DA_FAZENDA ? '' : estado.nomeDaFazenda; atualizarPreviaDoNome(); janelaDoNome.hidden = false; setTimeout(() => campoDoNome.focus(), 50); };
      const fecharJanelaDoNome = () => { janelaDoNome.hidden = true; };
      const salvarNomeDaFazenda = function salvarNomeDaFazenda() {
        const nome = limparNomeDaFazenda(campoDoNome.value);
        if (!nome) { erroDoNome.textContent = 'Digite um nome (não pode ficar vazio nem só com espaços).'; return; }
        estado.nomeDaFazenda = nome; registrarAtividade();
        desenharTextoDaPlaca(); atualizarNomeNaInterface(); fecharJanelaDoNome();
        mostrarAviso('🏡 Placa atualizada: BEM-VINDO À ' + nome.toLocaleUpperCase('pt-BR'));
      };
      selecionar('#botao-nome-da-fazenda').onclick = abrirJanelaDoNome;
      selecionar('#salvar-nome-da-fazenda').onclick = salvarNomeDaFazenda;
      selecionar('#cancelar-nome-da-fazenda').onclick = fecharJanelaDoNome;
      campoDoNome.addEventListener('input', atualizarPreviaDoNome);
      campoDoNome.addEventListener('keydown', evento => { if (evento.key === 'Enter') salvarNomeDaFazenda(); if (evento.key === 'Escape') fecharJanelaDoNome(); });
      janelaDoNome.addEventListener('click', evento => { if (evento.target === janelaDoNome) fecharJanelaDoNome(); });
      atualizarNomeNaInterface();
      desenharCards();
      arquivoDaMontagemConcluido('32-interface.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
