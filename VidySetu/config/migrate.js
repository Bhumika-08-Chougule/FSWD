/**
 * SmartEdu - Supabase Schema Migration Script
 * Runs the schema SQL directly against Supabase via the Management API.
 * Usage: node config/migrate.js
 */
require('dotenv').config();
const https = require('https');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = process.env.SUPABASE_URL
  ? process.env.SUPABASE_URL.replace('https://', '').replace('.supabase.co', '')
  : 'ulknyrfeqmyjgoumplrk';
// Service role key loaded from environment only — never hardcode secrets in source.
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

const schemaSQL = fs.readFileSync(path.join(__dirname, 'supabase-schema.sql'), 'utf8');

function postSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: `${PROJECT_ID}.supabase.co`,
      path: '/rest/v1/sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SECRET_KEY,
        'Authorization': `Bearer ${SECRET_KEY}`,
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data });
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function migrate() {
  console.log('🚀 SmartEdu — Running Supabase Schema Migration...');
  console.log(`📡 Project: ${PROJECT_ID}.supabase.co`);

  // Split SQL into individual statements and run them
  // Filter out comments and empty statements
  const statements = schemaSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 10 && !s.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (const stmt of statements) {
    const result = await postSQL(stmt + ';');
    if (result.status >= 200 && result.status < 300) {
      successCount++;
      process.stdout.write('.');
    } else {
      errorCount++;
      const errBody = JSON.parse(result.body || '{}');
      // Ignore "already exists" errors
      if (errBody.message && (errBody.message.includes('already exists') || errBody.message.includes('does not exist'))) {
        successCount++;
        process.stdout.write('~');
      } else {
        console.log(`\n⚠️  ${errBody.message || result.body}`);
      }
    }
  }

  console.log(`\n\n✅ Migration complete! ${successCount} statements succeeded, ${errorCount} failed.`);
  console.log('\n💡 If you see errors, please run config/supabase-schema.sql manually in:');
  console.log(`   https://supabase.com/dashboard/project/${PROJECT_ID}/sql/new`);
}

migrate().catch(console.error);
