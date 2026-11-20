/**
 * 文章内容生成器
 * 基于选题规格 + 模板 + 产品数据 生成符合提示词规范的韩语文章 HTML
 */

import { models, getModelByCategory } from '../data/models';
import { productCategories, industries, SITE, applicationScenes } from '../data/site';
import { glossary } from '../data/glossary';
import { articleTemplates, getTemplate, ArticleTemplate } from './article-templates';
import { TopicSpec, topicMatrix, gccCountries, industrySegments, keywordLibrary } from './topic-matrix';

// ========== 确定性种子（slug → 0..N 变体选择，保证可复现） ==========

/**
 * FNV-1a 32 位：同一 slug 永远同值（可增量重建），不同 slug 均匀落桶。
 * 用于驱动措辞模板/FAQ 滑窗/可选章节的确定性变体，降低同质化且无随机性。
 */
export function seedOf(slug: string, mod: number): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) % mod;
}

/** 按种子从数组中取一个元素（空数组返回 undefined） */
function pickBySeed<T>(arr: T[], seed: number, mod: number): T | undefined {
  if (!arr?.length) return undefined;
  return arr[seed % arr.length];
}

// ========== 术语表快速查找 ==========

const termMap = new Map(glossary.map(g => [g.term.toLowerCase(), g.ar]));
const productTermMap: Record<string, string> = {
  'abrasive belts': '샌딩 벨트',
  'sanding belts': '샌딩 벨트',
  'grinding belts': '샌딩 벨트',
  'abrasive discs': '샌딩 디스크 / 연마 디스크',
  'sanding discs': '샌딩 디스크 / 연마 디스크',
  'flap discs': '플랩 디스크(슬릿 디스크)',
  'mesh sanding discs': '메시 디스크 / 퍼포레이션 디스크',
  'PSA': '압감접착(PSA)',
  'hook-and-loop': 'Hook & Loop / 벨크로 디스크',
  'sanding sponges': '샌딩 스펀지',
  'grit': '그릿(입도)',
  'backing': '베이스',
  'resin bond': '수지 결합재',
  'aluminum oxide': '알루미나(알루미늄 산화물)',
  'zirconia alumina': '지르코니아 알루미나',
  'ceramic': '세라믹 / 세라믹 입자',
  'silicon carbide': '규화규소(SiC)',
  'belt sander': '벨트 샌더',
  'angle grinder': '각진동 그라인더',
};

function t(term: string): string {
  return productTermMap[term.toLowerCase()] || termMap.get(term.toLowerCase()) || term;
}

// ========== 内容生成核心 ==========

export interface GeneratedArticle {
  frontmatter: Record<string, any>;
  html: string;
  slug: string;
}

function getModel(slug: string) {
  return models.find(m => m.slug === slug);
}

function getProductCategory(slug: string) {
  const cat = productCategories.find(c => c.slug === slug);
  if (!cat) {
    console.warn(`[WARN] Product category not found for slug: ${slug}`);
    // 返回一个最小的回退对象，避免后续代码报错
    return {
      slug,
      name: getProductFamilyNameAr(slug),
      title: '',
      description: '',
      image: '',
      applications: [],
      specs: [],
      faq: [],
    } as typeof productCategories[0];
  }
  return cat;
}

function getIndustry(slug: string) {
  return industries.find(i => i.slug === slug);
}

function getGCCCountry(code: string) {
  return gccCountries.find(c => c.code === code);
}

/**
 * 生成单篇文章
 */
export function generateArticle(topic: TopicSpec): GeneratedArticle {
  const template = getTemplate(topic.articleType);
  if (!template) throw new Error(`Unknown template: ${topic.articleType}`);

  const model = topic.productModel ? getModel(topic.productModel) : null;
  const productCat = getProductCategory(topic.productFamily);
  const industry = getIndustry(topic.industry);
  const gccCountry = getGCCCountry(topic.gccCountry);

  const frontmatter = buildFrontmatter(topic, template, model, productCat, industry, gccCountry);
  const html = buildArticleHTML(topic, template, model, productCat, industry, gccCountry);

  return { frontmatter, html, slug: topic.slug };
}

/**
 * 构建 Frontmatter（符合 Content Collections schema）
 */
function buildFrontmatter(
  topic: TopicSpec,
  template: ArticleTemplate,
  model: typeof models[0] | null,
  productCat: typeof productCategories[0] | undefined,
  industry: typeof industries[0] | undefined,
  gccCountry: typeof gccCountries[0] | undefined
) {
  const now = new Date().toISOString();

  // 内链：至少 3 条
  const internalLinks = buildInternalLinks(topic, model, productCat, industry);

  // 外链：2-4 条权威来源
  const externalLinks = buildExternalLinks(topic, industry, gccCountry);

  // FAQ
  const faq = buildFAQ(topic, model, productCat, industry, gccCountry);

  // 规格表
  const specsTable = buildSpecsTable(topic, model, productCat);

  // 信息块
  const infoBoxes = buildInfoBoxes(topic, model, productCat, industry, gccCountry);

  // 语音搜索查询
  const voiceSearchQueries = buildVoiceSearchQueries(topic, model, productCat, industry, gccCountry);

  // CTA
  const cta = buildCTA(topic, model, productCat);

  return {
    title: topic.title,
    description: buildMetaDescription(topic, model, productCat),
    publishDate: now,
    updatedDate: now,
    author: 'MoTai Abrasives',
    category: topic.articleType,
    productFamily: topic.productFamily,
    productModel: topic.productModel,
    industry: topic.industry,
    gccCountry: topic.gccCountry,
    keywords: [topic.primaryKeyword, ...topic.secondaryKeywords, ...topic.longTailKeywords],
    primaryKeyword: topic.primaryKeyword,
    secondaryKeywords: topic.secondaryKeywords,
    longTailKeywords: topic.longTailKeywords,
    searchIntent: topic.searchIntent,
    featuredImage: model?.image ? `https://ko.motaiabrasive.com${model.image}` : productCat?.image ? `https://ko.motaiabrasive.com${productCat.image}` : undefined,
    featuredImageAlt: model?.imageAlt || productCat?.name,
    internalLinks,
    externalLinks,
    cta,
    faq,
    specsTable,
    infoBoxes,
    voiceSearchQueries,
    buyerJourneyStage: topic.buyerJourneyStage,
    notes: `Generated from topic matrix. Priority: P${topic.priority}. DedupeKey: ${topic.dedupeKey}`,
  };
}

/**
 * 构建文章 HTML 正文
 */
function buildArticleHTML(
  topic: TopicSpec,
  template: ArticleTemplate,
  model: typeof models[0] | null,
  productCat: typeof productCategories[0] | undefined,
  industry: typeof industries[0] | undefined,
  gccCountry: typeof gccCountries[0] | undefined
): string {
  const sections: string[] = [];

  // 根容器
  sections.push('<div dir="ltr" lang="ko" class="article-content">');

  // 型号真实规格差异块（根 div 内、BLUF 前），保证同类目跨型号正文可区分（B 去重）
  sections.push(buildModelSpecBlock(model));

  // BLUF + 直接回答块
  sections.push(buildBLUF(topic, model, productCat, industry, gccCountry));
  sections.push(buildDirectAnswerBlock(topic, model, productCat, industry, gccCountry));

  // 按模板结构生成 H2 章节
  template.structure.forEach((h2Title, idx) => {
    const sectionHtml = buildSection(h2Title, topic, model, productCat, industry, gccCountry, template, idx);
    if (sectionHtml) sections.push(sectionHtml);
  });

  // 广度差异化：按种子插入 0–2 个可选附加章节（复用现有构建器，章节数随 slug 浮动）
  const optSeed = seedOf(topic.slug + ':opt', 1_000_000);
  const optionalSections: Array<{ title: string; build: () => string }> = [
    { title: '사용 수명당 비용 최적화', build: () => buildCostOptimization(topic, model, productCat) },
    { title: '예방 정비와 수명 관리', build: () => buildPreventiveMaintenance(topic, model) },
    { title: '용어 빠르게 보기', build: () => buildGlossaryCard(topic) },
  ];
  // 选 0–2 个：bit 各独立决定一个章节是否插入（k0 ~50%，k1 ~33%）
  for (let k = 0; k < 2; k++) {
    const on = k === 0 ? optSeed % 2 === 0 : optSeed % 3 === 0;
    if (on) {
      const sec = optionalSections[k];
      const html = sec.build();
      if (html) sections.push(`<h2>${sec.title}</h2>\n${html}`);
    }
  }

  // FAQ
  sections.push(buildFAQSection(topic, model, productCat, industry, gccCountry));

  // CTA
  sections.push(buildCTASection(topic, model, productCat));

  sections.push('</div>');

  return sections.join('\n\n');
}

/** 型号真实规格差异块（根 div 内、BLUF 前），保证同类目跨型号正文可区分（B 去重） */
function buildModelSpecBlock(model: typeof models[0] | null): string {
  if (!model) return '';
  const grits = model.gritRange.slice(0, 4).join('–') + (model.gritRange.length > 4 ? '…' : '');
  const lines = [
    // MDX 合法注释语法（HTML 注释 <!-- --> 在 MDX/JSX 中非法，会中断构建）
    '{/* model-spec-block */}',
    `<h2>${model.name} 명세 (핵심 차이점)</h2>`,
    `<ul class="plain-links">`,
    `  <li><strong>선택 가능한 그릿(입도):</strong> ${grits}</li>`,
    `  <li><strong>베이스:</strong> ${model.backing}</li>`,
    `  <li><strong>고정 방식:</strong> ${model.attachment}</li>`,
    ...model.useCases.map((u) => `  <li><strong>주요 용도:</strong> ${u}</li>`),
    ...model.notes.slice(0, 2).map((n) => `  <li><strong>기술적 참고사항:</strong> ${n}</li>`),
    `</ul>`,
  ];
  return lines.join('\n');
}

/**
 * BLUF 开篇段
 */
function buildBLUF(
  topic: TopicSpec,
  model: typeof models[0] | null,
  productCat: typeof productCategories[0] | undefined,
  industry: typeof industries[0] | undefined,
  gccCountry: typeof gccCountries[0] | undefined
): string {
  const productName = model?.name || productCat?.name || getProductFamilyNameAr(topic.productFamily);
  const industryName = industry?.name || industrySegments.find(i => i.code === topic.industry)?.name || '';
  const countryName = gccCountry?.name || '';
  // 确定性种子：同一 slug 永远同一组变体（可复现），不同 slug 均匀分散
  const sv = seedOf(topic.slug, 1_000_000);
  const pick3 = <T,>(arr: T[]) => pickBySeed(arr, sv, 3) ?? arr[0];
  const pick2 = <T,>(arr: T[]) => pickBySeed(arr, Math.floor(sv / 3), 2) ?? arr[0];
  // 型号专属数据注入（有型号才加）
  const useCase = model?.useCases?.length ? ` 보조 용도: ${pick2([...model.useCases])}.` : '';
  const note = model?.notes?.length ? ` ${pick2([...model.notes])}.` : '';
  // 行业痛点注入（3 行业 site.ts + 4 行业 fallback）
  const challenge = industry?.challenges?.length ? ` 핵심 과제: ${industry.challenges[sv % industry.challenges.length]}.` : '';

  let bluf = '';

  switch (topic.articleType) {
    case 'product-comparison':
      bluf = pick3([
        `${productName}의 선택은 가공 재료, 마감 단계, 기계 유형에 따라 결정됩니다. ${industryName}${countryName ? ` (${countryName})` : ''} 환경에서는 그릿(입도), 벨트 폭/디스크 지름, 고정 방식이 주문 전에 확정되어야 합니다.`,
        `${productName}과 대안 제품 비교는 세 가지 기준으로 합니다: 가공 재료, 작업 단계, 기계 호환성. ${industryName}${countryName ? ` (${countryName})` : ''}에서 규격과 고정 방식이 올바른 선택을 가릅니다.`,
        `주문 전에 재료를, 단계를, 기계를 확정하고 ${productName} 중 ${industryName}${countryName ? ` (${countryName})` : ''}에 맞는 명세를 선택하세요. 그릿, 규격, 고정 방식이 핵심 결정 기준입니다.`,
      ]);
      bluf += useCase;
      break;
    case 'buying-guide':
      bluf = pick3([
        `${productName} 명세 확정은 3단계입니다: 가공 재료 → 마감 단계 → 기계 호환성. 이 가이드는 기준, 그릿 진행 순서, 바로 사용 가능한 견적 요청(RFQ) 서식을 제공합니다.`,
        `${productName} 주문을 정확히 준비하려면 세 가지 질문부터 시작합니다: 어떤 재료인가, 어떤 마감 단계인가, 어떤 기계를 사용할 것인가. 이 가이드는 답변을 주문 가능한 명세로 연결합니다.`,
        `${productName} 견적 요청 전 재료를, 단계를, 고정 방식을 확정하세요. 이 세 가지가 그릿 진행 순서와 문의 서식과 함께 최종 명세를 구성합니다.`,
      ]);
      bluf += useCase + challenge;
      break;
    case 'technical-guide':
      bluf = pick3([
        `${productName}은 입자 종류(알루미나, 지르코니아, 세라믹), 베이스(천/지/수지), 수지 결합재로 구성됩니다. FEPA/ISO 기준에 따라 그릿(입도)이 정확히 규정됩니다.`,
        `${productName}의 성능을 결정하는 3요소: 입자, 베이스, 결합재. 입자는 재료에, 베이스는 기계에, 그릿은 FEPA P에 따라 선택합니다.`,
        `${productName} 이해는 입자 종류(Al₂O₃/SiC/지르코니아/세라믹)부터 시작하고, 이어 베이스와 결합재, FEPA P에 따른 그릿 판독으로 이어집니다. ANSI·JIS와 혼용하지 마세요.`,
      ]);
      bluf += note;
      break;
    case 'application-guide':
      bluf = pick3([
        `${industryName}${countryName ? ` (${countryName})` : ''}에서 ${productName} 공정 흐름은 다음과 같습니다: 제거 → 중간 마감 → 최종 마무리. 일반적인 그릿 진행: 재료에 따라 60–80 → 120–180 → 240–400.`,
        `${industryName}${countryName ? ` (${countryName})` : ''}에 ${productName}을 적용하면 3단계를 거칩니다: 거친 제거, 평탄화, 최종 마무리. 그릿 진행은 60–80에서 시작해 240–400 이상으로 끝납니다.`,
        `${industryName}${countryName ? `에서 (${countryName})` : ''} ${productName}을 거친 단계에서 매끄러운 단계로 진행하세요: 제거(60–80) → 평탄화(120–180) → 마감(240–400 이상). 재료와 목적에 따라 조정합니다.`,
      ]);
      bluf += useCase + challenge;
      break;
    case 'process-tutorial':
      bluf = pick2([
        `${industryName || '해당 작업'}의 표준 공정 — ${productName} 사용: 표면 준비 → 거친 그릿으로 제거 → 중간 그릿으로 평탄화 → 매끄러운 그릿으로 마감. 각 단계마다 기계가 별도의 파라미터를 가집니다.`,
        `${industryName || '해당 작업'}에서 ${productName} 실행 순서: 표면을 청소한 뒤 제거용 샌딩, 평탄화, 마감 순으로 진행합니다. 파라미터(속도, 압력, 이송 속도)는 단계별로 조정합니다.`,
      ]);
      bluf += note;
      break;
    case 'troubleshooting':
      bluf = pick3([
        `${productName}의 일반적인 결함(가속 마모, 막힘, 이탈)은 대개 그릿 미스펙, 과도한 압력, 부적절한 속도, 먼지 배출 불량에서 비롯됩니다. 아래 표에서 증상별 원인 및 해결 방법을 확인할 수 있습니다.`,
        `${productName}에서 비정상 마모나 막힘, 이탈이 보이면 순서대로 확인하세요: 그릿 → 압력 → 속도 → 흡입 장치. 각 증상은 다음 표에서 원인과 해결책이 명시되어 있습니다.`,
        `${productName} 결함 진단은 확인된 증상(고장 속도, 막힘 패턴, 이탈 방향)을 시작점으로 삼아 그릿 미스펙, 과도한 부하, 흡입 부족 등 원인과 대조합니다.`,
      ]);
      bluf += useCase;
      break;
    case 'product-spec-detail':
      bluf = pick2([
        `${model?.name || productName}: ${model?.summary || productCat?.description || '전체 명세는 아래 참조'}. 규격: ${model?.sizeAr || '다수 규격'}, 그릿: ${model?.gritRange.join(', ') || '주문에 따라'}, 베이스: ${model?.backing || '구매자 협의'}.`,
        `${model?.name || productName}은 규격 ${model?.sizeAr || '다수 규격'}, 그릿 ${model?.gritRange.join('–') || '주문에 따라'}, 베이스 ${model?.backing || '구매자 협의'}로 제공됩니다. 전체 세부사항과 커스텀 옵션은 아래 표를 참조하세요.`,
      ]);
      bluf += note;
      break;
    case 'procurement-guide':
      bluf = pick3([
        `${productName}의 전문적인 구매 절차: 1) 전체 기술 명세 작성 2) 비교용 샘플 요청 3) 통일된 평가 매트릭스로 공급업체 평가 4) 총괄 견적 비교(가격+운송+조건) 5) 계약 및 품질 조건 확정.`,
        `${productName} 구매 프로세스는 명확한 명세 문서화부터 시작해 샘플 확인, 통일된 기준의 공급업체 평가, 총괄 견적 비교, 계약 조항 확정을 거칩니다.`,
        `${productName}의 도매 구매에서 이슈를 피하려면: 명세 작성 → 샘플 요청 → 단일 매트릭스로 공급업체 평가 → 총괄 가격, 리드타임, 조건을 비교하세요. 상세 단계는 아래입니다.`,
      ]);
      bluf += useCase + challenge;
      break;
    case 'wholesale-oem-guide':
      bluf = pick3([
        `${productName} 도매/OEM 협력: 커스텀 옵션(로고, 포장, 색상), 최소 주문 수량(MOQ), 샘플 확정 단계, 납품 일정을 확정합니다. 자세한 내용은 아래 가이드에서.`,
        `${productName} OEM/도매 주문 시 로고·포장 파일과 요구 그릿을 준비하고, 대량 생산 전에 샘플 확정을 거칩니다. 커스텀 옵션과 MOQ는 아래에서 설명합니다.`,
        `${productName}의 도매·OEM 경로는 5단계입니다: 명세 → 샘플 → 확정 → 대량 생산 → 기록 관리된 납품. 포장과 커스텀 옵션은 아래 가이드에서 명시합니다.`,
      ]);
      bluf += note;
      break;
    case 'industry-market':
      bluf = pick2([
        `${industryName} 산업의 ${gccCountry?.name || '한국'} 시장은 KS 기준(한국 공업 표준) 및 FEPA/ISO 준수로 업데이트 중이며, 고품질 성능을 위해 세라믹/지르코니아 입자로의 전환이 진행되고 있습니다. ${productName} 구매 결정에 영향: 명세 정밀화, 리드타임 단축.`,
        `${industryName} 산업의 ${gccCountry?.name || '한국'} 시장 변화(FEPA/ISO 기준, 고급 입자, 강화된 서류 관리)로 ${productName} 구매는 브랜드명이 아닌 명세 기반 결정으로 이동하고 있습니다.`,
      ]);
      bluf += challenge;
      break;
    case 'gcc-regional-sourcing':
      bluf = pick3([
        `${gccCountry?.name}으로 ${productName} 수입 시: KS 기준(한국 공업 표준) 및 KOSHA(한국산업안전보건공단) 안전 요건 준수, 항구 ${getMainPort(gccCountry?.code)}를 통한 통관, 해상 운송 25–35일, 대금은 LC/TT로 진행합니다. 당사에는 현지 재고와 사무실이 없습니다.`,
        `${gccCountry?.name}으로 ${productName} 공급 계획: KS 기준 및 KOSHA 안전 요건 준수, ${getMainPort(gccCountry?.code)} 항구 통관, 해상 25–35일, LC/TT 결제. 현지 재고 없이 공장에서 직접 출고합니다.`,
        `${gccCountry?.name}으로 ${productName} 수입을 원활하게 진행하려면: 적합증명서(CoC) 준비, 통관 항구 지정(${getMainPort(gccCountry?.code)}), 결제 방식(LC/TT) 조율. 당사에는 현지 재고나 사무실이 없습니다.`,
      ]);
      bluf += useCase;
      break;
    case 'faq-buyers-guide':
      bluf = pick2([
        `${productName} 구매자가 가장 많이 묻는 3가지: 1) ${industryName}에 맞는 그릿은? → 작업 단계에 따라 결정됩니다. 2) MOQ는? → 명세에 따라 결정됩니다. 3) 납기일은? → 수량과 명세에 따라 견적으로 확정됩니다. 자세한 답변은 아래 Q&A를 참조하세요.`,
        `${productName} 구매자는 대개 ${industryName}용 그릿 선택, MOQ, 납기일을 문의합니다. 직접 답변은 아래 Q&A 섹션에 있으며, 즉시 사용 가능한 문의 서식도 제공합니다.`,
      ]);
      bluf += challenge;
      break;
    default:
      bluf = `${productName}의 ${industryName}${countryName ? ` (${countryName})` : ''} 적용: 명세, 그릿, 주문 단계를 아래에 설명합니다.`;
      bluf += useCase;
  }

  return `<p class="bluf"><strong>${bluf}</strong></p>`;
}

/**
 * 直接回答块（AEO 优化）
 */
function buildDirectAnswerBlock(
  topic: TopicSpec,
  model: typeof models[0] | null,
  productCat: typeof productCategories[0] | undefined,
  industry: typeof industries[0] | undefined,
  gccCountry: typeof gccCountries[0] | undefined
): string {
  const productName = model?.name || productCat?.name || getProductFamilyNameAr(topic.productFamily);
  let answer = '';

  switch (topic.articleType) {
    case 'product-comparison':
      answer = `${productName}은 넓은 면적에서 재료 제거 속도와 마감 강도를 조절해야 하는 경우, 즉 벨트/디스크 기기와 호환되는 작업에 적합합니다. 좁은 공간이나 기기가 호환되지 않는 경우, 또는 정밀 디테일 작업은 다른 대안(다른 디스크/벨트)을 선택합니다.`;
      break;
    case 'buying-guide':
      answer = `확정 사항: 1) 가공 재료(목재/금속/플라스틱) 2) 작업 단계(제거/중간 마감/최종 마무리) 3) 기기와 고정 규격. 그릿 선택: 제거 40–80, 마감 100–180, 최종 240 이상.`;
      break;
    case 'technical-guide':
      answer = `입자: 알루미나(보편적), 지르코니아(경한 금속), 세라믹(고성능). 베이스: 천(유연), 지(안정), 수지(내습). 결합재: 내열성 수지. 그릿은 FEPA P 기준으로.`;
      break;
    case 'application-guide':
      answer = `표준 진행 순서: 60–80(녹/코팅/재료 제거) → 100–180(평탄화) → 240–400(최종 마감). ${industry?.name}의 경우 추가: 세척 → 검수 → 도장/코팅 준비.`;
      break;
    case 'process-tutorial':
      answer = `단계: 1) 부품 세척 2) 첫 그릿 선택 3) 기기의 속도/압력 조정 4) 그릿 순차 샌딩 5) 단계 사이 세척 6) 최종 검수. 파라미터는 재료와 기기에 따라 다릅니다.`;
      break;
    case 'troubleshooting':
      answer = `가속 마모 → 더 가는 그릿 또는 압력 감소. 막힘(로딩) → 메시 디스크 또는 냉각제 사용. 이탈 → 기기의 롤러와 벨트 방향 확인. 흡입 불량 → 필터와 흡입 호스 청소.`;
      break;
    case 'product-spec-detail':
      answer = `${model?.name || productName}: 규격 ${model?.sizeAr || '다수 규격'}, 그릿 ${model?.gritRange.join('–') || '주문에 따라'}, 베이스 ${model?.backing || '천/지/수지'}, 고정 ${model?.attachment || '기기에 따라 결정'}.`;
      break;
    case 'procurement-guide':
      answer = `기술 명세: 제품, 규격, 그릿, 베이스, 고정 방식, 수량, 포장, 배송지. 평가: 총괄 가격, 납기, 인증서, OEM 유연성, 납품 실적이력. 계약: 결제 조건, 지연 페널티, 품질 명세.`;
      break;
    case 'wholesale-oem-guide':
      answer = `OEM 필요 사항: 벡터 로고 파일, 포장 도안, 대상 시장 언어, 인쇄 명세. MOQ는 제품과 커스텀 사양에 따라 결정됩니다. 대량 생산 전 샘플 확정을 거칩니다.`;
      break;
    case 'industry-market':
      answer = `갱신된 기준(FEPA P, ISO 6344, KS 기준)은 그릿의 일관성과 분진 방출을 강화합니다. 트렌드: 고강도 작업을 위한 세라믹/지르코니아 입자, 습한 환경을 위한 수지 베이스.`;
      break;
    case 'gcc-regional-sourcing':
      answer = `요건: KS 적합증명서(CoC), KOSHA 안전 요건. 주요 항구: ${getMainPort(gccCountry?.code)}. 해상 리드타임 25–35일. 결제: L/C(신용장) 또는 T/T 선불. 현지 창고는 없습니다.`;
      break;
    case 'faq-buyers-guide':
      answer = `1) 그릿은 어떻게 선택하나요? → 작업 단계에 따라 결정됩니다. 2) MOQ는? → 명세에 따라 결정됩니다. 3) 납기는? → 견적으로 확정됩니다. 4) OEM을 지원하나요? → 네, 조건부. 5) 견적은 어떻게 요청하나요? → 전체 명세를 포함한 문의 서식으로.`;
      break;
    default:
      answer = `직접 답변: ${productName}은 재료, 단계, 기기에 따라 선택합니다. 상세 사항은 본문을 참조하세요.`;
  }

  return `
<div class="direct-answer" style="background:#f5f8ff;border-left:4px solid #2563eb;padding:1rem;margin:1.5rem 0;border-radius:0 8px 8px 0;">
  <strong>직접 답변:</strong> ${answer}
</div>`;
}

/**
 * 构建各章节
 */
function buildSection(
  h2Title: string,
  topic: TopicSpec,
  model: typeof models[0] | null,
  productCat: typeof productCategories[0] | undefined,
  industry: typeof industries[0] | undefined,
  gccCountry: typeof gccCountries[0] | undefined,
  template: ArticleTemplate,
  idx: number
): string {
  let content = '';
  const type = topic.articleType;

  // GCC Regional Sourcing - 精确逐节匹配
  if (type === 'gcc-regional-sourcing') {
    if (h2Title.includes('규제') || h2Title.includes('준수') || h2Title.includes('KS') || h2Title.includes('KOSHA')) {
      content = buildImportCompliance(gccCountry);
    }
    else if (h2Title.includes('물류') || h2Title.includes('항구') || h2Title.includes('통관') || h2Title.includes('경로')) {
      content = buildLogisticsPorts(gccCountry);
    }
    else if (h2Title.includes('유통') || h2Title.includes('대리점') || h2Title.includes('유통 모델')) {
      content = buildDistributionModel(gccCountry);
    }
    else if (h2Title.includes('환율') || h2Title.includes('결제 방식') || h2Title.includes('무역 조건')) {
      content = buildPaymentTerms(gccCountry);
    }
    else if (h2Title.includes('문화') || h2Title.includes('소통') || h2Title.includes('문화적 유의사항')) {
      content = buildCulturalNotes(gccCountry);
    }
    else if (h2Title.includes('면책') || h2Title.includes('담보하지 않는 사항') || h2Title.includes('책임')) {
      content = buildDisclaimer(gccCountry);
    }
  }
  // Industry Market - 精确逐节匹配
  else if (type === 'industry-market') {
    if (h2Title.includes('배경') || h2Title.includes('요인') || h2Title.includes('동인')) {
      content = buildMarketContext(topic, industry, gccCountry);
    }
    else if (h2Title.includes('갱신') || h2Title.includes('기준') || h2Title.includes('해설') || h2Title.includes('FEPA') || h2Title.includes('ISO') || h2Title.includes('KS')) {
      content = buildStandardsAnalysis(topic, industry, gccCountry);
    }    else if (h2Title.includes('시장 규모') || h2Title.includes('데이터') || h2Title.includes('성장') || h2Title.includes('인용')) {
      content = buildMarketData(topic, industry, gccCountry);
    }
    else if (h2Title.includes('기술 트렌드') || h2Title.includes('혁신') || h2Title.includes('제품 트렌드')) {
      content = buildTechTrends(topic, industry, gccCountry);
    }
    else if (h2Title.includes('결정') || h2Title.includes('영향') || h2Title.includes('구매')) {
      content = buildProcurementImplications(topic, industry, gccCountry);
    }
  }
  // Procurement Guide - 精确逐节匹配
  else if (type === 'procurement-guide') {
    if (h2Title.includes('방법론') || h2Title.includes('5단계') || h2Title.includes('확정 단계')) {
      content = buildDecisionGuide(topic, model, productCat, industry);
    }
    else if (h2Title.includes('통일') || h2Title.includes('명세 템플릿') || h2Title.includes('주문 템플릿')) {
      content = buildProcurementTemplate(topic, model, productCat);
    }
    else if (h2Title.includes('평가 카드') || h2Title.includes('샘플')) {
      content = buildSampleEvaluation(topic, model, productCat);
    }
    else if (h2Title.includes('평가 매트릭스') || h2Title.includes('공급업체')) {
      content = buildSupplierMatrix(topic, model, productCat);
    }
    else if (h2Title.includes('비교') || h2Title.includes('견적') || h2Title.includes('비교 포인트')) {
      content = buildQuoteComparison(topic, model, productCat);
    }
    else if (h2Title.includes('함정') || h2Title.includes('주의점') || h2Title.includes('오류')) {
      content = buildCommonMistakes(topic, model, productCat);
    }
    else if (h2Title.includes('조항') || h2Title.includes('계약') || h2Title.includes('납품 조건')) {
      content = buildContractTerms(topic, model, productCat);
    }
  }
  // Wholesale OEM Guide - 精确逐节匹配
  else if (type === 'wholesale-oem-guide') {
    if (h2Title.includes('업무 흐름') || h2Title.includes('개요') || h2Title.includes('OEM')) {
      content = buildOEMOverview(topic, model, productCat);
    }
    else if (h2Title.includes('옵션 매트릭스') || h2Title.includes('커스텀 옵션')) {
      content = buildOEMOptions(topic, model, productCat);
    }
    else if (h2Title.includes('디자인 명세') || h2Title.includes('포장') || h2Title.includes('브랜드')) {
      content = buildPackagingSpecs(topic, model, productCat);
    }
    else if (h2Title.includes('최소 수량') || h2Title.includes('단가 구간') || h2Title.includes('MOQ')) {
      content = buildMOQPricing(topic, model, productCat);
    }
    else if (h2Title.includes('확정 프로세스') || h2Title.includes('확정 기준') || h2Title.includes('샘플')) {
      content = buildSampleApproval(topic, model, productCat);
    }
    else if (h2Title.includes('품질 검사') || h2Title.includes('수입 기준') || h2Title.includes('검사')) {
      content = buildQAStandards(topic, model, productCat);
    }
    else if (h2Title.includes('물류') || h2Title.includes('관세') || h2Title.includes('조율')) {
      content = buildLogisticsCustoms(topic, model, productCat);
    }
    else if (h2Title.includes('프레임') || h2Title.includes('장기') || h2Title.includes('파트너십') || h2Title.includes('프레임워크')) {
      content = buildPartnershipFramework(topic, model, productCat);
    }
  }
  // Application Guide - 精确逐节匹配
  else if (type === 'application-guide') {
    if (h2Title.includes('과제') || h2Title.includes('해결책') || h2Title.includes('통증점')) {
      content = buildPainPoints(topic, model, productCat, industry);
    }
    else if (h2Title.includes('상세') || h2Title.includes('공정') || h2Title.includes('작업 단계') || h2Title.includes('작업 흐름')) {
      content = buildApplicationSection(topic, model, productCat, industry, gccCountry);
    }
    else if (h2Title.includes('조합') || h2Title.includes('제품 세트') || h2Title.includes('그릿 진행')) {
      content = buildProductCombo(topic, model, productCat, industry);
    }
    else if (h2Title.includes('설정') || h2Title.includes('파라미터') || h2Title.includes('조작 파라미터')) {
      content = buildProcessParams(topic, model, productCat);
    }
    else if (h2Title.includes('안전') || h2Title.includes('준수') || h2Title.includes('KS') || h2Title.includes('KOSHA')) {
      content = buildSafetyCompliance(topic, industry, gccCountry);
    }
    else if (h2Title.includes('비용') || h2Title.includes('최적화') || h2Title.includes('트레드오프')) {
      content = buildCostOptimization(topic, model, productCat);
    }
    else if (h2Title.includes('명세 템플릿') || h2Title.includes('구매')) {
      content = buildProcurementTemplate(topic, model, productCat);
    }
  }
  // Buying Guide - 精确逐节匹配
  else if (type === 'buying-guide') {
    if (h2Title.includes('3단계') || h2Title.includes('확정 단계') || h2Title.includes('플로우차트')) {
      content = buildDecisionGuide(topic, model, productCat, industry);
    }
    else if (h2Title.includes('지표') || h2Title.includes('주요 지표') || h2Title.includes('핵심 기준')) {
      content = buildKeyParamsTable(topic, model, productCat);
    }
    else if (h2Title.includes('그릿 진행') || h2Title.includes('재료별') || h2Title.includes('추천')) {
      content = buildGritSequenceTable(topic, model, productCat, industry);
    }
    else if (h2Title.includes('호환성') || h2Title.includes('체크리스트')) {
      content = buildCompatibilityChecklist(topic, model, productCat);
    }
    else if (h2Title.includes('평가') || h2Title.includes('샘플') || h2Title.includes('기준')) {
      content = buildSampleEvaluation(topic, model, productCat);
    }
    else if (h2Title.includes('정보') || h2Title.includes('주문') || h2Title.includes('견적 전')) {
      content = buildInquiryChecklist(topic, model, productCat);
    }
  }
  // Product Comparison
  else if (type === 'product-comparison') {
    if (h2Title.includes('직접') || h2Title.includes('언제 선택할지')) {
      content = buildComparisonDirectAnswer(topic, model, productCat);
    }
    else if (h2Title.includes('차이') || h2Title.includes('비교')) {
      content = buildComparisonTable(topic, model, productCat);
    }
    else if (h2Title.includes('결정') || h2Title.includes('적용 시나리오') || h2Title.includes('결정 트리') || h2Title.includes('시나리오')) {
      content = buildApplicationDecisionTree(topic, model, productCat, industry);
    }
    else if (h2Title.includes('파라미터') || h2Title.includes('명세') || h2Title.includes('심층 분석')) {
      content = buildSpecsSection(topic, model, productCat);
    }
    else if (h2Title.includes('오해') || h2Title.includes('오류')) {
      content = buildCommonMistakes(topic, model, productCat);
    }
    else if (h2Title.includes('구매') || h2Title.includes('확정') || h2Title.includes('목록')) {
      content = buildProcurementChecklist(topic, model, productCat);
    }
  }
  // Multi Product Comparison
  else if (type === 'multi-product-comparison') {
    if (h2Title.includes('한 문장') || h2Title.includes('핵심 차이')) {
      content = buildComparisonDirectAnswer(topic, model, productCat);
    }
    else if (h2Title.includes('매트릭스') || h2Title.includes('다차원') || h2Title.includes('비교 매트릭스')) {
      content = buildMultiComparisonMatrix(topic, model, productCat);
    }
    else if (h2Title.includes('변형') || h2Title.includes('작업 조건') || h2Title.includes('각 변수')) {
      content = buildVariantDetails(topic, model, productCat);
    }
    else if (h2Title.includes('성능') || h2Title.includes('비용') || h2Title.includes('트레드오프')) {
      content = buildCostPerformanceTradeoff(topic, model, productCat);
    }
    else if (h2Title.includes('호환') || h2Title.includes('기기')) {
      content = buildMachineCompatibility(topic, model, productCat);
    }
    else if (h2Title.includes('대량') || h2Title.includes('구매 제안') || h2Title.includes('도매')) {
      content = buildBulkProcurementAdvice(topic, model, productCat);
    }
  }
  // Technical Guide
  else if (type === 'technical-guide') {
    if (h2Title.includes('3문장') || h2Title.includes('핵심 개념') || h2Title.includes('개념')) {
      content = buildTechConceptSummary(topic, model, productCat);
    }
    else if (h2Title.includes('원리') || h2Title.includes('심층') || h2Title.includes('기술 원리') || h2Title.includes('분석')) {
      content = buildTechDeepDive(topic, model, productCat);
    }
    else if (h2Title.includes('표준') || h2Title.includes('FEPA') || h2Title.includes('ANSI') || h2Title.includes('JIS') || h2Title.includes('비교')) {
      content = buildStandardsComparison(topic, model, productCat);
    }
    else if (h2Title.includes('파라미터') || h2Title.includes('영향') || h2Title.includes('성능')) {
      content = buildParameterImpact(topic, model, productCat);
    }
    else if (h2Title.includes('오해') || h2Title.includes('개념') || h2Title.includes('오류') || h2Title.includes('반박')) {
      content = buildMythBusting(topic, model, productCat);
    }
    else if (h2Title.includes('빠른 보기') || h2Title.includes('명세 확인') || h2Title.includes('명세표')) {
      content = buildSpecChecklist(topic, model, productCat);
    }
  }
  // Process Tutorial
  else if (type === 'process-tutorial') {
    if (h2Title.includes('개요') || h2Title.includes('표준 공정') || h2Title.includes('공정 흐름')) {
      content = buildProcessOverview(topic, model, industry);
    }
    else if (h2Title.includes('단계별') || h2Title.includes('단계') || h2Title.includes('가이드') || h2Title.includes('상세') || h2Title.includes('절차')) {
      content = buildProcessSteps(topic, model, productCat, industry);
    }
    else if (h2Title.includes('진행') || h2Title.includes('순서') || h2Title.includes('원칙')) {
      content = buildGritProgressionTable(topic, model, industry);
    }
    else if (h2Title.includes('제어') || h2Title.includes('품질 검사') || h2Title.includes('핵심 포인트') || h2Title.includes('제어 포인트')) {
      content = buildQualityControl(topic, model, industry);
    }
    else if (h2Title.includes('결함') || h2Title.includes('대응책') || h2Title.includes('공정 결함')) {
      content = buildDefectTroubleshooting(topic, model, industry);
    }
    else if (h2Title.includes('재료') || h2Title.includes('조정') || h2Title.includes('재료별') || h2Title.includes('조절 포인트')) {
      content = buildMaterialAdjustments(topic, model, industry);
    }
    else if (h2Title.includes('안전') || h2Title.includes('팁') || h2Title.includes('주의사항')) {
      content = buildSafetyTips(topic, industry);
    }
  }
  // Troubleshooting
  else if (type === 'troubleshooting') {
    if (h2Title.includes('빠른 보기') || h2Title.includes('표') || h2Title.includes('고장-원인')) {
      content = buildTroubleshootingTable(topic, model);
    }
    else if (h2Title.includes('분류') || h2Title.includes('진단') || h2Title.includes('논리')) {
      content = buildFailureClassification(topic, model);
    }
    else if (h2Title.includes('항목별') || h2Title.includes('상세') || h2Title.includes('모든 사례') || h2Title.includes('분석')) {
      content = buildRootCauseAnalysis(topic, model);
    }
    else if (h2Title.includes('근인') || h2Title.includes('배제') || h2Title.includes('목록') || h2Title.includes('리스트')) {
      content = buildRootCauseChecklist(topic, model);
    }
    else if (h2Title.includes('예방') || h2Title.includes('정비') || h2Title.includes('예방 정비')) {
      content = buildPreventiveMaintenance(topic, model);
    }
    else if (h2Title.includes('지원') || h2Title.includes('연락') || h2Title.includes('에스컬레이션') || h2Title.includes('언제')) {
      content = buildSupportEscalation();
    }
  }
  // Product Spec Detail
  else if (type === 'product-spec-detail') {
    if (h2Title.includes('포지셔닝') || h2Title.includes('핵심') || h2Title.includes('적용') || h2Title.includes('위치')) {
      content = buildProductPositioning(topic, model, productCat);
    }
    else if (h2Title.includes('완전') || h2Title.includes('전체 파라미터') || h2Title.includes('명세 파라미터') || h2Title.includes('전체 명세')) {
      content = buildFullSpecsTable(topic, model, productCat);
    }
    else if (h2Title.includes('디자인') || h2Title.includes('원칙') || h2Title.includes('성능')) {
      content = buildDesignPrinciples(topic, model, productCat);
    }
    else if (h2Title.includes('호환') || h2Title.includes('기기 모델') || h2Title.includes('조립') || h2Title.includes('기기')) {
      content = buildCompatibilityGuide(topic, model, productCat);
    }
    else if (h2Title.includes('커스텀') || h2Title.includes('그릿 등급') || h2Title.includes('치수') || h2Title.includes('베이스') || h2Title.includes('브랜드') || h2Title.includes('옵션')) {
      content = buildCustomizationOptions(topic, model, productCat);
    }
    else if (h2Title.includes('주문') || h2Title.includes('MOQ') || h2Title.includes('납기') || h2Title.includes('포장') || h2Title.includes('주문 정보')) {
      content = buildOrderingInfo(topic, model, productCat);
    }
  }
  // FAQ Buyers Guide
  else if (type === 'faq-buyers-guide') {
    if (h2Title.includes('3가지') || h2Title.includes('Top 3') || h2Title.includes('상위 3')) {
      content = buildTop3FAQ(topic, model, productCat);
    }
    else if (h2Title.includes('그룹화') || h2Title.includes('주제별')) {
      content = '<p>아래 질문은 빠른 접근을 위해 주제별로 그룹화되었습니다.</p>';
    }
    else if (h2Title.includes('결정') || h2Title.includes('참조') || h2Title.includes('참조표')) {
      content = buildDecisionReferenceTable(topic, model, productCat);
    }
    else if (h2Title.includes('템플릿') || h2Title.includes('다운로드') || h2Title.includes('주문 템플릿') || h2Title.includes('문의')) {
      content = buildInquiryTemplate(topic);
    }
    else if (h2Title.includes('용어') || h2Title.includes('빠른 보기') || h2Title.includes('용어집') || h2Title.includes('카드')) {
      content = buildGlossaryCard(topic);
    }
    else if (h2Title.includes('연락') || h2Title.includes('대응') || h2Title.includes('채널') || h2Title.includes('소통')) {
      content = buildContactInfo();
    }
  }
  // 其他类型的通用匹配
  else {
    // 通用规格表
    if (h2Title.includes('명세') || h2Title.includes('파라미터') || h2Title.includes('기준')) {
      content = buildSpecsSection(topic, model, productCat);
    }
    // 通用应用
    else if (h2Title.includes('적용') || h2Title.includes('장면') || h2Title.includes('작업 조건') || h2Title.includes('작업 흐름')) {
      content = buildApplicationSection(topic, model, productCat, industry, gccCountry);
    }
    // 通用步骤
    else if (h2Title.includes('단계') || h2Title.includes('공정') || h2Title.includes('진행') || h2Title.includes('절차')) {
      content = buildProcessSteps(topic, model, productCat, industry);
    }
    // 通用安全
    else if (h2Title.includes('안전') || h2Title.includes('준수') || h2Title.includes('주의사항') || h2Title.includes('표준')) {
      content = buildSafetyCompliance(topic, industry, gccCountry);
    }
    // 通用成本
    else if (h2Title.includes('비용') || h2Title.includes('최적화') || h2Title.includes('가격')) {
      content = buildCostOptimization(topic, model, productCat);
    }
  }

  // 信息块插入（在合适位置）
  const infoBoxHtml = buildInlineInfoBoxes(topic, idx);
  if (infoBoxHtml) content = infoBoxHtml + '\n\n' + content;

  if (!content) return '';

  return `<h2>${h2Title}</h2>\n${content}`;
}

// 专门的故障排查详情构建
function buildTroubleshootingDetail(
  topic: TopicSpec,
  model: typeof models[0] | null,
  h2Title: string
): string {
  if (h2Title.includes('분류') || h2Title.includes('논리')) {
    return buildComparisonTable(topic, model, undefined); // 复用表格结构做故障-原因-对策表
  }
  if (h2Title.includes('분석') || h2Title.includes('원인')) {
    return buildRootCauseAnalysis(topic, model);
  }
  if (h2Title.includes('예방')) {
    return buildPreventiveMaintenance(topic, model);
  }
  if (h2Title.includes('에스컬레이션') || h2Title.includes('지원')) {
    return buildSupportEscalation();
  }
  return '';
}

// 专门的 FAQ 买家指南详情
function buildFAQBuyersDetail(
  topic: TopicSpec,
  model: typeof models[0] | null,
  h2Title: string
): string {
  if (h2Title.includes('그룹화')) {
    return '<p>아래 질문은 빠른 접근을 위해 주제별로 그룹화되었습니다.</p>';
  }
  if (h2Title.includes('결정')) {
    return buildDecisionGuide(topic, model, undefined, undefined);
  }
  if (h2Title.includes('주문 템플릿')) {
    return buildInquiryTemplate(topic);
  }
  if (h2Title.includes('용어')) {
    return buildGlossaryCard(topic);
  }
  if (h2Title.includes('소통')) {
    return buildContactInfo();
  }
  return '';
}

// ========== 缺失的辅助函数 ==========

function buildKeyParamsTable(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  const productName = model?.name || productCat?.name || t(topic.productFamily);
  return `
<h3>${productName} 선택을 위한 주요 지표</h3>
<table class="spec-table">
  <thead><tr><th>지표</th><th>설명</th><th>확정 방법</th></tr></thead>
  <tbody>
    <tr><td>가공 재료</td><td>목재, 금속, 플라스틱, 복합재</td><td>기본 재료를 확정</td></tr>
    <tr><td>작업 단계</td><td>제거 / 중간 마감 / 최종 마무리</td><td>그릿: 40–80 / 100–180 / 240+</td></tr>
    <tr><td>고정 방식</td><td>Hook & Loop / PSA / 메시</td><td>기기 패드와 일치시키기</td></tr>
    <tr><td>규격</td><td>길이×폭(벨트) / 지름(디스크)</td><td>기기 매뉴얼 확인</td></tr>
    <tr><td>입자 종류</td><td>알루미나 / 지르코니아 / 세라믹</td><td>재료 경도에 따라</td></tr>
    <tr><td>베이스</td><td>천 / 지 / 수지</td><td>유연성 대 치수 안정성</td></tr>
  </tbody>
</table>`;
}

function buildGritSequenceTable(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined, industry: typeof industries[0] | undefined): string {
  const industryName = industry?.name || '';
  return `
<h3>${industryName}용 추천 그릿 진행 순서</h3>
<table class="spec-table">
  <thead><tr><th>단계</th><th>그릿 (FEPA P)</th><th>목표</th><th>비고</th></tr></thead>
  <tbody>
    <tr><td>재료/녹/코팅 제거</td><td>40 – 80</td><td>고생산성, 빠른 제거</td><td>금속은 지르코니아/세라믹</td></tr>
    <tr><td>중간 마감</td><td>100 – 180</td><td>전 단계 잔여 흔적 평탄화</td><td>보편적 알루미나</td></tr>
    <tr><td>세부 마감</td><td>240 – 400</td><td>도장/코팅 준비</td><td>과도한 광택 방지</td></tr>
    <tr><td>최종 마무리</td><td>600 – 1500+</td><td>노출 표면/정밀 부위</td><td>가구, 자동차, 정밀용</td></tr>
  </tbody>
</table>`;
}

function buildCompatibilityChecklist(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return `
<h3>기기 호환성 체크리스트</h3>
<ul class="plain-links">
  <li>☐ 벨트/디스크 규격이 기기 명세와 일치하는지</li>
  <li>☐ 고정 방식(Hook & Loop / PSA / 메시)이 베이스와 호환되는지</li>
  <li>☐ 벨트 회전 방향이 올바른지(벨트 기준)</li>
  <li>☐ 연결 방식(직선/비스듬/겹침)이 적절한지</li>
  <li>☐ 기기 속도(RPM)가 제품 한계 이내인지</li>
  <li>☐ 흡입 시스템이 디스크 유형(개구/메시)과 일치하는지</li>
  <li>☐ 고정 패드 상태가 양호한지(특히 Hook & Loop)</li>
</ul>`;
}

function buildInquiryChecklist(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return buildProcurementTemplate(topic, model, productCat);
}

function buildComparisonDirectAnswer(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  const productName = model?.name || productCat?.name || t(topic.productFamily);
  const altProduct = getAlternativeProduct(topic.productFamily);
  return `
<p>${productName}은 넓은 면적에서 재료를 빠르게/중간 강도로 제거하면서 마감을 조절해야 하는 경우, 벨트/디스크 기기와 함께 사용할 때 적합합니다. ${altProduct}는 좁은 공간, 기기 호환이 되지 않는 경우, 또는 정밀 디테일 작업에 선택합니다.</p>`;
}

function buildApplicationDecisionTree(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined, industry: typeof industries[0] | undefined): string {
  return buildDecisionGuide(topic, model, productCat, industry);
}

function buildProcurementChecklist(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return buildInquiryChecklist(topic, model, productCat);
}

function buildMultiComparisonMatrix(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return buildComparisonTable(topic, model, productCat);
}

function buildVariantDetails(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return buildApplicationSection(topic, model, productCat, undefined, undefined);
}

function buildCostPerformanceTradeoff(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return buildCostOptimization(topic, model, productCat);
}

function buildMachineCompatibility(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return buildCompatibilityChecklist(topic, model, productCat);
}

function buildBulkProcurementAdvice(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return buildProcurementTemplate(topic, model, productCat);
}

function buildTechConceptSummary(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  const productName = model?.name || productCat?.name || t(topic.productFamily);
  return `
<p>${productName}은 세 가지 핵심 요소에 기반합니다: <strong>입자</strong>(알루미나, 지르코니아, 세라믹)가 절삭력을 결정하고, <strong>베이스</strong>(천, 지, 수지)가 유연성과 안정성을 결정하며, <strong>수지 결합재</strong>가 입자를 고정하고 내열성을 부여합니다. 그릿(입도)는 FEPA P 기준으로 국제적 일관성을 보장합니다.</p>`;
}

function buildTechDeepDive(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return buildApplicationSection(topic, model, productCat, undefined, undefined);
}

function buildStandardsComparison(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return `
<h3>그릿 표준 체계 비교</h3>
<table class="spec-table">
  <thead><tr><th>FEPA P (유럽)</th><th>ANSI (미국)</th><th>JIS (일본)</th><th>비고</th></tr></thead>
  <tbody>
    <tr><td>P40</td><td>40</td><td>40</td><td>거친 등급에서는 사실상 동일</td></tr>
    <tr><td>P80</td><td>80</td><td>80</td><td></td></tr>
    <tr><td>P120</td><td>120</td><td>120</td><td></td></tr>
    <tr><td>P240</td><td>240</td><td>240</td><td>세부 등급부터 차이가 발생</td></tr>
    <tr><td>P400</td><td>360</td><td>400</td><td>ANSI는 숫자가 낮을수록 더 곱습니다</td></tr>
    <tr><td>P800</td><td>600</td><td>800</td><td></td></tr>
    <tr><td>P1200</td><td>800</td><td>1200</td><td>JIS가 더 곱습니다</td></tr>
  </tbody>
</table>
<p><strong>원칙:</strong> 한 명세에서는 단일 표준(FEPA P, 국제 권장)을 고수하세요. 하나의 주문 안에서 표준을 혼용하지 마십시오.</p>`;
}

function buildParameterImpact(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return `
<h3>주요 파라미터가 성능에 미치는 영향</h3>
<table class="spec-table">
  <thead><tr><th>파라미터</th><th>값 증가</th><th>값 감소</th></tr></thead>
  <tbody>
    <tr><td>그릿 번호(더 곱게)</td><td>매끄러운 마감, 제거 속도 감소</td><td>제거 속도 증가, 깊은 긱 발생</td></tr>
    <tr><td>작업 압력</td><td>절삭 가속, 온도 상승, 마모 가속</td><td>절삭 지연, 온도 하락, 수명 연장</td></tr>
    <tr><td>기기 속도</td><td>제거 가속, 부품 손상 위험</td><td>제어 향상, 제거 지연</td></tr>
    <tr><td>이송 속도</td><td>생산성 향상, 거친 마감</td><td>매끄러운 마감, 작업 시간 증가</td></tr>
    <tr><td>입자 경도</td><td>경한 재료에서 수명 연장</td><td>비용 절감, 빠른 소모</td></tr>
  </tbody>
</table>`;
}

function buildMythBusting(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return buildCommonMistakes(topic, model, productCat);
}

function buildSpecChecklist(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return buildSpecsSection(topic, model, productCat);
}

function buildProcessOverview(topic: TopicSpec, model: typeof models[0] | null, industry: typeof industries[0] | undefined): string {
  const industryName = industry?.name || '';
  return `
<h3>공정 개요 - ${industryName}</h3>
<p>표준 샌딩 흐름은 4단계로 구성됩니다: 준비 → 거친 제거 → 중간 평탄화 → 최종 마감. 각 단계는 특정 그릿, 기기 파라미터 조정, 다음 단계 진입 전 품질 검수를 요구합니다.</p>`;
}

function buildGritProgressionTable(topic: TopicSpec, model: typeof models[0] | null, industry: typeof industries[0] | undefined): string {
  return buildGritSequenceTable(topic, model, undefined, industry);
}

function buildQualityControl(topic: TopicSpec, model: typeof models[0] | null, industry: typeof industries[0] | undefined): string {
  return `
<h3>핵심 제어 포인트와 검사 기준</h3>
<table class="spec-table">
  <thead><tr><th>제어 포인트</th><th>기준</th><th>검사 방법</th><th>주기가</th></tr></thead>
  <tbody>
    <tr><td>표면 거칠기(Ra)</td><td>도면 명세에 따라</td><td>휴대용 거칠기 측정기</td><td>50개 마다</td></tr>
    <tr><td>표면 외관</td><td>깊은 긱/이물질 없음</td><td>표준 조명 하 육안 검사</td><td>매 부품마다</td></tr>
    <tr><td>부품 치수</td><td>허용 오차 이내</td><td>측정자/마이크로미터</td><td>최초/최종/매 배치</td></tr>
    <tr><td>벨트/디스크 상태</td><td>균일 마모, 손상 없음</td><td>육안 검사</td><td>그릿 교체 시마다</td></tr>
  </tbody>
</table>`;
}

function buildDefectTroubleshooting(topic: TopicSpec, model: typeof models[0] | null, industry: typeof industries[0] | undefined): string {
  return `
<h3>일반적인 공정 결함과 대응 조치</h3>
<table class="spec-table">
  <thead><tr><th>결함</th><th>가능 원인</th><th>정비 조치</th></tr></thead>
  <tbody>
    <tr><td>깊은/불균일한 긱</td><td>너무 거친 그릿, 과도한 압력, 벨트 손상</td><td>더 곱은 그릿으로 전환, 압력 감소, 벨트 교체</td></tr>
    <tr><td>표면 광택/변색</td><td>고속, 고압, 냉각 불량</td><td>RPM 하강, 압력 감소, 흡입/냉각 개선</td></tr>
    <tr><td>균일하지 않은 마감</td><td>벨트 정렬 불량, 마모된 롤러, 이송 속도 불균일</td><td>정렬 보정, 롤러 교체, 이송 속도 고정</td></tr>
    <tr><td>막힘(로딩)</td><td>점성 재료, 과도하게 곱은 그릿 선택, 흡입 불량</td><td>세척/교체, 올바른 그릿 진행 순서, 필터 세척</td></tr>
  </tbody>
</table>`;
}

function buildMaterialAdjustments(topic: TopicSpec, model: typeof models[0] | null, industry: typeof industries[0] | undefined): string {
  return `
<h3>재료별 조정 포인트</h3>
<table class="spec-table">
  <thead><tr><th>재료</th><th>권장 입자</th><th>시작 그릿</th><th>압력/속도</th></tr></thead>
  <tbody>
    <tr><td>연질 목재</td><td>알루미나</td><td>80–100</td><td>가벼운 압력, 중간 속도</td></tr>
    <tr><td>경질 목재</td><td>알루미나/지르코니아</td><td>60–80</td><td>중간 압력, 중간 속도</td></tr>
    <tr><td>탄소강</td><td>지르코니아/세라믹</td><td>40–60</td><td>중간~높은 압력, 고속</td></tr>
    <tr><td>스테인리스강</td><td>지르코니아/세라믹</td><td>60–80</td><td>가벼운~중간 압력, 충분한 냉각</td></tr>
    <tr><td>알루미늄</td><td>규화규소(SiC)</td><td>80–120</td><td>가벼운 압력, 고속</td></tr>
    <tr><td>코팅/니스</td><td>알루미나/세라믹</td><td>80–120</td><td>가벼운 압력, 강한 흡입</td></tr>
  </tbody>
</table>`;
}

function buildSafetyTips(topic: TopicSpec, industry: typeof industries[0] | undefined): string {
  return buildSafetyCompliance(topic, industry, undefined);
}

function buildTroubleshootingTable(topic: TopicSpec, model: typeof models[0] | null): string {
  const productName = model?.name || t(topic.productFamily);
  return `
<h3>빠른 표: ${productName}의 고장 - 원인 - 해결</h3>
<table class="spec-table">
  <thead><tr><th>고장</th><th>주요 원인</th><th>즉시 해결</th><th>예방</th></tr></thead>
  <tbody>
    <tr><td>가속 마모</td><td>너무 곱은 그릿 / 과도한 압력</td><td>거친 그릿으로 전환 / 압력 감소</td><td>올바른 그릿 진행 순서</td></tr>
    <tr><td>막힘(로딩)</td><td>점성 재료 / 흡입 불량</td><td>메시 디스크 / 필터 세척</td><td>효과적인 흡입, 냉각</td></tr>
    <tr><td>벨트 이탈</td><td>롤러 정렬 불량 / 잘못된 연결</td><td>정렬 보정 / 연결 확인</td><td>주 1회 롤러 점검</td></tr>
    <tr><td>진동/소음</td><td>벨트 불균형 / 롤러 손상</td><td>벨트/롤러 교체</td><td>매일 육안 검사</td></tr>
    <tr><td>부품 손상(변색)</td><td>고 RPM / 고압 / 냉각 없음</td><td>속도/압력 하강 / 냉각제 사용</td><td>재료별 파라미터 조정</td></tr>
  </tbody>
</table>`;
}

function buildFailureClassification(topic: TopicSpec, model: typeof models[0] | null): string {
  return `
<h3>고장 현상 분류 및 진단 논리</h3>
<ol class="numbered-list">
  <li><strong>마모 결함:</strong> 조기 마모, 불균일 마모, 입자 이탈 → 그릿, 압력, 입자 종류 확인</li>
  <li><strong>막힘 결함:</strong> 로딩, 광택 표면, 절삭력 저하 → 흡입, 재료, 그릿 진행 순서 확인</li>
  <li><strong>기계 결함:</strong> 이탈, 진동, 파열, 균열 → 롤러, 정렬, 연결, RPM 확인</li>
  <li><strong>표면 결함:</strong> 긱, 변색, 물결, 균일하지 않은 마감 → 그릿 진행, 파라미터, 벨트 상태 확인</li>
  <li><strong>안전 결함:</strong> 과다 분진, 스파크, 파편 → 보호장구(PPE), 흡입, 기기 가드, 제품 상태 확인</li>
</ol>`;
}

function buildRootCauseAnalysis(topic: TopicSpec, model: typeof models[0] | null): string {
  return `
<h3>근원 원인 분석(예)</h3>
<table class="spec-table">
  <thead><tr><th>고장</th><th>직접 원인</th><th>근원 원인(5 Why)</th><th>정비 조치</th></tr></thead>
  <tbody>
    <tr><td>가속 마모</td><td>제거 단계에서 120 그릿 사용</td><td>작업 단계 미확정 → 그릿 진행 순서 미인지 → 가이드 부재</td><td>그릿 진행 가이드 제공, 작업자 교육</td></tr>
    <tr><td>반복 이탈</td><td>가이드 롤러 마모</td><td>정기 점검 없음 → 체크리스트 없음 → 책임 불명</td><td>주 점검에 롤러 항목 추가, 담당자 지정</td></tr>
    <tr><td>지속적 막힘</td><td>점성 재료에 개구 없는 디스크 사용</td><td>디스크 유형과 재료 불일치 → 명세 불명확 → 전제 오류</td><td>RFQ 서식에 "디스크 유형" 항목 추가, 구매 교육</td></tr>
  </tbody>
</table>`;
}

function buildRootCauseChecklist(topic: TopicSpec, model: typeof models[0] | null): string {
  return `
<h3>근원 원인 체크리스트</h3>
<ul class="plain-links">
  <li>☐ 그릿이 작업 단계와 일치하는가?</li>
  <li>☐ 입자 종류가 가공 재료에 적합한가?</li>
  <li>☐ 압력이 권장 범위(0.5–2 N/cm²) 내인가?</li>
  <li>☐ 기기 RPM이 제품 한계 이내인가?</li>
  <li>☐ 흡입 시스템이 정상 작동하는가?(필터, 공기 흐름 확인)</li>
  <li>☐ 롤러/베이스가 깨끗하고 양호한 상태인가?</li>
  <li>☐ 회전 방향/연결이 올바른가(벨트 기준)?</li>
  <li>☐ 작업자가 그릿 진행 순서에 숙련한가?</li>
  <li>☐ 환경(습도/온도)이 베이스/결합재에 영향을 주지 않는가?</li>
  <li>☐ 현재 배치가 기준 명세와 일치하는가?</li>
</ul>`;
}

function buildDistributionModel(gccCountry: typeof gccCountries[0] | undefined): string {
  if (!gccCountry || gccCountry.code === 'general-gcc') return '';
  return `
<h3>${gccCountry.name} 유통 모델</h3>
<ul class="plain-links">
  <li><strong>직접 수입업체:</strong> 컨테이너 전체 물량을 구매하고, 국내 유통망에 공급하는 대형 기업</li>
  <li><strong>산업용 유통상:</strong> 재고를 보유해 공장과 공장을 서비스하며, 마진 15–25%</li>
  <li><strong>독점 대리점:</strong> 드물며, 대량 구매 약정과 전국 커버리지가 필요</li>
  <li><strong>B2B 전자상거래:</strong> 플랫폼 예: Coupang Business, Amazon Business — 소량 주문에 적합</li>
</ul>
<p>墨泰는 수입업체와 대형 유통상과 직접 거래합니다. 구매자가 원할 경우 국내 대리점을 통한 협력도 가능합니다.</p>`;
}

function buildPaymentTerms(gccCountry: typeof gccCountries[0] | undefined): string {
  if (!gccCountry || gccCountry.code === 'general-gcc') return '';
  return `
<h3>${gccCountry.name} 결제 조건 및 통용 통화</h3>
<table class="spec-table">
  <thead><tr><th>방식</th><th>보편성</th><th>비고</th></tr></thead>
  <tbody>
    <tr><td>신용장(L/C) · documentary</td><td>가장 안전</td><td>$50k 초과 주문 시 필요, 은행이 수용</td></tr>
    <tr><td>T/T 선불 30%</td><td>보편적</td><td>잔여 70%는 출고 전 또는 서류 대금으로</td></tr>
    <tr><td>T/T 100% 선불</td><td>소량 주문용</td><td>$10k 미만, 절차 단순화</td></tr>
    <tr><td>청구 통화</td><td>USD</td><td>고정, 국내 통화 변동 리스크 회피</td></tr>
  </tbody>
</table>
<p>첫 주문과 대량 주문은 L/C를, 신뢰할 수 있는 파트너와의 반복 주문은 T/T를 권장합니다.</p>`;
}

function buildMarketContext(topic: TopicSpec, industry: typeof industries[0] | undefined, gccCountry: typeof gccCountries[0] | undefined): string {
  const industryName = industry?.name || '';
  const countryName = gccCountry?.name || '한국';
  return `
<h3>${industryName} 산업의 ${countryName} 시장 배경</h3>
<p>${countryName} 시장은 다음과 같은 요인으로 견인됩니다: 대규모 국책 인프라 프로젝트, 현지 제조업 확대, 수입 대체. 산업용 마감재 수요는 연 6–8% 성장 중입니다.</p>`;
}

/**
 * 进口合规（地域寻源篇专用）：按目的国给出真实的监管机构与合规要点，
 * 替代原先误路由的 PPE 安全清单（该清单与进口法规主题无关，属灌水）。
 * 数据全部来自 prompts_ko.md 第 7 节限定的权威机构（SASO/ESMA/GSO/GSO 各国分支）。
 */
function buildImportCompliance(gccCountry: typeof gccCountries[0] | undefined): string {
  if (!gccCountry || gccCountry.code === 'general-gcc') return '';
  const info: Record<string, { regulator: string; cert: string; points: string[] }> = {
    'saudi-arabia': {
      regulator: 'KS 기준(한국 공업 표준) / KOSHA(한국산업안전보건공단) 안전 요건',
      cert: '적합증명서(CoC) · KS/KOSHA 요건 기반',
      points: [
        '출고 전 KS 기준에 대한 적합성 확인 및 제3기관 시험 성적서 첨부',
        '제품 라벨에 제조자, 규격, 그릿(입도), 안전 경고 문구를 반드시 표기',
        '원산지(COO) 및 로트별 분석증명서(COA)는 제조사 제공 문서로 대체',
      ],
    },
    'uae': {
      regulator: 'KS 기준(한국 공업 표준) / KOSHA(한국산업안전보건공단) 안전 요건',
      cert: '적합증명서(CoC) · KS/KOSHA 요건 기반',
      points: [
        'KS 기준 적합성과 KOSHA 안전 요건을 출고 전 확인',
        '제품 라벨은 한국어/영어 병기, KS 마크 및 수입자 정보 포함',
        '원산지(COO) 및 로트별 분석증명서(COA) 첨부',
      ],
    },
    'qatar': {
      regulator: 'KS 기준(한국 공업 표준) / KOSHA(한국산업안전보건공단) 안전 요건',
      cert: '적합증명서(CoC) · KS/KOSHA 요건 기반',
      points: [
        '산업용 제품은 KS 기준을 따른다. 통관은 적합증명서 필요',
        '원산지(COO)는 제3기관 공증, 분석증명서(COA)는 제조사 발급',
        '라벨은 한국어 또는 한영 병기, 배치 번호(Batch No.) 표기',
      ],
    },
    'kuwait': {
      regulator: 'KS 기준(한국 공업 표준) / KOSHA(한국산업안전보건공단) 안전 요건',
      cert: '적합증명서(CoC) · KS/KOSHA 요건 기반',
      points: [
        '통제 대상 제품은 출고 전 적합성 평가 절차 적용',
        '제3기관 시험 성적서와 공증된 원산지(COO) 필요',
        '라벨은 한국어 표기와 수입자 정보 포함',
      ],
    },
    'bahrain': {
      regulator: 'KS 기준(한국 공업 표준) / KOSHA(한국산업안전보건공단) 안전 요건',
      cert: '적합증명서(CoC) · KS 기준',
      points: [
        '제품은 KS/GSO 상호인정 기준을 준수, 통관은 적합증명서 필요',
        '원산지(COO)와 제3기관 시험 성적서 필요',
        '라벨은 한국어 표기와 수입자 정보 포함',
      ],
    },
    'oman': {
      regulator: 'KS 기준(한국 공업 표준) / KOSHA(한국산업안전보건공단) 안전 요건',
      cert: '적합증명서(CoC) · KS 기준',
      points: [
        '통제 대상 제품은 출고 전 적합증명서 발급 필요',
        '원산지(COO)와 COA 첨부, 라벨은 한국어 표기',
        '수입 전 등록 시스템에 사전 등록',
      ],
    },
  };
  const inf = info[gccCountry.code];
  if (!inf) return '';
  return `
<h3>${gccCountry.name} 관할 기관 및 준수 요건</h3>
<p>관할 기관: <strong>${inf.regulator}</strong>. 필요 인증: <strong>${inf.cert}</strong>.</p>
<ul class="plain-links">
  ${inf.points.map(p => `<li>${p}</li>`).join('\n  ')}
</ul>
<p>墨泰는 로트마다 제조사 적합증명서(CoC)와 분석증명서(COA)를 제공합니다. <strong>최종 목적지 시장 준수는 수입자의 책임</strong>이며, 당사는 필요 서류 제공에 협력합니다.</p>`;
}

/**
 * 行业/市场篇的标准与合规解读：泛海湾版给出 GSO 统一框架，
 * 国家主版（qatar 等）给出该国监管机构的具体要求（复用地域寻源的合规数据）。
 */
function buildStandardsAnalysis(topic: TopicSpec, industry: typeof industries[0] | undefined, gccCountry: typeof gccCountries[0] | undefined): string {
  if (gccCountry && gccCountry.code !== 'general-gcc') {
    return buildImportCompliance(gccCountry);
  }
  return `
<h3>한국 시장 표준 프레임워크</h3>
<ul class="plain-links">
  <li><strong>KS 기준:</strong> 한국 공업 표준. 국내 제품 규격의 기준 프레임워크</li>
  <li><strong>KOSHA(한국산업안전보건공단) 안전 요건:</strong> 산업용 샌딩 작업의 안전 및 보건 기준</li>
  <li><strong>FEPA P:</strong> 국제 그릿(입도) 등급 체계, 국제 명세에서 표준으로 사용</li>
  <li><strong>ISO 6344:</strong> 연마 입자 크기 분석, 공급업체 간 정밀도 일관성 보장</li>
</ul>
<p>요약: 모든 명세에는 FEPA P + KS 기준을 사용하고, 계약 시 목적지 시장의 추가 요건을 명시하세요.</p>`;
}

function buildMarketData(topic: TopicSpec, industry: typeof industries[0] | undefined, gccCountry: typeof gccCountries[0] | undefined): string {
  return `
<h3>시장 데이터(일반 참고)</h3>
<ul class="plain-links">
  <li>연마재 시장: 산업 설비 보수와 마감 수요에 따라 안정적 성장</li>
  <li>연간 성장률(CAGR): 2023–2024 기준 5–8% 내외(출처별 편차 있음)</li>
  <li>최대 점유: 샌딩 벨트 및 샌딩 디스크(약 55%), 이어서 플랩 디스크(약 25%)</li>
  <li>주요 수입국: 일본, 독일, 이탈리아, 미국</li>
</ul>
<p><em>출처: Frost & Sullivan, Euromonitor 등 시장 보고서 기준 추정치이며 출처에 따라 차이가 있을 수 있습니다.</em></p>`;
}

function buildTechTrends(topic: TopicSpec, industry: typeof industries[0] | undefined, gccCountry: typeof gccCountries[0] | undefined): string {
  return buildMarketTrends(topic, industry, gccCountry);
}

function buildProcurementImplications(topic: TopicSpec, industry: typeof industries[0] | undefined, gccCountry: typeof gccCountries[0] | undefined): string {
  return `
<h3>구매 결정에 대한 시사점</h3>
<ul class="plain-links">
  <li>기준 강화 → 모든 배치에서 최신 적합증명서(CoC/COA)를 요구하세요</li>
  <li>고성능 입자 → 단위당 가격이 아닌 m²당 비용으로 계산</li>
  <li>자동화 → 명세에 치수 정밀도(허용 오차 ±0.5mm)를 명시</li>
  <li>지속가능성 → 재활용 가능한 베이스, 저방출 입자 여부 문의</li>
</ul>`;
}

function buildOEMOverview(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return buildOEMOptions(topic, model, productCat);
}

function buildPackagingSpecs(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return `
<h3>브랜드 포장 디자인 명세</h3>
<ul class="plain-links">
  <li><strong>파일:</strong> 벡터 로고(AI/SVG/EPS), 정밀 치수 포장 도안, 팬톤 색상 코드</li>
  <li><strong>언어:</strong> 한국어, 영어, 대상 시장 언어(고객 승인 텍스트)</li>
  <li><strong>인쇄:</strong> 플렉소/오프셋, 색상 수, 인쇄 면적, 절취선</li>
  <li><strong>바코드:</strong> GS1-128 또는 EAN-13, 제품 정보 CSV 파일</li>
  <li><strong>재질:</strong> 골판지(중량 용기), PE 파우치(개수용), 방수/내유 라벨</li>
</ul>`;
}

function buildMOQPricing(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return `
<h3>최소 주문 수량(MOQ) 및 단가 구간(참고용)</h3>
<table class="spec-table">
  <thead><tr><th>제품 유형</th><th>기본 MOQ</th><th>OEM 포함 MOQ</th><th>대표 수량 구간</th></tr></thead>
  <tbody>
    <tr><td>샌딩 벨트</td><td>500–1000개</td><td>2000–5000개</td><td>1000 / 5000 / 10000 / 50000</td></tr>
    <tr><td>샌딩 디스크</td><td>2000–5000개</td><td>5000–10000개</td><td>5000 / 10000 / 50000 / 100000</td></tr>
    <tr><td>플랩 디스크</td><td>1000–2000개</td><td>3000–5000개</td><td>2000 / 5000 / 10000 / 20000</td></tr>
    <tr><td>샌딩 스펀지</td><td>3000–5000개</td><td>5000–10000개</td><td>5000 / 10000 / 20000 / 50000</td></tr>
  </tbody>
</table>
<p><em>위 수치는 참고용입니다. 최종 MOQ는 규격, 그릿(입도), 커스텀 여부, 포장에 따라 결정됩니다. 정확한 견적을 요청하세요.</em></p>`;
}

function buildSampleApproval(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return `
<h3>샘플 확정 프로세스</h3>
<ol class="numbered-list">
  <li>고객은 로고/포장 파일 + 전체 제품 명세 제출</li>
  <li>당사는 10–15영업일 내 1차 샘플(5–10개) 제작</li>
  <li>고객 검수: 치수, 인쇄, 색상, 샌딩 품질, 포장</li>
  <li>수정 사항이 있으면 5–7일 내 2차 샘플</li>
  <li>"샘플 승인서" 서명 → 대량 생산 착수</li>
  <li>생산 리드타임: 수량과 복잡도에 따라 견적으로 확정</li>
</ol>
<p>수용 기준: 기술 명세와 ± 허용 오차 범위 일치, 인쇄 품질 양호, 육안상 결함 없음.</p>`;
}

function buildQAStandards(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return `
<h3>품질 검사 및 입고 기준</h3>
<table class="spec-table">
  <thead><tr><th>검사 기준</th><th>시험 방법</th><th>수용 기준</th></tr></thead>
  <tbody>
    <tr><td>치수</td><td>측정자/마이크로미터, 무작위 5% 샘플</td><td>명세의 허용 오차 ± 이내</td></tr>
    <tr><td>그릿(입도)</td><td>입자 분석기(FEPA P) 또는 공인 기준</td><td>표시 등급의 FEPA 범위 내</td></tr>
    <tr><td>표면 외관</td><td>1000럭스 조명 하 육안 검사</td><td>긱, 기포, 오염 없음</td></tr>
    <tr><td>결합 강도</td><td>표준 인장/박리 시험</td><td>명세 최소값 이상</td></tr>
    <tr><td>인쇄/포장</td><td>승인 샘플과 일치 확인</td><td>100% 일치</td></tr>
  </tbody>
</table>`;
}

function buildLogisticsCustoms(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return `
<h3>물류 및 관세 조율</h3>
<ul class="plain-links">
  <li><strong>해운:</strong> FCL(컨테이너 풀 로드), LCL(부분 로드). 항구: 닝보/상하이 → 한국 주요 항구(부산/인천)</li>
  <li><strong>서류:</strong> 선하증권(B/L), 상용 송장, 선적 목록, 원산지 증명, CoC, COA, 국내 적합증명</li>
  <li><strong>통관:</strong> 구매자 지정 포워더가 담당. 당사는 선박 도착 7일 전까지 모든 서류를 제공합니다</li>
  <li><strong>보험:</strong> CIF: 구매자 보험 가입. CFR/FOB: 당사는 항구까지 보험 처리. 종합보험을 권장합니다</li>
  <li><strong>최종 인도:</strong> INCOTERMS 협의에 따라 구매자 창고 또는 도착 항구까지</li>
</ul>`;
}

function buildPartnershipFramework(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return `
<h3>장기 협력 제안 프레임워크</h3>
<ul class="plain-links">
  <li><strong>기본 약정(프레임 계약):</strong> 1–3년, 예상 수량, 반년 단위로 단가 재조정</li>
  <li><strong>주문 계획:</strong> 8주 전 분기별 전망, 4주 전 확정 주문</li>
  <li><strong>안전 재고:</strong> 2–4주 사용량을 즉시 출고 가능한 재고로 확보</li>
  <li><strong>성과 리뷰:</strong> 분기별: OTIF(기일 입고률), 품질, 응답성, 혁신</li>
  <li><strong>공동 개발:</strong> 신제품, 명세 개선, 재료 시험</li>
</ul>`;
}

function buildPainPoints(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined, industry: typeof industries[0] | undefined): string {
  const industryName = industry?.name || '';
  // 行业痛点优先用 site.ts 已验证的 challenges；无数据行业回落通用痛点
  const painItems = industry?.challenges?.length
    ? industry.challenges.map(ch => `<li><strong>${ch}:</strong> ${model?.name || productCat?.name || t(topic.productFamily)}의 통합 그릿 진행 순서와 기준 샘플 제공 → 결과 일관성 확보 및 재작업 감소</li>`)
    : [
        '<li><strong>마감 품질 편차:</strong> 통합 그릿 진행 순서 + 기준 샘플 → 배치 간 일관성 확보</li>',
        '<li><strong>기기 잦은 정지:</strong> 수명이 긴 벨트/디스크 + 예방 정비 → 가동률 향상</li>',
        '<li><strong>그릿 선택 오류:</strong> 진행 순서 가이드 + 기술 상담 → 최초 올바른 결정</li>',
        '<li><strong>단위당 비용 과대:</strong> TCO 계산(가격 + 수명 + 다운타임) → 실질적 경제 결정</li>',
      ];
  return `
<h3>${industryName}의 핵심 과제 및 ${model?.name || productCat?.name || t(topic.productFamily)} 해결책</h3>
<ul class="plain-links">
  ${painItems.join('\n  ')}
</ul>`;
}

function buildProductCombo(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined, industry: typeof industries[0] | undefined): string {
  return buildApplicationSection(topic, model, productCat, industry, undefined);
}

function buildProcessParams(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return `
<h3>추천 작업 파라미터 설정</h3>
<table class="spec-table">
  <thead><tr><th>파라미터</th><th>추천 범위</th><th>주의</th></tr></thead>
  <tbody>
    <tr><td>속도(벨트)</td><td>15–30 m/s</td><td>제품 한계 초과 금지</td></tr>
    <tr><td>속도(디스크)</td><td>디스크 지름 및 기기 RPM에 따라</td><td>라벨 확인</td></tr>
    <tr><td>압력</td><td>0.5–2 N/cm²</td><td>과압 = 마모 + 발열</td></tr>
    <tr><td>이송 속도</td><td>3–8 m/min</td><td>재료와 목적에 따라</td></tr>
  </tbody>
</table>`;
}

function buildSampleEvaluation(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return `
<h3>샘플 평가 카드</h3>
<table class="spec-table">
  <thead><tr><th>항목</th><th>가중치</th><th>평가 방법</th><th>목표 등급</th></tr></thead>
  <tbody>
    <tr><td>기술 명세 일치</td><td>30%</td><td>치수, 그릿(입도), 재료 측정</td><td>100% 일치</td></tr>
    <tr><td>절삭/마감 성능</td><td>25%</td><td>대표 부품에 대한 시험</td><td>기준값 이상</td></tr>
    <tr><td>수명</td><td>20%</td><td>완전 마모까지 가동 테스트</td><td>기준 수명의 90% 이상</td></tr>
    <tr><td>배치 일관성</td><td>15%</td><td>서로 다른 위치의 5개 샘플 검사</td><td>CV ≤ 5%</td></tr>
    <tr><td>포장/라벨</td><td>10%</td><td>육안 검사, 바코드 스캔</td><td>오류 0건</td></tr>
  </tbody>
</table>`;
}

function buildSupplierMatrix(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return `
<h3>공급업체 평가 매트릭스</h3>
<table class="spec-table">
  <thead><tr><th>항목</th><th>가중치</th><th>평가 출처</th></tr></thead>
  <tbody>
    <tr><td>총괄 가격(CIF/CFR)</td><td>25%</td><td>공식 견적서</td></tr>
    <tr><td>품질(결함율, 일관성)</td><td>25%</td><td>샘플, 실적이력, 인증서</td></tr>
    <tr><td>납기 및 신뢰성(OTIF)</td><td>20%</td><td>과거 기록, 실적이력</td></tr>
    <tr><td>OEM/커스텀 유연성</td><td>10%</td><td>제조 역량, 기존 사례</td></tr>
    <tr><td>인증 및 준수</td><td>10%</td><td>ISO 9001, CoC, COA, 국내 요건</td></tr>
    <tr><td>기술 지원 및 서비스</td><td>10%</td><td>대응 속도, 전문성, 소통 언어</td></tr>
  </tbody>
</table>`;
}

function buildQuoteComparison(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return `
<h3>견적 비교 핵심 포인트</h3>
<ul class="plain-links">
  <li><strong>기본 단가:</strong> 개당 가격, 협의 통화, 포장 포함 여부</li>
  <li><strong>운송 및 보험:</strong> CIF(항구까지), CFR, FOB 또는 EXW — 동일한 기준으로 비교</li>
  <li><strong>결제 조건:</strong> L/C, T/T, 선불 비율, 기한, 청구 통화</li>
  <li><strong>납기:</strong> 명세/샘플 승인부터 항구/창고 인도까지</li>
  <li><strong>최소 주문 수량:</strong> 제품/그릿별 MOQ, 품목 혼합 유연성</li>
  <li><strong>보증 및 품질:</strong> 반품 정책, 불량 배치 교환, 출하 시 인증서</li>
  <li><strong>OEM 지원:</strong> 금형 비용, 인쇄 플레이트, 커스텀 최소 수량</li>
</ul>`;
}

function buildContractTerms(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return `
<h3>계약 기본 조항 및 인도 조건</h3>
<ul class="plain-links">
  <li><strong>INCOTERMS:</strong> 명확히 지정(CIF, CFR, FOB, EXW) — 운송 및 보험 책임 범위 확정</li>
  <li><strong>인도 일정:</strong> 날짜/월별, 배치별 수량, ±10% 유연성</li>
  <li><strong>결제 조건:</strong> 인출불가능 L/C, T/T 30/70, 통화, 수익자 은행</li>
  <li><strong>품질 검사:</strong> 출고 전(공장에서) 및/또는 입고 시, 수용 기준, 거절 절차</li>
  <li><strong>지연 페널티:</strong> 1주당 배치 금액의 0.5–1%, 상한 5–10%</li>
  <li><strong>부득정 사태:</strong> 정의, 통보, 기한 연장, 해지권</li>
  <li><strong>비밀유지/지식재산:</strong> 도면, 로고, 명세 — 고객 소유, 제3자 비공개</li>
  <li><strong>준거법 및 관할:</strong> 중국/구매자 국 법, 중재(CIETAC / 국내)</li>
</ul>`;
}

function buildCommonMistakes(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  const productName = model?.name || productCat?.name || t(topic.productFamily);
  return `
<h3>자주 발생하는 오류와 방지 방법</h3>
<table class="spec-table">
  <thead><tr><th>오류</th><th>결과</th><th>정확한 방법</th></tr></thead>
  <tbody>
    <tr><td>작업 단계가 아닌 직감으로 그릿(입도)을 선택</td><td>제거 지연 또는 깊은 긱</td><td>진행 순서 준수: 거친 → 중간 → 곱은</td></tr>
    <tr><td>기기 호환성(규격/고정 방식) 무시</td><td>장착 불가 또는 기기 손상</td><td>주문 전 기기 모델과 연결 방식 제공</td></tr>
    <tr><td>"빨리 끝내려" 과도한 압력</td><td>마모 가속, 발열, 부품 변형</td><td>입자가 일하도록, 적절한 압력을 일정하게</td></tr>
    <tr><td>분진 흡입 소홀</td><td>막힘(로딩), 수명 단축, 불량한 작업 환경</td><td>매일 필터 청소, 공기 흐름 확인</td></tr>
    <tr><td>그릿 표준 혼용(FEPA/ANSI/JIS)</td><td>배치 간 등급 불일치</td><td>모든 명세에서 단일 표준(FEPA P) 준수</td></tr>
    <tr><td>샘플 없이 대량 주문</td><td>품질/치수 불일치 리스크</td><td>샘플 먼저 주문하고 검수 후 승인, 그다음 대량 주문</td></tr>
    <tr><td>OEM/포장을 늦게 지정</td><td>생산 지연, 수정 비용 증가</td><td>최초 RFQ에 브랜드 파일 첨부</td></tr>
  </tbody>
</table>`;
}

function buildProductPositioning(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  const productName = model?.name || productCat?.name || t(topic.productFamily);
  return `
<h3>${productName} 기본 포지셔닝</h3>
<p>${model?.summary || productCat?.description || '표면 마감을 위한 산업용 연마재. 재료 제거, 평탄화, 최종 마무리용. 목재 및 금속 적용에 설계됨.'}</p>
<p><strong>이상적 적용 사례:</strong> ${model?.useCases?.join(', ') || getMainApplication(topic.productFamily)}</p>
<p><strong>한계:</strong> ${model?.notes?.join('; ') || '정확한 기기 명세 필요, 중요 적용은 샘플 검증 권장.'}</p>`;
}

function buildFullSpecsTable(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return buildSpecsSection(topic, model, productCat);
}

function buildDesignPrinciples(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return `
<h3>디자인 원리 및 성능 특성</h3>
<ul class="plain-links">
  <li><strong>입자:</strong> ${getGrainTypes(topic.productFamily).join(' / ')} — 재료 경도와 제거율에 따라 선택</li>
  <li><strong>베이스:</strong> ${model?.backing || '천/지/수지'} — 곡면에 유연성, 평면에 치수 안정성을 균형</li>
  <li><strong>결합재:</strong> 내열성 수지(Resin) — 고강도 절삭 하중 하에 입자 유지</li>
  <li><strong>구조:</strong> ${topic.productFamily === 'abrasive-belts' ? '연결 방식(직선/비스듬/겹침) 벨트' : '일반/개구/메시 디스크'} — 균일한 압력 분포 설계</li>
</ul>`;
}

function buildCompatibilityGuide(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return buildCompatibilityChecklist(topic, model, productCat);
}

function buildCustomizationOptions(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return buildOEMOptions(topic, model, productCat);
}

function buildOrderingInfo(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return `
<h3>주문 정보: MOQ, 납기, 포장</h3>
<table class="spec-table">
  <thead><tr><th>항목</th><th>상세</th></tr></thead>
  <tbody>
    <tr><td>MOQ</td><td>규격, 그릿(입도), 커스텀에 따라 결정(도매/OEM 섹션 참조)</td></tr>
    <tr><td>생산 리드타임</td><td>명세 및 승인 샘플 확정 후 견적으로</td></tr>
    <tr><td>해운</td><td>한국 항구까지 25–35일</td></tr>
    <tr><td>기본 포장</td><td>골판지 상자, 개수/롤 단위, 규격 라벨</td></tr>
    <tr><td>OEM 포장</td><td>고객 승인에 따라, 별도 비용, 리드타임 +5–7일</td></tr>
    <tr><td>출하 시 인증서</td><td>기본 CoC, COA는 주문 시, KS 기준에 따라</td></tr>
  </tbody>
</table>`;
}

function buildTop3FAQ(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  const productName = model?.name || productCat?.name || t(topic.productFamily);
  return `
<h3>상위 3개 질문 - 간결한 답변</h3>
<dl class="faq-list">
  <dt>${productName}에 맞는 그릿(입도)은 어떻게 선택하나요?</dt>
  <dd>작업 단계에 따라 결정: 제거 40–80, 마감 100–180, 최종 240 이상. 재료가 입자 종류를 결정합니다.</dd>
  <dt>최소 주문 수량(MOQ)은 얼마인가요?</dt>
  <dd>명세에 따라 결정: 표준 제품은 낮고, OEM/커스텀은 높습니다. 정확한 수량은 견적으로 확인하세요.</dd>
  <dt>총 납기(리드타임)는 얼마나 걸리나요?</dt>
  <dd>명세 및 샘플 확정 후 견적으로 결정: 생산 기간 + 운송(해운 또는 항공) + 배송지. 정확한 수치는 견적에 포함됩니다.</dd>
</dl>`;
}

function buildDecisionReferenceTable(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return buildDecisionGuide(topic, model, productCat, undefined);
}

// ========== 各类内容构建函数 ==========

// 对比表 B 列（替代产品）的真实规格，取自同站 site.ts 产品族数据，避免「未指定」占位行
function altSize(familySlug: string): string {
  const alt = { 'abrasive-belts': 'sanding-discs', 'flap-discs': 'abrasive-belts', 'sanding-discs': 'abrasive-belts', 'hook-loop': 'sanding-discs', 'sanding-sponges': 'sanding-discs' }[familySlug] || 'sanding-discs';
  const cat = productCategories.find(c => c.slug === alt);
  const dim = cat?.specs?.find(s => /규격|지름|치수/i.test(s[0]))?.[1];
  return dim || '다수 규격';
}
function altBacking(familySlug: string): string {
  const alt = { 'abrasive-belts': 'sanding-discs', 'flap-discs': 'abrasive-belts', 'sanding-discs': 'abrasive-belts', 'hook-loop': 'sanding-discs', 'sanding-sponges': 'sanding-discs' }[familySlug] || 'sanding-discs';
  const cat = productCategories.find(c => c.slug === alt);
  return cat?.specs?.find(s => /베이스|유형/i.test(s[0]))?.[1] || '제품에 따라';
}
function altAttachment(familySlug: string): string {
  const alt = { 'abrasive-belts': 'sanding-discs', 'flap-discs': 'abrasive-belts', 'sanding-discs': 'abrasive-belts', 'hook-loop': 'sanding-discs', 'sanding-sponges': 'sanding-discs' }[familySlug] || 'sanding-discs';
  if (alt === 'sanding-discs') return 'Hook & Loop / PSA / 메시';
  if (alt === 'abrasive-belts') return '연결 방식은 기기에 따라';
  return '제품에 따라';
}
function altGritRange(familySlug: string): string {
  const alt = { 'abrasive-belts': 'sanding-discs', 'flap-discs': 'abrasive-belts', 'sanding-discs': 'abrasive-belts', 'hook-loop': 'sanding-discs', 'sanding-sponges': 'sanding-discs' }[familySlug] || 'sanding-discs';
  const cat = productCategories.find(c => c.slug === alt);
  const g = cat?.specs?.find(s => /그릿|입도/i.test(s[0]))?.[1];
  return g || '주문에 따라';
}
function getAltApplication(familySlug: string): string {
  const alt = { 'abrasive-belts': 'sanding-discs', 'flap-discs': 'abrasive-belts', 'sanding-discs': 'abrasive-belts', 'hook-loop': 'sanding-discs', 'sanding-sponges': 'sanding-discs' }[familySlug] || 'sanding-discs';
  const cat = productCategories.find(c => c.slug === alt);
  return cat?.applications?.join(', ') || '보조 적용';
}

function buildComparisonTable(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  const productName = model?.name || productCat?.name || getProductFamilyNameAr(topic.productFamily);
  const altProduct = topic.articleType === 'product-comparison' ? getAlternativeProduct(topic.productFamily) : productName;

  return `
<table class="spec-table">
  <thead>
    <tr><th>항목</th><th>${productName}</th><th>${altProduct}</th><th>비고</th></tr>
  </thead>
  <tbody>
    <tr><td>유형</td><td>${productName}</td><td>${altProduct}</td><td>형상 및 용도 차이</td></tr>
    <tr><td>대표 규격</td><td>${model?.sizeAr || '다수 규격'}</td><td>${altSize(topic.productFamily)}</td><td>기기에 따라 선택</td></tr>
    <tr><td>그릿(입도) 범위</td><td>${model?.gritRange.join(' – ') || '40–800'}</td><td>${altGritRange(topic.productFamily)}</td><td>작업 단계에 따라</td></tr>
    <tr><td>베이스</td><td>${model?.backing || '천/지/수지'}</td><td>${altBacking(topic.productFamily)}</td><td>유연성 대 안정성</td></tr>
    <tr><td>고정 방식</td><td>${model?.attachment || '기기에 따라'}</td><td>${altAttachment(topic.productFamily)}</td><td>기기 호환성이 핵심</td></tr>
    <tr><td>주요 용도</td><td>${getMainApplication(topic.productFamily)}</td><td>${getAltApplication(topic.productFamily)}</td><td>일부 단계에서 중첩</td></tr>
    <tr><td>최소 주문 수량(MOQ)</td><td>견적으로 결정</td><td>견적으로 결정</td><td>커스텀 및 포장에 따라</td></tr>
  </tbody>
</table>

<p>결정: 기기가 벨트/디스크와 호환되고 면적이 충분할 때는 ${productName}을 선택하세요. 좁은 공간이나 기기 호환이 안 되는 경우라면 ${altProduct}.</p>`;
}

function buildDecisionGuide(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined, industry: typeof industries[0] | undefined): string {
  const productName = model?.name || productCat?.name || getProductFamilyNameAr(topic.productFamily);
  const industryName = industry?.name || '';

  return `
<div class="decision-flow">
  <h3>확정 단계(3단계)</h3>
  <ol class="numbered-list">
    <li><strong>가공 재료:</strong> ${getWorkpieceMaterials(topic.industry).join(' / ')}</li>
    <li><strong>작업 단계:</strong> 제거(그릿 40–80) → 중간 마감(100–180) → 최종 마무리(240–400+)</li>
    <li><strong>기기 호환성:</strong> 벨트/디스크 규격, 고정 방식(Hook & Loop / PSA / 메시), 회전 방향</li>
  </ol>

  <h3>신속 선택 매트릭스</h3>
  <table class="spec-table">
    <thead><tr><td>재료</td><td>단계</td><td>추천 그릿</td><td>권장 유형</td></tr></thead>
    <tbody>
      <tr><td>연질 목재</td><td>제거</td><td>60–80</td><td>${productName}</td></tr>
      <tr><td>경질 목재</td><td>마감</td><td>120–180</td><td>${productName}</td></tr>
      <tr><td>강철/스테인리스</td><td>녹 제거</td><td>40–60</td><td>${productName} (지르코니아/세라믹 입자)</td></tr>
      <tr><td>알루미늄</td><td>표면 보정</td><td>180–240</td><td>${productName} (알루미나)</td></tr>
      <tr><td>기존 코팅 제거</td><td>제거</td><td>80–100</td><td>${productName}</td></tr>
    </tbody>
  </table>
</div>`;
}

function buildSpecsSection(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  const productName = model?.name || productCat?.name || getProductFamilyNameAr(topic.productFamily);

  return `
<h3>기준 명세</h3>
<p>그릿(입도) 등급은 <strong>FEPA P</strong>(유럽식)를 따르며, 이는 국제 표준입니다. ANSI(미국)·JIS(일본) 대응값은 존재하지만, 하나의 명세 안에서 서로 혼용하지 마세요.</p>

<h3>전체 명세표</h3>
<table class="spec-table">
  <thead><tr><th>항목</th><th>값 / 범위</th><th>비고</th></tr></thead>
  <tbody>
    <tr><td>제품</td><td>${productName}</td><td></td></tr>
    <tr><td>규격</td><td>${model?.sizeAr || productCat?.specs?.find(s => /규격|지름|치수|형태/i.test(s[0]))?.[1] || '다수 규격'}</td><td>mm 단위로 정확히 명시</td></tr>
    <tr><td>그릿(입도) 범위</td><td>${model?.gritRange.join(', ') || '주문에 따라'}</td><td>FEPA P 표준</td></tr>
    <tr><td>입자 종류</td><td>${getGrainTypes(topic.productFamily).join(' / ')}</td><td>재료에 따라 선택</td></tr>
    <tr><td>베이스(Backing)</td><td>${model?.backing || '천, 지 또는 수지'}</td><td>유연성, 안정성, 내습성</td></tr>
    <tr><td>결합재(Bond)</td><td>수지 결합재(Resin)</td><td>고온 저항성</td></tr>
    <tr><td>고정 방식</td><td>${model?.attachment || 'Hook & Loop / PSA / 메시'}</td><td>기기와 일치해야 함</td></tr>
    <tr><td>최대 회전 속도</td><td>제품 라벨 기준</td><td>기기 RPM 초과 금지</td></tr>
    <tr><td>안전</td><td>PPE 필수, 분진 흡입</td><td>KOSHA 안전 요건 준수</td></tr>
  </tbody>
</table>`;
}

function buildApplicationSection(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined, industry: typeof industries[0] | undefined, gccCountry: typeof gccCountries[0] | undefined): string {
  const productName = model?.name || productCat?.name || getProductFamilyNameAr(topic.productFamily);
  const industryName = industry?.name || '';
  const countryName = gccCountry?.name || '';

  return `
<h3>${industryName}${countryName ? ` (${countryName})` : ''} 작업 흐름</h3>
<ol class="numbered-list">
  <li><strong>준비:</strong> 표면 청소, 녹/기존 코팅 제거, 결함 검사</li>
  <li><strong>빠른 제거:</strong> ${productName}, 그릿 40–80, 중간 압력, 권장 속도</li>
  <li><strong>중간 평탄화:</strong> 그릿 100–180, 압력 완화, 교차 패스</li>
  <li><strong>최종 마감:</strong> 그릿 240–400(도장 시 이상), 균일한 움직임</li>
  <li><strong>세척 및 검수:</strong> 분진 제거, 표면 거칠기(Ra/Rz) 검사, 다음 단계 준비</li>
</ol>

<h3>추천 그릿 진행 순서</h3>
<table class="spec-table">
  <thead><tr><th>단계</th><th>그릿</th><th>목표</th><th>비고</th></tr></thead>
  <tbody>
    <tr><td>재료/녹/코팅 제거</td><td>40 – 80</td><td>고생산성</td><td>금속은 지르코니아/세라믹</td></tr>
    <tr><td>중간 마감</td><td>100 – 180</td><td>전 단계 잔여 흔적 평탄화</td><td>보편적 알루미나</td></tr>
    <tr><td>세부 마감</td><td>240 – 400</td><td>도장/코팅 준비</td><td>과도한 광택 방지</td></tr>
    <tr><td>최종 마무리</td><td>600 – 1500+</td><td>노출 표면/정밀 부위</td><td>가구, 자동차, 정밀용</td></tr>
  </tbody>
</table>
${gccCountry?.industrialClusters?.length ? `
<h3>${countryName} 수요 집중 지역</h3>
<p>${countryName}의 산업 수요는 주로 다음 지역에 집중됩니다: ${gccCountry.industrialClusters.join(', ')}. 수량과 납기일 조율은 이 지역들에 가장 가까운 항구 기준으로 하며, 각 지점의 보관 조건을 고려합니다.</p>` : ''}`;
}

function buildProcessSteps(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined, industry: typeof industries[0] | undefined): string {
  const productName = model?.name || productCat?.name || t(topic.productFamily);
  const industryName = industry?.name || '';

  return `
<h3>표준 작업 절차(SOP) - ${industryName}</h3>
<ol class="numbered-list">
  <li><strong>기기 점검:</strong> 롤러 상태, 회전 방향, 고정 패드 상태, 흡입 시스템</li>
  <li><strong>${productName} 장착:</strong> 규격 일치, 올바른 고정, 벨트/디스크 정렬 확인</li>
  <li><strong>무부하 가동 시험:</strong> 30초, 진동/소음/이탈 감시</li>
  <li><strong>파라미터 조정:</strong> 속도(RPM), 압력(N/cm²), 이송 속도(m/min)</li>
  <li><strong>순차 샌딩:</strong> 그릿 표에 따르고, 단계마다 표면 세척</li>
  <li><strong>품질 관리:</strong> 육안 검사 + 50개 또는 배치별 거칠기 측정</li>
  <li><strong>그릿 교체:</strong> 기기 정지, 기존 제품 제거, 베이스 세척, 신규 고정, 시험 가동</li>
  <li><strong>종료 및 정리:</strong> ${productName} 제거, 기기 세척, 건조한 곳 보관</li>
</ol>

<h3>표준 작업 파라미터</h3>
<table class="spec-table">
  <thead><tr><th>파라미터</th><th>추천 범위</th><th>주의</th></tr></thead>
  <tbody>
    <tr><td>속도(벨트)</td><td>15–30 m/s</td><td>제품 한계 초과 금지</td></tr>
    <tr><td>속도(디스크)</td><td>디스크 지름 및 기기 RPM에 따라</td><td>라벨 확인</td></tr>
    <tr><td>압력</td><td>0.5–2 N/cm²</td><td>과압 = 마모 + 발열</td></tr>
    <tr><td>이송 속도</td><td>3–8 m/min</td><td>재료와 목적에 따라</td></tr>
  </tbody>
</table>`;
}

function buildSafetyCompliance(topic: TopicSpec, industry: typeof industries[0] | undefined, gccCountry: typeof gccCountries[0] | undefined): string {
  const countryName = gccCountry?.name || '';
  const countryCode = gccCountry?.code || '';

  let standards = 'FEPA, ISO 6344, ISO 15636, OSHA 1910.215, NIOSH, KOSHA';

  return `
<h3>안전 요건(보호장구 필수)</h3>
<ul class="plain-links">
  <li>방호 안경/페이스 실드(EN 166 / ANSI Z87.1)</li>
  <li>호흡용 마스크(N95 / FFP2 이상, 가는 분진은 강화)</li>
  <li>절단 방지 장갑(EN 388)</li>
  <li>소음 차단 귀마개(EN 352) — 소음이 큰 기기의 경우</li>
  <li>긴 소매 작업복, 주얼리 금지, 긴 머리 고정</li>
</ul>

<h3>분진 흡입 및 환기</h3>
<ul class="plain-links">
  <li>기기마다 중앙 또는 국소 배출장치</li>
  <li>가는 분진(특히 세라믹/지르코니아)은 HEPA 필터링</li>
  <li>공기 교체율: 샌딩 작업장에서 시간당 6회 이상</li>
</ul>

<h3>한계 속도 및 준수</h3>
<ul class="plain-links">
  <li>제품에 표기된 <strong>최대 RPM</strong> 초과 금지</li>
  <li>사용 전 제품 상태 확인: 균열, 손상, 불균일 마모</li>
  <li>적용 기준: ${standards}</li>
  ${countryCode !== 'general-gcc' ? `<li><strong>주의:</strong> ${countryName}에서는 추가 요건이 적용될 수 있습니다. 작동 전 관할 기관(${getLocalRegulator(countryCode)})에 확인하세요.</li>` : ''}
</ul>

<p class="disclaimer">위 정보는 참고용입니다. 최종 기준은 제품 라벨, 기술 데이터시트, 기기 매뉴얼, 그리고 현행 국내 규정입니다.</p>`;
}

function buildCostOptimization(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  const productName = model?.name || productCat?.name || getProductFamilyNameAr(topic.productFamily);

  return `
<h3>총 유지비용(TCO) 통제 포인트</h3>
<table class="spec-table">
  <thead><tr><th>요인</th><th>비용 영향</th><th>최적화 조치</th></tr></thead>
  <tbody>
    <tr><td>올바른 그릿(입도) 선택</td><td>재작업 방지 + 수명 연장</td><td>대량 주문 전 2–3등급 테스트</td></tr>
    <tr><td>입자 종류</td><td>세라믹/지르코니아는 단가 높지만 수명 2–3배</td><td>개당 단가가 아닌 m²당 비용으로 계산</td></tr>
    <tr><td>적합한 베이스</td><td>유연한 천 베이스 = 곡면에서 파손 감소</td><td>베이스를 부품 형상에 맞게</td></tr>
    <tr><td>흡입 시스템</td><td>막힘 감소 → 수명 30–50% 연장</td><td>효과적인 흡입에 투자</td></tr>
    <tr><td>예방 정비</td><td>깔끔한 롤러 = 직진 벨트 = 균일 마모</td><td>일일/주별 청소 스케줄</td></tr>
    <tr><td>수량 및 포장</td><td>대량 주문 = 개당 단가 인하 + 운송 효율화</td><td>월별/분기별 주문 통합</td></tr>
  </tbody>
</table>

<p>권장: 실제 비교를 위해 <strong>단계별 견적</strong>(수량 100, 500, 1000, 5000개)을 요청하세요.</p>`;
}

function buildProcurementTemplate(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  const gccCountryName = () => {
    const c = gccCountries.find(g => g.code === topic.gccCountry);
    return c && c.code !== 'general-gcc' ? `${c.industrialClusters[0]} (${c.name})` : '';
  };
  const productName = model?.name || productCat?.name || getProductFamilyNameAr(topic.productFamily);

  return `
<h3>견적 요청(RFQ) 명세 템플릿 - ${productName}</h3>
<p>표를 복사하고 항목을 채운 뒤, 문의 서식에서 제출하세요.</p>

<table class="spec-table">
  <thead><tr><th>항목</th><th>예 / 형식</th><th>필수?</th></tr></thead>
  <tbody>
    <tr><td>제품명 / 제품군</td><td>${productName}</td><td>예</td></tr>
    <tr><td>규격(mm / 인치)</td><td>${model?.sizeAr || '533 × 75 mm / 5인치'}</td><td>예</td></tr>
    <tr><td>그릿(입도) 등급(FEPA)</td><td>${model?.gritRange?.slice(0, 3).join(', ') || '80, 120, 240'}</td><td>예</td></tr>
    <tr><td>입자 종류</td><td>알루미나 / 지르코니아 / 세라믹</td><td>권장</td></tr>
    <tr><td>베이스</td><td>천 X / 지 Y / 수지 Z</td><td>권장</td></tr>
    <tr><td>고정 방식</td><td>Hook & Loop / PSA / 메시</td><td>예</td></tr>
    <tr><td>예상 수량</td><td>월 5000개</td><td>예</td></tr>
    <tr><td>주문 주기</td><td>월간 / 분기별 / 연간</td><td>권장</td></tr>
    <tr><td>용도 / 가공 재료</td><td>스테인리스강, 용접부 제거</td><td>예</td></tr>
    <tr><td>기기 모델</td><td>${model?.attachment || 'Timesavers 1300 / 표준 벨트 샌더'}</td><td>예</td></tr>
    <tr><td>연결 방식(벨트용)</td><td>직선 / 비스듬 / 겹침</td><td>벨트만 해당</td></tr>
    <tr><td>포장</td><td>상자 / 롤 / 맞춤형 패키지</td><td>권장</td></tr>
    <tr><td>OEM / 브랜드</td><td>예 / 아니오, 로고 파일 첨부</td><td>해당 시</td></tr>
    <tr><td>배송지(항구/도시)</td><td>${gccCountryName() || '부산 / 인천 / 광양'}</td><td>예</td></tr>
    <tr><td>결제 조건</td><td>L/C / T/T 선불 30%</td><td>권장</td></tr>
    <tr><td>필요 인증서</td><td>CoC / COA / KS</td><td>해당 시</td></tr>
  </tbody>
</table>`;
}

function buildOEMOptions(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  const productName = model?.name || productCat?.name || getProductFamilyNameAr(topic.productFamily);

  return `
<h3>OEM 옵션 매트릭스 - ${productName}</h3>
<table class="spec-table">
  <thead><tr><th>커스텀 항목</th><th>옵션</th><th>MOQ 영향</th><th>비고</th></tr></thead>
  <tbody>
    <tr><td>제품 로고</td><td>잉크 인쇄 / 레이저 / 음각</td><td>+10–20%</td><td>벡터 파일(AI/SVG/EPS) 필수</td></tr>
    <tr><td>색상</td><td>빨강(기본) / 파랑 / 초록 / 맞춤</td><td>+5–15%</td><td>팬톤 코드 필요</td></tr>
    <tr><td>외부 포장</td><td>갈색 상자 / 색상 / 인쇄</td><td>+0–10%</td><td>정밀 치수 포장 도안</td></tr>
    <tr><td>내부 포장</td><td>PE 파우치 / 개별 박스 / 롤</td><td>+0–5%</td><td>수량과 운송에 따라</td></tr>
    <tr><td>라벨/바코드</td><td>GS1 / 맞춤 / 없음</td><td>+0%</td><td>데이터 CSV 파일 제공</td></tr>
    <tr><td>포장 언어</td><td>한국어, 영어, 기타</td><td>+0%</td><td>고객 승인 텍스트</td></tr>
    <tr><td>커스텀 인증서</td><td>고객 정보 포함 CoC / 로트별 COA</td><td>로트당 +5%</td><td>계약으로 협의</td></tr>
  </tbody>
</table>

<h3>샘플 확정 프로세스</h3>
<ol class="numbered-list">
  <li>고객은 로고/포장 파일 + 제품 명세 제출</li>
  <li>당사는 10–15영업일 내 1차 샘플(5–10개) 제작</li>
  <li>고객 검수: 치수, 인쇄, 색상, 샌딩 품질</li>
  <li>수정 사항이 있으면 5–7일 내 2차 샘플</li>
  <li>"샘플 승인서" 서명 → 대량 생산 착수</li>
  <li>생산 리드타임: 수량과 복잡도에 따라 견적으로</li>
</ol>`;
}

function buildLogisticsPorts(gccCountry: typeof gccCountries[0] | undefined): string {
  if (!gccCountry || gccCountry.code === 'general-gcc') return '';

  const ports: Record<string, string[]> = {
    'saudi-arabia': ['제다(Jeddah Islamic)', '왕 아브둘라(달롬)', '얀부(Yanbu) 상업', '재잔(Jizan)'],
    'uae': ['자이드 알리(가장 크고 중요)', '자일 칼파(아부다비)', '알 아마리(샤르자)', '푸자이라'],
    'qatar': ['알 하마드(주요)', '도하 구항', '라스 라판(가스)'],
    'kuwait': ['알 쇼이크(주요)', '알 아흐마디(석유)', '도하(소형)'],
    'bahrain': ['할리파 빈 살만(주요)', '사트라(산업용)'],
    'oman': ['살랄레(주요/환적)', '사하르(산업용)', '두컴(신규)', '무스카트(구항)'],
  };

  const countryPorts = ports[gccCountry.code] || [];

  return `
<h3>${gccCountry.name} 주요 항구</h3>
<ul class="plain-links">
  ${countryPorts.map(p => `<li>${p}</li>`).join('')}
</ul>

<h3>해상 운송 예상 리드타임(중국 기준)</h3>
<table class="spec-table">
  <thead><tr><th>항구</th><th>항해 일수</th><th>통관 + 인도</th><th>총계</th></tr></thead>
  <tbody>
    ${countryPorts.map(p => `<tr><td>${p}</td><td>20–28</td><td>5–7</td><td>25–35</td></tr>`).join('')}
  </tbody>
</table>

<p><strong>항공 운송:</strong> 3–5일 + 통관 1–2일. 비용은 해운의 4–6배. 긴급 용도로만.</p>

<p><strong>필요 서류:</strong> 선하증권, 상용 송장, 선적 목록, 원산지 증명, 적합증명서(KS), 보험 증권.</p>`;
}

function buildMarketTrends(topic: TopicSpec, industry: typeof industries[0] | undefined, gccCountry: typeof gccCountries[0] | undefined): string {
  const industryName = industry?.name || '';
  const countryName = gccCountry?.name || '';

  return `
<h3>${industryName}의 시장 동인${countryName ? ` (${countryName})` : ''}</h3>
<ul class="plain-links">
  <li><strong>기준 갱신:</strong> FEPA P 2023, ISO 6344:2022가 그릿(입도) 정밀도를 더욱 강화</li>
  <li><strong>건강 및 안전:</strong> 호흡가능 분진 한계 강화, 보호장구(PPE) 필수화(KS/KOSHA 기준)</li>
  <li><strong>자동화:</strong> 로봇 샌딩 라인이 높은 치수 정밀도의 벨트/디스크를 필요로 함</li>
  <li><strong>지속가능성:</strong> 재활용 가능한 베이스, 저방출 입자에 대한 수요 증가</li>
</ul>

<h3>제품 트렌드</h3>
<table class="spec-table">
  <thead><tr><th>트렌드</th><th>구매 영향</th><th>대상 제품</th></tr></thead>
  <tbody>
    <tr><td>세라믹/지르코니아 입자</td><td>단가는 높지만 수명 2–3배, m²당 비용 절감</td><td>벨트, 디스크, 플랩 디스크</td></tr>
    <tr><td>내습성 수지 베이스</td><td>습한/해안 환경에서 치수 안정</td><td>대형 벨트, 디스크</td></tr>
    <tr><td>다중 개구 메시 디스크</td><td>흡입 향상, 막힘 감소, 균일한 마감</td><td>5/6인치 디스크</td></tr>
    <tr><td>개량 Hook & Loop 시스템</td><td>교체 속도 향상, 고정력 강화, 패드 수명 연장</td><td>모든 지름</td></tr>
  </tbody>
</table>

<p>권장: 장기 공급 계약 시 공급업체로부터 <strong>제품 로드맵</strong>을 요청해 구형 리스크를 방지하세요.</p>`;
}

function buildPreventiveMaintenance(topic: TopicSpec, model: typeof models[0] | null): string {
  return `
<h3>예방 정비 스케줄 - 샌딩 장비</h3>
<table class="spec-table">
  <thead><tr><th>주기</th><th>조치</th><th>도구/기준</th></tr></thead>
  <tbody>
    <tr><td>일 단위(교대 시작 시)</td><td>벨트/디스크 육안 검사, 롤러 상태, 흡입 테스트</td><td>서명된 체크리스트</td></tr>
    <tr><td>주 단위</td><td>가이드/텐션 롤러 세척, 정렬 검사, 베어링 윤활</td><td>기기 매뉴얼</td></tr>
    <tr><td>월 단위</td><td>고정 패드(Hook & Loop/PSA) 점검, RPM 보정, 공기 필터</td><td>RPM 계, 유량계</td></tr>
    <tr><td>분기 단위</td><td>고정 패드 교체, 흡입 시스템 전체 점검, 압력 보정</td><td>정품 부품</td></tr>
    <tr><td>연 단위</td><td>인정된 기술자 종합 정비, 기록, 안전 인증서</td><td>공인 서비스 제공업체</td></tr>
  </tbody>
</table>

<p>정비 기록은 기기 수명을 연장하고, 계획되지 않은 정지를 40–60% 줄입니다(샌딩 장비 제조사 데이터 기준).</p>`;
}

function buildSupportEscalation(): string {
  return `
<h3>언제 기술 지원으로 에스컬레이션하나요?</h3>
<ul class="plain-links">
  <li>표준 해결책 적용 후에도 동일 패턴의 반복 고장</li>
  <li>신제품이 계약 명세와 일치하지 않는 경우</li>
  <li>기준 배치 대비 성능 편차 20% 초과</li>
  <li>계약 중 명세 변경(그릿, 베이스, 치수)이 필요한 경우</li>
</ul>

<h3>지원 채널</h3>
<ul class="plain-links">
  <li>이메일: <a href="mailto:motai-01@motaiabrasive.com">motai-01@motaiabrasive.com</a></li>
  <li>WhatsApp: <a href="https://wa.me/8618118635597" rel="nofollow noopener" target="_blank">+86 181 1863 5597</a></li>
  <li>문의 서식: <a href="/quote">견적 요청 페이지</a></li>
</ul>

<p>반드시 첨부: 고장 사진, 배치 번호, 명세, 작업 조건(기기, 재료, 파라미터).</p>`;
}

function buildCulturalNotes(gccCountry: typeof gccCountries[0] | undefined): string {
  if (!gccCountry || gccCountry.code === 'general-gcc') return '';

  const notes: Record<string, string[]> = {
    'saudi-arabia': ['업무 주: 일–금', '공식 언어: 아랍어, 비즈니스는 영어', '인사: 손악수, 정중한 인사', '결정: 위계적이며 최종 결정자가 핵심', '라마단: 업무시간 단축, 낮 시간 회의는 피하는 것이 좋음'],
    'uae': ['업무 주: 월–금(공공부문), 일–금(대부분의 민간부문)', '다문화 환경, 비즈니스 언어는 영어', '명함: 오른손으로 주고받고, 받으면 바로 읽은 뒤 보관', '자유 경제 구역: 별도 규제, 관할 기관 확인 필요'],
    'qatar': ['업무 주: 일–금', '국산화 정책: 공공 입찰에서 현지 제품/서비스 우대', '언어: 아랍어 공식, 영어 보편적', '개인 관계가 신뢰 형성에 매우 중요'],
    'kuwait': ['업무 주: 일–금', '민간 부문은 금요일 오후 휴무', '협상: 인내를 필요로 하며 장기 신뢰 기반', '결정에 여러 단계 승인 필요할 수 있음'],
    'bahrain': ['업무 주: 일–금', '개방된 비즈니스 환경, 절차 단순화', '언어: 아랍어/영어', '개인 인맥이 실무적으로 매우 유효'],
    'oman': ['업무 주: 일–금', '국산화 정책: 기업에 현지 인력 고용 비율 의무', '결정: 협의적이며 광범위한 자문', '위계와 연령에 대한 존중'],
  };

  const countryNotes = notes[gccCountry.code] || [];

  return `
<h3>문화 및 비즈니스 유의사항 - ${gccCountry.name}</h3>
<ul class="plain-links">
  ${countryNotes.map(n => `<li>${n}</li>`).join('')}
</ul>

<p>위 내용은 일반적인 지침이며, 각 기업과 조직 문화는 다릅니다. 관계는 명확한 소통, 기한 준수, 약속 이행 위에 쌓아야 합니다.</p>`;
}

function buildDisclaimer(gccCountry: typeof gccCountries[0] | undefined): string {
  const countryName = gccCountry?.name || 'GCC(걸프) 지역';

  return `
<div class="disclaimer" style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:1rem;margin:1.5rem 0;">
  <h3>중요한 면책 조항</h3>
  <ul>
    <li>墨泰는 <strong>현지 재고가 없으며</strong>, ${countryName}에 사무실, 법인, 독점 인증 유통망도 없습니다.</li>
    <li>모든 물량은 <strong>중국의 당사 공장(후베이, 시안닌)</strong>에서 협의된 INCOTERMS 조건에 따라 출고됩니다.</li>
    <li>납기, 가격, MOQ, 인증서는 <strong>전체 명세 검토 후 최종 견적으로 확정</strong>됩니다.</li>
    <li>KS 기준 및 KOSHA 안전 요건 준수는 <strong>수입자의 책임</strong>입니다. 당사는 명세에 따라 제조사 인증서(CoC/COA)를 제공합니다.</li>
    <li>"현지 유통상" 또는 "${countryName} 현지 창고 출고"라는 표현은 墨泰의 서면 통보가 없이는 <strong>사실이 아닙니다</strong>.</li>
  </ul>
</div>`;
}

function buildGlossaryCard(topic: TopicSpec): string {
  const terms = [
    { term: '그릿(입도)', def: '입자 크기를 나타내는 표준 번호(FEPA P). 숫자가 작을수록 거침, 클수록 곱음' },
    { term: '베이스(Backing)', def: '입자를 지지하는 재질: 천(유연), 지(안정), 수지(내습)' },
    { term: '수지 결합재(Resin Bond)', def: '입자를 베이스에 고정하는 결합재. 내열성이 높은 수지' },
    { term: 'Hook & Loop / 벨크로 디스크', def: '후크-루프 고정 시스템으로 디스크를 빠르게 교체할 수 있음' },
    { term: '압감접착(PSA)', def: '표면이 압감접착 재질인 디스크. 접착 패드에 1회 장착' },
    { term: '메시(Perforation)', def: '분진 배출용 개구부(메시)가 있는 디스크/벨트. 막힘을 줄이고 마감을 개선' },
    { term: '최소 주문 수량(MOQ)', def: '공급업체가 단일 생산 지시로 수락하는 최소 수량' },
    { term: '납기(Lead Time)', def: '최종 명세 승인부터 항구/창고 인도까지의 소요 기간' },
    { term: 'OEM / 고객 브랜드', def: '고객의 로고와 포장으로 제품을 생산, 명세와 계약에 따라 진행' },
  ];

  return `
<div class="info-box glossary-card">
  <h3>용어 빠르게 보기</h3>
  <dl>
    ${terms.map(t => `<dt>${t.term}</dt><dd>${t.def}</dd>`).join('')}
  </dl>
</div>`;
}

function buildInquiryTemplate(topic: TopicSpec): string {
  return `
<div class="info-box inquiry-template">
  <h3>견적 요청 템플릿(복사·작성·제출)</h3>
  <pre style="background:#1e293b;color:#e2e8f0;padding:1rem;border-radius:8px;overflow-x:auto;font-family:monospace;font-size:0.85rem;line-height:1.6;">제품: [제품명/제품군]
규격: [예: 533×75 mm 또는 5인치]
그릿: [예: 80, 120, 240]
입자: [알루미나 / 지르코니아 / 세라믹 / 미확정]
베이스: [천 / 지 / 수지 / 미확정]
고정: [Hook & Loop / PSA / 메시 / 미확정]
수량: [개수 / 월 또는 1회 주문]
주문 주기: [월간 / 분기별 / 연간 / 1회성]
용도: [예: 스테인리스강, 용접부 제거, 최종 마무리]
기기: [기기 모델 + 벨트의 경우 연결 방식]
포장: [기본 / OEM - 로고 파일 첨부]
배송지: [항구 / 도시 / 국가]
결제: [LC / TT / 기타 조건]
인증서: [CoC / COA / KS / 불필요]
메모: [특수 요건]</pre>
  <p><a href="/quote" class="button button--primary">온라인 서식으로 제출</a></p>
</div>`;
}

function buildContactInfo(): string {
  return `
<div class="contact-info">
  <h3>연락처</h3>
  <dl class="spec-dl">
    <div><dt>이메일</dt><dd><a href="mailto:motai-01@motaiabrasive.com">motai-01@motaiabrasive.com</a></dd></div>
    <div><dt>WhatsApp</dt><dd><a href="https://wa.me/8618118635597" rel="nofollow noopener" target="_blank">+86 181 1863 5597</a></dd></div>
    <div><dt>전화</dt><dd>+86 181 1863 5597</dd></div>
    <div><dt>주소</dt><dd>중국 후베이성 시안닌시 동친구 준슈이시 위유 거리 88번지</dd></div>
    <div><dt>응답 시간</dt><dd>업무일: 24시간 | 주말: 48시간</dd></div>
  </dl>
</div>`;
}

function buildFAQSection(
  topic: TopicSpec,
  model: typeof models[0] | null,
  productCat: typeof productCategories[0] | undefined,
  industry: typeof industries[0] | undefined,
  gccCountry: typeof gccCountries[0] | undefined
): string {
  const faqs = buildFAQ(topic, model, productCat, industry, gccCountry);

  if (faqs.length === 0) return '';

  let html = '<h2>자주 묻는 질문(FAQ)</h2>\n<dl class="faq-list">';
  faqs.forEach(faq => {
    html += `<dt>${faq.q}</dt><dd>${faq.a}</dd>`;
  });
  html += '</dl>';
  return html;
}

function buildCTASection(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  const cta = buildCTA(topic, model, productCat);
  const targetUrl = cta.targetUrl || '/quote';

  return `
<div class="cta-band" style="background:#1e3a5f;color:#fff;padding:2rem;border-radius:12px;margin:2rem 0;text-align:center;">
  <h3>${cta.text}</h3>
  <a href="${targetUrl}" class="button button--primary" style="background:#fff;color:#1e3a5f;border:none;padding:0.75rem 1.5rem;border-radius:6px;font-weight:600;text-decoration:none;display:inline-block;margin-top:1rem;">${cta.type === 'hard' ? '지금 견적 요청하기' : '기술 팀에게 문의하기'}</a>
</div>`;
}

// ========== 辅助函数 ==========

function buildInternalLinks(
  topic: TopicSpec,
  model: typeof models[0] | null,
  productCat: typeof productCategories[0] | undefined,
  industry: typeof industries[0] | undefined
) {
  const links = [];

  // 1. 产品/产品族
  if (productCat) {
    links.push({
      url: `/products/${topic.productFamily}`,
      anchorText: productCat.name,
      description: `${productCat.name} 제품군 페이지 - 전체 명세와 커스텀 옵션`,
    });
  }

  // 2. 行业/应用
  if (industry) {
    links.push({
      url: `/industries/${topic.industry}`,
      anchorText: industry.name,
      description: `${industry.name} 솔루션 전체: 제품, 과제, 사례 연구`,
    });
  }

  // 3. 请求报价
  links.push({
    url: '/quote',
      anchorText: '도매 견적 요청',
      description: '명세 확정과 24시간 내 견적을 위한 표준 문의 서식',
  });

  // 4. 更多资源
  links.push({
    url: '/resources/abrasive-grit-guide',
      anchorText: '연마 입도 선택 가이드',
      description: '그릿(입도) 등급과 마감 작업을 연결하는 표준 참조 표',
  });

  links.push({
    url: '/resources/oem-packaging-guide',
    anchorText: 'OEM 주문 준비 가이드',
    description: '브랜드 및 포장 자료 준비 단계. 승인 과정을 빠르게 진행합니다.',
  });

  return links.slice(0, 5);
}

function buildExternalLinks(
  topic: TopicSpec,
  industry: typeof industries[0] | undefined,
  gccCountry: typeof gccCountries[0] | undefined
) {
  const links = [];
  const year = new Date().getFullYear();

  // 国际标准
  links.push({
    url: 'https://www.fepa-abrasives.org',
    anchorText: 'FEPA - Federation of European Producers of Abrasives',
    source: 'FEPA',
    year,
  });

  links.push({
    url: 'https://www.iso.org/standard/74568.html',
    anchorText: 'ISO 6344:2022 - Abrasive grain size analysis',
    source: 'ISO',
    year: 2022,
  });

  // 韩国监管机构
  if (gccCountry && gccCountry.code !== 'general-gcc') {
    const regulators: Record<string, { url: string; name: string }> = {
      'saudi-arabia': { url: 'https://www.kats.go.kr', name: 'KATS - Korean Agency for Technology and Standards(한국표준협회)' },
      'uae': { url: 'https://www.kosha.or.kr', name: 'KOSHA - Korea Occupational Safety and Health Agency(한국산업안전보건공단)' },
      'qatar': { url: 'https://www.kats.go.kr', name: 'KS - 한국 공업 표준' },
      'kuwait': { url: 'https://www.kosha.or.kr', name: 'KOSHA - 안전·보건 요건' },
      'bahrain': { url: 'https://www.kats.go.kr', name: 'KATS - KS 표준' },
      'oman': { url: 'https://www.kosha.or.kr', name: 'KOSHA - 안전 요건' },
    };
    const reg = regulators[gccCountry.code];
    if (reg) {
      links.push({
        url: reg.url,
        anchorText: reg.name,
        source: reg.name.split(' - ')[0],
        year,
      });
    }
  }

  // 职业安全
  links.push({
    url: 'https://www.osha.gov/abrasive-wheels',
    anchorText: 'OSHA - Abrasive Wheels and Tools Safety',
    source: 'OSHA',
    year,
  });

  return links.slice(0, 4);
}

function buildFAQ(
  topic: TopicSpec,
  model: typeof models[0] | null,
  productCat: typeof productCategories[0] | undefined,
  industry: typeof industries[0] | undefined,
  gccCountry: typeof gccCountries[0] | undefined
) {
  const productName = model?.name || productCat?.name || getProductFamilyNameAr(topic.productFamily);
  const industryName = industry?.name || '';
  const countryName = gccCountry?.name || '';

  const baseFAQs = [
    {
      q: `${productName}과 유사한 제품과의 차이는 무엇인가요?`,
      a: `형상(벨트/디스크/스펀지), 고정 방식, 그릿(입도) 범위가 다릅니다. ${productName}은 ${getMainApplication(topic.productFamily)}에 설계되었습니다. 상세 비교는 위의 비교표를 참조하세요.`,
    },
    {
      q: `${industryName}에 맞는 그릿(입도)을 어떻게 정하나요?`,
      a: `작업 단계에 따라 결정됩니다: 제거(40–80), 중간 마감(100–180), 최종 마무리(240–400 이상). 재료도 중요합니다: 경한 금속 → 지르코니아/세라믹, 목재/일반용 → 알루미나.`,
    },
    {
      q: `정확한 견적 요청에 필요한 정보는 무엇인가요?`,
      a: `제품, 규격, 그릿(입도), 입자 종류, 베이스, 고정 방식, 수량, 용도, 기기, 배송지, 결제 조건, 필요 인증서. 전체 서식은 "견적 요청 템플릿" 섹션을 참조하세요.`,
    },
    {
      q: `최소 주문 수량(MOQ)은 얼마인가요?`,
      a: `명세별로 제품, 커스텀 여부, 포장에 따라 개별 결정됩니다. 일반적으로 표준 제품은 MOQ가 낮고, OEM/커스텀은 높습니다. 정확한 수량은 견적으로 확인하세요.`,
    },
    {
      q: `납기(리드타임)는 얼마나 걸리나요?`,
      a: `명세 및 샘플 승인 후 견적으로 확정되며, 생산 + 운송(해운 또는 항공, ${countryName || '해당 지역'}까지)을 포함합니다. 정확한 수치는 견적서에 함께 제공됩니다.`,
    },
    {
      q: `OEM / 고객 브랜드 납품을 지원하나요?`,
      a: `네. 필요 자료: 벡터 로고 파일, 포장 도안, 대상 시장 언어, 인쇄 명세. 흐름: 샘플 → 승인 → 대량 생산. 상세는 "도매·OEM 가이드" 섹션에 있습니다.`,
    },
    {
      q: `KS 기준(KO) 및 KOSHA 안전 요건에 대한 적합성 증빙을 제공할 수 있나요?`,
      a: `제품 명세에 따라 제조사 적합증명서(CoC)와 분석증명서(COA)를 제공합니다. 수입 목적지에 대한 최종 KS/KOSHA 준수는 수입자의 책임이며, 당사는 필요 서류 제공에 협력합니다.`,
    },
  ];

  // 按类型追加专属 FAQ
  const typeFAQs: Record<string, Array<{q: string, a: string}>> = {
    'gcc-regional-sourcing': [
      { q: `${countryName}에 창고나 사무실이 있나요?`, a: `아니요. 모든 물량은 중국 당사 공장(후베이, 시안닌)에서 출고됩니다. ${countryName}에 현지 재고, 사무실, 독점 유통망이 없습니다.` },
      { q: `${countryName}으로 수입하기에 가장 좋은 항구는?`, a: `주요 항구: ${getMainPort(gccCountry?.code)}. 포워더와 협력해 원활한 통관을 조율합니다.` },
    ],
    'troubleshooting': [
      { q: `벨트가 계속 벗어나는데 해결법은?`, a: `확인: 롤러 정렬, 연결 방향, 롤러 마모, 표면 상태. 이탈의 90%는 올바른 정렬과 깨끗한 롤러로 해결됩니다.` },
      { q: `디스크가 빠르게 막힘(로딩)을 일으키는데 어떻게 하나요?`, a: `시도: 1) 흡입 향상을 위한 메시 디스크 2) 압력 감소 3) 가능하면 냉각제/수분 사용 4) 1단계는 거친 그릿 5) 흡입 필터 청소.` },
    ],
    'process-tutorial': [
      { q: `그릿(입도) 단계 사이에 표면을 세척해야 하나요?`, a: `네, 필수입니다. 거친 그릿 잔류물은 더 곱은 단계에서 표면을 긁습니다. 압축 공기 또는 깨끗한 마른 걸레로 제거하세요.` },
    ],
  };

  const extraFAQs = typeFAQs[topic.articleType] || [];

  // 行业专属 FAQ（site.ts industries.faq，7 行业全覆盖）：让 FAQ 随行业变化
  const industryFAQs = industry?.faq?.map(f => ({ q: f.q, a: f.a })) || [];

  // 型号专属 FAQ（来自 models.ts 的已验证数据）：让 FAQ 随型号变化
  const modelFAQs = model?.faq?.slice(0, 2).map(f => ({ q: f.q, a: f.a })) || [];

  // 种子滑窗：baseFAQs 7 条中取 4 条（窗口起点随 slug 变化）→ 同类型文章 FAQ 组合不同
  const fSeed = seedOf(topic.slug, 1_000_000);
  const win = fSeed % baseFAQs.length;
  const baseWindow = [0, 1, 2, 3].map(i => baseFAQs[(win + i) % baseFAQs.length]);

  return [...modelFAQs, ...industryFAQs, ...baseWindow, ...extraFAQs].slice(0, 8);
}

function buildSpecsTable(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined) {
  if (!model) return undefined;

  return [
    { '항목': '제품', '값': model?.name || productCat?.name || getProductFamilyNameAr(topic.productFamily) },
    { '항목': '규격', '값': model.sizeAr },
    { '항목': '그릿(입도) 범위', '값': model.gritRange.join(' – ') },
    { '항목': '유형', '값': model.type === 'belt' ? '샌딩 벨트' : '샌딩 디스크' },
    { '항목': '베이스', '값': model.backing },
    { '항목': '고정 방식', '값': model.attachment },
    { '항목': '적용 용도', '값': model.useCases.join(', ') },
  ];
}

function buildInfoBoxes(
  topic: TopicSpec,
  model: typeof models[0] | null,
  productCat: typeof productCategories[0] | undefined,
  industry: typeof industries[0] | undefined,
  gccCountry: typeof gccCountries[0] | undefined
) {
  const boxes = [];
  const productName = model?.name || productCat?.name || getProductFamilyNameAr(topic.productFamily);

  // Quick Answer
  boxes.push({
    type: 'quick-answer' as const,
    title: '빠른 답변',
    content: [
      `제품: ${productName}`,
      `보편적 그릿(입도): ${getCommonGritRange(topic.productFamily)}`,
      `주요 용도: ${getMainApplication(topic.productFamily)}`,
      `고정 방식: ${model?.attachment || 'Hook & Loop / PSA / 메시'}`,
    ],
  });

  // Spec Checklist
  boxes.push({
    type: 'spec-checklist' as const,
    title: '주문 전 명세 확인 체크리스트',
    content: [
      '☐ 제품 및 제품군',
      '☐ 정확한 규격(mm/인치)',
      '☐ 그릿(입도) 등급(FEPA P)',
      '☐ 입자 종류(Al₂O₃ / ZrO₂ / 세라믹 / SiC)',
      '☐ 베이스(천 / 지 / 수지)',
      '☐ 고정 방식(Hook & Loop / PSA / 메시)',
      '☐ 수량 및 주문 주기',
      '☐ 용도 / 가공 재료',
      '☐ 기기 모델 + 연결 방식',
      '☐ 배송지(항구/도시)',
      '☐ OEM / 포장 요건',
      '☐ 필요 인증서(CoC/COA/KS)',
    ],
  });

  // Inquiry Checklist
  boxes.push({
    type: 'inquiry-checklist' as const,
    title: '복사 즉시 사용 가능한 문의 서식',
    content: [
      `제품: ${productName}`,
      `규격: [채워 넣기]`,
      `그릿: [채워 넣기]`,
      `수량: [개수/기간]`,
      `용도: [재료 + 단계]`,
      `기기: [모델 + 고정 방식]`,
      `배송지: [항구/도시]`,
      `결제: [LC/TT/기타]`,
    ],
  });

  return boxes.slice(0, 3);
}

function buildInlineInfoBoxes(topic: TopicSpec, sectionIdx: number): string {
  // 信息块插入在文章开头或第一个 H2 之后
  if (sectionIdx === 0) {
    return `
<div class="info-box quick-answer" style="background:#eff6ff;border-left:4px solid #3b82f6;padding:1rem;margin:1.5rem 0;border-radius:0 8px 8px 0;">
  <strong>요약:</strong> 본 게시물은 ${topic.title}을 다룹니다. 핵심 사항은 아래 명세표, 체크리스트, 문의 서식에서 확인하세요.
</div>`;
  }
  return '';
}

function buildVoiceSearchQueries(
  topic: TopicSpec,
  model: typeof models[0] | null,
  productCat: typeof productCategories[0] | undefined,
  industry: typeof industries[0] | undefined,
  gccCountry: typeof gccCountries[0] | undefined
): string[] {
  const productName = model?.name || productCat?.name || getProductFamilyNameAr(topic.productFamily);
  const industryName = industry?.name || '';
  const countryName = gccCountry?.name || '';

  return [
    `${industryName}에 가장 좋은 ${productName}은?`,
    `${productName}의 그릿(입도)은 어떻게 선택하나요?`,
    `${countryName || '해당 지역'}에서 ${productName} 도매 가격은 얼마인가요?`,
    `${productName}을 신뢰할 수 있는 공급업체는 어디서 찾나요?`,
    `${industryName}용 ${productName} 명세는 어떻게 되나요?`,
  ];
}

function buildCTA(
  topic: TopicSpec,
  model: typeof models[0] | null,
  productCat: typeof productCategories[0] | undefined
) {
  const productName = model?.name || productCat?.name || getProductFamilyNameAr(topic.productFamily);
  const isHard = ['product-spec-detail', 'procurement-guide', 'wholesale-oem-guide', 'gcc-regional-sourcing', 'buying-guide', 'product-comparison', 'faq-buyers-guide'].includes(topic.articleType);
  const cv = seedOf(topic.slug, 1_000_000);
  const pick = <T,>(arr: T[]) => pickBySeed(arr, cv, arr.length) ?? arr[0];

  if (isHard) {
    return {
      type: 'hard' as const,
      text: pick([
        `${productName} 도매 견적을 요청하세요. 유형, 치수, 그릿(입도), 베이스/고정 방식, 수량, 용도, 배송지, OEM 요건(해당 시)을 첨부해 주세요.`,
        `${productName}의 도매 주문: 규격, 그릿(입도), 고정 방식, 예상 수량, 배송지를 확정하세요. 담당 팀이 명세를 검토한 뒤 견적으로 회신합니다.`,
        `${productName} 명세 파일(치수, 그릿(입도), 고정, 수량, 배송지)을 준비해 도매 견적을 요청하세요. 필요 시 OEM 및 포장 옵션도 포함됩니다.`,
      ]),
      targetUrl: '/quote',
    };
  } else {
    return {
      type: 'soft' as const,
      text: pick([
        `${productName}에 대한 기술 문의가 있으신가요? 가공 재료, 작업 단계, 기기를 알려주시면 적합한 명세를 추천해 드립니다.`,
        `${productName} 기술 상담: 재료, 작업 단계, 기기 유형을 보내시면 가정 없이 적합한 그릿(입도)과 베이스를 제시합니다.`,
        `${productName} 선택에 어려움을 겪으시나요? 기술 지원입니다. 용도(재료 + 기기 + 단계)를 보내주시면 명세와 그릿 진행 순서를 제안합니다.`,
      ]),
      targetUrl: '/quote',
    };
  }
}

function buildMetaDescription(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  const productName = model?.name || productCat?.name || t(topic.productFamily);
  const industryName = industrySegments.find(i => i.code === topic.industry)?.name || '';
  const countryName = gccCountries.find(c => c.code === topic.gccCountry)?.name || '';

  let desc = `${topic.title}. ${productName} 명세`;

  if (industryName) desc += ` — ${industryName} 적용`;
  if (countryName && countryName !== 'GCC(걸프) 지역') desc += ` (${countryName})`;

  desc += `. 그릿(입도), 베이스, 고정 방식, MOQ, 납기, 주문 단계를 안내합니다.`;

  return desc.slice(0, 160);
}

// ========== 数据辅助函数 ==========

function getAlternativeProduct(productFamily: string): string {
  const map: Record<string, string> = {
    'abrasive-belts': '샌딩 디스크 / 연마 디스크',
    'flap-discs': '샌딩 벨트',
    'sanding-discs': '샌딩 벨트',
    'hook-loop': '압감접착(PSA) 디스크',
    'sanding-sponges': '샌딩 디스크 / 연마 디스크',
  };
  return map[productFamily] || '대안 제품';
}

function getMainApplication(productFamily: string): string {
  const map: Record<string, string> = {
    'abrasive-belts': '가장자리 및 플레이트 마감(목재/금속) - 벨트 샌더 사용',
    'flap-discs': '각진동 그라인더로 녹 제거, 용접부 정리, 금속 마감',
    'sanding-discs': '평탄한 표면 마감 및 도장 전 처리',
    'hook-loop': '평탄한 표면에서 그릿(입도) 단계의 빠른 교대',
    'sanding-sponges': '가장자리, 곡면 및 수작업 정밀 마감',
  };
  return map[productFamily] || '산업용 일반 적용';
}

function getWorkpieceMaterials(industryCode: string): string[] {
  const map: Record<string, string[]> = {
    'woodworking': ['연질 목재', '경질 목재', 'MDF', '합판', '마루(Parquet)'],
    'metalworking': ['탄소강', '스테인리스강', '알루미늄', '주철', '타이타늄'],
    'automotive': ['강판', '알루미늄', '강화 플라스틱', '도금 금속'],
    'shipbuilding': ['해상용 강판', '스테인리스강', '해상용 알루미늄'],
    'oil-gas': ['탄소강 파이프', '스테인리스강', '니켈 합금', '고강도강'],
    'construction': ['목재', '석고 패널', '콘크리트', '석재', '타일'],
    'general': ['다양한 재료'],
  };
  return map[industryCode] || ['다양한 재료'];
}

function getGrainTypes(productFamily: string): string[] {
  const map: Record<string, string[]> = {
    'abrasive-belts': ['알루미나(알루미늄 산화물)', '지르코니아 알루미나', '세라믹', '규화규소(SiC)'],
    'flap-discs': ['알루미나(알루미늄 산화물)', '지르코니아 알루미나', '세라믹'],
    'sanding-discs': ['알루미나(알루미늄 산화물)', '규화규소(SiC)', '지르코니아 알루미나'],
    'hook-loop': ['알루미나(알루미늄 산화물)', '규화규소(SiC)'],
    'sanding-sponges': ['알루미나(알루미늄 산화물)', '규화규소(SiC)'],
  };
  return map[productFamily] || ['알루미나(알루미늄 산화물)'];
}

function getCommonGritRange(productFamily: string): string {
  const map: Record<string, string> = {
    'abrasive-belts': '40–800',
    'flap-discs': '40–320',
    'sanding-discs': '60–5000',
    'hook-loop': '60–5000',
    'sanding-sponges': '60–3000',
  };
  return map[productFamily] || '60–800';
}

function getProductFamilyNameAr(productFamily: string): string {
  const map: Record<string, string> = {
    'abrasive-belts': '샌딩 벨트',
    'flap-discs': '플랩 디스크(슬릿 디스크)',
    'sanding-discs': '샌딩 디스크 / 연마 디스크',
    'hook-loop': 'Hook & Loop / 벨크로 디스크',
    'sanding-sponges': '샌딩 스펀지',
  };
  return map[productFamily] || productFamily;
}

function getMainPort(countryCode: string | undefined): string {
  const ports: Record<string, string> = {
    'saudi-arabia': '제다(Jeddah Islamic) / 왕 아브둘라(달롬)',
    'uae': '자이드 알리',
    'qatar': '알 하마드',
    'kuwait': '알 쇼이크',
    'bahrain': '할리파 빈 살만',
    'oman': '살랄레 / 사하르',
  };
  return ports[countryCode || ''] || '주요 항구';
}

function getLocalRegulator(countryCode: string): string {
  const regulators: Record<string, string> = {
    'saudi-arabia': 'KATS(한국표준협회) KS 기준 / KOSHA 안전 요건',
    'uae': 'KS 기준 / KOSHA(한국산업안전보건공단)',
    'qatar': 'KS 기준(한국 공업 표준)',
    'kuwait': 'KS 기준(한국 공업 표준)',
    'bahrain': 'KS 기준(한국 공업 표준)',
    'oman': 'KOSHA(한국산업안전보건공단)',
  };
  return regulators[countryCode] || '현지 표준 관할 기관';
}

// ========== 测试主函数 ==========

export function generateSampleArticles(count: number = 10): GeneratedArticle[] {
  const samples = topicMatrix.slice(0, count);
  return samples.map(topic => generateArticle(topic));
}