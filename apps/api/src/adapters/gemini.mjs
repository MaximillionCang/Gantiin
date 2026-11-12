import { extractReceipt } from '../ai/extraction.mjs';
import { assessItems } from '../ai/decider.mjs';
import { roleModels } from '../ai/config.mjs';

export class Gemini {
  constructor(config) { this.config=config; this.models=roleModels(config); this.model=this.models.decider; }
  extract(bytes,mime) { return extractReceipt(this.config,bytes,mime); }
  assess(receipt,policy,references,context='') { return assessItems(this.config,receipt,policy,references,context); }
}
