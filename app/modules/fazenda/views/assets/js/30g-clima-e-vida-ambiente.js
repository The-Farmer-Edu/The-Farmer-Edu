      // ====================================================================================================
      // FARMEDU 3D — 30g-clima-e-vida-ambiente.js (Etapa 4: SEÇÃO 30g)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. As funções de nível
      // superior são escritas como "const nome = function nome(...) {...};" e ficam no escopo global compartilhado da fazenda.
      // ====================================================================================================
      // ====================================================================================================
      // SEÇÃO 30g — CLIMA DINÂMICO E VIDA AMBIENTE (somente visual)
      // • Clima: ensolarado, nublado e chuvoso, com transição gradual (~30 s). À noite, o mesmo clima ganha a atmosfera noturna
      //   (vaga-lumes quando o céu está limpo e a qualidade permite). NÃO mexe em crescimento, produção, XP, custos, limites ou
      //   construções: só em cores, luz, neblina e efeitos.
      // • Relógio: não há relógio próprio. O clima segue o relógio do ciclo de dia e noite (seção 17): muda no máximo a cada
      //   12 horas de jogo (5 min reais) e costuma durar mais (cadeia com chance de continuar igual). Com o ciclo pausado ou num
      //   horário fixo, o clima também fica parado.
      // • Vida ambiente: borboletas perto das plantações, pássaros no céu, vaga-lumes à noite e partículas de vento.
      // DESEMPENHO (Etapa 0 como referência):
      // • Cada efeito é UMA chamada de desenho: chuva (linhas), vaga-lumes e vento (pontos), borboletas e pássaros (geometria
      //   instanciada). Todo o movimento é calculado na placa de vídeo a partir de um único uniforme de tempo compartilhado;
      //   por quadro, o processador só atualiza alguns números (nenhum objeto, geometria ou material é criado durante o jogo).
      // • Limites rígidos por qualidade (AMBIENTE_POR_QUALIDADE); os buffers são criados uma vez com o máximo e a qualidade só
      //   muda quantos são desenhados. Sem sombras, sem pós-processamento; transparência só na chuva, nos vaga-lumes e no vento.
      // • Efeitos que não fazem sentido no momento ficam invisíveis (não são desenhados): chuva só chovendo, vaga-lumes só à noite,
      //   borboletas e pássaros só de dia. Borboletas também somem com a câmera longe e saem da tela pelo corte do Three.js
      //   (esfera de contorno ajustada à área onde voam).
      // • Aba escondida: o requestAnimationFrame para e nada disto roda; ao voltar, continua de onde estava (nada é recriado).
      // • Os objetos não recebem cliques (os raios da seção 23 só testam objetos específicos) e não entram na mesclagem (11f/30d).
      // ====================================================================================================
      const AMBIENTE_POR_QUALIDADE = {   // máximo de elementos simultâneos (limite rígido) — ver docs/DESEMPENHO-DA-FAZENDA.md
        baixo: { gotas: 120, vagalumes: 0, vento: 0, borboletas: 4, passaros: 3 },     // gotas: medido, a chuva é o efeito mais caro (linhas transparentes)
        medio: { gotas: 360, vagalumes: 24, vento: 18, borboletas: 10, passaros: 6 },
        alto: { gotas: 700, vagalumes: 48, vento: 36, borboletas: 16, passaros: 10 },
      };
      const MAXIMO_DO_AMBIENTE = AMBIENTE_POR_QUALIDADE.alto;
      const CONDICOES_DO_CLIMA = {
        ensolarado: { nome: 'Ensolarado', icone: '☀️', noite: 'Noite estrelada', iconeDaNoite: '🌙', nublado: 0, chuva: 0 },
        nublado: { nome: 'Nublado', icone: '☁️', noite: 'Noite nublada', iconeDaNoite: '☁️', nublado: 1, chuva: 0 },
        chuvoso: { nome: 'Chuvoso', icone: '🌧️', noite: 'Noite chuvosa', iconeDaNoite: '🌧️', nublado: 1, chuva: 1 },
      };
      // Chance da próxima condição a cada período de 12 h de jogo (5 min reais). Cada clima dura no mínimo um período e costuma
      // continuar (simulação de 600 períodos no relatório da Etapa 4); a chuva é a mais rara e não se estende por muito tempo.
      const PROXIMO_CLIMA = {
        ensolarado: [['ensolarado', 0.6], ['nublado', 0.3], ['chuvoso', 0.1]],
        nublado: [['ensolarado', 0.4], ['nublado', 0.4], ['chuvoso', 0.2]],
        chuvoso: [['nublado', 0.55], ['ensolarado', 0.25], ['chuvoso', 0.2]],
      };
      const HORAS_POR_PERIODO_DO_CLIMA = 12, SEGUNDOS_DA_TRANSICAO_DO_CLIMA = 30;
      const CLIMA = {
        condicao: 'ensolarado', forcada: null,        // forcada: só pelo Modo desenvolvedor e pelos testes
        periodo: null, nublado: 0, chuva: 0,          // pesos atuais (0–1), que andam devagar até o alvo
        transicoes: 0,
      };
      const horaContinuaDoJogo = () => CICLO_DE_DIA_E_NOITE.dias * 24 + CICLO_DE_DIA_E_NOITE.hora;
      const sortearProximoClima = function sortearProximoClima(atual) {
        let sorteio = Math.random();
        for (const [condicao, chance] of PROXIMO_CLIMA[atual]) { if ((sorteio -= chance) <= 0) return condicao; }
        return atual;
      };
      // Chamado por quadro, mas só faz algo quando o período de 12 h do relógio do jogo muda (comparação de um número inteiro).
      const conferirPeriodoDoClima = function conferirPeriodoDoClima() {
        const periodo = Math.floor((horaContinuaDoJogo() - 2) / HORAS_POR_PERIODO_DO_CLIMA);
        if (CLIMA.periodo === null) { CLIMA.periodo = periodo; return; }   // a sessão começa com céu limpo (o relógio também recomeça às 08:30)
        if (periodo === CLIMA.periodo) return;
        CLIMA.periodo = periodo;
        const nova = sortearProximoClima(CLIMA.condicao);
        if (nova !== CLIMA.condicao) { CLIMA.condicao = nova; CLIMA.transicoes++; }
      };
      const condicaoDoClima = () => CLIMA.forcada || CLIMA.condicao;

      // ---- ajuste do céu (chamado pela seção 17 logo depois de amostrar os quadros do céu; nada é alocado) ----
      const cinzaTemporario = new THREE.Color();
      const acinzentar = (cor, quanto, escurecer) => {
        const luminancia = cor.r * 0.3 + cor.g * 0.59 + cor.b * 0.11;
        cinzaTemporario.setRGB(luminancia * 0.96 * escurecer, luminancia * 0.99 * escurecer, luminancia * 1.05 * escurecer);
        cor.lerp(cinzaTemporario, quanto);
      };
      ajustarCeuPeloClima = function ajustarCeuPeloClimaAtual(ceu) {
        const cobertura = Math.max(CLIMA.nublado, CLIMA.chuva), chuva = CLIMA.chuva;
        if (cobertura < 0.002) { EFEITO_DO_CLIMA_NO_CEU.luzDoSol = 1; EFEITO_DO_CLIMA_NO_CEU.discoDoSol = 1; cena.fog.near = 110; cena.fog.far = 260; return; }
        acinzentar(ceu.topo, 0.62 * cobertura, 1 - 0.12 * chuva); acinzentar(ceu.hor, 0.55 * cobertura, 1 - 0.1 * chuva);
        acinzentar(ceu.hemiCeu, 0.35 * cobertura, 1); acinzentar(ceu.sol, 0.3 * cobertura, 1);
        acinzentar(ceu.nuvem, 0.55 * cobertura, 0.86 - 0.16 * chuva);
        ceu.forca *= 1 - 0.85 * cobertura;
        ceu.hemiInt *= 1 - 0.08 * cobertura - 0.07 * chuva;            // sem escurecer demais: a fazenda continua legível
        ceu.estrelas *= 1 - 0.9 * cobertura;
        ceu.opacidadeDasNuvens = ceu.opacidadeDasNuvens + (1 - ceu.opacidadeDasNuvens) * 0.7 * cobertura;
        EFEITO_DO_CLIMA_NO_CEU.luzDoSol = 1 - 0.32 * cobertura - 0.13 * chuva;   // luz direta mais fraca = sombras mais suaves
        EFEITO_DO_CLIMA_NO_CEU.discoDoSol = 1 - 0.9 * cobertura;
        cena.fog.near = 110 - 20 * cobertura - 40 * chuva; cena.fog.far = 260 - 40 * cobertura - 70 * chuva;
      };

      // ---- recursos compartilhados ----
      const grupoDoAmbiente = new THREE.Group();
      grupoDoAmbiente.name = 'clima-e-vida-ambiente'; grupoDoAmbiente.userData.naoMesclar = true; grupoDoAmbiente.userData.animado = true;
      cena.add(grupoDoAmbiente);
      const tempoDoAmbiente = { value: 0 };                 // um só uniforme de tempo para todos os efeitos
      const sortearDoAmbiente = criarGeradorDeNumerosAleatorios(4040);
      const naoClicavel = objeto => { objeto.raycast = () => { }; return objeto; };
      const CABECALHO_DO_FRAGMENTO_REDONDO = `varying float vAlfa; varying vec3 vCor;
        void main() { vec2 centro = gl_PointCoord - 0.5; float d = dot(centro, centro); if (d > 0.25) discard;
          gl_FragColor = vec4(vCor, vAlfa * (1.0 - d * 4.0)); }`;

      // ---- chuva: segmentos de linha numa caixa que acompanha o alvo da câmera, presos ao mundo (não "andam" com a câmera) ----
      const chuva = (() => {
        const total = MAXIMO_DO_AMBIENTE.gotas, dados = new Float32Array(total * 2 * 4), posicoes = new Float32Array(total * 2 * 3);
        for (let indice = 0; indice < total; indice++) {
          const x = sortearDoAmbiente(), z = sortearDoAmbiente(), fase = sortearDoAmbiente();
          dados.set([x, z, fase, 0], indice * 8); dados.set([x, z, fase, 1], indice * 8 + 4);
        }
        const geometria = new THREE.BufferGeometry();
        geometria.setAttribute('position', new THREE.BufferAttribute(posicoes, 3)); geometria.setAttribute('aGota', new THREE.BufferAttribute(dados, 4));
        const uniformes = { uTempo: tempoDoAmbiente, uCentro: { value: new THREE.Vector3() }, uMeiaLargura: { value: 30 }, uIntensidade: { value: 0 }, uCor: { value: new THREE.Color(0xc9d6e6) } };
        const material = new THREE.ShaderMaterial({
          uniforms: uniformes, transparent: true, depthWrite: false, fog: false,
          vertexShader: `attribute vec4 aGota; uniform float uTempo, uMeiaLargura, uIntensidade; uniform vec3 uCentro; varying float vAlfa;
            void main() {
              float largura = uMeiaLargura * 2.0, altura = 24.0;
              float queda = fract(aGota.z + uTempo * 18.0 / altura);
              vec2 inicio = uCentro.xz - uMeiaLargura;
              vec2 xz = inicio + mod(aGota.xy * largura - inicio, largura);
              vec3 p = vec3(xz.x, uCentro.y - 1.0 + (1.0 - queda) * altura, xz.y);
              p += vec3(0.08, 1.0, 0.03) * 0.75 * aGota.w;                                   // a outra ponta do risco (levemente inclinado pelo vento)
              vec2 relativo = (xz - uCentro.xz) / uMeiaLargura;
              float borda = 1.0 - smoothstep(0.6, 1.0, length(relativo));                    // some perto da borda da caixa (sem "parede" de chuva)
              vAlfa = 0.42 * borda * (0.55 + 0.45 * uIntensidade) * smoothstep(0.0, 0.06, queda);   // quantas gotas: pelo intervalo de desenho (seção abaixo)
              gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
            }`,
          fragmentShader: `uniform vec3 uCor; varying float vAlfa; void main() { if (vAlfa < 0.01) discard; gl_FragColor = vec4(uCor, vAlfa); }`,
        });
        const linhas = naoClicavel(new THREE.LineSegments(geometria, material));
        linhas.frustumCulled = false; linhas.renderOrder = 7; linhas.visible = true;   // visível só até a compilação da seção 33
        grupoDoAmbiente.add(linhas);
        return { objeto: linhas, uniformes, geometria };
      })();

      // ---- pontos animados na placa de vídeo (vaga-lumes e vento) ----
      const criarPontosDoAmbiente = function criarPontosDoAmbiente(total, criarPonto, vertexShader) {
        const posicoes = new Float32Array(total * 3), parametros = new Float32Array(total * 4);
        for (let indice = 0; indice < total; indice++) { const [x, y, z, a, b, c, d] = criarPonto(indice); posicoes.set([x, y, z], indice * 3); parametros.set([a, b, c, d], indice * 4); }
        const geometria = new THREE.BufferGeometry();
        geometria.setAttribute('position', new THREE.BufferAttribute(posicoes, 3)); geometria.setAttribute('aParametros', new THREE.BufferAttribute(parametros, 4));
        const uniformes = { uTempo: tempoDoAmbiente, uOpacidade: { value: 0 }, uEscala: { value: 1 }, uCentro: { value: new THREE.Vector3() } };
        const material = new THREE.ShaderMaterial({ uniforms: uniformes, vertexShader, fragmentShader: CABECALHO_DO_FRAGMENTO_REDONDO, transparent: true, depthWrite: false, fog: false });
        const pontos = naoClicavel(new THREE.Points(geometria, material));
        pontos.renderOrder = 7; grupoDoAmbiente.add(pontos);
        return { objeto: pontos, uniformes, geometria };
      };
      // Vaga-lumes: em volta das plantações, do curral, da praça e da beira da floresta; pairam e piscam devagar.
      const LUGARES_DOS_VAGALUMES = [[43, 12, 9], [43, 32, 8], [7, 14, 10], [0, 39.5, 12], [-14, 18, 9], [24, 26, 9], [30, -2, 8]];
      const vagalumes = criarPontosDoAmbiente(MAXIMO_DO_AMBIENTE.vagalumes, indice => {
        const [x, z, raio] = LUGARES_DOS_VAGALUMES[indice % LUGARES_DOS_VAGALUMES.length], angulo = sortearDoAmbiente() * Math.PI * 2, distancia = Math.sqrt(sortearDoAmbiente()) * raio;
        return [x + Math.cos(angulo) * distancia, 0.6 + sortearDoAmbiente() * 1.6, z + Math.sin(angulo) * distancia, sortearDoAmbiente() * 6.28, 0.6 + sortearDoAmbiente() * 0.8, 0, 0];
      }, `attribute vec4 aParametros; uniform float uTempo, uOpacidade, uEscala; varying float vAlfa; varying vec3 vCor;
        void main() {
          float f = aParametros.x, v = aParametros.y, t = uTempo * v;
          vec3 p = position + vec3(sin(t * 0.5 + f) * 1.3, sin(t * 0.9 + f * 2.0) * 0.35, cos(t * 0.4 + f) * 1.3);
          float piscar = smoothstep(0.15, 1.0, sin(uTempo * 1.6 * v + f * 5.0) * 0.5 + 0.5);
          vAlfa = uOpacidade * (0.15 + 0.85 * piscar); vCor = vec3(1.0, 0.93, 0.45);
          vec4 posicaoNaCamera = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = clamp(uEscala * 7.0 * (60.0 / -posicaoNaCamera.z), 2.5, 11.0);
          gl_Position = projectionMatrix * posicaoNaCamera;
        }`);
      vagalumes.objeto.material.blending = THREE.AdditiveBlending;
      vagalumes.geometria.computeBoundingSphere(); vagalumes.geometria.boundingSphere.radius += 2;   // o corte do Three.js usa esta esfera
      // Vento: pólen e fiapos claros numa caixa em volta do alvo da câmera, levados devagar pelo vento.
      const vento = criarPontosDoAmbiente(MAXIMO_DO_AMBIENTE.vento, () => [sortearDoAmbiente(), sortearDoAmbiente(), sortearDoAmbiente(), sortearDoAmbiente() * 6.28, 0.7 + sortearDoAmbiente() * 0.6, 0, 0],
        `attribute vec4 aParametros; uniform float uTempo, uOpacidade, uEscala; uniform vec3 uCentro; varying float vAlfa; varying vec3 vCor;
        void main() {
          float largura = 44.0, f = aParametros.x, v = aParametros.y;
          vec2 inicio = uCentro.xz - largura * 0.5;
          vec2 xz = inicio + mod(position.xz * largura + vec2(uTempo * 1.6 * v, uTempo * 0.5 * v) - inicio, largura);
          float y = uCentro.y + 0.5 + position.y * 5.0 + sin(uTempo * 0.8 * v + f) * 0.6;
          vec2 relativo = (xz - uCentro.xz) / (largura * 0.5);
          vAlfa = uOpacidade * 0.55 * (1.0 - smoothstep(0.55, 1.0, length(relativo))); vCor = vec3(1.0, 0.98, 0.88);
          vec4 posicaoNaCamera = modelViewMatrix * vec4(xz.x, y, xz.y, 1.0);
          gl_PointSize = clamp(uEscala * 3.0 * (50.0 / -posicaoNaCamera.z), 1.5, 5.0);
          gl_Position = projectionMatrix * posicaoNaCamera;
        }`);
      vento.objeto.frustumCulled = false;   // a caixa acompanha a câmera: está sempre na área visível

      // ---- borboletas e pássaros: UMA malha instanciada cada; as asas batem no vertex shader ----
      const criarBandoInstanciado = function criarBandoInstanciado({ total, verticesDaAsa, criarInstancia, trajetoria, tamanho, cor }) {
        const geometria = new THREE.InstancedBufferGeometry();
        geometria.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verticesDaAsa), 3));
        const centros = new Float32Array(total * 3), parametros = new Float32Array(total * 4), cores = new Float32Array(total * 3);
        for (let indice = 0; indice < total; indice++) { const instancia = criarInstancia(indice); centros.set(instancia.centro, indice * 3); parametros.set(instancia.parametros, indice * 4); cores.set(instancia.cor, indice * 3); }
        geometria.setAttribute('aCentro', new THREE.InstancedBufferAttribute(centros, 3)); geometria.setAttribute('aParametros', new THREE.InstancedBufferAttribute(parametros, 4));
        geometria.setAttribute('aCor', new THREE.InstancedBufferAttribute(cores, 3));
        geometria.instanceCount = total;
        const uniformes = { uTempo: tempoDoAmbiente, uPresenca: { value: 0 }, uLuz: { value: 1 } };
        const material = new THREE.ShaderMaterial({
          uniforms: uniformes, side: THREE.DoubleSide, fog: false,
          vertexShader: `attribute vec3 aCentro, aCor; attribute vec4 aParametros; uniform float uTempo, uPresenca, uLuz; varying vec3 vCor;
            void main() {
              vec3 local = position * ${tamanho.toFixed(3)} * uPresenca, velocidade; vec3 centro;
              ${trajetoria}
              float giro = atan(velocidade.x, velocidade.z), c = cos(giro), s = sin(giro);
              vec3 girado = vec3(local.x * c + local.z * s, local.y, -local.x * s + local.z * c);
              vCor = aCor * uLuz;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(centro + girado, 1.0);
            }`,
          fragmentShader: `varying vec3 vCor; void main() { gl_FragColor = vec4(vCor, 1.0); }`,
        });
        const malha = naoClicavel(new THREE.Mesh(geometria, material));
        grupoDoAmbiente.add(malha);
        return { objeto: malha, uniformes, geometria };
      };
      // asa = dois triângulos de cada lado do corpo (x < 0 e x > 0); a batida gira cada lado em volta do eixo do corpo (z)
      const asasDaBorboleta = [];
      for (const lado of [-1, 1]) asasDaBorboleta.push(0, 0, 0.5, lado * 1.0, 0, 0.75, lado * 0.9, 0, -0.05, 0, 0, 0.5, lado * 0.9, 0, -0.05, 0, 0, -0.45, 0, 0, -0.45, lado * 0.9, 0, -0.05, lado * 0.6, 0, -0.75);
      const PLANTACOES_DAS_BORBOLETAS = [[43, 12], [43, 32.3], [0, 39.5]];   // as duas plantações e o jardim da praça
      const CORES_DAS_BORBOLETAS = [0xf2a33a, 0xffffff, 0xf6d84a, 0x7fb6ff, 0xe86fa8];
      const borboletas = criarBandoInstanciado({
        total: MAXIMO_DO_AMBIENTE.borboletas, verticesDaAsa: asasDaBorboleta, tamanho: 0.14,
        criarInstancia: indice => {
          const [x, z] = PLANTACOES_DAS_BORBOLETAS[indice % PLANTACOES_DAS_BORBOLETAS.length], cor = new THREE.Color(CORES_DAS_BORBOLETAS[indice % CORES_DAS_BORBOLETAS.length]);
          return { centro: [x + (sortearDoAmbiente() - 0.5) * 8, 0.9 + sortearDoAmbiente() * 0.5, z + (sortearDoAmbiente() - 0.5) * 8], parametros: [sortearDoAmbiente() * 6.28, 0.7 + sortearDoAmbiente() * 0.6, 2 + sortearDoAmbiente() * 3, 0], cor: [cor.r, cor.g, cor.b] };
        },
        trajetoria: `float f = aParametros.x, v = aParametros.y, r = aParametros.z, t = uTempo * v;
          centro = aCentro + vec3(sin(t * 0.37 + f) * r, 0.35 * sin(t * 1.3 + f * 3.0), sin(t * 0.29 + f * 1.7) * r * 0.7);
          velocidade = vec3(0.37 * cos(t * 0.37 + f) * r, 0.0, 0.29 * cos(t * 0.29 + f * 1.7) * r * 0.7) + vec3(0.0001);
          float batida = 0.15 + 0.95 * abs(sin(uTempo * 11.0 * v + f));
          local = vec3(local.x * cos(batida), abs(local.x) * sin(batida), local.z);`,
      });
      borboletas.geometria.boundingSphere = new THREE.Sphere(new THREE.Vector3(28, 1, 28), 32);   // corte: só desenha com essa região na tela
      // pássaros: silhueta em "V" com corpo curto; voam em círculos largos sobre a fazenda, alternando batidas e planeio
      const asasDoPassaro = [];
      for (const lado of [-1, 1]) asasDoPassaro.push(0, 0, 0.35, lado * 1.0, 0, -0.1, 0, 0, -0.3, lado * 1.0, 0, -0.1, lado * 1.6, 0, -0.35, lado * 0.9, 0, -0.3);
      asasDoPassaro.push(-0.12, 0, 0.55, 0.12, 0, 0.55, 0, 0, -0.6);
      const passaros = criarBandoInstanciado({
        total: MAXIMO_DO_AMBIENTE.passaros, verticesDaAsa: asasDoPassaro, tamanho: 0.42,
        criarInstancia: () => {
          const sentido = sortearDoAmbiente() < 0.5 ? -1 : 1, cinza = 0.16 + sortearDoAmbiente() * 0.1;
          return { centro: [5 + (sortearDoAmbiente() - 0.5) * 40, 20 + sortearDoAmbiente() * 12, 12 + (sortearDoAmbiente() - 0.5) * 40], parametros: [sortearDoAmbiente() * 6.28, sentido * (0.1 + sortearDoAmbiente() * 0.08), 26 + sortearDoAmbiente() * 34, 0], cor: [cinza, cinza, cinza * 1.1] };
        },
        trajetoria: `float f = aParametros.x, w = aParametros.y, r = aParametros.z, a = uTempo * w + f;
          centro = aCentro + vec3(cos(a) * r, sin(uTempo * 0.21 + f) * 1.5, sin(a) * r);
          velocidade = vec3(-sin(a), 0.0, cos(a)) * sign(w);
          float bate = smoothstep(-0.2, 0.4, sin(uTempo * 0.35 + f * 2.0));                 // fases de batida e de planeio
          float batida = 0.12 + bate * 0.45 * sin(uTempo * 7.0 + f * 3.0);
          local = vec3(local.x * cos(batida), abs(local.x) * sin(batida), local.z);`,
      });
      passaros.objeto.frustumCulled = false;   // voam por todo o céu da fazenda

      // ---- atualização (pelo laço da seção 31, via animacoesDoCenario: nenhum laço novo concorrendo) ----
      const OBJETOS_DO_AMBIENTE = { chuva: chuva.objeto, vagalumes: vagalumes.objeto, vento: vento.objeto, borboletas: borboletas.objeto, passaros: passaros.objeto };
      let nivelAplicadoNoAmbiente = null;
      const limitesDoAmbiente = () => AMBIENTE_POR_QUALIDADE[QUALIDADE_GRAFICA.atual] || AMBIENTE_POR_QUALIDADE.baixo;
      const aplicarLimitesDoAmbiente = function aplicarLimitesDoAmbiente() {   // só quando o nível de qualidade muda
        const limites = limitesDoAmbiente(); nivelAplicadoNoAmbiente = QUALIDADE_GRAFICA.atual;
        chuva.geometria.setDrawRange(0, limites.gotas * 2); vagalumes.geometria.setDrawRange(0, limites.vagalumes); vento.geometria.setDrawRange(0, limites.vento);
        borboletas.geometria.instanceCount = limites.borboletas; passaros.geometria.instanceCount = limites.passaros;
      };
      const seguir = (atual, alvo, passo) => atual < alvo ? Math.min(alvo, atual + passo) : Math.max(alvo, atual - passo);
      const presencaDoAmbiente = { vagalumes: 0, vento: 0, borboletas: 0, passaros: 0 };
      let condicaoMostrada = '', noiteMostrada = null;
      const atualizarClimaEAmbiente = function atualizarClimaEAmbiente(tempo, segundos) {
        if (document.hidden) return;
        if (nivelAplicadoNoAmbiente !== QUALIDADE_GRAFICA.atual) aplicarLimitesDoAmbiente();
        conferirPeriodoDoClima();
        const alvo = CONDICOES_DO_CLIMA[condicaoDoClima()], passo = segundos / SEGUNDOS_DA_TRANSICAO_DO_CLIMA;
        CLIMA.nublado = seguir(CLIMA.nublado, alvo.nublado, passo);
        CLIMA.chuva = seguir(CLIMA.chuva, alvo.chuva, passo * (alvo.chuva > CLIMA.chuva && CLIMA.nublado < 0.6 ? 0.5 : 1));   // a chuva só engrossa depois que o céu fecha
        tempoDoAmbiente.value = tempo;
        const limites = limitesDoAmbiente(), noite = ESTADO_DO_CEU.noite, chovendo = CLIMA.chuva, alvoDaCamera = alvoAtualDaCamera, perto = distanciaDaCamera < 80;
        // chuva
        const intensidade = Math.min(1, Math.max(0, (chovendo - 0.25) / 0.75));
        chuva.objeto.visible = intensidade > 0.01 && limites.gotas > 0;
        if (chuva.objeto.visible) {
          chuva.uniformes.uIntensidade.value = intensidade; chuva.uniformes.uCentro.value.copy(alvoDaCamera); chuva.uniformes.uMeiaLargura.value = Math.min(40, Math.max(14, distanciaDaCamera * 0.55));
          const gotasDesenhadas = Math.ceil(limites.gotas * intensidade / 10) * 10;   // engrossa e afina mudando SÓ quantas gotas são desenhadas (sem descartar na placa)
          if (chuva.geometria.drawRange.count !== gotasDesenhadas * 2) chuva.geometria.setDrawRange(0, gotasDesenhadas * 2);
        }
        // presenças (0–1), sempre com transição suave
        presencaDoAmbiente.vagalumes = seguir(presencaDoAmbiente.vagalumes, noite > 0.6 && chovendo < 0.2 && limites.vagalumes ? 1 : 0, segundos / 6);
        presencaDoAmbiente.vento = seguir(presencaDoAmbiente.vento, noite < 0.5 && chovendo < 0.2 && limites.vento ? 1 : 0, segundos / 6);
        presencaDoAmbiente.borboletas = seguir(presencaDoAmbiente.borboletas, noite < 0.3 && chovendo < 0.3 && perto ? 1 : 0, segundos / 3);
        presencaDoAmbiente.passaros = seguir(presencaDoAmbiente.passaros, noite < 0.45 && chovendo < 0.5 ? 1 : 0, segundos / 5);
        vagalumes.objeto.visible = presencaDoAmbiente.vagalumes > 0.01 && limites.vagalumes > 0; vagalumes.uniformes.uOpacidade.value = presencaDoAmbiente.vagalumes * noite;
        vento.objeto.visible = presencaDoAmbiente.vento > 0.01 && limites.vento > 0;
        if (vento.objeto.visible) { vento.uniformes.uOpacidade.value = presencaDoAmbiente.vento * (1 - 0.5 * CLIMA.nublado); vento.uniformes.uCentro.value.copy(alvoDaCamera); }
        const luz = Math.min(1, ESTADO_DO_CEU.hemiInt / 0.75);
        borboletas.objeto.visible = presencaDoAmbiente.borboletas > 0.01 && limites.borboletas > 0; borboletas.uniformes.uPresenca.value = presencaDoAmbiente.borboletas; borboletas.uniformes.uLuz.value = luz;
        passaros.objeto.visible = presencaDoAmbiente.passaros > 0.01 && limites.passaros > 0; passaros.uniformes.uPresenca.value = presencaDoAmbiente.passaros; passaros.uniformes.uLuz.value = 0.6 + 0.4 * luz;
        // rótulo do painel Tempo: só quando muda (sem tocar no DOM a cada quadro)
        const condicao = condicaoDoClima(), ehNoite = noite > 0.5;
        if (condicao !== condicaoMostrada || ehNoite !== noiteMostrada) { condicaoMostrada = condicao; noiteMostrada = ehNoite; mostrarClimaNoPainel(); }
      };
      animacoesDoCenario.push(atualizarClimaEAmbiente);
      const rotuloDoClima = selecionar('#tempo-clima');
      const textoDoClima = () => { const c = CONDICOES_DO_CLIMA[condicaoDoClima()]; return noiteMostrada ? c.iconeDaNoite + ' ' + c.noite : c.icone + ' ' + c.nome; };
      const mostrarClimaNoPainel = function mostrarClimaNoPainel() {
        if (rotuloDoClima) rotuloDoClima.textContent = textoDoClima();
        for (const botao of botoesDoClima) { const ativo = (botao.dataset.clima === 'auto' && !CLIMA.forcada) || botao.dataset.clima === CLIMA.forcada; botao.classList.toggle('ativo', ativo); botao.setAttribute('aria-pressed', String(ativo)); }
      };
      // botões de teste (só aparecem com o Modo desenvolvedor, junto dos modos do ciclo)
      const botoesDoClima = [...document.querySelectorAll('[data-clima]')];
      const forcarClima = function forcarClima(condicao, imediato = false) {
        CLIMA.forcada = CONDICOES_DO_CLIMA[condicao] ? condicao : null;
        if (imediato) { const alvo = CONDICOES_DO_CLIMA[condicaoDoClima()]; CLIMA.nublado = alvo.nublado; CLIMA.chuva = alvo.chuva; }
        condicaoMostrada = ''; return condicaoDoClima();
      };
      for (const botao of botoesDoClima) botao.addEventListener('click', () => forcarClima(botao.dataset.clima));

      // Os efeitos começam visíveis só para a compilação dos shaders na seção 33 (renderizador.compile percorre o que está visível):
      // assim a primeira chuva ou a primeira noite não travam compilando. O primeiro quadro já aplica a visibilidade certa.
      for (const objeto of Object.values(OBJETOS_DO_AMBIENTE)) objeto.visible = true;

      window.farmEduClima = {
        situacao: () => ({ condicao: condicaoDoClima(), sorteada: CLIMA.condicao, forcada: CLIMA.forcada, nublado: +CLIMA.nublado.toFixed(3), chuva: +CLIMA.chuva.toFixed(3), periodo: CLIMA.periodo, transicoes: CLIMA.transicoes, noite: +ESTADO_DO_CEU.noite.toFixed(2), rotulo: rotuloDoClima ? rotuloDoClima.textContent : null }),
        forcar: forcarClima,
        ambiente: () => {
          const limites = limitesDoAmbiente(), visiveis = {};
          for (const nome in OBJETOS_DO_AMBIENTE) visiveis[nome] = OBJETOS_DO_AMBIENTE[nome].visible;
          return { qualidade: QUALIDADE_GRAFICA.atual, limites, visiveis, presenca: { ...presencaDoAmbiente }, desenhados: { gotas: chuva.objeto.visible ? chuva.geometria.drawRange.count / 2 : 0, vagalumes: vagalumes.objeto.visible ? limites.vagalumes : 0, vento: vento.objeto.visible ? limites.vento : 0, borboletas: borboletas.objeto.visible ? limites.borboletas : 0, passaros: passaros.objeto.visible ? limites.passaros : 0 } };
        },
      };

      arquivoDaMontagemConcluido('30g-clima-e-vida-ambiente.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
