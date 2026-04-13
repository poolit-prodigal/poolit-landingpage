import { Client } from 'pg';

async function run() {
  const connectionString = process.env.DATABASE_URL_POOLER || process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('Missing DATABASE_URL or DATABASE_URL_POOLER in environment.');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    await client.query(`
      create extension if not exists pgcrypto;

      create table if not exists waitlist (
        id uuid primary key default gen_random_uuid(),
        name text not null,
        email text not null unique,
        phone text,
        ref_code text not null unique,
        referred_by text,
        created_at timestamptz not null default now()
      );

      create index if not exists waitlist_created_at_idx on waitlist (created_at desc);
      create index if not exists waitlist_ref_code_idx on waitlist (ref_code);
    `);

    console.log('✅ waitlist table is ready.');
  } catch (error) {
    console.error('❌ Failed to set up database:', error.message);
    if (error.code === 'ENETUNREACH') {
      console.error(
        'Tip: your network likely cannot reach IPv6. Use Supabase Session Pooler and set DATABASE_URL_POOLER in .env.'
      );
    }
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();
