#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import argparse, os, sys, json, math, pathlib, hashlib, csv
from PIL import Image, ExifTags
try:
    import pillow_heif
    pillow_heif.register_heif_opener()
except Exception:
    pass

def exif_dict(img):
    try:
        raw = img.getexif() or {}
        return {ExifTags.TAGS.get(k,k): v for k,v in raw.items()}
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
        else:
            dst = os.path.splitext(dst)[0] + '.png'
        im.save(dst, **params)
    return dst

def load_overrides(csv_path):
    if not csv_path or not os.path.exists(csv_path): return {}
    mapr = {}
    with open(csv_path, 'r', encoding='utf-8') as fh:
        r = csv.DictReader(fh)
        for row in r:
            fp = row.get('filepath')
            if not fp: continue
            cap = (row.get('caption') or row.get('caption_suggested') or '').strip()
            tags = (row.get('tags') or row.get('tags_suggested') or '').split()
            mapr[os.path.normpath(fp)] = {'caption': cap, 'tags': [t for t in tags if t]}
    return mapr

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', required=True)
    ap.add_argument('--dst', default='.')
    ap.add_argument('--page-size', type=int, default=100)
    ap.add_argument('--max-thumb', type=int, default=900)
    ap.add_argument('--max-full', type=int, default=2000)
    ap.add_argument('--format', default='webp', choices=['webp','jpg','png'])
    ap.add_argument('--quality', type=int, default=82)
    ap.add_argument('--tags-csv', default=None)
    ap.add_argument('--tag-from-folder', default='yes', choices=['yes','no'])
    args = ap.parse_args()

    src = pathlib.Path(args.src)
    dst = pathlib.Path(args.dst)
    thumbs_dir = dst / 'gallery' / 'thumbs'
    full_dir = dst / 'gallery' / 'full'
    manifests_dir = dst / 'manifests'
    for d in (thumbs_dir, full_dir, manifests_dir):
        d.mkdir(parents=True, exist_ok=True)

    overrides = load_overrides(args.tags_csv)

    exts = {'.jpg','.jpeg','.png','.webp','.heic','.heif','.tif','.tiff'}
    files = [p for p in src.rglob('*') if p.suffix.lower() in exts]
    files.sort(key=lambda p: str(p).lower())

    items = []
    for f in files:
        caption = f.stem
        tags = []
        if args.tag_from_folder == 'yes':
            parts = f.relative_to(src).parts[:-1]
            tags.extend([p for p in parts])

        try:
            with Image.open(f) as im:
                ex = exif_dict(im)
                desc = ex.get('ImageDescription') or ex.get('XPTitle')
                if isinstance(desc, bytes):
                    try:
                        desc = desc.decode('utf-16') if desc.startswith(b'\\xff\\xfe') else desc.decode('utf-8','ignore')
                    except Exception: pass
                if isinstance(desc,str) and desc.strip():
                    caption = desc.strip()
        except Exception:
            pass

        ov = overrides.get(os.path.normpath(str(f)))
        if ov:
            if ov.get('caption'): caption = ov['caption']
            if 'tags' in ov and ov['tags']: tags = ov['tags']

        stem = hashlib.sha1(str(f).encode('utf-8')).hexdigest()[:12]
        thumb_out = thumbs_dir / stem
        full_out  = full_dir / stem
        thumb_rel = pathlib.Path(resize_save(f, thumb_out, args.max_thumb, args.format, args.quality)).relative_to(dst)
        full_rel  = pathlib.Path(resize_save(f, full_out,  args.max_full, args.format, args.quality)).relative_to(dst)
        items.append({"thumb": str(thumb_rel).replace('\\','/'),
                      "full":  str(full_rel).replace('\\','/'),
                      "caption": caption,
                      "tags": tags})

    n = len(items); ps = max(1, args.page_size)
    pages = (n + ps - 1) // ps
    for p in range(pages):
        chunk = items[p*ps:(p+1)*ps]
        out = manifests_dir / f"page_{p:03d}.json"
        with open(out, 'w', encoding='utf-8') as fh:
            json.dump(chunk, fh, ensure_ascii=False, separators=(',',':'))
    print(f"[ok] built {n} items → {pages} pages at {manifests_dir}")

if __name__ == '__main__':
    main()
