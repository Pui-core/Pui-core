#!/usr/bin/env python3
"""Render approved glyph outlines as soft cyan gel, preserving real counters.

This is the deterministic material/raster stage of the color-font compiler.
Prototype layers are kept separately for the PhotoCraft material document.
It does not run image generation or change the source glyph paths.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path

import numpy as np
import imagequant
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import distance_transform_edt, gaussian_filter
from fontTools.ttLib import TTFont


ROOT = Path('/home/pui/Videos/Osayu-Telop/2026-10-29/revision2')
DEFAULT_FONT = ROOT / 'base/OsayuPukuJelly-Base.ttf'
DEFAULT_STYLE = {
    'bodyColors': ['#A0ECFA', '#6FD6F0', '#43C1E3'],
    'rimColor': '#28AAD4', 'rimEm': .01,
    'whiteBorderEm': .07,
    'shadowColor': '#6c8d9e', 'shadowOpacity': .10,
    'shadowOffsetAt256': [1,4], 'shadowBlurAt256': 5,
    'heightRatio': .85, 'radiusPercentile': 98,
    'smoothAt256': 2.8,
    'light': [-.45,-.55,.70],
    'ambient': .84, 'diffuseGain': .16,
    'specularBroadPower': 14, 'specularBroadGain': .15,
    'specularTightPower': 60, 'specularTightGain': .35,
    'capsule': True, 'capsuleAngle': -30,
    'capsuleCoreAlpha': .88, 'capsuleHaloAlpha': .13,
    'paintLeftPaddingEm': .07, 'nativeAdvanceExtraEm': .07,
    'minimumTrailingClearanceEm': .072,
}
LAYER_ORDER = ['shadow', 'whiteborder', 'rim', 'body', 'reflection']
SUPERSAMPLE = 2


def sha(file):
    return hashlib.sha256(Path(file).read_bytes()).hexdigest()


def rgb(color):
    value = color.removeprefix('#')
    if len(value) != 6:
        raise ValueError('Expected RGB hex color')
    return np.array([int(value[i:i+2],16)/255 for i in [0,2,4]],dtype=np.float32)


def rgba_image(color, alpha):
    alpha = np.clip(alpha,0,1)
    if np.asarray(color).ndim == 1:
        color = np.broadcast_to(color,(*alpha.shape,3))
    rgba = np.empty((*alpha.shape,4),dtype=np.uint8)
    rgba[:,:,:3] = np.round(np.clip(color,0,1)*255).astype(np.uint8)
    rgba[:,:,3] = np.round(alpha*255).astype(np.uint8)
    rgba[rgba[:,:,3] == 0,:3] = 0
    return Image.fromarray(rgba,'RGBA')


def compose(layers):
    output = Image.new('RGBA',next(iter(layers.values())).size)
    for name in LAYER_ORDER:
        output = Image.alpha_composite(output,layers[name])
    return output


def load_font(file, ppem):
    font = ImageFont.truetype(str(file),ppem*SUPERSAMPLE)
    source = TTFont(file,recalcTimestamp=False)
    return font,source


def render_glyph(char, ppem, font, source, style=None):
    style = {**DEFAULT_STYLE,**(style or {})}
    target_ppem=ppem
    ppem*=SUPERSAMPLE
    if font.size != ppem:
        raise ValueError('Use load_font() to obtain the supersampled raster font')
    cmap = source.getBestCmap()
    glyph_name = cmap.get(ord(char))
    if glyph_name is None:
        raise ValueError(f'Unsupported character U+{ord(char):04X}')
    upm = source['head'].unitsPerEm
    advance = source['hmtx'][glyph_name][0] * ppem / upm
    glyph = source['glyf'][glyph_name]
    if glyph.numberOfContours == 0:
        return None,{'character':char,'codepoint':ord(char),'glyph':glyph_name,'advancePx':advance/SUPERSAMPLE,'empty':True}
    glyph.recalcBounds(source['glyf'])
    original_advance_units=source['hmtx'][glyph_name][0]
    native=0x20<=ord(char)<=0x7e or 0x3000<=ord(char)<=0x30ff
    advance_units=original_advance_units
    if advance_units>0:
        advance_units=max(advance_units+(round(style['nativeAdvanceExtraEm']*upm) if native else 0),
                          glyph.xMax+round(style['minimumTrailingClearanceEm']*upm))
    advance=advance_units*ppem/upm
    bounds = font.getbbox(char,anchor='ls')
    raster_fallback=False
    # RAQM intentionally suppresses a soft hyphen in ordinary text. A color
    # font compiler needs the encoded glyph's real outline, including when a
    # layout engine later requests that glyph at a line break.
    if bounds[2] <= bounds[0] or bounds[3] <= bounds[1]:
        font=font.font_variant(layout_engine=ImageFont.Layout.BASIC)
        bounds=font.getbbox(char,anchor='ls')
        raster_fallback=True
    if bounds[2] <= bounds[0] or bounds[3] <= bounds[1]:
        raise ValueError('A nonempty source glyph has empty raster bounds')
    border = style['whiteBorderEm'] * ppem
    blur = style['shadowBlurAt256'] * ppem/256
    offset = np.array(style['shadowOffsetAt256'],dtype=float)*ppem/256
    padding = math.ceil(border+4*blur+max(abs(offset))+4*SUPERSAMPLE)
    left=math.floor((bounds[0]-padding)/SUPERSAMPLE)*SUPERSAMPLE
    right=math.ceil((bounds[2]+padding)/SUPERSAMPLE)*SUPERSAMPLE
    bottom=math.floor((-bounds[3]-padding)/SUPERSAMPLE)*SUPERSAMPLE
    top=math.ceil((-bounds[1]+padding)/SUPERSAMPLE)*SUPERSAMPLE
    width,height=right-left,top-bottom
    ink_left,ink_top=bounds[0]-left,top+bounds[1]
    alpha_image = Image.new('L',(width,height))
    ImageDraw.Draw(alpha_image).text((-left,top),char,
                                  font=font,anchor='ls',fill=255)
    alpha = np.asarray(alpha_image,dtype=np.float32)/255
    inside = alpha >= .5
    if not np.any(inside):
        raise ValueError('Rasterized source has no opaque interior')
    d = distance_transform_edt(inside)
    outside_d = distance_transform_edt(~inside)
    signed = np.where(inside,d-1,-outside_d+1)+(alpha-.5)
    radius = max(float(np.percentile(d[inside],style['radiusPercentile'])),1)
    t = np.clip(d/radius,0,1)
    height_map = radius*style['heightRatio']*np.sqrt(np.maximum(2*t-t*t,0))
    height_map = gaussian_filter(height_map,max(style['smoothAt256']*ppem/256,.3))
    dy,dx = np.gradient(height_map)
    norm = np.sqrt(dx*dx+dy*dy+1)
    nx,ny,nz = -dx/norm,-dy/norm,1/norm
    light = np.array(style['light'],dtype=float)
    light /= np.linalg.norm(light)
    lambert = np.clip(nx*light[0]+ny*light[1]+nz*light[2],0,1)
    diffuse = style['ambient']+style['diffuseGain']*lambert
    half = light+np.array([0.,0.,1.])
    half /= np.linalg.norm(half)
    spec_dot = np.clip(nx*half[0]+ny*half[1]+nz*half[2],0,1)
    specular = (style['specularBroadGain']*spec_dot**style['specularBroadPower']
                +style['specularTightGain']*spec_dot**style['specularTightPower'])
    specular = np.clip(specular,0,1)
    capsule_metric=None
    if style.get('capsule'):
        safe=inside & (alpha>.99) & (d>=radius*.55)
        if np.any(safe):
            yy,xx=np.indices(alpha.shape,dtype=np.float32)
            target_x=ink_left+(bounds[2]-bounds[0])*.24
            target_y=ink_top+(bounds[3]-bounds[1])*.22
            score=((xx-target_x)/max(bounds[2]-bounds[0],1))**2+((yy-target_y)/max(bounds[3]-bounds[1],1))**2
            score[~safe]=np.inf
            cy,cx=np.unravel_index(np.argmin(score),score.shape)
            local_distance=float(d[cy,cx])
            seed=(ord(char)*2654435761)&0xffffffff
            variation=(seed%65536)/32767.5-1
            ratio=1.7+(((seed>>16)%65536)/32767.5-1)*.06
            length=local_distance*.825*(1+.06*variation)
            cap_width=np.clip(length/ratio,local_distance*.45,local_distance*.55)
            angle=math.radians(style['capsuleAngle']+variation*5)
            longitudinal=(xx-cx)*math.cos(angle)+(yy-cy)*math.sin(angle)
            transverse=-(xx-cx)*math.sin(angle)+(yy-cy)*math.cos(angle)
            cap_distance=(np.sqrt((longitudinal/(length/2))**2+(transverse/(cap_width/2))**2)-1)*cap_width/2
            feather=.7*ppem/256
            core=np.clip(.5-cap_distance/(2*feather),0,1)*style['capsuleCoreAlpha']
            halo=np.exp(-(np.maximum(cap_distance,0)**2)/(2*(ppem/256*2)**2))*style['capsuleHaloAlpha']
            capsule=1-(1-core)*(1-halo)
            specular=1-(1-specular)*(1-capsule)
            capsule_metric={'centerPx':[cx/SUPERSAMPLE,cy/SUPERSAMPLE],
                'lengthPx':float(length/SUPERSAMPLE),'widthPx':float(cap_width/SUPERSAMPLE),
                'angleDegrees':math.degrees(angle),'safeCenterDistancePx':local_distance/SUPERSAMPLE}
    y = np.arange(height,dtype=np.float32)[:,None]
    relative = np.clip((y-ink_top)/max(bounds[3]-bounds[1],1),0,1)
    top_color,mid_color,bottom_color = map(rgb,style['bodyColors'])
    first = top_color+(mid_color-top_color)*np.minimum(relative*2,1)[:,:,None]
    second = mid_color+(bottom_color-mid_color)*np.maximum(relative*2-1,0)[:,:,None]
    colors = np.where((relative<=.5)[:,:,None],first,second)
    colors = np.broadcast_to(colors,(height,width,3))*diffuse[:,:,None]
    border_alpha = gaussian_filter(np.clip(signed+border+.5,0,1).astype(np.float32),.35*SUPERSAMPLE)
    rim_alpha = gaussian_filter(np.clip(signed+style['rimEm']*ppem+.5,0,1).astype(np.float32),.35*SUPERSAMPLE)
    shadow_alpha = gaussian_filter(border_alpha,blur)
    # Shift with zero outside, never wrap pixels from the opposite image edge.
    shift_x,shift_y = map(round,offset)
    shifted = np.zeros_like(shadow_alpha)
    dst_x0,dst_x1 = max(0,shift_x),min(width,width+shift_x)
    dst_y0,dst_y1 = max(0,shift_y),min(height,height+shift_y)
    shifted[dst_y0:dst_y1,dst_x0:dst_x1] = shadow_alpha[
        dst_y0-shift_y:dst_y1-shift_y,dst_x0-shift_x:dst_x1-shift_x]
    layers = {
        'shadow':rgba_image(rgb(style['shadowColor']),shifted*style['shadowOpacity']),
        'whiteborder':rgba_image(np.ones(3),border_alpha),
        'rim':rgba_image(rgb(style['rimColor']),rim_alpha),
        'body':rgba_image(colors,alpha),
        'reflection':rgba_image(np.ones(3),specular*alpha),
    }
    final_size=(width//SUPERSAMPLE,height//SUPERSAMPLE)
    layers={name:image.resize(final_size,Image.Resampling.LANCZOS) for name,image in layers.items()}
    composite = compose(layers)
    paint_pad=round(style['paintLeftPaddingEm']*target_ppem)
    left_px,bottom_px=left//SUPERSAMPLE+paint_pad,bottom//SUPERSAMPLE
    metric = {
        'character':char,'codepoint':ord(char),'glyph':glyph_name,'ppem':target_ppem,
        'supersample':SUPERSAMPLE,
        'basicRasterFallback':raster_fallback,
        'advancePx':advance/SUPERSAMPLE,'width':final_size[0],'height':final_size[1],
        'originalAdvanceFontUnits':original_advance_units,'advanceFontUnits':advance_units,
        'advanceDeltaFontUnits':advance_units-original_advance_units,
        'paintLeftPaddingFontUnits':round(style['paintLeftPaddingEm']*upm),
        'bitmapLeftPx':left_px,'bitmapBottomPx':bottom_px,
        'baseGlyphBounds':[glyph.xMin,glyph.yMin,glyph.xMax,glyph.yMax],
        'sbixOriginOffsetX':round(left_px-glyph.xMin*target_ppem/upm),
        'sbixOriginOffsetY':round(bottom_px-glyph.yMin*target_ppem/upm),
        'radiusPx':radius/SUPERSAMPLE,'maxSpecular':float(np.max(specular*alpha)),
        'capsule':capsule_metric,
        'opaqueInteriorPixels':int(np.sum(inside)),
        'alphaBounds':list(composite.getbbox()),
    }
    return (layers,composite),metric


def indexed_comparison(image, output):
    rgba_file = output/'composite.png'
    indexed_file = output/'composite-indexed256.png'
    image.save(rgba_file,optimize=True)
    indexed = imagequant.quantize_pil_image(image,dithering_level=.7,max_colors=256,min_quality=90,max_quality=100)
    indexed.save(indexed_file,optimize=True)
    for label,color in [('white','#ffffff'),('charcoal','#202c36')]:
        proof=Image.new('RGBA',image.size,color)
        proof.alpha_composite(indexed.convert('RGBA'))
        proof.convert('RGB').save(output/('proof-indexed256-'+label+'.png'),optimize=True)
    a = np.asarray(image,dtype=np.float32)/255
    b = np.asarray(indexed.convert('RGBA'),dtype=np.float32)/255
    tests = {}
    roi = (a[:,:,3]>.01)|(b[:,:,3]>.01)
    for name,bg in [('white',1.),('black',0.)]:
        rgb_a = a[:,:,:3]*a[:,:,3,None]+bg*(1-a[:,:,3,None])
        rgb_b = b[:,:,:3]*b[:,:,3,None]+bg*(1-b[:,:,3,None])
        mse = float(np.mean((rgb_a[roi]-rgb_b[roi])**2))
        tests[name+'PSNRdB'] = 99 if mse == 0 else -10*math.log10(mse)
    return {'quantizer':'libimagequant','dither':.7,'minQuality':90,
            'rgbaBytes':rgba_file.stat().st_size,'indexed256Bytes':indexed_file.stat().st_size,
            'alphaMAE':float(np.mean(abs(a[:,:,3]-b[:,:,3]))),**tests}


def render_word(text, ppem, file, output, style=None):
    output.mkdir(parents=True,exist_ok=True)
    font,source = load_font(file,ppem)
    records=[]; cursor=0; left=0; bottom=0; right=0; top=0
    for char in text:
        result,metric = render_glyph(char,ppem,font,source,style)
        metric['cursorPx'] = cursor
        records.append((result,metric))
        if result:
            left=min(left,math.floor(cursor+metric['bitmapLeftPx']))
            right=max(right,math.ceil(cursor+metric['bitmapLeftPx']+metric['width']))
            bottom=min(bottom,metric['bitmapBottomPx'])
            top=max(top,metric['bitmapBottomPx']+metric['height'])
        cursor+=metric['advancePx']
    pad=8
    size=(right-left+2*pad,top-bottom+2*pad)
    layers={name:Image.new('RGBA',size) for name in LAYER_ORDER}
    font_order=Image.new('RGBA',size)
    for result,metric in records:
        if not result:continue
        individual,_=result
        x=round(metric['cursorPx']+metric['bitmapLeftPx']-left)+pad
        y=top-metric['bitmapBottomPx']-metric['height']+pad
        for name in LAYER_ORDER:
            layers[name].alpha_composite(individual[name],(x,y))
        font_order.alpha_composite(result[1],(x,y))
    for name,image in layers.items():image.save(output/(name+'.png'),optimize=True)
    composite=compose(layers)
    comparison=indexed_comparison(composite,output)
    for label,color in [('white','#ffffff'),('charcoal','#202c36')]:
        proof=Image.new('RGBA',composite.size,color)
        proof.alpha_composite(composite)
        proof.convert('RGB').save(output/('proof-'+label+'.png'),optimize=True)
        font_proof=Image.new('RGBA',composite.size,color)
        font_proof.alpha_composite(font_order)
        font_proof.convert('RGB').save(output/('proof-font-order-'+label+'.png'),optimize=True)
    metrics={'text':text,'ppem':ppem,'font':str(file),'fontSha256':sha(file),
             'style':{**DEFAULT_STYLE,**(style or {})},'layers':LAYER_ORDER,
             'width':size[0],'height':size[1],'baselinePx':top+pad,
             'glyphs':[metric for _,metric in records],'compression':comparison,
             'compositeSha256':sha(output/'composite.png')}
    (output/'metrics.json').write_text(json.dumps(metrics,ensure_ascii=False,indent=2)+'\n')
    source.close()
    return metrics


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--font',type=Path,default=DEFAULT_FONT)
    parser.add_argument('--output',type=Path,default=ROOT/'material-prototypes/sdf-jelly-v1')
    parser.add_argument('--text')
    parser.add_argument('--ppem',type=int,default=256)
    parser.add_argument('--style',type=Path)
    args=parser.parse_args()
    style=json.loads(args.style.read_text()) if args.style else None
    outputs=[]
    if args.text:
        outputs.append(render_word(args.text,args.ppem,args.font,args.output,style))
    else:
        outputs.append(render_word('ありがとう',384,args.font,args.output/'arigatou-384',style))
        outputs.append(render_word('初見さん歓迎',256,args.font,args.output/'welcome-256',style))
    print(json.dumps([{key:r[key] for key in ['text','width','height','compression','compositeSha256']}
                      for r in outputs],ensure_ascii=False))


if __name__ == '__main__':main()
