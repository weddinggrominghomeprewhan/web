# Wedding Gallery Add-on (for GitHub Pages)

ไฟล์นี้เสริมเว็บเดิมของคุณให้รองรับรูป **หลักพัน** ด้วย Infinite Scroll + Lightbox โดยใช้ไฟล์แมนิเฟสต์แบบแบ่งหน้า

## โครงสร้างโฟลเดอร์
- `gallery.html` — หน้าแกลเลอรี่
- `assets/gallery.js` — โหลด/แสดงรูปจากแมนิเฟสต์
- `manifests/page_000.json` … — รายการรูปเป็นหน้า ๆ (สร้างอัตโนมัติ)
- `gallery/thumbs/*.webp` — รูปย่อ (แนะนำ 900px กว้างสุด)
- `gallery/full/*.webp` — รูปสำหรับ Lightbox (แนะนำ 2000px กว้างสุด)

## วิธีสร้างไฟล์รูป + แมนิเฟสต์
ต้องมี Python 3 และ Pillow
```bash
pip install Pillow pillow-heif
python build_gallery.py --src /path/to/raw --dst . --page-size 100 --max-thumb 900 --max-full 2000 --format webp --quality 82 --tag-from-folder yes
```
> จะได้ `gallery/thumbs/`, `gallery/full/`, `manifests/page_*.json`

## ใช้งาน
1. อัปโหลดไฟล์ชุดนี้ไว้ในรีโปเดียวกับ `index.html`
2. คอมมิต `gallery/`, `manifests/`, `assets/`, `gallery.html` ทั้งหมด
3. เพิ่มลิงก์จากหน้าแรกไปยัง `gallery.html`

## หมายเหตุ
- ถ้าขนาดรวมใหญ่เกินไป ให้พิจารณาใช้ CDN/Storage ภายนอก แล้วใส่ URL ไว้ในแมนิเฟสต์แทน
- รองรับ HEIC/HEIF ถ้าติดตั้ง `pillow-heif` แล้ว
