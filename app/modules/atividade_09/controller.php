<?php
    require_once "model/Atividade2_php.php";

    $bd = new BancoDeDados();

    function validar_login(string $email, string $senha, array $usuarios): array { // é substituido pela nova função com novos parametros?
        $usuarioEncontrado = null;
        $erros = [];

        foreach($usuarios as $usuario)
        {
            if ($usuario->email === $email && $usuario->verificarSenha($senha)) {
                $usuarioEncontrado = $usuario;
                break;
            }
        }

        if ($usuarioEncontrado === null){
            $erros[] = 'E-mail ou senha inválidos.';
        }

        return [
            'status' => empty($erros) ? 'sucesso' : 'erro',
            'mensagem' => empty($erros) ? $usuarioEncontrado->saudacao() : implode(' ', $erros)
        ];
    }

    $bd->adicionarUsuario(new Instrutor("João Silva", "joao@escola.br", "SenhaForte123!", ["Matemática", "Física"]));
    $bd->adicionarUsuario(new Aluno("Maria Eduarda", "mariaeduarda.aluna@escola.br", "Senha123", 21));

    $usuarios = $bd->getUsuarios();

    $testes = [
        ['email' => 'joao@escola.br', 'senha' => 'SenhaForte123!'],
        ['email' => 'mariaeduarda.aluna@escola.br', 'senha' => 'Senha123'],
    ];

?>