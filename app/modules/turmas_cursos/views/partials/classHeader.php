<?php
require __DIR__ . '/../../../../core/cabecalho.php';
?>
<div class="class-subbar" style="background: <?= $isInstructor ? '#E0EEFF' : '#E5F9E7' ?>; border-bottom: 1px solid rgba(0,45,56,0.1); padding: 10px clamp(16px, 3vw, 40px); display: flex; align-items: center; justify-content: space-between;">
    <div class="class-header__text">
        <h1 style="font-size: 1.25rem; margin: 0; color: #002D38; font-family: 'Poppins', sans-serif; font-weight: 700;"><?= e($turma['nome_turma']) ?></h1>
        <p style="margin: 0; font-size: 0.85rem; color: #727272; font-family: 'Inter', sans-serif;"><?= e($turma['nome_curso']) ?> · <?= e(TurmaModel::TURNOS[$turma['turno']] ?? $turma['turno']) ?> · Turma #<?= (int) $turma['id_turma'] ?></p>
    </div>
</div>
