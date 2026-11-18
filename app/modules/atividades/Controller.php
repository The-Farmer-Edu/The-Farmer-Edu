<?php

require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/../../core/database.php';
require_once __DIR__ . '/../../core/session.php';
require_once __DIR__ . '/../notificacoes/Model.php';

class AtividadesController
{
    public function showInstrutor(): void
    {
        $usuario = $this->exigirPerfil('instrutor');
        $this->view('instrutor', ['usuario' => $usuario]);
    }

    public function showCriterios(): void
    {
        $this->exigirPerfil('instrutor');
        $this->view('criteriosAvaliacao');
    }

    public function showAluno(): void
    {
        $usuario = $this->exigirPerfil('aluno');
        $this->view('aluno', ['usuario' => $usuario]);
    }

    public function dadosInstrutor(): void
    {
        $this->api('instrutor', function (array $usuario): array {
            $pdo = iniciarPDO();
            $idInstrutor = (int) $usuario['idUsuario'];

            return [
                'turmas'     => Atividade::turmasDoInstrutor($pdo, $idInstrutor),
                'atividades' => Atividade::listarDoInstrutor($pdo, $idInstrutor),
                'pessoas'    => Atividade::pessoasDoInstrutor($pdo, $idInstrutor),
                'linguagens' => TipoAtividade::linguagens,
                'formatos'   => TipoAtividade::formatos(),
                'gabarito'   => Gabarito::config(),
            ];
        });
    }

    public function salvar(): void
    {
        $this->api('instrutor', function (array $usuario): array {
            $pdo = iniciarPDO();
            $idInstrutor = (int) $usuario['idUsuario'];
            $idAtividade = (int) ($_POST['id_atividade'] ?? 0);
            $criando     = $idAtividade <= 0;

            $atividade = Atividade::doFormulario($_POST);
            $uploads   = Gabarito::doUpload($_FILES['gabarito'] ?? []);
            $copiar    = Gabarito::ids($_POST['copiar_arquivos'] ?? []);
            $remover   = Gabarito::ids($_POST['remover_arquivos'] ?? []);

            $atividade->gravar($pdo, $idInstrutor, $criando ? null : $idAtividade, $uploads, $copiar, $remover);

            if ($criando) {
                try {
                    NotificacoesModel::notificarTurma($pdo, $atividade->idTurma, $atividade->titulo);
                } catch (Throwable $e) {
                    error_log('Falha ao notificar a turma: ' . $e->getMessage());
                }
            }

            return ['mensagem' => $criando
                ? 'Atividade publicada com sucesso!'
                : 'Atividade atualizada com sucesso!'];
        }, true);
    }

    public function remover(): void
    {
        $this->api('instrutor', function (array $usuario): array {
            $idAtividade = (int) ($_POST['id_atividade'] ?? 0);
            Atividade::remover(iniciarPDO(), $idAtividade, (int) $usuario['idUsuario']);

            return ['mensagem' => 'Atividade removida.'];
        }, true);
    }

    public function baixarGabarito(): void
    {
        $usuario = $this->exigirPerfil('instrutor');

        $arquivo = null;
        $caminho = null;

        try {
            $arquivo = Gabarito::buscarDoInstrutor(iniciarPDO(), (int) ($_GET['id'] ?? 0), (int) $usuario['idUsuario']);
            $caminho = $arquivo ? Gabarito::caminhoAbsoluto($arquivo['caminho']) : null;
        } catch (Throwable $e) {
            error_log($e->getMessage());
        }

        if ($arquivo === null || $caminho === null) {
            http_response_code(404);
            echo 'Arquivo não encontrado.';
            return;
        }

        $nome     = (string) $arquivo['descricao_arquivo'];
        $simples  = preg_replace('/[^A-Za-z0-9._-]/', '_', $nome);

        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="' . $simples . "\"; filename*=UTF-8''" . rawurlencode($nome));
        header('X-Content-Type-Options: nosniff');
        header('Content-Length: ' . filesize($caminho));

        readfile($caminho);
    }

    public function cursosAluno(): void
    {
        $this->api('aluno', function (array $usuario): array {
            return ['cursos' => Atividade::cursosDoAluno(iniciarPDO(), (int) $usuario['idUsuario'])];
        });
    }

    public function listaAluno(): void
    {
        $this->api('aluno', function (array $usuario): array {
            $idCurso = (int) ($_GET['curso'] ?? 0);

            if ($idCurso <= 0) {
                throw new InvalidArgumentException('Escolha um curso.');
            }

            return Atividade::atividadesDoAluno(iniciarPDO(), (int) $usuario['idUsuario'], $idCurso);
        });
    }

    public function sendFile(): void
    {
        $type = $_GET['type'] ?? null;
        $file = basename((string) ($_GET['file'] ?? ''));

        if (!in_array($type, ['css', 'js'], true) || $file === '') {
            http_response_code(404);
            return;
        }

        $caminhoArquivo = __DIR__ . "/views/assets/$type/$file";

        if (is_file($caminhoArquivo)) {
            header("Content-Type: " . $this->mimeType($caminhoArquivo));
            header("X-Content-Type-Options: nosniff");
            header("Content-Length: " . filesize($caminhoArquivo));

            readfile($caminhoArquivo);
        } else {
            http_response_code(404);
        }
    }

    private function mimeType(string $caminho): string
    {
        $conhecidos = [
            'css' => 'text/css',
            'js'  => 'application/javascript',
        ];

        $extensao = strtolower(pathinfo($caminho, PATHINFO_EXTENSION));
        if (isset($conhecidos[$extensao])) {
            return $conhecidos[$extensao];
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $caminho);
        finfo_close($finfo);

        return $mimeType ?: 'application/octet-stream';
    }

    private function api(string $perfil, callable $acao, bool $post = false): void
    {
        try {
            $usuario = $this->exigirPerfil($perfil, true);

            if ($post) {
                if (Gabarito::passouDoLimiteDoPost()) {
                    throw new InvalidArgumentException('Os arquivos passaram do limite de envio do servidor.');
                }
                $this->validarCsrf();
            }

            $this->json($acao($usuario));
        } catch (PDOException $e) {
            error_log($e->getMessage());
            $this->json(['mensagem' => 'Erro no banco de dados. Tente novamente.'], 500);
        } catch (InvalidArgumentException | RuntimeException $e) {
            $this->json(['mensagem' => $e->getMessage()], 422);
        } catch (Throwable $e) {
            error_log($e->getMessage());
            $this->json(['mensagem' => 'Erro interno. Tente novamente.'], 500);
        }
    }

    private function exigirPerfil(string $perfil, bool $json = false): array
    {
        $usuario = usuarioLogado();

        if ($usuario !== null && !Atividade::contaAtiva(iniciarPDO(), (int) $usuario['idUsuario'])) {
            logout();
            $usuario = null;
        }

        if ($usuario === null) {
            if ($json) {
                $this->json(['mensagem' => 'Sua sessão expirou. Entre novamente.'], 401);
            }

            header('Location: ' . $this->base() . '/auth/login' . ucfirst($perfil));
            exit;
        }

        if (($usuario['perfilAcesso'] ?? '') !== $perfil) {
            if ($json) {
                $this->json(['mensagem' => 'Você não tem permissão para fazer isso.'], 403);
            }

            http_response_code(403);
            echo 'Você não tem acesso a essa página.';
            exit;
        }

        return $usuario;
    }

    private function tokenCsrf(): string
    {
        iniciarSessao();

        if (empty($_SESSION['csrf_atividades'])) {
            $_SESSION['csrf_atividades'] = bin2hex(random_bytes(32));
        }

        return $_SESSION['csrf_atividades'];
    }

    private function validarCsrf(): void
    {
        $esperado = (string) ($_SESSION['csrf_atividades'] ?? '');
        $recebido = (string) ($_POST['csrf'] ?? '');

        if ($esperado === '' || !hash_equals($esperado, $recebido)) {
            $this->json(['mensagem' => 'Requisição inválida. Recarregue a página e tente novamente.'], 403);
        }
    }

    private function json(array $dados, int $codigo = 200): void
    {
        http_response_code($codigo);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($dados, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
        exit;
    }

    private function base(): string
    {
        return rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
    }

    private function view(string $nome, array $dados = []): void
    {
        $dados['base'] = $this->base();
        $dados['csrf'] = $this->tokenCsrf();
        extract($dados);
        require __DIR__ . '/views/' . $nome . '.php';
    }
}