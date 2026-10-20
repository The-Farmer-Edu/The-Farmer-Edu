# Guia do código – Minha Fazenda 3D

Este guia explica, na ordem em que aparecem no arquivo `fazenda.html`, cada constante, variável e função, e também o que cada comando do **Three.js** faz. Os números de linha (ex.: "linha 76") são do arquivo atual; se você editar o código, eles podem mudar.

---

## 1. Conceitos básicos (leia primeiro)

### 1.1 Os eixos X, Y e Z

Todo objeto 3D tem uma posição formada por três números:

| Eixo | Direção | Na fazenda |
|------|---------|------------|
| **X** | esquerda ↔ direita | `x` positivo = mais para a direita, `x` negativo = mais para a esquerda |
| **Y** | baixo ↔ cima | `y = 0` é o chão. `y` maior = mais alto (ex.: telhado, nuvens) |
| **Z** | trás ↔ frente | `z` positivo = mais perto da câmera (frente), `z` negativo = mais longe (fundo) |

O ponto `(0, 0, 0)` é o centro da fazenda, bem no chão.

**Exemplo:** `caixa.position.set(3, 1, -2)` coloca a caixa 3 unidades para a direita, 1 unidade acima do chão e 2 unidades para o fundo.

### 1.2 A posição é o CENTRO do objeto

No Three.js, quando você diz `position.set(x, y, z)`, esse ponto é o **centro** da peça, não a base.
Por isso, para uma parede de altura `4` ficar **apoiada no chão**, usamos `y = altura / 2` (= `2`). Veja no código: `criarCaixa(lado, alturaParedes, lado, cor, 0, alturaParedes / 2, 0, grupo)`.

Se você usasse `y = 0`, metade da parede ficaria enterrada no chão.

### 1.3 O que é uma "cena 3D" (visão geral)

Para aparecer algo na tela, o Three.js precisa de 4 coisas, todas presentes no código:

1. **Cena** (`Scene`) – o "palco" onde ficam todos os objetos.
2. **Câmera** (`PerspectiveCamera`) – o ponto de vista de quem olha.
3. **Renderizador** (`WebGLRenderer`) – desenha a cena vista pela câmera no `<canvas>`.
4. **Objetos** (`Mesh`) – as coisas visíveis: casa, animais, árvores etc.

A cada frame (cerca de 60 vezes por segundo), `renderizador.render(cena, camera)` tira uma "foto" da cena e mostra na tela. Isso é o que cria a animação.

### 1.4 Um objeto 3D visível = Mesh = Geometria + Material

Cada peça é feita de duas partes juntas:

- **Geometria**: o *formato* (caixa, cilindro, cone, esfera…).
- **Material**: a *aparência* (cor, como reage à luz…).

A junção dos dois é um `Mesh`.

### 1.5 Grupos (hierarquia)

Um `Group` é uma "pasta" invisível que guarda vários objetos. Se você move, gira ou muda a escala do grupo, **tudo dentro dele acompanha**. A fazenda usa isso o tempo todo: a casa inteira é um grupo, o trator é um grupo, cada planta é um grupo.

As posições dos filhos são **relativas ao pai**. Exemplo: a casa está no grupo posicionado em `(-8, 0, -6)`. Uma janela com `x = 1` dentro desse grupo aparece em `x = -8 + 1 = -7` no mundo.

---

## 2. Dicionário do Three.js (tudo que o código usa)

### 2.1 Objetos principais

| Comando | O que faz |
|---|---|
| `new THREE.Scene()` | Cria a **cena**: o espaço 3D vazio onde você coloca tudo. |
| `new THREE.PerspectiveCamera(45, 1, 0.1, 200)` | Cria a **câmera com perspectiva** (coisas distantes parecem menores, como na vida real). Os 4 números são: **45** = ângulo de visão em graus (campo de visão); **1** = proporção largura/altura (depois ajustada para o tamanho da tela); **0.1** = distância mínima que a câmera enxerga; **200** = distância máxima. Fora disso, o objeto some. |
| `new THREE.WebGLRenderer({ antialias: true })` | Cria o **renderizador**, que usa a placa de vídeo (WebGL) para desenhar. `antialias: true` suaviza as bordas serrilhadas. |
| `renderizador.domElement` | O `<canvas>` HTML que o renderizador criou. É nele que a imagem aparece. |
| `new THREE.Mesh(geometria, material)` | Cria um **objeto visível** juntando um formato (geometria) e uma aparência (material). **É a função que "dá corpo" a cada peça.** Sem `Mesh`, uma geometria existe só como dados e nada aparece. |
| `new THREE.Group()` | Cria um **grupo** (pasta) que agrupa vários objetos para movê-los juntos. |
| `new THREE.Clock()` | Cria um **relógio** para medir o tempo. Usado para animações. |
| `new THREE.Vector3(x, y, z)` | Guarda **três números** (um ponto ou direção no espaço). Usado para o alvo da câmera. |
| `new THREE.Color(0x9fd8f5)` | Cria uma **cor** a partir de um valor hexadecimal. |

### 2.2 Geometrias (formatos)

| Comando | Formato | Parâmetros |
|---|---|---|
| `new THREE.BoxGeometry(largura, altura, profundidade)` | Caixa/bloco | Tamanho em **X**, **Y** e **Z**. É a base de quase tudo: paredes, cercas, rodas quadradas, plantas… |
| `new THREE.CylinderGeometry(raioTopo, raioBase, altura, segmentos)` | Cilindro (ou cone cortado) | `raioTopo` e `raioBase` podem ser diferentes (vira um tronco de cone, como o cata-vento). `segmentos` = quantos lados (quanto maior, mais redondo; com **3** vira um prisma triangular, usado no telhado do celeiro). |
| `new THREE.ConeGeometry(raio, altura, segmentos)` | Cone | Com `segmentos = 4`, vira uma **pirâmide** (telhado da casa). Com `7`, vira a copa das árvores. |
| `new THREE.SphereGeometry(raio, segW, segH, ...)` | Esfera | Usada na fumaça (esfera inteira) e na cúpula do silo (só a **metade de cima**, usando os parâmetros extras de ângulo). |
| `new THREE.PlaneGeometry(largura, altura)` | Plano (folha achatada) | Usado no **chão**. Nasce "em pé", por isso é girado `-90°` para ficar deitado. |

### 2.3 Materiais (aparência)

| Comando | O que faz |
|---|---|
| `new THREE.MeshLambertMaterial({ color })` | Material **fosco que reage à luz**: lados virados para o sol ficam claros e os de sombra, escuros. Dá o aspecto 3D dos blocos. |
| `new THREE.MeshBasicMaterial({ color, transparent: true })` | Material que **ignora a luz** (sempre da mesma cor). Usado na **fumaça**. `transparent: true` permite mudar a `opacity` (transparência) dela. |

### 2.4 Luzes e ambiente

| Comando | O que faz |
|---|---|
| `new THREE.HemisphereLight(corCeu, corChao, intensidade)` | Luz **ambiente suave**: ilumina de cima com a cor do céu e de baixo com a cor do chão. Evita que as sombras fiquem totalmente pretas. |
| `new THREE.DirectionalLight(cor, intensidade)` | Luz do **sol**: raios paralelos vindos de uma direção. É a luz que gera sombras. |
| `cena.fog = new THREE.Fog(cor, perto, longe)` | **Neblina**: objetos entre `perto` e `longe` vão se misturando com a cor da neblina (aqui, a do céu), dando sensação de profundidade e escondendo a borda do mundo. |
| `cena.background = cor` | Cor de **fundo** da cena (o céu azul). |

### 2.5 Propriedades e métodos dos objetos

| Comando | O que faz |
|---|---|
| `objeto.position.set(x, y, z)` | Move o objeto para o ponto `(x, y, z)`. **É a linha 76 do código**; veja a explicação na seção 4.4. |
| `objeto.rotation.x / .y / .z = ângulo` | Gira o objeto em torno de cada eixo. O ângulo é em **radianos** (`Math.PI` = 180°, `Math.PI / 2` = 90°). `rotation.y` gira como um pião (olhar para os lados), `rotation.x` inclina para frente/trás, `rotation.z` inclina para os lados. |
| `objeto.scale.setScalar(n)` | Muda o **tamanho** do objeto por igual nos 3 eixos. `1` = normal, `2` = dobro, `0.5` = metade. |
| `objeto.castShadow = true` | O objeto **projeta sombra**. |
| `objeto.receiveShadow = true` | O objeto **recebe sombra** de outros. |
| `pai.add(filho)` | Coloca o `filho` dentro do `pai` (cena ou grupo). Só aparece na tela depois de ser adicionado à cena. |
| `pai.remove(filho)` | Tira o `filho` do `pai` (ele deixa de aparecer). |
| `objeto.traverse(função)` | **Percorre** o objeto e todos os seus descendentes, chamando a função em cada um. |
| `geometria.dispose()` | **Libera da memória** a geometria. Evita acúmulo de lixo quando a área é reconstruída. |
| `objeto.userData` | Um "bolso" vazio onde você pode guardar dados próprios (aqui, o progresso do efeito de evolução). |
| `objeto.children` | Lista dos filhos diretos do objeto. |
| `camera.lookAt(ponto)` | Faz a câmera **apontar** para o ponto. |
| `camera.aspect` + `camera.updateProjectionMatrix()` | Ajustam a proporção da câmera à tela e **recalculam** a projeção (obrigatório depois de mudar `aspect`). |
| `vetor.lerp(destino, 0.06)` | Move o vetor **6%** do caminho até o destino a cada chamada. Gera movimentos suaves (a câmera "desliza"). |
| `vetor.clone()` | Cria uma **cópia independente** do vetor. |
| `vetor.set(x, y, z)` | Define os três valores do vetor. |

### 2.6 Renderizador

| Comando | O que faz |
|---|---|
| `renderizador.setPixelRatio(n)` | Define a nitidez em telas de alta densidade (celulares). Limitamos a `2` para não pesar. |
| `renderizador.setSize(largura, altura)` | Define o tamanho do canvas. |
| `renderizador.shadowMap.enabled = true` | **Liga o sistema de sombras.** Sem isso, `castShadow` não tem efeito. |
| `renderizador.render(cena, camera)` | **Desenha um frame**: tira a foto da cena vista pela câmera. |

### 2.7 Relógio

| Comando | O que faz |
|---|---|
| `relogio.getDelta()` | Segundos desde a última vez que foi chamado (tempo entre dois frames). Faz as animações terem a mesma velocidade em qualquer aparelho. |
| `relogio.elapsedTime` | Segundos totais desde que o relógio começou. É o "tempo" usado nas funções `Math.sin`. |

### 2.8 Funções matemáticas do JavaScript usadas nas animações

| Comando | Para que serve na fazenda |
|---|---|
| `Math.sin(t)` / `Math.cos(t)` | Geram valores que **oscilam** entre -1 e 1 continuamente. Usados para balançar plantas, fazer animais andarem em círculo e subir a fumaça. |
| `Math.abs(n)` | Remove o sinal negativo. O `abs(sin(...))` faz os animais "pularem" sem afundar no chão. |
| `Math.atan2(a, b)` | Calcula o ângulo de uma direção. Faz o animal **olhar para onde está andando**. |
| `Math.random()` | Número aleatório entre 0 e 1. Dá variedade a cada animal. |
| `Math.min / Math.max` | Limitam um valor (ex.: o zoom nunca passa de 60 nem fica abaixo de 14). |
| `Math.hypot(a, b)` | Distância entre dois pontos. Usado na pinça de dois dedos. |
| `Math.PI` | O número π (3,14159…). `Math.PI / 2` = 90 graus. |

---

## 3. Constantes de configuração (linhas 23–35)

| Nome | Linha | O que é |
|---|---|---|
| `selecionar` | 23 | Função curta que busca um elemento da página pelo seletor CSS (ex.: `selecionar('#valor-xp')`). Atalho para `document.querySelector`. |
| `AREAS` | 26 | Lista das 5 áreas do jogo. Cada uma tem `id` (identificador interno), `nome` (texto do card), `icone` (emoji) e `posicao` (onde a área fica na fazenda, em `x` e `z`). **Mudar a `posicao` move a área inteira no mapa.** |
| `NIVEL_MAXIMO` | 33 | Nível mais alto de cada área (`5`). |
| `CUSTO_PARA_PROXIMO_NIVEL` | 34 | Quanto XP custa cada evolução: `[100, 250, 500, 1000]`. A posição `0` é o custo do nível 1→2, a posição `1` é do 2→3, e assim por diante. |
| `COR` | 35 | Cores que se repetem pelo código, com nome. Valores em hexadecimal: `0xRRGGBB` (vermelho, verde, azul). Ex.: `0xffe08a` = amarelo-claro da janela. |

---

## 4. Progresso do jogador (linhas 37–47)

### 4.1 `CHAVE_SALVAMENTO` (linha 38)
O "nome da gaveta" onde o progresso é guardado no navegador (`localStorage`). Mudar esse texto faz o jogo esquecer o progresso salvo.

### 4.2 `estado` (linha 39)
O objeto que guarda **tudo o que o jogador conquistou**:

```js
estado = {
  xp: 0,                      // XP disponível para gastar
  niveis: {                   // nível atual de cada área
    animais: 1, casa: 1, celeiro: 1, maquinario: 1, plantacao: 1
  }
}
```

### 4.3 `salvarProgresso()` (linha 44)
Converte o `estado` em texto (`JSON.stringify`) e guarda no navegador. É chamada sempre que o XP ou um nível muda. O `try/catch` evita erro caso o navegador bloqueie o armazenamento.

### 4.4 Bloco `try { ... JSON.parse ... }` (linhas 40–43)
Na abertura da página, tenta **ler** o progresso salvo. Se existir, substitui o `estado` inicial; se não existir ou der erro, mantém o inicial.

---

## 5. Cena básica (linhas 49–66)

| Nome | Linha | O que é |
|---|---|---|
| `renderizador` | 49 | O objeto que desenha tudo (ver 2.1). |
| `canvas` | 50 | O elemento HTML onde a imagem 3D aparece. |
| `cena` | 55 | O espaço 3D onde todos os objetos são colocados. |
| `camera` | 58 | O ponto de vista do jogador. |
| `sol` | 61 | A luz direcional que cria as sombras. `sol.position.set(12, 22, 10)` posiciona o sol alto e inclinado (as sombras caem na direção oposta). |
| `sol.shadow.mapSize.set(1024, 1024)` | 64 | Resolução das sombras. Maior = sombras mais nítidas e mais pesadas. |
| `sol.shadow.camera` (`left`, `right`, `top`, `bottom`, `near`, `far`) | 65 | Define a **região da fazenda** em que o sol calcula sombras (de -24 a 24 em X e Z). Fora dessa área, não há sombra. |

---

## 6. Funções auxiliares de modelagem (linhas 69–91)

### 6.1 `cacheDeMateriais` e `material(cor)` (linhas 69–73)

```js
const cacheDeMateriais = {};
function material(cor) { ... }
```

`material(cor)` devolve um material da cor pedida. Se essa cor já foi usada antes, **reaproveita** o mesmo material em vez de criar outro. Isso economiza memória: há centenas de peças, mas poucas dezenas de cores.

### 6.2 `criarCaixa(largura, altura, profundidade, cor, x, y, z, pai)` (linha 74)

A função mais usada do código. Cria um **bloco** e o coloca no mundo.

| Parâmetro | O que é | O que muda na fazenda |
|---|---|---|
| `largura` | Tamanho no eixo **X** (esquerda↔direita) | Bloco mais largo/estreito |
| `altura` | Tamanho no eixo **Y** (cima↔baixo) | Bloco mais alto/baixo |
| `profundidade` | Tamanho no eixo **Z** (frente↔trás) | Bloco mais comprido para a frente/fundo |
| `cor` | Cor em hexadecimal (`0xb23a2e`, ou `COR.madeira`) | Cor do bloco |
| `x` | Posição esquerda↔direita | Move o bloco para os lados |
| `y` | Posição de altura (0 = chão) | Sobe ou desce o bloco |
| `z` | Posição frente↔trás | Aproxima ou afasta o bloco da câmera |
| `pai` | O grupo ou cena onde o bloco será colocado | Decide a que "pasta" a peça pertence (e, portanto, a que área) |

**Linha por linha:**

```js
const caixa = new THREE.Mesh(                              // cria o objeto visível
  new THREE.BoxGeometry(largura, altura, profundidade),    //   formato: caixa com esse tamanho
  material(cor));                                          //   aparência: material dessa cor
caixa.position.set(x, y, z);                               // LINHA 76: posiciona o centro da caixa
caixa.castShadow = caixa.receiveShadow = true;             // projeta e recebe sombras
pai.add(caixa);                                            // coloca no grupo/cena (agora aparece!)
return caixa;                                              // devolve a caixa para quem quiser mexer nela depois
```

**Sobre a linha 76 (`caixa.position.set(x, y, z)`):** ela define **onde fica o centro da caixa**.
- Aumentar `x` empurra a caixa para a direita; diminuir, para a esquerda.
- Aumentar `y` levanta a caixa; `y = altura / 2` deixa ela apoiada no chão.
- Aumentar `z` traz a caixa para perto da câmera; diminuir, afasta.

**Exemplo real do código:** a porta da casa:
`criarCaixa(0.7, 1.2, 0.1, 0x7a4a2a, 0, 0.6, lado / 2 + 0.05, grupo)`
→ uma caixa de 0,7 de largura, 1,2 de altura e só 0,1 de espessura (uma "placa"); marrom; centrada em `x = 0` (meio da casa); em `y = 0.6` (metade da altura de 1,2, portanto encostada no chão); e em `z = lado/2 + 0.05` (exatamente na face da frente da parede, um pouquinho para fora, para não "brigar" visualmente com a parede).

### 6.3 `criarCilindro(raioTopo, raioBase, altura, cor, x, y, z, pai, segmentos = 14)` (linha 81)

Igual à caixa, mas com formato cilíndrico.

| Parâmetro | O que é |
|---|---|
| `raioTopo` / `raioBase` | Raio (metade da largura) do topo e da base. Se forem diferentes, vira um cone cortado (usado na torre do cata-vento: `0.2` em cima e `0.45` embaixo). |
| `altura` | Altura do cilindro. |
| `cor`, `x`, `y`, `z`, `pai` | Iguais aos da caixa. |
| `segmentos = 14` | Quantos lados o cilindro tem. O `= 14` significa que, se você não informar, usa 14. |

### 6.4 `criarRoda(raio, largura, x, y, z, pai)` (linha 88)

Cria um cilindro preto (cor `COR.pneu`) e **o deita**: `roda.rotation.z = Math.PI / 2` gira 90° no eixo Z. Sem isso, o cilindro ficaria em pé como uma lata; com isso, fica deitado, como roda.

---

## 7. Cenário fixo (linhas 93–116)

| Nome | O que é |
|---|---|
| `chao` (94) | Um grande plano verde de 70×70. `chao.rotation.x = -Math.PI / 2` o deita (planos nascem em pé). `receiveShadow = true` faz as sombras aparecerem nele. |
| Caminho de terra | `criarCaixa(2.4, 0.05, 16, 0xd9b97a, 0, 0.03, -1, cena)`: faixa bege muito fina (`0.05` de altura), com 2,4 de largura e 16 de comprimento. |
| `POSICOES_ARVORES` (100) | Lista de pares `[x, z]` onde as árvores ficam. Para plantar mais árvores, basta adicionar pares. |
| `copa` (dentro do `forEach`) | O cone verde da árvore. O tronco é uma caixa marrom. |
| `nuvens` (109) | Lista das nuvens. Cada nuvem é um grupo de 3 caixas brancas de tamanhos diferentes. Na posição `y = 16`, bem acima da fazenda. |

---

## 8. Modelos reutilizáveis (linhas 118–168)

### 8.1 `criarTrator(pai, x, z, escala, corCarroceria)` (linha 119)

Monta um trator: carroceria, cabine de vidro, escapamento e 4 rodas (2 grandes atrás e 2 pequenas na frente).

| Parâmetro | O que é |
|---|---|
| `pai` | Grupo onde o trator será colocado |
| `x`, `z` | Posição no chão (o `y` é sempre 0) |
| `escala` | Tamanho: `1` = normal, `1.12` = 12% maior |
| `corCarroceria` | Cor do corpo do trator |

Devolve o grupo `trator` para permitir animá-lo depois (a vibração do motor).

### 8.2 `criarAnimal(pai, animacoes, tipo, centroX, centroZ)` (linha 133)

Cria um animal e **registra a animação** de passeio.

| Parâmetro | O que é |
|---|---|
| `pai` | Grupo onde colocar o animal (o cercado) |
| `animacoes` | Lista de animações da área; a função adiciona nela o movimento do animal |
| `tipo` | `'galinha'`, `'porco'`, `'vaca'` ou `'ovelha'`; escolhe qual modelo montar |
| `centroX`, `centroZ` | Centro do círculo em volta do qual o animal passeia |

**Variáveis internas:**

| Variável | O que é |
|---|---|
| `animal` | Grupo com as caixas do corpo do animal |
| `raioDoPasseio` | Tamanho do círculo do passeio (cada animal tem um valor aleatório entre 0,3 e 0,7) |
| `velocidade` | Rapidez com que anda (aleatória, entre 0,3 e 0,7) |
| `faseInicial` | Ponto de partida do passeio (aleatório); impede que todos andem sincronizados |
| `tempo` | (dentro da função de animação) segundos desde o início, recebido a cada frame |
| `angulo` | Posição atual no círculo = `tempo * velocidade + faseInicial` |

**Como o movimento funciona:** `Math.sin(angulo)` e `Math.cos(angulo)` desenham um círculo (ou elipse, porque o `x` é multiplicado por `2` e o `z` por `1.4`). A altura `y` usa `Math.abs(Math.sin(tempo * 5 + ...)) * 0.05`, um pulinho de 5 centímetros a cada passo. `animal.rotation.y = Math.atan2(...)` vira o corpo para a direção do movimento.

---

## 9. `construtoresDasAreas` (linha 172)

**É o coração do jogo.** Um objeto com **5 funções**, uma para cada área. Cada função recebe:

| Parâmetro | O que é |
|---|---|
| `grupo` | O grupo 3D onde desenhar (a "pasta" da área) |
| `nivel` | Nível atual (1 a 5); controla o que aparece |
| `animacoes` | Lista onde a função pode adicionar movimentos (fumaça, vento etc.) |

O padrão `if (nivel >= 3) { ... }` significa: "**a partir do nível 3**, desenhe isto também". É assim que cada evolução acrescenta novas peças.

### 9.1 `casa` (linha 174)

| Variável | O que é | O que muda |
|---|---|---|
| `lado` | Tamanho da base: `3 + nivel * 0.5` | A casa cresce 0,5 a cada nível |
| `andares` | `2` se nível ≥ 3, senão `1` | A casa ganha segundo andar |
| `alturaParedes` | `1.8 * andares` | Altura total das paredes |
| `telhado` | Cone de 4 lados (pirâmide) girado 45° | O telhado vermelho; `rotation.y = Math.PI / 4` alinha a pirâmide aos lados da casa |
| `ladoDaJanela` | `-1` ou `1` | Cria uma janela de cada lado (esquerda/direita) |
| `andar` | Contador do loop | Repete as janelas em cada andar (`y = 1 + andar * 1.8`) |
| `chamineX/Y/Z` | Posição da chaminé | Nível ≥ 2 |
| `baforada` | Esfera branca da fumaça | 4 esferas sobem e somem |
| `progresso` (dentro da animação) | `(tempo * 0.3 + i / 4) % 1`: vai de 0 a 1 e recomeça | 0 = saindo da chaminé; 1 = desapareceu. Controla a posição, o tamanho e a opacidade |
| `coresDasFlores` | Lista de cores das flores | Nível 5: jardim |

**Evolução:** nível 2 = chaminé com fumaça · nível 3 = segundo andar · nível 4 = varanda · nível 5 = jardim de flores.

### 9.2 `celeiro` (linha 220)

| Variável | O que é |
|---|---|
| `largura` | `4 + nivel * 0.6`: o celeiro alarga a cada nível |
| `altura` | `2.4 + nivel * 0.2`: fica mais alto |
| `profundidade` | `4.5`: comprimento fixo |
| `raioDoTelhado` | Raio do prisma triangular do telhado, calculado para cobrir a largura |
| `telhado` | Cilindro de 3 lados deitado (`rotation.x = -Math.PI / 2`) = telhado de duas águas |
| `quantidadeDeFardos` | `Math.min(nivel - 1, 3)`: de 0 a 3 fardos de feno (cilindros deitados) |
| `cupula` | Meia-esfera que cobre o silo |

**Evolução:** nível 2+ = fardos de feno · nível 3 = silo · nível 5 = segundo silo e ala extra.

### 9.3 `animais` (linha 253)

| Variável | O que é |
|---|---|
| Postes e travessas | Os loops `for (let x = -3.5; x <= 3.5; x++)` repetem um poste a cada 1 unidade de `x` (e a cada 1,1 de `z` nas laterais), formando o cercado de 7 × 6,4 |
| `quantidadePorTipo` | Quantos animais de cada tipo existem; o número depende do nível |

```js
galinha: [2, 4, 5, 6, 8][nivel - 1]
```
A lista tem 5 números (um por nível). `[nivel - 1]` escolhe o certo: no nível 1 pega a posição 0 (`2` galinhas); no nível 5 pega a posição 4 (`8` galinhas).

| Tipo | Nv 1 | Nv 2 | Nv 3 | Nv 4 | Nv 5 |
|---|---|---|---|---|---|
| Galinhas | 2 | 4 | 5 | 6 | 8 |
| Porcos | 0 | 1 | 2 | 3 | 3 |
| Vacas | 0 | 0 | 1 | 2 | 3 |
| Ovelhas | 0 | 0 | 0 | 2 | 4 |

O cocho de água/comida aparece a partir do nível 3.

### 9.4 `maquinario` (linha 275)

| Nível | O que aparece |
|---|---|
| 1 | Carrinho de mão |
| 2 | Trator pequeno (`escala = 1 + (nivel - 2) * 0.12`: cresce 12% por nível) |
| 3+ | Reboque atrás do trator |
| 4+ | Colheitadeira (corpo amarelo, cabine, plataforma de corte vermelha) |
| 5 | Cata-vento com hélice girando |

| Variável | O que é |
|---|---|
| `trator` | O grupo do trator; sua posição `y` oscila de leve (`Math.sin(tempo * 40) * 0.01`) simulando o motor vibrando |
| `helice` | Grupo com as 4 pás; `helice.rotation.z = tempo * 1.2` a faz girar continuamente |
| `bracoDaHelice` | Cada pá, girada em múltiplos de 90° (`pa * Math.PI / 2`) para formar uma cruz |

### 9.5 `plantacao` (linha 312)

| Variável | O que é |
|---|---|
| `colunas` | `3 + nivel`: quantas fileiras para o lado (4 a 8) |
| `linhas` | `2 + nivel`: quantas fileiras para o fundo (3 a 7) |
| `planta` | Grupo de cada planta, posicionado em uma grade (1,2 de espaço em X e 1,1 em Z) |
| `ehLinhaDeMilho` | `true` se nível ≥ 3 e a linha for ímpar: alterna milho e trigo |
| `corDoTrigo` | Verde (`0x7fbf4a`) no nível 1; dourado (`0xd9b44a`) depois |
| `deslocamentoX` | Três hastes de trigo lado a lado (`-0.2`, `0`, `0.2`) |
| `bordaX` | Posição do espantalho na borda direita do campo |

**Por que cada planta é um grupo?** Para balançar. Um objeto gira em torno do seu centro, mas a planta deve balançar a partir da **base**. Com o grupo na base (`y = 0.12`) e os caules acima, `planta.rotation.z = Math.sin(...) * 0.07` faz a planta inclinar a partir do chão, como no vento. O valor `coluna * 0.5 + linha * 0.3` dá uma fase diferente para cada planta, criando uma "onda" de vento.

**Evolução:** o campo cresce a cada nível · nível 3+ = milho · nível 5 = espantalho e aspersores.

---

## 10. Grupos das áreas (linhas 351–372)

| Nome | O que é |
|---|---|
| `grupoDaArea` | Dicionário: `id da área` → grupo 3D. Ex.: `grupoDaArea['casa']` é o grupo onde a casa é desenhada. |
| `animacoesDaArea` | Dicionário: `id da área` → lista de funções de animação daquela área. |
| `reconstruirArea(idDaArea)` (362) | **Apaga e redesenha** uma área. Passos: ① remove todos os filhos do grupo e libera suas geometrias (`dispose`); ② zera a lista de animações; ③ chama `construtoresDasAreas[idDaArea]` com o nível atual; ④ ativa o efeito de "pulinho". |

A linha `AREAS.forEach(area => reconstruirArea(area.id))` roda ao abrir a página e desenha as 5 áreas pela primeira vez.

---

## 11. Câmera e controles (linhas 374–418)

| Nome | O que é |
|---|---|
| `anguloHorizontal` | Quanto a câmera girou em volta da fazenda (em radianos). Arrastar na tela para os lados muda isso. |
| `anguloVertical` | Altura do ponto de vista: baixo = visão quase horizontal; alto = visão de cima. Limitado entre `0.35` e `1.35`. |
| `distanciaDaCamera` | Distância até o centro. Menor = zoom in, maior = zoom out. Começa em `48` no celular em pé e `34` em tela larga. |
| `DISTANCIA_MINIMA` / `DISTANCIA_MAXIMA` | Limites do zoom (14 e 60). |
| `alvoAtualDaCamera` | Ponto para onde a câmera está olhando agora. |
| `alvoDestinoDaCamera` | Ponto para onde ela *quer* olhar. A cada frame, o `alvoAtual` se aproxima do `alvoDestino`, criando o deslize suave. |
| `focarCameraNaArea(idDaArea)` (383) | Define o `alvoDestino` como 70% da posição da área (o meio-termo evita um zoom excessivo para a borda). Chamada ao tocar num card ou evoluir. |
| `ajustarTamanhoDaTela()` (387) | Reajusta o canvas e a proporção da câmera quando a janela muda de tamanho ou o celular gira. |
| `dedosNaTela` (395) | Um `Map` (dicionário) com os dedos que estão tocando a tela. A chave é o id do toque e o valor é `[x, y]`. |

**Eventos (`addEventListener`):**
- `pointerdown`: um dedo encostou → guarda a posição.
- `pointermove`: o dedo se moveu → **1 dedo** gira a câmera; **2 dedos** fazem zoom (compara a distância entre os dedos antes e agora).
- `pointerup` / `pointercancel`: o dedo saiu → remove do `Map`.
- `wheel`: roda do mouse → zoom no computador.

**Posição da câmera (no loop principal):** usa trigonometria para posicionar a câmera numa "esfera" em volta do alvo:

```js
x = alvo.x + distancia * cos(vertical) * sin(horizontal)
y =          distancia * sin(vertical)
z = alvo.z + distancia * cos(vertical) * cos(horizontal)
```

---

## 12. Loop principal (linhas 420–446)

`animarCena()` se chama de novo a cada frame com `requestAnimationFrame` (o navegador chama a função ~60 vezes por segundo, no ritmo da tela).

| Variável | O que é |
|---|---|
| `relogio` | O relógio do Three.js |
| `tempoDesdeUltimoFrame` | Segundos desde o frame anterior, limitado a `0.05` para evitar saltos se a aba ficar travada |
| `tempoTotal` | Segundos desde o início; é enviado a todas as animações |

O que o loop faz em cada frame:
1. **Roda todas as animações** de todas as áreas (balançar plantas, fumaça, animais, hélice…).
2. **Efeito de evolução:** quando `progressoDoEfeitoDeEvolucao` é maior que 0, a escala do grupo vai a `1.2` e volta a `1` (`1 + 0.2 * Math.sin(progresso * Math.PI)`).
3. **Move as nuvens** para a direita; ao passar de `x = 38`, voltam para `-38`.
4. **Atualiza a câmera** (suaviza o alvo, calcula a posição e olha para o alvo).
5. **Desenha** o frame com `renderizador.render(cena, camera)`.

---

## 13. Interface (linhas 448–end)

| Função | O que faz |
|---|---|
| `mostrarAviso(mensagem)` (450) | Mostra uma mensagem no topo por 2,2 s. `temporizadorDoAviso` guarda o cronômetro; `clearTimeout` cancela o anterior se um novo aviso chegar. |
| `evoluirArea(idDaArea)` (458) | Tenta evoluir: ① pega o nível atual e o custo; ② se estiver no nível máximo ou faltar XP, **não faz nada** (`return`); ③ senão, desconta o XP, soma 1 ao nível, salva, redesenha a área, foca a câmera, atualiza os cards e mostra o aviso. |
| `desenharCards()` (473) | Recria a lista de cards na parte de baixo. Para cada área, mostra ícone, nome, bolinhas de nível (`●` cheias e `○` vazias) e o botão. O botão fica desativado se o nível estiver no máximo ou o XP for insuficiente. Guarda e restaura a rolagem (`rolagemAnterior`) para a lista não "pular" ao atualizar. |
| `window.adicionarXP(quantidade)` | **Ponto de ligação com o sistema de atividades.** Soma XP, salva e atualiza a tela. É `window.` para outros códigos poderem chamá-la. |
| `botao-teste-xp` | Botão "+50 XP (teste)" que chama `adicionarXP(50)`. Pode ser removido depois. |

**Variáveis dentro de `desenharCards`:** `nivel` (nível da área), `estaNoMaximo` (se chegou ao 5), `custo` (XP para o próximo), `botaoDesativado` (se o botão deve ficar cinza) e `textoDoBotao` (o texto exibido).

---

## 14. HTML e CSS (o que está no começo do arquivo)

| Elemento | Função |
|---|---|
| `#barra-topo` | Barra no topo com o XP e o botão de teste |
| `#valor-xp` | O número de XP exibido |
| `#lista-cards` | Lista horizontal de cards na parte inferior |
| `.card` | Cada card de área |
| `.pontos-nivel` | As bolinhas de nível (●●○○○) |
| `#aviso` | A mensagem temporária de evolução |
| Variáveis CSS (`--fundo-card`, `--texto`, `--destaque`, `--desativado`) | Cores da interface; mudam automaticamente no modo escuro |

---

## 15. Experimentos para aprender mexendo

Altere um valor por vez e veja o resultado:

1. **Linha 34:** mude `[100, 250, 500, 1000]` para `[10, 20, 30, 40]` e evolua tudo rápido.
2. **`AREAS` → `posicao`:** troque o `x` da casa de `-8` para `-12` e veja a casa se afastar.
3. **`criarCaixa` da porta da casa:** mude a cor de `0x7a4a2a` para `0xff0000` (vermelho).
4. **`sol.position.set(12, 22, 10)`:** troque para `(-12, 22, 10)` e veja as sombras mudarem de lado.
5. **`cena.background`:** mude `0x9fd8f5` para `0x1a1a40` (céu de noite).
6. **`relogio.elapsedTime * 1.2`** (hélice): mude para `4` e o cata-vento gira mais rápido.
7. **Quantidade de galinhas:** em `animais`, mude `[2, 4, 5, 6, 8]` para `[10, 12, 14, 16, 20]`.

---

## 16. Resumo visual da hierarquia

```
cena (Scene)
├── luzes (HemisphereLight, DirectionalLight)
├── chao, caminho, árvores, nuvens
└── grupoDaArea[...]  (um Group por área, na posição da área)
    ├── casa       → paredes, telhado, janelas, chaminé, fumaça...
    ├── celeiro    → paredes, telhado, silo, fardos...
    ├── animais    → cercado + galinhas/porcos/vacas/ovelhas
    ├── maquinario → trator, reboque, colheitadeira, cata-vento
    └── plantacao  → terra + plantas (cada uma num Group próprio)
```

Cada peça visível é um `Mesh` (geometria + material) criado por `criarCaixa` ou `criarCilindro`, posicionado com `position.set(x, y, z)` e adicionado ao grupo com `.add()`.
