# -*- coding: utf-8 -*-
"""
사업계획서 시스템 테스트 스크립트
정부 양식 테이블 구조 그대로 재현
"""

import json
import os
import sys
import io

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 테스트용 사업계획서 데이터
SAMPLE_BUSINESS_PLAN = {
    "basicInfo": {
        "itemName": "실버케어AI",
        "oneLiner": "AI 음성분석으로 독거노인의 건강 이상을 조기 감지하는 스마트 돌봄 서비스",
        "targetCustomer": "독거노인 및 그 가족, 지자체 돌봄센터",
        "industry": "bio_healthcare",
        "fundingAmount": 10000,
        "templateType": "yebi-chogi"
    },
    "sectionData": {
        "problem": {
            "market_status": """[시장 현황]
국내 65세 이상 고령인구는 2024년 기준 950만명으로 전체 인구의 18.4%를 차지합니다(통계청, 2024). 이 중 독거노인은 약 180만 가구로, 매년 8%씩 증가하고 있습니다.

고령화 속도는 OECD 국가 중 1위이며, 2025년에는 초고령사회(20% 이상)에 진입할 것으로 전망됩니다. 독거노인 돌봄 시장 규모는 2024년 기준 약 3조원으로 추정되며, 연평균 15% 성장 중입니다.

정부는 '어르신 돌봄 디지털 전환' 정책을 통해 2025년까지 AI 기반 돌봄 서비스 확대를 추진 중입니다.""",

            "problem_definition": """[핵심 문제점]
독거노인의 78%가 건강 이상 발생 시 24시간 이내에 발견되지 못하고 있습니다(보건복지부, 2024).

1. 조기 감지 실패: 독거노인의 뇌졸중, 심장질환 등 응급상황 발생 시 평균 발견 시간 18시간
   - 골든타임(4시간) 내 발견율 23% 불과
   - 이로 인한 사망률 일반 대비 3.2배 높음

2. 기존 돌봄의 한계:
   - 방문 돌봄: 주 1-2회, 1회 30분 (커버리지 부족)
   - 응급호출기: 의식 있을 때만 작동 (무의식 상태 대응 불가)
   - 영상 모니터링: 프라이버시 침해 우려로 거부율 67%

3. 돌봄 인력 부족:
   - 2024년 사회복지사 1인당 담당 노인 수: 평균 127명
   - 실질적 케어 가능 인원: 30명 미만""",

            "development_necessity": """[개발 필요성]
음성 기반 AI 건강 모니터링 기술 개발이 시급한 이유:

1. 기술적 필요성
   - 음성에서 우울증, 파킨슨병 조기 징후 감지 정확도 89% 달성 (MIT 연구, 2023)
   - 프라이버시를 침해하지 않으면서 24시간 모니터링 가능
   - 기존 스마트 스피커 인프라 활용 가능 (추가 기기 불필요)

2. 사회적 필요성
   - 초고령사회 대비 비용 효율적 돌봄 시스템 구축 필수
   - 독거노인 고독사 연간 3,000건 이상 (경찰청, 2024)
   - 지자체 돌봄 예산 한계로 효율적 솔루션 수요 급증

3. 시장 기회
   - 정부 디지털 돌봄 예산 2025년 5,000억원 편성
   - 글로벌 시니어케어 AI 시장 2027년 150억 달러 전망"""
        },
        "solution": {
            "development_plan": """[솔루션 개요]
실버케어AI는 음성 분석 AI를 통해 독거노인의 건강 상태를 24시간 모니터링하고, 이상 징후 발생 시 즉시 보호자와 돌봄센터에 알림을 전송하는 서비스입니다.

[작동 방식]
1단계: 음성 수집 → 스마트 스피커를 통해 일상 대화/인사 음성 수집
2단계: AI 분석 → 음성 패턴, 말 속도, 호흡 분석으로 건강 상태 진단
3단계: 알림 전송 → 이상 감지 시 가족/돌봄센터 앱으로 즉시 알림
4단계: 대응 연계 → 119 자동 연결, 방문 돌봄 트리거

[개발 로드맵]
- 1~3개월: 음성 분석 AI 모델 고도화 (정확도 92% 목표)
- 4~6개월: 스마트 스피커 연동 앱 개발, 파일럿 테스트 (100가구)
- 7~10개월: 지자체 연계 실증, 서비스 런칭

[현재 개발 현황]
- MVP 완료: 음성 분석 AI 모델 v1.0 (정확도 85%)
- 파일럿: 서울시 마포구 독거노인 30가구 테스트 중
- 만족도: 4.2/5.0 (참여 어르신 설문)""",

            "differentiation": """[차별화 포인트]

1. 비침습적 모니터링
   - 카메라 없이 음성만으로 건강 상태 파악
   - 프라이버시 보호로 수용성 89% (경쟁사 CCTV 방식 33%)

2. 독자 AI 기술
   - 한국어 노인 음성 특화 모델 (10만 시간 학습 데이터)
   - 사투리, 발음 불분명 음성도 95% 인식
   - 특허 출원 완료 (출원번호: 10-2024-0012345)

3. 기존 인프라 활용
   - 신규 기기 설치 불필요 (기존 스마트 스피커 연동)
   - 초기 비용 0원, 월 구독료만 발생

4. 돌봄 생태계 연계
   - 지자체 돌봄센터 시스템 API 연동
   - 119 자동 연결 기능 탑재
   - 병원/약국 예약 연계 예정""",

            "competitiveness": """[경쟁력 분석]

vs. A사 (CCTV 모니터링)
- A사: 월 5만원, 프라이버시 우려로 설치 거부 67%
- 우리: 월 2만원, 음성 기반으로 수용성 89%

vs. B사 (웨어러블 기기)
- B사: 기기 구매 30만원 + 월 3만원, 착용 거부율 54%
- 우리: 기기 구매 0원 + 월 2만원, 일상 대화만으로 측정

[핵심 기술 경쟁력]
- 음성 기반 우울증 감지 정확도: 89% (업계 최고)
- 낙상 감지 정확도: 94%
- 응급상황 감지 후 알림까지 소요 시간: 평균 12초

[파트너십]
- 서울디지털재단 MOU 체결 (2024.06)
- 마포구청 돌봄센터 연계 시범사업 진행 중
- SKT 스마트홈 연동 협의 중"""
        },
        "scaleup": {
            "business_model": """[수익 모델]

1. B2C 구독 서비스 (40%)
   - Basic: 월 19,000원 (음성 모니터링 + 알림)
   - Premium: 월 39,000원 (+ 건강리포트 + 의료상담 연계)

2. B2G 라이선스 (50%)
   - 지자체 돌봄센터 API 연동: 인당 월 5,000원
   - 관제 대시보드 제공: 센터당 월 50만원

3. B2B 제휴 (10%)
   - 보험사 연계: 실버보험 가입자 대상 서비스 제공
   - 통신사 연계: 시니어폰 요금제 번들

[Unit Economics]
- CAC (고객획득비용): 35,000원
- LTV (고객생애가치): 456,000원 (평균 24개월 구독)
- LTV/CAC: 13.0
- 월 손익분기점: 가입자 3,000명""",

            "market_size": """[시장 규모 분석]

TAM (전체 시장): 3조원
- 국내 독거노인 돌봄 서비스 시장 전체
- 출처: 보건복지부 고령화 실태조사, 2024

SAM (유효 시장): 6,000억원
- 디지털/AI 기반 돌봄 서비스 시장
- TAM의 20%
- 연평균 성장률 25%

SOM (목표 시장): 120억원
- 3년 내 점유 목표: 2%
- 가입 가구 수 목표: 50,000가구
- 지자체 계약 목표: 50개 구청

[시장 동향]
- 정부 디지털 돌봄 예산: 2025년 5,000억원 (전년 대비 40% 증가)
- AI 시니어케어 글로벌 시장: 2027년 150억 달러 (CAGR 18%)
- 경쟁 강도: 중간 (본격적 AI 돌봄 서비스 부재)""",

            "roadmap": """[사업화 로드맵]

1단계: 시장 진입 (0-6개월)
- 타겟: 서울/경기 지자체 돌봄센터
- 전략: 무료 파일럿 → 성과 입증 → 정식 계약
- KPI: 파일럿 10개 구청, 사용자 1,000명

2단계: 성장 (6-12개월)
- 타겟: 전국 지자체 + B2C 확대
- 전략: 성공 사례 기반 영업, 온라인 마케팅
- KPI: 계약 30개 구청, 가입자 10,000명, MRR 2억원

3단계: 확장 (12-24개월)
- 타겟: 보험사/통신사 제휴, 해외 진출
- 전략: B2B 파트너십, 일본 시장 진출
- KPI: ARR 50억원, 해외 매출 비중 10%

[마일스톤]
- 2025.06: 정식 서비스 런칭
- 2025.09: 시리즈A 투자 유치 (30억원 목표)
- 2025.12: 가입자 20,000명 달성
- 2026.06: 일본 시장 진출"""
        },
        "team": {
            "founder": """김건강 | CEO & Founder
- 서울대학교 의료정보학 석사
- 前 삼성전자 헬스케어사업부 PM (5년)
- 前 스타트업 A사 공동창업 (Exit)
- AI 헬스케어 분야 특허 3건 보유

[핵심 성과]
- 삼성헬스 시니어 모드 기획/런칭 (MAU 50만 달성)
- AI 건강진단 알고리즘 개발 (정확도 91%)
- 창업 경진대회 대상 수상 (2023 K-스타트업)

[창업 동기]
할머니의 갑작스러운 낙상 사고 후 3일만에 발견된 경험이 창업의 계기가 되었습니다.""",

            "team_members": """이기술 | CTO
- KAIST 인공지능대학원 석사
- 前 네이버 AI랩 음성인식팀 (4년)
- 음성 AI 관련 논문 5편, 특허 2건
- 담당: 음성 분석 AI 개발, 기술 총괄

박마케팅 | CMO
- 연세대 경영학과
- 前 토스 Growth팀 (3년)
- B2C 마케팅 캠페인 다수 성공
- 담당: 마케팅 전략, 사업개발

최개발 | Lead Developer
- 고려대 컴퓨터공학과
- 前 카카오 백엔드 개발자 (3년)
- 담당: 백엔드 개발, 인프라 구축

[자문단]
- 서울대 의대 노인의학과 교수
- 삼성전자 前 헬스케어사업부장
- 한국사회복지협의회 부회장""",

            "team_synergy": """왜 이 팀인가?
1. 도메인 전문성: 대표의 헬스케어 사업 경험 + CTO의 음성 AI 기술력
2. 실행력: 전원 스타트업/빅테크 경험으로 빠른 MVP 개발
3. 네트워크: 지자체, 대기업, 의료계 연결 가능

보완 계획
- 6개월 내 사회복지사 출신 CS 매니저 1명 채용
- 영업/파트너십 담당자 1명 채용 예정
- AI 엔지니어 2명 추가 채용 계획"""
        }
    },
    # 추가 정보: 추진일정, 정부지원금, 팀구성표
    "schedule": [
        {"no": "1", "content": "AI 음성 분석 모델 고도화", "period": "25.03 ~ 25.05", "detail": "정확도 85% → 92% 목표"},
        {"no": "2", "content": "스마트 스피커 연동 앱 개발", "period": "25.04 ~ 25.07", "detail": "iOS/Android 앱 개발"},
        {"no": "3", "content": "파일럿 테스트 (100가구)", "period": "25.06 ~ 25.08", "detail": "서울 마포구/성동구 진행"},
        {"no": "4", "content": "지자체 연계 실증사업", "period": "25.08 ~ 25.10", "detail": "10개 구청 파일럿"},
        {"no": "5", "content": "정식 서비스 런칭", "period": "25.10 ~ 25.12", "detail": "B2C + B2G 동시 출시"},
    ],
    "budget": [
        {"category": "재료비", "detail": "서버 및 클라우드 인프라 구축", "amount": "15,000,000"},
        {"category": "재료비", "detail": "AI 학습 데이터 구매", "amount": "10,000,000"},
        {"category": "외주용역비", "detail": "앱 UI/UX 디자인 외주", "amount": "8,000,000"},
        {"category": "외주용역비", "detail": "보안 인증 컨설팅", "amount": "5,000,000"},
        {"category": "인건비", "detail": "AI 엔지니어 인건비 (6개월)", "amount": "42,000,000"},
        {"category": "지급수수료", "detail": "특허 출원 비용", "amount": "3,000,000"},
        {"category": "마케팅비", "detail": "파일럿 홍보 및 마케팅", "amount": "7,000,000"},
    ],
    "teamTable": [
        {"no": "1", "position": "대표이사", "role": "총괄 기획, 사업개발", "capability": "의료정보학 석사, 삼성전자 PM 5년", "status": "완료('24.01)"},
        {"no": "2", "position": "CTO", "role": "AI 개발 총괄", "capability": "KAIST AI대학원, 네이버 AI랩 4년", "status": "완료('24.03)"},
        {"no": "3", "position": "CMO", "role": "마케팅/영업", "capability": "연세대 경영, 토스 Growth 3년", "status": "완료('24.06)"},
        {"no": "4", "position": "개발자", "role": "백엔드 개발", "capability": "고려대 컴공, 카카오 3년", "status": "완료('24.09)"},
        {"no": "5", "position": "AI 엔지니어", "role": "음성 AI 모델 개발", "capability": "관련 경력 3년 이상", "status": "예정('25.06)"},
    ],
    "partners": [
        {"no": "1", "name": "서울디지털재단", "capability": "디지털 복지 인프라", "plan": "파일럿 테스트 지원", "period": "25.06"},
        {"no": "2", "name": "마포구청", "capability": "독거노인 돌봄센터 운영", "plan": "실증사업 협력", "period": "25.08"},
        {"no": "3", "name": "SKT", "capability": "스마트홈 플랫폼", "plan": "스피커 연동 기술 협력", "period": "25.09"},
    ]
}

def generate_gov_form_html(data):
    """정부 양식 테이블 구조 그대로 재현"""
    basic = data["basicInfo"]
    sections = data["sectionData"]

    def text_to_html(text):
        """텍스트를 HTML 단락으로 변환"""
        lines = text.strip().split('\n')
        result = []
        for line in lines:
            if line.strip():
                result.append(f"<p>{line}</p>")
            else:
                result.append("<br>")
        return '\n'.join(result)

    html = f'''<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>사업계획서 - {basic["itemName"]}</title>
    <style>
        @page {{
            size: A4;
            margin: 15mm 20mm;
        }}

        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        body {{
            font-family: "맑은 고딕", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif;
            font-size: 10pt;
            line-height: 1.5;
            color: #000;
            background: white;
        }}

        .page {{
            width: 210mm;
            min-height: 297mm;
            padding: 15mm 20mm;
            background: white;
        }}

        .page-break {{
            page-break-after: always;
        }}

        /* 표지 */
        .cover {{
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            height: 267mm;
        }}

        .cover-program {{
            font-size: 14pt;
            color: #333;
            margin-bottom: 30mm;
        }}

        .cover-title {{
            font-size: 32pt;
            font-weight: bold;
            border: 3px solid #000;
            padding: 15mm 30mm;
            margin-bottom: 20mm;
        }}

        .cover-item {{
            font-size: 18pt;
            font-weight: bold;
            margin-bottom: 30mm;
        }}

        .cover-date {{
            font-size: 12pt;
            color: #333;
        }}

        /* 테이블 공통 */
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10mm;
        }}

        th, td {{
            border: 1px solid #000;
            padding: 3mm;
            vertical-align: top;
            text-align: left;
        }}

        th {{
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
        }}

        .header-cell {{
            background-color: #e8e8e8;
            font-weight: bold;
            text-align: center;
            width: 25%;
        }}

        .section-header {{
            background-color: #d0d0d0;
            font-weight: bold;
            font-size: 11pt;
            text-align: center;
        }}

        /* 섹션 제목 */
        .section-title {{
            font-size: 14pt;
            font-weight: bold;
            margin: 8mm 0 5mm 0;
            padding-bottom: 2mm;
            border-bottom: 2px solid #000;
        }}

        .subsection-title {{
            font-size: 11pt;
            font-weight: bold;
            margin: 5mm 0 3mm 0;
        }}

        /* 내용 영역 */
        .content-cell {{
            min-height: 30mm;
            padding: 4mm;
        }}

        .content-cell p {{
            margin-bottom: 2mm;
            text-align: justify;
            word-break: keep-all;
        }}

        .content-cell ul {{
            margin-left: 5mm;
        }}

        .content-cell li {{
            margin-bottom: 1mm;
        }}

        /* 개요표 */
        .overview-table th {{
            width: 20%;
            background-color: #e8e8e8;
        }}

        .overview-table td {{
            width: 80%;
        }}

        /* 숫자 테이블 */
        .data-table th {{
            text-align: center;
            background-color: #e8e8e8;
        }}

        .data-table td {{
            text-align: center;
        }}

        .data-table td:nth-child(2),
        .data-table td:nth-child(4) {{
            text-align: left;
        }}

        /* 금액 정렬 */
        .amount {{
            text-align: right !important;
        }}

        /* 안내문 */
        .notice {{
            background-color: #fffde7;
            border: 1px solid #ffc107;
            padding: 3mm;
            margin-bottom: 5mm;
            font-size: 9pt;
        }}

        /* 목차 */
        .toc {{
            margin: 10mm 0;
        }}

        .toc-item {{
            display: flex;
            justify-content: space-between;
            padding: 2mm 0;
            border-bottom: 1px dotted #ccc;
        }}

        /* 서명란 */
        .signature {{
            margin-top: 20mm;
            text-align: center;
        }}

        .signature-line {{
            margin-top: 10mm;
            border-top: 1px solid #000;
            display: inline-block;
            width: 50mm;
        }}

        @media print {{
            body {{
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }}
        }}
    </style>
</head>
<body>
    <!-- 표지 -->
    <div class="page cover page-break">
        <div class="cover-program">2025년도 예비창업패키지</div>
        <div class="cover-title">사 업 계 획 서</div>
        <div class="cover-item">{basic["itemName"]}</div>
        <div style="margin-bottom: 20mm;">
            <p>{basic["oneLiner"]}</p>
        </div>
        <div class="cover-date">2025년 3월</div>
    </div>

    <!-- 목차 페이지 -->
    <div class="page page-break">
        <h2 class="section-title">목 차</h2>

        <table>
            <thead>
                <tr>
                    <th style="width:70%">항 목</th>
                    <th style="width:30%">세부항목</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>□ 일반현황</td>
                    <td>창업아이템명, 팀 구성 현황 등</td>
                </tr>
                <tr>
                    <td>□ 창업 아이템 개요(요약)</td>
                    <td>문제인식, 실현가능성, 성장전략, 팀구성 요약</td>
                </tr>
            </tbody>
        </table>

        <table>
            <thead>
                <tr>
                    <th style="width:35%">평가항목</th>
                    <th style="width:65%">세부 내용</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="section-header">1. 문제 인식 (Problem)</td>
                    <td>창업 아이템의 필요성, 국내·외 시장 현황 및 아이템의 개발 배경</td>
                </tr>
                <tr>
                    <td class="section-header">2. 실현 가능성 (Solution)</td>
                    <td>아이디어를 제품·서비스로 구현하기 위한 개발 계획 및 역량</td>
                </tr>
                <tr>
                    <td class="section-header">3. 성장전략 (Scale-up)</td>
                    <td>경쟁사 분석, 목표 시장 진입 전략 및 비즈니스 모델</td>
                </tr>
                <tr>
                    <td class="section-header">4. 팀 구성 (Team)</td>
                    <td>대표자의 보유 역량, 팀 구성 계획 및 역할 분담</td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- 일반현황 + 개요 -->
    <div class="page page-break">
        <h2 class="section-title">□ 일반현황</h2>

        <table class="overview-table">
            <tr>
                <th>창업 아이템명</th>
                <td colspan="3">{basic["itemName"]}</td>
            </tr>
            <tr>
                <th>아이템 한줄 소개</th>
                <td colspan="3">{basic["oneLiner"]}</td>
            </tr>
            <tr>
                <th>목표 고객</th>
                <td>{basic["targetCustomer"]}</td>
                <th style="width:15%">분야</th>
                <td style="width:25%">바이오/헬스케어</td>
            </tr>
            <tr>
                <th>신청 금액</th>
                <td>{basic["fundingAmount"]//10000:,}만원</td>
                <th>사업 기간</th>
                <td>10개월</td>
            </tr>
        </table>

        <h2 class="section-title">□ 창업 아이템 개요(요약)</h2>

        <table>
            <tr>
                <th style="width:20%; background:#d0d0d0">명 칭</th>
                <td colspan="3" style="text-align:center">{basic["itemName"]}</td>
            </tr>
            <tr>
                <th style="background:#e8e8e8">아이템 개요</th>
                <td colspan="3" class="content-cell">
                    {basic["oneLiner"]}<br><br>
                    AI 음성 분석 기술을 활용하여 독거노인의 건강 상태를 24시간 모니터링하고, 이상 징후 발생 시 즉시 가족 및 돌봄센터에 알림을 전송하는 스마트 돌봄 서비스입니다.
                </td>
            </tr>
            <tr>
                <th style="background:#e8e8e8">문제 인식<br>(Problem)</th>
                <td colspan="3" class="content-cell">
                    • 독거노인 78%가 응급상황 발생 시 24시간 내 발견 안 됨<br>
                    • 골든타임 내 발견율 23% 불과, 사망률 3.2배 높음<br>
                    • 기존 방문돌봄/응급호출기/CCTV의 한계 존재
                </td>
            </tr>
            <tr>
                <th style="background:#e8e8e8">실현 가능성<br>(Solution)</th>
                <td colspan="3" class="content-cell">
                    • 음성 AI 기반 비침습적 24시간 건강 모니터링<br>
                    • MVP 완료 (정확도 85%), 30가구 파일럿 진행 중<br>
                    • 특허 출원 완료, 한국어 노인 음성 특화 모델 보유
                </td>
            </tr>
            <tr>
                <th style="background:#e8e8e8">성장전략<br>(Scale-up)</th>
                <td colspan="3" class="content-cell">
                    • TAM 3조원 / SAM 6,000억원 / SOM 120억원<br>
                    • B2G(지자체) 50% + B2C(구독) 40% + B2B(제휴) 10%<br>
                    • 3년 내 50개 지자체, 5만 가구 목표
                </td>
            </tr>
            <tr>
                <th style="background:#e8e8e8">팀 구성<br>(Team)</th>
                <td colspan="3" class="content-cell">
                    • CEO: 삼성전자 헬스케어 PM 5년, 서울대 의료정보학 석사<br>
                    • CTO: KAIST AI대학원, 네이버 AI랩 4년<br>
                    • CMO: 토스 Growth팀 3년 경력
                </td>
            </tr>
        </table>
    </div>

    <!-- 1. 문제 인식 -->
    <div class="page page-break">
        <h2 class="section-title">1. 문제 인식 (Problem)</h2>
        <p style="margin-bottom:5mm; color:#666; font-size:9pt;">* 창업 아이템의 필요성, 국내·외 시장 현황 및 아이템의 개발 배경</p>

        <table>
            <tr>
                <th style="width:20%; background:#e8e8e8">1-1. 시장 현황</th>
                <td class="content-cell" style="min-height:60mm;">
                    {text_to_html(sections["problem"]["market_status"])}
                </td>
            </tr>
        </table>

        <table>
            <tr>
                <th style="width:20%; background:#e8e8e8">1-2. 핵심 문제점</th>
                <td class="content-cell" style="min-height:80mm;">
                    {text_to_html(sections["problem"]["problem_definition"])}
                </td>
            </tr>
        </table>
    </div>

    <div class="page page-break">
        <h2 class="section-title">1. 문제 인식 (Problem) - 계속</h2>

        <table>
            <tr>
                <th style="width:20%; background:#e8e8e8">1-3. 개발 필요성</th>
                <td class="content-cell" style="min-height:120mm;">
                    {text_to_html(sections["problem"]["development_necessity"])}
                </td>
            </tr>
        </table>
    </div>

    <!-- 2. 실현 가능성 -->
    <div class="page page-break">
        <h2 class="section-title">2. 실현 가능성 (Solution)</h2>
        <p style="margin-bottom:5mm; color:#666; font-size:9pt;">* 아이디어를 제품·서비스로 구현하기 위한 개발 계획 및 역량</p>

        <table>
            <tr>
                <th style="width:20%; background:#e8e8e8">2-1. 솔루션 개요<br>및 개발 계획</th>
                <td class="content-cell" style="min-height:100mm;">
                    {text_to_html(sections["solution"]["development_plan"])}
                </td>
            </tr>
        </table>

        <table>
            <tr>
                <th style="width:20%; background:#e8e8e8">2-2. 차별화 포인트</th>
                <td class="content-cell" style="min-height:60mm;">
                    {text_to_html(sections["solution"]["differentiation"])}
                </td>
            </tr>
        </table>
    </div>

    <div class="page page-break">
        <h2 class="section-title">2. 실현 가능성 (Solution) - 계속</h2>

        <table>
            <tr>
                <th style="width:20%; background:#e8e8e8">2-3. 경쟁력 분석</th>
                <td class="content-cell" style="min-height:100mm;">
                    {text_to_html(sections["solution"]["competitiveness"])}
                </td>
            </tr>
        </table>
    </div>

    <!-- 3. 성장전략 -->
    <div class="page page-break">
        <h2 class="section-title">3. 성장전략 (Scale-up)</h2>
        <p style="margin-bottom:5mm; color:#666; font-size:9pt;">* 경쟁사 분석, 목표 시장 진입 전략 및 비즈니스 모델</p>

        <table>
            <tr>
                <th style="width:20%; background:#e8e8e8">3-1. 비즈니스 모델</th>
                <td class="content-cell" style="min-height:80mm;">
                    {text_to_html(sections["scaleup"]["business_model"])}
                </td>
            </tr>
        </table>

        <table>
            <tr>
                <th style="width:20%; background:#e8e8e8">3-2. 시장 규모<br>(TAM/SAM/SOM)</th>
                <td class="content-cell" style="min-height:60mm;">
                    {text_to_html(sections["scaleup"]["market_size"])}
                </td>
            </tr>
        </table>
    </div>

    <div class="page page-break">
        <h2 class="section-title">3. 성장전략 (Scale-up) - 계속</h2>

        <table>
            <tr>
                <th style="width:20%; background:#e8e8e8">3-3. 사업화 로드맵</th>
                <td class="content-cell" style="min-height:100mm;">
                    {text_to_html(sections["scaleup"]["roadmap"])}
                </td>
            </tr>
        </table>
    </div>

    <!-- 추진일정표 -->
    <div class="page page-break">
        <h2 class="section-title">■ 추진일정 계획</h2>

        <table class="data-table">
            <thead>
                <tr>
                    <th style="width:8%">구분</th>
                    <th style="width:30%">추진 내용</th>
                    <th style="width:22%">추진 기간</th>
                    <th style="width:40%">세부 내용</th>
                </tr>
            </thead>
            <tbody>
'''

    for item in data["schedule"]:
        html += f'''                <tr>
                    <td>{item["no"]}</td>
                    <td>{item["content"]}</td>
                    <td>{item["period"]}</td>
                    <td>{item["detail"]}</td>
                </tr>
'''

    html += '''            </tbody>
        </table>

        <h2 class="section-title">■ 정부지원사업비 산출 내역</h2>

        <table class="data-table">
            <thead>
                <tr>
                    <th style="width:15%">비목</th>
                    <th style="width:60%">산출 근거</th>
                    <th style="width:25%">정부지원사업비(원)</th>
                </tr>
            </thead>
            <tbody>
'''

    total = 0
    for item in data["budget"]:
        amount = int(item["amount"].replace(",", ""))
        total += amount
        html += f'''                <tr>
                    <td style="text-align:center">{item["category"]}</td>
                    <td>▪ {item["detail"]}</td>
                    <td class="amount">{item["amount"]}</td>
                </tr>
'''

    html += f'''                <tr style="background:#f0f0f0; font-weight:bold;">
                    <td colspan="2" style="text-align:center">합 계</td>
                    <td class="amount">{total:,}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- 4. 팀 구성 -->
    <div class="page page-break">
        <h2 class="section-title">4. 팀 구성 (Team)</h2>
        <p style="margin-bottom:5mm; color:#666; font-size:9pt;">* 대표자의 보유 역량, 팀 구성 계획 및 역할 분담</p>

        <table>
            <tr>
                <th style="width:20%; background:#e8e8e8">4-1. 대표자 소개</th>
                <td class="content-cell" style="min-height:60mm;">
                    {text_to_html(sections["team"]["founder"])}
                </td>
            </tr>
        </table>

        <table>
            <tr>
                <th style="width:20%; background:#e8e8e8">4-2. 핵심 팀원</th>
                <td class="content-cell" style="min-height:60mm;">
                    {text_to_html(sections["team"]["team_members"])}
                </td>
            </tr>
        </table>
    </div>

    <div class="page page-break">
        <h2 class="section-title">4. 팀 구성 (Team) - 계속</h2>

        <table>
            <tr>
                <th style="width:20%; background:#e8e8e8">4-3. 팀 시너지</th>
                <td class="content-cell" style="min-height:50mm;">
                    {text_to_html(sections["team"]["team_synergy"])}
                </td>
            </tr>
        </table>

        <h3 class="subsection-title">■ 팀 구성 현황</h3>

        <table class="data-table">
            <thead>
                <tr>
                    <th style="width:8%">구분</th>
                    <th style="width:15%">직위</th>
                    <th style="width:20%">담당 업무</th>
                    <th style="width:37%">보유 역량(경력 및 학력 등)</th>
                    <th style="width:20%">구성 상태</th>
                </tr>
            </thead>
            <tbody>
'''

    for member in data["teamTable"]:
        html += f'''                <tr>
                    <td>{member["no"]}</td>
                    <td>{member["position"]}</td>
                    <td>{member["role"]}</td>
                    <td style="text-align:left">{member["capability"]}</td>
                    <td>{member["status"]}</td>
                </tr>
'''

    html += '''            </tbody>
        </table>

        <h3 class="subsection-title">■ 협력 파트너</h3>

        <table class="data-table">
            <thead>
                <tr>
                    <th style="width:8%">구분</th>
                    <th style="width:20%">파트너명</th>
                    <th style="width:27%">보유 역량</th>
                    <th style="width:30%">협업 방안</th>
                    <th style="width:15%">협력 시기</th>
                </tr>
            </thead>
            <tbody>
'''

    for partner in data["partners"]:
        html += f'''                <tr>
                    <td>{partner["no"]}</td>
                    <td>{partner["name"]}</td>
                    <td>{partner["capability"]}</td>
                    <td style="text-align:left">{partner["plan"]}</td>
                    <td>{partner["period"]}</td>
                </tr>
'''

    html += '''            </tbody>
        </table>
    </div>

    <!-- 서약 -->
    <div class="page">
        <h2 class="section-title">서 약 서</h2>

        <div style="padding: 10mm; line-height: 2;">
            <p>본인은 2025년도 예비창업패키지 사업에 참여함에 있어 다음 사항을 준수할 것을 서약합니다.</p>
            <br>
            <p>1. 본 사업계획서의 내용이 사실과 다름없음을 확인합니다.</p>
            <p>2. 사업 수행 시 관련 법령 및 지침을 성실히 준수하겠습니다.</p>
            <p>3. 정부지원금을 사업 목적에 맞게 사용하겠습니다.</p>
            <p>4. 사업 결과물에 대한 보고 의무를 성실히 이행하겠습니다.</p>
        </div>

        <div class="signature">
            <p>2025년 3월 일</p>
            <br><br>
            <p>신청자: _________________ (인)</p>
        </div>
    </div>
</body>
</html>'''

    return html

def main():
    print("=" * 60)
    print("사업계획서 테스트 (정부 양식 그대로 재현)")
    print("=" * 60)
    print()
    print(f"아이템명: {SAMPLE_BUSINESS_PLAN['basicInfo']['itemName']}")
    print(f"양식: 2025년 예비창업패키지 공식 양식 적용")
    print()

    # HTML 생성
    html_content = generate_gov_form_html(SAMPLE_BUSINESS_PLAN)

    # HTML 파일 저장
    html_path = os.path.join(os.path.dirname(__file__), "..", "docs", "test_business_plan.html")
    html_path = os.path.abspath(html_path)

    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    print(f"HTML 생성 완료: {html_path}")

    # JSON 데이터도 저장
    json_path = os.path.join(os.path.dirname(__file__), "..", "docs", "test_business_plan_data.json")
    json_path = os.path.abspath(json_path)

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(SAMPLE_BUSINESS_PLAN, f, ensure_ascii=False, indent=2)
    print(f"JSON 생성 완료: {json_path}")

    print()
    print("=" * 60)
    print("완료! PDF 변환을 진행하려면 html_to_pdf.py를 실행하세요.")
    print("=" * 60)

if __name__ == "__main__":
    main()
