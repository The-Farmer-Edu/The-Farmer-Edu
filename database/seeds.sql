-- =====================================================================
-- The Farmer Edu — seed.sql (População de Dados de Teste)
-- SENAI · Aprendizagem em Assistente de Programação Web
-- Banco: MySQL / MariaDB
--
-- Executar este arquivo após a criação do schema.
-- Os hashes de senha de exemplo utilizam a senha '12345678' gerada via BCRYPT.
-- =====================================================================

USE the_farmer_edu;

-- ---------------------------------------------------------------------
-- 1. USUÁRIOS
-- IDs 1 e 2: Instrutores | IDs 3, 4 e 5: Alunos
-- ---------------------------------------------------------------------
INSERT INTO usuarios (id_usuario, nome, email, senha_hash, tipo_usuario, tentativas_login, bloqueado_ate, ativo) VALUES
(1, 'Carlos Alberto Silva', 'carlos.instrutor@senai.br', '$2y$10$MgPnRIFwpozxQkKXwYR.mOGTH9WaYQdNjrKcQaOobyF8n.WsKAxae', 'instrutor', 0, NULL, 1),
(2, 'Mariana Costa Rocha', 'mariana.instrutor@senai.br', '$2y$10$MgPnRIFwpozxQkKXwYR.mOGTH9WaYQdNjrKcQaOobyF8n.WsKAxae', 'instrutor', 0, NULL, 1),
(3, 'Lucas Andrade Pereira', 'lucas.aluno@aluno.senai.br', '$2y$10$MgPnRIFwpozxQkKXwYR.mOGTH9WaYQdNjrKcQaOobyF8n.WsKAxae', 'aluno', 0, NULL, 1),
(4, 'Beatriz Souza Lima', 'beatriz.aluno@aluno.senai.br', '$2y$10$MgPnRIFwpozxQkKXwYR.mOGTH9WaYQdNjrKcQaOobyF8n.WsKAxae', 'aluno', 0, NULL, 1),
(5, 'Gabriel Ferreira Santos', 'gabriel.aluno@aluno.senai.br', '$2y$10$MgPnRIFwpozxQkKXwYR.mOGTH9WaYQdNjrKcQaOobyF8n.WsKAxae', 'aluno', 0, NULL, 1);

-- ---------------------------------------------------------------------
-- 2. INSTRUTORES E MATÉRIAS
-- ---------------------------------------------------------------------
INSERT INTO instrutores (id_usuario) VALUES
(1),
(2);

INSERT INTO materias (id_materia, nome_materia, descricao) VALUES
(1, 'Lógica de Programação e Algoritmos', 'Fundamentos de lógica, estruturas de controle e funções.'),
(2, 'Desenvolvimento Web Front-End', 'HTML5, CSS3 e JavaScript moderno.'),
(3, 'Banco de Dados Relacional', 'Modelagem, DDL, DML e consultas em SQL.');

INSERT INTO materias_instrutores (id_materia, id_instrutor) VALUES
(1, 1),
(2, 1),
(3, 2);

-- ---------------------------------------------------------------------
-- 3. ALUNOS
-- ---------------------------------------------------------------------
INSERT INTO alunos (id_usuario, matricula, xp_total) VALUES
(3, '20261001', 350),
(4, '20261002', 150),
(5, '20261003', 0);

-- ---------------------------------------------------------------------
-- 4. CURSOS
-- ---------------------------------------------------------------------
INSERT INTO cursos (id_curso, nome_curso, descricao) VALUES
(1, 'Assistente de Programação Web', 'Qualificação profissional voltada para criação e manutenção de sistemas web.'),
(2, 'Técnico em Desenvolvimento de Sistemas', 'Habilitação técnica focada em arquitetura de software, banco de dados e APIs.');

-- ---------------------------------------------------------------------
-- 5. TURMAS
-- ---------------------------------------------------------------------
INSERT INTO turmas (id_turma, nome_turma, turno, id_curso, id_instrutor) VALUES
(1, 'WebDev 2026.1 - Matutino', 'manha', 1, 1),
(2, 'TécDS 2026.1 - Vespertino', 'tarde', 2, 2);

-- ---------------------------------------------------------------------
-- 6. MATRÍCULAS
-- ---------------------------------------------------------------------
INSERT INTO matriculas (id_turma, id_aluno, data_matricula) VALUES
(1, 3, '2026-02-01 08:00:00'),
(1, 4, '2026-02-01 08:30:00'),
(2, 5, '2026-02-02 13:00:00');

-- ---------------------------------------------------------------------
-- 7. ATIVIDADES
-- ---------------------------------------------------------------------
INSERT INTO atividades (id_atividade, id_turma, titulo, descricao, tipo_atividade, linguagem, resposta_referencia, criterios_correcao, data_entrega) VALUES
(1, 1, 'Função de Verificação de Aprovado/Reprovado', 'Crie uma função em JavaScript chamada "verificarStatus" que receba uma nota decimal (0 a 10) e retorne "Aprovado" se >= 6 ou "Reprovado" caso contrário.', 'codigo', 'javascript', 'function verificarStatus(nota) { return nota >= 6 ? "Aprovado" : "Reprovado"; }', '{"sintaxe": 30, "logica_correta": 50, "boas_praticas": 20}', '2026-11-15 23:59:59'),
(2, 1, 'Diferença entre GET e POST', 'Explique sucintamente qual a diferença fundamental entre os métodos HTTP GET e POST em aplicações Web.', 'texto', NULL, 'O método GET envia dados através da URL, sendo usado para recuperar informações. O método POST envia dados no corpo da requisição, sendo mais adequado para envio de formulários e dados sensíveis.', '{"clareza": 40, "precisao_tecnica": 60}', '2026-11-20 23:59:59'),
(3, 2, 'Criação de Tabela de Produtos', 'Escreva o comando SQL DDL para criar uma tabela chamada "produtos" com id, nome e preco.', 'codigo', 'sql', 'CREATE TABLE produtos (id INT PRIMARY KEY AUTO_INCREMENT, nome VARCHAR(100) NOT NULL, preco DECIMAL(10,2) NOT NULL);', '{"sintaxe_sql": 50, "tipos_de_dados": 50}', '2026-11-10 23:59:59');

-- ---------------------------------------------------------------------
-- 8. SUBMISSÕES
-- ---------------------------------------------------------------------
INSERT INTO submissoes (id_submissao, id_atividade, id_aluno, conteudo_resposta, tentativa_num, status, resultado_execucao, data_envio) VALUES
(1, 1, 3, 'function verificarStatus(nota) {\n  if (nota >= 6) {\n    return "Aprovado";\n  } else {\n    return "Reprovado";\n  }\n}', 1, 'corrigida', 'Todos os 4 testes de unidade passaram.', '2026-11-10 10:15:00'),
(2, 1, 4, 'function verificarStatus(nota) {\n  if (nota > 6) {\n    return "Aprovado";\n  }\n}', 1, 'corrigida', 'Falhou no caso de teste: nota = 6 (Esperado: "Aprovado", Retornado: undefined).', '2026-11-11 14:20:00'),
(3, 2, 3, 'O método GET passa os parâmetros pela URL, ideal para busca. O POST passa os dados no corpo da mensagem, ideal para formulários.', 1, 'corrigida', NULL, '2026-11-12 09:00:00');

-- ---------------------------------------------------------------------
-- 9. FEEDBACK DA IA
-- ---------------------------------------------------------------------
INSERT INTO feedback_ia (id_feedback, id_submissao, pontos_positivos, pontos_negativos, sugestao_resposta) VALUES
(1, 1, 'Algoritmo perfeito, cobriu todas as regras condicionais e tratou corretamente o limite da nota 6.', 'Nenhum ponto negativo encontrado.', 'Poderia utilizar o operador ternário para resumir o código em uma única linha.'),
(2, 2, 'Entendeu a lógica da estrutura condicional (if).', 'Esqueceu de tratar a nota exata 6 como aprovada (usou > em vez de >=) e não implementou o caso de reprovação.', 'function verificarStatus(nota) { return nota >= 6 ? "Aprovado" : "Reprovado"; }');

-- ---------------------------------------------------------------------
-- 10. NOTAS
-- ---------------------------------------------------------------------
INSERT INTO notas (id_nota, id_submissao, valor, origem, id_instrutor_revisor, data_atribuicao) VALUES
(1, 1, 10.00, 'instrutor', 1, '2026-11-10 11:00:00'),
(2, 2, 5.00, 'ia', NULL, '2026-11-11 14:21:00'),
(3, 3, 9.50, 'instrutor', 1, '2026-11-12 10:30:00');

-- ---------------------------------------------------------------------
-- 11. FAZENDAS
-- ---------------------------------------------------------------------
INSERT INTO fazendas (id_fazenda, id_aluno, nivel, estado_visual) VALUES
(1, 3, 3, 'fazenda_prospera'),
(2, 4, 2, 'fazenda_em_crescimento'),
(3, 5, 1, 'inicial');

-- ---------------------------------------------------------------------
-- 12. ELEMENTOS DA FAZENDA
-- ---------------------------------------------------------------------
INSERT INTO elementos_fazenda (id_elemento, id_fazenda, tipo, nivel) VALUES
(1, 1, 'construcao', 2),
(2, 1, 'plantacao', 3),
(3, 1, 'animal', 1),
(4, 2, 'plantacao', 1);

-- ---------------------------------------------------------------------
-- 13. HISTÓRICO DE XP (XP_LOGS)
-- ---------------------------------------------------------------------
INSERT INTO xp_logs (id_xp, id_aluno, quantidade, motivo, id_submissao, data) VALUES
(1, 3, 200, 'Conclusão com nota máxima na Atividade #1', 1, '2026-11-10 11:00:00'),
(2, 3, 150, 'Conclusão da Atividade #2', 3, '2026-11-12 10:30:00'),
(3, 4, 150, 'Primeiro envio realizado na Atividade #1', 2, '2026-11-11 14:21:00');

-- ---------------------------------------------------------------------
-- 14. NOTIFICAÇÕES
-- ---------------------------------------------------------------------
INSERT INTO notificacoes (id_notificacao, id_usuario, tipo, mensagem, lida) VALUES
(1, 3, 'nota_atribuida', 'Sua nota na atividade "Função de Verificação de Aprovado/Reprovado" foi 10.00.', 1),
(2, 4, 'nota_atribuida', 'Sua nota na atividade "Função de Verificação de Aprovado/Reprovado" foi 5.00.', 0),
(3, 5, 'atividade_pendente', 'Você tem uma nova atividade pendente na turma TécDS 2026.1.', 0);