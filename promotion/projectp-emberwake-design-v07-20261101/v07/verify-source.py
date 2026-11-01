import pathlib,json,importlib.util
spec=importlib.util.spec_from_file_location('production',pathlib.Path(__file__).with_name('preview-production.py'))
p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p)
R=p.R;D=pathlib.Path('C:/Users/pui/.claude/worktrees/Pui-core-issue-156-design-v07/promotion/projectp-emberwake-design-v07-20261101')
manifest=json.loads((D/'依存manifest.json').read_text(encoding='utf8'))
for f in manifest['externalPrivateMedia']:
    path=pathlib.Path(f['path']);assert path.stat().st_size==f['bytes'] and p.sha(path)==f['sha256']
deps=[]
def visit(x,project):
    if isinstance(x,dict):
        for k,v in x.items():
            if k=='path' and isinstance(v,str) and v.startswith('C:/'):
                path=pathlib.Path(v);assert path.is_file(),v
                deps.append({'project':project,'path':v,'sha256':p.sha(path),'bytes':path.stat().st_size})
            else:visit(v,project)
    elif isinstance(x,list):
        for v in x:visit(v,project)
for name in ['v07-cut.fcproj','v07-final-tracked.fcproj','v07-preview-tracked.ecproj']:
    path=D/'v07/projects'/name
    visit(json.loads(path.read_text(encoding='utf8')),name)
    assert p.sha(path)==p.sha(R/'projects'/name)
    if path.suffix=='.fcproj':p.native('source-'+name+'-reopen',p.FC,['--project',path.as_posix(),'inspect'])
    else:
        p.native('source-ec-reopen',p.EC,['--gpu','--project',path.as_posix(),'info','--json'])
        p.native('source-ec-frame129',p.EC,['--gpu','--project',path.as_posix(),'render-frame','--comp','156 v07 new checkpoint preview16','--frame','129','--out',(R/'qa/source-native-frame129.png').as_posix(),'--json'])
for name in ['v07-heading.pcraft','v07-memory-before.pcraft','v07-memory-after.pcraft']:
    path=D/'v07/projects'/name;assert p.sha(path)==p.sha(R/'projects'/name)
    p.native('source-'+name+'-reopen',p.PC,['info',path.as_posix(),'--compact'])
keys=json.loads((R/'qa/tracking-keys-v2.json').read_text(encoding='utf8'))['keys']
rows=json.loads((R/'qa/player-pixel-measurements.json').read_text(encoding='utf8'))
bad=[]
for key,row in zip(keys,rows):
    if not row['measured']:continue
    x,y,w,h=row['measured']['box'];ax,ay,_=key['anchor']
    if x<ax-1080/4.6 or x+w>ax+1080/4.6 or y<ay-1170/4.6 or y+h>ay+1170/4.6:bad.append(row['sourceFrame'])
assert not bad,bad
old=R/'videos/emberwake-v07-checkpoint-preview16.mp4';assert old.stat().st_size==2357801 and p.sha(old)=='713209531a563549132bd2ab97ed4203fa3527f07908f657958a138d6171c524'
v06=[]
for name,expected in [('bgm','9b2f622d74bb91bd8e40c3f28c9ca13aff8adce4e6e0cfb476f5518e3146fc06'),('voice','e579458970b8b04579206c5f5304632b3d476bb36beaebdd0cdc80bd7fdabf5c')]:
    path=R.parent/'attempt01/videos'/('emberwake-intro65-v06-'+name+'.mp4')
    assert p.sha(path)==expected;v06.append({'path':path.as_posix(),'sha256':expected,'bytes':path.stat().st_size})
final=(R/'videos/emberwake-v07-checkpoint-preview16-v2.mp4').as_posix()
p.native('v2-small-screen-images',p.FF,['-nostdin','-hide_banner','-loglevel','error','-threads','2','-filter_threads','2','-i',final,'-vf',"select='eq(n,90)+eq(n,129)+eq(n,351)',scale=320:568,tile=3x1:padding=4:margin=4",'-frames:v','1',(R/'qa/preview-v2-320px.png').as_posix()])
result={'sourcePrefix':D.as_posix(),'nativeReferenceChecks':deps,'nativeMissing':0,'cropMeasuredFrames':sum(bool(r['measured']) for r in rows),'cropAdditionalBoxClippingFrames':bad,'sourceCameraMissingActorFrames':[861,862],'otherUnmeasuredFrames':'940-948 pause overlay','oldOwnerLinkedPreviewUnchanged':{'sha256':p.sha(old),'bytes':old.stat().st_size},'oldV06FinalsUnchanged':v06,'newFinalSha256':p.sha(pathlib.Path(final)),'nativeSourceCopiesEqualPrivateProjects':True,'sourceNativeReopen':'passed; selected native EC frame129 rendered from Source copy','independentReview':'pending Root','realtimeWatch':False,'subjectiveListen':False,'mobilePhysicalDevice':False}
(R/'qa/source-v2-check.json').write_bytes((json.dumps(result,ensure_ascii=False,indent=2)+'\n').encode('utf8'))
for name in ['source-v2-check.json','source-native-frame129.png','preview-v2-320px.png']:
    target=D/'v07/qa'/name
    with target.open('xb') as out:out.write((R/'qa'/name).read_bytes())
for path in (R/'qa').glob('source-*-reopen.json'):
    target=D/'v07/qa'/path.name
    with target.open('xb') as out:out.write(path.read_bytes())
print(json.dumps({'nativeReferences':len(deps),'uniqueReferences':len(set(d['path'] for d in deps)),'missing':0,'cropBad':bad,'sourceProof':str(R/'qa/source-v2-check.json')}))
