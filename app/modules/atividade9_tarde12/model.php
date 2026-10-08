<?php
class Usuario {
    public int $id;
    public string $nome;
    public string $email;
    public string $tipo;
    private ?string $senha_hash = null;

    /** Construtor da classe Usuario. */
    public function __construct($id = null, string $nome = '', string $email = '', string $tipo = 'Usuário') {
        $this->id = ($id !== null) ? (int)$id : null;
        $this->nome = $nome;
        $this->email = $email;
        $this->tipo = $tipo;
    }

    public function saudacao():string {
        return "Olá, {$this->nome}!";
    }

    /** Recebe a senha em texto e gera o hash */
    public function definirSenha(string $senha):void {
        $this->senha_hash = password_hash($senha, PASSWORD_BCRYPT);
    }

    /** Compara a senha digitada com o hash protegido */
    public function verificarSenha(string $senha):bool {
        if (empty($this->senha_hash)) {
            return false;
        }
        return password_verify($senha, $this->senha_hash);
    }




    public function salvar(PDO $pdo):bool {
        $tipoDb = (strtolower($this->tipo) === 'instrutor') ? 'instrutor' : 'aluno';
        $emTransacao = false;

        try {
            $emTransacao = $pdo->beginTransaction();
        } catch (Exception $e) {
            $emTransacao = false;
        }

        try {
            // 1. Inserção na tabela principal 'usuarios' definida no schema.sql
            $sqlUsuarios = "INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario) VALUES (:nome, :email, :senha_hash, :tipo_usuario)";
            $stmtUsuarios = $pdo->prepare($sqlUsuarios);
            $sucesso = $stmtUsuarios->execute(array(
                ':nome'         => $this->nome,
                ':email'        => $this->email,
                ':senha_hash'   => (string)$this->obterHashSenha(),
                ':tipo_usuario' => $tipoDb
            ));

            if (!$sucesso) {
                if ($emTransacao && $pdo->inTransaction()) {
                    $pdo->rollBack();
                }
                return false;
            }
            /** parece errado, tá redundante */
            // $idGerado = (int)$pdo->lastInsertId();
            // $this->id = $idGerado;
            // $this->id_usuario = $idGerado;

            // // 2. Tabela filha 'alunos' (conforme /database/schema.sql)
            // if ($this instanceof Aluno) {
            //     $matricula = !empty($this->matricula)
            //         ? $this->matricula
            //         : ('MAT-' . str_pad($idGerado, 5, '0', STR_PAD_LEFT));
            //     $this->matricula = $matricula;
            //     $xp = isset($this->xp_total) ? (int)$this->xp_total : 0;

            //     $stmtAluno = $pdo->prepare("INSERT INTO alunos (id_usuario, matricula, xp_total) VALUES (:id_usuario, :matricula, :xp_total)");
            //     $stmtAluno->execute(array(
            //         ':id_usuario' => $idGerado,
            //         ':matricula'  => $matricula,
            //         ':xp_total'   => $xp
            //     ));
            // }
            // // 3. Tabela filha 'instrutores' (conforme /database/schema.sql)
            // elseif ($this instanceof Instrutor) {
            //     $stmtInstrutor = $pdo->prepare("INSERT INTO instrutores (id_usuario) VALUES (:id_usuario)");
            //     $stmtInstrutor->execute(array(
            //         ':id_usuario' => $idGerado
            //     ));

            //     if (!empty($this->materias_leciona) && is_array($this->materias_leciona)) {
            //         foreach ($this->materias_leciona as $nomeMateria) {
            //             $nomeMateria = trim($nomeMateria);
            //             if ($nomeMateria === '') {
            //                 continue;
            //             }

            //             $stmtBuscaMat = $pdo->prepare("SELECT id_materia FROM materias WHERE nome_materia = :nome LIMIT 1");
            //             $stmtBuscaMat->execute(array(':nome' => $nomeMateria));
            //             $idMateria = $stmtBuscaMat->fetchColumn();

            //             if (!$idMateria) {
            //                 $stmtInsMat = $pdo->prepare("INSERT INTO materias (nome_materia) VALUES (:nome)");
            //                 $stmtInsMat->execute(array(':nome' => $nomeMateria));
            //                 $idMateria = (int)$pdo->lastInsertId();
            //             }

            //             if ($idMateria) {
            //                 $stmtRel = $pdo->prepare("INSERT INTO materias_instrutores (id_materia, id_instrutor) VALUES (:id_materia, :id_instrutor)");
            //                 $stmtRel->execute(array(
            //                     ':id_materia'   => $idMateria,
            //                     ':id_instrutor' => $idGerado
            //                 ));
            //             }
            //         }
            //     }
            // }

            if ($emTransacao && $pdo->inTransaction()) {
                $pdo->commit();
            }

            return true;
        }

}

class Aluno extends Usuario {
    public int $xp_total = 0;

    /** Construtor da classe Aluno. */
    public function __construct($id = null, $nome = '', $email = '', $xp_total = 0, $matricula = '') {
        parent::__construct($id, $nome, $email, 'aluno');
        $this->xp_total = (int)$xp_total;
    }
}

class Instrutor extends Usuario {
    public array $materias_leciona = [];

    /** Construtor da classe Instrutor. */
    public function __construct($id = null, $nome = '', $email = '', $materias_leciona = array()) {
        parent::__construct($id, $nome, $email, 'instrutor');
        $this->materias_leciona = is_array($materias_leciona) ? $materias_leciona : array();
    }

    public function criarMateria(PDO $pdo, string $materia):bool{
        $sql = "INSERT INTO nome_materia VALUES (:materia_nome)";
        $stmt = $pdo -> prepare($sql);
        return $stmt -> execute(['materia' => $materia]);
    }

    public function buscarMateria(PDO $pdo, string $materia):array{
        $sql = "SELECT nome_materia, id_materia FROM materias WHERE nome_materia = :materia_nome";
        $stmt = $pdo -> prepare($sql);
        $stmt -> execute(['materia_nome' => $materia]);
        return $stmt -> fetchAll();
    }

    public function linkMateriaProfessor(PDO $pdo, string $materia):void{
        $sql = "INSERT INTO materias_instrutores (id_materia, id_instrutor) VALUES (:id_materia, :id_instrutor)";
        $stmt = $pdo -> prepare($sql);
        $stmt -> execute(['id_materia' => $materia, 'id_instrutor' => $this->id]);
    }
}

    public static function buscarPorEmail(PDO $pdo, $email) {
        $dados = null;

        try {
            // Busca referenciando a estrutura oficial de /database/schema.sql
            $sql = "SELECT u.id_usuario, u.nome, u.email, u.senha_hash, u.tipo_usuario,
                           a.matricula, a.xp_total
                    FROM usuarios u
                    LEFT JOIN alunos a ON a.id_usuario = u.id_usuario
                    WHERE u.email = :email
                    LIMIT 1";
            $stmt = $pdo->prepare($sql);
            $stmt->execute(array(':email' => (string)$email));
            $dados = $stmt->fetch(PDO::FETCH_ASSOC);

            // Se não encontrou, tenta fallback na estrutura de coluna única
            if (!$dados) {
                $sqlLegado = "SELECT * FROM usuarios WHERE email = :email LIMIT 1";
                $stmtLegado = $pdo->prepare($sqlLegado);
                $stmtLegado->execute(array(':email' => (string)$email));
                $dadosLegado = $stmtLegado->fetch(PDO::FETCH_ASSOC);
                if ($dadosLegado) {
                    $dados = $dadosLegado;
                }
            }
        } catch (Exception $e) {
            // Fallback para tabelas de desenvolvimento
            try {
                $sqlLegado = "SELECT * FROM usuarios WHERE email = :email LIMIT 1";
                $stmtLegado = $pdo->prepare($sqlLegado);
                $stmtLegado->execute(array(':email' => (string)$email));
                $dados = $stmtLegado->fetch(PDO::FETCH_ASSOC);
            } catch (Exception $e2) {
                return null;
            }
        }

        if (!$dados) {
            return null;
        }

        $id = isset($dados['id_usuario']) ? (int)$dados['id_usuario'] : (isset($dados['id']) ? (int)$dados['id'] : null);
        $nome = isset($dados['nome']) ? (string)$dados['nome'] : '';
        $email = isset($dados['email']) ? (string)$dados['email'] : '';
        $tipo = isset($dados['tipo_usuario']) ? $dados['tipo_usuario'] : (isset($dados['tipo']) ? $dados['tipo'] : 'aluno');
        $tipoNorm = strtolower((string)$tipo);

        if ($tipoNorm === 'aluno') {
            $xpTotal = isset($dados['xp_total']) ? (int)$dados['xp_total'] : 0;
            $matricula = isset($dados['matricula']) ? (string)$dados['matricula'] : '';
            $usuario = new Aluno($id, $nome, $email, $xpTotal, $matricula);
        } elseif ($tipoNorm === 'instrutor') {
            $materias = array();
            if ($id) {
                try {
                    $stmtMat = $pdo->prepare("SELECT m.nome_materia 
                                              FROM materias_instrutores mi 
                                              JOIN materias m ON m.id_materia = mi.id_materia 
                                              WHERE mi.id_instrutor = :id_usuario");
                    $stmtMat->execute(array(':id_usuario' => $id));
                    $materias = $stmtMat->fetchAll(PDO::FETCH_COLUMN);
                } catch (Exception $eMat) {
                    $materias = array();
                }
            }
            if (empty($materias) && !empty($dados['materias_leciona'])) {
                $materias = is_array($dados['materias_leciona'])
                    ? $dados['materias_leciona']
                    : array_map('trim', explode(',', $dados['materias_leciona']));
            }
            $usuario = new Instrutor($id, $nome, $email, $materias);
        } else {
            $usuario = new Usuario($id, $nome, $email, $tipo);
        }

        $usuario->id = $id;
        $usuario->id_usuario = $id;

        if (!empty($dados['senha_hash'])) {
            $usuario->definirHashDireto($dados['senha_hash']);
        }

        return $usuario;
    }
}
?>