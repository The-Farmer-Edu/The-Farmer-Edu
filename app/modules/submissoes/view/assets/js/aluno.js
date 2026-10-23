const CHAVE_ENTREGA = 'farmedu:entrega';

const statusEntrega = document.querySelector('.status');
const texto = document.querySelector('.trabalhos p');
const botaoComecar = document.querySelector('.trabalhos form button');

function lerEntrega() {
    try { return JSON.parse(localStorage.getItem(CHAVE_ENTREGA)); } catch (e) { return null; }
}

function atualizarStatus() {
    const entrega = lerEntrega();
    const data = entrega && new Date(entrega.data);
    const entregue = !!data && !isNaN(data);

    const ponto = document.createElement('span');
    ponto.className = 'ponto';
    statusEntrega.textContent = '';

    if (entregue) {
        const quando = data.toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
        });
        statusEntrega.append(ponto, ' Entregue em ' + quando);
        texto.textContent = 'Atividade entregue! Clique em "Revisar" para ver o seu código.';
        botaoComecar.textContent = 'Revisar';
    } else {
        statusEntrega.append(ponto, ' Não entregue');
        texto.textContent = 'Escreva seu código direto na plataforma clicando em "Começar".';
        botaoComecar.textContent = 'Começar';
    }
    statusEntrega.classList.toggle('entregue', entregue);
}

atualizarStatus();
window.addEventListener('pageshow', atualizarStatus); 
window.addEventListener('storage', atualizarStatus); 

const menus = document.querySelectorAll('.menu');

function fecharMenus(exceto) {
    menus.forEach(m => { if (m !== exceto) m.classList.remove('aberto'); });
}

menus.forEach(menu => {
    menu.querySelector(':scope > button').addEventListener('click', e => {
        e.stopPropagation();
        fecharMenus(menu);
        menu.classList.toggle('aberto');
    });
});

document.addEventListener('click', e => {
    if (e.target.closest('a[href="#"]')) e.preventDefault();  
    if (!e.target.closest('.menu')) fecharMenus();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharMenus(); });

document.getElementById('btnVoltar').addEventListener('click', () => history.back());

