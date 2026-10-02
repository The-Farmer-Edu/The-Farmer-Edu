<?php
/**
 * Atividade 09 - Tarde 12
 * 
 * Modelo: Usuario (com persistência em banco de dados SQL via PDO)
 * Baseado no modelo POO desenvolvido no repositório AutoAvaliação.
 * 
 * Pilares implementados:
 * 1. Herança: 'Aluno' e 'Instrutor' estendem a classe base 'Usuario'.
 * 2. Encapsulamento: $senha_hash privada, com escrita via definirSenha() (BCRYPT) e verificação via verificarSenha().
 * 3. Persistência SQL (Prepared Statements):
 *    - $usuario->salvar($pdo): insere na tabela 'usuarios' e atualiza $this->id com o ID gerado ($pdo->lastInsertId()).
 *    - Usuario::buscarPorEmail($pdo, $email): método estático que busca por e-mail e retorna objeto Usuario ou null.
 */

class Usuario {
    // Propriedades herdáveis acessíveis diretamente pelas classes filhas
    public ?int $id = null;
    public string $nome = '';
    public string $email = '';
    public string $tipo = 'Usuário';

    // ENCAPSULAMENTO: A propriedade $senha_hash é privada.
    // Nenhuma classe externa ou filha pode ler ou alterar essa propriedade diretamente.
    private ?string $senha_hash = null;

    /**
     * Construtor da classe base Usuario.
     */
    public function __construct(?int $id = null, string $nome = '', string $email = '', string $tipo = 'Usuário') {
        $this->id = $id;
        $this->nome = $nome;
        $this->email = $email;
        $this->tipo = $tipo;
    }

    /**
     * Retorna a saudação padrão herdada por todos os tipos de usuários.
     */
    public function saudacao(): string {
        return "Olá, {$this->nome}!";
    }

    /**
     * ENCAPSULAMENTO - Escrita segura:
     * Recebe a senha em texto puro e gera o hash criptográfico seguro usando BCRYPT.
     * O texto original da senha é descartado da memória após o cálculo.
     */
    public function definirSenha(string $senha): void {
        $this->senha_hash = password_hash($senha, PASSWORD_BCRYPT);
    }

    /**
     * ENCAPSULAMENTO - Validação segura:
     * Compara a senha digitada com o hash protegido utilizando a função nativa password_verify().
     * Retorna booleano (true para correta, false para divergente).
     */
    public function verificarSenha(string $senha): bool {
        if (empty($this->senha_hash)) {
            return false;
        }
        return password_verify($senha, $this->senha_hash);
    }

    /**
     * Método para recuperação educacional do hash armazenado.
     */
    public function obterHashSenha(): ?string {
        return $this->senha_hash;
    }

    /**
     * Método auxiliar para restaurar o hash do banco de dados no objeto.
     */
    public function definirHashDireto(?string $hash): void {
        $this->senha_hash = $hash;
    }

    /**
     * Mantém compatibilidade com chamadas anteriores.
     */
    public function getSenhaHash(): ?string {
        return $this->obterHashSenha();
    }

    /**
     * REQUISITO OBRIGATÓRIO:
     * Insere o usuário na tabela 'usuarios' usando prepared statement,
     * e atualiza $this->id com o ID gerado pelo banco.
     *
     * @param PDO $pdo Conexão PDO com o banco de dados SQL.
     * @return bool Retorna true em caso de sucesso ou false em caso de falha.
     */
    public function salvar(PDO $pdo): bool {
        $colunas = ['nome', 'email', 'tipo', 'senha_hash'];
        $placeholders = [':nome', ':email', ':tipo', ':senha_hash'];
        $params = [
            ':nome'       => $this->nome,
            ':email'      => $this->email,
            ':tipo'       => $this->tipo,
            ':senha_hash' => $this->obterHashSenha()
        ];

        // Se for classe filha (Aluno ou Instrutor), inclui os campos correspondentes
        if ($this instanceof Aluno) {
            $colunas[] = 'xp_total';
            $placeholders[] = ':xp_total';
            $params[':xp_total'] = $this->xp_total;
        } elseif ($this instanceof Instrutor) {
            $colunas[] = 'materias_leciona';
            $placeholders[] = ':materias_leciona';
            $params[':materias_leciona'] = implode(', ', $this->materias_leciona);
        }

        $sql = "INSERT INTO usuarios (" . implode(', ', $colunas) . ") VALUES (" . implode(', ', $placeholders) . ")";

        try {
            $stmt = $pdo->prepare($sql);
            $sucesso = $stmt->execute($params);
        } catch (PDOException $e) {
            // Fallback caso a tabela 'usuarios' pré-existente contenha apenas as colunas básicas
            $sqlPadrao = "INSERT INTO usuarios (nome, email, tipo, senha_hash) VALUES (:nome, :email, :tipo, :senha_hash)";
            $stmt = $pdo->prepare($sqlPadrao);
            $sucesso = $stmt->execute([
                ':nome'       => $this->nome,
                ':email'      => $this->email,
                ':tipo'       => $this->tipo,
                ':senha_hash' => $this->obterHashSenha()
            ]);
        }

        if ($sucesso) {
            // Atualiza $this->id com o ID gerado pelo banco de dados
            $this->id = (int)$pdo->lastInsertId();
            return true;
        }

        return false;
    }

    /**
     * REQUISITO OBRIGATÓRIO (método static):
     * Busca por e-mail na tabela 'usuarios' e retorna um objeto Usuario preenchido,
     * ou null se não encontrar.
     *
     * @param PDO $pdo Conexão PDO com o banco de dados SQL.
     * @param string $email E-mail a ser pesquisado.
     * @return Usuario|null Objeto preenchido com os dados ou null se inexistente.
     */
    public static function buscarPorEmail(PDO $pdo, string $email): ?Usuario {
        $sql = "SELECT * FROM usuarios WHERE email = :email LIMIT 1";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':email' => $email]);
        $dados = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$dados) {
            return null;
        }

        $tipo = $dados['tipo'] ?? 'Usuário';

        // Instancia o objeto adequado com base no tipo gravado
        if ($tipo === 'Aluno') {
            $usuario = new Aluno(
                (int)$dados['id'],
                $dados['nome'],
                $dados['email'],
                isset($dados['xp_total']) ? (int)$dados['xp_total'] : 0
            );
        } elseif ($tipo === 'Instrutor') {
            $materias = [];
            if (!empty($dados['materias_leciona'])) {
                $materias = is_array($dados['materias_leciona'])
                    ? $dados['materias_leciona']
                    : array_map('trim', explode(',', $dados['materias_leciona']));
            }
            $usuario = new Instrutor(
                (int)$dados['id'],
                $dados['nome'],
                $dados['email'],
                $materias
            );
        } else {
            $usuario = new Usuario(
                (int)$dados['id'],
                $dados['nome'],
                $dados['email'],
                $tipo
            );
        }

        // Restaura o hash da senha protegido por encapsulamento
        if (!empty($dados['senha_hash'])) {
            $usuario->definirHashDireto($dados['senha_hash']);
        }

        return $usuario;
    }

    /**
     * Cria a tabela 'usuarios' automaticamente caso não exista.
     */
    public static function criarTabela(PDO $pdo): void {
        $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
        if ($driver === 'sqlite') {
            $sql = "CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                tipo TEXT DEFAULT 'Usuário',
                senha_hash TEXT NULL,
                xp_total INTEGER DEFAULT 0,
                materias_leciona TEXT NULL,
                criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
            )";
        } else {
            $sql = "CREATE TABLE IF NOT EXISTS usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                tipo VARCHAR(50) DEFAULT 'Usuário',
                senha_hash VARCHAR(255) NULL,
                xp_total INT DEFAULT 0,
                materias_leciona TEXT NULL,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
        }
        $pdo->exec($sql);
    }
}

/**
 * HERANÇA: Classe Aluno herda todas as propriedades e métodos de Usuario.
 * Possui a propriedade pública específica $xp_total (iniciando em 0).
 */
class Aluno extends Usuario {
    public int $xp_total = 0;

    public function __construct(?int $id = null, string $nome = '', string $email = '', int $xp_total = 0) {
        parent::__construct($id, $nome, $email, 'Aluno');
        $this->xp_total = $xp_total;
    }
}

/**
 * HERANÇA: Classe Instrutor herda todas as propriedades e métodos de Usuario.
 * Possui a propriedade pública específica $materias_leciona (array).
 */
class Instrutor extends Usuario {
    public array $materias_leciona = [];

    public function __construct(?int $id = null, string $nome = '', string $email = '', array $materias_leciona = []) {
        parent::__construct($id, $nome, $email, 'Instrutor');
        $this->materias_leciona = $materias_leciona;
    }
}
