/**
 * 용어집 — 연마재 업계 표준 한국어 표현
 *
 * 원칙: 업계에서 통용되는 용어를 사용하고, 자어(自造語)를 쓰지 않습니다.
 * 각 항목에는 영어 원어, 한국어에서 통용되는 표현, 사용 맥락을 포함합니다.
 * 설명: 이 표현들은 한국어권 산업 공급업체의 일반적 문서 작성 스타일에 맞춘 것입니다.
 */
export const glossary = [
  {
    term: 'Abrasives',
    ar: '연마재',
    note: '마감·제거 산업 환경에서 통용되는 용어',
  },
  { term: 'Abrasive belt', ar: '샌딩 벨트', note: '샌더 기계에 장착되는 벨트' },
  { term: 'Flap disc', ar: '플랩 디스크(슬릿 디스크)', note: '베이스에 다중 슬릿이 결합된 구조' },
  { term: 'Sanding disc', ar: '샌딩 디스크 / 연마 디스크', note: '샌딩용 원형 디스크' },
  { term: 'Sanding sponge', ar: '샌딩 스펀지', note: '수작업 샌딩용 스펀지 패드' },
  { term: 'Grit / Grain', ar: '그릿(입도) / 연마 입자', note: '표면 거칠기를 나타내는 수치' },
  { term: 'Grain size', ar: '입자 크기 / 그릿 등급', note: '유럽 FEPA 표준에 따라 측정' },
  { term: 'Aluminum oxide', ar: '알루미나(알루미늄 산화물)', note: '가장 유명한 입자 종류' },
  { term: 'Ceramic', ar: '세라믹 / 세라믹 입자', note: '고성능 입자' },
  { term: 'Zirconia alumina', ar: '지르코니아 알루미나', note: '지르코니아와 알루미늄 산화물의 혼합' },
  { term: 'Backing', ar: '베이스 / 백페이퍼 / 베이스지', note: '입자를 지지하는 재질' },
  {
    term: 'Hook & loop',
    ar: 'Hook & Loop / 벨크로 디스크',
    note: '후크-루프 결합 시스템, 상업적으로 벨크로로 불림',
  },
  { term: 'PSA', ar: '압감접착(PSA)', note: 'Pressure Sensitive Adhesive, 뒷면에 부착됨' },
  { term: 'Mesh disc', ar: '메시 디스크 / 퍼포레이션 디스크', note: '먼지 배출용 개구가 있는 디스크' },
  { term: 'Sanding / Grinding', ar: '샌딩 / 그라인딩', note: '샌딩은 얇은 층 제거, 그라인딩은 강한 제거' },
  { term: 'Polishing', ar: '폴리싱 / 광택', note: '표면에 광택 부여' },
  { term: 'Surface finishing', ar: '표면 마감 / 표면 처리', note: '표면의 최종 처리' },
  { term: 'Edge deburring', ar: '버(돌출부) 제거', note: '절단 후 가장자리 정리' },
  { term: 'MOQ', ar: '최소 주문 수량', note: 'Minimum Order Quantity' },
  { term: 'OEM', ar: '고객 브랜드 위탁 제조', note: '고객 브랜드를 제품 적용' },
  { term: 'ODM', ar: '고객 주문 디자인', note: '고객 명의로 디자인 개발' },
  { term: 'RFQ', ar: '견적 요청', note: 'Request for Quotation' },
  { term: 'Converting', ar: '변환(산업용 변환)', note: '원자재를 최종 제품으로 변환' },
  { term: 'Certificate of Conformity', ar: '적합증명서(CoC)', note: '제품이 스펙에 맞는 것을 증명' },
  { term: 'Certificate of Analysis', ar: '분석증명서 / 검사 리포트(COA)', note: 'COA, 해당 로트의 검사 결과를 상세히 기술' },
] as const;
