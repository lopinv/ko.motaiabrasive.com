import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * 기술 기사 — AEO/SEO 최적화를 위한 핵심 콘텐츠 컬렉션.
 * 스키마는 의도적으로 길이와 개수에서 느슨함: 데이터는 이전 배치에서 생성되었으며,
 * 콘텐츠 품질은 스키마가 아니라 검사 스크립트(quality-check)가 관리함.
 */
const articles = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.string(),
    updatedDate: z.string().optional(),
    author: z.string().default('MoTai Abrasives'),
    category: z.string(),
    productFamily: z.string().optional(),
    productModel: z.string().optional(),
    industry: z.string().optional(),
    gccCountry: z.string().optional(),
    keywords: z.array(z.string()).default([]),
    primaryKeyword: z.string().optional(),
    secondaryKeywords: z.array(z.string()).default([]),
    longTailKeywords: z.array(z.string()).default([]),
    searchIntent: z.string().optional(),
    featuredImage: z.string().optional(),
    featuredImageAlt: z.string().optional(),
    internalLinks: z
      .array(
        z.object({
          url: z.string(),
          anchorText: z.string(),
          description: z.string().optional(),
        }),
      )
      .default([]),
    externalLinks: z
      .array(
        z.object({
          url: z.string(),
          anchorText: z.string(),
          source: z.string().optional(),
          year: z.number().optional(),
        }),
      )
      .default([]),
    cta: z
      .object({
        type: z.string().optional(),
        text: z.string(),
        targetUrl: z.string(),
      })
      .optional(),
    faq: z
      .array(
        z.object({
          q: z.string(),
          a: z.string(),
        }),
      )
      .default([]),
    specsTable: z.array(z.record(z.string(), z.unknown())).default([]),
    infoBoxes: z
      .array(
        z.object({
          type: z.string(),
          title: z.string(),
          // 兼容两种历史形态：数组（生成模板原意）或逗号拼接字符串（早期落地数据）
          content: z.union([z.array(z.unknown()), z.string()]),
        }),
      )
      .default([]),
    voiceSearchQueries: z.array(z.string()).default([]),
    buyerJourneyStage: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const collections = { articles };
