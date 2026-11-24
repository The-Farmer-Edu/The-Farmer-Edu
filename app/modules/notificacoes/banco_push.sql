-- Rode UMA vez no banco. Guarda os dispositivos (celular/PC) de cada usuário que ativou os alertas.
CREATE TABLE IF NOT EXISTS notificacoes_push (
    id_push        INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_usuario     INT NOT NULL,
    endpoint       TEXT NOT NULL,
    endpoint_hash  CHAR(64) NOT NULL,
    chave_p256dh   VARCHAR(255) NOT NULL,
    chave_auth     VARCHAR(255) NOT NULL,
    user_agent     VARCHAR(255) NULL,
    criado_em      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_push),
    UNIQUE KEY uq_endpoint_hash (endpoint_hash),
    KEY idx_usuario (id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
