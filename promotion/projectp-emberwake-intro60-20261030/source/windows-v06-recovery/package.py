from run import *
import hashlib, shutil
def sha(p):
    with open(p,'rb') as f: return hashlib.file_digest(f,'sha256').hexdigest()
a=ROOT/'attempt01'; q=a/'qa'
binding=json.loads((q/'output-binding-v06.json').read_text(encoding='utf8'))
quality=json.loads((q/'final-quality.json').read_text(encoding='utf8'))
lamp=json.loads((q/'lamp-sync-v06.json').read_text(encoding='utf8')); lr=json.loads((q/'lr-aac-quality.json').read_text(encoding='utf8'))
assert lamp['pass'] and lr['pass'] and not quality['missingDependencies'] and quality['videoAllFramesEqual']
for b in binding['bindings']: assert sha(b['file'])==b['sha256']
staging=json.loads((q/'staging-manifest.json').read_text(encoding='utf8'))
for f in staging['files']: assert sha(f['copy'])==f['sha256']
paths=list((a/'projects').glob('*.ecproj'))+list((a/'projects').glob('*.fcproj'))+list((a/'covers').glob('*.pcraft'))
pc={'originalVersion':'v05 unchanged artwork','resavedVersion':'v06 packaging only','resaveReceipt':str(ROOT/'qa/pc-resave.json'),'renderReceipt':str(ROOT/'qa/pc-render.json')}
result={'task':'orbit-emberwake-video156-v06-recovery-20261101','sourceBaseHead':'d4d05aba3ac7247b3b99c2d3e2c4fd22aa69e419','writer':'codex:01a19460-4946-76d0-938a-f3898c3f8530','outputs':binding['bindings'],'picture':{'path':binding['picture'],'sha256':binding['sha256']},'nativeOriginals':[{'path':str(p),'sha256':sha(p)} for p in paths],'dependencies':staging['files'],'quality':quality,'lamp':lamp,'lr':{'pass':True,'channels':[{'variant':r['variant'],'channel':r['channel'],'lagSamples':r['best']['lag']/2,'clips':r['clip'],'minHeadTail':min(min(c['headCorrelation'],c['tailCorrelation']) for c in r['cueChecks'])} for r in lr['results']]},'photocraft':pc,'viewed':['first-final-sheet.png','native-reopened-525.png','lamp-caption-sheet-bgm.png','final-jumpcity-tracking-strip.png'],'unverified':['whole realtime watch','subjective audio listen','mobile UI','independent cross review','publication acceptance','TikTok native music'],'publication':False,'nasWritten':False,'sharedInput':0,'preserved':['Linux SourceWT and original case','old partial picture and logs','v05 originals and videos'],'failure':'Initial metadata pipe decoded UTF-8 as cp932; failed metadata MP4 preserved in qa; corrected UTF-8 remux final SHA only'}
(q/'recovery-delivery-manifest.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
print('DELIVERY',[(b['variant'],b['sha256']) for b in binding['bindings']])
