<?php
    require_once "model.php";

    function validar_login(PDO $pdo, string $email, string $senha,): array {
        $usuario = Usuario::buscarUsuario($pdo, $email);

        if ($usuario === null || !$usuario->verificarSenha($senha)) {
            $erros[] = 'E-mail ou senha inválidos.';
        }
        return [
            'status' => empty($erros) ? 'sucesso' : 'erro',
            'mensagem' => empty($erros) ? $usuarioEncontrado->saudacao() : implode(' ', $erros)
        ];
    }

    $pdo = iniciarPDO();

    $testes = [
        ['email' => 'joao@escola.br', 'senha' => 'SenhaForte123!'],
        ['email' => 'mariaeduarda.aluna@escola.br', 'senha' => 'Senha123'],
    ];

    foreach ($testes as $teste) {
        $resultado = validar_login($pdo, $email, $senha);
        print_r($resultado['mensagem']);
    } 
?>