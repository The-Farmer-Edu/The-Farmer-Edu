<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Critérios da IA</title>

    <base href="<?= htmlspecialchars($base, ENT_QUOTES, 'UTF-8') ?>/">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Poppins:wght@500;700&display=swap">
    <link rel="stylesheet" href="atividades/file?type=css&file=criterios.css">
</head>

<body>

    <h1>Critérios da IA</h1>

    <input
        type="text"
        id="criteria-input"
        placeholder="Digite um critério..."
    >

    <button id="add-criteria-btn">
        Adicionar Critério
    </button>

    <div id="criteria-container"></div>

    <button id="remover-criterio-btn">
        Remover Critério
    </button>

    <p>Selecione o critério que deseja remover e clique em "Remover Critério".</p>

    <script>
        const criteriaContainer = document.getElementById("criteria-container");
        const criteriaInput = document.getElementById("criteria-input");
        const addCriteriaBtn = document.getElementById("add-criteria-btn");
        const removerCriterioBtn = document.getElementById("remover-criterio-btn");

        addCriteriaBtn.addEventListener("click", () => {
            const texto = criteriaInput.value.trim();

            if (!texto) return;

            const criterio = document.createElement("div");
            criterio.className = "criterio";
            criterio.textContent = texto;

            criterio.addEventListener("click", () => {
                criterio.classList.toggle("selected");
            });

            criteriaContainer.appendChild(criterio);
            criteriaInput.value = "";
            criteriaInput.focus();
        });

        criteriaInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                addCriteriaBtn.click();
            }
        });

        removerCriterioBtn.addEventListener("click", () => {
            const selecionados = document.querySelectorAll(".criterio.selected");

            if (selecionados.length === 0) {
                alert("Selecione pelo menos um critério para remover.");
                return;
            }

            const confirmar = confirm(
                `Tem certeza que deseja remover ${selecionados.length} critério(s)?`
            );

            if (!confirmar) return;

            selecionados.forEach(criterio => {
                criterio.remove();
            });
        });
    </script>

</body>
</html>