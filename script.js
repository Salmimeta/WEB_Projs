// === IMAGE FUSION TOOL SCRIPT ===

let imageIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    // === Warn before page reload ===
    window.addEventListener('beforeunload', (e) => {
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

        const hasContent = [...pixels].some((_, i) => i % 4 === 3 && pixels[i] !== 0);
        if (hasContent) {
            e.preventDefault();
            e.returnValue = ''; // required for some browsers
        }
    });


    // === DARK MODE TOGGLE ===
    const toggle = document.getElementById('darkModeToggle');
    const applyTheme = (isDark, save = true) => {
        document.body.classList.add('fade-theme');
        document.body.classList.toggle('dark', isDark);
        toggle.checked = isDark;
        if (save) localStorage.setItem('theme', isDark ? 'dark' : 'light');
        setTimeout(() => document.body.classList.remove('fade-theme'), 500);
    };
    const savedTheme = localStorage.getItem('theme');
    applyTheme(savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches, false);
    toggle.addEventListener('change', () => applyTheme(toggle.checked));
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) applyTheme(e.matches, false);
    });

    // === TOGGLE MORE OPTIONS PANEL ===
    const toggleBtn = document.getElementById('toggleMoreBtn');
    const moreOptions = document.getElementById('moreOptions');
    toggleBtn.addEventListener('click', () => {
        const expanded = moreOptions.classList.toggle('visible');
        toggleBtn.textContent = expanded ? 'Less Options ↑' : 'More Options ↓';
    });

    // === OPTION CHANGE LISTENERS ===
    document.getElementById('fusionMethod')?.addEventListener('change', mergeImages);
    document.querySelectorAll('input[name="resizeOption"]').forEach(r =>
        r.addEventListener('change', mergeImages)
    );

    const methodSelect = document.getElementById('fusionMethod');
    const sliderContainer = document.getElementById('weightSliderContainer');
    const slider = document.getElementById('weightSlider');
    const sliderValue = document.getElementById('weightValue');

    methodSelect.addEventListener('change', () => {
        mergeImages(); // re-fuse immediately
        if (methodSelect.value === 'weighted') {
            sliderContainer.style.display = 'block';
        } else {
            sliderContainer.style.display = 'none';
        }
    });

    slider.addEventListener('input', () => {
        sliderValue.textContent = `${slider.value}%`;
        mergeImages();
    });


    // === CLEAR BUTTON ===
    document.getElementById('clearCanvasBtn')?.addEventListener('click', () => {
        if (!confirm("Are you sure you want to reset everything?")) return;
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        document.getElementById('downloadBtn').disabled = true;
        document.querySelector('.upload-section').innerHTML = '';
        imageIndex = 0;
        createUploadBox();

        const stretchRadio = document.querySelector('input[name="resizeOption"][value="stretch"]');
        if (stretchRadio) stretchRadio.checked = true;

        const fusionSelect = document.getElementById('fusionMethod');
        if (fusionSelect) fusionSelect.value = 'average';

        moreOptions.classList.remove('visible');
        toggleBtn.textContent = 'More Options ↓';
    });

    // === INITIAL UPLOAD BOX ===
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
            document.getElementById(`${inputId}-name`).textContent = file.name.length > 20
                ? file.name.slice(0, 17) + '...'
                : file.name;

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

    const boxes = document.querySelectorAll('.upload-box');
    if (boxes.length > 1) box.remove();
    mergeImages();
}

function mergeImages() {
    const inputs = document.querySelectorAll('.upload-box input[type="file"]');
    const files = Array.from(inputs).map(input => input.files[0]).filter(Boolean);
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
        let width = Math.max(...images.map(img => img.width));
        let height = Math.max(...images.map(img => img.height));

        if (resizeOption === 'preserve') {
            width = Math.min(...images.map(img => img.width));
            height = Math.min(...images.map(img => img.height));
        } else if (resizeOption === 'none') {
            width = images[0].width;
            height = images[0].height;
        }

        canvas.width = width;
        canvas.height = height;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');

        const result = ctx.createImageData(width, height);
        const buffers = [];

        for (const img of images) {
            tempCtx.clearRect(0, 0, width, height);
            tempCtx.drawImage(img, 0, 0, width, height);
            buffers.push(tempCtx.getImageData(0, 0, width, height).data);
        }

        for (let i = 0; i < result.data.length; i += 4) {
            let rVals = [], gVals = [], bVals = [];
            for (const buf of buffers) {
                rVals.push(buf[i]);
                gVals.push(buf[i + 1]);
                bVals.push(buf[i + 2]);
            }

            let r, g, b;
            switch (method) {
                case 'lighten':
                    r = Math.max(...rVals); g = Math.max(...gVals); b = Math.max(...bVals);
                    break;
                case 'darken':
                    r = Math.min(...rVals); g = Math.min(...gVals); b = Math.min(...bVals);
                    break;
                case 'weighted':
                    const w = parseFloat(document.getElementById('weightSlider').value) / 100;
                    r = Math.floor(rVals[0] * w + rVals[1] * (1 - w));
                    g = Math.floor(gVals[0] * w + gVals[1] * (1 - w));
                    b = Math.floor(bVals[0] * w + bVals[1] * (1 - w));
                    break;
                default:
                    r = avg(rVals); g = avg(gVals); b = avg(bVals);
            }

        }

        result.data[i] = r;
        result.data[i + 1] = g;
        result.data[i + 2] = b;
        result.data[i + 3] = 255;
    }

    ctx.putImageData(result, 0, 0);
    loading.style.display = 'none';
    document.getElementById('downloadBtn').disabled = false;
}

function avg(arr) {
    return Math.floor(arr.reduce((a, b) => a + b, 0) / arr.length);
}
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
