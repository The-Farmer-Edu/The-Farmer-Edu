<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relação de Linguagens Judge0</title>
</head>
<body>
    <?php
        require_once __DIR__ . '/../controller/ListarLinguagens.php';
        echo ListarLinguagens::getHTML();
    ?>
    <script>
        const list = document.querySelector('#linguagens');
        const items = Array.from(list.querySelectorAll('li')) || Array.from(list.querySelectorAll('option'));

        function bubbleSort(items){
            let length = items.length;
            let swapped;

            for (let i = 0; i < length - 1; i++) {
                swapped = false;

                for (let j = 0; j < length - i - 1; j++){
                    if(items[j].value > items[j+1].value){
                        [items[j].value, items[j+1].value] = [items[j+1].value, items[j].value];
                        swapped = true;
                    }
                }
                if (!swapped) break;
            }
            return items;
        }
        bubbleSort(items).forEach(item => list.appendChild(item));

    </script>
</body>
</html>