import production as p,pathlib,json
R=p.R;WT=pathlib.Path('C:/Users/pui/.claude/worktrees/Pui-core-issue-156-explainer-v09');D=WT/'promotion/projectp-emberwake-explainer-v09-20261101'
manifest=json.loads((D/'依存manifest.json').read_text(encoding='utf8'))
for entry in manifest['media']:
    path=pathlib.Path(entry['path']);assert path.is_file() and path.stat().st_size==entry['bytes'] and p.sha(path)==entry['sha256']
names=['explainer-cut.fcproj','explainer-final-r2.fcproj','explainer.ecproj','control-clear.pcraft','target-outline.pcraft','control-occluded.pcraft','state-label.pcraft'];checks=[]
for name in names:
    path=D/'v09/projects'/name;before=p.sha(path);assert before==p.sha(R/'projects'/name)
    if path.suffix=='.pcraft':exe=p.PC;args=['info',path.as_posix(),'--compact']
    elif path.suffix=='.fcproj':exe=p.FC;args=['--project',path.as_posix(),'inspect']
    else:exe=p.EC;args=['--gpu','--project',path.as_posix(),'info','--json']
    rec=p.native('source-package-'+name+'-reopen',exe,args);assert rec['code']==0 and p.sha(path)==before
    checks.append({'file':path.as_posix(),'sha256':before,'bytes':path.stat().st_size,'reopen':0,'hashAfterReopenSame':True})
    receipt=R/'qa'/('source-package-'+name+'-reopen.json')
    with (D/'v09/qa'/receipt.name).open('xb') as f:f.write(receipt.read_bytes())
for asset in manifest['reusedPhotoCraftCodeOriginals']:
    path=pathlib.Path(asset['file']);assert p.sha(path)==asset['sha256']
    rec=p.native('reused-'+path.name+'-reopen',p.PC,['info',path.as_posix(),'--compact']);assert rec['code']==0 and p.sha(path)==asset['sha256']
qa=json.loads((D/'v09/qa/delivery-r2.json').read_text(encoding='utf8'));assert p.sha(pathlib.Path(qa['final']))==qa['sha256']
result={'scope':'v09 packaging delta; no new movie rendering or full suite','finalSha256':qa['sha256'],'finalBytes':qa['bytes'],'nativeNewCopiesReopened':checks,'reusedPhotoCraftCodeOriginalsReopened':2,'mediaSHAPathsVerified':len(manifest['media']),'missing':0,'coreFilesSHAUnchanged':71,'rawAndV08EvidenceReuse':'収録再利用binding.json, immutable Source5053981d plus current private SHA checks','wholeRealtimeWatch':False,'subjectiveListen':False,'physicalMobile':False,'independentReview':'pending Root','ownerCreativeAcceptance':'pending'}
(R/'qa/source-package-check.json').write_bytes((json.dumps(result,ensure_ascii=False,indent=2)+'\n').encode('utf8'))
with (D/'v09/qa/source-package-check.json').open('xb') as f:f.write((R/'qa/source-package-check.json').read_bytes())
print(json.dumps({'nativeCopiesReopened':len(checks),'reusedPC':2,'mediaPaths':len(manifest['media']),'missing':0,'finalSha256':qa['sha256']}))
