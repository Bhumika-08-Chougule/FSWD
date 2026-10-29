/**
 * SmartEdu Analytics & Dashboard System (Chart.js Integration & Teacher CRUD)
 */

const Dashboard = {
  activeView: 'student', // 'student' or 'teacher'
  studentChartDonut: null,
  studentChartBar: null,
  teacherChartRevenue: null,
  teacherChartEnrollments: null,
  editingCourseId: null,

  init() {
    this.bindEvents();
    if (window.location.hash === '#dashboard' || window.location.pathname.includes('dashboard')) {
      this.loadDashboard();
    }
  },

  bindEvents() {
    const studentTab = document.getElementById('role-tab-student');
    const teacherTab = document.getElementById('role-tab-teacher');

    if (studentTab && teacherTab) {
      studentTab.addEventListener('click', () => {
        studentTab.classList.add('active');
        teacherTab.classList.remove('active');
        this.activeView = 'student';
        this.renderDashboardView();
      });

      teacherTab.addEventListener('click', () => {
        if (!AppState.user || AppState.user.role !== 'teacher') {
          showToast('Instructor Access', 'Please sign in with a Teacher account (Try Demo Teacher).', 'info');
          if (window.Auth) window.Auth.openModal('login');
          return;
        }
        teacherTab.classList.add('active');
        studentTab.classList.remove('active');
        this.activeView = 'teacher';
        this.renderDashboardView();
      });
    }

    // Teacher Create Course Modal
    const openCreateBtn = document.getElementById('btn-open-create-course');
    const modalBackdrop = document.getElementById('course-form-modal-backdrop');
    const modalCloseBtn = document.getElementById('course-form-modal-close');
    const courseForm = document.getElementById('teacher-course-form');

    if (openCreateBtn) {
      openCreateBtn.addEventListener('click', () => {
        this.openCourseFormModal();
      });
    }

    if (modalCloseBtn && modalBackdrop) {
      modalCloseBtn.addEventListener('click', () => this.closeCourseFormModal());
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) this.closeCourseFormModal();
      });
    }

    if (courseForm) {
      courseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleSaveCourse();
      });
    }

    // Certificate Modal Close
    const certBackdrop = document.getElementById('cert-modal-backdrop');
    const certClose = document.getElementById('cert-modal-close');
    if (certClose && certBackdrop) {
      certClose.addEventListener('click', () => {
        certBackdrop.classList.remove('open');
      });
      certBackdrop.addEventListener('click', (e) => {
        if (e.target === certBackdrop) certBackdrop.classList.remove('open');
      });
    }

    AppState.on('userChanged', () => {
      this.loadDashboard();
    });
  },

  async loadDashboard() {
    if (!AppState.user) {
      this.renderGuestPrompt();
      return;
    }

    // Sync default view to user role
    if (AppState.user.role === 'teacher') {
      this.activeView = 'teacher';
      const teacherTab = document.getElementById('role-tab-teacher');
      const studentTab = document.getElementById('role-tab-student');
      if (teacherTab) teacherTab.classList.add('active');
      if (studentTab) studentTab.classList.remove('active');
    } else {
      this.activeView = 'student';
    }

    this.renderDashboardView();
  },

  renderGuestPrompt() {
    const studentContainer = document.getElementById('student-dashboard-content');
    const teacherContainer = document.getElementById('teacher-dashboard-content');
    if (studentContainer) {
      studentContainer.innerHTML = `
        <div class="empty-results" style="margin-top:2rem;">
          <div class="empty-results-icon">📊</div>
          <h3>Sign in to access your Analytics Dashboard</h3>
          <p>Track your learning hours, course completion certificates, and AI recommendations.</p>
          <div style="display:flex; justify-content:center; gap:1rem; margin-top:1rem;">
            <button class="btn btn-primary" onclick="Auth.openModal('login')">Sign In</button>
            <button class="btn btn-secondary" onclick="Auth.loginWithCredentials('student@smartedu.dev', 'student123')">Quick Student Demo</button>
          </div>
        </div>
      `;
    }
    if (teacherContainer) teacherContainer.style.display = 'none';
  },

  renderDashboardView() {
    const studentContent = document.getElementById('student-dashboard-content');
    const teacherContent = document.getElementById('teacher-dashboard-content');

    if (this.activeView === 'student') {
      if (studentContent) studentContent.style.display = 'block';
      if (teacherContent) teacherContent.style.display = 'none';
      this.loadStudentAnalytics();
      this.loadEnrolledCourses();
    } else {
      if (studentContent) studentContent.style.display = 'none';
      if (teacherContent) teacherContent.style.display = 'block';
      this.loadTeacherAnalytics();
      this.loadTeacherCourses();
    }
  },

  // -------------------------------------------------------------
  // STUDENT VIEW (Chart.js Progress Wheel & Hours Bar Chart)
  // -------------------------------------------------------------
  async loadStudentAnalytics() {
    try {
      const res = await API.get('/analytics/student');
      if (!res.success) return;

      const data = res.data;

      // Update Metric Cards
      const hoursEl = document.getElementById('metric-student-hours');
      const countEl = document.getElementById('metric-student-enrolled');
      const certsEl = document.getElementById('metric-student-certs');

      if (hoursEl) hoursEl.textContent = `${data.hoursSpent}h`;
      if (countEl) countEl.textContent = data.totalEnrolled;
      if (certsEl) certsEl.textContent = data.completedCoursesCount;

      this.renderStudentCharts(data);
    } catch (err) {
      console.warn('Error loading student analytics:', err);
    }
  },

  renderStudentCharts(data) {
    if (typeof Chart === 'undefined') return;

    // 1. Completion Donut / Progress Wheel
    const donutCtx = document.getElementById('studentProgressDonut');
    if (donutCtx) {
      if (this.studentChartDonut) this.studentChartDonut.destroy();

      const completed = data.progressBreakdown.completed;
      const inProgress = data.progressBreakdown.inProgress;
      const notStarted = data.progressBreakdown.notStarted;

      this.studentChartDonut = new Chart(donutCtx, {
        type: 'doughnut',
        data: {
          labels: ['Completed', 'In Progress', 'Just Started'],
          datasets: [
            {
              data: [completed || 1, inProgress || 2, notStarted || 0],
              backgroundColor: ['#10b981', '#3b82f6', '#334155'],
              borderColor: '#0f172a',
              borderWidth: 3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#cbd5e1', font: { family: 'Plus Jakarta Sans', size: 12 } }
            }
          },
          cutout: '72%'
        }
      });
    }

    // 2. Weekly Study Hours Bar Chart
    const barCtx = document.getElementById('studentWeeklyBarChart');
    if (barCtx) {
      if (this.studentChartBar) this.studentChartBar.destroy();

      const labels = data.weeklyActivity.map((w) => w.day);
      const hours = data.weeklyActivity.map((w) => w.hours);

      this.studentChartBar = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Hours Spent',
              data: hours,
              backgroundColor: 'rgba(16, 185, 129, 0.85)',
              borderRadius: 6,
              hoverBackgroundColor: '#34d399'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              ticks: { color: '#94a3b8' },
              grid: { display: false }
            },
            y: {
              ticks: { color: '#94a3b8' },
              grid: { color: 'rgba(255, 255, 255, 0.05)' }
            }
          }
        }
      });
    }
  },

  async loadEnrolledCourses() {
    const container = document.getElementById('student-enrolled-grid');
    if (!container) return;

    try {
      const res = await API.get('/orders/enrolled');
      if (res.success && res.data.length > 0) {
        container.innerHTML = res.data
          .map(
            (c) => `
          <div class="enrolled-card">
            <div class="enrolled-card-header">
              <img src="${c.thumbnailUrl}" class="enrolled-card-img" alt="${c.title}" onerror="this.src='https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&q=80'" />
              <div>
                <h4 class="enrolled-card-title">${c.title}</h4>
                <span class="category-tag" style="margin-top:4px; display:inline-block;">${c.category}</span>
              </div>
            </div>

            <div class="progress-bar-wrap">
              <div class="progress-bar-fill" style="width: ${c.progress}%;"></div>
            </div>

            <div class="progress-meta-row">
              <span>Progress: <strong>${c.progress}%</strong></span>
              <span>${c.completedLessons} / ${c.totalLessons} Lessons</span>
            </div>

            <div class="enrolled-card-actions">
              <button class="btn btn-primary btn-sm" onclick="Catalog.openDetailModal('${c._id}')">
                ▶ Resume Learning
              </button>
              <button class="btn btn-secondary btn-sm" onclick="Dashboard.openCertificateModal('${c.title}')">
                🎓 Certificate
              </button>
            </div>
          </div>
        `
          )
          .join('');
      } else {
        container.innerHTML = `
          <div class="empty-results" style="grid-column: 1/-1;">
            <p>You haven't enrolled in any courses yet.</p>
            <button class="btn btn-primary btn-sm" onclick="window.location.href='/#catalog'">Browse Catalog</button>
          </div>
        `;
      }
    } catch (err) {
      console.warn('Error loading enrolled courses:', err);
    }
  },

  openCertificateModal(courseTitle) {
    const backdrop = document.getElementById('cert-modal-backdrop');
    const recipient = document.getElementById('cert-recipient-name');
    const courseEl = document.getElementById('cert-course-title');
    const dateEl = document.getElementById('cert-issue-date');
    const certIdEl = document.getElementById('cert-id-number');

    if (recipient) recipient.textContent = AppState.user ? AppState.user.name : 'Alex Morgan';
    if (courseEl) courseEl.textContent = courseTitle;
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    if (certIdEl) certIdEl.textContent = 'SE-CERT-' + Math.floor(100000 + Math.random() * 900000);

    if (backdrop) backdrop.classList.add('open');
  },

  // -------------------------------------------------------------
  // TEACHER VIEW (Revenue Metrics & Course CRUD System)
  // -------------------------------------------------------------
  async loadTeacherAnalytics() {
    try {
      const res = await API.get('/analytics/teacher');
      if (!res.success) return;

      const data = res.data;

      // Update Teacher Metric Cards
      const revEl = document.getElementById('metric-teacher-revenue');
      const stuEl = document.getElementById('metric-teacher-students');
      const crsEl = document.getElementById('metric-teacher-courses');
      const ratEl = document.getElementById('metric-teacher-rating');

      if (revEl) revEl.textContent = `$${data.totalRevenue.toLocaleString()}`;
      if (stuEl) stuEl.textContent = data.totalStudents.toLocaleString();
      if (crsEl) crsEl.textContent = data.totalCourses;
      if (ratEl) ratEl.textContent = `⭐ ${data.avgRating}`;

      this.renderTeacherCharts(data);
    } catch (err) {
      console.warn('Error loading teacher analytics:', err);
    }
  },

  renderTeacherCharts(data) {
    if (typeof Chart === 'undefined') return;

    // 1. Revenue Growth Line Chart
    const revCtx = document.getElementById('teacherRevenueChart');
    if (revCtx) {
      if (this.teacherChartRevenue) this.teacherChartRevenue.destroy();

      this.teacherChartRevenue = new Chart(revCtx, {
        type: 'line',
        data: {
          labels: data.monthlyRevenue.map((m) => m.month),
          datasets: [
            {
              label: 'Revenue ($)',
              data: data.monthlyRevenue.map((m) => m.revenue),
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              fill: true,
              tension: 0.35,
              pointBackgroundColor: '#10b981',
              pointRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              ticks: { color: '#94a3b8' },
              grid: { display: false }
            },
            y: {
              ticks: { color: '#94a3b8' },
              grid: { color: 'rgba(255, 255, 255, 0.05)' }
            }
          }
        }
      });
    }

    // 2. Student Enrollments per Course (Horizontal Bar Chart)
    const enrollCtx = document.getElementById('teacherEnrollmentChart');
    if (enrollCtx) {
      if (this.teacherChartEnrollments) this.teacherChartEnrollments.destroy();

      this.teacherChartEnrollments = new Chart(enrollCtx, {
        type: 'bar',
        data: {
          labels: data.courseEnrollments.map((c) => c.title),
          datasets: [
            {
              label: 'Enrollments',
              data: data.courseEnrollments.map((c) => c.enrollments),
              backgroundColor: '#3b82f6',
              borderRadius: 6
            }
          ]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              ticks: { color: '#94a3b8' },
              grid: { color: 'rgba(255, 255, 255, 0.05)' }
            },
            y: {
              ticks: { color: '#94a3b8' },
              grid: { display: false }
            }
          }
        }
      });
    }
  },

  async loadTeacherCourses() {
    const tableBody = document.getElementById('teacher-courses-table-body');
    if (!tableBody) return;

    try {
      const res = await API.get('/courses/teacher/mine');
      if (res.success) {
        if (res.data.length === 0) {
          tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--slate-400);">You haven't uploaded any courses yet. Click "Upload New Course" to get started!</td></tr>`;
          return;
        }

        tableBody.innerHTML = res.data
          .map(
            (c) => `
          <tr>
            <td>
              <div class="table-course-item">
                <img src="${c.thumbnailUrl}" class="table-course-thumb" alt="${c.title}" onerror="this.src='https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&q=80'" />
                <div class="table-course-info">
                  <strong>${c.title}</strong>
                  <span>${c.category} • ${c.difficulty}</span>
                </div>
              </div>
            </td>
            <td><strong>$${c.price}</strong></td>
            <td>${c.studentsEnrolled || 0}</td>
            <td>⭐ ${Number(c.rating || 5.0).toFixed(1)} (${c.numReviews || 0})</td>
            <td><span class="semantic-badge" style="font-size:0.75rem;">Live</span></td>
            <td>
              <div class="action-buttons">
                <button class="btn btn-secondary btn-sm" onclick="Dashboard.openEditCourseModal('${c._id}')" title="Edit Course">✏️</button>
                <button class="btn btn-danger btn-sm" onclick="Dashboard.handleDeleteCourse('${c._id}')" title="Delete Course">🗑️</button>
              </div>
            </td>
          </tr>
        `
          )
          .join('');
      }
    } catch (err) {
      console.warn('Error loading teacher courses:', err);
    }
  },

  openCourseFormModal(course = null) {
    this.editingCourseId = course ? course._id : null;
    const modalBackdrop = document.getElementById('course-form-modal-backdrop');
    const modalTitle = document.getElementById('course-form-title');

    if (modalTitle) {
      modalTitle.textContent = course ? 'Edit Course' : 'Create New Course';
    }

    // Populate or reset form fields
    document.getElementById('input-course-title').value = course ? course.title : '';
    document.getElementById('input-course-desc').value = course ? course.description : '';
    document.getElementById('input-course-category').value = course ? course.category : 'Web Development';
    document.getElementById('input-course-price').value = course ? course.price : 49;
    document.getElementById('input-course-difficulty').value = course ? course.difficulty : 'Beginner';
    document.getElementById('input-course-thumb').value = course ? course.thumbnailUrl : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80';
    document.getElementById('input-course-video').value = course ? course.contentUrl : 'https://www.youtube.com/embed/dQw4w9WgXcQ';
    document.getElementById('input-course-tags').value = course ? (course.tags || []).join(', ') : 'JavaScript, Full Stack, React';

    if (modalBackdrop) modalBackdrop.classList.add('open');
  },

  closeCourseFormModal() {
    const modalBackdrop = document.getElementById('course-form-modal-backdrop');
    if (modalBackdrop) modalBackdrop.classList.remove('open');
    this.editingCourseId = null;
  },

  async openEditCourseModal(courseId) {
    try {
      const res = await API.get(`/courses/${courseId}`);
      if (res.success) {
        this.openCourseFormModal(res.data);
      }
    } catch (err) {
      showToast('Error', 'Failed to fetch course details for editing', 'error');
    }
  },

  async handleSaveCourse() {
    const title = document.getElementById('input-course-title').value.trim();
    const description = document.getElementById('input-course-desc').value.trim();
    const category = document.getElementById('input-course-category').value;
    const price = Number(document.getElementById('input-course-price').value);
    const difficulty = document.getElementById('input-course-difficulty').value;
    const thumbnailUrl = document.getElementById('input-course-thumb').value.trim();
    const contentUrl = document.getElementById('input-course-video').value.trim();
    const tags = document.getElementById('input-course-tags').value;

    const payload = {
      title,
      description,
      category,
      price,
      difficulty,
      thumbnailUrl,
      contentUrl,
      tags
    };

    try {
      if (this.editingCourseId) {
        await API.put(`/courses/${this.editingCourseId}`, payload);
        showToast('Updated!', 'Course updated successfully', 'success');
      } else {
        await API.post('/courses', payload);
        showToast('Published!', 'New course published to catalog!', 'success');
      }

      this.closeCourseFormModal();
      this.loadTeacherCourses();
      this.loadTeacherAnalytics();
      if (window.Catalog) window.Catalog.loadCourses();
    } catch (err) {
      showToast('Error', err.message || 'Failed to save course', 'error');
    }
  },

  async handleDeleteCourse(courseId) {
    if (!confirm('Are you sure you want to delete this course permanently?')) return;
    try {
      await API.delete(`/courses/${courseId}`);
      showToast('Deleted', 'Course removed successfully', 'info');
      this.loadTeacherCourses();
      this.loadTeacherAnalytics();
      if (window.Catalog) window.Catalog.loadCourses();
    } catch (err) {
      showToast('Delete Failed', err.message || 'Could not delete course', 'error');
    }
  }
};

window.Dashboard = Dashboard;
document.addEventListener('DOMContentLoaded', () => Dashboard.init());
