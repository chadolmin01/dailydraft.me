# -*- coding: utf-8 -*-
"""
추출된 데이터를 통합하여 최종 프롬프트 데이터 생성
"""
import json
import os
import sys

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

DOCS_DIR = r"C:\project\Draft\docs"

def load_json(filename):
    path = os.path.join(DOCS_DIR, filename)
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def main():
    print("데이터 통합 시작...")

    # 기존 데이터 로드
    form_prompts = load_json("government_form_prompts.json")
    psst_prompts = load_json("psst_ai_prompts.json")
    extracted_forms = load_json("extracted_form_data.json")
    extracted_eval = load_json("extracted_evaluation_criteria.json")

    # 통합 데이터 구조
    enhanced_data = {
        "metadata": {
            "version": "2.0",
            "created_date": "2026-02-17",
            "description": "정부지원 창업패키지 사업계획서 작성을 위한 통합 AI 프롬프트 데이터",
            "sources": [
                "예비창업패키지 공고문 및 양식",
                "초기창업패키지 공고문 및 양식",
                "학생창업유망팀300 공고문 및 양식",
                "생애최초청년창업 공고문 및 양식",
                "오늘전통 공고문 및 양식",
                "경기G스타오디션 공고문 및 양식"
            ]
        },
        "forms": {}
    }

    # 양식별 데이터 통합
    form_configs = {
        "yebi-chogi": {
            "name": "예비창업패키지",
            "short_name": "예비창업",
            "target": "예비창업자 (사업자등록 전)",
            "funding": "최대 1억원",
            "period": "10개월",
            "evaluation_weights": {
                "problem": {"weight": 20, "label": "문제 인식 (Problem)"},
                "solution": {"weight": 30, "label": "실현 가능성 (Solution)"},
                "scaleup": {"weight": 30, "label": "성장 전략 (Scale-up)"},
                "team": {"weight": 20, "label": "팀 구성 (Team)"}
            },
            "key_evaluation_points": [
                "창업 아이템의 개발 배경 및 필요성",
                "사업기간 내 개발 또는 구체화 계획",
                "사업화를 위한 차별성, 수익모델, 자금조달 방안",
                "대표자 및 고용 (예정)인력이 보유한 기술 역량과 노하우"
            ],
            "bonus_points": [
                {"condition": "인공지능(융합혁신) 대학원 졸업생", "score": 2},
                {"condition": "정부 주관 전국 규모 창업경진대회 장관급 이상 수상자", "score": 1},
                {"condition": "기후테크 분야 창업 예정", "score": 3}
            ],
            "minimum_score": 60,
            "writing_guidelines": [
                "사업계획서 15페이지 이내 작성",
                "사업비 집행계획 구체적 작성 필수",
                "개인정보는 삭제 또는 마스킹"
            ]
        },
        "chogi": {
            "name": "초기창업패키지",
            "short_name": "초기창업",
            "target": "창업 3년 이내 기업",
            "funding": "최대 1억원",
            "period": "10개월",
            "evaluation_weights": {
                "problem": {"weight": 20, "label": "문제 인식 (Problem)"},
                "solution": {"weight": 30, "label": "실현 가능성 (Solution)"},
                "scaleup": {"weight": 30, "label": "성장 전략 (Scale-up)"},
                "team": {"weight": 20, "label": "팀 구성 (Team)"}
            },
            "key_evaluation_points": [
                "창업 아이템의 국내·외 시장 현황 및 문제점",
                "창업 아이템의 차별성 및 경쟁력 확보 전략",
                "비즈니스 모델(수익화 모델) 및 투자유치 전략",
                "대표자의 보유 역량 및 팀원 구성 현황"
            ],
            "emphasis": [
                "MVP 또는 시제품 성과 강조",
                "초기 고객/매출 실적 데이터 포함",
                "구체적인 투자유치 또는 매출 목표 제시"
            ],
            "minimum_score": 60
        },
        "student-300": {
            "name": "학생창업유망팀300",
            "short_name": "학생300",
            "target": "국내 대학(원) 재학생 창업팀",
            "tracks": ["도약트랙(일반)", "도약트랙(유학생)", "성장트랙(A)", "성장트랙(B)"],
            "evaluation_weights": {
                "problem": {"weight": 20, "label": "문제 인식"},
                "solution": {"weight": 25, "label": "실현 가능성"},
                "scaleup": {"weight": 25, "label": "성장 전략"},
                "team": {"weight": 20, "label": "팀 구성"},
                "business_canvas": {"weight": 10, "label": "비즈니스 모델 캔버스"}
            },
            "key_evaluation_points": [
                "학생 창업자의 신선한 시각과 기술적 도전 정신",
                "팀원 간 역할 분담과 시너지",
                "비즈니스 모델 캔버스 9개 블록 작성"
            ],
            "bonus_points": [
                {"condition": "실험실 특화형 창업선도대학 참여팀", "score": 3},
                {"condition": "외국인 유학생 50% 이상 구성", "score": 3},
                {"condition": "전문대학생 60% 이상 구성", "score": 3}
            ],
            "penalties": [
                {"condition": "팀구성원 변경", "score": -5},
                {"condition": "팀대표 아닌 팀원이 발표", "score": -5}
            ],
            "extra_sections": {
                "business_canvas": {
                    "fields": ["value_proposition", "customer_segments", "channels",
                              "customer_relationships", "revenue_streams", "key_resources",
                              "key_activities", "key_partners", "cost_structure"],
                    "instruction": "각 블록은 3-5문장으로 간결하게 작성하되, 서로 연결성을 보여주세요."
                }
            }
        },
        "saengae-chungnyeon": {
            "name": "생애최초청년창업",
            "short_name": "생애최초",
            "target": "만 39세 이하 생애 최초 창업자",
            "funding": "최대 4,000만원",
            "evaluation_weights": {
                "problem": {"weight": 15, "label": "문제 인식"},
                "solution": {"weight": 25, "label": "실현 가능성"},
                "scaleup": {"weight": 25, "label": "성장 전략"},
                "team": {"weight": 15, "label": "팀 구성"},
                "cooperation": {"weight": 20, "label": "협동가능성 (Cooperation)"}
            },
            "key_evaluation_points": [
                "생애 최초 창업인 만큼 창업 동기와 열정",
                "외부 네트워크와 협력 계획",
                "청년 창업자로서의 도전 정신"
            ],
            "extra_sections": {
                "cooperation": {
                    "fields": ["cooperation_plan", "network"],
                    "instruction": "협력 기관, 멘토, 파트너사 등 외부 자원 활용 계획을 구체적으로 작성"
                }
            }
        },
        "oneul-jeongtong": {
            "name": "오늘전통",
            "short_name": "오늘전통",
            "target": "전통문화 활용 청년 예비창업자",
            "funding": "최대 3,000만원",
            "evaluation_weights": {
                "problem": {"weight": 15, "label": "문제 인식"},
                "solution": {"weight": 25, "label": "실현 가능성"},
                "scaleup": {"weight": 25, "label": "성장 전략"},
                "team": {"weight": 15, "label": "팀 구성"},
                "traditional_culture": {"weight": 10, "label": "전통문화 활용"},
                "social_value": {"weight": 10, "label": "사회적 가치"}
            },
            "key_evaluation_points": [
                "전통문화 요소의 현대적 재해석",
                "사회적 가치 (전통 계승, 지역 활성화)",
                "MZ세대 타겟 시 전통의 '힙'한 재해석"
            ],
            "extra_sections": {
                "traditional_culture": {
                    "fields": ["cultural_element", "modernization"],
                    "instruction": "활용하는 전통문화 요소와 현대화 방법 설명"
                },
                "social_value": {
                    "fields": ["social_impact", "sustainability"],
                    "instruction": "전통문화 보존, 지역 경제 활성화 등 임팩트 설명"
                }
            }
        },
        "gyeonggi-g-star": {
            "name": "경기G스타오디션",
            "short_name": "G스타",
            "target": "경기도 소재/연관 예비·초기 창업자",
            "funding": "최대 5,000만원",
            "evaluation_weights": {
                "problem": {"weight": 15, "label": "문제 인식"},
                "solution": {"weight": 25, "label": "실현 가능성"},
                "scaleup": {"weight": 25, "label": "성장 전략"},
                "team": {"weight": 15, "label": "팀 구성"},
                "regional_connection": {"weight": 10, "label": "지역 연관성"},
                "organization_capacity": {"weight": 10, "label": "조직역량"}
            },
            "key_evaluation_points": [
                "경기도와의 연관성 (소재지, 타겟 시장, 협력 기관)",
                "지역 경제 및 일자리 창출 기여도",
                "조직역량과 실행력 증명"
            ],
            "extra_sections": {
                "regional_connection": {
                    "fields": ["gyeonggi_connection", "local_impact"],
                    "instruction": "경기도 내 사업장, 파트너, 특화 서비스 설명"
                },
                "organization_capacity": {
                    "fields": ["org_structure", "execution_capacity"],
                    "instruction": "조직 구조와 과거 실행 성과 설명"
                }
            }
        }
    }

    # 추출된 데이터 병합
    for form_id, config in form_configs.items():
        form_data = config.copy()

        # 추출된 양식 데이터 추가
        if form_id in extracted_forms:
            ext = extracted_forms[form_id]
            form_data["extracted_structure"] = ext.get("structure", {})
            form_data["sample_content"] = ext.get("sample_paragraphs", [])[:10]

        # 추출된 평가 데이터 추가
        if form_id in extracted_eval:
            eval_data = extracted_eval[form_id]
            form_data["evaluation_details"] = {
                "criteria_count": len(eval_data.get("evaluation_criteria", [])),
                "key_criteria": eval_data.get("evaluation_criteria", [])[:5],
                "requirements": eval_data.get("detailed_requirements", {})
            }

        enhanced_data["forms"][form_id] = form_data

    # PSST 섹션별 작성 가이드 추가
    enhanced_data["psst_writing_guide"] = {
        "problem": {
            "title": "문제 인식 (Problem)",
            "purpose": "심사위원이 '이건 진짜 문제다'라고 느끼게 하기",
            "structure": [
                "문제 상황 도입 (후킹) - 충격적인 통계나 사례로 시작",
                "문제의 심각성 (정량 데이터) - 구체적 수치와 출처",
                "기존 솔루션의 한계 - 왜 현재 대안이 불충분한지",
                "문제 해결 시 기대 효과"
            ],
            "templates": {
                "hook": "[타겟 고객]의 [N]%가 [문제 상황]을 경험합니다.",
                "severity": "이로 인해 연간 [금액]원의 [손실/비용]이 발생하며, [부정적 결과]로 이어집니다.",
                "existing_limit": "기존 [솔루션A]는 [한계1], [솔루션B]는 [한계2]의 문제가 있습니다."
            },
            "checklist": [
                "고객 관점에서 서술했는가? (창업자 관점 X)",
                "정량적 데이터(통계, 설문, 인터뷰)가 포함되었는가?",
                "데이터 출처가 명시되었는가?",
                "문제는 3개 이내로 집중되었는가?",
                "추상적 형용사 대신 구체적 수치를 사용했는가?"
            ]
        },
        "solution": {
            "title": "실현 가능성 (Solution)",
            "purpose": "Problem의 문제를 어떻게 해결하는지 구체적으로 증명",
            "structure": [
                "솔루션 핵심 가치 (한 문장)",
                "작동 방식 (How it works) - 단계별 설명",
                "핵심 기능 (3-5개) - 각 기능의 고객 혜택 포함",
                "차별화 포인트 - 경쟁사와 다른 점",
                "개발 현황/로드맵 - MVP, 프로토타입 증거"
            ],
            "templates": {
                "core_value": "[서비스명]은 [핵심 기술/방법]을 통해 [문제]를 해결하여 [고객 가치]를 제공합니다.",
                "how_it_works": "[단계1] → [단계2] → [단계3]의 과정으로 [결과]를 달성합니다.",
                "feature": "• [기능명]: [기능 설명] → [고객 혜택]",
                "differentiation": "기존 [경쟁사]와 달리, [차별점]을 통해 [우위]를 확보합니다."
            },
            "checklist": [
                "Problem과 1:1 매칭이 되는가?",
                "기술보다 '고객 가치' 중심으로 서술했는가?",
                "MVP/프로토타입 증거가 포함되었는가?",
                "핵심 기능이 5개 이내인가?",
                "경쟁사 대비 차별점이 명확한가?"
            ]
        },
        "scaleup": {
            "title": "성장 전략 (Scale-up)",
            "purpose": "시장 기회와 성장 가능성을 정량적으로 증명",
            "structure": [
                "시장 규모 (TAM/SAM/SOM) - 출처 필수",
                "수익 모델 - 구체적 가격 정책",
                "시장 진입 전략 (1단계)",
                "성장 전략 (2단계)",
                "확장 전략 (3단계)",
                "마일스톤과 KPI"
            ],
            "templates": {
                "tam": "TAM: [시장명] 전체 규모 [금액] ([출처], [연도])",
                "sam": "SAM: [세분 시장] [금액] (TAM의 [N]%)",
                "som": "SOM: [목표 시장] [금액] ([N]년 내 [N]% 점유 목표)",
                "stage": "[N]단계 ([기간]): [타겟]을 대상으로 [전략]을 통해 [목표] 달성"
            },
            "checklist": [
                "TAM/SAM/SOM 모두 포함했는가?",
                "시장 데이터 출처가 명시되었는가?",
                "수익 모델이 구체적인가? (가격, 수수료 등)",
                "단계별 성장 전략이 논리적인가?",
                "마일스톤과 KPI가 측정 가능한가?"
            ]
        },
        "team": {
            "title": "팀 구성 (Team)",
            "purpose": "'왜 이 팀이 이 사업을 성공시킬 수 있는가' 증명",
            "structure": [
                "대표자 소개 (역량 + 창업 동기)",
                "핵심 팀원 (역할 + 경력)",
                "팀의 차별적 강점",
                "부족 역량 보완 계획",
                "자문단/파트너"
            ],
            "templates": {
                "founder": "[이름] 대표 | [직함]\n- [관련 경력 N년]\n- [핵심 성과/전문성]\n- 창업 동기: [동기]",
                "member": "[이름] | [역할]\n- [이전 소속/경력]\n- 담당: [담당 업무]",
                "strength": "우리 팀만의 강점: [업계 경험/기술력/네트워크] 보유",
                "plan": "향후 [N]개월 내 [역할] 담당자 [N]명 채용 예정"
            },
            "checklist": [
                "대표자의 관련 경력/전문성이 명확한가?",
                "팀원별 역할 분담이 명확한가?",
                "'왜 이 팀인가'에 대한 설명이 있는가?",
                "부족한 역량 보완 계획이 있는가?",
                "개인정보(학력, 소속 등)가 마스킹되었는가?"
            ]
        }
    }

    # 업종별 가이드 추가
    enhanced_data["industry_guide"] = {
        "it_platform": {
            "name": "IT/플랫폼",
            "problem_focus": ["디지털 전환 장벽", "정보 비대칭", "비효율적 프로세스"],
            "solution_keywords": ["자동화", "AI/ML", "플랫폼", "매칭 알고리즘", "SaaS"],
            "key_metrics": ["MAU/DAU", "전환율", "리텐션", "ARPU", "NPS"],
            "revenue_models": ["구독형(SaaS)", "수수료 기반", "프리미엄", "광고"],
            "example_problems": [
                "국내 중소기업의 68%가 디지털 전환에 어려움을 겪고 있습니다.",
                "B2B 거래 시 정보 탐색에 평균 15시간/주가 소요됩니다."
            ]
        },
        "manufacturing": {
            "name": "제조/하드웨어",
            "problem_focus": ["생산 효율성", "품질 관리", "원가 절감", "안전 이슈"],
            "solution_keywords": ["스마트팩토리", "IoT", "예측 정비", "신소재"],
            "key_metrics": ["생산량", "불량률", "원가절감율", "설비가동률"],
            "revenue_models": ["제품 판매", "B2B 솔루션", "라이선싱"],
            "example_problems": [
                "중소 제조업체 평균 불량률 3.2%로 연간 2,000만원 손실",
                "설비 고장으로 월 평균 24시간 다운타임 발생"
            ]
        },
        "bio_healthcare": {
            "name": "바이오/헬스케어",
            "problem_focus": ["의료 접근성", "진단 정확도", "치료 비용"],
            "solution_keywords": ["AI 진단", "디지털 치료제", "원격의료", "개인맞춤"],
            "key_metrics": ["정확도/민감도", "임상 결과", "환자 수", "의료비 절감율"],
            "revenue_models": ["B2B2C(병원 연계)", "보험 연계", "구독형"],
            "example_problems": [
                "만성질환자의 72%가 정기 검진을 놓치며 합병증 위험 증가",
                "1차 의료기관 오진률 15%, 불필요한 전문의 의뢰 발생"
            ]
        },
        "food_fnb": {
            "name": "식품/F&B",
            "problem_focus": ["식품 안전성", "건강한 식단", "편의성"],
            "solution_keywords": ["클린라벨", "대체 단백질", "밀키트", "친환경"],
            "key_metrics": ["재구매율", "객단가", "유통채널 수"],
            "revenue_models": ["D2C 판매", "B2B 납품", "구독형"],
            "example_problems": [
                "1인 가구 60%가 영양 불균형 식사",
                "기존 건강식품 맛 만족도 2.8/5.0으로 지속 섭취 어려움"
            ]
        },
        "education": {
            "name": "교육/에듀테크",
            "problem_focus": ["학습 효율성", "개인화 부재", "비용 부담"],
            "solution_keywords": ["에듀테크", "AI 튜터", "적응형 학습", "게이미피케이션"],
            "key_metrics": ["학습완료율", "성적향상률", "NPS", "재등록률"],
            "revenue_models": ["B2C 구독", "B2B(학교/기업)", "콘텐츠 라이선싱"],
            "example_problems": [
                "평균 학원비 월 50만원, 가계 부담 심각",
                "기존 온라인 강의 완강률 15%, 학습 효과 미미"
            ]
        },
        "fintech": {
            "name": "핀테크/금융",
            "problem_focus": ["금융 접근성", "높은 수수료", "복잡한 절차"],
            "solution_keywords": ["간편결제", "로보어드바이저", "P2P", "블록체인"],
            "key_metrics": ["거래량/금액", "사용자 수", "대출승인률", "연체율"],
            "revenue_models": ["수수료 기반", "구독형", "이자수익"],
            "example_problems": [
                "금융 소외 계층 2,000만명",
                "해외송금 수수료 평균 5%"
            ]
        },
        "traditional_culture": {
            "name": "전통문화",
            "problem_focus": ["전통 계승 위기", "현대화 필요", "젊은 세대 관심 저하"],
            "solution_keywords": ["전통 재해석", "문화 콘텐츠", "체험 프로그램", "K-culture"],
            "key_metrics": ["체험자 수", "굿즈 판매량", "SNS 언급량", "재방문율"],
            "revenue_models": ["체험/관광", "상품 판매", "라이선싱"],
            "example_problems": [
                "전통 공예 장인 평균 연령 65세, 후계자 부재",
                "전통문화 체험 프로그램 만족도 3.2/5.0"
            ]
        }
    }

    # 금지/주의 패턴
    enhanced_data["quality_rules"] = {
        "forbidden_patterns": [
            "형용사만으로 설명 (매우, 획기적인, 혁신적인, 엄청난)",
            "근거 없는 '국내 최초', '세계 최고' 주장",
            "기술 나열만 (고객 가치 설명 없이)",
            "'~할 예정', '~할 계획' 만으로 마무리",
            "경쟁사 비방 또는 폄하"
        ],
        "must_include": [
            "모든 숫자에 출처 또는 근거 명시",
            "Problem 개수 = Solution 개수 (1:1 매칭)",
            "시장 규모는 TAM/SAM/SOM 모두 포함",
            "팀 소개에 '왜 이 팀인가' 설명",
            "구체적 마일스톤과 KPI"
        ],
        "style_guidelines": {
            "sentence_length": "한 문장 40자 이내 권장",
            "paragraph_length": "한 문단 3-4문장",
            "tone": "자신감 있되 겸손하게, 객관적 데이터 기반",
            "structure": "두괄식 (결론 먼저, 근거는 뒤에)"
        },
        "auto_conversion": {
            "매우 큰 시장": "연 {X}조원 규모의 시장",
            "빠르게 성장하는": "연평균 {X}% 성장하는",
            "많은 고객": "{X}만명의 고객",
            "높은 만족도": "만족도 {X}/5.0"
        }
    }

    # JSON 저장
    output_path = os.path.join(DOCS_DIR, "business_plan_complete_guide.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(enhanced_data, f, ensure_ascii=False, indent=2)

    print(f"\n통합 완료: {output_path}")
    print(f"- 양식 수: {len(enhanced_data['forms'])}")
    print(f"- PSST 가이드: {len(enhanced_data['psst_writing_guide'])} 섹션")
    print(f"- 업종 가이드: {len(enhanced_data['industry_guide'])} 업종")

if __name__ == "__main__":
    main()
