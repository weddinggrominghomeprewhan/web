#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Re-generate gallery manifests from EXISTING images in gallery/full and gallery/thumbs
# Usage: python build_gallery.py --dst .

import argparse, os, json, pathlib, math
from PIL import Image, ExifTags

def natural_sort_key(s):
    import re
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', s)]

def get_caption_date(img_path):
    # พยายามอ่าน Caption จาก EXIF หรือใช้วันที่แก้ไขไฟล์
    try:
        with Image.open(img_path) as im:
            raw = im.getexif() or {}
            # ลองหาคำอธิบายภาพ
            desc = raw.get(0x010e) or raw.get(0x9c9b) # ImageDescription or XPTitle
            # ลองหาวันที่ถ่าย
            dt = raw.get(0x9003) or raw.get(0x0132) # DateTimeOriginal or DateTime
            
            caption = img_path.stem # ใช้ชื่อไฟล์เป็นค่าเริ่มต้น
            
            if desc and isinstance(desc, str):
                caption = desc.strip()
            elif dt and isinstance(dt, str) and len(dt) >= 10:
                # ถ้าไม่มีคำอธิบาย ใช้ชื่อไฟล์ + วันที่
                date_str = dt[:10].replace(':', '-')
                caption = f"{img_path.stem} · {date_str}"
            
            return caption
    except Exception:
        return img_path.stem

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dst', default='.', help='โฟลเดอร์โปรเจกต์ (ที่มีโฟลเดอร์ gallery อยู่ข้างใน)')
    ap.add_argument('--page-size', type=int, default=100, help='จำนวนรูปต่อ 1 หน้า')
    args = ap.parse_args()

    dst = pathlib.Path(args.dst)
    full_dir = dst / 'gallery' / 'full'
    thumbs_dir = dst / 'gallery' / 'thumbs'
    manifests_dir = dst / 'manifests'

    # ตรวจสอบว่ามีโฟลเดอร์รูปอยู่จริงไหม
    if not full_dir.exists():
        print(f"Error: ไม่พบโฟลเดอร์ {full_dir}")
        return

    manifests_dir.mkdir(parents=True, exist_ok=True)

    # 1. สแกนไฟล์รูปทั้งหมดใน full
    exts = {'.jpg', '.jpeg', '.png', '.webp', '.avif'}
    files = [p for p in full_dir.glob('*') if p.suffix.lower() in exts]
    
    # เรียงลำดับชื่อไฟล์แบบธรรมชาติ (1, 2, 10 แทนที่จะเป็น 1, 10, 2)
    files.sort(key=lambda p: natural_sort_key(p.name))

    print(f"Found {len(files)} images in {full_dir}...")

    items = []
    for f in files:
        # หาคู่ไฟล์ thumb (ชื่อเดียวกัน)
        thumb_path = thumbs_dir / f.name
        
        # ถ้าไม่มี thumb ให้ใช้ full แทน (กรณีฉุกเฉิน)
        if not thumb_path.exists():
            thumb_path = f
        
        # สร้าง Path สำหรับ Web (relative path และเปลี่ยน \ เป็น /)
        web_full = str(f.relative_to(dst)).replace('\\', '/')
        web_thumb = str(thumb_path.relative_to(dst)).replace('\\', '/')
        
        # อ่าน Caption (ถ้าต้องการความเร็ว ปิดบรรทัดนี้แล้วใช้ f.stem แทนได้เลย)
        caption = get_caption_date(f) 
        
        # เดา Tags จากชื่อไฟล์ (ถ้าชื่อไฟล์เป็น 1.ceremony (1).webp)
        tags = []
        if '.' in f.stem:
            possible_tag = f.stem.split('.')[0] # เอาคำหน้าจุดมาเป็น Tag
            if possible_tag.isdigit() == False: # ถ้าไม่ใช่ตัวเลขล้วน
                tags.append(possible_tag)

        items.append({
            "thumb": web_thumb,
            "full":  web_full,
            "caption": caption,
            "tags": tags
        })

    # 2. แบ่งหน้า (Pagination) และบันทึก JSON
    n = len(items)
    page_size = max(1, args.page_size)
    pages = math.ceil(n / page_size)

    # ลบไฟล์ json เก่าก่อน เพื่อกันความสับสน
    for old_json in manifests_dir.glob("page_*.json"):
        old_json.unlink()

    for p in range(pages):
        chunk = items[p*page_size : (p+1)*page_size]
        out_name = manifests_dir / f"page_{p:03d}.json"
        
        with open(out_name, 'w', encoding='utf-8') as fh:
            json.dump(chunk, fh, ensure_ascii=False, separators=(',', ':'))
        
        print(f"Saved {out_name} ({len(chunk)} items)")

    print(f"\n✅ เสร็จสิ้น! รวมรูปทั้งหมด {n} รูป แบ่งเป็น {pages} หน้า")
    print(f"   เปิดไฟล์ gallery.html เพื่อดูผลลัพธ์ได้เลย")

if __name__ == '__main__':
    main()