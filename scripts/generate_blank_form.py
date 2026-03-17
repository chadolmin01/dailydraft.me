# -*- coding: utf-8 -*-
"""
예비창업패키지 빈 양식 템플릿 생성
실제 정부 양식(.docx)을 그대로 재현
- 목차 테이블: 12pt
- 본문 테이블: 10pt
- 소제목: 13pt
- 본문(ㅇ): 14pt
- 제목: 16-19pt
- 여백: 상20mm 좌우20mm 하30mm (행정 표준)
"""

import os
import sys
import io

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def generate_blank_form_html():
    """실제 정부 양식 구조 그대로 재현"""

    html = '''<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>2025년도 예비창업패키지 사업계획서 양식</title>
    <style>
        @page {
            size: A4;
            margin: 0;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: "맑은 고딕", "Malgun Gothic", sans-serif;
            font-size: 10pt;
            line-height: 1.5;
            color: #000;
            background: #eee;
        }

        /* A4 페이지 - 행정 표준 규격 */
        .page {
            width: 210mm;
            height: 297mm;
            padding: 20mm 20mm 30mm 20mm; /* 상20 우20 하30 좌20 */
            background: white;
            margin: 0 auto 5mm auto;
            position: relative;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        .page-content {
            width: 100%;
            height: 100%;
        }

        /* 테이블 기본 */
        table {
            width: 100%;
            border-collapse: collapse;
        }

        th, td {
            border: 1px solid #000;
            padding: 2mm 2mm;
            vertical-align: middle;
            word-break: keep-all;
        }

        th {
            background: #d9d9d9;
            font-weight: bold;
            text-align: center;
        }

        /* 목차 테이블 - 12pt */
        .toc-table th, .toc-table td {
            font-size: 12pt;
        }

        /* 본문 테이블 - 10pt */
        .data-table th, .data-table td {
            font-size: 10pt;
            text-align: center;
        }

        .data-table td.left {
            text-align: left;
        }

        .data-table td.right {
            text-align: right;
        }

        /* 안내문 박스 */
        .notice-box {
            border: 1px solid #000;
            padding: 3mm;
            margin-bottom: 5mm;
            font-size: 10pt;
        }

        /* 섹션 제목 - 16pt */
        .section-title {
            font-size: 16pt;
            font-weight: bold;
            margin: 6mm 0 4mm 0;
        }

        /* 대섹션 제목 - 16pt */
        .section-title-large {
            font-size: 16pt;
            font-weight: bold;
            margin: 6mm 0 4mm 0;
        }

        /* ㅇ 문단 (본문 작성 영역) - 14pt */
        .content-para {
            font-size: 14pt;
            margin: 4mm 0;
            padding-left: 7mm;
            min-height: 30mm;
            line-height: 1.6;
        }

        .content-para::before {
            content: "ㅇ ";
            margin-left: -7mm;
        }

        /* 소제목 - 13pt */
        .sub-title {
            font-size: 13pt;
            font-weight: bold;
            margin: 5mm 0 3mm 0;
        }

        .sub-title.center {
            text-align: center;
        }

        .sub-title.right {
            text-align: right;
        }

        /* 헤더 셀 (진한 회색) */
        .header-dark {
            background: #bfbfbf;
        }

        /* 입력 셀 */
        .input-cell {
            background: #fff;
            text-align: left;
            vertical-align: top;
        }

        /* 높이 클래스 */
        .h8 { height: 8mm; }
        .h10 { height: 10mm; }
        .h12 { height: 12mm; }
        .h15 { height: 15mm; }
        .h18 { height: 18mm; }
        .h20 { height: 20mm; }
        .h25 { height: 25mm; }
        .h30 { height: 30mm; }
        .h35 { height: 35mm; }
        .h40 { height: 40mm; }

        /* 경고문 스타일 */
        .warning {
            font-size: 10pt;
            color: #333;
            margin: 3mm 0;
        }

        /* 이미지 영역 */
        .image-cell {
            text-align: center;
            vertical-align: middle;
            color: #666;
            font-size: 9pt;
        }

        @media print {
            body { background: white; }
            .page {
                margin: 0;
                box-shadow: none;
                page-break-after: always;
            }
            .page:last-child { page-break-after: auto; }
        }
    </style>
</head>
<body>

<!-- ========== 페이지 1: 목차 ========== -->
<div class="page">
    <div class="page-content">
        <!-- 안내문 -->
        <div class="notice-box">
            ※ 사업 신청 시, 사업계획서 작성 목차 페이지는 삭제하고 제출하시기 바랍니다.
        </div>

        <!-- 목차 테이블 1: 항목/세부항목 -->
        <table class="toc-table" style="margin-bottom: 6mm;">
            <colgroup>
                <col style="width: 35%">
                <col style="width: 65%">
            </colgroup>
            <tr>
                <th>항 목</th>
                <th>세부항목</th>
            </tr>
            <tr>
                <td class="h10">□ 일반현황</td>
                <td class="input-cell">- 창업아이템명, 산출물, 팀 구성 현황 등</td>
            </tr>
            <tr>
                <td class="h10">□ 개요(요약)</td>
                <td class="input-cell">- 창업아이템 소개, 문제인식, 실현가능성, 성장전략, 팀 구성 등</td>
            </tr>
        </table>

        <!-- 목차 테이블 2: PSST 평가항목 -->
        <table class="toc-table">
            <colgroup>
                <col style="width: 25%">
                <col style="width: 75%">
            </colgroup>
            <tr>
                <th class="header-dark h18">1. 문제 인식<br>(Problem)</th>
                <td class="input-cell" style="padding: 2mm 3mm;">
                    <strong>1. 창업 아이템의 필요성</strong><br>
                    창업 아이템의 국내·외 시장 현황 및 문제점<br>
                    문제 해결을 위한 창업 아이템의 개발 필요성 등
                </td>
            </tr>
            <tr>
                <th class="header-dark h20">2. 실현 가능성<br>(Solution)</th>
                <td class="input-cell" style="padding: 2mm 3mm;">
                    <strong>2. 창업 아이템의 개발 계획</strong><br>
                    아이디어를 제품·서비스로 개발 또는 구체화 계획<br>
                    창업 아이템의 차별성 및 경쟁력 확보 전략<br>
                    정부지원사업비 집행 계획
                </td>
            </tr>
            <tr>
                <th class="header-dark h25">3. 성장전략<br>(Scale-up)</th>
                <td class="input-cell" style="padding: 2mm 3mm;">
                    <strong>3. 사업화 추진 전략</strong><br>
                    경쟁사 분석, 목표 시장 진입 전략<br>
                    창업 아이템의 비즈니스 모델(수익화 모델)<br>
                    사업 확장을 위한 투자유치(자금확보) 전략<br>
                    사업 전체 로드맵(일정 등) 및 중장기 사회적 가치 도입계획
                </td>
            </tr>
            <tr>
                <th class="header-dark h18">4. 팀 구성<br>(Team)</th>
                <td class="input-cell" style="padding: 2mm 3mm;">
                    <strong>4. 대표자 및 팀원 구성 계획</strong><br>
                    대표자의 보유 역량(개발/구체화/성과 창출 등)<br>
                    팀원 보유 역량, 업무파트너 현황 및 활용 방안 등
                </td>
            </tr>
        </table>
    </div>
</div>

<!-- ========== 페이지 2: 일반현황 + 개요(요약) ========== -->
<div class="page">
    <div class="page-content">
        <div class="section-title">□ 일반현황</div>
        <div class="section-title-large" style="margin-top: 3mm;">□ 창업 아이템 개요(요약)</div>

        <!-- 개요 테이블 (4열 구조) -->
        <table class="toc-table">
            <colgroup>
                <col style="width: 15%">
                <col style="width: 35%">
                <col style="width: 15%">
                <col style="width: 35%">
            </colgroup>
            <tr>
                <th class="header-dark">명 칭</th>
                <td class="input-cell h10"></td>
                <th class="header-dark">범 주</th>
                <td class="input-cell h10"></td>
            </tr>
            <tr>
                <th>아이템 개요</th>
                <td class="input-cell h30" colspan="3"></td>
            </tr>
            <tr>
                <th>문제 인식<br>(Problem)</th>
                <td class="input-cell h30" colspan="3"></td>
            </tr>
            <tr>
                <th>실현 가능성<br>(Solution)</th>
                <td class="input-cell h30" colspan="3"></td>
            </tr>
            <tr>
                <th>성장전략<br>(Scale-up)</th>
                <td class="input-cell h30" colspan="3"></td>
            </tr>
            <tr>
                <th>팀 구성<br>(Team)</th>
                <td class="input-cell h30" colspan="3"></td>
            </tr>
            <tr>
                <th rowspan="2">이미지</th>
                <td class="image-cell h25"></td>
                <td class="image-cell h25"></td>
                <td class="image-cell h25"></td>
            </tr>
            <tr>
                <td class="image-cell h8" style="font-size:8pt;">< 사진(이미지) 또는 설계도 제목 ></td>
                <td class="image-cell h8" style="font-size:8pt;">< 사진(이미지) 또는 설계도 제목 ></td>
                <td class="image-cell h8" style="font-size:8pt;">< 사진(이미지) 또는 설계도 제목 ></td>
            </tr>
        </table>
    </div>
</div>

<!-- ========== 페이지 3: 1. 문제 인식 (Problem) ========== -->
<div class="page">
    <div class="page-content">
        <div class="section-title">1. 문제 인식 (Problem)</div>

        <div class="content-para" style="min-height: 55mm;"></div>
        <div class="content-para" style="min-height: 55mm;"></div>
        <div class="content-para" style="min-height: 55mm;"></div>
        <div class="content-para" style="min-height: 55mm;"></div>
    </div>
</div>

<!-- ========== 페이지 4: 2. 실현 가능성 (Solution) ========== -->
<div class="page">
    <div class="page-content">
        <div class="section-title">2. 실현 가능성 (Solution)</div>

        <div class="content-para" style="min-height: 45mm;"></div>
        <div class="content-para" style="min-height: 45mm;"></div>
        <div class="content-para" style="min-height: 35mm;"></div>

        <!-- 사업추진 일정(협약기간 내) - 가운데 정렬 -->
        <div class="sub-title center">< 사업추진 일정(협약기간 내) ></div>

        <table class="data-table">
            <colgroup>
                <col style="width: 8%">
                <col style="width: 31%">
                <col style="width: 24%">
                <col style="width: 37%">
            </colgroup>
            <tr>
                <th>구분</th>
                <th>추진 내용</th>
                <th>추진 기간</th>
                <th>세부 내용</th>
            </tr>
            <tr><td class="h8">1</td><td>필수 개발 인력 채용</td><td>00.00 ~ 00.00</td><td>OO 전공 경력 직원 00명 채용</td></tr>
            <tr><td class="h8">2</td><td>제품 패키지 디자인</td><td>00.00 ~ 00.00</td><td>제품 패키지 디자인 용역 진행</td></tr>
            <tr><td class="h8">3</td><td>홍보용 웹사이트 제작</td><td>00.00 ~ 00.00</td><td>웹사이트 자체 제작</td></tr>
            <tr><td class="h8">4</td><td>시제품 완성</td><td>협약기간 말</td><td>협약기간 내 시제품 제작 완료</td></tr>
            <tr><td class="h8">…</td><td></td><td></td><td></td></tr>
        </table>
    </div>
</div>

<!-- ========== 페이지 5: 정부지원사업비 집행계획 ========== -->
<div class="page">
    <div class="page-content">
        <!-- 1단계 정부지원사업비 - 가운데 정렬 -->
        <div class="sub-title center">< 1단계 정부지원사업비 집행계획 ></div>

        <table class="data-table" style="margin-bottom: 8mm;">
            <colgroup>
                <col style="width: 15%">
                <col style="width: 55%">
                <col style="width: 30%">
            </colgroup>
            <tr>
                <th>비 목</th>
                <th>산출 근거</th>
                <th>정부지원사업비(원)</th>
            </tr>
            <tr><td class="h8">재료비</td><td class="left">▪ DMD소켓 구입(00개×0000원)</td><td class="right">3,000,000</td></tr>
            <tr><td class="h8">재료비</td><td class="left">▪ 전원IC류 구입(00개×000원)</td><td class="right">7,000,000</td></tr>
            <tr><td class="h8">외주용역비</td><td class="left">▪ 시금형제작 외주용역(OOO제품 … 플라스틱금형제작)</td><td class="right">10,000,000</td></tr>
            <tr><td class="h8">지급수수료</td><td class="left">▪ 국내 OO전시회 참가비(부스 임차 등 포함)</td><td class="right">1,000,000</td></tr>
            <tr><td class="h8">…</td><td class="left"></td><td class="right"></td></tr>
            <tr style="font-weight:bold;"><td colspan="2">합 계</td><td class="right">...</td></tr>
        </table>

        <!-- 2단계 정부지원사업비 - 가운데 정렬 -->
        <div class="sub-title center">< 2단계 정부지원사업비 집행계획 ></div>

        <table class="data-table" style="margin-bottom: 8mm;">
            <colgroup>
                <col style="width: 15%">
                <col style="width: 55%">
                <col style="width: 30%">
            </colgroup>
            <tr>
                <th>비 목</th>
                <th>산출 근거</th>
                <th>정부지원사업비(원)</th>
            </tr>
            <tr><td class="h8">재료비</td><td class="left">▪ DMD소켓 구입(00개×0000원)</td><td class="right">3,000,000</td></tr>
            <tr><td class="h8">재료비</td><td class="left">▪ 전원IC류 구입(00개×000원)</td><td class="right">7,000,000</td></tr>
            <tr><td class="h8">외주용역비</td><td class="left">▪ 시금형제작 외주용역(OOO제품 … 플라스틱금형제작)</td><td class="right">10,000,000</td></tr>
            <tr><td class="h8">지급수수료</td><td class="left">▪ 국내 OO전시회 참가비(부스 임차 등 포함)</td><td class="right">1,000,000</td></tr>
            <tr><td class="h8">…</td><td class="left"></td><td class="right"></td></tr>
            <tr style="font-weight:bold;"><td colspan="2">합 계</td><td class="right">...</td></tr>
        </table>

        <div class="content-para" style="min-height: 25mm;"></div>
        <div class="content-para" style="min-height: 25mm;"></div>
    </div>
</div>

<!-- ========== 페이지 6: 3. 성장전략 (Scale-up) ========== -->
<div class="page">
    <div class="page-content">
        <div class="section-title">3. 성장전략 (Scale-up)</div>

        <div class="content-para" style="min-height: 55mm;"></div>
        <div class="content-para" style="min-height: 55mm;"></div>

        <!-- 사업추진 일정(전체 사업단계) - 가운데 정렬 -->
        <div class="sub-title center">< 사업추진 일정(전체 사업단계) ></div>

        <table class="data-table">
            <colgroup>
                <col style="width: 8%">
                <col style="width: 31%">
                <col style="width: 24%">
                <col style="width: 37%">
            </colgroup>
            <tr>
                <th>구분</th>
                <th>추진 내용</th>
                <th>추진 기간</th>
                <th>세부 내용</th>
            </tr>
            <tr><td class="h8">1</td><td>시제품 설계</td><td>00년 상반기</td><td>시제품 설계 및 프로토타입 제작</td></tr>
            <tr><td class="h8">2</td><td>시제품 제작</td><td>00.00 ~ 00.00</td><td>외주 용역을 통한 시제품 제작</td></tr>
            <tr><td class="h8">3</td><td>정식 출시</td><td>00년 하반기</td><td>신제품 출시</td></tr>
            <tr><td class="h8">4</td><td>신제품 홍보 프로모션 진행</td><td>00.00 ~ 00.00</td><td>OO, OO 프로모션 진행</td></tr>
            <tr><td class="h8">…</td><td></td><td></td><td></td></tr>
        </table>
    </div>
</div>

<!-- ========== 페이지 7: 4. 팀 구성 (Team) ========== -->
<div class="page">
    <div class="page-content">
        <div class="section-title">4. 팀 구성 (Team)</div>

        <p class="warning">※ 성명, 성별, 생년월일, 출신학교, 소재지 등의 개인정보(유추가능한 정보)는 삭제 또는 마스킹<br>
        [학력] (전문)학·석·박사, 학과·전공 등, [경력] 사업 관련 직장 근무경력(직급 제외, 기간), 근무 부서명, 업무 등</p>

        <div class="content-para" style="min-height: 50mm;"></div>

        <!-- 팀 구성(안) - 가운데 정렬 -->
        <div class="sub-title center">< 팀 구성(안) ></div>

        <table class="data-table" style="margin-bottom: 6mm;">
            <colgroup>
                <col style="width: 8%">
                <col style="width: 12%">
                <col style="width: 18%">
                <col style="width: 42%">
                <col style="width: 20%">
            </colgroup>
            <tr>
                <th>구분</th>
                <th>직위</th>
                <th>담당 업무</th>
                <th>보유 역량(경력 및 학력 등)</th>
                <th>구성 상태</th>
            </tr>
            <tr><td class="h8">1</td><td>공동대표</td><td>S/W 개발 총괄</td><td class="left">OO학 박사, OO학과 교수 재직(00년)</td><td>완료('00.00)</td></tr>
            <tr><td class="h8">2</td><td>대리</td><td>홍보 및 마케팅</td><td class="left">OO학 학사, OO 관련 경력(00년 이상)</td><td>예정('00.00)</td></tr>
            <tr><td class="h8">…</td><td></td><td></td><td></td><td></td></tr>
        </table>

        <!-- 협력 기관 현황 - 가운데 정렬 -->
        <div class="sub-title center">< 협력 기관 현황 및 협업 방안 ></div>

        <table class="data-table">
            <colgroup>
                <col style="width: 8%">
                <col style="width: 17%">
                <col style="width: 25%">
                <col style="width: 35%">
                <col style="width: 15%">
            </colgroup>
            <tr>
                <th>구분</th>
                <th>파트너명</th>
                <th>보유 역량</th>
                <th>협업 방안</th>
                <th>협력 시기</th>
            </tr>
            <tr><td class="h8">1</td><td>○○전자</td><td>시제품 관련 H/W 제작·개발</td><td class="left">테스트 장비 지원</td><td>00.00</td></tr>
            <tr><td class="h8">2</td><td>○○기업</td><td>S/W 제작·개발</td><td class="left">웹사이트 제작 용역</td><td>00.00</td></tr>
            <tr><td class="h8">...</td><td></td><td></td><td></td><td></td></tr>
        </table>
    </div>
</div>

</body>
</html>'''

    return html


def main():
    print("=" * 60)
    print("예비창업패키지 빈 양식 템플릿 생성")
    print("=" * 60)
    print()
    print("실제 정부 양식(.docx) 구조 그대로 재현")
    print("- 목차 테이블: 12pt")
    print("- 본문 테이블: 10pt")
    print("- 소제목: 13pt (정렬: 가운데/오른쪽)")
    print("- 본문(ㅇ): 14pt")
    print("- 제목: 16-19pt")
    print()

    html_content = generate_blank_form_html()

    html_path = os.path.join(os.path.dirname(__file__), "..", "docs", "blank_form_yebi.html")
    html_path = os.path.abspath(html_path)

    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    print(f"HTML 생성 완료: {html_path}")

    print()
    print("=" * 60)


if __name__ == "__main__":
    main()
