import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read env
const envContent = readFileSync('.env.local', 'utf8')
const url = envContent.match(/NEXT_PUBLIC_SUPABASE_URL="([^"]+)"/)?.[1]
const serviceKey = envContent.match(/SUPABASE_SERVICE_ROLE_KEY="([^"]+)"/)?.[1]

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY')
  process.exit(1)
}

const sb = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function runSQL(description, sql) {
  console.log(`\n=== ${description} ===`)
  const { data, error } = await sb.rpc('exec_sql', { query: sql })
  if (error) {
    // rpc doesn't exist, fallback approach
    console.log(`  RPC not available: ${error.message}`)
    return false
  }
  console.log(`  OK`)
  return true
}

async function checkTable(table) {
  const { error } = await sb.from(table).select('id').limit(1)
  return !error
}

async function checkColumn(table, column) {
  const { error } = await sb.from(table).select(column).limit(1)
  return !error
}

async function main() {
  console.log('Checking current DB state...')

  const hasInvitations = await checkTable('project_invitations')
  const hasPortfolio = await checkTable('portfolio_items')
  const hasBio = await checkColumn('profiles', 'bio')

  console.log(`  project_invitations: ${hasInvitations ? 'EXISTS' : 'MISSING'}`)
  console.log(`  portfolio_items: ${hasPortfolio ? 'EXISTS' : 'MISSING'}`)
  console.log(`  profiles.bio: ${hasBio ? 'EXISTS' : 'MISSING'}`)

  const missing = []
  if (!hasInvitations) missing.push('project_invitations')
  if (!hasPortfolio) missing.push('portfolio_items')
  if (!hasBio) missing.push('profiles.bio')

  if (missing.length === 0) {
    console.log('\nAll tables and columns exist. Nothing to do.')
    return
  }

  console.log(`\nMissing: ${missing.join(', ')}`)
  console.log('These need to be applied via Supabase Dashboard SQL Editor.')
  console.log('\nCopy and paste the following SQL:\n')
  console.log('─'.repeat(60))

  const sqls = []

  if (!hasBio) {
    sqls.push('-- Add bio column to profiles')
    sqls.push('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;')
    sqls.push('')
  }

  if (!hasInvitations) {
    sqls.push(readFileSync('supabase/migrations/20260322_create_project_invitations.sql', 'utf8'))
    sqls.push('')
  }

  if (!hasPortfolio) {
    sqls.push(readFileSync('supabase/migrations/20260323_add_bio_and_portfolio.sql', 'utf8'))
  }

  console.log(sqls.join('\n'))
  console.log('─'.repeat(60))
}

main().catch(console.error)
