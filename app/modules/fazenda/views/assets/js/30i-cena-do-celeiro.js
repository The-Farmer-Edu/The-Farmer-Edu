// ====================================================================================================
      // FARMEDU 3D — 30i-cena-do-celeiro.js (EDIÇÃO PESSOAL: a cena viva dentro do celeiro)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA), depois da seção 30g e antes do loop.
      // ====================================================================================================
      // Clicar no CELEIRO (construído e inteiro) leva a uma cena 2D em pixel art: um laboratório secreto dentro do celeiro, onde
      // Tony Stark e Nick Fury conversam. Esta seção é só a PORTA: clique, condições, transições "íris" (fecha sobre o celeiro e
      // abre na cena; o inverso na volta), suspensão da Fazenda e carregamento sob demanda. A cena em si (arte, personagens,
      // diálogos e o seu laço próprio) fica em views/assets/easter-eggs/vingadores/ e só é baixada na PRIMEIRA entrada.
      // Estado preservado: a Fazenda NÃO é reiniciada. Enquanto a cena está aberta, o laço da Fazenda fica suspenso
      // (FAZENDA_SUSPENSA, seção 31: o mesmo efeito de trocar de aba), a música e os sons de ambiente pausam e voltam ao sair.
      // ====================================================================================================
      const CENA_DO_CELEIRO_CONFIG = {
        ativa: true,
        segundosDaIrisFechando: 0.9, segundosDaIrisAbrindo: 1.0, segundosDaIrisNaVolta: 0.7,
        // arquivos da cena, em ordem (relativos a views/assets/easter-eggs/vingadores/)
        arquivos: ['configuracao.js', 'pixel.js', 'cenario/oficina.js', 'personagens/ator.js', 'personagens/homem-de-ferro.js', 'personagens/nick-fury.js', 'dialogos/conversas.js', 'motor.js'],
        fonte: 'https://fonts.googleapis.com/css2?family=VT323&display=swap',   // fonte pixelada dos balões (sem internet: monospace)
      };
      const CENA_DO_CELEIRO = { estado: 'fechada', carregamento: null, centroDoCeleiro: null, entradas: 0 };   // fechada | abrindo | aberta | fechando

      // ---- elementos (criados aqui: o HTML da equipe não muda) ----
      const camadaDoCeleiro = document.createElement('div'); camadaDoCeleiro.id = 'cena-do-celeiro'; camadaDoCeleiro.hidden = true;
      camadaDoCeleiro.setAttribute('role', 'dialog'); camadaDoCeleiro.setAttribute('aria-label', 'Cena do celeiro');
      camadaDoCeleiro.innerHTML = '<canvas id="tela-do-celeiro" aria-hidden="true"></canvas>'
        + '<div id="balao-do-celeiro" hidden aria-live="polite"><span class="nome"></span><span class="texto"></span></div>'
        + '<button id="sair-do-celeiro" type="button" title="Voltar à fazenda (Esc)">⟵ Fazenda <kbd>Esc</kbd></button>';
      document.body.appendChild(camadaDoCeleiro);
      const irisDoCeleiro = document.createElement('canvas'); irisDoCeleiro.id = 'iris-do-celeiro'; irisDoCeleiro.hidden = true; document.body.appendChild(irisDoCeleiro);

      // ---- endereço dos arquivos da cena (mesma lógica dos áudios: servidor PHP → rota fazenda/arquivo; file:// → pasta) ----
      const enderecoDaCena = function enderecoDaCena(caminho) {
        const endereco = new URL(ENDERECO_DO_SCRIPT_PRINCIPAL || location.href);
        if (endereco.protocol === 'file:' || !ENDERECO_DO_SCRIPT_PRINCIPAL) return new URL('../easter-eggs/vingadores/' + caminho, endereco).href;
        const partes = ('easter-eggs/vingadores/' + caminho).split('/'), arquivo = partes.pop();
        return new URL('arquivo?type=' + encodeURIComponent(partes.join('/')) + '&file=' + encodeURIComponent(arquivo), endereco).href;
      };
      // Baixa os arquivos da cena UMA vez (em ordem) e prepara a cena; chamadas seguintes reutilizam a mesma promessa.
      const carregarCenaDoCeleiro = function carregarCenaDoCeleiro() {
        if (CENA_DO_CELEIRO.carregamento) return CENA_DO_CELEIRO.carregamento;
        if (!document.querySelector('link[data-fonte-do-celeiro]')) { const fonte = document.createElement('link'); fonte.rel = 'stylesheet'; fonte.href = CENA_DO_CELEIRO_CONFIG.fonte; fonte.dataset.fonteDoCeleiro = '1'; document.head.appendChild(fonte); }
        CENA_DO_CELEIRO.carregamento = CENA_DO_CELEIRO_CONFIG.arquivos.reduce((anterior, caminho) => anterior.then(() => new Promise((resolver, rejeitar) => {
          const script = document.createElement('script'); script.src = enderecoDaCena(caminho); script.async = false;
          script.onload = resolver; script.onerror = () => rejeitar(new Error('arquivo da cena do celeiro não carregou: ' + caminho));
          document.head.appendChild(script);
        })), Promise.resolve()).then(() => {
          window.CenaDoCeleiro.motor.iniciar({ tela: selecionar('#tela-do-celeiro'), balao: selecionar('#balao-do-celeiro'), nome: selecionar('#balao-do-celeiro .nome'), texto: selecionar('#balao-do-celeiro .texto') });
        });
        CENA_DO_CELEIRO.carregamento.catch(erro => { console.error('[FarmEdu] Cena do celeiro:', erro); CENA_DO_CELEIRO.carregamento = null; });
        return CENA_DO_CELEIRO.carregamento;
      };

      // ---- íris (círculo que fecha/abre sobre um ponto da tela) ----
      const animarIris = function animarIris(centro, de, para, segundos) {
        return new Promise(resolver => {
          const razao = Math.min(2, devicePixelRatio || 1), largura = innerWidth, altura = innerHeight;
          irisDoCeleiro.width = Math.round(largura * razao); irisDoCeleiro.height = Math.round(altura * razao); irisDoCeleiro.hidden = false;
          const contexto = irisDoCeleiro.getContext('2d'), raioMaximo = Math.hypot(Math.max(centro[0], largura - centro[0]), Math.max(centro[1], altura - centro[1])) + 4, inicio = performance.now();
          const desenhar = agora => {
            const fracao = Math.min(1, (agora - inicio) / (segundos * 1000)), fracaoSuave = fracao * fracao * (3 - 2 * fracao), raio = raioMaximo * (de + (para - de) * fracaoSuave);
            contexto.setTransform(razao, 0, 0, razao, 0, 0); contexto.clearRect(0, 0, largura, altura);
            contexto.fillStyle = '#000'; contexto.beginPath(); contexto.rect(0, 0, largura, altura);
            if (raio > 0.5) contexto.arc(centro[0], centro[1], raio, 0, Math.PI * 2, true);
            contexto.fill('evenodd');
            if (raio > 0.5 && raio < raioMaximo) { contexto.strokeStyle = 'rgba(255,255,255,0.08)'; contexto.lineWidth = 2; contexto.beginPath(); contexto.arc(centro[0], centro[1], raio, 0, Math.PI * 2); contexto.stroke(); }
            if (fracao < 1) requestAnimationFrame(desenhar); else resolver();
          };
          requestAnimationFrame(desenhar);
        });
      };
      // ponto do celeiro na tela (centro do telhado), para a íris fechar sobre ele
      const centroDoCeleiroNaTela = function centroDoCeleiroNaTela() {
        const area = AREAS.find(item => item.id === 'celeiro'), ponto = new THREE.Vector3(area.posicao.x, 3, area.posicao.z).project(camera);
        const caixaDoCanvas = canvas.getBoundingClientRect();
        return [Math.min(caixaDoCanvas.right, Math.max(caixaDoCanvas.left, caixaDoCanvas.left + (ponto.x + 1) / 2 * caixaDoCanvas.width)), Math.min(caixaDoCanvas.bottom, Math.max(caixaDoCanvas.top, caixaDoCanvas.top + (1 - ponto.y) / 2 * caixaDoCanvas.height))];
      };

      // ---- condições para entrar (vazio = pode) ----
      const motivoParaNaoEntrarNoCeleiro = function motivoParaNaoEntrarNoCeleiro() {
        if (!CENA_DO_CELEIRO_CONFIG.ativa || CENA_DO_CELEIRO.estado !== 'fechada') return 'ocupado';
        if (!(estado.niveis.celeiro > 0) || instalacaoDestruida('celeiro')) return 'sem celeiro';
        if (INVASAO_EM_CURSO.fase !== 'nenhuma') return 'Agora não: há uma invasão acontecendo lá fora!';
        try { if (eventoEspecialEmAndamento()) return 'cena especial'; } catch (erro) { }
        for (const seletor of ['#tutorial', '#painel-do-guardiao', '#janela-nome-da-fazenda', '#janela-defesa', '#tela-de-carregamento']) { const elemento = document.querySelector(seletor); if (elemento && !elemento.hidden) return seletor; }
        return '';
      };

      // ---- controle de áudio da cena do celeiro ----
      const tocarMusicaDoCeleiro = function tocarMusicaDoCeleiro() {
        const fonte = FONTES_DE_SOM && FONTES_DE_SOM.segredos && FONTES_DE_SOM.segredos.celeiroTema;
        const cfg = AUDIO_CONFIG && AUDIO_CONFIG.segredos && AUDIO_CONFIG.segredos.celeiroTema;
        if (!fonte || !cfg) { console.warn('[Celeiro] "celeiroTema" não registrado em 02b-configuracao-dos-audios.js'); return; }
        if (!ESTADO_DO_AUDIO.musica.ligado) return;
        ESTADO_DO_AUDIO.liberado = true;
        if (fonte.estado === 'erro') reiniciarFonteDeSom(fonte);
        fonte.el.loop = true;
        fonte.el.muted = ESTADO_DO_AUDIO.silenciado;
        try { fonte.el.currentTime = 0; } catch (e) { }
        tocarSom(fonte, limitarVolume(ESTADO_DO_AUDIO.musica.volume * cfg.volume));
      };
      const pararMusicaDoCeleiro = function pararMusicaDoCeleiro() {
        const fonte = FONTES_DE_SOM && FONTES_DE_SOM.segredos && FONTES_DE_SOM.segredos.celeiroTema;
        if (fonte) fonte.el.loop = false;
        pararSegredo('celeiroTema');
        pararSegredo('tonyFala');
        pararSegredo('furyFala');
      };

      // ---- entrar e sair ----
      const pausarSonsDaFazenda = function pausarSonsDaFazenda() { for (const nome of ['musica', 'cachoeira', 'fonte', 'trator']) if (FONTES_DE_SOM[nome]) pararSom(FONTES_DE_SOM[nome]); };
      const retomarSonsDaFazenda = function retomarSonsDaFazenda() { try { sincronizarMusica(); for (const nome of ['cachoeira', 'fonte', 'trator']) sincronizarAmbiente(nome); } catch (erro) { } };
      const entrarNoCeleiro = async function entrarNoCeleiro() {
        const motivo = motivoParaNaoEntrarNoCeleiro();
        if (motivo) { if (motivo.startsWith('Agora')) mostrarAviso('🧟 ' + motivo); return false; }
        CENA_DO_CELEIRO.estado = 'abrindo'; CENA_DO_CELEIRO.entradas++;
        registrarAtividade(); fecharPainelDaEstrutura && fecharPainelDaEstrutura(false);
        pausarSonsDaFazenda();
        tocarMusicaDoCeleiro();                                             // inicia imediatamente no gesto de clique do jogador
        const carregando = carregarCenaDoCeleiro();                         // começa a baixar enquanto a íris fecha
        CENA_DO_CELEIRO.centroDoCeleiro = centroDoCeleiroNaTela();
        await animarIris(CENA_DO_CELEIRO.centroDoCeleiro, 1, 0, CENA_DO_CELEIRO_CONFIG.segundosDaIrisFechando);
        FAZENDA_SUSPENSA.ativa = true; FAZENDA_SUSPENSA.motivo = 'celeiro';
        try { await carregando; }
        catch (erro) { pararMusicaDoCeleiro(); FAZENDA_SUSPENSA.ativa = false; retomarSonsDaFazenda(); await animarIris(CENA_DO_CELEIRO.centroDoCeleiro, 0, 1, 0.6); irisDoCeleiro.hidden = true; CENA_DO_CELEIRO.estado = 'fechada'; mostrarAviso('Não foi possível abrir o celeiro agora.'); return false; }
        camadaDoCeleiro.hidden = false; document.body.classList.add('dentro-do-celeiro');
        window.CenaDoCeleiro.motor.retomar();
        const caixaDaCena = selecionar('#tela-do-celeiro').getBoundingClientRect();
        await animarIris([caixaDaCena.left + caixaDaCena.width / 2, caixaDaCena.top + caixaDaCena.height * 0.62], 0, 1, CENA_DO_CELEIRO_CONFIG.segundosDaIrisAbrindo);
        irisDoCeleiro.hidden = true; CENA_DO_CELEIRO.estado = 'aberta';
        selecionar('#sair-do-celeiro').focus({ preventScroll: true });
        return true;
      };
      const sairDoCeleiro = async function sairDoCeleiro() {
        if (CENA_DO_CELEIRO.estado !== 'aberta') return false;
        CENA_DO_CELEIRO.estado = 'fechando';
        pararMusicaDoCeleiro();
        const caixaDaCena = selecionar('#tela-do-celeiro').getBoundingClientRect();
        await animarIris([caixaDaCena.left + caixaDaCena.width / 2, caixaDaCena.top + caixaDaCena.height * 0.62], 1, 0, CENA_DO_CELEIRO_CONFIG.segundosDaIrisNaVolta);
        window.CenaDoCeleiro.motor.suspender();
        camadaDoCeleiro.hidden = true; document.body.classList.remove('dentro-do-celeiro');
        FAZENDA_SUSPENSA.ativa = false; FAZENDA_SUSPENSA.motivo = ''; retomarSonsDaFazenda();
        await animarIris(centroDoCeleiroNaTela(), 0, 1, CENA_DO_CELEIRO_CONFIG.segundosDaIrisFechando);
        irisDoCeleiro.hidden = true; CENA_DO_CELEIRO.estado = 'fechada';
        return true;
      };
      selecionar('#sair-do-celeiro').addEventListener('click', () => { sairDoCeleiro(); });
      // teclado: enquanto a cena (ou uma transição) está na tela, NENHUMA tecla chega à Fazenda (WASD, atalhos...); Esc sai
      const teclasDoCeleiro = evento => {
        if (CENA_DO_CELEIRO.estado === 'fechada') return;
        if (evento.type === 'keydown' && evento.key === 'Escape') sairDoCeleiro();
        if (evento.key !== 'Tab') { evento.stopImmediatePropagation(); if (evento.key === 'Escape') evento.preventDefault(); }
      };
      addEventListener('keydown', teclasDoCeleiro, true); addEventListener('keyup', teclasDoCeleiro, true);
      // a íris bloqueia cliques durante as transições
      irisDoCeleiro.addEventListener('pointerdown', evento => evento.stopPropagation());

      // ---- clique no celeiro 3D: toque curto (sem arrastar a câmera) dentro da caixa do celeiro ----
      const raioDoCeleiro = new THREE.Raycaster(), pontoDoCeleiro = new THREE.Vector2(), caixaDoCeleiro = new THREE.Box3();
      let toqueNoCeleiro = null;
      canvas.addEventListener('pointerdown', evento => { toqueNoCeleiro = evento.isPrimary ? { x: evento.clientX, y: evento.clientY, t: performance.now() } : null; });
      canvas.addEventListener('pointerup', evento => {
        const inicio = toqueNoCeleiro; toqueNoCeleiro = null;
        if (!inicio || Math.hypot(evento.clientX - inicio.x, evento.clientY - inicio.y) > 6 || performance.now() - inicio.t > 500) return;
        if (!(estado.niveis.celeiro > 0) || instalacaoDestruida('celeiro')) return;
        const caixaDoCanvas = canvas.getBoundingClientRect();
        pontoDoCeleiro.set(((evento.clientX - caixaDoCanvas.left) / caixaDoCanvas.width) * 2 - 1, -((evento.clientY - caixaDoCanvas.top) / caixaDoCanvas.height) * 2 + 1);
        raioDoCeleiro.setFromCamera(pontoDoCeleiro, camera);
        const area = AREAS.find(item => item.id === 'celeiro'), [metadeX, metadeZ] = METADE_DO_TAMANHO_DA_AREA.celeiro;
        // caixa do prédio (o celeiro ocupa o miolo da área; a altura cresce com o nível)
        caixaDoCeleiro.min.set(area.posicao.x - metadeX * 0.75, 0, area.posicao.z - metadeZ * 0.75);
        caixaDoCeleiro.max.set(area.posicao.x + metadeX * 0.75, 4 + estado.niveis.celeiro * 1.2, area.posicao.z + metadeZ * 0.75);
        if (raioDoCeleiro.ray.intersectsBox(caixaDoCeleiro)) entrarNoCeleiro();
      });
      Object.assign(window, { farmEduCeleiro: { entrar: entrarNoCeleiro, sair: sairDoCeleiro, estado: () => CENA_DO_CELEIRO.estado, motivo: motivoParaNaoEntrarNoCeleiro, centro: centroDoCeleiroNaTela } });

      arquivoDaMontagemConcluido('30i-cena-do-celeiro.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim