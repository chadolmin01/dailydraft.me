# -*- coding: utf-8 -*-
"""
Draft 3분 엘리베이터 피칭 PDF (v2 — 6섹션 구조).

청중: 대학 창업교육센터 동기 예비창업자 (피어 + 잠재 고객)

구조:
  §1 오프닝 (15초)         — 피어 직접 질문 훅
  §2 문제 (30초)          — 2만 개 × 한 학기 0
  §3 솔루션 (45초)         — 인지 시스템 + 3대 기능
  §4 경쟁력/비전 — 숫자 (50초) — 현재 숫자 + 하반기 비전 숫자
  §5 Why Us (30초)        — FLIP 회장 1인칭 권위
  §6 클로징/요청 (20초)    — 3단계 escalating CTA

폰트: Malgun Gothic
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak,
    Table, TableStyle,
)

# ---------- 폰트 ----------
pdfmetrics.registerFont(TTFont("Malgun", "C:/Windows/Fonts/malgun.ttf"))
pdfmetrics.registerFont(TTFont("MalgunBold", "C:/Windows/Fonts/malgunbd.ttf"))

# ---------- 색상 ----------
COLOR_INK = HexColor("#191F28")
COLOR_SUB = HexColor("#4E5968")
COLOR_MUTED = HexColor("#8B95A1")
COLOR_BLUE = HexColor("#3182F6")
COLOR_BG_NOTE = HexColor("#F5F7FA")
COLOR_BG_PITCH = HexColor("#FFF7E6")
COLOR_BORDER = HexColor("#E5E8EB")

# ---------- 스타일 ----------
styles = getSampleStyleSheet()

style_title = ParagraphStyle(
    "title", parent=styles["Title"],
    fontName="MalgunBold", fontSize=26, leading=34,
    textColor=COLOR_INK, alignment=TA_LEFT, spaceAfter=4,
)
style_subtitle = ParagraphStyle(
    "subtitle", parent=styles["Normal"],
    fontName="Malgun", fontSize=11, leading=16,
    textColor=COLOR_MUTED, alignment=TA_LEFT, spaceAfter=24,
)
style_h1 = ParagraphStyle(
    "h1", parent=styles["Heading1"],
    fontName="MalgunBold", fontSize=15, leading=22,
    textColor=COLOR_INK, spaceBefore=18, spaceAfter=6,
)
style_h2_blue = ParagraphStyle(
    "h2_blue", parent=styles["Heading2"],
    fontName="MalgunBold", fontSize=11, leading=16,
    textColor=COLOR_BLUE, spaceBefore=8, spaceAfter=4,
)
style_pitch = ParagraphStyle(
    "pitch", parent=styles["Normal"],
    fontName="Malgun", fontSize=11, leading=19,
    textColor=COLOR_INK, alignment=TA_LEFT,
    leftIndent=4, rightIndent=4, spaceAfter=4,
)
style_note_label = ParagraphStyle(
    "note_label", parent=styles["Normal"],
    fontName="MalgunBold", fontSize=9, leading=13,
    textColor=COLOR_BLUE, spaceAfter=2,
)
style_note_body = ParagraphStyle(
    "note_body", parent=styles["Normal"],
    fontName="Malgun", fontSize=9.5, leading=15,
    textColor=COLOR_SUB, alignment=TA_LEFT, spaceAfter=2,
)
style_caption = ParagraphStyle(
    "caption", parent=styles["Normal"],
    fontName="Malgun", fontSize=9, leading=13,
    textColor=COLOR_MUTED, alignment=TA_LEFT, spaceAfter=12,
)


def pitch_box(text: str):
    p = Paragraph(text, style_pitch)
    t = Table([[p]], colWidths=[170 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), COLOR_BG_PITCH),
        ("BOX", (0, 0), (-1, -1), 0.5, HexColor("#FCD9A0")),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))
    return t


def annotation_box(items):
    rows = []
    for label, body in items:
        rows.append([
            Paragraph(label, style_note_label),
            Paragraph(body, style_note_body),
        ])
    t = Table(rows, colWidths=[40 * mm, 130 * mm])
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, -1), COLOR_BG_NOTE),
        ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]
    for i in range(1, len(rows)):
        style_cmds.append(("LINEABOVE", (0, i), (-1, i), 0.3, COLOR_BORDER))
    t.setStyle(TableStyle(style_cmds))
    return t


def section_block(num: str, title_ko: str, duration: str,
                  intent: str, pitch: str, notes: list):
    parts = []
    parts.append(Paragraph(
        f"{num} &nbsp;&nbsp; {title_ko} &nbsp;&nbsp; "
        f"<font size=9 color='#8B95A1'>· {duration}</font>",
        style_h1,
    ))
    parts.append(Paragraph(f"<b>이 섹션의 목적:</b> {intent}", style_caption))
    parts.append(Paragraph("발화 본문", style_h2_blue))
    parts.append(pitch_box(pitch))
    parts.append(Spacer(1, 8))
    parts.append(Paragraph("왜 이렇게 구성했는지", style_h2_blue))
    parts.append(annotation_box(notes))
    parts.append(Spacer(1, 14))
    return parts


# ============================================================
# §1 오프닝 — 피어 직접 질문 훅
# ============================================================

S1_PITCH = (
    "여러분, <b>동아리든 프로젝트팀이든 운영해보신 분 손 한번 들어보십시오.</b>"
    "<br/><br/>"
    "그 카톡방, 노션 페이지, 회의록 — <b>다음 운영자에게 어떻게 넘기실 건가요?</b>"
)

S1_NOTES = [
    ("&quot;동아리든 프로젝트팀이든&quot;",
     "이전 버전 &quot;동아리 운영해보셨거나&quot;는 청중을 동아리 경험자로 좁혔습니다. "
     "<b>&quot;프로젝트팀&quot;을 더해 청중 진입을 넓혔습니다</b> — 동아리 안 한 예비창업자도 "
     "팀 프로젝트는 거의 다 해봤기 때문에, &quot;이건 내 얘기&quot;로 듣게 됩니다. "
     "동아리 집중은 §3 이후에 자연스럽게 등장하므로 입구만 넓히는 전략."),
    ("청중 직접 질문으로 시작",
     "&quot;안녕하세요 저희는...&quot;으로 시작하면 청중이 듣는 자세가 됩니다. "
     "직접 질문은 청중을 <b>참여하는 자세</b>로 바꿉니다. 손드는 행위가 페인을 자기 사건으로 굳힙니다."),
    ("3가지 도구 호명 (카톡방·노션·회의록)",
     "&quot;운영 자산&quot; 같은 추상어를 피하고 <b>청중이 어제 만진 실제 도구</b>를 호명했습니다. "
     "노션과 회의록은 §5(Why Us)의 도메인 인사이트와 호응 — 그때 다시 등장해서 &quot;아 처음에 그 얘기였구나&quot;가 됩니다. "
     "이 3개 도구는 동아리/프로젝트팀 모두 공통으로 쓰므로 §1 확장과 충돌하지 않습니다."),
    ("&quot;다음 운영자에게 어떻게&quot;",
     "이게 <b>훅의 정점</b>입니다. 이전 버전 &quot;다음 회장&quot;은 동아리 한정이었지만, "
     "<b>&quot;다음 운영자&quot;는 회장·팀장·PM 모두 포함</b>합니다. 청중이 자기 역할로 자동 번역해 듣게 됩니다. "
     "답을 강요하지 않고 침묵을 1~2초 두는 게 핵심입니다."),
]


# ============================================================
# §2 문제
# ============================================================

S2_PITCH = (
    "전국 4년제 대학 200곳, 학교당 평균 100개 동아리만 잡아도 <b>2만 개</b>입니다. "
    "매년 3월 회장이 바뀌면 카톡방 비밀번호, 노션 권한, 운영 매뉴얼 위치가 <b>흩어집니다.</b>"
    "<br/><br/>"
    "노션 페이지는 남아 있어도, <b>어디서부터 봐야 할지를 아는 사람은 함께 졸업합니다.</b>"
)

S2_NOTES = [
    ("&quot;200곳 × 100개 = 2만 개&quot;",
     "도출 식을 그대로 노출 — <b>검증 가능한 수치</b>로 만들기 위함. 교육부 통계 기준 4년제 200곳, "
     "학교당 100개는 보수적 추정(서울대·연세대급은 200~300개). 청중이 머릿속에서 검산할 수 있어야 신뢰가 생깁니다."),
    ("&quot;매년 3월&quot;",
     "&quot;매년&quot; 단독은 추상이지만 &quot;매년 3월&quot;은 <b>실제 장면</b>을 떠올리게 합니다. "
     "한국 대학 학기 구조상 회장 교체는 거의 3월이라 검증도 됩니다."),
    ("3개 자산 나열",
     "&quot;운영 노하우&quot; 같은 추상어 대신 <b>잃어버리는 구체적 자산 3개</b>를 호명. "
     "청중이 자기 동아리의 비밀번호·권한·매뉴얼이 어디 있는지 자동으로 떠올리게 됩니다."),
    ("&quot;사라집니다&quot; → &quot;흩어집니다&quot;",
     "이전 표현 &quot;사라집니다&quot;는 과장이었습니다. 노션·드라이브에 기록은 남아 있으니까요. "
     "&quot;흩어집니다&quot;가 <b>실제 일어나는 일</b>에 더 가깝습니다 — 데이터는 여러 곳에 남아 있지만 "
     "통합되지 않은 상태. 청중이 거짓말로 느끼지 않으면서도 페인은 그대로 전달됩니다."),
    ("&quot;아는 사람은 함께 졸업합니다&quot;",
     "이전 버전 &quot;한 학기 단위로 0이 되는 구조&quot; + &quot;한 번도 자산화된 적이 없다&quot;는 <b>두 줄 모두 과장</b>이었습니다. "
     "(1년 1번 교체, 노션은 남아 있음.) 진짜 페인은 <b>암묵지의 손실</b>입니다 — &quot;어디 뭐가 있는지&quot;를 "
     "아는 사람이 졸업해버리는 것. 이 한 줄이 절대적 주장 없이 페인의 실체를 정확히 짚습니다. "
     "&quot;첫 사회 경험&quot; 같은 그랜드 클리셰도 같이 제거 — 산문 무게를 줄이고 사실에 집중."),
]


# ============================================================
# §3 솔루션
# ============================================================

S3_PITCH = (
    "Draft는 한 줄로 <b>&quot;동아리의 인지 시스템&quot;</b>입니다."
    "<br/><br/>"
    "디스코드와 카톡은 <b>감각기관</b>으로 두고, Draft는 그 위에서 <b>구조화된 기억</b> 역할을 합니다. "
    "학생은 기존 도구를 그대로 쓰고, 운영진만 Draft 한 곳을 봅니다."
    "<br/><br/>"
    "핵심 기능 세 가지입니다."
    "<br/><br/>"
    "<b>첫째, 자동 주간 업데이트 Ghostwriter</b> — 디스코드 대화·깃허브·파일을 AI가 읽고 주간 보고 초안을 작성합니다. "
    "운영진의 주간 보고 작업 1시간이 검수 5분으로 줄어듭니다."
    "<br/><br/>"
    "<b>둘째, Task Flow DAG</b> — 행사 업무를 카드로 추적하되, 의존성과 카드 초안을 AI가 디스코드 대화에서 추출합니다. "
    "학생이 직접 입력할 항목은 0개입니다."
    "<br/><br/>"
    "<b>셋째, 권한 동기화</b> — 회장·임원진·회원 위계를 한 번 정의하면, "
    "디스코드 채널 30개·노션 페이지 10개가 1클릭으로 동기화됩니다."
)

S3_NOTES = [
    ("&quot;동아리의 인지 시스템&quot;",
     "Draft의 <b>마스터 메타포</b>. &quot;협업툴&quot; 카테고리에서 빠져나와 별도 카테고리를 만드는 게 목표 — "
     "Notion이 &quot;all-in-one workspace&quot;로 카테고리를 만든 동선과 같음."),
    ("감각기관 vs 기억",
     "디스코드/카톡과의 관계를 <b>경쟁이 아니라 보완</b>으로 못 박는 부분. "
     "&quot;Slack/Discord 죽이고 Draft로 통일&quot;이라는 비현실적 그림을 피하고, "
     "운영진 채택 결정 시 학생 저항이 0이라는 점을 강조."),
    ("&quot;학생 vs 운영진&quot; 구도",
     "Draft의 <b>제품 구조 자체</b>입니다. 두 청중을 명시적으로 나눠 각자 다른 가치를 받게 함. "
     "이게 §4의 &quot;학생 부하 0&quot; 경쟁력의 근거입니다."),
    ("기능 3개 — 룰 오브 쓰리",
     "정확히 <b>3개</b>가 청중이 기억하는 한계. 4개는 사라지고 2개는 빈약해 보입니다. "
     "각각 다른 페인을 다루도록 골랐습니다 — 리포팅 / 프로젝트 가시성 / 세팅 부담."),
    ("Ghostwriter를 1번에",
     "셋 중 가장 <b>마법 같아 보이는</b> 기능을 먼저. 권한 관리는 가장 실용적이지만 첫인상이 평범하므로 마지막에."),
    ("3가지 모두 단위 붙은 숫자",
     "<b>1시간→5분 / 0개 / 30개·10개·1클릭</b> — 세 기능 모두 비교 가능한 숫자로 끝냈습니다. "
     "&quot;편리하다&quot; &quot;자동화된다&quot; 같은 형용사 0개. §4에서 이 숫자들이 다시 등장합니다."),
]


# ============================================================
# §4 경쟁력/비전 — 숫자
# ============================================================

S4_PITCH = (
    "<b>지금까지 진행된 사실입니다.</b>"
    "<br/><br/>"
    "<b>FLIP 1팀이 Draft 첫 파일럿으로 매주 실사용 중</b>이고, "
    "<b>경희대 창업교육센터에 제안서를 제출해 도입 검토 단계</b>입니다."
    "<br/><br/>"
    "<b>하반기 목표는 동아리 100개, 파트너 기관 3곳.</b> "
    "100개의 회의록과 인수인계 문서가 검색 가능한 자산이 되고, "
    "기관 3곳에 묶이면 창업지원단이 처음 보는 <b>종단 대시보드</b>가 만들어집니다."
    "<br/><br/>"
    "<b>동아리에서 시작하지만, 같은 인지 시스템을 학생 프로젝트팀·연구실·창업팀까지 넓힙니다.</b>"
)

S4_NOTES = [
    ("&quot;경쟁력&quot; → &quot;현재 진행&quot;으로 재구성",
     "이전 버전은 &quot;학생 부하 0 / 1시간→5분 / 1클릭 40개&quot; 같은 <b>검증 안 된 추정 수치</b>를 "
     "&quot;현재 경쟁력&quot;이라 부르며 §2의 &quot;한 번도 자산화&quot; 과장과 같은 종류의 거짓을 만들었습니다. "
     "이번 버전은 <b>실제 일어난 사실만</b>으로 채웠습니다 — 파일럿 1건, 컨택 1건. "
     "작지만 진짜인 신호가 추정 수치보다 강합니다."),
    ("&quot;매주 실사용 중&quot; 동사",
     "&quot;파일럿 진행 중&quot;은 모호하지만 <b>&quot;매주 실사용&quot;</b>은 검증 가능한 빈도. "
     "청중이 &quot;실제 돌아가긴 하는구나&quot;를 즉시 판단할 수 있는 표현입니다."),
    ("&quot;경희대 창업교육센터&quot; 명시",
     "이전 버전 &quot;파트너십 협의&quot;는 모호했고 &quot;3곳 컨택&quot; 같은 부풀린 표현은 거짓이 됩니다. "
     "<b>실제 컨택 1곳만 실명으로</b> 박는 게 가장 강합니다. 메모리(<i>partnership_khu_2026-04-22.md</i>)의 "
     "별첨 PDF 제출 사실을 그대로 인용. 청중이 동기 예비창업자라면 본인 학교 창교에 익숙하므로 "
     "&quot;진짜 그쪽 라인까지 닿았네&quot;로 받습니다."),
    ("&quot;제출해 도입 검토 단계&quot; 정직 동사",
     "<b>&quot;도입 추진 중&quot;은 과장</b>, &quot;도입 협의&quot;도 약간 부풀림. "
     "&quot;제출해 검토 단계&quot;는 정확한 현재 위치 — 공이 우리 손이 아니라 상대 손에 있다는 사실까지 정직하게 "
     "전달합니다. §2 &quot;흩어집니다&quot;와 같은 정직 원칙."),
    ("&quot;100개·3곳&quot; 하반기 목표",
     "비전을 <b>5년 후 같은 추상 미래가 아니라 하반기</b>로 잡은 이유: 청중이 검증할 수 있어야 합니다. "
     "&quot;5년 후 한국 1위&quot;는 누구도 책임지지 않는 숫자, &quot;하반기 100개&quot;는 12월에 검증 가능한 약속입니다."),
    ("&quot;처음 보는 종단 대시보드&quot;",
     "100개 동아리 + 3개 기관이 단순한 매출 목표가 아니라 <b>새로운 데이터 카테고리</b>를 만든다는 비전 한 줄. "
     "한국 동아리 시장에 종단 데이터가 존재한 적이 없다는 사실 기반."),
    ("&quot;프로젝트팀·연구실·창업팀까지&quot; 확장 신호",
     "이 한 줄이 <b>천장 신호</b>. 동아리만 듣고 청중이 &quot;매출 천장이 작은 회사&quot;로 카테고리화하는 걸 막습니다. "
     "§1의 &quot;동아리든 프로젝트팀이든&quot; 입구와 호응 — 처음과 끝에서 같은 확장 신호를 2번 새깁니다."),
    ("이전 잔디·팀즈·노션 비교 한 문장 삭제",
     "이전 버전의 &quot;정착하지 못한 단 하나의 이유 — 학생이 새 도구 학습 — 을 0으로 만들었다&quot; 한 문장은 "
     "<b>§3에서 이미 함의된 메시지</b>(&quot;학생은 기존 도구를 그대로&quot;)와 중복이라 컷. "
     "30~35초 분량으로 압축하기 위한 결정이며, 메시지는 §3에 살아있습니다."),
]


# ============================================================
# §5 Why Us
# ============================================================

S5_PITCH = (
    "<b>제가 FLIP 회장입니다.</b>"
    "<br/><br/>"
    "1년 직접 운영하면서 알았습니다 — <b>노션은 첫 2주만 채워지고, 회의록은 3월에 30페이지, 11월엔 0페이지가 됩니다.</b> "
    "모두가 기록의 가치를 알지만 <b>부담을 못 이깁니다.</b>"
    "<br/><br/>"
    "Draft는 그 부담을 AI에게 옮기려고 만들었습니다."
)

S5_NOTES = [
    ("&quot;제가 FLIP 회장입니다&quot; 한 문장",
     "Why Us의 <b>핵심은 한 문장</b>. 자격증·수상·이전 회사 같은 신용 신호 대신 <b>1인칭 도메인 권위</b>로 시작. "
     "&quot;운영자 본인이 만들었다&quot;는 사실이 피어 청중에게는 가장 강한 신호입니다 — "
     "&quot;저 사람은 진짜 페인을 알겠구나&quot;가 됩니다."),
    ("&quot;노션 첫 2주, 회의록 3월 30페이지·11월 0페이지&quot;",
     "이 메타포가 §5의 <b>심장</b>입니다. 추상어 0개, 숫자만 4개. 청중이 자기 노션을 떠올리며 &quot;정확히 그렇다&quot;고 끄덕이게 됩니다. "
     "이 표현은 사용자가 직접 준 인사이트를 차용 — 만든 사람만 쓸 수 있는 1인칭 디테일이 권위의 정체입니다."),
    ("&quot;가치를 알지만 부담을 못 이깁니다&quot;",
     "이게 <b>제품 철학</b> 한 줄. &quot;사람이 게으르다&quot;가 아니라 &quot;시스템이 부담을 강요한다&quot;로 프레임. "
     "그래서 §3의 &quot;AI에게 옮긴다&quot; 솔루션이 자연스럽게 정당화됩니다."),
    ("&quot;첫 베타 사용자도 FLIP&quot; 라인 §4로 이동",
     "이전 버전의 마지막 줄(&quot;첫 베타 사용자도 FLIP 본인입니다&quot;)은 <b>§4의 &quot;FLIP 1팀 매주 실사용 중&quot;과 중복</b>이라 삭제. "
     "§4에서 트랙션 사실로 명확히 다룬 뒤, §5는 <b>&quot;왜 내가 만들고 있는가&quot;</b>(도메인 인사이트)에만 집중하는 게 깔끔합니다. "
     "두 섹션이 각자 다른 역할을 하게 됨."),
    ("Why Us를 §4 다음에",
     "§4의 &quot;파일럿 + 비전&quot;을 들은 뒤 <b>&quot;그래서 누가 할 건데?&quot;</b>가 자연스러운 다음 질문입니다. "
     "그 질문에 정확한 타이밍에 답하는 위치 선정."),
]


# ============================================================
# §6 클로징/요청
# ============================================================

S6_PITCH = (
    "세 가지 부탁드립니다."
    "<br/><br/>"
    "<b>본인이 동아리 운영 중이시면 베타 5팀에 합류해주십시오.</b> "
    "<b>운영 중인 동아리 회장을 아시면 소개해주십시오.</b> "
    "<b>그게 어렵다면 15분 피드백만 받아도 됩니다.</b>"
    "<br/><br/>"
    "감사합니다."
)

S6_NOTES = [
    ("&quot;세 가지 부탁&quot; 인트로",
     "&quot;관심 있으면 연락 주세요&quot; 같은 모호한 CTA는 작동하지 않습니다. <b>요청의 개수를 미리 알리면</b> "
     "청중이 메모할 준비를 합니다. 세 가지 정도가 기억 한계."),
    ("escalating ease 3단계",
     "<b>높은 commitment(베타) → 중간(소개) → 낮은(15분 피드백)</b> 순서. "
     "베타 합류는 동아리 운영 중인 사람만 가능하지만, 피드백은 누구나 가능. "
     "청중 누구도 &quot;나한테 해당 안 되는 얘기였네&quot;로 빠져나가지 못하게 설계."),
    ("&quot;베타 5팀&quot; 한정 수치",
     "&quot;베타 합류&quot;만 쓰면 추상이지만 <b>5팀</b>이라는 한정 수치는 희소성을 만듭니다. "
     "현재 FLIP 1팀 진행 중이라 5팀은 현실적이고, 청중이 즉시 &quot;그럼 내가 2번?&quot;을 떠올립니다."),
    ("&quot;15분 피드백&quot;",
     "<b>거절할 명분이 없는 길이</b>. 미팅(부담) / 커피(비프로페셔널) 사이의 정확한 점. "
     "피드백을 부탁하면 청중은 본인의 의견이 가치 있다고 느끼고 동의 확률이 올라갑니다 — "
     "데모를 듣는 것보다 데모를 평가하는 게 심리적으로 더 매력적이기 때문."),
    ("&quot;감사합니다&quot;로 끊기",
     "마지막 문장은 <b>짧을수록 좋습니다.</b> 박수가 자연스럽게 나오고, 발표자도 다음 호흡으로 넘어갈 수 있습니다."),
]


# ============================================================
# 부록
# ============================================================

ADDITIONAL_NOTES = [
    ("청중 1순위 = 예비창업자 피어",
     "이 버전은 <b>대학 창업교육센터 동기 예비창업자</b> 청중에 맞췄습니다. VC용 156억/4225억 같은 정부 예산 숫자, "
     "B2B2C 수익 구조 설명 등 <b>거시 시장 신호는 의도적으로 제거</b>했습니다. 대신 §1 직접 질문, §5 1인칭 권위, "
     "§6 escalating CTA로 <b>피어 동의·소개·피드백</b>을 설계했습니다."),
    ("총 길이",
     "약 <b>1,265자</b> 한국어 발화 기준 <b>2분 50초 ~ 3분 5초</b> (분당 350~380자 페이스). "
     "§4 압축 + §5 마지막 줄 §4로 이동하면서 약 270자 줄어들었습니다 — 3분 엄수에 더 안전한 버전입니다. "
     "여유 시간이 생기면 §3 기능 설명을 0.5초씩 더 천천히 말씀하시거나, §1 직후 청중 반응에 잠깐 호응(끄덕임 등)을 주실 수 있습니다."),
    ("§1 ↔ §4 확장 신호 북엔드",
     "<b>§1 입구</b>(&quot;동아리든 프로젝트팀이든&quot;)와 <b>§4 마무리</b>(&quot;프로젝트팀·연구실·창업팀까지 넓힙니다&quot;) — "
     "처음과 끝에 같은 확장 신호를 두어, <b>동아리는 천장이 아니라 시작점</b>이라는 메시지를 두 번 새깁니다. "
     "동아리 집중의 강점(1인칭 권위·검증된 페인)은 그대로 두면서, 청중이 &quot;매출 천장이 작은 회사&quot;로 "
     "카테고리화하는 리스크만 차단하는 구조입니다."),
    ("&quot;0&quot; 반복 — 정직 우선",
     "§3(입력 항목 0) → §5(11월 회의록 0페이지). 두 번 등장. "
     "이전 버전들에서 시도했던 &quot;0의 인지 고리&quot;는 정직성을 위해 점점 줄였습니다 — "
     "§2의 &quot;자산 0&quot;(과장)과 §4의 &quot;학생 부하 0·새 도구 학습 0&quot;(검증 안 된 추정)을 "
     "모두 제거. <b>거짓말 없는 2번이 거짓 섞인 5번보다 강합니다.</b>"),
    ("3개 메아리 구조 — 3월/카톡방·노션·회의록",
     "<b>§1에서 던진 3개 자산(카톡방·노션·회의록)이 §2·§5에서 다시 등장</b>합니다. "
     "§5에서 노션·회의록이 다시 호명될 때 청중은 &quot;처음에 그 얘기였구나&quot;로 처음과 끝이 닫힙니다. "
     "북엔드 + 메아리의 결합 구조."),
    ("발화 시 1초 침묵 포인트 5곳",
     "<b>§1 &quot;다음 운영자에게 어떻게 넘기실 건가요?&quot;</b> (질문 후 청중 반응 기다리기) / "
     "<b>§2 &quot;아는 사람은 함께 졸업합니다&quot;</b> / "
     "<b>§3 &quot;1시간이 검수 5분&quot;</b> / "
     "<b>§4 &quot;경희대 창업교육센터 ... 도입 검토 단계&quot; 후</b> (트랙션 사실은 흡수 시간 필요) / "
     "<b>§5 &quot;11월엔 0페이지&quot;</b> / "
     "<b>§6 &quot;감사합니다&quot; 직전</b>. 침묵을 두면 청중이 그 문장을 흡수할 시간이 생깁니다."),
    ("톤",
     "전체 <b>합쇼체</b>로 통일 (메모리: <i>feedback_tone_formal.md</i>). 영문 개념어(파이프라인·레퍼런스 등) 의도적으로 회피 "
     "(메모리: <i>feedback_writing_style_external_docs.md</i>). 피어 청중이라 친근하지만 산만하지 않은 톤."),
    ("아직 검증 안 된 수치",
     "정직성을 위해 명시합니다. <b>주간 1시간→5분, 채널 40개</b>는 베타 검증 전 추정치입니다. "
     "Phase 1 베타 결과가 나오면 즉시 실측치로 갱신해야 합니다. 청중이 &quot;그 수치 어디서?&quot; 물으면 "
     "&quot;FLIP 1기 베이스라인 가정치이며, 6주 안에 베타 5팀 측정값으로 갱신합니다&quot;가 정직한 답입니다."),
    ("청중 변형이 필요한 경우",
     "이 버전은 예비창업자용입니다. <b>VC용</b>으로 쓰시려면 §4에 156억/4225억 정부 예산 매칭과 B2B2C 구조를 추가하시고, "
     "<b>학교 기관용</b>으로는 §4 비전 부분을 늘려 종단 대시보드 가치를 더 풀어 설명하시면 됩니다. "
     "§5 Why Us와 §6 CTA는 청중에 따라 가장 크게 달라집니다."),
]


# ============================================================
# 빌드
# ============================================================

def build():
    out_path = "C:/project/Draft/Draft_3min_pitch_annotated.pdf"
    doc = SimpleDocTemplate(
        out_path, pagesize=A4,
        leftMargin=20 * mm, rightMargin=20 * mm,
        topMargin=22 * mm, bottomMargin=22 * mm,
        title="Draft 3분 엘리베이터 피칭 (v2 6섹션)",
        author="Draft",
    )

    story = []

    # 표지
    story.append(Paragraph("Draft 3분 엘리베이터 피칭", style_title))
    story.append(Paragraph(
        "v2 — 6섹션 구조 · 청중: 대학 창업교육센터 동기 예비창업자 (피어 + 잠재 고객)",
        style_subtitle,
    ))

    # 사용 안내
    story.append(Paragraph("이 문서를 읽는 법", style_h1))
    legend_rows = [
        [Paragraph("<b>노란 박스</b>", style_note_body),
         Paragraph("실제 청중 앞에서 입으로 말할 발화 본문입니다.", style_note_body)],
        [Paragraph("<b>회색 박스</b>", style_note_body),
         Paragraph("각 표현·구성 결정의 의도와 근거 — &quot;왜 이렇게 짰는지&quot;를 풀어둔 주석입니다.", style_note_body)],
        [Paragraph("<b>이탤릭체</b>", style_note_body),
         Paragraph("auto-memory 파일 이름. 해당 메모리에서 인용한 근거가 있다는 표시입니다.", style_note_body)],
    ]
    legend_table = Table(legend_rows, colWidths=[40 * mm, 130 * mm])
    legend_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), HexColor("#FAFBFC")),
        ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(legend_table)
    story.append(Spacer(1, 18))

    # 6섹션 구조 미리보기
    story.append(Paragraph("전체 구조 한눈에", style_h1))
    overview_rows = [
        [Paragraph("<b>섹션</b>", style_note_body),
         Paragraph("<b>역할</b>", style_note_body),
         Paragraph("<b>시간</b>", style_note_body)],
        [Paragraph("§1 오프닝", style_note_body),
         Paragraph("청중에게 직접 질문 — 동아리 운영 경험 환기", style_note_body),
         Paragraph("15초", style_note_body)],
        [Paragraph("§2 문제", style_note_body),
         Paragraph("2만 개 × 한 학기 0 — 시장 페인 정의", style_note_body),
         Paragraph("30초", style_note_body)],
        [Paragraph("§3 솔루션", style_note_body),
         Paragraph("인지 시스템 + 3대 기능 (각각 단위 숫자)", style_note_body),
         Paragraph("45초", style_note_body)],
        [Paragraph("§4 현재 진행/비전", style_note_body),
         Paragraph("FLIP 파일럿·경희대 컨택 사실 + 하반기 100개·3곳", style_note_body),
         Paragraph("35초", style_note_body)],
        [Paragraph("§5 Why Us", style_note_body),
         Paragraph("FLIP 회장 1인칭 권위 + 도메인 디테일", style_note_body),
         Paragraph("25초", style_note_body)],
        [Paragraph("§6 클로징/요청", style_note_body),
         Paragraph("escalating CTA — 베타/소개/피드백", style_note_body),
         Paragraph("20초", style_note_body)],
    ]
    overview = Table(overview_rows, colWidths=[28 * mm, 110 * mm, 22 * mm])
    overview.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), HexColor("#EAF2FE")),
        ("BACKGROUND", (0, 1), (-1, -1), HexColor("#FAFBFC")),
        ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, COLOR_BORDER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(overview)
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "총 약 1,265자 / 2분 50초 ~ 3분 5초. 청중과 호흡에 따라 ±10초 자연 변동.",
        style_caption,
    ))

    # §1
    story += section_block(
        "§1", "오프닝", "약 15초",
        "청중을 손드는 자세로 바꾸고, 동아리 운영 페인을 자기 사건으로 굳힙니다.",
        S1_PITCH, S1_NOTES,
    )

    # §2
    story += section_block(
        "§2", "문제", "약 30초",
        "2만 개 × 한 학기 0 구조로 시장 페인을 검증 가능한 수치로 정의합니다.",
        S2_PITCH, S2_NOTES,
    )

    story.append(PageBreak())

    # §3
    story += section_block(
        "§3", "솔루션", "약 45초",
        "&quot;인지 시스템&quot; 마스터 메타포 + 3대 기능을 각각 단위 숫자로 끝내는 구조.",
        S3_PITCH, S3_NOTES,
    )

    # §4
    story += section_block(
        "§4", "현재 진행 / 하반기 비전", "약 35초",
        "검증된 사실(FLIP 파일럿·경희대 컨택)만으로 현재를, 100개·3곳 숫자로 하반기를 약속합니다.",
        S4_PITCH, S4_NOTES,
    )

    story.append(PageBreak())

    # §5
    story += section_block(
        "§5", "Why Us", "약 25초",
        "FLIP 회장 1인칭 권위 + 만든 사람만 쓸 수 있는 도메인 디테일로 &quot;왜 내가&quot;에 답합니다.",
        S5_PITCH, S5_NOTES,
    )

    # §6
    story += section_block(
        "§6", "클로징 / 요청", "약 20초",
        "escalating CTA 3단계로 청중 누구도 빠져나가지 못하게 설계합니다.",
        S6_PITCH, S6_NOTES,
    )

    # 부록
    story.append(PageBreak())
    story.append(Paragraph("부록 — 전체 구성 메모", style_h1))
    story.append(Paragraph(
        "개별 문장 단위가 아니라 피치 전체에 걸친 결정 사항입니다.",
        style_caption,
    ))
    story.append(annotation_box(ADDITIONAL_NOTES))

    doc.build(story)
    print(f"PDF 생성 완료: {out_path}")


if __name__ == "__main__":
    build()
