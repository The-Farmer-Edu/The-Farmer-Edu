<?php
/**
 * ============================================================================
 * MÓDULO NOTAS - CONTROLLER (Controller.php)
 * ============================================================================
 * Camada de controle da arquitetura MVC para o módulo de notas.
 * Responsável por receber as requisições HTTP, validar autenticação e permissões
 * de acesso por perfil (Aluno vs Instrutor), acionar a camada de dados (NotasModel)
 * e carregar a visão correspondente com os dados preparados.
 * ============================================================================
 */

// Dependências do Model de notas e gerenciamento de sessão de usuário
require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/../../core/session.php';

// =====================================================================
// NotasController — gerencia as rotas de notas para aluno e instrutor
// =====================================================================

class NotasController
{
    /**
     * Instância da camada de dados do módulo de notas.
     * @var NotasModel
     */
    private NotasModel $model;

    /**
     * Construtor da classe: inicializa a instância do NotasModel.
     */
    public function __construct()
    {
        $this->model = new NotasModel();
    }

    // -----------------------------------------------------------------
    // VISÃO DO ALUNO — GET /notas/aluno
    // -----------------------------------------------------------------
    /**
     * Exibe o painel de notas e histórico de atividades do aluno logado.
     * - Exige autenticação prévia na sessão.
     * - Se o usuário logado for instrutor, redireciona para o painel correto.
     * - Obtém as atividades com notas e calcula o resumo (médias e pendências).
     * - Renderiza a view 'index.php'.
     *
     * @return void
     */
    public function verNotasAluno(): void
    {
        // Garante que o usuario esta logado
        solicitarLogin();

        // Obtém os dados do usuário atualmente autenticado
        $usuario = usuarioLogado();

        // Se for instrutor, redireciona para o painel certo
        if ($usuario['perfilAcesso'] === 'instrutor') {
            header('Location: /notas/instrutor');
            exit;
        }

        // Recupera ID do aluno e consulta atividades e métricas consolidadas
        $idAluno   = (int) $usuario['idUsuario'];
        $atividades = $this->model->buscarNotasDoAluno($idAluno);
        $resumo     = $this->model->calcularResumoAluno($idAluno);

        // Carrega a view de notas do aluno com as variáveis necessárias
        $this->view('index', [
            'usuario'    => $usuario,
            'atividades' => $atividades,
            'resumo'     => $resumo,
        ]);
    }

    // -----------------------------------------------------------------
    // PAINEL DO INSTRUTOR — GET /notas/instrutor
    // -----------------------------------------------------------------
    /**
     * Exibe o painel do instrutor com a listagem de suas turmas atribuídas.
     * - Garante que o usuário esteja autenticado e tenha perfil de instrutor.
     * - Consulta todas as turmas vinculadas ao instrutor logado.
     * - Renderiza a view 'instrutor.php'.
     *
     * @return void
     */
    public function painelInstrutor(): void
    {
        // Garante que o usuário esteja logado
        solicitarLogin();

        $usuario = usuarioLogado();

        // Bloqueia acesso caso o usuário não possua o perfil de instrutor
        if ($usuario['perfilAcesso'] !== 'instrutor') {
            http_response_code(403);
            echo "Acesso negado.";
            exit;
        }

        // Obtém o ID do instrutor e busca as suas turmas
        $idInstrutor = (int) $usuario['idUsuario'];
        $turmas      = $this->model->buscarTurmasDoInstrutor($idInstrutor);

        // Carrega a view do painel do instrutor
        $this->view('instrutor', [
            'usuario' => $usuario,
            'turmas'  => $turmas,
        ]);
    }

    // -----------------------------------------------------------------
    // TURMA ESPECIFICA — GET /notas/turma?id=X
    // -----------------------------------------------------------------
    /**
     * Exibe a tela de gerenciamento de notas de uma turma específica.
     * - Verifica permissões de instrutor.
     * - Valida o ID da turma passado via query string.
     * - Carrega detalhes da turma e a lista de submissões dos alunos.
     * - Renderiza a view 'turma.php'.
     *
     * @return void
     */
    public function verTurma(): void
    {
        // Garante autenticação
        solicitarLogin();

        $usuario = usuarioLogado();

        // Valida se o usuário tem privilégio de instrutor
        if ($usuario['perfilAcesso'] !== 'instrutor') {
            http_response_code(403);
            echo "Acesso negado.";
            exit;
        }

        // Validação do parâmetro de ID da turma na URL
        $idTurma = (int) ($_GET['id'] ?? 0);
        if ($idTurma <= 0) {
            header('Location: /notas/instrutor');
            exit;
        }

        // Busca dados cadastrais da turma e histórico de submissões
        $turma       = $this->model->buscarTurma($idTurma);
        $submissoes  = $this->model->buscarSubmissoesDaTurma($idTurma);

        // Carrega a view de lançamento de notas da turma
        $this->view('turma', [
            'usuario'    => $usuario,
            'turma'      => $turma,
            'submissoes' => $submissoes,
        ]);
    }

    // -----------------------------------------------------------------
    // SALVAR NOTA — POST /notas/salvar
    // -----------------------------------------------------------------
    /**
     * Processa a gravação ou atualização da nota de uma submissão.
     * - Valida a autenticação e permissão de instrutor.
     * - Lê e valida os dados recebidos via POST (id_submissao, valor, id_turma).
     * - Garante que a nota esteja no intervalo permitido (0 a 10).
     * - Grava no banco e atualiza o status para 'corrigida'.
     * - Responde em JSON caso seja requisição AJAX/fetch, ou redireciona via HTTP.
     *
     * @return void
     */
    public function salvarNota(): void
    {
        // Garante que o usuário esteja logado
        solicitarLogin();

        $usuario = usuarioLogado();

        // Apenas instrutores podem lançar notas
        if ($usuario['perfilAcesso'] !== 'instrutor') {
            http_response_code(403);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Acesso negado.']);
            exit;
        }

        // Leitura dos dados enviados via POST (formulario ou fetch/AJAX)
        $idSubmissao = (int)   ($_POST['id_submissao'] ?? 0);
        $valor       = (float) ($_POST['valor']        ?? -1);
        $idTurma     = (int)   ($_POST['id_turma']     ?? 0);
        $idInstrutor = (int)   $usuario['idUsuario'];

        $erros = [];

        // Validações dos campos recebidos
        if ($idSubmissao <= 0) {
            $erros[] = 'Submissao invalida.';
        }
        if ($valor < 0 || $valor > 10) {
            $erros[] = 'Nota deve ser entre 0 e 10.';
        }

        // Se houver erros, interrompe e retorna resposta adequada
        if (!empty($erros)) {
            // Se for AJAX retorna JSON; se nao, redireciona com erro na URL
            if ($this->isAjax()) {
                header('Content-Type: application/json');
                echo json_encode(['sucesso' => false, 'mensagem' => implode(' ', $erros)]);
            } else {
                header("Location: /notas/turma?id={$idTurma}&erro=" . urlencode(implode(' ', $erros)));
            }
            exit;
        }

        // Tenta salvar a nota via Model
        try {
            $this->model->salvarNota($idSubmissao, $valor, $idInstrutor);
            $mensagem = "Nota lancada com sucesso!";
            $sucesso  = true;
        } catch (Throwable $e) {
            error_log($e->getMessage());
            $mensagem = "Erro ao salvar nota." . $e->getMessage();
            $sucesso  = false;
        }

        // Emissão do feedback de acordo com o protocolo da requisição
        if ($this->isAjax()) {
            ob_clean();
            header('Content-Type: application/json');
            echo json_encode(['sucesso' => $sucesso, 'mensagem' => $mensagem]);
        } else {
            $param = $sucesso ? "sucesso=" . urlencode($mensagem) : "erro=" . urlencode($mensagem);
            header("Location: /notas/turma?id={$idTurma}&{$param}");
        }
        exit;
    }

    // -----------------------------------------------------------------
    // LOGOUT — GET /notas/logout
    // -----------------------------------------------------------------
<<<<<<< HEAD
    public function logout(): void
    {
        logout();

=======
    /**
     * Encerra a sessão do usuário e redireciona para a página de login de alunos.
     *
     * @return void
     */
    public function logout(): void
    {
        // Destrói a sessão atual
        logout();

        // Determina o caminho base relativo para redirecionar corretamente
>>>>>>> 3e9abe84a4120effc4f0447c0318bbb0ab5d726f
        $base = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
        header('Location: ' . $base . '/auth/loginAluno');
        exit;
    }

    // -----------------------------------------------------------------
    // Helpers privados
    // -----------------------------------------------------------------

    /**
     * Carrega a view passando variáveis como escopo local.
     *
     * @param string $nome Nome do arquivo da view (sem extensão .php)
     * @param array $dados Dados associativos disponibilizados na view
     * @return void
     */
    private function view(string $nome, array $dados = []): void
    {
        extract($dados);
        require __DIR__ . '/views/' . $nome . '.php';
    }

    /**
     * Verifica se a requisição veio via AJAX / fetch através dos cabeçalhos HTTP.
     *
     * @return bool
     */
    private function isAjax(): bool
    {
        return (
            ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'XMLHttpRequest'
            || str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json')
        );
    }
}
