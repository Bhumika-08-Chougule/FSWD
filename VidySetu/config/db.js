const supabase = require('./supabase');

let dbMode = 'supabase';

const connectDB = async () => {
  try {
    // Ping Supabase by fetching a single row from users table
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is fine
      throw new Error(error.message);
    }
    dbMode = 'supabase';
    console.log('[SmartEdu DB] ✅ Supabase connected successfully!');
    console.log(`[SmartEdu DB]    Project: ulknyrfeqmyjgoumplrk.supabase.co`);
  } catch (err) {
    console.error(`[SmartEdu DB] ❌ Supabase connection failed: ${err.message}`);
    console.log('[SmartEdu DB] 💾 Falling back to local JSON datastore...');
    dbMode = 'local';
  }
  return dbMode;
};

const getDbMode = () => dbMode;

module.exports = { connectDB, getDbMode };
