import re, pathlib, subprocess, sys, string

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
OUT = ROOT / "public" / "v4" / "fonts"
OUT.mkdir(parents=True, exist_ok=True)

chars = set()
for p in list(SRC.rglob("*.tsx")) + list(SRC.rglob("*.ts")) + list(SRC.rglob("*.css")) + [ROOT / "index.html", ROOT / "src" / "data.ts"]:
    if p.exists():
        chars |= set(p.read_text(encoding="utf-8"))

# printable ascii + common CJK punctuation + typographic marks used in the UI
extra = string.printable + "·—–…“”‘’「」『』《》〈〉、。，；：？！（）【】￥·↗↖↶↻←→↑↓✓✳✉✦≈"
chars |= set(extra)
chars = {c for c in chars if c.strip() or c == " "}
text = "".join(sorted(chars))
(ROOT / "scripts" / "charset.txt").write_text(text, encoding="utf-8")
print("unique chars:", len(chars))

tmp = pathlib.Path(r"C:/Users/rjx58/AppData/Local/Temp")
jobs = [
    ("ZCOOLKuaiLe-Regular.ttf", "display.woff2"),
    ("NotoSerifSC.ttf", "text.woff2"),
]
for src, dst in jobs:
    sp = tmp / src
    if not sp.exists():
        print("missing", sp)
        continue
    cmd = [
        sys.executable, "-m", "fontTools.subset", str(sp),
        f"--text-file={ROOT / 'scripts' / 'charset.txt'}",
        "--layout-features=kern,liga,vert,vrt2,palt",
        "--flavor=woff2",
        f"--output-file={OUT / dst}",
        "--no-hinting",
        "--desubroutinize",
        "--drop-tables+=DSIG",
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    print(dst, "rc", r.returncode, r.stderr[-400:])

# latin serif display face
ins = ROOT / "对比评审/.agents/skills/oil-ui/assets/fonts/instrument-serif/InstrumentSerif-Regular.ttf"
if ins.exists():
    r = subprocess.run([
        sys.executable, "-m", "fontTools.subset", str(ins),
        "--unicodes=U+0020-007E,U+00A0-00FF,U+2013,U+2014,U+2018-201D,U+2026,U+00B7",
        "--flavor=woff2", f"--output-file={OUT / 'instrument-serif.woff2'}", "--no-hinting",
    ], capture_output=True, text=True)
    print("instrument", r.returncode, r.stderr[-300:])

for p in sorted(OUT.iterdir()):
    print(p.name, round(p.stat().st_size / 1024, 1), "KB")
