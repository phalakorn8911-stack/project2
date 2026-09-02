require('dotenv').config();
const { Client } = require('pg');
const pg = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  await pg.connect();
  const fields = [
    'address', 'marital_status', 'education',
    'national_id', 'civilian_license', 'army_license'
  ];
  for (const name of fields) {
    try {
      await pg.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "${name}" TEXT`);
      console.log('OK: ' + name);
    } catch (e) { console.log('ERR: ' + name + ' ' + e.message); }
  }
  await pg.end();
  console.log('Done');
}
run().catch(console.error);
