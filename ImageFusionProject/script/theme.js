export function setupThemeToggle() {
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
}
