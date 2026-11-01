"""Append a new owned prefix; byte-preserve presented media and the old Source tree."""
import pathlib,json,hashlib,subprocess
R=pathlib.Path(__file__).parent
WT=pathlib.Path('C:/Users/pui/.claude/worktrees/Pui-core-issue-156-design-v07')
D=WT/'promotion/projectp-emberwake-design-v08-20261101'
GIT='C:/Program Files/Git/cmd/git.exe';PIN='71584a6bd0c8852885157de71032fd9252e7a04c'
assert not D.exists();assert subprocess.check_output([GIT,'-C',str(WT),'rev-parse','HEAD']).decode().strip()=='7d2d3aabaa0b71ff602a110e4c74cc6bb916e84b'
assert not subprocess.check_output([GIT,'-C',str(WT),'status','--porcelain']).strip()
D.mkdir(parents=True)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def copy(source,relative):
    out=D/relative;out.parent.mkdir(parents=True,exist_ok=True)
    with out.open('xb') as stream:stream.write(source.read_bytes())
    assert sha(out)==sha(source)
final=R/'videos/emberwake-v08-code-circuit-preview17.mp4'
assert final.stat().st_size==2465514 and sha(final)=='f036237e819b3b39e52d53bdaf6869f961bcaf52b183082628fa69c0c5c452d6'
copy(R.parent/'run.py','run.py')
copy(R.parent/'v07/source-v07.jsx','v07/source-v07.jsx') # exact helper-function source imported by the archived creation recipe
copy(R.parent/'v07/pr-body.md','history/PR96旧本文-v07.md')
for name in ['production.py','make-video.py','make-graphics.py','make-code-correction.py','render-correction.py','prepare-capture.py','launch-linux-capture.py','capture-circuit.gd','verify.py','source-circuit.jsx','source-circuit-v2.jsx','code-pin.json','宣伝-156コードと実画面の対応-v08.md']:
    copy(R/name,'v08/'+name)
for name in ['capture-base.gd','capture-circuit.gd','preflight.json','capture.json','launch.json']:
    copy(R/'circuit-capture01'/name,'v08/circuit-capture01/'+name)
for name in ['code-draw-v2.pcraft','code-collision.pcraft','circle-before.pcraft','circle-after.pcraft','circuit-cut.fcproj','circuit-preview-v2.ecproj','circuit-final.fcproj']:
    copy(R/'projects'/name,'v08/projects/'+name)
for name in ['code-draw-v2.png','code-collision.png','circle-before.png','circle-after.png']:
    copy(R/'media'/name,'v08/media/'+name)
for path in (R/'frames').glob('*.png'):copy(path,'v08/frames/'+path.name)
for path in (R/'qa').iterdir():
    if path.suffix=='.json' and path.name not in ['picture-sheet-review.json','ec-render.json','ec-reopen.json','ec-save.json','code-draw-render.json','code-draw-reopen.json','code-draw-save.json']:
        copy(path,'v08/qa/'+path.name)
for name in ['whole-sheet.png','small-screen.png','activation-continuous.png','landing-continuous.png']:
    copy(R/'qa'/name,'v08/qa/'+name)
product=R/'circuit-capture01/product';pre=json.loads((R/'circuit-capture01/preflight.json').read_text(encoding='utf8'))
for f in pre['coreFiles']:
    actual=(product/f['file']).read_bytes();assert hashlib.sha256(actual).hexdigest()==f['sha256']
    original=subprocess.check_output([GIT,'-C','F:/dev/EMBERWAKE','show',PIN+':'+f['file']],timeout=15)
    assert actual==original,f['file']
contexts=[]
for rel,lo,hi in [('scripts/campaign/world.gd',30,40),('scripts/campaign/world.gd',66,77),('scripts/world.gd',163,168),('scripts/main.gd',309,317)]:
    raw=(product/rel).read_bytes();excerpt=b''.join(raw.splitlines(keepends=True)[lo-1:hi])
    name=rel.replace('/','__')+f'.L{lo}-{hi}.txt';out=D/'code-context'/name;out.parent.mkdir(exist_ok=True)
    with out.open('xb') as stream:stream.write(excerpt)
    contexts.append({'sourceFile':rel,'commit':PIN,'lineStart':lo,'lineEnd':hi,'fullFileSha256':sha(product/rel),'excerptFile':'code-context/'+name,'exactExcerptSha256':sha(out),'kind':'exact line bytes incl indentation and line endings; not executable standalone'})
dependency=[]
for path in [R/'circuit-capture01/capture.avi',R/'media/circuit-cut.mov',R/'media/circuit-picture-v2.mov',R/'media/circuit-native.mp4',final]:
    dependency.append({'path':path.as_posix(),'caseRelative':path.relative_to(R).as_posix(),'bytes':path.stat().st_size,'sha256':sha(path)})
product_files=[{'file':path.relative_to(product).as_posix(),'bytes':path.stat().st_size,'sha256':sha(path)} for path in sorted(product.rglob('*')) if path.is_file() and '.godot' not in path.relative_to(product).parts]
manifest={'caseRoot':R.as_posix(),'sourcePrefix':'promotion/projectp-emberwake-design-v08-20261101/','productSource':PIN,'privateLargeMedia':dependency,'productSnapshot':{'path':product.as_posix(),'files':product_files},'coreFilesByteVerifiedAgainstGit':len(pre['coreFiles']),'coreChanged':[],'codeContext':contexts,'cloneAloneStandalone':False,'note':'Native projects retain absolute paths to the private case. Small images and originals are copied byte-identically to Source; restore/verify private large media before use. Product code, complete product, saves and large media are not uploaded.'}
(D/'依存manifest.json').write_bytes((json.dumps(manifest,ensure_ascii=False,indent=2)+'\n').encode('utf8'))
probe=json.loads(json.loads((R/'qa/final-probe.json').read_text(encoding='utf8'))['stdout'])
binding={'final':dependency[-1],'duration':{'video':17.0,'audio':17.002,'container':float(probe['format']['duration']),'frames':510,'fps':30},'recording':{'file':dependency[0],'scene':'res://scenes/campaign.tscn','version':'0.12.0','source':PIN,'engine':'4.6.3.stable.official.7d41c59c4','modeDisplay':'物語モード','internalMode':'practice','modeEvidence':'capture-circuit.gd drive asserts game.run.mode==practice after ordinary title navigation; failure terminates capture','ordinaryInputOnly':True,'sharedDesktopInput':0,'seedSha256':pre['seedSha256'],'completedBeforeAndAfter':[1],'falls':0,'clear':False,'coreFilesUnchanged':71,'configuredRenderDimensions':[960,540],'actualMovieDimensions':[1440,810],'movieFrames':1113,'callbackFrames':1112},'storyRuntime':'current campaign scene, not legacy main.tscn/Wind world','evidence':{'inputAndTrajectory':'v08/circuit-capture01/capture.json','launch':'v08/circuit-capture01/launch.json','sourcePreflight':'v08/circuit-capture01/preflight.json','rawLocation':'依存manifest.json','codeContext':'code-context/','technicalQA':'v08/qa/delivery.json'},'scope':'17-second representative partial preview; not 65-second ad/CTA/creative or public acceptance','historicalReceiptNote':'copied production-time delivery/source notes retain their original phase and old head; this binding is the append-only Source packaging state'}
(D/'対象版binding.json').write_bytes((json.dumps(binding,ensure_ascii=False,indent=2)+'\n').encode('utf8'))
print(json.dumps({'prefix':str(D),'codeContexts':len(contexts),'coreFilesUnchanged':len(pre['coreFiles']),'privateLargeMedia':len(dependency),'productMetadataFiles':len(product_files),'finalSha256':sha(final)}))
