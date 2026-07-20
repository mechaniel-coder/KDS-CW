// shop.js — product grid, cart drawer, checkout handoff to Stripe.
(function () {
  const grid = document.getElementById('productGrid');
  const alertBox = document.getElementById('alertBox');
  const cartAlertBox = document.getElementById('cartAlertBox');
  const cart = {}; // slug -> { product, qty }

  function showError(msg) {
    alertBox.textContent = msg;
    alertBox.className = 'alert alert--error is-visible';
  }

  // The page-level alertBox sits behind the cart drawer overlay, so errors
  // shown there (e.g. checkout not being live yet) were invisible to the
  // user while the drawer was open. Checkout-time errors use this
  // drawer-local alert instead so they're actually seen.
  function showCartError(msg) {
    cartAlertBox.textContent = msg;
    cartAlertBox.className = 'alert alert--error is-visible';
  }
  function clearCartError() {
    cartAlertBox.className = 'alert alert--error';
  }

  function cartCount() {
    return Object.values(cart).reduce((n, l) => n + l.qty, 0);
  }
  function cartTotalCents() {
    return Object.values(cart).reduce((sum, l) => sum + l.qty * l.product.price_cents, 0);
  }

  function renderProducts(products) {
    if (!products.length) {
      grid.innerHTML = '<p class="admin-empty">No products available right now — check back soon.</p>';
      return;
    }
    grid.innerHTML = products.map((p) => `
      <article class="product-card reveal" data-slug="${p.slug}">
        <div class="product-card__media"><img src="${p.image_url}" alt="${p.name}" loading="lazy" /></div>
        <div class="product-card__body">
          <h3 class="product-card__name">${p.name}</h3>
          <p class="product-card__desc">${p.description || ''}</p>
          <div class="product-card__row">
            <span class="product-card__price">${window.KDS.money(p.price_cents)}</span>
            <div class="qty-stepper">
              <button type="button" data-action="dec" aria-label="Decrease quantity">−</button>
              <span class="qty-stepper__val" data-qty>0</span>
              <button type="button" data-action="inc" aria-label="Increase quantity">+</button>
            </div>
          </div>
        </div>
      </article>
    `).join('');

    grid.querySelectorAll('.product-card').forEach((card) => {
      const slug = card.dataset.slug;
      const product = products.find((p) => p.slug === slug);
      const qtyEl = card.querySelector('[data-qty]');
      card.querySelectorAll('button[data-action]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const delta = btn.dataset.action === 'inc' ? 1 : -1;
          const current = cart[slug] ? cart[slug].qty : 0;
          const next = Math.max(0, Math.min(20, current + delta));
          if (next === 0) delete cart[slug];
          else cart[slug] = { product, qty: next };
          qtyEl.textContent = next;
          renderCart();
        });
      });
    });
  }

  function renderCart() {
    const items = Object.values(cart);
    document.getElementById('cartCount').hidden = items.length === 0;
    document.getElementById('cartCount').textContent = cartCount();

    const itemsEl = document.getElementById('cartItems');
    const footEl = document.getElementById('cartFoot');
    if (!items.length) {
      itemsEl.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
      footEl.hidden = true;
      return;
    }
    footEl.hidden = false;
    itemsEl.innerHTML = items.map((l) => `
      <div class="cart-line">
        <div class="cart-line__media"><img src="${l.product.image_url}" alt="" /></div>
        <div class="cart-line__body">
          <div class="cart-line__name">${l.product.name} × ${l.qty}</div>
          <div class="cart-line__price">${window.KDS.money(l.product.price_cents * l.qty)}</div>
        </div>
      </div>
    `).join('');
    document.getElementById('cartTotal').textContent = window.KDS.money(cartTotalCents());
  }

  function openCart() {
    clearCartError();
    document.getElementById('cartDrawer').classList.add('is-open');
    document.getElementById('cartOverlay').classList.add('is-open');
  }
  function closeCart() {
    document.getElementById('cartDrawer').classList.remove('is-open');
    document.getElementById('cartOverlay').classList.remove('is-open');
  }

  document.getElementById('cartToggle').addEventListener('click', openCart);
  document.getElementById('cartClose').addEventListener('click', closeCart);
  document.getElementById('cartOverlay').addEventListener('click', closeCart);

  document.getElementById('checkoutBtn').addEventListener('click', async () => {
    clearCartError();
    const email = document.getElementById('checkoutEmail').value.trim();
    const name = document.getElementById('checkoutName').value.trim();
    const address = document.getElementById('checkoutAddress').value.trim();
    if (!email || !name || !address) {
      showCartError('Please fill in your email, shipping name, and address before checking out.');
      return;
    }
    const items = Object.values(cart).map((l) => ({ slug: l.product.slug, quantity: l.qty }));
    if (!items.length) return;

    const btn = document.getElementById('checkoutBtn');
    const originalLabel = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = 'Redirecting to Stripe…';
    try {
      const res = await window.KDS.checkoutShop({
        email, items, shipping_name: name, shipping_address: address,
      });
      window.location.href = res.checkout_url;
    } catch (err) {
      showCartError(err.status === 409
        ? 'Checkout isn\u2019t live yet \u2014 the shop owner still needs to connect a Stripe account.'
        : err.message);
      btn.disabled = false;
      btn.innerHTML = originalLabel;
    }
  });

  // Handle Stripe redirect back to this page (?order=..&status=success|cancelled)
  const params = new URLSearchParams(window.location.search);
  if (params.get('status') === 'success') {
    alertBox.textContent = `Thanks! Order #${params.get('order')} is confirmed \u2014 a receipt is on its way to your inbox.`;
    alertBox.className = 'alert alert--success is-visible';
  } else if (params.get('status') === 'cancelled') {
    alertBox.textContent = 'Checkout was cancelled \u2014 your cart items are safe if you\u2019d like to try again.';
    alertBox.className = 'alert alert--info is-visible';
  }

  window.KDS.listProducts().then(renderProducts).catch((err) => showError(err.message));
})();
