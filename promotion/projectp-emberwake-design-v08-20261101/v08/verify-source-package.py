"""Bounded packaging delta QA; no new AV rendering/capture/full-suite run."""
import production as p,pathlib,json,subprocess,hashlib
R=p.R;WT=pathlib.Path('C:/Users/pui/.claude/worktrees/Pui-core-issue-156-design-v07');D=WT/'promotion/projectp-emberwake-design-v08-20261101'
GIT='C:/Program Files/Git/cmd/git.exe';OLD='promotion/projectp-emberwake-design-v07-20261101'
old_names=subprocess.check_output([GIT,'-C',str(WT),'ls-tree','-r','--name-only','-z','7d2d3aabaa0b71ff602a110e4c74cc6bb916e84b','--',OLD]).decode('utf8').strip('\0').split('\0')
for name in old_names:
    assert (WT/name).read_bytes()==subprocess.check_output([GIT,'-C',str(WT),'show','7d2d3aabaa0b71ff602a110e4c74cc6bb916e84b:'+name]),name
assert len(old_names)==71
manifest=json.loads((D/'依存manifest.json').read_text(encoding='utf8'))
for f in manifest['privateLargeMedia']:
    path=pathlib.Path(f['path']);assert path.stat().st_size==f['bytes'] and p.sha(path)==f['sha256']
refs=[]
def visit(obj,project):
    if isinstance(obj,dict):
        for k,v in obj.items():
            if k=='path' and isinstance(v,str) and v.startswith('C:/'):
                f=pathlib.Path(v);assert f.is_file(),v
                refs.append({'project':project,'path':v,'bytes':f.stat().st_size,'sha256':p.sha(f)})
            else:visit(v,project)
    elif isinstance(obj,list):
        for v in obj:visit(v,project)
projects=['circuit-cut.fcproj','circuit-final.fcproj','circuit-preview-v2.ecproj','code-draw-v2.pcraft','code-collision.pcraft','circle-before.pcraft','circle-after.pcraft']
reopened=[]
for name in projects:
    path=D/'v08/projects'/name;before=p.sha(path);assert before==p.sha(R/'projects'/name)
    if path.suffix=='.pcraft':args=['info',path.as_posix(),'--compact'];exe=p.PC
    elif path.suffix=='.fcproj':args=['--project',path.as_posix(),'inspect'];exe=p.FC;visit(json.loads(path.read_text(encoding='utf8')),name)
    else:args=['--gpu','--project',path.as_posix(),'info','--json'];exe=p.EC;visit(json.loads(path.read_text(encoding='utf8')),name)
    receipt=p.native('source-package-'+name+'-reopen',exe,args);assert receipt['code']==0 and before==p.sha(path)
    reopened.append({'file':path.as_posix(),'bytes':path.stat().st_size,'sha256':before,'reopenExit':0,'hashUnchangedAfterReopen':True})
    source=R/'qa'/('source-package-'+name+'-reopen.json');target=D/'v08/qa'/source.name
    with target.open('xb') as stream:stream.write(source.read_bytes())
for c in manifest['codeContext']:
    out=D/c['excerptFile'];source=R/'circuit-capture01/product'/c['sourceFile']
    assert p.sha(out)==c['exactExcerptSha256'] and p.sha(source)==c['fullFileSha256']
    assert out.read_bytes()==b''.join(source.read_bytes().splitlines(keepends=True)[c['lineStart']-1:c['lineEnd']])
final=R/'videos/emberwake-v08-code-circuit-preview17.mp4';assert p.sha(final)=='f036237e819b3b39e52d53bdaf6869f961bcaf52b183082628fa69c0c5c452d6' and final.stat().st_size==2465514
result={'scope':'Source packaging delta only; no new render, encode, capture or full suite','finalSha256':p.sha(final),'finalBytes':final.stat().st_size,'oldV07Commit':'7d2d3aabaa0b71ff602a110e4c74cc6bb916e84b','oldV07FilesByteUnchanged':len(old_names),'newPrefixOnly':D.relative_to(WT).as_posix(),'coreFilesByteVerifiedAgainstFixedGit':71,'coreChanged':[],'nativeReopened':reopened,'nativeMediaReferences':refs,'nativeMissing':0,'codeContextExactBytes':len(manifest['codeContext']),'containerSeconds':17.002,'videoSeconds':17.0,'audioSeconds':17.002,'existingAVQAReusedFromIdenticalFinalSHA':'v08/qa/delivery.json','cloneAloneStandalone':False,'wholeRealtimeViewing':False,'subjectiveListen':False,'physicalMobile':False,'independentQA':'pending Root existing Reviewer','ownerCreativeAcceptance':'pending'}
(R/'qa/source-package-check.json').write_bytes((json.dumps(result,ensure_ascii=False,indent=2)+'\n').encode('utf8'))
with (D/'v08/qa/source-package-check.json').open('xb') as stream:stream.write((R/'qa/source-package-check.json').read_bytes())
print(json.dumps({'oldFilesUnchanged':len(old_names),'nativeReopen':len(reopened),'mediaRefs':len(refs),'missing':0,'finalSha':p.sha(final)}))
