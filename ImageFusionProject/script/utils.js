import { imageOpacities, imagePositions, imageMergingMethods, imageWeights } from './state.js';

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

function resetImageState(id) {
  delete imageOpacities[id];
  delete imagePositions[id];
  delete imageMergingMethods[id];
  delete imageWeights[id];
}

const history = [];
let historyIndex = -1;

function saveStateSnapshot() {
  history.splice(historyIndex + 1);
  history.push(JSON.stringify({
    opacities: { ...imageOpacities },
    positions: { ...imagePositions },
    methods: { ...imageMergingMethods },
    weights: { ...imageWeights }
  }));
  historyIndex++;
}

function undoState() {
  if (historyIndex > 0) {
    historyIndex--;
    loadStateSnapshot(history[historyIndex]);
  }
}

function redoState() {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    loadStateSnapshot(history[historyIndex]);
  }
}

function loadStateSnapshot(json) {
  const snapshot = JSON.parse(json);
  Object.assign(imageOpacities, snapshot.opacities);
  Object.assign(imagePositions, snapshot.positions);
  Object.assign(imageMergingMethods, snapshot.methods);
  Object.assign(imageWeights, snapshot.weights);
}


export { avg, formatFileType, truncateFileName, setupReloadWarning, resetImageState, saveStateSnapshot, undoState, redoState };