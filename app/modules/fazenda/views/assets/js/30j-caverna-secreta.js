// ====================================================================================================
      // FARMEDU 3D — 30j-caverna-secreta.js (EDIÇÃO PESSOAL: a caverna secreta dos personagens)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA), depois da seção 30i e antes do loop.
      // ====================================================================================================
      const CAVERNA_SECRETA_CONFIG = {
        ativa: true,
        segundosDaIrisFechando: 1.0, segundosDaIrisAbrindo: 1.1, segundosDaIrisNaVolta: 0.8,
        // arquivos da cena, em ordem (relativos a views/assets/easter-eggs/)
        arquivos: ['caverna/configuracao.js',
          'caverna/sprites.js', 'caverna/efeitos.js', 'caverna/cenario/caverna.js', 'caverna/personagens/ator.js', 'caverna/personagens/boneco.js',
          'caverna/personagens/ultron.js', 'caverna/personagens/coringa.js', 'caverna/personagens/venom.js', 'caverna/personagens/hulk.js',
          'caverna/personagens/destino.js', 'caverna/personagens/batman.js', 'caverna/personagens/slenderman.js', 'caverna/personagens/freddy.js', 'caverna/falas.js',
          'caverna/motor.js'],
        personagens: [],
      };
      const CAVERNA_SECRETA = { estado: 'fechada', carregamento: null, centroDaEntrada: null, entradas: 0 };

      // ---- elementos (criados aqui: o HTML da equipe não muda). Nenhum texto dentro da cena: só o botão de volta. ----
      const camadaDaCaverna = document.createElement('div'); camadaDaCaverna.id = 'caverna-secreta'; camadaDaCaverna.hidden = true;
      camadaDaCaverna.setAttribute('role', 'dialog'); camadaDaCaverna.setAttribute('aria-label', 'Caverna secreta');
      camadaDaCaverna.innerHTML = '<canvas id="tela-da-caverna" aria-hidden="true"></canvas>'
        + '<button id="sair-da-caverna" type="button" title="Voltar à fazenda (Esc)">⟵ Fazenda <kbd>Esc</kbd></button>';
      document.body.appendChild(camadaDaCaverna);

      // ---- endereço dos arquivos (servidor PHP → rota fazenda/arquivo; file:// → pasta), relativo a assets/easter-eggs/ ----
      const enderecoDaCaverna = function enderecoDaCaverna(caminho, semCache) {
        const endereco = new URL(ENDERECO_DO_SCRIPT_PRINCIPAL || location.href);
        const sufixo = semCache ? (caminho.includes('?') ? '&' : '?') + 'v=' + Date.now() : '';
        if (endereco.protocol === 'file:' || !ENDERECO_DO_SCRIPT_PRINCIPAL) return new URL('../easter-eggs/' + caminho + sufixo, endereco).href;
        const partes = ('easter-eggs/' + caminho).split('/'), arquivo = partes.pop();
        return new URL('arquivo?type=' + encodeURIComponent(partes.join('/')) + '&file=' + encodeURIComponent(arquivo) + (semCache ? '&v=' + Date.now() : ''), endereco).href;
      };

      // Baixa os arquivos UMA vez (em ordem), depois os PNGs dos sprites, e prepara a cena; chamadas seguintes reutilizam.
      const carregarCavernaSecreta = function carregarCavernaSecreta() {
        if (CAVERNA_SECRETA.carregamento) return CAVERNA_SECRETA.carregamento;
        if (!document.querySelector('link[data-fonte-do-celeiro]')) { const fonte = document.createElement('link'); fonte.rel = 'stylesheet'; fonte.href = CENA_DO_CELEIRO_CONFIG.fonte; fonte.dataset.fonteDoCeleiro = '1'; document.head.appendChild(fonte); }
        const scripts = (window.CenaDoCeleiro && window.CenaDoCeleiro.pixel ? [] : ['vingadores/pixel.js']).concat(CAVERNA_SECRETA_CONFIG.arquivos);
        (window.CavernaSecreta = window.CavernaSecreta || {}).endereco = enderecoDaCaverna;
        CAVERNA_SECRETA.carregamento = scripts.reduce((anterior, caminho) => anterior.then(() => new Promise((resolver, rejeitar) => {
          const script = document.createElement('script'); script.src = enderecoDaCaverna(caminho, true); script.async = false;
          script.onload = resolver; script.onerror = () => rejeitar(new Error('arquivo da caverna não carregou: ' + caminho));
          document.head.appendChild(script);
        })), Promise.resolve())
          .then(() => window.CavernaSecreta.sprites.carregar(CAVERNA_SECRETA_CONFIG.personagens))
          .then(() => { window.CavernaSecreta.motor.iniciar({ tela: selecionar('#tela-da-caverna') }); });
        CAVERNA_SECRETA.carregamento.catch(erro => { console.error('[FarmEdu] Caverna secreta:', erro); CAVERNA_SECRETA.carregamento = null; });
        return CAVERNA_SECRETA.carregamento;
      };

      // ---- alvo de clique: a abertura em arco da boca da caverna ----
      const alvoDaCaverna = (() => {
        const meiaLargura = 1.35, alturaDaParede = 1.15, pontos = [new THREE.Vector2(meiaLargura, 0)];
        for (let passo = 0; passo <= 18; passo++) { const angulo = passo / 18 * Math.PI; pontos.push(new THREE.Vector2(Math.cos(angulo) * meiaLargura, alturaDaParede + Math.sin(angulo) * meiaLargura)); }
        pontos.push(new THREE.Vector2(-meiaLargura, 0));
        const geometria = new THREE.ShapeGeometry(new THREE.Shape(pontos)); geometria.translate(0, 0, 0.02);
        const malha = new THREE.Mesh(geometria, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
        entradaDaCaverna.updateMatrixWorld(true); malha.matrixAutoUpdate = false; malha.matrixWorld.copy(entradaDaCaverna.matrixWorld);
        return malha;
      })();

      // Pista discreta no fundo do túnel
      const pistaDaCaverna = (() => {
        const material = new THREE.MeshBasicMaterial({ color: 0xff3322, transparent: true, opacity: 0.0, depthWrite: false, fog: false, blending: THREE.AdditiveBlending });
        material.userData.ignorarCiclo = true;
        const malha = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55), material);
        malha.position.set(0, 0.85, -(1.4 + MINA_GEOMETRIA.profundidadeDoTunel) + 0.12); malha.userData.nome = 'pista-da-caverna-secreta'; malha.renderOrder = 2;
        const cores = [new THREE.Color(0xff3322), new THREE.Color(0x39ff6a), new THREE.Color(0x9b3dff), new THREE.Color(0xffb45a)], cor = new THREE.Color();
        malha.onBeforeRender = () => {
          const segundos = performance.now() / 1000, fase = (segundos / 4) % cores.length, indiceDaCor = Math.floor(fase), transicao = fase - indiceDaCor;
          cor.copy(cores[indiceDaCor]).lerp(cores[(indiceDaCor + 1) % cores.length], transicao * transicao * (3 - 2 * transicao)); material.color.copy(cor);
          material.opacity = 0.32 + 0.1 * Math.sin(segundos * 1.7) + (Math.sin(segundos * 23) > 0.96 ? 0.15 : 0);
        };
        entradaDaCaverna.add(malha);
        return malha;
      })();

      const raioDaCaverna = new THREE.Raycaster(), pontoDaCaverna = new THREE.Vector2();
      const raioAcertaAEntradaDaCaverna = function raioAcertaAEntradaDaCaverna(raio) {
        if (!CAVERNA_SECRETA_CONFIG.ativa) return false;
        const acerto = raio.intersectObject(alvoDaCaverna, false)[0]; if (!acerto) return false;
        const naFrente = objeto => { const outro = objeto && raio.intersectObject(objeto, true)[0]; return !!outro && outro.distance < acerto.distance - 0.05; };
        if (estado.niveis.mina && naFrente(grupoDaArea.mina)) return false;
        if (typeof NPCS_CLICAVEIS !== 'undefined' && NPCS_CLICAVEIS.some(npc => naFrente(npc.areaDeClique))) return false;
        if (naFrente(pedraSecreta.hitbox)) return false;
        return true;
      };
      const centroDaEntradaNaTela = function centroDaEntradaNaTela() {
        const ponto = new THREE.Vector3(0, 1.2, 0).applyMatrix4(entradaDaCaverna.matrixWorld).project(camera), retangulo = canvas.getBoundingClientRect();
        return [Math.min(retangulo.right, Math.max(retangulo.left, retangulo.left + (ponto.x + 1) / 2 * retangulo.width)), Math.min(retangulo.bottom, Math.max(retangulo.top, retangulo.top + (1 - ponto.y) / 2 * retangulo.height))];
      };

      // ---- condições para entrar (vazio = pode) ----
      const motivoParaNaoEntrarNaCaverna = function motivoParaNaoEntrarNaCaverna() {
        if (!CAVERNA_SECRETA_CONFIG.ativa || CENA_DO_CELEIRO.estado !== 'fechada' || CAVERNA_SECRETA.estado !== 'fechada') return 'ocupado';
        if (INVASAO_EM_CURSO.fase !== 'nenhuma') return 'Agora não: há uma invasão acontecendo lá fora!';
        try { if (eventoEspecialEmAndamento()) return 'cena especial'; } catch (erro) { }
        for (const seletor of ['#tutorial', '#painel-do-guardiao', '#janela-nome-da-fazenda', '#janela-defesa', '#tela-de-carregamento']) { const elemento = document.querySelector(seletor); if (elemento && !elemento.hidden) return seletor; }
        return '';
      };

      // ---- controle de áudio da cena da caverna ----
      const MAPA_VOZES_CAVERNA = {
        ultron: 'ultronFala',
        coringa: 'coringaFala',
        venom: 'venomFala',
        hulk: 'hulkFala',
        destino: 'destinoFala',
        drdestino: 'destinoFala',
        batman: 'batmanFala',
        slenderman: 'slendermanFala',
        slender: 'slendermanFala',
        freddy: 'freddyFala',
      };
      const CHAVES_BALOES_CAVERNA = ['cavernaFala1', 'cavernaFala2', 'cavernaFala3'];
      let ultimoSomBalao = '';

      const dispararChaveAudioCaverna = function dispararChaveAudioCaverna(chave) {
        const fonte = FONTES_DE_SOM && FONTES_DE_SOM.segredos && FONTES_DE_SOM.segredos[chave];
        const cfg = AUDIO_CONFIG && AUDIO_CONFIG.segredos && AUDIO_CONFIG.segredos[chave];
        if (!fonte || !cfg) { console.warn('[Caverna] Chave de áudio não registrada em 02b-configuracao-dos-audios.js:', chave); return; }
        if (!ESTADO_DO_AUDIO.efeitos.ligado) return;
        ESTADO_DO_AUDIO.liberado = true;
        if (fonte.estado === 'erro') reiniciarFonteDeSom(fonte);
        fonte.el.muted = ESTADO_DO_AUDIO.silenciado;
        try { fonte.el.currentTime = 0; } catch (e) { }
        tocarSom(fonte, limitarVolume(ESTADO_DO_AUDIO.efeitos.volume * cfg.volume));
      };

      // Voz exclusiva ao clicar em um personagem
      const tocarVozBonecoCaverna = function tocarVozBonecoCaverna(id) {
        const chave = MAPA_VOZES_CAVERNA[String(id || '').toLowerCase()] || (id + 'Fala');
        for (const outraChave of new Set(Object.values(MAPA_VOZES_CAVERNA))) {
          const f = FONTES_DE_SOM && FONTES_DE_SOM.segredos && FONTES_DE_SOM.segredos[outraChave];
          if (f) pararSom(f);
        }
        dispararChaveAudioCaverna(chave);
      };

      // Um dos 3 sons genéricos sorteado aleatoriamente para os balões de fala
      const tocarSomBalaoCaverna = function tocarSomBalaoCaverna() {
        const opcoes = CHAVES_BALOES_CAVERNA.filter(c => c !== ultimoSomBalao);
        const escolhida = opcoes[Math.floor(Math.random() * opcoes.length)] || CHAVES_BALOES_CAVERNA[0];
        ultimoSomBalao = escolhida;
        dispararChaveAudioCaverna(escolhida);
      };

      const pararSonsBalaoCaverna = function pararSonsBalaoCaverna() {
        for (const chave of CHAVES_BALOES_CAVERNA) {
          const f = FONTES_DE_SOM && FONTES_DE_SOM.segredos && FONTES_DE_SOM.segredos[chave];
          if (f) pararSom(f);
        }
      };

      window.CavernaSecreta = window.CavernaSecreta || {};
      window.CavernaSecreta.tocarVozBoneco = tocarVozBonecoCaverna;
      window.CavernaSecreta.tocarSomBalao = tocarSomBalaoCaverna;
      window.CavernaSecreta.pararSonsBalao = pararSonsBalaoCaverna;

      const tocarMusicaDaCaverna = function tocarMusicaDaCaverna() {
        const fonte = FONTES_DE_SOM && FONTES_DE_SOM.segredos && FONTES_DE_SOM.segredos.cavernaTema;
        const cfg = AUDIO_CONFIG && AUDIO_CONFIG.segredos && AUDIO_CONFIG.segredos.cavernaTema;
        if (!fonte || !cfg) { console.warn('[Caverna] "cavernaTema" não registrado em 02b-configuracao-dos-audios.js'); return; }
        if (!ESTADO_DO_AUDIO.musica.ligado) return;
        ESTADO_DO_AUDIO.liberado = true;
        if (fonte.estado === 'erro') reiniciarFonteDeSom(fonte);
        fonte.el.loop = true;
        fonte.el.muted = ESTADO_DO_AUDIO.silenciado;
        try { fonte.el.currentTime = 0; } catch (e) { }
        tocarSom(fonte, limitarVolume(ESTADO_DO_AUDIO.musica.volume * cfg.volume));
      };

      const pararMusicaDaCaverna = function pararMusicaDaCaverna() {
        const fonte = FONTES_DE_SOM && FONTES_DE_SOM.segredos && FONTES_DE_SOM.segredos.cavernaTema;
        if (fonte) fonte.el.loop = false;
        pararSegredo('cavernaTema');
        pararSonsBalaoCaverna();
        for (const chave of new Set(Object.values(MAPA_VOZES_CAVERNA))) {
          const f = FONTES_DE_SOM && FONTES_DE_SOM.segredos && FONTES_DE_SOM.segredos[chave];
          if (f) pararSom(f);
        }
      };

      // ---- entrar e sair ----
      const suspenderFazendaPelaCaverna = function suspenderFazendaPelaCaverna() { FAZENDA_SUSPENSA.ativa = true; FAZENDA_SUSPENSA.motivo = 'caverna'; pausarSonsDaFazenda(); };
      const retomarFazendaDepoisDaCaverna = function retomarFazendaDepoisDaCaverna() { FAZENDA_SUSPENSA.ativa = false; FAZENDA_SUSPENSA.motivo = ''; retomarSonsDaFazenda(); };
      const entrarNaCaverna = async function entrarNaCaverna() {
        const motivo = motivoParaNaoEntrarNaCaverna();
        if (motivo) { if (motivo.startsWith('Agora')) mostrarAviso('🧟 ' + motivo); return false; }
        CAVERNA_SECRETA.estado = 'abrindo'; CAVERNA_SECRETA.entradas++;
        registrarAtividade(); fecharPainelDaEstrutura && fecharPainelDaEstrutura(false);
        CAVERNA_SECRETA.centroDaEntrada = centroDaEntradaNaTela();
        suspenderFazendaPelaCaverna();
        tocarMusicaDaCaverna();
        const carregando = carregarCavernaSecreta();
        await animarIris(CAVERNA_SECRETA.centroDaEntrada, 1, 0, CAVERNA_SECRETA_CONFIG.segundosDaIrisFechando);
        try { await carregando; }
        catch (erro) { pararMusicaDaCaverna(); await animarIris(CAVERNA_SECRETA.centroDaEntrada, 0, 1, 0.6); irisDoCeleiro.hidden = true; retomarFazendaDepoisDaCaverna(); CAVERNA_SECRETA.estado = 'fechada'; mostrarAviso('Não foi possível abrir a caverna agora.'); return false; }
        camadaDaCaverna.hidden = false; document.body.classList.add('dentro-da-caverna');
        window.CavernaSecreta.motor.retomar();
        const retanguloDaCena = selecionar('#tela-da-caverna').getBoundingClientRect();
        await animarIris([retanguloDaCena.left + retanguloDaCena.width * 0.5, retanguloDaCena.top + retanguloDaCena.height * 0.55], 0, 1, CAVERNA_SECRETA_CONFIG.segundosDaIrisAbrindo);
        irisDoCeleiro.hidden = true; CAVERNA_SECRETA.estado = 'aberta';
        selecionar('#sair-da-caverna').focus({ preventScroll: true });
        return true;
      };
      const sairDaCaverna = async function sairDaCaverna() {
        if (CAVERNA_SECRETA.estado !== 'aberta') return false;
        CAVERNA_SECRETA.estado = 'fechando';
        pararMusicaDaCaverna();
        const retanguloDaCena = selecionar('#tela-da-caverna').getBoundingClientRect();
        await animarIris([retanguloDaCena.left + retanguloDaCena.width * 0.5, retanguloDaCena.top + retanguloDaCena.height * 0.55], 1, 0, CAVERNA_SECRETA_CONFIG.segundosDaIrisNaVolta);
        window.CavernaSecreta.motor.suspender();
        camadaDaCaverna.hidden = true; document.body.classList.remove('dentro-da-caverna');
        renderizador.render(cena, camera);
        await animarIris(centroDaEntradaNaTela(), 0, 1, CAVERNA_SECRETA_CONFIG.segundosDaIrisFechando);
        irisDoCeleiro.hidden = true; retomarFazendaDepoisDaCaverna(); CAVERNA_SECRETA.estado = 'fechada';
        return true;
      };
      selecionar('#sair-da-caverna').addEventListener('click', () => { sairDaCaverna(); });
      const teclasDaCaverna = evento => {
        if (CAVERNA_SECRETA.estado === 'fechada') return;
        if (evento.type === 'keydown' && evento.key === 'Escape') sairDaCaverna();
        if (evento.key !== 'Tab') { evento.stopImmediatePropagation(); if (evento.key === 'Escape') evento.preventDefault(); }
      };
      addEventListener('keydown', teclasDaCaverna, true); addEventListener('keyup', teclasDaCaverna, true);

      // ---- clique na boca da caverna ----
      let toqueNaCaverna = null;
      canvas.addEventListener('pointerdown', evento => { toqueNaCaverna = evento.isPrimary ? { x: evento.clientX, y: evento.clientY, instante: performance.now() } : null; });
      canvas.addEventListener('pointerup', evento => {
        const inicio = toqueNaCaverna; toqueNaCaverna = null;
        if (!inicio || Math.hypot(evento.clientX - inicio.x, evento.clientY - inicio.y) > 6 || performance.now() - inicio.instante > 500) return;
        const retangulo = canvas.getBoundingClientRect();
        pontoDaCaverna.set(((evento.clientX - retangulo.left) / retangulo.width) * 2 - 1, -((evento.clientY - retangulo.top) / retangulo.height) * 2 + 1);
        raioDaCaverna.setFromCamera(pontoDaCaverna, camera);
        if (raioAcertaAEntradaDaCaverna(raioDaCaverna)) entrarNaCaverna();
      });
      Object.assign(window, { farmEduCaverna: { entrar: entrarNaCaverna, sair: sairDaCaverna, estado: () => CAVERNA_SECRETA.estado, motivo: motivoParaNaoEntrarNaCaverna, centro: centroDaEntradaNaTela, acertaEntrada: raioAcertaAEntradaDaCaverna, pista: pistaDaCaverna } });

      arquivoDaMontagemConcluido('30j-caverna-secreta.js');