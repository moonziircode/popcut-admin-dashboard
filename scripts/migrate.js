const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is required.');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to Supabase PostgreSQL database.');

  const migrations = [
    '20261115000001_initial_schema.sql',
    '20261115000002_rls_and_permissions.sql',
    '20261115000003_atomic_rpc_functions.sql',
    '20261115000004_seed_initial_data.sql'
  ];

  for (const mig of migrations) {
    const filePath = path.join(__dirname, '..', 'supabase', 'migrations', mig);
    console.log('Running migration: ' + mig + '...');
    const sql = fs.readFileSync(filePath, 'utf8');
    await client.query(sql);
    console.log('Successfully completed: ' + mig);
  }

  const tableCountRes = await client.query("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';");
  console.log('Total tables in public schema:', tableCountRes.rows[0].count);

  await client.end();
}

runMigrations().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
