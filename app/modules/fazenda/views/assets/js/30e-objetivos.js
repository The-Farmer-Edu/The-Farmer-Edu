      // ====================================================================================================
      // FARMEDU 3D — 30e-objetivos.js (Etapa 2: quadro de objetivos da Fazenda)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA), depois da seção 30d e antes do loop
      // (seção 31). Mesmo padrão dos demais: declarações no escopo global compartilhado, funções como "const nome = function...".
      // ====================================================================================================
      // ====================================================================================================
      // SEÇÃO 30e — QUADRO DE OBJETIVOS
      //
      // FONTE DA VERDADE: o progresso é LIDO de onde ele já existe no save (estado.niveis, estado.mina.ciclos, estado.trabalhadores,
      // estado.eventosEspeciais...). Só o que o jogo não contava em lugar nenhum (plantios, colheitas, produção coletada, árvores,
      // poções preparadas...) fica em estado.objetivos.contadores (seção 05). estado.objetivos.concluidos guarda { id: instante } de
      // cada objetivo concluído: um objetivo concluído NUNCA volta a ficar incompleto.
      // PRÉ-REQUISITOS: cada objetivo só aparece quando pode de fato ser cumprido (ex.: produção animal só com uma instalação de
      // animais; poções só com a mina). Os que ainda não podem aparecer não são mostrados (o quadro diz quantos virão).
      // DESEMPENHO: nada roda por quadro. Os sistemas avisam (avisarObjetivos, seção 05) logo depois de uma ação concluída; os avisos
      // são agrupados (uma avaliação a cada 250 ms no máximo) e a janela só é redesenhada quando está aberta e algo mudou.
      // RECOMPENSA: reconhecimento (selo no quadro). Nenhum XP, recurso ou atalho na economia (Etapa 2: aguardando autorização).
      // INTEGRAÇÃO FUTURA (Diário / conquistas): window.farmEduObjetivos (lista, aoConcluir) e o evento do navegador
      // "farmedu:objetivo-concluido" (detail: id, nome, categoria, quando), disparado uma vez por objetivo.
      // ====================================================================================================
      const CATEGORIAS_DOS_OBJETIVOS = {
        principal: { nome: 'Principal', icone: '🏗️', descricao: 'Evolução da fazenda' },
        atividade: { nome: 'Atividade', icone: '🧺', descricao: 'Coisas para fazer no dia a dia' },
        descoberta: { nome: 'Descoberta', icone: '✨', descricao: 'Segredos e acontecimentos especiais' },
      };
      const construidaParaObjetivo = idDaArea => (estado.niveis[idDaArea] | 0) >= 1;
      const instalacoesNoNivel = nivel => AREAS.filter(area => (estado.niveis[area.id] | 0) >= nivel).length;
      const temPlantacaoParaObjetivo = () => PLANTACOES_COM_CANTEIROS.some(construidaParaObjetivo);
      const temAnimaisParaObjetivo = () => Object.keys(ANIMAIS_DAS_AREAS).some(construidaParaObjetivo);
      const objetivoConcluido = id => !!estado.objetivos.concluidos[id];
      const contadoresDosObjetivos = () => estado.objetivos.contadores;
      // Catálogo, na ordem em que faz sentido seguir. progresso() lê a fonte original; requisito() diz se já pode aparecer.
      // "secreto": até ser concluído, o nome e a descrição ficam escondidos e só a dica aparece.
      const OBJETIVOS_DA_FAZENDA = [
        // ---- principais: evolução da fazenda ----
        { id: 'primeira-plantacao', categoria: 'principal', icone: '🌱', nome: 'Primeira plantação', descricao: 'Construa uma plantação. A primeira sai de graça!', meta: 1,
          progresso: () => PLANTACOES_COM_CANTEIROS.filter(construidaParaObjetivo).length, requisito: () => true },
        { id: 'primeiros-animais', categoria: 'principal', icone: '🐄', nome: 'Primeiros animais', descricao: 'Construa um curral, galinheiro, ovelhal, chiqueiro ou estábulo.', meta: 1,
          progresso: () => Object.keys(ANIMAIS_DAS_AREAS).filter(construidaParaObjetivo).length, requisito: () => objetivoConcluido('primeira-plantacao') || temPlantacaoParaObjetivo() },
        { id: 'reparar-ponte', categoria: 'principal', icone: '🌉', nome: 'Travessia segura', descricao: 'Repare a ponte do rio: o lenhador passa a entregar mais madeira.', meta: 1,
          progresso: () => construidaParaObjetivo('ponte') ? 1 : 0, requisito: () => temPlantacaoParaObjetivo() },
        { id: 'duas-plantacoes', categoria: 'principal', icone: '🌾', nome: 'Lavoura em dobro', descricao: 'Tenha as duas plantações construídas.', meta: 2,
          progresso: () => PLANTACOES_COM_CANTEIROS.filter(construidaParaObjetivo).length, requisito: () => temPlantacaoParaObjetivo() },
        { id: 'casa-reformada', categoria: 'principal', icone: '🏠', nome: 'Casa reformada', descricao: 'Evolua a casa: ela abre mais uma vaga na equipe.', meta: 1,
          progresso: () => construidaParaObjetivo('casa') ? 1 : 0, requisito: () => temPlantacaoParaObjetivo() },
        { id: 'construir-mina', categoria: 'principal', icone: '⛏️', nome: 'Riquezas da caverna', descricao: 'Construa a mina e conheça o Guardião da alquimia.', meta: 1,
          progresso: () => construidaParaObjetivo('mina') ? 1 : 0, requisito: () => instalacoesNoNivel(1) >= 2 },
        { id: 'primeira-evolucao', categoria: 'principal', icone: '⬆️', nome: 'Primeira evolução', descricao: 'Evolua uma instalação até o nível 2.', meta: 1,
          progresso: () => instalacoesNoNivel(2) ? 1 : 0, requisito: () => instalacoesNoNivel(1) >= 2 },
        { id: 'cinco-instalacoes', categoria: 'principal', icone: '🏗️', nome: 'Fazenda em crescimento', descricao: 'Tenha 5 instalações funcionando (a casa reformada e a ponte reparada contam).', meta: 5,
          progresso: () => instalacoesNoNivel(1), requisito: () => instalacoesNoNivel(1) >= 2 },
        { id: 'nivel-maximo', categoria: 'principal', icone: '⭐', nome: 'Mestre construtor', descricao: 'Leve uma instalação até o nível 3.', meta: 1,
          progresso: () => instalacoesNoNivel(3) ? 1 : 0, requisito: () => objetivoConcluido('primeira-evolucao') || instalacoesNoNivel(2) > 0 },
        { id: 'todas-as-instalacoes', categoria: 'principal', icone: '🗺️', nome: 'Fazenda completa', descricao: 'Tenha as 13 instalações funcionando.', meta: AREAS.length,
          progresso: () => instalacoesNoNivel(1), requisito: () => objetivoConcluido('cinco-instalacoes') },
        { id: 'fazenda-lendaria', categoria: 'principal', icone: '🏆', nome: 'Fazenda lendária', descricao: 'Leve as 13 instalações até o nível 3.', meta: AREAS.length,
          progresso: () => instalacoesNoNivel(3), requisito: () => objetivoConcluido('todas-as-instalacoes') && objetivoConcluido('nivel-maximo') },
        // ---- atividades ----
        { id: 'plantar-10', categoria: 'atividade', icone: '🌱', nome: 'Mãos na terra', descricao: 'Plante 10 canteiros.', meta: 10,
          progresso: () => contadoresDosObjetivos().plantios, requisito: temPlantacaoParaObjetivo },
        { id: 'colher-20', categoria: 'atividade', icone: '🧺', nome: 'Primeira safra', descricao: 'Colha 20 canteiros (a equipe também conta).', meta: 20,
          progresso: () => contadoresDosObjetivos().colheitas, requisito: temPlantacaoParaObjetivo },
        { id: 'lenhador-10', categoria: 'atividade', icone: '🪓', nome: 'Rodada do lenhador', descricao: 'Peça ao lenhador para derrubar 10 árvores.', meta: 10,
          progresso: () => contadoresDosObjetivos().arvoresCortadas, requisito: () => true },
        { id: 'quatro-culturas', categoria: 'atividade', icone: '🥕', nome: 'Horta variada', descricao: 'Colha trigo, milho, cenoura e abóbora.', meta: Object.keys(CULTURAS).length,
          progresso: () => Object.values(contadoresDosObjetivos().colheitasPorCultura).filter(quantidade => quantidade > 0).length, requisito: () => objetivoConcluido('plantar-10') || objetivoConcluido('colher-20') },
        { id: 'alimentar-3', categoria: 'atividade', icone: '🍽', nome: 'Cocho cheio', descricao: 'Alimente os animais 3 vezes.', meta: 3,
          progresso: () => contadoresDosObjetivos().alimentacoes, requisito: temAnimaisParaObjetivo },
        { id: 'producao-10', categoria: 'atividade', icone: '🥛', nome: 'Produção da criação', descricao: 'Colete 10 produtos dos animais (leite, ovos, lã...).', meta: 10,
          progresso: () => contadoresDosObjetivos().producaoColetada, requisito: temAnimaisParaObjetivo },
        { id: 'contratar', categoria: 'atividade', icone: '👷', nome: 'Equipe maior', descricao: 'Contrate um trabalhador no painel 👷 Equipe.', meta: 1,
          progresso: () => Math.max(contadoresDosObjetivos().contratacoes, estado.trabalhadores.length - 1), requisito: () => capacidadeDaCasa() > 1 },
        { id: 'mina-5', categoria: 'atividade', icone: '🪨', nome: 'Carrinho incansável', descricao: 'Complete 5 viagens do carrinho da mina.', meta: 5,
          progresso: () => estado.mina.ciclos | 0, requisito: () => construidaParaObjetivo('mina') },
        { id: 'primeira-pocao', categoria: 'atividade', icone: '⚗️', nome: 'Aprendiz de alquimia', descricao: 'Prepare uma poção com o Guardião da Mina.', meta: 1,
          progresso: () => contadoresDosObjetivos().pocoesPreparadas, requisito: () => construidaParaObjetivo('mina') },
        { id: 'pocao-experiencia', categoria: 'atividade', icone: '⭐', nome: 'Gole de experiência', descricao: 'Use uma Poção de Experiência.', meta: 1,
          progresso: () => contadoresDosObjetivos().pocoesDeExperienciaUsadas, requisito: () => objetivoConcluido('primeira-pocao') },
        { id: 'tres-receitas', categoria: 'atividade', icone: '📜', nome: 'Três receitas', descricao: 'Prepare 3 tipos diferentes de poção.', meta: 3,
          progresso: () => contadoresDosObjetivos().tiposDePocaoPreparados.length, requisito: () => objetivoConcluido('primeira-pocao') },
        { id: 'colher-200', categoria: 'atividade', icone: '🚜', nome: 'Safra farta', descricao: 'Colha 200 canteiros.', meta: 200,
          progresso: () => contadoresDosObjetivos().colheitas, requisito: () => objetivoConcluido('colher-20') },
        // ---- descobertas (secretas até acontecerem) ----
        { id: 'pedra-secreta', categoria: 'descoberta', icone: '💎', nome: 'A pedra que canta', descricao: 'Você encontrou a pedra secreta da fazenda.', meta: 1, secreto: true,
          dica: 'Uma pedra da fazenda guarda um som escondido…', progresso: () => contadoresDosObjetivos().pedraSecreta > 0 ? 1 : 0, requisito: () => true },
        { id: 'lenda-do-ceu', categoria: 'descoberta', icone: '🦄', nome: 'A lenda do céu', descricao: 'Você descobriu a lenda da Poção Misteriosa do Unicórnio.', meta: 1, secreto: true,
          dica: 'O Guardião da Mina conhece uma receita que ninguém entende…', progresso: () => estado.eventosEspeciais.misterio.usadoEm ? 1 : 0, requisito: () => construidaParaObjetivo('mina') },
        { id: 'visitantes-do-espaco', categoria: 'descoberta', icone: '🛸', nome: 'Visitantes do espaço', descricao: 'Você presenciou uma abdução no curral.', meta: 1, secreto: true,
          dica: 'Às vezes, algo estranho sobrevoa o curral…', progresso: () => estado.eventosEspeciais.alienigena.abducoes > 0 ? 1 : 0, requisito: () => construidaParaObjetivo('curral') },
        { id: 'amigo-das-estrelas', categoria: 'descoberta', icone: '👽', nome: 'Amigo das estrelas', descricao: 'Você descobriu o segredo do ET e das vacas.', meta: 1, secreto: true,
          dica: 'Quem dá atenção às vacas pode ter uma surpresa…', progresso: () => estado.eventosEspeciais.et.descobertoEm ? 1 : 0, requisito: () => construidaParaObjetivo('curral') },
      ];
      const OBJETIVO_POR_ID = Object.fromEntries(OBJETIVOS_DA_FAZENDA.map(objetivo => [objetivo.id, objetivo]));
      // Situação de um objetivo agora: 'concluido' | 'andamento' | 'disponivel' | 'bloqueado' (bloqueado = ainda não aparece).
      const situacaoDoObjetivo = function situacaoDoObjetivo(objetivo) {
        if (objetivoConcluido(objetivo.id)) return { estado: 'concluido', atual: objetivo.meta };
        if (!objetivo.requisito()) return { estado: 'bloqueado', atual: 0 };
        const atual = Math.max(0, Math.min(objetivo.meta, Math.floor(objetivo.progresso() || 0)));
        return { estado: atual > 0 ? 'andamento' : 'disponivel', atual };
      };

      // ---- Avaliação (só quando algo relevante acontece) ----
      const ouvintesDeConclusao = [];
      let avaliacaoAgendada = null, contadoresMudaram = false, avaliacoesFeitas = 0;
      const avaliarObjetivos = function avaliarObjetivos(silencioso = false) {
        avaliacaoAgendada = null; avaliacoesFeitas++;
        const novos = [];
        for (let passada = 0; passada < 2; passada++) {   // 2 passadas: um objetivo concluído pode liberar o seguinte na mesma hora
          for (const objetivo of OBJETIVOS_DA_FAZENDA) {
            if (objetivoConcluido(objetivo.id) || !objetivo.requisito()) continue;
            if ((objetivo.progresso() || 0) >= objetivo.meta) { estado.objetivos.concluidos[objetivo.id] = Date.now(); novos.push(objetivo); }
          }
        }
        if (silencioso && novos.length) estado.objetivos.vistoAte = Date.now();   // registrado em silêncio = não é novidade para o jogador
        if (novos.length || contadoresMudaram) { contadoresMudaram = false; salvarProgresso(); }
        if (novos.length) {
          for (const objetivo of novos) {
            const detalhe = { id: objetivo.id, nome: objetivo.nome, categoria: objetivo.categoria, quando: estado.objetivos.concluidos[objetivo.id], silencioso };
            for (const ouvir of ouvintesDeConclusao) { try { ouvir(detalhe); } catch (erro) { console.error('[FarmEdu] Ouvinte de objetivo:', erro); } }
            try { document.dispatchEvent(new CustomEvent('farmedu:objetivo-concluido', { detail: detalhe })); } catch (erro) { }
          }
          if (!silencioso) {
            mostrarAviso(novos.length === 1 ? '🎯 Objetivo concluído: ' + novos[0].nome + ' 🏅' : '🎯 ' + novos.length + ' objetivos concluídos! Veja o quadro 🏅');
            tocarEfeito('levelUp');
            botaoDosObjetivos.classList.remove('comemorando'); void botaoDosObjetivos.offsetWidth; botaoDosObjetivos.classList.add('comemorando');
          }
        }
        atualizarBotaoDosObjetivos();
        if (!janelaDosObjetivos.hidden) desenharQuadroDeObjetivos();
        return novos.map(objetivo => objetivo.id);
      };
      const agendarAvaliacaoDosObjetivos = function agendarAvaliacaoDosObjetivos() { if (!avaliacaoAgendada) avaliacaoAgendada = setTimeout(() => avaliarObjetivos(false), 250); };
      // Os sistemas avisam aqui (seção 05). Só o que não existe no save é contado; o resto é lido da fonte na avaliação.
      ouvintesDosObjetivos.push((tipo, detalhe) => {
        const contadores = estado.objetivos.contadores;
        if (tipo === 'plantio') contadores.plantios++;
        else if (tipo === 'colheita') { contadores.colheitas++; if (detalhe.cultura in contadores.colheitasPorCultura) contadores.colheitasPorCultura[detalhe.cultura]++; }
        else if (tipo === 'producao') contadores.producaoColetada += Math.max(0, detalhe.quantidade | 0);
        else if (tipo === 'alimentacao') contadores.alimentacoes++;
        else if (tipo === 'arvore') contadores.arvoresCortadas++;
        else if (tipo === 'pocao-preparada') { contadores.pocoesPreparadas++; if (POCOES_DO_GUARDIAO[detalhe.tipo] && !contadores.tiposDePocaoPreparados.includes(detalhe.tipo)) contadores.tiposDePocaoPreparados.push(detalhe.tipo); }
        else if (tipo === 'pocao-usada') { if (POCOES_DO_GUARDIAO[detalhe.tipo] && POCOES_DO_GUARDIAO[detalhe.tipo].xp > 0) contadores.pocoesDeExperienciaUsadas++; }
        else if (tipo === 'pedra-secreta') contadores.pedraSecreta++;
        else if (tipo === 'equipe') contadores.contratacoes++;
        if (['plantio', 'colheita', 'producao', 'alimentacao', 'arvore', 'pocao-preparada', 'pocao-usada', 'pedra-secreta', 'equipe'].includes(tipo)) contadoresMudaram = true;
        agendarAvaliacaoDosObjetivos();
      });

      // ---- Interface: botão na barra superior e janela do quadro ----
      const botaoDosObjetivos = selecionar('#botao-objetivos'), janelaDosObjetivos = selecionar('#janela-objetivos'), conteudoDosObjetivos = selecionar('#conteudo-dos-objetivos');
      let listaCompletaAberta = false, assinaturaDoQuadro = '';
      const dataCurta = instante => new Date(instante).toLocaleDateString('pt-BR');
      // Os mais relevantes AGORA: no máximo um por categoria (principal na ordem da trilha; atividade com mais progresso; descoberta).
      const objetivosEmDestaque = function objetivosEmDestaque() {
        const abertos = OBJETIVOS_DA_FAZENDA.map(objetivo => ({ objetivo, ...situacaoDoObjetivo(objetivo) })).filter(item => item.estado === 'andamento' || item.estado === 'disponivel');
        const principal = abertos.find(item => item.objetivo.categoria === 'principal');
        const atividade = abertos.filter(item => item.objetivo.categoria === 'atividade').sort((a, b) => b.atual / b.objetivo.meta - a.atual / a.objetivo.meta)[0];
        const descoberta = abertos.find(item => item.objetivo.categoria === 'descoberta');
        return [principal, atividade, descoberta].filter(Boolean);
      };
      // Etapa 3: conquista ligada ao objetivo (seção 30f), mostrada quando o objetivo e a conquista estão concluídos.
      const conquistaDoObjetivo = (idDoObjetivo, situacao) => { const conquista = situacao === 'concluido' && window.farmEduConquistas ? window.farmEduConquistas.relacionadaAoObjetivo(idDoObjetivo) : null; return conquista && conquista.desbloqueada ? `<span class="conquista-do-objetivo">🏆 Conquista: ${conquista.icone} ${conquista.nome}</span>` : ''; };
      const htmlDoObjetivo = function htmlDoObjetivo(item, compacto = false) {
        const { objetivo, estado: situacao, atual } = item, categoria = CATEGORIAS_DOS_OBJETIVOS[objetivo.categoria];
        const oculto = objetivo.secreto && situacao !== 'concluido';
        const nome = oculto ? 'Segredo da fazenda' : objetivo.nome, descricao = oculto ? objetivo.dica : objetivo.descricao, icone = oculto ? '❔' : objetivo.icone;
        const porcento = Math.round(atual / objetivo.meta * 100);
        const rotulo = { concluido: '✔ Concluído', andamento: 'Em andamento', disponivel: 'Disponível' }[situacao];
        return `<article class="objetivo categoria-${objetivo.categoria} estado-${situacao}${oculto ? ' secreto' : ''}${compacto ? ' compacto' : ''}" data-objetivo="${objetivo.id}">
          <span class="medalhao-do-objetivo" aria-hidden="true">${icone}</span>
          <div class="corpo-do-objetivo">
            <div class="topo-do-objetivo"><span class="categoria-do-objetivo">${categoria.icone} ${categoria.nome}</span><span class="estado-do-objetivo">${rotulo}</span></div>
            <b class="nome-do-objetivo">${nome}</b>
            <p class="descricao-do-objetivo">${descricao}</p>
            ${oculto ? '' : `<div class="progresso-do-objetivo"><span class="barra-do-objetivo" role="progressbar" aria-label="Progresso: ${nome}" aria-valuemin="0" aria-valuemax="${objetivo.meta}" aria-valuenow="${atual}"><i style="width:${porcento}%"></i></span><span class="contagem-do-objetivo">${atual} / ${objetivo.meta}</span></div>`}
            <span class="recompensa-do-objetivo">${situacao === 'concluido' ? '🏅 Selo conquistado em ' + dataCurta(estado.objetivos.concluidos[objetivo.id]) : '🏅 Recompensa: selo de reconhecimento'}</span>${conquistaDoObjetivo(objetivo.id, situacao)}
          </div></article>`;
      };
      const desenharQuadroDeObjetivos = function desenharQuadroDeObjetivos() {
        const itens = OBJETIVOS_DA_FAZENDA.map(objetivo => ({ objetivo, ...situacaoDoObjetivo(objetivo) }));
        const assinatura = JSON.stringify([listaCompletaAberta, itens.map(item => item.estado[0] + item.atual), window.farmEduConquistas ? window.farmEduConquistas.resumo().desbloqueadas : 0]);   // Etapa 3: conquistas novas também redesenham
        if (assinatura === assinaturaDoQuadro) return;
        assinaturaDoQuadro = assinatura;
        const visiveis = itens.filter(item => item.estado !== 'bloqueado'), concluidos = itens.filter(item => item.estado === 'concluido').length;
        const aindaVirao = itens.length - visiveis.length, destaques = objetivosEmDestaque();
        const grupos = Object.keys(CATEGORIAS_DOS_OBJETIVOS).map(categoria => {
          const doGrupo = visiveis.filter(item => item.objetivo.categoria === categoria).sort((a, b) => (a.estado === 'concluido') - (b.estado === 'concluido'));
          return doGrupo.length ? `<section class="grupo-de-objetivos"><h4>${CATEGORIAS_DOS_OBJETIVOS[categoria].icone} ${CATEGORIAS_DOS_OBJETIVOS[categoria].nome} <small>${CATEGORIAS_DOS_OBJETIVOS[categoria].descricao}</small></h4>${doGrupo.map(item => htmlDoObjetivo(item, true)).join('')}</section>` : '';
        }).join('');
        conteudoDosObjetivos.innerHTML = `
          <div class="resumo-dos-objetivos"><span class="selos-conquistados">🏅 <b>${concluidos}</b> ${concluidos === 1 ? 'selo conquistado' : 'selos conquistados'}</span>
            <span class="barra-do-resumo" role="progressbar" aria-label="Objetivos concluídos" aria-valuemin="0" aria-valuemax="${itens.length}" aria-valuenow="${concluidos}"><i style="width:${Math.round(concluidos / itens.length * 100)}%"></i></span>
            <small>${concluidos} de ${itens.length} objetivos</small></div>
          <h3 class="titulo-agora">🎯 Agora</h3>
          ${destaques.length ? `<div class="objetivos-em-destaque">${destaques.map(item => htmlDoObjetivo(item)).join('')}</div>` : '<p class="sem-objetivos">🏆 Você concluiu todos os objetivos disponíveis! Novos aparecem conforme a fazenda cresce.</p>'}
          <button type="button" class="ver-todos-os-objetivos" id="ver-todos-os-objetivos" aria-expanded="${listaCompletaAberta}" aria-controls="todos-os-objetivos">${listaCompletaAberta ? '▲ Esconder a lista completa' : '📜 Ver todos os objetivos (' + visiveis.length + ')'}</button>
          <div class="todos-os-objetivos" id="todos-os-objetivos"${listaCompletaAberta ? '' : ' hidden'}>${grupos}
            ${aindaVirao ? `<p class="objetivos-futuros">🔒 Mais ${aindaVirao} ${aindaVirao === 1 ? 'objetivo aparece' : 'objetivos aparecem'} conforme sua fazenda cresce.</p>` : ''}</div>
          ${window.farmEduConquistas ? `<button type="button" class="abrir-colecao" id="abrir-colecao-dos-objetivos">📖 Ver conquistas no Diário (${window.farmEduConquistas.resumo().desbloqueadas} de ${window.farmEduConquistas.resumo().total})</button>` : ''}
          <p class="dica-dos-objetivos">Os objetivos dão <b>selos de reconhecimento</b>. Eles não dão XP nem recursos: são para você acompanhar a sua fazenda.</p>`;
      };
      const atualizarBotaoDosObjetivos = function atualizarBotaoDosObjetivos() {
        const destaque = objetivosEmDestaque()[0], ultimaConclusao = Math.max(0, ...Object.values(estado.objetivos.concluidos));
        const texto = destaque ? (destaque.objetivo.secreto ? '' : destaque.objetivo.nome) : '';
        const campo = selecionar('#proximo-objetivo'); if (campo.textContent !== texto) campo.textContent = texto;
        selecionar('#novidade-dos-objetivos').hidden = !(ultimaConclusao > estado.objetivos.vistoAte);
        botaoDosObjetivos.title = destaque && !destaque.objetivo.secreto ? 'Objetivos da fazenda · agora: ' + destaque.objetivo.nome + ' (' + destaque.atual + '/' + destaque.objetivo.meta + ')' : 'Objetivos da fazenda';
      };
      const abrirQuadroDeObjetivos = function abrirQuadroDeObjetivos() {
        if (typeof fecharMenuEPaineis === 'function') fecharMenuEPaineis();
        avaliarObjetivos(false);
        assinaturaDoQuadro = ''; janelaDosObjetivos.hidden = false; botaoDosObjetivos.setAttribute('aria-expanded', 'true');
        desenharQuadroDeObjetivos();
        estado.objetivos.vistoAte = Date.now(); salvarProgresso(); atualizarBotaoDosObjetivos();
        tocarEfeito('Enter'); selecionar('#fechar-objetivos').focus();
      };
      const fecharQuadroDeObjetivos = function fecharQuadroDeObjetivos() { if (janelaDosObjetivos.hidden) return; janelaDosObjetivos.hidden = true; botaoDosObjetivos.setAttribute('aria-expanded', 'false'); botaoDosObjetivos.focus(); };
      botaoDosObjetivos.addEventListener('click', () => { if (janelaDosObjetivos.hidden) abrirQuadroDeObjetivos(); else fecharQuadroDeObjetivos(); });
      selecionar('#fechar-objetivos').addEventListener('click', fecharQuadroDeObjetivos);
      janelaDosObjetivos.addEventListener('click', evento => {
        if (evento.target === janelaDosObjetivos) { fecharQuadroDeObjetivos(); return; }
        if (evento.target.closest('#ver-todos-os-objetivos')) { listaCompletaAberta = !listaCompletaAberta; desenharQuadroDeObjetivos(); selecionar('#ver-todos-os-objetivos').focus(); }
        if (evento.target.closest('#abrir-colecao-dos-objetivos') && window.farmEduConquistas) window.farmEduConquistas.abrirDiario('colecao');   // Etapa 3
      });
      addEventListener('keydown', evento => { if (evento.key === 'Escape' && !janelaDosObjetivos.hidden) fecharQuadroDeObjetivos(); });

      // ---- Abertura do jogo ----
      // 1ª vez com o quadro neste save: o que JÁ estava cumprido é registrado em silêncio (sem uma chuva de avisos num save antigo).
      // Nas aberturas seguintes, o que foi cumprido com o jogo fechado (ex.: viagens da mina) aparece num aviso só.
      const primeiraAvaliacao = !estado.objetivos.iniciadoEm;
      if (primeiraAvaliacao) { estado.objetivos.iniciadoEm = Date.now(); estado.objetivos.vistoAte = Date.now(); }
      setTimeout(() => avaliarObjetivos(primeiraAvaliacao), primeiraAvaliacao ? 0 : 1500);
      if (primeiraAvaliacao) salvarProgresso();
      atualizarBotaoDosObjetivos();
      // Para a integração futura (Diário/conquistas) e para os testes.
      window.farmEduObjetivos = {
        lista: () => OBJETIVOS_DA_FAZENDA.map(objetivo => ({ id: objetivo.id, categoria: objetivo.categoria, nome: objetivo.nome, meta: objetivo.meta, secreto: !!objetivo.secreto, ...situacaoDoObjetivo(objetivo), concluidoEm: estado.objetivos.concluidos[objetivo.id] || null })),
        destaques: () => objetivosEmDestaque().map(item => item.objetivo.id),
        aoConcluir: funcao => { if (typeof funcao === 'function') ouvintesDeConclusao.push(funcao); },
        avaliar: () => avaliarObjetivos(false),
        abrir: abrirQuadroDeObjetivos, fechar: fecharQuadroDeObjetivos,
        estatisticas: () => ({ avaliacoes: avaliacoesFeitas, avaliacaoPendente: !!avaliacaoAgendada }),   // testes: prova que nada roda por quadro
      };

      arquivoDaMontagemConcluido('30e-objetivos.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
