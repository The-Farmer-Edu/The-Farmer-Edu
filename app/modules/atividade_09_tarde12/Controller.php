<?php
/**
 * Atividade 09 - Tarde 12
 * 
 * Controller: UsuarioController
 * Adaptado do ControllerUsuario do repositório AutoAvaliação.
 * 
 * Responsabilidades no padrão MVC:
 * 1. Intermediar requisições e ações entre as Views e o Modelo Usuario com persistência SQL.
 * 2. Controlar o fluxo de cadastro e inserção via $usuario->salvar($pdo).
 * 3. Controlar o fluxo de busca via Usuario::buscarPorEmail($pdo, $email).
 * 4. Executar os testes obrigatórios e disponibilizar os resultados para as Views.
 */

require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/Database.php';

class UsuarioController {
    private PDO $pdo;

    public function __construct(?PDO $pdo = null) {
        $this->pdo = $pdo ?? Database::obterConexao();
    }

    /**
     * Calcula o URL base absoluto (começando na raiz do servidor) que aponta
     * para a pasta /views/ do módulo, independente de como a requisição chegou.
     * 
     * Exemplo de retorno: /The-Farmer-Edu/app/modules/atividade_09_tarde12/views
     * 
     * Isso permite que os <a href> e <form action> nas views sempre funcionem
     * corretamente, tanto quando acessados diretamente quanto via index.php.
     */
    private function calcularBaseUrl(): string {
        // Caminho físico absoluto da pasta views no sistema de arquivos
        $viewsDir = realpath(__DIR__ . '/views');

        // Raiz do servidor web (document root do XAMPP)
        $docRoot = realpath($_SERVER['DOCUMENT_ROOT'] ?? '');

        if ($docRoot && $viewsDir && strpos($viewsDir, $docRoot) === 0) {
            // Gera URL relativa à raiz do servidor, usando barras para URL
            return str_replace('\\', '/', substr($viewsDir, strlen($docRoot)));
        }

        // Fallback: calcula a partir do script atual que foi chamado
        $scriptDir = dirname($_SERVER['SCRIPT_NAME'] ?? '');
        // Se o script está dentro de /views/, o baseUrl é o próprio diretório
        if (strpos($scriptDir, 'views') !== false) {
            return $scriptDir;
        }
        // Se o script está no módulo (index.php), o baseUrl aponta para views/
        return rtrim($scriptDir, '/') . '/views';
    }

    /**
     * Validação sintática de login (mantida do repositório AutoAvaliação)
     */
    public function validar_login(string $email, string $senha): array {
        $erros = [];

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

    /**
     * Exibe a view de criação de novo usuário e processa o cadastro via $usuario->salvar($pdo)
     */
    public function showNovoUsuario(): void {
        $pdo = $this->pdo;
        $mensagemFeedback = null;
        $usuarioCriado = null;
        $resultadoTeste1 = null;

        // Processa formulário de cadastro caso enviado
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['acao']) && $_POST['acao'] === 'cadastrar') {
            $nome = trim($_POST['nome'] ?? '');
            $email = trim($_POST['email'] ?? '');
            $senha = trim($_POST['senha'] ?? '');
            $tipo = trim($_POST['tipo'] ?? 'Aluno');
            $xp_total = (int)($_POST['xp_total'] ?? 0);
            $materias = trim($_POST['materias_leciona'] ?? '');

            $validacao = $this->validar_login($email, $senha);

            if ($validacao['status'] === 'erro') {
                $mensagemFeedback = ['tipo' => 'erro', 'texto' => "Falha no cadastro: " . $validacao['mensagem']];
            } else {
                try {
                    if ($tipo === 'Aluno') {
                        $usuario = new Aluno(null, $nome, $email, $xp_total);
                    } elseif ($tipo === 'Instrutor') {
                        $listaMaterias = !empty($materias) ? array_map('trim', explode(',', $materias)) : [];
                        $usuario = new Instrutor(null, $nome, $email, $listaMaterias);
                    } else {
                        $usuario = new Usuario(null, $nome, $email, $tipo);
                    }

                    // Encapsulamento da senha
                    $usuario->definirSenha($senha);

                    // REQUISITO OBRIGATÓRIO: Salvar no banco SQL
                    $sucesso = $usuario->salvar($pdo);

                    if ($sucesso && !empty($usuario->id)) {
                        $usuarioCriado = $usuario;
                        $mensagemFeedback = [
                            'tipo' => 'sucesso',
                            'texto' => "Usuário '{$usuario->nome}' cadastrado com sucesso! ID gerado no banco SQL: {$usuario->id}"
                        ];
                    } else {
                        $mensagemFeedback = ['tipo' => 'erro', 'texto' => "Não foi possível salvar o usuário no banco de dados."];
                    }
                } catch (Throwable $e) {
                    $mensagemFeedback = ['tipo' => 'erro', 'texto' => "Erro ao salvar no banco: " . $e->getMessage()];
                }
            }
        }

        // Executa demonstração automática do Teste 1 para exibição na tela
        $resultadoTeste1 = $this->executarTeste1Demonstracao();

        // Calcula o URL base das views para que os hrefs e actions funcionem
        // corretamente independente de por onde a requisição entrou (index.php ou direto)
        $baseUrl = $this->calcularBaseUrl();

        // Carrega a View
        require __DIR__ . '/views/novoUsuario.php';
    }

    /**
     * Exibe a view de busca por e-mail e processa a consulta via Usuario::buscarPorEmail($pdo, $email)
     */
    public function showBuscarUsuario(): void {
        $pdo = $this->pdo;
        $usuarioBuscado = null;
        $emailPesquisado = trim($_GET['email'] ?? ($_POST['email'] ?? ''));
        $senhaParaVerificar = trim($_GET['senha_teste'] ?? ($_POST['senha_teste'] ?? ''));
        $senhaVerificada = null;
        $mensagemBusca = null;

        if (!empty($emailPesquisado)) {
            // REQUISITO OBRIGATÓRIO: Busca estática por e-mail
            $usuarioBuscado = Usuario::buscarPorEmail($pdo, $emailPesquisado);

            if ($usuarioBuscado !== null) {
                if (!empty($senhaParaVerificar)) {
                    $senhaVerificada = $usuarioBuscado->verificarSenha($senhaParaVerificar);
                }
                $mensagemBusca = [
                    'tipo' => 'sucesso',
                    'texto' => "Usuário encontrado com sucesso na tabela 'usuarios'!"
                ];
            } else {
                $mensagemBusca = [
                    'tipo' => 'aviso',
                    'texto' => "Nenhum usuário encontrado com o e-mail '{$emailPesquisado}'."
                ];
            }
        }

        // Executa demonstração automática do Teste 2 para exibição na tela
        $resultadoTeste2 = $this->executarTeste2Demonstracao();

        // Calcula o URL base das views para que os hrefs e actions funcionem
        $baseUrl = $this->calcularBaseUrl();

        // Carrega a View
        require __DIR__ . '/views/buscarUsuario.php';
    }

    /**
     * Executa o Teste Obrigatório 1: Salvar novo usuário e confirmar que $id foi preenchido.
     */
    public function executarTeste1Demonstracao(): array {
        $timestamp = time() . '_' . rand(10, 99);
        $email = "aluno.teste{$timestamp}@fazenda.edu.br";
        $senha = "SenhaSegura#{$timestamp}";

        $usuario = new Aluno();
        $usuario->nome = "Aluno Teste Demo {$timestamp}";
        $usuario->email = $email;
        $usuario->xp_total = 100;
        $usuario->definirSenha($senha);

        $idAntes = $usuario->id;
        $sucesso = $usuario->salvar($this->pdo);
        $idDepois = $usuario->id;

        $passou = ($sucesso && !empty($idDepois) && $idDepois > 0);

        return [
            'titulo' => 'Teste Obrigatório 1: $usuario->salvar($pdo) e preenchimento de $id',
            'passou' => $passou,
            'id_antes' => $idAntes,
            'id_depois' => $idDepois,
            'email' => $email,
            'objeto' => $usuario,
            'mensagem' => $passou 
                ? "SUCESSO: \$usuario->salvar(\$pdo) executou e \$id foi atualizado para {$idDepois}!" 
                : "FALHA: \$id não foi preenchido corretamente."
        ];
    }

    /**
     * Executa o Teste Obrigatório 2: Buscar mesmo usuário com buscarPorEmail() e conferir se dados batem.
     */
    public function executarTeste2Demonstracao(): array {
        $timestamp = time() . '_' . rand(100, 999);
        $email = "instrutor.teste{$timestamp}@fazenda.edu.br";
        $senha = "InstrutorPass#{$timestamp}";

        // 1. Cadastra
        $original = new Instrutor();
        $original->nome = "Profa. Helena Demo {$timestamp}";
        $original->email = $email;
        $original->materias_leciona = ["PHP SQL", "MVC POO"];
        $original->definirSenha($senha);
        $original->salvar($this->pdo);

        // 2. Busca estática
        $buscado = Usuario::buscarPorEmail($this->pdo, $email);

        $encontrado = ($buscado !== null);
        $idBate = $encontrado && ($buscado->id === $original->id);
        $nomeBate = $encontrado && ($buscado->nome === $original->nome);
        $emailBate = $encontrado && ($buscado->email === $original->email);
        $senhaBate = $encontrado && $buscado->verificarSenha($senha);
        $todosBatem = $encontrado && $idBate && $nomeBate && $emailBate && $senhaBate;

        return [
            'titulo' => 'Teste Obrigatório 2: Usuario::buscarPorEmail($pdo, $email) e conferência de dados',
            'passou' => $todosBatem,
            'email_pesquisado' => $email,
            'original' => $original,
            'buscado' => $buscado,
            'id_bate' => $idBate,
            'nome_bate' => $nomeBate,
            'email_bate' => $emailBate,
            'senha_bate' => $senhaBate,
            'mensagem' => $todosBatem 
                ? "SUCESSO: Usuário recuperado por e-mail e TODOS os dados batem perfeitamente!" 
                : "FALHA: Os dados não conferem ou usuário não foi encontrado."
        ];
    }
}
