#!/usr/bin/env python3
"""Convert the reader's monospace webfont into an installable terminal font.

MekzantineMono ships as a `.woff2` (a web format) that git-ignores its binary,
because Mekzantine has no published licence. This produces a local `.ttf` you can
install for terminal work: it decompresses the woff2, flags it as monospaced
(`post.isFixedPitch` + a monospace OS/2 PANOSE, so terminal font pickers list it),
and renames the family to a distinct "Mekzantine Mono". The output `.ttf` is NOT
committed (git-ignored) — only this script is.

    python scripts/make-terminal-font.py           # -> build/MekzantineMono.ttf
"""
from __future__ import annotations

import sys
from pathlib import Path

from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "fonts" / "mekzantine-mono.woff2"
OUT_DIR = ROOT / "build"
OUT = OUT_DIR / "MekzantineMono.ttf"
FAMILY = "Mekzantine Mono"
PS_NAME = "MekzantineMono"


def is_monospace(font: TTFont) -> bool:
    hmtx, cmap = font["hmtx"], font.getBestCmap()
    widths = {hmtx[cmap[c]][0] for c in range(0x21, 0x7F) if c in cmap}
    return len(widths) == 1


def main() -> int:
    if not SRC.exists():
        print(f"make-terminal-font: source not found: {SRC}", file=sys.stderr)
        print("  run `node scripts/fetch-fonts.mjs` first.", file=sys.stderr)
        return 1

    font = TTFont(str(SRC))  # brotli required for woff2
    font.flavor = None  # emit a plain TTF, not woff/woff2

    if not is_monospace(font):
        print("make-terminal-font: refusing — the source is not monospaced.", file=sys.stderr)
        return 1

    # Flag it monospaced so terminals (which filter their font pickers) list it.
    font["post"].isFixedPitch = 1
    if "OS/2" in font and getattr(font["OS/2"], "panose", None) is not None:
        panose = font["OS/2"].panose
        panose.bFamilyType = 2  # Latin Text
        panose.bProportion = 9  # Monospaced

    # Rename the family so it reads distinctly in the picker (mono vs display).
    # Set on both Windows (3,1,en-US) and Mac (1,0,en) records so every consumer
    # agrees; setName also drops any stale record for that (id, platform, enc, lang).
    name = font["name"]
    renames = {1: FAMILY, 4: FAMILY, 6: PS_NAME, 16: FAMILY}
    for nid, value in renames.items():
        name.setName(value, nid, 3, 1, 0x409)  # Windows, Unicode BMP, en-US
        name.setName(value, nid, 1, 0, 0)  # Mac, Roman, English

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    font.save(str(OUT))

    # Verify the artifact: read the Windows family record (what terminals use).
    check = TTFont(str(OUT))
    ok_mono = is_monospace(check) and bool(check["post"].isFixedPitch)
    win_family = check["name"].getName(1, 3, 1, 0x409)
    fam = str(win_family) if win_family else check["name"].getDebugName(1)
    ok = ok_mono and fam == FAMILY
    print(f"make-terminal-font: wrote {OUT.relative_to(ROOT)} "
          f"(windows family={fam!r}, monospace={ok_mono})")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
