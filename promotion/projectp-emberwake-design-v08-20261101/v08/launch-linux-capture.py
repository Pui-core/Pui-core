import pathlib, os, json, subprocess, signal, time, hashlib
root=pathlib.Path('/mnt/c/Users/pui/private-use/emberwake-video156-20261101/v08/circuit-capture01')
intent=root/'launch.json'
if intent.exists():raise RuntimeError('Owned launch already exists; inspect, never blind resend')
version=subprocess.run(['/home/pui/.local/bin/godot','--version'],capture_output=True,text=True,timeout=10)
if version.returncode or '4.6.3.stable.official.7d41c59c4' not in version.stdout:raise RuntimeError('Pinned Godot engine mismatch: '+version.stdout)
assert os.getuid()==1000
pre=json.loads((root/'preflight.json').read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
for f in pre['coreFiles']:assert sha(root/'product'/f['file'])==f['sha256']
env=os.environ.copy();env.update(XDG_DATA_HOME=str(root/'userdata'),XDG_CONFIG_HOME=str(root/'config'),XDG_CACHE_HOME=str(root/'cache'),LP_NUM_THREADS='2',OMP_NUM_THREADS='2',LIBGL_ALWAYS_SOFTWARE='1')
for key in ['DISPLAY','WAYLAND_DISPLAY','DBUS_SESSION_BUS_ADDRESS','XAUTHORITY']:env.pop(key,None)
args=['/usr/bin/nice','-n','10','/usr/bin/xvfb-run','-a','-s','-screen 0 960x540x24 -nolisten tcp','/home/pui/.local/bin/godot','--path',str(root/'product'),'--rendering-method','gl_compatibility','--audio-driver','Dummy','--fixed-fps','30','--disable-vsync','--resolution','960x540','--write-movie',str(root/'capture.avi'),'--script',str(root/'capture-circuit.gd'),'--','--out',str(root)]
rec=dict(started=time.time(),args=args,uid=os.getuid(),state='intent',timeoutSeconds=240,sharedDesktopInput=0,engine=version.stdout.strip())
intent.write_text(json.dumps(rec,indent=2))
with open(root/'capture.log','x',encoding='utf8') as log:
    p=subprocess.Popen(args,env=env,stdout=log,stderr=subprocess.STDOUT,stdin=subprocess.DEVNULL,start_new_session=True)
    rec.update(pid=p.pid,state='running');intent.write_text(json.dumps(rec,indent=2))
    try:code=p.wait(timeout=240)
    except subprocess.TimeoutExpired:
        os.killpg(p.pid,signal.SIGTERM);code=p.wait(timeout=10);rec['timedOut']=True
rec.update(code=code,state='terminated',ended=time.time())
rec['coreChanged']=[f['file'] for f in pre['coreFiles'] if sha(root/'product'/f['file'])!=f['sha256']]
intent.write_text(json.dumps(rec,indent=2))
print(json.dumps(rec))
print((root/'capture.log').read_text(encoding='utf8',errors='replace')[-3500:])
if code or rec.get('timedOut') or rec['coreChanged']:raise RuntimeError('Owned capture failed; evidence preserved')
