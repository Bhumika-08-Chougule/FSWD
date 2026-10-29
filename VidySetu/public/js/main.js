/**
 * SmartEdu Main Application Entry & UI Interactivity
 */

document.addEventListener('DOMContentLoaded', () => {
  // Sticky Navbar Scroll Effect
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  });

  // Mobile Navigation Toggle
  const mobileToggle = document.getElementById('mobile-nav-toggle');
  const navMenu = document.getElementById('nav-menu-main');
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });

    // Close when clicking a nav link
    navMenu.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
      });
    });
  }

  // Smooth Navigation Highlight & View Switching
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetHash = link.getAttribute('href');
      if (targetHash && targetHash.startsWith('#')) {
        navLinks.forEach((l) => l.classList.remove('active'));
        link.classList.add('active');

        // If dashboard clicked, trigger dashboard refresh
        if (targetHash === '#dashboard') {
          if (window.Dashboard) {
            window.Dashboard.loadDashboard();
          }
        }
      }
    });
  });

  console.log('%c🚀 SmartEdu Architecture Initialized!', 'color:#10b981; font-size:14px; font-weight:bold;');
});
