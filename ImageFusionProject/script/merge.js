import { getImageOpacities, getImagePositions, resetImagePositions  } from './state.js';
import { avg } from './utils.js';

function mergeImages() {
    const fileInputs = Array.from(document.querySelectorAll('.upload-box input[type="file"]'));
    const files = fileInputs.map(input => input.files[0]).filter(Boolean);

    const methodSelect = document.getElementById('fusionMethod');
    const method = methodSelect?.value || 'average';
    const resizeOption = document.querySelector('input[name="resizeOption"]:checked')?.value;
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const loading = document.getElementById('loadingOverlay');
    loading.style.display = 'flex';

    // Disable weighted if more than 2 images
    const weightedOption = methodSelect.querySelector('option[value="weighted"]');
    if (files.length > 2) {
        weightedOption.disabled = true;
        weightedOption.title = "Disabled: Weighted fusion works only with 2 images.";
        if (method === 'weighted') {
            methodSelect.value = 'average';
        }
        document.getElementById('weightSliderContainer').style.display = 'none';
    } else {
        weightedOption.disabled = false;
        weightedOption.title = "";
        if (methodSelect.value === 'weighted') {
            document.getElementById('weightSliderContainer').style.display = 'block';
        }
    }

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
        } else if (resizeOption !== 'stretch') {
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

        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            const inputId = fileInputs[i].id;
            const opacity = getImageOpacities()[inputId] ?? 1;

            tempCtx.clearRect(0, 0, width, height);
            tempCtx.globalAlpha = opacity;

            const pos = getImagePositions()[inputId];
            if (pos) {
                tempCtx.drawImage(img, pos.x, pos.y, pos.width, pos.height);
            } else {
                tempCtx.drawImage(img, 0, 0, width, height);
            }

            tempCtx.globalAlpha = 1;
            buffers.push(tempCtx.getImageData(0, 0, width, height).data);
        }

        for (let i = 0; i < result.data.length; i += 4) {
            const r = [], g = [], b = [];
            for (const buf of buffers) {
                r.push(buf[i]);
                g.push(buf[i + 1]);
                b.push(buf[i + 2]);
            }

            switch (methodSelect.value) {
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


function setupFusionControls() {
    const methodSelect = document.getElementById('fusionMethod');
    const sliderContainer = document.getElementById('weightSliderContainer');
    const slider = document.getElementById('weightSlider');
    const sliderValue = document.getElementById('weightValue');

    if (!methodSelect || !slider || !sliderValue || !sliderContainer) return;

    methodSelect.addEventListener('change', () => {
        resetImagePositions();

        sliderContainer.style.display = methodSelect.value === 'weighted' ? 'block' : 'none';

        mergeImages();
    });


    slider.addEventListener('input', () => {
        sliderValue.textContent = `${slider.value}%`;
        mergeImages();
    });

    document.querySelectorAll('input[name="resizeOption"]').forEach(r =>
        r.addEventListener('change', mergeImages)
    );
}



export { mergeImages, setupFusionControls };
