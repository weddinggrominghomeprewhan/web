# Smart Tagger Add-on
1) แนะนำแท็ก/แคปชันอัตโนมัติ:
```bash
pip install Pillow pillow-heif
python smart_tagger.py --src "D:\Program Files\weddinggrominghomeprewhan\WEDDING" --out suggested_tags.csv --keywords sample_keywords.json --use-folder yes
```
2) ตรวจ/แก้ `suggested_tags.csv` (แก้ข้อความในคอลัมน์ caption_suggested/tags_suggested ได้)
3) สร้างแกลเลอรี่โดย override จาก CSV:
```bash
python build_gallery_plus.py --src "D:\Program Files\weddinggrominghomeprewhan\WEDDING" --dst . --page-size 100 --max-thumb 900 --max-full 2000 --format webp --quality 82 --tags-csv suggested_tags.csv --tag-from-folder yes
```
ปรับคีย์เวิร์ดใน `sample_keywords.json` ให้เข้ากับงานจริงได้ (ไทย/อังกฤษ)
