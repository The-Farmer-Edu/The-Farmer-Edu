<?php
class Usuario {
    public int $id;
    public string $nome;
    public string $email;
    public string $tipo;
    protected string $senha_hash;

    public function saudacao(): string {
        return "Olá {$this->nome}!";
    }

    public function definirSenha(string $senha): void {
        $this->senha_hash = password_hash($senha, PASSWORD_BCRYPT);
    }

    public function verificarSenha(string $senha): bool {
        return password_verify($senha, $this->senha_hash);
    }

    public function salvar(PDO $pdo): void {
        $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario) VALUES (?, ?, ?, ?)");
        $stmt->execute([$this->nome, $this->email, $this->senha_hash, $this->tipo]);
        $this->id = (int) $pdo->lastIn sertId();

    }

    public static function buscarPorEmail(PDO $pdo, string $email): ?self {
        $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        $dados = $stmt->fetch();
        return $dados ? self::formatarDados($dados) : null;
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

class UsuarioController {
    public function exibirPerfil() {
        $user = new Usuario();
        $user->nome = "Hugo";

        $professor = new Instrutor();
        $professor->id = 1;
        $professor->nome = "Ronaldo";
        $professor->email = "instrutoRonaldo@gmail.com";
        $professor->tipo = "Instrutor";
        $professor->materias_leciona = ["PHP", "Python"];

        $aluno = new Aluno();
        $aluno->id = 2;
        $aluno->nome = "Cleiton";
        $aluno->email = "alunoCleiton@gmail.com";
        $aluno->tipo = "Aluno";
        $aluno->xp_total = 150;

        $resultado = validar_login("usuaraio@gmail.com", "senha123!");

        if ($resultado['status'] === 'sucesso') {
            $aluno->definirSenha("senha123!");
        }

        require_once __DIR__ . '/views/buscarUsuario.php'; 
    }
    
}