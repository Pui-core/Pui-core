import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const tool=process.env.PROJECTP_SOUNDCRAFT??'/home/pui/.local/share/projectp-bgm108/soundcraft-0.12.1/soundcraft-0.12.1-linux-x86_64/bin/soundcraft-cli';
const env={...process.env,SOUNDCRAFT_CONFIG_DIR:process.env.PROJECTP_SOUNDCRAFT_CONFIG??'/home/pui/.local/share/projectp-bgm108/soundcraft-config'};
const which=process.argv[2]??'full';if(!['full','short'].includes(which))throw Error('Specify full or short');
const mix=JSON.parse(fs.readFileSync(path.join(root,'source/native-mix.json'),'utf8'));
const score=JSON.parse(fs.readFileSync(path.join(root,'source/composition.json'),'utf8'));
const dirs=['qa/native-soundcraft','native','audio','audio/stems','audio/short-stems'];for(const d of dirs)fs.mkdirSync(path.join(root,d),{recursive:true});
const base=which==='full'?'connecting-lights':'connecting-lights-short',seconds=which==='full'?mix.fullSeconds:mix.shortSeconds;
const midi=path.join(root,'midi',base+'.mid'),session=path.join(root,'native',base+'.scraft');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const immutableMidiSha=sha(midi);
const calls=[];
function run(args,label){if(sha(midi)!==immutableMidiSha)throw Error('MIDI changed while native render');const began=new Date().toISOString();const r=spawnSync(tool,args,{encoding:'utf8',env,timeout:180000,maxBuffer:12e6});const call={label,began,finished:new Date().toISOString(),args,status:r.status,error:r.error?.message,stdout:r.stdout,stderr:r.stderr};calls.push(call);fs.writeFileSync(path.join(root,'qa/native-soundcraft',which+'-calls.json'),JSON.stringify({tool,toolSha256:sha(tool),configDir:env.SOUNDCRAFT_CONFIG_DIR,scope:'Dedicated Linux headless app; no GUI, no audio device, no Windows settings',calls},null,2)+'\n');if(r.error||r.status!==0||/warning: missing media:/i.test(r.stderr??''))throw Error(label+': '+(r.error?.message||r.stderr||r.stdout));return r.stdout;}
const cmds=[['session.new',{name:base,sample_rate:mix.sampleRate,bit_depth:mix.bitDepth}],['file.import_midi',{path:midi,at:0}]];
for(const t of mix.tracks){cmds.push(['mix.instrument',{track:t.name,plugin:t.plugin,params:t.params}],['mix.volume',{tracks:[t.name],db:t.faderDb+mix.commonFaderGainDb}],['mix.pan',{tracks:[t.name],index:0,pan:t.pan[0]}],['mix.pan',{tracks:[t.name],index:1,pan:t.pan[1]}]);for(let i=0;i<t.fx.length;i++)cmds.push(['mix.insert',{track:t.name,slot:i,...t.fx[i]}]);}
for(const s of score.sections){const start=which==='full'?0:score.shorts.startSeconds,end=which==='full'?80:score.shorts.endSeconds;if(s.seconds>=start&&s.seconds<end)cmds.push(['markers.add',{name:s.name,at:{seconds:s.seconds-start}}]);}
const args=['run'];for(const[id,p]of cmds)args.push('--cmd',id+'='+JSON.stringify(p));args.push('--save',session,'--inspect');
run(args,'Import original MIDI, assign actual native synths/FX/mixer, save editable session');
const reopened=run(['run','--in',session,'--cmd','session.audio_health={}','--inspect'],'Reopen native session and check loaded audio availability');
const range={start:{seconds:0},end:{seconds},format:'wav',bit_depth:24,fold_down:'stereo'};
const master=path.join(root,'audio',base+'-master.wav'),stems=path.join(root,'audio',which==='full'?'stems':'short-stems');
run(['run','--in',session,'--cmd','file.bounce_mix='+JSON.stringify({...range,path:master,normalize:false,dither:false}),'--cmd','file.bounce_stems='+JSON.stringify({...range,dir:stems})],'Bounce actual native mix and four musical performance stems');
const report={schemaVersion:1,which,state:'NATIVE_RENDERED_AUDIO_QA_PENDING',at:new Date().toISOString(),tool:'SoundCraft 0.12.1',toolSha256:sha(tool),session:'native/'+base+'.scraft',sessionSha256:sha(session),midi:'midi/'+base+'.mid',midiSha256:immutableMidiSha,master:'audio/'+base+'-master.wav',masterSha256:sha(master),seconds,sampleRate:mix.sampleRate,bitDepth:24,reopened:true,audioHealthReported:true,wholeSubjectiveListening:false};
fs.writeFileSync(path.join(root,'qa/native-soundcraft',which+'-render.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
