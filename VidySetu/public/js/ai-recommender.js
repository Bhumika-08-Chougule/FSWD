/**
 * SmartEdu AI Course Recommendation Engine powered by TensorFlow.js
 * Implements Content-Based Feature Vector Embeddings and Tensor Cosine Similarity
 */

const AIRecommender = {
  isInitialized: false,
  vocabTags: [],
  vocabCategories: [],
  courseVectors: null,

  init() {
    // Check if TensorFlow.js is loaded
    if (typeof tf === 'undefined') {
      console.warn('[SmartEdu AI] TensorFlow.js not yet loaded. Waiting for CDN...');
      window.addEventListener('load', () => this.prepareModel());
    } else {
      this.prepareModel();
    }

    AppState.on('cartChanged', () => this.runRecommendations());
    AppState.on('userChanged', () => this.runRecommendations());
  },

  async prepareModel() {
    if (typeof tf === 'undefined') return;
    try {
      await tf.ready();
      console.log('[SmartEdu AI] TensorFlow.js backend initialized:', tf.getBackend());
      this.isInitialized = true;
      if (AppState.courses && AppState.courses.length > 0) {
        this.runRecommendations();
      }
    } catch (err) {
      console.error('[SmartEdu AI] Error initializing TensorFlow.js:', err);
    }
  },

  buildVocab(courses) {
    const tagSet = new Set();
    const catSet = new Set();

    courses.forEach((c) => {
      if (c.category) catSet.add(c.category);
      if (Array.isArray(c.tags)) {
        c.tags.forEach((t) => tagSet.add(t.toLowerCase().trim()));
      }
    });

    this.vocabTags = Array.from(tagSet);
    this.vocabCategories = Array.from(catSet);
  },

  extractCourseVector(course) {
    // Vector dimensions = [categories (one-hot), tags (multi-hot), difficulty (scalar), price (normalized)]
    const catVector = this.vocabCategories.map((cat) => (course.category === cat ? 1.0 : 0.0));

    const courseTags = (course.tags || []).map((t) => t.toLowerCase().trim());
    const tagVector = this.vocabTags.map((tag) => (courseTags.includes(tag) ? 1.0 : 0.0));

    const difficultyVal =
      course.difficulty === 'Beginner' ? 0.33 : course.difficulty === 'Intermediate' ? 0.66 : 1.0;

    const normalizedPrice = Math.min(1.0, (course.price || 0) / 200.0);

    return [...catVector, ...tagVector, difficultyVal, normalizedPrice];
  },

  extractUserProfileVector() {
    const courses = AppState.courses || [];
    const vectorDim = this.vocabCategories.length + this.vocabTags.length + 2;
    let userVector = new Array(vectorDim).fill(0);
    let sampleCount = 0;

    // 1. Weight by Enrolled Courses (High weight = 2.0)
    const enrolledIds = (AppState.user?.enrolledCourses || []).map(String);
    courses.forEach((c) => {
      if (enrolledIds.includes(String(c._id))) {
        const cVec = this.extractCourseVector(c);
        for (let i = 0; i < vectorDim; i++) {
          userVector[i] += cVec[i] * 2.0;
        }
        sampleCount += 2.0;
      }
    });

    // 2. Weight by Cart Items (Medium weight = 1.2)
    const cartIds = (AppState.cart || []).map((item) => String(item._id));
    courses.forEach((c) => {
      if (cartIds.includes(String(c._id))) {
        const cVec = this.extractCourseVector(c);
        for (let i = 0; i < vectorDim; i++) {
          userVector[i] += cVec[i] * 1.2;
        }
        sampleCount += 1.2;
      }
    });

    // 3. If guest or zero history, fallback to popular interests (AI, Web, Cloud)
    if (sampleCount === 0) {
      // Create seed baseline representation
      this.vocabCategories.forEach((cat, idx) => {
        if (cat === 'Artificial Intelligence' || cat === 'Web Development') {
          userVector[idx] = 1.0;
        }
      });
      userVector[vectorDim - 2] = 0.5; // mid difficulty preference
      sampleCount = 1;
    }

    // Average normalization
    return userVector.map((v) => v / sampleCount);
  },

  async runRecommendations() {
    const courses = AppState.courses;
    if (!courses || courses.length === 0) return;

    if (typeof tf === 'undefined') {
      console.warn('[SmartEdu AI] TensorFlow.js pending...');
      return;
    }

    this.buildVocab(courses);

    // Build course matrices
    const candidateCourses = courses;
    const enrolledIds = (AppState.user?.enrolledCourses || []).map(String);

    // Filter out already owned courses for recommendation
    const eligibleCourses = candidateCourses.filter((c) => !enrolledIds.includes(String(c._id)));

    if (eligibleCourses.length === 0) {
      this.renderRecommendations([]);
      return;
    }

    const courseVectors = eligibleCourses.map((c) => this.extractCourseVector(c));
    const userProfileVector = this.extractUserProfileVector();

    // TensorFlow.js Tensors & Mathematical Execution
    let recommendations = [];

    tf.tidy(() => {
      // Tensor shapes:
      // courseTensor: [N, D]
      // userTensor: [1, D]
      const courseTensor = tf.tensor2d(courseVectors);
      const userTensor = tf.tensor2d([userProfileVector]);

      // Normalize course vectors along axis 1 (L2 Norm)
      const courseNorm = tf.norm(courseTensor, 'euclidean', 1, true);
      const safeCourseNorm = tf.maximum(courseNorm, tf.scalar(1e-7));
      const normalizedCourses = tf.div(courseTensor, safeCourseNorm);

      // Normalize user vector (L2 Norm)
      const userNorm = tf.norm(userTensor, 'euclidean', 1, true);
      const safeUserNorm = tf.maximum(userNorm, tf.scalar(1e-7));
      const normalizedUser = tf.div(userTensor, safeUserNorm);

      // Cosine Similarity via Matrix Multiplication: [N, D] x [D, 1] = [N, 1]
      const similarityTensor = tf.matMul(normalizedCourses, normalizedUser.transpose());

      // Extract raw similarity scores
      const similarityScores = similarityTensor.dataSync();

      // Pair each course with its AI score
      recommendations = eligibleCourses.map((course, idx) => {
        const rawScore = similarityScores[idx] || 0;
        // Transform into intuitive percentage (75% to 99%)
        const matchPct = Math.min(99, Math.max(76, Math.round((rawScore + 0.3) * 65)));

        // Generate explainability rationale
        const matchedTags = (course.tags || []).filter((t) =>
          this.vocabTags.includes(t.toLowerCase().trim())
        );
        const reason = matchedTags.length > 0
          ? `High synergy with your ${matchedTags.slice(0, 2).join(' & ')} profile`
          : `Top algorithmic pick in ${course.category}`;

        return {
          ...course,
          aiScore: rawScore,
          matchPercentage: matchPct,
          reason
        };
      });

      // Sort by AI confidence descending
      recommendations.sort((a, b) => b.aiScore - a.aiScore);
    });

    // Render top 4 AI picks
    this.renderRecommendations(recommendations.slice(0, 4));
  },

  renderRecommendations(recs) {
    const container = document.getElementById('ai-recommended-grid');
    const section = document.getElementById('ai-recommendations-section');
    if (!container) return;

    if (!recs || recs.length === 0) {
      if (section) section.style.display = 'none';
      return;
    }

    if (section) section.style.display = 'block';

    container.innerHTML = recs
      .map(
        (course) => `
      <div class="course-card ai-recommended" data-id="${course._id}">
        <div class="ai-match-badge">
          🧠 ${course.matchPercentage}% Match
        </div>
        <div class="card-thumbnail-wrap">
          <img src="${course.thumbnailUrl}" alt="${course.title}" class="card-thumbnail" onerror="this.src='https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&q=80'" />
          <div class="card-badges">
            <span class="category-tag">${course.category}</span>
            <span class="difficulty-tag ${course.difficulty.toLowerCase()}">${course.difficulty}</span>
          </div>
        </div>

        <div class="card-body">
          <div class="ai-reason-pill">
            <span>✨</span> <span>${course.reason}</span>
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
                Preview
              </button>
              <button class="btn btn-primary btn-sm" onclick="AppState.addToCart(AppState.courses.find(c => c._id === '${course._id}'))">
                🛒 Add
              </button>
            </div>
          </div>
        </div>
      </div>
    `
      )
      .join('');
  }
};

window.AIRecommender = AIRecommender;
document.addEventListener('DOMContentLoaded', () => AIRecommender.init());
