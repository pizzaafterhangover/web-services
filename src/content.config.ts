import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { categoryIds } from './data/categories';

const notes = defineCollection({
  // 파일 이름이 _로 시작하면(예: _template.mdx) 수집하지 않는다.
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(categoryIds),
    tags: z.array(z.string()).default([]),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    status: z.enum(['학습중', '정리완료']).default('학습중'),
    draft: z.boolean().default(false),
  }),
});

export const collections = { notes };
