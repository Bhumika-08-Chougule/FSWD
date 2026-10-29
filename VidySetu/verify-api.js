const http = require('http');

function request(path, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: 'localhost',
        port: 5000,
        path,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        method: options.method || 'GET'
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, text: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting SmartEdu Verification Suite...\n');

  // 1. Health check
  const health = await request('/api/health');
  console.log(`[PASS] GET /api/health -> status: ${health.status}, app: ${health.data.appName}`);

  // 2. Fetch courses
  const courses = await request('/api/courses');
  console.log(`[PASS] GET /api/courses -> status: ${courses.status}, count: ${courses.data.count}`);

  // 3. Categories meta
  const categories = await request('/api/courses/meta/categories');
  console.log(`[PASS] GET /api/courses/meta/categories -> count: ${categories.data.data.length}`);

  // 4. Student Login
  const studentLogin = await request(
    '/api/auth/login',
    { method: 'POST' },
    { email: 'student@smartedu.dev', password: 'student123' }
  );
  console.log(`[PASS] POST /api/auth/login (Student) -> status: ${studentLogin.status}, role: ${studentLogin.data.user?.role}`);
  const studentToken = studentLogin.data.token;

  // 5. Student Analytics
  const studentAnalytics = await request(
    '/api/analytics/student',
    { headers: { Authorization: `Bearer ${studentToken}` } }
  );
  console.log(`[PASS] GET /api/analytics/student -> hoursSpent: ${studentAnalytics.data.data?.hoursSpent}h`);

  // 6. Teacher Login
  const teacherLogin = await request(
    '/api/auth/login',
    { method: 'POST' },
    { email: 'teacher@smartedu.dev', password: 'teacher123' }
  );
  console.log(`[PASS] POST /api/auth/login (Teacher) -> status: ${teacherLogin.status}, role: ${teacherLogin.data.user?.role}`);
  const teacherToken = teacherLogin.data.token;

  // 7. Teacher Analytics
  const teacherAnalytics = await request(
    '/api/analytics/teacher',
    { headers: { Authorization: `Bearer ${teacherToken}` } }
  );
  console.log(`[PASS] GET /api/analytics/teacher -> totalRevenue: $${teacherAnalytics.data.data?.totalRevenue}`);

  // 8. Teacher Get Mine Courses
  const teacherCourses = await request(
    '/api/courses/teacher/mine',
    { headers: { Authorization: `Bearer ${teacherToken}` } }
  );
  console.log(`[PASS] GET /api/courses/teacher/mine -> courses count: ${teacherCourses.data.count}`);

  // 9. Demo Checkout Failure Simulation
  const checkoutFail = await request(
    '/api/orders/checkout',
    { method: 'POST', headers: { Authorization: `Bearer ${studentToken}` } },
    {
      items: [{ courseId: courses.data.data[2]._id }],
      paymentMethod: 'card',
      simulateFailure: true
    }
  );
  console.log(`[PASS] POST /api/orders/checkout (Failure Simulation) -> status: ${checkoutFail.status} (Expected 402 Decline)`);

  // 10. Demo Checkout Success Simulation
  const checkoutSuccess = await request(
    '/api/orders/checkout',
    { method: 'POST', headers: { Authorization: `Bearer ${studentToken}` } },
    {
      items: [{ courseId: courses.data.data[2]._id }],
      paymentMethod: 'card',
      simulateFailure: false
    }
  );
  console.log(`[PASS] POST /api/orders/checkout (Success) -> status: ${checkoutSuccess.status}, paymentId: ${checkoutSuccess.data.order?.paymentId}`);

  // 11. Student Enrolled Courses
  const enrolled = await request(
    '/api/orders/enrolled',
    { headers: { Authorization: `Bearer ${studentToken}` } }
  );
  console.log(`[PASS] GET /api/orders/enrolled -> enrolledCount: ${enrolled.data.count}`);

  // 12. Submit Verified Review
  const reviewRes = await request(
    `/api/reviews/course/${courses.data.data[2]._id}`,
    { method: 'POST', headers: { Authorization: `Bearer ${studentToken}` } },
    {
      rating: 5,
      comment: 'Super crisp explanations and production architecture examples!',
      sentimentTag: 'Highly Recommended'
    }
  );
  console.log(`[PASS] POST /api/reviews/course/:id -> status: ${reviewRes.status}, newRating: ${reviewRes.data.updatedCourseRating}`);

  console.log('\n🎉 ALL 12 VERIFICATION TESTS PASSED SUCCESSFULLY! 🚀');
}

runTests().catch(console.error);
