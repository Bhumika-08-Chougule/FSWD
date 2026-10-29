const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');
const { getDbMode } = require('../config/db');
const { getCollection } = require('../config/localStore');

// ----------------------------------------------------------------
// Helper: attach matchPassword method to a raw user row
// ----------------------------------------------------------------
function attachMethods(user) {
  if (!user) return null;
  user.matchPassword = async (enteredPassword) => {
    return await bcrypt.compare(enteredPassword, user.password);
  };
  // Map snake_case → camelCase for compatibility
  user._id = user._id || user.id;
  user.enrolledCourses = user.enrolledCourses || user.enrolled_courses || [];
  user.learningStats = user.learningStats || user.learning_stats || {};
  return user;
}

// ----------------------------------------------------------------
// Supabase Implementation
// ----------------------------------------------------------------
const SupabaseUser = {
  async create(userData) {
    let hashedPassword = userData.password;
    if (!userData.password.startsWith('$2a$') && !userData.password.startsWith('$2b$')) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(userData.password, salt);
    }

    const { data, error } = await supabase
      .from('users')
      .insert({
        name: userData.name,
        email: userData.email.toLowerCase().trim(),
        password: hashedPassword,
        role: userData.role || 'student',
        avatar: userData.avatar || '',
        enrolled_courses: [],
        learning_stats: {
          hoursSpent: 18.5,
          completedCourses: [],
          weeklyActivity: [
            { day: 'Mon', hours: 2.5 },
            { day: 'Tue', hours: 3.0 },
            { day: 'Wed', hours: 1.5 },
            { day: 'Thu', hours: 4.0 },
            { day: 'Fri', hours: 2.0 },
            { day: 'Sat', hours: 3.5 },
            { day: 'Sun', hours: 2.0 }
          ]
        }
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return attachMethods(data);
  },

  async findOne(filter) {
    let query = supabase.from('users').select('*');
    if (filter.email) query = query.eq('email', filter.email.toLowerCase().trim());
    if (filter.id)    query = query.eq('id', filter.id);

    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(error.message);
    return attachMethods(data);
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, avatar, enrolled_courses, learning_stats, created_at')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return attachMethods(data);
  },

  async find(filter = {}) {
    let query = supabase.from('users').select('id, name, email, role, avatar, enrolled_courses, learning_stats, created_at');
    if (filter.role) query = query.eq('role', filter.role);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map(attachMethods);
  },

  async findByIdAndUpdate(id, update, _options) {
    const updateData = update.$set || update;
    const mapped = {};
    // Map camelCase keys to snake_case for postgres
    if (updateData.enrolledCourses !== undefined) mapped.enrolled_courses = updateData.enrolledCourses;
    if (updateData.learningStats !== undefined) mapped.learning_stats = updateData.learningStats;
    if (updateData.name !== undefined) mapped.name = updateData.name;
    if (updateData.avatar !== undefined) mapped.avatar = updateData.avatar;

    const { data, error } = await supabase
      .from('users')
      .update(mapped)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return attachMethods(data);
  },

  async countDocuments(filter = {}) {
    let query = supabase.from('users').select('id', { count: 'exact', head: true });
    if (filter.role) query = query.eq('role', filter.role);
    const { count, error } = await query;
    if (error) throw new Error(error.message);
    return count || 0;
  }
};

// ----------------------------------------------------------------
// Local JSON Fallback Implementation
// ----------------------------------------------------------------
const LocalUser = {
  async create(userData) {
    const collection = getCollection('users');
    let hashedPassword = userData.password;
    if (!userData.password.startsWith('$2a$') && !userData.password.startsWith('$2b$')) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(userData.password, salt);
    }
    const user = await collection.create({
      ...userData,
      password: hashedPassword,
      enrolledCourses: userData.enrolledCourses || [],
      learningStats: userData.learningStats || {
        hoursSpent: 18.5,
        completedCourses: [],
        weeklyActivity: [
          { day: 'Mon', hours: 2.5 },
          { day: 'Tue', hours: 3.0 },
          { day: 'Wed', hours: 1.5 },
          { day: 'Thu', hours: 4.0 },
          { day: 'Fri', hours: 2.0 },
          { day: 'Sat', hours: 3.5 },
          { day: 'Sun', hours: 2.0 }
        ]
      }
    });
    user._id = user._id || user.id;
    user.matchPassword = async (pw) => bcrypt.compare(pw, user.password);
    return user;
  },
  async findOne(filter) {
    const collection = getCollection('users');
    const user = await collection.findOne(filter);
    if (user) {
      user._id = user._id || user.id;
      user.matchPassword = async (pw) => bcrypt.compare(pw, user.password);
    }
    return user;
  },
  async findById(id) {
    const collection = getCollection('users');
    const user = await collection.findById(id);
    if (user) {
      user._id = user._id || user.id;
      user.matchPassword = async (pw) => bcrypt.compare(pw, user.password);
    }
    return user;
  },
  async find(filter = {}) {
    const collection = getCollection('users');
    return await collection.find(filter);
  },
  async findByIdAndUpdate(id, update, options) {
    const collection = getCollection('users');
    return await collection.findByIdAndUpdate(id, update, options);
  },
  async countDocuments(filter = {}) {
    return await getCollection('users').countDocuments(filter);
  }
};

// ----------------------------------------------------------------
// Universal Adapter
// ----------------------------------------------------------------
const User = new Proxy({}, {
  get(_target, prop) {
    const impl = getDbMode() === 'supabase' ? SupabaseUser : LocalUser;
    return impl[prop];
  }
});

module.exports = User;
