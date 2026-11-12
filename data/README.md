# Data

examples/receipts.json supplies the deterministic fixtures used by isolated tests and the explicitly enabled fixture adapter. Their images are in frontend/demo. Expected outcomes are test labels, not measured AI accuracy.

runtime/ holds private, ignored application databases and access notes. Cleanup must never move, reset or delete these records. The real balance is read from Google Sheets; no default fixture balance is used by the normal application configuration.

The separate demo/campus-career-day package contains the selected event, realistic synthetic receipts and an evaluation key. No external dataset or model weights were downloaded. Unused raw/processed/models placeholders and duplicate JSON examples were removed.
