// contact.js — contact form hand-off. This is a fully static deployment
// (GitHub Pages, no backend), so submitting opens the visitor's email app
// with a prefilled message to KDS instead of posting to a server.
// Replace CONTACT_EMAIL with your real inbox address.
(function () {
  const CONTACT_EMAIL = 'hello@kdsos.org';
  const alertBox = document.getElementById('alertBox');
  const successBox = document.getElementById('successBox');

  document.getElementById('contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    alertBox.className = 'alert alert--error';
    successBox.className = 'alert alert--success';

    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const message = document.getElementById('contactMessage').value.trim();
    if (!name || !email || !message) {
      alertBox.textContent = 'Please fill in your name, email, and message.';
      alertBox.className = 'alert alert--error is-visible';
      // Alert sits above the form; scroll it into view so a visitor
      // submitting from further down the page actually sees it.
      alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const subject = `KDS Contact \u2014 ${name}`;
    const body = `${message}\n\n\u2014 ${name} (${email})`;
    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    document.getElementById('contactForm').reset();
    successBox.textContent = 'Opening your email app to send this to the KDS team \u2014 if nothing opens, email us directly at ' + CONTACT_EMAIL + '.';
    successBox.className = 'alert alert--success is-visible';
    successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.location.href = mailto;
  });
})();
