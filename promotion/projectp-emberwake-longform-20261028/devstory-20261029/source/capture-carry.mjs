import fs from 'node:fs';import{spawn}from'node:child_process';import{run}from'./background.mjs';
const root='/home/pui/tmp/projectp146-capture',repo='/mnt/f/dev/EMBERWAKE';
console.log(JSON.stringify({phase:'C-extra-capture',pid:process.pid,privateOnly:true}));
for(const[label,commit]of[['old','9c667ee'],['new','85d3607']]){
 const copy=root+'/copies/c-'+label;if(fs.existsSync(copy))throw Error('Keep previous C copy; inspect before resuming');fs.mkdirSync(copy,{recursive:true});
 await new Promise((ok,bad)=>{const a=spawn('git',['-C',repo,'archive',commit],{stdio:['ignore','pipe','pipe']}),b=spawn('tar',['-x','-C',copy]);a.stdout.pipe(b.stdin);b.on('close',c=>c===0?ok():bad(Error('archive')));});
 fs.mkdirSync(copy+'/qa146',{recursive:true});fs.copyFileSync(new URL('./carry-capture.gd',import.meta.url),copy+'/qa146/carry-capture.gd');
 const env={XDG_DATA_HOME:root+'/userdata/c-'+label};fs.mkdirSync(env.XDG_DATA_HOME,{recursive:true});
 await run('/home/pui/.local/bin/godot',['--headless','--path',copy,'--import'],root+'/logs/c-'+label+'-import.json',{env,failOnScriptError:true,timeoutMs:90000});
 await run('/home/pui/.local/bin/godot',['--path',copy,'--script','res://qa146/carry-capture.gd','--fixed-fps','60','--resolution','1280x720','--audio-driver','Dummy','--','--out='+root+'/output/c-'+label],root+'/logs/c-'+label+'-capture.json',{privateDisplay:true,env,failOnScriptError:true,timeoutMs:90000});
}
console.log(JSON.stringify({complete:true,root:root+'/output/c-{old,new}'}));
