# Deferred training

Training from scratch and fine-tuning are not authorized MVP requirements. The implementation supplies current policy and spreadsheet context at inference time. No weights or training dataset are included.

If later authorized, use licensed data and human labels for accepted/rejected decisions, reasons and actual rule references. Do not use the model under evaluation as ground truth. Split by original receipt/event so image variants cannot leak across train/validation/test. Measure extraction errors, false acceptance/rejection, citations, latency and costs before claiming improvement. Keep technical failure separate from business outcomes.

Corrections do not automatically train the model. Dataset, prompt/model, training and evaluation need separate versions and consent. Unverified sponsor credits are not approved project funds.
