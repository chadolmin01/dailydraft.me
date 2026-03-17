# -*- coding: utf-8 -*-
"""
공고문 PDF에서 평가기준 및 배점 정보 추출
"""
import pdfplumber
import json
import os
import sys
import re

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

FORMS_DIR = r"C:\Users\chado\OneDrive\문서\양식 폴더"
OUTPUT_DIR = r"C:\project\Draft\docs"

# 각 양식별 공고문 PDF
PDF_FILES = {
    "yebi-chogi": {
        "name": "예비창업패키지",
        "files": [
            r"01_예비창업패키지\[공고문] 2025년도 예비창업패키지 예비창업자 모집공고.pdf",
            r"01_예비창업패키지\[별첨 4] 2025년도 예비창업패키지 예비창업자 모집공고 관련 주요 질의응답.pdf"
        ]
    },
    "chogi": {
        "name": "초기창업패키지",
        "files": [
            r"02_초기창업패키지\[공고문] 2025년도 초기창업패키지 창업기업 모집 공고.pdf",
            r"02_초기창업패키지\[별첨 1] 2025년도 초기창업패키지 사업계획서 양식.pdf"
        ]
    },
    "student-300": {
        "name": "학생창업유망팀300",
        "files": [
            r"03_학생창업유망팀300\(2025-124)+2025+학생+창업유망팀+300++공고문.pdf",
            r"03_학생창업유망팀300\양식1. 사업계획서_2025 학생 창업유망팀 300+.pdf"
        ]
    },
    "saengae-chungnyeon": {
        "name": "생애최초청년창업",
        "files": [
            r"04_생애최초청년창업\3._(공고_제2025-192호)_2025년도_창업중심대학_(예비)창업기업_모집공고_[생애최초_청년_예비창업형].pdf",
            r"04_생애최초청년창업\[별첨1] 생애최초 청년창업 지원사업 사업계획서 양식.pdf"
        ]
    },
    "oneul-jeongtong": {
        "name": "오늘전통",
        "files": [
            r"05_오늘전통\2025 오늘전통 청년 예비창업 공모전 공고문.pdf",
            r"05_오늘전통\2025 오늘전통 청년 예비창업 공모전 제출서류 양식.pdf"
        ]
    },
    "gyeonggi-g-star": {
        "name": "경기G스타오디션",
        "files": [
            r"06_경기G스타오디션\붙임1. 모집공고(2025년 경기 창업 공모(G스타 오디션))수정.pdf",
            r"06_경기G스타오디션\참가신청+양식(2026+경기+창업+공모(G스타+오디션-예비초기리그)).pdf"
        ]
    }
}

def extract_pdf_text(pdf_path, max_pages=30):
    """PDF에서 텍스트 추출"""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            all_text = []
            tables = []

            for i, page in enumerate(pdf.pages[:max_pages]):
                # 텍스트 추출
                text = page.extract_text()
                if text:
                    all_text.append(f"=== 페이지 {i+1} ===\n{text}")

                # 테이블 추출
                page_tables = page.extract_tables()
                for table in page_tables:
                    if table and len(table) > 1:
                        tables.append({
                            "page": i + 1,
                            "data": table
                        })

            return {
                "text": "\n\n".join(all_text),
                "tables": tables,
                "page_count": len(pdf.pages)
            }
    except Exception as e:
        return {"error": str(e)}

def find_evaluation_criteria(text, tables):
    """평가기준 및 배점 정보 추출"""
    result = {
        "evaluation_sections": [],
        "score_distribution": [],
        "selection_criteria": [],
        "key_requirements": []
    }

    # 평가 관련 키워드 패턴
    eval_patterns = [
        r'평가\s*항목',
        r'평가\s*기준',
        r'심사\s*기준',
        r'선정\s*기준',
        r'배점',
        r'점수',
        r'가점',
        r'감점'
    ]

    # PSST 관련 패턴
    psst_patterns = {
        'problem': r'(?:문제\s*인식|Problem|시장\s*현황|필요성)',
        'solution': r'(?:실현\s*가능성|Solution|개발\s*계획|차별성|경쟁력)',
        'scaleup': r'(?:성장\s*전략|Scale[\-\s]*up|사업화|비즈니스\s*모델|시장\s*규모)',
        'team': r'(?:팀\s*구성|Team|대표자|조직\s*역량)'
    }

    # 점수 패턴 (예: 20점, 30%, 100점 만점)
    score_pattern = r'(\d+)\s*(?:점|%|만점)'

    lines = text.split('\n')

    for i, line in enumerate(lines):
        line = line.strip()

        # 평가 항목 찾기
        for pattern in eval_patterns:
            if re.search(pattern, line):
                # 주변 컨텍스트 포함
                context = lines[max(0, i-2):min(len(lines), i+5)]
                context_text = ' '.join(context)

                # 점수 추출
                scores = re.findall(score_pattern, context_text)

                result["evaluation_sections"].append({
                    "line": line,
                    "context": context_text[:500],
                    "scores": scores
                })
                break

        # PSST 섹션별 배점 찾기
        for section, pattern in psst_patterns.items():
            if re.search(pattern, line, re.IGNORECASE):
                scores = re.findall(score_pattern, line)
                if scores:
                    result["score_distribution"].append({
                        "section": section,
                        "text": line,
                        "score": scores[0] if scores else None
                    })

    # 테이블에서 배점 정보 추출
    for table_info in tables:
        table = table_info["data"]
        for row in table:
            if row and any(row):
                row_text = ' '.join(str(cell) for cell in row if cell)

                # 배점 정보가 있는 행 찾기
                if re.search(r'\d+\s*점', row_text):
                    for section, pattern in psst_patterns.items():
                        if re.search(pattern, row_text, re.IGNORECASE):
                            scores = re.findall(score_pattern, row_text)
                            result["score_distribution"].append({
                                "section": section,
                                "text": row_text[:200],
                                "score": scores[0] if scores else None,
                                "source": "table"
                            })

    return result

def extract_detailed_requirements(text):
    """상세 요구사항 추출"""
    requirements = {
        "problem": [],
        "solution": [],
        "scaleup": [],
        "team": [],
        "general": []
    }

    # 섹션별 키워드 매핑
    section_keywords = {
        "problem": ["시장 현황", "문제점", "필요성", "타겟 고객", "페인포인트"],
        "solution": ["개발 계획", "차별성", "경쟁력", "핵심 기술", "MVP", "프로토타입"],
        "scaleup": ["비즈니스 모델", "수익 모델", "시장 규모", "마케팅", "투자유치", "로드맵"],
        "team": ["대표자", "팀원", "역량", "경력", "조직", "협력기관"]
    }

    lines = text.split('\n')
    current_section = "general"

    for line in lines:
        line = line.strip()
        if not line or len(line) < 5:
            continue

        # 현재 섹션 판단
        for section, keywords in section_keywords.items():
            if any(kw in line for kw in keywords):
                current_section = section
                break

        # 요구사항 패턴 (-, ○, ◦, *, ·, 숫자)
        if re.match(r'^[-○◦\*·\d]+[\.\)]\s*', line) or '작성' in line or '기재' in line:
            requirements[current_section].append(line[:300])

    return requirements

def main():
    print("=" * 60)
    print("PDF 평가기준/배점 추출 시작")
    print("=" * 60)

    all_evaluation_data = {}

    for form_id, form_info in PDF_FILES.items():
        print(f"\n[{form_info['name']}] 처리 중...")

        form_data = {
            "name": form_info["name"],
            "evaluation_criteria": [],
            "score_distribution": [],
            "detailed_requirements": {},
            "raw_evaluation_text": []
        }

        for pdf_file in form_info["files"]:
            pdf_path = os.path.join(FORMS_DIR, pdf_file)

            if not os.path.exists(pdf_path):
                print(f"  - 파일 없음: {pdf_file}")
                continue

            print(f"  - 처리: {os.path.basename(pdf_file)}")

            content = extract_pdf_text(pdf_path)

            if "error" in content:
                print(f"    오류: {content['error']}")
                continue

            print(f"    페이지: {content['page_count']}, 테이블: {len(content['tables'])}")

            # 평가 기준 추출
            eval_data = find_evaluation_criteria(content["text"], content["tables"])
            form_data["evaluation_criteria"].extend(eval_data["evaluation_sections"])
            form_data["score_distribution"].extend(eval_data["score_distribution"])

            # 상세 요구사항 추출
            requirements = extract_detailed_requirements(content["text"])
            for section, reqs in requirements.items():
                if section not in form_data["detailed_requirements"]:
                    form_data["detailed_requirements"][section] = []
                form_data["detailed_requirements"][section].extend(reqs)

        # 중복 제거
        form_data["score_distribution"] = [
            dict(t) for t in {tuple(d.items()) for d in form_data["score_distribution"]}
        ]

        all_evaluation_data[form_id] = form_data

        # 요약 출력
        print(f"  - 평가항목: {len(form_data['evaluation_criteria'])}개")
        print(f"  - 배점정보: {len(form_data['score_distribution'])}개")

    # JSON 저장
    output_path = os.path.join(OUTPUT_DIR, "extracted_evaluation_criteria.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_evaluation_data, f, ensure_ascii=False, indent=2)

    print(f"\n\n저장 완료: {output_path}")
    print("=" * 60)

if __name__ == "__main__":
    main()
