# -*- coding: utf-8 -*-
"""
사업계획서 검증 API 테스트 (로컬 시뮬레이션)
"""

import json
import os
import sys
import io
import re

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 검증 규칙 (validate/route.ts 에서 가져옴)
def check_customer_perspective(text):
    """고객 관점 서술 체크"""
    positive = ['고객', '사용자', '소비자', '이용자', '%가', '%의', '의견', '설문']
    negative = ['우리는', '저는', '내가', '제가']
    has_positive = any(k in text for k in positive)
    has_negative = any(k in text for k in negative)
    return has_positive and not has_negative

def check_quantitative_data(text):
    """정량적 데이터 체크"""
    numbers = re.findall(r'\d+', text)
    has_percentage = '%' in text
    has_numbers = len(numbers) >= 3
    return has_numbers or has_percentage

def check_source(text):
    """출처 명시 체크"""
    patterns = ['출처', '자료', '조사', '통계청', '연구', '설문', '인터뷰', '2023', '2024', '2025', '2026']
    return any(p in text for p in patterns)

def check_existing_solutions(text):
    """기존 솔루션 한계 체크"""
    keywords = ['기존', '현재', '한계', '문제점', '부족', '불편', '비용', '경쟁사', '대안']
    count = sum(1 for k in keywords if k in text)
    return count >= 2

def check_adjectives(text):
    """형용사 남용 체크"""
    forbidden = ['매우', '굉장히', '엄청난', '혁신적인', '획기적인', '최고의', '최초의', '완벽한']
    count = sum(1 for f in forbidden if f in text)
    return count <= 1

def check_customer_value(text):
    """고객 가치 명시 체크"""
    keywords = ['절감', '향상', '개선', '효율', '편리', '시간', '비용', '만족', '가치', '혜택']
    count = sum(1 for k in keywords if k in text)
    return count >= 2

def check_how_it_works(text):
    """작동 방식 설명 체크"""
    patterns = ['단계', '→', '과정', '방식', '통해', '프로세스', '절차', '흐름']
    return any(p in text for p in patterns)

def check_differentiation(text):
    """차별화 포인트 체크"""
    keywords = ['차별', '다르게', '유일', '특허', '독자', '경쟁사', '기존', '최초', '유일한']
    return any(k in text for k in keywords)

def check_mvp(text):
    """MVP/개발 현황 체크"""
    keywords = ['MVP', '프로토타입', '베타', '출시', '테스트', '사용자', '고객', '개발', '완료']
    count = sum(1 for k in keywords if k in text)
    return count >= 2

def check_market_size(text):
    """시장 규모 체크"""
    required = ['TAM', 'SAM', 'SOM', '전체 시장', '유효 시장', '목표 시장', '시장 규모']
    count = sum(1 for r in required if r in text)
    return count >= 2

def check_revenue_model(text):
    """수익 모델 체크"""
    keywords = ['수익', '매출', '가격', '구독', '수수료', '판매', '과금', '모델', 'BM']
    count = sum(1 for k in keywords if k in text)
    return count >= 2

def check_growth_strategy(text):
    """단계별 성장 전략 체크"""
    patterns = ['1단계', '2단계', '3단계', '초기', '중기', '장기', '개월', '년']
    count = sum(1 for p in patterns if p in text)
    return count >= 2

def check_founder(text):
    """대표자 역량 체크"""
    keywords = ['대표', 'CEO', '창업자', '경력', '년', '전문', '출신', '경험']
    count = sum(1 for k in keywords if k in text)
    return count >= 2

def check_roles(text):
    """역할 분담 체크"""
    keywords = ['개발', '마케팅', '영업', '기획', '디자인', '운영', '담당', 'CTO', 'CMO', 'COO']
    count = sum(1 for k in keywords if k in text)
    return count >= 2

def check_team_strength(text):
    """팀 차별적 강점 체크"""
    keywords = ['강점', '경험', '네트워크', '전문성', '노하우', '역량', '시너지']
    return any(k in text for k in keywords)

def check_bonus_points(all_text):
    """가점 체크"""
    details = []
    earned = 0
    possible = 4  # 예비창업패키지 최대 가점

    # 기후테크 분야
    climate_keywords = ['기후', '탄소', '재생에너지', '에너지', '친환경', '넷제로', '탄소중립']
    if any(k in all_text for k in climate_keywords):
        earned += 1
        details.append("✅ 기후테크 분야 창업 예정 (+1점)")
    else:
        details.append("⬜ 기후테크 분야 창업 예정 (해당 시 +1점)")

    # AI 대학원 졸업생
    ai_universities = ['KAIST', '서울대', '연세대', '고려대', '성균관대', '포항공대', '한양대']
    if any(u in all_text for u in ai_universities):
        earned += 2
        details.append("✅ 인공지능 대학원 졸업생 (+2점)")
    else:
        details.append("⬜ 인공지능 대학원 졸업생 (해당 시 +2점)")

    # 장관급 수상
    if 'K-스타트업' in all_text or '장관' in all_text or '대상' in all_text:
        earned += 1
        details.append("✅ 정부 창업경진대회 장관급 수상 (+1점)")
    else:
        details.append("⬜ 정부 창업경진대회 장관급 수상 (해당 시 +1점)")

    return earned, possible, details

def validate_section(section_name, text, rules):
    """섹션 검증"""
    checks = []
    score = 0
    max_score = 0

    for rule in rules:
        passed = rule['check'](text)
        weight = rule['weight']
        max_score += weight
        if passed:
            score += weight
        checks.append({
            'name': rule['name'],
            'passed': passed,
            'weight': weight,
            'feedback': None if passed else rule['feedback']
        })

    return {
        'score': score,
        'maxScore': max_score,
        'percentage': round(score / max_score * 100) if max_score > 0 else 0,
        'checks': checks
    }

def main():
    # 데이터 로드
    data_path = os.path.join(os.path.dirname(__file__), "..", "docs", "test_business_plan_data.json")
    data_path = os.path.abspath(data_path)

    with open(data_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    section_data = data['sectionData']

    print("=" * 70)
    print("사업계획서 검증 결과")
    print("=" * 70)
    print(f"아이템명: {data['basicInfo']['itemName']}")
    print(f"양식: 예비창업패키지 (최소 60점 이상 필수)")
    print()

    # 검증 규칙 정의
    validation_rules = {
        'problem': [
            {'name': '고객 관점 서술', 'weight': 3, 'check': check_customer_perspective, 'feedback': '문제를 고객 관점에서 서술해주세요.'},
            {'name': '정량적 데이터', 'weight': 4, 'check': check_quantitative_data, 'feedback': '정량적 데이터가 부족합니다.'},
            {'name': '출처 명시', 'weight': 2, 'check': check_source, 'feedback': '데이터 출처를 명시해주세요.'},
            {'name': '기존 솔루션 한계', 'weight': 3, 'check': check_existing_solutions, 'feedback': '기존 솔루션의 한계점을 명시해주세요.'},
            {'name': '형용사 남용 체크', 'weight': 2, 'check': check_adjectives, 'feedback': '추상적 형용사를 줄여주세요.'},
        ],
        'solution': [
            {'name': '고객 가치 명시', 'weight': 4, 'check': check_customer_value, 'feedback': '고객이 얻는 가치를 강조해주세요.'},
            {'name': '작동 방식 설명', 'weight': 3, 'check': check_how_it_works, 'feedback': '솔루션 작동 방식을 설명해주세요.'},
            {'name': '차별화 포인트', 'weight': 4, 'check': check_differentiation, 'feedback': '경쟁사와의 차별점을 명확히 해주세요.'},
            {'name': 'MVP/개발 현황', 'weight': 5, 'check': check_mvp, 'feedback': '현재 개발 현황을 추가해주세요.'},
        ],
        'scaleup': [
            {'name': '시장 규모 (TAM/SAM/SOM)', 'weight': 5, 'check': check_market_size, 'feedback': 'TAM/SAM/SOM을 모두 명시해주세요.'},
            {'name': '수익 모델', 'weight': 5, 'check': check_revenue_model, 'feedback': '수익 모델을 구체적으로 명시해주세요.'},
            {'name': '단계별 성장 전략', 'weight': 4, 'check': check_growth_strategy, 'feedback': '성장 전략을 단계별로 구분해주세요.'},
        ],
        'team': [
            {'name': '대표자 역량', 'weight': 4, 'check': check_founder, 'feedback': '대표자의 경력과 전문성을 명시해주세요.'},
            {'name': '역할 분담', 'weight': 3, 'check': check_roles, 'feedback': '팀원별 역할 분담을 명확히 해주세요.'},
            {'name': '팀 차별적 강점', 'weight': 4, 'check': check_team_strength, 'feedback': '팀의 차별적 강점을 설명해주세요.'},
        ]
    }

    total_score = 0
    total_max = 0
    all_text = ""

    section_names = {
        'problem': '문제 인식 (Problem)',
        'solution': '실현 가능성 (Solution)',
        'scaleup': '성장 전략 (Scale-up)',
        'team': '팀 구성 (Team)'
    }

    for section_key, rules in validation_rules.items():
        section_content = section_data.get(section_key, {})
        combined_text = ' '.join(section_content.values())
        all_text += ' ' + combined_text

        result = validate_section(section_key, combined_text, rules)
        total_score += result['score']
        total_max += result['maxScore']

        print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print(f"📋 {section_names[section_key]}")
        print(f"   점수: {result['score']}/{result['maxScore']} ({result['percentage']}%)")
        print()

        for check in result['checks']:
            status = "✅" if check['passed'] else "❌"
            print(f"   {status} {check['name']} (배점: {check['weight']})")
            if check['feedback']:
                print(f"      → {check['feedback']}")

        print()

    # 종합 점수
    overall_percentage = round(total_score / total_max * 100) if total_max > 0 else 0

    print("=" * 70)
    print("📊 종합 평가")
    print("=" * 70)
    print(f"총점: {total_score}/{total_max} ({overall_percentage}%)")
    print()

    # 합격 여부
    if overall_percentage >= 90:
        print("🎉 훌륭합니다! 심사 통과 가능성이 높습니다.")
    elif overall_percentage >= 80:
        print("👍 잘 작성되었습니다. 아래 개선점을 보완하면 더 좋아집니다.")
    elif overall_percentage >= 70:
        print("📝 기본은 갖추었지만, 개선이 필요한 부분이 있습니다.")
    elif overall_percentage >= 60:
        print("⚠️ 최소 기준(60점)을 충족했지만, 선정을 위해 보완이 필요합니다.")
    else:
        print("❌ 60점 미만! 현재 상태로는 선정 대상에서 제외됩니다.")

    print()

    # 가점 체크
    earned, possible, details = check_bonus_points(all_text)
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("🎁 가점 현황")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"획득: {earned}점 / 가능: {possible}점")
    print()
    for detail in details:
        print(f"   {detail}")

    print()
    print("=" * 70)

if __name__ == "__main__":
    main()
