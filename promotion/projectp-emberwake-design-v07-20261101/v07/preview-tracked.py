"""Second, separately saved crop revision of the owner-linked first cut."""
import pathlib, json, importlib.util, sys
spec=importlib.util.spec_from_file_location('production',pathlib.Path(__file__).with_name('preview-production.py'))
p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p)
R=p.R
def picture():
    rows=json.loads((R/'qa/player-pixel-measurements.json').read_text())
    keys=[]
    for row in rows:
        i=row['timelineFrame'];m=row['measured']
        if m:
            x,y=m['center'];anchor=[min(1205,max(235,x+80)),min(555,max(255,y+30)),0]
        elif i in [122,123]:
            # Native camera teleports before the actor is fully drawn in the source.
            anchor=[572,255,0]
        else:anchor=keys[-1]['anchor']
        keys.append({'frame':i,'sourceFrame':739+i,'anchor':anchor,'actorMeasured':bool(m)})
    (R/'qa/tracking-keys-v2.json').write_text(json.dumps({'method':'rendered cyan cloak component median at 360x202, mapped to native1440x810; no image alterations','sourceOnlyMissingFrames':[861,862],'sourcePauseOverlayFrames':list(range(940,949)),'keys':keys},indent=2),encoding='utf8')
    jsx=(R/'source-v07.jsx').read_text(encoding='utf8')
    needle="s(action,'transform/scale',[230,230,100]);"
    assert jsx.count(needle)==1
    jsx=jsx.replace(needle,needle+'\n'+''.join("k(action,'transform/anchor',%s,%s);\n"%(k['frame']/30,json.dumps(k['anchor'])) for k in keys))
    script=R/'source-v07-tracked.jsx';script.write_bytes(jsx.encode('utf8'))
    project=(R/'projects/v07-preview-tracked.ecproj').as_posix()
    assert not pathlib.Path(project).exists()
    p.native('ec-v2-save',p.EC,['--empty','script',script.as_posix(),'--save-as',project,'--json'])
    p.native('ec-v2-reopen',p.EC,['--gpu','--project',project,'info','--json'])
    p.native('ec-v2-render',p.EC,['--gpu','--project',project,'render','--comp','156 v07 new checkpoint preview16','--out',(R/'media/v07-picture-tracked.mov').as_posix(),'--format','prores','--prores','standard','--audio','off','--progress','--json'],timeout=180)
def export():
    project=(R/'projects/v07-final-tracked.fcproj').as_posix();assert not pathlib.Path(project).exists()
    rec=p.jsrun('final-v2-save',project,[{'id':'file.newProject','params':{'name':'156 v07 new design representative cut crop revision2'}},{'id':'file.newSequence','params':{'name':'v07 preview16 v2','width':1080,'height':1920,'fps':30,'sampleRate':48000,'video':1,'audio':1}},{'id':'file.import','params':{'paths':[(R/'media/v07-picture-tracked.mov').as_posix(),p.RAW]}}],True)
    imports=next(j['result']['items'] for j in p.results(rec) if 'items' in (j.get('result') or {}))
    cmds=[{'id':'timeline.place','params':{'item':imports[0],'track':'V1','seconds':0,'duration':16*p.TICK,'video':True,'audio':False}}]
    for shot in json.loads((R/'qa/edit-plan.json').read_text(encoding='utf8'))['shots']:
        if not shot.get('image'):
            cmds.append({'id':'timeline.place','params':{'item':imports[1],'track':'A1','seconds':shot['timelineFrame']/30,'sourceIn':shot['sourceFrame']*p.TICK//30,'duration':shot['frames']*p.TICK//30,'video':False,'audio':True}})
    p.jsrun('final-v2-place',project,cmds)
    p.native('final-v2-reopen',p.FC,['--project',project,'inspect'])
    native=(R/'media/v07-native-final-tracked.mp4').as_posix()
    p.native('final-v2-export',p.FC,['--project',project,'exec','file.exportMedia',json.dumps({'path':native,'format':'h264','audio':True,'audioCodec':'aac','crf':18,'hardwareEncoding':'off','gpuRendering':'off','wait':True})],timeout=180)
    p.native('final-v2-metadata',p.FF,['-nostdin','-hide_banner','-loglevel','error','-i',native,'-map','0','-c','copy','-metadata','title=落ちたら、思い出も消える？ / EMBERWAKE v07 代表カット v2','-metadata','comment=New episode2 practice capture, Source71584a6bd0c8852885157de71032fd9252e7a04c, Godot4.6.3. Ordinary process-local input automation; no game-code changes or product-state setters. One fall after second checkpoint, return, no clear, memory1/15 before/after. Native MovieWriter game audio; no narration or added BGM. Editorial tracked crop and comparison cards. Preview only, not publication acceptance.',(R/'videos/emberwake-v07-checkpoint-preview16-v2.mp4').as_posix()])
if __name__=='__main__':{'picture':picture,'export':export}[sys.argv[1]]()
