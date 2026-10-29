/**
 * SmartEdu Course Catalog & Detail View Module
 */

const Catalog = {
  currentCourseDetail: null,

  init() {
    this.bindEvents();
    this.loadCategories();
    this.loadCourses();
  },

  bindEvents() {
    // Synchronized Search Inputs with Debounce
    const searchInput = document.getElementById('catalog-search-input');
    const heroSearchInput = document.getElementById('hero-search-input');
    const navSearchInput = document.getElementById('nav-search-input');
    const searchClearBtn = document.getElementById('catalog-search-clear');
    const heroClearBtn = document.getElementById('hero-search-clear');

    let debounceTimer;
    const triggerSearch = (val, shouldScroll = false) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.setSearch(val, shouldScroll);
      }, 250);
    };

    if (searchInput) {
      searchInput.addEventListener('input', (e) => triggerSearch(e.target.value, false));
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          clearTimeout(debounceTimer);
          this.setSearch(searchInput.value, true);
        }
      });
    }

    if (heroSearchInput) {
      heroSearchInput.addEventListener('input', (e) => triggerSearch(e.target.value, false));
      heroSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          clearTimeout(debounceTimer);
          this.setSearch(heroSearchInput.value, true);
        }
      });
    }

    if (navSearchInput) {
      navSearchInput.addEventListener('input', (e) => triggerSearch(e.target.value, false));
      navSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          clearTimeout(debounceTimer);
          this.setSearch(navSearchInput.value, true);
        }
      });
    }

    // Clear Buttons
    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', () => this.clearSearch());
    }
    if (heroClearBtn) {
      heroClearBtn.addEventListener('click', () => this.clearSearch());
    }

    // Difficulty filter
    const diffSelect = document.getElementById('catalog-difficulty-select');
    if (diffSelect) {
      diffSelect.addEventListener('change', (e) => {
        AppState.activeDifficulty = e.target.value;
        this.loadCourses();
      });
    }

    // Sort filter
    const sortSelect = document.getElementById('catalog-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        AppState.sortBy = e.target.value;
        this.loadCourses();
      });
    }

    // Course Detail Modal Close
    const detailBackdrop = document.getElementById('course-detail-backdrop');
    const detailClose = document.getElementById('course-detail-close');
    if (detailClose && detailBackdrop) {
      detailClose.addEventListener('click', () => this.closeDetailModal());
      detailBackdrop.addEventListener('click', (e) => {
        if (e.target === detailBackdrop) this.closeDetailModal();
      });
    }
  },

  setSearch(query, shouldScroll = false) {
    const val = (query || '').trim();
    AppState.searchQuery = val;

    // Sync all search inputs
    const searchInput = document.getElementById('catalog-search-input');
    const heroSearchInput = document.getElementById('hero-search-input');
    const navSearchInput = document.getElementById('nav-search-input');
    const searchClearBtn = document.getElementById('catalog-search-clear');
    const heroClearBtn = document.getElementById('hero-search-clear');

    if (searchInput) searchInput.value = val;
    if (heroSearchInput) heroSearchInput.value = val;
    if (navSearchInput) navSearchInput.value = val;

    // Toggle clear buttons
    if (searchClearBtn) searchClearBtn.style.display = val ? 'flex' : 'none';
    if (heroClearBtn) heroClearBtn.style.display = val ? 'flex' : 'none';

    // When starting a new search, reset category to 'All' so matches from any track are found
    if (val && AppState.activeCategory !== 'All') {
      AppState.activeCategory = 'All';
      this.updateActiveCategoryPill('All');
    }

    if (shouldScroll) {
      const catalogEl = document.getElementById('catalog');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
    }

    this.loadCourses();
  },

  clearSearch() {
    this.setSearch('', false);
  },

  updateActiveCategoryPill(catName) {
    const container = document.getElementById('category-pills-list');
    if (!container) return;
    container.querySelectorAll('.cat-pill').forEach((pill) => {
      if (pill.dataset.cat === catName) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
  },

  async loadCategories() {
    try {
      const res = await API.get('/courses/meta/categories');
      if (res.success) {
        AppState.categories = res.data;
        this.renderCategoryPills();
      }
    } catch (err) {
      console.warn('Could not load categories:', err);
    }
  },

  renderCategoryPills() {
    const container = document.getElementById('category-pills-list');
    if (!container) return;

    container.innerHTML = AppState.categories
      .map(
        (cat) => `
      <button class="cat-pill ${AppState.activeCategory === cat.name ? 'active' : ''}" data-cat="${cat.name}">
        <span>${cat.icon}</span>
        <span>${cat.name}</span>
        <span class="count-badge">${cat.count}</span>
      </button>
    `
      )
      .join('');

    container.querySelectorAll('.cat-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        container.querySelectorAll('.cat-pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        AppState.activeCategory = pill.dataset.cat;
        this.loadCourses();
      });
    });
  },

  renderSearchIndicator(count) {
    const indicator = document.getElementById('active-search-indicator');
    if (!indicator) return;

    if (AppState.searchQuery && AppState.searchQuery.trim() !== '') {
      indicator.style.display = 'flex';
      indicator.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap;">
          <span class="search-pill-badge">
            🔍 "${AppState.searchQuery}" (${count} ${count === 1 ? 'course' : 'courses'} found)
          </span>
          ${AppState.activeCategory !== 'All' ? `<span style="color:var(--slate-400); font-size:0.8rem;">in ${AppState.activeCategory}</span>` : ''}
        </div>
        <button class="btn btn-secondary btn-sm" onclick="Catalog.clearSearch()" style="font-size:0.75rem; padding:0.25rem 0.65rem;">
          Clear Search ✕
        </button>
      `;
    } else {
      indicator.style.display = 'none';
      indicator.innerHTML = '';
    }
  },

  async loadCourses() {
    const grid = document.getElementById('course-catalog-grid');
    if (!grid) return;

    try {
      let query = `?category=${encodeURIComponent(AppState.activeCategory)}&difficulty=${encodeURIComponent(AppState.activeDifficulty)}&sort=${encodeURIComponent(AppState.sortBy)}`;
      if (AppState.searchQuery) {
        query += `&search=${encodeURIComponent(AppState.searchQuery)}`;
      }

      const res = await API.get(`/courses${query}`);
      if (res.success) {
        AppState.courses = res.data;
        this.renderSearchIndicator(res.count);
        this.renderCourseCards(res.data);

        // Run AI recommendation engine whenever courses load
        if (window.AIRecommender) {
          window.AIRecommender.runRecommendations();
        }
      }
    } catch (err) {
      grid.innerHTML = `<div class="empty-results"><p>Error loading courses: ${err.message}</p></div>`;
    }
  },

  renderCourseCards(courses) {
    const grid = document.getElementById('course-catalog-grid');
    if (!grid) return;

    if (!courses || courses.length === 0) {
      grid.innerHTML = `
        <div class="empty-results">
          <div class="empty-results-icon">🔍</div>
          <h4>No matching courses found for "${AppState.searchQuery || ''}"</h4>
          <p style="color:var(--slate-400); margin-bottom:1.25rem;">
            Try one of these popular topic searches or clear filters:
          </p>
          <div style="display:flex; justify-content:center; gap:0.5rem; flex-wrap:wrap; max-width:620px; margin:0 auto 1.5rem;">
            <button class="search-chip-tag" onclick="Catalog.setSearch('React', true)">React</button>
            <button class="search-chip-tag" onclick="Catalog.setSearch('Python', true)">Python</button>
            <button class="search-chip-tag" onclick="Catalog.setSearch('Artificial Intelligence', true)">AI / ML</button>
            <button class="search-chip-tag" onclick="Catalog.setSearch('Cloud', true)">Cloud & DevOps</button>
            <button class="search-chip-tag" onclick="Catalog.setSearch('Node.js', true)">Node.js</button>
            <button class="search-chip-tag" onclick="Catalog.setSearch('Cyber Security', true)">Ethical Hacking</button>
            <button class="search-chip-tag" onclick="Catalog.setSearch('JavaScript', true)">JavaScript</button>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="Catalog.resetFilters()">Reset All Filters</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = courses
      .map((course) => {
        const isEnrolled =
          AppState.user &&
          AppState.user.enrolledCourses &&
          AppState.user.enrolledCourses.some((id) => String(id) === String(course._id));

        const isInCart = AppState.cart.some((item) => String(item._id) === String(course._id));

        return `
        <div class="course-card" data-id="${course._id}">
          <div class="card-thumbnail-wrap">
            <img src="${course.thumbnailUrl}" alt="${course.title}" class="card-thumbnail" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&q=80'" />
            <div class="card-badges">
              <span class="category-tag">${course.category}</span>
              <span class="difficulty-tag ${course.difficulty.toLowerCase()}">${course.difficulty}</span>
            </div>
          </div>

          <div class="card-body">
            <div class="card-tags">
              ${(course.tags || []).slice(0, 3).map((t) => `<span class="tag-badge">#${t}</span>`).join('')}
            </div>

            <h3 class="card-title" title="${course.title}">${course.title}</h3>
            <p class="card-desc">${course.description}</p>

            <div class="card-meta">
              <div class="instructor-info">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(course.teacherName)}" alt="${course.teacherName}" class="instructor-avatar" />
                <span class="instructor-name">${course.teacherName}</span>
              </div>
              <div class="rating-badge">
                ⭐ ${Number(course.rating || 5.0).toFixed(1)} <span class="rating-count">(${course.numReviews || 0})</span>
              </div>
            </div>

            <div class="card-footer">
              <div class="price-box">
                <span class="original-price">$${(course.price * 1.5).toFixed(0)}</span>
                <span class="current-price">$${course.price}</span>
              </div>
              <div class="card-actions">
                <button class="btn btn-secondary btn-sm" onclick="Catalog.openDetailModal('${course._id}')">
                  👁️ View
                </button>
                ${
                  isEnrolled
                    ? `<button class="btn btn-outline-emerald btn-sm" onclick="window.location.href='/#dashboard'">Enrolled</button>`
                    : isInCart
                    ? `<button class="btn btn-outline-emerald btn-sm" onclick="Cart.openDrawer()">In Cart</button>`
                    : `<button class="btn btn-primary btn-sm" onclick="AppState.addToCart(AppState.courses.find(c => c._id === '${course._id}'))">🛒 Add</button>`
                }
              </div>
            </div>
          </div>
        </div>
      `;
      })
      .join('');
  },

  resetFilters() {
    AppState.activeCategory = 'All';
    AppState.activeDifficulty = 'All';
    AppState.searchQuery = '';
    AppState.sortBy = 'newest';

    const searchInput = document.getElementById('catalog-search-input');
    const heroSearchInput = document.getElementById('hero-search-input');
    const navSearchInput = document.getElementById('nav-search-input');
    const diffSelect = document.getElementById('catalog-difficulty-select');
    const sortSelect = document.getElementById('catalog-sort-select');
    const searchClearBtn = document.getElementById('catalog-search-clear');
    const heroClearBtn = document.getElementById('hero-search-clear');

    if (searchInput) searchInput.value = '';
    if (heroSearchInput) heroSearchInput.value = '';
    if (navSearchInput) navSearchInput.value = '';
    if (searchClearBtn) searchClearBtn.style.display = 'none';
    if (heroClearBtn) heroClearBtn.style.display = 'none';
    if (diffSelect) diffSelect.value = 'All';
    if (sortSelect) sortSelect.value = 'newest';

    this.renderSearchIndicator(0);
    this.renderCategoryPills();
    this.loadCourses();
  },

  async openDetailModal(courseId) {
    const backdrop = document.getElementById('course-detail-backdrop');
    if (!backdrop) return;

    try {
      const res = await API.get(`/courses/${courseId}`);
      if (res.success) {
        this.currentCourseDetail = res.data;
        this.renderDetailContent(res.data);
        backdrop.classList.add('open');
      }
    } catch (err) {
      showToast('Error', 'Unable to load course details', 'error');
    }
  },

  closeDetailModal() {
    const backdrop = document.getElementById('course-detail-backdrop');
    if (backdrop) {
      backdrop.classList.remove('open');
    }
  },

  renderDetailContent(c) {
    const modalContent = document.getElementById('course-detail-modal-body');
    if (!modalContent) return;

    const isEnrolled =
      AppState.user &&
      AppState.user.enrolledCourses &&
      AppState.user.enrolledCourses.some((id) => String(id) === String(c._id));

    modalContent.innerHTML = `
      <div class="course-detail-layout">
        <!-- Left: Video Player & Syllabus -->
        <div class="detail-left">
          <div class="video-container">
            <iframe 
              src="${c.contentUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ'}" 
              title="${c.title}" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen>
            </iframe>
          </div>

          <div style="display:flex; gap:0.5rem; margin-bottom:1rem; flex-wrap:wrap;">
            <span class="category-tag">${c.category}</span>
            <span class="difficulty-tag ${c.difficulty.toLowerCase()}">${c.difficulty} Level</span>
            <span class="semantic-badge" style="font-size:0.75rem;">⏱️ ${c.durationHours || 12} Hours of Video</span>
            <span class="semantic-badge blue" style="font-size:0.75rem;">🎓 Certificate Included</span>
          </div>

          <h2 style="font-family:var(--font-display); font-size:1.6rem; color:white; margin-bottom:0.75rem;">${c.title}</h2>
          <p style="color:var(--slate-300); font-size:0.95rem; line-height:1.6; margin-bottom:1.5rem;">${c.description}</p>

          <h3 style="font-family:var(--font-display); font-size:1.2rem; color:white; margin-bottom:0.75rem;">Curriculum & Lessons</h3>
          <div class="syllabus-accordion">
            ${(c.syllabus || [
              {
                sectionTitle: 'Section 1: Foundations & Architecture',
                duration: '3 hours',
                lessons: [
                  { title: 'Course Roadmap & Setup Guide', duration: '12m', isFree: true },
                  { title: 'Core Principles & Best Practices', duration: '28m', isFree: true },
                  { title: 'Building the First Working Module', duration: '1h 10m', isFree: false }
                ]
              },
              {
                sectionTitle: 'Section 2: Production Engineering & Scale',
                duration: '5 hours',
                lessons: [
                  { title: 'Microservices & High Concurrency', duration: '1h 30m', isFree: false },
                  { title: 'Automated CI/CD Pipeline Setup', duration: '1h 45m', isFree: false }
                ]
              }
            ])
              .map(
                (sec, idx) => `
              <div class="syllabus-section">
                <div class="syllabus-header" onclick="this.nextElementSibling.classList.toggle('hide')">
                  <span>${sec.sectionTitle}</span>
                  <span style="font-size:0.8rem; color:var(--emerald-400);">${sec.duration} ▾</span>
                </div>
                <div class="syllabus-lessons">
                  ${(sec.lessons || [])
                    .map(
                      (les) => `
                    <div class="lesson-item ${les.isFree ? 'free' : ''}">
                      <span>▶ ${les.title}</span>
                      <div style="display:flex; align-items:center; gap:0.5rem;">
                        <span style="font-size:0.75rem; color:var(--slate-400);">${les.duration}</span>
                        ${les.isFree ? '<span class="preview-badge">Free Preview</span>' : '🔒'}
                      </div>
                    </div>
                  `
                    )
                    .join('')}
                </div>
              </div>
            `
              )
              .join('')}
          </div>

          <!-- Reviews Section -->
          <div style="margin-top:2.5rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
              <h3 style="font-family:var(--font-display); font-size:1.2rem; color:white;">
                Student Reviews (${c.reviews?.length || 0})
              </h3>
              <div class="rating-badge" style="font-size:1rem;">
                ⭐ ${Number(c.rating || 5.0).toFixed(1)} / 5.0
              </div>
            </div>

            <!-- Add Review Form (for verified students) -->
            <div id="add-review-container" style="background:rgba(255,255,255,0.03); border:1px solid var(--card-border); border-radius:var(--radius-md); padding:1.25rem; margin-bottom:1.5rem;">
              <h4 style="font-size:0.95rem; color:white; margin-bottom:0.75rem;">Leave a Review & Rating</h4>
              <form id="submit-review-form">
                <div style="display:flex; align-items:center; gap:1rem; margin-bottom:0.75rem;">
                  <label style="font-size:0.85rem; color:var(--slate-300);">Rating:</label>
                  <select id="review-rating-select" class="custom-select" style="padding:0.4rem 0.8rem;">
                    <option value="5">⭐⭐⭐⭐⭐ (5.0 Excellent)</option>
                    <option value="4">⭐⭐⭐⭐ (4.0 Very Good)</option>
                    <option value="3">⭐⭐⭐ (3.0 Good)</option>
                    <option value="2">⭐⭐ (2.0 Fair)</option>
                    <option value="1">⭐ (1.0 Poor)</option>
                  </select>
                </div>
                <textarea id="review-comment-input" class="form-input" placeholder="Share your experience with this course..." rows="2" style="margin-bottom:0.75rem;" required></textarea>
                <button type="submit" class="btn btn-primary btn-sm">Submit Verified Review</button>
              </form>
            </div>

            <!-- Reviews List -->
            <div id="detail-reviews-list" style="display:flex; flex-direction:column; gap:0.85rem;">
              ${(c.reviews || [])
                .map(
                  (r) => `
                <div style="padding:1rem; background:rgba(255,255,255,0.02); border:1px solid var(--card-border); border-radius:var(--radius-md);">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                    <div style="display:flex; align-items:center; gap:0.5rem;">
                      <img src="${r.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(r.userName)}`}" style="width:24px; height:24px; border-radius:50%;" />
                      <strong style="font-size:0.85rem; color:white;">${r.userName}</strong>
                      <span class="semantic-badge" style="font-size:0.65rem; padding:0.1rem 0.4rem;">Verified Enrollee</span>
                    </div>
                    <span style="color:#fbbf24; font-size:0.85rem;">${'⭐'.repeat(r.rating || 5)}</span>
                  </div>
                  <p style="font-size:0.85rem; color:var(--slate-300);">${r.comment}</p>
                </div>
              `
                )
                .join('') || '<p style="color:var(--slate-500); font-size:0.85rem;">No reviews yet. Be the first to share your thoughts!</p>'}
            </div>
          </div>
        </div>

        <!-- Right: Purchase Card & Features -->
        <div class="detail-right">
          <div class="glass-card" style="position:sticky; top:20px;">
            <div style="font-size:2rem; font-weight:800; font-family:var(--font-display); color:var(--emerald-400); margin-bottom:1rem;">
              $${c.price} <span style="font-size:0.95rem; color:var(--slate-400); text-decoration:line-through;">$${(c.price * 1.5).toFixed(0)}</span>
            </div>

            ${
              isEnrolled
                ? `
              <div style="padding:1rem; background:rgba(16,185,129,0.15); border:1px solid var(--emerald-500); border-radius:var(--radius-md); text-align:center; margin-bottom:1.25rem;">
                <span style="color:var(--emerald-400); font-weight:700; font-size:0.9rem;">You own this course!</span>
                <button class="btn btn-primary" style="width:100%; margin-top:0.75rem;" onclick="window.location.href='/#dashboard'">Open in Dashboard</button>
              </div>
            `
                : `
              <button class="btn btn-primary btn-lg" style="width:100%; margin-bottom:0.75rem;" onclick="AppState.addToCart(Catalog.currentCourseDetail); Cart.openDrawer();">
                🛒 Add To Cart
              </button>
              <button class="btn btn-accent" style="width:100%; margin-bottom:1.5rem;" onclick="AppState.addToCart(Catalog.currentCourseDetail); Checkout.openModal();">
                ⚡ Buy Now
              </button>
            `
            }

            <h4 style="font-size:0.9rem; color:white; margin-bottom:0.75rem;">This course includes:</h4>
            <ul style="list-style:none; display:flex; flex-direction:column; gap:0.6rem; font-size:0.85rem; color:var(--slate-300);">
              <li>📹 ${c.durationHours || 12} hours on-demand video</li>
              <li>💻 Hands-on coding exercises & projects</li>
              <li>📱 Access on mobile and desktop</li>
              <li>🎓 Certificate of completion</li>
              <li>♾️ Full lifetime access</li>
            </ul>

            <div style="margin-top:1.5rem; padding-top:1.25rem; border-top:1px solid var(--card-border);">
              <h4 style="font-size:0.85rem; color:var(--slate-400); margin-bottom:0.5rem;">Instructor</h4>
              <div style="display:flex; align-items:center; gap:0.75rem;">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c.teacherName)}" style="width:40px; height:40px; border-radius:50%; border:2px solid var(--emerald-500);" />
                <div>
                  <div style="font-weight:700; color:white; font-size:0.9rem;">${c.teacherName}</div>
                  <div style="font-size:0.75rem; color:var(--emerald-400);">Verified Educator & Industry Expert</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind review submission form
    const reviewForm = document.getElementById('submit-review-form');
    if (reviewForm) {
      reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!AppState.user) {
          showToast('Sign In Required', 'Please log in to submit a review', 'error');
          Auth.openModal('login');
          return;
        }

        const ratingVal = document.getElementById('review-rating-select').value;
        const commentVal = document.getElementById('review-comment-input').value;

        try {
          const res = await API.post(`/reviews/course/${c._id}`, {
            rating: ratingVal,
            comment: commentVal
          });

          if (res.success) {
            showToast('Review Submitted', 'Thank you for your rating!', 'success');
            // Re-fetch and re-render modal
            this.openDetailModal(c._id);
            // Refresh courses
            this.loadCourses();
          }
        } catch (err) {
          showToast('Review Failed', err.message || 'Only enrolled students can review this course', 'error');
        }
      });
    }
  }
};

window.Catalog = Catalog;
document.addEventListener('DOMContentLoaded', () => Catalog.init());
