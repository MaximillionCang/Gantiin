## Inspiration

An event can finish before the treasurer's work does. Committee members have receipts to submit, purchases to explain, and reimbursements to collect. The treasurer has to check the items, compare them with the event's needs, track available funds, make payments, and keep a spreadsheet updated.

We built Gantiin around one goal: reduce that repeated work while keeping the reasons behind each reimbursement visible.

## What it does

Gantiin connects committee receipt submissions with the treasurer's event context, budget, and reimbursement records.

A committee member uploads a receipt. AI reads the items and amounts, then assesses each item against the event description and relevant approved spreadsheet records. A single receipt can contain both eligible and ineligible purchases.

For example, batteries and mounting tape may support event preparation, while an extra presentation remote may fall outside the event's scope because the venue already provides one. Rejected items receive specific explanations.

The server checks available funds and the recipient before creating a PayPal Sandbox reimbursement. Confirmed payments and item details are recorded in Google Sheets. Treasurers can review the event's history, while committee members see their own submissions.

## How we built it

We used JavaScript, HTML, and CSS for the interface, with a Node.js backend and SQLite for accounts, receipt records, and the payment journal. The hosted application runs on Render.

Gemini 3.5 Flash-Lite handles two separate tasks through LangChain: receipt extraction and item eligibility assessment. Structured outputs are checked with strict Zod schemas and application rules before they can affect a reimbursement.

Google Sheets supplies the budget and approved references. The PayPal Payouts API runs in the free Sandbox environment. Payment amounts are calculated on the server in integer sen, capped by current available funds, and marked paid only after matching successful provider confirmation.

## Challenges we ran into

One challenge was making AI responses usable in a financial workflow. A readable receipt does not automatically establish an item's relevance. We separated transcription from assessment and preserved the event context used for each decision.

Another challenge was handling partial failures. AI calls can time out or return invalid output. A payment can succeed while a spreadsheet update needs another attempt. We designed technical failures to remain visible and recoverable, with stable payment identities and recorded state to prevent retries from creating duplicate reimbursements.

## Accomplishments that we're proud of

We are proud of making item-level decisions understandable. A committee member can see why an expense was excluded, and eligible purchases can remain part of the claim.

We also kept payment authority in the backend. The model provides an assessment; server checks determine whether a reimbursement can proceed. The prototype brings receipt review, Sandbox payment handling, and spreadsheet records into the same application.

## What we learned

We learned that AI integration involves more than writing a prompt. Response validation, source context, failure handling, and clear status messages matter just as much.

We also learned to distinguish an eligible expense, a planned payment, and a confirmed reimbursement. Keeping those states separate makes the records easier to understand and the workflow easier to recover.

## What's next for Gantiin

Our next priorities are clearer provider diagnostics, more consistent assessment latency, and broader testing across receipt formats and event descriptions. We also want to improve first-time setup and support multiple events with separate budgets and policies.

Gantiin currently uses PayPal Sandbox. Moving beyond a hackathon prototype would require further security, reliability, and payment-operational work before handling real reimbursements.
