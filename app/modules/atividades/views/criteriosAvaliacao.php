<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Critérios da IA</title>

    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
        }

        #criteria-container {
            margin-top: 5px;
        }

        .criterio {
            padding: 10px;
            margin: 5px 0;
            border: 1px solid #ccc;
            cursor: pointer;
        }

        .criterio.selected {
            background-color: #ddd;
        }

        button {
            margin-top: 10px;
            padding: 8px 12px;
            cursor: pointer;
        }

        input {
            padding: 8px;
            width: 250px;
        }
    </style>
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