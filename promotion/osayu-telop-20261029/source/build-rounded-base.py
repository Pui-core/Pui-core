#!/usr/bin/env python3
"""Build the rounded-kanji outline base for Osayu Puku Jelly color fonts.

The previous PhotoCraft-authored kana/Latin outlines are kept. Japanese Han
characters use Zen Maru Gothic Black with a 90% vertical optical adjustment;
the four canonical Joyo forms absent from Zen retain the previous outlines.
No extra stroke expansion is needed on the already rounded Black source.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
from pathlib import Path

import fontTools
import pathops
from fontTools import subset
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont


ROOT = Path('/home/pui/Videos/Osayu-Telop/2026-10-29')
COPYRIGHT = (
    'Copyright 2020 The MochiyPop Project Authors '
    '(https://github.com/fontdasu/Mochiypop); '
    'Copyright 2019 The Cherry Bomb Project Authors '
    '(https://github.com/satsuyako/CherryBomb); '
    'Copyright 2021 The Zen Maru Gothic Project Authors '
    '(https://github.com/googlefonts/zen-marugothic). '
    'Osayu Puku Jelly Base is a 2026 OFL derivative. Its kana and Latin '
    'outlines were authored in PhotoCraft from Cherry Bomb One; its rounded '
    'kanji are based on Zen Maru Gothic Black with an optical height adjustment.'
)
FALLBACK_FORMS = set(map(ord, '𠮟塡剝頰'))
V_SCALE = 0.90


def digest(file: Path) -> str:
    return hashlib.sha256(file.read_bytes()).hexdigest()


def is_han(cp: int) -> bool:
    return any(lo <= cp <= hi for lo, hi in [
        (0x3400, 0x4DBF), (0x4E00, 0x9FFF), (0xF900, 0xFAFF),
        (0x20000, 0x2FA1F), (0x30000, 0x323AF),
    ])


def recorded(glyph_set, name: str):
    pen = DecomposingRecordingPen(glyph_set)
    glyph_set[name].draw(pen)
    return pen


def contour_stats(recording):
    shape = pathops.Path()
    recording.replay(shape.getPen())
    contours = list(shape.contours)
    return {'contours': len(contours),
            'counters': sum(not c.clockwise for c in contours)}


def outline_signature(glyph_set, name: str) -> str:
    value = recorded(glyph_set, name).value
    # Integer source coordinates and equal floating values have equal encodings.
    def normalize(item):
        if isinstance(item, (tuple, list)):
            return [normalize(x) for x in item]
        if isinstance(item, float) and item.is_integer():
            return int(item)
        return item
    data = json.dumps(normalize(value), separators=(',', ':')).encode()
    return hashlib.sha256(data).hexdigest()


def set_names(font):
    font['name'].names = []
    names = {
        0: COPYRIGHT,
        1: 'Osayu Puku Jelly Base', 2: 'Regular',
        3: '2.000;OSAY;OsayuPukuJelly-Base',
        4: 'Osayu Puku Jelly Base Regular', 5: 'Version 2.000',
        6: 'OsayuPukuJelly-Base',
        8: 'Osayu Puku Jelly derivative project',
        9: 'Based on FONTDASU, Satsuyako, and the Zen Maru Gothic Project Authors',
        10: 'Rounded Japanese outline base: PhotoCraft-authored kana and Latin, '
            'Zen Maru Gothic Black kanji at 90% vertical scale, four Joyo '
            'canonical-form fallback outlines from Mochiy Pop One.',
        13: 'This Font Software is licensed under the SIL Open Font License, '
            'Version 1.1. The original copyright notices and OFL copies '
            'accompany this distribution.',
        14: 'https://openfontlicense.org/',
        16: 'Osayu Puku Jelly Base', 17: 'Regular',
    }
    for name_id, text in names.items():
        font['name'].setName(text, name_id, 3, 1, 0x409)
        if text.isascii():
            font['name'].setName(text, name_id, 1, 0, 0)
    for name_id in [1, 4, 16]:
        font['name'].setName('おさゆ ぷくジェリー 基本字形', name_id, 3, 1, 0x411)
    font['name'].setName('Regular', 2, 3, 1, 0x411)


def build(previous: Path, zen_path: Path, output: Path):
    font = TTFont(previous, recalcTimestamp=False)
    zen = TTFont(zen_path, recalcTimestamp=False)
    cmap = dict(font.getBestCmap())
    zen_cmap = zen.getBestCmap()
    zen_set = zen.getGlyphSet()
    scale = font['head'].unitsPerEm / zen['head'].unitsPerEm
    order = list(font.getGlyphOrder())
    replacements, fallback = [], []
    for cp, previous_name in sorted(cmap.items()):
        if not is_han(cp):
            continue
        if cp not in zen_cmap:
            fallback.append(cp)
            continue
        source = recorded(zen_set, zen_cmap[cp])
        stats = contour_stats(source)
        if not stats['contours']:
            raise ValueError(f'Empty Zen kanji: U+{cp:04X}')
        pen = TTGlyphPen(None)
        source.replay(TransformPen(pen, (scale, 0, 0, scale * V_SCALE, 0, 0)))
        glyph = pen.glyph()
        name = f'jelly.u{cp:04X}'
        if name in order:
            raise ValueError('Derivative glyph name already exists')
        old = font['glyf'][previous_name]
        old.recalcBounds(font['glyf'])
        font['glyf'][name] = glyph
        glyph.recalcBounds(font['glyf'])
        font['hmtx'][name] = (font['hmtx'][previous_name][0], glyph.xMin)
        if 'vmtx' in font:
            advance, bearing = font['vmtx'][previous_name]
            origin = getattr(old, 'yMax', 0) + bearing
            font['vmtx'][name] = (advance, origin - glyph.yMax)
        order.append(name)
        for table in font['cmap'].tables:
            if table.isUnicode() and cp in table.cmap:
                table.cmap[cp] = name
        replacements.append({'codepoint': cp, 'character': chr(cp), **stats,
                             'advance': font['hmtx'][name][0],
                             'bounds': [glyph.xMin, glyph.yMin, glyph.xMax, glyph.yMax]})
    if set(fallback) != FALLBACK_FORMS:
        raise ValueError(f'Unexpected missing Zen forms: {fallback}')
    font.setGlyphOrder(order)
    for tag in ['GSUB', 'GPOS', 'GDEF', 'DSIG']:
        if tag in font:
            del font[tag]
    set_names(font)
    font['head'].fontRevision = 2.0
    font['head'].created = font['head'].modified = 3876076800
    font['OS/2'].achVendID = 'OSAY'
    font['OS/2'].fsType = 0
    font['OS/2'].usWeightClass = 400
    font['OS/2'].fsSelection = (font['OS/2'].fsSelection & ~0x21) | 0x40
    font['head'].macStyle &= ~3
    font['post'].formatType = 3.0
    options = subset.Options()
    options.name_IDs = ['*']
    options.name_languages = ['*']
    options.name_legacy = True
    options.notdef_outline = True
    options.recommended_glyphs = True
    options.recalc_timestamp = False
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=set(cmap))
    subsetter.subset(font)
    output.parent.mkdir(parents=True, exist_ok=True)
    font.save(output, reorderTables=True)
    font.close()
    zen.close()
    return cmap, replacements, fallback


def validate(previous: Path, output: Path, replacements, fallback, joyo, jis):
    font = TTFont(output, checkChecksums=2, recalcTimestamp=False)
    original = TTFont(previous, recalcTimestamp=False)
    cmap, old_cmap = font.getBestCmap(), original.getBestCmap()
    if set(cmap) != set(old_cmap):
        raise ValueError('The previous Unicode repertoire changed')
    glyph_set, old_set = font.getGlyphSet(), original.getGlyphSet()
    for name in font.getGlyphOrder():
        font['glyf'][name].compile(font['glyf'])
    counter_audit = []
    for item in replacements:
        cp = item['codepoint']
        stats = contour_stats(recorded(glyph_set, cmap[cp]))
        if stats['counters'] != item['counters'] or stats['contours'] != item['contours']:
            raise ValueError(f'Changed contours/counters after rounding U+{cp:04X}')
        counter_audit.append({**item, 'compiledCounters': stats['counters'],
                              'compiledContours': stats['contours']})
    preserved = 0
    for cp in sorted(set(cmap) - {item['codepoint'] for item in replacements}):
        if outline_signature(glyph_set, cmap[cp]) != outline_signature(old_set, old_cmap[cp]):
            raise ValueError(f'Unmodified outline changed: U+{cp:04X}')
        if font['hmtx'][cmap[cp]][0] != original['hmtx'][old_cmap[cp]][0]:
            raise ValueError(f'Unmodified advance changed: U+{cp:04X}')
        preserved += 1
    coverage = {}
    for label, cps in [('joyo', joyo), ('jis0208Level1And2', jis)]:
        missing = [cp for cp in cps if cp not in cmap or
                   font['glyf'][cmap[cp]].numberOfContours == 0]
        if missing:
            raise ValueError(f'Missing Japanese coverage: {label} {missing}')
        coverage[label] = {'expected': len(cps), 'nonempty': len(cps), 'missing': []}
    samples = {}
    for text in ['ありがとう', 'おはさゆ', '初見さん歓迎', 'ちょっと待ってね',
                 '配信中', '歌ってみた', 'おつさゆ', 'またね', '音桜夢 感謝 応援']:
        missing = [cp for cp in map(ord, text) if cp not in cmap]
        if missing:
            raise ValueError(f'Missing sample characters: {text}')
        samples[text] = {'missing': []}
    report = {
        'family': font['name'].getDebugName(1),
        'postScriptName': font['name'].getDebugName(6),
        'fontVersion': font['name'].getDebugName(5),
        'glyphCount': len(font.getGlyphOrder()), 'unicodeCodepoints': len(cmap),
        'previousCmapPreserved': True, 'allGlyphsCompiled': True,
        'zenKanjiReplacements': len(replacements),
        'fallbackCodepoints': fallback, 'fallbackCharacters': ''.join(map(chr, fallback)),
        'unmodifiedOutlinesAndAdvancesPreserved': preserved,
        'replacementContoursAndCountersPreserved': True,
        'verticalOpticalScale': V_SCALE, 'baselineShift': 0, 'extraStroke': 0,
        'japaneseCoverage': coverage, 'samples': samples,
        'copyright': COPYRIGHT, 'license': 'OFL-1.1',
        'fontToolsVersion': fontTools.__version__,
        'pathopsVersion': getattr(pathops, '__version__', 'unknown'),
        'iphoneOrIbisPaintTest': False,
    }
    font.close()
    original.close()
    return report, counter_audit


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--previous', type=Path, default=ROOT / 'font/OsayuPuku-Regular.ttf')
    parser.add_argument('--zen', type=Path,
                        default=ROOT / 'revision2/research/zenmarugothic/ZenMaruGothic-Black.ttf')
    parser.add_argument('--output', type=Path,
                        default=ROOT / 'revision2/base/OsayuPukuJelly-Base.ttf')
    parser.add_argument('--joyo', type=Path, default=ROOT / 'kanji-qa/joyo-codepoints.json')
    parser.add_argument('--jis', type=Path,
                        default=ROOT / 'kanji-qa/jis0208-level1-level2-codepoints.json')
    args = parser.parse_args()
    joyo = json.loads(args.joyo.read_text(encoding='utf-8'))['codepoints']
    jis = json.loads(args.jis.read_text(encoding='utf-8'))
    _, replacements, fallback = build(args.previous, args.zen, args.output)
    report, audit = validate(args.previous, args.output, replacements, fallback, joyo, jis)
    repeated = args.output.with_suffix('.rebuild.ttf')
    build(args.previous, args.zen, repeated)
    if args.output.read_bytes() != repeated.read_bytes():
        raise ValueError('Repeated build differs')
    repeated.unlink()
    outdir = args.output.parent
    licenses = [
        (ROOT / 'assets/OFL.txt', 'OFL-MochiyPopOne.txt'),
        (ROOT / 'assets/cherry-bomb-one/OFL.txt', 'OFL-CherryBombOne.txt'),
        (ROOT / 'revision2/research/zenmarugothic/OFL.txt', 'OFL-ZenMaruGothic.txt'),
    ]
    for source, name in licenses:
        if not source.is_file():
            raise ValueError(f'Original license missing: {source}')
        shutil.copyfile(source, outdir / name)
    report.update({'sha256': digest(args.output), 'bytes': args.output.stat().st_size,
                   'previousFontSha256': digest(args.previous),
                   'zenFontSha256': digest(args.zen), 'deterministicRebuild': True,
                   'licenses': [{'source': str(s), 'copied': str(outdir / n),
                                 'sha256': digest(s)} for s, n in licenses]})
    (outdir / 'base-counter-audit.json').write_text(
        json.dumps(audit, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    report['counterAuditSha256'] = digest(outdir / 'base-counter-audit.json')
    (outdir / 'base-qa.json').write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({k: report[k] for k in ['family', 'unicodeCodepoints',
                                          'zenKanjiReplacements', 'fallbackCharacters',
                                          'sha256', 'bytes']}, ensure_ascii=False))


if __name__ == '__main__':
    main()
