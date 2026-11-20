/**
 * 13종 글 유형 템플릿 시스템
 * 각 템플릿 구성: 구조 개요, 필수 모듈, 변수 슬롯, 용어 제약
 */

export interface ArticleTemplate {
  type: string;
  name: string;
  description: string;
  structure: string[]; // H2 레벨 개요
  requiredModules: string[]; // 필수 모듈: BLUF, 직답 블록, 표, 정보 블록, FAQ, CTA
  variableSlots: string[]; // 삽입 가능한 변수
  terminologyConstraints: string[]; // 용어표 필수 키워드
  minWordCount: number;
  maxWordCount: number;
  ctaType: 'hard' | 'soft';
  buyerJourneyStage: 'understanding' | 'evaluation' | 'comparison' | 'sourcing';
}

export const articleTemplates: Record<string, ArticleTemplate> = {
  'product-comparison': {
    type: 'product-comparison',
    name: '제품 비교',
    description: '두 제품/안건의 심층 비교, 공정별 제품 선정 지원',
    structure: [
      '직답: A를 고를 때와 B를 고를 때',
      '주요 차이점 표',
      '활용 시나리오 의사결정 트리',
      '스펙 기준 심층 분석',
      '선택 시 흔한 실수 및 피하는 법',
      '주문 확정 전 체크리스트',
      '자주 묻는 질문',
    ],
    requiredModules: ['BLUF', 'direct-answer', 'comparison-table', 'decision-tree', 'spec-table', 'common-mistakes', 'inquiry-checklist', 'FAQ', 'CTA'],
    variableSlots: ['productA', 'productB', 'application', 'material', 'gritRange', 'machineType', 'attachmentSystem'],
    terminologyConstraints: ['샌딩 벨트', '샌딩 디스크', '그릿 등급', '베이스', '고정 시스템', 'FEPA 표준'],
    minWordCount: 1200,
    maxWordCount: 2000,
    ctaType: 'hard',
    buyerJourneyStage: 'comparison',
  },

  'multi-product-comparison': {
    type: 'multi-product-comparison',
    name: '다중 비교',
    description: '동종 제품군 변형(베이스, 결합재, 홀 패턴, 고정 방식)의 매트릭스 비교',
    structure: [
      '직답: 핵심 차이를 한 문장으로',
      '다차원 비교 매트릭스',
      '각 변수별 적합한 작동 조건 상세',
      '성능·비용 트레이드오프 분석',
      '머신 호환성 표',
      '도매 구매 권장사항',
      '자주 묻는 질문',
    ],
    requiredModules: ['BLUF', 'direct-answer', 'comparison-table', 'spec-table', 'compatibility-table', 'procurement-advice', 'FAQ', 'CTA'],
    variableSlots: ['productFamily', 'variants', 'backingTypes', 'bondTypes', 'holePatterns', 'attachmentSystems', 'machineModels'],
    terminologyConstraints: ['면/종이 베이스', '수지 결합재', '메시 베이스', 'Hook & Loop', '압감접착(PSA)'],
    minWordCount: 1500,
    maxWordCount: 2500,
    ctaType: 'hard',
    buyerJourneyStage: 'comparison',
  },

  'buying-guide': {
    type: 'buying-guide',
    name: '구매 가이드',
    description: '공정·재질·머신·예산 관점의 제품 선정 의사결정 가이드',
    structure: [
      '직답: 스펙 확정 3단계',
      '선택 의사결정 플로우차트 (텍스트판)',
      '주요 기준 표',
      '재질/공정별 권장 그릿 순서',
      '머신 호환성 체크리스트',
      '샘플 평가 기준',
      '견적 요청 전 필요한 정보 목록',
      '자주 묻는 질문',
    ],
    requiredModules: ['BLUF', 'direct-answer', 'decision-flow', 'spec-table', 'grit-sequence-table', 'compatibility-checklist', 'sample-evaluation', 'inquiry-checklist', 'FAQ', 'CTA'],
    variableSlots: ['productFamily', 'workpieceMaterials', 'processSteps', 'machineTypes', 'budgetRanges', 'gritProgressions'],
    terminologyConstraints: ['그릿 등급', '마감 단계', '재질 제거량', '중간 마감', '최종 마감', '최소 주문 수량(MOQ)'],
    minWordCount: 1800,
    maxWordCount: 2500,
    ctaType: 'hard',
    buyerJourneyStage: 'evaluation',
  },

  'technical-guide': {
    type: 'technical-guide',
    name: '기술 가이드',
    description: '연마 입자, 그릿 체계, 베이스, 결합재, 홀 패턴, 고정 방식의 원리 심층 해설',
    structure: [
      '직답: 핵심 개념 3문장으로',
      '기술 원리 심층 분석',
      '표준 체계 비교 (FEPA/ANSI/JIS)',
      '파라미터가 성능에 미치는 영향',
      '흔한 기술적 오개념 바로잡기',
      '스펙 빠른 참조 표',
      '자주 묻는 질문',
    ],
    requiredModules: ['BLUF', 'direct-answer', 'technical-deep-dive', 'standards-table', 'parameter-impact', 'myth-busting', 'spec-checklist', 'FAQ', 'CTA'],
    variableSlots: ['technicalTopic', 'grainTypes', 'standards', 'parameters', 'performanceMetrics'],
    terminologyConstraints: ['가넷(알루미나) 입자', '실리콘 카바이드(SiC)', 'FEPA 표준', 'ISO 국제 표준', '수지 결합재', '면/종이 베이스'],
    minWordCount: 1200,
    maxWordCount: 2000,
    ctaType: 'soft',
    buyerJourneyStage: 'understanding',
  },

  'application-guide': {
    type: 'application-guide',
    name: '활용 가이드',
    description: '특정 산업/작업 조건(강구조, 조선, 유가스, 목공, 자동차) 대상의 완전한 공정 솔루션',
    structure: [
      '직답: 업계 핵심 페인포인트와 해결책',
      '전형적인 산업 공정 상세',
      '권장 제품 조합과 그릿 순서',
      '권장 작동 파라미터 설정',
      '안전·컴플라이언스 포인트 (KS/KOSHA)',
      '비용 절감 제안',
      '구매 사양 템플릿',
      '자주 묻는 질문',
    ],
    requiredModules: ['BLUF', 'direct-answer', 'process-breakdown', 'product-recommendation-table', 'grit-sequence-table', 'safety-compliance', 'cost-optimization', 'procurement-template', 'FAQ', 'CTA'],
    variableSlots: ['industry', 'workpieceMaterials', 'processSteps', 'recommendedProducts', 'gritProgressions', 'safetyStandards', 'gccCountry'],
    terminologyConstraints: ['표면 준비', '버(돌출부) 제거', '금속 마감', '조선소', '선박 수리', '석유·가스 분야', '개인보호장비(PPE)', 'FEPA 표준'],
    minWordCount: 1500,
    maxWordCount: 2500,
    ctaType: 'hard',
    buyerJourneyStage: 'evaluation',
  },

  'process-tutorial': {
    type: 'process-tutorial',
    name: '공정 튜토리얼',
    description: '단계별 연마 순서, 그릿 진행, 탈버(거품 제거) 및 표면 준비 작업 지침',
    structure: [
      '직답: 표준 공정 흐름 개요',
      '단계별 상세 작업 가이드 (파라미터 포함)',
      '그릿 상승 순서 원리 및 표',
      '핵심 관리 포인트와 품질 검사 기준',
      '흔한 공정 불량 및 처리법',
      '재질별 조정 포인트',
      '작업 중 안전 주의사항',
      '자주 묻는 질문',
    ],
    requiredModules: ['BLUF', 'direct-answer', 'step-by-step', 'grit-progression-table', 'quality-control', 'defect-troubleshooting', 'material-adjustments', 'safety', 'FAQ', 'CTA'],
    variableSlots: ['processName', 'steps', 'gritProgressions', 'machineSettings', 'qualityCriteria', 'defectTypes', 'materials'],
    terminologyConstraints: ['마감 단계', '그릿 등급', '재질 제거량', '중간 마감', '최종 마감', '표면 준비', '개인보호장비(PPE)'],
    minWordCount: 1200,
    maxWordCount: 2000,
    ctaType: 'soft',
    buyerJourneyStage: 'understanding',
  },

  'troubleshooting': {
    type: 'troubleshooting',
    name: '문제 해결',
    description: '과도한 마모, 막힘, 벨트 비틀림, 집진 불량 등 문제 진단과 대응',
    structure: [
      '직답: 불량-원인-해결 표',
      '고장 증상 분류와 진단 로직',
      '각 불량별 심층 분석',
      '근본 원인 체크리스트',
      '예방 정비 제안',
      '공급사 기술 지원에 에스컬레이션할 때',
      '자주 묻는 질문',
    ],
    requiredModules: ['BLUF', 'direct-answer', 'troubleshooting-table', 'root-cause-analysis', 'preventive-maintenance', 'support-escalation', 'FAQ', 'CTA'],
    variableSlots: ['productFamily', 'failureModes', 'rootCauses', 'correctiveActions', 'preventiveMeasures', 'machineTypes'],
    terminologyConstraints: ['먼지 적재', '벨트 비틀림', '과도한 마모', '먼지 배출(집진)', '면/종이 베이스', '수지 결합재'],
    minWordCount: 1000,
    maxWordCount: 1800,
    ctaType: 'soft',
    buyerJourneyStage: 'evaluation',
  },

  'product-spec-detail': {
    type: 'product-spec-detail',
    name: '스펙 상세',
    description: '제품군·사이즈·그릿 구간·베이스 유형의 전체 파라미터 상세',
    structure: [
      '직답: 스펙 포지셔닝과 응용 범위',
      '완전 스펙 표',
      '설계 원리와 성능 특성',
      '호환 머신과 장착 포인트',
      '커스터마이징 옵션 (그릿, 치수, 베이스, 브랜딩)',
      '주문 정보: MOQ, 납기, 포장',
      '자주 묻는 질문',
    ],
    requiredModules: ['BLUF', 'direct-answer', 'full-spec-table', 'design-principles', 'compatibility-guide', 'customization-options', 'ordering-info', 'FAQ', 'CTA'],
    variableSlots: ['productModel', 'specs', 'compatibleMachines', 'customizationOptions', 'moq', 'leadTime', 'packagingOptions'],
    terminologyConstraints: ['최소 주문 수량(MOQ)', '납기', '공장 직영', 'OEM', '그릿 등급', '베이스'],
    minWordCount: 1000,
    maxWordCount: 1800,
    ctaType: 'hard',
    buyerJourneyStage: 'sourcing',
  },

  'procurement-guide': {
    type: 'procurement-guide',
    name: '조달 가이드',
    description: 'B2B 수요 사양화, 샘플 평가, 견적 비교, 공급업체 선정 방법',
    structure: [
      '직답: 전문 조달 방법론 5단계',
      '기술 사양 표준화 템플릿',
      '샘플 평가 카드',
      '공급업체 평가 매트릭스',
      '견적 비교 핵심 포인트',
      '계약 조항과 인도 조건 핵심',
      '흔한 조달 함정 및 회피법',
      '자주 묻는 질문',
    ],
    requiredModules: ['BLUF', 'direct-answer', 'specification-template', 'sample-evaluation-card', 'supplier-evaluation-matrix', 'quote-comparison', 'contract-terms', 'procurement-pitfalls', 'FAQ', 'CTA'],
    variableSlots: ['productFamily', 'evaluationCriteria', 'supplierTypes', 'contractTerms', 'incoterms', 'paymentTerms'],
    terminologyConstraints: ['견적 / 견적 요청', '도매 공급자', '산업 유통사', '최소 주문 수량(MOQ)', '납기', '샘플 요청', '적합성 인증서', '분석 인증서'],
    minWordCount: 1800,
    maxWordCount: 2500,
    ctaType: 'hard',
    buyerJourneyStage: 'sourcing',
  },

  'wholesale-oem-guide': {
    type: 'wholesale-oem-guide',
    name: '도매 및 OEM',
    description: '자체 브랜드, 포장, 대량 구매, 샘플 확정, 공급업체 평가',
    structure: [
      '직답: OEM/도매 워크플로 개요',
      'OEM 커스터마이징 옵션 매트릭스',
      '브랜드 포장 설계 사양',
      '최소 수량과 가격 등급',
      '샘플 확정 프로세스와 기준',
      '품질 검사 및 입고 기준',
      '물류·관세 조율',
      '장기 협력 제안 프레임워크',
      '자주 묻는 질문',
    ],
    requiredModules: ['BLUF', 'direct-answer', 'oem-options-table', 'packaging-specs', 'moq-pricing-tiers', 'sample-approval-process', 'qa-standards', 'logistics-customs', 'partnership-framework', 'FAQ', 'CTA'],
    variableSlots: ['productFamily', 'customizationOptions', 'packagingTypes', 'moqTiers', 'sampleProcess', 'qaParameters', 'shippingTerms', 'gccCountry'],
    terminologyConstraints: ['OEM', '도매 공급자', '최소 주문 수량(MOQ)', '납기', '샘플 요청', '적합성 인증서', '포장', '브랜딩'],
    minWordCount: 1800,
    maxWordCount: 2500,
    ctaType: 'hard',
    buyerJourneyStage: 'sourcing',
  },

  'industry-market': {
    type: 'industry-market',
    name: '산업 시장',
    description: '표준, 안전 규정, 시장 동향 — 신뢰할 수 있는 최신 정보원 필요',
    structure: [
      '직답: 동향/표준 변경 핵심 포인트',
      '업계 배경과 드라이버 요인',
      '주요 표준 업데이트 분석 (FEPA/ISO/KS/KOSHA)',
      '시장 규모와 성장 데이터 (신뢰할 수 있는 출처 인용)',
      '기술 트렌드와 제품 혁신 동향',
      '조달 의사결정에 미치는 영향',
      '자주 묻는 질문',
    ],
    requiredModules: ['BLUF', 'direct-answer', 'industry-context', 'standards-analysis', 'market-data', 'technology-trends', 'procurement-implications', 'FAQ', 'CTA'],
    variableSlots: ['industry', 'standardsUpdates', 'marketData', 'technologyTrends', 'regulatoryChanges', 'gccCountry'],
    terminologyConstraints: ['FEPA 표준', 'ISO 국제 표준', 'KS', 'KOSHA', '개인보호장비(PPE)', '표면 준비'],
    minWordCount: 1500,
    maxWordCount: 2500,
    ctaType: 'soft',
    buyerJourneyStage: 'understanding',
  },

  'gcc-regional-sourcing': {
    type: 'gcc-regional-sourcing',
    name: 'GCC 지역 조달',
    description: '사우디아라비아/아랍에미리트/카타르/쿠웨이트/바레인/오만 대상 공급과 물류 고려사항',
    structure: [
      '직답: 해당 국가 수입 시 핵심 고려사항 3가지',
      '시장과 주요 산업 클러스터 개요',
      '수입 규제와 컴플라이언스 요구사항 (KS/KOSHA)',
      '물류 경로, 항만, 통관 기한',
      '현지 유통사/대리점 모델',
      '환율, 결제 방법, 무역 조건',
      '문화적·상업적 커뮤니케이션 포인트',
      '면책 조항: 현지에서 보장하지 않는 사항',
      '자주 묻는 질문',
    ],
    requiredModules: ['BLUF', 'direct-answer', 'market-overview', 'regulatory-compliance', 'logistics-ports', 'distribution-model', 'payment-terms', 'cultural-notes', 'disclaimer', 'FAQ', 'CTA'],
    variableSlots: ['gccCountry', 'industrialClusters', 'regulations', 'ports', 'leadTimes', 'distributors', 'paymentMethods', 'culturalTips'],
    terminologyConstraints: ['사우디아라비아', '아랍에미리트', '카타르', '쿠웨이트', '바레인', '오만', 'KS', 'KOSHA', '납기', '도매 공급자', '산업 유통사'],
    minWordCount: 1500,
    maxWordCount: 2200,
    ctaType: 'hard',
    buyerJourneyStage: 'sourcing',
  },

  'faq-buyers-guide': {
    type: 'faq-buyers-guide',
    name: '구매자 FAQ',
    description: '산업 구매자의 실제 질문 클러스터, 주제별 분류 Q&A 모음',
    structure: [
      '직답: 핵심 3문제의 요악 답변',
      '주제별 분류 FAQ (제품/스펙/조달/기술/물류/애프터서비스)',
      '핵심 의사결정 참조 표',
      '견적 요청 템플릿: 다운로드/사용 가이드',
      '용어 빠른 카드',
      '연락 채널과 응답 약정',
    ],
    requiredModules: ['BLUF', 'direct-answer', 'themed-faq', 'decision-reference-table', 'inquiry-template', 'glossary-card', 'contact-info', 'CTA'],
    variableSlots: ['faqGroups', 'decisionCriteria', 'inquiryTemplateFields', 'glossaryTerms', 'contactChannels'],
    terminologyConstraints: ['견적 / 견적 요청', '최소 주문 수량(MOQ)', '납기', '샘플 요청', '그릿 등급', '면/종이 베이스', '고정 시스템', 'OEM'],
    minWordCount: 1200,
    maxWordCount: 2000,
    ctaType: 'hard',
    buyerJourneyStage: 'comparison',
  },
};

export function getTemplate(type: string): ArticleTemplate | undefined {
  return articleTemplates[type];
}

export function getAllTemplateTypes(): string[] {
  return Object.keys(articleTemplates);
}
