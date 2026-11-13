// ====================================================================================================
// FARMEDU 3D — 27b-inventario.js
// SEÇÃO 27b — INVENTÁRIO GERAL
// Botão 🎒 logo abaixo do XP (canto superior esquerdo) que abre a janela #janela-inventario.
// O inventário NÃO tem estoque próprio: ele só LÊ as fontes reais do jogo —
//   estado.recursos  → colheitas, minérios, madeira e qualquer recurso novo que vier a existir (aparece em "Outros materiais")
//   estado.pocoes    → poções guardadas (as mesmas que o painel do Guardião usa em "Minhas Poções", seção 28b)
// Com a janela aberta, atualizarInventario (chamada pelo loop, seção 30b) redesenha só quando algum valor muda, então coletas,
// colheitas, preparos, usos de poção e gastos de construção aparecem na hora.
// ====================================================================================================
      const janelaDoInventario = selecionar('#janela-inventario'), botaoDoInventario = selecionar('#botao-inventario');
      // Nomes e grupos dos recursos conhecidos. Um recurso que não estiver aqui continua aparecendo (grupo "Outros materiais"),
      // com o ícone de ICONES_DOS_RECURSOS (seção 27) ou um ícone genérico: nada do que o jogador possui fica escondido.
      const ITENS_DO_INVENTARIO = {
        minerios: { nome: 'Minérios', grupo: 'materiais', dica: 'Trazidos pelo carrinho da mina. O Guardião prepara poções com eles.' },
        madeira: { nome: 'Madeira', grupo: 'materiais', dica: 'Coletada pelo lenhador. Usada para construir e evoluir.' },
        trigo: { nome: 'Trigo', grupo: 'colheitas', dica: 'Colheita das plantações; alimenta os animais.' },
        milho: { nome: 'Milho', grupo: 'colheitas', dica: 'Colheita das plantações; alimenta os animais.' },
        cenoura: { nome: 'Cenoura', grupo: 'colheitas', dica: 'Colheita das plantações; alimenta os animais.' },
        abobora: { nome: 'Abóbora', grupo: 'colheitas', dica: 'Colheita das plantações; alimenta os animais.' },
      };
      const GRUPOS_DO_INVENTARIO = [['materiais', '⛏️ Materiais'], ['colheitas', '🌾 Colheitas'], ['pocoes', '🧪 Poções guardadas'], ['outros', '📦 Outros materiais']];
      let assinaturaDoInventario = '';
      const itensAtuaisDoInventario = function itensAtuaisDoInventario() {
        const itens = Object.keys(estado.recursos).map(chave => ({
          chave, quantidade: estado.recursos[chave], icone: ICONES_DOS_RECURSOS[chave] || '📦',
          nome: ITENS_DO_INVENTARIO[chave] ? ITENS_DO_INVENTARIO[chave].nome : chave.charAt(0).toUpperCase() + chave.slice(1),
          grupo: ITENS_DO_INVENTARIO[chave] ? ITENS_DO_INVENTARIO[chave].grupo : 'outros', dica: ITENS_DO_INVENTARIO[chave] ? ITENS_DO_INVENTARIO[chave].dica : '',
        }));
        for (const [tipo, pocao] of Object.entries(POCOES_DO_GUARDIAO)) {
          if (pocao.misteriosa && estado.eventosEspeciais.misterio.usadoEm && !estado.pocoes[tipo]) continue;   // Etapa 1: usada = o frasco sai do inventário (fica o selo no Guardião)
          // Etapa 2: a poção misteriosa usa a mesma VISTA do Guardião (seção 28b): enquanto for segredo, nome, ícone, dica e quantidade
          // aparecem como "???" e ela não entra no total (a quantidade real continua só em estado.pocoes).
          const vista = typeof vistaDaPocao === 'function' ? vistaDaPocao(tipo) : { ...pocao, oculta: !!pocao.misteriosa, nome: '???', icone: '❔', efeito: '???', duracao: '???' };
          const dica = vista.oculta ? '???' : (pocao.xp > 0 ? '+' + pocao.xp + ' XP ao usar' : vista.efeito + ' (' + vista.duracao + ')') + ' · use no Guardião da Mina';
          itens.push({ chave: 'pocao-' + tipo, quantidade: estado.pocoes[tipo] || 0, oculta: vista.oculta, icone: vista.icone, nome: vista.nome, grupo: 'pocoes', cor: vista.cor, dica });
        }
        return itens;
      };
      const desenharInventario = function desenharInventario(forcar = false) {
        const itens = itensAtuaisDoInventario(), assinatura = itens.map(item => item.chave + ':' + item.quantidade).join('|');
        if (!forcar && assinatura === assinaturaDoInventario) return;
        assinaturaDoInventario = assinatura;
        const total = itens.filter(item => !item.oculta).reduce((soma, item) => soma + item.quantidade, 0);
        selecionar('#resumo-do-inventario').textContent = total ? total + ' ' + (total === 1 ? 'item guardado' : 'itens guardados') : 'Seu inventário ainda está vazio.';
        selecionar('#conteudo-do-inventario').innerHTML = GRUPOS_DO_INVENTARIO.map(([grupo, titulo]) => {
          const doGrupo = itens.filter(item => item.grupo === grupo);
          if (!doGrupo.length) return '';
          return `<section class="grupo-do-inventario"><h4>${titulo}</h4><ul>${doGrupo.map(item => `
            <li class="item-do-inventario${item.quantidade || item.oculta ? '' : ' vazio'}" title="${item.dica}" data-item="${item.chave}">
              <span class="icone-do-item"${item.cor ? ` style="--cor-do-item:${item.cor}"` : ''} aria-hidden="true">${item.icone}</span>
              <span class="nome-do-item">${item.nome}</span><b class="quantidade-do-item">${item.oculta ? '???' : item.quantidade}</b></li>`).join('')}</ul></section>`;
        }).join('');
      };
      const abrirInventario = function abrirInventario() {
        fecharMenuEPaineis(); definirGavetaAberta(false);
        janelaDoInventario.hidden = false; botaoDoInventario.setAttribute('aria-expanded', 'true');
        desenharInventario(true); tocarEfeito('Enter');
        selecionar('#fechar-inventario').focus();
      };
      const fecharInventario = function fecharInventario() {
        if (janelaDoInventario.hidden) return;
        janelaDoInventario.hidden = true; botaoDoInventario.setAttribute('aria-expanded', 'false'); tocarEfeito('Fecha');
      };
      botaoDoInventario.addEventListener('click', () => { if (janelaDoInventario.hidden) abrirInventario(); else fecharInventario(); });
      selecionar('#fechar-inventario').addEventListener('click', fecharInventario);
      janelaDoInventario.addEventListener('click', evento => { if (evento.target === janelaDoInventario) fecharInventario(); });
      addEventListener('keydown', evento => { if (evento.key === 'Escape' && !janelaDoInventario.hidden) fecharInventario(); });
      // Chamada pelo loop (seção 30b): só trabalha com a janela aberta e só redesenha quando alguma quantidade muda.
      const atualizarInventario = function atualizarInventario() { if (!janelaDoInventario.hidden) desenharInventario(false); };

      arquivoDaMontagemConcluido('27b-inventario.js');
