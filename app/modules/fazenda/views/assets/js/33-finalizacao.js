      // ====================================================================================================
      // FARMEDU 3D — 33-finalizacao.js (Fase 3B da refatoração: seção 33)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================
      // ====================================================================================================
      // SEÇÃO 33 — FINALIZAÇÃO DO CARREGAMENTO
      // Compila os gráficos, liga o loop principal (uma única vez), espera o primeiro quadro desenhado, retira a tela de
      // carregamento e só então confere as invasões por inatividade.
      // ====================================================================================================
      const concluirMontagemDaFazenda = async function concluirMontagemDaFazenda() {   // Fase 3B: chamada pelo carregador (fazenda.js) depois do último arquivo
      await carregamento.etapa(95, 'Preparando os gráficos...');
      renderizador.compile(cena, camera);              // compila agora os shaders de todos os materiais (evita uma travada no 1º quadro)
      await carregamento.etapa(98, 'Abrindo a porteira...');
      await new Promise((resolver, rejeitar) => { aoTerminarPrimeiroQuadro = { resolver, rejeitar }; animarCena(); });
      carregamento.concluir();
      iniciarSistemaDeInvasoes();
      if (!existiaSalvamento) setTimeout(abrirJanelaDoNome, 1200);   // Mark 8.3: fazenda nova → pergunta o nome (pode deixar para depois)
      if (avisosDaMigracao.length) setTimeout(() => mostrarFaixaDeInvasao('🏗️ Fazenda atualizada (Mark 8.2)', avisosDaMigracao.join(' '), 14000), 900);
      // A grade de navegação dos monstros (~0,2 s de cálculo) é preparada logo após a abertura, num momento ocioso, para a
      // primeira noite não travar quando o primeiro monstro surgir.
      (window.requestIdleCallback || (funcao => setTimeout(funcao, 1500)))(() => obterGradeDosMobs());
      };
      arquivoDaMontagemConcluido('33-finalizacao.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
