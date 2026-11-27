<?php

require_once __DIR__ . '/../app/core/router.php';

// Qualquer exceção não tratada vira a tela de erro 500, sem expor detalhes ao usuário.
// O detalhe técnico fica apenas no log do servidor (error_log).
// set_exception_handler(function (Throwable $e): void {
//     error_log((string) $e);

//     while (ob_get_level() > 0) {
//         ob_end_clean();
//     }

//     $codigoErro = 500;
//     require __DIR__ . '/erro.php';
// });

Router::enviarRota();