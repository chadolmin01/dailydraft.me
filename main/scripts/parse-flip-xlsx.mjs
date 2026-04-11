/**
 * FLIP xlsx 파일들 → flip-seed.csv 변환
 *
 * 실행: node scripts/parse-flip-xlsx.mjs
 * 결과: scripts/flip-seed.csv 생성
 *
 * 개인정보 원칙:
 * - 추출: 이름, 학과, 학번(입학년도), 캠퍼스
 * - 제외: 전화번호, 이메일, 출석 데이터
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// xlsx를 의존성 없이 파싱하기 어려우므로 Python 스크립트를 호출
import { execSync } from 'child_process'

const pythonScript = `
import os, json, openpyxl, csv, tempfile

folder = 'C:/project/Draft/FLIP'
members = []  # {name, department, year, campus, cohort}
seen = set()  # 중복 제거용: (name, year)

def parse_year(val):
    """학번에서 입학년도 추출: 2022105090 -> 2022, '23학번' -> 2023"""
    s = str(val).strip()
    if not s: return None
    # '23학번' 형태
    if '학번' in s:
        num = s.replace('학번', '').strip()
        if len(num) == 2:
            return int('20' + num)
        return int(num) if num.isdigit() else None
    # 2022105090 형태 (10자리 학번)
    if s.isdigit() and len(s) >= 8:
        y = int(s[:4])
        if 2015 <= y <= 2030: return y
    return None

def guess_cohort(year, semester_label):
    """파일명 기반으로 기수 추정"""
    return semester_label

# 1. 2023-1 출석부
for fname in sorted(os.listdir(folder)):
    if not fname.endswith('.xlsx'): continue
    fpath = os.path.join(folder, fname)
    wb = openpyxl.load_workbook(fpath, read_only=True, data_only=True)

    if '2023-1' in fname:
        ws = wb['Sheet1']
        rows = list(ws.iter_rows(values_only=True))
        for r in rows[1:]:
            if not r[0] or not str(r[0]).strip(): continue
            name = str(r[0]).strip()
            dept = str(r[1]).strip() if r[1] else ''
            year = parse_year(r[2])
            campus = str(r[3]).strip() if r[3] else ''
            key = (name, year)
            if key not in seen:
                seen.add(key)
                members.append({
                    'name': name,
                    'department': dept,
                    'year': year,
                    'campus': campus,
                    'cohort': '2023-1',
                })

    elif '2023-2' in fname:
        ws = wb['Sheet1']
        rows = list(ws.iter_rows(values_only=True))
        for r in rows[1:]:
            if not r[0] or not str(r[0]).strip(): continue
            name = str(r[0]).strip()
            dept = str(r[1]).strip() if r[1] else ''
            year = parse_year(r[2])
            campus = str(r[3]).strip() if r[3] else ''
            key = (name, year)
            if key not in seen:
                seen.add(key)
                members.append({
                    'name': name,
                    'department': dept,
                    'year': year,
                    'campus': campus,
                    'cohort': '2023-2',
                })

    elif '국제' in fname:
        ws = wb[wb.sheetnames[0]]  # 시트1
        rows = list(ws.iter_rows(values_only=True))
        for r in rows[1:]:
            if not r[0] or not str(r[0]).strip(): continue
            name = str(r[0]).strip()
            year = parse_year(r[1])
            dept = str(r[2]).strip() if r[2] else ''
            campus = '국제'
            key = (name, year)
            if key not in seen:
                seen.add(key)
                members.append({
                    'name': name,
                    'department': dept,
                    'year': year,
                    'campus': campus,
                    'cohort': '2026-1',
                })

    wb.close()

# 2. 26-1 서울 CSV (zip에서 이미 추출됨)
tmp = tempfile.gettempdir()
flip_extract = os.path.join(tmp, 'flip_extract')
if os.path.exists(flip_extract):
    for c in os.listdir(flip_extract):
        if not c.endswith('.csv'): continue
        with open(os.path.join(flip_extract, c), encoding='utf-8-sig') as f:
            reader = list(csv.reader(f))
            if not reader: continue
            header = reader[0]
            # 이름 컬럼 찾기
            name_idx = None
            dept_idx = None
            for i, h in enumerate(header):
                if '이름' in h: name_idx = i
                if '학과' in h or '학번' in h: dept_idx = i
            if name_idx is None: continue
            for row in reader[1:]:
                if not row or not row[name_idx].strip(): continue
                name = row[name_idx].strip()
                dept_raw = row[dept_idx].strip() if dept_idx and dept_idx < len(row) else ''
                # '의상학과, 경영학과/22학번' -> dept='의상학과, 경영학과', year=2022
                year = None
                dept = dept_raw
                if '/' in dept_raw:
                    parts = dept_raw.rsplit('/', 1)
                    dept = parts[0].strip()
                    year = parse_year(parts[1])
                key = (name, year)
                if key not in seen:
                    seen.add(key)
                    members.append({
                        'name': name,
                        'department': dept,
                        'year': year,
                        'campus': '서울',
                        'cohort': '2026-1',
                    })

print(json.dumps(members, ensure_ascii=False))
`

try {
  const result = execSync(`python -c ${JSON.stringify(pythonScript)}`, {
    encoding: 'utf-8',
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    maxBuffer: 1024 * 1024,
  })

  const members = JSON.parse(result.trim())
  console.log(`📊 총 ${members.length}명 파싱 완료\n`)

  // CSV 생성
  const csvHeader = 'name,cohort,track,university,role,projects,notes'
  const csvRows = members.map((m) => {
    const dept = m.department || ''
    const yearStr = m.year ? String(m.year) : ''
    const campus = m.campus || ''
    // notes에 학과/학번/캠퍼스 정보 합침
    const notes = [dept, yearStr ? `${yearStr}학번` : '', campus].filter(Boolean).join(' / ')
    return `${m.name},${m.cohort},,경희대학교,member,,${notes}`
  })

  const csvContent = [csvHeader, ...csvRows].join('\n') + '\n'
  const outPath = resolve(__dirname, 'flip-seed.csv')
  writeFileSync(outPath, csvContent, 'utf-8')

  console.log(`✅ ${outPath} 생성 완료`)
  console.log(`   ${members.length}명`)

  // 기수별 분포
  const cohortCounts = {}
  members.forEach((m) => {
    cohortCounts[m.cohort] = (cohortCounts[m.cohort] || 0) + 1
  })
  console.log('\n📋 기수별 분포:')
  Object.entries(cohortCounts)
    .sort()
    .forEach(([k, v]) => console.log(`   ${k}: ${v}명`))
} catch (err) {
  console.error('❌ Python 파싱 실패:', err.message)
  process.exit(1)
}
