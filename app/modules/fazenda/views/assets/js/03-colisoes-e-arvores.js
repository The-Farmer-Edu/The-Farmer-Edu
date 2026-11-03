      // ====================================================================================================
      // FARMEDU 3D — 03-colisoes-e-arvores.js (Fase 3B da refatoração: seção 03)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================
      // ====================================================================================================
      // SEÇÃO 03 — COLISÕES DO MAPA E REGISTRO DE ÁRVORES
      // Lista única de obstáculos (retângulos e círculos) e lista das árvores plantadas. Árvores, postes, fazendeiros e mobs consultam estas listas.
      // As listas são preenchidas nas seções seguintes (construções, estradas, relevo, postes...).
      // ====================================================================================================
      // Todo obstáculo estático ou fixo do cenário é registrado aqui UMA vez (construções, estradas, relevo, cachoeira, lago,
      // placa, postes, bancos, pedra secreta, praça...). Árvores, postes, fazendeiros e mobs consultam o mesmo registro, em vez de
      // cada sistema repetir suas próprias contas de ocupação.
      // Formatos aceitos: círculos, retângulos alinhados aos eixos, elipses (pavimento da praça) e "formas" livres, que recebem
      // uma função contem(x, z, margem) — usada no jardim ondulado ao redor do lago da praça.
      const COLISOES = {
        circulos: [], retangulos: [], elipses: [], formas: [],
        circulo(tipo, posicaoX, posicaoZ, raio) { this.circulos.push({ tipo, x: posicaoX, z: posicaoZ, r: raio }); },
        retangulo(tipo, posicaoX, posicaoZ, meioX, meioZ) { this.retangulos.push({ tipo, x: posicaoX, z: posicaoZ, meioX, meioZ }); },
        elipse(tipo, posicaoX, posicaoZ, raioX, raioZ) { this.elipses.push({ tipo, x: posicaoX, z: posicaoZ, raioX, raioZ }); },
        forma(tipo, contem) { this.formas.push({ tipo, contem }); },
        // true se um disco de raio 'margem' centrado em (x, z) toca algum obstáculo (exceto os tipos listados em 'ignorar')
        bloqueia(posicaoX, posicaoZ, margem = 0, ignorar = []) {
          for (const circulo of this.circulos) if (Math.hypot(posicaoX - circulo.x, posicaoZ - circulo.z) < circulo.r + margem && !ignorar.includes(circulo.tipo)) return true;
          for (const retangulo of this.retangulos) if (Math.abs(posicaoX - retangulo.x) < retangulo.meioX + margem && Math.abs(posicaoZ - retangulo.z) < retangulo.meioZ + margem && !ignorar.includes(retangulo.tipo)) return true;
          for (const elipse of this.elipses) if (!ignorar.includes(elipse.tipo) && ((posicaoX - elipse.x) / (elipse.raioX + margem)) ** 2 + ((posicaoZ - elipse.z) / (elipse.raioZ + margem)) ** 2 < 1) return true;
          for (const forma of this.formas) if (!ignorar.includes(forma.tipo) && forma.contem(posicaoX, posicaoZ, margem)) return true;
          return false;
        },
        relevo() { return this.circulos.filter(circulo => circulo.tipo === 'relevo'); },
        // rio: usa a curva do rio (definida mais adiante); 'distancia' é a folga mínima do eixo do rio
        rio(posicaoX, posicaoZ, distancia) { return distanciaDoRio(posicaoX, posicaoZ) < distancia; },
      };
      // Registro das árvores já plantadas (grade espacial): garante distância mínima proporcional ao tamanho das copas.
      const REGISTRO_DE_ARVORES = {
        celula: 2.4, grade: new Map(), lista: [],
        chave(celulaX, celulaZ) { return (celulaX + 1000) * 4096 + (celulaZ + 1000); },
        adicionar(posicaoX, posicaoZ, escala) {
          const chaveDaCelula = this.chave(Math.floor(posicaoX / this.celula), Math.floor(posicaoZ / this.celula));
          if (!this.grade.has(chaveDaCelula)) this.grade.set(chaveDaCelula, []);
          this.grade.get(chaveDaCelula).push([posicaoX, posicaoZ, escala]); this.lista.push([posicaoX, posicaoZ, escala]);
        },
        vizinhas(posicaoX, posicaoZ) {
          const celulaX = Math.floor(posicaoX / this.celula), celulaZ = Math.floor(posicaoZ / this.celula), arvoresVizinhas = [];
          for (let diferencaX = -1; diferencaX <= 1; diferencaX++) for (let diferencaZ = -1; diferencaZ <= 1; diferencaZ++) arvoresVizinhas.push(...(this.grade.get(this.chave(celulaX + diferencaX, celulaZ + diferencaZ)) || []));
          return arvoresVizinhas;
        },
        colide(posicaoX, posicaoZ, escala) { return this.vizinhas(posicaoX, posicaoZ).some(outraArvore => Math.hypot(posicaoX - outraArvore[0], posicaoZ - outraArvore[1]) < 0.82 * (escala + outraArvore[2])); },
        perto(posicaoX, posicaoZ, raio) { return this.vizinhas(posicaoX, posicaoZ).some(outraArvore => Math.hypot(posicaoX - outraArvore[0], posicaoZ - outraArvore[1]) < raio); },
      };
      // Função central: pode haver uma árvore de escala k em (x, z)? (árvores da floresta e dos vales; as decorativas das
      // construções são posicionadas pelos construtores e conferidas pelo teste de auditoria)
      const podeColocarArvore = function podeColocarArvore(posicaoX, posicaoZ, escala, folgaDoRio = 5.5) {
        if (posicaoX < -88 || posicaoX > 98 || posicaoZ < -38 || posicaoZ > 88) return false;               // limites do mapa
        if (COLISOES.bloqueia(posicaoX, posicaoZ, 1.1 * escala * 0.6 + 0.6)) return false;          // construções, estradas, relevo, cachoeira, lago, pedra, placa...
        if (COLISOES.rio(posicaoX, posicaoZ, folgaDoRio)) return false;                        // rio e margens
        return !REGISTRO_DE_ARVORES.colide(posicaoX, posicaoZ, escala);                             // distância mínima entre troncos
      };

      arquivoDaMontagemConcluido('03-colisoes-e-arvores.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
