/** Speaker-aware typography. This module never imports or decodes footage. */
export const layout={width:1080,height:1920,video:{x:134,y:432,width:810,height:1440},captionMaxBottom:410};
export const shaText=x=>String(x).replace(/[{}\\]/g,'').replace(/\n/g,'\\N');
const rgb=x=>'&H00'+x.replace('#','').match(/../g).reverse().join('');
const stamp=t=>{const n=Math.round(t*100);return `${Math.floor(n/360000)}:${String(Math.floor(n/6000)%60).padStart(2,'0')}:${String(Math.floor(n/100)%60).padStart(2,'0')}.${String(n%100).padStart(2,'0')}`;};
const event=(layer,a,b,name,text)=>`Dialogue: ${layer},${stamp(a)},${stamp(b)},Main,${name},0,0,0,,${text}\n`;
const units=s=>[...s].reduce((n,c)=>n+(c.charCodeAt(0)<128?.55:1),0);

export function buildCaptions(clip,edit,fonts){
  if(!fonts?.normal?.family||!fonts?.reaction?.family||!fonts?.shaky?.family)throw Error('All three font roles must be explicit');
  const speakers=clip.speakers;
  if(!speakers||Object.values(speakers).some(s=>!['left','right','center'].includes(s.side)||!/^#[0-9A-Fa-f]{6}$/.test(s.color)))throw Error('Explicit speaker lanes and colours required');
  let ass=`[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\nWrapStyle: 2\nScaledBorderAndShadow: yes\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Main,${fonts.normal.family},96,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,-1,0,1,0,0,5,44,44,0,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
  const audit=[];
  function outlined(a,b,name,text,{font,size,x,y,align=5,fill='#FFFFFF',outer='#000000',shaky=false,shake=false,tilt=0,label=false,scaleY=100}){
    // Every outline is a glyph stroke (BorderStyle 1), never a rectangle.
    const layers=label?[[0,'#000000',5],[1,outer,2]]:shaky?[[0,'#000000',16],[1,'#FFFFFF',13],[2,outer,9]]:[[0,'#000000',16],[1,outer,13],[2,'#FFFFFF',6]];
    for(const [layer,stroke,border] of layers){
      const motion=shake?'\\t(0,65,\\frz0.55)\\t(65,130,\\frz-0.45)\\t(130,210,\\frz0.3)\\t(210,300,\\frz0)':'';
      ass+=event(layer,a,b,name,`{\\an${align}\\pos(${x},${y})\\fn${font}\\fs${size}\\fscy${scaleY}\\fsp-1\\bord${border}\\shad0\\1c${rgb(fill)}\\3c${rgb(stroke)}\\frz${tilt}${motion}}`+shaText(text));
    }
  }
  outlined(0,edit.duration,'title',clip.title,{font:fonts.reaction.family,size:108,x:540,y:80,fill:'#FFED6A',outer:'#000000',label:true});
  for(const group of edit.groups){
    for(const sub of clip.cuts.flatMap(c=>c.captions||[]).filter(s=>s.start>=group.start-.01&&s.end<=group.end+.01)){
      const speaker=speakers[sub.speaker];
      if(!speaker)throw Error('Every caption requires an annotated speaker; colour is not a speaker identifier');
      if(!(sub.end>sub.start))throw Error('Invalid caption time');
      const lines=String(sub.text).split('\n');
      if(lines.length>2)throw Error('Two subtitle lines maximum');
      const role=sub.fontTreatment==='handdrawn-rough'?'rough':sub.fontTreatment==='handdrawn-wobbly'?'shaky':sub.emphasis?'reaction':'normal';
      if(!fonts[role]?.family)throw Error('Selected font role is unavailable');
      const maximum=Math.max(...lines.map(units));
      const scale=fonts[role].scale||1,advance=fonts[role].advance||1;
      const baseSize=role==='normal'?102:(['shaky','rough'].includes(role)&&lines.length>1?104:110);
      const size=Math.min(baseSize*scale,Math.floor(850/Math.max(1,maximum)/advance));
      if(size/scale<68)throw Error('Rewrite into shorter phrases instead of shrinking captions');
      const align=speaker.side==='left'?4:speaker.side==='right'?6:5;
      const x=speaker.side==='left'?76:speaker.side==='right'?1004:540;
      const a=group.outputStart+(sub.start-group.start)/group.speed;
      const b=Math.min(group.outputStart+group.duration,group.outputStart+(sub.end-group.start)/group.speed);
      if(!(a>=0&&b>a&&b<=edit.duration+.01))throw Error('Caption escaped the validated timeline');
      const handdrawn=['shaky','rough'].includes(role);
      outlined(a,b,sub.speaker,sub.text,{font:fonts[role].family,size,x,y:284,align,fill:handdrawn?'#FFFFFF':speaker.color,outer:speaker.color,shaky:handdrawn,shake:sub.shake===true,scaleY:role==='reaction'?(lines.length>1?105:125):100});
      // The speaker ID stays in metadata; only position and colour are visible.
      audit.push({speaker:sub.speaker,side:speaker.side,start:a,end:b,text:sub.text,role,font:fonts[role].family,size,anchor:[x,284],alignment:align,shaky:role==='shaky',animatedShake:sub.shake===true});
    }
  }
  if(audit.length!==clip.cuts.reduce((n,c)=>n+(c.captions||[]).length,0))throw Error('A caption did not map to exactly one source run');
  return {ass,audit,layout};
}
