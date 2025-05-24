import { mergeImages } from './merge.js';
import {
    getImageOpacities,
    getImageMergingMethods,
    getImageWeights,
    getImagePositions,
    setImageWeight,
    setImagePosition, 
    setImageOpacity
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
            saveStateSnapshot();
            setImageOpacity(inputId, val);
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
            saveStateSnapshot();
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
                    saveStateSnapshot();
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
        Object.assign(overlay.style, {
            position: 'absolute',
            top: canvas.offsetTop + 'px',
            left: canvas.offsetLeft + 'px',
            width: canvas.width + 'px',
            height: canvas.height + 'px',
            zIndex: '9999',
            pointerEvents: 'auto'
        });
        document.body.appendChild(overlay);

        document.getElementById('positionHint')?.classList.add('active');

        const existing = getImagePositions()[inputId];
        const wrapper = document.createElement('div');
        Object.assign(wrapper.style, {
            position: 'absolute',
            top: (existing?.y ?? 50) + 'px',
            left: (existing?.x ?? 50) + 'px',
            width: (existing?.width ?? img.width) + 'px',
            height: (existing?.height ?? img.height) + 'px',
            pointerEvents: 'auto',
            zIndex: '10000'
        });
        overlay.appendChild(wrapper);

        const imgEl = document.createElement('img');
        imgEl.src = img.src;
        Object.assign(imgEl.style, {
            position: 'absolute',
            width: '100%',
            height: '100%',
            cursor: 'move',
            userSelect: 'none',
            pointerEvents: 'auto'
        });
        wrapper.appendChild(imgEl);

        ['nw', 'ne', 'sw', 'se'].forEach(dir => {
            const handle = document.createElement('div');
            handle.className = `resize-handle ${dir}`;
            wrapper.appendChild(handle);
        });

        let dragging = false;
        let resizing = false;
        let currentHandle = null;
        let startX, startY, startWidth, startHeight, startLeft, startTop;

        wrapper.onmousedown = (e) => {
            if (e.target.classList.contains('resize-handle')) return;
            dragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = wrapper.offsetLeft;
            startTop = wrapper.offsetTop;
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
                startLeft = wrapper.offsetLeft;
                startTop = wrapper.offsetTop;
            };
        });

        document.onmousemove = (e) => {
            if (dragging) {
                let newLeft = e.clientX - (startX - startLeft);
                let newTop = e.clientY - (startY - startTop);

                newLeft = Math.max(0, Math.min(newLeft, canvas.width - wrapper.offsetWidth));
                newTop = Math.max(0, Math.min(newTop, canvas.height - wrapper.offsetHeight));

                wrapper.style.left = `${newLeft}px`;
                wrapper.style.top = `${newTop}px`;
            } else if (resizing && currentHandle) {
                let dx = e.clientX - startX;
                let dy = e.clientY - startY;
                let newWidth = startWidth;
                let newHeight = startHeight;

                if (currentHandle === 'se') {
                    newWidth += dx;
                    newHeight += dy;
                } else if (currentHandle === 'sw') {
                    newWidth -= dx;
                    wrapper.style.left = `${startLeft + dx}px`;
                } else if (currentHandle === 'ne') {
                    newHeight -= dy;
                    wrapper.style.top = `${startTop + dy}px`;
                    newWidth += dx;
                } else if (currentHandle === 'nw') {
                    newWidth -= dx;
                    newHeight -= dy;
                    wrapper.style.left = `${startLeft + dx}px`;
                    wrapper.style.top = `${startTop + dy}px`;
                }

                newWidth = Math.max(40, Math.min(newWidth, canvas.width - wrapper.offsetLeft));
                newHeight = Math.max(40, Math.min(newHeight, canvas.height - wrapper.offsetTop));

                wrapper.style.width = `${newWidth}px`;
                wrapper.style.height = `${newHeight}px`;
            }
        };

        document.onmouseup = () => {
            dragging = false;
            resizing = false;
        };

        const outsideClickHandler = (e) => {
            if (!overlay.contains(e.target)) {
                const finalX = parseInt(wrapper.style.left || '0');
                const finalY = parseInt(wrapper.style.top || '0');
                const finalW = wrapper.offsetWidth;
                const finalH = wrapper.offsetHeight;

                saveStateSnapshot();
                setImagePosition(inputId, { x: finalX, y: finalY, width: finalW, height: finalH });
                mergeImages();

                overlay.remove();
                document.getElementById('positionHint')?.classList.remove('active');
                document.removeEventListener('click', outsideClickHandler);
            }
        };
        document.addEventListener('click', outsideClickHandler);
    };

    // Hide other UI
    box.querySelector('.opacity-slider-container')?.style.setProperty('display', 'none');
    box.querySelector('.merge-methods-container')?.style.setProperty('display', 'none');
    box.querySelector('.merge-slider-container')?.classList.add('hidden');
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
