import { invariant, text } from './core.mjs';

export function validateAssessment(output, receipt, policy, references) {
  invariant(output?.policy_version === policy.version, 'AI returned the wrong policy version.', 422, 'assessment_failed');
  invariant(Array.isArray(output.items) && output.items.length === receipt.items.length, 'AI did not assess every receipt item.', 422, 'assessment_failed');
  const ids = new Set();
  const ruleIds = new Set(policy.rules.map(r => r.id));
  const refIds = new Set(references.map(r => r.id));
  const items = output.items.map(result => {
    invariant(receipt.items.some(i => i.id === result.item_id) && !ids.has(result.item_id), 'AI returned unknown or duplicate item IDs.', 422, 'assessment_failed');
    ids.add(result.item_id);
    invariant(result.policy_version===undefined || result.policy_version===policy.version, 'AI returned a stale item policy version.', 422, 'assessment_failed');
    invariant(['accepted', 'rejected'].includes(result.decision), 'AI returned an invalid item decision.', 422, 'assessment_failed');
    invariant(result.confidence===undefined||typeof result.confidence==='number'&&Number.isFinite(result.confidence)&&result.confidence>=0&&result.confidence<=1,'AI returned an invalid confidence score.',422,'assessment_failed');
    invariant(Array.isArray(result.rule_ids) && result.rule_ids.length > 0 && new Set(result.rule_ids).size===result.rule_ids.length && result.rule_ids.every(id => ruleIds.has(id)), 'AI cited an unavailable or duplicate policy rule.', 422, 'assessment_failed');
    invariant(Array.isArray(result.reference_ids) && new Set(result.reference_ids).size===result.reference_ids.length && result.reference_ids.every(id => refIds.has(id)), 'AI cited an unavailable or duplicate spreadsheet reference.', 422, 'assessment_failed');
    invariant(result.decision !== 'accepted' || !policy.rules.some(r => result.rule_ids.includes(r.id) && r.effect === 'deny'), 'Accepted item cites a prohibition.', 422, 'assessment_failed');
    const category=text(result.category, 'AI category', 80);
    invariant(result.decision!=='accepted' || !policy.rules.some(r=>r.effect==='deny' && [category.toLowerCase(),'*','all'].includes(r.category.toLowerCase())), 'Accepted category conflicts with a current prohibition.', 422, 'assessment_failed');
    invariant(result.decision!=='accepted' || policy.rules.some(r=>r.effect==='allow' && result.rule_ids.includes(r.id)), 'Accepted item must cite a current allowance.', 422, 'assessment_failed');
    return {item_id: result.item_id, decision: result.decision, ...(result.confidence===undefined?{}:{confidence:result.confidence}), category, reason: text(result.reason, 'AI reason', 1200,15), rule_ids: [...result.rule_ids], reference_ids: [...result.reference_ids],policy_version:policy.version};
  });
  return {policy_version: policy.version, items};
}
