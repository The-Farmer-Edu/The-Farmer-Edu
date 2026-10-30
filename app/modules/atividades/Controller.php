<?php

require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/../../core/database.php';
require_once __DIR__ . '/../../core/session.php';

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
        $usuario = $this->exigirPerfil('instrutor', true);

        $this->responder(function () use ($usuario) {
            $pdo = iniciarPDO();
            $idInstrutor = (int) $usuario['idUsuario'];

            return [
                'turmas'     => Atividade::turmasDoInstrutor($pdo, $idInstrutor),
                'atividades' => Atividade::listarDoInstrutor($pdo, $idInstrutor),
                'linguagens' => TipoAtividade::linguagens,
                'formatos'   => TipoAtividade::formatos(),
            ];
        });
    }

    public function salvar(): void
    {
        $usuario = $this->exigirPerfil('instrutor', true);

        $this->responder(function () use ($usuario) {
            if (Gabarito::passouDoLimiteDoPost()) {
                throw new InvalidArgumentException('Os arquivos passaram do limite de envio do servidor.');
            }

            $pdo = iniciarPDO();
            $idInstrutor = (int) $usuario['idUsuario'];
            $idAtividade = (int) ($_POST['id_atividade'] ?? 0);

            $atividade = Atividade::doFormulario($_POST);
            $uploads   = Gabarito::doUpload($_FILES['gabarito'] ?? []);
            $copiar    = Gabarito::ids($_POST['copiar_arquivos'] ?? []);
            $remover   = Gabarito::ids($_POST['remover_arquivos'] ?? []);

            $atividade->gravar($pdo, $idInstrutor, $idAtividade > 0 ? $idAtividade : null, $uploads, $copiar, $remover);

            return ['mensagem' => $idAtividade > 0
                ? 'Atividade atualizada com sucesso!'
                : 'Atividade publicada com sucesso!'];
        });
    }

    public function remover(): void
    {
        $usuario = $this->exigirPerfil('instrutor', true);

        $this->responder(function () use ($usuario) {
            $idAtividade = (int) ($_POST['id_atividade'] ?? 0);
            Atividade::remover(iniciarPDO(), $idAtividade, (int) $usuario['idUsuario']);

            return ['mensagem' => 'Atividade removida.'];
        });
    }

    public function baixarArquivo(): void
    {
        $usuario = $this->exigirPerfil('instrutor');

        $arquivo = Gabarito::buscarDoInstrutor(iniciarPDO(), (int) ($_GET['id'] ?? 0), (int) $usuario['idUsuario']);
        $caminho = $arquivo ? Gabarito::caminhoAbsoluto($arquivo['caminho']) : null;

        if ($caminho === null) {
            http_response_code(404);
            echo 'Arquivo não encontrado.';
            return;
        }

        header('Content-Type: application/octet-stream');
        header("Content-Disposition: attachment; filename*=UTF-8''" . rawurlencode($arquivo['descricao_arquivo']));
        header('X-Content-Type-Options: nosniff');
        header('Content-Length: ' . filesize($caminho));

        readfile($caminho);
    }

    public function cursosAluno(): void
    {
        $usuario = $this->exigirPerfil('aluno', true);

        $this->responder(function () use ($usuario) {
            return ['cursos' => Atividade::cursosDoAluno(iniciarPDO(), (int) $usuario['idUsuario'])];
        });
    }

    public function listaAluno(): void
    {
        $usuario = $this->exigirPerfil('aluno', true);

        $this->responder(function () use ($usuario) {
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

    private function exigirPerfil(string $perfil, bool $json = false): array
    {
        $usuario = usuarioLogado();

        if ($usuario !== null && $usuario['perfilAcesso'] === $perfil) {
            return $usuario;
        }

        if ($json) {
            $this->json(['mensagem' => 'Sua sessão expirou. Entre novamente.'], 401);
        }

        header('Location: ' . $this->base() . '/auth/login' . ucfirst($perfil));
        exit;
    }

    private function responder(callable $acao): void
    {
        try {
            $this->json($acao());
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

    private function json(array $dados, int $codigo = 200): void
    {
        http_response_code($codigo);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($dados, JSON_UNESCAPED_UNICODE);
        exit;
    }

    private function base(): string
    {
        return rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
    }

    private function view(string $nome, array $dados = []): void
    {
        $dados['base'] = $this->base();
        extract($dados);
        require __DIR__ . '/views/' . $nome . '.php';
    }
}

?>