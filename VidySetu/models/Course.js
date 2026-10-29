const supabase = require('../config/supabase');
const { getDbMode } = require('../config/db');
const { getCollection } = require('../config/localStore');

// ----------------------------------------------------------------
// Helper: normalize Supabase row → camelCase for app compatibility
// ----------------------------------------------------------------
function normalize(course) {
  if (!course) return null;
  course._id = course._id || course.id;
  course.teacherId = course.teacherId || course.teacher_id;
  course.teacherName = course.teacherName || course.teacher_name;
  course.thumbnailUrl = course.thumbnailUrl || course.thumbnail_url;
  course.contentUrl = course.contentUrl || course.content_url;
  course.numReviews = course.numReviews !== undefined ? course.numReviews : course.num_reviews;
  course.studentsEnrolled = course.studentsEnrolled !== undefined ? course.studentsEnrolled : course.students_enrolled;
  course.durationHours = course.durationHours !== undefined ? course.durationHours : course.duration_hours;
  course.lessonsCount = course.lessonsCount !== undefined ? course.lessonsCount : course.lessons_count;
  course.syllabus = course.syllabus || [];
  course.features = course.features || ['Full Lifetime Access', 'Hands-on Projects', 'Certificate of Completion'];
  return course;
}

// ----------------------------------------------------------------
// Supabase Implementation
// ----------------------------------------------------------------
const SupabaseCourse = {
  async create(courseData) {
    const { data, error } = await supabase
      .from('courses')
      .insert({
        title: courseData.title,
        description: courseData.description,
        category: courseData.category,
        price: courseData.price || 0,
        thumbnail_url: courseData.thumbnailUrl || courseData.thumbnail_url,
        content_url: courseData.contentUrl || courseData.content_url || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        difficulty: courseData.difficulty || 'Beginner',
        tags: courseData.tags || [],
        teacher_id: courseData.teacherId || courseData.teacher_id,
        teacher_name: courseData.teacherName || courseData.teacher_name,
        rating: courseData.rating || 4.5,
        num_reviews: courseData.numReviews || 0,
        students_enrolled: courseData.studentsEnrolled || 0,
        duration_hours: courseData.durationHours || 12,
        lessons_count: courseData.lessonsCount || (courseData.syllabus
          ? courseData.syllabus.reduce((acc, s) => acc + (s.lessons?.length || 0), 0)
          : 18),
        syllabus: courseData.syllabus || [],
        features: courseData.features || ['Full Lifetime Access', 'Hands-on Projects', 'Certificate of Completion']
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return normalize(data);
  },

  async find(filter = {}) {
    let query = supabase.from('courses').select('*');
    if (filter.category) query = query.eq('category', filter.category);
    if (filter.teacher_id || filter.teacherId) {
      query = query.eq('teacher_id', filter.teacher_id || filter.teacherId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(normalize);
  },

  async findOne(filter = {}) {
    let query = supabase.from('courses').select('*');
    if (filter.id) query = query.eq('id', filter.id);
    if (filter.title) query = query.eq('title', filter.title);

    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(error.message);
    return normalize(data);
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return normalize(data);
  },

  async findByIdAndUpdate(id, update, _options) {
    const raw = update.$set || update;
    const mapped = {};
    const fieldMap = {
      title: 'title', description: 'description', category: 'category',
      price: 'price', difficulty: 'difficulty', tags: 'tags',
      rating: 'rating', syllabus: 'syllabus', features: 'features',
      thumbnailUrl: 'thumbnail_url', contentUrl: 'content_url',
      teacherName: 'teacher_name', teacherId: 'teacher_id',
      numReviews: 'num_reviews', studentsEnrolled: 'students_enrolled',
      durationHours: 'duration_hours', lessonsCount: 'lessons_count',
      // Allow direct snake_case updates too
      num_reviews: 'num_reviews', students_enrolled: 'students_enrolled'
    };
    for (const [key, val] of Object.entries(raw)) {
      const col = fieldMap[key] || key;
      mapped[col] = val;
    }

    const { data, error } = await supabase
      .from('courses')
      .update(mapped)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return normalize(data);
  },

  async findByIdAndDelete(id) {
    const { data, error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return normalize(data);
  },

  async countDocuments(filter = {}) {
    let query = supabase.from('courses').select('id', { count: 'exact', head: true });
    if (filter.teacher_id || filter.teacherId) {
      query = query.eq('teacher_id', filter.teacher_id || filter.teacherId);
    }
    const { count, error } = await query;
    if (error) throw new Error(error.message);
    return count || 0;
  }
};

// ----------------------------------------------------------------
// Local JSON Fallback
// ----------------------------------------------------------------
const LocalCourse = {
  async create(d)                  { return getCollection('courses').create(d); },
  async find(f = {})               { return getCollection('courses').find(f); },
  async findOne(f = {})            { return getCollection('courses').findOne(f); },
  async findById(id)               { return getCollection('courses').findById(id); },
  async findByIdAndUpdate(id,u,o)  { return getCollection('courses').findByIdAndUpdate(id,u,o); },
  async findByIdAndDelete(id)      { return getCollection('courses').findByIdAndDelete(id); },
  async countDocuments(f = {})     { return getCollection('courses').countDocuments(f); }
};

// ----------------------------------------------------------------
// Universal Adapter
// ----------------------------------------------------------------
const Course = new Proxy({}, {
  get(_target, prop) {
    const impl = getDbMode() === 'supabase' ? SupabaseCourse : LocalCourse;
    return impl[prop];
  }
});

module.exports = Course;
