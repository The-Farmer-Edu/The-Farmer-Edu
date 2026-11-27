# The Farmer Edu — Auditoria técnica e preparação para uso em escala nacional

Data: 22/11/2026 · Cópia auditada: branch `squad-1/fazenda-maisAjustes`, HEAD `5efa090` + alterações locais (nada foi
commitado). Backup completo antes da missão: `C:\Users\Tottizin\Backups\The-Farmer-Edu_BACKUP_ANTES_MISSAO_GERAL_2026-11-22`.

Este documento separa o que foi **corrigido e testado**, o que foi **apenas analisado** e o que **depende de decisão
institucional ou infraestrutura**. Nada aqui deve ser lido como "pronto para produção nacional".

---

## 1. Diagnóstico inicial

### 1.1 Arquitetura
- **Backend PHP sem framework**, padrão MVC simples por módulo (`app/modules/<modulo>/{Controller,Model,routes}.php` +
  `views/`), roteador único (`app/core/router.php`) e ponto de entrada `public/index.php`. É uma base compreensível para
  estudantes. Os módulos foram feitos por squads diferentes e seguem padrões diferentes (nomes de classe como
  `baseFazenda`, `atividadesSub`, `testarAPIController`; pastas `views/` e `view/`; alguns módulos com `require_once` do core
  dentro do `routes.php`, outros não).
- **Fazenda (frontend 3D)**: Three.js r128, ~50 scripts clássicos carregados em ordem por `fazenda.js` (lista
  `MONTAGEM_DA_FAZENDA`), escopo global compartilhado. Bem documentada, mas o escopo global torna dependências implícitas.
- **Dependências**: `app/modules/auth/vendor/` (Composer: Mailtrap/Symfony Mime, 708 arquivos) **versionado no Git**.
- **Sem testes automatizados no repositório** e sem CI de testes (os workflows só atribuem revisores e reabrem PRs).
- **Arquivos soltos/de depuração**: `how --stat e0131b0` (saída de `git log` salva sem querer na raiz),
  `app/modules/gamificacao/temp_router_check.php` (caminho fixo `d:\xampp\...` de outra máquina), páginas `testarApi.php`.
- **Arquivos grandes**: `notas/views/turma.php` (1734 linhas, HTML + CSS + JS no mesmo arquivo), `turmas_cursos` CSS (1127).
- **Capacidade de crescer**: o roteador e o PDO único aguentam crescer em número de módulos; o que impede escala é a
  ausência do conceito de instituição/unidade (seção 1.4) e a configuração por máquina (`.env` dentro de `app/core`).

### 1.2 Segurança (encontrado)
| # | Severidade | Problema | Situação |
|---|---|---|---|
| S1 | **Crítico** | `auth/file` montava o caminho com `type`/`file` sem validação: com `../` lia **qualquer arquivo do servidor** (testado: entregou código-fonte dos controladores e o `.env.example`; com o banco configurado entregaria o `.env` com a senha). Sem login. | **Corrigido e testado** |
| S2 | **Crítico** | `feedback_ia/file` e `submissoes/file`: mesmo problema **e** `require_once` do arquivo pedido (inclusão/execução de PHP em vez de entrega). Sem login. | **Corrigido e testado** |
| S3 | Alto | `auth/file` e `submissoes/file` consultavam `http://svn.apache.org/...mime.types` **a cada pedido** (dependência externa, lentidão, `CURLOPT_SSL_VERIFYPEER=false`). | **Corrigido** (lista local de tipos) |
| S4 | **Crítico** | `/auth/testeEmail` (sem login) enviava um **e-mail real** pela API paga do Mailtrap para um e-mail institucional de aluno fixo no código, a cada visita, e mostrava a resposta da API com `var_dump`. | **Rota desativada e testada (404)**; o e-mail do aluno continua escrito no arquivo da view — remover/anonimizar (decisão do squad) |
| S5 | **Crítico** | `/api/Judge0` e `/api/Ollama`: **proxies abertos, sem login**, para IPs internos fixos (`192.168.0.22:2358`, `192.168.0.21:11434`); quem chama escolhe caminho, método e corpo. Permitem executar código no Judge0 e usar o Ollama pelo servidor. | **Não alterado** — afeta outros squads e serviços de rede que não pude testar. Proposta na seção 5 |
| S6 | Alto | `submissoes/enviarSubmissao` (`processar_submissao.php`): sem login, `Access-Control-Allow-Origin: *`, manda qualquer código ao Judge0/Ollama; não grava a submissão (o Model com checagem de matrícula não é usado). | **Não alterado** (mesmo motivo) |
| S7 | Alto | Cadastro público permite escolher o perfil **instrutor** (`auth/novoUsuario`): qualquer pessoa vira instrutor, cria turmas e vê dados de alunos matriculados nelas. | **Não alterado** — exige decisão (convite, aprovação por administrador ou domínio institucional) |
| S8 | Alto | `notificacoes`: lista e marca notificações de um **usuário de teste fixo** (`teste.notificacoes@...`), sem login. Protótipo, não ligado ao aluno real. | **Não alterado** (módulo de outro squad em construção) |
| S9 | Médio | `solicitarPerfilDeAcesso()` (core) lia `$_SESSION['perfilAcesso']`, que nunca existe (o perfil fica em `$_SESSION['usuario']`): barraria **todo mundo**. Hoje nenhuma rota a usa. | **Corrigido** |
| S10 | Médio | Sem `.env`, `config.php` emite um aviso do PHP com o **caminho completo do servidor** em toda resposta (e com `display_errors` ligado, como no XAMPP). | Não alterado: configuração de ambiente (seção 5) |
| S11 | Médio | O XP do aluno vem do save enviado pelo próprio navegador (`fazenda/salvar`): um aluno pode alterar o XP pelas ferramentas do navegador. O "modo desenvolvedor" da Fazenda liga com uma sequência secreta de teclas no cliente. | Não alterado: decidir se XP terá valor avaliativo (se tiver, precisa ser calculado no servidor) |
| S12 | Médio | Cookie de sessão sem `secure` (precisa de HTTPS); CSRF só em parte dos formulários (`turmas_cursos` tem; `atividades` só tem na `origin/main` — nesta branch o servidor não gera nem confere o token, ver seção 8; `auth` e `notas` não têm); sem limite de tamanho explícito no save da Fazenda. | **Limite do save corrigido em 23/11** (512 KB, 413); o resto não alterado (seção 5) |
| — | OK | SQL sempre com *prepared statements* (`ATTR_EMULATE_PREPARES=false`); senhas com `password_hash` (bcrypt); bloqueio por tentativas de login; regeneração de sessão no login; views escapam a saída (`htmlspecialchars`); `fazenda/arquivo`, `fazenda/salvar` e `turmas_cursos/imagemTurma` validam caminho, login e dono. | — |

### 1.3 Banco de dados e persistência
- `database/schema.sql`: InnoDB, utf8mb4, chaves estrangeiras e índices únicos coerentes (usuário → aluno/instrutor,
  turma → curso/instrutor, matrícula única por turma/aluno, submissão por tentativa, nota por submissão, XP por aluno).
- **Fazenda**: um save por aluno (`fazendas.estado` em JSON) com `revisao` (evita uma aba sobrescrever a outra) e
  `sessao_ativa`; XP em `alunos.xp_total` + `xp_logs` com `entregue_em`. **Com o backend ativo, o aluno usa a mesma conta em
  vários dispositivos sem perder o progresso** (o jogo carrega o save do servidor ao abrir). Fora do servidor (arquivo aberto
  direto), o progresso fica só no `localStorage` daquele navegador.
- `database/fazenda_alteracoes.sql` é uma migração manual (ALTERs); `schema_backup.sql` é uma cópia antiga — não há
  ferramenta de migração nem versão do esquema.
- **Não existe conceito de instituição/unidade/escola** no banco (busca por `unidade`, `instituicao`, `escola`, `tenant`:
  nenhum resultado). Turmas pertencem a instrutores; instrutores não pertencem a nenhuma unidade.
- **Sem estratégia de backup** documentada no projeto.

### 1.4 Experiência educacional
- Existe o ciclo completo no modelo: atividade → submissão (tentativas) → feedback de IA → nota do instrutor → XP na
  Fazenda (`xp_logs` ligado à nota). Na Fazenda: XP, conquistas, diário, objetivos, tutorial.
- Lacunas: o instrutor não tem visão do progresso da Fazenda por turma (há `nome_fazenda` no banco "para relatórios", mas
  nenhuma tela usa); o XP da Fazenda não é confiável para avaliação (S11); o fluxo de submissão que de fato roda não grava
  (S6).

### 1.5 Desempenho (medido em missões anteriores e nesta)
- A Fazenda já tem seletor de qualidade, modo leve e medição de FPS (`docs/DESEMPENHO-DA-FAZENDA.md`).
- Recursos pesados: áudios da Fazenda = 74 MB em 85 arquivos (carregados sob demanda); **telas de login carregam ~11 MB de
  imagens de fundo** (`tarde.svg` 3,5 MB, `por_do_sol.png` 2,7 MB, `tarde.png` 2,6 MB) — ruim em rede móvel.
- O joystick adicionado não cria laço de animação próprio (só uma conferência a cada 250 ms e eventos de toque).

### 1.6 Responsividade e acessibilidade
- A Fazenda já se adapta a retrato/paisagem (capturas desta missão em 390×844 e 844×390). Antes desta missão **não havia como
  andar pelo mapa no celular** (só girar/aproximar a câmera com os dedos): resolvido com o joystick (seção 3).
- Os painéis da Fazenda têm navegação por teclado e `Esc` para fechar; não foi feita auditoria de contraste/leitor de tela
  das telas PHP dos outros módulos (fica como pendência).

---

## 2. Caverna Secreta — braço do Hulk

- **Defeito**: no gesto **rugir**, os dois braços giravam 35° para TRÁS. Como o braço de perto nasce no ombro do meio/trás da
  silhueta (3/4 olhando para a direita), ele saía inteiro pelas costas, do lado esquerdo — parecia ter trocado de lado.
  Observado na cena real a cada rugido (folha de 60 s, um quadro a cada 0,5 s).
- **Correção**: só os ângulos do rugido (`personagens/hulk.js`): braços tensos ao lado do corpo, cotovelos dobrados, punhos
  cerrados à frente do quadril. Desenho, volume, proporções e os outros gestos não mudaram.

## 3. Joystick virtual (Fazenda, telas de toque)

- Arquivos: `js/19b-joystick-movel.js` (novo), `css/12-joystick-movel.css` (novo); `js/19-movimento-pelo-teclado.js` ganhou a
  entrada analógica `entradaDoJoystick`, somada ao teclado na MESMA `atualizarMovimento()` (não há segundo sistema de movimento).
- Comportamento: canto inferior esquerdo, sobe acima da gaveta de construções quando ela ocupa o mesmo canto; zona morta de 18%
  do raio; intensidade 0–1 conforme a inclinação; diagonal sem aceleração; para ao soltar, cancelar, perder o foco, esconder a
  aba ou girar a tela; um dedo controla o joystick e os outros ficam livres (câmera, botões); some com a Fazenda suspensa
  (celeiro, caverna) e na tela de carregamento; só aparece em telas de toque.
- Teclado: o resultado do teclado é idêntico ao de antes (todo vetor de teclas tem comprimento ≥ 1 e vira 1).
- **Detecção (corrigida em 22/11/2026)**: antes, `(pointer: coarse)` era lido uma única vez na carga e o primeiro toque ligava o
  joystick para sempre — depois de tocar no modo dispositivo do DevTools e sair dele, o joystick ficava na tela do computador.
  Agora a regra é reavaliada a cada conferência e nos eventos `change` das consultas de mídia: aparece se o ponteiro PRINCIPAL
  é grosso (celular, tablet, modo dispositivo) ou se o último toque/clique foi com o dedo e o aparelho tem toque (notebook com
  tela de toque; um clique de mouse esconde de novo). Largura da tela e User-Agent não entram na conta; abrir o F12 sozinho não
  muda nada. Testado com o DevTools real (Ctrl+Shift+M e F12 enviados ao próprio DevTools): oculto com F12 aberto/fechado/
  reaberto, visível ao entrar na emulação (sem precisar tocar), oculto em ~80–95 ms ao sair dela (3 ciclos, inclusive com o
  dedo no joystick — a entrada zera e o personagem para).
- **Convivência com a interface (corrigida em 22/11/2026)**: numa Fazenda nova, no celular, o cartão do tutorial (z-index 15,
  largura toda, logo acima da gaveta) ficava exatamente no canto para onde o joystick sobe; os toques caíam no cartão (0 de 9
  pontos livres em 360×640, 375×667, 390×844 e 412×915; 6 de 9 no celular deitado). Também a janela do nome da fazenda
  (modal) deixava o joystick visível por baixo, sem resposta. Solução, sem colocar o joystick por cima de nada:
  - o joystick publica a **área reservada** (`farmEduJoystick.areaReservada()`, evento `farmedu-joystick-area`), já com as
    áreas seguras do aparelho (`env(safe-area-inset-*)`, lidas por um medidor invisível; a distância acima da gaveta não
    conta mais a área segura de baixo duas vezes);
  - o tutorial (seção 32b) se posiciona fora dela: acima do joystick (de preferência abaixo dos botões Inventário/Objetivos/
    Diário, com o texto rolando), ao lado dele quando falta altura (celular deitado; em telas largas a coluna do cartão,
    `--coluna-do-tutorial` em 08-tutorial.css, cresce até 60% e a gaveta aberta continua desviando) ou encurtado;
  - o joystick confere com `elementsFromPoint` o que um dedo atingiria em 5 pontos da base; se um painel, janela ou aviso o
    cobrir, ele se esconde (e volta quando o caminho fica livre) em vez de ficar visível e sem resposta.
  Medido em 7 telas (360×640 a 1024×768) e 4 celulares deitados com e sem entalhe: tutorial em convite, aberto, passo 2 e
  minimizado → 9 de 9 pontos livres em todos; janela do nome aberta → joystick oculto.
- **Pendências do cartão corrigidas (22/11/2026, noite)**:
  - *Rótulo "Construções" coberto (celular deitado)*: ao lado do joystick o cartão mantinha o topo fixo do CSS (176 px) e descia
    até quase a borda, cobrindo o rótulo, o resumo e ~70% do botão da gaveta fechada (844×390, 932×430, 740×360). Agora
    `espacoAoLadoDoJoystick` (32b) usa só a faixa LIVRE: abaixo da barra do topo e de cada botão da esquerda na mesma faixa
    horizontal, acima da gaveta fechada e da margem segura de baixo. Se a faixa tiver menos de 180 px (com menos os botões do
    cartão ficavam cortados e ele ganhava rolagem própria — medido), o cartão passa para a DIREITA dos botões da esquerda e
    sobe até a barra do topo; com a gaveta aberta ele volta para junto do joystick e a gaveta abre ao lado (um
    `MutationObserver` na classe da gaveta reposiciona na hora). Na tela estreita (667×375, 640×360) vale o mesmo.
  - *Margem segura esquerda ignorada*: o cartão usava `left: 12px` fixo (08-tutorial.css); agora `env(safe-area-inset-left) +
    12px` (tela larga) e `+ 8px`, com a largura descontando as duas margens (tela estreita); a coluna padrão que a gaveta aberta
    respeita também soma a margem. O tutorial lê as margens com um medidor invisível próprio.
  - Medido (emulação do Chrome, Fazenda nova, convite/aberto/passo 2/minimizado/gaveta aberta/fechado) em 12 telas, com e sem
    entalhe/barra de gestos: com a gaveta fechada o cartão não cobre nenhum elemento importante, os botões do cartão ficam
    inteiros, sem rolagem própria, margens respeitadas, joystick 9 de 9.
- **Gaveta aberta em telas estreitas e margens dos botões (corrigidas em 23/11/2026)**:
  - *Gaveta aberta*: antes o cartão ficava por cima do cabeçalho da gaveta e dos botões da esquerda. Agora
    `acomodarGavetaAbertaComOCartao` (32b) acomoda os dois: **empilhados** no celular em pé (cartão abaixo dos botões, gaveta
    embaixo com a área de rolagem encurtada — `--altura-do-conteudo-da-gaveta`) ou **lado a lado** no celular deitado (cartão numa
    coluna à direita, gaveta mais estreita à esquerda — `--centro-da-gaveta`, `--largura-da-gaveta`); sem espaço, o comportamento
    antigo. Medido: 360×640, 375×667, 390×844 (com entalhe), 412×915 empilhados (gaveta com 134–429 px de rolagem) e 667×375,
    640×360 (com entalhe) lado a lado — o cartão não cobre nada, botões do cartão inteiros, sem rolagem própria. Limite: no celular
    deitado a PRÓPRIA gaveta aberta continua cobrindo os botões Objetivos/Diário (já era assim sem o tutorial).
  - *Margens dos botões*: a barra do topo inteira (`#barra-topo`, 02-interface.css) passou a começar e terminar nas margens seguras
    (`left/right: env(safe-area-inset-*)`): XP, recursos, som, menu e os botões Inventário/Objetivos/Diário (posicionados dentro
    dela) saem do entalhe. Medido em 640×360, 740×360, 844×390 e 932×430 com entalhe: tudo dentro das margens.
  - **Não homologado em aparelho físico** (Android/iOS): todos os resultados são da emulação do Chrome.

## 4. Correções aplicadas nesta missão (arquivos)

| Arquivo | Mudança |
|---|---|
| `app/core/arquivosEstaticos.php` (novo) | `enviarArquivoEstatico()`: lista de subpastas, nome simples, lista de tipos, `realpath` dentro da pasta, leitura (nunca `require`), suporte a `Range`. |
| `app/modules/auth/Controller.php` | `sendFile()` usa a função segura; removida a consulta remota de MIME. |
| `app/modules/feedback_ia/Controller.php` | `sendFile()` usa a função segura (sem `require_once`). |
| `app/modules/submissoes/Controller.php` | `sendFile()` usa a função segura; removida a consulta remota de MIME. |
| `app/modules/auth/routes.php` | rota `/auth/testeEmail` desativada (comentário com o motivo). |
| `app/core/session.php` | `solicitarPerfilDeAcesso()` lê o perfil de `$_SESSION['usuario']`. |
| `app/modules/fazenda/views/assets/js/19-movimento-pelo-teclado.js` | entrada analógica do joystick. |
| `app/modules/fazenda/views/assets/js/19b-joystick-movel.js` (novo) | joystick. |
| `app/modules/fazenda/views/assets/css/12-joystick-movel.css` (novo) | visual do joystick. |
| `app/modules/fazenda/views/assets/js/fazenda.js`, `views/fazenda.html` | registro do script e do CSS novos. |
| `.../easter-eggs/caverna/personagens/hulk.js` | ângulos do gesto rugir. |

O `core` tem um README pedindo para não ser editado sem conversa com o instrutor: as mudanças no core são **um arquivo novo**
(não altera os existentes) e **uma linha** em `session.php` (função que hoje nenhuma rota usa). Recomenda-se abrir a Issue
correspondente para a equipe revisar.

---

## 5. O que depende de decisão institucional ou infraestrutura (NÃO implementado)

1. **Proxies de IA/execução de código (S5, S6)**: exigir login (e perfil) nas rotas `/api/*` e `enviarSubmissao`; trocar o
   proxy genérico por endpoints fechados (só `submissions` do Judge0 e só o modelo/rota usados do Ollama); tirar os IPs do código
   para o `.env`; remover `Access-Control-Allow-Origin: *`; limitar requisições por usuário. Decisão: onde Judge0/Ollama vão
   rodar em produção e quem pode usá-los.
2. **Contas de instrutor (S7)**: convite/aprovação por administrador da unidade ou validação por domínio institucional.
3. **Multi-instituição**: criar `instituicoes`/`unidades` e ligar usuários, cursos e turmas a uma unidade; filtrar TODAS as
   consultas por unidade; perfil "administrador da unidade"; isso muda o esquema e todos os Models — precisa de projeto e
   aprovação antes de codificar.
4. **Ambiente de produção**: `DocumentRoot` apontando para `public/` (hoje a proteção de `app/` depende do `.htaccess` da raiz e
   de `mod_rewrite`/`AllowOverride`); `.env` fora da pasta web; `display_errors=Off` e log de erros; HTTPS obrigatório e cookie
   `secure`; política de backup do MySQL (diário + teste de restauração); monitoramento de erros.
5. **LGPD**: termo de uso/consentimento, prazo de retenção, quem acessa dados de alunos, remoção do e-mail de aluno fixo no
   código (S4), anonimização para relatórios.
6. **Implantação/atualização**: processo de deploy único (hoje cada máquina roda XAMPP), versionamento do esquema (migrações),
   `vendor/` gerado no deploy (`composer install`) em vez de versionado, testes automatizados no CI.

---

## 6. Testes executados nesta missão (resultados reais)

| Teste | Como | Resultado |
|---|---|---|
| Rotas de arquivo — ataques | HTTP no localhost: `../` para sair da pasta, pedido de `.php`, `.env.example`, byte nulo | **Antes**: `auth/file` entregou README do core, código de `Controller.php` e `.env.example`. **Depois**: todos 404 |
| Rotas de arquivo — usos legítimos | os 9 assets referenciados pelas páginas | 200, conteúdo **idêntico byte a byte** ao arquivo em disco (conferido por hash com um `.env` temporário de teste, removido em seguida) |
| `/auth/testeEmail` | HTTP | 404 (desativada); `/auth/loginAluno` continua 200 com o formulário |
| Sintaxe PHP | `php -l` em todos os PHP fora do `vendor` | 96 arquivos, 0 erros |
| Joystick — 8 direções | toques emulados (CDP `Input.dispatchTouchEvent`) em 390×844 | velocidade 99–100% da máxima em todas, sentido correto, **parado logo após soltar** em todas |
| Joystick — zona morta / meia inclinação | idem | 12% do raio: não move; 59% do raio: 51% da velocidade |
| Joystick — dedo arrastado para fora da base | idem | entrada limitada a 1 (encontrado e corrigido um bug: a direção encolhia fora da base) |
| Joystick — multitoque | dedo 1 no joystick + dedo 2 arrastando no mapa | os dois ao mesmo tempo: joystick ativo e câmera girou 0,9 rad |
| Joystick — rotação da tela | retrato → paisagem durante o toque | solta na hora e se reposiciona (canto inferior esquerdo nas duas orientações) |
| Joystick — computador | sem toque | não aparece |
| Movimento (teclado e joystick) | chamada direta de `atualizarMovimento(0.1)` | W, S, A, D, W+D, S+A = 1,000 (igual a antes); joystick cima/diagonal = 1,000, meia = 0,500, parado = 0, W + joystick para baixo = 0 |
| Caverna — assinatura de pixels | 1251 poses + 17 quadros da cena | só mudaram as 27 amostras do gesto **rugir** do Hulk; os outros 7 personagens idênticos |
| Caverna — Hulk 60 s na cena real | um quadro a cada 0,5 s | braços sempre do próprio lado em todos os rugidos |
| Caverna/celeiro — convivência | script | celeiro abre/fecha, caverna recusa durante invasão e com o celeiro aberto, OIIA ausente, sem erros |
| Caverna — falas | script | no máximo 2 balões, 0 sobreposições, 0 fora da cena, resposta Batman→Coringa, sem erros |
| Caverna — estado da Fazenda | diff do estado antes/durante/depois | só `atividade.ultima` muda |
| Fazenda — suíte de 19 testes | salvar, abdução, lenhador, alquimia, conquistas, objetivos, clima, economia, interface, selo, invasões | comparada com a execução anterior: **nenhuma verificação piorou**. `teste-et-abducao` e `teste-interface` falham com o MESMO erro de antes da missão (scripts de teste desatualizados em relação à interface); em `teste-invasoes-c` o campo `adiada` deixou de existir após o commit da equipe `5efa090` (código de invasões não foi alterado nesta missão) |

## 7. O que NÃO foi testado (e por quê)

- **Login, permissões, banco, persistência no servidor, notas, turmas, atividades**: o MySQL não está rodando nesta máquina e o
  projeto não tem `.env`; só foi possível testar rotas que não acessam o banco. Precisa de homologação num ambiente com banco.
- **Joystick em aparelho físico (Android, iOS, tablet)**: testado só com emulação de toque do Chrome. Em especial, **tocar um
  botão com outro dedo enquanto segura o joystick**: o botão recebe o toque (`pointerdown` confirmado), mas a emulação não
  reproduz de forma confiável o "soltar só um dedo", então o clique nesse cenário não foi confirmado.
- **Judge0/Ollama, envio de e-mail**: serviços externos/rede local indisponíveis aqui.
- **Desempenho antes × depois**: o joystick não adiciona laço de animação (só eventos e uma conferência a cada 250 ms); não houve
  medição comparativa de FPS nesta missão.
- **Contraste e leitor de tela** das telas PHP dos outros módulos: não auditados.

---

## 8. Missão final de fechamento (23/11/2026) — achados novos e situação

Executada com um **banco de homologação isolado** (`the_farmer_edu_homologacao`, criado a partir de uma cópia do `schema.sql`
com o nome trocado, `.env` temporário; ambos removidos no fim, o MySQL foi parado; o banco real `the_farmer_edu` não foi tocado).
Isso permitiu testar pela primeira vez login, sessões, permissões e persistência de ponta a ponta. Detalhes e resultados:
`docs/ENCERRAMENTO-TECNICO-2026-11-23.md`.

| # | Severidade | Achado | Situação |
|---|---|---|---|
| F1 | Médio (hoje) / Alto (se o instrutor passar a ver o nome) | **XSS pelo nome da fazenda**: o nome digitado pelo aluno ia para o HTML do Diário sem escape; `<img src onerror=…>` (23 caracteres, cabe no limite de 28) **executou** ao abrir o Diário. Hoje só o próprio aluno vê o nome, mas ele é gravado no servidor (`nome_fazenda`, "para relatórios do instrutor"). | **Corrigido e testado**: Diário escapa nome, título, texto, ícone e chave dos registros (`30f-conquistas-e-diario.js`); o mesmo nome agora aparece como texto e não executa |
| F2 | Médio | Save da Fazenda sem limite de tamanho (parte de S12). | **Corrigido e testado**: 512 KB (save real ≈ 5 KB; MySQL do XAMPP aceita 1 MB por pacote): ~300 KB aceito, ~600 KB → 413 |
| F3 | **Alto (bloqueia a publicação desta branch)** | A branch está **1 commit atrás da `origin/main`** (`800ac71`, backend do squad 6). Nela, o módulo Atividades está quebrado: `Controller.php` usa a classe `Gabarito`, que não existe no `Model.php` desta branch (salvar atividade → 500 "Class Gabarito not found"); o `schema.sql` não cria `atividades.resposta_referencia` (dados do instrutor → 500 "Unknown column"); e o servidor não gera nem confere o token CSRF que a página envia. Na `main` os três estão resolvidos (classe, coluna e 9 usos de CSRF). | **Não alterado** (corrigir aqui duplicaria o código do squad 6 e criaria conflito). Conferido: desde a base comum, a `main` mudou só 4 arquivos, todos em `app/modules/atividades`, e nenhuma alteração local toca neles — **atualizar com a `main` não gera conflito** com o trabalho local. A coluna, aplicada só no banco de homologação, fez a tela responder 200 |
| F4 | Médio | Rotas que param com erro fatal: `/respostas` (`submissoes/view/respostas.html` não existe) e `/feedback_ia/respostaReferencia` (`feedback_ia/view/respostaReferencia.php` não existe); `/api/*` sem `app/modules/api/.env` (erro fatal mostrando caminhos do servidor). | Não alterado (módulos de outros squads; precisam dos arquivos/configuração corretos) |
| F5 | Baixo | Página `home` (exemplo do esqueleto): lia `tipo_usuario` (a sessão usa `perfilAcesso`) e o link "Entrar" apontava para `auth/login`, rota inexistente. | **Corrigido e testado** (sem aviso PHP; links 200) |
| F6 | Baixo | `notas`: o instrutor que abre `notas/aluno` é redirecionado para `http://localhost/notas/instrutor` (sem a pasta do projeto) — quebra numa instalação em subpasta. | Não alterado (módulo de outro squad; há a branch `Squad-11/Notas2` em andamento) |
| F7 | Informativo | `database/fazenda_alteracoes.sql` falha num banco criado pelo `schema.sql` atual (as colunas já existem) — é só para bancos antigos. | Documentado em `docs/INSTALACAO-E-EXECUCAO.md` |
| F8 | Informativo | Testes antigos da suíte da Fazenda: `teste-interface` usa as poções antigas (`tonico`, `elixir`, `essencia`), substituídas pela equipe (o jogo converte as antigas em minérios ao carregar); `teste-et-abducao` é a segunda metade de um roteiro e depende de um ET iniciado por clique antes dele. | Falhas **dos testes**, não regressões (seção 6 do documento de encerramento) |

**Permissões (matriz real, 36 páginas × anônimo/aluno/instrutor):** anônimo vai ao login em todas as páginas protegidas; aluno
recebe 403 (ou é levado à sua área) nas páginas de instrutor e vice-versa; a Fazenda é só do aluno. Abertas sem login (já
conhecidas): `notificacoes` (S8), páginas de teste do `feedback_ia`, `aluno`/`iniciarAtv`/`respostas` (submissões, S6),
`gamificacao`, `api/linguagens` (S5).
