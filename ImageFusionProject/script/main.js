// // === IMAGE FUSION TOOL SCRIPT ===


import { createUploadBox } from './upload.js';
import { setupThemeToggle } from './theme.js';
import { setupFusionControls } from './merge.js';
import { setupEditUI, setupMoreOptionsToggle } from './editMenu.js';
import { setupDownloadHandler, setupResetButton } from './download.js';
import { setupReloadWarning } from './utils.js';




window.addEventListener('DOMContentLoaded', () => {
  setupFusionControls();      // Fusion method dropdown & slider
  setupEditUI();              // Edit (⋮) menu logic
  setupDownloadHandler();     // Download logic
  setupResetButton();         // Clear/reset canvas and uploads
  setupReloadWarning();       // Show reload warning if canvas has content
  setupMoreOptionsToggle();
  createUploadBox();          // Insert the first upload box
  setupThemeToggle();         // Dark/light mode toggle
});