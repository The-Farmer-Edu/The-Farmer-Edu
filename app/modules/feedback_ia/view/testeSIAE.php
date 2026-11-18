<?php
require_once __DIR__ . '/../../api/model/Ollama.php';

$ia = <<<'COD'
def somar(a: int, b: int) -> int:
    """Soma dois números inteiros e retorna o resultado."""
    return a + b

if __name__ == "__main__":
    # Exemplo de uso
    print(f"Resultado: {somar(3, 5)}")
COD;

$humano = <<<'COD'
a = int(input())
b = int(input())
soma = a+b
print("Soma:", soma)
COD;

$siae = new SIAE();
foreach (['IA' => $ia, 'HUMANO' => $humano] as $nome => $codigo) {
    echo "=== $nome ===<br>";
    $r = json_encode($siae->obterResultadoSIAE('Python', 'Ler dois números e mostrar a soma', $codigo), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "<br><br>";
    $rf = str_replace('\n', '<br>', $r);
    echo $rf;
}
