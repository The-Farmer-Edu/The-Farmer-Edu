<?php
declare(strict_types=1);

// require_once __DIR__ . '/../models/Usuario.php';
require_once __DIR__ . '/model.php';
require_once __DIR__ . '/../../core/database.php';

class UsuarioController
{
    /* ---------- Telas (GET) ---------- */

    // public function showBuscarUsuario(): void
    // {
    //     $this->view('buscarUsuario');
    // }

    // public function showNovoUsuario(): void
    // {
    //     $this->view('novoUsuario');
    // }

    public function showNovoUsuario(): void {
        require_once __DIR__ . '/views/novoUsuario.php';
    }

    public function showBuscarUsuario(): void {
        require_once __DIR__ . '/views/buscarUsuario.php';
    }

    /* ---------- Ações ---------- */

    /** GET /buscarUsuario?email=... */
    public function buscarUsuario(): void
    {
        $email = trim((string) ($_GET['email'] ?? ''));

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->json(['erro' => 'E-mail inválido.'], 422);
        }

        try {
            $usuario = Usuario::buscarPorEmail(iniciarPDO(), $email);
        } catch (Throwable $e) {
            error_log($e->getMessage());
            $this->json(['erro' => 'Erro interno.'], 500);
        }

        if ($usuario === null) {
            $this->json(['erro' => 'Usuário não encontrado.'], 404);
        }

        $this->json(['usuario' => $this->paraArray($usuario)]);
    }

    /** POST /novoUsuario */
    public function novoUsuario(): void
    {
        $nome  = (string) ($_POST['nome'] ?? '');
        $email = (string) ($_POST['email'] ?? '');
        $senha = (string) ($_POST['senha'] ?? '');
        $tipo  = (string) ($_POST['tipo'] ?? '');

        try {
            $usuario = match ($tipo) {
                'aluno'     => new Aluno($nome, $email, $senha),
                'instrutor' => new Instrutor($nome, $email, $senha, $this->lerMaterias()),
                default     => throw new InvalidArgumentException('Tipo de usuário inválido.'),
            };

            $usuario->salvar(iniciarPDO());
        } catch (InvalidArgumentException $e) {
            $this->json(['erro' => $e->getMessage()], 422); //pesquisar os erros
        } catch (RuntimeException $e) {
            // ex.: e-mail já cadastrado
            $this->json(['erro' => $e->getMessage()], 409);
        } catch (Throwable $e) {
            error_log($e->getMessage());
            $this->json(['erro' => 'Erro interno.'], 500);
        }

        $this->json(['usuario' => $this->paraArray($usuario)], 201);
    }

    /* ---------- Auxiliares ---------- */

    /** Aceita materias[]=a&materias[]=b ou materias=a,b */
    private function lerMaterias(): array
    {
        $brutomaterias = $_POST['materias'] ?? [];
        if (is_string($brutomaterias)) { //pega o que veio (ou se nada veio), se for string quebra pra colocar no array (explode)
            $brutomaterias = explode(',', $brutomaterias);
        }
        if (!is_array($brutomaterias)) {
            return []; //Se não for array nem string vai devolver vazio
        }
        return array_values(array_filter(array_map( //entender fn
            static fn($m) => is_string($m) ? trim($m) : '',
            $brutomaterias
        )));
    }

    /** Nunca expõe senha_hash. */
    private function paraArray(Usuario $u): array
    {
        $dados = [
            'id'    => $u->id,
            'nome'  => $u->nome,
            'email' => $u->email,
            'tipo'  => $u->tipo,
        ];

        if ($u instanceof Aluno) {
            $dados['matricula'] = $u->matricula;
            $dados['xp_total']  = $u->xp_total;
        }
        if ($u instanceof Instrutor) {
            $dados['materias'] = $u->materias;
        }

        return $dados;

    }

    private function view(string $nome): void
    {
        require __DIR__ . '/../views/' . $nome . '.php';
    }

    private function json(array $dados, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($dados, JSON_UNESCAPED_UNICODE);
        exit;
    }
}