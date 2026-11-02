"""Assemble QA contact sheets from real browser captures; never synthesize app states."""
from pathlib import Path
import json
import math
import re
import subprocess
import tempfile

from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

root = Path('docs/v5')
font = ImageFont.truetype(r'C:\Windows\Fonts\msyh.ttc', 24)
small_font = ImageFont.truetype(r'C:\Windows\Fonts\msyh.ttc', 20)
paper = '#f4f0e5'
ink = '#485b40'


def sheet(items, destination, columns=2, width=960):
    height = round(width * 9 / 16)
    rows = math.ceil(len(items) / columns)
    margin, caption = 20, 46
    canvas = Image.new('RGB', (columns * (width + margin) + margin, rows * (height + caption + margin) + margin), paper)
    draw = ImageDraw.Draw(canvas)
    for index, (label, source) in enumerate(items):
        x = margin + (index % columns) * (width + margin)
        y = margin + (index // columns) * (height + caption + margin)
        draw.text((x, y + 7), label, font=font if width >= 700 else small_font, fill=ink)
        with Image.open(source) as image:
            image = image.convert('RGB').resize((width, height), Image.Resampling.LANCZOS)
            canvas.paste(image, (x, y + caption))
    canvas.save(destination, quality=92)


pages = [('首页', 'idle', '01-idle'), ('活动选择', 'discover', '02-discover'), ('活动详情', 'detail', '04-detail'), ('明信片预览', 'postcard', '05-postcard'), ('收藏完成', 'complete', '07-complete')]
for title, slug, filename in pages:
    sheet([(f'V4 · {title}', root / f'comparison/v4-{slug}.png'), (f'V5 · {title}', root / f'shots/1920-{filename}.png')], root / f'comparison/{slug}-v4-v5.jpg')
sheet([(f'V5 · {title}', root / f'shots/1920-{filename}.png') for title, _, filename in pages] + [('V5 · 明信片背面', root / 'shots/1920-06-back.png')], root / 'shots/five-pages.jpg')
for slug, title in [('open', '开封与沉底'), ('detail', '活动详情展开'), ('postcard', '明信片抽出'), ('flip', '明信片翻面'), ('collect', '确认收藏')]:
    items = [(f'{title} · {percent}%', root / f'frames/{slug}-{percent:03}.png') for percent in [0, 25, 50, 75, 100]]
    if slug == 'open':
        items.append(('动画结束后的稳定画面', root / 'frames/open-stable.png'))
    sheet(items, root / f'frames/{slug}-contact.jpg', columns=3, width=640)

ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
verification = []
for path in root.glob('v5-*.webm'):
    process = subprocess.run([ffmpeg, '-hide_banner', '-nostats', '-v', 'info', '-i', str(path), '-map', '0:v:0', '-f', 'null', '-'], capture_output=True, text=True, encoding='utf-8')
    if process.returncode:
        raise RuntimeError(process.stderr)
    duration = re.search(r'Duration: ([\d:.]+)', process.stderr)
    stream = next((line.strip() for line in process.stderr.splitlines() if 'Stream #' in line and 'Video:' in line), '')
    verification.append({'file': path.name, 'bytes': path.stat().st_size, 'decodedToEnd': True, 'duration': duration.group(1) if duration else None, 'stream': stream})

timeline = json.loads((root / 'video/full-recording-timeline.json').read_text(encoding='utf-8'))
times = [0.5, 3, 7, 12, 16, 16.7, 17.5, 18.4, 20, 26.5, 28, 32.8, 35.5, 38, 40.5, min(timeline['durationSeconds'] - 0.5, 44)]
with tempfile.TemporaryDirectory(prefix='campus-v5-video-') as folder:
    items = []
    for index, seconds in enumerate(times):
        destination = Path(folder) / f'{index}.jpg'
        subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-ss', str(seconds), '-i', str(root / 'v5-full-experience.webm'), '-frames:v', '1', '-vf', 'scale=640:360', '-y', str(destination)], check=True, capture_output=True)
        items.append((f'连续原录屏 · {seconds:.1f} 秒', destination))
    sheet(items, root / 'video/full-contact.jpg', columns=4, width=640)
(root / 'video/decode-results.json').write_text(json.dumps(verification, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'contactSheets': 12, 'videos': verification}, ensure_ascii=False))
