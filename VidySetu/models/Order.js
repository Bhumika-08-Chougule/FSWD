const supabase = require('../config/supabase');
const { getDbMode } = require('../config/db');
const { getCollection } = require('../config/localStore');

function normalize(order) {
  if (!order) return null;
  order._id = order._id || order.id;
  order.userId = order.userId || order.user_id;
  order.totalAmount = order.totalAmount !== undefined ? order.totalAmount : order.total_amount;
  order.paymentMethod = order.paymentMethod || order.payment_method;
  order.status = order.status || order.payment_status || 'completed';
  order.createdAt = order.createdAt || order.created_at;
  return order;
}

const SupabaseOrder = {
  async create(orderData) {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: orderData.userId || orderData.user_id,
        courses: orderData.courses || [],
        total_amount: orderData.totalAmount || orderData.total_amount || 0,
        payment_method: orderData.paymentMethod || 'card',
        payment_status: orderData.status || 'completed',
        promo_code: orderData.promoCode || null,
        discount: orderData.discount || 0
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return normalize(data);
  },

  async find(filter = {}) {
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (filter.userId || filter.user_id) {
      query = query.eq('user_id', filter.userId || filter.user_id);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map(normalize);
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return normalize(data);
  },

  async countDocuments(filter = {}) {
    let query = supabase.from('orders').select('id', { count: 'exact', head: true });
    if (filter.userId || filter.user_id) {
      query = query.eq('user_id', filter.userId || filter.user_id);
    }
    const { count, error } = await query;
    if (error) throw new Error(error.message);
    return count || 0;
  }
};

const LocalOrder = {
  async create(d)              { return getCollection('orders').create({ ...d, status: d.status || 'completed' }); },
  async find(f = {})           { const items = await getCollection('orders').find(f); return items.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)); },
  async findById(id)           { return getCollection('orders').findById(id); },
  async countDocuments(f = {}) { return getCollection('orders').countDocuments(f); }
};

const Order = new Proxy({}, {
  get(_target, prop) {
    const impl = getDbMode() === 'supabase' ? SupabaseOrder : LocalOrder;
    return impl[prop];
  }
});

module.exports = Order;
