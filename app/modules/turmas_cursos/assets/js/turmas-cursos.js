(() => {
    'use strict';

    const maxImageSize = 5 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    // Campo de imagem da turma (cadastro e edição).
    // Estados: imagem já salva (só na edição) · arquivo novo escolhido · remoção pedida.
    document.querySelectorAll('[data-image-field]').forEach((field) => {
        const input = field.querySelector('[data-image-input]');
        const dropzone = field.querySelector('[data-image-dropzone]');
        const preview = field.querySelector('[data-image-preview]');
        const label = field.querySelector('[data-image-label]');
        const flag = field.querySelector('[data-image-remove-flag]');
        const removeButton = field.querySelector('[data-image-remove]');
        const removeText = field.querySelector('[data-image-remove-text]');
        if (!input || !dropzone || !preview || !removeButton) return;

        const currentSrc = preview.getAttribute('src') || '';
        const hasCurrent = currentSrc !== '';
        const defaultLabel = label ? label.textContent : '';
        let selectedUrl = '';
        let removed = false;

        const clearSelection = () => {
            if (selectedUrl) URL.revokeObjectURL(selectedUrl);
            selectedUrl = '';
            input.value = '';
        };

        const render = () => {
            const src = selectedUrl || (hasCurrent && !removed ? currentSrc : '');

            if (src) {
                preview.src = src;
                preview.hidden = false;
            } else {
                preview.removeAttribute('src');
                preview.hidden = true;
            }
            dropzone.classList.toggle('has-preview', src !== '');

            if (label) {
                label.textContent = removed ? 'A imagem atual será removida ao salvar.' : defaultLabel;
            }
            if (flag) flag.value = removed ? '1' : '0';

            // O botão aparece sempre que há algo a remover (ou a desfazer).
            removeButton.hidden = !(src || removed);
            removeButton.classList.toggle('btn-outline-danger', !removed);
            removeButton.classList.toggle('btn-outline-theme', removed);
            if (removeText) removeText.textContent = removed ? 'Desfazer remoção' : 'Remover imagem';
        };

        input.addEventListener('change', () => {
            const file = input.files && input.files[0];
            if (!file) return;
            if (!allowedTypes.includes(file.type)) {
                window.alert('Formato inválido. Escolha uma imagem JPG, PNG ou WEBP.');
                clearSelection();
                render();
                return;
            }
            if (file.size > maxImageSize) {
                window.alert('A imagem deve ter no máximo 5 MB.');
                clearSelection();
                render();
                return;
            }

            if (selectedUrl) URL.revokeObjectURL(selectedUrl);
            selectedUrl = URL.createObjectURL(file);
            removed = false; // Escolher um arquivo novo cancela o pedido de remoção.
            render();
        });

        removeButton.addEventListener('click', () => {
            if (removed) {
                // Desfazer: volta a exibir a imagem que já estava salva.
                removed = false;
            } else {
                // Descarta o arquivo escolhido e, se já havia imagem salva,
                // pede a remoção dela ao salvar.
                clearSelection();
                removed = hasCurrent;
            }
            render();
        });

        render();
    });

    const modalId = document.body.dataset.openModal;
    if (modalId && window.bootstrap) {
        const modal = document.getElementById(modalId);
        if (modal) bootstrap.Modal.getOrCreateInstance(modal).show();
    }

    document.querySelectorAll('form[data-confirm]').forEach((form) => {
        form.addEventListener('submit', (event) => {
            const message = form.dataset.confirm || 'Tem certeza de que deseja continuar?';
            if (!window.confirm(message)) event.preventDefault();
        });
    });
})();
