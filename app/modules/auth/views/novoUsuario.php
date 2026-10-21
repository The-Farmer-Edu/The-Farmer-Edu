<h1>Novo usuário</h1>

<form action="" method="POST">
    <input type="text" name="nome" placeholder="Nome" required>
    <input type="email" name="email" placeholder="E-mail" required>

    <select name="tipo" required>
        <option value="aluno">Aluno</option>
        <option value="instrutor">Instrutor</option>
    </select>

    <input type="password" name="senha" placeholder="Senha" required>
    <button type="submit">Cadastrar</button>
</form>

<?php if (isset($mensagem)): ?>
    <p><?= htmlspecialchars($mensagem) ?></p>
<?php endif; 
?>
