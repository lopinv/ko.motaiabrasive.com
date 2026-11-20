/**
 * 选题矩阵生成器
 * 产品×规格×行业×GCC地区×13文章类型 的组合生成
 * 目标：生成 3000 篇去重、意图区分、关键词不蚕食的选题
 */

import { models } from '../data/models';
import { productCategories, industries } from '../data/site';
import { getAllTemplateTypes, getTemplate } from './article-templates';

// ========== 基础维度定义 ==========

// 纯 Hook&Loop 变体只归属 hook-loop 家族（从 sanding-discs 剔除），
// 避免同一型号在两家族生成重复标题
const HOOK_ONLY_MODEL_SLUGS = new Set(['hook-loop-disc', 'hook-loop-disc-multi-hole', 'hook-loop-disc-film']);

export const productFamilies = [
  { slug: 'abrasive-belts', name: '샌딩 벨트', models: models.filter(m => m.categorySlug === 'abrasive-belts') },
  { slug: 'flap-discs', name: '플랩 디스크', models: models.filter(m => m.categorySlug === 'flap-discs') },
  { slug: 'sanding-discs', name: '샌딩 디스크', models: models.filter(m => m.categorySlug === 'sanding-discs' && !HOOK_ONLY_MODEL_SLUGS.has(m.slug)) },
  { slug: 'hook-loop', name: 'Hook & Loop 디스크', models: models.filter(m => m.categorySlug === 'sanding-discs' && m.attachment.includes('Hook')) },
  { slug: 'sanding-sponges', name: '샌딩 스펀지', models: models.filter(m => m.categorySlug === 'sanding-sponges') },
] as const;

export const gccCountries = [
  { code: 'saudi-arabia', name: '사우디아라비아', nameEn: 'Saudi Arabia', industrialClusters: ['르바드', '제다', '달롬', '자빌', '얀부'] },
  { code: 'uae', name: '아랍에미리트', nameEn: 'UAE', industrialClusters: ['두바이', '아부다비', '샤르자', '자일 알리', '알 아인'] },
  { code: 'qatar', name: '카타르', nameEn: 'Qatar', industrialClusters: ['도하', '알콰르', '마사이피드', '라스 라판'] },
  { code: 'kuwait', name: '쿠웨이트', nameEn: 'Kuwait', industrialClusters: ['쿠웨이트 시', '알아흐마디', '알쇼이크', '사바흐 알아흐마드'] },
  { code: 'bahrain', name: '바레인', nameEn: 'Bahrain', industrialClusters: ['만아마', '사트라', '호라', '에스카르'] },
  { code: 'oman', name: '오만', nameEn: 'Oman', industrialClusters: ['무스카트', '사하르', '살랄레', '두콤', '네즈와'] },
  { code: 'general-gcc', name: 'GCC(걸프) 지역', nameEn: 'GCC General', industrialClusters: [] },
] as const;

// titleName: SEO 제목 생성용 짧은 이름(≤70자) — generateTitleVariants에서 사용
export const industrySegments = [
  { code: 'woodworking', name: '목공', titleName: '목공', nameEn: 'Woodworking', keyProcesses: ['목재 보드 준비', '가장자리 마감', '가구', '바닥재'] },
  { code: 'metalworking', name: '금속 가공', titleName: '금속', nameEn: 'Metalworking', keyProcesses: ['버(돌출부) 제거', '녹 제거', '용접부 연마', '표면 준비', '플레이트 금속'] },
  { code: 'automotive', name: '자동차 및 보수', titleName: '자동차', nameEn: 'Automotive', keyProcesses: ['차체 샌딩', '브라이머 샌딩', '보수', '폴리싱'] },
  { code: 'shipbuilding', name: '조선 및 수리', titleName: '조선소', nameEn: 'Shipbuilding', keyProcesses: ['강판 녹 제거', '용접부 처리', '도장 전 준비', '미끄럼 방지 표면'] },
  { code: 'oil-gas', name: '석유·가스 — 표면 가공', titleName: '석유·가스', nameEn: 'Oil & Gas', keyProcesses: ['파이프 녹 제거', '저장조 내부 표면', '해상 플랫폼 보수', '방청 도장 전 준비'] },
  { code: 'construction', name: '건축 마감재', titleName: '건축', nameEn: 'Construction Materials', keyProcesses: ['목재 보드', '석고보드 샌딩', '석재 폴리싱', '콘크리트 샌딩'] },
  { code: 'general', name: '일반 산업', titleName: '일반', nameEn: 'General Industrial', keyProcesses: ['유지보수 및 수리', '일반 샌딩', '표면 정돈'] },
] as const;

export const articleTypes = getAllTemplateTypes();

// ========== 关键词库（用于长尾组合） ==========

export const keywordLibrary = {
  // 核心产品词（主关键词候选）
  primaryKeywords: {
    'abrasive-belts': ['샌딩 벨트', '연마 벨트', '그라인딩 벨트'],
    'flap-discs': ['플랩 디스크', '슬릿 디스크', '플랩 디스크(플라스틱 베이스)'],
    'sanding-discs': ['샌딩 디스크', '연마 디스크', '메시 디스크'],
    'hook-loop': ['Hook & Loop 디스크', '벨크로 디스크', '후크 앤 루프 디스크'],
    'sanding-sponges': ['샌딩 스펀지', '연마 스펀지', '스펀지 패드'],
  },

  // 规格词（次关键词）
  specKeywords: {
    grit: ['그릿 40', '그릿 60', '그릿 80', '그릿 100', '그릿 120', '그릿 150', '그릿 180', '그릿 240', '그릿 320', '그릿 400', '그릿 600', '그릿 800', '그릿 1000', '그릿 3000', '그릿 5000'],
    size: ['533×75 mm', '610×100 mm', '1520×630 mm', '2200×1330 mm', '3인치', '4인치', '5인치', '6인치', '125 mm', '150 mm'],
    backing: ['면 베이스', '종이 베이스', '폴리머 베이스', '플라스틱 베이스', '유리섬유 베이스'],
    attachment: ['Hook & Loop', '압감접착(PSA)', '메시 베이스'],
    grain: ['알루미나', '실리콘 카바이드(SiC)', '지르코니아 알루미나', '세라믹'],
  },

  // 应用词
  applicationKeywords: {
    'woodworking': ['목공', '가구', '목재 보드', '목재 가장자리', '바닥재'],
    'metalworking': ['금속', '스테인리스', '강철', '알루미늄', '버 제거', '용접부', '녹 제거'],
    'automotive': ['자동차', '차체', '보수', '자동차 도장', '폴리싱'],
    'shipbuilding': ['선박', '조선소', '해상 유지보수', '강판', '방청'],
    'oil-gas': ['석유', '가스', '파이프', '저장조', '해상 플랫폼', '부식 방지'],
    'construction': ['건축', '석고보드', '시멘트', '석재', '타일'],
  },

  // 采购词
  procurementKeywords: [
    '도매 공급자', '산업 유통사', '공장 직영', '견적', '견적 요청(MOQ)',
    '최소 주문 수량', '납기', '샘플 요청', 'OEM',
    '커스텀 포장', '해운', '공수',
  ],

  // 地域词
  regionalKeywords: gccCountries.map(c => `${c.name} 도매 공급업체`).concat(
    gccCountries.map(c => `${c.name} 유통사`)
  ).concat(
    gccCountries.map(c => `${c.name} 산업 시장`)
  ),

  // 技术/标准词
  technicalKeywords: [
    'FEPA 표준', 'ISO 국제 표준', 'ANSI', 'JIS',
    '개인보호장비(PPE)', '먼지 배출(집진)', '표면 준비',
    'KS(한국 공업 표준)', 'KOSHA', '그릿 등급', '수지 결합재',
  ],
};

// ========== 选题生成逻辑 ==========

export interface TopicSpec {
  id: string;
  slug: string;
  title: string;
  articleType: string;
  productFamily: string;
  productModel?: string;
  industry: string;
  gccCountry: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  longTailKeywords: string[];
  searchIntent: 'informational' | 'technical' | 'commercial' | 'supplier-evaluation' | 'transactional';
  buyerJourneyStage: 'understanding' | 'evaluation' | 'comparison' | 'sourcing';
  estimatedWordCount: number;
  priority: number; // 1=高优先级(高商业价值长尾), 2=中, 3=低
  dedupeKey: string; // 用于去重
}

/**
 * 生成特定组合的选题
 */
function generateTopicsForCombination(
  productFamily: typeof productFamilies[0],
  model: typeof models[0] | null,
  industry: typeof industrySegments[0],
  gccCountry: typeof gccCountries[0],
  articleType: string
): TopicSpec[] {
  const template = getTemplate(articleType);
  if (!template) return [];

  const topics: TopicSpec[] = [];
  const baseId = `${productFamily.slug}-${model?.slug || 'general'}-${industry.code}-${gccCountry.code}-${articleType}`;

  // 根据文章类型生成变体标题；只保留首个变体（focus 0）。
  // 后续焦点变体（如 grit-size-selection）与主变体同 cell 正文 Jaccard 0.95+，
  // 属同模板换角度复制，直接不生成。
  // 例外：gcc-regional-sourcing 的两个变体（import-guide / market-logistics）
  // 正文由国家级数据驱动、差异显著，予以保留。
  const all = generateTitleVariants(productFamily, model, industry, gccCountry, articleType);
  const variants = articleType === 'gcc-regional-sourcing' ? all : all.slice(0, 1);

  variants.forEach((variant, idx) => {
    const keywords = selectKeywords(productFamily.slug, industry.code, gccCountry.code, articleType, model);
    const modelSlug = model?.slug || 'general';
    const dedupeKey = `${productFamily.slug}|${modelSlug}|${industry.code}|${gccCountry.code}|${articleType}|${variant.focus}`;

    topics.push({
      id: `${baseId}-${idx}`,
      slug: generateSlug(productFamily.slug, modelSlug, industry.code, gccCountry.code, articleType, variant.focus, idx),
      title: variant.title,
      articleType,
      productFamily: productFamily.slug,
      productModel: model?.slug,
      industry: industry.code,
      gccCountry: gccCountry.code,
      primaryKeyword: keywords.primary,
      secondaryKeywords: keywords.secondary,
      longTailKeywords: keywords.longTail,
      searchIntent: mapIntent(articleType),
      buyerJourneyStage: template.buyerJourneyStage,
      estimatedWordCount: Math.floor((template.minWordCount + template.maxWordCount) / 2),
      priority: calculatePriority(articleType, gccCountry.code, industry.code),
      dedupeKey,
    });
  });

  return topics;
}

/**
 * 生成标题变体
 */
function generateTitleVariants(
  productFamily: typeof productFamilies[0],
  model: typeof models[0] | null,
  industry: typeof industrySegments[0],
  gccCountry: typeof gccCountries[0],
  articleType: string
): Array<{ title: string; focus: string }> {
  const variants: Array<{ title: string; focus: string }> = [];
  // 标题用 shortName（型号短名）控制长度；无型号时回落家族名
  const modelName = model ? (model.shortName || model.name) : productFamily.name;
  const countryName = gccCountry.code === 'general-gcc' ? 'GCC(걸프) 지역' : gccCountry.name;
  const industryName = industry.name;

  // 제목은 짧은 이름(titleName)을 사용해 70자 이내 유지
  const iName = (industry as any).titleName || industryName;

  switch (articleType) {
    case 'product-comparison':
      // 对比同家族不同规格，或跨家族（型号名保留为唯一性锚点）
      variants.push({
        title: `${modelName} vs ${getAlternativeProduct(productFamily.slug)} — ${iName} (${countryName})`,
        focus: 'vs-alternative',
      });
      variants.push({
        title: `${iName} · ${countryName}에서 ${modelName} 선택 가이드`,
        focus: 'selection-guide',
      });
      break;

    case 'multi-product-comparison':
      variants.push({
        title: `${iName} (${countryName})용 ${modelName} 비교`,
        focus: 'full-matrix',
      });
      break;

    case 'buying-guide':
      variants.push({
        title: `${iName}·${countryName} ${modelName} 구매 가이드`,
        focus: 'complete-guide',
      });
      if (model) {
        variants.push({
          title: `${iName} ${countryName} ${modelName} 그릿·규격 선택`,
          focus: 'grit-size-selection',
        });
      }
      break;

    case 'technical-guide':
      variants.push({
        title: `${iName} ${countryName}용 ${modelName} 기술 가이드`,
        focus: 'technical-deep-dive',
      });
      break;

    case 'application-guide':
      variants.push({
        title: `${iName} 적용: ${countryName} ${modelName} 활용 가이드`,
        focus: 'industry-application',
      });
      break;

    case 'process-tutorial':
      variants.push({
        title: `${getProcessName(industry.code)} — ${modelName} (${iName}·${countryName})`,
        focus: 'step-by-step',
      });
      break;

    case 'troubleshooting':
      variants.push({
        title: `${iName}·${countryName} ${modelName} 문제 해결 가이드`,
        focus: 'failure-modes',
      });
      break;

    case 'product-spec-detail':
      if (model) {
        variants.push({
          title: `${iName}·${countryName}용 ${modelName} 스펙 상세`,
          focus: 'full-specs',
        });
      }
      break;

    case 'procurement-guide':
      variants.push({
        title: `${iName} (${countryName}) ${modelName} 공급업체 평가 가이드`,
        focus: 'procurement-process',
      });
      break;

    case 'wholesale-oem-guide':
      variants.push({
        title: `${iName}·${countryName} ${modelName} 도매·OEM 가이드`,
        focus: 'wholesale-oem',
      });
      break;

    case 'industry-market':
      variants.push({
        title: `${iName} ${countryName} 시장 동향과 ${modelName} 조달`,
        focus: 'market-trends',
      });
      break;

    case 'gcc-regional-sourcing':
      if (gccCountry.code !== 'general-gcc') {
        variants.push({
          title: `${iName}용 ${modelName} — ${countryName} 수입 가이드`,
          focus: 'import-guide',
        });
        variants.push({
          title: `${iName}용 ${modelName} — ${countryName} 시장 및 물류`,
          focus: 'market-logistics',
        });
      }
      break;

    case 'faq-buyers-guide':
      variants.push({
        title: `${iName}·${countryName} ${modelName} 구매자 FAQ`,
        focus: 'buyer-faq',
      });
      break;
  }

  return variants;
}

/**
 * 选择关键词组合
 */
function selectKeywords(
  productFamilySlug: string,
  industryCode: string,
  gccCountryCode: string,
  articleType: string,
  model: typeof models[0] | null
) {
  const lib = keywordLibrary;
  const primaryCandidates = lib.primaryKeywords[productFamilySlug as keyof typeof lib.primaryKeywords] || [productFamilySlug];
  const primary = primaryCandidates[0];

  // 次关键词：规格 + 应用 + 采购
  const secondary: string[] = [];
  if (model) {
    secondary.push(...model.gritRange.slice(0, 3).map(g => `그릿 ${g}`));
    secondary.push(model.sizeAr);
  }
  secondary.push(...(lib.applicationKeywords[industryCode as keyof typeof lib.applicationKeywords] || []).slice(0, 2));
  secondary.push(...lib.procurementKeywords.slice(0, 2));
  secondary.push(...lib.technicalKeywords.slice(0, 1));

  // 长尾：地域 + 产品 + 采购/应用
  const longTail: string[] = [];
  const countryName = gccCountries.find(c => c.code === gccCountryCode)?.name || '';
  const industryLabel = industrySegments.find(i => i.code === industryCode)?.name;
  if (countryName && gccCountryCode !== 'general-gcc') {
    longTail.push(`${primary} ${countryName}`);
    longTail.push(`${countryName} ${primary} 도매 공급업체`);
    longTail.push(`${primary} — ${industryLabel}용`);
  }
  longTail.push(`${primary} ${lib.procurementKeywords[0]}`);
  longTail.push(`${primary} 선택 가이드`);

  return {
    primary,
    secondary: [...new Set(secondary)].slice(0, 6),
    longTail: [...new Set(longTail)].slice(0, 5),
  };
}

/**
 * 生成 URL slug
 */
function generateSlug(
  productFamily: string,
  modelSlug: string,
  industry: string,
  gccCountry: string,
  articleType: string,
  focus: string,
  variantIdx: number
): string {
  const parts = [productFamily, modelSlug, industry, gccCountry, articleType, focus, String(variantIdx)];
  return parts.filter(Boolean).join('-').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
}

/**
 * 映射文章类型到搜索意图
 */
function mapIntent(articleType: string): TopicSpec['searchIntent'] {
  const intentMap: Record<string, TopicSpec['searchIntent']> = {
    'product-comparison': 'commercial',
    'multi-product-comparison': 'commercial',
    'buying-guide': 'commercial',
    'technical-guide': 'technical',
    'application-guide': 'informational',
    'process-tutorial': 'technical',
    'troubleshooting': 'technical',
    'product-spec-detail': 'supplier-evaluation',
    'procurement-guide': 'supplier-evaluation',
    'wholesale-oem-guide': 'transactional',
    'industry-market': 'informational',
    'gcc-regional-sourcing': 'supplier-evaluation',
    'faq-buyers-guide': 'commercial',
  };
  return intentMap[articleType] || 'informational';
}

/**
 * 计算优先级（1=高，商业价值高的长尾优先）
 */
function calculatePriority(articleType: string, gccCountry: string, industry: string): number {
  // 高商业意图类型 + 核心 GCC 国家 + 核心行业 = 优先级 1
  const highIntentTypes = ['buying-guide', 'product-spec-detail', 'procurement-guide', 'wholesale-oem-guide', 'gcc-regional-sourcing', 'product-comparison'];
  const coreCountries = ['saudi-arabia', 'uae', 'qatar'];
  const coreIndustries = ['metalworking', 'woodworking', 'automotive', 'shipbuilding', 'oil-gas'];

  let score = 0;
  if (highIntentTypes.includes(articleType)) score += 2;
  if (coreCountries.includes(gccCountry)) score += 2;
  if (coreIndustries.includes(industry)) score += 1;

  if (score >= 4) return 1;
  if (score >= 2) return 2;
  return 3;
}

/**
 * 辅助函数
 */
function getAlternativeProduct(productFamilySlug: string): string {
  const alternatives: Record<string, string> = {
    'abrasive-belts': '샌딩 디스크',
    'flap-discs': '샌딩 벨트',
    'sanding-discs': '샌딩 벨트',
    'hook-loop': 'PSA(압감접착) 디스크',
    'sanding-sponges': '샌딩 디스크',
  };
  return alternatives[productFamilySlug] || '대체 제품';
}

function getTechnicalTopic(productFamilySlug: string): string {
  const topics: Record<string, string> = {
    'abrasive-belts': '샌딩 벨트(입자, 베이스, 결합재)',
    'flap-discs': '플랩 디스크(슬릿, 베이스, 각도)',
    'sanding-discs': '샌딩 디스크(메시, 솔리드, 접착)',
    'hook-loop': 'Hook & Loop 시스템(후크, 루프, 호환성)',
    'sanding-sponges': '샌딩 스펀지(밀도, 그릿, 유연성)',
  };
  return topics[productFamilySlug] || '기술';
}

/**
 * 技术主题词带型号名：有型号时用「产品名 (技术维度)」，
 * 无型号时回落纯技术主题。保证 technical-guide 标题含具体型号，避免同族撞题。
 */
function getTechnicalTopicForModel(
  productFamilySlug: string,
  model: typeof models[0] | null
): string {
  if (model) return `${model.name} (그릿·베이스·결합재)`;
  return getTechnicalTopic(productFamilySlug);
}

function getProcessName(industryCode: string): string {
  const processes: Record<string, string> = {
    'woodworking': '목재 마감',
    'metalworking': '금속 마감',
    'automotive': '자동차 보수',
    'shipbuilding': '선체 표면 처리',
    'oil-gas': '표면 준비',
    'construction': '마감재 샌딩',
    'general': '일반 유지보수',
  };
  return processes[industryCode] || '일반 공정';
}

// ========== 主生成函数 ==========

/**
 * 生成完整选题矩阵（目标 ~3000 篇）
 */
export function generateTopicMatrix(): TopicSpec[] {
  const allTopics: TopicSpec[] = [];

  // 遍历所有组合
  for (const productFamily of productFamilies) {
    const modelsToUse = productFamily.models.length > 0 ? productFamily.models : [null];

    for (const model of modelsToUse) {
      for (const industry of industrySegments) {
        // 过滤：只生成相关的产品-行业组合
        if (!isRelevantCombination(productFamily.slug, industry.code, model)) continue;

        for (const gccCountry of gccCountries) {
          // 反规模化策略：内容选题按「主市场(qatar)+泛海湾(general-gcc)」双轨生成，
          // 其余 5 国只生成地域寻源篇（gcc-regional-sourcing），其正文由国家级真实数据
          // （港口、监管机构、工业集群、文化商务要点）驱动，与其他国家版本正文显著不同——
          // 不再是同模板换国名的 doorway 形态。
          const isPanGcc = gccCountry.code === 'general-gcc';
          const isPrimary = gccCountry.code === 'qatar';
          if (!isPrimary && !isPanGcc) {
            // 非主市场：仅地域寻源两型
            const regionalTypes = articleTypes.filter(t => t === 'gcc-regional-sourcing');
            for (const articleType of regionalTypes) {
              allTopics.push(...generateTopicsForCombination(productFamily, model, industry, gccCountry, articleType));
            }
            continue;
          }
          // 主市场/泛海湾：地域寻源篇在 general-gcc 不生成；泛海湾只保留核心信息型 6 类
          let relevantTypes = isPanGcc
            ? articleTypes.filter(t => t !== 'gcc-regional-sourcing')
            : articleTypes;
          if (isPanGcc) {
            // general-gcc 保留全部非地域寻源类型（泛海湾视角与 qatar 主版标题/关键词不同轨，
            // 且泛海湾篇面向 6 国汇总查询，意图可区分）
          }

          for (const articleType of relevantTypes) {
            const topics = generateTopicsForCombination(productFamily, model, industry, gccCountry, articleType);
            allTopics.push(...topics);
          }
        }
      }
    }
  }

  // 去重
  const deduped = deduplicateTopics(allTopics);

  // 按优先级排序
  deduped.sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));

  return deduped;
}

/**
 * 判断产品-行业-型号组合是否相关
 */
function isRelevantCombination(productFamily: string, industry: string, model: typeof models[0] | null): boolean {
  const relevanceMap: Record<string, string[]> = {
    'abrasive-belts': ['woodworking', 'metalworking', 'automotive', 'shipbuilding', 'construction', 'oil-gas', 'general'],
    'flap-discs': ['metalworking', 'automotive', 'shipbuilding', 'oil-gas', 'construction', 'woodworking', 'general'],
    'sanding-discs': ['woodworking', 'metalworking', 'automotive', 'construction', 'shipbuilding', 'general'],
    'hook-loop': ['woodworking', 'metalworking', 'automotive', 'construction', 'general'],
    'sanding-sponges': ['woodworking', 'automotive', 'construction', 'metalworking', 'general'],
  };
  return relevanceMap[productFamily]?.includes(industry) ?? true;
}

/**
 * 去重：同一 dedupeKey 只保留优先级最高的
 */
function deduplicateTopics(topics: TopicSpec[]): TopicSpec[] {
  const seen = new Map<string, TopicSpec>();
  for (const topic of topics) {
    const existing = seen.get(topic.dedupeKey);
    if (!existing || topic.priority < existing.priority) {
      seen.set(topic.dedupeKey, topic);
    }
  }
  return Array.from(seen.values());
}

/**
 * 统计报告
 */
export function printMatrixStats(topics: TopicSpec[]) {
  console.log(`\n=== 选题矩阵统计 ===`);
  console.log(`总计: ${topics.length} 篇`);

  const byType = topics.reduce((acc, t) => {
    acc[t.articleType] = (acc[t.articleType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log('\n按类型:');
  Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  const byPriority = topics.reduce((acc, t) => {
    acc[t.priority] = (acc[t.priority] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  console.log('\n按优先级:');
  Object.entries(byPriority).sort((a, b) => Number(a[0]) - Number(b[0])).forEach(([k, v]) => console.log(`  P${k}: ${v}`));

  const byCountry = topics.reduce((acc, t) => {
    acc[t.gccCountry] = (acc[t.gccCountry] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log('\n按地区:');
  Object.entries(byCountry).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  const byProduct = topics.reduce((acc, t) => {
    acc[t.productFamily] = (acc[t.productFamily] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log('\n按产品族:');
  Object.entries(byProduct).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  const byIndustry = topics.reduce((acc, t) => {
    acc[t.industry] = (acc[t.industry] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log('\n按行业:');
  Object.entries(byIndustry).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
}

// 导出单例
export const topicMatrix = generateTopicMatrix();
printMatrixStats(topicMatrix);
