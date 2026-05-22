"""Detect sprite bounding boxes by clustering non-transparent pixels into rows then columns."""
import sys
from PIL import Image

def find_rows(img, alpha_thresh=20, gap=10):
    w, h = img.size
    px = img.load()
    row_has = [False] * h
    for y in range(h):
        for x in range(w):
            a = px[x, y][3]
            if a > alpha_thresh:
                row_has[y] = True
                break
    rows = []
    y = 0
    while y < h:
        if row_has[y]:
            start = y
            blank = 0
            while y < h and (row_has[y] or blank < gap):
                if not row_has[y]:
                    blank += 1
                else:
                    blank = 0
                y += 1
            end = y - blank
            rows.append((start, end))
        else:
            y += 1
    return rows

def find_cols_in_band(img, y0, y1, alpha_thresh=20, gap=8):
    w, _ = img.size
    px = img.load()
    col_has = [False] * w
    for x in range(w):
        for y in range(y0, y1):
            a = px[x, y][3]
            if a > alpha_thresh:
                col_has[x] = True
                break
    cols = []
    x = 0
    while x < w:
        if col_has[x]:
            start = x
            blank = 0
            while x < w and (col_has[x] or blank < gap):
                if not col_has[x]:
                    blank += 1
                else:
                    blank = 0
                x += 1
            end = x - blank
            cols.append((start, end))
        else:
            x += 1
    return cols

def tight_box(img, x0, y0, x1, y1, alpha_thresh=20):
    px = img.load()
    minx, miny, maxx, maxy = x1, y1, x0, y0
    found = False
    for y in range(y0, y1):
        for x in range(x0, x1):
            if px[x, y][3] > alpha_thresh:
                if x < minx: minx = x
                if y < miny: miny = y
                if x > maxx: maxx = x
                if y > maxy: maxy = y
                found = True
    if not found:
        return None
    return (minx, miny, maxx - minx + 1, maxy - miny + 1)

def analyze(path, label_filter_h=24):
    print(f"\n=== {path} ===")
    img = Image.open(path).convert("RGBA")
    rows = find_rows(img)
    for ri, (y0, y1) in enumerate(rows):
        height = y1 - y0
        cols = find_cols_in_band(img, y0, y1)
        # Skip rows that look like single-word labels (short, narrow, just 1-2 cols)
        kind = "row"
        if height < label_filter_h and len(cols) <= 3:
            kind = "label?"
        print(f"row {ri}: y={y0}..{y1} (h={height}) cols={len(cols)} [{kind}]")
        if kind == "label?":
            continue
        for ci, (x0, x1) in enumerate(cols):
            tb = tight_box(img, x0, y0, x1, y1)
            if tb:
                print(f"  frame {ci}: x={tb[0]} y={tb[1]} w={tb[2]} h={tb[3]}")

for p in sys.argv[1:]:
    analyze(p)
