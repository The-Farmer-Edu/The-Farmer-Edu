<?php
/**
 * Botão de acesso à fazenda, fixo no canto inferior direito de todas as telas.
 * A rota /fazenda só aceita aluno (instrutor recebe 403), então o botão
 * só aparece no tema do aluno.
 */
if (($theme ?? '') === 'student'): ?>
<a class="btn-acessar-fazenda" href="<?= e($base) ?>/fazenda" aria-label="Acessar a fazenda" title="Acessar a fazenda">
    <img src="<?= e($assetUrl . 'icone-acesso-fazenda.png') ?>" alt="">
</a>
<?php endif; ?>
