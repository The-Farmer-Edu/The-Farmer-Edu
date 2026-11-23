# Edição pessoal — a caverna secreta dos personagens

Experiência exclusiva da **edição pessoal** (não faz parte da versão da equipe, publicada no commit `5efa090`).
Clicar na **boca da caverna** da Fazenda leva, com uma transição de íris, a um **esconderijo subterrâneo em pixel art** onde
oito personagens existem e se mexem, cada um no seu canto: **Ultron, Coringa, Venom, Hulk, Doutor Destino, Batman,
Slenderman e Freddy Fazbear**. **Não há diálogos, balões, legendas nem textos** dentro da cena: ela é só imagem.

> **Estado honesto:** a estrutura (entrada, transições, cena, iluminação, animação, carregamento de sprites, desempenho) está
> pronta e testada. **A arte dos oito personagens é PROVISÓRIA**: são sprites de pixel art de verdade (PNG, pixel a pixel,
> sem formas geométricas desenhadas por código), mas feitos como rascunho, sem editor de pixel art nem artista. Eles são
> reconhecíveis, porém **não atingem a qualidade de Floor796**. Ver a seção 8.

---

## 1. Como acessar e testar

1. Abrir a Fazenda (pela aplicação ou direto em `app/modules/fazenda/views/fazenda.html`).
2. Ir até o **morro a noroeste, depois da ponte**: a caverna é a **boca em arco na rocha** onde terminam os trilhos da mina.
   Ela existe desde o começo do jogo (não precisa construir a mina). Uma pista discreta: lá no fundo do túnel há um
   **brilho fraco que muda de cor devagar** (vermelho, verde, roxo, âmbar).
3. **Clicar (ou tocar) na abertura escura.** Arrastar a câmera não conta como clique.
   - Com a mina construída, clicar no **pórtico de madeira, no carrinho ou no depósito** continua abrindo o painel da mina;
     só o clique na **abertura** entra na caverna. O Guardião e a pedra secreta têm prioridade quando estão na frente.
4. Para voltar: **Esc** ou o botão **"⟵ Fazenda"** (canto superior esquerdo).

A caverna **não abre** durante uma invasão (aviso "Agora não: há uma invasão acontecendo lá fora!"), durante uma cena
especial, com o celeiro aberto, ou com o tutorial / painel do Guardião / janela do nome / janela de defesa / tela de
carregamento visíveis.

Pelo console (testes): `farmEduCaverna.entrar()`, `farmEduCaverna.sair()`, `farmEduCaverna.estado()`,
`farmEduCaverna.motivo()` (por que não entra agora; vazio = pode), `CavernaSecreta.estatisticas` (quadros, laços ativos,
ms por quadro).

---

## 2. Onde ficam os módulos

| Arquivo | Papel |
|---|---|
| `views/assets/js/30j-caverna-secreta.js` | **A porta**: alvo de clique na boca, condições, íris, suspensão da Fazenda, teclado, carregamento sob demanda, pista no túnel. Carregado com a Fazenda (é pequeno). |
| `views/assets/css/11-caverna-secreta.css` | Camada da cena, tela ampliada em escala inteira, botão de volta. |
| `views/assets/easter-eggs/caverna/configuracao.js` | Resolução (384×216), posição de cada personagem, plataforma e passarela. |
| `.../caverna/sprites.js` | **Carregador de sprites**: baixa os PNGs e copia partes/quadros do atlas para a tela. |
| `.../caverna/sprites/<id>.png` + `<id>.atlas.js` | Atlas e mapa de cada personagem (gerados). |
| `.../caverna/sprites/_fonte/` | Fontes pixel a pixel (`<id>.txt`), o gerador `gerar-atlas.ps1` e o `LEIA-ME.md` do formato. |
| `.../caverna/efeitos.js` | Mapa de luz, halos, pixels acesos, sistema de partículas. |
| `.../caverna/cenario/caverna.js` | O ambiente (rocha, teto, plataforma, objetos de cada canto) e tudo o que se mexe no cenário. |
| `.../caverna/personagens/ator.js` | Base comum: camadas, comportamentos com relógios próprios, sombra, desenho. |
| `.../caverna/personagens/<id>.js` | Uma definição por personagem (oito arquivos). |
| `.../caverna/motor.js` | O laço único da cena, a ordem de desenho e a escala na tela. |

A caverna reaproveita da cena do celeiro, **sem alterá-la**: a íris (`animarIris`, `#iris-do-celeiro`), a suspensão
(`FAZENDA_SUSPENSA`, seção 31), a pausa/retomada dos sons e as ferramentas de pixel art de `easter-eggs/vingadores/pixel.js`
(usadas só no cenário; baixadas junto se o celeiro ainda não tiver sido aberto).

Arquivos da equipe tocados (mínimo): `fazenda.js` (+1 linha na lista), `fazenda.html` (+1 link de CSS), `26-invasoes.js`
(`#caverna-secreta` na lista que adia invasões) e `23-audio.js` (uma condição: o clique na abertura não abre o painel da mina).

---

## 3. Entrada, transições e preservação do estado

- **Entrar:** a Fazenda é suspensa **no instante do clique** → íris fecha sobre a boca da caverna (o último quadro da Fazenda
  fica parado na tela) → arquivos baixados (só na 1ª vez) → a cena aparece → íris abre no centro da cena.
- **Sair:** íris fecha na cena → o laço da cena é cancelado → a Fazenda é redesenhada **uma vez, sem simular** (vale se a
  janela mudou de tamanho) → íris abre sobre a boca da caverna → só então a Fazenda volta a andar e os sons voltam.
- Resultado medido: **hora do jogo, câmera, trabalhadores (posição exata), XP, recursos, construções, danos, invasão e o
  estado salvo inteiro voltam idênticos** (o único campo que muda é `estado.atividade.ultima`, o carimbo de "última atividade" gravado de propósito no clique, como no celeiro), sem o avanço de ~1,9 s que a cena do celeiro ainda tem nas suas íris.
- Durante a cena, nenhuma tecla chega à Fazenda (WASD, atalhos); só Tab (foco) passa.

## 4. Como os personagens são carregados e organizados

1. A porta baixa, em ordem: `configuracao.js` → os 8 `*.atlas.js` → `sprites.js` → `efeitos.js` → `cenario/caverna.js` →
   `personagens/ator.js` → as 8 definições → `motor.js`. Depois baixa os 8 PNGs (`C.sprites.carregar`).
2. Cada atlas descreve **partes** (`base`, `cabeca`, `capaE`, `lingua`...) e, para cada parte, os **quadros**
   `[x no atlas, y no atlas, largura, altura, x no personagem, y no personagem]`. Trocar o PNG por arte nova com o mesmo
   mapa não exige mudar código.
3. Cada definição (`personagens/<id>.js`) chama `C.registrarPersonagem({...})` com:
   - `camadas`: as partes em ordem de desenho; uma camada pode **seguir** outra (`{ parte: 'cabeca', segue: 'tronco' }`)
     e começar **oculta** (`{ parte: 'lingua', oculta: true }`);
   - `continuos`: movimentos sempre ativos (respiração, capa);
   - `comportamentos`: ações ocasionais `{ nome, grupo, intervalo: [min, max], duracao: [min, max], primeira?, aplicar(e, f, variante, t) }`;
   - `luzes(luz, e, t, p)` e `brilhos(ctx, e, t, p)`: o que ele acrescenta ao mapa de luz e o que emite (olhos, energia).

### Como adicionar um personagem novo

1. Escrever `sprites/_fonte/<id>.txt` (formato no `LEIA-ME.md` da pasta) e rodar `gerar-atlas.ps1 -Somente <id>`.
2. Pôr a posição em `C.POSICOES` (`configuracao.js`): `<id>: [x dos pés, linha do chão]`.
3. Criar `personagens/<id>.js` com `C.registrarPersonagem({ id: '<id>', camadas: [...], comportamentos: [...] })`.
4. Acrescentar `caverna/sprites/<id>.atlas.js` e `caverna/personagens/<id>.js` em `CAVERNA_SECRETA_CONFIG.arquivos` e o id em
   `CAVERNA_SECRETA_CONFIG.personagens` (`js/30j-caverna-secreta.js`). O motor ordena por profundidade sozinho.

## 5. Como funcionam as animações

- A pose de cada personagem é **amostrada a 12 quadros por segundo** (passo de pixel art); deslocamentos são inteiros
  (1 px). O cenário, a luz e as partículas andam a 60 qps.
- Cada ação ocasional tem **relógio próprio** (próxima vez sorteada dentro do intervalo; a primeira também é sorteada) e um
  **grupo** (duas ações não disputam a mesma cabeça). Ninguém sincroniza com ninguém (medido: em 40 s, **nenhum instante**
  em que os oito mudaram juntos).
- Por personagem:

| Personagem | Canto | O que ele faz |
|---|---|---|
| **Ultron** | plataforma, entre servidores (luz vermelha) | cabeça em trancos mecânicos de 1 px e varredura, ombros (tronco inteiro) que descem levando cabeça e braços, cada antebraço erguendo a partir do cotovelo com o seu relógio, punhos que fecham, dedos que abrem na descarga de energia com faíscas; olhos, boca e costura do peito pulsando |
| **Coringa** | chão, à esquerda (néon roxo/verde, cartas, caixa-surpresa, balão) | cabeça que inclina, gargalhada muda (boca aberta, ombros sacudindo), trancos imprevisíveis, carta girando entre os dedos, balanço irregular do peso |
| **Venom** | chão, junto ao cano que pinga gosma (luz azul fria) | respiração pesada, mandíbula que mastiga (quadro de 1 px), bocarra que abre (2 px) com a língua em sequência própria de 4 formas presa à mandíbula, cabeça farejando, olhos que se estreitam, garras que fecham e abrem (relógio por mão), antebraços contraindo, ameaça (inclina, abre as garras e a boca), baba pingando |
| **Hulk** | centro, entulho e viga torta (luminária âmbar) | respiração em três tempos (quadro de inspiração desenhado: ombros e peito sobem, abdômen estica; expiração desce 1 px), cada punho contraindo com o antebraço (relógio por mão), rosnado, olhar de lado, trancos de cabeça, encolher os ombros, troca de peso que solta poeira do teto |
| **Doutor Destino** | plataforma, altar com braseiros verdes e estandarte | capa pesada caindo reta atrás do corpo (só as dobras andam), respiração do capuz, máscara girando devagar dentro do capuz, fendas acendendo, encarar, e a conjuração: ergue o braço direito (repouso → subindo → erguido → subindo → repouso) com a palma emitindo energia verde |
| **Batman** | passarela de aço no alto, computador azul | capa reagindo às rajadas (abas com atraso), vigia girando a cabeça, olhar para baixo, assentar o peso; lentes refletindo a tela |
| **Slenderman** | recanto escuro da esquerda, entre estalagmites | inclinação de cabeça lenta demais e longa, dedos que se alongam, tentáculos que surgem atrás e somem, falha de imagem (faixas deslocadas + estática), quase some no escuro |
| **Freddy** | palquinho de festa (holofote, bandeirinhas, painel de estrelas) | piscar, trancos de cabeça de animatrônico, mandíbula em ritmo de cantoria muda, erguer o microfone, "modo noturno" (olho preto com pupila branca quando o holofote falha) |

- **Ambiente** (cada um com o seu ritmo): luar pela fenda do teto com poeira nos fachos, lâmpadas nos cabos (uma falha),
  LEDs dos servidores, monitor com varredura vermelha, drone quebrado tentando religar, cabo soltando faíscas, ventoinha,
  braseiros com chamas e brasas verdes, runas acendendo em sequência, computador com linhas rolando, morcegos que cruzam o
  teto, luminária que balança, gotas d'água das estalactites com respingo, gosma pingando do cano, vapor do registro,
  caixa-surpresa (manivela → mola → recolhe), balão balançando, néon falhando, bandeirinhas trocando de cor, névoa rasteira
  em duas velocidades, carrinho de mina abandonado nos trilhos.

## 6. Iluminação e efeitos

- **Mapa de luz** do tamanho da cena: começa na cor ambiente da caverna e cada fonte soma um sprite de luz **em anéis de
  degraus** (sem degradê liso); o mapa é **multiplicado** sobre a cena. Cada canto tem a sua temperatura de cor.
- **Brilhos** aditivos pequenos depois do mapa (o que emite luz não escurece). Partículas com quantidade máxima fixa.
- Sprites de luz são calculados uma vez (cache) e reaproveitados.

## 7. Arquitetura e desempenho

- **Um único `requestAnimationFrame`**, que só existe com a cena aberta; `suspender()` o cancela e `retomar()` nunca cria
  um segundo. O relógio da cena só anda com ela aberta. A Fazenda fica suspensa a visita inteira.
- Medido (Chrome com GPU, 1400×900, escala 3×): **60 qps, 1,26 ms por quadro**; com a CPU 4× mais lenta, **60 qps,
  8,47 ms por quadro**. Fazenda antes/depois de 4 visitas: 43,6 → 44,0 qps (CPU normal) e 18,7 → 18,1 qps (CPU 4×).
  Memória estável (87,5 → 87,5 MB). 0 laços ativos depois de sair.

## 8. Assets: o que é definitivo e o que é provisório

| Asset | Origem | Situação |
|---|---|---|
| Sprites de 4 personagens (Coringa, Batman, Slenderman, Freddy) (`sprites/*.png`) | Desenhados pixel a pixel como texto (`_fonte/*.txt`) e convertidos pelo gerador | **PROVISÓRIOS** (rascunho; ver abaixo) |
| Sprites do Ultron, do Doutor Destino, do Hulk e do Venom | Mesmo processo, **reconstruídos do zero** duas vezes (v2 e v3: anatomia completa, paletas planejadas, luz lateral) | **Refinados (v3)**: bem acima dos rascunhos, ainda abaixo de Floor796 (ver abaixo) |
| Cenário, luz, partículas | Pixel art gerada por código (ambiente, não personagem) | Funcional; pode ganhar pintura à mão |
| Gerador, carregador, motor | Código próprio | Definitivos |

**Licenças:** Ultron, Hulk, Venom e Doutor Destino são da Marvel; Coringa e Batman, da DC; Freddy Fazbear, de Five Nights
at Freddy's (Scott Cawthon); Slenderman é um personagem da internet (criado por Eric Knudsen) com direitos disputados.
Tudo aqui é **fan art para uso pessoal e não comercial**; não serve para publicação ou distribuição. Nenhuma imagem foi
copiada de outro lugar.

### Assets que ainda precisam ser produzidos (para a qualidade desejada)

Sprites finais por um artista de pixel art (Aseprite ou similar), **mesmo tamanho de tela** e **mesmas partes** dos
rascunhos (ou animação quadro a quadro, ver `_fonte/LEIA-ME.md`), luz vinda de cima, contorno escuro de 1 px, paleta
própria de cada personagem com 4–6 tons por material:

| Personagem | Tela | Partes / quadros que a cena já usa | O que a arte final precisa acrescentar |
|---|---|---|---|
| Ultron | **38×58 (v3)** | base, tronco, cabeça, antebraço E, antebraço D, mão E (3: repouso, punho, dedos abertos), mão D (3) | já tem: ombreiras em duas placas, peitoral largo, abdômen em placas, cotovelos e joelhos articulados, mãos com nós e dedos, luz lateral; faltam: mais quadros por gesto (giro real da cabeça, braço que se dobra), detalhes finos (parafusos, cabos) |
| Coringa | 24×46 | base, tronco, cabeça (3: neutra, inclinada, gargalhada), mão D (3: sem carta, carta, carta virada) | rosto com expressão e cabelo com volume, terno com caimento, mãos com dedos |
| Venom | **44×56 (v3)** | base, tronco, cabeça (2: neutra, caça), mandíbula (3), língua (4), antebraço E/D, mão E/D (3) | já tem: postura curvada, cabeça grande com olhos brancos, bocarra com gengiva e presas, pescoço escuro, aranha, garras, contraste próprio (realce frio); faltam: textura orgânica, dentes mais variados, mais quadros de língua e de cabeça |
| Hulk | **50×56 (v3)** | base, tronco (2), cabeça (3), punho E/D (2) | já tem: cabeça destacada com pescoço, tronco em V, vão entre braço e tronco, músculos por planos de tom, bíceps/cotovelo/antebraço na silhueta; faltam: rosto mais expressivo, tríceps e veias, braços que se dobram |
| Doutor Destino | **36×58 (v3)** | base, cabeça (3), braço D (3: repouso, subindo, erguido), capa E (2), capa D (2) | já tem: capa vertical de tecido pesado, máscara rígida sem aspecto de caveira, ombreiras, túnica com dobras, cinto e fivela, manoplas, botas, luz lateral, braço que se ergue; faltam: capa animada quadro a quadro (balanço da barra), mais quadros na subida do braço, rebites e textura |
| Batman | 30×46 | base, cabeça (3), capa E (2), capa D (2) | capa com dobras e recorte, braços e luvas com aletas, emblema nítido, pose de vigia agachada |
| Slenderman | 22×72 | base, cabeça (3), mão E (2), tentáculos (2) | caimento do terno, inclinação de corpo inteiro, tentáculos com forma orgânica |
| Freddy | 32×47 | base, olhos (3: normal, piscando, noturno), cabeça, mandíbula, braço D | textura de pelúcia gasta, cartola com fita, microfone nítido, junta da mandíbula, braço esquerdo |

Também: **mais quadros por gesto** (hoje cada gesto tem 1–3 quadros + deslocamentos de 1 px; Floor796 usa animações
desenhadas quadro a quadro, com 6–12 quadros e deformação de tecido).

## 9. Testes executados (Chrome de teste com GPU, modo local `file://`, save de referência)

| # | Teste | Resultado |
|---|---|---|
| 1 | Entrada por **clique real** do mouse na abertura | ✅ abriu; painel da mina **não** abriu |
| 1b | Clique real na **viga do pórtico** da mina | ✅ abriu o painel da mina (como antes), caverna fechada |
| 1c | Clique real na grama | ✅ nada aconteceu |
| 2 | Transição de entrada | ✅ estado `abrindo` com a íris visível e a Fazenda já suspensa |
| 3 | Os oito personagens aparecem | ✅ `ultron, coringa, venom, hulk, destino, batman, slenderman, freddy` (foto) |
| 4 | Identidade visual própria | ✅ reconhecíveis na foto e nos recortes ampliados — **arte provisória** |
| 5 | Animações independentes | ✅ 40 s amostrados: de 35 (Batman) a 142 (Coringa) mudanças; nenhum instante com os 8 juntos |
| 6 | Sem diálogos ou textos | ✅ o único texto na camada é o botão "⟵ Fazenda Esc"; a cena não tem balão nem legenda |
| 7 | Iluminação e efeitos | ✅ foto: luz de cada canto, brilhos alinhados (olhos, fendas, lentes) |
| 8 | Esc fecha | ✅ `fechando` → `fechada` |
| 9 | Botão de saída | ✅ 4 saídas pelo botão |
| 10 | Entrar e sair repetidamente | ✅ 5 entradas: sempre 1 laço, 60 qps, 22 scripts (nenhum baixado de novo); 0 laços fora |
| 11 | Celeiro continua funcionando | ✅ entra, 1 laço do celeiro, sai; caverna recusa enquanto ele está aberto |
| 12 | (retirado: o easter egg do gato foi removido da edição pessoal) | — |
| 13 | Invasões e eventos não avançam | ✅ campos da invasão idênticos depois de 4 s dentro; caverna recusa durante invasão |
| 14 | Estado mantido | ✅ hora, câmera, trabalhadores, XP, recursos, níveis, danos, estado salvo inteiro: idênticos |
| 15 | Console sem erros | ✅ nenhum erro em todos os testes acima |
| 16 | Desempenho | ✅ ver seção 7 |
| R | Regressão da Fazenda (11 testes: salvar, regressão etapa 2, misteriosa, abdução, lenhador, clima, objetivos, invasões A/B/C-noite, noite A) | ✅ nenhum erro de JS; resultados iguais aos anteriores (salvar idêntico; reparo 450; recompensa conferida; invasão 0,4 s após anoitecer). Só mudam valores sorteados (prédio-alvo da invasão) e carimbos de hora |

**Não testado:** a Fazenda pela aplicação PHP com login e banco (as rotas `fazenda/arquivo` usadas pelos PNGs e scripts
não foram exercitadas nesta sessão), celular/toque de verdade, aparelho fraco de verdade (só CPU 4× emulada).

## 10. Limitações que permanecem

- **Arte provisória** dos oito personagens (seção 8). É o principal passo que falta para a qualidade de Floor796.
- O relógio visual do Three.js (`relogio.elapsedTime`: água, nuvens) continua contando durante a visita, como já acontece
  ao trocar de aba; o **estado do jogo** não muda.
- A pista no fundo do túnel é discreta; de longe, com zoom afastado, ela quase não aparece.
- A API de console do celeiro (`farmEduCeleiro.entrar()`) não sabe da caverna; pela interface não há como abrir os dois
  (a camada da caverna cobre a Fazenda), e a caverna recusa abrir com o celeiro aberto.
- **Freddy:** o braço do microfone (parte `bracoD`) foi corrigido na missão 3/4 (atlas regenerado e conferido na cena).

## 11. Missão de refino artístico — Ultron e Doutor Destino (v2)

- Fontes reescritas do zero (`_fonte/ultron.txt`, `_fonte/destino.txt`), atlas regenerados só para os dois.
- Telas maiores para caber anatomia: Ultron 26×48 → **34×58**, Destino 32×48 → **36×58** (o motor lê o tamanho do atlas; os
  pés continuam na mesma linha do chão e cada um cabe no seu canto: Ultron entre os racks, Destino entre os braseiros).
- Ultron ganhou partes novas (`tronco`, `antebracoE/D`, `maoE/D` com 3 quadros) para ombros e braços se mexerem presos à
  armadura; Destino ganhou a máscara girando dentro do capuz (quadros feitos deslocando a máscara 1 px, com a sombra do
  capuz preenchendo), a palma acesa e a capa com dobras que andam.
- `personagens/ultron.js` e `personagens/destino.js` atualizados (nomes das partes, pontos dos brilhos, gestos novos e, no
  Ultron, uma luz fria de preenchimento vinda dos servidores para o prateado não sumir sob a luz vermelha).

## 12. Missão de refino v3 — Ultron, Doutor Destino (e remoção do easter egg do gato)

- **Ultron v3 (38×58):** ombreiras em duas placas sobrepostas, peitoral mais largo, abdômen em três faixas de placas que
  afinam até a cintura, braços e antebraços mais grossos, cotovelos e joelhos com junta, mãos com nós e quatro dedos.
  Luz lateral: a fonte é montada com a metade esquerda + espelho + uma passada de sombra no lado direito (um tom a menos por
  material). Mesma altura; a tela ficou 4 px mais larga (ele fica na frente das bordas dos racks).
- **Doutor Destino v3:** a capa deixou de abrir como asa: nasce atrás das ombreiras, cai **reta** (a borda de fora é
  vertical e estreita levemente na barra), aparece como faixa estreita ao lado dos braços e como forro escuro atrás e
  entre as pernas; a animação só desliza as dobras. Máscara com fendas horizontais, ponte do nariz, rebites e fenda reta
  na boca (sem a grade de "dentes"). Ombreiras de metal. **Conjuração com o braço**: parte `bracoD` com 3 quadros (repouso,
  subindo com a mão na altura do ombro, erguido com a palma acima do ombro); a energia verde acompanha a palma.
- Os sprites dos outros seis personagens não mudaram (hashes conferidos antes e depois).

## 13. Missão de refino — Hulk e Venom (v2)

- **Hulk v2 (40×53 → 50×56):** mais largo do que alto, centro de gravidade baixo; cabeça larga afundada no trapézio,
  sobrancelha pesada, dentes cerrados e mandíbula larga; deltoides redondos, peitoral em dois volumes com a sombra
  embaixo, seis gomos, oblíquos; bíceps e antebraços enormes com a prega do cotovelo; punhos com nós e dedos; calça roxa
  com dobras e barra rasgada; luz vinda da esquerda.
- **Venom v2 (36×50 → 44×58):** silhueta de criatura alta e esguia (cintura fina em V, membros longos), diferente do Hulk;
  cabeça larga arredondada com queixo em V, olhos brancos enormes inclinados, bocarra de bochecha a bochecha (gengiva,
  dentes de cima e de baixo, interior vermelho), aranha branca no peito, mãos com dedos longos e garras.
- **Quadros desenhados em vez de só deslocar:** inspiração do Hulk (o peito sobe e o abdômen estica), punho contraído
  com o antebraço, rosnado com a mandíbula caída; no Venom, mandíbula em dois estágios, língua com quatro formas em
  sequência, garras fechando e abrindo, olhos de caça.
- **Limite do gerador** (vale para todos): o formato é texto pixel a pixel e as poses são montadas por regiões; não há
  rotação nem deformação de membros, então gestos amplos (dobrar o braço, virar o corpo) exigem desenhar uma região
  inteira nova. Para o padrão Floor796 (6–12 quadros desenhados por gesto, tecido e músculo deformando), o caminho é um
  editor de pixel art (Aseprite ou similar) exportando o mesmo atlas: o carregador já aceita qualquer número de quadros por
  parte (`_fonte/LEIA-ME.md`).
- **Composição:** com 58 de altura, a cabeça do Venom chega à borda da plataforma, logo abaixo dos pés do Destino.
- **Defeito conhecido:** os comentários das fontes `ultron.txt` e `destino.txt` (missão anterior) têm acentos corrompidos
  (o script de autoria foi lido como ANSI). Só os comentários; pixels e atlas estão corretos. Corrigido no processo para
  Hulk e Venom.

## 14. Correção — Hulk e Venom (v3), avaliada na escala real

- **Por que a v2 falhou na tela:** o Hulk tinha abdômen tão largo quanto o peito (sem V), braços colados no tronco,
  cabeça enterrada no trapézio e músculos separados por linhas escuras de 1 px (em tamanho real, uma grade); o Venom tinha
  a paleta inteira entre o preto e o azul escuro (o mapa de luz multiplicava tudo para baixo), pouca área de boca e a
  cabeça sem separação dos ombros.
- **Hulk v3:** cabeça maior saindo dos ombros, com pescoço; tronco em V; vão entre braço e tronco; músculos por planos de
  tom (quase sem contorno interno); bíceps, cotovelo e antebraço desenhados na silhueta; dentes cerrados contínuos.
- **Venom v3:** postura curvada (ombros altos, cabeça mais baixa: a cabeça não encosta mais nos pés do Destino, sem mudar a
  posição na configuração); pescoço escuro separando a cabeça; olhos grandes, bocarra de 9 linhas; um tom de realce frio
  quase branco só nos pontos altos (contraste no próprio sprite); uma luz de recorte neutra vinda da esquerda no arquivo do
  personagem (em vez de mais azul).
- **Avaliação:** cada sprite foi conferido em 1×, 3× e 6× sobre o fundo da caverna e na captura da cena inteira.

## 15. Missão 3/4 dos oito personagens — interrompida por limitação técnica (18/11/2026)

- **O que foi tentado:** a primeira dupla (Ultron) foi construída em 3/4 com uma ferramenta de autoria em camadas
  (contornos à mão por linhas-chave, rampa de luz, detalhes à mão, quadros interpolados entre poses-chave). Resultado:
  cabeça em bola, tronco e braços como caixas sombreadas, gesto como um bloco deslizando — **pior** que o frontal aprovado e
  exatamente o "formas geométricas no lugar da arte" que a direção proíbe.
- **Diagnóstico:** o processo disponível (pixels escritos como texto ou contornos preenchidos por ferramenta, sem desenhar
  vendo o resultado) funciona para figuras frontais simétricas, mas não produz 3/4 com escorço, sobreposição e volume.
- **Decisão:** nenhum personagem aprovado foi substituído (o Ultron frontal foi restaurado, idêntico ao aprovado). A
  tentativa fica registrada no scratchpad da sessão, fora do projeto.
- **Solução técnica:** desenhar os oito em 3/4 num editor de pixel art (Aseprite) e importar com
  `sprites/_fonte/importar-aseprite.ps1` (camada = parte, quadro = quadro), testado contra o atlas do Venom. Os estudos
  de direção ficam em `_estudos/`.
- **Feito nesta missão:** comentários das fontes do Ultron e do Destino com os acentos corrigidos (pixels idênticos);
  **braço do microfone do Freddy funcionando** (atlas regenerado com a parte `bracoD`; o gesto conferido na cena real).

## 16. Os oito personagens como BONECOS ARTICULADOS — a técnica do celeiro (18/11/2026)

- **Correção de premissa:** a cena do celeiro **não** usa Three.js. Tony Stark e Nick Fury são bonecos 2D em pixel art
  desenhados por código (`easter-eggs/vingadores/personagens/ator.js` + `homem-de-ferro.js` / `nick-fury.js`); o Three.js do
  `30i` só detecta o clique no prédio. Com a sua aprovação, os oito personagens da caverna foram refeitos com essa MESMA técnica.
- **`personagens/boneco.js`** — adaptação direta do `ator.js` do celeiro: três camadas (trás, corpo, frente) com contorno próprio
  (`P.contornar`), personagem desenhado olhando para a direita e espelhado quando olha para a esquerda, membros de dois
  segmentos por ângulo (`C.membro`, como `C.desenharBraco`), gestos por quadros-chave suavizados, comportamentos ociosos com
  relógios próprios, gestos automáticos com relógio próprio e **pausa de 3–7 s depois de cada gesto**, pose amostrada a 12 qps.
  A figura só é recomposta quando a pose muda (12×/s). Ele intercepta `C.criarPersonagem` para definições com `boneco: true`:
  motor, cenário e configuração **não mudaram**.
- **Personagens** (um arquivo cada em `personagens/`), cada um com o seu corpo e a sua direção:
  Ultron (→, encara o Destino), Destino (←, capa pesada vertical na camada de trás, conjuração com o braço erguendo pelo ombro e
  pelo cotovelo), Hulk (→, tronco em V curvado, pescoço e trapézio), Venom (←, predatório, pescoço grosso levando a cabeça,
  mandíbula móvel, língua, aranha simétrica, garras), Batman (←, vigia na passarela, capa com balanço próprio), Coringa (→, torto,
  gargalhada, carta), Slenderman (→, quase de perfil, tentáculos, falha de imagem), Freddy (←, microfone levado à boca, mandíbula,
  olhos noturnos).
- **Sprites:** os atlas PNG da caverna (`sprites/`) não são mais carregados (`CAVERNA_SECRETA_CONFIG` não os lista); os arquivos
  continuam no disco e no backup `The-Farmer-Edu_BACKUP_ANTES_BONECOS_ESTILO_CELEIRO_2026-11-18`.
- **Desempenho medido:** 60 qps, ~1,6–1,8 ms por quadro (CPU normal); com a CPU 4× mais lenta, 56 qps e ~11 ms por quadro.
  Fazenda antes/depois: mesmo FPS; memória estável.

## 17. Orientação dos personagens e falas ocasionais (20/11/2026)

- **Orientação revisada:** Ultron com a cabeça girada para quem olha (dois olhos, nariz, boca em grade, mandíbula dos dois
  lados), ainda encarando o Destino; Venom com os dois olhos brancos; Freddy com o rosto aberto (os dois olhos, focinho no meio,
  mandíbula sob o focinho); Slenderman redesenhado DE FRENTE, encarando o observador, com tentáculos dos dois ombros; Batman
  olhando para baixo, para o Coringa; Coringa com a cabeça erguida, provocando o Batman. Hulk × Venom e Ultron × Destino
  continuam se encarando; Freddy e Slenderman ficam voltados para o observador.
- **Falas (`caverna/falas.js`, estilos em `css/11-caverna-secreta.css`):** balões pixelados (fonte VT323, borda em pixels,
  rabicho em degrau, cor de cada personagem na borda esquerda) acima das cabeças. Frases no campo `falas` de cada
  personagem (`personagens/<id>.js`): Batman "Eu sou rico."; Destino "Eu sou... Destino!"; Venom "QUERO GALINHAS!"; Hulk
  "Deus fraco."; Coringa risadas; Slenderman "..."; Ultron seis frases frias/filosóficas no espírito de *Era de Ultron*;
  Freddy cinco falas de palco.
- **Regras:** relógio próprio por personagem com variação aleatória; no máximo dois balões; sem sobreposição (sobe o balão ou
  espera); sem corte nas bordas; a animação continua durante a fala (às vezes com um gesto); respostas raras (Batman → Coringa,
  Hulk ↔ Venom, Ultron → Destino) com prioridade e nova tentativa por até 2,5 s. Tudo usa o TEMPO DA CENA (sem setTimeout de
  agendamento): com a caverna fechada nada acontece; ao sair, o motor chama `C.falas.limpar()`.
- **Motor:** três chamadas a `C.falas` (iniciar, atualizar, limpar ao suspender). Nada mais mudou na arquitetura.

## 18. Orientação na cena: rostos e frentes para a câmera (21/11/2026)

- **Problema:** a vista lateral (cabeça de perfil, tronco de lado) fazia Hulk, Venom, Batman, Coringa e Destino parecerem de
  costas ou com o rosto escondido na escala real. (O alinhamento cabeça/tronco da seção anterior não resolvia isso.)
- **Câmera e convenção:** a câmera olha a cena de frente; cada boneco é desenhado olhando para a direita local e espelhado com
  `dir: -1`. Todos os cinco passaram para **3/4 ABERTO**, o mesmo padrão do Ultron e do Freddy: tronco de frente com a linha
  do meio (`m = cx + 1`) puxada 1 px para o lado do olhar, lateral de longe na sombra, os dois ombros visíveis; cabeça de frente
  com os DOIS olhos, rosto deslocado para o lado de quem o personagem encara. Nada foi girado 180° nem espelhado de novo; os
  detalhes assimétricos (luz no peito de perto, bochecha de longe na sombra) seguem o lado do olhar.
- **Por personagem:** Hulk — peitorais, esterno, seis gomos e oblíquos de frente, trapézio dos dois lados, pescoço grosso
  centrado, rosto com testa pesada, dois olhos voltados para o Venom; braço de perto 1 px mais para fora (não cobre o peito).
  Venom — tronco largo de frente com a aranha no meio, ombros erguidos, cabeça grande entre os ombros com os dois olhos e a
  bocarra de frente; pernas em agachamento de frente (joelhos para fora) no lugar da passada de perfil. Batman — capuz com as
  duas orelhas e as duas fendas, queixo, morcego no meio do peito, capa aparecendo dos dois lados. Coringa — rosto com os dois
  olhos fundos, sorriso de canto a canto, cabelo verde, paletó aberto com colete, gravata e as duas lapelas. Destino — máscara
  de frente (dois olhos, ponte do nariz, boca, rebites) dentro do capuz, túnica e cinto com o disco no meio, as duas ombreiras.
- **Brilhos:** os olhos do Destino e as fendas do Batman agora acendem nos DOIS olhos (`locais.olhos` virou uma lista de dois
  pontos; só os próprios arquivos usam esse campo). Âncoras dos balões do Hulk e do Venom subiram para as cabeças novas.
- **Sem mudança:** gestos, poses, ociosos, falas, Ultron, Slenderman, Freddy, `boneco.js`, `falas.js`, motor, cenário, celeiro,
  invasões. Backup em `C:\Users\Tottizin\Backups\The-Farmer-Edu_BACKUP_ANTES_ORIENTACAO_CENA_2026-11-21`.

## 19. Poses de lado no padrão do Nick Fury do celeiro (21/11/2026)

- **Motivo:** a seção 18 deixou os personagens de frente demais para a câmera; a versão anterior a ela, de perfil demais. A
  referência passou a ser o Nick Fury (`vingadores/personagens/nick-fury.js`, vista `lado`).
- **A lógica do Fury, medida no código e nas capturas:** a SILHUETA do tronco continua larga e quase simétrica; a linha do meio
  e tudo o que é da frente do corpo (camisa e lapelas no Fury; reator no Tony) vai ~2 px para o lado do olhar. A cabeça fica em
  3/4: olhos, nariz e boca na metade da frente (o nariz sai do contorno), nuca, orelha e cabelo na metade de trás. Ombros na
  mesma altura, braço de longe na camada de trás, braço de perto na da frente.
- **Aplicação:** em cada arquivo, `s` é o centro da silhueta e `m` o meio da frente do tronco (2–3 px para o lado do olhar). Hulk
  foi o personagem de teste (comparado lado a lado com o Fury) e depois vieram Coringa, Batman, Destino e Venom. O Venom ficou de
  lado em postura predatória: os dois joelhos dobrados para a frente, tronco inclinado, cabeça projetada à frente com a boca e
  os olhos na frente, aranha em perspectiva. As capas do Batman e do Destino voltaram a cair pelas costas.
- **Sem mudança:** gestos, poses, ociosos, falas, Ultron (já próximo do padrão do Tony), Slenderman, Freddy, `boneco.js`,
  `falas.js`, motor, cenário, celeiro, invasões. Backup em
  `C:\Users\Tottizin\Backups\The-Farmer-Edu_BACKUP_ANTES_POSE_FURY_2026-11-21`.

## 20. Correção artística direcionada — Venom, Hulk, Batman e Coringa

- **Causa comum (Venom e Hulk):** os lados "de perto" e "de longe" estavam invertidos no corpo. Em 3/4, o ombro e o braço de
  perto ficam no meio/atrás da silhueta (camada da frente) e o ombro de longe aparece na frente, meio escondido atrás do peito
  (camada de trás); o peitoral de perto é o largo e o de longe fica encurtado na borda da frente. Estava ao contrário: o braço de
  perto saía da borda da frente, logo abaixo da cabeça.
- **Venom:** braço de perto preso ao ombro no meio da silhueta; braço de longe na frente, atrás do peito, com as garras bem
  abaixo da cabeça; cabeça projetada à frente e acima dos ombros, com pescoço e sombra sob a mandíbula; a língua sai da bocarra
  para a FRENTE (na direção do Hulk), ondulando, longe dos braços. Aranha, olhos, dentes e mandíbula preservados.
- **Hulk:** tronco em 3/4 com o peito estufado para o Venom e as costas na sombra; peitoral de perto largo, gomos de perto
  largos; trapézio descendo das costas ao pescoço, pescoço e cabeça inclinados para a frente; braço de perto ao lado do corpo,
  punho de longe aparecendo à frente.
- **Batman:** cabeça redesenhada pixel a pixel (grade) e encaixada sobre o pescoço: capuz simétrico com as duas orelhas iguais,
  fendas na altura certa, nariz do capuz, mandíbula em diagonal e queixo separado do pescoço. Corpo, capa e gestos intocados.
- **Coringa:** cabeça em grade encaixada sobre o pescoço, virada para o mesmo lado do tronco (cabelo verde atrás, olhos, nariz
  comprido e sorriso na frente); braços na mesma lógica de 3/4; na gargalhada, a mão na barriga passou para o braço de perto.
- **Sem mudança:** Ultron, Destino, Slenderman, Freddy, `boneco.js`, `falas.js`, motor, cenário, celeiro, invasões. Backup em
  `C:\Users\Tottizin\Backups\The-Farmer-Edu_BACKUP_ANTES_CORRECAO_4_PERSONAGENS_2026-11-21`.

## 21. Hulk final e legibilidade do código da caverna (22/11/2026)

### Hulk
- **Problema:** bíceps e antebraço eram elipses fixas que não giravam com o braço (peças "deslizando"), o punho era um
  quadrado sempre reto, o cotovelo do braço de longe era um disco escuro solto, e dois gestos tinham ângulos errados
  (flexionar dobrava o antebraço para baixo e para trás; socar a palma deixava os dois antebraços pendurados).
- **Correção:** `desenharBracoMusculoso` em `personagens/hulk.js` calcula todo o volume na direção de cada segmento (bíceps na
  face da frente, tríceps atrás, cotovelo arredondado, antebraço que afina no pulso, punho orientado pelo antebraço) e o
  deltoide cobre a raiz do braço. Novos ângulos: repouso com o cotovelo levemente dobrado; flexionar = braço de perto contraído
  à frente do abdômen + braço de longe com o antebraço erguido; socar a palma = punho de perto batendo na mão de longe.

### Nomes no código da caverna
- **Padrão:** `cavernaSecreta` (= `window.CavernaSecreta`), `ferramentasPixel` (= `window.CenaDoCeleiro.pixel`), `paletaCores`
  com nomes de cor por personagem, `camadas` { tras, corpo, frente, origemX, origemY }, `pose`, `tempo`, `contexto`,
  `centroDaSilhuetaX` / `meioDaFrenteX` / `ombrosY` / `cabecaX` / `cabecaY`, `bracoDePertoOmbro` / `bracoDePertoCotovelo` /
  `bracoDeLongeOmbro` / `bracoDeLongeCotovelo` (Slenderman, de frente: `bracoDireito…` / `bracoEsquerdo…`).
- **Funções renomeadas:** `C.membro` → `cavernaSecreta.desenharMembro` (opções `comprimentoSuperior`, `grossuraInferior`,
  `corDoRealce`, `corDaJunta`...; devolve `{ articulacao, extremidade, anguloFinal }`), `C.rad` → `grausParaRadianos`,
  `C.entre` → `pontoEntre`, `C.sorteio` → `sortearEntre`, `C.limiar` → `limiarPontilhado`, `C.brilho` → `desenharBrilho`,
  `C.pixelAceso` → `acenderPixel`; campo `dir` → `direcao`; `estado.t` → `estado.tempo`; telas de `novaTela` = `{ tela, contexto }`.
- **Mantidos por compatibilidade:** os métodos do `pixel.js` do celeiro (`ret`, `px`, `linha`, `elipse`, `poligono`,
  `contornar`, `espelhado`, `criarTela` → `{ canvas, ctx }`), porque o celeiro não pode ser modificado; o campo `t` dos
  quadros-chave dos gestos (convenção de linha do tempo igual à do celeiro); `x`/`y`/`vx`/`vy`/`max` das partículas e
  `x0`/`x1`/`y0`/`y1` de retângulos (coordenadas); as letras das grades de pixel das cabeças do Batman e do Coringa (legenda ao
  lado de cada grade); o formato dos atlas; ids do DOM, classes CSS e a interface `farmEduCaverna`.
- **Fora do escopo (nesta seção):** o celeiro (`js/30i-cena-do-celeiro.js`, `easter-eggs/vingadores/`) tinha o mesmo estilo
  abreviado; ele foi refatorado depois, em 23/11/2026, com assinatura de pixels idêntica — ver `EDICAO-PESSOAL-CELEIRO.md`, seção 9.
- **Garantia:** assinatura de pixels determinística (cada personagem em todas as poses, ociosos e amostras de cada gesto, mais
  a cena inteira com o motor real em passos fixos e sorteios semeados): 1251 amostras + 17 quadros idênticos antes e depois da
  refatoração. O gerador de atlas e o importador do Aseprite foram rodados na versão antiga e na nova: PNGs idênticos pixel a
  pixel; nos `.atlas.js` só muda a linha do apelido do objeto global. Backup em
  `C:\Users\Tottizin\Backups\The-Farmer-Edu_BACKUP_ANTES_HULK_E_LEGIBILIDADE_2026-11-22`.

## 22. Auditoria técnica e artística (22/11/2026, noite)

### Técnicas encontradas e o que cada uma consegue
| Técnica (onde) | Limite real |
|---|---|
| Membro de dois segmentos por ângulo (`desenharMembro`, `boneco.js`): linha grossa por segmento + filete de luz | Segmentos de largura constante ("canos"); sem afinar no pulso/tornozelo, sem sobreposição de músculos. O Hulk contorna isso com `desenharBracoMusculoso` (volume calculado na direção do segmento). |
| Polígonos e elipses chapados por camada (tronco, capa, capuz), 1 tom de luz + 1 de sombra | Volume em 2–3 tons, sem rampa; o tronco lê como bloco quando a pose é estática. |
| Três camadas (trás, corpo, frente), cada uma com CONTORNO próprio (`contornar`) | Dá leitura de 3/4, mas o contorno separa o braço da frente do tronco com uma linha preta: o braço parece encaixado, não nascendo do ombro. Detalhes finos de 1 px muito juntos viram xadrez (era o caso das garras do Venom). |
| Grade de caracteres (`GRADE_DA_CABECA` do Batman e do Coringa) | A melhor técnica para rosto nessa resolução (pixel a pixel, controlado), mas é estática: não gira nem expressa; 11×12 px. |
| Espelhamento (`direcao: −1`, `espelhado`) | Correto em todos: a assimetria de luz acompanha o lado do olhar (verificado na cena real). |
| Gestos por quadros-chave suavizados + ociosos com relógios próprios | Sem repetição sincronizada; mas alguns gestos quase não apareciam (ver abaixo). |

**Teto da técnica:** é o mesmo patamar do Nick Fury e do Tony Stark aprovados (bonecos de 40–60 px, 2–3 tons, contorno de
1 px) — conferido lado a lado (`referencia-fury-tony-x-caverna.png` no scratchpad da sessão). Ela NÃO alcança o nível de um
artista desenhando à mão em editor de pixel art (Floor796, por exemplo): anatomia com escorço, rampas de luz e silhueta
desenhada a olho exigem sprites feitos à mão (o caminho do Aseprite da seção 15 continua sendo o indicado). Mais código não
resolve isso; por isso esta auditoria corrigiu defeitos concretos e não redesenhou personagens aprovados.

### Medição objetiva (pixels que mudam em relação ao repouso, no pior quadro de cada gesto)
Gestos quase invisíveis encontrados: **Freddy `acenar` 52 px** (o braço de longe subia para a frente e a mão sumia atrás da
cabeça e das orelhas) e **Destino `maoNoCinto` 39 px** (era o braço de longe, na camada de trás, escondido pela túnica).
Os demais gestos mudam 100–840 px. Ociosos com 0 px no corpo (olhos do Destino, falha e sumir do Slenderman) agem pelos
brilhos, pela transparência ou pelas fatias do motor — não são defeitos.

### Defeitos corrigidos
- **Freddy — microfone invisível:** era desenhado em preto e ANTES da mão (que o cobria), com seno e cosseno trocados em relação
  à convenção do `desenharMembro`. Agora: cabo abaixo do punho, punho por cima, cabeça de metal clara com reflexo, sempre
  atravessada ao antebraço e para cima.
- **Freddy — `cantar` não levava o microfone à boca** (a mão parava na altura da barriga): agora a mão vai, por alcance, até
  logo abaixo da boca, e a cabeça do microfone para à frente do focinho sem esconder a mandíbula.
- **Freddy — `acenar`:** braço de longe erguido para cima e para trás, mão livre ao lado da cabeça (52 → 130 px).
- **Destino — `maoNoCinto`:** a manopla DE PERTO pousa na fivela, com o cotovelo para a frente (39 → 269 px).
- **Venom — garras em xadrez:** três garras de 1 px a 0,25 rad uma da outra viravam xadrez com o contorno; agora 0,45 rad
  (fechadas) / 0,75 rad (abertas), garra de 2,5 px e ponta em gancho.
- **Nova ferramenta — `cavernaSecreta.angulosParaAlcancar` (`boneco.js`):** cinemática inversa de dois segmentos; gestos são
  escritos pelo DESTINO da mão (`MICROFONE_NA_BOCA`, `MAO_NA_FIVELA`) em vez de ângulos achados por tentativa — a causa dos
  dois gestos errados. A dobra é devolvida na volta mais próxima da pose de repouso (a interpolação não dá voltas).
- **Nome:** `pa` → `indiceDaPa` (ventoinha, `cenario/caverna.js`).

### Avaliados e mantidos (com o motivo)
- **Hulk:** proporções de herói exagerado coerentes; braço com bíceps/tríceps/cotovelo/punho orientado (seção 21). Limite: no
  repouso o punho do braço de perto se mistura ao short (mesmo tom de luz sobre o roxo) — leitura fraca, não ligação errada.
- **Batman e Coringa:** cabeças em grade alinhadas ao pescoço; braços articulados no ombro. O Coringa tem pescoço alto e
  claro (característico), braço do `apontar` reto como uma barra (limite da técnica de segmentos).
- **Ultron:** braço de perto claro e largo, de longe escuro e estreito — é a luz de 3/4, mas a assimetria é forte.
- **Slenderman:** silhueta e proporções corretas para o personagem; tentáculos e alcance legíveis.
- **Legibilidade:** o código da caverna já segue nomes explícitos (seção 21): a varredura encontrou só `x`, `y`, `id`
  (coordenadas e identificadores) e `pa`. Os padrões `const C = …, P = …`, `const K = {…}` e `perna(ctx, x, y, a1, a2, perto)`
  existem hoje APENAS no celeiro (`easter-eggs/vingadores/`), que esta e as missões anteriores mantêm intocado.
- **Desempenho:** a figura só é recomposta 12×/s; o custo principal é o contorno (leitura de pixels de 3 camadas × 8
  personagens × 12/s) e já está limitado. Nenhuma alocação por quadro de tela fora disso. Medido antes/depois: cena a 60 qps,
  1,69–1,74 → 1,64–1,67 ms por quadro; Fazenda 43–44 → 38–45 qps (variação da medição, a mesma faixa); memória 61 → 61 MB;
  0 laços ativos depois de sair.

### Testes desta auditoria
Folhas determinísticas (repouso, ociosos, cada gesto em 7 instantes) dos oito; repouso em 8×; contagem de pixels por gesto;
gestos corrigidos no MOTOR REAL (cena espelhada, recortes); cena inteira na escala do jogo (3×); Hulk, Batman, Coringa,
Ultron e Slenderman conferidos idênticos pixel a pixel ao estado anterior. Backup em
`C:\Users\Tottizin\Backups\The-Farmer-Edu_BACKUP_ANTES_AUDITORIA_CAVERNA_2026-11-22`.
