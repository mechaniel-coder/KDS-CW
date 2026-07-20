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

  document.getElementById('donateForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('donateEmail').value.trim();

    if (!email) return showError('Please enter your email so we can send a receipt.');
    if (!selectedCents || selectedCents < 500 || selectedCents > 100000) {
      return showError('Please choose (or enter) an amount between $5 and $1,000.');
    }

    // No backend on this static deployment yet — online giving is a placeholder.
    alertBox.textContent = 'Online giving is launching soon \u2014 thank you for wanting to support KDS! Please check back shortly, or reach out via our Contact page in the meantime.';
    alertBox.className = 'alert alert--info is-visible';
    alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
})();
