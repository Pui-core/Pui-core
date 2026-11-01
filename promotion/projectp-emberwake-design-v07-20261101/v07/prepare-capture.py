import pathlib, subprocess, hashlib, shutil, json
root=pathlib.Path(__file__).parent
case=root/'episode2-capture01';case.mkdir(exist_ok=False)
product=pathlib.Path('//wsl.localhost/Ubuntu/home/pui/tmp/projectp112-capture-20261026/product')
target=case/'product'
shutil.copytree(product,target)
git='C:/Program Files/Git/cmd/git.exe';pin='71584a6bd0c8852885157de71032fd9252e7a04c'
checks=[]
for p in target.rglob('*'):
    if not p.is_file() or not (p.suffix in ['.gd','.tscn'] or p.name=='project.godot'):continue
    rel=p.relative_to(target).as_posix()
    if rel.startswith('.godot/'):continue
    expected=subprocess.check_output([git,'-C','F:/dev/EMBERWAKE','show',pin+':'+rel],timeout=20)
    actual=p.read_bytes()
    if actual!=expected:raise RuntimeError('Product snapshot differs from pinned Source: '+rel)
    checks.append({'file':rel,'sha256':hashlib.sha256(actual).hexdigest()})
base=pathlib.Path('F:/Videos/ProjectP-EMBERWAKE-Longform-2026-10-28/firstcut-04/source/capture-episode.gd')
shutil.copy2(base,case/'capture-base.gd')
shutil.copy2(root/'capture-ep02.gd',case/'capture-ep02.gd')
seed=pathlib.Path('//wsl.localhost/Ubuntu/home/pui/tmp/projectp-emberwake-longform-20261028/production/ep01-replay-controls01-userdata/godot/app_userdata/EMBERWAKE/emberwake-campaign-1.0-jump-1.1.json')
data=json.loads(seed.read_text(encoding='utf8'));assert data['completed']==[1]
save=case/'userdata/godot/app_userdata/EMBERWAKE'/seed.name;save.parent.mkdir(parents=True);shutil.copy2(seed,save)
binding={'sourceCommit':pin,'gameVersion':'0.12.0','sourceProduct':str(product),'snapshot':str(target),'coreFiles':checks,'seed':str(seed),'seedSha256':hashlib.sha256(seed.read_bytes()).hexdigest(),'completedBefore':[1],'previousCapture':'ep01-replay-controls01, legitimate ordinary completed save; no save setters','originalProductModified':False}
(case/'preflight.json').write_bytes((json.dumps(binding,ensure_ascii=False,indent=2)+'\n').encode('utf8'))
print('Pinned core files:',len(checks),'seed:',binding['seedSha256'])
