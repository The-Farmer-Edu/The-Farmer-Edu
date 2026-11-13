# Backend da Fazenda — o que foi feito e como instalar

## O que o backend faz

1. **Salva a fazenda no banco.** O jogo envia o objeto `estado` inteiro para `POST /fazenda/salvar` (5 s depois da última mudança, ao esconder a aba e ao fechar a página). Fica em `fazendas.estado` (JSON), uma linha por aluno (a tabela `fazendas` já existe no `schema.sql`; ganha 4 colunas).
2. **Carrega a fazenda do banco.** `GET /fazenda` exige aluno logado e injeta o save no HTML (`window.FARMEDU_SERVIDOR`). Com o servidor, o `localStorage` não é mais lido nem gravado (em computador compartilhado ele misturaria alunos).
3. **Credita XP das atividades.** Quando o instrutor lança ou altera uma nota, `FazendaModel::registrarXPPorNota()` grava em `xp_logs` (XPLog do schema) o XP da atividade, ligado à nota por `id_nota`, e ajusta `alunos.xp_total` na hora. O jogo busca o XP pendente (`GET /fazenda/xp-pendente`), aplica com `window.adicionarXP` e confirma no próximo save, na mesma transação.
4. **Só a aba aberta por último salva.** Cada abertura da fazenda gera um código (`fazendas.sessao_ativa`) e só a página com o código atual consegue gravar. Uma aba esquecida em segundo plano, ou uma página antiga, nunca sobrescreve a que o aluno está usando.

### Regra de XP implementada (confirmar com a equipe)

- XP da atividade = `nota ÷ 10 × 100` (nota 10 = 100 XP, nota 8 = 80). O 100 é `FazendaModel::XP_MAXIMO_POR_ATIVIDADE`.
- Vale a nota do **instrutor** da tentativa mais recente que ele corrigiu. Nota só da IA não rende XP (RN04).
- O log guarda só a **diferença** para o que já foi creditado na atividade (soma dos `xp_logs` cujas notas são dela): corrigir duas vezes não duplica e baixar a nota gera lançamento **negativo** (retrocesso).
- **`alunos.xp_total` é o XP que o aluno tem na fazenda** (o saldo do jogo): sobe quando ele ganha e desce quando perde ou gasta. Duas rotinas o mantêm:
  - `registrarXPPorNota` soma ou subtrai a diferença da nota na hora, sem esperar o aluno abrir o jogo;
  - a cada save, `salvar()` recalcula `xp_total = saldo do jogo + XP creditado ainda não aplicado`. Assim ele passa a refletir também colheitas, mina, monstros e gastos.
  - A coluna é `UNSIGNED`: saldo negativo no jogo aparece como 0 em `xp_total`.
- Esse XP não entra no limite diário de 100 XP da Fazenda (é XP de atividades).

## O que é gravado em cada tabela

| Tabela | Quando recebe dados |
|---|---|
| `fazendas` | A cada save: o JSON do jogo, o nome da fazenda e a revisão. |
| `elementos_fazenda` | A cada save: uma linha por área construída (nível 1 ou mais), com `codigo` (id da área), `tipo` (construcao, plantacao ou animal) e `nivel`. |
| `xp_logs` | (a) A cada save em que o saldo de XP do jogo mudou: uma linha por origem de ganho (colheitas, mina e monstros, devolução, teste) e uma linha negativa com o XP gasto. (b) Quando o instrutor lança ou altera uma nota (precisa do bloco no módulo de Notas). |
| `alunos` | `xp_total` é recalculado a cada save e a cada nota. |


## Arquivos

| Arquivo | Destino | O que mudou |
|---|---|---|
| `sql/fazenda_alteracoes.sql` | rodar no banco | Novo: `ALTER TABLE` em `fazendas` (+4 colunas), `elementos_fazenda` (+`codigo` e índice único) e `xp_logs` (+`entregue_em` e um índice) |
| `sql/schema.sql` | opcional | Seu `schema.sql` com essas mesmas colunas já incluídas (só linhas acrescentadas); use no lugar do original em instalações novas |
| `Model.php` | `app/modules/fazenda/` | Novo conteúdo (antes vazio): `FazendaModel` |
| `Controller.php` | `app/modules/fazenda/` | Login de aluno, injeção do save, rotas `salvar` e `xpPendente`, **`sendFile` corrigido** |
| `routes.php` | `app/modules/fazenda/` | 2 rotas novas |
| `views/assets/js/34-sincronizacao-com-servidor.js` | `app/modules/fazenda/views/assets/js/` | Novo: envia o save e aplica o XP |
| `views/assets/js/05-progresso-e-salvamento.js` | idem | 3 trechos marcados com `Backend:` |
| `views/assets/js/fazenda.js` | idem | 1 linha: o arquivo 34 entra na montagem |

## Conflito de abas, nome da fazenda e ids (ajustes das rodadas 2 e 3)

**Aviso "esta fazenda foi aberta em outra aba" (HTTP 409).** Na 2ª rodada o controle era um número de revisão: se o número da página não fosse o do banco, o save era recusado. Isso era frágil: uma aba esquecida em segundo plano continua salvando (o jogo muda o estado o tempo todo) e fazia a aba que o aluno estava usando ser recusada; recarregar, voltar pelo botão "Voltar" do navegador ou perder a resposta de um envio também deixavam o número velho. E a recarga automática que eu tinha acrescentado fazia a tela de carregamento aparecer duas vezes. Agora:
- cada vez que a página da fazenda abre, o servidor gera um código novo e o grava em `fazendas.sessao_ativa`; a página envia esse código em cada save;
- só a **página aberta por último** consegue salvar; reenviar o mesmo save é sempre seguro (resposta perdida não causa mais aviso);
- a aba mais antiga é a recusada: ela para de salvar, avisa e pergunta se o jogador quer continuar por ali (se aceitar, recarrega e passa a ser a ativa). Se a aba antiga estiver escondida, a pergunta aparece quando ele voltar a ela;
- ao voltar para a fazenda pelo botão "Voltar" do navegador, a página é recarregada para pegar a sessão atual;
- ao abrir a fazenda, o estado e o XP pendente continuam sendo lidos juntos, com a linha travada (`carregarTudo`);
- a coluna `revisao` continua subindo a cada save, só como contador; ela não bloqueia mais nada.

**Instalação destruída voltava ao normal ao recarregar (objetos vazios `{}` virando `[]`).** No PHP, `{}` e `[]` decodificados como array são o mesmo array vazio, então regravar o save com `json_decode(..., true)` + `json_encode` trocava todo objeto vazio por lista vazia. Uma lista não guarda propriedades por nome e o `JSON.stringify` do jogo as descarta: `danos` (instalações destruídas), `invasao`, `melhorias` da equipe e outras chaves que começam vazias não eram salvas. Agora:
- o `Controller.php` guarda o JSON do estado recodificado a partir de **objetos**, preservando `{}` e `[]` como o jogo enviou; o `carregarTudo` também lê como objeto;
- o `05-progresso-e-salvamento.js` conserta, ao abrir, os saves que **já** foram gravados com `[]` (campos que devem ser objetos). O que foi destruído ou melhorado antes da correção não estava salvo e não dá para recuperar.
- Regra para qualquer mudança futura no PHP: nunca grave de volta um estado decodificado como array; use o JSON original ou objetos.

**Editar o banco com o jogo aberto não é suportado.** O jogo grava o save inteiro a cada mudança, então uma alteração feita direto na tabela enquanto a fazenda está aberta é sobrescrita (e a `revisao` não muda, então o jogo não percebe). Para renomear pelo phpMyAdmin: feche a fazenda, altere `fazendas.nome_fazenda` e abra de novo. Agora o nome da coluna `nome_fazenda` é o que vale ao abrir o jogo.

**Ids que "aumentam".** As linhas existentes **não** mudam de id: o que crescia era o contador `AUTO_INCREMENT`, porque um `INSERT IGNORE` ou `INSERT ... ON DUPLICATE KEY UPDATE` em linha que já existe não grava nada, mas consome um número. Agora a fazenda só é inserida se não existir, e `elementos_fazenda` só recebe `INSERT` para área nova, `UPDATE` para nível alterado e `DELETE` para área que sumiu. Números já pulados continuam pulados (é inofensivo). Em banco de teste dá para reiniciar o contador com `ALTER TABLE fazendas AUTO_INCREMENT = 1;` (o MySQL usa o maior id + 1); nunca renumere linhas existentes.

## Instalação

1. Banco já criado: rode `sql/fazenda_alteracoes.sql`. Banco novo: rode o `sql/schema.sql` ajustado (use um dos dois, não os dois). Se `xp_logs` já tiver linhas antigas que não devem ir para o jogo, o script traz um `UPDATE` comentado para marcá-las como entregues.
2. Copie os arquivos da tabela acima.
3. **Squad de Notas:** em `NotasModel::salvarNota()` (`modules/notas/Model.php`), antes do `return true;` final, acrescente:

```php
        // Fazenda: o instrutor validou a nota (RN04) → calcula/ajusta o XP da atividade.
        try {
            require_once __DIR__ . '/../fazenda/Model.php';
            (new FazendaModel($this->pdo))->registrarXPPorNota($idSubmissao);
        } catch (Throwable $e) {
            error_log('[Fazenda] XP não registrado: ' . $e->getMessage());   // a nota já foi salva; não derruba o lançamento
        }
```

## Como testar

1. Entre como **aluno** e abra `/fazenda`. Construa algo e espere uns 6 s: `SELECT f.id_aluno, f.nome_fazenda, f.revisao, a.xp_total FROM fazendas f JOIN alunos a ON a.id_usuario = f.id_aluno;` deve mostrar a linha, com `xp_total` igual ao XP que aparece na barra superior do jogo (o aluno precisa existir em `alunos`).
2. Recarregue ou abra em outro navegador com o mesmo aluno: a fazenda volta igual.
3. Como **instrutor**, lance a nota 8 numa submissão desse aluno: `xp_logs` ganha `+80` com `entregue_em` NULL e `alunos.xp_total` sobe 80. Com o jogo aberto, em até 60 s (ou ao voltar para a aba) aparece "📚 Atividades: +80 XP" e `entregue_em` é preenchido.
4. Altere a nota para 6: entra `-20` (o saldo do jogo e o `xp_total` descem 20).
5. Gaste XP no jogo (por exemplo, construa algo) e espere o save: `xp_total` desce o mesmo valor.
6. Abra a fazenda em duas abas: a mais antiga, ao tentar salvar, recebe o aviso e a pergunta "quer continuar por aqui?"; a mais nova continua salvando normalmente.
7. Sem login, `/fazenda` redireciona para `/auth/loginAluno`; como instrutor, responde 403.

> Observação: o PHP e o MySQL **não estavam disponíveis no meu ambiente**, então o código PHP e o SQL foram revisados mas **não executados**. A lógica de sincronização do JavaScript foi testada com um servidor simulado (aplicar XP positivo e negativo sem repetir id, nova tentativa após erro 500, bloqueio no 409).

## Correção de segurança no `sendFile` (módulo da Fazenda)

O `sendFile` antigo concatenava `type` e `file` no caminho sem validar. Com `../` dava para ler arquivos fora de `views/assets` (por exemplo `core/.env`, com a senha do banco), e o arquivo ainda era executado com `require_once` depois de enviado. Agora o caminho real precisa estar dentro de `views/assets`, a extensão precisa estar na lista e o arquivo só é enviado. A função `get_content_mime_type` (que consulta um site externo a cada requisição) deixou de ser usada e pode ser apagada.

## Decisões em aberto

- **XP por atividade:** 100 fixo para nota 10, ou o instrutor define por atividade? (A tabela `atividades` do schema não tem coluna de XP.)
- **`xp_total` negativo:** a coluna é `UNSIGNED`, então o saldo negativo (permitido no jogo, por enquanto) fica 0 no banco. Se quiserem guardar o valor exato, a coluna teria que virar `INT` com sinal (`ALTER TABLE alunos MODIFY xp_total INT NOT NULL DEFAULT 0`).
- **`fazendas.nivel` e `estado_visual`:** continuam com o valor padrão (1 e 'inicial'); o backend não os preenche. Dá para derivá-los do save (por exemplo, a soma dos níveis das áreas) se algum relatório precisar.
- **Desempenho insuficiente (RF19):** hoje só há retrocesso quando a nota é corrigida para baixo. Se quiserem perda de XP por nota baixa, é uma regra a mais em `registrarXPPorNota`.
- **XP sem piso em zero:** mantido, como decidido.
- **Save dos desenvolvedores:** quem já jogou pelo `localStorage` começa uma fazenda nova ao abrir pela aplicação. Se quiserem importar o save local uma vez, dá para acrescentar.
- **Confiança no navegador:** o `estado` (inclusive o XP gasto) vem do cliente; o servidor valida o formato, não as regras do jogo. Um aluno técnico poderia alterar o próprio save. Validar as regras no servidor seria uma etapa futura.

## Encontrado em outros módulos (para avisar os squads)

- **core (usar Issue):** `solicitarPerfilDeAcesso()` lê `$_SESSION['perfilAcesso']`, mas o perfil fica em `$_SESSION['usuario']['perfilAcesso']`, então ela bloqueia todo mundo. Os módulos contornam com `usuarioLogado()`. O README do core manda usar `conectar()`, mas a função se chama `iniciarPDO()`.
- **submissoes:** o `sendFile` tem a mesma falha de caminho e `require_once` descrita acima.
- **notas:** `salvarNota` não confere se a submissão pertence a uma turma do instrutor logado.
- **atividades:** o Controller chama `Gabarito` e `Atividade::gravar`, que não existem no `Model.php` enviado (parece versão diferente do Model), e `baixarArquivo` não tem rota.

## Observação sobre o `schema.sql`

O último comando (`CREATE TABLE arquivos`) está sem `;` no final e sem `ENGINE`. No phpMyAdmin costuma funcionar, mas pelo cliente `mysql` em linha de comando a tabela pode não ser criada. Vale acrescentar o `;`.
