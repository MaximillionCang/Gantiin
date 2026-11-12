export function selectReferences(receipt, references) {
  const words=new Set(receipt.items.flatMap(i=>i.description.toLowerCase().match(/[a-z]{3,}/g)||[]));
  return references.filter(r=>r.approved===true).map(r=>({r,score:(`${r.description} ${r.category}`.toLowerCase().match(/[a-z]{3,}/g)||[]).filter(w=>words.has(w)).length})).filter(r=>r.score>0).sort((a,b)=>b.score-a.score||a.r.id.localeCompare(b.r.id)).slice(0,40).map(x=>x.r);
}
