-- =====================================================================
-- FAZENDA — alterações no schema.sql (squads 1 e 7)
-- O schema.sql já tem as tabelas fazendas, xp_logs e alunos.xp_total.
-- Este script só ACRESCENTA as colunas que o backend da Fazenda precisa.
-- Rode uma vez no banco the_farmer_edu (ou use o schema.sql em anexo, que já vem com elas).
-- =====================================================================
USE the_farmer_edu;

-- fazendas: guarda o save do jogo (JSON completo do "estado" do front-end).
--   estado        -> xp, niveis, recursos, lavouras, animais, mina, trabalhadores...
--   revisao       -> sobe a cada gravação; impede que duas abas/computadores se sobrescrevam
--   nome_fazenda  -> cópia do nome dentro do JSON, para consultas e relatórios do instrutor
--   (o saldo de XP fica em alunos.xp_total, que o backend mantém igual ao XP do jogo)
-- As colunas nivel e estado_visual continuam como estão (o backend ainda não as preenche).
ALTER TABLE fazendas
  ADD COLUMN nome_fazenda   VARCHAR(60)   NOT NULL DEFAULT 'FarmEdu' AFTER id_aluno,
  ADD COLUMN estado         LONGTEXT      NULL,
  ADD COLUMN versao_estado  INT UNSIGNED  NOT NULL DEFAULT 0,
  ADD COLUMN revisao        INT UNSIGNED  NOT NULL DEFAULT 0;

-- elementos_fazenda: uma linha por área construída (casa, celeiro, curral, mina...). A tabela não tinha uma coluna para
-- dizer QUAL área é, então entra "codigo" (o id da área no jogo). Se a tabela já tiver linhas, apague-as antes
-- (o backend as recria no próximo save): DELETE FROM elementos_fazenda;
ALTER TABLE elementos_fazenda
  ADD COLUMN codigo VARCHAR(40) NOT NULL AFTER id_fazenda,
  ADD UNIQUE KEY uq_elementos_fazenda_codigo (id_fazenda, codigo);

-- xp_logs: marca quando o jogo do aluno recebeu cada lançamento.
--   entregue_em NULL = o XP já está no banco, mas ainda não foi aplicado no jogo.
--   (Os ganhos e gastos do próprio jogo são gravados já com entregue_em preenchido.)
ALTER TABLE xp_logs
  ADD COLUMN entregue_em DATETIME NULL AFTER data,
  ADD INDEX idx_xplogs_pendentes (id_aluno, entregue_em);

-- Se o banco já tiver lançamentos antigos em xp_logs que NÃO devem chegar ao jogo, marque-os como entregues
-- (descomente e rode uma única vez, logo depois dos ALTER acima):
-- UPDATE xp_logs SET entregue_em = NOW() WHERE entregue_em IS NULL;
