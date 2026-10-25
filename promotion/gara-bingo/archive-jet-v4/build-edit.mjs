/** Build a reproducible EDL from private, verified audio selections; never invent dialogue. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {root,archive,snap,loadEdit} from './config.mjs';

export function buildEdit(selectionsFile=path.join(root,'research/selections.json')) {
  const selected=JSON.parse(fs.readFileSync(selectionsFile,'utf8'));
  if(selected.sourceClock!=='archive-container-zero-padded-audio'||!selected.alignedAudio)throw Error('Container-synchronous verified selections required.');
  const shots=[],voice=[],roles=selected.selections;
  let t=0;
  function card(kind,length,group,clearCount) {
    const end=snap(t+length);shots.push({id:group,start:t,end,kind,group,caption:'',...(clearCount===undefined?{}:{clearCount})});t=end;
  }
  function clip(role,{mute=false,group=role}={}) {
    const s=roles[role];if(!s||s.verified!==true)throw Error('Missing verified source phrase '+role);
    const length=snap(s.sourceOut-s.sourceIn);if(length<.35||length>6)throw Error('Unusable phrase length '+role);
    const sourceIn=s.sourceIn,start=t;
    // Picture-only jump cuts within each utterance preserve a single continuous voice track.
    const micro=role==='opening'||role==='closing'?[.7,.65,.75]:[.40,.55,.40,.65];
    let used=0,index=0;
    while(used<length-1/120) {
      let part=snap(Math.min(micro[index%micro.length],length-used));
      if(length-used-part<.20)part=snap(length-used);
      const end=snap(t+part);
      shots.push({id:group+'-'+String(index+1).padStart(2,'0'),start:t,end,kind:'archive',group,caption:s.caption,sourceIn:sourceIn+used,sourceOut:sourceIn+used+(end-t),role,provenance:s.provenance||'medium ASR, audio only'});
      used=snap(used+end-t);t=end;index++;
    }
    if(!mute)voice.push({id:group,start,sourceIn,sourceOut:sourceIn+length,transcript:s.transcript,caption:s.caption,role});
  }
  clip('opening');const drop=t;
  card('title',.70,'title');if(roles.challenge)clip('challenge');card('board',1.25,'first-grid',3);
  clip('invite');card('board',.35,'progress-four',4);
  clip('reaction');card('board',.35,'progress-six',6);
  if(roles.request)clip('request');
  card('reach',.55,'reach',8);const climax=t;
  clip('bingo');card('victory',.80,'all-clear',9);
  if(roles.celebration)clip('celebration');
  // Fill a short music-only celebration montage, rather than making the final CTA linger.
  let recapBudget=snap(25-t-snap(roles.closing.sourceOut-roles.closing.sourceIn)-3.2),recapIndex=0;
  const recapRoles=['reaction','invite','bingo'];
  while(recapBudget>=.25){const r=recapRoles[recapIndex%recapRoles.length],s=roles[r],length=snap(Math.min(.65,recapBudget,s.sourceOut-s.sourceIn)),end=snap(t+length);shots.push({id:'recap-'+recapIndex,start:t,end,kind:'archive',group:'celebration-recap',caption:'みんなと、ここまで！',sourceIn:s.sourceIn,sourceOut:s.sourceIn+length,role:'music-only-recap',provenance:'Picture callback from verified source; not a new quoted utterance.'});t=end;recapBudget=snap(recapBudget-length);recapIndex++;}
  const outro=t;clip('closing');
  const teaserLength=Math.max(3.2,25-t),teaserStart=t;card('teaser',teaserLength,'singing-teaser');
  if(roles.teaser){const s=roles.teaser;if(s.verified!==true)throw Error('Unverified singing teaser voice.');const length=snap(s.sourceOut-s.sourceIn);if(length>teaserLength-.2)throw Error('Teaser speech would exceed the final card.');voice.push({id:'teaser-promise',start:snap(teaserStart+.13334),sourceIn:s.sourceIn,sourceOut:s.sourceIn+length,transcript:s.transcript,caption:'歌ってみたサビ、後日公開！',role:'teaser-promise',provenance:s.provenance});}
  const edit={version:'archive-jet-v4',archive:selected.archive||archive,archiveSha256:selected.archiveSha256,alignedAudio:selected.alignedAudio,sourceClock:selected.sourceClock,duration:t,drop,climax,outro,shots,voice,aiImageInput:false,dialogueFabricated:false,sourceSpeechTimeStretched:false,storyChronology:'Short thank-you recap; participation/reaction excerpts are editorial callbacks, not a chronological reconstruction.',bingoGridOrder:'Illustrative progress, not a claim about real source timestamps or achievement order.',selectionsFile};
  fs.mkdirSync(root,{recursive:true});fs.writeFileSync(path.join(root,'edit-manifest.json'),JSON.stringify(edit,null,2)+'\n');loadEdit();
  console.log(JSON.stringify({duration:t,shots:shots.length,archiveShots:shots.filter(s=>s.kind==='archive').length,voiceEvents:voice.length,drop,climax,outro}));return edit;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))buildEdit(process.argv[2]);
