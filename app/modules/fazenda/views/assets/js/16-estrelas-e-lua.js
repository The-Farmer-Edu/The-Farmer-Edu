      // ====================================================================================================
      // FARMEDU 3D — 16-estrelas-e-lua.js (Fase 3B da refatoração: seção 16)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================
      // ====================================================================================================
      // SEÇÃO 16 — ESTRELAS E LUA
      // Estrelas (pontos que brilham de leve) e lua (plano com shader de fase e crateras); criadas uma única vez e só atualizadas.
      // ====================================================================================================
      const uniformesDasEstrelas = { uTempo: { value: 0 }, uOpacidade: { value: 0 }, uPixel: { value: renderizador.getPixelRatio() } };
      const estrelasDoCeu = (() => {
        const quantidadeDeEstrelas = 750, posicao = new Float32Array(quantidadeDeEstrelas * 3), tamanho = new Float32Array(quantidadeDeEstrelas), fase = new Float32Array(quantidadeDeEstrelas), cor = new Float32Array(quantidadeDeEstrelas * 3), sortearEstrela = criarGeradorDeNumerosAleatorios(77);
        const tons = [[1, 1, 1], [0.8, 0.88, 1], [1, 0.93, 0.8]];
        for (let indice = 0; indice < quantidadeDeEstrelas; indice++) {
          const posicaoY = 0.03 + 0.97 * sortearEstrela(), angulo = sortearEstrela() * Math.PI * 2, raioHorizontal = Math.sqrt(1 - posicaoY * posicaoY), raio = 280;   // só no hemisfério visível
          posicao.set([Math.cos(angulo) * raioHorizontal * raio, posicaoY * raio, Math.sin(angulo) * raioHorizontal * raio], indice * 3);
          tamanho[indice] = 1.3 + Math.pow(sortearEstrela(), 4) * 3.2; fase[indice] = sortearEstrela() * 6.28; cor.set(tons[Math.floor(sortearEstrela() * 3)], indice * 3);
        }
        const geometria = new THREE.BufferGeometry();
        geometria.setAttribute('position', new THREE.BufferAttribute(posicao, 3)); geometria.setAttribute('aTam', new THREE.BufferAttribute(tamanho, 1));
        geometria.setAttribute('aFase', new THREE.BufferAttribute(fase, 1)); geometria.setAttribute('aCor', new THREE.BufferAttribute(cor, 3));
        const pontos = new THREE.Points(geometria, new THREE.ShaderMaterial({
          uniforms: uniformesDasEstrelas, transparent: true, depthWrite: false, fog: false,
          vertexShader: `attribute float aTam; attribute float aFase; attribute vec3 aCor; uniform float uTempo; uniform float uPixel; varying float vBrilho; varying vec3 vCor;
            void main() { vCor = aCor; vBrilho = 0.7 + 0.3 * sin(uTempo * 1.7 + aFase); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_PointSize = aTam * uPixel; }`,
          fragmentShader: `uniform float uOpacidade; varying float vBrilho; varying vec3 vCor;
            void main() { float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.05, d); gl_FragColor = vec4(vCor, a * vBrilho * uOpacidade); }`,
        }));
        pontos.renderOrder = -2.6; pontos.frustumCulled = false; pontos.visible = false; cena.add(pontos);
        return pontos;
      })();
      const criarTexturaDaLua = function criarTexturaDaLua() { // maria, crateras e brilho, desenhados em um canvas pequeno (sem imagens externas)
        const canvasDaImagem = document.createElement('canvas'); canvasDaImagem.width = canvasDaImagem.height = 256;
        const contexto2d = canvasDaImagem.getContext('2d'), sortearNumero = criarGeradorDeNumerosAleatorios(31);
        contexto2d.fillStyle = '#e8ebf2'; contexto2d.fillRect(0, 0, 256, 256);
        contexto2d.fillStyle = 'rgba(120,128,150,0.42)';
        for (const [posicaoX, posicaoY, raioX, giroY] of [[88, 96, 40, 30], [150, 80, 26, 34], [128, 150, 34, 24], [176, 144, 24, 30], [96, 168, 20, 16]]) { contexto2d.beginPath(); contexto2d.ellipse(posicaoX, posicaoY, raioX, giroY, sortearNumero() * 3, 0, Math.PI * 2); contexto2d.fill(); }
        for (let indice = 0; indice < 46; indice++) {
          const posicaoX = 20 + sortearNumero() * 216, posicaoY = 20 + sortearNumero() * 216, raioDaCratera = 3 + sortearNumero() * sortearNumero() * 14;
          contexto2d.fillStyle = 'rgba(95,102,125,0.35)'; contexto2d.beginPath(); contexto2d.arc(posicaoX, posicaoY, raioDaCratera, 0, Math.PI * 2); contexto2d.fill();
          contexto2d.strokeStyle = 'rgba(255,255,255,0.5)'; contexto2d.lineWidth = 1.5; contexto2d.beginPath(); contexto2d.arc(posicaoX - raioDaCratera * 0.12, posicaoY - raioDaCratera * 0.12, raioDaCratera, 0, Math.PI * 2); contexto2d.stroke();
        }
        return new THREE.CanvasTexture(canvasDaImagem);
      };
      const uniformesDaLua = { uTextura: { value: criarTexturaDaLua() }, uLuz: { value: new THREE.Vector3(0.6, 0.25, 1) }, uOpacidade: { value: 0 }, uCor: { value: new THREE.Color(0xf4f6ff) } };
      const luaDoCeu = new THREE.Mesh(new THREE.PlaneGeometry(110, 110), new THREE.ShaderMaterial({
        uniforms: uniformesDaLua, transparent: true, depthWrite: false, fog: false,
        vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform sampler2D uTextura; uniform vec3 uLuz; uniform float uOpacidade; uniform vec3 uCor; varying vec2 vUv;
          void main() {
            vec2 p = (vUv - 0.5) / 0.12;                              // coordenadas do disco (raio 1)
            float r = length(p);
            float disco = 1.0 - smoothstep(0.95, 1.0, r);
            float halo = smoothstep(4.1, 1.0, r) * 0.3;
            float z = sqrt(max(0.0, 1.0 - r * r));
            float luz = smoothstep(-0.05, 0.65, dot(vec3(p, z), normalize(uLuz)));   // fase: lado iluminado e lado escuro
            vec3 tex = texture2D(uTextura, clamp(p * 0.5 + 0.5, 0.0, 1.0)).rgb;
            vec3 cor = mix(vec3(0.6, 0.7, 1.0), tex * uCor * (0.13 + 0.87 * luz), disco);
            gl_FragColor = vec4(cor, max(disco, halo) * uOpacidade);
          }`,
      }));
      luaDoCeu.renderOrder = -0.5; luaDoCeu.frustumCulled = false; cena.add(luaDoCeu);
      raiosDoSol.material.userData.ignorarCiclo = discoDoSol.material.userData.ignorarCiclo = true;

      arquivoDaMontagemConcluido('16-estrelas-e-lua.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
