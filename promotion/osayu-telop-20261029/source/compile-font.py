#!/usr/bin/env python3
"""Compile PhotoCraft-designed glyph paths into the OFL Osayu Puku derivative.

Requires the pinned packages in requirements-font.txt. PhotoCraft's document
coordinates are converted to font units, preserving explicit counter paths.
The selected common Japanese glyphs come from Mochiy Pop One; the replaced
Latin/kana outlines are based on Cherry Bomb One in PhotoCraft. Han coverage
is deliberately limited to the declared Japanese sets and stream lexicon.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path

import fontTools
import pathops
from fontTools import subset
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont


ROOT = Path('/home/pui/Videos/Osayu-Telop/2026-10-29')
COPYRIGHT = (
    'Copyright 2020 The MochiyPop Project Authors '
    '(https://github.com/fontdasu/Mochiypop); '
    'Copyright 2019 The Cherry Bomb Project Authors '
    '(https://github.com/satsuyako/CherryBomb). '
    'Osayu Puku is a 2026 derivative, with Latin and kana paths authored '
    'in PhotoCraft from Cherry Bomb One and compiled with rounded expansion.'
)
LICENSE = (
    'This Font Software is licensed under the SIL Open Font License, '
    'Version 1.1. Original copyright notices and the OFL are included '
    'with the distribution. https://openfontlicense.org/'
)
LEXICON = '音桜夢初見配信歌感謝応援雑談誕生日記念達成お祝い配信中歌ってみた歌枠𠮟剝頰塡鬱'


def is_han(codepoint: int) -> bool:
    """Unified/compatibility Han ideographs, excluding punctuation and kana."""
    return (0x3400 <= codepoint <= 0x4DBF or 0x4E00 <= codepoint <= 0x9FFF
            or 0xF900 <= codepoint <= 0xFAFF or 0x20000 <= codepoint <= 0x3347F)


def japanese_selection(base: Path, native: dict, joyo_file: Path, jis_file: Path):
    joyo_data = json.loads(joyo_file.read_text(encoding='utf-8'))
    joyo = set(map(int, joyo_data['codepoints']))
    jis = set(map(int, json.loads(jis_file.read_text(encoding='utf-8'))))
    if len(joyo) != 2136 or len(jis) != 6355:
        raise ValueError('Expected the official 2136 Joyo and 6355 JIS level 1/2 sets')
    with TTFont(base) as font:
        source = set(font.getBestCmap())
    designed = {int(g['codepoint']) for g in native['glyphs']}
    lexicon = set(map(ord, LEXICON))
    # Only Han outside the requested Japanese sets is removed. Preserve all
    # source non-Han characters, including Latin, kana and useful symbols.
    requested = {cp for cp in source if not is_han(cp)} | joyo | jis | designed | lexicon
    available = source | designed
    missing = requested - available
    if missing:
        raise ValueError('Source font lacks requested Japanese characters: '
                         + ', '.join(f'U+{cp:04X}' for cp in sorted(missing)))
    return {
        'requested': requested, 'joyo': joyo, 'jis': jis, 'lexicon': lexicon,
        'sourceNonHan': {cp for cp in source if not is_han(cp)},
        'removedHan': {cp for cp in source - requested if is_han(cp)},
        'joyoSource': joyo_data.get('source'),
        'joyoSourceSha256': joyo_data.get('sourceSha256'),
        'joyoListSha256': digest(joyo_file), 'jisListSha256': digest(jis_file),
    }


def digest(file: Path) -> str:
    return hashlib.sha256(file.read_bytes()).hexdigest()


def point(value, x_origin: float, baseline: float, scale: float):
    if not isinstance(value, (list, tuple)) or len(value) != 2:
        raise ValueError(f'Invalid point: {value!r}')
    x, y = map(float, value)
    if not math.isfinite(x) or not math.isfinite(y):
        raise ValueError('Non-finite outline coordinate')
    return (x - x_origin) * scale, (baseline - y) * scale


def native_path(record: dict, *, x_origin: float, baseline: float, scale: float):
    """Resolve explicit subpath Boolean operations, independent of winding."""
    result = pathops.Path()
    operations = {
        'combine': pathops.PathOp.UNION,
        'subtract': pathops.PathOp.DIFFERENCE,
        'intersect': pathops.PathOp.INTERSECTION,
        'exclude': pathops.PathOp.XOR,
    }
    for subpath in record.get('subpaths', []):
        knots = subpath.get('knots', [])
        if not knots:
            continue
        if not subpath.get('closed', True):
            raise ValueError('A font outline subpath must be closed')
        normalized = []
        for knot in knots:
            item = knot if isinstance(knot, dict) else {'anchor': knot}
            anchor = item['anchor']
            normalized.append({
                key: point(item.get(key, anchor), x_origin, baseline, scale)
                for key in ['anchor', 'in', 'out']
            })
        contour = pathops.Path()
        contour.moveTo(*normalized[0]['anchor'])
        for index, previous in enumerate(normalized):
            current = normalized[(index + 1) % len(normalized)]
            if previous['out'] == previous['anchor'] and current['in'] == current['anchor']:
                contour.lineTo(*current['anchor'])
            else:
                contour.cubicTo(*previous['out'], *current['in'], *current['anchor'])
        contour.close()
        operation = subpath.get('op', 'combine')
        if operation not in operations:
            raise ValueError(f'Unsupported PhotoCraft path operation: {operation}')
        result = pathops.op(result, contour, operations[operation])
    return pathops.simplify(result)


def rounded_outline(path: pathops.Path, stroke: dict, scale: float):
    width = float(stroke.get('width', 0)) * scale
    if not math.isfinite(width) or width < 0 or width > 100 * scale:
        raise ValueError('Invalid glyph expansion width')
    if width == 0 or not list(path.verbs):
        return path
    if stroke.get('join', 'round') != 'round' or stroke.get('cap', 'round') != 'round':
        raise ValueError('The design requires round joins and caps')
    if stroke.get('align', 'center') != 'center':
        raise ValueError('Only centered native strokes are compiled')
    expanded = pathops.Path(path)
    expanded.stroke(width, pathops.LineCap.ROUND_CAP, pathops.LineJoin.ROUND_JOIN, 4)
    # Skia emits conic arcs for round joins. Convert before Boolean operations
    # and before handing paths to fontTools' quadratic pen.
    expanded.convertConicsToQuads(0.05 * scale)
    return pathops.op(path, expanded, pathops.PathOp.UNION)


def tt_glyph(path: pathops.Path, max_error: float):
    pen = TTGlyphPen(None)
    # PathOps normalizes outer contours counterclockwise. TrueType convention
    # is clockwise outside and counterclockwise for counters.
    path.draw(Cu2QuPen(pen, max_err=max_error, all_quadratic=True, reverse_direction=True))
    return pen.glyph()


def set_names(font: TTFont):
    # Avoid keeping an original-family localized or typographic name that
    # would make iOS group the derivative with either source font.
    font['name'].names = []
    names = {
        0: COPYRIGHT,
        1: 'Osayu Puku', 2: 'Regular',
        3: '1.000;OSAY;OsayuPuku-Regular',
        4: 'Osayu Puku Regular', 5: 'Version 1.000',
        6: 'OsayuPuku-Regular',
        8: 'Osayu Puku derivative project',
        9: 'Based on the original work of FONTDASU and Satsuyako',
        10: 'PhotoCraft-authored Latin/kana outlines with a rounded expansion; '
            'Japanese coverage from Mochiy Pop One. Monochrome TrueType font.',
        13: LICENSE, 14: 'https://openfontlicense.org/',
        16: 'Osayu Puku', 17: 'Regular',
    }
    for name_id, text in names.items():
        font['name'].setName(text, name_id, 3, 1, 0x409)
        if text.isascii():
            font['name'].setName(text, name_id, 1, 0, 0)
    for name_id in [1, 4, 16]:
        font['name'].setName('おさゆ ぷく', name_id, 3, 1, 0x411)
    font['name'].setName('Regular', 2, 3, 1, 0x411)


def build_font(base: Path, native: dict, output: Path, selection: dict):
    font = TTFont(base, recalcTimestamp=False)
    if 'glyf' not in font:
        raise ValueError('Expected a TrueType-outline base font')
    original_map = dict(font.getBestCmap())
    upm = font['head'].unitsPerEm
    size = float(native.get('size', native.get('upm', 1000)))
    if not math.isfinite(size) or size <= 0:
        raise ValueError('Native glyph design size must be positive')
    scale = upm / size
    baseline = float(native.get('baseline', 1200))
    x_origin = float(native.get('xOrigin', 100))
    # glyf.__setitem__ also appends to its live glyph-order list; keep our
    # explicit final order separate so added names cannot be duplicated.
    glyph_order = list(font.getGlyphOrder())
    replacements = []
    seen = set()
    for record in native.get('glyphs', []):
        codepoint = int(record['codepoint'])
        if codepoint in seen or not 0 <= codepoint <= 0x10FFFF or 0xD800 <= codepoint <= 0xDFFF:
            raise ValueError(f'Duplicate or invalid Unicode codepoint: {codepoint}')
        seen.add(codepoint)
        outline = native_path(record['path'], x_origin=x_origin, baseline=baseline, scale=scale)
        expanded = rounded_outline(outline, record.get('stroke', {}), scale)
        source_counters = sum(contour.clockwise for contour in outline.contours)
        final_counters = sum(contour.clockwise for contour in expanded.contours)
        if source_counters != final_counters:
            raise ValueError(f'Rounded expansion changed counters for U+{codepoint:04X}')
        glyph = tt_glyph(expanded, max_error=0.4 * scale)
        advance = round(float(record['advance']) * scale)
        if not 0 <= advance <= 4 * upm:
            raise ValueError(f'Invalid advance for U+{codepoint:04X}')
        if glyph.numberOfContours == 0 and not chr(codepoint).isspace():
            raise ValueError(f'Unexpected empty glyph U+{codepoint:04X}')
        name = f'osayu.u{codepoint:04X}'
        if name in glyph_order:
            raise ValueError('Base font already contains derivative glyph names')
        font['glyf'][name] = glyph
        glyph.recalcBounds(font['glyf'])
        left = glyph.xMin if glyph.numberOfContours else 0
        font['hmtx'][name] = (advance, left)
        if 'vmtx' in font:
            previous_name = original_map.get(codepoint, '.notdef')
            old_glyph = font['glyf'][previous_name]
            old_glyph.recalcBounds(font['glyf'])
            v_advance, v_bearing = font['vmtx'][previous_name]
            original_top = getattr(old_glyph, 'yMax', 0) + v_bearing
            font['vmtx'][name] = (v_advance, original_top - getattr(glyph, 'yMax', 0))
        glyph_order.append(name)
        for table in font['cmap'].tables:
            if table.isUnicode():
                table.cmap[codepoint] = name
        bounds = [getattr(glyph, k, 0) for k in ['xMin', 'yMin', 'xMax', 'yMax']]
        replacements.append({'codepoint': codepoint, 'character': chr(codepoint),
                             'glyph': name, 'advance': advance, 'bounds': bounds,
                             'contours': glyph.numberOfContours,
                             'sourceCounterCount': source_counters,
                             'counterCount': final_counters,
                             'strokeWidth': record.get('stroke', {}).get('width', 0)})
    if not replacements:
        raise ValueError('No native glyphs provided')
    font.setGlyphOrder(glyph_order)
    # The original substitution and positioning tables target source glyphs;
    # this horizontal display derivative uses its own proportional metrics.
    removed = []
    for tag in ['GSUB', 'GPOS', 'GDEF', 'DSIG']:
        if tag in font:
            del font[tag]
            removed.append(tag)
    set_names(font)
    font['head'].fontRevision = 1.0
    # A fixed creation/modification timestamp makes identical inputs reproducible.
    font['head'].created = font['head'].modified = 3876076800  # 2026-10-29 UTC, Mac epoch
    font['OS/2'].achVendID = 'OSAY'
    font['OS/2'].fsType = 0
    font['OS/2'].usWeightClass = 400
    font['OS/2'].fsSelection = (font['OS/2'].fsSelection & ~0x21) | 0x40
    font['head'].macStyle &= ~3
    # Keep base line spacing, enlarging clipping extents only when necessary.
    top = max([font['OS/2'].usWinAscent] + [r['bounds'][3] for r in replacements])
    bottom = max([font['OS/2'].usWinDescent] + [-r['bounds'][1] for r in replacements])
    font['OS/2'].usWinAscent = top
    font['OS/2'].usWinDescent = bottom
    font['post'].formatType = 3.0
    options = subset.Options()
    options.name_IDs = ['*']
    options.name_languages = ['*']
    options.name_legacy = True
    options.notdef_outline = True
    options.recommended_glyphs = True
    options.recalc_timestamp = False
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=selection['requested'])
    subsetter.subset(font)
    output.parent.mkdir(parents=True, exist_ok=True)
    font.save(output, reorderTables=True)
    font.close()
    return original_map, replacements, removed


def validate(output: Path, original_map: dict, replacements: list[dict], selection: dict):
    font = TTFont(output, checkChecksums=2, recalcTimestamp=False)
    cmap = font.getBestCmap()
    lost = sorted(selection['requested'] - set(cmap))
    if lost:
        raise ValueError(f'Lost requested Japanese cmap coverage: {lost[:10]}')
    if set(cmap) - selection['requested']:
        raise ValueError('Final cmap contains characters outside the declared selection')
    # Force every glyph to decompile and compile; this also follows components.
    for name in font.getGlyphOrder():
        glyph = font['glyf'][name]
        glyph.compile(font['glyf'])
    expected = [int(r['codepoint']) for r in replacements]
    if any(cp not in cmap for cp in expected):
        raise ValueError('A designed character is absent from the final cmap')
    for replacement in replacements:
        glyph = font['glyf'][cmap[replacement['codepoint']]]
        path = pathops.Path()
        glyph.draw(path.getPen(), font['glyf'])
        contours = list(path.contours)
        if contours and not max(contours, key=lambda c: c.area).clockwise:
            raise ValueError('A TrueType outer contour has the wrong direction')
        counters = sum(not contour.clockwise for contour in contours)
        if counters != replacement['counterCount']:
            raise ValueError('Compiled glyph counter mismatch')
    samples = [
        'ありがとう', 'おはさゆ', 'はじめまして', 'ちょっとまってね',
        'はいしんちゅう', 'うたいます', 'おつさゆ', 'またね',
        '初見さん歓迎 配信中 歌ってみた ありがとう おはさゆ 123 ABC',
        '初見 配信 歌 感謝 応援 音桜夢 雑談 記念 誕生日 歌枠',
        '𠮟 剝 頰 塡 鬱',
    ]
    missing = {text: [f'U+{ord(ch):04X}' for ch in text if ord(ch) not in cmap] for text in samples}
    if any(missing.values()):
        raise ValueError(f'Sample text has missing characters: {missing}')
    report = {
        'glyphCount': len(font.getGlyphOrder()), 'unicodeCodepoints': len(cmap),
        'sourceUnicodeCodepoints': len(original_map),
        'preservedRequestedJapaneseCmap': not lost,
        'unitsPerEm': font['head'].unitsPerEm,
        'samples': [{'text': t, 'missing': m} for t, m in missing.items()],
        'allGlyphsDecompiledAndCompiled': True,
        'replacementCountersPreserved': True,
        'trueTypeContourDirection': 'clockwise outer / counterclockwise counters',
        'family': font['name'].getDebugName(1), 'postScriptName': font['name'].getDebugName(6),
        'fontVersion': font['name'].getDebugName(5),
        'monochrome': True, 'colorTables': [t for t in ['COLR', 'CPAL', 'SVG ', 'sbix', 'CBDT'] if t in font],
    }
    coverage = {}
    for key, chars in [('joyo', selection['joyo']), ('jis0208Level1And2', selection['jis'])]:
        missing = []
        for cp in sorted(chars):
            name = cmap.get(cp)
            if not name or font['glyf'][name].numberOfContours == 0:
                missing.append(cp)
        if missing:
            raise ValueError(f'Empty or missing Japanese kanji in {key}: {missing[:10]}')
        coverage[key] = {'requested': len(chars), 'supportedNonempty': len(chars),
                         'missingCodepoints': [], 'missingCharacters': ''}
    report['japaneseCoverage'] = coverage
    report['charsetSelection'] = {
        'rule': 'JIS X 0208 level 1/2 kanji + official Joyo 2136 + named stream lexicon '
                '+ all 294 native characters + all original non-Han characters',
        'selectedHanCodepoints': sum(is_han(cp) for cp in cmap),
        'preservedSourceNonHanCodepoints': len(selection['sourceNonHan']),
        'removedUnrequestedHanCodepoints': len(selection['removedHan']),
        'removedCodepoints': sorted(selection['removedHan']),
        'requestedCharactersMissingFromSource': [],
        'joyoSource': selection['joyoSource'],
        'joyoSourceSha256': selection['joyoSourceSha256'],
        'joyoListSha256': selection['joyoListSha256'], 'jisListSha256': selection['jisListSha256'],
        'note': 'Selected for Japanese stream captions; no claim that Han characters are nationally exclusive.',
    }
    font.close()
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base', type=Path, default=ROOT / 'assets/MochiyPopOne-Regular.ttf')
    parser.add_argument('--native', type=Path, default=ROOT / 'native-glyphs.json')
    parser.add_argument('--output', type=Path, default=ROOT / 'font/OsayuPuku-Regular.ttf')
    parser.add_argument('--qa', type=Path, default=ROOT / 'font/font-qa.json')
    parser.add_argument('--joyo', type=Path, default=ROOT / 'kanji-qa/joyo-codepoints.json')
    parser.add_argument('--jis0208', type=Path, default=ROOT / 'kanji-qa/jis0208-level1-level2-codepoints.json')
    args = parser.parse_args()
    native = json.loads(args.native.read_text(encoding='utf-8'))
    selection = japanese_selection(args.base, native, args.joyo, args.jis0208)
    original, replacements, removed = build_font(args.base, native, args.output, selection)
    qa = validate(args.output, original, replacements, selection)
    second = args.output.with_suffix('.rebuild.ttf')
    build_font(args.base, native, second, selection)
    if args.output.read_bytes() != second.read_bytes():
        raise ValueError('Repeated compilation was not deterministic')
    second.unlink()
    qa.update({
        'sha256': digest(args.output), 'bytes': args.output.stat().st_size,
        'deterministicRebuild': True, 'nativeGlyphsSha256': digest(args.native),
        'baseFontSha256': digest(args.base), 'replacementCount': len(replacements),
        'replacements': replacements, 'removedSourceTables': removed,
        'license': 'OFL-1.1', 'copyright': COPYRIGHT,
        'fontToolsVersion': fontTools.__version__,
        'pathopsVersion': getattr(pathops, '__version__', 'unknown'),
        'iphoneImportTest': False, 'ibisPaintImportTest': False,
        'limitations': ['Monochrome outlines: color, white outline and gloss are applied in the editor.',
                        'Source shaping tables are removed; vertical/complex-script shaping is not validated.',
                        'iPhone and ibisPaint import/rendering require separate device verification.'],
    })
    args.qa.parent.mkdir(parents=True, exist_ok=True)
    args.qa.write_text(json.dumps(qa, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({k: qa[k] for k in ['family', 'glyphCount', 'unicodeCodepoints',
                                      'replacementCount', 'sha256', 'deterministicRebuild']}, ensure_ascii=False))


if __name__ == '__main__':
    main()
