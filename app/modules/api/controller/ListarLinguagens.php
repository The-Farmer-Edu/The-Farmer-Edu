<?php
    require __DIR__ . '/../model/Judge0.php';

    class ListarLinguagens {
        public static function getJson(): ?array{
            return (new Judge0())->linguagens ?? null;
        }

        public static function getHTML($forSelect = false): string {
            $linguagens = (new Judge0())->linguagens ?? null;
            // print_r($linguagens);

            if($linguagens){
                if($forSelect){
                    $htmlCode = "<select name='linguagens' id='linguagens'";
                    foreach($linguagens as $linguagem){
                        $htmlCode .= "<option value='" . $linguagem['id'] . "'>" . $linguagem['name'] . "</option>";
                    }
                    $htmlCode .= "</select>";
                    return $htmlCode;
                } else {
                    $htmlCode = "<ol id='linguagens'>";
                    foreach($linguagens as $linguagem){
                        $htmlCode .= "<li value='" . $linguagem['id'] . "'>" . $linguagem['name'] . "</li>";
                    }
                    $htmlCode .= "</ol>";
                }
                return $htmlCode;
            }

            return "Não foi possível obter as linguagens disponíveis";
        }
    }

?>