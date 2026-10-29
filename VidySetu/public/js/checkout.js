/**
 * SmartEdu Checkout Module (Simulating Razorpay / Stripe Gateway)
 */

const Checkout = {
  selectedPaymentMethod: 'card',
  simulateFailure: false,

  init() {
    this.bindEvents();
  },

  bindEvents() {
    const backdrop = document.getElementById('checkout-modal-backdrop');
    const closeBtn = document.getElementById('checkout-modal-close');
    const payBtn = document.getElementById('btn-confirm-pay');
    const autoFillBtn = document.getElementById('btn-autofill-card');
    const failToggle = document.getElementById('checkout-fail-toggle');

    if (closeBtn && backdrop) {
      closeBtn.addEventListener('click', () => this.closeModal());
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) this.closeModal();
      });
    }

    // Payment method selection
    const methodCards = document.querySelectorAll('.payment-method-card');
    methodCards.forEach((card) => {
      card.addEventListener('click', () => {
        methodCards.forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedPaymentMethod = card.dataset.method;
        this.renderPaymentMethodFields();
      });
    });

    if (autoFillBtn) {
      autoFillBtn.addEventListener('click', () => {
        const cardNum = document.getElementById('input-card-number');
        const cardExp = document.getElementById('input-card-expiry');
        const cardCvv = document.getElementById('input-card-cvv');
        const cardName = document.getElementById('input-card-name');
        if (cardNum) cardNum.value = '4242 •••• •••• 4242';
        if (cardExp) cardExp.value = '12/28';
        if (cardCvv) cardCvv.value = '888';
        if (cardName) cardName.value = AppState.user ? AppState.user.name : 'Alex Morgan';
        showToast('Demo Card Filled', 'Test credentials populated successfully', 'info');
      });
    }

    if (failToggle) {
      failToggle.addEventListener('change', (e) => {
        this.simulateFailure = e.target.checked;
        if (this.simulateFailure) {
          showToast('Simulation Alert', 'Bank failure mode is now ACTIVE for testing', 'error');
        } else {
          showToast('Simulation Alert', 'Normal successful payment mode restored', 'info');
        }
      });
    }

    if (payBtn) {
      payBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.processPayment();
      });
    }
  },

  openModal() {
    if (!AppState.user) {
      showToast('Login Required', 'Please sign in or create an account to checkout.', 'error');
      if (window.Auth) {
        window.Auth.openModal('login');
      }
      return;
    }

    if (AppState.cart.length === 0) {
      showToast('Cart is Empty', 'Please add at least one course to checkout.', 'info');
      return;
    }

    const backdrop = document.getElementById('checkout-modal-backdrop');
    if (backdrop) {
      backdrop.classList.add('open');
      this.renderSummary();
      this.renderPaymentMethodFields();
    }
  },

  closeModal() {
    const backdrop = document.getElementById('checkout-modal-backdrop');
    if (backdrop) {
      backdrop.classList.remove('open');
    }
  },

  renderSummary() {
    const itemsList = document.getElementById('checkout-items-summary');
    const totalEl = document.getElementById('checkout-amount-display');
    const { total } = window.Cart ? window.Cart.calculateTotals() : { total: 0 };

    if (totalEl) {
      totalEl.textContent = `$${total.toFixed(2)}`;
    }

    if (itemsList) {
      itemsList.innerHTML = AppState.cart
        .map(
          (c) => `
        <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:6px;">
          <span style="color:var(--slate-200); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:260px;">${c.title}</span>
          <span style="color:var(--emerald-400); font-weight:700;">$${Number(c.price).toFixed(2)}</span>
        </div>
      `
        )
        .join('');
    }
  },

  renderPaymentMethodFields() {
    const cardFields = document.getElementById('pay-fields-card');
    const upiFields = document.getElementById('pay-fields-upi');
    const netbankingFields = document.getElementById('pay-fields-netbanking');

    if (cardFields) cardFields.style.display = this.selectedPaymentMethod === 'card' ? 'block' : 'none';
    if (upiFields) upiFields.style.display = this.selectedPaymentMethod === 'upi' ? 'block' : 'none';
    if (netbankingFields) netbankingFields.style.display = this.selectedPaymentMethod === 'netbanking' ? 'block' : 'none';
  },

  async processPayment() {
    const payBtn = document.getElementById('btn-confirm-pay');
    const processingOverlay = document.getElementById('checkout-processing');

    if (payBtn) payBtn.disabled = true;
    if (processingOverlay) processingOverlay.style.display = 'flex';

    try {
      // Simulate real gateway processing delay
      await new Promise((res) => setTimeout(res, 1800));

      const { total } = window.Cart.calculateTotals();

      const payload = {
        items: AppState.cart.map((c) => ({ courseId: c._id })),
        paymentMethod: this.selectedPaymentMethod,
        simulateFailure: this.simulateFailure,
        totalAmount: total
      };

      const res = await API.post('/orders/checkout', payload);

      if (res.success) {
        // Clear cart
        AppState.clearCart();

        // Refresh user session to get new enrolledCourses
        if (window.Auth) {
          await window.Auth.checkSession();
        }

        this.closeModal();

        showToast('Payment Successful! 🎉', `Ref: ${res.order.paymentId}. Courses added to your account!`, 'success');

        // Trigger confetti celebration
        this.triggerCelebration();

        // Refresh Recommender to adapt to newly purchased courses!
        if (window.AIRecommender) {
          window.AIRecommender.runRecommendations();
        }

        // If on dashboard, reload
        if (window.location.pathname.includes('dashboard') && window.Dashboard) {
          window.Dashboard.loadDashboard();
        }
      }
    } catch (err) {
      showToast('Payment Declined', err.message || 'Transaction could not be completed.', 'error');
    } finally {
      if (payBtn) payBtn.disabled = false;
      if (processingOverlay) processingOverlay.style.display = 'none';
    }
  },

  triggerCelebration() {
    // Quick celebratory visual pulse
    const banner = document.createElement('div');
    banner.style.cssText = `
      position: fixed;
      top: 20%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.9);
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      padding: 1.5rem 3rem;
      border-radius: 20px;
      font-size: 1.5rem;
      font-weight: 800;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5), 0 0 30px rgba(16, 185, 129, 0.6);
      z-index: 999999;
      text-align: center;
      transition: all 0.4s ease;
      opacity: 0;
    `;
    banner.innerHTML = `🎉 Order Confirmed! <br><span style="font-size:0.95rem; font-weight:normal; opacity:0.9;">Start learning your new courses right now!</span>`;
    document.body.appendChild(banner);

    setTimeout(() => {
      banner.style.opacity = '1';
      banner.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 50);

    setTimeout(() => {
      banner.style.opacity = '0';
      banner.style.transform = 'translate(-50%, -50%) scale(0.9)';
      setTimeout(() => banner.remove(), 400);
    }, 3200);
  }
};

window.Checkout = Checkout;
document.addEventListener('DOMContentLoaded', () => Checkout.init());
