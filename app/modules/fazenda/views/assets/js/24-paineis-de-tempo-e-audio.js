      // ====================================================================================================
      // FARMEDU 3D — 24-paineis-de-tempo-e-audio.js (Fase 3B da refatoração: seção 24)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================
      
      // ====================================================================================================
      // SEÇÃO 24 — PAINÉIS FLUTUANTES DE TEMPO E ÁUDIO (E LISTA DOS PAINÉIS DA BARRA)
      // Botões e painéis "Tempo" (modos do ciclo e testes de invasão) e "Áudio" (volumes e ativação de cada categoria).
      // ====================================================================================================
      const painelDoTempo = selecionar('#painel-tempo'), painelDoAudio = selecionar('#painel-audio');
      const botaoDoTempo = selecionar('#botao-painel-tempo'), botaoDoAudio = selecionar('#botao-painel-audio');
      // Painéis da barra de ferramentas: abrir um fecha os outros, para não sobrepor. A seção 30 acrescenta Fazenda e Equipe.
      const PAINEIS_DA_BARRA = [[painelDoTempo, botaoDoTempo], [painelDoAudio, botaoDoAudio]];
      // Fazenda 8.4 (C2): os botões dos painéis ficam num menu compacto aberto pelo "☰ Menu" da barra superior. Abrir um painel
      // esconde o menu e mostra a navegação "‹ Menu" / "✕" acima do painel.
      const menuPrincipal = selecionar('#menu-principal'), botaoDoMenu = selecionar('#botao-menu'), navegacaoDoPainel = selecionar('#navegacao-do-painel');
      const algumPainelAberto = () => PAINEIS_DA_BARRA.some(([painel]) => !painel.hidden);
      const atualizarBotaoDoMenu = function atualizarBotaoDoMenu() {
        const interfaceAberta = !menuPrincipal.hidden || algumPainelAberto();
        botaoDoMenu.setAttribute('aria-expanded', String(!menuPrincipal.hidden));
        botaoDoMenu.setAttribute('aria-label', interfaceAberta ? 'Fechar menu' : 'Abrir menu');
        botaoDoMenu.classList.toggle('aberto', interfaceAberta);
        navegacaoDoPainel.hidden = !algumPainelAberto();
      };
      // Fazenda 8.4 (C3): gaveta de construções no rodapé. Ela e o menu/painéis não ficam abertos juntos (em telas pequenas um
      // cobriria o outro): abrir um fecha o outro. O estado aberto/fechado vive só na interface (não vai para o salvamento).
      const conteudoDaGaveta = selecionar('#conteudo-da-gaveta'), botaoDaGaveta = selecionar('#botao-gaveta-construcoes');
      const definirGavetaAberta = function definirGavetaAberta(aberta) {
        conteudoDaGaveta.hidden = !aberta; botaoDaGaveta.setAttribute('aria-expanded', String(aberta));
        selecionar('#lista-cards').classList.toggle('aberta', aberta);
      };
      const fecharPaineisDaBarra = function fecharPaineisDaBarra() { for (const [painel, botao] of PAINEIS_DA_BARRA) { painel.hidden = true; botao.setAttribute('aria-expanded', 'false'); } };
      const abrirMenu = function abrirMenu() { tocarEfeito('Enter'); fecharPaineisDaBarra(); definirGavetaAberta(false); menuPrincipal.hidden = false; atualizarBotaoDoMenu(); };
      const fecharMenuEPaineis = function fecharMenuEPaineis() { tocarEfeito('Fecha'); fecharPaineisDaBarra(); menuPrincipal.hidden = true; atualizarBotaoDoMenu(); };
      const alternarPainel = function alternarPainel(painel, botao) {
        const abrir = painel.hidden;
        tocarEfeito(abrir ? 'Enter' : 'Fecha');
        fecharPaineisDaBarra();
        if (abrir) { painel.hidden = false; botao.setAttribute('aria-expanded', 'true'); menuPrincipal.hidden = true; definirGavetaAberta(false); }
        atualizarBotaoDoMenu();
      };
      botaoDaGaveta.onclick = () => { const abrir = conteudoDaGaveta.hidden; tocarEfeito(abrir ? 'Enter' : 'Fecha'); if (abrir) fecharMenuEPaineis(); definirGavetaAberta(abrir); };
      botaoDoTempo.onclick = () => alternarPainel(painelDoTempo, botaoDoTempo);
      botaoDoAudio.onclick = () => alternarPainel(painelDoAudio, botaoDoAudio);
      botaoDoMenu.onclick = () => { if (!menuPrincipal.hidden || algumPainelAberto()) fecharMenuEPaineis(); else abrirMenu(); };
      selecionar('#fechar-menu').onclick = fecharMenuEPaineis;
      selecionar('#fechar-painel').onclick = fecharMenuEPaineis;
      selecionar('#voltar-ao-menu').onclick = () => {
        tocarEfeito('fecha');
        abrirMenu();
      };
      // A janela do nome da fazenda é aberta pelo menu (seção 32): o menu fecha para a janela ficar sozinha na tela.
      selecionar('#botao-nome-da-fazenda').addEventListener('click', fecharMenuEPaineis);
      canvas.addEventListener('pointerdown', () => { if (!menuPrincipal.hidden) { menuPrincipal.hidden = true; atualizarBotaoDoMenu(); } });   // tocar no jogo fecha o menu (os painéis continuam abertos, como antes)
      // Esc volta um nível: painel aberto → menu; menu aberto → fecha; gaveta aberta → fecha. Com a janela do nome aberta, o Esc é só dela.
      addEventListener('keydown', evento => {
        if (evento.key !== 'Escape' || !selecionar('#janela-nome-da-fazenda').hidden
          || evento.target.closest && evento.target.closest('#janela-nome-da-fazenda')) return;
        if (algumPainelAberto()) abrirMenu(); else if (!menuPrincipal.hidden) fecharMenuEPaineis(); else if (!conteudoDaGaveta.hidden) { definirGavetaAberta(false); botaoDaGaveta.focus({ preventScroll: true }); }
      });

      // ---- painel do ciclo de dia e noite ----
      // Fazenda 8.4.1: os botões do modo do ciclo (pausar, dia fixo, noite fixa) são do Modo desenvolvedor (seção 32). O relógio fica visível.
      const botoesDeModo = [...painelDoTempo.querySelectorAll('[data-modo]')];
      botoesDeModo.forEach(botao => { botao.onclick = () => { tocarEfeito('desenvolvedor'); if (!modoDesenvolvedorAtivo) return;  definirModoDoCiclo(botao.dataset.modo); atualizarPainelDeTempo(true); }; });
      // Nome do período (Madrugada, Amanhecer, Manhã, Tarde, Entardecer, Noite) para a hora informada.
      const periodoDoDia = hora => hora < 5 ? 'Madrugada' : hora < 7 ? 'Amanhecer' : hora < 12 ? 'Manhã' : hora < 17 ? 'Tarde' : hora < 19 ? 'Entardecer' : 'Noite';
      let ultimoMinutoMostrado = -1;
      // Atualiza relógio, período e botão ativo do painel "Tempo". Só mexe no HTML quando o minuto muda (ou se
      // "forcar" = true).
      const atualizarPainelDeTempo = function atualizarPainelDeTempo(forcar) {
        const minutos = Math.floor(CICLO_DE_DIA_E_NOITE.hora * 60) % 1440;
        if (!forcar && minutos === ultimoMinutoMostrado) return;
        ultimoMinutoMostrado = minutos;
        selecionar('#tempo-relogio').textContent = String(Math.floor(minutos / 60)).padStart(2, '0') + ':' + String(minutos % 60).padStart(2, '0');
        selecionar('#tempo-periodo').textContent = periodoDoDia(CICLO_DE_DIA_E_NOITE.hora);
        selecionar('#tempo-modo').textContent = NOMES_DOS_MODOS[CICLO_DE_DIA_E_NOITE.modo];
        for (const botao of botoesDeModo) { const ativo = botao.dataset.modo === CICLO_DE_DIA_E_NOITE.modo; botao.classList.toggle('ativo', ativo); botao.setAttribute('aria-pressed', String(ativo)); }
      };

      // ---- painel de áudio ----
      const LINHAS_DE_AUDIO = [['musica', '🎵 Música de fundo'], ['animais', '🐄 Animais'], ['cachoeira', '💧 Cachoeira'], ['fonte', '⛲ Fonte'], ['trator', '🚜 Trator'], ['efeitos', '✨ Efeitos']];
      painelDoAudio.innerHTML = `<h3>🔊 Áudio</h3>
        <p class="aviso-silencio-global" id="aviso-silencio-global" hidden>🔇 Todos os sons estão silenciados pelo botão da barra superior. Os ajustes abaixo continuam guardados e voltam a valer ao religar o som.</p>
        <button class="botao-principal" id="audio-ativar">🔊 Ativar áudio</button>
        ${LINHAS_DE_AUDIO.map(([categoria, nome]) => `<div class="linha-audio" data-cat="${categoria}">
          <label class="titulo-linha"><input type="checkbox" data-acao="ligar" aria-label="Ativar ${nome}"> ${nome}</label>
          <span class="status-audio" data-status></span>
          <div class="controles-audio">${categoria === 'musica' ? '<button class="botao-mini" data-acao="tocar" aria-label="Tocar ou pausar a música">▶</button>' : ''}
            <input type="range" min="0" max="100" data-acao="volume" aria-label="Volume: ${nome}"></div></div>`).join('')}
        <details class="detalhes-audio"><summary>Sons de cada animal</summary>
          ${TIPOS_DE_ANIMAL_COM_SOM.map(tipo => `<label class="animal-audio"><input type="checkbox" data-animal="${tipo}"> ${tipo[0].toUpperCase() + tipo.slice(1)} <span data-status-animal="${tipo}"></span></label>`).join('')}</details>
        <p class="dica-audio">O som começa no primeiro toque ou tecla no jogo; o botão 🔊 da barra liga e desliga tudo. Os arquivos ficam na pasta <b>assets/audio</b> da Fazenda (MP3 ou OGG); os nomes estão em <b>AUDIO_CONFIG</b> no código.</p>`;
      // Reflete no painel de áudio o estado real: botão tocar/pausar, volumes, caixas marcadas e textos como
      // "arquivo não encontrado".
      const botaoDoSomGlobal = selecionar('#botao-som-global');
      // Fazenda 8.4 (C4): botão global da barra superior (aria-pressed = silenciado) e aviso no painel Áudio.
      // Fazenda 8.4.1: o botão também ATIVA o som. Três situações: áudio ainda não liberado pelo navegador (🔈 "Ativar som": o clique
      // libera e tira o silêncio) · som ligado (🔊: o clique silencia) · silenciado (🔇: o clique religa e, se preciso, libera).
      const atualizarBotaoDoSomGlobal = function atualizarBotaoDoSomGlobal() {
        const silenciado = ESTADO_DO_AUDIO.silenciado, aguardando = !silenciado && !ESTADO_DO_AUDIO.liberado;
        botaoDoSomGlobal.setAttribute('aria-pressed', String(silenciado));
        botaoDoSomGlobal.querySelector('.icone-do-som').textContent = silenciado ? '🔇' : aguardando ? '🔈' : '🔊';
        botaoDoSomGlobal.querySelector('.rotulo-do-som').textContent = silenciado ? 'Som desligado' : aguardando ? 'Ativar som' : 'Som ligado';
        botaoDoSomGlobal.title = silenciado ? 'Ligar o som' : aguardando ? 'Ativar o som (o navegador só toca depois de um toque)' : 'Silenciar todos os sons';
        selecionar('#aviso-silencio-global').hidden = !silenciado;
      };
      botaoDoSomGlobal.onclick = () => {
        if (!ESTADO_DO_AUDIO.liberado) { if (ESTADO_DO_AUDIO.silenciado) definirSilencioGlobal(false); liberarAudio(); }   // dentro do clique: o navegador permite tocar
        else definirSilencioGlobal(!ESTADO_DO_AUDIO.silenciado);
        atualizarPainelDeAudio();
      };
      const atualizarPainelDeAudio = function atualizarPainelDeAudio() {
        atualizarBotaoDoSomGlobal();
        botaoDoAudio.textContent = '🎚️ Áudio' + (ESTADO_DO_AUDIO.liberado ? '' : ' (ativar)');   // C4: 🔊/🔇 ficam só para o botão global
        const ativar = selecionar('#audio-ativar'); ativar.hidden = ESTADO_DO_AUDIO.liberado;
        for (const [categoria] of LINHAS_DE_AUDIO) {
          const linha = painelDoAudio.querySelector(`[data-cat="${categoria}"]`), configuracaoDaCategoria = ESTADO_DO_AUDIO[categoria], fontesDeSom = CATEGORIAS_EM_GRUPO.includes(categoria) ? Object.values(FONTES_DE_SOM[categoria]) : [FONTES_DE_SOM[categoria]];
          linha.querySelector('[data-acao="ligar"]').checked = configuracaoDaCategoria.ligado;
          const faixa = linha.querySelector('[data-acao="volume"]'); if (document.activeElement !== faixa) faixa.value = Math.round(configuracaoDaCategoria.volume * 100);
          const ausentes = fontesDeSom.filter(fonteDeSom => fonteDeSom.estado === 'erro').length;
          let texto = !configuracaoDaCategoria.ligado ? 'desativado' : !ESTADO_DO_AUDIO.liberado ? 'aguardando ativação' : ausentes === fontesDeSom.length ? 'arquivo não encontrado' : ausentes ? 'alguns arquivos ausentes' : categoria === 'animais' ? 'ocasional' : categoria === 'efeitos' ? 'nas ações do jogo' : categoria === 'trator' && !tratorNaFazenda() ? 'sem trator (Maquinário nível 2 ou 3)' : tocando(fontesDeSom[0]) ? 'tocando' : categoria === 'musica' ? 'pausada' : 'aguardando';
          const textoDoStatus = linha.querySelector('[data-status]'); textoDoStatus.textContent = texto; textoDoStatus.classList.toggle('erro', ausentes > 0 && configuracaoDaCategoria.ligado);
          textoDoStatus.title = fontesDeSom.map(fonteDeSom => fonteDeSom.caminho).join('\n');
          if (categoria === 'musica') linha.querySelector('[data-acao="tocar"]').textContent = tocando(FONTES_DE_SOM.musica) ? '⏸' : '▶';
        }
        for (const tipo of TIPOS_DE_ANIMAL_COM_SOM) {
          painelDoAudio.querySelector(`[data-animal="${tipo}"]`).checked = ESTADO_DO_AUDIO.animais.individuais[tipo];
          painelDoAudio.querySelector(`[data-status-animal="${tipo}"]`).textContent = FONTES_DE_SOM.animais[tipo].estado === 'erro' ? '(sem arquivo)' : '';
        }
      };
      aoMudarOAudio = atualizarPainelDeAudio;
      painelDoAudio.addEventListener('click', evento => {
        const alvo = evento.target.closest('button'); if (!alvo) return;
        if (alvo.id === 'audio-ativar') { liberarAudio(); mostrarAviso('Áudio ativado. Os sons dependem dos arquivos que você adicionar.'); }
        else if (alvo.dataset.acao === 'tocar') alternarMusica();
      });
      painelDoAudio.addEventListener('change', evento => {
        const elemento = evento.target, linha = elemento.closest('[data-cat]');
        tocarEfeito(elemento.checked ? 'ativar' : 'desativar');
        if (elemento.dataset.animal) { ESTADO_DO_AUDIO.animais.individuais[elemento.dataset.animal] = elemento.checked; salvarPreferenciasDeAudio(); }
        else if (linha && elemento.dataset.acao === 'ligar') { if (elemento.checked && !ESTADO_DO_AUDIO.liberado) liberarAudio(); definirCategoriaDeAudio(linha.dataset.cat, elemento.checked); }
      });
      painelDoAudio.addEventListener('input', evento => { const elemento = evento.target, linha = elemento.closest('[data-cat]'); if (linha && elemento.dataset.acao === 'volume') definirVolumeDaCategoria(linha.dataset.cat, elemento.value / 100); });
      atualizarPainelDeAudio(); atualizarPainelDeTempo(true);
      coletarMateriaisBasicos(cena);


      arquivoDaMontagemConcluido('24-paineis-de-tempo-e-audio.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim

      
