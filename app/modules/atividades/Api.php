<?php

require_once __DIR__ . '/Model.php';

class AtividadesApi
{
    public static function daTurma(int $idTurma): array
    {
        return Atividade::listarDaTurma(iniciarPDO(), $idTurma);
    }

    public static function daTurmaParaAluno(int $idTurma, int $idAluno): array
    {
        return Atividade::listarDaTurmaParaAluno(iniciarPDO(), $idTurma, $idAluno);
    }
}