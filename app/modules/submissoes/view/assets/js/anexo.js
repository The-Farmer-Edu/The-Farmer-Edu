const opcaoArquivo = document.getElementById('opcaoArquivo');
const inputArquivoReal = document.getElementById('inputArquivoReal');

// Array para guardar os arquivos que serão enviados ao servidor
let arquivosSelecionados = [];

// 2. Quando clicar em "Arquivo" no menu, aciona o input invisível
opcaoArquivo.addEventListener('click', () => {
    inputArquivoReal.click();
});

// 3. Quando o usuário escolher o(s) arquivo(s) no computador
inputArquivoReal.addEventListener('change', (evento) => {
    const novosArquivos = Array.from(evento.target.files);

    novosArquivos.forEach(arquivo => {
        arquivosSelecionados.push(arquivo);
        renderizarAnexo(arquivo.name, 'file');
    });

    // Limpa o input para permitir selecionar o mesmo arquivo novamente se removido
    inputArquivoReal.value = '';
    atualizarBotaoPrincipal();
});

// Cria o cartão visual do arquivo anexado
function renderizarAnexo(nome, tipo) {
    const div = document.createElement('div');
    div.className = 'item-anexo';
    div.innerHTML = `
            <span title="${nome}">${tipo === 'link' ? '🔗' : '📄'} ${nome}</span>
            <button class="btn-remover" title="Remover">✕</button>
        `;

    // Lógica do botão "X" para remover o anexo
    div.querySelector('.btn-remover').addEventListener('click', () => {
        div.remove();
        arquivosSelecionados = arquivosSelecionados.filter(item => item.name !== nome);
        atualizarBotaoPrincipal();
    });

    listaAnexos.appendChild(div);
}