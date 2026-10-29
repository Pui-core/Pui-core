/** Provenance binding, separate from the accuracy of the audio assessment. */
const key=(id,start,end)=>`${id}|${Number(start).toFixed(3)}|${Number(end).toFixed(3)}`;
export function verifySpeakerAudit(plan,audit){
  if(audit?.schemaVersion!==1||audit.sourceAudioMode!=='original-mp4-natural-speed-direct-seek'||!audit.decisions?.length||!audit.ownerConfirmations?.length)throw Error('A source-audio speaker audit with owner-confirmed examples is required');
  const rows=new Map();
  for(const row of audit.decisions){
    const id=key(row.clipId,row.start,row.end);
    if(rows.has(id)||!row.speaker||!row.evidence?.length||row.status!=='reviewed')throw Error('Duplicate or unreviewed speaker decision');
    rows.set(id,row);
  }
  let count=0;
  for(const clip of plan.clips)for(const sub of clip.cuts.flatMap(c=>c.captions||[])){
    const row=rows.get(key(clip.id,sub.start,sub.end));
    if(!row||row.speaker!==sub.speaker)throw Error('Caption speaker disagrees with the reviewed source-audio decision');
    count++;
  }
  if(count!==rows.size)throw Error('Speaker audit includes missing or extra captions');
  for(const confirmed of audit.ownerConfirmations){
    const row=rows.get(key(confirmed.clipId,confirmed.start,confirmed.end));
    if(confirmed.source!=='owner'||!row||row.speaker!==confirmed.speaker)throw Error('Owner-confirmed speaker example was contradicted');
  }
  return {decisionCount:count,ownerConfirmedExamples:audit.ownerConfirmations.length,sourceAudioMode:audit.sourceAudioMode};
}
