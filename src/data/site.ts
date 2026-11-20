export const SITE = {
  name: 'MoTai Abrasives',
  nameAr: '墨泰 연마재',
  legalName: 'Hubei MoTai Abrasives Materials Co., Ltd.',
  url: 'https://ko.motaiabrasive.com',
  locale: 'ko',
  email: 'motai-01@motaiabrasive.com',
  whatsapp: '8618118635597',
  phone: '+86 181 1863 5597',
  address: 'No. 88 Yuli Avenue, Junshui Town, Tongcheng County, Xianning, Hubei, China',
  addressAr: '중국 후베이성 시안닝시 통청현 군수진 여리대로 88번지',
  social: {
    facebook: 'https://www.facebook.com/profile.php?id=61595012045510',
    instagram: 'https://www.instagram.com/motai_1_',
  },
} as const;

export const navItems = [
  { label: '홈', href: '/' },
  { label: '제품', href: '/products' },
  { label: '산업', href: '/industries' },
  { label: '墨泰 선정 이유', href: '/company' },
  { label: '품질 보증', href: '/quality' },
  { label: '기사', href: '/articles' },
  { label: '리소스', href: '/resources' },
  { label: '문의하기', href: '/contact' },
];

export const productCategories = [
  {
    slug: 'abrasive-belts',
    name: '샌딩 벨트',
    title: '일관된 표면 마무리를 위한 산업용 샌딩 벨트',
    description:
      '목재·금속 적용 분야에서 가장자리에 대한 정밀한 마감과 반복적인 가공을 위해 설계된 샌딩 벨트입니다. 주문자는 기계 모델, 대상 소재, 연결 방식, 소요 수량에 맞춰 스펙을 맞춤 조정합니다. 생산 시작 전 상세 규격을 명확히 정리해 드립니다.',
    image: '/images/belt-533.webp',
    applications: ['목공', '금속 마감', '가구 제작'],
    specs: [
      ['적용 분야', '가장자리 가공 및 표면 층 제거'],
      ['베이스 종류', '종이 · 면 · 유리섬유'],
      ['선택 가능한 규격', '533×75mm, 610×100mm, 1520×630mm, 2200×1330mm'],
      ['적합 기준', '기계 모델과 연결 방식은 주문자 측과 함께 검토'],
      ['커스텀 옵션', '입도(그릿) · 규격 · 브랜드 · 포장'],
    ],
    faq: [
      {
        q: '벨트 규격을 맞춤 조정할 수 있나요?',
        a: '네. 기계 사양에 맞춰 규격과 베이스 종류, 연결 방식을 설정하며, 생산 수주 전 벨트 회전 방향을 반드시 확인합니다.',
      },
      {
        q: '적합한 그릿 등급은 어떻게 선택하나요?',
        a: '빠른 제거에는 거친 등급, 균일한 마감에는 중간, 마무리에는 매끄러운 등급을 선택합니다. 보다 정확한 추천을 위해 실제 사용 중인 표면 상태를 알려주시면 됩니다.',
      },
      {
        q: 'OEM 브랜드로 주문할 수 있나요?',
        a: '네. 스펙 확정 단계에서 브랜드·포장·로고 요구사항을 검토하며, 최소 주문 수량과 비용에 대한 영향을 확인해 드립니다.',
      },
    ],
  },
  {
    slug: 'flap-discs',
    name: '플랩 디스크',
    title: '금속 가공과 마무리를 위한 고효율 플랩 디스크',
    description:
      '두 가지 방향으로 접힌 플랩 디스크는 재질 제거와 균형 잡힌 마감을 동시에 실현합니다. 설비 보수, 부식 제거, 도장 전 가장자리 가공에 적합합니다. 그릿과 베이스 선택 시 대상 소재와 작업 강도를 함께 고려하세요.',
    image: '/images/flap-disc.jpg',
    applications: ['설비 보수', '녹 제거', '도장 전 표면 처리'],
    specs: [
      ['선택 가능한 지름', '115mm, 125mm, 180mm, 180/230mm'],
      ['그릿 종류', '알루미나 · 세라믹 · 혼합 (용도별 선택)'],
      ['베이스 종류', '플라스틱 · 유리섬유'],
      ['공급 옵션', '개별 포장 및 도매 용량'],
      ['커스텀 옵션', '그릿 등급 · 색상 · 브랜드'],
    ],
    faq: [
      {
        q: '플라스틱 베이스와 유리섬유 베이스의 차이는 뭔가요?',
        a: '강도 높은 유리섬유 베이스는 무거운 작업에 적합하며 인장 테스트를 거칩니다. 일반 작업에는 플라스틱 베이스를 사용할 수 있습니다. 기종과 용도에 맞춰 선택하시기 바랍니다.',
      },
      {
        q: '두꺼운 연마 작업에도 사용 가능한가요?',
        a: '얇은~중간 두께의 작업에는 적합합니다. 강한 재질 제거가 필요할 때는 대상 재질에 맞는 디스크를 사용해 작업 강도와 이송 속도를 조절해야 합니다.',
      },
    ],
  },
  {
    slug: 'sanding-discs',
    name: '샌딩 디스크',
    title: '균일한 마감을 위한 메시 샌딩 디스크',
    description:
      '메시 디스크는 마무리와 표면 정돈, 가공 준비에 적합합니다. 오픈 메쉬 구조가 연마 중 먼지를 배출하고 결과의 균일성을 유지해 주며, 고정 시스템은 주문자 측 기기에 맞춰 선택합니다.',
    image: '/images/mesh-disc.webp',
    applications: ['목재 마감', '정밀 금속', '장식용 마감'],
    specs: [
      ['선택 가능한 지름', '5인치, 6인치'],
      ['유형', '퍼포레이션(개구) 메시'],
      ['그릿', '다단계 (다용도)'],
      ['호환성', '샌더 기기의 고정 방식에 따라'],
      ['포장', '주문자 요청 수량에 맞춰 구성'],
    ],
    faq: [
      {
        q: '메시 디스크란 무엇인가요?',
        a: '오픈 구조로 연마 중 먼지를 배출하는 디스크입니다. 균일한 표면을 요구하고 먼지 축적을 줄여야 하는 작업에 실용적인 선택지입니다.',
      },
      {
        q: '다른 규격으로 공급할 수 있나요?',
        a: '기재 중인 규격은 즉시 공급 가능하며, 기타 규격은 주문 스펙과 생산 계획 단계에서 확인해 드립니다.',
      },
    ],
  },
  {
    slug: 'hook-loop',
    name: 'Hook & Loop 디스크',
    title: '다회 사용이 가능한 Hook & Loop 디스크',
    description:
      '3·4·5·6인치의 Hook & Loop(벨크로) 방식 샌딩 디스크로, 표준 벨크로 패드에 호환됩니다. 그릿 60–5000번까지 제공하며, 평탄한 표면의 반복적인 마무리에 적합하고 볼트 체결이 필요 없습니다.',
    image: '/images/disc-hook-loop.webp',
    applications: ['평탄한 표면 마감', '정기적인 보수', '도장 전 처리'],
    specs: [
      ['선택 가능한 지름', '3인치, 4인치, 5인치, 6인치'],
      ['고정 방식', 'Hook & Loop(벨크로) 탈부착식'],
      ['그릿', '각 지름에 60–5000번'],
      ['호환성', '표준 벨크로 패드'],
      ['포장', '주문자 요청에 맞춰 혼합 구성'],
    ],
    faq: [
      {
        q: 'Hook & Loop과 PSA 디스크의 차이는 뭔가요?',
        a: '벨크로 방식은 패드에 재부착이 가능하여 디스크를 여러 번 교체할 수 있습니다. PSA 디스크는 1회용입니다. 등급을 자주 변경하는 작업에는 벨크로를 추천합니다.',
      },
      {
        q: '4개 지름을 한 번에 주문할 수 있나요?',
        a: '네. 주문자 리스트에 맞춰 혼합 구성을 제공할 수 있으며, 지름별 등급 수도 지정 가능합니다.',
      },
    ],
  },
  {
    slug: 'sanding-sponges',
    name: '샌딩 스펀지',
    title: '가장자리와 마무리를 위한 부드러운 샌딩 스펀지',
    description:
      '가장자리·곡면·수작업 마감을 위한 유연한 샌딩 스펀지입니다. 실용적이고 편안한 리듬으로 마무리 단계에 적합하며, 제거와 정돈에 필요한 다양한 형태와 그릿 등급으로 제공됩니다.',
    image: '/images/sponge.jpg',
    applications: ['마무리', '가장자리 다듬기', '표면 보정'],
    specs: [
      ['적용 분야', '수작업 또는 홀더와 호환'],
      ['그릿 등급', '36, 60, 80, 100, 120, 180, 220, 240, 280'],
      ['Hook & Loop 원형', '180, 320, 400, 500–600, 800–1000, 1200–1500, 2000, 2500, 3000'],
      ['형태', '시트 · 블록 · 패드 (용도별)'],
      ['포장', '개별 또는 도매 용량'],
    ],
    faq: [
      {
        q: '그릿 스펀지와 Hook & Loop 패드의 차이는 뭔가요?',
        a: '그릿 스펀지는 유연한 수작업 마감을 위한 것이며, Hook & Loop 패드는 평탄한 표면용이고 접착 베이스에 장착할 수 있습니다.',
      },
      {
        q: '좁은 각도에도 사용 가능한가요?',
        a: '네. 스펀지의 유연성 덕분에 곡면과 가장자리에서 제어 가능한 마찰력을 유지하면서 편안하게 작업을 수행할 수 있습니다.',
      },
    ],
  },
] as const;

export const industries = [
  {
    slug: 'woodworking',
    name: '목공',
    title: '가구와 인조(합성) 목재를 위한 샌딩 솔루션',
    description:
      '목재 마감 공정에는 재질 제거와 부드러운 마무리의 균형이 요구됩니다. 적합한 벨트와 디스크를 선택함으로써 보다 안정적이고 재현 가능한 작업 흐름을 구축하고, 부적절한 벨트 장착으로 인한 가동 중단도 줄일 수 있습니다.',
    image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-application-wood-real-1600.jpg?v=1794206426&width=1600',
    challenges: [
      '제품 간 마감 수준 통일',
      '벨트 교체(장착) 작업으로 인한 기계 가동 중단 최소화',
      '각 작업 단계에 맞는 그릿 선택',
    ],
    products: ['abrasive-belts', 'sanding-discs', 'sanding-sponges'],
    faq: [
      {
        q: '목재 품질의 일관성을 어떻게 유지하나요?',
        a: '제거 단계 → 마감 단계 → 마무리 그릿 순서로 고정합니다. 이를 통해 생산 공정을 표준화하고 재작업을 줄입니다.',
      },
      {
        q: '기존 작업 라인에 샌딩 벨트를 맞춤 적용할 수 있나요?',
        a: '기계 모델과 연결 방식을 알려주시면 규격과 벨트 베이스를 검토한 후 공급을 확정합니다.',
      },
    ],
  },
  {
    slug: 'metalworking',
    name: '금속 가공',
    title: '금속과 산업 보수를 위한 샌딩 솔루션',
    description:
      '금속 표면은 산화물 제거 → 버(돌출부) 제거 → 도장 순서로 처리합니다. 디스크와 벨트 선택은 금속의 경도, 광택 수준, 보호 코팅 적용 여부를 기준으로 합니다.',
    image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-application-metal-real-1600.jpg?v=1794206413&width=1600',
    challenges: [
      '가공품 손상을 방지한 녹 제거',
      '도장 전 가장자리 처리',
      '경도에 맞는 연마재 선택',
    ],
    products: ['flap-discs', 'abrasive-belts'],
    faq: [
      {
        q: '고경도 재료에 맞는 연마재가 있나요?',
        a: '금속 종류와 요구되는 제거량에 따라 그릿 종류를 결정합니다. 대량 주문 전 샘플 또는 시험 등급을 제안해 드립니다.',
      },
      {
        q: '견적 요청 시 무엇을 지정해야 하나요?',
        a: '금속 종류, 요구되는 제거량, 디스크 지름, 고정 방식, 수량 및 반복 주문 주기를 기재해 주세요.',
      },
    ],
  },
  {
    slug: 'automotive',
    name: '자동차 및 보수',
    title: '차체 가공과 보수를 위한 연마재',
    description:
      '도료 제거부터 패널 준비, 가장자리 다듬기까지 각 단계마다 다른 도구와 연마재가 필요합니다. 제품과 작업 방식에 맞춰 추천을 지원해 드립니다.',
    image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-application-auto-real-1600.jpg?v=1794206438&width=1600',
    challenges: [
      '도장 전 표면 준비',
      '절단 후 가장자리 처리',
      '잔재물 두께에 맞는 디스크 선택',
    ],
    products: ['flap-discs', 'abrasive-belts'],
    faq: [
      {
        q: '도장 전 표면은 어떻게 준비하나요?',
        a: '잔재물 제거 → 표면 세정 → 가장자리 다듬기 → 결함 검사 순서로 진행합니다. 소재에 따라 각 단계의 그릿을 결정합니다.',
      },
      {
        q: '보수 작업장에 적합한 구성으로 포장할 수 있나요?',
        a: '네. 제품 구성과 작업장의 소비량에 맞춰 포장을 조정해 드립니다.',
      },
    ],
  },
  {
    slug: 'shipbuilding',
    name: '조선 및 수리',
    title: '선체 표면 가공과 녹 제거를 위한 연마재',
    image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-application-marine-real-1600.jpg?v=1794206481&width=1600',
    description:
      '조선소의 표면 처리는 강판의 부식·오래된 도료 제거를 시작으로, 용접부 처리, 도장 전 준비, 미끄럼 방지 작업까지 이어집니다. 벨트/디스크 선택은 표면 면적과 부식 정도, 작업 속도에 따라 달라집니다.',
    challenges: [
      '기재 표면을 손상시키지 않는 녹 제거',
      '도장 전 가장자리·용접부 처리',
      '방청 도장 전 표면 준비',
    ],
    products: ['flap-discs', 'abrasive-belts'],
    faq: [
      {
        q: '조선소 녹 제거에 가장 적합한 그릿은 무엇인가요?',
        a: '도료와 녹 제거에는 40–80번의 거친 등급을 사용하고, 이후 100–180번으로 표면을 다듬습니다. 정확한 추천을 위해 부식 유형과 작업 방식을 먼저 확인합니다.',
      },
      {
        q: '조선(선체) 생산 라인을 위한 대용량 포장을 공급할 수 있나요?',
        a: '네. 조선소의 실제 소비량에 맞춰 정기적이고 안정적인 수량을 공급할 수 있습니다.',
      },
    ],
  },
  {
    slug: 'oil-gas',
    name: '석유·가스 — 표면 가공',
    title: '석유·가스 파이프와 저장조의 표면 가공',
    image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-application-surface-real-1600.jpg?v=1794206493&width=1600',
    description:
      '석유·가스 분야의 표면 가공은 파이프 부식 제거, 저장조 내부 표면 처리, 해상 플랜트 보수로 이어지는 공정이며, 부식 방지 도장 전 준비를 포함합니다. 그릿 등급과 디스크 종류는 표면 유형과 도장 요구사항에 따라 결정됩니다.',
    challenges: [
      '표면 손상을 방지한 파이프 녹 제거',
      '도장 전 저장조 내부 표면 가공',
      '습기·부식 환경에 적합한(내수성) 연마재 선택',
    ],
    products: ['flap-discs', 'sanding-discs'],
    faq: [
      {
        q: '석유 저장조의 그릿 등급은 어떻게 정하나요?',
        a: '제거에는 40–80번의 거친 등급으로 시작하고, 마무리에는 120–180번으로 다듬습니다. 그릿 종류(알루미나/지르코니아 알루미나)는 표면 경도에 따라 결정합니다. 확정 전 스펙을 함께 검토합니다.',
      },
      {
        q: '대량 주문 전 샘플 테스트를 지원하나요?',
        a: '네. 동일 소재와 등급의 샘플을 보내드리며, 대량 생산 전 적합성 검토 결과를 기록해 드립니다.',
      },
    ],
  },
  {
    slug: 'construction',
    name: '건축 마감재',
    title: '석고보드와 콘크리트를 위한 연마재',
    image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-application-drywall-real-1600.jpg?v=1794206539&width=1600',
    description:
      '건축 마감재(석고보드·시멘트·석재·목재) 가공에는 곡면과 평면 모두에 대응하는 유연한 연마 도구가 필요합니다. 그릿 등급과 베이스 선택은 마감 단계와 표면 종류를 기준으로 합니다.',
    challenges: [
      '도장 전 석고보드 표면 균일화',
      '패널 가장자리와 이음부 부드럽기',
      '현장에서의 먼지 관리',
    ],
    products: ['sanding-discs', 'sanding-sponges', 'abrasive-belts'],
    faq: [
      {
        q: '석고보드에는 어떤 도구가 적합하나요?',
        a: '먼지 배출을 위한 메시 디스크나 가장자리·곡면용 샌딩 스펀지를 사용합니다. 도장에는 120~240번이 적합합니다.',
      },
      {
        q: '건축 작업장용 혼합 포장을 공급할 수 있나요?',
        a: '네. 작업자 리스트에 맞춰 도구별 등급 수를 지정하여 혼합 포장을 구성할 수 있습니다.',
      },
    ],
  },
  {
    slug: 'general',
    name: '일반 산업',
    title: '보수와 일반 공업을 위한 샌딩 솔루션',
    image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-application-hand-real-1600.jpg?v=1794206564&width=1600',
    description:
      '일반 산업 시설의 유지보수·수리·표면 세정 작업입니다. 다양한 소재와 응용 분야를 폭넓게 커버하며, 실제 소비량에 맞춘 커스텀 옵션도 제공합니다.',
    challenges: [
      '라인 간 마감 품질 통일',
      '일반 작업에 맞는 그릿 선택',
      '단위 처리 비용 절감',
    ],
    products: ['abrasive-belts', 'flap-discs', 'sanding-discs'],
    faq: [
      {
        q: '일반 보수용 연마재는 어떻게 선택하나요?',
        a: '표면 종류, 작업 단계, 보유 기종을 확인합니다. 대부분의 일반 작업에는 80→120→180번 단계별 작업을 권장합니다.',
      },
      {
        q: '종류가 다른 소량을 주문할 수 있나요?',
        a: '네. 다양한 소비 패턴을 가진 작업장에 적합한 규격으로 혼합 구성을 만들어 드립니다.',
      },
    ],
  },
] as const;

/**
 * 응용 장면 — 마감 공정 전체(10개 장면) 커버
 * 링크는 사이트 내 실제 제품 페이지로 유도합니다.
 */
export const applicationScenes = [
  { title: '산업용 금속 마감', image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-application-metal-real-1600.jpg?width=900', href: '/products/flap-discs' },
  { title: '합판 샌딩', image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-application-wood-real-1600.jpg?width=900', href: '/products/sanding-discs' },
  { title: '자동차 표면 준비', image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-application-auto-real-1600.jpg?width=900', href: '/products/sanding-discs' },
  { title: '금속 부품 마감', image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-application-stainless-real-1600.jpg?width=900', href: '/products' },
  { title: '해상 분야 부식 제거', image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-application-marine-real-1600.jpg?width=900', href: '/products/flap-discs' },
  { title: '금속 절단 및 버 제거', image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-application-surface-real-1600.jpg?width=900', href: '/products/abrasive-belts' },
  { title: '가구 및 곡면', image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-application-furniture-real-1600.jpg?width=900', href: '/products/sanding-sponges' },
  { title: '벽면 및 석고보드 샌딩', image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-application-drywall-real-1600.jpg?width=900', href: '/products/sanding-discs' },
  { title: '주얼리 및 정밀 부품', image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-application-precision-real-1600.jpg?width=900', href: '/products/models/psa-disc-3-inch' },
  { title: '수작업 샌딩 및 공예', image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-application-hand-real-1600.jpg?width=900', href: '/products/sanding-sponges' },
] as const;

/**
 * 4개 소비 라인 — 홈페이지의 '제품 카테고리' 카드로 표시
 * 각 카드는 사이트 내 실제 링크로 연결됩니다.
 */
export const productCategoryLines = [
  {
    no: '01',
    name: '샌딩 벨트',
    slug: 'abrasive-belts',
    description:
      '533×75–2200×1330mm, 그릿 40–800번의 빨간색 샌딩 벨트. 레퍼런스 모델 제공. 도매 및 OEM 문의 환영합니다.',
    image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-gxk-51-model.jpg?width=640',
    href: '/products/abrasive-belts',
  },
  {
    no: '02',
    name: '플랩 디스크',
    slug: 'flap-discs',
    description:
      '플라스틱 · 강철 · 유리섬유 베이스의 플랩 디스크. 대상 소재와 필요 지름, 그릿 등급, 수량을 알려주시면 맞춤 견적을 제공합니다.',
    image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-flap-plastic-reddish-brown-display.png?width=640',
    href: '/products/flap-discs',
  },
  {
    no: '03',
    name: '샌딩 스펀지',
    slug: 'sanding-sponges',
    description:
      '유연한 스펀지 패드와 두꺼운 스펀지 시트로, 곡면·가장자리·평면·석고보드까지. 습식/건식 모두 사용 가능. 세척 후 재사용 가능. 도매 및 OEM 문의 환영합니다.',
    image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-flexible-sanding-sponge-pads-range.jpg?width=640',
    href: '/products/sanding-sponges',
  },
  {
    no: '04',
    name: '샌딩 디스크',
    slug: 'sanding-discs',
    description:
      'PSA 접착식 Hook & Loop, 메시, 솔리드(개구 없는) 디스크. 3–6인치, 그릿 60–5000번. 도매 및 OEM 문의 환영합니다.',
    image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-new-disc-gold-8-20261029.jpg?width=640',
    href: '/products/sanding-discs',
  },
] as const;

export const companyFacts = [
  { value: '5', label: '개 연마 제품군' },
  { value: '5', label: '단계 (스펙부터 배송까지)' },
  { value: '1', label: '구매 담당자 직통 팀' },
  { value: 'OEM', label: '브랜드·포장 커스텀' },
];

export const qualitySteps = [
  {
    title: '스펙 확정',
    text: '생산 전 주문자와 제품 종류, 규격, 그릿, 베이스, 수량, 포장을 함께 확정합니다.',
  },
  {
    title: '샘플 및 검사',
    text: '최종 수량 확정 전 샘플 적합성 검사를 진행하며, 구매자의 피드백을 기록합니다.',
  },
  {
    title: '변환 및 조립',
    text: '확정된 스펙대로 조립하며, 기종·고정 방식·요구 규격을 모두 반영합니다.',
  },
  {
    title: '검사 및 포장',
    text: '출하 전 구조·지름·베이스·포장을 재검토하고, 요청 시 레퍼런스 샘플을 보존합니다.',
  },
  {
    title: '배송 및 문서화',
    text: '고객 요청에 맞춰 배송 방식을 조정하고 포장 정보를 제공하며, 도착 후 피드백을 추적합니다.',
  },
];

export const resources = [
  {
    slug: 'abrasive-grit-guide',
    title: '그릿 등급 선택 가이드',
    description:
      '그릿 등급을 핵심 마감 작업과 연결하는 레퍼런스 테이블입니다. 구매팀이 저희와 상담 시 더 짧은 스펙으로 주문을 확정할 수 있도록 도와줍니다.',
    type: '기술 가이드',
    image: '/images/grit-reference.png',
    sections: [
      {
        title: '주문 전 준비',
        items: [
          '대상 소재와 가공 기종 확인',
          '작업 단계 지정: 제거 / 마감 / 마무리',
          '가능하면 샘플을 준비하여 적합성 검사',
        ],
      },
      {
        title: '유용한 정보',
        items: [
          '필요 규격 및 단위',
          '기종과 고정 방식',
          '예상 수량 및 반복 주문 주기',
        ],
      },
    ],
  },
  {
    slug: 'oem-packaging-guide',
    title: 'OEM 주문 준비 가이드',
    description:
      '브랜드·포장 파일 준비 단계입니다. 스펙 확정을 빠르게 하고, 인쇄 오류를 줄이기 위한 가이드입니다.',
    type: '공급 가이드',
    image: '/images/converting.jpg',
    sections: [
      {
        title: '필요 파일',
        items: [
          '벡터(AI) 형식 로고',
          '포장 디자인 및 표기(인쇄) 언어',
          '대상 시장 및 규정 준수 정보',
        ],
      },
      {
        title: '확인 사항',
        items: [
          '인쇄 스펙 및 판 면적',
          '인쇄 마진과 포장 내 제품 수량',
        ],
      },
    ],
  },
];
