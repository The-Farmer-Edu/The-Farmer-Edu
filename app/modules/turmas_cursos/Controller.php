<?php

require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/../../core/session.php';

class CursosController
{
    // Entrada única: manda cada perfil para a sua tela inicial
    public function inicio(): void
    {
        $u = usuarioLogado();
        $this->ir($u ? $u['perfilAcesso'] : 'auth/loginAluno', $u ? 'turmas_cursos/' : '');
    }

    // Cursos vêm do banco; o instrutor escolhe um para criar uma turma
    public function instrutor(): void
    {
        $this->exigir('instrutor');
        CursoModel::garantirCursosDeTeste(); // só age se não houver nenhum curso cadastrado
        $this->view('paginaInstrutor', ['cursos' => CursoModel::listar(), 'msg' => $_GET['msg'] ?? '']);
    }

    public function aluno(): void
    {
        $u = $this->exigir('aluno');
        $this->view('paginaAluno', [
            'cursos'       => CursoModel::listarDoAluno($u['idUsuario']),
            'turmas'       => TurmaModel::listarDoAluno($u['idUsuario']),
            'todosCursos'  => CursoModel::listar(),
        ]);
    }

    // Instrutor: alunos cadastrados no banco
    public function alunos(): void
    {
        $this->exigir('instrutor');
        $this->view('alunos', ['alunos' => AlunoModel::listar()]);
    }

    // Formulário de criação de turma para o curso escolhido (?curso=ID)
    public function form(): void
    {
        $u = $this->exigir('instrutor');
        $curso = CursoModel::buscar((int) ($_GET['curso'] ?? 0));
        if (!$curso) {
            $this->ir('turmas_cursos/instrutor?msg=' . urlencode('Curso não encontrado.'));
        }
        $this->view('form', [
            'curso'  => $curso,
            'turmas' => TurmaModel::listarDoCurso((int) $curso['id_curso'], (int) $u['idUsuario']),
            'erro'   => $_GET['erro'] ?? '',
            'msg'    => $_GET['msg'] ?? '',
        ]);
    }

    public function salvar(): void
    {
        $u = $this->exigir('instrutor');
        $idCurso = (int) ($_POST['id_curso'] ?? 0);
        $nome = trim((string) ($_POST['nome'] ?? ''));
        $turno = (string) ($_POST['turno'] ?? '');

        if (!CursoModel::buscar($idCurso)) {
            $this->ir('turmas_cursos/instrutor?msg=' . urlencode('Curso não encontrado.'));
        }
        $voltar = 'turmas_cursos/turmaForm?curso=' . $idCurso . '&erro=';
        if ($nome === '' || mb_strlen($nome) > 100) {
            $this->ir($voltar . urlencode('Nome inválido (1 a 100 caracteres).'));
        }
        if (!isset(TurmaModel::TURNOS[$turno])) {
            $this->ir($voltar . urlencode('Turno inválido.'));
        }

        TurmaModel::criar($nome, $turno, $idCurso, (int) $u['idUsuario']);
        $this->ir('turmas_cursos/turmaForm?curso=' . $idCurso . '&msg=' . urlencode('Turma criada.'));
    }

    // ---------- Editar turma ----------

    public function editar(): void
    {
        $u = $this->exigir('instrutor');
        $turma = $this->turmaDoInstrutor((int) ($_GET['id'] ?? 0), $u);
        $this->view('turmaEditar', ['turma' => $turma, 'erro' => $_GET['erro'] ?? '']);
    }

    public function atualizar(): void
    {
        $u = $this->exigir('instrutor');
        $this->validarCsrf();
        $idTurma = (int) ($_POST['id_turma'] ?? 0);
        $turma = $this->turmaDoInstrutor($idTurma, $u);
        $nome = trim((string) ($_POST['nome'] ?? ''));
        $turno = (string) ($_POST['turno'] ?? '');

        $voltar = 'turmas_cursos/turmaEditar?id=' . $idTurma . '&erro=';
        if ($nome === '' || mb_strlen($nome) > 100) {
            $this->ir($voltar . urlencode('Nome inválido (1 a 100 caracteres).'));
        }
        if (!isset(TurmaModel::TURNOS[$turno])) {
            $this->ir($voltar . urlencode('Turno inválido.'));
        }

        TurmaModel::atualizar($idTurma, (int) $u['idUsuario'], $nome, $turno);
        $this->ir('turmas_cursos/turmaForm?curso=' . (int) $turma['id_curso'] . '&msg=' . urlencode('Turma atualizada.'));
    }

    // ---------- Excluir turma ----------

    public function excluir(): void
    {
        $u = $this->exigir('instrutor');
        $this->validarCsrf();
        $turma = $this->turmaDoInstrutor((int) ($_POST['id_turma'] ?? 0), $u);
        $voltar = 'turmas_cursos/turmaForm?curso=' . (int) $turma['id_curso'];

        try {
            TurmaModel::excluir((int) $turma['id_turma'], (int) $u['idUsuario']);
        } catch (PDOException $e) {
            // Turma com atividades vinculadas (RESTRICT no banco): não pode ser apagada
            error_log($e->getMessage());
            $this->ir($voltar . '&erro=' . urlencode('Não é possível excluir: a turma possui atividades vinculadas.'));
        }
        $this->ir($voltar . '&msg=' . urlencode('Turma excluída.'));
    }

    // ---------- Alunos da turma (matrícula) ----------

    public function turma(): void
    {
        $u = $this->exigir('instrutor');
        $turma = $this->turmaDoInstrutor((int) ($_GET['id'] ?? 0), $u);
        $this->view('turma', [
            'turma'       => $turma,
            'matriculados' => TurmaModel::alunosDaTurma((int) $turma['id_turma']),
            'disponiveis' => AlunoModel::disponiveisParaTurma((int) $turma['id_turma']),
            'msg'         => $_GET['msg'] ?? '',
            'erro'        => $_GET['erro'] ?? '',
        ]);
    }

    public function matricular(): void
    {
        $u = $this->exigir('instrutor');
        $this->validarCsrf();
        $turma = $this->turmaDoInstrutor((int) ($_POST['id_turma'] ?? 0), $u);
        $idAluno = (int) ($_POST['id_aluno'] ?? 0);
        $voltar = 'turmas_cursos/turma?id=' . (int) $turma['id_turma'];

        if (!AlunoModel::existe($idAluno)) {
            $this->ir($voltar . '&erro=' . urlencode('Selecione um aluno válido.'));
        }
        $novo = MatriculaModel::matricular((int) $turma['id_turma'], $idAluno);
        $this->ir($voltar . ($novo
            ? '&msg=' . urlencode('Aluno matriculado.')
            : '&erro=' . urlencode('Esse aluno já está matriculado nesta turma.')));
    }

    public function desmatricular(): void
    {
        $u = $this->exigir('instrutor');
        $this->validarCsrf();
        $turma = $this->turmaDoInstrutor((int) ($_POST['id_turma'] ?? 0), $u);
        MatriculaModel::desmatricular((int) $turma['id_turma'], (int) ($_POST['id_aluno'] ?? 0));
        $this->ir('turmas_cursos/turma?id=' . (int) $turma['id_turma'] . '&msg=' . urlencode('Matrícula removida.'));
    }

    // Garante login e perfil. (Não uso solicitarPerfilDeAcesso() do core: ele lê
    // $_SESSION['perfilAcesso'], mas o login grava em $_SESSION['usuario'].)
    private function exigir(string $perfil): array
    {
        $u = usuarioLogado();
        if (!$u) {
            $this->ir('auth/login' . ucfirst($perfil));
        }
        if ($u['perfilAcesso'] !== $perfil) {
            http_response_code(403);
            exit('Você não tem acesso a essa página!');
        }
        return $u;
    }

    // Turma só é acessível ao instrutor dono dela; senão volta para a lista de cursos
    private function turmaDoInstrutor(int $idTurma, array $u): array
    {
        $turma = TurmaModel::buscarDoInstrutor($idTurma, (int) $u['idUsuario']);
        if (!$turma) {
            $this->ir('turmas_cursos/instrutor?msg=' . urlencode('Turma não encontrada.'));
        }
        return $turma;
    }

    // Proteção CSRF simples para as ações POST (token guardado na sessão)
    private function validarCsrf(): void
    {
        $esperado = $_SESSION['csrf_turmas'] ?? '';
        $recebido = (string) ($_POST['csrf'] ?? '');
        if ($esperado === '' || !hash_equals($esperado, $recebido)) {
            http_response_code(403);
            exit('Requisição inválida. Volte e tente novamente.');
        }
    }

    private function ir(string $destino, string $prefixo = ''): void
    {
        header('Location: ' . rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\') . '/' . $prefixo . $destino);
        exit;
    }

    private function view(string $nome, array $dados): void
    {
        $u = usuarioLogado();
        $base = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
        if (empty($_SESSION['csrf_turmas'])) {
            $_SESSION['csrf_turmas'] = bin2hex(random_bytes(32));
        }
        $csrf = $_SESSION['csrf_turmas'];
        extract($dados);
        require __DIR__ . '/views/' . $nome . '.php';
    }
}

function e($v): string { return htmlspecialchars((string) $v, ENT_QUOTES, 'UTF-8'); }
