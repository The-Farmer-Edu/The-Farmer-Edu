# Edição pessoal — a cena viva do celeiro

Experiência exclusiva da **edição pessoal** (não faz parte da versão da equipe, publicada no commit `5efa090`).
Clicar no **celeiro** da Fazenda leva, com uma transição de íris, a uma cena 2D em pixel art: um **laboratório secreto escondido
dentro do celeiro**, onde **Tony Stark (de armadura)** e **Nick Fury** conversam, num ambiente cheio de pequenos acontecimentos.

> **Veja também:** [EDICAO-PESSOAL-CAVERNA.md](EDICAO-PESSOAL-CAVERNA.md) — a caverna secreta dos personagens (segunda cena
> independente, que reaproveita a íris e a suspensão da Fazenda desta cena sem alterá-las).

---

## 1. Como acessar e testar

1. Abrir a Fazenda (pela aplicação ou direto em `app/modules/fazenda/views/fazenda.html`).
2. O **celeiro precisa estar construído e inteiro** (nível 1 ou mais, sem estar destruído por uma invasão).
3. **Clicar no prédio do celeiro** (um clique curto, sem arrastar a câmera). A tela fecha numa íris sobre o celeiro e abre a cena.
4. **Sair:** tecla **Esc** ou o botão discreto **"⟵ Fazenda"** no canto superior esquerdo. A íris fecha sobre a cena e abre de volta
   sobre o celeiro, com a Fazenda exatamente como estava.

A entrada é recusada (nada acontece, ou aparece um aviso) durante uma invasão, uma cena especial (unicórnio, disco voador, ET),
com o tutorial, o painel do Guardião ou as janelas do nome da fazenda e da defesa abertos.

Pelo console (para testes): `farmEduCeleiro.entrar()`, `farmEduCeleiro.sair()`, `farmEduCeleiro.estado()`, `farmEduCeleiro.motivo()`.

---

## 2. Arquitetura

| Parte | Onde | O que faz |
|---|---|---|
| Porta de entrada | `views/assets/js/30i-cena-do-celeiro.js` | Clique no celeiro (raio × caixa do prédio), condições, íris (Iris Out/In), suspensão da Fazenda, pausa e retomada dos sons, carregamento sob demanda, Esc e botão |
| Estilos | `views/assets/css/10-cena-do-celeiro.css` | Camada da cena, ampliação nítida (`image-rendering: pixelated`), balão de fala em pixel art, botão de volta |
| Suspensão da Fazenda | `views/assets/js/31-loop-principal.js` (`FAZENDA_SUSPENSA`) | Com a cena aberta, o laço da Fazenda continua agendado mas não atualiza nem desenha (como uma aba em segundo plano); o tempo parado é descartado |
| Invasões | `views/assets/js/26-invasoes.js` | `#cena-do-celeiro` entrou na lista de motivos para uma invasão esperar |
| A cena em si | `views/assets/easter-eggs/vingadores/` | Baixada **só na primeira entrada**, em ordem: `configuracao.js` → `pixel.js` → `cenario/oficina.js` → `personagens/ator.js` → `personagens/homem-de-ferro.js` → `personagens/nick-fury.js` → `dialogos/conversas.js` → `motor.js` |

- **Isolamento:** a cena é um **canvas 2D** próprio (384×216 pixels lógicos), ampliado em **escala inteira** (nearest-neighbor). Não
  cria outra instância do Three.js. Tem **um único** laço `requestAnimationFrame`, ativo só com a cena aberta; ao sair ele é
  cancelado e, ao voltar, retomado sem duplicar (`CenaDoCeleiro.estatisticas.lacosAtivos`).
- **Estado preservado:** a Fazenda não é reiniciada. Durante a cena, relógio do ciclo, trabalhadores, animais, invasões e câmera
  ficam **congelados**; XP, recursos, construções e o save não mudam. A Fazenda continua viva e visível **durante as íris** (cerca
  de 0,9 s na ida e 0,9 s na volta), então andam cerca de 1,9 s de jogo no total.
- **Teclado:** com a cena (ou uma transição) na tela, nenhuma tecla chega à Fazenda (WASD, atalhos); Esc sai.
- **Servidor:** os arquivos da cena saem pela rota existente `fazenda/arquivo` (JS já é aceito); nada mudou no backend.
- **Fonte dos balões:** VT323 (Google Fonts), carregada na primeira entrada; sem internet, cai para uma fonte monoespaçada.

### Camadas da cena (de trás para a frente)

1. **Fundo estático** (pintado uma vez, em cache): parede de tábuas e treliças do celeiro, teto, janela com o céu da noite, painel de
   aço com seis monitores, racks de servidores, quadro de ferramentas, pórtico com uma armadura reserva, escada, chão de concreto
   em perspectiva com juntas, manchas e cabos, bancada de madeira, mesa holográfica, carrinho de ferramentas e detalhes do chão.
2. **Meio animado** (atrás dos personagens), cada elemento com ritmo próprio: LEDs dos racks, os seis monitores (gráfico, radar,
   código rolando, armadura em arame, mapa da fazenda com pontos vermelhos, barras de energia), falhas raras de imagem nos
   monitores, osciloscópio, braço robótico em ciclos (vai, solda com faíscas, volta, espera), holograma do celeiro em arame
   girando, drone flutuando, laser de varredura na armadura reserva, anéis de luz em sequência, **vaca espiando pela janela** e
   **ratinho** correndo no rodapé.
3. **Personagens** (com sombra no chão).
4. **Primeiro plano e luzes:** robô aspirador atravessando o chão de vez em quando, fardo de feno com notebook, carretel de cabo,
   engradado "FRÁGIL", tambor de óleo, faíscas da solda, vapor da caneca, poeira nos cones de luz, cones das luminárias (a da
   direita falha às vezes), giroflex âmbar em ciclos.

---

## 3. Personagens e animação

Os personagens são **pixel art desenhada em código**, parte por parte, com coordenadas inteiras, contorno escuro automático por
parte e paleta própria (sem reaproveitar nada dos fazendeiros). Altura: Tony 43 px, Fury 44 px (escala dos personagens do Floor796).

- **Homem de Ferro:** armadura vermelha e dourada, capacete com placa facial dourada e olhos brilhantes (que oscilam ao falar),
  ombreiras, abdômen em placas douradas, cinto, joelheiras, botas, manoplas com punho dourado e **repulsor aceso na palma** quando a
  mão abre. **Reator Arc** com anel, núcleo e halo em anéis translúcidos que **pulsam** com variação sutil, e reflexo ciano no chão.
- **Nick Fury:** sobretudo preto longo com gola alta, lapelas e dobras, camisa escura, calça e botas, cabeça raspada com brilho,
  cavanhaque, bigode, sobrancelha franzida e **tapa-olho no olho esquerdo** com a alça contornando a cabeça. O tapa-olho fica no olho
  certo em qualquer direção (inclusive no meio de uma virada); a manga da frente é um tom mais clara para o gesto aparecer sobre o casaco.

**Como a animação funciona** (`personagens/ator.js`):

- **Pose base** = atividade do momento. Tony: `trabalhando` (de frente para a bancada), `conversando`, `confiante` (mão na
  cintura). Fury: `bracosCruzados`, `conversando`, `analisando` (de costas, olhando os monitores).
- **Mudança de pose** com transição; ao virar de lado, o personagem **passa pela vista de frente**.
- **Gestos por quadros-chave.** Tony: explicar (mão aberta, repulsor), apontar, dar de ombros, acenar, impaciência (bate o pé),
  recuar, mostrar a armadura atrás, olhar o equipamento, assentir, ajustar a manopla. Fury: apontar, enfatizar, inclinar-se, negar
  com a cabeça, suspirar, ajeitar a gola, olhar os monitores, encarar, assentir.
- **Comportamentos ociosos independentes:** respirar, trocar o peso do corpo, olhar em volta, mexer as mãos na bancada, tamborilar
  o pé (Fury de braços cruzados), olhos do capacete oscilando, cabeça acompanhando a fala.
- **12 quadros por segundo:** a pose é amostrada em degraus, como animação de pixel art feita quadro a quadro.

---

## 4. Diálogos

Três conversas originais em português (`dialogos/conversas.js`): **"O celeiro"**, **"O trator"** e **"O disco voador"**. Tony é
sarcástico e rápido; Fury é seco e direto. Elas conversam com o mundo da Fazenda (a vaca na janela, as invasões a cada dois dias
úteis, o disco voador das vacas, a pedra que canta).

- Cada fala define **o gesto de quem fala** e **a reação de quem ouve** (disparada no meio da fala: ele está escutando), além de
  mudanças de postura antes da fala e eventos no cenário (a vaca aparece na janela quando o Fury fala dela).
- **Balão em pixel art** (moldura em degraus, faixa na cor do personagem, nome), texto **digitado** a 34 caracteres por segundo,
  tempo de leitura de 1,3 s + 0,045 s por caractere, pausas naturais variáveis entre as falas.
- Entre as conversas, 7 a 13 s de silêncio, com cada um voltando às suas atividades. A próxima conversa é sorteada **sem repetir a
  anterior**. Se o jogador sai no meio de uma fala, ela recomeça limpa na volta.

---

## 5. (seção retirada)

O antigo easter egg do gato giratório atrás das montanhas foi **removido definitivamente** da edição pessoal em 18/11/2026
(módulo, entrada na lista de módulos e documentação). Não há nada dele no código.

---

## 6. Origem dos recursos e licenças

- **Toda a arte da cena foi desenhada em código** neste projeto (primitivas de pixel, sem imagens externas). Nada foi copiado do
  Floor796, que serviu só de referência de linguagem e densidade.
- **Diálogos:** originais.
- **Personagens:** Homem de Ferro e Nick Fury são personagens da Marvel. A cena é **fan art para uso pessoal, sem fins comerciais**;
  não use em material público ou comercial sem avaliar os direitos.
- **Fonte VT323:** Google Fonts, licença SIL Open Font License.

---

## 7. Qualidade visual: o que já está e o que um artista melhoraria

O resultado é pixel art de verdade (resolução baixa, cores chapadas, contornos, escala inteira), com uma cena densa e viva. Mas
personagens **montados em código a partir de partes** não alcançam o acabamento de sprites desenhados quadro a quadro por um
artista, como no Floor796: os gestos são legíveis, porém mais "duros", sem quadros intermediários desenhados à mão, sem
deformação de tecido no casaco e sem expressão facial.

**Especificação para substituir por sprites desenhados** (próximo passo, se houver um artista):

- **Quadro:** 56×60 px por quadro, pés no ponto (28, 56), personagem olhando para a **direita** (o jogo espelha; para o Fury,
  entregar também a cabeça olhando para a esquerda, por causa do tapa-olho). PNG com transparência, sem suavização, contorno de 1 px.
- **Paletas:** as do topo de `homem-de-ferro.js` (`CORES_DO_HOMEM_DE_FERRO`) e `nick-fury.js` (`CORES_DO_NICK_FURY`).
- **Estados e quadros sugeridos.** Tony:
  - parado: 4 quadros (respiração);
  - trabalhando: 6;
  - virar: 3 (lado → frente → lado);
  - explicar: 6;
  - apontar: 4;
  - dar de ombros: 5;
  - acenar: 6;
  - impaciente: 6;
  - recuar: 4;
  - mostrar atrás: 4;
  - olhar o equipamento: 3;
  - assentir: 4;
  - ajustar a manopla: 6.

  Fury:
  - braços cruzados, parado: 4;
  - conversando, parado: 4;
  - apontar: 4;
  - enfatizar: 6;
  - inclinar-se: 4;
  - negar: 6;
  - suspirar: 5;
  - ajeitar a gola: 6;
  - olhar os monitores: 3;
  - encarar: 2;
  - assentir: 3;
  - virar: 3.

  Taxa: 12 quadros por segundo.
- **Integração:** hoje `ator.desenhar` chama `desenharPartes`; um carregador de sprite sheets trocaria essa função por "desenhar o
  quadro N do estado X", mantendo o diretor de diálogo, as poses e os tempos como estão. **Esse carregador ainda não existe.**

---

## 8. Testes realizados (Chrome de teste, modo local, save de referência)

| Teste | Resultado |
|---|---|
| Clique real do mouse no celeiro | abre a cena |
| Clique real na grama | não faz nada |
| Clique real durante uma invasão | não abre |
| Iris Out sobre o celeiro e Iris In na cena (fotografadas no meio, com a íris desacelerada só na memória) | ok |
| Cena aberta: Fazenda suspensa, música pausada, 1 laço ativo | ok |
| Fazenda congelada durante a cena (relógio, trabalhadores e câmera iguais depois de 6 s) | ok |
| Saída pela tecla Esc (evento de teclado) e pelo botão | ok |
| Estado depois de voltar: câmera, XP, recursos, níveis, danos, invasão e equipe iguais (relógio e trabalhadores andam cerca de 1,9 s, das íris) | ok |
| Fazenda volta a andar; cena fechada desenha 0 quadros; reentrada com 1 laço | ok |
| 4 ciclos de entrada e saída: memória estável (82,4 MB), 0 laços ao fim | ok |
| Diálogo ao longo de 50 s (folha de contato com 20 recortes): falas, gestos, reações, viradas e pausas | ok |
| Desempenho da cena: 59,8 FPS (2,2 ms por quadro); com a CPU 4× mais lenta, 53,3 FPS (13,7 ms) | ok |
| FPS da Fazenda antes e depois de usar a cena: 43,5 → 44,6 (normal) e 23,2 → 23,0 (CPU 4×) | ok |
| Erros de JavaScript | nenhum |

**Não testados:** pela aplicação PHP com login e banco; em celular ou tela de toque; em aparelho fraco de verdade; a fonte VT323
(o Chrome de teste pode ter usado a fonte monoespaçada de reserva).

---

## 9. Legibilidade do código (23/11/2026)

Refatoração **só de nomes e organização** de `easter-eggs/vingadores/` e de `js/30i-cena-do-celeiro.js`: nenhuma posição, cor,
forma, animação, fala, tempo ou ordem de sorteio mudou.

| Antes | Depois |
|---|---|
| `C` (= `window.CenaDoCeleiro`), `P` (= `C.pixel`), `L` / `A` | `cenaDoCeleiro`, `ferramentasPixel`, `LARGURA` / `ALTURA` |
| `K = { R, Rh, Rd, Rdd, G, Gh, Gd, … }` / `K = { casacoC, casacoE, peleE, … }` | `CORES_DO_HOMEM_DE_FERRO` (`vermelho`, `vermelhoClaro`, `vermelhoEscuro`, `vermelhoProfundo`, `dourado`, …) e `CORES_DO_NICK_FURY` (`casacoClaro`, `casacoEscuro`, `peleEscura`, `mangaDaFrente`, …) — inclusive as cores que estavam soltas no meio do código (halo do reator, manga) |
| `COR`, `aleatorio` (cenário) | `CORES_DO_CENARIO`, `sorteioDoCenario` |
| `perna(ctx, ox, oy, qx, levantaPe, escura)`, `braco(…, a1, a2, …)`, `cabeca`, `casaco`, `tronco`, `capacete`, `ombreira` | `desenharPerna(contexto, origemX, origemY, deslocamentoDoQuadril, elevacaoDoPe, ehDeTras)`, `desenharBracoArticulado(…, anguloDoOmbro, anguloDoCotovelo, …)`, `desenharCabeca`, `desenharCasaco`, `desenharTronco`, `desenharCapacete`, `desenharOmbreira` |
| `C.desenharBraco(ctx, x, y, a1, a2, { l1, l2, grossura1, grossura2, cor1, cor2, corLuz })` (ex, ey, mx, my) | `cenaDoCeleiro.desenharBraco(contexto, ombroX, ombroY, anguloDoOmbro, anguloDoCotovelo, { comprimentoDoBraco, comprimentoDoAntebraco, grossuraDoBraco, grossuraDoAntebraco, corDoBraco, corDoAntebraco, corDaLuz })` (cotoveloX/Y, maoX/Y) |
| Campos da pose `dir`, `cabecaYaw`, `cruzados`, `olharBaixo`, `pe`, `bracoF1`/`bracoF2`/`bracoT1`/`bracoT2` | `direcao`, `giroDaCabeca`, `comBracosCruzados`, `olhandoParaBaixo`, `elevacaoDoPe`, `bracoDaFrenteOmbro`/`bracoDaFrenteCotovelo`/`bracoDeTrasOmbro`/`bracoDeTrasCotovelo` (lista comentada no topo de `ator.js`) |
| `OX`, `OY` (camadas), opção de ocioso `so` | `origemX`, `origemY`, `somenteSe` |
| `s`, `f`, `m`, `g`, `cx`, `cy`, `dt`, `ctx`, `t` (relógio), `r` (retângulo), `tr`, `o`, `p`, `v`… | nomes do que representam (`giro`, `colunaNoRosto`, `centroX`, `ombrosY`, `segundosDoQuadro`, `contexto`, `tempo`, `caixaDaCena`, `transicao`, `ocioso`, `pose`, `variante`…) |
| Monitores, braço robótico, drone, robô aspirador | `monitores`/`monitorDoTipo`, `bracoRobotico` (+ `BASE_DO_BRACO_X/Y`, `COMPRIMENTO_DO_BRACO`), `drone.tempo`, `roboAspirador.direcao` |

**Mantidos de propósito (interface compartilhada):** os métodos de `window.CenaDoCeleiro.pixel` (`ret`, `px`, `linha`, `elipse`,
`poligono`, `contornar`, `espelhado`, `criarTela` → `{ canvas, ctx }`, `limiar`, `pontilhar`, `pontilharCampo`, `aleatorio`,
`texto`), porque a caverna secreta usa os mesmos nomes em centenas de chamadas — o significado de cada um está documentado no topo
de `pixel.js`; a API do motor usada pela porta (`iniciar`, `retomar`, `suspender`, `ajustarTamanho`, `ativo`, `diretor`,
`atores`, `quadroUnico`); o campo `t` dos quadros-chave dos gestos (convenção de linha do tempo, também usada pela caverna).
Removidos: o campo morto `luzes.giroft` (nunca lido) e um laço de um item só em `pintarFrente`.

**Evidência de equivalência (assinatura de pixels determinística, ferramenta de teste fora do projeto):** a cena inteira com o
motor real, relógio e sorteio controlados, 600 s de cena em passos de 1/60 s — **3000 quadros e 4356 mudanças de texto dos
balões idênticos** antes e depois (comparado depois de cada arquivo); a caverna, que também usa `pixel.js`: **1251 amostras de
poses e 17 quadros idênticos**. Na Fazenda real: celeiro e caverna abrem e fecham, 1 laço cada, ~60 qps, estado da Fazenda
preservado, nenhum erro. Backup completo antes da missão:
`C:\Users\Tottizin\Backups\The-Farmer-Edu_BACKUP_COMPLETO_ANTES_MISSAO_FINAL_2026-11-22`.
