import { mergeImages } from './merge.js';
import {
    getImageOpacities,
    getImageMergingMethods,
    getImageWeights,
    setImageWeight,
    setImagePosition
} from './state.js';

function toggleEditMenu(button) {
    const menu = button.nextElementSibling;
    const openMenus = document.querySelectorAll('.edit-menu.show');
    openMenus.forEach(m => {
        if (m !== menu) m.classList.remove('show');
    });
    menu.classList.toggle('show');
    document.addEventListener('click', function handler(e) {
        if (!menu.contains(e.target) && e.target !== button) {
            menu.classList.remove('show');
            document.removeEventListener('click', handler);
        }
    });
    menu.querySelector('.opacity-slider-container').style.display = 'none';
    menu.querySelector('.merge-slider-container')?.classList.add('hidden');
}

function setupMoreOptionsToggle() {
    const toggleBtn = document.getElementById('toggleMoreBtn');
    const moreOptions = document.getElementById('moreOptions');

    if (!toggleBtn || !moreOptions) {
        console.error("Toggle button or more options section not found.");
        return;
    }

    toggleBtn.addEventListener('click', () => {
        const expanded = moreOptions.classList.toggle('visible');
        toggleBtn.textContent = expanded ? 'Less Options ↑' : 'More Options ↓';
    });
}

function editOpacity(inputId) {
    const box = document.getElementById(inputId).closest('.upload-box');
    const sliderContainer = box.querySelector('.opacity-slider-container');
    const isVisible = sliderContainer.style.display === 'block';
    sliderContainer.style.display = isVisible ? 'none' : 'block';

    const mergeMenu = box.querySelector('.merge-methods-container');
    if (mergeMenu) mergeMenu.style.display = 'none';

    const mergeSlider = box.querySelector('.merge-slider-container');
    if (mergeSlider) mergeSlider.classList.add('hidden');

    if (!isVisible) {
        const slider = sliderContainer.querySelector('.opacity-slider');
        slider.value = getImageOpacities()[inputId] ?? 1;
        slider.oninput = (e) => {
            const val = parseFloat(e.target.value);
            getImageOpacities()[inputId] = val;
            mergeImages();
        };
    }
}

function editMerging(inputId) {
    const box = document.getElementById(inputId).closest('.upload-box');

    const sliderContainer = box.querySelector('.opacity-slider-container');
    if (sliderContainer) sliderContainer.style.display = 'none';

    const mergeMenu = box.querySelector('.merge-methods-container');
    const isVisible = mergeMenu.style.display === 'block';
    mergeMenu.style.display = isVisible ? 'none' : 'block';

    mergeMenu.querySelectorAll('button[data-method]').forEach(btn => {
        btn.onclick = () => {
            const method = btn.getAttribute('data-method');
            const map = getImageMergingMethods();
            map[inputId] = method;
            mergeImages();
            mergeMenu.style.display = 'none';

            const mergeSlider = box.querySelector('.merge-slider-container');
            if (method === 'weighted') {
                mergeSlider?.classList.remove('hidden');
                const slider = mergeSlider.querySelector('input');
                slider.value = getImageWeights()[inputId] ?? 0.5;
                slider.oninput = (e) => {
                    const val = parseFloat(e.target.value);
                    setImageWeight(inputId, val);
                    mergeImages();
                };
            } else {
                mergeSlider?.classList.add('hidden');
            }
        };
    });
}


function editPosition(inputId) {
    const input = document.getElementById(inputId);
    const box = input.closest('.upload-box');
    const canvas = document.getElementById('canvas');

    const img = new Image();
    img.src = box.style.backgroundImage.slice(5, -2);

    img.onload = () => {
        const overlay = document.createElement('div');
        overlay.id = 'position-overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = canvas.offsetTop + 'px';
        overlay.style.left = canvas.offsetLeft + 'px';
        overlay.style.width = canvas.width + 'px';
        overlay.style.height = canvas.height + 'px';
        overlay.style.zIndex = '9999';
        overlay.style.pointerEvents = 'auto';
        document.body.appendChild(overlay);

        document.getElementById('positionHint')?.classList.add('active');

        const wrapper = document.createElement('div');
        wrapper.style.position = 'absolute';
        wrapper.style.top = '50px';
        wrapper.style.left = '50px';
        wrapper.style.width = img.width + 'px';
        wrapper.style.height = img.height + 'px';
        wrapper.style.pointerEvents = 'none';
        wrapper.style.zIndex = '10000';
        overlay.appendChild(wrapper);

        const imgEl = document.createElement('img');
        imgEl.src = img.src;
        imgEl.style.position = 'absolute';
        imgEl.style.width = '100%';
        imgEl.style.height = '100%';
        imgEl.style.cursor = 'move';
        imgEl.style.userSelect = 'none';
        imgEl.style.pointerEvents = 'auto';
        wrapper.appendChild(imgEl);

        ['nw', 'ne', 'sw', 'se'].forEach(dir => {
            const handle = document.createElement('div');
            handle.className = `resize-handle ${dir}`;
            wrapper.appendChild(handle);
        });

        let dragging = false;
        let resizing = false;
        let currentHandle = null;
        let startX = 0, startY = 0;
        let startWidth = 0, startHeight = 0;
        let offsetX = 0, offsetY = 0;

        wrapper.onmousedown = (e) => {
            if (e.target.classList.contains('resize-handle')) return;
            dragging = true;
            offsetX = e.clientX - wrapper.offsetLeft;
            offsetY = e.clientY - wrapper.offsetTop;
            e.preventDefault();
        };

        wrapper.querySelectorAll('.resize-handle').forEach(handle => {
            handle.onmousedown = (e) => {
                e.stopPropagation();
                resizing = true;
                currentHandle = [...handle.classList].find(c => ['nw', 'ne', 'sw', 'se'].includes(c));
                startX = e.clientX;
                startY = e.clientY;
                startWidth = wrapper.offsetWidth;
                startHeight = wrapper.offsetHeight;
            };
        });

        document.onmousemove = (e) => {
    if (dragging) {
        let newLeft = e.clientX - offsetX;
        let newTop = e.clientY - offsetY;

        // Clamp to canvas
        newLeft = Math.max(0, Math.min(newLeft, canvas.width - wrapper.offsetWidth));
        newTop = Math.max(0, Math.min(newTop, canvas.height - wrapper.offsetHeight));

        wrapper.style.left = newLeft + 'px';
        wrapper.style.top = newTop + 'px';

    } else if (resizing && currentHandle) {
        let dx = e.clientX - startX;
        let dy = e.clientY - startY;

        let newWidth = startWidth;
        let newHeight = startHeight;
        let newLeft = wrapper.offsetLeft;
        let newTop = wrapper.offsetTop;

        const minSize = 40;
        
        switch (currentHandle) {
            case 'se':
                newWidth = Math.min(startWidth + dx, canvas.width - newLeft);
                newHeight = Math.min(startHeight + dy, canvas.height - newTop);
                break;

            case 'sw':
                newWidth = Math.min(startWidth - dx, newLeft + startWidth);
                newLeft = newLeft + dx;
                newLeft = Math.max(0, newLeft);
                newWidth = Math.max(minSize, Math.min(newWidth, canvas.width - newLeft));
                newHeight = Math.min(startHeight + dy, canvas.height - newTop);
                break;

            case 'ne':
                newHeight = Math.min(startHeight - dy, newTop + startHeight);
                newTop = newTop + dy;
                newTop = Math.max(0, newTop);
                newHeight = Math.max(minSize, Math.min(newHeight, canvas.height - newTop));
                newWidth = Math.min(startWidth + dx, canvas.width - newLeft);
                break;

            case 'nw':
                newLeft = newLeft + dx;
                newTop = newTop + dy;
                newLeft = Math.max(0, newLeft);
                newTop = Math.max(0, newTop);
                newWidth = Math.min(startWidth - dx, canvas.width - newLeft);
                newHeight = Math.min(startHeight - dy, canvas.height - newTop);
                newWidth = Math.max(minSize, newWidth);
                newHeight = Math.max(minSize, newHeight);
                break;
        }

        wrapper.style.left = newLeft + 'px';
        wrapper.style.top = newTop + 'px';
        wrapper.style.width = newWidth + 'px';
        wrapper.style.height = newHeight + 'px';
    }
};



        document.onmouseup = () => {
            if (!dragging && !resizing) return;

            dragging = false;
            resizing = false;

            // Save final position and size
            const finalX = parseInt(wrapper.style.left || '0');
            const finalY = parseInt(wrapper.style.top || '0');
            const finalW = wrapper.offsetWidth;
            const finalH = wrapper.offsetHeight;

            setImagePosition(inputId, { x: finalX, y: finalY, width: finalW, height: finalH });
            mergeImages();

            overlay.remove();
            document.getElementById('positionHint')?.classList.remove('active');
        };
    };

    // Hide other UI
    const sliderContainer = box.querySelector('.opacity-slider-container');
    if (sliderContainer) sliderContainer.style.display = 'none';
    const mergeMenu = box.querySelector('.merge-methods-container');
    if (mergeMenu) mergeMenu.style.display = 'none';
    const mergeSlider = box.querySelector('.merge-slider-container');
    if (mergeSlider) mergeSlider.classList.add('hidden');
}


function setupEditUI() {
    document.addEventListener('click', (e) => {
        document.querySelectorAll('.edit-menu.show').forEach(menu => {
            const isEditBtn = e.target.classList.contains('edit-btn');
            const isInsideMenu = menu.contains(e.target);

            if (!isInsideMenu && !isEditBtn) {
                menu.classList.remove('show');

                const slider = menu.querySelector('.opacity-slider-container');
                if (slider) slider.style.display = 'none';

                const mergeMenu = menu.querySelector('.merge-methods-container');
                if (mergeMenu) mergeMenu.style.display = 'none';

                const mergeSlider = menu.querySelector('.merge-slider-container');
                if (mergeSlider) mergeSlider.classList.add('hidden');
            }
        });
    });
}

export {
    toggleEditMenu,
    setupMoreOptionsToggle,
    editOpacity,
    editMerging,
    editPosition,
    setupEditUI
};
