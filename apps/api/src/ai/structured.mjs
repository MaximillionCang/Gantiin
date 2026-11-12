import { ChatGoogle } from '@langchain/google/node';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { toJsonSchema } from '@langchain/core/utils/json_schema';
import { AppError, invariant } from '../domain/core.mjs';
import { requireAI } from './config.mjs';

export const createModel = options => new ChatGoogle(options);

const providerKeywords=new Set(['type','title','description','enum','format','properties','required','additionalProperties','items','anyOf','oneOf','minimum','maximum','$defs','$ref','propertyOrdering']);
function providerSchema(value) {
  if(Array.isArray(value))return value.map(providerSchema);
  if(!value||typeof value!=='object')return value;
  return Object.fromEntries(Object.entries(value).filter(([key])=>providerKeywords.has(key)).map(([key,item])=>[key,['properties','$defs'].includes(key)?Object.fromEntries(Object.entries(item).map(([name,shape])=>[name,providerSchema(shape)])):providerSchema(item)]));
}

export async function structuredCall({config, role, schema, prompt, content, modelFactory = createModel, timeoutMs = 45000}) {
  const model = requireAI(config, role);
  const code = role === 'ocr' ? 'extraction_failed' : 'assessment_failed';
  const controller = new AbortController();
  let timer;
  try {
    const llm = modelFactory({apiKey: config.aiKey, model, platformType: 'gai', maxRetries: 1, maxOutputTokens: 16384, streaming: false});
    // Gemini rejected the full wire schema; the original Zod schema below still enforces every bound and pattern.
    const runnable = llm.withStructuredOutput(providerSchema(toJsonSchema(schema)), {name: `gantiin_${role}`, method: 'jsonSchema', includeRaw: true});
    const result = await Promise.race([
      runnable.invoke([new SystemMessage(prompt), new HumanMessage({content})], {signal: controller.signal, callbacks: []}),
      new Promise((_, reject) => {timer = setTimeout(() => {controller.abort(); reject(new Error('AI deadline exceeded'));}, timeoutMs);})
    ]);
    const finish = result?.raw?.response_metadata?.finishReason;
    invariant(finish === 'STOP', 'AI response was incomplete.', 503, code);
    return schema.parse(result?.parsed);
  } catch {
    throw new AppError(`${role === 'ocr' ? 'Receipt extraction' : 'Item assessment'} failed or returned invalid output. No business rejection or payment was created. Check model configuration, access and quota, then retry.`, 503, code);
  } finally {
    clearTimeout(timer);
  }
}
