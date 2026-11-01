from run import *
import hashlib, shutil
old=pathlib.Path('//wsl.localhost/Ubuntu/home/pui/private-use/projectp156-v06-case-20261031')
source=pathlib.Path('//wsl.localhost/Ubuntu/home/pui/.claude/worktrees/Pui-core-issue-156-lamp-sync-v06/promotion/projectp-emberwake-intro60-20261030')
attempt=ROOT/'attempt01'; attempt.mkdir(exist_ok=False)
for d in ['projects','media','videos','qa','dependencies','source']: (attempt/d).mkdir()
for p in (source/'source').glob('*'): shutil.copy2(p,attempt/'source'/p.name)
j=json.loads((old/'projects/intro65-v06.ecproj').read_text(encoding='utf8'))
refs=set()
def walk(x):
    if isinstance(x,str) and x.startswith(('/mnt/f/','/home/pui/')): refs.add(x)
    elif isinstance(x,dict):
        for v in x.values(): walk(v)
    elif isinstance(x,list):
        for v in x: walk(v)
walk(j); manifest=[]; mapping={}
def sha(p): return hashlib.file_digest(open(p,'rb'),'sha256').hexdigest()
for i,r in enumerate(sorted(refs)):
    p=pathlib.Path('F:/'+r[7:]) if r.startswith('/mnt/f/') else pathlib.Path('//wsl.localhost/Ubuntu'+r)
    if not p.is_file(): raise RuntimeError(r)
    dest=attempt/'dependencies'/f'{i:03d}-{p.name}'; shutil.copy2(p,dest)
    h=sha(p); assert h==sha(dest)
    mapping[r]=dest.as_posix(); manifest.append({'original':r,'copy':dest.as_posix(),'sha256':h,'bytes':dest.stat().st_size})
def replace(x):
    if isinstance(x,str): return mapping.get(x,x)
    if isinstance(x,dict): return {k:replace(v) for k,v in x.items()}
    if isinstance(x,list): return [replace(v) for v in x]
    return x
(attempt/'projects/intro65-v06.ecproj').write_text(json.dumps(replace(j),ensure_ascii=False,indent=2),encoding='utf8')
for p in (old/'media').glob('*-r6.*'):
    dest=attempt/'media'/p.name; shutil.copy2(p,dest); assert sha(p)==sha(dest)
    manifest.append({'original':str(p),'copy':dest.as_posix(),'sha256':sha(dest),'bytes':dest.stat().st_size})
shutil.copy2(old/'qa/audio-binding-r6.json',attempt/'qa/audio-binding-r6.json')
(attempt/'qa/staging-manifest.json').write_text(json.dumps({'head':'d4d05aba3ac7247b3b99c2d3e2c4fd22aa69e419','ecOriginalSha256':sha(old/'projects/intro65-v06.ecproj'),'ecWindowsSha256':sha(attempt/'projects/intro65-v06.ecproj'),'exactValuePathMapping':mapping,'files':manifest},ensure_ascii=False,indent=2),encoding='utf8')
print('Staged',len(refs),'EC references;',len(manifest),'files')
