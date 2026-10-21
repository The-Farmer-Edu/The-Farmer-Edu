<h1>Buscar usuário</h1>

<form action="" method="POST">
    <input type="email" name="email" placeholder="E-mail do usuário" required>
    <button type="submit">Buscar</button>
</form>

<?php if (isset($buscou)): ?>
    <?php if ($usuario): ?>
        <p>Nome: <?= htmlspecialchars($usuario->nome) ?></p>
        <p>E-mail: <?= htmlspecialchars($usuario->email) ?></p>
        <p>Tipo: <?= htmlspecialchars($usuario->tipo) ?></p>
    <?php else: ?>
        <p>Usuário não encontrado.</p>
    <?php endif; ?>
<?php endif; ?>
