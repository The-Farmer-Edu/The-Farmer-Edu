// Se o upload falhar sem mensagem clara, confira upload_max_filesize e post_max_size no php.ini. O padrão do XAMPP é 2 MB, e quando o limite estoura o PHP zera $_POST e $_FILES.

(function () {
  const atividade = window.FarmAtividade;
  if (!atividade || atividade.tipo !== 'anexo') return; // outros tipos seguem o fluxo normal

  const MAX_ARQUIVOS = 5;
  const MAX_BYTES = 10 * 1024 * 1024;
  const opcaoArquivo = document.getElementById('opcaoArquivo');
  const inputArquivoReal = document.getElementById('inputArquivoReal');
  const listaAnexos = document.getElementById('listaAnexos');
  const botaoEntregar = document.getElementById('comecar');
  const formulario = botaoEntregar.closest('form');
  let arquivosSelecionados = [];

  opcaoArquivo.addEventListener('click', () => inputArquivoReal.click());

  inputArquivoReal.addEventListener('change', (evento) => {
    for (const arquivo of Array.from(evento.target.files)) {
      if (arquivosSelecionados.length >= MAX_ARQUIVOS) { alert(`Máximo de ${MAX_ARQUIVOS} arquivos.`); break; }
      if (arquivo.size > MAX_BYTES) { alert(`"${arquivo.name}" passa de 10 MB.`); continue; }
      const repetido = arquivosSelecionados.some(a => a.name === arquivo.name && a.size === arquivo.size);
      if (!repetido) arquivosSelecionados.push(arquivo);
    }
    inputArquivoReal.value = ''; // permite escolher o mesmo arquivo de novo
    renderizarLista();
  });

  function renderizarLista() {
    listaAnexos.replaceChildren();
    arquivosSelecionados.forEach((arquivo, indice) => {
      const item = document.createElement('div');
      item.className = 'item-anexo';

      const nome = document.createElement('span');
      nome.title = arquivo.name;
      nome.textContent = '📄 ' + arquivo.name;   // textContent: sem risco de XSS

      const remover = document.createElement('button');
      remover.type = 'button';
      remover.className = 'btn-remover';
      remover.title = 'Remover';
      remover.textContent = '✕';
      remover.addEventListener('click', () => { arquivosSelecionados.splice(indice, 1); renderizarLista(); });

      item.append(nome, remover);
      listaAnexos.appendChild(item);
    });
  }

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault(); // não navega para iniciarAtv
    if (atividade.prazoExcedido()) return alert('O prazo de entrega acabou.');
    if (arquivosSelecionados.length === 0) return alert('Anexe pelo menos um arquivo antes de entregar.');

    const dados = new FormData();
    dados.append('id_atividade', atividade.id);
    arquivosSelecionados.forEach(a => dados.append('arquivos[]', a));

    botaoEntregar.disabled = true;
    botaoEntregar.textContent = 'Enviando...';
    try {
      const resposta = await fetch('enviarAnexo', { method: 'POST', body: dados });
      const json = await resposta.json();
      if (!resposta.ok || !json.sucesso) throw new Error(json.erro || 'Falha ao entregar.');

      arquivosSelecionados = [];
      renderizarLista();
      // mantém o status "Entregue em..." do aluno.js (CHAVE_ENTREGA e atualizarStatus vêm de lá)
      try {
        localStorage.setItem(CHAVE_ENTREGA, JSON.stringify({ data: new Date().toISOString(), atividadeId: atividade.id }));
      } catch (e) {}
      alert('Atividade entregue!');
    } catch (erro) {
      alert(erro.message);
    } finally {
      botaoEntregar.disabled = false;
      atualizarStatus();
    }
  });
})();