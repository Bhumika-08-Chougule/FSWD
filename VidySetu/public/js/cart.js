/**
 * SmartEdu Shopping Cart Module
 */

const Cart = {
  discountPercent: 0,
  activeCoupon: '',

  init() {
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    const cartTrigger = document.getElementById('cart-toggle-btn');
    const closeBtn = document.getElementById('cart-close-btn');
    const overlay = document.getElementById('cart-drawer-overlay');
    const checkoutBtn = document.getElementById('cart-checkout-btn');
    const applyCouponBtn = document.getElementById('apply-coupon-btn');

    if (cartTrigger) {
      cartTrigger.addEventListener('click', () => this.openDrawer());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeDrawer());
    }

    if (overlay) {
      overlay.addEventListener('click', () => this.closeDrawer());
    }

    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        this.closeDrawer();
        if (window.Checkout) {
          window.Checkout.openModal();
        }
      });
    }

    if (applyCouponBtn) {
      applyCouponBtn.addEventListener('click', () => {
        const input = document.getElementById('coupon-input');
        if (!input) return;
        const code = input.value.trim().toUpperCase();
        if (code === 'SMART20') {
          this.discountPercent = 20;
          this.activeCoupon = 'SMART20';
          showToast('Coupon Applied!', '20% discount applied to your cart!', 'success');
          this.render();
        } else if (code === '') {
          showToast('Coupon', 'Please enter a coupon code (Try "SMART20")', 'info');
        } else {
          showToast('Invalid Coupon', 'Code not recognized. Use "SMART20" for 20% off!', 'error');
        }
      });
    }

    AppState.on('cartChanged', () => {
      this.render();
    });
  },

  openDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-drawer-overlay');
    if (drawer && overlay) {
      drawer.classList.add('open');
      overlay.classList.add('open');
    }
    this.render();
  },

  closeDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-drawer-overlay');
    if (drawer && overlay) {
      drawer.classList.remove('open');
      overlay.classList.remove('open');
    }
  },

  calculateTotals() {
    const subtotal = AppState.cart.reduce((sum, item) => sum + Number(item.price || 0), 0);
    const discount = (subtotal * this.discountPercent) / 100;
    const total = Math.max(0, subtotal - discount);
    return { subtotal, discount, total };
  },

  render() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
      badge.textContent = AppState.cart.length;
      badge.style.display = AppState.cart.length > 0 ? 'flex' : 'none';
    }

    const cartList = document.getElementById('cart-items-list');
    const emptyState = document.getElementById('cart-empty-state');
    const footer = document.getElementById('cart-footer-summary');
    const subtotalEl = document.getElementById('cart-subtotal-val');
    const discountEl = document.getElementById('cart-discount-val');
    const totalEl = document.getElementById('cart-total-val');
    const checkoutBtn = document.getElementById('cart-checkout-btn');

    if (!cartList) return;

    if (AppState.cart.length === 0) {
      cartList.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      if (footer) footer.style.display = 'none';
      if (checkoutBtn) checkoutBtn.disabled = true;
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (footer) footer.style.display = 'block';
    if (checkoutBtn) checkoutBtn.disabled = false;

    const { subtotal, discount, total } = this.calculateTotals();

    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (discountEl) discountEl.textContent = `-$${discount.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;

    cartList.innerHTML = AppState.cart
      .map(
        (item) => `
      <div class="cart-item">
        <img src="${item.thumbnailUrl}" alt="${item.title}" class="cart-item-img" onerror="this.src='https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&q=80'" />
        <div class="cart-item-info">
          <div class="cart-item-title" title="${item.title}">${item.title}</div>
          <div class="cart-item-price">$${Number(item.price).toFixed(2)}</div>
        </div>
        <button class="cart-item-remove" onclick="AppState.removeFromCart('${item._id}')" title="Remove Course">
          🗑️
        </button>
      </div>
    `
      )
      .join('');
  }
};

window.Cart = Cart;
document.addEventListener('DOMContentLoaded', () => Cart.init());
