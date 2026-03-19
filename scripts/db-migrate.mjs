import pg from 'pg'
import { readFileSync } from 'fs'

const PROJECT_REF = 'prxqjiuibfrmuwwmkhqb'
const DB_PASS = process.argv[2] || process.env.DB_PASSWORD

if (!DB_PASS) {
  console.error('Usage: node scripts/db-migrate.mjs <db-password>')
  process.exit(1)
}

import dns from 'dns'

// Supabase DB is IPv6 only — resolve manually
const dbHost = `db.${PROJECT_REF}.supabase.co`
const addresses = await new Promise((resolve, reject) => {
  dns.resolve6(dbHost, (err, addrs) => err ? reject(err) : resolve(addrs))
})
console.log(`Resolved ${dbHost} → [${addresses[0]}]`)

const client = new pg.Client({
  host: addresses[0],
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: DB_PASS,
  ssl: { rejectUnauthorized: false, servername: dbHost },
})

async function run() {
  console.log('Connecting to Supabase DB...')
  await client.connect()
  console.log('Connected!\n')

  // 1. Check current state
  console.log('=== Checking current state ===')

  const bioCheck = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='bio'
  `)
  const hasBio = bioCheck.rows.length > 0
  console.log(`  profiles.bio: ${hasBio ? 'EXISTS' : 'MISSING'}`)

  const invCheck = await client.query(`
    SELECT tablename FROM pg_tables
    WHERE schemaname='public' AND tablename='project_invitations'
  `)
  const hasInv = invCheck.rows.length > 0
  console.log(`  project_invitations: ${hasInv ? 'EXISTS' : 'MISSING'}`)

  const portCheck = await client.query(`
    SELECT tablename FROM pg_tables
    WHERE schemaname='public' AND tablename='portfolio_items'
  `)
  const hasPort = portCheck.rows.length > 0
  console.log(`  portfolio_items: ${hasPort ? 'EXISTS' : 'MISSING'}`)

  // 2. Apply missing migrations
  if (!hasBio) {
    console.log('\n=== Adding bio column ===')
    await client.query('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;')
    console.log('  Done.')
  }

  if (!hasInv) {
    console.log('\n=== Creating project_invitations ===')
    const sql = readFileSync('supabase/migrations_backup/20260322_create_project_invitations.sql', 'utf8')
    await client.query(sql)
    console.log('  Done.')
  }

  if (!hasPort) {
    console.log('\n=== Creating portfolio_items ===')
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.portfolio_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        link_url TEXT,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_portfolio_items_user_id ON public.portfolio_items(user_id);
      ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
    `)
    // RLS policies separately (can't be in same multi-statement with CREATE TABLE in some contexts)
    const policies = [
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='portfolio_items' AND policyname='portfolio_select') THEN CREATE POLICY "portfolio_select" ON public.portfolio_items FOR SELECT USING (true); END IF; END $$;`,
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='portfolio_items' AND policyname='portfolio_insert') THEN CREATE POLICY "portfolio_insert" ON public.portfolio_items FOR INSERT WITH CHECK (auth.uid() = user_id); END IF; END $$;`,
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='portfolio_items' AND policyname='portfolio_update') THEN CREATE POLICY "portfolio_update" ON public.portfolio_items FOR UPDATE USING (auth.uid() = user_id); END IF; END $$;`,
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='portfolio_items' AND policyname='portfolio_delete') THEN CREATE POLICY "portfolio_delete" ON public.portfolio_items FOR DELETE USING (auth.uid() = user_id); END IF; END $$;`,
    ]
    for (const p of policies) {
      await client.query(p)
    }
    console.log('  Done.')
  }

  // 3. Also apply extend_coffee_chats_person if missing
  const chatPersonCheck = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='coffee_chats' AND column_name='requester_name'
  `)
  if (chatPersonCheck.rows.length === 0) {
    console.log('\n=== Extending coffee_chats (requester_name) ===')
    try {
      const sql = readFileSync('supabase/migrations_backup/20260322_extend_coffee_chats_person.sql', 'utf8')
      await client.query(sql)
      console.log('  Done.')
    } catch (e) {
      console.log(`  Skipped: ${e.message}`)
    }
  } else {
    console.log(`  coffee_chats.requester_name: EXISTS`)
  }

  // 4. Verify
  console.log('\n=== Final verification ===')
  const v1 = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='bio'`)
  const v2 = await client.query(`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename='project_invitations'`)
  const v3 = await client.query(`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename='portfolio_items'`)
  console.log(`  profiles.bio: ${v1.rows.length > 0 ? 'OK' : 'FAIL'}`)
  console.log(`  project_invitations: ${v2.rows.length > 0 ? 'OK' : 'FAIL'}`)
  console.log(`  portfolio_items: ${v3.rows.length > 0 ? 'OK' : 'FAIL'}`)

  await client.end()
  console.log('\nDone! All migrations applied.')
}

run().catch(async (e) => {
  console.error('Error:', e.message)
  await client.end().catch(() => {})
  process.exit(1)
})
