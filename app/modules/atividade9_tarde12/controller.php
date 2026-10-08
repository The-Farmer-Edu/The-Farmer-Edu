<?php

require_once __DIR__ . '/model.php';

class ControllerUsuario{
    private $pdo = null;
    /** Construtor da classe de conexão. */
    public function __construct($pdo = null) {
        $this->pdo = ($pdo instanceof PDO) ? $pdo : self::obterConexao();
    }

    /**
     * Retorna a conexão ativa com o banco de dados.
     * @return PDO
     */
    public static function obterConexao() {
        static $instancia = null;
        if ($instancia !== null) {
            return $instancia;
        }

        // 1. Tenta utilizar a função iniciarPDO() do módulo core se disponível
        $caminhoCore = dirname(dirname(__DIR__)) . DIRECTORY_SEPARATOR . 'core' . DIRECTORY_SEPARATOR . 'database.php';
        if (file_exists($caminhoCore)) {
            require_once $caminhoCore;
            if (function_exists('iniciarPDO')) {
                $instancia = iniciarPDO();
            }
        }

        if ($instancia === null) {
            throw new Exception("Não foi possível obter a conexão com o banco de dados.");
        }

        return $instancia;
    }

    // calcula a url para que os hrefs e actions funcionem corretamente, mesmo em subdiretórios
    private function calcularBaseUrl() {
        $viewsDir = realpath(__DIR__ . '/views');
        $docRoot = realpath(isset($_SERVER['DOCUMENT_ROOT']) ? $_SERVER['DOCUMENT_ROOT'] : '');

        if ($docRoot && $viewsDir && strpos($viewsDir, $docRoot) === 0) {
            return str_replace('\\', '/', substr($viewsDir, strlen($docRoot)));
        }

        $scriptDir = dirname(isset($_SERVER['SCRIPT_NAME']) ? $_SERVER['SCRIPT_NAME'] : '');
        if (strpos($scriptDir, 'views') !== false) {
            return $scriptDir;
        }

        return rtrim($scriptDir, '/') . '/views';
    }

    public function validar_login($email, $senha) {
        $email = (string)$email;
        $senha = (string)$senha;
        $erros = array();

        if (empty($email) || empty($senha)) {
            $erros["mensagem"] = "Preencha todos os campos.";
            $erros["status"] = "erro";
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL) && strlen($senha) < 8) {
            $erros["mensagem"] = "E-mail e Senha inválidos.";
            $erros["status"] = "erro";
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $erros["mensagem"] = "E-mail inválido.";
            $erros["status"] = "erro";
        } elseif (strlen($senha) < 8) {
            $erros["mensagem"] = "Senha deve ter no mínimo 8 caracteres.";
            $erros["status"] = "erro";
        } else {
            $erros["mensagem"] = "Tudo Certo!";
            $erros["status"] = "sucesso";
        }

        return $erros;
    }

    // função para a view de cadastro de usuário
    public function showNovoUsuario():void {
        $pdo = $this->pdo;
        $mensagemFeedback = null;
        $usuarioCriado = null;
        $resultadoTeste1 = null;

        // Processa formulário de cadastro caso enviado
        if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['acao']) && $_POST['acao'] === 'cadastrar') {
            $nome = trim(isset($_POST['nome']) ? $_POST['nome'] : '');
            $email = trim(isset($_POST['email']) ? $_POST['email'] : '');
            $senha = trim(isset($_POST['senha']) ? $_POST['senha'] : '');
            $tipo = trim(isset($_POST['tipo']) ? $_POST['tipo'] : 'Aluno');
            $xp_total = (int)(isset($_POST['xp_total']) ? $_POST['xp_total'] : 0);
            $materias = trim(isset($_POST['materias_leciona']) ? $_POST['materias_leciona'] : '');

            $validacao = $this->validar_login($email, $senha);

            if ($validacao['status'] === 'erro') { // valida caso de erro
                $mensagemFeedback = array('tipo' => 'erro', 'texto' => "Falha no cadastro: " . $validacao['mensagem']);
            } else {
                try {
                    // passa o tipo de usuário para minúsculo para facilitar a validação
                    $tipoLower = strtolower($tipo);
                    // salva as informações de aluno
                    if ($tipoLower === 'aluno') {
                        $usuario = new Aluno(null, $nome, $email, $xp_total);
                    } 
                    // salva as informações de instrutor
                    elseif ($tipoLower === 'instrutor') {
                        $listaMaterias = !empty($materias) ? array_map('trim', explode(',', $materias)) : array();
                        $usuario = new Instrutor(null, $nome, $email, $listaMaterias);
                    } 
                    // salva as informações de usuário sem tipo
                    else {
                        $usuario = new Usuario(null, $nome, $email, $tipo);
                    }

                    // Encapsulamento da senha
                    $usuario->definirSenha($senha);

                    // Salva no banco SQL
                    $sucesso = $usuario->salvar($pdo);

                    if ($sucesso && !empty($usuario->id)) {
                        $usuarioCriado = $usuario;
                        $mensagemFeedback = array(
                            'tipo' => 'sucesso',
                            'texto' => "Usuário '{$usuario->nome}' cadastrado com sucesso! ID gerado no banco SQL: {$usuario->id}"
                        );
                    } else {
                        $mensagemFeedback = array('tipo' => 'erro', 'texto' => "Não foi possível salvar o usuário no banco de dados.");
                    }
                } catch (Exception $e) {
                    $mensagemFeedback = array('tipo' => 'erro', 'texto' => "Erro ao salvar no banco: " . $e->getMessage());
                }
            }
        }

        // Executa demonstração automática do Teste 1 para exibição na tela
        $resultadoTeste1 = $this->executarTeste1Demonstracao();

        // Calcula o URL base das views para que os hrefs e actions funcionem
        $baseUrl = $this->calcularBaseUrl();

        // Carrega a View
        require __DIR__ . '/views/novoUsuario.php';
    }
}

?>
