-- =====================================================================
-- seeds.sql — dados de exemplo para The Farmer Edu
-- Execute APOS o schema.sql
-- Senhas em texto: todos usam "senha123"
-- hash gerado com: password_hash("senha123", PASSWORD_DEFAULT)
-- =====================================================================

USE the_farmer_edu;

-- Desabilita verificacao de FK para inserir em ordem livre
SET FOREIGN_KEY_CHECKS = 0;

-- Limpa dados antigos (ordem inversa de dependencia)
TRUNCATE TABLE notas;
TRUNCATE TABLE feedback_ia;
TRUNCATE TABLE submissoes;
TRUNCATE TABLE atividades;
TRUNCATE TABLE matriculas;
TRUNCATE TABLE turmas;
TRUNCATE TABLE cursos;
TRUNCATE TABLE materias_instrutores;
TRUNCATE TABLE materias;
TRUNCATE TABLE alunos;
TRUNCATE TABLE instrutores;
TRUNCATE TABLE usuarios;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------
-- USUARIOS (2 instrutores + 4 alunos)
-- Senha de todos: senha123
-- ---------------------------------------------------------------
INSERT INTO usuarios (id_usuario, nome, email, senha_hash, tipo_usuario) VALUES
(1, 'Prof. Pedro Lucas de Oliveira', 'pedro@farmeredu.com',  '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uFutB./iy', 'instrutor'),
(2, 'Prof. Ana Carolina Sousa',       'ana@farmeredu.com',   '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uFutB./iy', 'instrutor'),
(3, 'Carlos Eduardo Silva',           'carlos@aluno.com',    '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uFutB./iy', 'aluno'),
(4, 'Juliana Aparecida Lima',         'juliana@aluno.com',   '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uFutB./iy', 'aluno'),
(5, 'Rafael Henrique Costa',          'rafael@aluno.com',    '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uFutB./iy', 'aluno'),
(6, 'Marina Fernanda Rocha',          'marina@aluno.com',    '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uFutB./iy', 'aluno');

-- ---------------------------------------------------------------
-- INSTRUTORES
-- ---------------------------------------------------------------
INSERT INTO instrutores (id_usuario) VALUES (1), (2);

-- ---------------------------------------------------------------
-- ALUNOS
-- ---------------------------------------------------------------
INSERT INTO alunos (id_usuario, matricula, xp_total) VALUES
(3, 'TFE-2024-001', 320),
(4, 'TFE-2024-002', 150),
(5, 'TFE-2024-003', 480),
(6, 'TFE-2024-004',  60);

-- ---------------------------------------------------------------
-- MATERIAS
-- ---------------------------------------------------------------
INSERT INTO materias (id_materia, nome_materia) VALUES
(1, 'Desenvolvimento Web'),
(2, 'Logica de Programacao');

INSERT INTO materias_instrutores VALUES (1, 1), (2, 2);

-- ---------------------------------------------------------------
-- CURSOS
-- ---------------------------------------------------------------
INSERT INTO cursos (id_curso, nome_curso, descricao) VALUES
(1, 'Aprendizagem em Assistente de Programacao Web', 'Formacao completa em desenvolvimento web com foco em PHP, HTML, CSS e JS.'),
(2, 'Tecnico em Informatica', 'Curso tecnico com base em logica e algoritmos.');

-- ---------------------------------------------------------------
-- TURMAS
-- ---------------------------------------------------------------
INSERT INTO turmas (id_turma, nome_turma, turno, id_curso, id_instrutor) VALUES
(1, 'Turma A — Modulo Web 2024',   'manha', 1, 1),
(2, 'Turma B — Logica Avancada',   'tarde',  2, 2);

-- ---------------------------------------------------------------
-- MATRICULAS
-- ---------------------------------------------------------------
INSERT INTO matriculas (id_turma, id_aluno) VALUES
(1, 3), (1, 4), (1, 5),   -- Carlos, Juliana e Rafael na Turma A
(2, 6);                    -- Marina na Turma B

-- ---------------------------------------------------------------
-- ATIVIDADES (Turma A)
-- ---------------------------------------------------------------
INSERT INTO atividades (id_atividade, id_turma, titulo, descricao, tipo_atividade, data_entrega) VALUES
(1, 1, 'Criacao de Estrutura HTML5',                  'Crie uma pagina HTML5 semantica com header, main e footer.', 'codigo',  '2024-03-10 14:00:00'),
(2, 1, 'Desafio CSS Grid: Dashboard Responsivo',      'Recrie um layout de dashboard usando CSS Grid.',             'codigo',  '2024-03-28 23:59:00'),
(3, 1, 'Questionario Teorico: Introducao ao PHP',     'Responda as questoes teoricas sobre PHP estruturado.',       'quiz',    '2024-04-14 11:30:00'),
(4, 1, 'Mini-projeto: Sistema de Login com Sessoes',  'Implemente login com session_start() e protecao de rotas.',  'codigo',  '2024-05-02 23:59:00'),
(5, 1, 'Exercicio: Manipulacao de Arrays e Loops',    'Use foreach, array_map e array_filter para resolver os desafios.', 'codigo', '2024-05-15 18:00:00');

-- ---------------------------------------------------------------
-- ATIVIDADES (Turma B)
-- ---------------------------------------------------------------
INSERT INTO atividades (id_atividade, id_turma, titulo, descricao, tipo_atividade, data_entrega) VALUES
(6, 2, 'Algoritmo: Ordenacao por Selecao',  'Implemente Selection Sort em pseudocodigo e em Python.', 'texto',  '2024-04-20 18:00:00'),
(7, 2, 'Quiz: Estruturas de Dados Basicas', 'Questoes sobre pilha, fila e lista encadeada.',           'quiz',   '2024-05-10 20:00:00');

-- ---------------------------------------------------------------
-- SUBMISSOES
-- ---------------------------------------------------------------
INSERT INTO submissoes (id_submissao, id_atividade, id_aluno, conteudo_resposta, tentativa_num, status) VALUES
-- Carlos (id=3) — enviou e foi corrigido em varias atividades
(1, 1, 3, '<!DOCTYPE html><html>...</html>', 1, 'corrigida'),
(2, 2, 3, '.container { display: grid; }',   1, 'corrigida'),
(3, 3, 3, 'Respostas do questionario PHP.',  1, 'corrigida'),
(4, 4, 3, '<?php session_start(); ?>',       1, 'enviada'),   -- entregue, sem nota ainda

-- Juliana (id=4) — corrigida em 2, pendente nas outras
(5, 1, 4, '<!DOCTYPE html>...</html>',       1, 'corrigida'),
(6, 2, 4, 'grid-template-columns: 1fr 1fr;', 1, 'corrigida'),

-- Rafael (id=5) — ativo, entregou tudo e tem notas
(7, 1, 5, '<html lang="pt-BR">...',          1, 'corrigida'),
(8, 2, 5, 'display: grid; gap: 16px;',       1, 'corrigida'),
(9, 3, 5, 'Respostas completas.',            1, 'corrigida'),
(10,4, 5, 'session_start(); $u = $_SESSION', 1, 'corrigida'),
(11,5, 5, 'array_map("strtolower", $arr);',  1, 'corrigida'),

-- Marina (id=6) — Turma B
(12,6, 6, 'Algoritmo: para i = 0 ate n ...',  1, 'corrigida'),
(13,7, 6, 'Pilha: LIFO. Fila: FIFO...',       1, 'enviada');

-- ---------------------------------------------------------------
-- NOTAS
-- ---------------------------------------------------------------
INSERT INTO notas (id_submissao, valor, origem, id_instrutor_revisor) VALUES
-- Carlos
(1,  9.5, 'instrutor', 1),
(2,  8.0, 'instrutor', 1),
(3,  9.0, 'ia',        NULL),   -- nota da IA ainda nao revisada

-- Juliana
(5,  7.5, 'instrutor', 1),
(6,  6.0, 'instrutor', 1),

-- Rafael
(7,  10.0, 'instrutor', 1),
(8,   9.5, 'instrutor', 1),
(9,   8.5, 'ia',        NULL),
(10,  9.0, 'instrutor', 1),
(11,  8.0, 'instrutor', 1),

-- Marina
(12,  7.0, 'instrutor', 2);

-- ---------------------------------------------------------------
-- FIM DO SEED
-- ---------------------------------------------------------------