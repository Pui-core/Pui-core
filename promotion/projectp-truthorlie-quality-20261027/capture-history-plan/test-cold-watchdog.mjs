import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
test('direct cold stage refuses before its first mkdir when no watchdog owns it',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'pp129-direct-'));const bin=path.join(root,'bin');fs.mkdirSync(bin);
 const marker=path.join(root,'unexpected-mkdir');const shim=path.join(bin,'mkdir');fs.writeFileSync(shim,'#!/bin/sh\nprintf attempted > "$PP129_TEST_MARKER"\nexit 1\n',{mode:0o700});
 const out=spawnSync('/bin/bash',[path.join(here,'cold-stage-authorized.sh')],{env:{...process.env,PATH:bin+':'+process.env.PATH,PP129_TEST_MARKER:marker},encoding:'utf8',timeout:3000});
 assert.equal(out.status,78,'unguarded direct run must fail closed with EX_CONFIG');
 assert.equal(fs.existsSync(marker),false,'no mkdir or other cold IO before ownership guard');
 fs.rmSync(root,{recursive:true});
});

import {spawn} from 'node:child_process';
const cli = path.join(here, 'cold-watchdog.mjs');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
function fixture(t, body) {
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'pp129-watch-'));
  const script=path.join(base,'fixture.cjs');
  fs.writeFileSync(script, "const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process'); const root=process.argv[2];\n"+body);
  t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  return {base,script};
}
function launch(base,script,id,extra=[]) {
  const child=spawn(process.execPath,[cli,'run','--base',base,'--run-id',id,'--fixture',script,'--limit-ms','3000',...extra],
    {env:{...process.env,PP129_LOCAL_FIXTURE:'1'},stdio:['ignore','pipe','pipe']});
  let out='',err='',exit;
  child.stdout.on('data',data=>{out+=data;});child.stderr.on('data',data=>{err+=data;});
  const done=new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',(code,signal)=>{exit={code,signal,rows:out.trim().split('\n').filter(Boolean).map(JSON.parse),err};resolve(exit);});});
  return {child,done,rows:()=>out.trim().split('\n').filter(Boolean).map(JSON.parse),root:path.join(base,'projectp129-cold-'+id)};
}
async function until(check,limit=2000) {
  const deadline=Date.now()+limit;
  while(!check()) {if(Date.now()>deadline)throw Error('fixture readiness deadline');await wait(10);}
}
const last = result => result.rows.at(-1);
function alive(pid) {
  const out=spawnSync('/bin/ps',['-p',String(pid),'-o','stat='],{encoding:'utf8',timeout:1000});
  return out.status===0 && !out.stdout.trim().startsWith('Z');
}

test('normal CLI run drains large child stderr and saves an exclusive terminal receipt',async t=>{
  const f=fixture(t,"process.stderr.write('x'.repeat(262144));fs.writeFileSync(path.join(root,'actual'),'done');");
  const run=launch(f.base,f.script,'normal');const result=await run.done;
  assert.equal(result.code,0,JSON.stringify(result));assert.equal(last(result).outcome,'succeeded');
  assert.equal(last(result).terminal,true);assert.equal(last(result).jobLive,false);
  assert.equal(last(result).receiptSaved,true);assert.equal(fs.statSync(path.join(run.root,'stage.stderr')).size,262144);
  assert.equal(fs.statSync(run.root).mode&0o777,0o700);assert.ok(fs.existsSync(path.join(run.root,'active-cold.lock')));
  const observed=spawnSync(process.execPath,[cli,'observe','--root',run.root,'--wait-ms','100'],{encoding:'utf8',timeout:7000});
  assert.equal(observed.status,0,observed.stdout+observed.stderr);assert.equal(JSON.parse(observed.stdout).terminal,true);
});

test('child nonzero exit is failed, not successful terminal',async t=>{
  const f=fixture(t,"process.stderr.write('expected failure');process.exit(7);");
  const result=await launch(f.base,f.script,'failure').done;
  assert.equal(last(result).outcome,'failed');assert.equal(last(result).stageExitCode,7);
  assert.equal(last(result).terminal,true);assert.notEqual(result.code,0);
});

for(const phase of ['mkdir','intent','copy']) test('outer deadline includes '+phase+' IO',async t=>{
  const f=fixture(t,"fs.writeFileSync(path.join(root,'unexpected-execute'),'bad');");
  const start=Date.now();const run=launch(f.base,f.script,phase,['--limit-ms','250','--delay-at',phase,'--delay-ms','10000']);
  const result=await run.done;
  assert.ok(Date.now()-start<6000,JSON.stringify(result));assert.equal(last(result).outcome,'timed_out');
  assert.equal(last(result).terminal,true);assert.equal(last(result).jobLive,false);
  assert.equal(fs.existsSync(path.join(run.root,'unexpected-execute')),false);
  if(phase==='mkdir') assert.equal(last(result).receiptSaved,false,'root was never created; stdout result is not a saved receipt');
});

test('terminal status write has its own deadline and cannot turn an unsaved receipt into success',async t=>{
  const f=fixture(t,"process.exit(0);");
  const start=Date.now();const run=launch(f.base,f.script,'status',['--delay-at','status','--delay-ms','10000']);
  const result=await run.done;
  assert.ok(Date.now()-start<6500);assert.equal(last(result).receiptSaved,false);assert.notEqual(result.code,0);
  assert.equal(fs.existsSync(path.join(run.root,'watchdog-terminal.json')),false);
});

const descendantBody="const sub=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});fs.writeFileSync(path.join(root,'descendant.pid'),String(sub.pid));setInterval(()=>{},1000);";
test('job timeout stops its owned descendants and preserves the intent lock',async t=>{
  const f=fixture(t,descendantBody);const run=launch(f.base,f.script,'timeout',['--limit-ms','600']);
  await until(()=>fs.existsSync(path.join(run.root,'descendant.pid')));
  const pid=Number(fs.readFileSync(path.join(run.root,'descendant.pid'),'utf8'));
  const result=await run.done;
  assert.equal(last(result).outcome,'timed_out');assert.equal(last(result).terminal,true);
  assert.equal(alive(pid),false);assert.ok(fs.existsSync(path.join(run.root,'active-cold.lock')));
});

test('observation timeout reports the still-live job without ending or signaling it',async t=>{
  const f=fixture(t,descendantBody);const run=launch(f.base,f.script,'observe',['--limit-ms','6000']);
  t.after(()=>{if(run.child.exitCode===null)run.child.kill('SIGTERM');});
  await until(()=>fs.existsSync(path.join(run.root,'descendant.pid')));
  const pid=Number(fs.readFileSync(path.join(run.root,'descendant.pid'),'utf8'));
  const result=spawnSync(process.execPath,[cli,'observe','--root',run.root,'--wait-ms','50'],{encoding:'utf8',timeout:5000});
  assert.equal(result.status,2,result.stdout+result.stderr);const observation=JSON.parse(result.stdout);
  assert.equal(observation.observationTimedOut,true);assert.equal(observation.terminal,false);assert.equal(observation.jobLive,true);
  assert.equal(alive(pid),true);assert.equal(run.child.exitCode,null);
  run.child.kill('SIGTERM');const ended=await run.done;
  assert.equal(last(ended).outcome,'interrupted');assert.equal(last(ended).terminal,true);assert.equal(alive(pid),false);
});

test('same-run rejection and another run never overwrite or stop an existing live run',async t=>{
  const f=fixture(t,descendantBody);const control=launch(f.base,f.script,'control',['--limit-ms','6000']);
  t.after(()=>{if(control.child.exitCode===null)control.child.kill('SIGTERM');});
  await until(()=>fs.existsSync(path.join(control.root,'descendant.pid')));
  const before=fs.readFileSync(path.join(control.root,'intent.json'));
  const pid=Number(fs.readFileSync(path.join(control.root,'descendant.pid'),'utf8'));
  const duplicate=await launch(f.base,f.script,'control').done;
  assert.equal(duplicate.code,73);assert.equal(last(duplicate).outcome,'intent_rejected');
  assert.deepEqual(fs.readFileSync(path.join(control.root,'intent.json')),before);
  assert.equal(fs.existsSync(path.join(control.root,'watchdog-terminal.json')),false);assert.equal(alive(pid),true);
  const other=launch(f.base,f.script,'other',['--limit-ms','300']);const endedOther=await other.done;
  assert.equal(last(endedOther).outcome,'timed_out');assert.equal(alive(pid),true);
  const stalledDuplicate=await launch(f.base,f.script,'control',['--limit-ms','250','--delay-at','mkdir','--delay-ms','10000']).done;
  assert.equal(last(stalledDuplicate).receiptSaved,false,'an armed worker has not necessarily acquired its root');
  assert.equal(fs.existsSync(path.join(control.root,'watchdog-terminal.json')),false,'duplicate timing out before mkdir must not write into original root');
  assert.deepEqual(fs.readFileSync(path.join(control.root,'intent.json')),before);assert.equal(alive(pid),true);
  control.child.kill('SIGHUP');const ended=await control.done;
  assert.equal(last(ended).outcome,'interrupted');assert.equal(last(ended).terminal,true);assert.equal(alive(pid),false);
});

test('production cold execution is refused on Linux before creating a run root',t=>{
  const f=fixture(t,'');
  const result=spawnSync(process.execPath,[cli,'run','--base',f.base,'--run-id','refused'],{encoding:'utf8',timeout:3000});
  assert.equal(result.status,78);assert.equal(fs.existsSync(path.join(f.base,'projectp129-cold-refused')),false);
});

test('a blocked observe filesystem read is bounded and remains unverified',async t=>{
  const f=fixture(t,'');const root=path.join(f.base,'blocked-read');fs.mkdirSync(root);
  const made=spawnSync('/usr/bin/mkfifo',[path.join(root,'intent.json')],{timeout:1000});assert.equal(made.status,0);
  const start=Date.now();const result=spawnSync(process.execPath,[cli,'observe','--root',root,'--wait-ms','50'],{encoding:'utf8',timeout:6500});
  assert.ok(Date.now()-start<6000);assert.equal(result.status,78,result.stdout+result.stderr);
  assert.equal(JSON.parse(result.stdout).terminal,false);assert.match(JSON.parse(result.stdout).error,/unverified/);
});

test('a parent exiting zero with an unexpected live child cannot become succeeded',async t=>{
  const f=fixture(t,"const sub=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});fs.writeFileSync(path.join(root,'descendant.pid'),String(sub.pid));sub.unref();process.exit(0);");
  const run=launch(f.base,f.script,'orphan');const result=await run.done;
  assert.equal(last(result).outcome,'failed');assert.equal(last(result).cleanup.signaled,true);
  assert.equal(last(result).terminal,true);assert.equal(alive(Number(fs.readFileSync(path.join(run.root,'descendant.pid'),'utf8'))),false);
});
