/**
 * Set admin status for a user via Supabase Admin API
 *
 * Usage:
 *   npx tsx scripts/set-admin.ts <user_email> [true|false]
 *
 * Examples:
 *   npx tsx scripts/set-admin.ts admin@example.com true   # Grant admin
 *   npx tsx scripts/set-admin.ts admin@example.com false  # Revoke admin
 *   npx tsx scripts/set-admin.ts admin@example.com        # Check status
 *
 * Note: Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 *       Run from the main directory: cd main && npx tsx scripts/set-admin.ts
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
        const [key, ...valueParts] = trimmed.split('=')
        const value = valueParts.join('=')
        if (key && value && !process.env[key]) {
          process.env[key] = value
        }
      }
    }
  } catch {
    // .env.local not found, use existing env vars
  }
}

loadEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables:')
  if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  if (!serviceRoleKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function main() {
  const [, , email, adminStatus] = process.argv

  if (!email) {
    console.log('Usage: npx tsx scripts/set-admin.ts <user_email> [true|false]')
    console.log('')
    console.log('Examples:')
    console.log('  npx tsx scripts/set-admin.ts user@example.com true   # Grant admin')
    console.log('  npx tsx scripts/set-admin.ts user@example.com false  # Revoke admin')
    console.log('  npx tsx scripts/set-admin.ts user@example.com        # Check status')
    process.exit(1)
  }

  console.log(`\n🔍 Looking up user: ${email}`)

  // Find user by email
  const { data: users, error: listError } = await supabase.auth.admin.listUsers()

  if (listError) {
    console.error('❌ Failed to list users:', listError.message)
    process.exit(1)
  }

  const user = users.users.find(u => u.email === email)

  if (!user) {
    console.error(`❌ User not found: ${email}`)
    process.exit(1)
  }

  console.log(`✓ Found user: ${user.id}`)
  console.log(`  Email: ${user.email}`)
  console.log(`  Current is_admin: ${user.app_metadata?.is_admin ?? false}`)

  // If no status provided, just show current status
  if (adminStatus === undefined) {
    console.log('\n💡 To change admin status, run:')
    console.log(`   npx tsx scripts/set-admin.ts ${email} true`)
    console.log(`   npx tsx scripts/set-admin.ts ${email} false`)
    return
  }

  const newAdminStatus = adminStatus === 'true'

  if (user.app_metadata?.is_admin === newAdminStatus) {
    console.log(`\nℹ️ User is already ${newAdminStatus ? 'an admin' : 'not an admin'}. No changes made.`)
    return
  }

  console.log(`\n🔄 Setting is_admin to: ${newAdminStatus}`)

  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    app_metadata: { is_admin: newAdminStatus },
  })

  if (error) {
    console.error('❌ Failed to update user:', error.message)
    process.exit(1)
  }

  console.log(`✅ Successfully updated user!`)
  console.log(`   is_admin: ${data.user.app_metadata?.is_admin}`)

  if (newAdminStatus) {
    console.log('\n⚠️  User needs to log out and log back in for changes to take effect.')
  }
}

main().catch(console.error)
