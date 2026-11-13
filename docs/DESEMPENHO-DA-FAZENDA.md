# Desempenho da Fazenda — Etapa 0 (otimização para PCs fracos)

Somente frontend (`app/modules/fazenda/views`). Nenhum PHP, rota, controller, model, banco ou autenticação foi alterado.

## 1. Como foi medido

| Item | Valor |
|---|---|
| Máquina | Ryzen 5 5500, 32 GB, **GeForce 8400 GS (256 MB, 2007)** |
| Caminho de vídeo real do Chrome | A 8400 GS não é aceita pelo Chrome atual; ele usa o **Microsoft Basic Render Driver** (rasterização por software do Windows, ANGLE/D3D11). É um caso real de "placa muito fraca". |
| Navegador de medição | Chrome sem janela (`--headless=new --use-angle=d3d11`), mesmo renderizador acima, 1384×805, densidade 1 |
| Cenário | Mesmo save (fazenda média: curral 3, galinheiro 3, mina 3, casa 2...), câmera inicial, hora parada (12h e 22h), 20 s por medição |
| "Antes" | O código original, aberto da cópia de backup, no mesmo navegador e com o mesmo save |
| Ferramenta | Intervalo real entre quadros (`requestAnimationFrame`), `renderer.info`, perfil de CPU do DevTools, heap exato após coleta forçada |

Também foi usado o SwiftShader (rasterização por software do Chrome, sem GPU) como caso extremo.

## 2. Diagnóstico (medido, não presumido)

* **Lógica do jogo: < 1 % do tempo.** Lavoura, animais, equipe, monstros, painéis e inventário já eram atualizados com moderação (painéis 1×/s e só quando algo muda; áudio sob demanda com `preload="none"`; listeners registrados uma única vez).
* **Chamadas de desenho: o gargalo principal de CPU.** ~1.250 por quadro no quadro normal, mais ~1.100 no mapa de sombras. No navegador real, o processo da página ficava **100 % ocupado**: ~47 % dentro do Three.js preparando as chamadas e ~47 % no envio delas à placa.
  * Origem: construções das áreas (~700 malhas paradas), animais (~42 malhas por vaca, ~23 por galinha), personagens (lenhador, fazendeiros, Guardião) e nuvens (151 esferas transparentes). O cenário fixo já era mesclado (seção 11f).
* **Pixels: o segundo gargalo.** Em rasterização por software, as **sombras recebidas** (filtro PCF, várias leituras por pixel), a **suavização de bordas (MSAA)** e a resolução custam mais que tudo.
  * A **frequência** do mapa de sombras (2, 6 ou 12 quadros) e o **tamanho** dele (512 a 2048) quase não mudaram o FPS.
* Não encontrados: vazamento de timers, listeners duplicados, texturas grandes (só há texturas pequenas geradas em canvas), recursos carregados sem necessidade.

## 3. O que foi feito

### 3.1 Mesclagem vigiada das malhas (`30d-desempenho.js`)

As peças **paradas** que usam o **mesmo material** viram uma malha só, dentro do próprio grupo.

* **Raízes.** Grupos de área, animais, personagens e nuvens. Grupos que se mexem dentro deles (cabeça, pernas, braços, pás) viram raízes próprias.
* **Observação.** Cada raiz é observada por 2,5 s. Peça que muda de posição, rotação, escala, visibilidade, pai, material ou sombra nunca é mesclada.
* **Originais preservadas.** As peças originais **continuam existindo**, com as mesmas referências usadas pelo resto do código, na camada 1. Essa camada não é desenhada, não entra na sombra e não entra no clique.
* **Vigilância.** Se uma peça mesclada mudar depois, a mesclagem daquela raiz é desfeita **no mesmo quadro** e refeita sem ela.
* **Reconstrução.** Reconstruir uma área libera a mesclagem antiga e observa a nova.
* **Nenhum construtor foi alterado.**

Resultado: **~920 chamadas a menos por quadro**, de 1.217 para 555 com a mesma imagem. As capturas do código original e do novo no nível Alto são iguais, salvo os personagens em movimento.

### 3.2 Níveis de qualidade (`02`, `06`, `18`, `21`, HTML/CSS)

> **Atenção:** a tabela abaixo é a da Etapa 0. Os níveis foram revistos na **Etapa 0b** (fim deste documento): Baixo com 100% + MSAA e luzes reais à noite, Médio com sombra suave, luzes só à noite em todos os níveis e seletor novo.

O antigo **Modo Leve virou o nível Baixo**. `MODO_LEVE.ativo` continua valendo, então luzes, brilhos e teto de monstros seguem iguais. Quem usava o Modo Leve abre no Baixo.

| | Baixa | Média | Alta |
|---|---|---|---|
| Resolução interna | 80 % (o Automático pode ir a 60 %) | 100 % | até 2× em telas densas |
| Suavização de bordas (MSAA)* | não | sim | sim |
| Sombras | não | sim, **simples** (bordas duras), mapa 1024, a cada 3 quadros | sim, **suaves** (PCF), mapa 2048, a cada 2 quadros |
| Luzes reais da noite (postes, casa, faróis) | não (halos e brilho no chão continuam, um pouco mais fortes) | sim | sim |
| Nuvens baixas sob a ilha | não | sim | sim |
| Teto de monstros simultâneos (regra já existente no Modo Leve) | 4 | 6 | 6 |

\* Só muda ao recarregar a página: o MSAA é escolhido ao criar o renderizador. O menu avisa.

**Automática** (padrão para quem não escolheu nada):
1. **Ponto de partida.** Não usa o nome da placa nem `hardwareConcurrency`. Usa o aviso do próprio navegador de que o 3D será lento (`failIfMajorPerformanceCaveat`), a detecção de rasterização por software e `navigator.deviceMemory` ≤ 2 GB, quando disponível. Sem nenhuma pista, começa no Médio.
2. **Durante a partida.** Mede o intervalo real dos quadros em janelas de 5 s.
   * **Desce** um nível após 2 janelas seguidas ruins: FPS mediano < 40 no Alto, < 28 no Médio, < 26 no Baixo.
   * **Sobe** após 6 janelas seguidas boas (≈ 57+ FPS por 30 s).
   * **No Baixo**, primeiro reduz a resolução (80 → 70 → 60 %) e depois a devolve.
3. **Contra oscilação:**
   * ≥ 12 s entre trocas e no máximo 6 trocas por sessão.
   * Ignora os primeiros 6 s, os 6 s após cada troca, as cenas especiais e a aba em segundo plano.
   * Depois de cair de um nível, não tenta voltar a ele. Esse **teto** fica salvo; escolher "Automática" de novo no menu libera o teste.
4. **Memória.** O resultado fica salvo no navegador (`fazenda3d-qualidade-v1`) e a próxima abertura começa nele.

Escolha manual (Baixa, Média ou Alta) nunca muda sozinha.

## 4. Resultados (antes × depois, mesmo cenário)

Microsoft Basic Render Driver, 1384×805, mesmo save, 20 s:

| Cenário | FPS dia | 1 % low | ms médio | p99 | FPS noite | 1 % low noite | Chamadas dia/noite |
|---|---|---|---|---|---|---|---|
| Antes — normal | 18,0 | 15,0 | 55,6 | 66,8 | 17,5 | 15,0 | 1.217 / 1.261 |
| Antes — Modo Leve | 33,8 | 29,9 | 29,6 | 33,4 | 31,1 | 29,9 | 1.238 / 1.336 |
| **Depois — Alta** | 20,4 | 15,0 | 49,0 | 66,7 | 19,5 | 15,0 | 555 / 686 |
| **Depois — Média** | 26,5 | 20,0 | 37,8 | 50,1 | 25,1 | 20,0 | 528 / 671 |
| **Depois — Baixa** | **59,8**\* | 59,5 | 16,7 | 16,8 | **58,7**\* | 30,0 | 538 / 651 |
| Depois — Automática, 1ª abertura (terminou em Média sem MSAA) | 33,5 | 29,9 | 29,9 | 33,4 | 31,8 | 20,0 | 580 / 663 |

\* Limitado pelos 60 Hz da tela: o Baixo tem folga acima disso.

* Normal × Alta, mesma qualidade visual: **+13 %** de FPS (dia) e **−54 %** de chamadas.
* Normal × Média: **+47 %** (dia).
* Modo Leve antigo × Baixa: **+77 %** de dia e **+89 %** à noite.
* Carregamento até o primeiro quadro: 1,2–1,4 s antes e depois (sem mudança). A mesclagem acontece nos primeiros ~3 s de jogo, sem travar.
* Heap JS (leitura aproximada do `performance.memory`, sem coleta de lixo): 24,8 → 33,5 MB. A diferença são as cópias das geometrias mescladas, mantidas na CPU porque o clique nas áreas precisa delas. Medido com coleta de lixo, o heap exato do jogo novo fica em ~16 MB e não cresce com o tempo (seção 6).

**SwiftShader** (caso extremo, sem GPU nenhuma): chamadas 1.256 → 593 e `render()` 9,1 → 6,8 ms, mas o FPS (~4,4) não muda no Alto, porque ali o limite são os pixels. Por isso o nível Baixo reduz a resolução.

Experimentos que definiram os níveis (nível Médio, mesma página):

| Variação | FPS |
|---|---|
| Sombra PCF, a cada 3 quadros | 21,0 |
| Sombra PCF, a cada 6 ou 12 quadros | 16,6 (o mesmo; medição sob carga) |
| Mapa 512 em vez de 1024 | sem ganho |
| **Sombra simples** | **25,9** (+23 %) |
| Sem sombras | 29,2 |
| Baixa 100 % / 80 % / 60 % (sem MSAA, sob carga) | 25,5 / 28,1 / 31,0 |

## 5. Testes

* Seletor e persistência: os 4 níveis aplicam resolução, sombras, tipo de sombra, luzes e nuvens; a escolha fica salva e a chave antiga do Modo Leve é mantida coerente.
* Automático:
  * descida forçada Médio → Baixo → 70 % → 60 %, com 16 s entre trocas;
  * subida 60 → 70 → 80 %, parando no teto;
  * a escolha manual não muda em 15 s.
* Mesclagem:
  * **invariante** "toda peça escondida pertence a uma mesclagem ativa" verificado após cada teste (0 órfãs);
  * peça movida ou escondida desfaz a mesclagem no mesmo quadro;
  * 30 reconstruções de área: geometrias na GPU estáveis (1.342 / 1.304 / 1.342);
  * **clique**: 162 raios sobre 5 áreas acertam exatamente como antes (0 diferenças).
* Regressão das etapas anteriores, sem erros:
  * mina e alquimia (9 poções, Limite 20);
  * colheita, animais, Bravura, reserva de madeira, tutorial (21 passos) e inventário;
  * poção misteriosa e cena do unicórnio;
  * abdução (3 → 2 vacas, persistência, regra da última vaca, repor 60 XP).
* Visual: capturas antes × depois no Alto (iguais), Média, Baixa (dia e noite), close do curral e menu.

## 6. Sessão longa (20 min, modo Automático, ciclo de dia e noite andando)

Microsoft Basic Render Driver, primeira abertura sem preferência salva. A cada minuto o script forçava a coleta de lixo e lia o heap exato (`Runtime.getHeapUsage`).

| Minuto | Heap usado (após coleta) | FPS | Nível | Chamadas | Geometrias GPU | Programas | Objetos na cena | DOM |
|---|---|---|---|---|---|---|---|---|
| 0,1 | 14,8 MB | 58,4 | baixo | 700 | 1.358 | 26 | 2.297 | 585 |
| 1,2 | 16,1 MB | 31,2 | **médio** (subiu) | 693 | 1.363 | 41 | 2.282 | 585 |
| 5,5 | 16,0 MB | 32,6 | médio | 555 | 1.348 | 41 | 2.244 | 585 |
| 8,8 | 16,0 MB | 58,6 | **baixo** (desceu) | 669 | 1.348 | 41 | 2.244 | 585 |
| 12,0 | 15,9 MB | 59,6 | baixo | 635 | 1.355 | 41 | 2.153 | 585 |
| 19,6 | 15,7 MB | 59,8 | baixo | 612 | 1.328 | 41 | 2.115 | 585 |

* **Sem vazamento contínuo:** o heap ficou entre 14,8 e 16,1 MB e terminou menor que no minuto 1. Geometrias, texturas (25), programas (41, após compilar os do nível médio) e DOM (585) ficaram estáveis.
* **O Automático trocou 2 vezes e parou.**
  * Subiu para Médio no início (Baixo a ~60 FPS).
  * Por volta do minuto 7 o Médio caiu para ~27 FPS; com duas janelas abaixo de 28, voltou ao Baixo.
  * Fixou o teto em Baixo e não oscilou mais.
* **Objetos na cena:** a queda (2.297 → 2.115) é do jogo, não da otimização. Os 2 trabalhadores caíram durante a noite (monstros), e seus modelos saíram da cena.
* **Mesclagem:** nenhuma raiz abandonada, 1 refeito por movimento e 1 por reconstrução em 20 min.
* Valor de memória da tabela da seção 4 (24,8 → 33,5 MB): lido com `performance.memory`, que o Chrome arredonda, e **sem** coleta de lixo. O número exato é o desta tabela.

## 7. Limitações e o que não foi medido

* Não há um PC real com 4 GB de RAM e GPU integrada disponível. O Microsoft Basic Render Driver é um caso real e fraco, mas roda num Ryzen 5 5500: **não substitui** o teste num aparelho antigo, onde a CPU também é lenta.
* A limitação artificial de CPU do DevTools não foi usada nas medições finais (ela se desfaz a cada conexão da ferramenta usada).
* Memória de vídeo não é mensurável pelo navegador; foram medidas contagens de geometrias, texturas e programas.
* O tempo de troca de nível inclui uma recompilação de materiais (um quadro mais lento). Ela não foi cronometrada isoladamente.
* Celular/tablet não foi medido nesta etapa.

## 8. Arquivos

| Arquivo | Mudança |
|---|---|
| `assets/js/30d-desempenho.js` | **novo**: mesclagem vigiada, monitor do Automático, `window.farmEduDesempenho` (diagnóstico) |
| `assets/js/02-configuracao-do-dia-e-da-noite.js` | níveis de qualidade, avaliação inicial, preferência salva |
| `assets/js/06-cena-3d.js` | MSAA e tamanho do mapa de sombras conforme o nível |
| `assets/js/18-camera-e-controles.js` | resolução interna conforme o nível (limite, escala e orçamento de pixels) |
| `assets/js/21-modo-leve.js` | aplica os níveis (sombras, tipo de sombra, mapa, luzes, nuvens) e o seletor; mantém as funções antigas |
| `assets/js/31-loop-principal.js` | intervalo das sombras conforme o nível; chama `atualizarDesempenho` antes do desenho |
| `assets/js/fazenda.js` | carrega `30d-desempenho.js` |
| `assets/js/32b-tutorial.js` | uma frase: "⚡ Modo Leve" → "🎨 Qualidade" (o botão mudou de nome) |
| `fazenda.html` | botão Modo Leve → seletor "🎨 Qualidade" |
| `assets/css/05-paineis.css` | estilo do seletor |

---

# Etapa 0b — Revisão visual da otimização

**Motivo:** o nível Baixo da Etapa 0 ficou feio.
* **Resolução 80% sem suavização de bordas:** borrada (o navegador estica a imagem) e serrilhada nas cercas, postes, telhados e árvores.
* **Noite sem as luzes reais:** perdia as poças de luz quente dos postes, da casa e do curral.

**Prioridade nova:** desempenho sem deixar a Fazenda feia; preferível 40–50 FPS com imagem bonita a 60 FPS comprometido.

Mesmas condições de antes: Microsoft Basic Render Driver, Chrome sem janela, 1384×805, mesmo save, câmera inicial, 12h e 22h.

## Experimentos de suavização e resolução (nível Baixo)

| Variante | FPS dia | FPS noite | Visual (recorte ampliado 2×) |
|---|---|---|---|
| 80% sem suavização (Etapa 0) | 57,6 | 57,8 | borrado |
| 100% sem suavização | 52,2 | 48,7 | serrilhado |
| 100% + FXAA (pós-processamento) | 38,8 | 35,4 | bordas suaves, mas placas e texturas borradas |
| 90% + FXAA | 42,2 | 41,0 | muito borrado |
| 100% + MSAA 4× em alvo de renderização | 34,8 | 32,8 | bom, porém mais lento |
| **100% + MSAA nativo** | **38,9** | **36,1** | **nítido e com bordas suaves (o mais próximo do Alto)** |

**Escolha: MSAA nativo + 100% de resolução.** O FXAA custou o mesmo nesta máquina e deixou a imagem pior.

## Ganhos sem mudar a imagem

1. **Céu desenhado por último** (`15-ceu-e-sol.js`). O domo do céu era desenhado primeiro na tela inteira, e quase tudo era pintado por cima. Agora ele fica na profundidade máxima (`gl_Position.z = w`) e é o último dos opacos, então só os pixels de céu visível são calculados.
   * Medido (ablação): ~13% do quadro.
   * Estrelas, sol e lua são transparentes e continuam desenhados por cima.
2. **Luzes reais só à noite** (`21`, `30d`). Cada luz visível custava ~2–3% do quadro mesmo com intensidade 0 (de dia). Elas ficam invisíveis quando o ciclo diz que estão apagadas.
   * A troca ao anoitecer/amanhecer recompila os materiais uma vez: o maior quadro foi de 33 para 46 ms.
3. **Prova de que o Alto não mudou.** Na comparação pixel a pixel com o código original (mesma câmera/hora/save), só diferem o que se mexe sozinho: água, cachoeira, chafariz, animais, personagens e carrinho. O céu, as construções e as sombras são idênticos. Diferença média 2,0/255, a mesma ordem da Etapa 0 (1,9/255).

## Níveis revisados

| | Baixa | Média | Alta (original) |
|---|---|---|---|
| Resolução | 100% (o Automático pode ir a 90%) | 100%, até 1 pixel por pixel CSS | até 2× em telas densas |
| Bordas | MSAA nativo | MSAA nativo | MSAA nativo |
| Sombras | não | **suaves (PCF)**, mapa 1024, a cada 3 quadros | suaves (PCF), mapa 2048, a cada 2 quadros |
| Luzes reais à noite | 3 postes mais próximos da câmera + casa | todas (8 postes, casa, faróis) | todas |
| Halos, janelas, brilho no chão, nuvens baixas | sim | sim | sim |

* **O Médio voltou à sombra suave.** A sombra simples era ~30% mais rápida, mas nas capturas ela quase sumia de dia e criava um padrão serrilhado no curral à noite.
* Nesta máquina (densidade de tela 1), Médio e Alto custam quase o mesmo. O Médio poupa em telas de alta densidade, onde o Alto desenha até 4× mais pixels; isso **não foi medido** aqui.

## Resultados (mesmas condições, 20 s)

| Nível | FPS dia | 1% low | FPS noite | 1% low | Chamadas dia/noite |
|---|---|---|---|---|---|
| Original — normal | 18,0 | 15,0 | 17,5 | 15,0 | 1.217 / 1.261 |
| Original — Modo Leve | 33,8 | 29,9 | 31,1 | 29,9 | 1.238 / 1.336 |
| **Alta** | **26,3** | 20,0 | 19,3 | 15,0 | 590 / 693 |
| **Média** (sombra suave) | **26,2** | 20,0 | 21,1 | 15,0 | 584 / 650 |
| **Baixa** | **42,0** | 29,9 | **34,4** | 29,9 | 545 / 676 |

* **Alta:** +46% de dia sobre o original, com a mesma imagem. À noite fica igual ao original, porque as 10 luzes reais são o custo dominante.
* **Baixa:** de dia, na faixa pedida (40–50). À noite, 34,4: as 4 luzes reais custam ~12% e os halos/brilhos ~7%. Mantidos de propósito para preservar a noite.

## Seletor de qualidade (reformulado)

* Cartão de papel no estilo da gaveta, com 4 opções em grupo de rádio acessível:
  * 🪄 Auto, 🌱 Baixa, 🌿 Média, 🌳 Alta;
  * cada opção mostra barras de "peso";
  * a escolhida fica em dourado, como os itens ativos do menu;
  * um ponto verde marca o nível em uso pela Automática.
* Selo com o nível e o FPS medido (DOM atualizado no máximo 1×/s e só com o menu aberto) e descrição do que cada nível faz.
* Teclado: setas, Home e End (as teclas não chegam à câmera). Funciona nos temas claro e escuro; a animação respeita "movimento reduzido".

## Etapa 1 — FPS só no Modo Desenvolvedor

O selo do seletor de qualidade mostra o FPS **só com o Modo Desenvolvedor ligado** (lê `modoDesenvolvedorAtivo`, o mesmo estado do modo; sem configuração própria). Para o aluno aparece só o nível ("Baixa", "Média"…), sem espaço vazio. A medição interna (média móvel) e o monitor da qualidade Automática continuam funcionando com o contador escondido. O Modo Desenvolvedor começa desligado a cada carregamento (comportamento já existente), então o FPS nunca aparece depois de recarregar.
