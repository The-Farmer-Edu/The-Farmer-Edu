<?php
/**
 * Campo de imagem da turma — usado no cadastro (modal) e na edição.
 *
 * Espera:
 *   $base            URL base do sistema.
 *   $imagemAtualUrl  (opcional) URL da imagem já salva; só existe na edição.
 *
 * O comportamento (prévia, remover/desfazer) fica em assets/js/turmas-cursos.js.
 * O botão "Remover imagem" é um <button> de verdade. Ele limpa o arquivo
 * escolhido e, quando já existe uma imagem salva, marca remover_imagem=1.
 */
$imagemAtualUrl = $imagemAtualUrl ?? null;
$temAtual = !empty($imagemAtualUrl);
?>
<div class="image-field" data-image-field>
    <label class="image-dropzone w-100<?= $temAtual ? ' has-preview' : '' ?>" for="imagemTurma" data-image-dropzone>
        <span class="image-dropzone__empty">
            <i class="bi bi-image"></i>
            <strong data-image-label><?= $temAtual ? 'Escolha uma nova imagem (opcional)' : 'Adicione uma imagem de até 5 MB, preferencialmente WEBP' ?></strong>
            <small>Máximo 5 MB · JPG, PNG ou WEBP</small>
        </span>
        <img class="image-preview" data-image-preview alt="Prévia da imagem da turma"
            <?= $temAtual ? 'src="' . e($imagemAtualUrl) . '"' : 'hidden' ?>>
        <span class="image-dropzone__hint"><i class="bi bi-arrow-repeat"></i>Trocar imagem</span>
    </label>
    <input class="visually-hidden" id="imagemTurma" type="file" name="imagem_turma"
           accept="image/jpeg,image/png,image/webp" data-image-input>
    <input type="hidden" name="remover_imagem" value="0" data-image-remove-flag>
    <button type="button" class="btn btn-outline-danger btn-remove-image" data-image-remove <?= $temAtual ? '' : 'hidden' ?>>
        <i class="bi bi-trash me-1"></i><span data-image-remove-text>Remover imagem</span>
    </button>
</div>
