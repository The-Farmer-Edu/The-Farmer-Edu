      // ====================================================================================================
      // FARMEDU 3D — 15-ceu-e-sol.js (Fase 3B da refatoração: seção 15)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================

      // ====================================================================================================
      // SEÇÃO 15 — CÉU: CÚPULA EM GRADIENTE E SOL
      // Cúpula do céu (gradiente calculado em shader), sol e a função que mantém o céu centrado na câmera.
      // ====================================================================================================
      const uniformesDoCeu = {
        uTopo: { value: new THREE.Color(0x4d9de6) }, uHorizonte: { value: new THREE.Color(0x9fd8f5) }, uBrilho: { value: new THREE.Color(0xffa060) },
        uForcaDoBrilho: { value: 0 }, uDirecaoDoSol: { value: new THREE.Vector3(0, 1, 0) },
      };
      // Gradiente do céu calculado na GPU: as cores vêm do ciclo de dia e noite (uniformes), sem recriar nada a cada quadro.
      const domo = new THREE.Mesh(new THREE.SphereGeometry(300, 24, 14), new THREE.ShaderMaterial({
        uniforms: uniformesDoCeu, side: THREE.BackSide, depthWrite: false, fog: false,
        vertexShader: `varying vec3 vDir;
          void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform vec3 uTopo; uniform vec3 uHorizonte; uniform vec3 uBrilho; uniform float uForcaDoBrilho; uniform vec3 uDirecaoDoSol;
          varying vec3 vDir;
          void main() {
            float h = clamp(vDir.y, 0.0, 1.0);
            vec3 cor = mix(uHorizonte, uTopo, pow(h, 0.7));
            float perto = max(dot(normalize(vDir), uDirecaoDoSol), 0.0);
            float halo = pow(perto, 5.0) * (1.0 - h * 0.7) + pow(perto, 40.0) * 0.4;
            cor += uBrilho * halo * uForcaDoBrilho;
            gl_FragColor = vec4(cor, 1.0);
          }`,
      }));
      domo.renderOrder = -3; domo.frustumCulled = false; cena.add(domo);
      // Desenha a textura do sol (disco com brilho ou somente os raios) num canvas.
      const criarTexturaDoSol = function criarTexturaDoSol(somenteRaios) {
        const canvasDaImagem = document.createElement('canvas'); canvasDaImagem.width = canvasDaImagem.height = 512;
        const contexto2d = canvasDaImagem.getContext('2d'), metadeDoCanvas = 256;
        if (somenteRaios) { // 12 raios triangulares, longos e curtos alternados, com degradê para a ponta
          for (let indice = 0; indice < 12; indice++) {
            contexto2d.save(); contexto2d.translate(metadeDoCanvas, metadeDoCanvas); contexto2d.rotate(indice * Math.PI / 6);
            const gradiente = contexto2d.createLinearGradient(88, 0, 240, 0); gradiente.addColorStop(0, 'rgba(255,214,90,0.95)'); gradiente.addColorStop(1, 'rgba(255,170,60,0)');
            contexto2d.fillStyle = gradiente; contexto2d.beginPath(); contexto2d.moveTo(88, -17); contexto2d.lineTo(indice % 2 ? 190 : 240, 0); contexto2d.lineTo(88, 17); contexto2d.closePath(); contexto2d.fill(); contexto2d.restore();
          }
        } else {       // halo suave + disco com degradê e contorno fino
          let gradiente = contexto2d.createRadialGradient(metadeDoCanvas, metadeDoCanvas, 60, metadeDoCanvas, metadeDoCanvas, 256); gradiente.addColorStop(0, 'rgba(255,244,200,0.5)'); gradiente.addColorStop(0.5, 'rgba(255,224,140,0.16)'); gradiente.addColorStop(1, 'rgba(255,224,140,0)');
          contexto2d.fillStyle = gradiente; contexto2d.fillRect(0, 0, 512, 512);
          gradiente = contexto2d.createRadialGradient(metadeDoCanvas - 18, metadeDoCanvas - 18, 6, metadeDoCanvas, metadeDoCanvas, 84); gradiente.addColorStop(0, '#fffbe0'); gradiente.addColorStop(0.5, '#ffe27a'); gradiente.addColorStop(1, '#ffb43a');
          contexto2d.fillStyle = gradiente; contexto2d.beginPath(); contexto2d.arc(metadeDoCanvas, metadeDoCanvas, 82, 0, Math.PI * 2); contexto2d.fill();
          contexto2d.strokeStyle = 'rgba(255,160,40,0.8)'; contexto2d.lineWidth = 5; contexto2d.stroke();
        }
        return new THREE.CanvasTexture(canvasDaImagem);
      };
      // Material translúcido do sol/raios: sempre visível, sem profundidade e sem neblina.
      const materialDoSol = textura => new THREE.MeshBasicMaterial({ map: textura, transparent: true, depthWrite: false, fog: false });
      const raiosDoSol = new THREE.Mesh(new THREE.PlaneGeometry(95, 95), materialDoSol(criarTexturaDoSol(true)));
      const discoDoSol = new THREE.Mesh(new THREE.PlaneGeometry(95, 95), materialDoSol(criarTexturaDoSol(false)));
      raiosDoSol.renderOrder = -2; discoDoSol.renderOrder = -1; raiosDoSol.frustumCulled = discoDoSol.frustumCulled = false;
      cena.add(raiosDoSol); cena.add(discoDoSol);
      const DIRECAO_DO_SOL = [0.124, 0.407, -0.905]; // ~24° acima do horizonte, à direita da vista inicial
      const direcaoDoSol = new THREE.Vector3(DIRECAO_DO_SOL[0], DIRECAO_DO_SOL[1], DIRECAO_DO_SOL[2]), direcaoDaLua = new THREE.Vector3(0, 1, 0);
      // Mantém céu, estrelas, sol e lua centrados na câmera (parecem infinitamente distantes) e orienta os
      // planos de sol e lua para a câmera.
      const atualizarCeu = function atualizarCeu(tempo) {
        const posicaoDaCamera = camera.position;
        domo.position.copy(posicaoDaCamera); estrelasDoCeu.position.copy(posicaoDaCamera);
        uniformesDasEstrelas.uTempo.value = tempo;
        for (const planoDoSol of [raiosDoSol, discoDoSol]) { planoDoSol.position.copy(posicaoDaCamera).addScaledVector(direcaoDoSol, 250); planoDoSol.lookAt(posicaoDaCamera); }
        raiosDoSol.rotateZ(tempo * 0.04); // raios giram devagar
        luaDoCeu.position.copy(posicaoDaCamera).addScaledVector(direcaoDaLua, 250); luaDoCeu.lookAt(posicaoDaCamera);
      };

      arquivoDaMontagemConcluido('15-ceu-e-sol.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
