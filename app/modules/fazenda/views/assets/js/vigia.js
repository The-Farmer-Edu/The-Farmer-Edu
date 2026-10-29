    addEventListener('load', () => setTimeout(() => {
      if (window.FARMEDU_INICIADO) return;   // o script principal começou: daqui em diante ele mesmo trata os erros
      const tela = document.getElementById('tela-de-carregamento');
      tela.classList.add('com-erro');
      document.getElementById('carregamento-mensagem').textContent = 'Falha ao iniciar';
      document.getElementById('carregamento-erro-texto').textContent = 'O código do jogo não pôde ser executado. Abra o console do navegador (F12) para ver o erro. Seu progresso salvo não foi apagado.';
      document.getElementById('carregamento-erro').hidden = false;
      document.getElementById('carregamento-tentar').onclick = () => location.reload();
    }, 1500));
