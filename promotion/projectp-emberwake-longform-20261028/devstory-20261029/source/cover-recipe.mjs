import fs from 'node:fs';
import path from 'node:path';
import {native,hash,save} from './background.mjs';

// Invoke with owner-supplied capture roots; never bundle raw frames/Core/model binaries.
export async function buildCover({oldRoot,newRoot,out,qa}) {
  fs.mkdirSync(out,{recursive:true});fs.mkdirSync(qa,{recursive:true});
  const evidence=[];
  for (const [version,base] of [['old',oldRoot],['new',newRoot]]) {
    const capture=path.join(base,'capture.json');
    const j=JSON.parse(fs.readFileSync(capture));
    const c=j.cases.find(c=>c.case==='tap0');
    const peak=c.samples.reduce((a,b)=>b.position[1]<a.position[1]?b:a);
    const frame=path.join(base,'tap0','frame-'+String(peak.step).padStart(4,'0')+'.png');
    const crop=path.join(qa,version+'-tap0-crop4x.png');
    await native('photocraft',['run',frame,'--cmd','image.crop','--params',JSON.stringify({x:4,y:0,width:112,height:108,targetWidth:448,targetHeight:432,resample:'nearest',deleteCroppedPixels:true,contentAware:false}),'--out',crop,'--format','png'],path.join(qa,'crop-'+version+'.json'));
    evidence.push({version,peakStep:peak.step,height:c.height,camera:j.camera,logicalCrop:j.logical_crop,frameSha256:hash(frame),captureSha256:hash(capture),crop});
  }
  if (JSON.stringify(evidence[0].camera)!==JSON.stringify(evidence[1].camera)||JSON.stringify(evidence[0].logicalCrop)!==JSON.stringify(evidence[1].logicalCrop)) throw Error('Comparison mapping differs');
  const commands=[
  [
    "shape.create",
    {
      "kind": "rect",
      "rect": [
        0,
        0,
        1280,
        720
      ],
      "fill": "#f5f2ed",
      "name": "Paper"
    }
  ],
  [
    "type.create",
    {
      "name": "Game name",
      "text": "EMBERWAKE",
      "x": 64,
      "y": 48,
      "font": "Meiryo",
      "style": "Bold",
      "weight": 700,
      "size": 28,
      "color": "#267c68"
    }
  ],
  [
    "type.create",
    {
      "name": "Editorial context",
      "text": "制作秘話",
      "x": 1095,
      "y": 48,
      "font": "Meiryo",
      "style": "Bold",
      "weight": 700,
      "size": 26,
      "color": "#66717c"
    }
  ],
  [
    "type.create",
    {
      "name": "Main question",
      "text": "一瞬で離したのに？",
      "x": 58,
      "y": 143,
      "font": "Meiryo",
      "style": "Bold",
      "weight": 700,
      "size": 98,
      "color": "#20242c"
    }
  ],
  [
    "shape.create",
    {
      "kind": "rect",
      "rect": [
        64,
        165,
        1152,
        7
      ],
      "fill": "#d64949",
      "name": "Red rule"
    }
  ],
  [
    "shape.create",
    {
      "kind": "rect",
      "rect": [
        64,
        196,
        544,
        464
      ],
      "fill": "#193c42",
      "name": "Old field"
    }
  ],
  [
    "shape.create",
    {
      "kind": "rect",
      "rect": [
        672,
        196,
        544,
        464
      ],
      "fill": "#193c42",
      "name": "New field"
    }
  ],
  [
    "file.placeEmbedded",
    {
      "path": "OLD_CROP",
      "scale": 100,
      "fit": false,
      "center": [
        336,
        444
      ],
      "smartObject": true
    }
  ],
  [
    "file.placeEmbedded",
    {
      "path": "NEW_CROP",
      "scale": 100,
      "fit": false,
      "center": [
        944,
        444
      ],
      "smartObject": true
    }
  ],
  [
    "shape.create",
    {
      "kind": "rect",
      "rect": [
        64,
        196,
        544,
        54
      ],
      "fill": "#d64949",
      "name": "Old label field"
    }
  ],
  [
    "shape.create",
    {
      "kind": "rect",
      "rect": [
        672,
        196,
        544,
        54
      ],
      "fill": "#267c68",
      "name": "New label field"
    }
  ],
  [
    "type.create",
    {
      "name": "Old label",
      "text": "旧版",
      "x": 299,
      "y": 236,
      "font": "Meiryo",
      "style": "Bold",
      "weight": 700,
      "size": 36,
      "color": "#ffffff"
    }
  ],
  [
    "type.create",
    {
      "name": "New label",
      "text": "修正版",
      "x": 890,
      "y": 236,
      "font": "Meiryo",
      "style": "Bold",
      "weight": 700,
      "size": 36,
      "color": "#ffffff"
    }
  ],
  [
    "shape.create",
    {
      "kind": "rect",
      "rect": [
        87,
        608,
        498,
        3
      ],
      "fill": "#f5f2ed",
      "name": "Old floor marker"
    }
  ],
  [
    "shape.create",
    {
      "kind": "rect",
      "rect": [
        695,
        608,
        498,
        3
      ],
      "fill": "#f5f2ed",
      "name": "New floor marker"
    }
  ],
  [
    "type.create",
    {
      "name": "Input scope",
      "text": "同じ入力を自動比較",
      "x": 536,
      "y": 701,
      "font": "Meiryo",
      "style": "Bold",
      "weight": 700,
      "size": 23,
      "color": "#66717c"
    }
  ]
];
  for(const [id,p] of commands) if(id==='file.placeEmbedded') p.path=evidence[p.path==='OLD_CROP'?0:1].crop;
  const project=path.join(out,'emberwake-devstory-cover-v01.pcraft');
  const args=['run','--new',JSON.stringify({width:1280,height:720,resolution:72,name:'EMBERWAKE 146 tap0 question cover',background:'#f5f2ed'})];
  for(const [id,p]of commands)args.push('--cmd',id,'--params',JSON.stringify(p));
  await native('photocraft',[...args,'--out',project],path.join(qa,'cover-save.json'));
  await native('photocraft',['info',project,'--compact'],path.join(qa,'cover-reopen.json'));
  for(const ext of ['png','jpg'])await native('photocraft',['convert',project,path.join(out,'emberwake-devstory-cover-v01.'+ext),'--format',ext==='jpg'?'jpeg':'png'],path.join(qa,'cover-'+ext+'.json'));
  await native('photocraft',['run',project,'--cmd','image.crop','--params',JSON.stringify({x:0,y:0,width:1280,height:720,targetWidth:320,targetHeight:180,resample:'lanczos',deleteCroppedPixels:true}),'--out',path.join(out,'emberwake-devstory-cover-v01-320.png'),'--format','png'],path.join(qa,'cover320.json'));
  save(path.join(qa,'cover-source-binding.json'),{canvas:[1280,720],case:'tap0',samePhysicsUpdatePressRelease:true,eachVersionAtOwnPeak:true,additionalCrop:[4,0,112,108],magnification:4,placements:[[112,228],[720,228]],groundWorldY:1160,floorRuleY:608,evidence:evidence.map(({crop,...e})=>e)});
}
