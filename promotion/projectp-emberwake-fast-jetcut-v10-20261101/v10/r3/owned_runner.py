import ctypes, ctypes.wintypes as w, subprocess, os, json, time, pathlib, sys
ROOT=pathlib.Path(__file__).parent
sys.stdout.reconfigure(encoding='utf-8')
def run(name,args,timeout=180,input=None):
    # Private environment, no console or window-system connection; own Job only.
    env=os.environ.copy(); env.update(QT_QPA_PLATFORM='offscreen',QT_OPENGL='desktop',EFFECTCRAFT_CONFIG_DIR=str(ROOT/'runtime/ec'),XDG_CONFIG_HOME=str(ROOT/'runtime/config'),XDG_CACHE_HOME=str(ROOT/'runtime/cache'))
    k=ctypes.WinDLL('kernel32',use_last_error=True)
    k.CreateJobObjectW.restype=w.HANDLE; k.CreateJobObjectW.argtypes=[ctypes.c_void_p,w.LPCWSTR]
    k.AssignProcessToJobObject.argtypes=[w.HANDLE,w.HANDLE]; k.TerminateJobObject.argtypes=[w.HANDLE,w.UINT]; k.CloseHandle.argtypes=[w.HANDLE]
    job=k.CreateJobObjectW(None,None)
    # JOBOBJECT_EXTENDED_LIMIT_INFORMATION, Windows x64: kill descendants if the runner exits.
    k.SetInformationJobObject.argtypes=[w.HANDLE,ctypes.c_int,ctypes.c_void_p,w.DWORD]
    limits=ctypes.create_string_buffer(144); ctypes.c_uint32.from_buffer(limits,16).value=0x2000
    if not k.SetInformationJobObject(job,9,limits,144): raise ctypes.WinError(ctypes.get_last_error())
    start=time.time(); p=subprocess.Popen(args,stdin=subprocess.PIPE if input is not None else subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.PIPE,env=env,creationflags=subprocess.CREATE_NO_WINDOW | subprocess.BELOW_NORMAL_PRIORITY_CLASS)
    if not k.AssignProcessToJobObject(job,w.HANDLE(int(p._handle))):
        p.kill(); raise ctypes.WinError(ctypes.get_last_error())
    rec={'args':args,'pid':p.pid,'started':start,'timeoutSeconds':timeout,'offscreen':True,'sharedInput':0}
    (ROOT/'qa').mkdir(exist_ok=True); (ROOT/'qa'/f'{name}.running.json').write_text(json.dumps(rec,indent=2))
    timed=False
    try: out,err=p.communicate(input.encode() if input is not None else None,timeout=timeout)
    except subprocess.TimeoutExpired:
        timed=True; k.TerminateJobObject(job,124); out,err=p.communicate()
    k.TerminateJobObject(job,0); k.CloseHandle(job)
    rec.update(code=p.returncode,timedOut=timed,elapsed=time.time()-start,stdout=out.decode('utf8','replace'),stderr=err.decode('utf8','replace'))
    (ROOT/'qa'/f'{name}.json').write_text(json.dumps(rec,ensure_ascii=True,indent=2),encoding='utf8')
    print(json.dumps({'name':name,'code':p.returncode,'elapsed':rec['elapsed'],'stdout':rec['stdout'][-5000:],'stderr':rec['stderr'][-2000:]},ensure_ascii=False),flush=True)
    if timed or p.returncode: raise RuntimeError(name)
    return rec
if __name__=='__main__': run(sys.argv[1],sys.argv[2:])
