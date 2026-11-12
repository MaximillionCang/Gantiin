# AI pipeline

1. Validate PNG/JPEG signature, size and ownership.
2. Extract evidence through a separately configured LangChain Gemini OCR structured call (ai/extraction.mjs).
3. Validate visible MYR/printed total, original item lines, specific discounts and known adjustment scopes. Calculate exact net item sen with deterministic proportional allocation, retaining evidence; unsupported/ambiguous charges remain technical failures.
4. Retrieve current policy, RAB and explicitly approved history with source IDs.

The implementation ranks references by receipt description/category word overlap, supplying at most 40 relevant rows. Missing matches never become automatic business rejection. Source snapshots preserve the exact rows supplied. The chosen baseline is small and deterministic; real model/context quality remains unmeasured.
5. Assess binary item outcomes with the separate LangChain decider prompt/schema, using policy and actual evidence as data. No fabricated purchase purpose, recipient or remaining funds.
6. Validate coverage, decisions, category, reason, known rule/reference IDs and policy version.
7. Application totals accepted net costs, snapshots authorization, checks fresh funds and verified recipients, then authorizes automatic payment separately. Only confirmed payout-item success records payment plus reimbursed-item details in Sheets; recording never promotes expenses into approved references.

No model payment tools, recipient selection, secret access, or training. Fixture mode is a deterministic, labeled simulation using known synthetic receipts, not real OCR/AI. Errors remain operational, never fabricated rejection. Model/provider and cost authorization are explicit server configuration; no silent model selection or fallback.
