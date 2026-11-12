# Decision record

## ADR-024: description-based events, real budget and concise UI (2026-11-09)

The owner removed manual rules/template/configuration detail from Event Policy: send only name, description and expected version. Server defaults MYR/reject and generates stable relevance/unrelated guardrails, marked policy_input=event_description. The actual event description, receipt and approved references guide the separate Decider; every rejection includes a specific reason. Preserve explicit legacy-rule records and stale-version/snapshot checks. Remove the obsolete template endpoint/module. Why rejected stays visible, technical citations in Decision details. Remove explanatory/synthetic paragraphs and header search; retain functional labels/status/errors and History's own search.

Open spreadsheet belongs at Overview's top right, using a validated server-derived Google URL/new tab for Treasurer only. Default budget source is Google even while other providers are fixture-mode. A failed/empty/unconfigured sheet returns unavailable/null money to the read-only UI, never a fallback balance. Disable fixture claims/worker with a real Google budget; never synchronize simulated payouts into that sheet. Keep existing immutable money/recipient/confirmation/sync safeguards. Isolated tests explicitly select fixture, which Sandbox rejects.

Read-only Gemini catalogue access and Sheet metadata/empty-range checks were explicitly requested and performed without inference, writes or payouts. Owner approved replacing the malformed OCR model slot with gemini-3.5-flash-lite, matching Decider; other env values remain. The existing private env backup stays ignored. Model-looking key tokens are rejected by configuration validation. Do not claim inference/accuracy from catalogue access.

Owner explicitly authorized folder cleanup and deletion of unused files. Move documentation by role, generated reports under .cache, remove proven-unused backgrounds/placeholder scaffolds/obsolete reports and examples after reference/hash/absolute-path checks. Preserve runtime data, credentials, logo and unrelated code. New demo assets are explicitly requested, labeled synthetic and kept separate from runtime state. Current evidence: docs/verification/current.md.

## ADR-023: Healthy-inspired connected frontend (2026-11-08)

The owner requested a complete redesign inspired by Healthy, granted palette freedom and explicitly chose flat controls. PRD 2.0/DESIGN/MASTER supersede historical glass/palette requirements. Use pearl canvas, cool navigation, dusty rose focus and three distinct financial summaries. Preserve the owner's Ribbon logo unchanged, retain Waves files but remove their active auth loading. No new dependency/framework, copied reference artwork or generated profile imagery.

Extract a read-only overview module from route composition. Project /budget, /claims and /event into available funds, eligible/confirmed-paid totals, actual seven-day submission counts, recent claims and operational context. Use confirmed paid_sen, never planned payment attribution. Browser totals do not authorize payouts. Allowlist only the new module path in the existing static handler; no API/domain/database changes.

Keep current event/rules beside receipt upload and all net-cost/model/source/version evidence in results. Existing session/CSRF, submission idempotency, recipient authority, CMT scope, manual seminar-draft save and technical retry remain. The transport handles connection loss, unreadable responses and expired sessions safely. History refresh replaces only its rows, preserves search/filter/focus through slow responses, and retains previous data plus an inline error when refresh fails. The topbar search link focuses History's real input.

Verification uses isolated backend stores and provider fixtures, never the owner journal/.env, external AI/Sheets/PayPal calls or account reset. Tests exercise net RM72, paid-plus-sync-failure recovery without another payout, current overview projections and held-refresh input. Evidence and full design Delivery Gate: docs/frontend-redesign-2.0.md. Restart an already running backend for the new static module, then hard refresh.

## ADR-019: connected responsibility boundaries (2026-11-08)

Owner authorized the seven-job upgrade. Preserve existing Node 24 ES modules, routes, database/accounts, owner assets and unrelated work. Incrementally extract domain/core/money/receipt/assessment/allocation/reference modules, HTTP transport/static helpers, separate AI roles and browser API/format/components/result page. Keep stable domain.mjs exports and existing server/service/adapters rather than migrate frameworks. Remove only ten enumerated zero-byte source scaffold markers and the unused old result renderer. Tests/scripts/docs stay in their established directories. The implementation ledger records dependencies and actual local evidence.

## ADR-020: LangChain Gemini with explicit models (2026-11-08)

Use maintained @langchain/google 0.2.12, @langchain/core 1.3.5 and zod 4.6.7, compatible with Node 24.16. Official LangChain guidance recommends ChatGoogle for new Gemini work. Use actual withStructuredOutput with jsonSchema/includeRaw, separate SystemMessage/HumanMessage evidence and strict output validation. Explicit platformType=gai and the supplied API key avoid routing through ambient Google Sheets service-account configuration. Each role resolves its override against GEMINI_MODEL; no implicit model ID. One shared key serves separate calls. AI_USAGE_AUTHORIZED defaults false; preserve existing .env values. One transport retry, whole-call 45-second deadline and required STOP completion bound calls. No tools, credentials, recipient or funds in assessment evidence. Installed-package/request-builder tests use mocked fetch, never Gemini tokens. See docs/ai/*-contract.md for source links and accuracy limits.

## ADR-021: exact net cost and two financial ledgers (2026-11-08)

Owner approved proportional reimbursement of actual accepted net goods. Specific discounts apply once; scoped shared tax/discount uses post-item-discount values as a fixed basis. BigInt largest remainders preserve exact sen with printed-order tie breaks. Included tax is evidence only. Unsupported charges/ambiguous scopes and mismatched printed total fail technically. Partial payout attribution uses accepted net weights for accounting only. Keep fresh fund reads, reservations, verified recipients, stable payment identity and matching payout-item SUCCESS. Store immutable full authorization/item snapshots and verify again during synchronization. Changes to unfinished policy/reference/recipient evidence stop allocation. Legacy payments remain valid without fabricated backfill.

Extend Transactions with eligible/unpaid/version/items digest; add protected Reimbursed Items with stable payment_id:item_id identities and durable fixed row ranges. One retry-identical batch writes both; read-back confirms both. Transaction reflection controls budget deduction once, even if item recording must recover. Recorded expenses never enter approved AI references automatically. Initializer supports a dedicated empty five-tab test sheet, but is not executed; owner setup/migration remains deferred. Sender fees are separate from reimbursement; real MYR/fees and any organizational fee budget remain unverified. See net-cost.md.

## ADR-022: task-specific connected UI and evidence (2026-11-08)

Anti Slop DURING is explicitly selected; UI/UX Pro Max contextual live-status/focus guidance and Taste composition checks inform the existing authenticated product. Owner Vibrant Sunset/light/glass/assets/navigation exceptions override generic marketing templates. Show actual active event, manual seminar draft, eligible net cost, confirmed paid/unpaid, original/scoped evidence and three distinct processing stages. Opaque money surfaces, a quiet receipt inspector, responsive record stacking and native details replace a monolithic result panel. Preserve login/recovery/privacy and receipt-only submission. New synthetic discount receipt is test data, not owner artwork. Browser evidence uses actual headless Chromium/axe/screenshots; interactive browser host was unavailable. No unmeasured provider accuracy, production readiness or performance claim. Current evidence is verification-seven-jobs.md.

## Current restoration decision, PRD 1.7

The owner rejected the dark palette and subsequent button-wrapper changes. Restore the saved last Vibrant Sunset browser source and every previous button style, including login, PayPal, sidebar and Settings. Keep original logo colors/Waves PNG, accepted functional behavior and growing recovery gaps. Hide the sidebar scrollbar while retaining short-screen wheel/keyboard scrolling. Reconcile all current Markdown palette declarations. No runtime account/data/password/.env reset, backend/schema/dependency change, provider call or deployment. Earlier dark experiment directions are superseded; verification is docs/ui-revision-1.7.md.

Entries ADR-001 through ADR-006 below are retained historical records. Their template status, manual approval, and unresolved palette/stack statements are superseded by ADR-007 onward and PRD 1.1.

## ADR-001: pemeriksaan per item

Dipilih dari diskusi pemilik: satu bon bisa diganti sebagian. AI mencocokkan dengan aturan dan konteks; produk tidak memastikan struk asli.

## ADR-002: persetujuan

Rancangan MVP: bendahara menyetujui item/nominal sebelum payout; server menghitung dan mengotorisasi.

## ADR-003: AI

Usulan: baseline model yang sudah tersedia dahulu. Fine-tuning hanya setelah ada label serta bukti kesalahan. Pemilik belum memilih model/provider final.

## ADR-004: teknologi

Belum diputuskan. Next.js/TypeScript, FastAPI/Python, dan PostgreSQL adalah kandidat, bukan dependency yang telah dipasang.

## ADR-005: batas pekerjaan sekarang

Permintaan pemilik hanya template folder dan berkas. Implementasi aplikasi, training, provisioning, dan deployment belum dimulai.

## Format keputusan selanjutnya

- ID:
- Tanggal:
- Status:
- Masalah:
- Alternatif:
- Keputusan:
- Alasan:
- Konsekuensi:
- Bukti:

## ADR-006: baseline PRD dari arahan terbaru pemilik

- Tanggal: 2026-11-05.
- Status: keputusan produk dikonfirmasi; implementasi belum dimulai.
- Sumber: percakapan pemilik yang meminta PRD.md dan menjawab klarifikasi produk; lihat PRD.md di root repository.
- Keputusan: gunakan MYR, keputusan AI diterima/ditolak per item, dan payout PayPal Sandbox otomatis melalui aplikasi. Tidak ada persetujuan atau override manual treasurer pada MVP hackathon.
- Integrasi spreadsheet: Google Sheets menjadi sumber sisa anggaran, daftar kebutuhan/RAB, dan riwayat yang ditandai telah disetujui. Sistem mencatat transaksi serta memperbarui sisa anggaran setelah pembayaran berhasil. Barang baru tetap boleh diterima jika sesuai kebijakan event.
- Akun dan UI: satu akun treasurer bersama, dua CMT awal dengan akun terpisah, pembuatan CMT oleh treasurer, UI berbahasa Inggris, navigasi samping dengan nama menu, dan glass button dengan hover halus.
- Konsekuensi: ADR-002 digantikan untuk alur persetujuan produk. Usulan USD, needs_review, persetujuan manual, dan penundaan sinkronisasi spreadsheet pada template lama tidak berlaku untuk MVP yang dijelaskan PRD.
- Batas teknis yang tetap berlaku: server menghitung nominal dalam sen MYR, memvalidasi hasil AI dan penerima, menyimpan snapshot otorisasi otomatis, mereservasi anggaran, mencegah pembayaran ganda, dan menunggu konfirmasi provider sebelum paid. Model tidak menentukan kredensial, endpoint, atau penerima pembayaran dari teks receipt.
- Keputusan yang belum final: event demo, model/provider, stack, palet, detail selisih pembayaran, dan laporan akhir. Rekomendasi teknis dalam PRD tetap berstatus usulan sampai dipilih.
- Batas pekerjaan: penyusunan PRD dan pencatatan keputusan. Tidak ada kode aplikasi, instalasi dependency, training, provisioning, deployment, atau transfer live yang dilakukan.

## ADR-007: implementation authorized and brand confirmed

- Date: 2026-11-06. Status: owner confirmed.
- Source: explicit implementation request, superseding ADR-005's template-only scope.
- Decision: translate PRD in place first, implement P0 then P1 PayPal login. Vibrant Sunset (#4D3A4D, #BE5CA9, #D59CC5, #EADADA), left text navigation, English, text wordmark, selective glass. Final event/report remain unresolved.
- Safeguards: no live transfers, paid infrastructure, or unapproved AI charges. No manual approval/override; validated automatic authorization snapshot retains all payment invariants.

## ADR-008: small single-process Node application

- Date: 2026-11-06. Status: implementation choice.
- Evidence: no source/manifests existed; Node 24.16.0 and built-in SQLite are available. Default Python shim cannot run; a Python 3.14 executable was located and used for design searches.
- Decision: Node 24 ES modules, native HTTP/fetch/crypto, SQLite transactional journal, semantic HTML/CSS/browser modules. google-auth-library handles service-account OAuth. Playwright is development-only. Keep provider adapters separate from domain logic.
- Tradeoff: fewer runtime/build layers for a local hackathon. Single-process worker serializes all allocations/sync; SQLite durability and unique constraints protect restart/retries. Multi-instance hosting needs a database/distributed-lock migration and is unsupported. Node 24.16+ is required for the selected built-in SQLite API.
- Receipt storage: private SQLite BLOBs for <=5MiB PNG/JPEG. No public upload directory. Accounts use scrypt passwords and hashed server sessions with HttpOnly SameSite cookies and same-origin/CSRF checks.

## ADR-009: explicit integration modes and safe setup

- Decision: default fixture mode uses clearly labeled local synthetic adapters, not pretend Google/PayPal/AI. Sandbox mode requires all server credentials, explicit AI usage authorization, event policy, and verified recipients. Never automatically fall back from an integration error to fixtures.
- AI adapter: Gemini image extraction plus structured item assessment; model name is required in configuration, not silently selected. No training, no payment tools. Validate currency, line arithmetic, total reconciliation, output coverage, IDs, citations, policy version. Unsupported shared adjustments block processing.
- Event is initially unconfigured. An explicit local demo seed supplies `Synthetic test event`, a labeled policy and receipts; it does not select the owner's event. The owner subsequently confirmed reject-with-explanation as the insufficient-context default (D-22); it is stored in each policy. Fees are covered by the sender, never subtracted from reimbursement; confirm funding before Sandbox trial.
- P0 recipients: operator verifies Malaysia Sandbox accounts in the PayPal dashboard and binds their PayPal account IDs through a local setup command with a recorded verification reference. Browser/LLM cannot set payment recipients. P1 verifies identity via official PayPal OAuth; linking does not silently replace the payout recipient.

## ADR-010: serialized reservations and deterministic Sheets writes

- Decision: allocation order is durable claim creation order within one serialized worker. Persist payment and recipient/policy snapshot before provider submission. One payment identity per claim. Keep reservations for unknown/pending and unsynchronized success; release only definitive failure or confirmed sheet reflection.
- Sheet contract: initial funds/adjustments are controlled input; remaining budget is a protected formula subtracting the transaction ledger. Each payment gets a durable, unique row allocation. Write that fixed row with updateCells, not append; retry overwrites the same row. A lost write response is reconciled by reading the ledger first. Remaining and reference reads are in one batchGet. Validate formula, transaction IDs/amounts, and ledger integrity before allocation. No two app instances may share a sheet. Protect app-owned ranges; out-of-band edits stop payouts.
- PayPal unknown submission: repeat only the same sender_batch_id/request ID within its deduplication window to recover original batch; never create a new payment. Beyond the window stop for operator reconciliation, retaining reservation. Batch acceptance is not paid; validate payout-item SUCCESS, sender ID, recipient, MYR, amount, and batch before marking success.
- No automatic later settlement for zero/partial/failed payments. Technical retry only resumes the same authorized payment/assessment, never creates arbitrary payouts.

## ADR-011: role-first login and reference-based workspace revision

- Status: owner-confirmed direction, 2026-11-06. Supersedes selective-button-glass and split login composition in ADR-007/DESIGN 1.1 only.
- Authentication: separate Treasurer and Committee authentication routes. Treasurer resolves exactly one existing treasurer server-side and checks its unchanged scrypt hash; no email/ID from the browser. Committee endpoint accepts only database CMT accounts. Form/role input cannot confer authorization. Preserve login rate limits, same-origin checks, session rotation, CSRF and ownership enforcement. No account/database reset or credential migration.
- Visual: inspect all three provided local images. Use Reference 1's glass material on every native/action-link button. The owner explicitly overrides R-10's 1-2 glass-element cap for buttons, without reconfirmation. Layered CSS and inset reflections avoid per-control backdrop-filter cost. Secondary/selected/destructive/loading/disabled variants keep readable labels and visible states.
- Composition: centered role selector and single active login form; bounded light dashboard, compact sidebar, actual record summaries beside details. Retain Vibrant Sunset and system sans/tabular numerals. Ignore reference social interfaces, sports/investment data, black theme, decorative marks and Apple authentication.
- Verification: isolated fixture tests and database/account fingerprints establish account/hash preservation. Real Google/PayPal/AI verification remains pending; no new external services/charges.

## ADR-012: stable login tabs and full-viewport workspace

- Date: 2026-11-06. Status: latest owner-authorized revision. Supersedes only ADR-011's separate selector and bounded workspace composition.
- Login: one 460px maximum-width, 39rem-height white card. Treasurer is the left tab and Committee the right, initially active. The selected pill moves while the DOM card remains intact and only the form panel changes. Native button tabs support arrows/Home/End; password/errors clear on change and tabs disable during authentication. Server authentication behavior and stored credentials are unchanged.
- Visual asset: owner explicitly authorized a generated quiet background. Built-in Imagegen produced apps/web/assets/login-sunset.png (1672x941). The server exposes only that explicit static asset path; receipt privacy/static allowlisting remain unchanged. The HTML image has dimensions, empty decorative alt and high fetch priority.
- PayPal: show a disabled, accessibly explained Committee button until identity configuration is present; then use the existing OAuth route. No mock OAuth success and no Treasurer OAuth flow are added.
- Workspace: remove outer rounded frame/margins and maximum width. Use fixed desktop navigation with a pinned Sign out footer and scrollable navigation on short screens. A sticky compact mobile header keeps Menu and Sign out available regardless of menu state.
- Copy: remove repetitive headings/subtitles, sidebar identity/event labels, redundant top strip, role descriptions and How decisions work panel. Preserve form labels, actual financial outcomes, errors and policy data; keep a compact Demo/Sandbox marker and explicit Simulated connection values.
- Evidence: 43 Node tests, seven browser journeys and syntax checks pass. Separate fixture-only visual/accessibility review verifies stable role-card geometry and persistent Sign out. See docs/ui-revision-1.3.md. No database reset, real integration calls or paid infrastructure changes.

## ADR-013: owner login, navigation and receipt revisions

- Date: 2026-11-06. Status: owner-authorized; supersedes conflicting visual/auth requirements in ADR-012.
- Latest login: original returning-G SVG mark and approved backdrop, true glass, Welcome above tabs, internal placeholders with accessible labels, close field gaps, content-sized height, no Treasurer ID/email row, no footer after PayPal. Equal heights were explicitly withdrawn. Ordinary unchecked login omits optional Remember me for compatibility with an older running server; restart remains necessary for backend features.
- Navigation: both roles have original relevant inline icons, single-line labels, Settings directly after History, no Demo badge and pinned Sign out. Sidebar and Settings tabs are unframed with moderate weight and fading active color, overriding glass there. Financial surfaces remain opaque. Inline brand rendering avoids broken images while an older backend lacks the new asset allowlist entry; an SVG asset is also provided.
- Sessions: unchecked browser-session cookie/eight-hour server maximum; checked 30-day maximum, including role-bound OAuth state. Preserve role, CSRF/origin, rotation and rate limits.
- PayPal: enable existing shared Treasurer identity linking/login in addition to CMT. Verified identity must match configured Sandbox sender account ID; CMT still matches verified recipient. No account auto-registration or recipient replacement. Real provider verification remains pending.
- Recovery: owner explicitly requested direct replacement, including A. Implement only behind fixture/stored-mode/loopback/flag/origin gates. Revoke target sessions, audit and rate limit. Reject Sandbox/public-host configuration. Normal password policy remains 12+. No email-delivery claim or production-recovery claim.
- Upload: remove Submit Receipt totals, policy sidebar, presets and the entire Purchase context field as explicitly confirmed. Real single PNG/JPEG <=5 MiB drag/drop/chooser, preview/removal/validation, no fake progress. Accept omitted context as empty, validating legacy supplied context. Pass no invented note to AI. Fixture assessments may use actual matching approved-reference context when no note exists; unclear/unlisted evidence still rejects, and current bans win. The receipt-only mixed fixture therefore pays RM40 printing and rejects unsupported registration/personal items. Existing contextful tests retain their outcomes. Remove empty-history Submit CTA only.
- Evidence: isolated tests and screenshots in docs/ui-revision-1.4.md. Runtime accounts/passwords/data and .env were not reset or overwritten. No dependencies, database schema migrations, paid services, real provider calls or live payments were added.

## ADR-014: use the owner's supplied logo

- Date: 2026-11-06. Status: owner explicitly requested replacing the current logo with their attached SVG.
- Copy Gantiin Gradient Exchange Logo.svg unchanged to apps/web/assets/gantiin-logo.svg. Preserve original colors, background, vector shapes and 2172x724 dimensions; SHA-256 3e004dafcfbb2310a01d7dcab73407b5f5ca85792bf90ccf5063254efed4a5a8.
- Replace the old hardcoded SVG in brandLogo() with a shared accessible image reference. Login, recovery and both Treasurer/Committee workspaces use it, with a versioned URL and proportional CSS sizing. The existing allowlisted asset route suffices; no server/auth/data changes.
- Targeted browser checks cover asset decoding/content type, intrinsic/as-rendered ratio, desktop/mobile visibility, overflow and header controls across both roles. See docs/owner-logo-verification.md. No new behavioral tests are required for an asset-only change.

## ADR-015: transparent Ribbon logo and supplied Waves backdrop

- Date: 2026-11-06. Status: explicitly requested by owner, superseding ADR-014's Exchange artwork/background preservation only.
- Native SVG edit: remove the Ribbon logo's full-canvas white path and turn the white lettering counter into an actual even-odd transparency clip. Preserve all 68 remaining foreground paths/attributes and 2172x724 canvas; add matching viewBox. Keep Downloads originals intact. No raster generation, color replacement or geometry redesign.
- Use prepared gantiin-logo.svg through the shared helper across login/recovery/both roles. Copy Waves SVG unchanged to login-waves.svg and use it for login/recovery with explicit 1672x941 dimensions/high priority. Add only that exact path to the existing static allowlist; preserve private receipt access. Retain legacy PNG for old clients. Updated asset URLs include version hashes.
- Keep current glass CSS and global UI palette. Provided illustration/logo colors are owner-approved asset choices. Browser-pixel conservative contrast across desktop/recovery/320/390/812px layouts stays above 5.94:1 text and 5.39:1 placeholders, with accessibility scans passing.
- Targeted checks verify HTTP SVG/content identity, all 68 foreground paths, alpha=0 outside artwork/inside letter counter, logo ratios/viewport bounds, both-role headers and no runtime errors. Results in docs/ribbon-waves-verification.md. No auth, runtime account, database, financial or external-provider changes. Restart older backend to load the new static route.

## ADR-016: use original PNG instead of traced background SVG

- Date: 2026-11-06. Status: explicit owner correction after reporting jagged SVG appearance.
- Copy the supplied Vibrant Sunset Fintech Waves.png unchanged to assets/login-waves.png. Source dimensions 1672x941, 1,562,118 bytes, SHA-256 c6a3bc15d00cc4c6f7627c55cfa8b3a842927ba36295b6511ed76868d2ba9674. Preserve the PNG rather than tracing, re-encoding or generating a replacement.
- Update both login/recovery image URLs with version hash; retain intrinsic dimensions/high priority/cover sizing. Add only the exact PNG path to static allowlist. Legacy assets remain for old clients. No logo, CSS, auth/data/financial changes.
- Current checks: PNG response bytes/MIME/dimensions, desktop/mobile screenshot inspection, six accessibility/contrast scans and unchanged transparent logo/header checks pass. Minimum conservative glass text contrast 5.12:1, placeholder 5.08:1. See docs/png-background-verification.md. Older full-suite runs remain historical evidence. Restart backend for the PNG route, then refresh browser.

## ADR-017: supplied glass controls, compact navigation and email-only remembering

- Date: 2026-11-06. Status: explicit owner revisions, superseding conflicting visual/session requirements in ADR-011/013.
- Material: implement the supplied HTML/CSS reference directly with layered purple translucency, conic masked rim, moving sheen, inset reflection, soft shadow and 3px blur. Use pill action radii, white semi-transparent glass login/sidebar, readable plum labels and richer purple hover. Do not import the example's body scroll lock, dotted grid or dramatic 3D rotation. Financial surfaces remain opaque. Owner explicitly authorizes this expanded glass dose.
- Exceptions: role choices have no outline/frame, including selected/hovered; the selected sliding purple pill gains Sign in-like inset reflection and gentle elevation per the owner's subsequent correction. Password eyes use plain eye/struck-eye symbols, no button surface, with native 44px target and accessible state. Keyboard focus and reduced motion remain.
- Layout: sidebar reduced from 272 to 232px, History label in both roles, Settings next and Sign out pinned. Later owner refinement uses 42% white base, diagonal reflection, 24px blur and 32px right corners to make its glass material visible; mobile remains square. Idle edges barely visible, hover light, selected purple. Overview adds Welcome, Treasurer/person icon, keeps real balance/outcomes and removes Refresh budget/latest/reference panels. Internal routes remain compatible. Login spacing is tighter above and opens toward lower actions without reducing 44px auxiliary targets.
- History: shared name/ID search plus name/date/requested-sen sorting in both directions and status filtering; unknown amounts last. Filters persist across refresh but reset by user. CMT privacy stays server-enforced, never a browser filter.
- Upload: remove white outer panel/padding and fill content width with a purple-dashed glass area, larger adaptive height, actual picker/drop/preview/removal. Submit label/send icon with light-purple base/darker hover; preserve icon in busy/errors.
- Email preference: no Treasurer Remember control. Committee stores only the last successful server-returned email and enabled flag in localStorage; opt-out clears, failed logins do not replace and unavailable storage does not block authentication. Passwords/tokens/CSRF are never persisted there. Login/PayPal UI omits session extension, using the existing browser-session cookie/eight-hour limit. Backend optional persistence remains compatible, not invoked by this preference.
- Recovery: remove in-card G, introduction, bottom back text and badge. Upper-left accessible 44px back-arrow link and content-sized card; no change to fixture/loopback/reset/session-revocation gates.
- Scope: browser JS/CSS, tests and documentation only. No account/password/data reset, schema/dependency/provider/backend changes. Google read access was separately verified; owner deferred tab initialization. No Sheets writes, AI inference, PayPal calls, paid infrastructure or live payments.
- Evidence: docs/ui-revision-1.5.md records 50 passing Node tests, 13 passing browser journeys, targeted final recovery/role reruns and screenshot inspection.
- Final material steering: the owner supplied a transparent purple sidebar reference after the 42% white iteration. Reduce white base to 12%, use diagonal 3-28% reflection and clear navigation pills, with 12% Secondary hover/24% selected plus restrained reflective highlight. Retain 32px right corners, lighter shadows and the light Vibrant Sunset palette. This supersedes the stronger white coating/full-purple fill described earlier; no reference branding, fabricated data or dark theme is imported. Targeted desktop/mobile/upload browser checks cover the final material.

## ADR-018: refine the restored light UI through the owner's three QC skills

- Date: 2026-11-06. Status: owner-authorized comprehensive QC; PRD 1.8.
- Apply Anti Slop during mode, Taste Skill's browser/composition checks and targeted UI/UX Pro Max guidance to the existing native HTML/CSS/JS workspace. Keep the four owner palette anchors, existing assets and supplied reflective glass material. The authenticated product's task screens supersede Taste's marketing hero/dealer/starter requirements.
- Share sidebar state tokens with Settings tabs. Correct adjacent-panel spacing in columns, left-align mobile headings, use a search/filter grid, reflow tables before tablet columns squeeze, keep status tags content-sized and use a readable 15px data scale. A restrained Primary/Secondary balance gradient creates one monetary focal point.
- Preserve all login, recovery, upload, ownership and financial behavior. Validation removes obsolete error references while retaining hint associations. Add reduced-transparency surfaces and mobile safe-area padding. No backend/schema/dependency/provider changes, runtime reseed/reset, external writes or paid calls.
- Evidence and exact checker limitations belong in docs/ui-qc-1.8.md. Tests use fresh isolated fixtures. Headless Taste tools use read-only proxies to isolated fixture roles, never runtime session credentials.
