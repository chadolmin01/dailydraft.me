/**
 * List all users with admin status
 * Usage: npx tsx scripts/list-users.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables from .env.local
function loadEnv() {
  try {
    const envPath = join(process.cwd(), '.env.local')
    const envContent = readFileSync(envPath, 'utf-8')
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const idx = trimmed.indexOf('=')
        if (idx > 0) {
          const key = trimmed.substring(0, idx)
          const value = trimmed.substring(idx + 1)
          if (!process.env[key]) {
            process.env[key] = value
          }
        }
      }
    }
  } catch {
    // .env.local not found
  }
}

loadEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  console.log('🔍 Fetching users...\n')

  const { data, error } = await supabase.auth.admin.listUsers()

  if (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }

  console.log('='.repeat(60))
  console.log('EMAIL'.padEnd(40), 'IS_ADMIN')
  console.log('='.repeat(60))

  for (const user of data.users) {
    const isAdmin = user.app_metadata?.is_admin === true ? '✓ YES' : 'no'
    console.log((user.email || 'N/A').padEnd(40), isAdmin)
  }

  console.log('='.repeat(60))
  console.log(`Total: ${data.users.length} users`)
}

main()
