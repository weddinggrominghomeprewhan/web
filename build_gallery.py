#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Generate thumbnails, web-size images, and paginated manifests for the gallery.
# Example:
#   pip install Pillow pillow-heif
#   python build_gallery.py --src /path/to/raw --dst . --page-size 100 --max-thumb 900 --max-full 2000 --format webp --quality 82 --tag-from-folder yes
import argparse, os, sys, json, math, pathlib, hashlib
from PIL import Image, ExifTags
try:
    import pillow_heif  # optional: enable HEIC/HEIF
    pillow_heif.register_heif_opener()
except Exception:
    pass

def natural_sort_key(s):
    import re
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', s)]

def exif_dict(img):
    try:
        raw = img.getexif() or {}
        d = {}
        for k,v in raw.items():
            tag = ExifTags.TAGS.get(k, k)
            d[tag] = v
        return d
    except Exception:
        return {}

def resize_save(src, dst, max_px, fmt='webp', quality=82):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    with Image.open(src) as im:
        im = im.convert('RGB')
        w, h = im.size
        scale = max_px / max(w, h)
        if scale < 1.0:
            im = im.resize((int(w*scale), int(h*scale)), Image.LANCZOS)
        params = {}
        fmt = fmt.lower()
        if fmt in ('jpg','jpeg'):
            params.update(dict(quality=quality, optimize=True, progressive=True))
            dst = os.path.splitext(dst)[0] + '.jpg'
        elif fmt == 'webp':
            params.update(dict(quality=quality, method=6))
            dst = os.path.splitext(dst)[0] + '.webp'
        elif fmt == 'avif':
            # Pillow avif plugin may not be present; fallback to webp if not available
            try:
                params.update(dict(quality=quality))
                dst = os.path.splitext(dst)[0] + '.avif'
            except Exception:
                params.update(dict(quality=quality, method=6))
                dst = os.path.splitext(dst)[0] + '.webp'
        else:
            dst = os.path.splitext(dst)[0] + '.png'
        im.save(dst, **params)
    return dst

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', required=True, help='แหล่งรูปดิบ (โฟลเดอร์)')
    ap.add_argument('--dst', default='.', help='ปลายทางโปรเจกต์เว็บ (โฟลเดอร์ที่มี gallery.html)')
    ap.add_argument('--page-size', type=int, default=100)
    ap.add_argument('--max-thumb', type=int, default=900)
    ap.add_argument('--max-full', type=int, default=2000)
    ap.add_argument('--format', default='webp', choices=['webp','jpg','png'])
    ap.add_argument('--quality', type=int, default=82)
    ap.add_argument('--tag-from-folder', default='yes', choices=['yes','no'])
    args = ap.parse_args()

    src = pathlib.Path(args.src)
    dst = pathlib.Path(args.dst)
    thumbs_dir = dst / 'gallery' / 'thumbs'
    full_dir = dst / 'gallery' / 'full'
    manifests_dir = dst / 'manifests'
    thumbs_dir.mkdir(parents=True, exist_ok=True)
    full_dir.mkdir(parents=True, exist_ok=True)
    manifests_dir.mkdir(parents=True, exist_ok=True)

    # collect
    exts = {'.jpg','.jpeg','.png','.webp','.heic','.heif','.tif','.tiff'}
    files = [p for p in src.rglob('*') if p.suffix.lower() in exts]
    files.sort(key=lambda p: natural_sort_key(str(p)))

    items = []
    for i, f in enumerate(files, 1):
        rel_parts = f.relative_to(src).parts
        tags = []
        if args.tag_from_folder == 'yes' and len(rel_parts) > 1:
            tags = [part for part in rel_parts[:-1]]  # all parent folders

        stem = hashlib.sha1(str(f).encode('utf-8')).hexdigest()[:12]
        thumb_out = thumbs_dir / f"{stem}"
        full_out  = full_dir / f"{stem}"

        # caption from EXIF / filename
        caption = f.stem
        try:
            with Image.open(f) as im:
                ex = exif_dict(im)
                desc = ex.get('ImageDescription') or ex.get('XPTitle')
                dt = ex.get('DateTimeOriginal') or ex.get('DateTime')
                if isinstance(desc, bytes):
                    try:
                        desc = desc.decode('utf-16') if desc.startswith(b'\\xff\\xfe') else desc.decode('utf-8','ignore')
                    except Exception:
                        pass
                if desc and isinstance(desc, str):
                    caption = desc.strip()
                elif dt and isinstance(dt, str) and len(dt)>=10:
                    caption = f"{caption} · {dt[:10]}"
        except Exception:
            pass

        thumb_rel = pathlib.Path(resize_save(f, thumb_out, args.max_thumb, args.format, args.quality)).relative_to(dst)
        full_rel  = pathlib.Path(resize_save(f, full_out,  args.max_full, args.format, args.quality)).relative_to(dst)

        items.append({
            "thumb": str(thumb_rel).replace('\\','/'),
            "full":  str(full_rel).replace('\\','/'),
            "caption": caption,
            "tags": tags
        })

    # paginate
    n = len(items); page_size = max(1, args.page_size)
    pages = (n + page_size - 1) // page_size
    for p in range(pages):
        chunk = items[p*page_size:(p+1)*page_size]
        out = manifests_dir / f"page_{p:03d}.json"
        with open(out, 'w', encoding='utf-8') as fh:
            json.dump(chunk, fh, ensure_ascii=False, separators=(',',':'))

    print(f"Processed {n} images → {pages} pages at {manifests_dir}")

if __name__ == '__main__':
    main()
