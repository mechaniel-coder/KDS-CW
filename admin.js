// admin.js — password-protected dashboard: stats, orders, donations, submissions, members.
(function () {
  const loginSection = document.getElementById('loginSection');
  const dashboardSection = document.getElementById('dashboardSection');
  const loginAlert = document.getElementById('loginAlert');
  const tabAlert = document.getElementById('tabAlert');
  const tabContent = document.getElementById('tabContent');
  const logoutBtn = document.getElementById('logoutBtn');
  let activeTab = 'orders';

  function money(cents) { return window.KDS.money(cents); }
  function fmtDate(iso) {
    try { return new Date(iso.includes('Z') || iso.includes('+') ? iso : iso + 'Z').toLocaleString(); }
    catch (_) { return iso; }
  }
  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function showLoginError(msg) {
    loginAlert.textContent = msg;
    loginAlert.className = 'alert alert--error is-visible';
  }
  function showTabError(msg) {
    tabAlert.textContent = msg;
    tabAlert.className = 'alert alert--error is-visible';
  }
  function clearTabError() {
    tabAlert.className = 'alert alert--error';
  }

  function enterDashboard() {
    loginSection.hidden = true;
    dashboardSection.hidden = false;
    logoutBtn.hidden = false;
    loadStats();
    loadTab(activeTab);
  }

  function exitDashboard() {
    loginSection.hidden = false;
    dashboardSection.hidden = true;
    logoutBtn.hidden = true;
  }

  async function loadStats() {
    try {
      const s = await window.KDS.admin.stats();
      document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card"><div class="stat-card__label">Active Members</div><div class="stat-card__value">${s.members_active}</div></div>
        <div class="stat-card"><div class="stat-card__label">Pending Members</div><div class="stat-card__value">${s.members_pending}</div></div>
        <div class="stat-card"><div class="stat-card__label">Shop Revenue</div><div class="stat-card__value">${money(s.orders_revenue_cents)}</div></div>
        <div class="stat-card"><div class="stat-card__label">Donations Raised</div><div class="stat-card__value">${money(s.donations_total_cents)}</div></div>
      `;
    } catch (err) {
      showTabError(err.message);
    }
  }

  async function loadTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.admin-tab').forEach((t) => t.classList.toggle('is-active', t.dataset.tab === tab));
    clearTabError();
    tabContent.innerHTML = '<p class="admin-empty">Loading…</p>';
    try {
      if (tab === 'orders') return renderOrders(await window.KDS.admin.orders());
      if (tab === 'donations') return renderDonations(await window.KDS.admin.donations());
      if (tab === 'submissions') return renderSubmissions(await window.KDS.admin.submissions());
      if (tab === 'members') return renderMembers(await window.KDS.admin.members());
    } catch (err) {
      tabContent.innerHTML = '';
      showTabError(err.message);
    }
  }

  function wrapTable(headers, rows) {
    if (!rows.length) return '<div class="admin-table-wrap"><p class="admin-empty">Nothing here yet.</p></div>';
    return `<div class="admin-table-wrap"><table class="admin-table">
      <thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.join('')}</tbody>
    </table></div>`;
  }

  function renderOrders(data) {
    const rows = data.orders.map((o) => `
      <tr>
        <td>#${o.id}</td>
        <td>${esc(o.email)}</td>
        <td>${money(o.amount_cents)}</td>
        <td><span class="badge badge--${o.status === 'paid' ? 'paid' : o.status === 'failed' ? 'failed' : 'pending'}">${esc(o.status)}</span></td>
        <td>${fmtDate(o.created_at)}</td>
      </tr>
    `);
    tabContent.innerHTML = wrapTable(['Order', 'Email', 'Amount', 'Status', 'Placed'], rows);
  }

  function renderDonations(data) {
    const rows = data.donations.map((d) => `
      <tr>
        <td>#${d.id}</td>
        <td>${esc(d.email)}</td>
        <td>${esc(d.name || '—')}</td>
        <td>${money(d.amount_cents)}</td>
        <td><span class="badge badge--${d.status === 'paid' ? 'paid' : 'pending'}">${esc(d.status)}</span></td>
        <td>${fmtDate(d.created_at)}</td>
      </tr>
    `);
    tabContent.innerHTML = wrapTable(['Donation', 'Email', 'Name', 'Amount', 'Status', 'Received'], rows);
  }

  function renderSubmissions(data) {
    const rows = data.submissions.map((s) => `
      <tr data-id="${s.id}">
        <td>#${s.id}</td>
        <td>${esc(s.type)}</td>
        <td>${esc(s.name)}</td>
        <td>${esc(s.email)}</td>
        <td style="white-space:normal; max-width:22rem;">${esc(s.message)}</td>
        <td><span class="badge badge--${s.status === 'new' ? 'new' : s.status === 'archived' ? 'revoked' : 'active'}">${esc(s.status)}</span></td>
        <td class="admin-actions">
          <button class="btn-tiny" data-action="reviewed">Mark reviewed</button>
          <button class="btn-tiny btn-tiny--danger" data-action="archived">Archive</button>
        </td>
      </tr>
    `);
    tabContent.innerHTML = wrapTable(['ID', 'Type', 'Name', 'Email', 'Message', 'Status', 'Actions'], rows);

    tabContent.querySelectorAll('button[data-action]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const tr = btn.closest('tr');
        const id = tr.dataset.id;
        btn.disabled = true;
        try {
          await window.KDS.admin.setSubmissionStatus(id, btn.dataset.action);
          loadTab('submissions');
          loadStats();
        } catch (err) {
          showTabError(err.message);
          btn.disabled = false;
        }
      });
    });
  }

  function renderMembers(data) {
    const rows = data.members.map((m) => `
      <tr data-id="${m.id}">
        <td>#${m.id}</td>
        <td>${esc(m.guardian_name)} <span class="form-hint">(${esc(m.guardian_relationship)})</span></td>
        <td>${esc(m.email)}</td>
        <td>${esc(m.minor_first_name)} ${esc(m.minor_last_name)}</td>
        <td>${esc(m.minor_dob)}</td>
        <td><span class="badge badge--${m.membership_status}">${esc(m.membership_status)}</span></td>
        <td>${fmtDate(m.created_at)}</td>
        <td class="admin-actions">
          <button class="btn-tiny" data-action="approve">Approve</button>
          <button class="btn-tiny" data-action="revoke">Revoke</button>
          <button class="btn-tiny btn-tiny--danger" data-action="delete">Delete data</button>
        </td>
      </tr>
    `);
    tabContent.innerHTML = wrapTable(['ID', 'Guardian', 'Email', 'Rider', 'DOB', 'Status', 'Applied', 'Actions'], rows);

    tabContent.querySelectorAll('button[data-action]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const tr = btn.closest('tr');
        const id = tr.dataset.id;
        const action = btn.dataset.action;
        if (action === 'delete' && !confirm('Permanently delete this member\u2019s data? This cannot be undone.')) return;
        btn.disabled = true;
        try {
          if (action === 'delete') await window.KDS.admin.deleteMember(id);
          else await window.KDS.admin.memberDecision(id, action === 'approve' ? 'approve' : 'revoke');
          loadTab('members');
          loadStats();
        } catch (err) {
          showTabError(err.message);
          btn.disabled = false;
        }
      });
    });
  }

  document.querySelectorAll('.admin-tab').forEach((tab) => {
    tab.addEventListener('click', () => loadTab(tab.dataset.tab));
  });

  document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    loginAlert.className = 'alert alert--error';
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;
    try {
      const user = await window.KDS.login(email, password);
      if (user.role !== 'admin') {
        await window.KDS.logout();
        showLoginError('This account doesn\u2019t have admin access.');
        return;
      }
      enterDashboard();
    } catch (err) {
      showLoginError(err.message);
    }
  });

  logoutBtn.addEventListener('click', async () => {
    await window.KDS.logout();
    exitDashboard();
  });

  // Resume an existing admin session automatically (works in the deployed
  // preview thanks to the visitor-id session fallback; see api.js).
  window.KDS.resume().then((user) => {
    if (user && user.role === 'admin') enterDashboard();
  });
})();
