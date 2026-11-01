import pathlib,json,subprocess,hashlib
R=pathlib.Path(__file__).parent;V8=R.parent/'v08';WT=pathlib.Path('C:/Users/pui/.claude/worktrees/Pui-core-issue-156-explainer-v09');D=WT/'promotion/projectp-emberwake-explainer-v09-20261101';GIT='C:/Program Files/Git/cmd/git.exe';BASE='5053981dffac692f610e62b1b076c14e019b7a1c'
assert not D.exists();assert subprocess.check_output([GIT,'-C',str(WT),'rev-parse','HEAD']).decode().strip()==BASE
assert not subprocess.check_output([GIT,'-C',str(WT),'status','--porcelain']).strip();D.mkdir(parents=True)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def copy(src,relative):
    dest=D/relative;dest.parent.mkdir(parents=True,exist_ok=True)
    with dest.open('xb') as f:f.write(src.read_bytes())
    assert sha(dest)==sha(src)
for name in ['production.py','owned_runner.py','synthesize.py','build-r2.py','verify-r2.py','宣伝-156参考確認と構成-v09.md','宣伝-156仮台本とshot対応-v09.md']:
    copy(R/name,'v09/'+name)
for path in (R/'source').iterdir():
    if path.is_file():copy(path,'v09/source/'+path.name)
for path in (R/'projects').iterdir():
    if path.suffix in ['.pcraft','.ecproj'] or path.name in ['explainer-cut.fcproj','explainer-final-r2.fcproj']:copy(path,'v09/projects/'+path.name)
for path in (R/'media').glob('*.png'):copy(path,'v09/media/'+path.name)
names=['voice-binding.json','voice-binding-r2.json','voice-binding-r3.json','voicevox-version.json','voicevox-speakers.json','voicevox-speaker-info.json','edit-plan.json','actual-tracking-keys.json','delivery-r2.json','visual-review-r2.json','ec-save.json','ec-reopen.json','ec-render.json','final-r2-save.json','final-r2-place.json','final-r2-reopen.json','final-r2-export.json','final-r2-metadata.json','final-r2-probe.json','full-av-r2-decode.json','video-stream-first.json','video-stream-repaired.json','cut-save.json','cut-place.json','cut-reopen.json','cut-export.json','key-images.png','whole-sheet.png','landing-continuous.png']
for name in names:copy(R/'qa'/name,'v09/qa/'+name)
copy(R.parent/'v07/source-v07.jsx','v07/source-v07.jsx')
reused=[]
for name in ['preflight.json','launch.json','capture.json']:
    repo='promotion/projectp-emberwake-design-v08-20261101/v08/circuit-capture01/'+name;path=V8/'circuit-capture01'/name
    original=subprocess.check_output([GIT,'-C',str(WT),'show',BASE+':'+repo]);assert original==path.read_bytes()
    reused.append({'repoFile':repo,'sourceCommit':BASE,'privateFile':path.as_posix(),'bytes':path.stat().st_size,'sha256':sha(path)})
pre=json.loads((V8/'circuit-capture01/preflight.json').read_text(encoding='utf8'))
for f in pre['coreFiles']:assert sha(V8/'circuit-capture01/product'/f['file'])==f['sha256']
capture={'reusedImmutableEvidence':reused,'coreFilesSHARechecked':len(pre['coreFiles']),'coreChanged':[],'sourceGame':'71584a6bd0c8852885157de71032fd9252e7a04c','version':'0.12.0','scene':'res://scenes/campaign.tscn','mode':'物語モード / practice','independentProfile':True,'ordinaryProcessInputAutomation':True,'newCaptureInV09':False,'productStateSetters':False,'raw':{'file':(V8/'circuit-capture01/capture.avi').as_posix(),'sha256':sha(V8/'circuit-capture01/capture.avi'),'bytes':(V8/'circuit-capture01/capture.avi').stat().st_size},'oldV08Final':{'file':(V8/'videos/emberwake-v08-code-circuit-preview17.mp4').as_posix(),'sha256':sha(V8/'videos/emberwake-v08-code-circuit-preview17.mp4'),'bytes':2465514},'note':'Reuse the merged evidence by immutable Source commit; do not claim new v09 recording. Original 17s MP4 is not stretched or used as an input.'}
assert capture['raw']['sha256']=='eaf9331496850d6cf86d885d8cff48a0cd45ea95b040b0fdd17c59024d31c5b3';assert capture['oldV08Final']['sha256']=='f036237e819b3b39e52d53bdaf6869f961bcaf52b183082628fa69c0c5c452d6'
(D/'収録再利用binding.json').write_bytes((json.dumps(capture,ensure_ascii=False,indent=2)+'\n').encode('utf8'))
qa=json.loads((R/'qa/delivery-r2.json').read_text(encoding='utf8'));deps={f['path']:f for f in qa['nativeReferences']}
for path in [R/'videos/emberwake-v09-narrated-intro45-r2.mp4',R/'media/explainer-native-r2.mp4']:
    deps[path.as_posix()]={'path':path.as_posix(),'bytes':path.stat().st_size,'sha256':sha(path),'role':'current final export, private'}
oldcode=[]
for name in ['code-draw-v2.pcraft','code-collision.pcraft']:
    path=V8/'projects'/name;oldcode.append({'file':path.as_posix(),'bytes':path.stat().st_size,'sha256':sha(path),'repo':'promotion/projectp-emberwake-design-v08-20261101/v08/projects/'+name,'commit':BASE})
manifest={'caseRoot':R.as_posix(),'media':list(deps.values()),'reusedPhotoCraftCodeOriginals':oldcode,'cloneAloneStandalone':False,'note':'Native originals retain private absolute references. Large ProRes, raw and narration WAVs stay private; verify bytes/SHA at these paths. VOICEVOX engine/model binaries and full game product are not uploaded. Old prefix/source/captures/finals retained.'}
(D/'依存manifest.json').write_bytes((json.dumps(manifest,ensure_ascii=False,indent=2)+'\n').encode('utf8'))
bad=R/'videos/emberwake-v09-narrated-intro45.mp4'
failure={'firstUnpublishedExport':bad.as_posix(),'sha256':sha(bad),'observedDefect':'cue06 decoded as silence in both channels while source WAV was audible numerically; per-cue reference matching rejected it','nativeReference':'relative v09/audio/voice-06-reading-r2.wav','fixedBy':'all absolute voice paths in voice-binding-r3 + separately saved explainer-final-r2.fcproj / intro45-r2.mp4','videoStreamUnchanged':qa['repairedExportVideoStreamIdentical'],'oldArtifactsPreserved':True,'newVerification':'delivery-r2.json: nine cues, L/R independent head+tail36 checks passed. Numerical checks do not establish subjective listening.'}
(D/'v09/qa/初回音声参照失敗と修復.json').write_bytes((json.dumps(failure,ensure_ascii=False,indent=2)+'\n').encode('utf8'))
print(json.dumps({'prefix':str(D),'nativeMediaPaths':len(deps),'coreUnchanged':71,'oldSourceBase':BASE,'finalSha256':qa['sha256']}))
