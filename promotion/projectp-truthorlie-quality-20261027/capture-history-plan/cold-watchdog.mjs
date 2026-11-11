#!/usr/bin/env node
// Issue 129 only: local cold backup boundary. No SSH, boot, GUI or recording.
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const self = fileURLToPath(import.meta.url);
const here = path.dirname(self);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const emit = value => process.stdout.write(JSON.stringify(value) + '\n');
const outputLimit = 65536;
const inventoryLimit = 4 * 1024 * 1024;
const append = (old, chunk) => (old + chunk).slice(-outputLimit);
const number = (value, fallback, max) => {
  const n = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(n) || n < 1 || n > max) throw Error('invalid finite time budget');
  return n;
};

// A ps probe has its own finite deadline and owns only its spawned process group.
async function snapshot() {
  const child = spawn('/bin/ps', ['-axo', 'pid=,ppid=,pgid=,uid=,lstart=,stat=,args='],
    {detached: true, stdio: ['ignore', 'pipe', 'pipe']});
  let out = '', err = '', expired = false;
  child.stdout.on('data', data => { if (out.length <= inventoryLimit) out += data; });
  child.stderr.on('data', data => { err = append(err, data); });
  // Process inventory can exceed a diagnostic tail; never authorize cleanup from a truncated list.
  let bytes = 0;
  child.stdout.on('data', data => { bytes += data.length; });
  const timer = setTimeout(() => { expired = true; try { process.kill(-child.pid, 'SIGKILL'); } catch {} }, 1500);
  const result = await new Promise(resolve => {
    child.once('error', error => resolve({error: error.message}));
    child.once('close', (code, signal) => resolve({code, signal}));
    // A kernel-stuck probe must not make its caller unbounded.
    setTimeout(() => resolve({error: 'ps probe observation deadline'}), 1900).unref();
  });
  clearTimeout(timer);
  child.stdout.destroy(); child.stderr.destroy(); child.unref();
  if (expired || result.error || result.code !== 0 || bytes > inventoryLimit) throw Error('unverified process inventory: ' + (result.error || err || 'timeout/truncation'));
  return out.split('\n').flatMap(line => {
    const m = line.match(/^\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\S+\s+\S+\s+\d+\s+\S+\s+\d+)\s+(\S+)\s+(.*)$/);
    return m ? [{pid:+m[1], ppid:+m[2], pgid:+m[3], uid:+m[4], birth:m[5], stat:m[6], args:m[7]}] : [];
  });
}
const same = (a, b) => a && b && a.pid === b.pid && a.uid === b.uid && a.birth === b.birth && a.pgid === b.pgid;
const live = row => row && !row.stat.startsWith('Z');

async function stopOwned(identity) {
  if (!identity) return {confirmed: false, reason: 'worker identity not established'};
  let signaled = false;
  for (const signal of ['SIGTERM', 'SIGKILL']) {
    const rows = await snapshot();
    const members = rows.filter(row => row.pgid === identity.pgid && live(row));
    if (!members.length) return {confirmed: true, residual: [], signaled};
    const leader = rows.find(row => row.pid === identity.pid);
    if ((leader && !same(leader, identity)) || members.some(row => row.uid !== identity.uid))
      return {confirmed: false, reason: 'process group identity changed'};
    // detached:true created this run's session/group; never signal any pre-existing group.
    try { process.kill(-identity.pgid, signal); } catch (error) { if (error.code !== 'ESRCH') throw error; }
    signaled = true;
    await sleep(signal === 'SIGTERM' ? 200 : 100);
  }
  const residual = (await snapshot()).filter(row => row.pgid === identity.pgid && live(row)).map(row => row.pid);
  return {confirmed: residual.length === 0, residual, signaled};
}

// Every filesystem operation is in this owned, bounded group, including prepare and final receipt IO.
async function owned(task, limitMs, onReady = () => {}) {
  const child = spawn(process.execPath, [self, '_worker', JSON.stringify(task)],
    {detached: true, stdio: ['ignore', 'pipe', 'pipe', 'ipc']});
  let stdout = '', stderr = '', identity, interrupted, timedOut = false, armed = false;
  let exitResult, finish;
  const exited = new Promise(resolve => { finish = resolve; });
  child.stdout.on('data', data => { stdout = append(stdout, data); });
  child.stderr.on('data', data => { stderr = append(stderr, data); });
  child.once('error', error => { exitResult = {code: null, error:error.message}; finish(); });
  child.once('exit', (code, signal) => { exitResult = {code, signal}; finish(); });
  let notifyStop;
  const stopped = new Promise(resolve => { notifyStop = resolve; });
  const interrupt = signal => { interrupted = signal; notifyStop(); };
  const term = () => interrupt('SIGTERM'), hup = () => interrupt('SIGHUP'), int = () => interrupt('SIGINT');
  process.on('SIGTERM', term); process.on('SIGHUP', hup); process.on('SIGINT', int);
  const timer = setTimeout(() => { timedOut = true; notifyStop(); }, limitMs);
  try {
    const rows = await snapshot();
    identity = rows.find(row => row.pid === child.pid);
    if (!identity || identity.pgid !== child.pid || identity.ppid !== process.pid || identity.uid !== process.getuid() || !identity.args.includes(self))
      throw Error('cannot establish owned worker identity');
    child.on('message', message => { if (message.kind === 'ready') onReady(message); });
    if (!exitResult && !timedOut && !interrupted) {
      child.send({kind:'arm', identity, supervisorPid:process.pid}); armed = true;
    }
    await Promise.race([exited, stopped]);
  } catch (error) {
    stderr = append(stderr, error.message);
  } finally {
    clearTimeout(timer);
  }
  let cleanup;
  try { cleanup = await stopOwned(identity); } catch (error) { cleanup = {confirmed:false, reason:error.message}; }
  process.off('SIGTERM', term); process.off('SIGHUP', hup); process.off('SIGINT', int);
  if (child.connected) child.disconnect();
  // Never wait indefinitely for inherited stdout/stderr handles or an uninterruptible child.
  child.stdout.destroy(); child.stderr.destroy(); child.unref();
  return {armed, identity, ...exitResult, timedOut, interrupted, cleanup, stdout, stderr};
}

function worker(task) {
  process.once('message', async message => {
    if (message.kind !== 'arm' || message.identity.pid !== process.pid) process.exit(78);
    const delay = label => {
      if (task.fixture?.delayAt === label) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, task.fixture.delayMs);
    };
    try {
      if (task.kind === 'read') { delay('read'); emit(JSON.parse(fs.readFileSync(task.file, 'utf8'))); process.exit(0); }
      if (task.kind === 'finish') {
        const intent = JSON.parse(fs.readFileSync(path.join(task.root, 'intent.json'), 'utf8'));
        if (intent.token !== task.receipt.token || intent.root !== task.root)
          throw Error('finish refused: this invocation never acquired the root intent');
        delay('status'); fs.writeFileSync(path.join(task.root, 'watchdog-terminal.json'), JSON.stringify(task.receipt, null, 2)+'\n', {flag:'wx',mode:0o600});
        process.exit(0);
      }
      delay('mkdir');
      fs.mkdirSync(task.root, {mode:0o700}); // Non-recursive/exclusive: an existing intent or lock is never reused.
      const intent = {version:1, runId:task.runId, token:task.token, root:task.root, createdAt:new Date().toISOString(),
        supervisor:message.supervisorPid, worker:message.identity, kind:task.fixture ? 'local-fixture' : 'mac-cold', limitMs:task.limitMs,
        runtime:{version:process.version,executable:process.execPath,platform:process.platform}};
      delay('intent');
      fs.writeFileSync(path.join(task.root, 'intent.json'), JSON.stringify(intent,null,2)+'\n', {flag:'wx',mode:0o600});
      fs.mkdirSync(path.join(task.root, 'active-cold.lock'), {mode:0o700});
      fs.mkdirSync(path.join(task.root, 'backup'), {mode:0o700});
      fs.mkdirSync(path.join(task.root, 'helpers'), {mode:0o700});
      delay('copy');
      for (const name of ['history-data-inspect-prepared.rb','cold-manifest-prepared.rb','target-consumers-prepared.rb','verify-cold.rb'])
        fs.copyFileSync(path.join(here,name), path.join(task.root,'helpers',name), fs.constants.COPYFILE_EXCL);
      const stdout = fs.openSync(path.join(task.root, 'stage.stdout'), 'wx', 0o600);
      const stderr = fs.openSync(path.join(task.root, 'stage.stderr'), 'wx', 0o600);
      process.send({kind:'ready',root:task.root,worker:message.identity});
      const argv = task.fixture ? [task.fixture.script, task.root] : [path.join(here,'cold-stage-authorized.sh')];
      const executable = task.fixture ? process.execPath : '/bin/bash';
      const child = spawn(executable, argv, {stdio:['ignore',stdout,stderr], env:{...process.env,
        PP129_RUN_ROOT:task.root, PP129_RUN_TOKEN:task.token, PP129_WORKER_PID:String(process.pid), PP129_WATCHDOG_PID:String(message.supervisorPid)}});
      child.once('error', error => { process.stderr.write(error.message); process.exit(70); });
      child.once('exit', (code, signal) => { process.exit(signal ? 70 : code ?? 70); });
    } catch (error) { process.stderr.write(error.code + ': ' + error.message + '\n'); process.exit(error.code === 'EEXIST' ? 73 : 70); }
  });
  // A supervisor disappearing before arm cannot leave a worker waiting forever.
  process.once('disconnect', () => process.exit(75));
}

async function readBounded(file, limitMs = 2500) {
  const result = await owned({kind:'read',file}, limitMs);
  if (result.code !== 0 || !result.cleanup.confirmed) throw Error('receipt read unverified: '+result.stderr);
  return JSON.parse(result.stdout);
}

async function main() {
  const [mode, ...args] = process.argv.slice(2);
  if (mode === '_worker') { worker(JSON.parse(args[0])); return; }
  const opts = {};
  for (let i=0;i<args.length;i+=2) { if (!args[i].startsWith('--') || args[i+1] === undefined) throw Error('key/value arguments required'); opts[args[i].slice(2)] = args[i+1]; }
  if (mode === 'run') {
    const runId = opts['run-id'] || new Date().toISOString().replace(/[^0-9TZ]/g,'')+'-'+randomUUID().slice(0,8);
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(runId) || !path.isAbsolute(opts.base || '')) throw Error('absolute --base and safe unique run-id required');
    let fixture;
    if (opts.fixture) {
      if (process.env.PP129_LOCAL_FIXTURE !== '1' || !['linux','darwin'].includes(process.platform) || !path.isAbsolute(opts.fixture)) throw Error('fixture requires explicit local Linux/Darwin test mode');
      fixture = {script:opts.fixture, delayAt:opts['delay-at'], delayMs:number(opts['delay-ms'],1000,30000)};
    } else if (process.platform !== 'darwin' || opts['cold-read-go'] !== '129' || opts.base !== '/Users/pui-mac-core/codex-install') {
      throw Error('cold run requires explicit fresh Root GO129 on the Mac; runtime/authorization unverified here');
    }
    const root = path.join(opts.base, 'projectp129-cold-'+runId);
    const task = {kind:'run',runId,root,token:randomUUID(),fixture,limitMs:number(opts['limit-ms'],600000,600000)};
    emit({kind:'started',root,supervisor:process.pid,terminal:false});
    const result = await owned(task, task.limitMs, message => emit(message));
    // mkdir EEXIST is a rejected new intent. Absolutely no receipt write into that old root.
    if (result.code === 73) { emit({root,outcome:'intent_rejected',terminal:false,jobLive:null,...result}); process.exitCode=73; return; }
    const outcome = !result.cleanup.confirmed ? 'cleanup_incomplete' : result.interrupted ? 'interrupted' : result.timedOut ? 'timed_out' : result.code === 0 && !result.cleanup.signaled ? 'succeeded' : 'failed';
    const receipt = {version:1,root,runId,token:task.token,outcome,terminal:result.cleanup.confirmed,jobLive:result.cleanup.confirmed ? false : null,
      endedAt:new Date().toISOString(),worker:result.identity,stageExitCode:result.code ?? null,stageSignal:result.signal ?? null,
      cleanup:result.cleanup,scope:fixture ? 'local-fixture-only' : 'cold-only; no UI/recording',macValidated:false};
    const write = result.armed ? await owned({kind:'finish',root,receipt,fixture},2500) : null;
    emit({...receipt,receiptSaved:write?.code === 0 && write.cleanup.confirmed,diagnostic:result.stderr,receiptError:write?.stderr || null});
    process.exitCode = outcome === 'succeeded' && write?.code === 0 && write.cleanup.confirmed ? 0 : outcome === 'timed_out' ? 124 : outcome === 'interrupted' ? 130 : 75;
  } else if (mode === 'observe') {
    if (!path.isAbsolute(opts.root || '')) throw Error('absolute --root required');
    const waitMs = number(opts['wait-ms'],1000,30000), stopAt=Date.now()+waitMs;
    let observation;
    do {
      const intent = await readBounded(path.join(opts.root,'intent.json'));
      if (intent.root !== opts.root) throw Error('intent/root mismatch');
      const rows = await snapshot();
      const current = rows.find(row => row.pid === intent.worker.pid);
      const members = rows.filter(row => row.pgid === intent.worker.pgid && live(row));
      const jobLive = same(current,intent.worker) && live(current);
      let receipt;
      try { receipt = await readBounded(path.join(opts.root,'watchdog-terminal.json')); } catch {}
      const verifiedReceipt = receipt?.token === intent.token && receipt.root === opts.root;
      const terminal = verifiedReceipt && receipt.terminal === true && members.length === 0;
      observation = {root:opts.root,jobLive:Boolean(jobLive),groupLive:members.length>0,terminal:Boolean(terminal),
        outcome:terminal ? receipt.outcome : 'unverified_or_running',observationTimedOut:false};
      if (terminal) break;
      if (Date.now()<stopAt) await sleep(Math.min(50,stopAt-Date.now()));
    } while (Date.now()<stopAt);
    observation.observationTimedOut = !observation.terminal;
    emit(observation); process.exitCode=observation.terminal ? 0 : 2;
  } else throw Error('use run or observe; no remote execution is performed by this script');
}
main().catch(error => { emit({outcome:'refused',terminal:false,error:error.message}); process.exitCode=78; });
