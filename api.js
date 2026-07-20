// api.js — shared backend client for all KDSos pages.
// Loaded before any page-specific script. Exposes window.KDS.

(function () {
  // Works locally (http://localhost:8000) AND after deploy (proxied path).
  const API = '__PORT_8000__'.startsWith('__') ? 'http://localhost:8000' : '__PORT_8000__';

  // In-memory only — sandboxed preview iframes disable browser-persisted
  // storage, so we never rely on it here. The backend also resumes a
  // session via the platform's X-Visitor-Id header, so a page reload in
  // the deployed preview still shows you as logged in.
  let session = { token: null, csrfToken: null, user: null };

  async function request(path, { method = 'GET', body, auth = false } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth && session.token) headers['Authorization'] = `Bearer ${session.token}`;
    if (auth && session.csrfToken) headers['X-CSRF-Token'] = session.csrfToken;

    let res;
    try {
      res = await fetch(`${API}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      throw new Error('Could not reach the server. Please check your connection and try again.');
    }

    let data = null;
    try { data = await res.json(); } catch (_) { /* no body */ }

    if (!res.ok) {
      const message = (data && (data.error || data.detail)) || `Request failed (${res.status})`;
      const err = new Error(message);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  async function tryResumeSession() {
    // No token in memory yet (fresh page load) — ask the backend if the
    // X-Visitor-Id on this request already maps to an active session.
    try {
      const data = await request('/api/auth/me', { auth: true });
      session.user = data.user;
      return data.user;
    } catch (_) {
      return null;
    }
  }

  const KDS = {
    money(cents) {
      return `$${(cents / 100).toFixed(2)}`;
    },

    getUser() {
      return session.user;
    },

    async resume() {
      return tryResumeSession();
    },

    async login(email, password) {
      const data = await request('/api/auth/login', { method: 'POST', body: { email, password } });
      session = { token: data.token, csrfToken: data.csrf_token, user: data.user };
      return data.user;
    },

    async register(email, password, display_name) {
      const data = await request('/api/auth/register', { method: 'POST', body: { email, password, display_name } });
      session = { token: data.token, csrfToken: data.csrf_token, user: data.user };
      return data.user;
    },

    async verifyJoin(payload) {
      const data = await request('/api/auth/verify-join', { method: 'POST', body: payload });
      session = { token: data.token, csrfToken: data.csrf_token, user: data.user };
      return data.user;
    },

    async logout() {
      try { await request('/api/auth/logout', { method: 'POST', auth: true }); } catch (_) {}
      session = { token: null, csrfToken: null, user: null };
    },

    async listProducts() {
      const data = await request('/api/products');
      return data.products;
    },

    async checkoutShop(payload) {
      return request('/api/checkout/shop', { method: 'POST', body: payload });
    },

    async checkoutDonate(payload) {
      return request('/api/checkout/donate', { method: 'POST', body: payload });
    },

    async sendContact(payload) {
      return request('/api/contact', { method: 'POST', body: payload });
    },

    // ---- admin ----
    admin: {
      stats: () => request('/api/admin/stats', { auth: true }),
      orders: () => request('/api/admin/orders', { auth: true }),
      donations: () => request('/api/admin/donations', { auth: true }),
      submissions: () => request('/api/admin/submissions', { auth: true }),
      members: () => request('/api/admin/members', { auth: true }),
      setSubmissionStatus: (id, status) =>
        request(`/api/admin/submissions/${id}/status`, { method: 'POST', body: { status }, auth: true }),
      memberDecision: (id, decision) =>
        request(`/api/admin/members/${id}/decision`, { method: 'POST', body: { decision }, auth: true }),
      deleteMember: (id) => request(`/api/admin/members/${id}`, { method: 'DELETE', auth: true }),
    },
  };

  window.KDS = KDS;
})();
