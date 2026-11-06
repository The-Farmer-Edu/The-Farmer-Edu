<?php

require_once __DIR__ . '/../../core/database.php';

// Lançada quando o save do banco já foi alterado por outra aba/computador desde que este jogo o carregou.
class ConflitoDeSaveException extends RuntimeException
{
}

// =====================================================================
// FazendaModel — save da fazenda e XP vindo das atividades
// Tabelas do schema.sql: fazendas (save em JSON), xp_logs (histórico de XP, XPLog), notas, submissoes e alunos.
// alunos.xp_total = XP que o aluno TEM na fazenda (saldo): sobe com o que ele ganha e desce com o que ele perde ou gasta.
// Colunas acrescentadas por sql/fazenda_alteracoes.sql: fazendas.{nome_fazenda, estado, versao_estado, revisao} e xp_logs.entregue_em.
// =====================================================================
class FazendaModel
{
    // XP que uma atividade vale com nota 10. A nota 5 vale metade, e assim por diante (arredondado).
    // Se o instrutor puder definir o XP por atividade, é aqui que o valor da atividade entra no lugar da constante.
    public const XP_MAXIMO_POR_ATIVIDADE = 100;

    private const LIMITE_DO_ESTADO_BYTES = 1000000;
    private const LIMITE_DE_IDS_POR_SAVE = 500;

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
        $st = $this->pdo->prepare('INSERT IGNORE INTO fazendas (id_aluno) VALUES (?)');
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
     * Grava o save e, na MESMA transação, marca como entregues os XP que o jogo acabou de aplicar.
     * Devolve a nova revisão. Lança ConflitoDeSaveException se a revisão enviada não for a atual.
     */
    public function salvar(int $idAluno, array $estado, int $revisaoEsperada, array $idsXpEntregues): int
    {
        $estado = $this->validarEstado($estado);

        $json = json_encode($estado, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
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
            $st = $this->pdo->prepare('SELECT revisao FROM fazendas WHERE id_aluno = ? FOR UPDATE');
            $st->execute([$idAluno]);
            $revisaoAtual = (int) $st->fetchColumn();

            if ($revisaoAtual !== $revisaoEsperada) {
                throw new ConflitoDeSaveException('A fazenda foi alterada em outro lugar.');
            }

            $nova = $revisaoAtual + 1;

            $st = $this->pdo->prepare(
                'UPDATE fazendas
                    SET estado = ?, nome_fazenda = ?, versao_estado = ?, revisao = ?
                  WHERE id_aluno = ?'
            );
            $st->execute([$json, $nome, (int) ($estado['versao'] ?? 0), $nova, $idAluno]);

            if ($ids) {
                $marcas = implode(',', array_fill(0, count($ids), '?'));
                $st = $this->pdo->prepare(
                    "UPDATE xp_logs SET entregue_em = NOW()
                      WHERE id_aluno = ? AND entregue_em IS NULL AND id_xp IN ($marcas)"
                );
                $st->execute(array_merge([$idAluno], $ids));
            }

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