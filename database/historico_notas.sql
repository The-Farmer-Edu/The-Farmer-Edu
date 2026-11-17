-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 16-Nov-2026 às 15:01
-- Versão do servidor: 10.4.27-MariaDB
-- versão do PHP: 8.0.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `the_farmer_edu`
--

-- --------------------------------------------------------

--
-- Estrutura da tabela `historico_notas`
--

CREATE TABLE `historico_notas` (
  `id_historico` int(10) UNSIGNED NOT NULL,
  `id_submissao` int(10) UNSIGNED NOT NULL,
  `id_instrutor` int(10) UNSIGNED NOT NULL,
  `nota_anterior` int(11) DEFAULT NULL,
  `nota_nova` int(11) NOT NULL,
  `data_alteracao` date NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Índices para tabelas despejadas
--

--
-- Índices para tabela `historico_notas`
--
ALTER TABLE `historico_notas`
  ADD PRIMARY KEY (`id_historico`),
  ADD KEY `fk_id_submissao` (`id_submissao`),
  ADD KEY `fk_id_instrutor` (`id_instrutor`);

--
-- AUTO_INCREMENT de tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `historico_notas`
--
ALTER TABLE `historico_notas`
  MODIFY `id_historico` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Restrições para despejos de tabelas
--

--
-- Limitadores para a tabela `historico_notas`
--
ALTER TABLE `historico_notas`
  ADD CONSTRAINT `fk_id_instrutor` FOREIGN KEY (`id_instrutor`) REFERENCES `instrutores` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_id_submissao` FOREIGN KEY (`id_submissao`) REFERENCES `submissoes` (`id_submissao`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
