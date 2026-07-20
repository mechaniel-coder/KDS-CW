// app.js — kinetic typography reveal + micro-interaction wiring (no dependencies)

(function () {
  // --- Kinetic typography: split into words, wrap each in a masked span, stagger reveal ---
  const kineticEls = document.querySelectorAll('[data-kinetic]');

  kineticEls.forEach((el) => {
    const text = el.textContent.trim();
    const words = text.split(/\s+/);
    el.textContent = '';

    words.forEach((word, i) => {
      const wrap = document.createElement('span');
      wrap.className = 'word';
      const inner = document.createElement('span');
      inner.style.setProperty('--i', i);
      inner.textContent = word;
      wrap.appendChild(inner);
      el.appendChild(wrap);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

  // Trigger the reveal once fonts/layout are ready (next frame after paint)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      kineticEls.forEach((el) => el.classList.add('is-revealed'));
    });
  });

  // --- Mobile menu toggle ---
  const toggle = document.getElementById('menuToggle');
  const menu = document.getElementById('mobileMenu');

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });

    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
      });
    });
  }
})();
