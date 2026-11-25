// ====================================================================================================
      // FARMEDU 3D — 34-sincronizacao-com-servidor.js (Backend)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA), depois da interface (seção 32) e antes
      // da finalização (seção 33).
      // ====================================================================================================
      // ====================================================================================================
      // SEÇÃO 34 — SINCRONIZAÇÃO COM O SERVIDOR: SAVE NO BANCO E XP DAS ATIVIDADES
      // Só age quando a fazenda foi aberta pela aplicação PHP (window.FARMEDU_SERVIDOR, injetado pelo Controller). Aberta direto pelo
      // arquivo, não faz nada e o jogo segue só com localStorage.
      //   • SAVE: o objeto "estado" inteiro é enviado a POST /fazenda/salvar após as mudanças, ao esconder a aba e ao
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
        // TETO DE ESPERA: a espera de 5 s reinicia a cada mudança. Com ações seguidas (colheitas, equipe, XP chegando) em menos de 5 s,
        // o save nunca saía. O diário local agora protege o estado ainda não confirmado. Agora, no máximo ESPERA_MAXIMA_MS depois da primeira
        // mudança ainda não enviada, o envio acontece mesmo que o jogador continue agindo.
        const ESPERA_MAXIMA_MS = 15000;
        // keepalive (envio que sobrevive ao fechamento da página) tem limite de ~64 KB de corpo; acima disso o navegador recusa o fetch
        // inteiro. Só ligamos o keepalive quando o corpo cabe.
        const LIMITE_DO_KEEPALIVE_BYTES = 60000, MAXIMO_DE_IDS_POR_ENVIO = 400, FALHAS_ATE_AVISAR = 3;
        const sincronia = {
          sessao: SERVIDOR_DA_FAZENDA.sessao || '',
          revisao: Number(SERVIDOR_DA_FAZENDA.revisao) || 0,
          ultimoEstadoEnviado: '',          // vazio de propósito: o primeiro envio grava também a fazenda nova/migrada
          enviando: false, bloqueada: false, temporizador: null,
          superada: false,                  // true quando o servidor informou que outra aba/janela abriu a fazenda depois desta
          idsParaConfirmar: [],             // XP já aplicado no jogo e ainda não confirmado ao servidor
          idsJaAplicados: new Set(),        // evita aplicar o mesmo XP duas vezes enquanto a confirmação não chegou
          pendenteDesde: 0,                 // instante da primeira mudança ainda não enviada (base do teto de espera)
          falhasSeguidas: 0, proximaTentativaEm: 0,
          agendar(espera = ESPERA_PARA_ENVIAR_MS) {
            if (sincronia.bloqueada) return;
            const agora = Date.now();
            if (!sincronia.pendenteDesde) sincronia.pendenteDesde = agora;
            const ateOTeto = Math.max(0, sincronia.pendenteDesde + ESPERA_MAXIMA_MS - agora);
            clearTimeout(sincronia.temporizador);
            sincronia.temporizador = setTimeout(() => sincronia.enviar(), Math.min(espera, ateOTeto));
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
            if (textoDoEstado === sincronia.ultimoEstadoEnviado && !sincronia.idsParaConfirmar.length) { sincronia.pendenteDesde = 0; return; }
            sincronia.pendenteDesde = 0;   // o que mudar a partir daqui começa uma nova janela de espera
            const idsEnviados = sincronia.idsParaConfirmar.slice(0, MAXIMO_DE_IDS_POR_ENVIO);   // o servidor recusa mais de 500 de uma vez
            let esperaParaTentarDeNovo = 0;
            sincronia.enviando = true;
            try {
              const corpo = '{"sessao":"' + sincronia.sessao + '","xp_entregues":' + JSON.stringify(idsEnviados) + ',"estado":' + textoDoEstado + '}';
              const tamanhoEmBytes = new TextEncoder().encode(corpo).length;
              const resposta = await fetch(SERVIDOR_DA_FAZENDA.urls.salvar, {
                method: 'POST', credentials: 'same-origin', keepalive: tamanhoEmBytes < LIMITE_DO_KEEPALIVE_BYTES, headers: { 'Content-Type': 'application/json' },
                body: corpo,
              });
              if (resposta.status === 409) { salvarProgresso(); sincronia.foiSuperada(); return; }
              if (resposta.status === 401) { salvarProgresso(); sincronia.bloquear('Sua sessão expirou. Entre novamente na plataforma para continuar salvando. O rascunho local foi preservado para recuperação.'); return; }
              if (!resposta.ok) throw new Error('HTTP ' + resposta.status);
              const confirmacao = await resposta.json();
              if (!confirmacao || confirmacao.ok !== true || !Number.isFinite(Number(confirmacao.revisao))) throw new Error('Resposta de confirmação do salvamento inválida.');
              sincronia.revisao = Number(confirmacao.revisao);
              sincronia.ultimoEstadoEnviado = textoDoEstado; sincronia.falhasSeguidas = 0; sincronia.proximaTentativaEm = 0;
              sincronia.idsParaConfirmar = sincronia.idsParaConfirmar.filter(id => !idsEnviados.includes(id));
              // Só apaga o diário se ele ainda representar exatamente o snapshot confirmado. Se o jogador alterou algo
              // durante o envio, mantém a versão nova e atualiza sua revisão-base para a próxima gravação.
              try {
                const rascunho = JSON.parse(localStorage.getItem(CHAVE_RECUPERACAO) || 'null');
                if (rascunho && !window.FARMEDU_RECUPERACAO_EM_CONFLITO) {
                  if (JSON.stringify(rascunho.estado) === textoDoEstado) localStorage.removeItem(CHAVE_RECUPERACAO);
                  else { rascunho.revisaoBase = sincronia.revisao; localStorage.setItem(CHAVE_RECUPERACAO, JSON.stringify(rascunho)); }
                }
              } catch (erroLocal) { console.error('[FarmEdu] Não foi possível atualizar o diário local após a confirmação:', erroLocal); }
            } catch (erro) {
              salvarProgresso(); // captura também alterações ocorridas desde o último autosave
              console.warn('[FarmEdu] não foi possível salvar no servidor (nova tentativa em instantes):', erro);
              esperaParaTentarDeNovo = ESPERA_APOS_FALHA_MS;
              sincronia.proximaTentativaEm = Date.now() + ESPERA_APOS_FALHA_MS;
              // Falhou várias vezes seguidas: o jogador precisa saber; o diário local preserva o snapshot pendente.
              if (++sincronia.falhasSeguidas === FALHAS_ATE_AVISAR) mostrarFaixaDeInvasao('⚠️ Sua fazenda não está sendo salva', 'Não consegui falar com o servidor. Vou tentar novamente automaticamente; um rascunho local por aluno foi preservado para recuperação se a página fechar.', 12000);
            } finally {
              sincronia.enviando = false;
              if (!sincronia.bloqueada && (esperaParaTentarDeNovo || JSON.stringify(estado) !== sincronia.ultimoEstadoEnviado || sincronia.idsParaConfirmar.length)) sincronia.agendar(esperaParaTentarDeNovo || ESPERA_PARA_ENVIAR_MS);
            }
          },
          // Usado pelo botão "Sair": espera a confirmação real do banco antes de navegar.
          // Se a rede/servidor falhar, o chamador mantém a página aberta; o diário local continua disponível.
          async salvarAgora() {
            this.agendar(0);
            const limite = Date.now() + 20000;
            while (Date.now() < limite) {
              if (this.bloqueada) return false;
              const atual = JSON.stringify(estado);
              if (!this.enviando && atual === this.ultimoEstadoEnviado && !this.idsParaConfirmar.length) return true;
              if (!this.enviando) {
                if (Date.now() >= this.proximaTentativaEm) await this.enviar();
                else await new Promise(resolver => setTimeout(resolver, Math.min(250, this.proximaTentativaEm - Date.now())));
              } else await new Promise(resolver => setTimeout(resolver, 100));
            }
            return !this.bloqueada && JSON.stringify(estado) === this.ultimoEstadoEnviado && !this.idsParaConfirmar.length;
          },
          // Aplica no jogo o XP vindo do servidor: [{ id, quantidade, motivo }]. Cada id só entra uma vez.
          aplicarXP(lista) {
            // Em lote: soma tudo e chama adicionarXP UMA vez (antes eram até 200 chamadas, cada uma redesenhando todos os painéis, e uma
            // exceção no meio deixava parte do XP aplicada sem o id registrado, aplicando de novo na próxima consulta).
            const novos = (Array.isArray(lista) ? lista : []).filter(item => item && !sincronia.idsJaAplicados.has(item.id) && Number.isFinite(Number(item.quantidade)));
            if (!novos.length) return;
            const total = novos.reduce((soma, item) => soma + Number(item.quantidade), 0), xpAntes = estado.xp;
            let aplicou = false;
            try { aplicou = window.adicionarXP(total); }
            catch (erro) { console.error('[FarmEdu] erro ao aplicar o XP das atividades:', erro); aplicou = estado.xp !== xpAntes; }   // se o XP já entrou, conta como aplicado
            if (!aplicou) return;
            for (const item of novos) { sincronia.idsJaAplicados.add(item.id); sincronia.idsParaConfirmar.push(item.id); }
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
        addEventListener('pagehide', () => { salvarProgresso(); sincronia.enviar(); });
        // Voltar para a fazenda pelo botão "Voltar" do navegador pode restaurar a página antiga da memória (com a sessão de antes):
        // recarrega para pegar o save e a sessão atuais.
        addEventListener('pageshow', evento => { if (evento.persisted) location.reload(); });
        document.addEventListener('visibilitychange', () => {
          if (document.hidden) { salvarProgresso(); sincronia.enviar(); }
          else if (sincronia.superada) sincronia.perguntarSeContinuaAqui();
          else sincronia.buscarXPPendente();
        });
        setInterval(() => sincronia.buscarXPPendente(), INTERVALO_DA_CONSULTA_DE_XP_MS);
        setTimeout(() => sincronia.aplicarXP(SERVIDOR_DA_FAZENDA.xpPendente || []), 2500);   // depois da tela de carregamento
        sincronia.agendar(1000);
        if (window.FARMEDU_RASCUNHO_LOCAL_FALHOU) {
          setTimeout(() => mostrarFaixaDeInvasao('⚠️ Proteção local indisponível', 'O navegador recusou o armazenamento de recuperação. Mantenha esta página aberta até o servidor confirmar o salvamento.', 30000), 1200);
        }
        if (window.FARMEDU_RECUPERACAO_EM_CONFLITO) {
          setTimeout(() => mostrarFaixaDeInvasao('⚠️ Existe um progresso local pendente', 'O servidor já possui uma revisão mais recente. Para evitar sobrescrever dados, o rascunho deste dispositivo foi preservado e não foi aplicado automaticamente. Procure o suporte antes de continuar.', 30000), 1800);
        }
      }

      arquivoDaMontagemConcluido('34-sincronizacao-com-servidor.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim