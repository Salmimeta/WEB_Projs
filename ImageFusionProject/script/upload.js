import { formatFileType, truncateFileName } from "./utils.js";
import { mergeImages } from './merge.js';
import { getImageOpacities, getImageIndex, setImageIndex } from './state.js';
import { toggleEditMenu, editPosition, editOpacity, editMerging } from './editMenu.js';




function createUploadBox() {
    const uploadSection = document.querySelector('.upload-section');
    const currentIndex = getImageIndex();
    const boxId = `drop${currentIndex}`;
    const inputId = `image${currentIndex}`;

    const newBox = document.createElement('div');
    newBox.className = 'upload-box';
    newBox.id = boxId;

    newBox.innerHTML = `
    <input type="file" id="${inputId}" accept="image/*" />
    <button class="edit-btn">⋮</button>
    <div class="edit-menu">
        <button class="remove-btn">❌ Remove</button>
        <button class="edit-position-btn">🎯 Position</button>
        <button class="edit-opacity-btn">💧 Opacity</button>
        <div class="opacity-slider-container" style="display: none;">
            <input type="range" min="0" max="1" step="0.01" value="1" class="opacity-slider" />
        </div>
        <button class="edit-merge-btn">🔀 Merging</button>
        <div class="merge-methods-container" style="display: none;">
            <button data-method="average">🟡 Average</button>
            <button data-method="lighten">🔆 Lighten</button>
            <button data-method="darken">🌑 Darken</button>
            <button data-method="weighted">⚖️ Weighted</button>
        </div>

        
    </div>

    <div class="file-info">
        <span class="file-type" id="${inputId}-type"></span>
        <span class="file-name" id="${inputId}-name"></span>
    </div>
    `;

    uploadSection.appendChild(newBox);

    // Bind Edit Menu Buttons
    const editBtn = newBox.querySelector('.edit-btn');
    editBtn.addEventListener('click', () =>
        toggleEditMenu(editBtn)
    );
    newBox.querySelector('.remove-btn').addEventListener('click', () => clearImage(inputId, boxId));
    newBox.querySelector('.edit-position-btn').addEventListener('click', () => editPosition(inputId));
    newBox.querySelector('.edit-opacity-btn').addEventListener('click', () => editOpacity(inputId));
    newBox.querySelector('.edit-merge-btn').addEventListener('click', () => editMerging(inputId));

    newBox.classList.add('fade-in');
    setTimeout(() => newBox.classList.remove('fade-in'), 300);

    // select file
    const input = newBox.querySelector('input');
    input.addEventListener('change', () => {
        getImageOpacities()[inputId] = 1;
        previewImage(inputId, boxId);
        mergeImages();
    });

    // Drag-and-drop
    newBox.addEventListener('dragover', e => {
        e.preventDefault();
        newBox.classList.add('dragover');
    });
    newBox.addEventListener('dragleave', () => newBox.classList.remove('dragover'));
    newBox.addEventListener('drop', e => {
        e.preventDefault();
        newBox.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            input.files = e.dataTransfer.files;
            previewImage(inputId, boxId);
            mergeImages();
        }
    });
    setImageIndex(currentIndex + 1);
}

function previewImage(inputId, boxId) {
    const input = document.getElementById(inputId);
    const box = document.getElementById(boxId);
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = e => {
            box.style.backgroundImage = `url('${e.target.result}')`;
            box.classList.add('has-image');
            input.disabled = true;
            box.querySelector('.edit-btn').style.display = 'block';
            console.log('Edit button bound')

            document.getElementById(`${inputId}-type`).textContent = formatFileType(file);
            document.getElementById(`${inputId}-name`).textContent = truncateFileName(file.name);

            setTimeout(() => {
                const allBoxes = document.querySelectorAll('.upload-box');
                const filled = Array.from(allBoxes).filter(b => b.classList.contains('has-image'));
                if (filled.length === allBoxes.length) createUploadBox();
            }, 0);
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function clearImage(inputId, boxId) {
    if (!confirm("Are you sure you want to remove this image?")) return;
    const input = document.getElementById(inputId);
    const box = document.getElementById(boxId);
    input.value = '';
    box.style.backgroundImage = '';
    box.classList.remove('has-image');
    input.disabled = false;
    box.querySelector('.edit-btn').style.display = 'none';
    document.getElementById(`${inputId}-type`).textContent = '';
    document.getElementById(`${inputId}-name`).textContent = '';
    if (document.querySelectorAll('.upload-box').length > 1) box.remove();
    mergeImages();
}


export { createUploadBox };
