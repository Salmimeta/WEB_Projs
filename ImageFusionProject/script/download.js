// === download.js ===
import { createUploadBox } from './upload.js';
import { truncateFileName } from './utils.js';
import { setImageIndex } from './state.js';

function setupDownloadHandler() {
  const downloadBtn = document.getElementById('downloadBtn');
  downloadBtn.addEventListener('click', () => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    const hasContent = [...data].some((_, i) => i % 4 === 3 && data[i] !== 0);
    if (!hasContent) {
      alert("There's nothing to download.");
      return;
    }

    const link = document.createElement('a');
    link.download = `fusion_${truncateFileName(Date.now().toString())}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    alert("Image downloaded!");
  });
}


function setupResetButton() {
  const clearBtn = document.getElementById('clearCanvasBtn');
  const toggleBtn = document.getElementById('toggleMoreBtn');
  const moreOptions = document.getElementById('moreOptions');

  clearBtn.addEventListener('click', () => {
    if (!confirm("Are you sure you want to reset everything?")) return;

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    document.getElementById('downloadBtn').disabled = true;
    document.querySelector('.upload-section').innerHTML = '';

    setImageIndex(0); // Reset the image index to 0
    createUploadBox();

    document.querySelector('input[name="resizeOption"][value="stretch"]').checked = true;
    // document.getElementById('fusionMethod').value = 'average';

    moreOptions.classList.remove('visible');
    toggleBtn.textContent = 'More Options ↓';
  });
}


export { setupDownloadHandler, setupResetButton };