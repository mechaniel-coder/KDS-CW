// verify.js — guardian-managed membership application + status check.
(function () {
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

  function statusMessage(status) {
    if (status === 'active') return 'Great news \u2014 this membership is approved and active. See you at the next session.';
    if (status === 'revoked') return 'This membership is currently not active. Contact KDS if you believe this is a mistake.';
    return 'Your application is in review. A KDS team member will follow up by email once it\u2019s been processed.';
  }

  function showStatus(user) {
    joinPanel.hidden = true;
    statusPanel.hidden = false;
    statusText.textContent = statusMessage(user.membership_status);
  }

  document.getElementById('joinForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    const email = document.getElementById('guardianEmail').value.trim();
    const password = document.getElementById('guardianPassword').value;
    const guardian_name = document.getElementById('guardianName').value.trim();
    const guardian_relationship = document.getElementById('guardianRelationship').value;
    const minor_first_name = document.getElementById('minorFirst').value.trim();
    const minor_last_name = document.getElementById('minorLast').value.trim();
    const minor_dob = document.getElementById('minorDob').value;
    const consent_given = document.getElementById('consentCheck').checked;

    if (!consent_given) return showError('Guardian consent is required to submit an application.');
    if (password.length < 10 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return showError('Password must be at least 10 characters and include upper case, lower case, and a number.');
    }

    const btn = document.getElementById('joinSubmit');
    btn.disabled = true;
    btn.textContent = 'Submitting…';
    try {
      const user = await window.KDS.verifyJoin({
        email, password, guardian_name, guardian_relationship,
        minor_first_name, minor_last_name, minor_dob, consent_given,
      });
      showStatus(user);
    } catch (err) {
      showError(err.message);
      btn.disabled = false;
      btn.textContent = 'Submit Application';
    }
  });

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    try {
      const user = await window.KDS.login(email, password);
      showStatus(user);
    } catch (err) {
      showError(err.message);
    }
  });

  // If a session already resumes (e.g. after a redirect on this same device), show status immediately.
  window.KDS.resume().then((user) => {
    if (user && user.member_type === 'guardian') showStatus(user);
  });
})();
