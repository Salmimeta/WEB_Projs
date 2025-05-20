function avg(arr) {
  return Math.floor(arr.reduce((a, b) => a + b, 0) / arr.length);
}


function formatFileType(file) {
  return file.type.split('/')[1]?.toUpperCase() || '';
}


function truncateFileName(name, maxLength = 20) {
  return name.length > maxLength ? name.slice(0, maxLength - 3) + '...' : name;
}


function setupReloadWarning() {
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
}

export { avg, formatFileType, truncateFileName, setupReloadWarning };