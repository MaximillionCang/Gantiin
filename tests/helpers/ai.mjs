export function extracted(overrides={}) {
  return {readable:true,confidence:0.98,issues:[],merchant:'Synthetic shop',date_text:'2026-11-08',currency:'MYR',currency_source_text:'MYR',source_text:'MYR Event printing 40.00 Total 40.00',total_sen:4000,total_source_text:'Total MYR40.00',
    items:[{id:'item-1',description:'Event printing',source_text:'Event printing 1 x 40.00 40.00',quantity:1,unit_sen:4000,line_sen:4000,line_basis:'gross',discounts:[]}],adjustments:[],...overrides};
}
export function mockModel(result, capture=[]) {
  return options=>({withStructuredOutput(schema,settings){capture.push({options,schema,settings});return {async invoke(messages,config){capture.at(-1).messages=messages;capture.at(-1).config=config;return {parsed:typeof result==='function'?await result():structuredClone(result),raw:{response_metadata:{finishReason:'STOP'}}};}};}});
}
