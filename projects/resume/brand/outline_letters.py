# /// script
# requires-python = ">=3.9"
# dependencies = ["fonttools==4.55.3", "brotli==1.1.0"]
# ///
"""
Prints the outline of a short run of text as SVG path data, so a mark's letters draw the same
everywhere, a favicon and a README included, without the font. Run with uv, which installs the
two pinned packages for this script only:

    uv run brand/outline_letters.py <font file> <text> <size> <centre x> <centre y> <weight>

The site's fonts are variable, so the outline comes from the instance at the given weight, not
from the default master. The ink, not the advance, is centered on the given point: a centered
anchor centers the letters' spacing, and "zk" carries more ink on the right than on the left.
"""

import json
import sys

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

COORDINATE_DECIMALS = 2
WEIGHT_AXIS = "wght"


def format_coordinate(value: float) -> str:
    """Writes a coordinate with at most two decimals and no trailing zeros."""
    return f"{value:.{COORDINATE_DECIMALS}f}".rstrip("0").rstrip(".")


def draw_run(glyph_set, glyph_names, pen, scale: float, offset_x: float, offset_y: float) -> None:
    """Draws the glyphs side by side by their advances, scaled and with y pointing down."""
    pen_x = 0
    for name in glyph_names:
        transform = (scale, 0, 0, -scale, (pen_x + offset_x) * scale, offset_y * scale)
        glyph_set[name].draw(TransformPen(pen, transform))
        pen_x += glyph_set[name].width


def main() -> None:
    """Reads the arguments, outlines the text and prints {"d": <path data>} as JSON."""
    if len(sys.argv) != 7:
        sys.exit(__doc__)
    font_path, text = sys.argv[1], sys.argv[2]
    size, centre_x, centre_y, weight = (float(value) for value in sys.argv[3:7])

    font = instancer.instantiateVariableFont(TTFont(font_path), {WEIGHT_AXIS: weight})
    glyph_set = font.getGlyphSet()
    character_map = font.getBestCmap()
    missing = [character for character in text if ord(character) not in character_map]
    if missing:
        sys.exit(f"The font has no glyph for {missing}")
    glyph_names = [character_map[ord(character)] for character in text]
    scale = size / font["head"].unitsPerEm

    bounds_pen = BoundsPen(glyph_set)
    draw_run(glyph_set, glyph_names, bounds_pen, 1, 0, 0)
    # Font units, but y points down already, because draw_run flips it.
    left, top, right, bottom = bounds_pen.bounds
    ink_left_x = centre_x - (right - left) * scale / 2
    ink_top_y = centre_y - (bottom - top) * scale / 2
    offset_x = ink_left_x / scale - left
    offset_y = ink_top_y / scale - top

    path_pen = SVGPathPen(glyph_set, ntos=format_coordinate)
    draw_run(glyph_set, glyph_names, path_pen, scale, offset_x, offset_y)
    print(json.dumps({"d": path_pen.getCommands()}))


if __name__ == "__main__":
    main()
