/**
 * SmartEdu Global State Store
 */
const AppState = {
  user: null,
  cart: [],
  courses: [],
  categories: [],
  activeCategory: 'All',
  activeDifficulty: 'All',
  searchQuery: '',
  sortBy: 'newest',
  listeners: {},

  init() {
    // Load cached cart
    try {
      const savedCart = localStorage.getItem('smartedu_cart');
      if (savedCart) {
        this.cart = JSON.parse(savedCart);
      }
    } catch (e) {
      this.cart = [];
    }

    // Load cached user session
    try {
      const savedUser = localStorage.getItem('smartedu_user');
      if (savedUser) {
        this.user = JSON.parse(savedUser);
      }
    } catch (e) {
      this.user = null;
    }
  },

  setUser(user) {
    this.user = user;
    if (user) {
      localStorage.setItem('smartedu_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('smartedu_user');
      localStorage.removeItem('smartedu_token');
    }
    this.emit('userChanged', this.user);
  },

  setCart(cart) {
    this.cart = cart;
    localStorage.setItem('smartedu_cart', JSON.stringify(cart));
    this.emit('cartChanged', this.cart);
  },

  addToCart(course) {
    const exists = this.cart.some((item) => String(item._id) === String(course._id));
    if (exists) {
      showToast('Already In Cart', `"${course.title}" is already in your shopping cart.`, 'info');
      return false;
    }

    // Also check if already enrolled
    if (this.user && this.user.enrolledCourses) {
      const enrolled = this.user.enrolledCourses.some((id) => String(id) === String(course._id));
      if (enrolled) {
        showToast('Already Enrolled', `You already own "${course.title}". Check your dashboard!`, 'info');
        return false;
      }
    }

    const updated = [...this.cart, course];
    this.setCart(updated);
    showToast('Added to Cart', `"${course.title}" was added to your cart.`, 'success');
    return true;
  },

  removeFromCart(courseId) {
    const updated = this.cart.filter((item) => String(item._id) !== String(courseId));
    this.setCart(updated);
    showToast('Removed', 'Item removed from your cart.', 'info');
  },

  clearCart() {
    this.setCart([]);
  },

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  },

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(data));
    }
  }
};

AppState.init();
