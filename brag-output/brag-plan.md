# Brag Plan: Gantiin

Status: storyboard and English narration ready. The owner has authorized production to begin after backend/AI verification is complete. Recording still depends on a verified deployed assessment and genuine payment/ledger evidence. Runtime readiness is listed below; no capture, inference, payout or render has been performed as part of this plan.

## Direction and planning rubric

1. **App:** Gantiin reduces event treasurers' reimbursement work by reading receipts, assessing each item's eligibility, making validated PayPal Sandbox payouts and recording confirmed results in Google Sheets.
2. **Strongest claim:** One receipt can contain both eligible event supplies and personal purchases; reimbursement covers eligible items subject to current funds.
3. **Visual hook:** A receipt beside the actual item-level results, with accepted and rejected rows visible together.
4. **Actual UI:** Treasurer Overview and Event Policy; Committee upload, result and rejection popup; confirmed payment evidence; Google Sheets ledger.
5. **Shortest satisfying format:** 165 seconds for a hackathon demonstration of the complete workflow. The user's maximum-three-minute requirement deliberately overrides brag's usual 15–25-second social format.
6. **Tone:** polished; a clear walkthrough of work the treasurer no longer has to repeat. Restrained overlays, readable screens and clean cuts.
7. **Audio:** English voice-over with short English captions, explicitly chosen by the owner. Quiet instrumental bed and sparse motion-matched accents.
8. **Share caption:** Gantiin checks event expenses item by item, reimburses eligible purchases through PayPal Sandbox, and keeps the treasurer's spreadsheet in sync.
9. **Flow:** Event context and budget → Committee receipt submission → item decisions, confirmed reimbursement and spreadsheet record.

## Angle, hook and landing

Lead with the treasurer's work, not a tour of settings. First two seconds: actual receipt/result crop with “One receipt. Not every item qualifies.” Then establish that checking items, paying members and updating records normally become separate tasks. End with “Less reimbursement work for your treasurer.” and the supplied Gantiin logo.

## Format and visual identity

- Landscape, 1920×1080, target 2:45 (165 seconds), with 15 seconds of headroom below the user's three-minute limit.
- Existing dark theme: canvas #090b14, surface #121626, text #f4f3ff, action #5935d5, cyan #18c9f4, blue #0665f5, violet #a36aff.
- Display and body: Segoe UI Variable Text / Segoe UI / system sans-serif, following the product.
- Use supplied transparent Gantiin artwork and genuine screen recordings. Hyperframes supplies titles, crops, transitions, captions and final assembly. Do not recreate provider success or alter financial results to resemble a completed transaction.
- Record at a readable desktop size; crop or gently zoom to the evidence being discussed. Retain meaningful column headings and the Sandbox label. Keep overlays outside important controls.

## Storyboard and draft English voice-over

Durations include transitions. Narration is recorded after the screen sequence is confirmed; leave short pauses to read the actual product.

| Time | Screen and interaction | Short overlay | Draft voice-over and edit/audio intent |
|---|---|---|---|
| 0:00–0:10 (10s) | Open on an actual mixed receipt/result crop, then reveal the supplied logo. | One receipt. Not every item qualifies. | “After an event, the treasurer still has work to do: check receipts, decide what qualifies, pay committee members, and update the spreadsheet.” Hook holds for at least two seconds; restrained title entrance, no fake notification. |
| 0:10–0:25 (15s) | Actual Treasurer Overview, then brief event context. Show the real available balance, not a prepared animation of money. | Meet Gantiin | “Gantiin brings those steps into one workflow. Committee members submit their receipts, while the treasurer sets the event context and keeps visibility over spending.” Clean cut, low music under voice. |
| 0:25–0:40 (15s) | Read-only view of Event Policy and relevant budget/approved context. Avoid saving settings just for filming. | Your event sets the context | “For Campus Career Day, batteries and mounting tape can qualify. Extra audiovisual equipment does not, because the university already provides it. Google Sheets supplies the available budget.” Sequential focus on relevant text, then hold. |
| 0:40–1:05 (25s) | Switch to an already signed-in Committee session. Select receipt 03 and submit only if unused and execution has been agreed. Brief authentic processing footage. | Submit a receipt | “A committee member uploads a receipt. Gemini extracts the items and amounts, then a separate assessment checks each item against the event context and relevant approved records.” Cut long waits with “Processing time shortened”; retain real order. One subtle click accent, no invented progress percentages. |
| 1:05–1:32 (27s) | Actual receipt 03 decisions: batteries and tape accepted; adapter and remote rejected. Open one actual Why rejected popup. | Check each item | “This receipt totals 184 ringgit. Batteries and mounting tape account for 46 ringgit of eligible supplies. The adapter and presentation remote are outside the event's scope. Gantiin explains why, while keeping the eligible items in the claim.” These amounts are expected test outcomes, not guaranteed results; only use them if the captured assessment matches. Hold each relevant row/popup long enough to read. |
| 1:32–1:55 (23s) | Actual confirmed result and matching PayPal Sandbox transaction evidence. Show 46 ringgit paid only if funds and recipient checks permit it and the actual payout succeeds. | PayPal Sandbox reimbursement | “Before paying, the server checks the available funds, recipient and saved assessment. It creates a PayPal Sandbox payout and marks the reimbursement paid only after checking the provider's successful result.” Keep provider evidence legible; no fabricated success tone or balance counter. |
| 1:55–2:20 (25s) | Treasurer History → Open spreadsheet. Show matching transaction/item rows and real updated balance. | Records update automatically | “The confirmed payment and item details are recorded in Google Sheets. The treasurer can review the history and remaining funds, while each committee member sees their own submissions.” Genuine clicks; highlight matching amount without exposing unrelated sheet contents. |
| 2:20–2:35 (15s) | Reuse existing receipt 04 result, already shown by owner: two rejected items, total 217.50 ringgit, reimbursed zero. Do not resubmit it. | Outside the event scope → no reimbursement | “If every item is outside the event's scope, no reimbursement is created. This optional committee dinner is personal spending, so the amount reimbursed is zero.” Hold actual existing result; brief popup only if readable. |
| 2:35–2:45 (10s) | Supplied logo with a small real UI crop; closing text and public repository reference. | Less reimbursement work for your treasurer. | “Gantiin. Receipt checks, PayPal Sandbox reimbursements, and spreadsheet records, so your treasurer spends less time chasing paperwork.” Music fades; final card settles for at least three seconds. |

Total: 10 + 15 + 15 + 25 + 27 + 23 + 25 + 15 + 10 = **165 seconds**.

## Voiceover script

Generate with the skill's Kokoro voice workflow, default voice `af_heart`, after confirming the capture sequence. Use one short audio segment per scene so each scene can retain natural pauses. Read “Gantiin” as the owner pronounces it; verify the first audio sample before generating the remaining segments. “Ringgit” is spoken for MYR amounts. Do not read filenames, on-screen captions, timestamps or bracketed stage notes into the audio.

1. **0:00–0:10:** After an event, the treasurer still has work to do: check receipts, decide what qualifies, pay committee members, and update the spreadsheet.
2. **0:10–0:25:** Gantiin brings those steps into one workflow. Committee members submit their receipts, while the treasurer sets the event context and keeps visibility over spending.
3. **0:25–0:40:** For Campus Career Day, batteries and mounting tape can qualify. Extra audiovisual equipment does not, because the university already provides it. Google Sheets supplies the available budget.
4. **0:40–1:05:** A committee member uploads a receipt. Gemini extracts the items and amounts, then a separate assessment checks each item against the event context and relevant approved records.
5. **1:05–1:32:** This receipt totals 184 ringgit. Batteries and mounting tape account for 46 ringgit of eligible supplies. The adapter and presentation remote are outside the event's scope. Gantiin explains why, while keeping the eligible items in the claim.
6. **1:32–1:55:** Before paying, the server checks the available funds, recipient and saved assessment. It creates a PayPal Sandbox payout and marks the reimbursement paid only after checking the provider's successful result.
7. **1:55–2:20:** The confirmed payment and item details are recorded in Google Sheets. The treasurer can review the history and remaining funds, while each committee member sees their own submissions.
8. **2:20–2:35:** If every item is outside the event's scope, no reimbursement is created. This optional committee dinner is personal spending, so the amount reimbursed is zero.
9. **2:35–2:45:** Gantiin. Receipt checks, PayPal Sandbox reimbursements, and spreadsheet records, so your treasurer spends less time chasing paperwork.

This is the narration for the preferred receipt-03 sequence. Before TTS, replace amounts or example-specific lines if the chosen genuine evidence differs. Target a conversational 125–145 words per minute during speech, with the remaining scene time reserved for reading/clicks. Measure every generated segment; shorten copy if it runs over, never accelerate speech to fit. English subtitles follow the final recorded words; the separate short overlays above remain sparse.

## Audio and music cue guidance

- Owner opted into English voice-over. Follow brag's Kokoro/Hyperframes voice workflow when production begins; no voice generation during planning.
- Candidate music: bundled Happy Beats / Business Moves Vol. 1 by Sascha Ende, 163.96 seconds, approximately 120.19 BPM. Let the last second of the 165-second film land quietly after its fade; do not loop unnecessarily.
- Read preset: happy-beats-business-moves-vol-1-by-ende-dot-app.music-cues.md. Optional first-window cues: 17.02, 20.02 and 23.02 seconds for small focus changes; no financial interaction is retimed solely to hit a beat. Later cues can be taken from the full preset at composition time.
- Music stays clearly below narration. Sparse click/title accents only; no audio-reactive effects on evidence screens. Actual information and reading time take priority over beat sync.
- Credit in description/share copy: “Music: Sascha Ende, ende.app (CC BY 4.0)”. Confirm licensing/attribution when selecting the final track.

## Capture readiness and usage limits

- Resolve the deployed receipt-02 assessment failure before presenting the workflow as ready. Its OCR items are visible, but no completed assessment is shown. Obtain the actual underlying error without repeatedly retrying paid inference.
- Confirm Render is using the imported Sandbox journal, website accounts work, actual event context matches the demo, and Sheets budget/journal validation passes. Configuration flags alone do not establish provider access.
- Check existing hosted History before choosing the main example. Receipt 01 has historical usage; receipt 04 already has an owner-shown rejected result; receipt 02 is currently failed. Receipt 03 is preferred only if unused. If a matching successful receipt already exists, reuse its evidence and label footage honestly rather than paying again.
- Budget at most one fresh receipt assessment for capture: normally one OCR call and one Decider call, with no diagnostic quota probe or unplanned retries. Provider-internal retries must be checked/capped before promising a strict two-request ceiling. Pause on failure.
- A fresh receipt may automatically trigger a Sandbox payout and spreadsheet write. Agree on that concrete capture action before execution; no live-money payout. Use one active application writer for the shared financial sheet.
- Do not delete claims, reset journals, change financial guardrails, lower confidence thresholds, bypass duplicate detection or stage a successful provider response for filming.
- Pre-authenticate outside the recording. Never show passwords, API keys, service-account JSON, cookies, OAuth callback parameters or real personal data. Crop/mask account identifiers and irrelevant sheet data; keep only synthetic demonstration content visible.
- Verify actual PayPal login separately before including it as a demonstrated feature. Password sign-in can establish the app role without spending video time on authentication.

## Production readiness inspection

- Read the brag skill, step-1 inspection, step-2 planning, step-3 composition/voice instructions, audio reference, and selected music's cue preset.
- Required companion skills `hyperframes`, `hyperframes-cli`, `hyperframes-registry` and `media-use` were not found in the local Codex skills or cached plugin skills during this inspection. They are not available in the supplied skill catalog either. Obtain the required skills before composition; do not improvise undocumented Hyperframes commands or silently switch video engines.
- Node and npm are available. `hyperframes`, `ffmpeg` and `ffprobe` were not found on PATH. This does not prove they cannot be supplied by a project-local runtime; dependency/runtime discovery remains a production prerequisite. No install was attempted.
- Authentic live-browser capture is not yet established. A previous computer-use session stopped on a browser-URL policy check. Resolve supported capture access before filming, or use genuine footage recorded by the owner. Do not use recreated UI or a new automation route to bypass that restriction.
- This plan and script are ready independently of these production prerequisites. Keep the backend/AI repair as the immediate priority; resume production only after its checks pass.

## Delivery after capture is authorized

Prepare the composition brief and Hyperframes implementation, run its required checks, inspect the full rendered film for readable evidence and private data, and verify duration stays below 180 seconds. Deliver brag.mp4, a selected brag.jpg poster baked as frame zero, an English transcript/captions and share-copy.txt. Do not claim these deliverables exist at the planning stage.
