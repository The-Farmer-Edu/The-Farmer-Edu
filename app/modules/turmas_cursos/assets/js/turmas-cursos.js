(() => {
    'use strict';

    const maxImageSize = 5 * 1024 * 1024;

    document.querySelectorAll('[data-image-input]').forEach((input) => {
        const target = document.getElementById(input.dataset.previewTarget || 'imagePreview');
        const label = document.querySelector(input.dataset.labelTarget || '[data-image-label]');
        const removeCheckbox = input.form && input.form.querySelector('[name="remover_imagem"]');
        const originalImageSrc = target ? (target.getAttribute('src') || '') : '';
        const originalLabel = label ? label.textContent : '';

        input.addEventListener('change', () => {
            const file = input.files && input.files[0];
            if (!file) return;
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                window.alert('Formato inválido. Escolha uma imagem JPG, PNG ou WEBP.');
                input.value = '';
                return;
            }
            if (file.size > maxImageSize) {
                window.alert('A imagem deve ter no máximo 5 MB.');
                input.value = '';
                return;
            }

            // Selecionar um arquivo novo cancela a opção de remover a imagem.
            if (removeCheckbox) removeCheckbox.checked = false;

            if (target) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    target.src = event.target.result;
                    target.classList.remove('d-none');
                    const placeholder = target.parentElement.querySelector('[data-image-placeholder]');
                    if (placeholder) placeholder.classList.add('d-none');
                };
                reader.readAsDataURL(file);
            }
            if (label) label.textContent = file.name;
        });

        if (removeCheckbox) {
            removeCheckbox.addEventListener('change', () => {
                if (removeCheckbox.checked) {
                    // Remoção explícita: não envia simultaneamente um arquivo novo.
                    input.value = '';
                    if (target) {
                        target.removeAttribute('src');
                        target.classList.add('d-none');
                    }
                    if (label) label.textContent = 'A imagem atual será removida ao salvar.';
                    return;
                }

                if (target && originalImageSrc) {
                    target.src = originalImageSrc;
                    target.classList.remove('d-none');
                } else if (target) {
                    target.classList.add('d-none');
                }
                if (label) label.textContent = originalLabel;
            });
        }
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
