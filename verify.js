// verify.js — guardian-managed membership interest form. This is a fully
// static deployment (GitHub Pages, no backend), so there are no real
// accounts or status lookups — submitting sends the application straight to
// KDS via email instead. Replace CONTACT_EMAIL with your real inbox address.
(function () {
  const CONTACT_EMAIL = 'hello@kdsos.org';
  const alertBox = document.getElementById('alertBox');
  const joinPanel = document.getElementById('joinPanel');
  const statusPanel = document.getElementById('statusPanel');
  const statusText = document.getElementById('statusText');

  function showError(msg) {
    alertBox.textContent = msg;
    alertBox.className = 'alert alert--error is-visible';
    // Forms on this page can be long enough that the alert (fixed near the
    // top) is scrolled out of view when the user submits from below — make
    // sure they actually see the error.
    alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function clearError() {
    alertBox.className = 'alert alert--error';
  }

  document.getElementById('joinForm').addEventListener('submit', (e) => {
    e.preventDefault();
    clearError();

    const email = document.getElementById('guardianEmail').value.trim();
    const guardian_name = document.getElementById('guardianName').value.trim();
    const guardian_relationship = document.getElementById('guardianRelationship').value;
    const minor_first_name = document.getElementById('minorFirst').value.trim();
    const minor_last_name = document.getElementById('minorLast').value.trim();
    const minor_dob = document.getElementById('minorDob').value;
    const consent_given = document.getElementById('consentCheck').checked;

    if (!consent_given) return showError('Guardian consent is required to submit an application.');

    const subject = `KDS Membership Application \u2014 ${minor_first_name} ${minor_last_name}`;
    const body = [
      `Guardian: ${guardian_name} (${guardian_relationship})`,
      `Guardian email: ${email}`,
      `Rider: ${minor_first_name} ${minor_last_name}`,
      `Rider DOB: ${minor_dob}`,
      'Guardian consent given: yes',
    ].join('\n');
    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    joinPanel.hidden = true;
    statusPanel.hidden = false;
    statusText.textContent = `Opening your email app to send this application to the KDS team \u2014 if nothing opens, email us directly at ${CONTACT_EMAIL}. We\u2019ll follow up personally once we receive it.`;
    window.location.href = mailto;
  });
})();
