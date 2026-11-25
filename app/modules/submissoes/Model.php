<?php
require_once __DIR__ . '/../../core/database.php';

class SubmissoesModel
{
    private PDO $pdo;

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

    //última submissão (maior tentativa) do aluno em uma atividade
    public function buscarUltimaSubmissao(int $idAtividade, int $idAluno): ?array
    {
        $st = $this->pdo->prepare(
            'SELECT id_submissao, conteudo_resposta, tentativa_num, status, data_envio
               FROM submissoes
              WHERE id_atividade = ? AND id_aluno = ?
              ORDER BY tentativa_num DESC
              LIMIT 1'
        );
        $st->execute([$idAtividade, $idAluno]);
        return $st->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    /**
     * Lê a atividade no banco e devolve o array no formato que o JS espera.
     * Não envia resposta_referencia nem pesos internos ao navegador.
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

        $limite = null;
        if (!empty($a['data_entrega'])) {
            $dt = new DateTime($a['data_entrega'], new DateTimeZone('America/Sao_Paulo'));
            $limite = $dt->format('c'); // ISO 8601 com fuso
        }

        // Atividade do tipo "texto" não usa linguagem de programação.
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
                'SELECT COALESCE(MAX(tentativa_num), 0) + 1 FROM submissoes
                  WHERE id_atividade = ? AND id_aluno = ? FOR UPDATE'
            );
            $st->execute([$idAtividade, $idAluno]);
            $tentativa = (int) $st->fetchColumn();

            $st = $this->pdo->prepare(
                "INSERT INTO submissoes (id_atividade, id_aluno, conteudo_resposta, tentativa_num, status)
                 VALUES (?, ?, ?, ?, 'processando')"
            );
            $st->execute([$idAtividade, $idAluno, $conteudo, $tentativa]);
            $id = (int) $this->pdo->lastInsertId();

            $this->pdo->commit();
            return ['id_submissao' => $id, 'tentativa' => $tentativa];
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
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

            $resumo = json_encode(array_column($arquivos, 'nome_original'), JSON_UNESCAPED_UNICODE);
            $st = $this->pdo->prepare(
                "INSERT INTO submissoes (id_atividade, id_aluno, conteudo_resposta, tentativa_num, status)
                 VALUES (?, ?, ?, ?, 'enviada')"
            );
            $st->execute([$idAtividade, $idAluno, $resumo, $tentativa]);
            $idSubmissao = (int) $this->pdo->lastInsertId();

            $st = $this->pdo->prepare(
                'INSERT INTO arquivos_indexados
                   (id_atividade, id_aluno, id_submissao, caminho_arquivo, nome_original)
                 VALUES (?, ?, ?, ?, ?)'
            );
            foreach ($arquivos as $a) {
                $st->execute([$idAtividade, $idAluno, $idSubmissao, $a['caminho'], $a['nome_original']]);
            }

            $this->pdo->commit();
            return ['id_submissao' => $idSubmissao, 'tentativa' => $tentativa];
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
}