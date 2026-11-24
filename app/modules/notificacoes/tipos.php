<?php

/**
 * Tipos de notificação conhecidos.
 *
 * Para criar um tipo novo, basta acrescentar uma linha aqui:
 *   'chave_do_tipo' => ['titulo' => 'Título exibido', 'status' => 'pendente|entregue|atrasado'],
 *
 * É usado pela tela de notificações e pelo push (título da notificação no celular/PC).
 */
return [
    'atividade_pendente'  => ['titulo' => 'Nova atividade',      'status' => 'pendente'],
    'atividade_atrasada'  => ['titulo' => 'Atividade atrasada',  'status' => 'atrasado'],
    'fazenda_atacada'     => ['titulo' => 'Fazenda atacada',     'status' => 'atrasado'],
    'atividade_entregue'  => ['titulo' => 'Atividade entregue',  'status' => 'entregue'],
    'nota_atribuida'      => ['titulo' => 'Nota atribuída',      'status' => 'entregue'],
    'feedback_ia'         => ['titulo' => 'Feedback da IA',      'status' => 'entregue'],
    'atividade_publicada' => ['titulo' => 'Atividade publicada', 'status' => 'entregue'],
];
