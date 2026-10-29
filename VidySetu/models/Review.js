const supabase = require('../config/supabase');
const { getDbMode } = require('../config/db');
const { getCollection } = require('../config/localStore');

function normalize(review) {
  if (!review) return null;
  review._id = review._id || review.id;
  review.courseId = review.courseId || review.course_id;
  review.userId = review.userId || review.user_id;
  review.userName = review.userName || review.user_name;
  review.createdAt = review.createdAt || review.created_at;
  return review;
}

const SupabaseReview = {
  async create(reviewData) {
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        course_id: reviewData.courseId || reviewData.course_id,
        user_id: reviewData.userId || reviewData.user_id,
        user_name: reviewData.userName || reviewData.user_name,
        rating: reviewData.rating,
        comment: reviewData.comment
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return normalize(data);
  },

  async find(filter = {}) {
    let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });
    if (filter.courseId || filter.course_id) {
      query = query.eq('course_id', filter.courseId || filter.course_id);
    }
    if (filter.userId || filter.user_id) {
      query = query.eq('user_id', filter.userId || filter.user_id);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map(normalize);
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return normalize(data);
  },

  async countDocuments(filter = {}) {
    let query = supabase.from('reviews').select('id', { count: 'exact', head: true });
    if (filter.courseId || filter.course_id) {
      query = query.eq('course_id', filter.courseId || filter.course_id);
    }
    const { count, error } = await query;
    if (error) throw new Error(error.message);
    return count || 0;
  }
};

const LocalReview = {
  async create(d)              { return getCollection('reviews').create(d); },
  async find(f = {})           { const items = await getCollection('reviews').find(f); return items.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)); },
  async findById(id)           { return getCollection('reviews').findById(id); },
  async countDocuments(f = {}) { return getCollection('reviews').countDocuments(f); }
};

const Review = new Proxy({}, {
  get(_target, prop) {
    const impl = getDbMode() === 'supabase' ? SupabaseReview : LocalReview;
    return impl[prop];
  }
});

module.exports = Review;
