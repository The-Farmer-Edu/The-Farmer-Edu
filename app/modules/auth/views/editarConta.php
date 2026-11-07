<?php
// $dados vem do controller (nome e e-mail para preencher o formulário)
$valor = static fn(string $campo): string => htmlspecialchars((string) ($dados[$campo] ?? ''), ENT_QUOTES, 'UTF-8');
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Editar conta - The Farmer Edu</title>
    <link rel="stylesheet" href="file?type=css&file=editarconta.css">
</head>
<body>
    <div class="container-editar">
        <div class="card-editar">
            <h1 class="titulo-pagina">Editar conta</h1>

            <?php if (!empty($mensagem)): ?>
                <div class="mensagem-status">
                    <?= htmlspecialchars($mensagem, ENT_QUOTES, 'UTF-8') ?>
                </div>
            <?php endif; ?>

            <form id="form-editar-conta" action="" method="POST">
                <div class="campo">
                    <label for="nome">Nome:</label>
                    <input type="text" id="nome" name="nome" value="<?= $valor('nome') ?>" required>
                </div>

                <div class="campo">
                    <label for="email">E-mail:</label>
                    <input type="email" id="email" name="email" value="<?= $valor('email') ?>" required>
                </div>

                <div class="campo">
                    <label for="nova_senha">Nova senha (opcional):</label>
                    <input type="password" id="nova_senha" name="nova_senha" minlength="8" placeholder="Deixe em branco para não alterar">
                </div>

                <div class="campo">
                    <label for="senha_atual">Senha atual:</label>
                    <input type="password" id="senha_atual" name="senha_atual" required placeholder="Digite sua senha atual">
                </div>

                <div class="botoes-acoes">
            <button type="submit" id="btn-salvar">Salvar alterações</button>
            <a href="desativarConta" class="btn-desativar">Desativar conta</a>
            <a href="logout" class="btn-sair">Sair</a>
        </div>
    </form>
            </form>

            <div class="acoes-rodape">
                <a href="desativarConta" class="link-perigo">Desativar minha conta</a>
                <span class="divisor">|</span>
                <a href="logout" class="link-voltar">Sair da conta</a>
            </div>
        </div>
    </div>
</body>
</html>