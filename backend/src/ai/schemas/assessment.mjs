import { z } from 'zod';

export const assessmentSchema=z.object({
  policy_version:z.number().int().nonnegative(),
  items:z.array(z.object({
    item_id:z.string().min(1).max(100),
    decision:z.enum(['accepted','rejected']),
    confidence:z.number().min(0).max(1),
    category:z.string().min(1).max(80),
    reason:z.string().min(15).max(1200),
    rule_ids:z.array(z.string().min(1).max(30)).min(1).max(30),
    reference_ids:z.array(z.string().min(1).max(100)).max(40),
    policy_version:z.number().int().nonnegative()
  }).strict()).min(1).max(60)
}).strict();
