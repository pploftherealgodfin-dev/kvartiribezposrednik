"""Regenerate the optional fast icon font; the full pinned font remains a fallback.

Run with Python fonttools[woff] installed, then commit the generated binary/CSS.
This is a maintainer tool, not a hosting build dependency.
"""
from pathlib import Path
import re
from fontTools import subset
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parent.parent
package = root / 'node_modules/remixicon/fonts'
css = package.joinpath('remixicon.css').read_text()
mapping = dict(re.findall(r'\.(ri-[a-z0-9-]+):before\s*\{\s*content:\s*"\\([0-9a-f]+)"', css))
names = set()
for path in root.joinpath('src').rglob('*'):
    if path.suffix in {'.ts', '.tsx'}:
        names.update(re.findall(r'\bri-[a-z0-9-]+', path.read_text()))
points = sorted({int(mapping[name], 16) for name in names if name in mapping})
if not points:
    raise RuntimeError('No mapped icons found')
font = TTFont(package / 'remixicon.woff2')
options = subset.Options()
options.flavor = 'woff2'
subsetter = subset.Subsetter(options=options)
subsetter.populate(unicodes=points)
subsetter.subset(font)
assets = root / 'src/assets'
assets.mkdir(exist_ok=True)
target = assets / 'remixicon-subset.woff2'
font.save(target)
styles = root / 'src/styles'
styles.mkdir(exist_ok=True)
ranges = ','.join('U+%X' % point for point in points)
styles.joinpath('icons.css').write_text("/* Remix Icon 4.5.0, Apache-2.0. Full font covers future icons. */\n@import 'remixicon/fonts/remixicon.css';\n@font-face { font-family: remixicon; font-style: normal; font-weight: 400; font-display: swap; src: url('../assets/remixicon-subset.woff2') format('woff2'); unicode-range: " + ranges + "; }\n")
root.joinpath('src/assets/REMIXICON-LICENSE.txt').write_text(root.joinpath('node_modules/remixicon/License').read_text())
print(f'{len(points)} icons: {target.stat().st_size} bytes (full font: {package.joinpath("remixicon.woff2").stat().st_size})')
