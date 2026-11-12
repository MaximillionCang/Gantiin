import { z } from 'zod';

const amount = z.number().int().min(0).max(100_000_000);
const evidence = z.string().min(1).max(2000);
const discount = z.object({description: evidence, source_text: evidence, amount_sen: amount}).strict();
export const extractionSchema = z.object({
  readable: z.boolean(),
  confidence: z.number().min(0).max(1),
  issues: z.array(z.string().max(500)).max(20),
  merchant: z.string().max(500).nullable(),
  date_text: z.string().max(150).nullable(),
  currency: z.string().max(30).nullable(),
  currency_source_text: z.string().max(150).nullable(),
  source_text: z.string().max(30000),
  total_sen: amount.nullable(),
  total_source_text: z.string().max(500).nullable(),
  items: z.array(z.object({
    id: z.string().regex(/^item-[1-9][0-9]*$/),
    description: z.string().min(1).max(500),
    source_text: evidence,
    quantity: z.number().positive().max(10000).nullable(),
    unit_sen: amount.nullable(),
    line_sen: amount.nullable(),
    line_basis: z.enum(['gross', 'net', 'unknown']),
    discounts: z.array(discount).max(20)
  }).strict()).max(60),
  adjustments: z.array(z.object({
    kind: z.enum(['tax', 'discount', 'other']),
    description: evidence,
    source_text: evidence,
    amount_sen: amount.nullable(),
    treatment: z.enum(['add', 'subtract', 'included', 'unknown']),
    scope: z.enum(['receipt', 'items', 'unknown']),
    item_ids: z.array(z.string()).max(60)
  }).strict()).max(30)
}).strict();
