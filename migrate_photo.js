const { Client } = require("pg");
const c = new Client({
  connectionString: "postgresql://postgres.lvqylwyanggtprbgxbsc:Ranger0944915397@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false },
});
(async () => {
  await c.connect();
  await c.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "photo_url" TEXT');
  console.log("photo_url column added");
  await c.end();
})();
