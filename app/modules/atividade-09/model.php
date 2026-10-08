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

// ------------------------------------------------------------------------
class Professor extends Usuario{
    public array $materias_leciona = [];

    public function __construct(int $id, string $nome, string $email, array $materias_leciona) {
    parent::__construct($id, $nome, $email, "professor");

    $this->materias_leciona = $materias_leciona;
}

    public function salvarprof(PDO $pdo): void{
        $stmt = $pdo->prepare("SELECT id_usuario FROM instrutores WHERE id_usuario = ?");// Valida se o instrutor ja existe
        $stmt->execute([$this->id]);

        if ($stmt->fetch() === false) {// Só cadastra se nao existe
            $stmt = $pdo->prepare("INSERT INTO instrutores (id_usuario) VALUES (?)");
            $stmt->execute([$this->id]);
        }
    }

    public function salvarDados(PDO $pdo): void{
        $this->salvarprof($pdo);// Salva o professor
        $this->gerenciaMaterias($pdo,$this->materias_leciona);//encontra matérias
        $this->vincularMaterias($pdo);// Liga matérias no professor
    }
    // ------------------------------------------------------------------------

    public function salvarMateria(PDO $pdo, string $materia): void{
        $stmt = $pdo->prepare("INSERT INTO materias (nome_materia) VALUES (?)");
        $stmt->execute([$materia]);
        $this->id_materias[] = (int)$pdo->lastInsertId();
    }

    public function buscarMateria(PDO $pdo, string $materia): ?array{
        $stmt = $pdo->prepare('SELECT * FROM materias WHERE nome_materia = ?');
        $stmt->execute([$materia]);
        $infoMateria = $stmt->fetch(PDO::FETCH_ASSOC);
        return $infoMateria ?: null;
}

    public function gerenciaMaterias(PDO $pdo, array $materias_leciona): void{
        foreach ($materias_leciona as $materia) {
            $materiaExistente = $this->buscarMateria($pdo, $materia);
            if ($materiaExistente === null) {
                $this->salvarMateria($pdo, $materia);
            } else {
                $this->id_materias[] = (int)$materiaExistente['id_materia'];
            }
        }
    }

    public function vincularMaterias(PDO $pdo): void{
        foreach ($this->id_materias as $idMateria) {
            $sql = "INSERT INTO materias_instrutores (id_materia, id_instrutor) VALUES (?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$idMateria,$this->id]);
        }
    }

}
//     geren -- ver se existe
//     buscar -- busca
//     nova -- cria
//     materias as inst --  liga ao prof

class Aluno extends Usuario{
    public int $xp_total = 0;

    public function __construct(int $id, string $nome, string $email, int $xp_total = 0){
        parent::__construct($id, $nome, $email, 'aluno');
        $this->xp_total = $xp_total;
    }

}

?>