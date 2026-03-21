-- AI 추출 프로필 컬럼
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS extracted_profile JSONB DEFAULT NULL;

-- 동의 관련 컬럼
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS data_consent BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS data_consent_at TIMESTAMPTZ DEFAULT NULL;

-- 추출 메타데이터
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_extraction_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS extraction_confidence INTEGER DEFAULT NULL;

-- 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_extracted_role ON profiles USING GIN ((extracted_profile->'role'));
CREATE INDEX IF NOT EXISTS idx_profiles_extracted_skills ON profiles USING GIN ((extracted_profile->'skills'));
