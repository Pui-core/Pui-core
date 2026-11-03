import fs from 'node:fs';import path from 'node:path';
import {root,save,hash} from './runtime.mjs';
const [variant]=process.argv.slice(2);if(!['solo','collab'].includes(variant))throw Error('variant');
function normalized(file){
 const p=JSON.parse(fs.readFileSync(file)),c=Object.values(p.items).find(x=>x.kind?.type==='Comp').kind,ls=c.layers,names=new Map(ls.map(l=>[l.id,l.name]));
 const clean=v=>Array.isArray(v)?v.map(clean):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).filter(([k])=>!['id','uid','selected'].includes(k)).map(([k,x])=>[k,clean(x)])):v;
 return ls.filter(l=>!l.name.startsWith('RESERVATION ')&&!l.name.startsWith('ORIGINAL CHARACTER ')).map(l=>{const q=structuredClone(l);q.parent=q.parent===null?null:names.get(q.parent);if(q.source.type==='Footage'){const item=p.items[String(q.source.item)];q.source={type:'Footage',sha256:hash(item.kind.path)};}return clean(q);});
}
const n=path.join(root,'projects',variant+'-neutral.ecproj'),p=path.join(root,'projects',variant+'-production.ecproj');
const a=normalized(n),b=normalized(p);
if(JSON.stringify(a)!==JSON.stringify(b)){const diffs=a.map((v,i)=>JSON.stringify(v)===JSON.stringify(b[i])?null:v.name).filter(Boolean);throw Error('Shared structure differs: '+diffs.join(','));}
save(path.join(root,'qa',variant+'-neutral-production-compare.json'),{sharedStructureMatches:true,neutralSHA256:hash(n),productionSHA256:hash(p),excluded:'Only reservation shapes versus original character layers; character local transforms checked separately'});console.log('Shared structure matches: '+variant);
