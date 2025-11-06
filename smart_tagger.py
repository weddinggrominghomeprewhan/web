#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import argparse, csv, json, pathlib
from PIL import Image, ExifTags

def load_keywords(p):
    try:
        with open(p, 'r', encoding='utf-8') as fh:
            return json.load(fh)
    except Exception:
        return {}

def exif_dict(img):
    try:
        raw = img.getexif() or {}
        return {ExifTags.TAGS.get(k,k): v for k,v in raw.items()}
    except Exception:
        return {}

def time_of_day_tag(dt_str):
    try:
        hh = int(dt_str.split()[1].split(':')[0])
    except Exception:
        return None
    if 5 <= hh < 12: return 'morning'
    if 12 <= hh < 17: return 'afternoon'
    if 17 <= hh < 20: return 'evening'
    return 'night'

def infer_from_filename(stem, kw_map):
    s = stem.lower()
    tags = set()
    for tag, words in kw_map.items():
        for w in words:
            if w.lower() in s:
                tags.add(tag)
                break
    return tags

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', required=True)
    ap.add_argument('--out', default='suggested_tags.csv')
    ap.add_argument('--keywords', default='sample_keywords.json')
    ap.add_argument('--use-folder', default='yes', choices=['yes','no'])
    args = ap.parse_args()

    src = pathlib.Path(args.src)
    exts = {'.jpg','.jpeg','.png','.webp','.heic','.heif','.tif','.tiff'}
    kw_map = load_keywords(args.keywords)

    rows = []
    for p in sorted(src.rglob('*')):
        if p.suffix.lower() not in exts: continue
        # caption default
        caption = p.stem
        tod = None
        try:
            with Image.open(p) as im:
                ex = exif_dict(im)
                desc = ex.get('ImageDescription') or ex.get('XPTitle')
                if isinstance(desc, bytes):
                    try:
                        desc = desc.decode('utf-16') if desc.startswith(b'\\xff\\xfe') else desc.decode('utf-8','ignore')
                    except Exception: pass
                if isinstance(desc,str) and desc.strip():
                    caption = desc.strip()
                dt = ex.get('DateTimeOriginal') or ex.get('DateTime')
                if isinstance(dt,str):
                    tod = time_of_day_tag(dt)
        except Exception:
            pass

        tags = set()
        if args.use_folder == 'yes':
            parts = p.relative_to(src).parts[:-1]
            for part in parts:
                if part: tags.add(part)
        tags |= infer_from_filename(p.stem, kw_map)
        if tod: tags.add(tod)

        rows.append([str(p), caption, ' '.join(sorted(tags))])

    with open(args.out, 'w', newline='', encoding='utf-8') as fh:
        w = csv.writer(fh)
        w.writerow(['filepath','caption_suggested','tags_suggested'])
        w.writerows(rows)
    print(f"[ok] wrote {args.out} with {len(rows)} rows")

if __name__ == '__main__':
    main()
