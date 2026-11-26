# The Farmer Edu — Encerramento técnico (missão final, 22–23/11/2026)

Cópia trabalhada: branch `squad-1/fazenda-maisAjustes`, HEAD `5efa090`, **nada commitado** (nenhuma operação Git de escrita foi
feita). Backup completo antes da missão (inclui `.git`): `C:\Users\Tottizin\Backups\The-Farmer-Edu_BACKUP_COMPLETO_ANTES_MISSAO_FINAL_2026-11-22`
(1254 arquivos, 175,6 MB, conferido). Backups pontuais: `..._BACKUP_ANTES_GAVETA_E_MARGENS_2026-11-23` e
`..._BACKUP_ANTES_AUDITORIA_FINAL_2026-11-23`.

**Classificação: PRONTO COM PENDÊNCIAS NÃO CRÍTICAS para a Fazenda e as edições pessoais — com UMA condição para publicar a branch:
atualizá-la com a `origin/main` (seção 4, F3), senão o módulo Atividades do instrutor sai quebrado.**

---

## 1. Refatoração de legibilidade do celeiro

Arquivos: `easter-eggs/vingadores/{configuracao,pixel,motor}.js`, `cenario/oficina.js`, `personagens/{ator,homem-de-ferro,nick-fury}.js`,
`dialogos/conversas.js`, `js/30i-cena-do-celeiro.js`. Tabela completa de nomes: `docs/EDICAO-PESSOAL-CELEIRO.md`, seção 9.
Eliminados `C`, `P`, `K`, `L`, `A`, `COR`, `a1`/`a2`, `l1`/`l2`, `ex`/`ey`/`mx`/`my`, `s`, `f`, `m`, `g`, `cx`/`cy`, `dt`, `ctx`,
`r`, `tr`, `o`, `p`, `v`, `OX`/`OY`, `so`, campos de pose `dir`/`cabecaYaw`/`cruzados`/`pe`/`bracoF1…bracoT2`, cores `R`/`Rh`/`Rd`…
Mantida a interface pública de `pixel.js` (usada pela caverna) e a API do motor (usada pela porta). A caverna não foi tocada nesta missão.

**Evidência:** assinatura de pixels determinística — celeiro: 3000 quadros + 4356 mudanças de fala em 600 s de cena, **idênticos**
antes e depois (conferido depois de cada arquivo); caverna (usa `pixel.js`): 1251 amostras + 17 quadros **idênticos**. Na
Fazenda real: celeiro e caverna abrem e fecham, 1 laço cada, 541 quadros em 9 s, estado da Fazenda preservado, sem erros.

## 2. Tutorial, gaveta e margens seguras

- **Gaveta aberta em tela estreita:** cartão e gaveta se acomodam (empilhados no celular em pé; lado a lado no deitado). Arquivos:
  `32b-tutorial.js`, `08-tutorial.css`.
- **Margens dos botões:** `#barra-topo` começa e termina nas margens seguras (`02-interface.css`): XP, recursos, som, menu e
  Inventário/Objetivos/Diário saem do entalhe.
- **Testado (emulação do Chrome, Fazenda nova):** 360×640, 375×667, 390×844 (entalhe 47/34), 412×915, 667×375, 640×360 (entalhe 24),
  740×360 (32), 844×390 (47/21), 932×430 (59/21), 1024×600, 1024×600 com entalhe sem toque, 1180×820 — em convite, aberto,
  passo 2, minimizado, gaveta aberta e fechado: o cartão não cobre nenhum botão nem texto importante, botões do cartão inteiros,
  sem rolagem própria, margens respeitadas; joystick 9 de 9 pontos livres sempre que visível; gaveta aberta com 134–429 px de
  rolagem. Joystick: 8 direções, zona morta, meia inclinação, multitoque, rotação e teclado iguais aos de antes; detecção com o
  DevTools real: escondido com F12, visível na emulação, some em 25–45 ms ao sair.
- **Não testado:** aparelho físico (Android/iOS). Toque simultâneo joystick + botão: o botão recebe o toque, mas a emulação não gera o clique.

## 3. Homologação com servidor e banco (primeira vez)

Banco isolado `the_farmer_edu_homologacao` (cópia do `schema.sql` com o nome trocado — o original faz `DROP DATABASE
the_farmer_edu`), `.env` temporário; **removidos no fim, MySQL parado, banco real intocado**.

| Fluxo | Resultado |
|---|---|
| Cadastro e login de aluno e de instrutor; senha errada | ok (25/25 verificações HTTP) |
| Sessão: Fazenda sem login → login; salvar/xp sem login → 401; logout → pede login de novo | ok |
| Permissões: instrutor na Fazenda → 403; matriz de 36 páginas × 3 perfis | ok (seção 4 da auditoria) |
| Fazenda pelo PHP no navegador: abre, salva sozinha no banco (revisão 2, XP 5 = `alunos.xp_total`) | ok |
| Recarregar: save volta do banco, objetos `{}` preservados; aba antiga → 409 | ok |
| XP de atividade (`xp_logs`) chega ao jogo (0+5+10=15) e fica marcado como entregue | ok |
| Ataques `../` nas 4 rotas de arquivo | 404 |
| Save de ~300 KB / ~600 KB | 200 / 413 (correção F2) |

## 4. Auditoria — correções e pendências (tabela completa: `docs/AUDITORIA-E-PREPARACAO-NACIONAL.md`, seção 8)

| # | Gravidade | Situação |
|---|---|---|
| F1 XSS pelo nome da fazenda no Diário | Médio (Alto se o instrutor passar a ver o nome) | **Corrigido e testado** (`30f-conquistas-e-diario.js`) |
| F2 Save sem limite de tamanho | Médio | **Corrigido e testado** (`fazenda/Controller.php`, 512 KB) |
| F3 Branch 1 commit atrás da `main`: Atividades quebrado aqui (classe `Gabarito`, coluna `resposta_referencia`, CSRF) | **Alto — bloqueia publicar esta branch** | Não alterado: **atualizar com a `origin/main`** (sem conflito com o trabalho local: a `main` só mudou 4 arquivos de `atividades` desde a base comum). Uma correção de CSRF chegou a ser feita aqui e foi **desfeita** ao descobrir que a `main` já tem a dela |
| F4 `/respostas`, `/feedback_ia/respostaReferencia` (view ausente), `/api/*` sem `api/.env` | Médio | Não alterado (outros squads) |
| F5 `home` (`tipo_usuario`, link `auth/login` inexistente) | Baixo | **Corrigido e testado** |
| F6 `notas`: redirecionamento sem a pasta do projeto | Baixo | Não alterado (squad de Notas, branch em andamento) |
| S5–S8, S10, S11, S12 (proxies abertos, cadastro de instrutor livre, notificações de teste, aviso sem `.env`, XP no cliente, `secure`/HTTPS) | Crítico a médio | **Dependem de decisão/infraestrutura** (seção 5 da auditoria) |

Preparação para outras unidades SENAI: continua válida a seção 5 da auditoria (sem conceito de unidade no banco, configuração por
máquina, sem migrações versionadas, sem CI de testes, LGPD). Nada disso foi inventado ou implementado aqui.

## 5. Desempenho e estabilidade (medidos)

Caverna: 60 qps, 1,52–1,67 ms por quadro (antes da missão 1,69–1,74). Celeiro: ~60 qps. Fazenda: 42–47 qps antes e depois das
cenas (mesma faixa das medições anteriores), memória igual no início e no fim, 0 laços ativos depois de sair, nenhum erro de
console, nenhum recurso 404 na Fazenda servida pelo PHP. Sintaxe PHP: 96 arquivos, 0 erros.

## 6. Suíte da Fazenda (19 testes, cada um com limite de tempo)

Todos executaram até o fim (nenhum travou). Comparação com a execução anterior: **nenhuma verificação piorou**. Únicas mudanças:
`invasoes-c` (teste corrigido: noite do jogo + dia útil; agora a invasão espera e começa como devia e a poção é bloqueada).
**Falhas antigas, não regressões:** `teste-interface` usa as poções antigas (`tonico`/`elixir`/`essencia`), que a equipe
substituiu (o jogo converte as antigas em minérios); `teste-et-abducao` é a 2ª metade de um roteiro que exige um ET iniciado por
clique antes — rodado sozinho sempre falha. Os dois precisam ser reescritos (são ferramentas de teste fora do repositório).

## 7. Documentação

Criados: `docs/INSTALACAO-E-EXECUCAO.md` (verificado na prática), este documento. Atualizados: `AUDITORIA-E-PREPARACAO-NACIONAL.md`
(seções 3 e 8, correção sobre CSRF), `EDICAO-PESSOAL-CELEIRO.md` (seção 9, paletas), `EDICAO-PESSOAL-CAVERNA.md` (nota da seção 21),
`ENTREGA-DA-FAZENDA.md` (instalação e pendência "teste com banco" resolvida). O `README.md` da raiz (lista dos squads) não foi
alterado para não conflitar com as outras equipes — sugestão: acrescentar nele um link para `docs/INSTALACAO-E-EXECUCAO.md`.

## 8. Antes de publicar (decisões suas)

1. **Atualizar a branch com a `origin/main`** (F3) e repetir o fluxo do instrutor em Atividades.
2. Revisar o diff e decidir o que entra no commit: as edições pessoais (celeiro, caverna, joystick) estão fora da versão da equipe.
3. Decidir sobre os arquivos soltos versionados `how --stat e0131b0` e `gamificacao/temp_router_check.php`.
4. Homologar o joystick e o tutorial num celular de verdade.
