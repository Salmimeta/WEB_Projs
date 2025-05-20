import { mergeImages } from './merge.js';
import { getImageOpacities, getImageMergingMethods } from './state.js';

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

    // Toggle/menu logic
    const isVisible = sliderContainer.style.display === 'block';
    sliderContainer.style.display = isVisible ? 'none' : 'block';
    const mergeMenu = box.querySelector('.merge-methods-container');
    if (mergeMenu) mergeMenu.style.display = 'none';


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

    // Hide the opacity slider if open
    const sliderContainer = box.querySelector('.opacity-slider-container');
    if (sliderContainer) sliderContainer.style.display = 'none';

    // Toggle merge methods menu
    const mergeMenu = box.querySelector('.merge-methods-container');
    const isVisible = mergeMenu.style.display === 'block';
    mergeMenu.style.display = isVisible ? 'none' : 'block';

    // Rebind method buttons each time
    mergeMenu.querySelectorAll('button[data-method]').forEach(btn => {
        btn.onclick = () => {
            const method = btn.getAttribute('data-method');
            const map = getImageMergingMethods();
            map[inputId] = method;
            mergeImages();
            mergeMenu.style.display = 'none'; // hide after selection
        };
    });
}


function editPosition(inputId) {
    const input = document.getElementById(inputId);
    const box = input.closest('.upload-box'); // ✅ keep only this
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const img = new Image();
    img.src = box.style.backgroundImage.slice(5, -2); // remove url("...")

    img.onload = () => {
        let dragging = false;
        let startX = 0, startY = 0;
        let imgX = 100, imgY = 100; // default position
        let imgW = img.width, imgH = img.height;

        const redraw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, imgX, imgY, imgW, imgH);
        };

        const onMouseDown = (e) => {
            dragging = true;
            startX = e.offsetX - imgX;
            startY = e.offsetY - imgY;
        };

        const onMouseMove = (e) => {
            if (!dragging) return;
            imgX = e.offsetX - startX;
            imgY = e.offsetY - startY;
            redraw();
        };

        const onMouseUp = () => {
            dragging = false;
            setImagePosition(inputId, { x: imgX, y: imgY, width: imgW, height: imgH });

            canvas.removeEventListener('mousedown', onMouseDown);
            canvas.removeEventListener('mousemove', onMouseMove);
            canvas.removeEventListener('mouseup', onMouseUp);
        };

        canvas.addEventListener('mousedown', onMouseDown);
        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('mouseup', onMouseUp);

        redraw(); // draw the image at initial position
    };

    // Hide the opacity slider/ merge methods menu if open
    const sliderContainer = box.querySelector('.opacity-slider-container');
    if (sliderContainer) sliderContainer.style.display = 'none';
    const mergeMenu = box.querySelector('.merge-methods-container');
    if (mergeMenu) mergeMenu.style.display = 'none';

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
            }
        });
    });
}





export { toggleEditMenu, setupMoreOptionsToggle, editOpacity, editMerging, editPosition, setupEditUI };
