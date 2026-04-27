// 체크리스트 마스터 데이터 시드 스크립트
// onboarding_tasks 테이블에 Phase 1~5 전체 항목 일괄 삽입

const SUPABASE_URL = "https://wiiojzxpruhjsilkzmhs.supabase.co";
const SUPABASE_KEY = "sb_publishable_D55O9ha6-jOMeZUOza756Q_zmsPFhq_";

const tasks = [
  // ── Phase 1. 계약 및 법무 ──────────────────────────────────────
  { category: "Phase 1. 계약", task_name: "계약 체결",     target: "공통",   description: "본 계약 및 용역 단가 확정, 계약서 최종 날인 여부 확인",                    is_input: false },
  { category: "Phase 1. 계약", task_name: "개인정보/보안", target: "고객사", description: "고객사 NDA 체결 및 개인정보 처리 합의, 고객 정보 활용 동의",                 is_input: false },
  { category: "Phase 1. 계약", task_name: "서비스 범위",   target: "고객사", description: "현장설치/풀필먼트 범위 및 서비스 수행 권역 확정",                           is_input: false },
  { category: "Phase 1. 계약", task_name: "정산 기준",     target: "고객사", description: "선수금/보험 설정, 정산 주기 및 입금 기한 확정",                             is_input: false },
  { category: "Phase 1. 계약", task_name: "업체 등록",     target: "레터스", description: "EP(ERP) 내 신규 화주사 거래처 마스터 생성 완료",                            is_input: false },
  { category: "Phase 1. 계약", task_name: "초기 보관료",   target: "고객사", description: "초기 계약 SKU 기반 재고보관료(원/팔렛) 확정",                               is_input: true  },
  { category: "Phase 1. 계약", task_name: "입고용역료(PLT)",  target: "고객사", description: "팔렛트당 입고 용역 단가(원/팔렛) 확정",                                  is_input: true  },
  { category: "Phase 1. 계약", task_name: "입고용역료(CNTR)", target: "고객사", description: "컨테이너 규격별(20/40FT) 하역 용역 단가 확정",                           is_input: true  },

  // ── Phase 2. 운영 기준 및 시스템 세팅 ────────────────────────
  { category: "Phase 2. 세팅", task_name: "운영 정책(SLA)",     target: "공통",   description: "정시배송율 등 KPI 설정 및 분실/파손 사고 처리 기준",                    is_input: false },
  { category: "Phase 2. 세팅", task_name: "재고 관리 정책",     target: "공통",   description: "장기 미출고/불용 재고 폐기 및 회수 프로세스 확정",                       is_input: false },
  { category: "Phase 2. 세팅", task_name: "OMS 계정 생성",      target: "레터스", description: "화주사 관리자 및 실무자별 OMS 접속 계정 발급",                          is_input: false },
  { category: "Phase 2. 세팅", task_name: "품목/단가 세팅",     target: "레터스", description: "SKU 코드 구성 및 품목별 용역료/시공비 매핑 완료",                       is_input: false },
  { category: "Phase 2. 세팅", task_name: "물류 기준 정보",     target: "레터스", description: "운영 팔렛트(PLT) 기준정보 및 ERP 내 기준 납기 설정",                   is_input: false },
  { category: "Phase 2. 세팅", task_name: "부가 서비스",        target: "레터스", description: "사다리차, 계단반입, 분해설치 등 특수 항목 등록",                         is_input: false },
  { category: "Phase 2. 세팅", task_name: "서비스 권역",        target: "레터스", description: "법정동 코드별 지역 할당 및 배송 가능일 시스템 반영",                     is_input: false },

  // ── Phase 3. 시스템 운영 역량 및 교육 ────────────────────────
  { category: "Phase 3. 역량", task_name: "주문 관리 역량",  target: "고객사", description: "OMS 주문 등록 방식 확정 (단일/엑셀/API)",                                  is_input: true  },
  { category: "Phase 3. 역량", task_name: "재고/입고 관리",  target: "고객사", description: "재고 보충 의뢰 및 입고 예정 정보 입력 가능 여부",                          is_input: true  },
  { category: "Phase 3. 역량", task_name: "반품/CS 처리",    target: "고객사", description: "반품 수거 의뢰 및 입고 프로세스 숙지 여부",                               is_input: true  },
  { category: "Phase 3. 역량", task_name: "라벨/데이터 활용",target: "고객사", description: "자체 바코드 출력 및 정산 대시보드 추출 가능 여부",                        is_input: true  },
  { category: "Phase 3. 교육", task_name: "프로세스 교육",   target: "공통",   description: "배송/설치 매뉴얼 공유 및 3센터 입출고 절차 교육",                         is_input: false },

  // ── Phase 4. 최초 입고 계획 및 물류 준비 ─────────────────────
  { category: "Phase 4. 준비", task_name: "최초 입고 일정",   target: "공통",   description: "최초 입고 확정 일자 및 시간 기재 (2026-00-00)",              is_input: true  },
  { category: "Phase 4. 준비", task_name: "초기 입고 물량",   target: "고객사", description: "입고 형태(CNTR/PLT) 및 상세 수량 기재",                      is_input: true  },
  { category: "Phase 4. 준비", task_name: "품목 물성 정보",   target: "고객사", description: "초기 입고 SKU 수 및 가구/설치 품목 비중 확인",               is_input: true  },
  { category: "Phase 4. 준비", task_name: "하역 준비 사항",   target: "레터스", description: "하역 방식(수작업/지게차) 및 특수 장비 필요 여부",            is_input: true  },

  // ── Phase 5. 최종 테스트 및 가동 ─────────────────────────────
  { category: "Phase 5. 가동", task_name: "통합 테스트",   target: "레터스", description: "주문~입고~출고~반품 전 과정 시스템 데이터 확인",             is_input: false },
  { category: "Phase 5. 가동", task_name: "비상 연락망",   target: "공통",   description: "운영/CS/정산 담당자 매핑 및 실시간 채널 구축",               is_input: false },
];

async function seedChecklist() {
  console.log(`총 ${tasks.length}개 항목을 삽입합니다...`);

  const res = await fetch(`${SUPABASE_URL}/rest/v1/onboarding_tasks`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    },
    body: JSON.stringify(tasks),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("❌ 삽입 실패:", res.status, errText);
    process.exit(1);
  }

  const data = await res.json();
  console.log(`✅ 성공! ${data.length}개 항목이 삽입되었습니다.`);
  data.forEach((t, i) => console.log(`  [${i + 1}] ${t.category} / ${t.task_name}`));
}

seedChecklist().catch(console.error);
