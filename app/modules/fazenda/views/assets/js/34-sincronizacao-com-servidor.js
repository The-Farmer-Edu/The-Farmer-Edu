      // ====================================================================================================
      // FARMEDU 3D — 34-sincronizacao-com-servidor.js (Backend)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA), depois da interface (seção 32) e antes
      // da finalização (seção 33).
      // ====================================================================================================
      // ====================================================================================================
      // SEÇÃO 34 — SINCRONIZAÇÃO COM O SERVIDOR: SAVE NO BANCO E XP DAS ATIVIDADES
      // Só age quando a fazenda foi aberta pela aplicação PHP (window.FARMEDU_SERVIDOR, injetado pelo Controller). Aberta direto pelo
      // arquivo, não faz nada e o jogo segue só com localStorage.
      //   • SAVE: o objeto "estado" inteiro é enviado a POST /fazenda/salvar ~5 s depois da última mudança, ao esconder a aba e ao
      //     fechar a página. Junto vai o código da SESSÃO desta página (recebido ao abrir). O servidor só aceita save da sessão
      //     ativa, isto é, da página aberta POR ÚLTIMO. Se outra aba/janela abrir a fazenda depois, esta página recebe HTTP 409,
      //     para de salvar e pergunta ao jogador se quer continuar por aqui (o que recarrega e torna esta aba a ativa).
      //   • XP DAS ATIVIDADES: quando o instrutor lança a nota, o servidor registra o XP em xp_logs. Aqui o jogo busca o XP pendente
      //     (ao abrir, ao voltar para a aba e a cada 60 s), aplica com window.adicionarXP (valores negativos valem) e devolve os ids
      //     aplicados junto com o próximo save: o servidor grava o save e marca esses XP como entregues na MESMA transação, então
      //     um XP nunca é aplicado duas vezes nem se perde.
      // ====================================================================================================
      if (SERVIDOR_DA_FAZENDA) {
        const ESPERA_PARA_ENVIAR_MS = 5000, ESPERA_APOS_FALHA_MS = 15000, INTERVALO_DA_CONSULTA_DE_XP_MS = 60000;
        const sincronia = {
          sessao: SERVIDOR_DA_FAZENDA.sessao || '',
          ultimoEstadoEnviado: '',          // vazio de propósito: o primeiro envio grava também a fazenda nova/migrada
          enviando: false, bloqueada: false, temporizador: null,
          superada: false,                  // true quando o servidor informou que outra aba/janela abriu a fazenda depois desta
          idsParaConfirmar: [],             // XP já aplicado no jogo e ainda não confirmado ao servidor
          idsJaAplicados: new Set(),        // evita aplicar o mesmo XP duas vezes enquanto a confirmação não chegou
          agendar(espera = ESPERA_PARA_ENVIAR_MS) {
            if (sincronia.bloqueada) return;
            clearTimeout(sincronia.temporizador);
            sincronia.temporizador = setTimeout(() => sincronia.enviar(), espera);
          },
          bloquear(texto) {
            sincronia.bloqueada = true; clearTimeout(sincronia.temporizador);
            mostrarFaixaDeInvasao('⚠️ Sua fazenda não está sendo salva', texto, 30000);
          },
          // O servidor recusou o save: outra aba/janela abriu a fazenda depois desta.
          foiSuperada() {
            sincronia.superada = true;
            sincronia.bloquear('Esta fazenda foi aberta em outra aba ou computador, então esta aqui parou de salvar.');
            if (!document.hidden) setTimeout(() => sincronia.perguntarSeContinuaAqui(), 0);   // aba escondida pergunta ao voltar
          },
          perguntarSeContinuaAqui() {
            if (!sincronia.superada) return;
            if (confirm('Esta fazenda foi aberta em outra aba ou janela, então esta aqui parou de salvar.\n\nQuer continuar jogando por aqui? A página será recarregada e a outra aba deixará de salvar.')) location.reload();
          },
          async enviar() {
            clearTimeout(sincronia.temporizador);
            if (sincronia.bloqueada || sincronia.enviando) return;
            const textoDoEstado = JSON.stringify(estado);
            if (textoDoEstado === sincronia.ultimoEstadoEnviado && !sincronia.idsParaConfirmar.length) return;
            const idsEnviados = sincronia.idsParaConfirmar.slice();
            let esperaParaTentarDeNovo = 0;
            sincronia.enviando = true;
            try {
              const resposta = await fetch(SERVIDOR_DA_FAZENDA.urls.salvar, {
                method: 'POST', credentials: 'same-origin', keepalive: true, headers: { 'Content-Type': 'application/json' },
                body: '{"sessao":"' + sincronia.sessao + '","xp_entregues":' + JSON.stringify(idsEnviados) + ',"estado":' + textoDoEstado + '}',
              });
              if (resposta.status === 409) { sincronia.foiSuperada(); return; }
              if (resposta.status === 401) { sincronia.bloquear('Sua sessão expirou. Entre novamente na plataforma para continuar salvando.'); return; }
              if (!resposta.ok) throw new Error('HTTP ' + resposta.status);
              sincronia.ultimoEstadoEnviado = textoDoEstado;
              sincronia.idsParaConfirmar = sincronia.idsParaConfirmar.filter(id => !idsEnviados.includes(id));
            } catch (erro) {
              console.warn('[FarmEdu] não foi possível salvar no servidor (nova tentativa em instantes):', erro);
              esperaParaTentarDeNovo = ESPERA_APOS_FALHA_MS;
            } finally {
              sincronia.enviando = false;
              if (!sincronia.bloqueada && (esperaParaTentarDeNovo || JSON.stringify(estado) !== sincronia.ultimoEstadoEnviado || sincronia.idsParaConfirmar.length)) sincronia.agendar(esperaParaTentarDeNovo || ESPERA_PARA_ENVIAR_MS);
            }
          },
          // Aplica no jogo o XP vindo do servidor: [{ id, quantidade, motivo }]. Cada id só entra uma vez.
          aplicarXP(lista) {
            let total = 0, aplicou = false;
            for (const item of lista) {
              if (sincronia.idsJaAplicados.has(item.id)) continue;
              const quantidade = Number(item.quantidade);
              if (window.adicionarXP(quantidade)) { sincronia.idsJaAplicados.add(item.id); sincronia.idsParaConfirmar.push(item.id); total += quantidade; aplicou = true; }
            }
            if (!aplicou) return;
            mostrarAviso(total >= 0 ? '📚 Atividades: +' + total.toLocaleString('pt-BR') + ' XP' : '📚 Ajuste de nota nas atividades: ' + total.toLocaleString('pt-BR') + ' XP');
            sincronia.enviar();
          },
          async buscarXPPendente() {
            if (sincronia.bloqueada || document.hidden) return;
            try {
              const resposta = await fetch(SERVIDOR_DA_FAZENDA.urls.xpPendente, { credentials: 'same-origin' });
              if (!resposta.ok) return;
              sincronia.aplicarXP((await resposta.json()).xp || []);
            } catch (erro) { }
          },
        };
        window.FarmEduSincronia = sincronia;
        addEventListener('pagehide', () => sincronia.enviar());
        // Voltar para a fazenda pelo botão "Voltar" do navegador pode restaurar a página antiga da memória (com a sessão de antes):
        // recarrega para pegar o save e a sessão atuais.
        addEventListener('pageshow', evento => { if (evento.persisted) location.reload(); });
        document.addEventListener('visibilitychange', () => {
          if (document.hidden) sincronia.enviar();
          else if (sincronia.superada) sincronia.perguntarSeContinuaAqui();
          else sincronia.buscarXPPendente();
        });
        setInterval(() => sincronia.buscarXPPendente(), INTERVALO_DA_CONSULTA_DE_XP_MS);
        setTimeout(() => sincronia.aplicarXP(SERVIDOR_DA_FAZENDA.xpPendente || []), 2500);   // depois da tela de carregamento
        sincronia.agendar(1000);
      }

      arquivoDaMontagemConcluido('34-sincronizacao-com-servidor.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
