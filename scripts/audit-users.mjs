import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load env
const env = readFileSync('.env.local', 'utf8');
const getEnv = (key) => {
  const match = env.match(new RegExp(`^${key}="?([^"\\n]+)"?`, 'm'));
  return match ? match[1] : null;
};

const supabase = createClient(
  getEnv('NEXT_PUBLIC_SUPABASE_URL'),
  getEnv('SUPABASE_SERVICE_ROLE_KEY'),
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (error) { console.error(error); process.exit(1); }

const { data: profiles } = await supabase.from('profiles').select('user_id, nickname, contact_email, onboarding_completed, created_at, updated_at');
const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

console.log('=== 전체 유저 목록 ===\n');
users.forEach((u, i) => {
  const p = profileMap.get(u.id);
  const providers = u.app_metadata?.providers?.join(', ') || u.app_metadata?.provider || 'unknown';
  const isAdmin = u.app_metadata?.is_admin ? ' [ADMIN]' : '';
  const hasProfile = p ? 'O' : 'X';
  const onboarded = p?.onboarding_completed ? 'O' : 'X';
  const lastSignIn = u.last_sign_in_at ? new Date(u.last_sign_in_at).toISOString().slice(0, 10) : 'never';
  const confirmed = u.email_confirmed_at ? 'O' : 'X';

  console.log(`${i + 1}. ${u.email || 'no-email'}${isAdmin}`);
  console.log(`   id: ${u.id}`);
  console.log(`   provider: ${providers} | confirmed: ${confirmed} | last_sign_in: ${lastSignIn}`);
  console.log(`   profile: ${hasProfile} | onboarded: ${onboarded} | nickname: ${p?.nickname || '-'}`);
  console.log(`   created: ${new Date(u.created_at).toISOString().slice(0, 10)}`);
  console.log('');
});

// 문제 유저 감지
console.log('=== 잠재적 문제 유저 ===\n');
const issues = [];

users.forEach(u => {
  const p = profileMap.get(u.id);
  const problems = [];

  if (!p) problems.push('프로필 없음');
  if (!u.email) problems.push('이메일 없음');
  if (!u.email_confirmed_at) problems.push('이메일 미인증');
  if (!u.last_sign_in_at) problems.push('로그인 기록 없음');
  if (p && !p.onboarding_completed) problems.push('온보딩 미완료');
  if (p && (!p.nickname || p.nickname.trim() === '')) problems.push('닉네임 없음');

  const dupes = users.filter(other => other.email && other.email === u.email && other.id !== u.id);
  if (dupes.length > 0) problems.push(`중복 이메일 (${dupes.length}개)`);

  if (u.email && (u.email.includes('test') || u.email.includes('seed') || u.email.includes('example.com') || u.email.includes('dummy'))) {
    problems.push('테스트/시드 계정 의심');
  }

  if (problems.length > 0) {
    issues.push({ email: u.email || 'no-email', id: u.id, problems });
  }
});

if (issues.length === 0) {
  console.log('문제 유저 없음');
} else {
  issues.forEach(item => {
    console.log(`- ${item.email} (${item.id.slice(0, 8)}...)`);
    console.log(`  문제: ${item.problems.join(', ')}`);
  });
}

// 고아 프로필
const authIds = new Set(users.map(u => u.id));
const orphanProfiles = (profiles || []).filter(p => !authIds.has(p.user_id));
if (orphanProfiles.length > 0) {
  console.log('\n=== 고아 프로필 (auth 유저 삭제됨) ===');
  orphanProfiles.forEach(p => {
    console.log(`- user_id: ${p.user_id} | nickname: ${p.nickname}`);
  });
}
