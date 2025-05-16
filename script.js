// === IMAGE FUSION TOOL SCRIPT ===

let imageIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    // === Warn before reload if canvas has content ===
    window.addEventListener('beforeunload', (e) => {
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const hasContent = [...pixels].some((_, i) => i % 4 === 3 && pixels[i] !== 0);
        if (hasContent) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    // === Dark Mode Toggle ===
    const toggle = document.getElementById('darkModeToggle');
    const applyTheme = (isDark, save = true) => {
        document.body.classList.add('fade-theme');
        document.body.classList.toggle('dark', isDark);
        toggle.checked = isDark;
        if (save) localStorage.setItem('theme', isDark ? 'dark' : 'light');
        setTimeout(() => document.body.classList.remove('fade-theme'), 500);
    };
    applyTheme(localStorage.getItem('theme') === 'dark' || window.matchMedia('(prefers-color-scheme: dark)').matches);
    toggle.addEventListener('change', () => applyTheme(toggle.checked));
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) applyTheme(e.matches, false);
    });

    // === More Options Toggle ===
    const toggleBtn = document.getElementById('toggleMoreBtn');
    const moreOptions = document.getElementById('moreOptions');
    toggleBtn.addEventListener('click', () => {
        const expanded = moreOptions.classList.toggle('visible');
        toggleBtn.textContent = expanded ? 'Less Options ↑' : 'More Options ↓';
    });

    // === Method Select & Slider
    const methodSelect = document.getElementById('fusionMethod');
    const sliderContainer = document.getElementById('weightSliderContainer');
    const slider = document.getElementById('weightSlider');
    const sliderValue = document.getElementById('weightValue');

    methodSelect.addEventListener('change', () => {
        mergeImages();
        sliderContainer.style.display = methodSelect.value === 'weighted' ? 'block' : 'none';
    });

    slider.addEventListener('input', () => {
        sliderValue.textContent = `${slider.value}%`;
        mergeImages();
    });

    document.querySelectorAll('input[name="resizeOption"]').forEach(r =>
        r.addEventListener('change', mergeImages)
    );

    // === Clear All
    document.getElementById('clearCanvasBtn').addEventListener('click', () => {
        if (!confirm("Are you sure you want to reset everything?")) return;
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        document.getElementById('downloadBtn').disabled = true;
        document.querySelector('.upload-section').innerHTML = '';
        imageIndex = 0;
        createUploadBox();
        document.querySelector('input[name="resizeOption"][value="stretch"]').checked = true;
        methodSelect.value = 'average';
        moreOptions.classList.remove('visible');
        toggleBtn.textContent = 'More Options ↓';
    });

    // === First Upload Box
    createUploadBox();
});

function createUploadBox() {
    const uploadSection = document.querySelector('.upload-section');
    const boxId = `drop${imageIndex}`;
    const inputId = `image${imageIndex}`;

    const newBox = document.createElement('div');
    newBox.className = 'upload-box';
    newBox.id = boxId;
    newBox.innerHTML = `
        <input type="file" id="${inputId}" accept="image/*" />
        <span class="remove-btn" onclick="clearImage('${inputId}', '${boxId}')">×</span>
        <div class="file-info">
            <span class="file-type" id="${inputId}-type"></span>
            <span class="file-name" id="${inputId}-name"></span>
        </div>
    `;
    uploadSection.appendChild(newBox);

    const input = newBox.querySelector('input');
    input.addEventListener('change', () => {
        previewImage(inputId, boxId);
        mergeImages();
    });

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

    imageIndex++;
}

function previewImage(inputId, boxId) {
    const input = document.getElementById(inputId);
    const box = document.getElementById(boxId);
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
            box.style.backgroundImage = `url('${e.target.result}')`;
            box.classList.add('has-image');
            input.disabled = true;

            const file = input.files[0];
            document.getElementById(`${inputId}-type`).textContent = file.type.split('/')[1]?.toUpperCase() || '';
            document.getElementById(`${inputId}-name`).textContent =
                file.name.length > 20 ? file.name.slice(0, 17) + '...' : file.name;

            setTimeout(() => {
                const allBoxes = document.querySelectorAll('.upload-box');
                const filled = Array.from(allBoxes).filter(b => b.classList.contains('has-image'));
                if (filled.length === allBoxes.length) {
                    createUploadBox();
                }
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
    document.getElementById(`${inputId}-type`).textContent = '';
    document.getElementById(`${inputId}-name`).textContent = '';
    if (document.querySelectorAll('.upload-box').length > 1) box.remove();
    mergeImages();
}

function mergeImages() {
    const inputs = document.querySelectorAll('.upload-box input[type="file"]');
    const files = Array.from(inputs).map(i => i.files[0]).filter(Boolean);
    const method = document.getElementById('fusionMethod')?.value || 'average';
    const resizeOption = document.querySelector('input[name="resizeOption"]:checked')?.value;
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const loading = document.getElementById('loadingOverlay');
    loading.style.display = 'flex';

    if (files.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        document.getElementById('downloadBtn').disabled = true;
        loading.style.display = 'none';
        return;
    }

    let images = [], loaded = 0;
    files.forEach((file, i) => {
        const img = new Image();
        img.onload = () => {
            images[i] = img;
            if (++loaded === files.length) drawMergedImage(images);
        };
        img.src = URL.createObjectURL(file);
    });

    function drawMergedImage(images) {
        let width = images[0].width, height = images[0].height;
        if (resizeOption === 'preserve') {
            width = Math.min(...images.map(i => i.width));
            height = Math.min(...images.map(i => i.height));
        } else if (resizeOption !== 'none') {
            width = Math.max(...images.map(i => i.width));
            height = Math.max(...images.map(i => i.height));
        }

        canvas.width = width;
        canvas.height = height;

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = width;
        tempCanvas.height = height;

        const result = ctx.createImageData(width, height);
        const buffers = [];

        for (const img of images) {
            tempCtx.clearRect(0, 0, width, height);
            tempCtx.drawImage(img, 0, 0, width, height);
            buffers.push(tempCtx.getImageData(0, 0, width, height).data);
        }

        for (let i = 0; i < result.data.length; i += 4) {
            const r = [], g = [], b = [];
            for (const buf of buffers) {
                r.push(buf[i]);
                g.push(buf[i + 1]);
                b.push(buf[i + 2]);
            }

            switch (method) {
                case 'lighten':
                    result.data[i] = Math.max(...r);
                    result.data[i + 1] = Math.max(...g);
                    result.data[i + 2] = Math.max(...b);
                    break;
                case 'darken':
                    result.data[i] = Math.min(...r);
                    result.data[i + 1] = Math.min(...g);
                    result.data[i + 2] = Math.min(...b);
                    break;
                case 'weighted':
                    const w = parseFloat(document.getElementById('weightSlider').value) / 100;
                    result.data[i] = Math.floor(r[0] * w + r[1] * (1 - w));
                    result.data[i + 1] = Math.floor(g[0] * w + g[1] * (1 - w));
                    result.data[i + 2] = Math.floor(b[0] * w + b[1] * (1 - w));
                    break;
                default:
                    result.data[i] = avg(r);
                    result.data[i + 1] = avg(g);
                    result.data[i + 2] = avg(b);
            }

            result.data[i + 3] = 255;
        }

        ctx.putImageData(result, 0, 0);
        document.getElementById('downloadBtn').disabled = false;
        loading.style.display = 'none';
    }
}

function avg(arr) {
    return Math.floor(arr.reduce((a, b) => a + b, 0) / arr.length);
}

function downloadImage() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    if (![...data].some((_, i) => i % 4 === 3 && data[i] !== 0)) {
        alert("There's nothing to download.");
        return;
    }
    const link = document.createElement('a');
    link.download = 'fused_image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    alert("Image downloaded!");
}
