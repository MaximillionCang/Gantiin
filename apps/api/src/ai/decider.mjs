import { invariant } from '../domain/core.mjs';
import { validateAssessment } from '../domain/assessment.mjs';
import { structuredCall } from './structured.mjs';
import { assessmentSchema } from './schemas/assessment.mjs';
import { deciderPrompt } from './prompts/decider.mjs';

export async function assessItems(config, receipt, policy, references, context='', options={}) {
  invariant(policy.configured && Number.isSafeInteger(policy.version), 'A current versioned event policy is required.', 503, 'assessment_failed');
  invariant(references.every(r=>r.approved===true) && new Set(references.map(r=>r.id)).size===references.length, 'Assessment references must be explicitly approved with unique IDs.', 503, 'assessment_failed');
  const output=await structuredCall({config,role:'decider',schema:assessmentSchema,prompt:deciderPrompt,
    content:[{type:'text',text:JSON.stringify({event_policy:policy,untrusted_evidence:{receipt,approved_references:references,...(context.trim()?{legacy_purchase_context:context}:{})}})}],...options});
  return validateAssessment(output,receipt,policy,references);
}
