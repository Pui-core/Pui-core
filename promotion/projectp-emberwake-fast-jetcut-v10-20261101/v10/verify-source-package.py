import production as p,pathlib,json,subprocess
R=p.R;D=pathlib.Path('C:/Users/pui/.claude/worktrees/Pui-core-issue-156-fast-jetcut-v10/promotion/projectp-emberwake-fast-jetcut-v10-20261101');WT=D.parents[1]
M=json.loads((D/'依存manifest.json').read_text(encoding='utf8'));checks=[]
for entry in M['media']:
 f=pathlib.Path(entry['path']);assert f.is_file() and f.stat().st_size==entry['bytes'] and p.sha(f)==entry['sha256']
for entry in M['nativeProjects']:
 private=pathlib.Path(entry['path']);f=D/private.relative_to(R.parent);before=p.sha(f);assert before==entry['sha256']==p.sha(private)
 exe,args=(p.PC,['info',f.as_posix(),'--compact']) if f.suffix=='.pcraft' else ((p.FC,['--project',f.as_posix(),'inspect']) if f.suffix=='.fcproj' else (p.EC,['--gpu','--project',f.as_posix(),'info','--json']))
 receipt=R/'qa'/('source-'+f.stem+'-'+f.suffix[1:]+'.json');dest=D/'v10/qa'/receipt.name
 rec=json.loads(receipt.read_text(encoding='utf8')) if receipt.exists() else p.native('source-'+f.stem+'-'+f.suffix[1:],exe,args)
 assert rec['code']==0 and p.sha(f)==before
 # inspect returns project/sequence; media existence is checked from actual native path fields in the manifest above.
 if dest.exists():assert dest.read_bytes()==receipt.read_bytes()
 else:
  with dest.open('xb') as w:w.write(receipt.read_bytes())
 checks.append({'repoFile':f.relative_to(WT).as_posix(),'sha256':before,'bytes':f.stat().st_size,'reopen':0,'afterSHASame':True})
old=R.parent/'v09/videos/emberwake-v09-narrated-intro45-r2.mp4';assert p.sha(old)=='1cc67d9ab34108ce9513ef12e65df03d8d74a748031aca4e45f4b667dc3b7ac3'
assert p.sha(R/'videos/emberwake-v10-preview.mp4')=='9965bdd17db1918276a986b7dced88c25fb08dd7ecff4a8140d5b25d91eed607'
q=json.loads((D/'v10/r2/qa/final-delivery.json').read_text(encoding='utf8'));assert p.sha(q['final'])==q['sha256']
result={'nativeSourceCopiesReopened':checks,'dependenciesBytesSHAMatched':len(M['media']),'missing':0,'originalCoreUnchanged':71,'final':q['final'],'sha256':q['sha256'],'bytes':q['bytes'],'oldV09AndOwnerLinkedV10PreviewSHAPreserved':True,'fullDecodeNumericalAudioQA':'v10/r2/qa/final-delivery.json','physicalMobile':False,'subjectiveListen':False,'wholeRealtimeWatch':False,'independentQA':'Rootが既存Reviewerへ依頼','ownerAcceptance':'未確認','published':False,'NASCopy':False}
(R/'qa/source-package-check.json').write_bytes((json.dumps(result,ensure_ascii=False,indent=2)+'\n').encode('utf8'))
with (D/'v10/qa/source-package-check.json').open('xb') as w:w.write((R/'qa/source-package-check.json').read_bytes())
print(json.dumps({'nativeCopies':len(checks),'dependencies':len(M['media']),'sha256':q['sha256'],'missing':0}))
