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
      // Fazenda 8.4.1: primeira plantação grátis. ÚNICO cálculo do custo usado pela cobrança (evoluirArea), pelo cartão e pelo resumo
      // da gaveta: os três sempre concordam. A gratuidade vale para construir (nível 0 → 1) qualquer uma das duas plantações até a
      // primeira ser construída; depois, os custos normais da tabela (seção 01) valem para tudo.
      const plantacaoGratuitaDisponivel = (idDaArea, nivel = estado.niveis[idDaArea]) => nivel === 0 && PLANTACOES_COM_CANTEIROS.includes(idDaArea) && !estado.primeiraPlantacaoGratuitaUsada;
      const custoAtualDaEvolucao = idDaArea => plantacaoGratuitaDisponivel(idDaArea) ? 0 : custoParaProximoNivel(idDaArea, estado.niveis[idDaArea]);
      // Sobe a área um nível se há XP suficiente e ela não está destruída; reconstrói o modelo, foca a câmera e
      // salva. Contagem como atividade do jogador.
      // Mark 8.2: no nível 0 o mesmo botão CONSTRÓI a área (nível 1). Sem XP suficiente, explica quanto falta.
      const evoluirArea = function evoluirArea(idDaArea) {
        if (instalacaoDestruida(idDaArea)) { mostrarAviso('Repare ' + nomeDaArea(idDaArea) + ' antes de evoluir.'); return; }
        const nivel = estado.niveis[idDaArea], gratuita = plantacaoGratuitaDisponivel(idDaArea, nivel), custo = custoAtualDaEvolucao(idDaArea), nome = nomeDaArea(idDaArea);
        if (nivel >= NIVEL_MAXIMO) { mostrarAviso(nome + ' já está no nível máximo.'); return; }
        const construindo = nivel === 0 && !AREAS_COM_BASE_FISICA_NO_NIVEL_0.includes(idDaArea);
        if (estado.xp < custo) { mostrarAviso('XP insuficiente para ' + (construindo ? 'construir ' : 'evoluir ') + nome + ': faltam ' + (custo - estado.xp) + ' XP.'); return; }
        estado.xp -= custo;
        estado.niveis[idDaArea]++;
        // Gratuidade consumida no MESMO passo da construção (nada roda entre a checagem e a marcação): um segundo clique ou a outra
        // plantação já encontram o benefício usado e pagam o custo normal. registrarAtividade(), logo abaixo, salva os dois juntos.
        if (gratuita) estado.primeiraPlantacaoGratuitaUsada = true;
        if (nivel === 0) aoConstruirArea(idDaArea);   // estado inicial da instalação nova (cocho cheio, mina pronta para começar...)
        registrarAtividade();   // ação válida do jogador: renova a contagem de inatividade e salva
        reconstruirArea(idDaArea);
        tocarEfeito('construir');                       // 8.4.1: efeito sonoro (seção 23)
        focarCameraNaArea(idDaArea);
        desenharCards();
        mostrarAviso(construindo ? nome + ' construído! 🏗️' + (gratuita ? ' Sua primeira plantação saiu de graça 🎁.' : '') : nivel === 0 && idDaArea === 'ponte' ? nome + ' reparada! 🛠️ A travessia está inteira de novo.' : nome + ' evoluiu para o nível ' + (nivel + 1) + '! 🎉' + (idDaArea === 'casa' ? ' Agora cabem ' + CAPACIDADE_DE_TRABALHADORES_POR_NIVEL_DA_CASA[nivel + 1] + ' trabalhadores.' : ''));
        atualizarPaineisDaMark82(true);
        aoEvoluirArea(idDaArea, nivel);   // Fazenda 8.4.1: a primeira evolução do nível 1 para o 2 libera as invasões (seção 26)
      };
      // Clique em um cartão de área: conta como atividade do jogador e foca a câmera na área.
      const aoClicarNoCard = function aoClicarNoCard(idDaArea) { registrarAtividade(); focarCameraNaArea(idDaArea); if (idDaArea === 'mina' && estado.niveis.mina) mostrarAviso(textoDoEstadoDaMina()); };   // tocar numa área também conta como atividade
      // ---- Fazenda 8.4 (C3): gaveta de construções ----
      // Grupos só visuais (não criam dependências). Uma área que não esteja em nenhum grupo aparece em "Outras", para nunca sumir.
      const GRUPOS_DA_GAVETA = [
        ['🏠 Moradia', ['casa']],
        ['🐄 Animais', ['curral', 'ovelhal', 'galinheiro', 'chiqueiro', 'estabulo']],
        ['🌾 Produção', ['plantacaoGrande', 'novaPlantacao', 'moinho', 'mina']],
        ['🛠️ Infraestrutura', ['celeiro', 'maquinario', 'ponte']],
      ];
      // Mesmas condições de evoluirArea (não destruída, abaixo do máximo, XP suficiente) e de repararArea (destruída).
      const podeEvoluirAgora = idDaArea => !instalacaoDestruida(idDaArea) && estado.niveis[idDaArea] < NIVEL_MAXIMO && estado.xp >= custoAtualDaEvolucao(idDaArea);
      const atualizarResumoDaGaveta = function atualizarResumoDaGaveta() {
        const quantasPodemEvoluir = AREAS.filter(area => podeEvoluirAgora(area.id)).length, quantasPrecisamDeReparo = AREAS.filter(area => instalacaoDestruida(area.id)).length;
        const html = (quantasPodemEvoluir ? `<span class="selo-resumo evoluir">⬆ ${quantasPodemEvoluir} pode${quantasPodemEvoluir > 1 ? 'm' : ''} evoluir</span>` : '<span class="selo-resumo">⬆ nenhuma pode evoluir agora</span>')
          + (quantasPrecisamDeReparo ? ` <span class="selo-resumo reparo">💥 ${quantasPrecisamDeReparo} precisa${quantasPrecisamDeReparo > 1 ? 'm' : ''} de reparo</span>` : '');
        const resumo = selecionar('#resumo-da-gaveta'); if (resumo.innerHTML !== html) resumo.innerHTML = html;
      };
      // Trilha 0 → 1 → 2 → 3 em pontos ligados: concluídos cheios, o atual maior e com anel ("aria-current"), os seguintes vazados.
      // O nome especial do nível 0 (Base, Quebrada) vai no "title" do ponto e na linha de detalhe do cartão.
      const trilhaDeNiveis = function trilhaDeNiveis(idDaArea, nivel) {
        const rotuloDoZero = ROTULOS_DO_NIVEL_0[idDaArea] ? ROTULOS_DO_NIVEL_0[idDaArea].estado.replace(/^\S+\s/, '') : 'Lote';
        return `<ol class="trilha-de-niveis" aria-label="Nível ${nivel} de ${NIVEL_MAXIMO}">${[...Array(NIVEL_MAXIMO + 1).keys()].map(passo =>
          `<li class="${passo < nivel ? 'feito' : passo === nivel ? 'atual' : 'futuro'}"${passo === nivel ? ' aria-current="step"' : ''} title="${passo === 0 ? rotuloDoZero : 'Nível ' + passo}">${passo}</li>`).join('')}</ol>`;
      };
      // Cabeça do cartão: medalhão com o ícone, nome, "Nv X/3" e a trilha.
      const cabecaDoCartao = (area, nivel) => `<span class="medalhao-do-card" aria-hidden="true">${area.icone}</span>
        <div class="titulo-do-card"><b>${area.nome}</b><span class="nivel-do-card">Nv ${nivel}/${NIVEL_MAXIMO}</span></div>
        ${trilhaDeNiveis(area.id, nivel)}`;
      let interagindoComAGaveta = false, redesenhoDaGavetaPendente = false;
      const desenharCards = function desenharCards() {
        selecionar('#valor-xp').textContent = estado.xp;
        selecionar('#valor-xp').parentElement.title = 'XP da Fazenda hoje: ' + (ECONOMIA_CONFIG.limiteDiarioDeXPDaFazenda - xpDaFazendaRestanteHoje()) + ' de ' + ECONOMIA_CONFIG.limiteDiarioDeXPDaFazenda + ' (colheitas, mina e monstros). O XP principal virá das atividades do instrutor (a ligação com a plataforma ainda está em desenvolvimento).';
        atualizarResumoDaGaveta();
        const conteudo = selecionar('#conteudo-da-gaveta');
        // Com o dedo/mouse pressionado num cartão, o redesenho espera o fim do toque (senão o botão some e o clique se perde).
        if (interagindoComAGaveta) { redesenhoDaGavetaPendente = true; return; }
        const rolagem = conteudo.scrollTop, focado = document.activeElement && conteudo.contains(document.activeElement) ? document.activeElement.dataset.foco : null;
        const cartao = area => {
          const nivel = estado.niveis[area.id], maximo = nivel >= NIVEL_MAXIMO, gratuita = plantacaoGratuitaDisponivel(area.id, nivel), custo = custoAtualDaEvolucao(area.id), semXp = !maximo && estado.xp < custo;
          if (instalacaoDestruida(area.id)) {   // instalação destruída: nível preservado, só dá para reparar
            const reparo = custoDeReparo(area.id);
            return `<div class="card destruida" onclick="aoClicarNoCard('${area.id}')">
        ${cabecaDoCartao(area, nivel)}
        <div class="pontos-nivel"><span class="selo-estado destruida">💥 Destruído</span> nível ${nivel} preservado</div>
        <button data-foco="${area.id}" ${estado.xp < reparo ? 'disabled' : ''} onclick="event.stopPropagation(); repararArea('${area.id}')">Reparar · ${reparo} XP</button>
      </div>`;
          }
          // nível 0: lote reservado com botão "Construir"; sem XP o botão continua clicável e explica quanto falta
          const temBase = AREAS_COM_BASE_FISICA_NO_NIVEL_0.includes(area.id), loteVazio = !nivel && !temBase;
          const selo = maximo ? '<span class="selo-estado maximo">⭐ Nível máximo</span>' : gratuita ? '<span class="selo-estado disponivel">🎁 1ª plantação grátis</span>' : semXp ? `<span class="selo-estado bloqueado">🔒 Faltam ${custo - estado.xp} XP</span>` : '<span class="selo-estado disponivel">⬆ Disponível</span>';
          const detalhe = [loteVazio ? '🚧 Não construído' : !nivel ? ROTULOS_DO_NIVEL_0[area.id].estado : '', area.id === 'casa' ? CAPACIDADE_DE_TRABALHADORES_POR_NIVEL_DA_CASA[nivel] + ' vaga(s)' : ''].filter(Boolean).join(' · ');
          return `<div class="card${loteVazio ? ' nao-construido' : ''}${maximo ? ' maximo' : semXp ? '' : ' disponivel'}" onclick="aoClicarNoCard('${area.id}')">
        ${cabecaDoCartao(area, nivel)}
        <div class="pontos-nivel">${selo}${detalhe ? ` <span class="detalhe-do-card">${detalhe}</span>` : ''}${informacaoExtraDoCard(area.id)}</div>
        <button data-foco="${area.id}" class="${semXp ? 'sem-xp' : ''}" ${maximo ? 'disabled' : ''} title="${semXp ? 'Faltam ' + (custo - estado.xp) + ' XP' : ''}" onclick="event.stopPropagation(); evoluirArea('${area.id}')">${maximo ? 'Nível máximo' : (loteVazio ? 'Construir · ' : !nivel && temBase ? ROTULOS_DO_NIVEL_0[area.id].acao + ' · ' : 'Evoluir · ') + (gratuita ? 'grátis (0 XP)' : custo + ' XP')}</button>
      </div>`;
        };
        const agrupadas = new Set(GRUPOS_DA_GAVETA.flatMap(([, ids]) => ids));
        const grupos = [...GRUPOS_DA_GAVETA, ['Outras', AREAS.map(area => area.id).filter(id => !agrupadas.has(id))]];
        conteudo.innerHTML = grupos.map(([titulo, ids]) => {
          const areas = ids.map(id => AREAS.find(area => area.id === id)).filter(Boolean);
          return areas.length ? `<section class="grupo-da-gaveta"><h4>${titulo} <span class="contagem-do-grupo">${areas.length}</span></h4><div class="cartoes-do-grupo">${areas.map(cartao).join('')}</div></section>` : '';
        }).join('');
        conteudo.scrollTop = rolagem;
        if (focado) { const botao = conteudo.querySelector(`[data-foco="${focado}"]`); if (botao) botao.focus({ preventScroll: true }); }
      };
      selecionar('#conteudo-da-gaveta').addEventListener('pointerdown', () => { interagindoComAGaveta = true; });
      for (const nomeDoEvento of ['pointerup', 'pointercancel']) addEventListener(nomeDoEvento, () => {
        if (!interagindoComAGaveta) return;
        interagindoComAGaveta = false;
        if (redesenhoDaGavetaPendente) { redesenhoDaGavetaPendente = false; setTimeout(desenharCards, 60); }   // depois do "click" do mesmo toque
      });
      // O sistema de atividades deve chamar window.adicionarXP(quantidade) para creditar XP (isso conta como atividade do jogador).
      // Fazenda 8.4.1: só aceita números finitos (decimais e negativos valem: o sistema pode representar retrocesso de XP). Texto,
      // NaN, Infinity e outros tipos são recusados sem tocar no XP (antes um texto virava concatenação e o XP se perdia ao recarregar).
      // Devolve true se creditou e false se recusou. Não depende do Modo desenvolvedor.
      // Contadores (seção 05): o que entra por window.adicionarXP conta como 'atividades' (só depois de validado; valor recusado não
      // conta). Ainda NÃO há chamador no projeto: o contador fica em 0 até a integração escolar existir. O botão de teste +5000 XP
      // não passa mais por window.adicionarXP: usa a mesma regra interna com a origem 'teste'.
      const receberXP = function receberXP(quantidade, origem) {
        if (typeof quantidade !== 'number' || !Number.isFinite(quantidade)) { console.warn('[FarmEdu] adicionarXP recusou um valor inválido:', quantidade); return false; }
        if (quantidade > 0) tocarEfeito('xp');
        estado.xp += quantidade; registrarOrigemDoXP(origem, quantidade); registrarAtividade(); desenharCards(); atualizarPaineisDaMark82(true);
        return true;
      };
      window.adicionarXP = quantidade => receberXP(quantidade, 'atividades');
      selecionar('#botao-teste-xp').onclick = () => receberXP(5000, 'teste');
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
      // ---- Fazenda 8.4 (D2): Modo desenvolvedor ----
      // Reúne as ferramentas de teste: +5000 XP (menu) e, no painel Tempo, os modos do ciclo (pausar, dia fixo, noite fixa), invasão
      // agora, avançar um dia elegível (calendário das invasões), reparar tudo, monstros noturnos agora e avançar 10 minutos.
      // Fazenda 8.4.1: começa desligado e escondido a cada carregamento; liga ao digitar a palavra abaixo com o jogo em foco (fora de
      // campos de texto), sem janela de senha. O botão do menu só aparece com o modo ligado e serve para desligá-lo. É só uma
      // conveniência da interface: quem lê este código vê a palavra.
      const PALAVRA_DO_MODO_DESENVOLVEDOR = 'pitufo';
      const CONTROLES_DE_TESTE = '#botao-teste-xp, #painel-tempo [data-modo], #teste-invasao, #teste-dia-elegivel, #teste-reparar, #teste-monstros, #teste-avancar';
      let modoDesenvolvedorAtivo = false;
      const botaoDoModoDesenvolvedor = selecionar('#botao-modo-desenvolvedor');
      const definirModoDesenvolvedor = function definirModoDesenvolvedor(ativo) {
        modoDesenvolvedorAtivo = ativo;
        // desligado, o ciclo volta ao automático (uma pausa ou um dia/noite fixos não ficam presos sem os controles)
        if (!ativo && CICLO_DE_DIA_E_NOITE.modo !== 'auto') { definirModoDoCiclo('auto'); atualizarPainelDeTempo(true); }
        selecionar('#ferramentas-de-desenvolvedor').hidden = !ativo; selecionar('#testes-do-tempo').hidden = !ativo; selecionar('#controles-do-ciclo').hidden = !ativo;
        botaoDoModoDesenvolvedor.hidden = !ativo;
        botaoDoModoDesenvolvedor.setAttribute('aria-pressed', String(ativo));
        botaoDoModoDesenvolvedor.querySelector('.estado-modo-desenvolvedor').textContent = ativo ? 'ligado' : 'desligado';
      };
      botaoDoModoDesenvolvedor.onclick = () => {
        if (!modoDesenvolvedorAtivo) return;
        tocarEfeito('desativar');
        definirModoDesenvolvedor(false); mostrarAviso('🛠️ Modo desenvolvedor desligado.');
      };
      let letrasDigitadas = '';
      addEventListener('keydown', evento => {
        if (evento.ctrlKey || evento.metaKey || evento.altKey || evento.key.length !== 1) return;
        if (evento.target && evento.target.closest && evento.target.closest('input, textarea, select, [contenteditable="true"]')) return;   // ex.: nome da fazenda
        letrasDigitadas = (letrasDigitadas + evento.key.toLowerCase()).slice(-PALAVRA_DO_MODO_DESENVOLVEDOR.length);
        if (letrasDigitadas !== PALAVRA_DO_MODO_DESENVOLVEDOR || modoDesenvolvedorAtivo) return;
        letrasDigitadas = ''; tocarEfeito('desenvolvedor'); definirModoDesenvolvedor(true);
        mostrarAviso('🛠️ Modo desenvolvedor ligado: ferramentas de teste no menu e no painel Tempo.');
      });
      // Com o modo desligado, um clique (ou Enter) num controle de teste para aqui, antes do handler original: além de escondidos,
      // eles não funcionam pelos caminhos da interface (e cada handler de tempo também confere o modo, para chamadas diretas).
      document.addEventListener('click', evento => {
        if (!modoDesenvolvedorAtivo && evento.target.closest && evento.target.closest(CONTROLES_DE_TESTE)) { evento.stopImmediatePropagation(); evento.preventDefault(); }
      }, true);
      definirModoDesenvolvedor(false);
      atualizarNomeNaInterface();
      desenharCards();
      arquivoDaMontagemConcluido('32-interface.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
 isFinite