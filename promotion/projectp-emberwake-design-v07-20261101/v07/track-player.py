"""Measure the recorded cloak pixels, then author native EC anchor keys. No image edits."""
import pathlib, json, importlib.util
import cv2
import numpy as np
spec=importlib.util.spec_from_file_location('production',pathlib.Path(__file__).with_name('preview-production.py'))
p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p)
R=p.R
out=R/'qa/action-739-948.rgb'
if not out.exists():
    p.native('tracking-pixels',p.FF,['-nostdin','-hide_banner','-loglevel','error','-threads','2','-filter_threads','2','-i',p.RAW,'-vf',"select='between(n,739,948)',scale=360:202:flags=neighbor",'-fps_mode','vfr','-pix_fmt','rgb24','-f','rawvideo',out.as_posix()])
frames=np.fromfile(out,dtype=np.uint8).reshape(210,202,360,3)
rows=[]
for i,img in enumerate(frames):
    r,g,b=[img[:,:,c].astype(float) for c in range(3)]
    mask=((r<110)&(g>95)&(b>110)&(g>r*1.7)).astype(np.uint8)
    mask[:22]=0
    mask[:,:35]=0
    count,labels,stats,centroids=cv2.connectedComponentsWithStats(cv2.dilate(mask,np.ones((3,3),np.uint8)))
    candidates=[]
    for label in range(1,count):
        x,y,w,h,area=stats[label]
        n=int(np.sum(mask[labels==label]))
        if n>=9 and w>=3 and h>=5:
            yy,xx=np.where((labels==label)&(mask>0))
            candidates.append({'pixels':n,'center':[float(np.median(xx)*4),float(np.median(yy)*810/202)],'box':[int(x*4),float(y*810/202),int(w*4),float(h*810/202)]})
    candidates.sort(key=lambda c:c['pixels'],reverse=True)
    chosen=candidates[0] if candidates else None
    rows.append({'timelineFrame':i,'sourceFrame':739+i,'candidates':candidates,'measured':chosen})
(R/'qa/player-pixel-measurements.json').write_text(json.dumps(rows,indent=2),encoding='utf8')
print(json.dumps({'rows':len(rows),'missing':[x['timelineFrame'] for x in rows if not x['measured']], 'sample':[rows[i] for i in [0,60,90,100,110,120,123,124,125,126,130,140,150,170,209]]}))
