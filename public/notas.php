<?php
// =====================================================================
// public/notas.php — Acesso direto as telas do modulo de notas
// Use: http://localhost/The-Farmer-Edu/public/notas.php?tela=aluno
//      http://localhost/The-Farmer-Edu/public/notas.php?tela=instrutor
//      http://localhost/The-Farmer-Edu/public/notas.php?tela=turma
// =====================================================================

// Qual tela exibir? (padrao: aluno)
$tela = $_GET['tela'] ?? 'aluno';
$telasValidas = ['aluno', 'instrutor', 'turma'];

if (!in_array($tela, $telasValidas)) {
    $tela = 'aluno';
}

// ----------------------------------------------------------------
// DADOS SIMULADOS — imitam o que o banco retornaria
// (Substitui as variaveis que o Controller normalmente passaria)
// ----------------------------------------------------------------

// Usuario simulado (aluno ou instrutor, dependendo da tela)
if ($tela === 'aluno') {

    $usuario = [
        'idUsuario'    => 3,
        'nome'         => 'Carlos Eduardo Silva',
        'email'        => 'carlos@aluno.com',
        'perfilAcesso' => 'aluno',
    ];

    $atividades = [
        [
            'id_atividade'    => 1,
            'titulo'          => 'Criacao de Estrutura HTML5',
            'data_entrega'    => '2024-03-10 14:00:00',
            'tipo_atividade'  => 'codigo',
            'nome_turma'      => 'Turma A — Modulo Web 2024',
            'nome_curso'      => 'Aprendizagem em Assistente de Programacao Web',
            'id_submissao'    => 1,
            'status_submissao'=> 'corrigida',
            'tentativa_num'   => 1,
            'nota_valor'      => 9.5,
            'origem_nota'     => 'instrutor',
            'data_nota'       => '2024-03-15 10:00:00',
        ],
        [
            'id_atividade'    => 2,
            'titulo'          => 'Desafio CSS Grid: Dashboard Responsivo',
            'data_entrega'    => '2024-03-28 23:59:00',
            'tipo_atividade'  => 'codigo',
            'nome_turma'      => 'Turma A — Modulo Web 2024',
            'nome_curso'      => 'Aprendizagem em Assistente de Programacao Web',
            'id_submissao'    => 2,
            'status_submissao'=> 'corrigida',
            'tentativa_num'   => 1,
            'nota_valor'      => 8.0,
            'origem_nota'     => 'instrutor',
            'data_nota'       => '2024-04-01 08:00:00',
        ],
        [
            'id_atividade'    => 3,
            'titulo'          => 'Questionario Teorico: Introducao ao PHP',
            'data_entrega'    => '2024-04-14 11:30:00',
            'tipo_atividade'  => 'quiz',
            'nome_turma'      => 'Turma A — Modulo Web 2024',
            'nome_curso'      => 'Aprendizagem em Assistente de Programacao Web',
            'id_submissao'    => 3,
            'status_submissao'=> 'corrigida',
            'tentativa_num'   => 1,
            'nota_valor'      => 9.0,
            'origem_nota'     => 'ia',
            'data_nota'       => '2024-04-15 09:00:00',
        ],
        [
            'id_atividade'    => 4,
            'titulo'          => 'Mini-projeto: Sistema de Login com Sessoes',
            'data_entrega'    => '2024-05-02 23:59:00',
            'tipo_atividade'  => 'codigo',
            'nome_turma'      => 'Turma A — Modulo Web 2024',
            'nome_curso'      => 'Aprendizagem em Assistente de Programacao Web',
            'id_submissao'    => 4,
            'status_submissao'=> 'enviada',
            'tentativa_num'   => 1,
            'nota_valor'      => null,
            'origem_nota'     => null,
            'data_nota'       => null,
        ],
        [
            'id_atividade'    => 5,
            'titulo'          => 'Exercicio: Manipulacao de Arrays e Loops',
            'data_entrega'    => '2024-05-15 18:00:00',
            'tipo_atividade'  => 'codigo',
            'nome_turma'      => 'Turma A — Modulo Web 2024',
            'nome_curso'      => 'Aprendizagem em Assistente de Programacao Web',
            'id_submissao'    => null,
            'status_submissao'=> null,
            'tentativa_num'   => null,
            'nota_valor'      => null,
            'origem_nota'     => null,
            'data_nota'       => null,
        ],
    ];

    $resumo = [
        'total_atividades' => 5,
        'total_avaliadas'  => 3,
        'pendentes'        => 1,
        'media_geral'      => 8.83,
    ];

    // Carrega a view do aluno
    require __DIR__ . '/../app/modules/notas/views/index.php';
    exit;
}

// ----------------------------------------------------------------
if ($tela === 'instrutor') {

    $usuario = [
        'idUsuario'    => 1,
        'nome'         => 'Prof. Pedro Lucas de Oliveira',
        'email'        => 'pedro@farmeredu.com',
        'perfilAcesso' => 'instrutor',
    ];

    $turmas = [
        [
            'id_turma'   => 1,
            'nome_turma' => 'Turma A — Modulo Web 2024',
            'turno'      => 'manha',
            'nome_curso' => 'Aprendizagem em Assistente de Programacao Web',
        ],
        [
            'id_turma'   => 2,
            'nome_turma' => 'Turma B — Logica Avancada',
            'turno'      => 'tarde',
            'nome_curso' => 'Tecnico em Informatica',
        ],
    ];

    // Carrega a view do instrutor
    require __DIR__ . '/../app/modules/notas/views/instrutor.php';
    exit;
}

// ----------------------------------------------------------------
if ($tela === 'turma') {

    $usuario = [
        'idUsuario'    => 1,
        'nome'         => 'Prof. Pedro Lucas de Oliveira',
        'email'        => 'pedro@farmeredu.com',
        'perfilAcesso' => 'instrutor',
    ];

    $turma = [
        'id_turma'   => 1,
        'nome_turma' => 'Turma A — Modulo Web 2024',
        'turno'      => 'manha',
        'nome_curso' => 'Aprendizagem em Assistente de Programacao Web',
    ];

    $submissoes = [
        // ---- Carlos Eduardo Silva ----
        [
            'id_aluno'          => 3,
            'nome_aluno'        => 'Carlos Eduardo Silva',
            'id_atividade'      => 1,
            'titulo_atividade'  => 'Criacao de Estrutura HTML5',
            'data_entrega'      => '2024-03-10 14:00:00',
            'tipo_atividade'    => 'codigo',
            'id_submissao'      => 1,
            'status_submissao'  => 'corrigida',
            'tentativa_num'     => 1,
            'data_envio'        => '2024-03-09 20:00:00',
            'id_nota'           => 1,
            'nota_valor'        => 9.5,
            'origem_nota'       => 'instrutor',
        ],
        [
            'id_aluno'          => 3,
            'nome_aluno'        => 'Carlos Eduardo Silva',
            'id_atividade'      => 2,
            'titulo_atividade'  => 'Desafio CSS Grid: Dashboard Responsivo',
            'data_entrega'      => '2024-03-28 23:59:00',
            'tipo_atividade'    => 'codigo',
            'id_submissao'      => 2,
            'status_submissao'  => 'corrigida',
            'tentativa_num'     => 1,
            'data_envio'        => '2024-03-27 18:00:00',
            'id_nota'           => 2,
            'nota_valor'        => 8.0,
            'origem_nota'       => 'instrutor',
        ],
        [
            'id_aluno'          => 3,
            'nome_aluno'        => 'Carlos Eduardo Silva',
            'id_atividade'      => 4,
            'titulo_atividade'  => 'Mini-projeto: Sistema de Login com Sessoes',
            'data_entrega'      => '2024-05-02 23:59:00',
            'tipo_atividade'    => 'codigo',
            'id_submissao'      => 4,
            'status_submissao'  => 'enviada',
            'tentativa_num'     => 1,
            'data_envio'        => '2024-05-01 22:00:00',
            'id_nota'           => null,
            'nota_valor'        => null,
            'origem_nota'       => null,
        ],
        // ---- Juliana Aparecida Lima ----
        [
            'id_aluno'          => 4,
            'nome_aluno'        => 'Juliana Aparecida Lima',
            'id_atividade'      => 1,
            'titulo_atividade'  => 'Criacao de Estrutura HTML5',
            'data_entrega'      => '2024-03-10 14:00:00',
            'tipo_atividade'    => 'codigo',
            'id_submissao'      => 5,
            'status_submissao'  => 'corrigida',
            'tentativa_num'     => 1,
            'data_envio'        => '2024-03-10 12:00:00',
            'id_nota'           => 5,
            'nota_valor'        => 7.5,
            'origem_nota'       => 'instrutor',
        ],
        [
            'id_aluno'          => 4,
            'nome_aluno'        => 'Juliana Aparecida Lima',
            'id_atividade'      => 2,
            'titulo_atividade'  => 'Desafio CSS Grid: Dashboard Responsivo',
            'data_entrega'      => '2024-03-28 23:59:00',
            'tipo_atividade'    => 'codigo',
            'id_submissao'      => 6,
            'status_submissao'  => 'corrigida',
            'tentativa_num'     => 1,
            'data_envio'        => '2024-03-28 20:00:00',
            'id_nota'           => 6,
            'nota_valor'        => 6.0,
            'origem_nota'       => 'instrutor',
        ],
        [
            'id_aluno'          => 4,
            'nome_aluno'        => 'Juliana Aparecida Lima',
            'id_atividade'      => 4,
            'titulo_atividade'  => 'Mini-projeto: Sistema de Login com Sessoes',
            'data_entrega'      => '2024-05-02 23:59:00',
            'tipo_atividade'    => 'codigo',
            'id_submissao'      => null,
            'status_submissao'  => null,
            'tentativa_num'     => null,
            'data_envio'        => null,
            'id_nota'           => null,
            'nota_valor'        => null,
            'origem_nota'       => null,
        ],
        // ---- Rafael Henrique Costa ----
        [
            'id_aluno'          => 5,
            'nome_aluno'        => 'Rafael Henrique Costa',
            'id_atividade'      => 1,
            'titulo_atividade'  => 'Criacao de Estrutura HTML5',
            'data_entrega'      => '2024-03-10 14:00:00',
            'tipo_atividade'    => 'codigo',
            'id_submissao'      => 7,
            'status_submissao'  => 'corrigida',
            'tentativa_num'     => 1,
            'data_envio'        => '2024-03-08 16:00:00',
            'id_nota'           => 7,
            'nota_valor'        => 10.0,
            'origem_nota'       => 'instrutor',
        ],
        [
            'id_aluno'          => 5,
            'nome_aluno'        => 'Rafael Henrique Costa',
            'id_atividade'      => 4,
            'titulo_atividade'  => 'Mini-projeto: Sistema de Login com Sessoes',
            'data_entrega'      => '2024-05-02 23:59:00',
            'tipo_atividade'    => 'codigo',
            'id_submissao'      => 10,
            'status_submissao'  => 'corrigida',
            'tentativa_num'     => 1,
            'data_envio'        => '2024-04-30 14:00:00',
            'id_nota'           => 10,
            'nota_valor'        => 9.0,
            'origem_nota'       => 'ia',
        ],
    ];

    // Carrega a view da turma
    require __DIR__ . '/../app/modules/notas/views/turma.php';
    exit;
}