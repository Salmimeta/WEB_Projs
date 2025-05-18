// === ADVANCED IMAGE FUSION TOOL ===

class ImageFusionTool {
    constructor() {
        this.imageIndex = 0;
        this.history = [];
        this.currentZoom = 1;
        this.maxHistorySteps = 10;
        
        this.initElements();
        this.initEventListeners();
        this.loadSavedTheme();
        this.createUploadBox();
        this.loadSavedImages();
    }
    
    initElements() {
        this.toggle = document.getElementById('darkModeToggle');
        this.toggleBtn = document.getElementById('toggleMoreBtn');
        this.moreOptions = document.getElementById('moreOptions');
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.progressFill = document.querySelector('.progress-fill');
        this.opacitySlider = document.getElementById('opacitySlider');
        this.opacityValue = document.getElementById('opacityValue');
        this.qualitySlider = document.getElementById('qualitySlider');
        this.qualityValue = document.getElementById('qualityValue');
        this.undoBtn = document.getElementById('undoBtn');
        this.zoomInBtn = document.getElementById('zoomInBtn');
        this.zoomOutBtn = document.getElementById('zoomOutBtn');
        this.resetZoomBtn = document.getElementById('resetZoomBtn');
    }
    
    initEventListeners() {
        // Theme toggle
        this.toggle.addEventListener('change', () => this.applyTheme(this.toggle.checked));
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem('theme')) this.applyTheme(e.matches, false);
        });
        
        // Options panel
        this.toggleBtn.addEventListener('click', () => this.toggleOptions());
        
        // Image processing controls
        document.getElementById('fusionMethod')?.addEventListener('change', () => this.mergeImages());
        document.querySelectorAll('input[name="resizeOption"]').forEach(r => {
            r.addEventListener('change', () => this.mergeImages());
        });
        
        // Buttons
        document.getElementById('downloadBtn')?.addEventListener('click', () => this.downloadImage());
        document.getElementById('clearCanvasBtn')?.addEventListener('click', () => this.clearCanvas());
        this.undoBtn.addEventListener('click', () => this.undoLastAction());
        
        // Sliders
        this.opacitySlider.addEventListener('input', () => {
            this.opacityValue.textContent = `${this.opacitySlider.value}%`;
            this.mergeImages();
        });
        
        this.qualitySlider.addEventListener('input', () => {
            this.qualityValue.textContent = `${this.qualitySlider.value}%`;
        });
        
        // Zoom controls
        this.zoomInBtn.addEventListener('click', () => this.adjustZoom(0.1));
        this.zoomOutBtn.addEventListener('click', () => this.adjustZoom(-0.1));
        this.resetZoomBtn.addEventListener('click', () => this.resetZoom());
    }
    
    loadSavedTheme() {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.applyTheme(savedTheme ? savedTheme === 'dark' : prefersDark, false);
    }
    
    applyTheme(isDark, save = true) {
        document.body.classList.add('fade-theme');
        document.body.classList.toggle('dark', isDark);
        this.toggle.checked = isDark;
        if (save) localStorage.setItem('theme', isDark ? 'dark' : 'light');
        setTimeout(() => document.body.classList.remove('fade-theme'), 500);
    }
    
    toggleOptions() {
        const expanded = this.moreOptions.classList.toggle('visible');
        this.toggleBtn.textContent = expanded ? 'Hide Options ↑' : 'Advanced Options ↓';
    }
    
    createUploadBox() {
        const uploadSection = document.querySelector('.upload-section');
        const boxId = `drop${this.imageIndex}`;
        const inputId = `image${this.imageIndex}`;
        
        const newBox = document.createElement('div');
        newBox.className = 'upload-box';
        newBox.id = boxId;
        newBox.innerHTML = `
            <input type="file" id="${inputId}" accept="image/*" />
            <span class="remove-btn" aria-label="Remove image">×</span>
            <div class="file-info">
                <span class="file-type" id="${inputId}-type"></span>
                <span class="file-name" id="${inputId}-name"></span>
            </div>
        `;
        
        uploadSection.appendChild(newBox);
        
        const input = newBox.querySelector('input');
        input.addEventListener('change', () => {
            this.previewImage(inputId, boxId);
            this.mergeImages();
        });
        
        // Drag and drop events
        newBox.addEventListener('dragover', e => {
            e.preventDefault();
            newBox.classList.add('dragover');
        });
        
        newBox.addEventListener('dragleave', () => {
            newBox.classList.remove('dragover');
        });
        
        newBox.addEventListener('drop', e => {
            e.preventDefault();
            newBox.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                input.files = e.dataTransfer.files;
                this.previewImage(inputId, boxId);
                this.mergeImages();
            }
        });
        
        // Remove button event
        newBox.querySelector('.remove-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearImage(inputId, boxId);
        });
        
        this.imageIndex++;
    }
    
    clearImage(inputId, boxId) {
        const confirmClear = confirm("Are you sure you want to remove this image?");
        if (!confirmClear) return;
        
        const input = document.getElementById(inputId);
        const box = document.getElementById(boxId);
        
        input.value = '';
        box.style.backgroundImage = '';
        box.classList.remove('has-image');
        input.disabled = false;
        document.getElementById(`${inputId}-type`).textContent = '';
        document.getElementById(`${inputId}-name`).textContent = '';
        
        // Remove from localStorage
        this.removeImageData(inputId);
        
        const allBoxes = document.querySelectorAll('.upload-box');
        if (allBoxes.length > 1) {
            box.remove();
        }
        
        this.mergeImages();
    }
    
    previewImage(inputId, boxId) {
        const input = document.getElementById(inputId);
        const box = document.getElementById(boxId);
        
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = e => {
                const imageData = e.target.result;
                box.style.backgroundImage = `url('${imageData}')`;
                box.classList.add('has-image');
                input.disabled = true;
                
                const file = input.files[0];
                const typeSpan = document.getElementById(`${inputId}-type`);
                const nameSpan = document.getElementById(`${inputId}-name`);
                typeSpan.textContent = file.type.split('/')[1]?.toUpperCase() || '';
                nameSpan.textContent = file.name.length > 20 ? 
                    file.name.slice(0, 17) + '...' : file.name;
                
                // Save to localStorage
                this.saveImageData(inputId, imageData, file.name);
                
                // Add next upload box if all boxes are filled
                setTimeout(() => {
                    const allBoxes = document.querySelectorAll('.upload-box');
                    const filledBoxes = Array.from(allBoxes).filter(b => b.classList.contains('has-image'));
                    if (filledBoxes.length === allBoxes.length) {
                        this.createUploadBox();
                    }
                }, 0);
            };
            reader.readAsDataURL(input.files[0]);
        }
    }
    
    saveImageData(inputId, dataURL, fileName) {
        let savedImages = JSON.parse(localStorage.getItem('savedImages') || '[]');
        // Remove any existing entry with same inputId
        savedImages = savedImages.filter(img => img.inputId !== inputId);
        savedImages.push({ inputId, dataURL, fileName });
        localStorage.setItem('savedImages', JSON.stringify(savedImages));
    }
    
    removeImageData(inputId) {
        let savedImages = JSON.parse(localStorage.getItem('savedImages') || '[]');
        savedImages = savedImages.filter(img => img.inputId !== inputId);
        localStorage.setItem('savedImages', JSON.stringify(savedImages));
    }
    
    loadSavedImages() {
        const savedImages = JSON.parse(localStorage.getItem('savedImages') || '[]');
        if (savedImages.length === 0) return;
        
        // Clear existing boxes
        const uploadSection = document.querySelector('.upload-section');
        uploadSection.innerHTML = '';
        this.imageIndex = 0;
        
        // Create boxes for saved images
        savedImages.forEach((img, index) => {
            const boxId = `drop${index}`;
            const inputId = `image${index}`;
            
            const newBox = document.createElement('div');
            newBox.className = 'upload-box has-image';
            newBox.id = boxId;
            newBox.style.backgroundImage = `url('${img.dataURL}')`;
            newBox.innerHTML = `
                <input type="file" id="${inputId}" accept="image/*" disabled />
                <span class="remove-btn">×</span>
                <div class="file-info">
                    <span class="file-type" id="${inputId}-type">${img.dataURL.split(';')[0].split('/')[1]?.toUpperCase()}</span>
                    <span class="file-name" id="${inputId}-name">${img.fileName}</span>
                </div>
            `;
            
            uploadSection.appendChild(newBox);
            
            // Set up event listeners
            const input = newBox.querySelector('input');
            newBox.querySelector('.remove-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearImage(inputId, boxId);
            });
            
            // Recreate the File object for the input
            if (img.dataURL) {
                const blob = this.dataURLtoBlob(img.dataURL);
                const file = new File([blob], img.fileName, { type: blob.type });
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                input.files = dataTransfer.files;
            }
            
            this.imageIndex++;
        });
        
        // Add one empty box if all saved images are loaded
        if (savedImages.length > 0) {
            this.createUploadBox();
        }
        
        // Process the loaded images
        this.mergeImages();
    }
    
    dataURLtoBlob(dataURL) {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        
        return new Blob([u8arr], { type: mime });
    }
    
    async mergeImages() {
        const inputs = document.querySelectorAll('.upload-box input[type="file"]');
        const files = Array.from(inputs).map(input => input.files[0]).filter(Boolean);
        const method = document.getElementById('fusionMethod')?.value || 'average';
        const resizeOption = document.querySelector('input[name="resizeOption"]:checked')?.value || 'stretch';
        const opacity = parseInt(this.opacitySlider.value) / 100;
        
        this.showLoading();
        
        if (files.length === 0) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            document.getElementById('downloadBtn').disabled = true;
            this.undoBtn.disabled = true;
            this.hideLoading();
            return;
        }
        
        try {
            // Save current state to history before making changes
            this.saveToHistory();
            
            const images = await this.loadImages(files);
            this.drawMergedImage(images, method, resizeOption, opacity);
            
            document.getElementById('downloadBtn').disabled = false;
            this.undoBtn.disabled = this.history.length <= 1;
        } catch (error) {
            console.error("Error merging images:", error);
            alert("An error occurred while processing the images. Please try again.");
        } finally {
            this.hideLoading();
        }
    }
    
    async loadImages(files) {
        return Promise.all(files.map(file => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                const objectUrl = URL.createObjectURL(file);
                
                img.onload = () => {
                    URL.revokeObjectURL(objectUrl);
                    resolve(img);
                    this.updateProgress(files.length);
                };
                
                img.onerror = () => {
                    URL.revokeObjectURL(objectUrl);
                    reject(new Error(`Failed to load image: ${file.name}`));
                };
                
                img.src = objectUrl;
            });
        }));
    }
    
    drawMergedImage(images, method, resizeOption, opacity) {
        // Determine dimensions based on resize option
        let width, height;
        
        switch (resizeOption) {
            case 'preserve':
                width = Math.min(...images.map(img => img.width));
                height = Math.min(...images.map(img => img.height));
                break;
            case 'fitWidth':
                width = Math.min(...images.map(img => img.width));
                height = Math.max(...images.map(img => img.height * (width / img.width)));
                break;
            case 'fitHeight':
                height = Math.min(...images.map(img => img.height));
                width = Math.max(...images.map(img => img.width * (height / img.height)));
                break;
            case 'none':
                width = images[0].width;
                height = images[0].height;
                break;
            default: // 'stretch'
                width = Math.max(...images.map(img => img.width));
                height = Math.max(...images.map(img => img.height));
        }
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // For single image, just draw it with opacity
        if (images.length === 1) {
            tempCtx.globalAlpha = opacity;
            tempCtx.drawImage(images[0], 0, 0, width, height);
            this.ctx.drawImage(tempCanvas, 0, 0);
            return;
        }
        
        // For multiple images, blend them
        const result = this.ctx.createImageData(width, height);
        const buffers = [];
        
        // Draw each image to temp canvas and get pixel data
        for (const img of images) {
            tempCtx.clearRect(0, 0, width, height);
            tempCtx.drawImage(img, 0, 0, width, height);
            buffers.push(tempCtx.getImageData(0, 0, width, height).data);
        }
        
        // Blend pixels
        for (let i = 0; i < result.data.length; i += 4) {
            let rVals = [], gVals = [], bVals = [];
            
            for (const buf of buffers) {
                if (buf[i + 3] > 0) { // Only consider non-transparent pixels
                    rVals.push(buf[i]);
                    gVals.push(buf[i + 1]);
                    bVals.push(buf[i + 2]);
                }
            }
            
            if (rVals.length === 0) continue; // Skip if all pixels are transparent
            
            let r, g, b;
            
            switch (method) {
                case 'lighten':
                    r = Math.max(...rVals);
                    g = Math.max(...gVals);
                    b = Math.max(...bVals);
                    break;
                case 'darken':
                    r = Math.min(...rVals);
                    g = Math.min(...gVals);
                    b = Math.min(...bVals);
                    break;
                case 'multiply':
                    r = rVals.reduce((a, b) => a * b / 255, 255);
                    g = gVals.reduce((a, b) => a * b / 255, 255);
                    b = bVals.reduce((a, b) => a * b / 255, 255);
                    break;
                case 'screen':
                    r = 255 - (rVals.reduce((a, b) => (255 - a) * (255 - b) / 255, 255));
                    g = 255 - (gVals.reduce((a, b) => (255 - a) * (255 - b) / 255, 255));
                    b = 255 - (bVals.reduce((a, b) => (255 - a) * (255 - b) / 255, 255));
                    break;
                case 'overlay':
                    // Simplified overlay - average of multiply and screen
                    const avgR = this.average(rVals);
                    r = avgR < 128 ? 
                        (2 * this.multiplyValues(rVals)) : 
                        (255 - 2 * this.screenValues(rVals));
                    const avgG = this.average(gVals);
                    g = avgG < 128 ? 
                        (2 * this.multiplyValues(gVals)) : 
                        (255 - 2 * this.screenValues(gVals));
                    const avgB = this.average(bVals);
                    b = avgB < 128 ? 
                        (2 * this.multiplyValues(bVals)) : 
                        (255 - 2 * this.screenValues(bVals));
                    break;
                default: // 'average'
                    r = this.average(rVals);
                    g = this.average(gVals);
                    b = this.average(bVals);
            }
            
            result.data[i] = r;
            result.data[i + 1] = g;
            result.data[i + 2] = b;
            result.data[i + 3] = 255 * opacity; // Apply opacity to alpha channel
        }
        
        this.ctx.putImageData(result, 0, 0);
    }
    
    average(arr) {
        return Math.floor(arr.reduce((a, b) => a + b, 0) / arr.length);
    }
    
    multiplyValues(arr) {
        return arr.reduce((a, b) => a * b / 255, 255);
    }
    
    screenValues(arr) {
        return arr.reduce((a, b) => (255 - a) * (255 - b) / 255, 255);
    }
    
    showLoading() {
        this.loadingOverlay.style.display = 'flex';
        this.progressFill.style.width = '0%';
    }
    
    hideLoading() {
        this.loadingOverlay.style.display = 'none';
    }
    
    updateProgress(loaded, total) {
        const percent = Math.floor((loaded / total) * 100);
        this.progressFill.style.width = `${percent}%`;
    }
    
    saveToHistory() {
        // Save current canvas state to history
        if (this.canvas.width === 0 || this.canvas.height === 0) return;
        
        const imageData = this.canvas.toDataURL('image/png');
        this.history.push(imageData);
        
        // Limit history size
        if (this.history.length > this.maxHistorySteps) {
            this.history.shift();
        }
    }
    
    undoLastAction() {
        if (this.history.length <= 1) {
            this.undoBtn.disabled = true;
            return;
        }
        
        // Remove current state
        this.history.pop();
        
        // Restore previous state
        const prevState = this.history[this.history.length - 1];
        const img = new Image();
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.canvas.width = img.width;
            this.canvas.height = img.height;
            this.ctx.drawImage(img, 0, 0);
            this.undoBtn.disabled = this.history.length <= 1;
        };
        img.src = prevState;
    }
    
    clearCanvas() {
        const confirmClear = confirm("Are you sure you want to reset everything?");
        if (!confirmClear) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.canvas.width = 0;
        this.canvas.height = 0;
        
        // Disable buttons
        document.getElementById('downloadBtn').disabled = true;
        this.undoBtn.disabled = true;
        
        // Clear all upload boxes
        const uploadSection = document.querySelector('.upload-section');
        uploadSection.innerHTML = '';
        
        // Reset image index and create one new box
        this.imageIndex = 0;
        this.createUploadBox();
        
        // Clear localStorage
        localStorage.removeItem('savedImages');
        
        // Reset controls
        const stretchRadio = document.querySelector('input[name="resizeOption"][value="stretch"]');
        if (stretchRadio) stretchRadio.checked = true;
        
        const fusionSelect = document.getElementById('fusionMethod');
        if (fusionSelect) fusionSelect.value = 'average';
        
        this.opacitySlider.value = 100;
        this.opacityValue.textContent = '100%';
        
        // Close options panel
        this.moreOptions.classList.remove('visible');
        this.toggleBtn.textContent = 'Advanced Options ↓';
        
        // Clear history
        this.history = [];
    }
    
    downloadImage() {
        const format = document.getElementById('exportFormat').value;
        const quality = parseInt(this.qualitySlider.value) / 100;
        
        if (this.canvas.width === 0 || this.canvas.height === 0) {
            alert("There's nothing to download.");
            return;
        }
        
        let mimeType, extension;
        switch (format) {
            case 'jpeg':
                mimeType = 'image/jpeg';
                extension = 'jpg';
                break;
            case 'webp':
                mimeType = 'image/webp';
                extension = 'webp';
                break;
            default: // png
                mimeType = 'image/png';
                extension = 'png';
        }
        
        const link = document.createElement('a');
        link.download = `fused_image.${extension}`;
        link.href = this.canvas.toDataURL(mimeType, quality);
        link.click();
    }
    
    adjustZoom(amount) {
        this.currentZoom += amount;
        this.currentZoom = Math.max(0.1, Math.min(this.currentZoom, 3)); // Limit zoom range
        this.applyZoom();
    }
    
    resetZoom() {
        this.currentZoom = 1;
        this.applyZoom();
    }
    
    applyZoom() {
        this.canvas.style.transform = `scale(${this.currentZoom})`;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ImageFusionTool();
});