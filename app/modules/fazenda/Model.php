<?php

require_once __DIR__ . '/../../core/database.php';

// Lançada quando o save do banco já foi alterado por outra aba/computador desde que este jogo o carregou.
// Lançada quando o save vem de uma página que NÃO é mais a "sessão ativa" da fazenda: outra aba ou janela abriu a fazenda
// depois dela. Regra: quem abriu a fazenda por último é quem salva (ver carregarTudo e salvar).
class ConflitoDeSaveException extends RuntimeException
{
}

// =====================================================================
// FazendaModel — save da fazenda e XP vindo das atividades
// Tabelas do schema.sql: fazendas (save em JSON), elementos_fazenda (uma linha por área construída), xp_logs (histórico de XP,
// XPLog), notas, submissoes e alunos.
// alunos.xp_total = XP que o aluno TEM na fazenda (saldo): sobe com o que ele ganha e desce com o que ele perde ou gasta.
// Colunas acrescentadas por sql/fazenda_alteracoes.sql: fazendas.{nome_fazenda, estado, versao_estado, revisao},
// elementos_fazenda.codigo e xp_logs.entregue_em.
// =====================================================================
class FazendaModel
{
    // XP que uma atividade vale com nota 10. A nota 5 vale metade, e assim por diante (arredondado).
    // Se o instrutor puder definir o XP por atividade, é aqui que o valor da atividade entra no lugar da constante.
    public const XP_MAXIMO_POR_ATIVIDADE = 100;

    private const LIMITE_DO_ESTADO_BYTES = 1000000;
    private const LIMITE_DE_IDS_POR_SAVE = 500;

    // tipo de cada área em elementos_fazenda.tipo (área desconhecida entra como 'construcao').
    private const TIPO_DAS_AREAS = [
        'casa' => 'construcao', 'ponte' => 'construcao', 'celeiro' => 'construcao', 'maquinario' => 'construcao',
        'moinho' => 'construcao', 'mina' => 'construcao',
        'plantacaoGrande' => 'plantacao', 'novaPlantacao' => 'plantacao',
        'curral' => 'animal', 'ovelhal' => 'animal', 'galinheiro' => 'animal', 'chiqueiro' => 'animal', 'estabulo' => 'animal',
    ];

    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? iniciarPDO();
    }

    // -----------------------------------------------------------------
    // SAVE DA FAZENDA
    // -----------------------------------------------------------------

    private function garantirFazenda(int $idAluno): void
    {
        // Consulta antes de inserir: um INSERT IGNORE em linha que já existe NÃO grava nada, mas ainda assim consome um
        // número do AUTO_INCREMENT (os ids de id_fazenda "pulavam" a cada save). Assim o id só avança em fazenda nova.
        $st = $this->pdo->prepare('SELECT 1 FROM fazendas WHERE id_aluno = ? LIMIT 1');
        $st->execute([$idAluno]);
        if ($st->fetchColumn()) {
            return;
        }
        $st = $this->pdo->prepare('INSERT IGNORE INTO fazendas (id_aluno) VALUES (?)');   // IGNORE cobre duas requisições simultâneas
        $st->execute([$idAluno]);
    }

    /** Devolve o save do aluno (estado = null para fazenda nova) e a revisão atual. */
    public function carregar(int $idAluno): array
    {
        $this->garantirFazenda($idAluno);

        $st = $this->pdo->prepare('SELECT estado, revisao FROM fazendas WHERE id_aluno = ?');
        $st->execute([$idAluno]);
        $linha = $st->fetch();

        $estado = $linha['estado'] !== null ? json_decode($linha['estado'], true) : null;

        return [
            'estado'  => is_array($estado) ? $estado : null,
            'revisao' => (int) $linha['revisao'],
        ];
    }

    /**
     * Tudo o que a página da fazenda precisa ao abrir, lido de uma vez só e já com a linha da fazenda travada.
     * Como salvar() trava a mesma linha, a leitura nunca pega "metade" de um save (estado de antes do save e lista de XP
     * pendente de depois, que faria o XP entregue sumir). O nome vem da coluna fazendas.nome_fazenda: se alguém o
     * alterar direto no banco, o jogo mostra o novo nome ao recarregar.
     *
     * SESSÃO ATIVA: cada vez que a página da fazenda é aberta, este método gera um código novo, grava em
     * fazendas.sessao_ativa e o entrega à página. Só a página com o código atual consegue salvar (ver salvar()). Assim
     * uma aba esquecida em segundo plano, ou uma página antiga, nunca sobrescreve a aba que o aluno está usando agora.
     */
    public function carregarTudo(int $idAluno, bool $abrirSessao = true): array
    {
        $this->garantirFazenda($idAluno);
        $this->pdo->beginTransaction();
        try {
            $st = $this->pdo->prepare('SELECT estado, nome_fazenda FROM fazendas WHERE id_aluno = ? FOR UPDATE');
            $st->execute([$idAluno]);
            $linha = $st->fetch();

            // Lido como OBJETO (não array) para preservar {} e []: o jogo recebe o estado exatamente como o gravou.
            $estado = $linha['estado'] !== null ? json_decode($linha['estado']) : null;
            $estado = is_object($estado) ? $estado : null;
            if ($estado !== null) {
                unset($estado->_abaId);   // marca de uma versão anterior do backend, não faz parte do jogo
                $nome = mb_substr(trim((string) $linha['nome_fazenda']), 0, 28);
                if ($nome !== '') {
                    $estado->nomeDaFazenda = $nome;
                }
            }

            $sessao = null;
            if ($abrirSessao) {
                $sessao = bin2hex(random_bytes(16));
                $st = $this->pdo->prepare('UPDATE fazendas SET sessao_ativa = ? WHERE id_aluno = ?');
                $st->execute([$sessao, $idAluno]);
            }

            $resultado = [
                'estado'     => $estado,
                'sessao'     => $sessao,
                'xpPendente' => $this->xpPendente($idAluno),
            ];
            $this->pdo->commit();
            return $resultado;
        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }
    }

    /**
     * Grava o save (só da sessão ativa) e, na MESMA transação, marca como entregues os XP que o jogo acabou de aplicar.
     * Devolve a nova revisão. Lança ConflitoDeSaveException se a revisão enviada não for a atual.
     */
    public function salvar(int $idAluno, array $estado, string $sessao, array $idsXpEntregues, ?string $estadoJson = null): int
    {
        $estado = $this->validarEstado($estado);

        unset($estado['_abaId']);   // marca de uma versão anterior do backend; não faz parte do jogo

        // $estadoJson é o JSON do estado recodificado a partir de objetos (preserva {} e []); $estado (array) serve só para
        // validar e para os cálculos (xp, níveis, origens de XP). Nunca grave $estado de volta: ele troca {} por [].
        $json = $estadoJson ?? json_encode($estado, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($json === false || strlen($json) > self::LIMITE_DO_ESTADO_BYTES) {
            throw new InvalidArgumentException('O save da fazenda é inválido ou grande demais.');
        }

        $ids = array_values(array_unique(array_filter(array_map('intval', $idsXpEntregues), fn($id) => $id > 0)));
        if (count($ids) > self::LIMITE_DE_IDS_POR_SAVE) {
            throw new InvalidArgumentException('XP entregue demais em um único envio.');
        }

        $nome = mb_substr(trim((string) ($estado['nomeDaFazenda'] ?? '')), 0, 60);
        if ($nome === '') {
            $nome = 'FarmEdu';
        }

        $this->garantirFazenda($idAluno);
        $this->pdo->beginTransaction();
        try {
            $st = $this->pdo->prepare('SELECT id_fazenda, revisao, sessao_ativa, estado FROM fazendas WHERE id_aluno = ? FOR UPDATE');
            $st->execute([$idAluno]);
            $linha = $st->fetch();
            $revisaoAtual = (int) $linha['revisao'];
            $idFazenda    = (int) $linha['id_fazenda'];
            $anterior     = $linha['estado'] !== null ? json_decode($linha['estado'], true) : null;
            $anterior     = is_array($anterior) ? $anterior : null;

            // Só a sessão ativa (a página aberta por último) pode salvar. Reenviar o mesmo save várias vezes é seguro.
            if ($linha['sessao_ativa'] === null || $sessao === '' || !hash_equals((string) $linha['sessao_ativa'], $sessao)) {
                throw new ConflitoDeSaveException('Esta fazenda foi aberta em outra aba ou computador.');
            }

            $nova = $revisaoAtual + 1;

            $st = $this->pdo->prepare(
                'UPDATE fazendas
                    SET estado = ?, nome_fazenda = ?, versao_estado = ?, revisao = ?
                  WHERE id_aluno = ?'
            );
            $st->execute([$json, $nome, (int) ($estado['versao'] ?? 0), $nova, $idAluno]);

            $xpDeAtividadesAplicado = 0;
            if ($ids) {
                $marcas = implode(',', array_fill(0, count($ids), '?'));
                $st = $this->pdo->prepare(
                    "SELECT COALESCE(SUM(quantidade), 0) FROM xp_logs
                      WHERE id_aluno = ? AND entregue_em IS NULL AND id_xp IN ($marcas)"
                );
                $st->execute(array_merge([$idAluno], $ids));
                $xpDeAtividadesAplicado = (int) $st->fetchColumn();

                $st = $this->pdo->prepare(
                    "UPDATE xp_logs SET entregue_em = NOW()
                      WHERE id_aluno = ? AND entregue_em IS NULL AND id_xp IN ($marcas)"
                );
                $st->execute(array_merge([$idAluno], $ids));
            }

            // Histórico de XP do jogo (xp_logs) e as áreas construídas (elementos_fazenda), derivados deste save.
            $this->registrarMovimentosDaFazenda($idAluno, $anterior, $estado, $xpDeAtividadesAplicado);
            $this->sincronizarElementos($idFazenda, is_array($estado['niveis']) ? $estado['niveis'] : []);

            // alunos.xp_total = XP que o aluno tem na fazenda. É o saldo do jogo (ganhos e gastos) MAIS o XP que as notas
            // já creditaram no banco e o jogo ainda não aplicou (pendente), para não "perder" a nota enquanto o aluno
            // não abre a fazenda. A coluna é UNSIGNED: saldo negativo fica gravado como 0.
            $st = $this->pdo->prepare('SELECT COALESCE(SUM(quantidade), 0) FROM xp_logs WHERE id_aluno = ? AND entregue_em IS NULL');
            $st->execute([$idAluno]);
            $saldo = (int) floor((float) $estado['xp']) + (int) $st->fetchColumn();

            $st = $this->pdo->prepare('UPDATE alunos SET xp_total = ? WHERE id_usuario = ?');
            $st->execute([max(0, $saldo), $idAluno]);

            $this->pdo->commit();
            return $nova;
        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }
    }

    /**
     * Grava em xp_logs o que aconteceu com o XP DENTRO do jogo desde o save anterior (o XP das notas já é gravado por
     * registrarXPPorNota e não entra aqui):
     *   - uma linha positiva por origem de ganho (colheitas/mina/monstros, devolução ao dispensar, teste, inicial),
     *     a partir da diferença em estado.xpPorOrigem;
     *   - uma linha com o que sobrou (normalmente NEGATIVA): o XP gasto em construções, evoluções, equipe e animais.
     * A soma das linhas é exatamente a variação do saldo do jogo (menos o XP de atividades aplicado neste save).
     * Essas linhas nascem já entregues (entregue_em = NOW()): o XP já está no jogo e não deve ser reaplicado.
     */
    private function registrarMovimentosDaFazenda(int $idAluno, ?array $anterior, array $novo, int $xpDeAtividadesAplicado): void
    {
        $xpAntes = $anterior !== null && isset($anterior['xp']) && is_numeric($anterior['xp']) ? (int) round((float) $anterior['xp']) : 0;
        $liquido = (int) round((float) $novo['xp']) - $xpAntes - $xpDeAtividadesAplicado;

        $contador = static function (?array $estado, string $origem): float {
            $origens = is_array($estado['xpPorOrigem'] ?? null) ? $estado['xpPorOrigem'] : [];
            return isset($origens[$origem]) && is_numeric($origens[$origem]) ? (float) $origens[$origem] : 0.0;
        };

        $origens = [
            'fazenda'    => 'Fazenda: XP de colheitas, mina e monstros',
            'devolucoes' => 'Fazenda: XP devolvido ao dispensar trabalhador',
            'teste'      => 'Fazenda: XP de teste (modo desenvolvedor)',
            'inicial'    => 'Fazenda: XP inicial',
        ];

        $linhas = [];
        $lancado = 0;
        foreach ($origens as $origem => $motivo) {
            $ganho = (int) round($contador($novo, $origem) - $contador($anterior, $origem));
            if ($ganho > 0) {
                $linhas[] = [$ganho, $motivo];
                $lancado += $ganho;
            }
        }

        $resto = $liquido - $lancado;
        if ($resto !== 0) {
            $linhas[] = [$resto, $resto < 0
                ? 'Fazenda: XP gasto (construções, evoluções, equipe e animais)'
                : 'Fazenda: ajuste de XP'];
        }

        foreach ($linhas as [$quantidade, $motivo]) {
            $st = $this->pdo->prepare(
                'INSERT INTO xp_logs (id_aluno, quantidade, motivo, id_nota, entregue_em) VALUES (?, ?, ?, NULL, NOW())'
            );
            $st->execute([$idAluno, $quantidade, $motivo]);
        }
    }

    /**
     * Uma linha em elementos_fazenda por área construída (nível 1 ou mais), atualizada a cada save.
     * Só insere o que é novo, só atualiza o que mudou e só apaga o que sumiu: as linhas que já existem mantêm o mesmo id
     * (um INSERT ... ON DUPLICATE KEY UPDATE gastaria números do AUTO_INCREMENT a cada save).
     */
    private function sincronizarElementos(int $idFazenda, array $niveis): void
    {
        $areas = [];
        foreach ($niveis as $codigo => $nivel) {
            if (!is_string($codigo) || !preg_match('/^[A-Za-z0-9_-]{1,40}$/', $codigo) || !is_numeric($nivel) || (int) $nivel < 1) {
                continue;
            }
            $areas[$codigo] = (int) $nivel;
        }

        $st = $this->pdo->prepare('SELECT id_elemento, codigo, tipo, nivel FROM elementos_fazenda WHERE id_fazenda = ?');
        $st->execute([$idFazenda]);
        $existentes = [];
        foreach ($st->fetchAll() as $linha) {
            $existentes[$linha['codigo']] = $linha;
        }

        foreach ($existentes as $codigo => $linha) {
            if (!isset($areas[$codigo])) {
                $st = $this->pdo->prepare('DELETE FROM elementos_fazenda WHERE id_elemento = ?');
                $st->execute([(int) $linha['id_elemento']]);
            }
        }

        foreach ($areas as $codigo => $nivel) {
            $tipo = self::TIPO_DAS_AREAS[$codigo] ?? 'construcao';
            if (!isset($existentes[$codigo])) {
                $st = $this->pdo->prepare('INSERT INTO elementos_fazenda (id_fazenda, codigo, tipo, nivel) VALUES (?, ?, ?, ?)');
                $st->execute([$idFazenda, $codigo, $tipo, $nivel]);
            } elseif ((int) $existentes[$codigo]['nivel'] !== $nivel || $existentes[$codigo]['tipo'] !== $tipo) {
                $st = $this->pdo->prepare('UPDATE elementos_fazenda SET nivel = ?, tipo = ? WHERE id_elemento = ?');
                $st->execute([$nivel, $tipo, (int) $existentes[$codigo]['id_elemento']]);
            }
        }
    }

    private function validarEstado(array $estado): array
    {
        if (!isset($estado['niveis']) || !is_array($estado['niveis'])) {
            throw new InvalidArgumentException('Save da fazenda inválido (faltam os níveis).');
        }
        if (!isset($estado['xp']) || !is_numeric($estado['xp'])) {
            throw new InvalidArgumentException('Save da fazenda inválido (XP).');
        }
        return $estado;
    }

    // -----------------------------------------------------------------
    // XP DAS ATIVIDADES
    // -----------------------------------------------------------------

    /** XP que já foi creditado ao aluno no banco, mas ainda não foi aplicado no jogo dele. */
    public function xpPendente(int $idAluno): array
    {
        $st = $this->pdo->prepare(
            'SELECT id_xp, quantidade, motivo
               FROM xp_logs
              WHERE id_aluno = ? AND entregue_em IS NULL
              ORDER BY id_xp ASC
              LIMIT 200'
        );
        $st->execute([$idAluno]);

        return array_map(fn(array $linha): array => [
            'id'         => (int) $linha['id_xp'],
            'quantidade' => (int) $linha['quantidade'],
            'motivo'     => $linha['motivo'],
        ], $st->fetchAll());
    }

    /**
     * Chamado pelo módulo notas logo depois que o instrutor lança/altera a nota de uma submissão (RN04).
     * O XP da atividade é calculado pela nota VIGENTE do instrutor (a da tentativa mais recente que ele corrigiu)
     * e o xp_logs recebe só a DIFERENÇA para o que já foi creditado nessa atividade (somando os lançamentos cuja
     * nota pertence a ela). Por isso:
     *   - corrigir a mesma nota duas vezes não duplica XP;
     *   - baixar a nota gera um lançamento negativo (retrocesso, RF19);
     *   - nota só da IA (ainda não validada) não rende XP.
     * Cada lançamento também soma/subtrai em alunos.xp_total (o XP que o aluno tem na fazenda), sem esperar ele abrir o
     * jogo. Quando o jogo aplica o XP e salva, salvar() recalcula xp_total a partir do saldo do jogo + pendentes.
     * Devolve a diferença lançada (0 = nada mudou) ou null se a submissão não existe.
     */
    public function registrarXPPorNota(int $idSubmissao): ?int
    {
        $st = $this->pdo->prepare(
            'SELECT s.id_aluno, s.id_atividade, a.titulo
               FROM submissoes s
               JOIN atividades a ON a.id_atividade = s.id_atividade
              WHERE s.id_submissao = ?'
        );
        $st->execute([$idSubmissao]);
        $submissao = $st->fetch();

        if (!$submissao) {
            return null;
        }

        $idAluno     = (int) $submissao['id_aluno'];
        $idAtividade = (int) $submissao['id_atividade'];

        $this->garantirFazenda($idAluno);

        $transacaoPropria = !$this->pdo->inTransaction();
        if ($transacaoPropria) {
            $this->pdo->beginTransaction();
        }

        try {
            // Trava a fazenda do aluno: duas correções ao mesmo tempo não calculam a diferença em duplicidade.
            $st = $this->pdo->prepare('SELECT id_fazenda FROM fazendas WHERE id_aluno = ? FOR UPDATE');
            $st->execute([$idAluno]);
            $st->fetchColumn();

            // Nota vigente do instrutor nesta atividade (tentativa mais recente que ele corrigiu).
            $st = $this->pdo->prepare(
                "SELECT n.valor
                   FROM submissoes s
                   JOIN notas n ON n.id_submissao = s.id_submissao
                  WHERE s.id_aluno = ? AND s.id_atividade = ? AND n.origem = 'instrutor'
                  ORDER BY s.tentativa_num DESC
                  LIMIT 1"
            );
            $st->execute([$idAluno, $idAtividade]);
            $valor = $st->fetchColumn();

            $alvo = $valor === false
                ? 0
                : (int) round(max(0, min(10, (float) $valor)) / 10 * self::XP_MAXIMO_POR_ATIVIDADE);

            // Quanto XP já foi creditado a este aluno por esta atividade (qualquer tentativa).
            $st = $this->pdo->prepare(
                'SELECT COALESCE(SUM(x.quantidade), 0)
                   FROM xp_logs x
                   JOIN notas n ON n.id_nota = x.id_nota
                   JOIN submissoes s ON s.id_submissao = n.id_submissao
                  WHERE x.id_aluno = ? AND s.id_atividade = ?'
            );
            $st->execute([$idAluno, $idAtividade]);
            $atual = (int) $st->fetchColumn();

            $diferenca = $alvo - $atual;

            if ($diferenca !== 0) {
                // O lançamento fica ligado à nota que acabou de ser salva nesta submissão.
                $st = $this->pdo->prepare('SELECT id_nota FROM notas WHERE id_submissao = ?');
                $st->execute([$idSubmissao]);
                $idNota = $st->fetchColumn();

                $motivo = $valor === false
                    ? 'Nota removida em "' . $submissao['titulo'] . '"'
                    : 'Nota ' . number_format((float) $valor, 1, ',', '') . ' em "' . $submissao['titulo'] . '"';

                $st = $this->pdo->prepare(
                    'INSERT INTO xp_logs (id_aluno, quantidade, motivo, id_nota) VALUES (?, ?, ?, ?)'
                );
                $st->execute([$idAluno, $diferenca, mb_substr($motivo, 0, 255), $idNota === false ? null : (int) $idNota]);

                // xp_total é UNSIGNED: a conta é feita aqui, com sinal, e o resultado nunca fica abaixo de 0.
                $st = $this->pdo->prepare('SELECT xp_total FROM alunos WHERE id_usuario = ? FOR UPDATE');
                $st->execute([$idAluno]);
                $xpTotal = (int) $st->fetchColumn();

                $st = $this->pdo->prepare('UPDATE alunos SET xp_total = ? WHERE id_usuario = ?');
                $st->execute([max(0, $xpTotal + $diferenca), $idAluno]);
            }

            if ($transacaoPropria) {
                $this->pdo->commit();
            }
            return $diferenca;
        } catch (Throwable $e) {
            if ($transacaoPropria && $this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }
    }
}
