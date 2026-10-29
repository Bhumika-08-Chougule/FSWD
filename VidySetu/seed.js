require('dotenv').config();
const { connectDB } = require('./config/db');
const User = require('./models/User');
const Course = require('./models/Course');
const Order = require('./models/Order');
const Review = require('./models/Review');

const seedData = async () => {
  await connectDB();
  console.log('[Seed] Seeding SmartEdu platform with realistic demo dataset...');

  // 1. Seed Teacher
  let teacher = await User.findOne({ email: 'teacher@smartedu.dev' });
  if (!teacher) {
    teacher = await User.create({
      name: 'Prof. Sarah Vance',
      email: 'teacher@smartedu.dev',
      password: 'teacher123',
      role: 'teacher',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&q=80'
    });
    console.log('[Seed] Created Demo Teacher: teacher@smartedu.dev / teacher123');
  }

  // 2. Seed Student
  let student = await User.findOne({ email: 'student@smartedu.dev' });
  if (!student) {
    student = await User.create({
      name: 'Alex Morgan',
      email: 'student@smartedu.dev',
      password: 'student123',
      role: 'student',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
      enrolledCourses: [],
      learningStats: {
        hoursSpent: 24.8,
        completedCourses: [],
        weeklyActivity: [
          { day: 'Mon', hours: 3.5 },
          { day: 'Tue', hours: 4.2 },
          { day: 'Wed', hours: 2.1 },
          { day: 'Thu', hours: 5.0 },
          { day: 'Fri', hours: 3.0 },
          { day: 'Sat', hours: 4.5 },
          { day: 'Sun', hours: 2.5 }
        ]
      }
    });
    console.log('[Seed] Created Demo Student: student@smartedu.dev / student123');
  }

  // 3. Courses Dataset
  const existingCourses = await Course.find();
  if (existingCourses.length === 0) {
    const coursesToInsert = [
      {
        title: 'Full-Stack Web Architecture with React & Node.js',
        description: 'Build industrial-strength modern web applications using React, Node.js, Express, and distributed MongoDB.',
        category: 'Web Development',
        price: 79,
        thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80',
        contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        difficulty: 'Intermediate',
        tags: ['React', 'Node.js', 'Express', 'JavaScript', 'MongoDB', 'Full Stack', 'Web Development'],
        teacherId: teacher._id,
        teacherName: teacher.name,
        rating: 4.9,
        numReviews: 124,
        studentsEnrolled: 840,
        durationHours: 24
      },
      {
        title: 'Deep Learning & Neural Networks with TensorFlow.js',
        description: 'Train and deploy deep learning models directly inside web browsers and client applications with TensorFlow.js.',
        category: 'Artificial Intelligence',
        price: 89,
        thumbnailUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
        contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        difficulty: 'Advanced',
        tags: ['Artificial Intelligence', 'TensorFlow', 'Deep Learning', 'Neural Networks', 'Python', 'Machine Learning', 'Computer Vision'],
        teacherId: teacher._id,
        teacherName: teacher.name,
        rating: 4.9,
        numReviews: 96,
        studentsEnrolled: 620,
        durationHours: 28
      },
      {
        title: 'Cloud Architecture & Kubernetes DevOps Mastery',
        description: 'Deploy, scale, and manage containerized microservices on AWS, GCP, and Kubernetes with automated CI/CD pipelines.',
        category: 'Cloud Computing',
        price: 99,
        thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
        contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        difficulty: 'Advanced',
        tags: ['Cloud Computing', 'AWS', 'Kubernetes', 'Docker', 'DevOps', 'CI/CD', 'Microservices'],
        teacherId: teacher._id,
        teacherName: teacher.name,
        rating: 4.8,
        numReviews: 82,
        studentsEnrolled: 510,
        durationHours: 32
      },
      {
        title: 'Modern Python for Data Science & Machine Learning',
        description: 'Master data analysis, pandas, NumPy, statistical modeling, and Scikit-Learn for real-world enterprise predictions.',
        category: 'Data Science',
        price: 59,
        thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80',
        contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        difficulty: 'Beginner',
        tags: ['Python', 'Data Science', 'Pandas', 'NumPy', 'Machine Learning', 'Data Analysis', 'Statistics'],
        teacherId: teacher._id,
        teacherName: teacher.name,
        rating: 4.7,
        numReviews: 140,
        studentsEnrolled: 1250,
        durationHours: 18
      },
      {
        title: 'Zero to Hero: Ethical Hacking & Cyber Defense',
        description: 'Learn penetration testing, network sniffing, web vulnerability exploitation (OWASP Top 10), and proactive defense.',
        category: 'Cyber Security',
        price: 69,
        thumbnailUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80',
        contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        difficulty: 'Intermediate',
        tags: ['Cyber Security', 'Ethical Hacking', 'Penetration Testing', 'Network Security', 'OWASP', 'Linux'],
        teacherId: teacher._id,
        teacherName: teacher.name,
        rating: 4.9,
        numReviews: 110,
        studentsEnrolled: 730,
        durationHours: 20
      },
      {
        title: 'Cross-Platform Mobile Apps with React Native & Expo',
        description: 'Build native iOS and Android applications with clean state management, offline sync, and beautiful responsive UI.',
        category: 'Mobile Development',
        price: 65,
        thumbnailUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80',
        contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        difficulty: 'Intermediate',
        tags: ['Mobile Development', 'React Native', 'Expo', 'JavaScript', 'iOS', 'Android', 'Mobile Apps'],
        teacherId: teacher._id,
        teacherName: teacher.name,
        rating: 4.6,
        numReviews: 75,
        studentsEnrolled: 480,
        durationHours: 16
      },
      {
        title: 'Generative AI & LLM Application Engineering',
        description: 'Harness OpenAI APIs, LangChain, vector databases (Pinecone), and RAG pipelines to build intelligent AI copilot apps.',
        category: 'Artificial Intelligence',
        price: 109,
        thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
        contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        difficulty: 'Advanced',
        tags: ['Artificial Intelligence', 'Generative AI', 'LLM', 'LangChain', 'Python', 'Vector DB', 'Prompt Engineering'],
        teacherId: teacher._id,
        teacherName: teacher.name,
        rating: 5.0,
        numReviews: 68,
        studentsEnrolled: 410,
        durationHours: 22
      },
      {
        title: 'Mastering JavaScript: From ES6+ to Async Internals',
        description: 'Deep dive into closures, prototypes, event loop, promises, DOM manipulation, and functional programming patterns.',
        category: 'Web Development',
        price: 39,
        thumbnailUrl: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&q=80',
        contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        difficulty: 'Beginner',
        tags: ['Web Development', 'JavaScript', 'ES6', 'Frontend', 'Async JS', 'Web Architecture'],
        teacherId: teacher._id,
        teacherName: teacher.name,
        rating: 4.9,
        numReviews: 210,
        studentsEnrolled: 1890,
        durationHours: 14
      }
    ];

    const createdCourses = [];
    for (const c of coursesToInsert) {
      const course = await Course.create(c);
      createdCourses.push(course);
    }
    console.log(`[Seed] Seeded ${createdCourses.length} realistic courses.`);

    // 4. Enroll Student into the first 2 courses for demo
    const enrolledIds = [createdCourses[0]._id, createdCourses[1]._id];
    await User.findByIdAndUpdate(student._id, {
      enrolledCourses: enrolledIds
    });
    console.log('[Seed] Enrolled student in 2 initial courses.');

    // 5. Seed Initial Reviews
    await Review.create({
      courseId: createdCourses[0]._id,
      userId: student._id,
      userName: student.name,
      rating: 5,
      comment: 'Absolutely hands-down the best full stack course I have taken. Clear architecture and great code quality!',
      sentimentTag: 'Highly Recommended'
    });

    await Review.create({
      courseId: createdCourses[1]._id,
      userId: student._id,
      userName: student.name,
      rating: 5,
      comment: 'TensorFlow.js explanations were exceptionally intuitive. The browser ML projects were super cool.',
      sentimentTag: 'Exceptional'
    });
    console.log('[Seed] Seeded initial reviews.');
  }

  console.log('[Seed] Seed execution finished successfully!');
};

if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Error]', err);
      process.exit(1);
    });
}

module.exports = seedData;
