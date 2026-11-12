      // ====================================================================================================
      // FARMEDU 3D — 06-cena-3d.js (Fase 3B da refatoração: seção 06)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================
      // ====================================================================================================
      // SEÇÃO 06 — CENA 3D BÁSICA: RENDERIZADOR, CÂMERA E LUZES PRINCIPAIS
      // Renderizador WebGL, cena, neblina, câmera de perspectiva, luz ambiente (hemisférica) e a luz direcional "luzDoSol", única que projeta sombras (à noite ela vira a luz da lua).
      // ====================================================================================================
      const renderizador = new THREE.WebGLRenderer({ antialias: true });
      const canvas = renderizador.domElement;
      renderizador.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderizador.shadowMap.enabled = true;
      renderizador.shadowMap.autoUpdate = false;   // Mark 8.2: o loop (seção 31) pede a atualização a cada INTERVALO_DE_QUADROS_DA_SOMBRA quadros
      document.body.prepend(canvas);

      const cena = new THREE.Scene();
      cena.background = new THREE.Color(0x9fd8f5);
      cena.fog = new THREE.Fog(0x9fd8f5, 110, 260);
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 400);
      const luzHemisferica = new THREE.HemisphereLight(0xffffff, 0x6a8f4a, 0.75); cena.add(luzHemisferica);
      const luzDoSol = new THREE.DirectionalLight(0xfff2cc, 0.9);
      luzDoSol.position.set(26, 24, 18); luzDoSol.target.position.set(12, 0, 6); cena.add(luzDoSol.target);
      luzDoSol.castShadow = true;
      luzDoSol.shadow.mapSize.set(2048, 2048);
      Object.assign(luzDoSol.shadow.camera, { left: -44, right: 44, top: 44, bottom: -44, near: 1, far: 100 });
      luzDoSol.shadow.bias = -0.0005; luzDoSol.shadow.normalBias = 0.03; // evita listras quando o sol/lua está baixo no horizonte
      cena.add(luzDoSol);

      arquivoDaMontagemConcluido('06-cena-3d.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
