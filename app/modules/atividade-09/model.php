<?php
class Usuario{
    public int $id;
    public string $nome;
    public string $email;
    private string $senha_hash;
    public string $tipo; // docente e aluno

    public function __construct(int $id, string $nome, string $email, string $tipo){
        $this->id = $id;
        $this->nome = $nome;
        $this->email = $email;
        $this->tipo = $tipo;
    }

    public function definirsenha_hash(string $senha_hash): void{
        $this->senha_hash = password_hash($senha_hash, PASSWORD_BCRYPT);   
    }
    public function verificarsenha_hash(string $senha_hash): bool{
        return password_verify($senha_hash, $this->senha_hash);
    }

    public function salvar(PDO $pdo):void{
        $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario) VALUES (?, ?, ?, ?)");
        $stmt-> execute([$this->nome, $this->email, $this->senha_hash, $this->tipo]);
        $this->id = (int) $pdo->lastInsertId();
    }
    public static function buscarEmail(PDO $pdo, string $email): ?self{
        $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        $dados = $stmt->fetch();
        return $dados ? self::formatarDados($dados) : null;
    }
}

class Professor extends Usuario{
    public array $materias_leciona = [];

    public function __construct(int $id, string $nome, string $email, array $materias_leciona){
       parent::__construct($id, $nome, $email, "professor");
       $this->materias_leciona = $materias_leciona;
    }
}


class Aluno extends Usuario{
    public int $xp_total = 0;

    public function __construct(int $id, string $nome, string $email, int $xp_total = 0){
        parent::__construct($id, $nome, $email, 'aluno');
        $this->xp_total = $xp_total;
    }

}

?>