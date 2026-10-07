<?php

class Usuario{
    public int $id;
    public string $nome;
    public string $email;
    public string $tipo;
    private string $senha_hash;

    public function __construct(int $id, string $nome, string $email, string $tipo){

        $this->id = $id;
        $this->nome = $nome;
        $this->email = $email;
        $this->tipo = $tipo;
    }

    public function boasvindas(): string{
        return "Olá, ($this->nome)!";
    }   

    public static function buscarPorEmail(array $usuarios, string $email): ?self {
        foreach ($usuarios as $usuario){
            if ($usuario instanceof self && strtolower($usuario->email) === strtolower($email)) {
                return $usuario;
            }
        }
        
        return null;
    }

    public function definirSenha(string $senha): void {
        $this->senha_hash = password_hash($senha, PASSWORD_DEFAULT);
    }

    public function verificarSenha(string $senha): bool {
        return password_verify($senha, $this->senha_hash);
    }
}   

class Aluno extends Usuario {
    public int $xp_total = 0;

    public function __construct(int $id, string $nome, string $email,int $xp_total = 0) {
        parent::__construct($id, $nome, $email, "aluno");
        $this->xp_total = $xp_total;
    }
}

class Instrutor extends Usuario {
    public array $especialidade = [];

    public function __construct(int $id, string $nome, string $email, array $especialidade = []){
        parent::__construct($id, $nome, $email, "instrutor");
        $this->especialidade = $especialidade;
    }

    public function tipo_formato(): string {
        return "instrutor - {$this->especialidade}";
    }

    public function salvar(PDO $pdo): bool {
        $sql = "INSERT INTO usuario(nome, email, tipo, senha_hash) VALUES (:nome,:email,:tipo,:senha_hash)";
        $stmt = $pdo->prepare ($sql);
        $sucesso = $stmt->execute([
            ':nome'=>$this->nome,
            ':email'=>$this->email,
            ':tipo'=>$this->tipo,
            ':senha_hash'=>$this->senha_hash
        ]);
        return $sucesso;
    }
}

?>