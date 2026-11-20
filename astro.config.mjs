import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://ko.motaiabrasive.com',
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
  // 중복/저품질 기사는 생성 시점에 직접 삭제(noindex 미사용), sitemap에 전체 3000편 포함
  integrations: [mdx(), sitemap({
    changefreq: 'weekly',
    priority: 0.7,
    lastmod: new Date(),
  })],
});
