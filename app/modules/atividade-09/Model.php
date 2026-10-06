<?php

class Usuario {
    public int $id;
    public string $nome;
    public string $email;
    public string $tipo;
    private string $senha_hash;


    public function saudacao(): string {
        return "Olá, {$this->nome}"; 
    }

    public function __construct(int $id, string $nome, string $email, string $tipo) {
        $this->id = $id;
        $this->nome = $nome;
        $this->email = $email;
        $this->tipo = $tipo;
    }

    public function definirSenha(string $senha): void {
        $this->senha_hash = password_hash ($senha, PASSWORD_BCRYPT);
    }


    public function verificarSenha(string $senha): bool {
        return password_verify($senha, $this->senha_hash);
    }

    public function salvar(PDO $pdo): void {
    $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario) VALUES (?, ?, ?, ?)");
    $stmt->execute([$this->nome, $this->email, $this->senha_hash, $this->tipo]);
    $this->id = (int) $pdo->lastInsertId();
    }

    public static function buscarPorEmail(PDO $pdo, string $email): ?self {
    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    $dados = $stmt->fetch();
    return $dados ?self::formatarDados($dados) : null;
    }
}

class Instrutor extends Usuario {
    public array $materias_leciona = [];
}

class Aluno extends Usuario {
    public int $xp_total = 0;

}


function validar_login(string $email, string $senha): array { 
    $erros = [];
    if (empty($email)) { 
        $erros[] = "O e-mail não pode estar vazio."; 
    } 
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { 
        $erros[] = "O e-mail é inválido."; 
    } 
    if (strlen($senha) < 8) { 
        $erros[] = "A senha deve ter no mínimo 8 caracteres."; 
    } 
    if (!preg_match('/[\W_]/', $senha)) { 
        $erros[] = "A senha deve conter pelo menos um caracter especial."; 
    } 
    if (!preg_match('/[A-Z]/', $senha)) { 
        $erros[] = "A senha deve conter pelo menos uma letra maiúscula."; 
    } 
    if (!preg_match('/[a-z]/', $senha)) { 
        $erros[] = "A senha deve conter pelo menos uma letra minúscula."; 
    }
    if (!empty($erros)) {
        return ['status' => 'erro', 'mensagem' => implode(',',$erros)];
    }
    else {
        return ['status' => 'sucesso', 'mensagem' => 'login e senha válidos'];
    }
} 