#!/usr/bin/env python3
"""Build genuine COLR/CPAL or sbix fonts from approved per-glyph color layers.

`probe` creates unmistakable, deliberately simple compatibility test fonts.
`compile` consumes a design JSON with vector layers and/or PNG strikes.
The compiler never changes source character coverage or redistributes source
fonts without their existing name-table copyright and OFL information.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import importlib.util
import sys
import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import pathops
from fontTools.colorLib.builder import buildCOLR, buildCPAL
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont, newTable
from fontTools.ttLib.tables import otTables as ot
from fontTools.ttLib.tables.sbixGlyph import Glyph as BitmapGlyph
from fontTools.ttLib.tables.sbixStrike import Strike
from PIL import Image, ImageDraw, ImageFont
import imagequant
import numpy as np

sys.dont_write_bytecode = True


ROOT = Path('/home/pui/Videos/Osayu-Telop/2026-10-29')
DEFAULT_BASE = ROOT / 'font/OsayuPuku-Regular.ttf'
PROBES = ROOT / 'revision2/probes'


def sha(file):
    return hashlib.sha256(Path(file).read_bytes()).hexdigest()


def rgba(value):
    if isinstance(value, str):
        value = value.removeprefix('#')
        if len(value) == 6:
            value += 'ff'
        if len(value) != 8:
            raise ValueError('Expected #RRGGBB or #RRGGBBAA palette color')
        return tuple(int(value[i:i+2], 16) / 255 for i in range(0, 8, 2))
    if len(value) != 4 or any(not 0 <= x <= 1 for x in value):
        raise ValueError('Palette values must be RGBA floats between zero and one')
    return tuple(value)


def rename(font, family, suffix, japanese=None):
    name = font['name']
    preserve = [record for record in name.names if record.nameID not in {1,2,3,4,5,6,16,17}]
    name.names = preserve
    ps = ''.join(ch for ch in family if ch.isascii() and ch.isalnum()) + '-' + suffix
    values = {1: family, 2: 'Regular', 3: '2.000;OSAY;' + ps, 4: family + ' Regular',
              5: 'Version 2.000', 6: ps, 16: family, 17: 'Regular'}
    for key, text in values.items():
        name.setName(text, key, 3, 1, 0x409)
        name.setName(text, key, 1, 0, 0)
    if japanese:
        for key in [1,4,16]:name.setName(japanese,key,3,1,0x411)
        for key in [2,17]:name.setName('Regular',key,3,1,0x411)
    font['head'].fontRevision = 2.0
    font['head'].created = font['head'].modified = 3876076800


def glyph_path(font, glyph_name):
    path = pathops.Path()
    font.getGlyphSet()[glyph_name].draw(path.getPen())
    return pathops.simplify(path)


def inflate(path, width):
    stroke = pathops.Path(path)
    stroke.stroke(width, pathops.LineCap.ROUND_CAP, pathops.LineJoin.ROUND_JOIN, 4)
    stroke.convertConicsToQuads(.1)
    return pathops.op(path, stroke, pathops.PathOp.UNION)


def ellipse(cx, cy, rx, ry):
    result = pathops.Path()
    k = .552284749831
    result.moveTo(cx+rx,cy)
    result.cubicTo(cx+rx,cy+k*ry,cx+k*rx,cy+ry,cx,cy+ry)
    result.cubicTo(cx-k*rx,cy+ry,cx-rx,cy+k*ry,cx-rx,cy)
    result.cubicTo(cx-rx,cy-k*ry,cx-k*rx,cy-ry,cx,cy-ry)
    result.cubicTo(cx+k*rx,cy-ry,cx+rx,cy-k*ry,cx+rx,cy)
    result.close()
    return result


def append_glyph(font, name, outline, source):
    if name in font['glyf'].glyphs:
        raise ValueError('Duplicate generated glyph name')
    pen = TTGlyphPen(None)
    outline.draw(Cu2QuPen(pen, .4, reverse_direction=True))
    glyph = pen.glyph()
    font['glyf'][name] = glyph
    glyph.recalcBounds(font['glyf'])
    advance, _ = font['hmtx'][source]
    font['hmtx'][name] = (advance, getattr(glyph,'xMin',0))
    if 'vmtx' in font:
        font['vmtx'][name] = font['vmtx'][source]
    if len(font['glyf'].glyphOrder) > 65535:
        raise ValueError('Color glyph layers exceed the TrueType 65535 glyph limit')
    return name


def paint_for(glyph, fill):
    kind = fill.get('type','solid')
    if kind == 'solid':
        paint = {'Format':ot.PaintFormat.PaintSolid,
                 'PaletteIndex':int(fill['color']), 'Alpha':float(fill.get('alpha',1))}
    elif kind == 'linear':
        x0,y0 = fill['from']; x1,y1 = fill['to']
        # The third point gives the perpendicular extent of the gradient.
        x2,y2 = fill.get('perpendicular',[x0+(y1-y0),y0-(x1-x0)])
        paint = {'Format':ot.PaintFormat.PaintLinearGradient,
                 'ColorLine':{'Extend':ot.ExtendMode.PAD,'ColorStop':[
                     {'StopOffset':stop[0],'PaletteIndex':int(stop[1]),'Alpha':stop[2] if len(stop)>2 else 1}
                     for stop in fill['stops']]},
                 'x0':x0,'y0':y0,'x1':x1,'y1':y1,'x2':x2,'y2':y2}
    else:
        raise ValueError(f'Unsupported paint type {kind}')
    return {'Format':ot.PaintFormat.PaintGlyph,'Glyph':glyph,'Paint':paint}


def save_colr(base, output, family, palette, layers, version):
    font = TTFont(base,recalcTimestamp=False)
    original_map = font.getBestCmap()
    compositions = {}
    for source, records in layers.items():
        stack = []
        for index, record in enumerate(records):
            glyph = source if record.get('reuseBase') else append_glyph(
                font,f'jelly.{font.getGlyphID(source)}.{index}',record['outline'],source)
            if version == 0:
                stack.append((glyph,int(record['paint'].get('fallbackColor',record['paint'].get('color',0)))))
            else:
                stack.append(paint_for(glyph,record['paint']))
        compositions[source] = stack if version == 0 else {'Format':ot.PaintFormat.PaintColrLayers,'Layers':stack}
    font.setGlyphOrder(list(font['glyf'].glyphOrder))
    font['CPAL'] = buildCPAL([[rgba(color) for color in palette]])
    font['COLR'] = buildCOLR(compositions,version=version,glyphMap=font.getReverseGlyphMap())
    rename(font,family,'COLR'+str(version))
    font.save(output,reorderTables=True)
    font.close()
    return validate_font(output,original_map,'COLR',len(layers),version)


def save_sbix(base, output, family, bitmaps, japanese=None):
    font = TTFont(base,recalcTimestamp=False)
    original_map = font.getBestCmap()
    sbix = newTable('sbix')
    sbix.flags = 1
    for ppem, records in bitmaps.items():
        strike = Strike(ppem=int(ppem),resolution=72)
        for glyph, record in records.items():
            png = Path(record['path']).read_bytes()
            if png[:8] != b'\x89PNG\r\n\x1a\n':
                raise ValueError('sbix input must be a PNG')
            strike.glyphs[glyph] = BitmapGlyph(glyphName=glyph,graphicType='png ',
                originOffsetX=int(record['originOffsetX']),originOffsetY=int(record['originOffsetY']),imageData=png)
            if 'advanceFontUnits' in record:
                previous,lsb=font['hmtx'][glyph]
                font['hmtx'][glyph]=(max(previous,int(record['advanceFontUnits'])),lsb)
        sbix.strikes[int(ppem)] = strike
    font['sbix'] = sbix
    rename(font,family,'SBIX',japanese)
    font.save(output,reorderTables=True)
    font.close()
    return validate_font(output,original_map,'sbix',len(set(g for rows in bitmaps.values() for g in rows)))


def validate_font(file, original_map, table, colored_count, version=None):
    font = TTFont(file,checkChecksums=2,recalcTimestamp=False)
    cmap = font.getBestCmap()
    if set(cmap) != set(original_map):
        raise ValueError('Color compilation changed character coverage')
    font.getTableData(table)
    if table == 'COLR':
        if font['COLR'].version != version or 'CPAL' not in font:
            raise ValueError('Color tables did not roundtrip')
        actual = len(font['COLR'].ColorLayers) if version == 0 else font['COLR'].table.BaseGlyphList.BaseGlyphCount
    else:
        if font['sbix'].flags != 1:
            raise ValueError('Bitmap font must not overlay monochrome outlines')
        actual = len({glyph for strike in font['sbix'].strikes.values()
                      for glyph, record in strike.glyphs.items() if record.imageData})
    if actual != colored_count:
        raise ValueError('Compiled color glyph count differs from requested layers')
    result = {'file':str(file),'sha256':sha(file),'bytes':Path(file).stat().st_size,
        'family':font['name'].getDebugName(1),'postScriptName':font['name'].getDebugName(6),
        'format':table,'version':version,'coloredGlyphs':colored_count,
        'unicodeCodepoints':len(cmap),'glyphCount':len(font.getGlyphOrder()),
        'preservedCmap':True,'iPhoneTest':False,'ibisPaintTest':False}
    font.close()
    return result


_worker=threading.local()


def sdf_module():
    file=Path(__file__).with_name('render-jelly-sdf.py')
    spec=importlib.util.spec_from_file_location('osayu_jelly_sdf',file)
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def init_sdf_worker(base,ppem,style):
    module=sdf_module()
    font,source=module.load_font(base,ppem)
    _worker.module=module;_worker.font=font;_worker.source=source
    _worker.ppem=ppem;_worker.style=style


def quantize_bitmap(image):
    indexed=imagequant.quantize_pil_image(image,dithering_level=.7,max_colors=256,min_quality=90,max_quality=100)
    a=np.asarray(image,dtype=np.float32)/255
    b=np.asarray(indexed.convert('RGBA'),dtype=np.float32)/255
    roi=(a[:,:,3]>.01)|(b[:,:,3]>.01)
    quality={}
    for name,bg in [('white',1.),('black',0.)]:
        x=a[:,:,:3]*a[:,:,3,None]+bg*(1-a[:,:,3,None])
        y=b[:,:,:3]*b[:,:,3,None]+bg*(1-b[:,:,3,None])
        mse=float(np.mean((x[roi]-y[roi])**2))
        quality[name+'PSNRdB']=99 if mse==0 else -10*math.log10(mse)
    if min(quality.values())<42:
        return image,{'mode':'RGBA-quality-fallback',**quality}
    return indexed,{'mode':'indexed256','quantizer':'libimagequant','dither':.7,
                    'minQuality':90,'maxQuality':100,**quality}


def sdf_worker(job):
    codepoint,glyph,gid,file=job
    result,metric=_worker.module.render_glyph(chr(codepoint),_worker.ppem,_worker.font,_worker.source,_worker.style)
    if not result:raise ValueError('Expected a nonempty glyph')
    image=result[1]
    try:
        quantized,quality=quantize_bitmap(image)
    except RuntimeError as error:
        quantized=image
        quality={'mode':'RGBA-quantizer-fallback','reason':str(error)}
    quantized.save(file,optimize=True)
    alpha=quantized.convert('RGBA').getchannel('A')
    if alpha.getbbox() is None or alpha.getextrema()[0]!=0:
        raise ValueError('Empty bitmap or missing transparent margin')
    record={'glyph':glyph,'gid':gid,'codepoint':codepoint,'character':chr(codepoint),
        'path':str(file),'sha256':sha(file),'bytes':file.stat().st_size,
        'originOffsetX':metric['sbixOriginOffsetX'],'originOffsetY':metric['sbixOriginOffsetY'],
        'advanceFontUnits':metric['advanceFontUnits'],'metric':metric,'quality':quality}
    file.with_suffix('.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
    return record


def recover_cached_bitmap(job,font,source,ppem,style,expected_hash):
    cp,glyph_name,gid,file=job
    if sha(file)!=expected_hash:raise ValueError('Recovered PNG changed after capture')
    with Image.open(file) as image:
        image.verify()
    with Image.open(file) as image:
        image.load();size=image.size;mode=image.mode
        alpha=image.convert('RGBA').getchannel('A')
        if alpha.getbbox() is None or alpha.getextrema()[0]!=0:
            raise ValueError('Recovered PNG is empty or lacks transparent margin')
    box=font.getbbox(chr(cp),anchor='ls')
    if box[2]<=box[0] or box[3]<=box[1]:raise ValueError('Do not recover a previously suppressed control glyph')
    ss=2;render_ppem=ppem*ss;upm=source['head'].unitsPerEm
    padding=math.ceil(style['whiteBorderEm']*render_ppem+4*style['shadowBlurAt256']*render_ppem/256
                      +max(abs(v) for v in style['shadowOffsetAt256'])*render_ppem/256+4*ss)
    left=math.floor((box[0]-padding)/ss)*ss;right=math.ceil((box[2]+padding)/ss)*ss
    bottom=math.floor((-box[3]-padding)/ss)*ss;top=math.ceil((-box[1]+padding)/ss)*ss
    if size!=((right-left)//ss,(top-bottom)//ss):raise ValueError('Recovered PNG dimensions differ from source/style')
    glyph=source['glyf'][glyph_name];glyph.recalcBounds(source['glyf'])
    old=source['hmtx'][glyph_name][0];advance=old
    native=0x20<=cp<=0x7e or 0x3000<=cp<=0x30ff
    if old>0:advance=max(old+(round(style['nativeAdvanceExtraEm']*upm) if native else 0),
                         glyph.xMax+round(style['minimumTrailingClearanceEm']*upm))
    paint_pad=round(style['paintLeftPaddingEm']*ppem)
    left_px=left//ss+paint_pad;bottom_px=bottom//ss
    metric={'character':chr(cp),'codepoint':cp,'glyph':glyph_name,'ppem':ppem,'supersample':ss,
        'width':size[0],'height':size[1],'bitmapLeftPx':left_px,'bitmapBottomPx':bottom_px,
        'originalAdvanceFontUnits':old,'advanceFontUnits':advance,'advanceDeltaFontUnits':advance-old,
        'advancePx':advance*ppem/upm,'paintLeftPaddingFontUnits':round(style['paintLeftPaddingEm']*upm),
        'baseGlyphBounds':[glyph.xMin,glyph.yMin,glyph.xMax,glyph.yMax],
        'sbixOriginOffsetX':round(left_px-glyph.xMin*ppem/upm),
        'sbixOriginOffsetY':round(bottom_px-glyph.yMin*ppem/upm),
        'recoveredMetricsWithoutRerender':True}
    quality={'mode':'indexed256-recovered' if mode=='P' else 'RGBA-recovered',
        'verifiedAtOriginalWrite':True,'originalQuantizer':'libimagequant','minQuality':90,'maxQuality':100,
        'dither':.7,'originalPerGlyphPSNRFloor':42,
        'recoveryChecks':['known font/style/render identity','captured PNG SHA','PNG CRC','dimensions','transparent alpha margin']}
    record={'glyph':glyph_name,'gid':gid,'codepoint':cp,'character':chr(cp),'path':str(file),
        'sha256':expected_hash,'bytes':file.stat().st_size,'originOffsetX':metric['sbixOriginOffsetX'],
        'originOffsetY':metric['sbixOriginOffsetY'],'advanceFontUnits':advance,'metric':metric,'quality':quality}
    file.with_suffix('.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
    return record


def sdf_font(base,output,ppem,workers,limit=None,style_file=None,recover=None):
    output.mkdir(parents=True,exist_ok=True)
    build=output/'glyph-bitmaps';build.mkdir(exist_ok=True)
    module=sdf_module()
    style={**module.DEFAULT_STYLE,**(json.loads(style_file.read_text()) if style_file else {})}
    font=TTFont(base)
    cmap=font.getBestCmap()
    entries={}
    for cp,glyph in sorted(cmap.items()):
        if font['glyf'][glyph].numberOfContours!=0:
            entries.setdefault(glyph,cp)
    jobs=[(cp,glyph,font.getGlyphID(glyph),build/f'{font.getGlyphID(glyph):05}.png')
          for glyph,cp in entries.items()]
    if limit:
        # Mix the actual words with a spread of kana, Latin and Japanese kanji.
        common='ありがとう初見さん歓迎おはさゆ音桜夢配信中歌ってみた誕生日記念ABCxyz0123!?'
        prioritized=[];seen=set()
        by_cp={cp:job for job in jobs for cp in [job[0]]}
        for cp in map(ord,common):
            if cp in by_cp and cp not in seen:
                prioritized.append(by_cp[cp]);seen.add(cp)
        rest=[job for job in jobs if job[0] not in seen]
        remaining=max(0,limit-len(prioritized))
        selected=[rest[round(i*(len(rest)-1)/max(remaining-1,1))] for i in range(remaining)]
        jobs=(prioritized+selected)[:limit]
    font.close()
    started=time.monotonic(); records=[]
    progress=output/'progress.json'
    manifest=output/'glyph-manifest.json'
    # Resume only exact input/style matches; never treat old rendered data as new.
    identity={'baseSha256':sha(base),'ppem':ppem,'style':style,
              'rendererSha256':sha(Path(__file__).with_name('render-jelly-sdf.py')),
              'compilerSha256':sha(__file__),'limit':limit}
    saved={}
    identity_file=output/'build-identity.json'
    if identity_file.exists() and manifest.exists() and json.loads(identity_file.read_text())==identity:
        for record in json.loads(manifest.read_text()):
            path=Path(record['path'])
            if path.exists() and sha(path)==record['sha256']:saved[record['glyph']]=record
    if recover:
        capture=json.loads(recover.read_text())
        previous=capture['identity']
        if any(previous[k]!=identity[k] for k in ['baseSha256','ppem','style','limit']):
            raise ValueError('Recovery font/style differs from the approved material')
        if previous['rendererSha256']!='9efcb78e63e043af62100e09d4ebe399e65bde764e902741ec25648efa9ad209':
            raise ValueError('Recovery is limited to the known pre-soft-hyphen renderer')
        raster,source=module.load_font(base,ppem)
        for job in jobs:
            file=job[3];expected_hash=capture['pngHashes'].get(file.name)
            if expected_hash and file.exists():
                try:saved[job[1]]=recover_cached_bitmap(job,raster,source,ppem,style,expected_hash)
                except ValueError:continue
        source.close()
        print(json.dumps({'recoveredVerifiedBitmaps':len(saved),'capture':str(recover)}),flush=True)
    identity_file.write_text(json.dumps(identity,ensure_ascii=False,indent=2)+'\n')
    pending=[job for job in jobs if job[1] not in saved]
    records.extend(saved[job[1]] for job in jobs if job[1] in saved)
    def checkpoint():
        ordered=sorted(records,key=lambda r:r['gid'])
        manifest.write_text(json.dumps(ordered,ensure_ascii=False,indent=2)+'\n')
        state={'completed':len(records),'total':len(jobs),'elapsedSeconds':round(time.monotonic()-started,2),
               'bytes':sum(r['bytes'] for r in records),'partial':bool(limit)}
        progress.write_text(json.dumps(state,indent=2)+'\n')
        print(json.dumps(state),flush=True)
    checkpoint()
    pool=ThreadPoolExecutor(max_workers=workers,initializer=init_sdf_worker,initargs=(base,ppem,style))
    futures={pool.submit(sdf_worker,job):job for job in pending}
    try:
        for future in as_completed(futures):
            records.append(future.result())
            if len(records)%25==0 or len(records)==len(jobs):checkpoint()
    except BaseException as error:
        for pending_future in futures:pending_future.cancel()
        checkpoint()
        (output/'failure.json').write_text(json.dumps({'error':repr(error),
            'job':str(futures.get(future))},ensure_ascii=False,indent=2)+'\n')
        pool.shutdown(wait=True,cancel_futures=True)
        raise
    else:pool.shutdown(wait=True)
    rows={r['glyph']:r for r in records}
    path=output/'OsayuPukuJelly-SBIX.ttf'
    result=save_sbix(base,path,'Osayu Puku Jelly',{ppem:rows},'おさゆ ぷくシール')
    original=TTFont(base);final=TTFont(path)
    expected={glyph for glyph in original.getBestCmap().values() if original['glyf'][glyph].numberOfContours!=0}
    if not limit and set(rows)!=expected:raise ValueError('A nonempty encoded glyph lacks its color bitmap')
    final_map=final.getBestCmap()
    kanji_root=ROOT/'kanji-qa'
    joyo=set(json.loads((kanji_root/'joyo-codepoints.json').read_text())['codepoints'])
    jis=set(json.loads((kanji_root/'jis0208-level1-level2-codepoints.json').read_text()))
    coverage={}
    for key,points in [('joyo',joyo),('jis0208Level1And2',jis)]:
        missing=[cp for cp in sorted(points) if cp not in final_map or final['glyf'][final_map[cp]].numberOfContours==0]
        if missing:raise ValueError('Japanese coverage lost')
        coverage[key]={'expected':len(points),'supportedNonempty':len(points),'missing':[]}
    quality_modes={mode:sum(r['quality']['mode']==mode for r in records)
                   for mode in sorted(set(r['quality']['mode'] for r in records))}
    psnrs=[min(r['quality']['whitePSNRdB'],r['quality']['blackPSNRdB']) for r in records if 'whitePSNRdB' in r['quality']]
    result.update({'partialCompatibilityFont':bool(limit),'materialIdentity':identity,
        'bitmapQualityModes':quality_modes,'minimumMeasuredNewBitmapsPSNRdB':min(psnrs) if psnrs else None,
        'allIndexedBitmapsVerifiedPSNRFloor':42,
        'allNonemptyEncodedGlyphsColored':set(rows)==expected,
        'coloredUnicodeCodepoints':sum(g in rows for g in final_map.values()),
        'japaneseCoverage':coverage,'buildSeconds':round(time.monotonic()-started,2),
        'fontVersion':final['name'].getDebugName(5),
        'japaneseFamily':next((n.toUnicode() for n in final['name'].names if n.nameID==1 and n.langID==0x411),None),
        'layoutRule':'paint +70 units, native positive advances +70; other positive advances at least xMax+72',
        'layoutChangedGlyphs':sum(r['metric']['advanceDeltaFontUnits']!=0 for r in records)})
    (output/'color-font-qa.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(result,ensure_ascii=False),flush=True)
    return result


def probes(base, dest):
    dest.mkdir(parents=True,exist_ok=True)
    font = TTFont(base)
    cmap = font.getBestCmap(); upm = font['head'].unitsPerEm
    layers = {}; bitmaps = {256:{}}
    pil_font = ImageFont.truetype(str(base),256)
    for char in 'あ配A':
        glyph = cmap[ord(char)]
        body = glyph_path(font,glyph)
        left,bottom,right,top = body.bounds
        glint = pathops.op(ellipse(left+(right-left)*.3,top-(top-bottom)*.22,
                                 (right-left)*.15,(top-bottom)*.05),body,pathops.PathOp.INTERSECTION)
        layers[glyph] = [
            {'outline':inflate(body,80),'paint':{'type':'solid','color':0}},
            {'reuseBase':True,'paint':{'type':'linear','from':[0,bottom],'to':[0,top],
                'stops':[[0,1],[1,2]],'fallbackColor':1}},
            {'outline':glint,'paint':{'type':'solid','color':0}},
        ]
        bbox = pil_font.getbbox(char,anchor='ls',stroke_width=11)
        pad = 10
        image = Image.new('RGBA',(bbox[2]-bbox[0]+2*pad,bbox[3]-bbox[1]+2*pad))
        draw = ImageDraw.Draw(image)
        draw.text((pad-bbox[0],pad-bbox[1]),char,font=pil_font,anchor='ls',
                  fill='#5acde8',stroke_width=11,stroke_fill='white')
        image.save(dest/f'probe-{ord(char):04X}.png')
        x_min = font['glyf'][glyph].xMin; y_min = font['glyf'][glyph].yMin
        bitmaps[256][glyph] = {'path':str(dest/f'probe-{ord(char):04X}.png'),
            'originOffsetX':bbox[0]-pad-round(x_min*256/upm),
            'originOffsetY':-bbox[3]-pad-round(y_min*256/upm)}
    palette = ['#ffffff','#43bfdf','#a8e7f4']
    results = [
        save_colr(base,dest/'OsayuProbe-COLR0.ttf','Osayu Probe V0',palette,layers,0),
        save_colr(base,dest/'OsayuProbe-COLR1.ttf','Osayu Probe V1',palette,layers,1),
        save_sbix(base,dest/'OsayuProbe-SBIX.ttf','Osayu Probe SBIX',bitmaps),
    ]
    (dest/'probe-qa.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(results,ensure_ascii=False))


def compile_design(file, output):
    design = json.loads(file.read_text(encoding='utf-8'))
    base = Path(design['baseFont']); output.mkdir(parents=True,exist_ok=True)
    font = TTFont(base); layers = {}
    for source, records in design.get('glyphs',{}).items():
        stack = []
        for record in records:
            item = dict(record)
            if not item.get('reuseBase'):
                if 'sourceGlyph' in item:
                    item['outline'] = glyph_path(font,item['sourceGlyph'])
                else:
                    raise ValueError('Vector input currently requires sourceGlyph or reuseBase')
            stack.append(item)
        layers[source] = stack
    result = []
    for version in design.get('colrVersions',[0,1]):
        result.append(save_colr(base,output/f'OsayuPukuJelly-COLR{version}.ttf',
            design['family']+f' V{version}',design['palette'],layers,version))
    if design.get('sbix'):
        result.append(save_sbix(base,output/'OsayuPukuJelly-SBIX.ttf',design['family']+' Apple',design['sbix']))
    (output/'color-font-qa.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(result,ensure_ascii=False))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command',required=True)
    probe = sub.add_parser('probe'); probe.add_argument('--base',type=Path,default=DEFAULT_BASE)
    probe.add_argument('--output',type=Path,default=PROBES)
    production = sub.add_parser('compile'); production.add_argument('--design',type=Path,required=True)
    production.add_argument('--output',type=Path,required=True)
    sdf=sub.add_parser('sdf')
    sdf.add_argument('--base',type=Path,default=ROOT/'revision2/base/OsayuPukuJelly-Base.ttf')
    sdf.add_argument('--output',type=Path,default=ROOT/'revision2/delivery')
    sdf.add_argument('--ppem',type=int,default=256)
    sdf.add_argument('--workers',type=int,default=4)
    sdf.add_argument('--limit',type=int)
    sdf.add_argument('--style',type=Path)
    sdf.add_argument('--recover-cache-capture',type=Path)
    args = parser.parse_args()
    if args.command == 'probe': probes(args.base,args.output)
    elif args.command=='sdf':sdf_font(args.base,args.output,args.ppem,args.workers,args.limit,args.style,args.recover_cache_capture)
    else: compile_design(args.design,args.output)


if __name__ == '__main__':
    main()
