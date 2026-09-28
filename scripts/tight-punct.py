# Builds src/assets/fonts/jakarta-punct.woff2: Plus Jakarta Sans's comma and period only, with the
# left side bearing trimmed so "calls," and "sells." don't look like they have a space before the
# punctuation. Loaded ahead of Plus Jakarta Sans with unicode-range, so the punctuation stays in the
# same text run as the word. Needs `pip install fonttools brotli`. Run: python scripts/tight-punct.py
from fontTools.ttLib import TTFont
from fontTools.subset import Options, Subsetter

SRC = 'node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2'
OUT = 'src/assets/fonts/jakarta-punct.woff2'
LSB = 0.02  # em

font = TTFont(SRC)
options = Options()
options.flavor = 'woff2'
options.layout_features = []
subsetter = Subsetter(options)
subsetter.populate(unicodes=[0x2C, 0x2E])
subsetter.subset(font)

upem = font['head'].unitsPerEm
glyf, hmtx = font['glyf'], font['hmtx']
cmap = font.getBestCmap()
for code in (0x2C, 0x2E):
    name = cmap[code]
    glyph = glyf[name]
    advance, lsb = hmtx[name]
    dx = round(LSB * upem) - lsb
    glyph.coordinates.translate((dx, 0))
    glyph.recalcBounds(glyf)
    hmtx[name] = (advance + dx, glyph.xMin)
    print(f'{chr(code)!r}: lsb {lsb} -> {glyph.xMin}, advance {advance} -> {advance + dx} (upem {upem})')

font.save(OUT)
