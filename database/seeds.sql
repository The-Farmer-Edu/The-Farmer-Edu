INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario)
VALUES ('Prof Teste', 'prof@teste.com', 'x', 'instrutor');

INSERT INTO instrutores (id_usuario) VALUES (LAST_INSERT_ID());

INSERT INTO cursos (nome_curso) VALUES ('Curso Teste');

INSERT INTO turmas (nome_turma, turno, id_curso, id_instrutor)
VALUES ('Turma Teste', 'manha', LAST_INSERT_ID(),
        (SELECT id_usuario FROM usuarios WHERE email = 'prof@teste.com'));

INSERT INTO atividades (id_turma, titulo, descricao, tipo_atividade, linguagem, data_entrega)
VALUES (LAST_INSERT_ID(), 'Atividade teste', 'Enunciado de teste', 'codigo', 'PHP',
        DATE_ADD(NOW(), INTERVAL 7 DAY));

SELECT LAST_INSERT_ID() AS id_atividade;





INSERT INTO arquivos (id_atividade, descricao_arquivo, caminho)
VALUES (1, 'Código da solução', '1/gabarito.php');