/**
 * SmartEdu Authentication & User Session Module
 */

const Auth = {
  selectedRole: 'student',

  init() {
    this.bindEvents();
    this.checkSession();
  },

  async checkSession() {
    const token = API.getToken();
    if (token) {
      try {
        const res = await API.get('/auth/me');
        if (res.success && res.user) {
          AppState.setUser(res.user);
        }
      } catch (err) {
        // Token expired or invalid
        API.setToken('');
        AppState.setUser(null);
      }
    }
    this.renderUserUI();
  },

  bindEvents() {
    // Open Auth Modal
    const loginTrigger = document.getElementById('login-nav-btn');
    if (loginTrigger) {
      loginTrigger.addEventListener('click', () => this.openModal('login'));
    }

    const signupTrigger = document.getElementById('signup-nav-btn');
    if (signupTrigger) {
      signupTrigger.addEventListener('click', () => this.openModal('register'));
    }

    // Modal Close
    const closeBtn = document.getElementById('auth-modal-close');
    const backdrop = document.getElementById('auth-modal-backdrop');
    if (closeBtn && backdrop) {
      closeBtn.addEventListener('click', () => this.closeModal());
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) this.closeModal();
      });
    }

    // Tabs
    const tabLogin = document.getElementById('tab-btn-login');
    const tabRegister = document.getElementById('tab-btn-register');
    if (tabLogin && tabRegister) {
      tabLogin.addEventListener('click', () => this.switchTab('login'));
      tabRegister.addEventListener('click', () => this.switchTab('register'));
    }

    // Role Selection in Register
    const roleOptions = document.querySelectorAll('.role-option');
    roleOptions.forEach((opt) => {
      opt.addEventListener('click', () => {
        roleOptions.forEach((o) => o.classList.remove('selected'));
        opt.classList.add('selected');
        this.selectedRole = opt.dataset.role;
      });
    });

    // One-Click Demo Logins
    const demoStudentBtn = document.getElementById('btn-demo-student');
    if (demoStudentBtn) {
      demoStudentBtn.addEventListener('click', () => {
        this.loginWithCredentials('student@smartedu.dev', 'student123');
      });
    }

    const demoTeacherBtn = document.getElementById('btn-demo-teacher');
    if (demoTeacherBtn) {
      demoTeacherBtn.addEventListener('click', () => {
        this.loginWithCredentials('teacher@smartedu.dev', 'teacher123');
      });
    }

    // Login Form Submit
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        await this.loginWithCredentials(email, password);
      });
    }

    // Register Form Submit
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        await this.registerUser(name, email, password, this.selectedRole);
      });
    }

    // User Dropdown Toggle & Logout
    const userBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-menu-dropdown');
    if (userBtn && userDropdown) {
      userBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('show');
      });

      document.addEventListener('click', () => {
        userDropdown.classList.remove('show');
      });
    }

    const logoutBtn = document.getElementById('nav-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    }

    AppState.on('userChanged', () => {
      this.renderUserUI();
    });
  },

  openModal(tab = 'login') {
    const backdrop = document.getElementById('auth-modal-backdrop');
    if (backdrop) {
      backdrop.classList.add('open');
      this.switchTab(tab);
    }
  },

  closeModal() {
    const backdrop = document.getElementById('auth-modal-backdrop');
    if (backdrop) {
      backdrop.classList.remove('open');
    }
  },

  switchTab(tab) {
    const tabLogin = document.getElementById('tab-btn-login');
    const tabRegister = document.getElementById('tab-btn-register');
    const loginView = document.getElementById('auth-login-view');
    const registerView = document.getElementById('auth-register-view');

    if (tab === 'login') {
      tabLogin?.classList.add('active');
      tabRegister?.classList.remove('active');
      if (loginView) loginView.style.display = 'block';
      if (registerView) registerView.style.display = 'none';
    } else {
      tabRegister?.classList.add('active');
      tabLogin?.classList.remove('active');
      if (loginView) loginView.style.display = 'none';
      if (registerView) registerView.style.display = 'block';
    }
  },

  async loginWithCredentials(email, password) {
    try {
      const res = await API.post('/auth/login', { email, password });
      if (res.success) {
        API.setToken(res.token);
        AppState.setUser(res.user);
        this.closeModal();
        showToast('Welcome Back!', `Logged in as ${res.user.name} (${res.user.role})`, 'success');
        // If teacher, optionally redirect or refresh dashboard
        if (window.location.pathname.includes('dashboard') && window.Dashboard) {
          window.Dashboard.loadDashboard();
        }
      }
    } catch (err) {
      showToast('Login Failed', err.message || 'Please check your credentials', 'error');
    }
  },

  async registerUser(name, email, password, role) {
    try {
      const res = await API.post('/auth/register', { name, email, password, role });
      if (res.success) {
        API.setToken(res.token);
        AppState.setUser(res.user);
        this.closeModal();
        showToast('Registration Successful!', `Welcome to SmartEdu, ${res.user.name}!`, 'success');
      }
    } catch (err) {
      showToast('Registration Failed', err.message || 'Please try again', 'error');
    }
  },

  logout() {
    API.post('/auth/logout', {}).catch(() => {});
    API.setToken('');
    AppState.setUser(null);
    showToast('Signed Out', 'You have been logged out safely.', 'info');
    setTimeout(() => {
      window.location.href = '/';
    }, 400);
  },

  renderUserUI() {
    const guestNav = document.getElementById('nav-guest-actions');
    const userNav = document.getElementById('nav-user-actions');
    const userAvatar = document.getElementById('user-nav-avatar');
    const userName = document.getElementById('user-nav-name');
    const userRole = document.getElementById('user-nav-role');
    const teacherLinks = document.querySelectorAll('.teacher-only-link');

    if (AppState.user) {
      if (guestNav) guestNav.style.display = 'none';
      if (userNav) userNav.style.display = 'flex';
      if (userAvatar) userAvatar.src = AppState.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(AppState.user.name)}`;
      if (userName) userName.textContent = AppState.user.name;
      if (userRole) userRole.textContent = AppState.user.role === 'teacher' ? '👨‍🏫 Instructor' : '👨‍🎓 Student';

      // Toggle teacher-specific features
      teacherLinks.forEach((el) => {
        el.style.display = AppState.user.role === 'teacher' ? 'flex' : 'none';
      });
    } else {
      if (guestNav) guestNav.style.display = 'flex';
      if (userNav) userNav.style.display = 'none';
      teacherLinks.forEach((el) => {
        el.style.display = 'none';
      });
    }
  }
};

window.Auth = Auth;
document.addEventListener('DOMContentLoaded', () => Auth.init());
