import { ChatGoogle } from '@langchain/google/node';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { toJsonSchema } from '@langchain/core/utils/json_schema';
import { AppError } from '../domain/core.mjs';
import { requireAI } from './config.mjs';

export const createModel = options => new ChatGoogle(options);

const providerKeywords=new Set(['type','title','description','enum','format','properties','required','additionalProperties','items','anyOf','oneOf','minimum','maximum','$defs','$ref','propertyOrdering']);
function providerSchema(value) {
  if(Array.isArray(value))return value.map(providerSchema);
  if(!value||typeof value!=='object')return value;
  return Object.fromEntries(Object.entries(value).filter(([key])=>providerKeywords.has(key)).map(([key,item])=>[key,['properties','$defs'].includes(key)?Object.fromEntries(Object.entries(item).map(([name,shape])=>[name,providerSchema(shape)])):providerSchema(item)]));
}

class StructuredFailure extends Error {
  constructor(reason, details={}) { super(reason);this.reason=reason;this.details=details; }
}
const finishReasons=new Set(['STOP','MAX_TOKENS','SAFETY','RECITATION','OTHER','BLOCKLIST','PROHIBITED_CONTENT','SPII','MALFORMED_FUNCTION_CALL','IMAGE_SAFETY','UNEXPECTED_TOOL_CALL','NO_IMAGE']);
const issueCodes=new Set(['invalid_type','too_big','too_small','invalid_format','not_multiple_of','unrecognized_keys','invalid_union','invalid_key','invalid_element','invalid_value','custom']);
const schemaFields=new Set(['policy_version','items','item_id','decision','confidence','category','reason','rule_ids','reference_ids','readable','issues','merchant','date_text','currency','currency_source_text','source_text','total_sen','total_source_text','id','description','quantity','unit_sen','line_sen','line_basis','discounts','adjustments','kind','amount_sen','treatment','scope','item_ids']);
function safeIssues(issues) {
  return issues.slice(0,5).map(issue=>({
    code:issueCodes.has(issue.code)?issue.code:'invalid_value',
    path:(issue.path||[]).map(part=>Number.isSafeInteger(part)&&part>=0&&part<10000?part:schemaFields.has(part)?part:'field').slice(0,8)
  }));
}
function failureDetails(error) {
  if(error instanceof StructuredFailure)return {reason:error.reason,...error.details};
  let cause=error;
  for(let depth=0;cause&&depth<4;depth++,cause=cause.cause) {
    const status=[cause.statusCode,cause.status,cause.response?.status].find(value=>Number.isInteger(value)&&value>=400&&value<=599);
    if(status) return {reason:status===429?'rate_limit':[401,403].includes(status)?'access':status===404?'model':status===400?'request':status>=500?'unavailable':'provider',http_status:status};
    if(cause.name==='ZodError'&&Array.isArray(cause.issues))return {reason:'invalid_schema',issues:safeIssues(cause.issues)};
    if(cause.name==='AuthError')return {reason:'access'};
    if(['ConfigurationError','InvalidInputError'].includes(cause.name))return {reason:'request'};
    if(['PromptBlockedError','NoCandidatesError'].includes(cause.name))return {reason:'blocked'};
    if(cause.name==='MalformedOutputError')return {reason:'invalid_json'};
  }
  return {reason:'provider'};
}
const failureMessages={
  deadline:'timed out. Wait briefly before retrying; check provider latency if it persists.',
  rate_limit:'hit a Gemini rate or quota limit. Check the configured project limits before retrying.',
  access:'was denied by Gemini. Check the server API key, project permissions and access restrictions.',
  model:'could not access the configured model. Check the approved model identifier and availability.',
  request:'was rejected by Gemini or its SDK. Check the request configuration and structured-output compatibility.',
  unavailable:'could not complete because Gemini is temporarily unavailable. Wait before retrying.',
  blocked:'returned no usable candidate or was blocked by the provider. Check the receipt and provider diagnostics.',
  missing_status:'returned no completion status. The response cannot authorize reimbursement.',
  incomplete:'returned an incomplete or blocked response. The response cannot authorize reimbursement.',
  invalid_json:'returned unreadable structured output. Check the provider diagnostics before retrying.',
  invalid_schema:'returned data that did not meet the required receipt or item schema. Check the provider diagnostics before retrying.',
  provider:'could not complete because of a provider or connection error. Check provider access and connectivity before retrying.'
};

export async function structuredCall({config, role, schema, prompt, content, modelFactory = createModel, timeoutMs = 45000}) {
  const model = requireAI(config, role);
  const code = role === 'ocr' ? 'extraction_failed' : 'assessment_failed';
  const controller = new AbortController();
  let timer;
  try {
    const llm = modelFactory({apiKey: config.aiKey, model, platformType: 'gai', maxRetries: 1, maxOutputTokens: 16384, streaming: false});
    // Gemini receives a reduced wire schema; the original Zod schema still enforces every bound and pattern.
    const runnable = llm.withStructuredOutput(providerSchema(toJsonSchema(schema)), {name: `gantiin_${role}`, method: 'jsonSchema', includeRaw: true});
    const result = await Promise.race([
      runnable.invoke([new SystemMessage(prompt), new HumanMessage({content})], {signal: controller.signal, callbacks: []}),
      new Promise((_, reject) => {timer = setTimeout(() => {reject(new StructuredFailure('deadline'));controller.abort();}, timeoutMs);})
    ]);
    const finishes=[result?.raw?.response_metadata?.finish_reason,result?.raw?.response_metadata?.finishReason,result?.raw?.additional_kwargs?.finishReason].filter(value=>value!==undefined);
    if(!finishes.length)throw new StructuredFailure('missing_status');
    if(finishes.some(value=>value!=='STOP'))throw new StructuredFailure('incomplete',{finish_reason:finishReasons.has(finishes.find(value=>value!=='STOP'))?finishes.find(value=>value!=='STOP'):'OTHER'});
    if(result?.parsed==null)throw new StructuredFailure('invalid_json');
    return schema.parse(result.parsed);
  } catch(error) {
    controller.abort();
    const details=failureDetails(error);
    console.warn('[gantiin.ai]',JSON.stringify({event:'ai_call_failed',role:role==='ocr'?'ocr':'decider',...details}));
    throw new AppError(`${role === 'ocr' ? 'Receipt extraction' : 'Item assessment'} ${failureMessages[details.reason]} No business rejection or payment was created.`, 503, code);
  } finally {
    clearTimeout(timer);
  }
}
