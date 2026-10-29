# 🎓 SmartEdu - AI-Powered Edu-Commerce Platform

> A full-stack, production-ready Edu-Commerce Web Application featuring **TensorFlow.js** client-side AI course recommendations, **Chart.js** performance analytics, role-based dashboards, and a simulated payment gateway.

---

## 🌟 Executive Overview & Key Highlights

SmartEdu is structured around a modular **Model-View-Controller (MVC)** monolithic architecture engineered for speed, clean separation of concerns, and zero-friction deployment. It provides two distinct role-based experiences: **Student** and **Teacher**.

- 🧠 **TensorFlow.js Neural Course Recommender**: Runs on-device content-based cosine similarity feature vector embeddings directly in the browser to match courses based on user enrollment history, tags, and difficulty level.
- 📊 **Dynamic Chart.js Analytics**: Visual progress wheel (doughnut) and weekly study hours for students; 6-month revenue timeline and enrollment breakdown for educators.
- 💳 **Stripe / Razorpay Demo Gateway**: Full checkout flow with simulated bank processing, payment failure toggle, test card autofill, and automatic account enrollment.
- 🎓 **Cryptographic Certificate Generator**: Generates authentic, printable Diplomas with unique verification IDs upon course completion.
- ⭐ **Verified Review System**: Allows only students who have purchased the course to submit reviews and calculates average star ratings in real-time.
- 🔄 **Zero-Config Resilient Data Layer**: Connects to standard MongoDB via Mongoose when available, and automatically falls back to an atomic, persistent JSON datastore (`./data`) when MongoDB is offline.

---

## 🎨 Semantic Visual Design System

SmartEdu features a high-contrast corporate aesthetic using modern CSS3 Grid and Flexbox:

| Semantic Anchor | Emoji Icon | Meaning & Visual Context |
| :--- | :---: | :--- |
| **Course Catalog** | 💻 | Online curriculum catalog, course syllabus & code preview |
| **AI Recommender** | 🧠 | TensorFlow.js neural matcher & personalized vector recommendations |
| **Performance Dashboard** | 📊 | Chart.js analytics for students & teacher revenue metrics |
| **Certifications** | 🎓 | Digital diplomas, academic credentials & degree center |

### Color Palette
- **Deep Slate**: `#070a12`, `#0f172a`, `#1e293b`
- **Tech Emerald**: `#10b981`, `#059669`, `#34d399`
- **Accent Blue**: `#3b82f6`, `#2563eb`, `#60a5fa`
- **Clean White**: `#ffffff`, `#f8fafc`

---

## 🏗️ Project Architecture & Directory Structure

```text
smartedu/
├── config/
│   ├── db.js                 # Database connector (MongoDB + graceful local fallback)
│   └── localStore.js         # Atomic, persistent JSON datastore engine
├── controllers/
│   ├── authController.js     # JWT authentication, login, registration, and sessions
│   ├── courseController.js   # Course CRUD, multi-criteria filtering, and search
│   ├── orderController.js    # Checkout processing and enrollment tracking
│   ├── reviewController.js   # Verified buyer reviews & rating recalculation
│   └── analyticsController.js# Chart.js data endpoints for students and teachers
├── middleware/
│   ├── authMiddleware.js     # Bearer token and cookie JWT verification
│   ├── roleMiddleware.js     # Role-based authorization ('student', 'teacher')
│   └── errorHandler.js       # Centralized JSON error formatting
├── models/
│   ├── User.js               # User schema & password hashing methods
│   ├── Course.js             # Course schema, syllabus, and metadata
│   ├── Order.js              # Order records, transactions, and status
│   └── Review.js             # Course reviews and star ratings
├── public/
│   ├── css/
│   │   ├── style.css         # Typography, tokens, utilities, and toast notifications
│   │   ├── navbar.css        # Sticky glassmorphic navbar, cart drawer & menus
│   │   ├── cards.css         # Course cards, AI badges, and filter bars
│   │   ├── modal.css         # Auth modal, checkout modal, and certificate modal
│   │   └── dashboard.css     # Metric cards, Chart.js wrappers, and CRUD table
│   └── js/
│       ├── api.js            # Centralized API fetch client with error handling
│       ├── state.js          # Reactive global state and event emitter
│       ├── auth.js           # Login, registration, and 1-click demo logins
│       ├── cart.js           # Cart storage, promo code ("SMART20"), and drawer
│       ├── checkout.js       # Simulated Stripe/Razorpay payment gateway
│       ├── ai-recommender.js # TensorFlow.js content-based cosine similarity model
│       ├── catalog.js        # Instant search, category pills, and detail view
│       ├── dashboard.js      # Chart.js charts and teacher CRUD controller
│       └── main.js           # Application bootstrap and smooth navigation
├── views/
│   └── index.html            # Monolithic single-page architecture template
├── data/                     # Persistent JSON storage when running in local fallback mode
│   ├── courses.json
│   ├── users.json
│   └── reviews.json
├── seed.js                   # Pre-populates realistic courses, teachers & students
├── verify-api.js             # Automated 12-step verification test suite
├── server.js                 # Express server entry point
├── package.json              # Project dependencies and script runner
├── .env.example              # Environment variable template
└── README.md                 # Complete documentation
```

---

## ⚡ Quick Start Guide

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- *Optional*: Local MongoDB service (if not installed, SmartEdu will automatically run on its persistent local engine).

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Environment Setup
Configure your environment in `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/smartedu
JWT_SECRET=smartedu_super_secret_jwt_key_2026_secured
NODE_ENV=development
```

### 3. Database Seeding
Populate realistic sample courses, demo accounts, and reviews:
```bash
npm run seed
```

### 4. Launch Application
Start the development server with live watch:
```bash
npm run dev
# or for production:
npm start
```

Visit **`http://localhost:5000`** in your browser.

---

## 🔑 Pre-Configured Demo Credentials

Use the **Instant 1-Click Demo Buttons** inside the Sign In modal or manually log in with:

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **👨‍🎓 Student** | `student@smartedu.dev` | `student123` | Browse catalog, checkout, review courses, view student charts |
| **👨‍🏫 Teacher** | `teacher@smartedu.dev` | `teacher123` | Create, edit, and delete courses, view total revenue & enrollments |

---

## 🧪 Verification & Automated Testing

Run the built-in end-to-end verification suite:
```bash
node verify-api.js
```

### Test Coverage Highlights
- ✅ `GET /api/health` - Server health and version status.
- ✅ `GET /api/courses` - Catalog retrieval, searching, and filtering.
- ✅ `GET /api/courses/meta/categories` - Categorical metadata with counts.
- ✅ `POST /api/auth/login` - Student authentication and JWT generation.
- ✅ `GET /api/analytics/student` - Student learning statistics.
- ✅ `POST /api/auth/login` - Teacher authentication and privilege verification.
- ✅ `GET /api/analytics/teacher` - Teacher revenue and student analytics.
- ✅ `GET /api/courses/teacher/mine` - Teacher-owned course management.
- ✅ `POST /api/orders/checkout` (Simulated Failure) - Verifies HTTP 402 bank decline.
- ✅ `POST /api/orders/checkout` (Success) - Generates transaction ID and updates student enrollment.
- ✅ `GET /api/orders/enrolled` - Retrieves updated course list with progress metrics.
- ✅ `POST /api/reviews/course/:id` - Verifies enrolled buyer status and dynamic star average recalculation.

---

## 🧠 TensorFlow.js Recommendation Mechanism

SmartEdu executes a lightweight content-based recommendation model directly on the client:
1. **Feature Vector Extraction**: Maps courses into high-dimensional vectors encoding one-hot categories, multi-hot technology tags, normalized difficulty, and price.
2. **User Profile Aggregation**: Constructs an on-the-fly interest vector weighted by the student's enrolled courses ($2.0\times$) and cart items ($1.2\times$).
3. **Tensor Cosine Similarity**: Uses TensorFlow.js tensors (`tf.tensor2d`, `tf.norm`, `tf.matMul`) to compute the cosine angle between candidate courses and the student profile.
4. **Explainable AI**: Renders the recommendation with an intuitive match percentage (e.g., `98% Match`) alongside explainability rationale (e.g., *"High synergy with your Python & Deep Learning profile"*).

---

## 📄 License
This project is open-source and licensed under the [MIT License](LICENSE).
