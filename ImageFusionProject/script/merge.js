import {
  getImageOpacities,
  getImagePositions,
  getImageMergingMethods,
  getImageWeights,
} from './state.js';

import { resetImageState, saveStateSnapshot } from './utils.js';

let canvasBgColor = 'black'; // default

function mergeImages() {
  saveStateSnapshot();

  const fileInputs = Array.from(document.querySelectorAll('.upload-box input[type="file"]'));
  const files = fileInputs.map(input => input.files[0]).filter(Boolean);

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const loading = document.getElementById('loadingOverlay');
  loading.style.display = 'flex';

  if (files.length === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById('downloadBtn').disabled = true;
    loading.style.display = 'none';
    return;
  }

  const imageElements = [];
  let loaded = 0;

  files.forEach((file, i) => {
    const img = new Image();
    img.onload = () => {
      imageElements[i] = img;
      if (++loaded === files.length) drawMergedImage(imageElements);
    };
    img.src = URL.createObjectURL(file);
  });

  function drawMergedImage(images) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const resizeOption = document.querySelector('input[name="resizeOption"]:checked')?.value;

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
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    tempCanvas.width = width;
    tempCanvas.height = height;

    let baseImageData = ctx.createImageData(width, height);
    const fileMap = fileInputs.map(input => input.id);

    for (let i = 0; i < images.length; i++) {
      const inputId = fileMap[i];
      const method = getImageMergingMethods()[inputId] ?? 'average';
      const pos = getImagePositions()[inputId];
      const opacity = getImageOpacities()[inputId] ?? 1;

      if (method === 'weighted') continue; // handle after base

      tempCtx.clearRect(0, 0, width, height);
      tempCtx.globalAlpha = opacity;

      const img = images[i];
      if (pos) {
        tempCtx.drawImage(img, pos.x, pos.y, pos.width, pos.height);
      } else {
        tempCtx.drawImage(img, 0, 0, width, height);
      }

      tempCtx.globalAlpha = 1;
      const imgData = tempCtx.getImageData(0, 0, width, height).data;

      for (let p = 0; p < baseImageData.data.length; p += 4) {
        if (method === 'average') {
          baseImageData.data[p] += imgData[p] / images.length;
          baseImageData.data[p + 1] += imgData[p + 1] / images.length;
          baseImageData.data[p + 2] += imgData[p + 2] / images.length;
        } else if (method === 'lighten') {
          baseImageData.data[p] = Math.max(baseImageData.data[p], imgData[p]);
          baseImageData.data[p + 1] = Math.max(baseImageData.data[p + 1], imgData[p + 1]);
          baseImageData.data[p + 2] = Math.max(baseImageData.data[p + 2], imgData[p + 2]);
        } else if (method === 'darken') {
          baseImageData.data[p] = Math.min(baseImageData.data[p], imgData[p]);
          baseImageData.data[p + 1] = Math.min(baseImageData.data[p + 1], imgData[p + 1]);
          baseImageData.data[p + 2] = Math.min(baseImageData.data[p + 2], imgData[p + 2]);
        }

        if (imgData[p + 3] > 0) {
          baseImageData.data[p + 3] = 255;
        }
      }

    }

    // Handle weighted overlays now
    for (let i = 0; i < images.length; i++) {
      const inputId = fileMap[i];
      const method = getImageMergingMethods()[inputId];
      if (method !== 'weighted') continue;

      const img = images[i];
      const pos = getImagePositions()[inputId];
      const opacity = getImageOpacities()[inputId] ?? 1;
      const weight = getImageWeights()[inputId] ?? 0.5;

      tempCtx.clearRect(0, 0, width, height);
      tempCtx.globalAlpha = opacity;

      if (pos) {
        tempCtx.drawImage(img, pos.x, pos.y, pos.width, pos.height);
      } else {
        tempCtx.drawImage(img, 0, 0, width, height);
      }

      const overlayData = tempCtx.getImageData(0, 0, width, height).data;

      for (let p = 0; p < baseImageData.data.length; p += 4) {
        baseImageData.data[p] = Math.floor(baseImageData.data[p] * (1 - weight) + overlayData[p] * weight);
        baseImageData.data[p + 1] = Math.floor(baseImageData.data[p + 1] * (1 - weight) + overlayData[p + 1] * weight);
        baseImageData.data[p + 2] = Math.floor(baseImageData.data[p + 2] * (1 - weight) + overlayData[p + 2] * weight);
        baseImageData.data[p + 3] = 255;
      }
    }

    ctx.fillStyle = canvasBgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Draw background first
    ctx.putImageData(baseImageData, 0, 0);           // Then draw image data on top

    document.getElementById('downloadBtn').disabled = false;
    loading.style.display = 'none';
  }
}

function setupFusionControls() {
  document.getElementById('toggleBgColorBtn')?.addEventListener('click', () => {
    canvasBgColor = canvasBgColor === 'black' ? 'white' : 'black';
    mergeImages(); // re-render with new background
  });

  document.querySelectorAll('input[name="resizeOption"]').forEach(r =>
    r.addEventListener('change', mergeImages)
  );

  const methodSelect = document.getElementById('fusionMethod');
  const sliderContainer = document.getElementById('weightSliderContainer');
  const slider = document.getElementById('weightSlider');
  const sliderValue = document.getElementById('weightValue');

  if (methodSelect && slider && sliderValue && sliderContainer) {
    methodSelect.addEventListener('change', () => {
      sliderContainer.style.display = methodSelect.value === 'weighted' ? 'block' : 'none';
      mergeImages();
    });

    slider.addEventListener('input', () => {
      sliderValue.textContent = `${slider.value}%`;
      mergeImages();
    });
  }
}

function resetAllImages() {
  document.getElementById('resetBtn')?.addEventListener('click', resetAllImages);
  const inputs = document.querySelectorAll('.upload-box input[type="file"]');
  saveStateSnapshot();
  inputs.forEach(input => {
    const inputId = input.id;
    resetImageState(inputId);
  });

  mergeImages(); // redraw canvas using default state
}



export { mergeImages, setupFusionControls, resetAllImages };
