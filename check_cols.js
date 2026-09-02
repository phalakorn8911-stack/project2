const { Client } = require("pg");
const c = new Client({
  connectionString: "postgresql://postgres.lvqylwyanggtprbgxbsc:Ranger0944915397@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false },
});
(async () => {
  await c.connect();
  const r = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position");
  console.log(r.rows.map((x) => x.column_name).join(", "));
  await c.end();
})();
