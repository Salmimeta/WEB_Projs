// // === IMAGE FUSION TOOL SCRIPT ===


import { createUploadBox } from './upload.js';
import { setupThemeToggle } from './theme.js';
import { setupFusionControls, resetAllImages, mergeImages, toggleCanvasBg } from './merge.js';
import { setupEditUI, setupMoreOptionsToggle } from './editMenu.js';
import { setupDownloadHandler, setupResetButton } from './download.js';
import { setupReloadWarning, undoState, redoState } from './utils.js';

let lastScrollY = window.scrollY;
const navbar = document.querySelector('.navbar');



document.addEventListener('DOMContentLoaded', () => {
  // Setup App Features
  setupFusionControls();
  setupEditUI();
  setupDownloadHandler();
  setupResetButton();
  setupReloadWarning();
  setupMoreOptionsToggle();
  createUploadBox();
  setupThemeToggle();

  document.getElementById('resetBtn')?.addEventListener('click', resetAllImages);
  document.getElementById('undo')?.addEventListener('click', () => {
    undoState();
    mergeImages();
  });
  document.getElementById('redo')?.addEventListener('click', () => {
    redoState();
    mergeImages();
  });
  document.getElementById('toggleBgColorBtn')?.addEventListener('click', toggleCanvasBg);

  // ✅ Section highlight logic
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.nav-links a');

  window.addEventListener('scroll', () => {
    let currentSection = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 100;
      if (window.scrollY >= sectionTop) {
        currentSection = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href').includes(currentSection)) {
        link.classList.add('active');
      }
    });
  });

  // ✅ Navbar hide-on-scroll logic
  let lastScrollY = window.scrollY;
  const navbar = document.querySelector('.navbar');

  window.addEventListener('scroll', () => {
    if (window.scrollY > lastScrollY) {
      navbar.classList.add('hide');
    } else {
      navbar.classList.remove('hide');
    }
    lastScrollY = window.scrollY;
  });
});
