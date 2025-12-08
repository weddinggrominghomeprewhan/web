#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Usage: python build_gallery.py --dst .

import argparse, os, json, pathlib, math
from PIL import Image, ExifTags

def natural_sort_key(s):
    import re
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', s)]

def get_caption_date(img_path):
    try:
        with Image.open(img_path) as im:
            raw = im.getexif() or {}
            desc = raw.get(0x010e) or raw.get(0x9c9b)
            dt = raw.get(0x9003) or raw.get(0x0132)
            caption = img_path.stem
            if desc and isinstance(desc, str):
                caption = desc.strip()
            elif dt and isinstance(dt, str) and len(dt) >= 10:
                date_str = dt[:10].replace(':', '-')
                caption = f"{img_path.stem} · {date_str}"
            return caption
    except Exception:
        return img_path.stem

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dst', default='.', help='Project folder')
    ap.add_argument('--page-size', type=int, default=100)
    args = ap.parse_args()

    dst = pathlib.Path(args.dst)
    full_dir = dst / 'gallery' / 'full'
    thumbs_dir = dst / 'gallery' / 'thumbs'
    manifests_dir = dst / 'manifests'

    if not full_dir.exists():
        print(f"Error: Not found {full_dir}")
        return

    manifests_dir.mkdir(parents=True, exist_ok=True)

    # 1. Scan Images
    exts = {'.jpg', '.jpeg', '.png', '.webp', '.avif'}
    files = [p for p in full_dir.glob('*') if p.suffix.lower() in exts]
    files.sort(key=lambda p: natural_sort_key(p.name))

    print(f"Found {len(files)} images...")

    items = []
    for f in files:
        thumb_path = thumbs_dir / f.name
        if not thumb_path.exists(): thumb_path = f
        
        web_full = str(f.relative_to(dst)).replace('\\', '/')
        web_thumb = str(thumb_path.relative_to(dst)).replace('\\', '/')
        caption = get_caption_date(f) 
        
        tags = []
        if '.' in f.stem:
            possible_tag = f.stem.split('.')[0]
            if not possible_tag.isdigit():
                tags.append(possible_tag)

        items.append({
            "thumb": web_thumb,
            "full":  web_full,
            "caption": caption,
            "tags": tags
        })

    # 2. Pagination
    n = len(items)
    page_size = max(1, args.page_size)
    pages = math.ceil(n / page_size)

    for old_json in manifests_dir.glob("page_*.json"):
        old_json.unlink(missing_ok=True)

    for p in range(pages):
        chunk = items[p*page_size : (p+1)*page_size]
        out_name = manifests_dir / f"page_{p:03d}.json"
        with open(out_name, 'w', encoding='utf-8') as fh:
            json.dump(chunk, fh, ensure_ascii=False, separators=(',', ':'))
            
    # --- 3. ส่วนที่เพิ่ม: บันทึกจำนวนรูป (Meta Data) ---
    meta_path = manifests_dir / "meta.json"
    with open(meta_path, 'w', encoding='utf-8') as fh:
        json.dump({"total": n, "pages": pages}, fh)
    # -----------------------------------------------

    print(f"✅ Saved meta.json -> Total: {n} images")
    print(f"✅ Process Complete.")

if __name__ == '__main__':
    main()