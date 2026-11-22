from pathlib import Path
import sys
import pymupdf

source = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(r'C:\Users\rjx58\Downloads\桃花.ai')
document = pymupdf.open(source)
page = document[0]
variants = [
    ('a', (54, 62), (63, 68), (0.470588, 0.572549, 0.411765), (0.909804, 0.505882, 0.529412)),
    ('b', (75, 83), (84, 89), (0.631373, 0.705882, 0.513726), (0.952941, 0.67451, 0.662745)),
    ('c', (96, 104), (105, 110), (0.803922, 0.815686, 0.670588), (0.980392, 0.752941, 0.72549)),
]

def path_data(item):
    result = []
    previous = None
    for command, *points in item:
        if command == 're':
            rect = points[0]
            result.append(f'M{rect.x0} {rect.y0}h{rect.width}v{rect.height}h{-rect.width}Z')
        elif command == 'qu':
            quad = points[0]
            result.append(f'M{quad.ul.x} {quad.ul.y}L{quad.ur.x} {quad.ur.y}L{quad.lr.x} {quad.lr.y}L{quad.ll.x} {quad.ll.y}Z')
        else:
            start = points[0]
            if previous is None or abs(previous.x - start.x) + abs(previous.y - start.y) > 0.02:
                result.append(f'M{start.x:.3f} {start.y:.3f}')
            if command == 'l':
                end = points[1]
                result.append(f'L{end.x:.3f} {end.y:.3f}')
            elif command == 'c':
                result.append('C' + ' '.join(f'{point.x:.3f} {point.y:.3f}' for point in points[1:]))
                end = points[-1]
            previous = end
    return ' '.join(result)

for name, leaf_range, petal_range, leaf_color, petal_color in variants:
    drawings = page.get_drawings()
    leaves = [path_data(drawings[index]['items']) + 'Z' for index in [54, 55]]
    petals = [path_data(drawings[index]['items']) + 'Z' for index in range(56, 61)]
    bounds = pymupdf.Rect(120, 344, 486, 624)
    leaf_hex = '#%02x%02x%02x' % tuple(round(color * 255) for color in leaf_color)
    petal_hex = '#%02x%02x%02x' % tuple(round(color * 255) for color in petal_color)
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{bounds.x0} {bounds.y0} {bounds.width} {bounds.height}">']
    for color, width in [('#b2a28a', 16.8), ('#faf7ee', 14.7)]:
        svg.extend(f'<path d="{leaf}" fill="{leaf_hex}" stroke="{color}" stroke-width="{width}" stroke-linejoin="round"/>' for leaf in leaves)
        svg.extend(f'<path d="{petal}" fill="{petal_hex}" stroke="{color}" stroke-width="{width}" stroke-linejoin="round"/>' for petal in petals)
    svg.extend(f'<path d="{leaf}" fill="{leaf_hex}"/>' for leaf in leaves)
    svg.extend(f'<path d="{petal}" fill="{petal_hex}"/>' for petal in petals)
    svg.append(f'<path d="{path_data(drawings[68]["items"])}" fill="none" stroke="#fbf8ee" stroke-width="2.625" stroke-linecap="round"/>')
    for index in range(69, 75):
        svg.append(f'<path d="{path_data(page.get_drawings()[index]["items"])}" fill="none" stroke="#fff8ed" stroke-width="2.205" stroke-linecap="round"/>')
    svg.append('</svg>')
    Path(f'public/v5/botanical-{name}.svg').write_text('\n'.join(svg), encoding='utf-8')
    if name == 'a':
        back = [svg[0]]
        for color, width in [('#b2a28a', 16.8), ('#faf7ee', 14.7)]:
            back.extend(f'<path d="{shape}" fill="#f8f3e7" stroke="{color}" stroke-width="{width}" stroke-linejoin="round"/>' for shape in leaves + petals)
        back.extend(f'<path d="{shape}" fill="#f8f3e7"/>' for shape in leaves + petals)
        back.append('</svg>')
        Path('public/v5/botanical-back.svg').write_text('\n'.join(back), encoding='utf-8')
    print(f'Extracted botanical-{name}.svg')

outline = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="120 344 366 280">']
outline.extend(f'<path d="{shape}" fill="#ffffff" stroke="#ffffff" stroke-width="16.8" stroke-linejoin="round"/>' for shape in leaves + petals)
outline.append('</svg>')
Path('public/v5/botanical-mask.svg').write_text('\n'.join(outline), encoding='utf-8')
