<?php
require_once __DIR__ . '/../../core/database.php';

class SubmissoesModel
{
    private PDO $pdo;

    /** Limite máximo de cancelamentos permitidos por atividade (validado no banco). */
    public const LIMITE_CANCELAMENTOS = 3;

    /** Linguagem do banco -> chave usada em atividade.js (LINGUAGENS). */
    private const MAPA_LINGUAGEM = [
        'web' => 'web', 'html' => 'web', 'css' => 'web',
        'javascript' => 63, 'js' => 63,
        'python' => 71,
        'php' => 68,
        'sql' => 'sql',
    ];

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? iniciarPDO();
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }

    /**
     * Expõe a instância PDO para integrações do módulo (ex.: salvar análise do SIAE).
     */
    public function getPdo(): PDO
    {
        return $this->pdo;
    }

    /**
     * Converte data/hora do banco (fuso America/Sao_Paulo) para ISO 8601 com fuso horário.
     * Isso evita diferenças de interpretação no `new Date(...)` do navegador.
     */
    private function formatarDataIso(?string $data): ?string
    {
        if (empty($data)) {
            return null;
        }
        $dt = new DateTime($data, new DateTimeZone('America/Sao_Paulo'));
        return $dt->format('c');
    }

    public function buscarAtividade(int $idAtividade): ?array
    {
        $st = $this->pdo->prepare(
            'SELECT id_atividade, id_turma, titulo, descricao, tipo_atividade, linguagem,
                    criterios_correcao, data_entrega
               FROM atividades WHERE id_atividade = ?'
        );
        $st->execute([$idAtividade]);
        return $st->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    /**
     * Busca apenas a última submissão ativa (não cancelada) do aluno em uma atividade.
     * Como cada reenvio incrementa `tentativa_num`, retornar somente a maior tentativa
     * garante que o instrutor e o aluno visualizem exclusivamente a entrega vigente.
     */
    public function buscarUltimaSubmissao(int $idAtividade, int $idAluno): ?array
    {
        $st = $this->pdo->prepare(
            "SELECT id_submissao, conteudo_resposta, caminho_arquivo, tentativa_num, status, data_envio
               FROM submissoes
              WHERE id_atividade = ? AND id_aluno = ? AND status <> 'cancelado'
              ORDER BY tentativa_num DESC, id_submissao DESC
              LIMIT 1"
        );
        $st->execute([$idAtividade, $idAluno]);
        return $st->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    /**
     * Conta quantos cancelamentos o aluno já realizou no banco para a atividade.
     * Usado como fonte da verdade para bloquear cancelamentos após o limite.
     */
    public function contarCancelamentos(int $idAtividade, int $idAluno): int
    {
        $st = $this->pdo->prepare(
            "SELECT COUNT(*)
               FROM submissoes
              WHERE id_atividade = ? AND id_aluno = ? AND status = 'cancelado'"
        );
        $st->execute([$idAtividade, $idAluno]);
        return (int) $st->fetchColumn();
    }

    /**
     * Conta o total de tentativas registradas no banco (incluindo canceladas).
     */
    public function contarTentativas(int $idAtividade, int $idAluno): int
    {
        $st = $this->pdo->prepare(
            'SELECT COUNT(*)
               FROM submissoes
              WHERE id_atividade = ? AND id_aluno = ?'
        );
        $st->execute([$idAtividade, $idAluno]);
        return (int) $st->fetchColumn();
    }

    /**
     * Busca a análise do SIAE vinculada a uma submissão na tabela `feedback_ia`.
     */
    public function buscarFeedbackIa(int $idSubmissao): ?array
    {
        $st = $this->pdo->prepare(
            'SELECT percentual_ia, motivo_ia
               FROM feedback_ia
              WHERE id_submissao = ?
              LIMIT 1'
        );
        $st->execute([$idSubmissao]);
        return $st->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    /**
     * Lê a atividade no banco e devolve o array no formato que o JS espera.
     * Não envia resposta_referencia nem pesos internos ao navegador.
     * Quando $idAluno é informado, injeta também o estado real da entrega no BD
     * (última submissão ativa, status entregue, cancelamentos e tentativas).
     */
    // ALTERADO: acrescentado o parâmetro opcional $idAluno
    public function dadosParaView(int $idAtividade, ?int $idAluno = null): ?array
    {
        $a = $this->buscarAtividade($idAtividade);
        if (!$a) return null;

        // criterios_correcao: JSON {"nome": peso} ou, se não for JSON, texto com uma linha por item.
        $requisitos = [];
        $bruto = trim((string) ($a['criterios_correcao'] ?? ''));
        $criterios = json_decode($bruto, true);

        if (is_array($criterios)) {
            foreach ($criterios as $nome => $peso) {
                $requisitos[] = ucfirst(str_replace('_', ' ', (string) $nome)) . ' (' . $peso . '%)';
            }
        } elseif ($bruto !== '') {
            $requisitos = array_values(array_filter(array_map('trim', preg_split('/\R/', $bruto))));
        }

        $lang = strtolower(trim((string) ($a['linguagem'] ?? '')));
        $limite = $this->formatarDataIso($a['data_entrega'] ?? null);

        // Atividade do tipo "texto" ou "anexo" não usa linguagem de programação.
        $tipo = $a['tipo_atividade'] ?? 'codigo';
        $idLinguagem = in_array($tipo, ['texto', 'anexo'], true) ? 'texto' : (self::MAPA_LINGUAGEM[$lang] ?? 'web');

        $dados = [
            'id'            => (int) $a['id_atividade'],
            'chave'         => (string) $a['id_atividade'],
            'titulo'        => (string) $a['titulo'],
            'descricao'     => (string) ($a['descricao'] ?? ''),
            'requisitos'    => $requisitos,
            'idLinguagem'   => $idLinguagem,
            'tipo'          => $tipo,
            'notaMax'       => 10,
            'notaMin'       => 6,
            'limiteEntrega' => $limite,
        ];

        //resolução já salva pelo aluno
        if ($idAluno) {
            $s = $this->buscarUltimaSubmissao($idAtividade, $idAluno);
            $dados['submissao'] = $s ? [
                'id'        => (int) $s['id_submissao'],
                'conteudo'  => (string) ($s['conteudo_resposta'] ?? ''),
                'tentativa' => (int) $s['tentativa_num'],
                'status'    => (string) $s['status'],
                'dataEnvio' => (string) $s['data_envio'],
            ] : null;
        }
        return $dados;
    }
    // o instrutor é responsável pela turma?
    public function instrutorDaTurma(int $idInstrutor, int $idTurma): bool
{
    $st = $this->pdo->prepare('SELECT 1 FROM turmas WHERE id_turma = ? AND id_instrutor = ? LIMIT 1');
    $st->execute([$idTurma, $idInstrutor]);
    return (bool) $st->fetchColumn();
}

    public function alunoMatriculado(int $idAluno, int $idTurma): bool
    {
        $st = $this->pdo->prepare('SELECT 1 FROM matriculas WHERE id_aluno = ? AND id_turma = ? LIMIT 1');
        $st->execute([$idAluno, $idTurma]);
        return (bool) $st->fetchColumn();
    }

    public function criarSubmissao(int $idAtividade, int $idAluno, string $conteudo): array //<3
    {
        $this->pdo->beginTransaction();
        try {
            $st = $this->pdo->prepare(
                'SELECT id_submissao, tentativa_num, status
                   FROM submissoes
                  WHERE id_atividade = ? AND id_aluno = ?
                  ORDER BY tentativa_num DESC, id_submissao DESC
                  FOR UPDATE'
            );
            $st->execute([$idAtividade, $idAluno]);
            $registros = $st->fetchAll(PDO::FETCH_ASSOC);

            if (!empty($registros) && $registros[0]['status'] !== 'cancelado') {
                throw new RuntimeException('Você já possui uma entrega ativa. Cancele a entrega antes de enviar novamente.');
            }

            $cancelamentos = 0;
            foreach ($registros as $reg) {
                if ($reg['status'] === 'cancelado') {
                    $cancelamentos++;
                }
            }

            $tentativa = !empty($registros) ? ((int) $registros[0]['tentativa_num'] + 1) : 1;

            $st = $this->pdo->prepare(
                "INSERT INTO submissoes (id_atividade, id_aluno, conteudo_resposta, tentativa_num, status)
                 VALUES (?, ?, ?, ?, 'enviada')"
            );
            $st->execute([$idAtividade, $idAluno, $conteudo, $tentativa]);
            $id = (int) $this->pdo->lastInsertId();

            $stData = $this->pdo->prepare('SELECT data_envio FROM submissoes WHERE id_submissao = ?');
            $stData->execute([$id]);
            $dataEnvio = $this->formatarDataIso((string) $stData->fetchColumn());

            $this->pdo->commit();
            return [
                'id_submissao'  => $id,
                'tentativa'     => $tentativa,
                'data_envio'    => $dataEnvio,
                'cancelamentos' => $cancelamentos,
            ];
        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }
    }

    /**
     * Cancela no banco a última entrega ativa do aluno, respeitando o limite de cancelamentos.
     */
    public function cancelarUltimaSubmissao(int $idAtividade, int $idAluno): array
    {
        $this->pdo->beginTransaction();
        try {
            $st = $this->pdo->prepare(
                'SELECT id_submissao, tentativa_num, status
                   FROM submissoes
                  WHERE id_atividade = ? AND id_aluno = ?
                  ORDER BY tentativa_num DESC, id_submissao DESC
                  FOR UPDATE'
            );
            $st->execute([$idAtividade, $idAluno]);
            $registros = $st->fetchAll(PDO::FETCH_ASSOC);

            $ultima = $registros[0] ?? null;
            if (!$ultima || $ultima['status'] === 'cancelado') {
                throw new RuntimeException('Nenhuma entrega ativa encontrada para cancelar.');
            }
            if ($ultima['status'] === 'corrigida') {
                throw new RuntimeException('Esta entrega já foi corrigida pelo instrutor e não pode ser cancelada.');
            }

            $cancelamentos = 0;
            foreach ($registros as $reg) {
                if ($reg['status'] === 'cancelado') {
                    $cancelamentos++;
                }
            }
            if ($cancelamentos >= self::LIMITE_CANCELAMENTOS) {
                throw new RuntimeException('Você já usou os 3 cancelamentos. A entrega é final.');
            }

            $upd = $this->pdo->prepare("UPDATE submissoes SET status = 'cancelado' WHERE id_submissao = ?");
            $upd->execute([(int) $ultima['id_submissao']]);

            $this->pdo->commit();
            return [
                'id_submissao'  => (int) $ultima['id_submissao'],
                'cancelamentos' => $cancelamentos + 1,
            ];
        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }

        //     Presente para o grupo de Submissões.
        $resultadoIA = (new SIAE())->obterResultadoSIAE(
            $linguagem,
            $objetivoAtividade,
            $codigoAluno
        );

        FeedbackIAModel::salvarProbabilidadeIA(
            $pdo,
            $idSubmissao,
            $resultadoIA['probabilidade_ia'],
            $resultadoIA['motivo']
        );

        $aviso = FeedbackIAModel::mensagemAvisoAluno(
            $resultadoIA['probabilidade_ia']
        );
    }

    public function atualizarResultado(int $idSubmissao, string $status, ?string $resultadoExecucao): void
    {
        $st = $this->pdo->prepare('UPDATE submissoes SET status = ?, resultado_execucao = ? WHERE id_submissao = ?');
        $st->execute([$status, $resultadoExecucao, $idSubmissao]);
    }

    public function criarSubmissaoAnexo(int $idAtividade, int $idAluno, array $arquivos): array {
        $this->pdo->beginTransaction();
        try {
            $st = $this->pdo->prepare(
                'SELECT COALESCE(MAX(tentativa_num), 0) + 1 FROM submissoes
                 WHERE id_atividade = ? AND id_aluno = ? FOR UPDATE'
            );
            $st->execute([$idAtividade, $idAluno]);
            $tentativa = (int) $st->fetchColumn();

            // $resumo = json_encode(array_column($arquivos, 'nome_original'), JSON_UNESCAPED_UNICODE);
            $st = $this->pdo->prepare(
                "INSERT INTO submissoes (id_atividade, id_aluno, tentativa_num, status, caminho_arquivo)
                 VALUES (?, ?, ?, ?, ?)"
            );
            $st->execute([$idAtividade, $idAluno, $tentativa, 'enviada', $arquivos[0]['caminho']]);
            $idSubmissao = (int) $this->pdo->lastInsertId();

            // $st = $this->pdo->prepare(
            //     'INSERT INTO arquivos_indexados
            //        (id_atividade, id_aluno, id_submissao, caminho_arquivo, nome_original)
            //      VALUES (?, ?, ?, ?, ?)'
            // );
            // foreach ($arquivos as $a) {
            //     $st->execute([$idAtividade, $idAluno, $idSubmissao, $a['caminho'], $a['nome_original']]);
            // }

            $this->pdo->commit();
            return ['id_submissao' => $idSubmissao, 'tentativa' => $tentativa];
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
}
