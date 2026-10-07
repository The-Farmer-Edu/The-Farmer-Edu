<?php

    class Usuario {
        public int $id;
        public string $nome;
        public string $email;
        public string $tipo;

        private string $senha_hash;

        public function definirSenha(string $senha): void{
            $this->senha_hash = password_hash($senha, PASSWORD_BCRYPT);
        }

        public function verificarSenha(string $senha_digitada): bool {
            return password_verify($senha_digitada, $this->senha_hash);
        }

        public function saudacao(): string{
            return "Olá, {$this->nome}!";
        }

        public function __construct(string $nome, string $email, string $tipo, string $senha = ""){
            $this->nome = $nome;
            $this->email = $email;
            $this->tipo = $tipo;
            if(!empty($senha)){
                $this->definirSenha($senha);
            }
            $this->salvarUsuario(iniciarPDO());
        }
        
        public function salvarUsuario(PDO $pdo): void {
            $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario) VALUES (?, ?, ?, ?)");
            $stmt->execute([$this->nome, $this->email, $this->senha_hash, $this->tipo]);
            $this->id = (int) $pdo->lastInsertId();
        }

        public static function buscarEmail(PDO $pdo, string $email): ?self{
            $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
            $stmt->execute([$email]);
            $dadosUsuario = $stmt->fetch();
            return $dadosUsuario ?? Usuario::formatarDados($dadosUsuario);
        }

        public static function formatarDados(array $dadosUsuario): Usuario{
            $tipo_usuario = $dadosUsuario['tipo_usuario'];
            if ($tipo_usuario === 'instrutor'){
                $usuario = new Instrutor($dadosUsuario['nome'], $dadosUsuario['email'], "");
                $usuario->senha_hash = $dadosUsuario['senha_hash'];
                return $usuario;
            }
        }
    }

    class Instrutor extends Usuario{
        public array $materias_lecionadas;
        public array $id_materias;

        public function __construct(string $nome, string $email, string $senha, array $materias_lecionadas){
            parent::__construct($nome, $email, 'instrutor', $senha);
            $this->materias_lecionadas = $materias_lecionadas;

            $this->salvarInstrutor(iniciarPDO());
            $this->gerenciarMaterias()
        }

        public function salvarInstrutor(PDO $pdo): void {
            $stmt = $pdo->prepare("INSERT INTO instrutores (id_usuario) VALUES (?)");
            $stmt->execute([$this->id]);
        }

        public function gerenciarMaterias(PDO $pdo, array $materias_lecionadas): void {
            foreach($materias_lecionadas as $materia) {
                $materiaDb = $this->buscarMaterias($pdo, $materia);
                if ($materiaDb === null){
                    $this->salvarMaterias($pdo, $materias)
                else{
                    $this->id_materias[] = (int)$materia['id_materia'];
                }
                }
            }
        }
        
        public function buscarMaterias(PDO $pdo, string $materia): void {
            $stmt = $pdo->prepare("SELECT * FROM materias WHERE nome_materia = (?)")
            $stmt->execute([$nome]);
            $dadosMateria = $stmt->fetch();
            if ($dadosMateria){
                $dadosMateria
            }
            else{
                null
            }
        }

        public function salvarMaterias(PDO $pdo): void {
            $stmt = $pdo->prepare("INSERT INTO materias (id_materia) VALUES (?)");
            $stmt->execute([$nome]);
            $this->id_materias = (int)$pdo->LastInsertId();
        }

    }

    class Aluno extends Usuario{
        public int $xp_total;

        public function __construct(string $nome, string $email, string $senha, int $xp_total = 0){
            parent::__construct($nome,  $email, 'Aluno',  $senha);
            $this->xp_total = $xp_total;
        }
    }

?>