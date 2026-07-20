// donate.js — amount picker + Stripe checkout handoff for donations.
(function () {
  const alertBox = document.getElementById('alertBox');
  const amountGrid = document.getElementById('amountGrid');
  const customInput = document.getElementById('customAmount');
  const customChip = document.getElementById('customAmountChip');
  let selectedCents = null;

  function showError(msg) {
    alertBox.textContent = msg;
    alertBox.className = 'alert alert--error is-visible';
    // The amount/email/message form can push this alert out of view when
    // the visitor submits from below — scroll it back into sight.
    alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  amountGrid.querySelectorAll('.amount-chip[data-amount]').forEach((chip) => {
    chip.addEventListener('click', () => {
      selectedCents = parseInt(chip.dataset.amount, 10);
      amountGrid.querySelectorAll('.amount-chip').forEach((c) => c.classList.remove('is-selected'));
      chip.classList.add('is-selected');
      customInput.hidden = true;
    });
  });

  customChip.addEventListener('click', () => {
    amountGrid.querySelectorAll('.amount-chip').forEach((c) => c.classList.remove('is-selected'));
    customChip.classList.add('is-selected');
    customInput.hidden = false;
    customInput.focus();
    selectedCents = null;
  });

  customInput.addEventListener('input', () => {
    const dollars = parseFloat(customInput.value);
    selectedCents = Number.isFinite(dollars) ? Math.round(dollars * 100) : null;
  });

  document.getElementById('donateForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('donateEmail').value.trim();
    const name = document.getElementById('donateName').value.trim();
    const message = document.getElementById('donateMessage').value.trim();

    if (!email) return showError('Please enter your email so we can send a receipt.');
    if (!selectedCents || selectedCents < 500 || selectedCents > 100000) {
      return showError('Please choose (or enter) an amount between $5 and $1,000.');
    }

    const btn = document.getElementById('donateSubmit');
    btn.disabled = true;
    btn.textContent = 'Redirecting to Stripe…';
    try {
      const res = await window.KDS.checkoutDonate({ email, name: name || undefined, amount_cents: selectedCents, message: message || undefined });
      window.location.href = res.checkout_url;
    } catch (err) {
      showError(err.status === 409
        ? 'Donations aren\u2019t live yet \u2014 the site owner still needs to connect a Stripe account.'
        : err.message);
      btn.disabled = false;
      btn.textContent = 'Continue to Stripe';
    }
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get('status') === 'success') {
    alertBox.textContent = `Thank you! Your gift is confirmed \u2014 a receipt is on its way to your inbox.`;
    alertBox.className = 'alert alert--success is-visible';
  } else if (params.get('status') === 'cancelled') {
    alertBox.textContent = 'No charge was made \u2014 feel free to try again whenever you\u2019re ready.';
    alertBox.className = 'alert alert--info is-visible';
  }
})();
