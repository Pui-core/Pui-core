import sys, pathlib, json, hashlib, contextlib, io
from owned_runner import run
R=pathlib.Path(__file__).parent
EC='C:/Program Files/EffectCraft/effectcraft-cli.exe'
FC='C:/Program Files/FilmCraft/filmcraft-cli.exe'
PC='C:/Program Files/PhotoCraft/photocraft-cli.exe'
FF='C:/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe'
FP='C:/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffprobe.exe'
RAW=(R.parent/'v08/circuit-capture01/capture.avi').as_posix()
TICK=254016000000
def native(tag,exe,args,input=None,timeout=180):
    with contextlib.redirect_stdout(io.StringIO()):
        p=run('v10-'+tag,[exe]+args,timeout,input)
    print(json.dumps({'nativeStep':tag,'code':p['code'],'seconds':round(p['elapsed'],2)}),flush=True)
    (R/'qa'/f'{tag}.json').write_bytes((json.dumps(p,ensure_ascii=False,indent=2)+'\n').encode('utf8'))
    return p
def jsrun(tag,project,commands,new=False):
    args=(['--save-as',project] if new else ['--project',project,'--save'])+['run','-']
    return native(tag,FC,args,'\n'.join(json.dumps(c,ensure_ascii=False) for c in commands)+'\n')
def results(rec):return [json.loads(l) for l in rec['stdout'].splitlines() if l.strip()]
def sha(p):return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
