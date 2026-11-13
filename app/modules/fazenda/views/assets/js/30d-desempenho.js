      // ====================================================================================================
      // FARMEDU 3D — 30d-desempenho.js (Etapa 0: otimização e preparação para PCs fracos)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA), depois da seção 30c e antes do loop
      // (seção 31). Mesmo padrão dos demais: declarações no escopo global compartilhado, funções como "const nome = function...".
      // ====================================================================================================
      // ====================================================================================================
      // SEÇÃO 30d — DESEMPENHO: MESCLAGEM VIGIADA DAS MALHAS E QUALIDADE AUTOMÁTICA
      //
      // POR QUE EXISTE (medição da Etapa 0): o quadro era limitado pelo NÚMERO DE CHAMADAS DE DESENHO, não pela lógica do jogo.
      // Com o save de referência havia ~1.256 chamadas por quadro (mais ~1.100 no mapa de sombras a cada 2 quadros); no navegador
      // real desta máquina o processo da página ficava 100% ocupado, metade dentro do Three.js preparando essas chamadas e metade
      // no envio delas à placa. A lógica da fazenda (lavoura, animais, equipe, painéis) ficava abaixo de 1%.
      // A seção 11f já junta o cenário fixo. Faltavam as áreas (construções), os animais, os personagens e as nuvens, que são
      // reconstruídos e animados durante o jogo e por isso não podiam ser mesclados uma vez só na montagem.
      //
      // COMO FUNCIONA (sem mudar nenhum construtor):
      //  1. "Raízes" são os grupos que se movem ou são refeitos como um todo: o grupo de cada área, cada animal, cada grupo solto
      //     na cena (personagens, NPCs, acampamento do lenhador, nuvens...).
      //  2. Observação: por 2,5 s o jogo roda normalmente e cada peça (e os grupos entre ela e a raiz) é comparada com uma "foto"
      //     tirada no início: posição, rotação, escala, visibilidade, pai, material, geometria e sombras. Quem mudou é dinâmico
      //     (pernas andando, pás do moinho, porta abrindo...) e nunca é mesclado.
      //  3. Mesclagem: as peças paradas da raiz que usam o MESMO material (e as mesmas opções de sombra) viram UMA malha, em
      //     coordenadas da própria raiz e colocada dentro dela (acompanha o grupo, o efeito de evolução e o clique na área).
      //  4. As peças originais NÃO são apagadas: continuam no mesmo lugar, com as mesmas referências usadas pelo resto do código,
      //     só que na camada 1, que a câmera não desenha (nem no mapa de sombras, nem no clique). Nada muda para quem as usa.
      //  5. Vigilância: a cada quadro as peças mescladas continuam sendo comparadas com a foto. Se alguma mudar (ex.: árvore
      //     cortada pelo lenhador, peça escondida, material trocado), a mesclagem daquela raiz é desfeita NO MESMO QUADRO (as
      //     originais voltam a ser desenhadas) e refeita depois, sem a peça que se mexeu. Ao reconstruir uma área, as peças
      //     antigas saem do grupo: a mesclagem antiga é liberada e a nova área é observada de novo.
      // Transparentes, instanciadas, espelhadas, com ordem de desenho própria, marcadas com userData.naoMesclar/animado ou com
      // atributos além de posição, normal e uv nunca entram (as nuvens são a exceção: cada uma usa um único material).
      // ====================================================================================================
      const MESCLAGEM_VIGIADA = {
        segundosDeObservacao: 2.5,      // quanto tempo uma raiz é observada antes de mesclar
        quadrosMinimosDeObservacao: 4,  // mesmo em máquinas muito lentas, pelo menos 4 quadros de observação
        malhasMinimasPorRaiz: 2,        // raízes com menos peças elegíveis não têm o que juntar
        refeitosMaximosPorRaiz: 20,     // depois disso a raiz fica sem mesclagem (proteção contra algo que muda o tempo todo)
        segundosEntreBuscas: 2,         // de quanto em quanto tempo procura raízes novas e peças novas nas raízes já mescladas
      };
      const CAMADA_DAS_PECAS_MESCLADAS = 1;   // camada das peças originais já mescladas (a câmera só desenha a camada 0)
      const raizesDaMesclagem = new Map();      // raiz → estado da observação/mesclagem
      // Grupos que se mexem dentro de uma raiz (cabeça e pernas dos animais, braços dos personagens, pás do moinho...) viram
      // raízes próprias: as peças paradas DENTRO deles são mescladas em relação a eles e acompanham o movimento.
      const raizesDerivadasDaMesclagem = new Set();
      const nosDinamicosDaMesclagem = new WeakSet(), raizesDesistidasDaMesclagem = new WeakSet();
      const contagemDaMesclagem = { lotesCriados: 0, lotesDesfeitos: 0, refeitosPorMovimento: 0, refeitosPorReconstrucao: 0, raizesDesistidas: 0 };
      let segundosAteBuscarRaizes = 0;
      const matrizInversaDaRaizMesclada = new THREE.Matrix4(), matrizRelativaDaPeca = new THREE.Matrix4(), matrizNormalDaPeca = new THREE.Matrix3(), vetorDaMesclagemVigiada = new THREE.Vector3();
      const AO_DESENHAR_PADRAO = THREE.Object3D.prototype.onBeforeRender;

      const fotografarNoDaMesclagem = function fotografarNoDaMesclagem(no) {
        const posicao = no.geometry && no.geometry.attributes && no.geometry.attributes.position;
        return { px: no.position.x, py: no.position.y, pz: no.position.z, qx: no.quaternion.x, qy: no.quaternion.y, qz: no.quaternion.z, qw: no.quaternion.w,
          sx: no.scale.x, sy: no.scale.y, sz: no.scale.z, visivel: no.visible, pai: no.parent, material: no.material, geometria: no.geometry,
          sombra: no.castShadow, recebe: no.receiveShadow, ordem: no.renderOrder, versao: posicao ? posicao.version : 0 };
      };
      const noDaMesclagemMudou = function noDaMesclagemMudou(no, foto) {
        if (no.position.x !== foto.px || no.position.y !== foto.py || no.position.z !== foto.pz) return true;
        if (no.quaternion.x !== foto.qx || no.quaternion.y !== foto.qy || no.quaternion.z !== foto.qz || no.quaternion.w !== foto.qw) return true;
        if (no.scale.x !== foto.sx || no.scale.y !== foto.sy || no.scale.z !== foto.sz) return true;
        if (no.visible !== foto.visivel || no.parent !== foto.pai || no.material !== foto.material || no.geometry !== foto.geometria) return true;
        if (no.castShadow !== foto.sombra || no.receiveShadow !== foto.recebe || no.renderOrder !== foto.ordem) return true;
        return !!(foto.geometria && foto.geometria.attributes && foto.geometria.attributes.position && foto.geometria.attributes.position.version !== foto.versao);
      };
      const malhaPodeSerMesclada = function malhaPodeSerMesclada(malha, permitirTransparentes) {
        if (!malha.isMesh || malha.isInstancedMesh || malha.isSkinnedMesh || !malha.visible) return false;
        if (malha.userData.mesclagemVigiada || malha.userData.naoMesclar || malha.userData.animado || malha.userData.mesclada) return false;
        if (nosDinamicosDaMesclagem.has(malha) || malha.layers.mask !== 1) return false;   // só peças na camada padrão
        const materialDaPeca = malha.material;
        if (!materialDaPeca || Array.isArray(materialDaPeca) || malha.renderOrder || malha.onBeforeRender !== AO_DESENHAR_PADRAO || malha.morphTargetInfluences) return false;
        if (materialDaPeca.transparent && !permitirTransparentes) return false;
        if (materialDaPeca.visible === false || materialDaPeca.colorWrite === false) return false;   // áreas de clique invisíveis continuam sendo testadas pelo raio do clique
        const geometria = malha.geometry, atributos = geometria && geometria.isBufferGeometry && geometria.attributes;
        if (!atributos || !atributos.position || !atributos.normal) return false;
        for (const nome in atributos) if (nome !== 'position' && nome !== 'normal' && nome !== 'uv') return false;
        if (geometria.morphAttributes && Object.keys(geometria.morphAttributes).length) return false;
        if (geometria.drawRange.start !== 0 || geometria.drawRange.count !== Infinity) return false;   // (os "groups" da BoxGeometry só valem com lista de materiais, que já fica de fora)
        return true;
      };
      // Raízes: grupos das áreas, animais dentro delas e grupos soltos na cena (cenário fixo já mesclado pela seção 11f não é grupo).
      const listarRaizesDaMesclagem = function listarRaizesDaMesclagem() {
        const raizes = [];
        for (const idDaArea in grupoDaArea) {
          const grupo = grupoDaArea[idDaArea]; raizes.push(grupo);
          grupo.traverse(objeto => { if (objeto !== grupo && objeto.userData && objeto.userData.animal) raizes.push(objeto); });
        }
        for (const filho of cena.children) if (filho.isGroup && !filho.userData.areaId && !filho.userData.naoMesclar) raizes.push(filho);
        for (const derivada of raizesDerivadasDaMesclagem) { if (raizEstaNaCena(derivada)) raizes.push(derivada); else raizesDerivadasDaMesclagem.delete(derivada); }
        return raizes;
      };
      const raizEstaNaCena = function raizEstaNaCena(raiz) { for (let atual = raiz; atual; atual = atual.parent) if (atual === cena) return true; return false; };
      // Peças elegíveis cujo dono (raiz mais próxima acima delas) é esta raiz; devolve também a cadeia de nós entre peça e raiz.
      const coletarPecasDaRaiz = function coletarPecasDaRaiz(raiz, conjuntoDeRaizes) {
        const permitirTransparentes = nuvens.includes(raiz), pecas = [];
        raiz.traverse(objeto => {
          if (!objeto.isMesh || !malhaPodeSerMesclada(objeto, permitirTransparentes)) return;
          const cadeia = [];
          for (let atual = objeto; atual && atual !== raiz; atual = atual.parent) {
            if (atual !== objeto && (conjuntoDeRaizes.has(atual) || atual.userData.naoMesclar || atual.userData.animado || !atual.visible || nosDinamicosDaMesclagem.has(atual))) return;
            if (!atual.parent) return;
            cadeia.push(atual);
          }
          pecas.push({ malha: objeto, cadeia });
        });
        return pecas;
      };
      const iniciarObservacaoDaRaiz = function iniciarObservacaoDaRaiz(raiz, conjuntoDeRaizes, refeitos = 0) {
        const pecas = coletarPecasDaRaiz(raiz, conjuntoDeRaizes);
        if (pecas.length < MESCLAGEM_VIGIADA.malhasMinimasPorRaiz) { raizesDaMesclagem.delete(raiz); return; }
        const fotos = new Map();
        for (const peca of pecas) for (const no of peca.cadeia) if (!fotos.has(no)) fotos.set(no, fotografarNoDaMesclagem(no));
        raizesDaMesclagem.set(raiz, { fase: 'observando', segundos: 0, quadros: 0, pecas, fotos, lotes: [], refeitos, conhecidas: new Set(pecas.map(peca => peca.malha)) });
      };
      // Junta as peças de um lote numa geometria só, em coordenadas da raiz. Peças espelhadas ficam de fora (devolve null se sobrar < 2).
      const mesclarLoteDaRaiz = function mesclarLoteDaRaiz(raiz, pecasDoLote) {
        matrizInversaDaRaizMesclada.copy(raiz.matrixWorld).invert();
        const aceitas = [];
        for (const peca of pecasDoLote) {
          matrizRelativaDaPeca.multiplyMatrices(matrizInversaDaRaizMesclada, peca.malha.matrixWorld);
          if (matrizRelativaDaPeca.determinant() > 0) aceitas.push({ peca, matriz: matrizRelativaDaPeca.clone() });
        }
        if (aceitas.length < 2) return null;
        const comUV = !!aceitas[0].peca.malha.geometry.attributes.uv;
        let totalDeVertices = 0, totalDeIndices = 0;
        for (const { peca } of aceitas) { const geometria = peca.malha.geometry; totalDeVertices += geometria.attributes.position.count; totalDeIndices += geometria.index ? geometria.index.count : geometria.attributes.position.count; }
        const posicoes = new Float32Array(totalDeVertices * 3), normais = new Float32Array(totalDeVertices * 3), coordenadas = comUV ? new Float32Array(totalDeVertices * 2) : null;
        const indices = totalDeVertices > 65535 ? new Uint32Array(totalDeIndices) : new Uint16Array(totalDeIndices);
        let deslocamentoDeVertices = 0, deslocamentoDeIndices = 0;
        for (const { peca, matriz } of aceitas) {
          const geometria = peca.malha.geometry, posicao = geometria.attributes.position, normal = geometria.attributes.normal, uv = geometria.attributes.uv;
          matrizNormalDaPeca.getNormalMatrix(matriz);
          for (let vertice = 0; vertice < posicao.count; vertice++) {
            const destino = (deslocamentoDeVertices + vertice) * 3;
            vetorDaMesclagemVigiada.set(posicao.getX(vertice), posicao.getY(vertice), posicao.getZ(vertice)).applyMatrix4(matriz);
            posicoes[destino] = vetorDaMesclagemVigiada.x; posicoes[destino + 1] = vetorDaMesclagemVigiada.y; posicoes[destino + 2] = vetorDaMesclagemVigiada.z;
            vetorDaMesclagemVigiada.set(normal.getX(vertice), normal.getY(vertice), normal.getZ(vertice)).applyMatrix3(matrizNormalDaPeca).normalize();
            normais[destino] = vetorDaMesclagemVigiada.x; normais[destino + 1] = vetorDaMesclagemVigiada.y; normais[destino + 2] = vetorDaMesclagemVigiada.z;
            if (comUV) { coordenadas[(deslocamentoDeVertices + vertice) * 2] = uv.getX(vertice); coordenadas[(deslocamentoDeVertices + vertice) * 2 + 1] = uv.getY(vertice); }
          }
          if (geometria.index) for (let indice = 0; indice < geometria.index.count; indice++) indices[deslocamentoDeIndices + indice] = geometria.index.getX(indice) + deslocamentoDeVertices;
          else for (let indice = 0; indice < posicao.count; indice++) indices[deslocamentoDeIndices + indice] = indice + deslocamentoDeVertices;
          deslocamentoDeVertices += posicao.count; deslocamentoDeIndices += geometria.index ? geometria.index.count : posicao.count;
        }
        const geometriaMesclada = new THREE.BufferGeometry();
        geometriaMesclada.setAttribute('position', new THREE.BufferAttribute(posicoes, 3)); geometriaMesclada.setAttribute('normal', new THREE.BufferAttribute(normais, 3));
        if (comUV) geometriaMesclada.setAttribute('uv', new THREE.BufferAttribute(coordenadas, 2));
        geometriaMesclada.setIndex(new THREE.BufferAttribute(indices, 1));
        geometriaMesclada.computeBoundingSphere();
        const primeira = aceitas[0].peca.malha, mesclada = new THREE.Mesh(geometriaMesclada, primeira.material);
        mesclada.castShadow = primeira.castShadow; mesclada.receiveShadow = primeira.receiveShadow;
        mesclada.userData.mesclagemVigiada = true; mesclada.matrixAutoUpdate = false; mesclada.updateMatrix();
        raiz.add(mesclada); mesclada.updateMatrixWorld(true);
        const pecas = aceitas.map(item => item.peca);
        for (const peca of pecas) peca.malha.layers.set(CAMADA_DAS_PECAS_MESCLADAS);
        contagemDaMesclagem.lotesCriados++;
        return { mesclada, pecas };
      };
      const desfazerLoteDaMesclagem = function desfazerLoteDaMesclagem(lote) {
        for (const peca of lote.pecas) peca.malha.layers.set(0);
        if (lote.mesclada.parent) lote.mesclada.parent.remove(lote.mesclada);
        lote.mesclada.geometry.dispose();
        contagemDaMesclagem.lotesDesfeitos++;
      };
      const desfazerMesclagemDaRaiz = function desfazerMesclagemDaRaiz(estado) { for (const lote of estado.lotes) desfazerLoteDaMesclagem(lote); estado.lotes = []; };
      // Fim da observação: separa as peças paradas por material e mescla cada lote.
      const concluirObservacaoDaRaiz = function concluirObservacaoDaRaiz(raiz, estadoDaRaiz) {
        raiz.updateMatrixWorld(true);
        const lotes = new Map();
        for (const peca of estadoDaRaiz.pecas) {
          if (peca.cadeia.some(no => nosDinamicosDaMesclagem.has(no))) continue;
          const malha = peca.malha, chave = malha.material.uuid + '|' + malha.castShadow + '|' + malha.receiveShadow + '|' + (malha.geometry.attributes.uv ? 1 : 0);
          if (!lotes.has(chave)) lotes.set(chave, []);
          lotes.get(chave).push(peca);
        }
        estadoDaRaiz.lotes = [];
        for (const pecasDoLote of lotes.values()) {
          if (pecasDoLote.length < 2) continue;
          const lote = mesclarLoteDaRaiz(raiz, pecasDoLote);
          if (lote) estadoDaRaiz.lotes.push(lote);
        }
        // a vigilância passa a olhar só os nós das peças que foram mescladas
        const fotosVigiadas = new Map();
        for (const lote of estadoDaRaiz.lotes) for (const peca of lote.pecas) for (const no of peca.cadeia) fotosVigiadas.set(no, estadoDaRaiz.fotos.get(no));
        estadoDaRaiz.fotos = fotosVigiadas; estadoDaRaiz.pecas = null; estadoDaRaiz.fase = 'mesclada';
      };
      // Uma peça mesclada mudou: as originais voltam a ser desenhadas já neste quadro e a raiz é observada de novo.
      const refazerRaizDaMesclagem = function refazerRaizDaMesclagem(raiz, estadoDaRaiz, porMovimento, conjuntoDeRaizes) {
        desfazerMesclagemDaRaiz(estadoDaRaiz);
        const refeitos = estadoDaRaiz.refeitos + (porMovimento ? 1 : 0);
        if (porMovimento) contagemDaMesclagem.refeitosPorMovimento++; else contagemDaMesclagem.refeitosPorReconstrucao++;
        if (refeitos > MESCLAGEM_VIGIADA.refeitosMaximosPorRaiz) { raizesDesistidasDaMesclagem.add(raiz); raizesDaMesclagem.delete(raiz); contagemDaMesclagem.raizesDesistidas++; return; }
        iniciarObservacaoDaRaiz(raiz, conjuntoDeRaizes, refeitos);
      };
      const atualizarMesclagemVigiada = function atualizarMesclagemVigiada(segundosDesdeUltimoFrame) {
        let conjuntoDeRaizes = null;
        const raizesAtuais = () => conjuntoDeRaizes || (conjuntoDeRaizes = new Set(listarRaizesDaMesclagem()));
        segundosAteBuscarRaizes -= segundosDesdeUltimoFrame;
        const buscar = segundosAteBuscarRaizes <= 0 && !eventoEmAndamento;   // durante as cenas especiais nada novo é observado
        if (buscar) {
          segundosAteBuscarRaizes = MESCLAGEM_VIGIADA.segundosEntreBuscas;
          for (const raiz of raizesAtuais()) {
            if (raizesDesistidasDaMesclagem.has(raiz)) continue;
            const estadoDaRaiz = raizesDaMesclagem.get(raiz);
            if (!estadoDaRaiz) { iniciarObservacaoDaRaiz(raiz, raizesAtuais()); continue; }
            // peças novas numa raiz já mesclada (ex.: algo construído dentro dela): observa de novo
            if (estadoDaRaiz.fase === 'mesclada' && coletarPecasDaRaiz(raiz, raizesAtuais()).filter(peca => !estadoDaRaiz.conhecidas.has(peca.malha)).length >= MESCLAGEM_VIGIADA.malhasMinimasPorRaiz) refazerRaizDaMesclagem(raiz, estadoDaRaiz, false, raizesAtuais());
          }
        }
        for (const [raiz, estadoDaRaiz] of raizesDaMesclagem) {
          if (!raizEstaNaCena(raiz)) { desfazerMesclagemDaRaiz(estadoDaRaiz); raizesDaMesclagem.delete(raiz); continue; }   // raiz descartada
          if (estadoDaRaiz.fase === 'observando') {
            for (const [no, foto] of estadoDaRaiz.fotos) if (!nosDinamicosDaMesclagem.has(no) && noDaMesclagemMudou(no, foto)) { nosDinamicosDaMesclagem.add(no); if (!no.isMesh && no.children.length && no.parent === foto.pai) raizesDerivadasDaMesclagem.add(no); }
            estadoDaRaiz.segundos += segundosDesdeUltimoFrame; estadoDaRaiz.quadros++;
            if (estadoDaRaiz.segundos >= MESCLAGEM_VIGIADA.segundosDeObservacao && estadoDaRaiz.quadros >= MESCLAGEM_VIGIADA.quadrosMinimosDeObservacao && !eventoEmAndamento) concluirObservacaoDaRaiz(raiz, estadoDaRaiz);
            continue;
          }
          let saiuDoGrupo = false, mexeu = false;
          for (const [no, foto] of estadoDaRaiz.fotos) {
            if (!noDaMesclagemMudou(no, foto)) continue;
            if (no.parent !== foto.pai) { saiuDoGrupo = true; } else { nosDinamicosDaMesclagem.add(no); mexeu = true; if (!no.isMesh && no.children.length) raizesDerivadasDaMesclagem.add(no); }
          }
          if (mexeu || saiuDoGrupo) refazerRaizDaMesclagem(raiz, estadoDaRaiz, mexeu, raizesAtuais());
        }
      };
      const estatisticasDaMesclagem = function estatisticasDaMesclagem() {
        let raizesMescladas = 0, observando = 0, lotes = 0, pecas = 0;
        for (const estadoDaRaiz of raizesDaMesclagem.values()) { if (estadoDaRaiz.fase === 'mesclada') raizesMescladas++; else observando++; lotes += estadoDaRaiz.lotes.length; for (const lote of estadoDaRaiz.lotes) pecas += lote.pecas.length; }
        return { raizesMescladas, observando, lotes, pecasMescladas: pecas, chamadasEconomizadas: pecas - lotes, ...contagemDaMesclagem };
      };

      // ====================================================================================================
      // QUALIDADE AUTOMÁTICA (só quando o jogador escolheu "Automática")
      // Mede o intervalo real entre quadros (performance.now, sem o limite de 0,05 s do loop) em janelas de 5 s e decide com
      // calma: baixa um nível depois de 2 janelas seguidas ruins e sobe um nível depois de 6 janelas seguidas boas (30 s).
      // Proteções contra oscilação: no mínimo 12 s entre trocas, no máximo 6 trocas por sessão, janelas ignoradas logo depois
      // de abrir o jogo, de uma troca (os materiais recompilam), durante as cenas especiais e com a aba em segundo plano; e um
      // "teto": depois de cair de um nível, o Automático não tenta voltar a ele (salvo no navegador; escolher "Automática" de
      // novo no menu libera o teste). No nível baixo, antes de desistir, a resolução interna cai de 100% para 90% (Etapa 0b).
      // ====================================================================================================
      const MONITOR_DE_QUALIDADE = {
        segundosPorJanela: 5,
        fpsParaBaixar: { alto: 40, medio: 28, baixo: 26 },   // FPS mediano abaixo disso = janela ruim
        msParaSubir: 17.5, msP90ParaSubir: 22,               // mediana e 90º percentil do quadro abaixo disso = janela boa (~57+ FPS)
        janelasRuinsParaBaixar: 2, janelasBoasParaSubir: 6,
        segundosEntreTrocas: 12, trocasPorSessao: 6, segundosIgnoradosAposTroca: 6, segundosIgnoradosNaAbertura: 6,
        escalaMinima: 0.9, escalaMaxima: 1, passoDaEscala: 0.1,   // Etapa 0b: abaixo de 90% a imagem fica borrada (medido)
      };
      const monitorDeQualidade = { anterior: 0, inicio: 0, inicioDaJanela: 0, intervalos: [], ruins: 0, boas: 0, trocas: 0, historico: [], historicoDeTrocas: [] };
      const registrarNoMonitor = function registrarNoMonitor(registro) {
        const entrada = { s: Math.round((performance.now() - monitorDeQualidade.inicio) / 1000), ...registro };
        monitorDeQualidade.historico.push(entrada); if (monitorDeQualidade.historico.length > 60) monitorDeQualidade.historico.shift();   // janelas recentes
        if (registro.troca) monitorDeQualidade.historicoDeTrocas.push(entrada);   // trocas: todas as da sessão (no máximo 6)
      };
      const trocarQualidadeAutomaticamente = function trocarQualidadeAutomaticamente(direcao, medida) {
        const agora = performance.now();
        if (monitorDeQualidade.trocas >= MONITOR_DE_QUALIDADE.trocasPorSessao || agora - ultimaTrocaDeQualidadeEm < MONITOR_DE_QUALIDADE.segundosEntreTrocas * 1000) return false;
        const indice = ORDEM_DOS_NIVEIS.indexOf(QUALIDADE_GRAFICA.atual), escala = escalaDaResolucaoAtual();
        let nivel = QUALIDADE_GRAFICA.atual, novaEscala = QUALIDADE_GRAFICA.escalaAutomatica;
        if (direcao < 0) {
          if (nivel === 'baixo') { if (escala - MONITOR_DE_QUALIDADE.passoDaEscala < MONITOR_DE_QUALIDADE.escalaMinima - 1e-6) return false; novaEscala = Math.round((escala - MONITOR_DE_QUALIDADE.passoDaEscala) * 100) / 100; }
          else { nivel = ORDEM_DOS_NIVEIS[indice - 1]; QUALIDADE_GRAFICA.teto = nivel; }
        } else {
          if (nivel === 'baixo' && novaEscala && novaEscala < MONITOR_DE_QUALIDADE.escalaMaxima - 1e-6) novaEscala = Math.round((novaEscala + MONITOR_DE_QUALIDADE.passoDaEscala) * 100) / 100;
          else { const proximo = ORDEM_DOS_NIVEIS[indice + 1]; if (!proximo || ORDEM_DOS_NIVEIS.indexOf(proximo) > ORDEM_DOS_NIVEIS.indexOf(QUALIDADE_GRAFICA.teto)) return false; nivel = proximo; }
        }
        QUALIDADE_GRAFICA.escalaAutomatica = novaEscala; QUALIDADE_GRAFICA.detectado = nivel; monitorDeQualidade.trocas++;
        const nivelAnterior = QUALIDADE_GRAFICA.atual, escalaAnterior = Math.round(escala * 100);   // (escala = antes da troca)
        registrarNoMonitor({ troca: (direcao < 0 ? '↓ ' : '↑ ') + nivelAnterior + ' → ' + nivel + (nivel === 'baixo' ? ' (resolução ' + (nivelAnterior === 'baixo' ? escalaAnterior : 100) + '% → ' + Math.round((novaEscala || MONITOR_DE_QUALIDADE.escalaMaxima) * 100) + '%)' : ''), ...medida });
        aplicarNivelDeQualidade(nivel);
        return true;
      };
      const atualizarQualidadeAutomatica = function atualizarQualidadeAutomatica() {
        const monitor = monitorDeQualidade, agora = performance.now(), intervalo = monitor.anterior ? agora - monitor.anterior : 0;
        monitor.anterior = agora; if (!monitor.inicio) monitor.inicio = agora;
        const recomecarJanela = () => { monitor.inicioDaJanela = agora; monitor.intervalos.length = 0; };
        if (QUALIDADE_GRAFICA.escolha !== 'auto' || document.hidden || !intervalo || intervalo > 1000) { recomecarJanela(); return; }
        if (agora - monitor.inicio < MONITOR_DE_QUALIDADE.segundosIgnoradosNaAbertura * 1000 || agora - ultimaTrocaDeQualidadeEm < MONITOR_DE_QUALIDADE.segundosIgnoradosAposTroca * 1000 || eventoEmAndamento) { recomecarJanela(); return; }
        if (!monitor.inicioDaJanela) monitor.inicioDaJanela = agora;
        monitor.intervalos.push(intervalo);
        if (agora - monitor.inicioDaJanela < MONITOR_DE_QUALIDADE.segundosPorJanela * 1000 || monitor.intervalos.length < 5) return;
        const ordenados = monitor.intervalos.slice().sort((a, b) => a - b);
        const mediana = ordenados[Math.floor(ordenados.length / 2)], p90 = ordenados[Math.floor(ordenados.length * 0.9)];
        const medida = { nivel: QUALIDADE_GRAFICA.atual, fpsMediano: Math.round(10000 / mediana) / 10, msP90: Math.round(p90 * 10) / 10 };
        recomecarJanela();
        if (1000 / mediana < MONITOR_DE_QUALIDADE.fpsParaBaixar[QUALIDADE_GRAFICA.atual]) { monitor.ruins++; monitor.boas = 0; }
        else if (mediana <= MONITOR_DE_QUALIDADE.msParaSubir && p90 <= MONITOR_DE_QUALIDADE.msP90ParaSubir) { monitor.boas++; monitor.ruins = 0; }
        else { monitor.ruins = 0; monitor.boas = 0; }
        registrarNoMonitor({ janela: monitor.ruins ? 'ruim' : monitor.boas ? 'boa' : 'ok', ...medida });
        if (monitor.ruins >= MONITOR_DE_QUALIDADE.janelasRuinsParaBaixar) { if (trocarQualidadeAutomaticamente(-1, medida)) monitor.ruins = 0; }
        else if (monitor.boas >= MONITOR_DE_QUALIDADE.janelasBoasParaSubir) { if (trocarQualidadeAutomaticamente(1, medida)) monitor.boas = 0; }
      };

      // Chamada pelo loop (seção 31) uma vez por quadro, logo antes do desenho.
      const atualizarDesempenho = function atualizarDesempenho(segundosDesdeUltimoFrame) {
        atualizarMesclagemVigiada(segundosDesdeUltimoFrame);
        atualizarQualidadeAutomatica();
        atualizarVisibilidadeDasLuzesDaNoite(false);   // Etapa 0b (seção 21): luzes reais só à noite (só age quando algo muda)
        registrarQuadroNaInterface();                  // Etapa 0b (seção 21): FPS do selo do seletor (DOM só com o menu aberto, 1×/s)
      };
      // Para testes e diagnóstico (console): situação da qualidade, da mesclagem e do monitor.
      window.farmEduDesempenho = {
        situacao: () => ({ escolha: QUALIDADE_GRAFICA.escolha, atual: QUALIDADE_GRAFICA.atual, detectado: QUALIDADE_GRAFICA.detectado, teto: QUALIDADE_GRAFICA.teto,
          escalaDaResolucao: escalaDaResolucaoAtual(), pixelRatio: renderizador.getPixelRatio(), antialias: QUALIDADE_GRAFICA.antialiasNaAbertura, pistasDaAbertura: QUALIDADE_GRAFICA.pistas,
          sombras: renderizador.shadowMap.enabled, mapaDeSombra: luzDoSol.shadow.mapSize.x, mesclagem: estatisticasDaMesclagem(), monitor: monitorDeQualidade.historico.slice(-12), trocas: monitorDeQualidade.historicoDeTrocas.slice() }),
        definirQualidade: escolha => definirEscolhaDeQualidade(escolha),
      };

      arquivoDaMontagemConcluido('30d-desempenho.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
