<?php 
     function base64_codificar (string $codigoNormal) : string{
         $codigoCodificado = base64_encode($codigoNormal, true); 
         if ($codigoNormal === false) {
            echo 'Formato de string inválido para base64_encode. Certifique-se de que a string está corretamente inserida.';
         }
          return $codigoCodificado;
        } 
   

$codigo = "<?php
    require_once __DIR__ . '/../../core/router.php';
    require_once __DIR__ . '/Controller.php';

    Router::get('/feedback_ia/testarApi', [testarAPIController::class, 'showAvaliar']);
    Router::post('/feedback_ia/sendAvaliacao', [testarAPIController::class, 'sendAvaliacao']);
?>
  " ;

echo base64_codificar($codigo); 

?>