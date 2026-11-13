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
      // Economia integrada: MADEIRA é o segundo requisito (tabela na seção 01). A primeira plantação grátis também não pede madeira,
      // para o começo do jogo (e o tutorial) continuarem funcionando sem precisar do lenhador.
      const madeiraAtualDaEvolucao = idDaArea => plantacaoGratuitaDisponivel(idDaArea) ? 0 : madeiraParaProximoNivel(idDaArea, estado.niveis[idDaArea]);
      // O que falta para construir/evoluir agora: { xp, madeira } (0 = já tem o suficiente). Usado pela cobrança, pelo cartão e pelo resumo.
      const faltaParaEvoluir = idDaArea => ({ xp: Math.max(0, custoAtualDaEvolucao(idDaArea) - estado.xp), madeira: Math.max(0, madeiraAtualDaEvolucao(idDaArea) - estado.recursos.madeira) });
      const textoDoQueFalta = falta => [falta.xp ? falta.xp + ' XP' : '', falta.madeira ? falta.madeira + ' madeira' + (falta.madeira > 1 ? 's' : '') : ''].filter(Boolean).join(' e ');
      // Sobe a área um nível se há XP E madeira suficientes e ela não está destruída; reconstrói o modelo, foca a câmera e
      // salva. Contagem como atividade do jogador.
      // Mark 8.2: no nível 0 o mesmo botão CONSTRÓI a área (nível 1). Sem os recursos, explica quanto falta de cada um.
      // Os DOIS requisitos são conferidos antes de qualquer desconto: nunca há cobrança parcial.
      const evoluirArea = function evoluirArea(idDaArea) {
        if (instalacaoDestruida(idDaArea)) {
          tocarEfeito('erro');
          mostrarAviso('Repare ' + nomeDaArea(idDaArea) + ' antes de evoluir.');
          return; 
        }
        const nivel = estado.niveis[idDaArea], gratuita = plantacaoGratuitaDisponivel(idDaArea, nivel), custo = custoAtualDaEvolucao(idDaArea), madeira = madeiraAtualDaEvolucao(idDaArea), nome = nomeDaArea(idDaArea);
        if (nivel >= NIVEL_MAXIMO) { mostrarAviso(nome + ' já está no nível máximo.'); return; }
        const construindo = nivel === 0 && !AREAS_COM_BASE_FISICA_NO_NIVEL_0.includes(idDaArea);
        const falta = faltaParaEvoluir(idDaArea);
        if (falta.xp || falta.madeira) {
          tocarEfeito('erro');
          mostrarAviso('Recursos insuficientes para ' + (construindo ? 'construir ' : 'evoluir ') + nome + ': faltam ' + textoDoQueFalta(falta) + '.' + (falta.madeira ? ' 🪓 Peça madeira ao lenhador, depois da ponte.' : ''));
          return; 
        }
        estado.xp -= custo;
        estado.recursos.madeira -= madeira;
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
        atualizarResumoDeRecursos();                     // a madeira gasta aparece na barra superior
        mostrarAviso(construindo ? nome + ' construído! 🏗️' + (gratuita ? ' Sua primeira plantação saiu de graça 🎁.' : '') : nivel === 0 && idDaArea === 'ponte' ? nome + ' reparada! 🛠️ A travessia está inteira de novo.' : nome + ' evoluiu para o nível ' + (nivel + 1) + '! 🎉' + (idDaArea === 'casa' ? ' Agora cabem ' + CAPACIDADE_DE_TRABALHADORES_POR_NIVEL_DA_CASA[nivel + 1] + ' trabalhadores.' : ''));
        atualizarPaineisDaMark82(true);
        aoEvoluirArea(idDaArea, nivel);   // Fazenda 8.4.1: a primeira evolução do nível 1 para o 2 libera as invasões (seção 26)
        avisarObjetivos('construcao', { idDaArea, nivel: nivel + 1 });   // Etapa 2: quadro de objetivos (seção 30e)
      };
      // Clique em um cartão de área: conta como atividade do jogador e foca a câmera na área.
      // Ajuste de interface: o cartão (ou o botão dele) não evolui direto. A gaveta se fecha, a câmera vai até a estrutura e o
      // PAINEL DA ESTRUTURA abre com os requisitos de XP e madeira; a evolução é feita nele (mesmas verificações de evoluirArea).
      const aoClicarNoCard = function aoClicarNoCard(idDaArea) { registrarAtividade(); abrirPainelDaEstrutura(idDaArea); };   // tocar numa área também conta como atividade
      // ---- Fazenda 8.4 (C3): gaveta de construções ----
      // Grupos só visuais (não criam dependências). Uma área que não esteja em nenhum grupo aparece em "Outras", para nunca sumir.
      const GRUPOS_DA_GAVETA = [
        ['🏠 Moradia', ['casa']],
        ['🐄 Animais', ['curral', 'ovelhal', 'galinheiro', 'chiqueiro', 'estabulo']],
        ['🌾 Produção', ['plantacaoGrande', 'novaPlantacao', 'moinho', 'mina']],
        ['🛠️ Infraestrutura', ['celeiro', 'maquinario', 'ponte']],
      ];
      // Mesmas condições de evoluirArea (não destruída, abaixo do máximo, XP suficiente) e de repararArea (destruída).
      const podeEvoluirAgora = idDaArea => { if (instalacaoDestruida(idDaArea) || estado.niveis[idDaArea] >= NIVEL_MAXIMO) return false; const falta = faltaParaEvoluir(idDaArea); return !falta.xp && !falta.madeira; };
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
        // rebalanceamento: resumo das cotas por atividade (detalhe no painel 🌾 Fazenda)
        selecionar('#valor-xp').parentElement.title = 'XP da Fazenda hoje · ' + ATIVIDADES_COM_COTA.map(atividade => COTAS_DIARIAS_DE_XP[atividade].nome + ': ' + Math.min(cotaDaAtividade(atividade), estado.cotasDoDia.usado[atividade]) + '/' + cotaDaAtividade(atividade)).join(' · ') + '. O XP das atividades do curso não tem limite diário.';
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
        <button data-foco="${area.id}" class="${estado.xp < reparo ? "sem-xp" : ""}" onclick="event.stopPropagation(); aoClicarNoCard('${area.id}')">Reparar · ${reparo} XP</button>
      </div>`;
          }
          // nível 0: lote reservado com botão "Construir"; sem XP o botão continua clicável e explica quanto falta
          const temBase = AREAS_COM_BASE_FISICA_NO_NIVEL_0.includes(area.id), loteVazio = !nivel && !temBase;
          // Economia integrada: o cartão mostra os DOIS requisitos (XP e madeira), quanto o jogador tem de cada um e se já basta.
          const madeira = madeiraAtualDaEvolucao(area.id), falta = maximo ? { xp: 0, madeira: 0 } : faltaParaEvoluir(area.id), semRecursos = !!(falta.xp || falta.madeira);
          const selo = maximo ? '<span class="selo-estado maximo">⭐ Nível máximo</span>' : gratuita ? '<span class="selo-estado disponivel">🎁 1ª plantação grátis</span>' : semRecursos ? `<span class="selo-estado bloqueado">🔒 Faltam ${textoDoQueFalta(falta)}</span>` : '<span class="selo-estado disponivel">⬆ Disponível</span>';
          const detalhe = [loteVazio ? '🚧 Não construído' : !nivel ? ROTULOS_DO_NIVEL_0[area.id].estado : '', area.id === 'casa' ? CAPACIDADE_DE_TRABALHADORES_POR_NIVEL_DA_CASA[nivel] + ' vaga(s)' : ''].filter(Boolean).join(' · ');
          const requisito = (icone, nome, tem, precisa) => `<span class="requisito-do-card ${tem >= precisa ? 'ok' : 'falta'}" title="${nome}: você tem ${tem}, precisa de ${precisa}">${icone} <b>${Math.min(tem, precisa)}</b>/${precisa} ${nome}<i aria-hidden="true">${tem >= precisa ? '✔' : '✖'}</i></span>`;
          const requisitos = maximo || gratuita ? '' : `<div class="requisitos-do-card" aria-label="Requisitos">${requisito('⭐', 'XP', estado.xp, custo)}${requisito('🪵', 'madeira', estado.recursos.madeira, madeira)}</div>`;
          return `<div class="card${loteVazio ? ' nao-construido' : ''}${maximo ? ' maximo' : semRecursos ? '' : ' disponivel'}" onclick="aoClicarNoCard('${area.id}')">
        ${cabecaDoCartao(area, nivel)}
        <div class="pontos-nivel">${selo}${detalhe ? ` <span class="detalhe-do-card">${detalhe}</span>` : ''}${informacaoExtraDoCard(area.id)}</div>
        ${requisitos}
        <button data-foco="${area.id}" class="${semRecursos ? 'sem-xp' : ''}" ${maximo ? 'disabled' : ''} title="${semRecursos ? 'Faltam ' + textoDoQueFalta(falta) : ''}" onclick="event.stopPropagation(); aoClicarNoCard('${area.id}')">${maximo ? 'Nível máximo' : (loteVazio ? 'Construir · ' : !nivel && temBase ? ROTULOS_DO_NIVEL_0[area.id].acao + ' · ' : 'Evoluir · ') + (gratuita ? 'grátis' : custo + ' XP + ' + madeira + ' 🪵')}</button>
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
      // conta). Ainda NÃO há chamador no projeto: o XP das atividades nasce da NOTA no servidor (tabelas notas → xp_logs), então
      // quem vai chamar esta função é a integração com o back-end, quando existir. O botão de teste +5000 XP não passa por aqui
      // pela API pública: usa a mesma regra interna com a origem 'teste'.
      // Rebalanceamento — recompensa sem duplicação: window.adicionarXP(quantidade, { id, motivo }) aceita um id único da recompensa
      // (ex.: 'nota-123'). Um id já creditado é recusado (false), mesmo depois de recarregar: os ids ficam em
      // estado.recompensasRecebidas (os 500 mais recentes). Chamada sem id continua funcionando como antes.
      const receberXP = function receberXP(quantidade, origem, opcoes = {}) {
        if (typeof quantidade !== 'number' || !Number.isFinite(quantidade)) { console.warn('[FarmEdu] adicionarXP recusou um valor inválido:', quantidade); return false; }
        const id = opcoes && typeof opcoes.id === 'string' ? opcoes.id.slice(0, 120) : null;
        if (id && estado.recompensasRecebidas.includes(id)) { console.warn('[FarmEdu] adicionarXP recusou uma recompensa já creditada:', id); return false; }
        if (id) { estado.recompensasRecebidas.push(id); if (estado.recompensasRecebidas.length > 500) estado.recompensasRecebidas.splice(0, estado.recompensasRecebidas.length - 500); }
        if (quantidade > 0) tocarEfeito('xp');
        estado.xp += quantidade; registrarOrigemDoXP(origem, quantidade); registrarAtividade(); desenharCards(); atualizarPaineisDaMark82(true);
        return true;
      };
      window.adicionarXP = (quantidade, opcoes) => receberXP(quantidade, 'atividades', opcoes);
      selecionar('#botao-teste-xp').onclick = () => receberXP(5000, 'teste');
      // Modo desenvolvedor: +5000 de madeira (mesmo padrão do botão de XP; só funciona com o modo ligado, ver CONTROLES_DE_TESTE).
      // Uma trava curta impede que um clique duplo some duas vezes; o valor é salvo na hora e todos os painéis são redesenhados.
      let madeiraDeTesteTravadaAte = 0;
      selecionar('#botao-teste-madeira').onclick = () => {
        if (!modoDesenvolvedorAtivo || Date.now() < madeiraDeTesteTravadaAte) return;
        madeiraDeTesteTravadaAte = Date.now() + 600;
        estado.recursos.madeira += 5000;
        tocarEfeito('xp'); registrarAtividade();   // registrarAtividade também salva
        atualizarResumoDeRecursos(); desenharCards(); atualizarPaineisDaMark82(true);
        mostrarAviso('🪵 +5000 de madeira (teste).');
      };
      // Etapa 2 — Modo desenvolvedor: +100 minérios (mesmo padrão do botão de madeira). Soma no MESMO estoque (estado.recursos.minerios)
      // que a mina, o Guardião e o inventário usam, e salva na hora. Não mexe em XP nem em limites. Cada clique soma 100; a trava
      // curta só impede que um clique duplo acidental conte duas vezes.
      let mineriosDeTesteTravadosAte = 0;
      selecionar('#botao-teste-minerios').onclick = () => {
        if (!modoDesenvolvedorAtivo || Date.now() < mineriosDeTesteTravadosAte) return;
        mineriosDeTesteTravadosAte = Date.now() + 250;
        estado.recursos.minerios += 100;
        tocarEfeito('xp'); registrarAtividade();   // registrarAtividade também salva
        atualizarResumoDeRecursos(); desenharCards(); atualizarPaineisDaMark82(true);
        if (typeof atualizarPainelDoGuardiao === 'function') atualizarPainelDoGuardiao();
        if (typeof atualizarInventario === 'function') atualizarInventario();
        mostrarAviso('🪨 +100 minérios (teste). Agora: ' + estado.recursos.minerios + '.');
      };
      // Os cartões usam onclick="evoluirArea(...)" etc. no HTML; como o jogo roda dentro de iniciarFarmEdu(), essas funções
      // são publicadas em window com os mesmos nomes de antes.
      // ---- Painel específico da estrutura (ajuste de interface) ----
      // Aberto ao escolher um cartão da gaveta: a gaveta FECHA (não cobre o mapa nem o painel), a câmera vai até a estrutura e o
      // painel mostra nível, estado, os requisitos de XP e madeira (quanto tem × quanto precisa) e o botão de construir, evoluir
      // ou reparar. A cobrança continua SÓ em evoluirArea/repararArea, com as verificações de sempre (nada de cobrança parcial).
      // Fechar (✕ ou Esc) não reabre nada: a interface volta ao estado normal. Abrir a gaveta de novo fecha este painel.
      const painelDaEstrutura = selecionar('#painel-da-estrutura');
      let estruturaSelecionada = null, assinaturaDoPainelDaEstrutura = '', acaoDaEstruturaTravadaAte = 0;
      const linhaDeRequisito = (icone, nome, tem, precisa) => {
        const ok = tem >= precisa;
        return `<li class="${ok ? 'ok' : 'falta'}"><span>${icone} ${nome}</span><span>você tem <b>${tem}</b> · precisa <b>${precisa}</b></span><strong>${ok ? '✔ ok' : '✖ faltam ' + (precisa - tem)}</strong></li>`;
      };
      // Rebalanceamento: o que a construção FAZ no jogo, no nível dado (mostrado no painel com o efeito atual e o do próximo nível).
      // Os números saem das mesmas configurações usadas pelas regras (seção 01), então o texto nunca fica diferente do jogo.
      const efeitoDaConstrucao = function efeitoDaConstrucao(idDaArea, nivel) {
        const cotas = COTAS_DIARIAS_DE_XP, funcoes = FUNCOES_DAS_CONSTRUCOES;
        if (PLANTACOES_COM_CANTEIROS.includes(idDaArea)) return quantidadeDeCanteirosNoNivel(nivel).total + ' canteiros · +' + cotas.lavoura.porNivelDePlantacao * nivel + ' na cota diária de Lavoura';
        // Etapa da alquimia: a mina só traz minérios; o nível libera as receitas de cada faixa (Comuns, Avançadas, Especiais).
        if (idDaArea === 'mina') return nivel ? MINERACAO_CONFIG.mineriosPorCicloPorNivel[nivel - 1] + ' minérios por viagem (sem XP) · libera as poções ' + Object.values(CATEGORIAS_DE_POCOES).filter(categoria => categoria.nivelDaMina <= nivel).map(categoria => categoria.plural).join(', ') : 'sem mina, sem minérios';
        if (ANIMAIS_DAS_AREAS[idDaArea]) { const produto = PRODUCAO_DOS_ANIMAIS.produtos[idDaArea]; return (nivel ? ANIMAIS_DAS_AREAS[idDaArea].porNivel[nivel - 1] : 0) + ' animal(is) produzindo ' + produto.icone + ' ' + produto.nome + ' · +' + cotas.criacao.porNivelDeInstalacao * nivel + ' na cota de Criação'; }
        if (idDaArea === 'casa') return CAPACIDADE_DE_TRABALHADORES_POR_NIVEL_DA_CASA[nivel] + ' vaga(s) na equipe (cada trabalhador soma na cota da sua especialidade)';
        if (idDaArea === 'celeiro') return 'cocho cheio dura ' + (ALIMENTACAO_CONFIG.horasParaAComidaAcabar * (1 + funcoes.celeiro.duracaoDoCochoPorNivel * nivel)).toLocaleString('pt-BR') + ' h';
        if (idDaArea === 'moinho') return 'trigo e milho rendem +' + Math.round(funcoes.moinho.alimentoDosGraosPorNivel * nivel * 100) + '% de comida no cocho';
        if (idDaArea === 'maquinario') return '+' + funcoes.maquinario.colheitaExtraPorNivel * nivel + ' unidade(s) por canteiro colhido';
        if (idDaArea === 'ponte') return 'lenhador entrega até ' + (funcoes.ponte.madeiraDiariaBase + funcoes.ponte.madeiraDiariaPorNivel * nivel) + ' madeiras por dia, ' + LENHADOR_CONFIG.madeiraPorArvorePorNivelDaPonte[Math.min(NIVEL_MAXIMO, nivel)] + ' por árvore';
        return '';
      };
      const desenharPainelDaEstrutura = function desenharPainelDaEstrutura(forcar = false) {
        if (!estruturaSelecionada || painelDaEstrutura.hidden) return;
        const idDaArea = estruturaSelecionada, area = AREAS.find(item => item.id === idDaArea), nivel = estado.niveis[idDaArea];
        const destruida = instalacaoDestruida(idDaArea), maximo = nivel >= NIVEL_MAXIMO, gratuita = plantacaoGratuitaDisponivel(idDaArea, nivel);
        const custo = custoAtualDaEvolucao(idDaArea), madeira = madeiraAtualDaEvolucao(idDaArea), falta = faltaParaEvoluir(idDaArea);
        const assinatura = JSON.stringify([idDaArea, nivel, destruida, estado.xp, estado.recursos.madeira, gratuita, informacaoExtraDoCard(idDaArea)]);
        if (!forcar && assinatura === assinaturaDoPainelDaEstrutura) return;
        assinaturaDoPainelDaEstrutura = assinatura;
        const temBase = AREAS_COM_BASE_FISICA_NO_NIVEL_0.includes(idDaArea), loteVazio = !nivel && !temBase;
        const verbo = loteVazio ? 'Construir' : !nivel && temBase ? ROTULOS_DO_NIVEL_0[idDaArea].acao : 'Evoluir';
        let corpo;
        if (destruida) {
          const reparo = custoDeReparo(idDaArea);
          corpo = `<p class="selo-estado destruida">💥 Destruído · nível ${nivel} preservado</p>
            <ul class="requisitos-da-estrutura">${linhaDeRequisito('⭐', 'XP', estado.xp, reparo)}</ul>
            <button type="button" class="botao-da-estrutura" data-acao-estrutura="reparar" ${estado.xp < reparo ? 'disabled' : ''}>🔧 Reparar · ${reparo} XP</button>`;
        } else if (maximo) {
          corpo = '<p class="selo-estado maximo">⭐ Nível máximo alcançado</p>';
        } else {
          const semRecursos = !!(falta.xp || falta.madeira);
          corpo = `<p class="proximo-passo">${verbo} para o <b>nível ${nivel + 1}</b></p>
            ${gratuita ? '<p class="selo-estado disponivel">🎁 Sua primeira plantação é grátis (0 XP e 0 madeira)</p>' : `<ul class="requisitos-da-estrutura">${linhaDeRequisito('⭐', 'XP', estado.xp, custo)}${linhaDeRequisito('🪵', 'Madeira', estado.recursos.madeira, madeira)}</ul>`}
            ${falta.madeira ? '<p class="dica-da-estrutura">🪓 A madeira vem do lenhador, no acampamento depois da ponte.</p>' : ''}
            <button type="button" class="botao-da-estrutura" data-acao-estrutura="evoluir" ${semRecursos ? 'disabled' : ''}>${semRecursos ? '🔒 Faltam ' + textoDoQueFalta(falta) : (loteVazio ? '🏗️ ' : '⬆ ') + verbo + (gratuita ? ' · grátis' : ' · ' + custo + ' XP + ' + madeira + ' 🪵')}</button>`;
        }
        const detalhe = [loteVazio ? '🚧 Não construído' : !nivel ? ROTULOS_DO_NIVEL_0[idDaArea].estado : '', idDaArea === 'casa' ? CAPACIDADE_DE_TRABALHADORES_POR_NIVEL_DA_CASA[nivel] + ' vaga(s)' : ''].filter(Boolean).join(' · ');
        painelDaEstrutura.innerHTML = `<header class="cabecalho-da-estrutura"><span class="medalhao-do-card" aria-hidden="true">${area.icone}</span>
            <div><h3 id="titulo-da-estrutura">${area.nome}</h3><span class="nivel-do-card">Nv ${nivel}/${NIVEL_MAXIMO}</span></div>
            <button type="button" class="botao-fechar" data-acao-estrutura="fechar" aria-label="Fechar o painel da estrutura">✕</button></header>
          ${trilhaDeNiveis(idDaArea, nivel)}
          <p class="funcao-da-estrutura"><b>Função:</b> ${efeitoDaConstrucao(idDaArea, nivel)}${!maximo && !destruida ? `<br><span>Próximo nível: ${efeitoDaConstrucao(idDaArea, nivel + 1)}</span>` : ''}</p>
          ${detalhe || informacaoExtraDoCard(idDaArea) ? `<div class="estado-da-estrutura">${detalhe ? `<span>${detalhe}</span>` : ''}${informacaoExtraDoCard(idDaArea)}</div>` : ''}
          ${corpo}`;
      };
      const abrirPainelDaEstrutura = function abrirPainelDaEstrutura(idDaArea) {
        if (!AREAS.some(area => area.id === idDaArea)) return;
        definirGavetaAberta(false);                      // a janela geral de construções sai da frente
        estruturaSelecionada = idDaArea; painelDaEstrutura.hidden = false;
        focarCameraNaArea(idDaArea);                     // a estrutura fica visível no mapa
        desenharPainelDaEstrutura(true); tocarEfeito('Enter');
        const botao = painelDaEstrutura.querySelector('.botao-da-estrutura:not(:disabled)') || painelDaEstrutura.querySelector('.botao-fechar');
        if (botao) botao.focus({ preventScroll: true });
      };
      const fecharPainelDaEstrutura = function fecharPainelDaEstrutura(comSom = true) {
        if (painelDaEstrutura.hidden) return;
        painelDaEstrutura.hidden = true; estruturaSelecionada = null;
        if (comSom) tocarEfeito('Fecha');
      };
      painelDaEstrutura.addEventListener('click', evento => {
        const botao = evento.target.closest('[data-acao-estrutura]');
        if (!botao || botao.disabled) return;
        const acao = botao.dataset.acaoEstrutura;
        if (acao === 'fechar') { fecharPainelDaEstrutura(); return; }
        if (Date.now() < acaoDaEstruturaTravadaAte) return;   // trava curta: um clique duplo não evolui dois níveis de uma vez
        acaoDaEstruturaTravadaAte = Date.now() + 700;
        if (acao === 'evoluir') evoluirArea(estruturaSelecionada);
        else if (acao === 'reparar') repararArea(estruturaSelecionada);
        desenharPainelDaEstrutura(true);
      });
      addEventListener('keydown', evento => { if (evento.key === 'Escape' && !painelDaEstrutura.hidden) fecharPainelDaEstrutura(); });
      // Chamada pelo loop (seção 30b): com o painel aberto, redesenha só quando XP, madeira, nível ou o estado da área mudam.
      const atualizarPainelDaEstrutura = function atualizarPainelDaEstrutura() { if (!painelDaEstrutura.hidden) desenharPainelDaEstrutura(false); };
      Object.assign(window, { evoluirArea, repararArea, aoClicarNoCard, abrirPainelDaEstrutura });
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
      const CONTROLES_DE_TESTE = '#botao-teste-xp, #botao-teste-madeira, #botao-teste-minerios, #botao-teste-abducao, #painel-tempo [data-modo], #teste-invasao, #teste-dia-elegivel, #teste-reparar, #teste-monstros, #teste-avancar';
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
        atualizarBotaoDoModoLeve();   // Etapa 1: o FPS do seletor de qualidade aparece/some na hora (só no Modo Desenvolvedor)
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