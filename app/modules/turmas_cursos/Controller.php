<?php

require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/../../core/session.php';

class CursosController
{
    private const MAX_IMAGEM_BYTES = 5242880; // 5 MB
    private const MIME_IMAGENS = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
    ];

    public function inicio(): void
    {
        $u = usuarioLogado();
        $this->ir($u ? 'turmas_cursos/' . $u['perfilAcesso'] : 'auth/loginAluno');
    }

    public function instrutor(): void
    {
        $u = $this->exigir('instrutor');
        $this->view('paginaInstrutor', [
            'cursos'       => CursoModel::listar(),
            'turmas'       => TurmaModel::listarDoInstrutor((int) $u['idUsuario'], 1),
            'arquivadas'   => TurmaModel::listarDoInstrutor((int) $u['idUsuario'], 0),
            'msg'          => $_GET['msg'] ?? '',
            'erro'         => $_GET['erro'] ?? '',
            'abrirModal'   => $_GET['modal'] ?? '',
        ]);
    }

    // A listagem de cursos existe para os dois perfis. O aluno só recebe
    // cursos que possuem turmas em que ele está matriculado.
    public function cursos(): void
    {
        $u = $this->exigirQualquerPerfil();
        $instrutor = $u['perfilAcesso'] === 'instrutor';
        $this->view('cursos', [
            'cursos'       => $instrutor ? CursoModel::listar(1) : CursoModel::listarDoAluno((int) $u['idUsuario']),
            'cursosArquivados' => $instrutor ? CursoModel::listar(0) : [],
            'ehInstrutor'  => $instrutor,
            'msg'          => $_GET['msg'] ?? '',
            'erro'         => $_GET['erro'] ?? '',
            'abrirModal'   => $_GET['modal'] ?? '',
        ]);
    }

    public function cursoAluno(): void
    {
        $u = $this->exigir('aluno');
        $curso = CursoModel::buscarDoAluno((int) ($_GET['id'] ?? 0), (int) $u['idUsuario']);
        if (!$curso) {
            $this->ir('turmas_cursos/cursos?erro=' . urlencode('Curso não encontrado.'));
        }
        $this->view('cursoAluno', [
            'curso'  => $curso,
            'turmas' => TurmaModel::listarDoAlunoPorCurso((int) $u['idUsuario'], (int) $curso['id_curso']),
        ]);
    }

    public function aluno(): void
    {
        $u = $this->exigir('aluno');
        $this->view('paginaAluno', [
            'turmas' => TurmaModel::listarDoAluno((int) $u['idUsuario']),
        ]);
    }

    public function alunos(): void
    {
        $this->exigir('instrutor');
        $this->view('alunos', [
            'alunos' => AlunoModel::listar(),
            'msg'    => $_GET['msg'] ?? '',
            'erro'   => $_GET['erro'] ?? '',
        ]);
    }

    // ---------- Cursos ----------

    public function cursoNovo(): void
    {
        $this->exigir('instrutor');
        $this->ir('turmas_cursos/cursos?modal=curso');
    }

    public function cursoSalvar(): void
    {
        $this->exigir('instrutor');
        $this->validarCsrf();
        [$nome, $descricao, $erro] = $this->lerCurso();
        if ($erro !== '') {
            $this->ir('turmas_cursos/cursos?modal=curso&erro=' . urlencode($erro));
        }
        CursoModel::criar($nome, $descricao);
        $this->ir('turmas_cursos/cursos?msg=' . urlencode('Curso criado com sucesso.'));
    }

    public function cursoEditar(): void
    {
        $this->exigir('instrutor');
        $curso = $this->cursoExistente((int) ($_GET['id'] ?? 0));
        if ((int) ($curso['ativo'] ?? 1) !== 1) {
            $this->ir('turmas_cursos/cursos?erro=' . urlencode('Restaure o curso antes de editá-lo.'));
        }
        $this->view('cursoForm', ['curso' => $curso, 'erro' => $_GET['erro'] ?? '']);
    }

    public function cursoAtualizar(): void
    {
        $this->exigir('instrutor');
        $this->validarCsrf();
        $curso = $this->cursoExistente((int) ($_POST['id_curso'] ?? 0));
        if ((int) ($curso['ativo'] ?? 1) !== 1) {
            $this->ir('turmas_cursos/cursos?erro=' . urlencode('Restaure o curso antes de editá-lo.'));
        }
        [$nome, $descricao, $erro] = $this->lerCurso((int) $curso['id_curso']);
        if ($erro !== '') {
            $this->ir('turmas_cursos/cursoEditar?id=' . (int) $curso['id_curso'] . '&erro=' . urlencode($erro));
        }
        CursoModel::atualizar((int) $curso['id_curso'], $nome, $descricao);
        $this->ir('turmas_cursos/cursos?msg=' . urlencode('Curso atualizado.'));
    }

    public function cursoArquivar(): void
    {
        $this->mudarSituacaoDoCurso(0, 'Curso arquivado. As turmas existentes e suas matrículas foram preservadas.');
    }

    public function cursoRestaurar(): void
    {
        $this->mudarSituacaoDoCurso(1, 'Curso restaurado.');
    }

    private function mudarSituacaoDoCurso(int $ativo, string $mensagem): void
    {
        $this->exigir('instrutor');
        $this->validarCsrf();
        $curso = $this->cursoExistente((int) ($_POST['id_curso'] ?? 0));
        CursoModel::definirAtivo((int) $curso['id_curso'], $ativo);
        $this->ir('turmas_cursos/cursos?msg=' . urlencode($mensagem));
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
        $this->ir('turmas_cursos/cursos?' . ($ok
            ? 'msg=' . urlencode('Curso excluído.')
            : 'erro=' . urlencode('Não é possível excluir um curso que possui turmas.')));
    }

    private function lerCurso(int $idAtual = 0): array
    {
        $nome = trim((string) ($_POST['nome'] ?? ''));
        $descricao = trim((string) ($_POST['descricao'] ?? ''));
        $erro = '';
        if ($nome === '' || comprimentoTexto($nome) > 150) {
            $erro = 'Informe um nome de curso com até 150 caracteres.';
        } elseif (comprimentoTexto($descricao) > 1000) {
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
            $this->ir('turmas_cursos/cursos?erro=' . urlencode('Curso não encontrado.'));
        }
        return $curso;
    }

    // ---------- Turmas ----------

    // Tela de gestão de turmas vinculadas a um curso, para o instrutor.
    public function form(): void
    {
        $u = $this->exigir('instrutor');
        $curso = CursoModel::buscar((int) ($_GET['curso'] ?? 0));
        if (!$curso || (int) ($curso['ativo'] ?? 1) !== 1) {
            $this->ir('turmas_cursos/cursos?erro=' . urlencode('Curso não encontrado ou arquivado. Restaure-o para adicionar novas turmas.'));
        }
        $this->view('form', [
            'curso'      => $curso,
            'turmas'     => TurmaModel::listarDoCurso((int) $curso['id_curso'], (int) $u['idUsuario'], 1),
            'arquivadas' => TurmaModel::listarDoCurso((int) $curso['id_curso'], (int) $u['idUsuario'], 0),
            'erro'       => $_GET['erro'] ?? '',
            'msg'        => $_GET['msg'] ?? '',
        ]);
    }

    public function salvar(): void
    {
        $u = $this->exigir('instrutor');
        $this->validarCsrf();
        $idCurso = (int) ($_POST['id_curso'] ?? 0);
        $nome = trim((string) ($_POST['nome'] ?? ''));
        $turno = (string) ($_POST['turno'] ?? '');

        $cursoSelecionado = CursoModel::buscar($idCurso);
        if (!$cursoSelecionado || (int) ($cursoSelecionado['ativo'] ?? 1) !== 1) {
            $this->ir('turmas_cursos/instrutor?erro=' . urlencode('Selecione um curso ativo.') . '&modal=turma');
        }
        if ($nome === '' || comprimentoTexto($nome) > 100) {
            $this->ir('turmas_cursos/instrutor?erro=' . urlencode('O nome da turma deve ter até 100 caracteres.') . '&modal=turma');
        }
        if (!isset(TurmaModel::TURNOS[$turno])) {
            $this->ir('turmas_cursos/instrutor?erro=' . urlencode('Selecione um turno válido.') . '&modal=turma');
        }

        [$imagem, $erroImagem] = $this->receberImagemTurma();
        if ($erroImagem !== '') {
            $this->ir('turmas_cursos/instrutor?erro=' . urlencode($erroImagem) . '&modal=turma');
        }

        try {
            TurmaModel::criar($nome, $turno, $idCurso, (int) $u['idUsuario'], $imagem);
        } catch (Throwable $e) {
            if ($imagem) $this->apagarImagem($imagem);
            error_log($e->getMessage());
            $this->ir('turmas_cursos/instrutor?erro=' . urlencode('Não foi possível salvar a turma. Verifique se a coluna image_turma já existe no banco.') . '&modal=turma');
        }
        $this->ir('turmas_cursos/instrutor?msg=' . urlencode('Turma criada com sucesso.'));
    }

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

        if ($nome === '' || comprimentoTexto($nome) > 100) {
            $this->ir($voltar . urlencode('O nome da turma deve ter até 100 caracteres.'));
        }
        if (!isset(TurmaModel::TURNOS[$turno])) {
            $this->ir($voltar . urlencode('Selecione um turno válido.'));
        }

        [$novaImagem, $erroImagem] = $this->receberImagemTurma();
        if ($erroImagem !== '') {
            $this->ir($voltar . urlencode($erroImagem));
        }
        $imagemAntiga = $turma['image_turma'] ?? null;
        $imagemFinal = $imagemAntiga;
        if ($novaImagem !== null) {
            // Uma nova imagem tem prioridade sobre a opção de remoção.
            $imagemFinal = $novaImagem;
        } elseif (!empty($_POST['remover_imagem'])) {
            $imagemFinal = null;
        }

        try {
            $atualizada = TurmaModel::atualizar(
                $idTurma,
                (int) $u['idUsuario'],
                $nome,
                $turno,
                $imagemFinal
            );
            if (!$atualizada) {
                if ($novaImagem) $this->apagarImagem($novaImagem);
                $this->ir($voltar . urlencode('Não foi possível confirmar a atualização da turma. Tente novamente.'));
            }
        } catch (Throwable $e) {
            // A imagem antiga continua no banco e no disco se o UPDATE falhar.
            if ($novaImagem) $this->apagarImagem($novaImagem);
            error_log($e->getMessage());
            $this->ir($voltar . urlencode('Não foi possível atualizar a turma.'));
        }

        // Só remove a imagem anterior depois de confirmar o novo caminho no
        // banco. O método também protege arquivos eventualmente compartilhados.
        if ($imagemAntiga && $imagemAntiga !== $imagemFinal) {
            $this->apagarImagemSeNaoUtilizada($imagemAntiga);
        }
        $this->ir('turmas_cursos/turma?id=' . $idTurma . '&msg=' . urlencode('Turma atualizada.'));
    }

    public function arquivar(): void { $this->mudarSituacaoDaTurma(0, 'Turma arquivada.'); }
    public function restaurar(): void { $this->mudarSituacaoDaTurma(1, 'Turma restaurada.'); }

    private function mudarSituacaoDaTurma(int $ativo, string $mensagem): void
    {
        $u = $this->exigir('instrutor');
        $this->validarCsrf();
        $turma = $this->turmaDoInstrutor((int) ($_POST['id_turma'] ?? 0), $u);
        TurmaModel::definirAtivo((int) $turma['id_turma'], (int) $u['idUsuario'], $ativo);
        $this->ir('turmas_cursos/instrutor?msg=' . urlencode($mensagem));
    }

    // Mural da turma para o instrutor.
    public function turma(): void
    {
        $u = $this->exigir('instrutor');
        $turma = $this->turmaDoInstrutor((int) ($_GET['id'] ?? 0), $u);
        $this->view('turma', [
            'turma'      => $turma,
            // A listagem será fornecida pela API pública do módulo atividades na integração.
            'atividades' => [],
            'msg'        => $_GET['msg'] ?? '',
            'erro'       => $_GET['erro'] ?? '',
        ]);
    }

    // Mural da turma para o aluno matriculado.
    public function turmaAluno(): void
    {
        $u = $this->exigir('aluno');
        $turma = TurmaModel::buscarDoAluno((int) ($_GET['id'] ?? 0), (int) $u['idUsuario']);
        if (!$turma) $this->ir('turmas_cursos/aluno?erro=' . urlencode('Turma não encontrada.'));
        $this->view('turmaAluno', [
            'turma'      => $turma,
            // A listagem será fornecida pela API pública dos módulos atividades/submissoes na integração.
            'atividades' => [],
            'pessoas'    => TurmaModel::alunosDaTurma((int) $turma['id_turma']),
        ]);
    }

    // Tela de pessoas/alunos da turma. A matrícula é feita selecionando
    // um aluno já cadastrado no sistema, conforme o protótipo.
    public function turmaPessoas(): void
    {
        $u = $this->exigir('instrutor');
        $turma = $this->turmaDoInstrutor((int) ($_GET['id'] ?? 0), $u);
        $this->view('turmaPessoas', [
            'turma'        => $turma,
            'matriculados' => TurmaModel::alunosDaTurma((int) $turma['id_turma']),
            'disponiveis'  => AlunoModel::disponiveisParaTurma((int) $turma['id_turma']),
            'msg'          => $_GET['msg'] ?? '',
            'erro'         => $_GET['erro'] ?? '',
        ]);
    }

    public function turmaPessoasAluno(): void
    {
        $u = $this->exigir('aluno');
        $turma = TurmaModel::buscarDoAluno((int) ($_GET['id'] ?? 0), (int) $u['idUsuario']);
        if (!$turma) $this->ir('turmas_cursos/aluno?erro=' . urlencode('Turma não encontrada.'));
        $this->view('turmaPessoasAluno', [
            'turma'   => $turma,
            'pessoas' => TurmaModel::alunosDaTurma((int) $turma['id_turma']),
        ]);
    }

    public function matricular(): void
    {
        $u = $this->exigir('instrutor');
        $this->validarCsrf();
        $turma = $this->turmaDoInstrutor((int) ($_POST['id_turma'] ?? 0), $u);
        $this->exigirTurmaAtiva($turma);
        $idAluno = (int) ($_POST['id_aluno'] ?? 0);
        if (!AlunoModel::existe($idAluno)) {
            $this->ir('turmas_cursos/turmaPessoas?id=' . (int) $turma['id_turma'] . '&erro=' . urlencode('Selecione um aluno válido.'));
        }
        $novo = MatriculaModel::matricular((int) $turma['id_turma'], $idAluno);
        $this->ir('turmas_cursos/turmaPessoas?id=' . (int) $turma['id_turma'] . ($novo
            ? '&msg=' . urlencode('Aluno adicionado à turma.')
            : '&erro=' . urlencode('Esse aluno já está matriculado nesta turma.')));
    }

    public function desmatricular(): void
    {
        $u = $this->exigir('instrutor');
        $this->validarCsrf();
        $turma = $this->turmaDoInstrutor((int) ($_POST['id_turma'] ?? 0), $u);
        $this->exigirTurmaAtiva($turma);
        MatriculaModel::desmatricular((int) $turma['id_turma'], (int) ($_POST['id_aluno'] ?? 0));
        $this->ir('turmas_cursos/turmaPessoas?id=' . (int) $turma['id_turma'] . '&msg=' . urlencode('Matrícula removida.'));
    }

    // ---------- Ativação/desativação de contas de alunos ----------

    public function desativarAluno(): void { $this->mudarSituacaoDoAluno(0, 'Conta do aluno desativada.'); }
    public function reativarAluno(): void { $this->mudarSituacaoDoAluno(1, 'Conta do aluno reativada.'); }

    private function mudarSituacaoDoAluno(int $ativo, string $mensagem): void
    {
        $this->exigir('instrutor');
        $this->validarCsrf();
        $idTurma = (int) ($_POST['id_turma'] ?? 0);
        if ($idTurma > 0) {
            $u = usuarioLogado();
            $this->turmaDoInstrutor($idTurma, $u);
        }
        $ok = ContaModel::definirAtivoAluno((int) ($_POST['id_aluno'] ?? 0), $ativo);
        $destino = $idTurma > 0 ? 'turmas_cursos/turmaPessoas?id=' . $idTurma : 'turmas_cursos/alunos';
        $this->ir($destino . '?' . ($ok ? 'msg=' : 'erro=') . urlencode($ok ? $mensagem : 'Aluno não encontrado.'));
    }

    // ---------- Minha conta ----------

    public function conta(): void
    {
        $u = $this->exigirQualquerPerfil();
        $this->view('conta', ['erro' => $_GET['erro'] ?? '']);
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

    // ---------- Arquivos estáticos e imagens privadas ----------

    public function asset(): void
    {
        $nome = (string) ($_GET['file'] ?? '');
        $permitidos = [
            'turmas-cursos.css' => __DIR__ . '/assets/css/turmas-cursos.css',
            'turmas-cursos.js'  => __DIR__ . '/assets/js/turmas-cursos.js',
        ];
        if (!isset($permitidos[$nome]) || !is_file($permitidos[$nome])) {
            http_response_code(404);
            exit;
        }
        $ext = pathinfo($nome, PATHINFO_EXTENSION);
        header('Content-Type: ' . ($ext === 'css' ? 'text/css; charset=utf-8' : 'application/javascript; charset=utf-8'));
        header('Cache-Control: public, max-age=3600');
        readfile($permitidos[$nome]);
        exit;
    }

    public function imagemTurma(): void
    {
        $u = $this->exigirQualquerPerfil();
        $idTurma = (int) ($_GET['id'] ?? 0);
        if ($u['perfilAcesso'] === 'instrutor') {
            $turma = TurmaModel::buscarDoInstrutor($idTurma, (int) $u['idUsuario']);
        } else {
            $turma = TurmaModel::buscarDoAluno($idTurma, (int) $u['idUsuario']);
        }
        if (!$turma) {
            http_response_code(404);
            exit;
        }
        $nomeArquivo = $turma['image_turma'] ?? '';
        if ($nomeArquivo === '' || basename($nomeArquivo) !== $nomeArquivo) {
            http_response_code(404);
            exit;
        }
        $arquivo = __DIR__ . '/uploads/turmas/' . $nomeArquivo;
        if (!is_file($arquivo)) {
            http_response_code(404);
            exit;
        }
        $mime = function_exists('mime_content_type') ? mime_content_type($arquivo) : 'application/octet-stream';
        if (!isset(self::MIME_IMAGENS[$mime])) {
            http_response_code(415);
            exit;
        }
        header('Content-Type: ' . $mime);
        header('Content-Length: ' . filesize($arquivo));
        header('X-Content-Type-Options: nosniff');
        header('Cache-Control: private, max-age=3600');
        readfile($arquivo);
        exit;
    }

    // ---------- Helpers ----------

    private function receberImagemTurma(): array
    {
        if (!isset($_FILES['imagem_turma'])) {
            return [null, ''];
        }
        $upload = $_FILES['imagem_turma'];
        if (!is_array($upload)) {
            return [null, 'Não foi possível receber a imagem. Tente novamente.'];
        }
        $erroUpload = $upload['error'] ?? UPLOAD_ERR_NO_FILE;
        if ($erroUpload === UPLOAD_ERR_NO_FILE) {
            return [null, ''];
        }
        $temporario = $upload['tmp_name'] ?? '';
        if ($erroUpload !== UPLOAD_ERR_OK || !is_string($temporario) || $temporario === '' || !is_uploaded_file($temporario)) {
            return [null, 'Não foi possível receber a imagem. Tente novamente.'];
        }
        $tamanho = filesize($temporario);
        if ($tamanho === false || $tamanho <= 0 || $tamanho > self::MAX_IMAGEM_BYTES) {
            return [null, 'A imagem deve ter no máximo 5 MB.'];
        }
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($temporario);
        if (!isset(self::MIME_IMAGENS[$mime])) {
            return [null, 'Formato inválido. Envie uma imagem JPG, PNG ou WEBP.'];
        }
        $info = @getimagesize($temporario);
        if ($info === false || !isset($info['mime']) || $info['mime'] !== $mime) {
            return [null, 'O arquivo enviado não é uma imagem válida.'];
        }

        $diretorio = __DIR__ . '/uploads/turmas';
        if (!is_dir($diretorio) && !mkdir($diretorio, 0750, true) && !is_dir($diretorio)) {
            return [null, 'Não foi possível preparar o armazenamento das imagens.'];
        }
        $nome = bin2hex(random_bytes(20)) . '.' . self::MIME_IMAGENS[$mime];
        if (!move_uploaded_file($temporario, $diretorio . '/' . $nome)) {
            return [null, 'Não foi possível salvar a imagem enviada.'];
        }
        return [$nome, ''];
    }

    /** Remove apenas arquivos gerados por este módulo (nome aleatório + extensão permitida). */
    private function apagarImagem(?string $nome): bool
    {
        if (!$nome || !preg_match('/\A[a-f0-9]{40}\.(?:jpg|png|webp)\z/i', $nome)) {
            return false;
        }

        $diretorio = realpath(__DIR__ . '/uploads/turmas');
        if ($diretorio === false) return true; // Não há arquivo para remover.

        $arquivo = $diretorio . DIRECTORY_SEPARATOR . $nome;
        if (!is_file($arquivo)) return true;
        if (@unlink($arquivo)) return true;

        error_log('Não foi possível remover a imagem da turma: ' . $nome);
        return false;
    }

    /** Evita apagar um arquivo que ainda esteja associado a outra turma. */
    private function apagarImagemSeNaoUtilizada(?string $nome): void
    {
        if (!$nome || !preg_match('/\A[a-f0-9]{40}\.(?:jpg|png|webp)\z/i', $nome)) return;

        try {
            if (!TurmaModel::imagemEstaEmUso($nome)) {
                $this->apagarImagem($nome);
            }
        } catch (Throwable $e) {
            // Em caso de falha ao consultar o banco, é mais seguro manter o
            // arquivo do que correr o risco de apagar uma imagem ainda usada.
            error_log('Não foi possível verificar o uso da imagem ' . $nome . ': ' . $e->getMessage());
        }
    }

    private function exigirQualquerPerfil(): array
    {
        $u = usuarioLogado();
        return $this->exigir($u['perfilAcesso'] ?? 'aluno');
    }

    private function exigir(string $perfil): array
    {
        $u = usuarioLogado();
        if (!$u) $this->ir('auth/login' . ucfirst($perfil));
        if (!ContaModel::estaAtiva((int) $u['idUsuario'])) {
            logout();
            $this->ir('auth/login' . ucfirst($perfil));
        }
        if (($u['perfilAcesso'] ?? '') !== $perfil) {
            http_response_code(403);
            exit('Você não tem acesso a essa página.');
        }
        return $u;
    }

    private function turmaDoInstrutor(int $idTurma, array $u): array
    {
        $turma = TurmaModel::buscarDoInstrutor($idTurma, (int) $u['idUsuario']);
        if (!$turma) $this->ir('turmas_cursos/instrutor?erro=' . urlencode('Turma não encontrada.'));
        return $turma;
    }

    private function exigirTurmaAtiva(array $turma): void
    {
        if ((int) $turma['ativo'] !== 1) {
            $this->ir('turmas_cursos/turma?id=' . (int) $turma['id_turma'] . '&erro=' . urlencode('Turma arquivada. Restaure-a para fazer alterações.'));
        }
    }

    private function validarCsrf(): void
    {
        $esperado = $_SESSION['csrf_turmas'] ?? '';
        $recebido = (string) ($_POST['csrf'] ?? '');
        if ($esperado === '' || !hash_equals($esperado, $recebido)) {
            http_response_code(403);
            exit('Requisição inválida. Volte e tente novamente.');
        }
    }

    private function ir(string $destino): void
    {
        header('Location: ' . rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\') . '/' . ltrim($destino, '/'));
        exit;
    }

    private function view(string $nome, array $dados): void
    {
        $u = usuarioLogado();
        $base = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
        if (empty($_SESSION['csrf_turmas'])) $_SESSION['csrf_turmas'] = bin2hex(random_bytes(32));
        $csrf = $_SESSION['csrf_turmas'];
        $assetUrl = $base . '/turmas_cursos/asset?file=';
        $logoUrl = $base . '/assets/img/png/logo_icone.png';
        $theme = (($u['perfilAcesso'] ?? '') === 'aluno') ? 'student' : 'teacher';
        extract($dados);
        require __DIR__ . '/views/' . $nome . '.php';
    }
}

function e($v): string
{
    return htmlspecialchars((string) $v, ENT_QUOTES, 'UTF-8');
}

function comprimentoTexto(string $texto): int
{
    $quantidade = preg_match_all('/./us', $texto, $matches);
    return $quantidade === false ? strlen($texto) : $quantidade;
}

function inicialNome(string $nome): string
{
    if (!preg_match('/^\s*(.)/us', $nome, $matches)) return '?';
    $letra = $matches[1];
    if (function_exists('mb_strtoupper')) return mb_strtoupper($letra, 'UTF-8');
    return strtr(strtoupper($letra), [
        'á'=>'Á','à'=>'À','â'=>'Â','ã'=>'Ã','ä'=>'Ä','é'=>'É','ê'=>'Ê','è'=>'È','ë'=>'Ë',
        'í'=>'Í','ì'=>'Ì','î'=>'Î','ï'=>'Ï','ó'=>'Ó','ò'=>'Ò','ô'=>'Ô','õ'=>'Õ','ö'=>'Ö',
        'ú'=>'Ú','ù'=>'Ù','û'=>'Û','ü'=>'Ü','ç'=>'Ç','ñ'=>'Ñ'
    ]);
}
