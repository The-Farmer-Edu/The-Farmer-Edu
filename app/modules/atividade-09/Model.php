<?php
class Usuario {
    public int $id;
    public string $nome;
    public string $email;
    public string $tipo;
    private string $senha_hash;

    public function saudacao(): string {
        return "Olá {$this->nome}!";
    }

    public function definirSenha(string $senha): void {
        $this->senha_hash = password_hash($senha, PASSWORD_BCRYPT);
    }

    public function verificarSenha(string $senha): bool {
        return password_verify($senha, $this->senha_hash);
    }
}

class Instrutor extends Usuario {
    public array $materias_leciona = [];
    public function saudacao(): string {
        return "Olá, Professor(a) {$this->nome}!";
    }
}

class Aluno extends Usuario {
    public int $xp_total = 0;
    public function saudacao(): string {
        return "Olá, Aluno(a) {$this->nome}!";
    }
}

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