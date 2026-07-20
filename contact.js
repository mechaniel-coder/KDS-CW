// contact.js — contact form submission.
(function () {
  const alertBox = document.getElementById('alertBox');
  const successBox = document.getElementById('successBox');

  document.getElementById('contactForm').addEventListener('submit', async (e) => {
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

    const btn = document.getElementById('contactSubmit');
    btn.disabled = true;
    btn.textContent = 'Sending…';
    try {
      await window.KDS.sendContact({ name, email, message });
      document.getElementById('contactForm').reset();
      successBox.textContent = 'Thanks for reaching out \u2014 we\u2019ll get back to you soon.';
      successBox.className = 'alert alert--success is-visible';
      successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
      alertBox.textContent = err.message;
      alertBox.className = 'alert alert--error is-visible';
      alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send Message';
    }
  });
})();
