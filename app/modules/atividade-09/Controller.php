<?php
    require __DIR__ . '/Model.php';
    require_once __DIR__ . '/../../core/database.php';
    require_once __DIR__ . '/views/novoUsuario.php';
    
    function validar_login(string $email, string $senha): array {
        $erros = [];
        if (empty($email) || empty($senha)) {
            $erros[] = "E-mail e senha são obrigatórios";
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $erros[] = "E-mail inválido";
        }
        if (strlen($senha) < 8) {
            $erros[] = "Senha muito curta";
        }
        if (!preg_match('/[\W_]/', $senha)) {
            $erros[] = "A senha deve conter pelo menos um caracter especial";
        }
        if (!empty($erros)) {
            return ['status' => 'erro', 'mensagem' => implode(', ', $erros)];
        } else {
            return ['status' => 'sucesso', 'mensagem' => 'Login e senha válidos'];
        }
    }

    class UsuarioController {
        public function exibirPerfil() {
            $aluno = new Aluno("Cleiton", "alunoCleiton@gmail.com", "Aluno", "senha123!");
            $aluno->id = 1;
            $aluno->xp_total = 150;

            $resultado = validar_login("usuaraio@gmail.com", "senha123!");

            if ($resultado['status'] === 'sucesso') {
                $aluno->definirSenha("senha123!");
            }

            require_once __DIR__ . '/views/buscarUsuario.php'; 
        }
        
    }

    $controller = new UsuarioController();
    $controller->exibirPerfil();

    
    
    $aluno = new Aluno("Cleiton", "alunoCleiton@gmail.com", "Aluno", "senha123!");
    $aluno->id = 1;
    $aluno->xp_total = 150;
    
    $pdo = iniciarPDO();

    try {
        $aluno->salvar($pdo);
        echo "Aluno salvo com sucesso!";
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            echo "Erro: O e-mail '{$aluno->email}' já está cadastrado no sistema.";
        } else {
            echo "Erro no banco de dados: " . $e->getMessage();
        }
    }

    require_once __DIR__ . '/views/novoUsuario.php';
