const { Client } = require('pg');

async function setupBuckets() {
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

  const buckets = ['frames', 'kiosk-assets', 'galleries', 'receipts'];
  for (const b of buckets) {
    await client.query(`
      INSERT INTO storage.buckets (id, name, public)
      VALUES ($1, $1, true)
      ON CONFLICT (id) DO NOTHING;
    `, [b]);
    console.log('Bucket verified:', b);
  }

  const res = await client.query('SELECT id, name, public FROM storage.buckets;');
  console.log('Buckets in Supabase:', res.rows);
  await client.end();
}

setupBuckets().catch(console.error);
