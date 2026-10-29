#!/usr/bin/env python3
"""Build the complete COLRv0 compatibility font from the approved outline base.

This is a deliberately simpler vector approximation of the primary sbix
material. It includes color, white sticker border, a gentle upper wash and
an oval highlight; it does not claim to reproduce the raster gloss exactly.
The primary glyph manifest supplies the same advances and left paint padding.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import math
import sys
import time
from pathlib import Path

import pathops
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import DecomposingRecordingPen

sys.dont_write_bytecode = True
ROOT = Path('/home/pui/Videos/Osayu-Telop/2026-10-29')
FAMILY = 'Osayu Puku Jelly Compat'
JAPANESE = 'おさゆ ぷくシール 互換'
PALETTE = ['#FFFFFF', '#29A9CD', '#68D1EA', '#C3F2FB48', '#FFFFFF30', '#FFFFFFE6']


def load_compiler():
    source = Path(__file__).with_name('compile-color-font.py')
    spec = importlib.util.spec_from_file_location('osayu_color_compile_for_backup', source)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def oval(module, cx, cy, rx, ry, angle=28):
    shape = module.ellipse(cx, cy, rx, ry)
    radians = math.radians(angle)
    c, s = math.cos(radians), math.sin(radians)
    return shape.transform(scaleX=c, skewY=s, skewX=-s, scaleY=c,
                           translateX=cx - c * cx + s * cy,
                           translateY=cy - s * cx - c * cy)


def safe_glint(module, body):
    x0, y0, x1, y1 = body.bounds
    width, height = x1 - x0, y1 - y0
    target = (x0 + width * .24, y0 + height * .78)
    candidates = [target]
    for yi in range(1, 9):
        for xi in range(1, 9):
            candidates.append((x0 + width * xi / 9, y0 + height * yi / 9))
    candidates.sort(key=lambda p: ((p[0] - target[0]) / max(width, 1)) ** 2 +
                    ((p[1] - target[1]) / max(height, 1)) ** 2)
    angle = math.radians(28)
    c, s = math.cos(angle), math.sin(angle)
    for scale in [1.0, .70, .45]:
        rx = min(31.5, width * .12) * scale
        ry = min(17.5, height * .08) * scale
        for cx, cy in candidates:
            if not body.contains((cx, cy)):
                continue
            perimeter = [(rx * math.cos(i * math.pi / 4), ry * math.sin(i * math.pi / 4))
                         for i in range(8)]
            if all(body.contains((cx + c * x - s * y, cy + s * x + c * y))
                   for x, y in perimeter):
                halo = pathops.op(body, oval(module, cx, cy, rx * 1.50, ry * 1.55),
                                  pathops.PathOp.INTERSECTION)
                core = oval(module, cx, cy, rx, ry)
                return halo, core
    return None


def prepare_metric_base(base, manifest, destination):
    font = TTFont(base, recalcTimestamp=False)
    original_map = dict(font.getBestCmap())
    seen = set()
    for record in manifest:
        name = record['glyph']
        if name in seen or font.getGlyphID(name) != record['gid']:
            raise ValueError('Duplicate or mismatched primary glyph manifest')
        seen.add(name)
        if record['metric']['paintLeftPaddingFontUnits'] != 70:
            raise ValueError('Unexpected primary left paint padding')
        old, bearing = font['hmtx'][name]
        advance = max(old, int(record['advanceFontUnits']))
        font['hmtx'][name] = (advance, bearing)
    encoded_nonempty = {name for name in original_map.values()
                        if font['glyf'][name].numberOfContours != 0}
    if seen != encoded_nonempty:
        raise ValueError('Manifest does not cover every encoded nonempty glyph')
    destination.parent.mkdir(parents=True, exist_ok=True)
    font.save(destination, reorderTables=True)
    font.close()
    return original_map


def body_path(module, font, glyph_set, name):
    if not font['glyf'][name].isComposite():
        return module.glyph_path(font, name)
    # PathPen needs decomposed contours for inherited accented composites.
    recording = DecomposingRecordingPen(glyph_set)
    glyph_set[name].draw(recording)
    path = pathops.Path()
    recording.replay(path.getPen())
    return pathops.simplify(path)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base', type=Path,
                        default=ROOT / 'revision2/base/OsayuPukuJelly-Base.ttf')
    parser.add_argument('--manifest', type=Path,
                        default=ROOT / 'revision2/delivery/glyph-manifest.json')
    parser.add_argument('--output', type=Path,
                        default=ROOT / 'revision2/delivery/OsayuPukuJelly-COLR0.ttf')
    args = parser.parse_args()
    module = load_compiler()
    manifest = json.loads(args.manifest.read_text(encoding='utf-8'))
    work = ROOT / 'revision2/compat/vector-colr0'
    metric_base = work / 'metrics-base.ttf'
    original_map = prepare_metric_base(args.base, manifest, metric_base)
    font = TTFont(metric_base, recalcTimestamp=False)
    glyph_set = font.getGlyphSet()
    # The shared helper asks for a glyph set on every call; its immutable view
    # can be reused during this outline-only batch.
    font.getGlyphSet = lambda **kwargs: glyph_set
    compositions = {}
    no_glint = []
    started = time.monotonic()
    for index, record in enumerate(manifest):
        source = record['glyph']
        body = body_path(module, font, glyph_set, source).transform(translateX=70)
        if not list(body.verbs):
            raise ValueError('Empty source body in primary manifest')
        x0, y0, x1, y1 = body.bounds
        wash = pathops.op(body, module.ellipse(x0 + (x1 - x0) * .34,
                                              y0 + (y1 - y0) * .82,
                                              (x1 - x0) * .90,
                                              (y1 - y0) * .52),
                          pathops.PathOp.INTERSECTION)
        # inflate's width is a centered stroke, so 140 means 70 units outside.
        records = [
            {'outline': module.inflate(body, 140), 'paint': {'color': 0}},
            {'outline': module.inflate(body, 20), 'paint': {'color': 1}},
            {'outline': body, 'paint': {'color': 2}},
        ]
        if list(wash.verbs):
            records.append({'outline': wash, 'paint': {'color': 3}})
        glint = safe_glint(module, body)
        if glint:
            records.extend([{'outline': glint[0], 'paint': {'color': 4}},
                            {'outline': glint[1], 'paint': {'color': 5}}])
        else:
            no_glint.append(record['codepoint'])
        if len(records) > 6:
            raise ValueError('Compatibility layer budget exceeded')
        compositions[source] = records
        if (index + 1) % 500 == 0:
            print(json.dumps({'prepared': index + 1, 'total': len(manifest),
                              'elapsedSeconds': round(time.monotonic() - started, 2)}), flush=True)
    font.close()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    print('Compiling complete COLRv0 vector compatibility font', flush=True)
    result = module.save_colr(metric_base, args.output, FAMILY, PALETTE, compositions, 0)
    # The shared function preserves original copyrights; add both display names.
    result_font = TTFont(args.output, recalcTimestamp=False)
    module.rename(result_font, FAMILY, 'COLR0', JAPANESE)
    result_font.save(args.output, reorderTables=True)
    result_font.close()
    result = module.validate_font(args.output, original_map, 'COLR', len(manifest), 0)
    final = TTFont(args.output, checkChecksums=2, recalcTimestamp=False)
    cmap = final.getBestCmap()
    if len(final.getGlyphOrder()) >= 65535:
        raise ValueError('TrueType glyph ceiling exceeded')
    for name in final.getGlyphOrder():
        final['glyf'][name].compile(final['glyf'])
    advances = {r['glyph']: int(r['advanceFontUnits']) for r in manifest}
    for name, advance in advances.items():
        if final['hmtx'][name][0] != advance:
            raise ValueError('Compatibility advance differs from primary')
    joyo = json.loads((ROOT / 'kanji-qa/joyo-codepoints.json').read_text())['codepoints']
    jis = json.loads((ROOT / 'kanji-qa/jis0208-level1-level2-codepoints.json').read_text())
    coverage = {}
    for label, cps in [('joyo', joyo), ('jis0208Level1And2', jis)]:
        missing = [cp for cp in cps if cp not in cmap or
                   cmap[cp] not in final['COLR'].ColorLayers]
        if missing:
            raise ValueError('Missing Japanese color glyphs in ' + label)
        coverage[label] = {'expected': len(cps), 'colored': len(cps), 'missing': []}
    alias_names = [n.toUnicode() for n in final['name'].names
                   if n.nameID in [1, 16] and n.platformID == 3 and n.langID == 0x411]
    if not alias_names or any(n != JAPANESE for n in alias_names):
        raise ValueError('Japanese compatibility display name missing')
    final.close()
    result.update({'familyJapanese': JAPANESE, 'material': 'simplified vector approximation',
                   'notIdenticalToSBIXGloss': True, 'paintLeftPaddingFontUnits': 70,
                   'primaryAdvancesMatch': True, 'maxLayersPerGlyph': 6,
                   'allGlyphsCompiled': True, 'japaneseCoverage': coverage,
                   'noGlintCodepoints': no_glint, 'baseSha256': module.sha(args.base),
                   'manifestSha256': module.sha(args.manifest),
                   'elapsedSeconds': round(time.monotonic() - started, 2)})
    (args.output.parent / 'colr0-qa.json').write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({k: result[k] for k in ['file', 'bytes', 'sha256', 'coloredGlyphs',
                                          'unicodeCodepoints', 'glyphCount']}, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    main()
