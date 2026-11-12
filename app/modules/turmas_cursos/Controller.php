<?php

require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/../auth/Model.php';
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
        $this->view('paginaInstrutor', [
            'cursos' => CursoModel::listar(),
            'msg'    => $_GET['msg'] ?? '',
            'erro'   => $_GET['erro'] ?? '',
        ]);
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
        $this->view('alunos', [
            'alunos' => AlunoModel::listar(),
            'msg'    => $_GET['msg'] ?? '',
            'erro'   => $_GET['erro'] ?? '',
        ]);
    }

    // ---------- CRUD de cursos (somente instrutor) ----------

    // Formulário vazio para cadastrar um curso
    public function cursoNovo(): void
    {
        $this->exigir('instrutor');
        $this->view('cursoForm', ['curso' => null, 'erro' => $_GET['erro'] ?? '']);
    }

    public function cursoSalvar(): void
    {
        $this->exigir('instrutor');
        $this->validarCsrf();
        [$nome, $descricao, $erro] = $this->lerCurso(0);
        if ($erro) {
            $this->ir('turmas_cursos/cursoNovo?erro=' . urlencode($erro));
        }
        CursoModel::criar($nome, $descricao);
        $this->ir('turmas_cursos/instrutor?msg=' . urlencode('Curso criado.'));
    }

    // Formulário preenchido para editar o curso (?id=ID)
    public function cursoEditar(): void
    {
        $this->exigir('instrutor');
        $curso = $this->cursoExistente((int) ($_GET['id'] ?? 0));
        $this->view('cursoForm', ['curso' => $curso, 'erro' => $_GET['erro'] ?? '']);
    }

    public function cursoAtualizar(): void
    {
        $this->exigir('instrutor');
        $this->validarCsrf();
        $curso = $this->cursoExistente((int) ($_POST['id_curso'] ?? 0));
        [$nome, $descricao, $erro] = $this->lerCurso((int) $curso['id_curso']);
        if ($erro) {
            $this->ir('turmas_cursos/cursoEditar?id=' . (int) $curso['id_curso'] . '&erro=' . urlencode($erro));
        }
        CursoModel::atualizar((int) $curso['id_curso'], $nome, $descricao);
        $this->ir('turmas_cursos/instrutor?msg=' . urlencode('Curso atualizado.'));
    }

    public function cursoExcluir(): void
    {
        $this->exigir('instrutor');
        $this->validarCsrf();
        $curso = $this->cursoExistente((int) ($_POST['id_curso'] ?? 0));
        try {
            $ok = CursoModel::excluir((int) $curso['id_curso']);
        } catch (PDOException $e) {
            error_log($e->getMessage());
            $ok = false;
        }
        $this->ir('turmas_cursos/instrutor?' . ($ok
            ? 'msg=' . urlencode('Curso excluído.')
            : 'erro=' . urlencode('Não é possível excluir: o curso possui turmas (ativas ou arquivadas).')));
    }

    // Lê e valida nome/descrição do formulário. Devolve [nome, descricao, erro]
    private function lerCurso(int $idAtual): array
    {
        $nome = trim((string) ($_POST['nome'] ?? ''));
        $descricao = trim((string) ($_POST['descricao'] ?? ''));
        $erro = '';
        if ($nome === '' || mb_strlen($nome) > 150) {
            $erro = 'Nome inválido (1 a 150 caracteres).';
        } elseif (mb_strlen($descricao) > 1000) {
            $erro = 'A descrição pode ter no máximo 1000 caracteres.';
        } elseif (CursoModel::nomeExiste($nome, $idAtual)) {
            $erro = 'Já existe um curso com esse nome.';
        }
        return [$nome, $descricao === '' ? null : $descricao, $erro];
    }

    private function cursoExistente(int $id): array
    {
        $curso = CursoModel::buscar($id);
        if (!$curso) {
            $this->ir('turmas_cursos/instrutor?erro=' . urlencode('Curso não encontrado.'));
        }
        return $curso;
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
            'turmas' => TurmaModel::listarDoCurso((int) $curso['id_curso'], (int) $u['idUsuario'], 1),
            'arquivadas' => TurmaModel::listarDoCurso((int) $curso['id_curso'], (int) $u['idUsuario'], 0),
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
        $this->exigirTurmaAtiva($turma);
        $this->view('turmaEditar', ['turma' => $turma, 'erro' => $_GET['erro'] ?? '']);
    }

    public function atualizar(): void
    {
        $u = $this->exigir('instrutor');
        $this->validarCsrf();
        $idTurma = (int) ($_POST['id_turma'] ?? 0);
        $turma = $this->turmaDoInstrutor($idTurma, $u);
        $this->exigirTurmaAtiva($turma);
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

    // ---------- Arquivar / restaurar turma ----------
    // A turma não é apagada: fica guardada e pode ser restaurada (como no Google Sala de Aula).

    public function arquivar(): void
    {
        $this->mudarSituacaoDaTurma(0, 'Turma arquivada.');
    }

    public function restaurar(): void
    {
        $this->mudarSituacaoDaTurma(1, 'Turma restaurada.');
    }

    private function mudarSituacaoDaTurma(int $ativo, string $mensagem): void
    {
        $u = $this->exigir('instrutor');
        $this->validarCsrf();
        $turma = $this->turmaDoInstrutor((int) ($_POST['id_turma'] ?? 0), $u);
        TurmaModel::definirAtivo((int) $turma['id_turma'], (int) $u['idUsuario'], $ativo);
        $this->ir('turmas_cursos/turmaForm?curso=' . (int) $turma['id_curso'] . '&msg=' . urlencode($mensagem));
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
        $this->exigirTurmaAtiva($turma);
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
        $this->exigirTurmaAtiva($turma);
        MatriculaModel::desmatricular((int) $turma['id_turma'], (int) ($_POST['id_aluno'] ?? 0));
        $this->ir('turmas_cursos/turma?id=' . (int) $turma['id_turma'] . '&msg=' . urlencode('Matrícula removida.'));
    }

    // ---------- Contas (desativar / reativar — nunca excluir) ----------

    // Instrutor desativa ou reativa a conta de um aluno
    public function desativarAluno(): void
    {
        $this->mudarSituacaoDoAluno(0, 'Conta do aluno desativada.');
    }

    public function reativarAluno(): void
    {
        $this->mudarSituacaoDoAluno(1, 'Conta do aluno reativada.');
    }

    private function mudarSituacaoDoAluno(int $ativo, string $mensagem): void
    {
        $this->exigir('instrutor');
        $this->validarCsrf();
        $ok = ContaModel::definirAtivoAluno((int) ($_POST['id_aluno'] ?? 0), $ativo);
        $this->ir('turmas_cursos/alunos?' . ($ok ? 'msg=' : 'erro=') . urlencode($ok ? $mensagem : 'Aluno não encontrado.'));
    }

    // Tela "Minha conta": o próprio usuário pode desativar a conta (pede a senha)
    public function conta(): void
    {
        $this->exigirQualquerPerfil();
        $this->view('conta', ['erro' => $_GET['erro'] ?? '', 'msg' => $_GET['msg'] ?? '']);
    }

    public function desativarConta(): void
    {
        $u = $this->exigirQualquerPerfil();
        $this->validarCsrf();

        if (!ContaModel::senhaConfere((int) $u['idUsuario'], (string) ($_POST['senha'] ?? ''))) {
            $this->ir('turmas_cursos/minhaConta?erro=' . urlencode('Senha incorreta.'));
        }
        ContaModel::definirAtivo((int) $u['idUsuario'], 0);
        logout();
        $this->ir('auth/login' . ucfirst($u['perfilAcesso']));
    }

    public function contaAtualizar(): void {
        $u = $this->exigirQualquerPerfil();
        $this->validarCsrf();
        try {
            $pdo = iniciarPDO();
            $usuario = Usuario::buscarPorId($pdo, (int) $u['idUsuario']);
            if (!$usuario->verificarSenha((string) ($_POST['senha_atual'] ?? ''))) {
                throw new InvalidArgumentException('senha atual incorreta.');
            }
            $usuario->atualizarDados(
                $pdo,
                (string) ($_POST['nome'] ?? ''),
                (string) ($_POST['email'] ?? ''),
                (string) ($_POST['nova_senha'] ?? '')
            );

            // mantém a sessão igual ao banco
            $_SESSION['usuario']['nome'] = $usuario->nome;
            $_SESSION['usuario']['email'] = $usuario->email;
            $this->ir('turmas_cursos/minhaConta?msg=' . urlencode('Dados atualizados com sucesso!'));
        } catch (InvalidArgumentException | RuntimeException $e) {
            $this->ir('turmas_cursos/minhaConta?erro=' . urlencode($e->getMessage()));
        }
    }

    // Qualquer perfil logado (aluno ou instrutor); sem login, vai para o login do aluno
    private function exigirQualquerPerfil(): array
    {
        $u = usuarioLogado();
        return $this->exigir($u['perfilAcesso'] ?? 'aluno');
    }

    // Garante login e perfil. (Não uso solicitarPerfilDeAcesso() do core: ele lê
    // $_SESSION['perfilAcesso'], mas o login grava em $_SESSION['usuario'].)
    private function exigir(string $perfil): array
    {
        $u = usuarioLogado();
        if (!$u) {
            $this->ir('auth/login' . ucfirst($perfil));
        }
        // Conta desativada: encerra a sessão e volta para o login
        if (!ContaModel::estaAtiva((int) $u['idUsuario'])) {
            logout();
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

    // Turma arquivada é só para consulta: não permite editar nem mexer em matrículas
    private function exigirTurmaAtiva(array $turma): void
    {
        if ((int) $turma['ativo'] !== 1) {
            $this->ir('turmas_cursos/turma?id=' . (int) $turma['id_turma']
                . '&erro=' . urlencode('Turma arquivada. Restaure-a para fazer alterações.'));
        }
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
